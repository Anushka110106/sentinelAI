from api.models.claim_extractor import extract_claims
from api.models.contradiction_detector import find_contradictions
from api.models.gap_detector import extract_limitations, cluster_and_rank_gaps
from api.models.graph_builder import extract_entities_and_relationships, merge_graphs
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging
import uuid
import os
import time
import requests

from api.models.pdf_processor import extract_text_with_metadata
from api.models.embedding import EmbeddingModel
from api.models.faiss_index import FAISSIndex
from api.models.llm import LLMClient
from api.models.indexer import rebuild_index, INDEX_PATH
from api.database import SentinelDB, init_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SentinelAI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Loaded once at startup, reused across requests
embedder = None
llm = LLMClient()

@app.on_event("startup")
async def startup():
    global embedder
    init_db()
    embedder = EmbeddingModel()
    logger.info("Database initialized, embedding model loaded")

def run_full_analysis():
    """Recompute contradictions, gaps, and graph data, and cache them in the database.
    Called after documents change (upload/delete) instead of on every GET request."""
    docs = SentinelDB.get_all_documents()
    all_chunks = SentinelDB.get_all_chunks()

    all_claims = []
    all_gap_items = []
    graphs = []

    for doc in docs:
        doc_chunks = [c for c in all_chunks if c['doc_id'] == doc['id']]
        if not doc_chunks:
            continue

        claims = extract_claims(doc_chunks, doc['id'])
        all_claims.extend(claims)

        gap_items = extract_limitations(doc_chunks, doc['id'], doc['filename'])
        all_gap_items.extend(gap_items)

        graph = extract_entities_and_relationships(doc_chunks, doc['id'], doc['filename'])
        graphs.append(graph)

    if all_claims:
        SentinelDB.add_claims(all_claims)

    contradictions = find_contradictions(all_claims) if all_claims else []
    SentinelDB.save_contradictions(contradictions)

    gaps = cluster_and_rank_gaps(all_gap_items, min_doc_mentions=2) if all_gap_items else []
    SentinelDB.save_gaps(gaps)

    merged_graph = merge_graphs(graphs) if graphs else {'nodes': [], 'links': []}
    SentinelDB.save_graph(merged_graph)

    logger.info(f"Analysis complete: {len(contradictions)} contradictions, {len(gaps)} gaps, {len(merged_graph['nodes'])} graph nodes")

@app.get("/health")
async def health():
    ollama_ok = False
    try:
        r = requests.get("http://localhost:11434", timeout=2)
        ollama_ok = r.status_code == 200
    except Exception:
        ollama_ok = False

    index_exists = os.path.exists(INDEX_PATH)

    return {
        "status": "ok",
        "ollama_connected": ollama_ok,
        "faiss_index_exists": index_exists,
        "embedder_loaded": embedder is not None
    }

@app.post("/api/upload")
async def upload(files: list[UploadFile] = File(...)):
    if not files or all(f.filename == '' for f in files):
        raise HTTPException(status_code=400, detail="No files provided")

    uploaded_docs = []
    errors = []

    for file in files:
        try:
            if not file.filename:
                errors.append({'filename': 'unknown', 'error': 'Empty filename'})
                continue

            if not file.filename.lower().endswith('.pdf'):
                errors.append({'filename': file.filename, 'error': 'Only PDF files are supported'})
                continue

            content = await file.read()
            if len(content) == 0:
                errors.append({'filename': file.filename, 'error': 'File is empty'})
                continue

            filepath = os.path.join(UPLOAD_DIR, file.filename)
            with open(filepath, 'wb') as f:
                f.write(content)

            try:
                chunks = extract_text_with_metadata(filepath)
            except Exception as e:
                logger.error(f"PDF extraction failed for {file.filename}: {e}")
                os.remove(filepath)
                errors.append({'filename': file.filename, 'error': f'Could not read PDF - it may be corrupted or password-protected: {str(e)}'})
                continue

            if not chunks:
                os.remove(filepath)
                errors.append({'filename': file.filename, 'error': 'No extractable text found in PDF (it may be a scanned/image-based PDF)'})
                continue

            doc_id = str(uuid.uuid4())
            total_pages = chunks[-1]['page_num'] if chunks else 0

            SentinelDB.add_document(
                doc_id=doc_id,
                filename=file.filename,
                total_pages=total_pages,
                filepath=filepath,
                status="processed"
            )

            chunks_data = [
                {
                    'doc_id': doc_id,
                    'doc_name': file.filename,
                    'page': c['page_num'],
                    'paragraph': c['para_num'],
                    'text': c['text']
                }
                for c in chunks
            ]
            SentinelDB.add_chunks(chunks_data)

            uploaded_docs.append({
                'id': doc_id,
                'filename': file.filename,
                'pages': total_pages
            })

        except Exception as e:
            logger.error(f"Unexpected error processing {file.filename}: {e}")
            errors.append({'filename': file.filename, 'error': f'Unexpected error: {str(e)}'})

    if uploaded_docs:
        try:
            rebuild_index()
            global faiss_index_cache
            faiss_index_cache = FAISSIndex()
            faiss_index_cache.load(INDEX_PATH)
            run_full_analysis()
        except Exception as e:
            logger.error(f"Post-upload processing failed: {e}")
            errors.append({'filename': 'system', 'error': f'Documents saved but indexing failed: {str(e)}'})

    status_code = 200
    if uploaded_docs and errors:
        status = 'partial'
    elif uploaded_docs:
        status = 'ok'
    else:
        status = 'failed'
        status_code = 400

    return JSONResponse(
        status_code=status_code,
        content={
            'status': status,
            'documents': uploaded_docs,
            'errors': errors
        }
    )

@app.get("/api/documents")
async def get_documents():
    docs = SentinelDB.get_all_documents()
    return {'documents': docs}

@app.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: str):
    docs = SentinelDB.get_all_documents()
    if not any(d['id'] == doc_id for d in docs):
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        SentinelDB.delete_document(doc_id)
        rebuild_index()
        global faiss_index_cache
        faiss_index_cache = FAISSIndex()
        if os.path.exists(INDEX_PATH):
            faiss_index_cache.load(INDEX_PATH)
        run_full_analysis()
    except Exception as e:
        logger.error(f"Delete failed for {doc_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")

    return {'status': 'ok'}

@app.post("/api/query")
async def query(payload: dict):
    question = payload.get("question", "")
    top_k = payload.get("top_k", 5)

    if not isinstance(question, str) or not question.strip():
        raise HTTPException(status_code=400, detail="question must be a non-empty string")

    if len(question) > 2000:
        raise HTTPException(status_code=400, detail="question is too long (max 2000 characters)")

    if not isinstance(top_k, int) or top_k < 1 or top_k > 20:
        top_k = 5  # silently fall back to a safe default rather than erroring
    if not os.path.exists(INDEX_PATH):
        return {
            'answer': "No supporting evidence was found within the uploaded documents.",
            'citations': [],
            'retrieval_time_ms': 0,
            'llm_time_ms': 0
        }

    timings = {}

    # Step 1: Load FAISS index
    t0 = time.time()
    index = FAISSIndex()
    index.load(INDEX_PATH)
    timings['faiss_load_ms'] = (time.time() - t0) * 1000

    # Step 2: Embed the query
    t0 = time.time()
    query_embedding = embedder.embed([question])[0]
    timings['query_embed_ms'] = (time.time() - t0) * 1000

    # Step 3: FAISS search
    t0 = time.time()
    chunk_ids = index.search(query_embedding, top_k=top_k)
    timings['faiss_search_ms'] = (time.time() - t0) * 1000

    # Step 4: Fetch chunks from database
    t0 = time.time()
    all_chunks = SentinelDB.get_all_chunks()
    chunks_by_id = {c['chunk_id']: c for c in all_chunks}
    retrieved_chunks = [chunks_by_id[cid] for cid in chunk_ids if cid in chunks_by_id]
    timings['db_fetch_ms'] = (time.time() - t0) * 1000

    retrieval_time = sum(timings.values()) / 1000

    logger.info(f"Timing breakdown: {timings}")

    if not retrieved_chunks:
        return {
            'answer': "No supporting evidence was found within the uploaded documents.",
            'citations': [],
            'retrieval_time_ms': retrieval_time * 1000,
            'llm_time_ms': 0,
            'timings': timings
        }

    # Step 5: Build prompt
    t0 = time.time()
    evidence_text = "\n\n".join([
        f"[Source: {c['doc_name']}, Page {c['page']}]\n{c['text']}"
        for c in retrieved_chunks
    ])

    prompt = f"""Answer the question using the evidence below. The evidence comes from a document the user uploaded, so trust it as your source of truth.

Evidence:
{evidence_text}

Question: {question}

Instructions:
- If the evidence contains information that answers the question, answer clearly and directly using that information.
- Only say "No supporting evidence was found within the uploaded documents." if the evidence truly does not address the question at all (for example, if the question is about something unrelated to the evidence, like general trivia).
- Do not add outside knowledge beyond what is written in the evidence.

Answer:"""
    timings['prompt_build_ms'] = (time.time() - t0) * 1000

    # Step 6: LLM generation
    llm_start = time.time()
    answer = llm.generate(prompt)
    llm_time = time.time() - llm_start
    timings['llm_generate_ms'] = llm_time * 1000

    # Step 7: Build citations response
    t0 = time.time()
    citations = [
        {
            'doc_id': c['doc_id'],
            'doc_name': c['doc_name'],
            'page': c['page'],
            'paragraph': c['paragraph'],
            'text_snippet': c['text'][:200]
        }
        for c in retrieved_chunks
    ]
    timings['response_build_ms'] = (time.time() - t0) * 1000

    logger.info(f"Full timing breakdown: {timings}")

    return {
        'answer': answer,
        'citations': citations,
        'retrieval_time_ms': retrieval_time * 1000,
        'llm_time_ms': llm_time * 1000,
        'timings': timings
    }

@app.get("/api/contradictions")
async def get_contradictions():
    return {'contradictions': SentinelDB.get_contradictions()}


@app.get("/api/gaps")
async def get_gaps():
    return {'gaps': SentinelDB.get_gaps()}


@app.get("/api/graph-data")
async def get_graph_data():
    return SentinelDB.get_graph_data()
