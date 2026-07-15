from api.models.claim_extractor import extract_claims
from api.models.contradiction_detector import find_contradictions
from api.models.gap_detector import extract_limitations, cluster_and_rank_gaps
from api.models.graph_builder import extract_entities_and_relationships, merge_graphs
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
import uuid
import os
import time

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
    return {"status": "ok"}

@app.post("/api/upload")
async def upload(files: list[UploadFile] = File(...)):
    uploaded_docs = []
    errors = []

    for file in files:
        try:
            filepath = os.path.join(UPLOAD_DIR, file.filename)
            with open(filepath, 'wb') as f:
                f.write(await file.read())

            chunks = extract_text_with_metadata(filepath)

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
            logger.error(f"Error processing {file.filename}: {e}")
            errors.append({'filename': file.filename, 'error': str(e)})

    # Rebuild the search index so newly uploaded docs are searchable
    rebuild_index()

    return {
        'status': 'ok' if not errors else 'partial',
        'documents': uploaded_docs,
        'errors': errors
    }

@app.get("/api/documents")
async def get_documents():
    docs = SentinelDB.get_all_documents()
    return {'documents': docs}

@app.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: str):
    SentinelDB.delete_document(doc_id)
    rebuild_index()
    run_full_analysis()
    return {'status': 'ok'}

@app.post("/api/query")
async def query(payload: dict):
    question = payload.get("question", "")
    top_k = payload.get("top_k", 10)

    if not question:
        raise HTTPException(status_code=400, detail="question is required")

    if not os.path.exists(INDEX_PATH):
        return {
            'answer': "No supporting evidence was found within the uploaded documents.",
            'citations': [],
            'retrieval_time_ms': 0,
            'llm_time_ms': 0
        }

    # Retrieval
    retrieval_start = time.time()
    index = FAISSIndex()
    index.load(INDEX_PATH)

    query_embedding = embedder.embed([question])[0]
    chunk_ids = index.search(query_embedding, top_k=top_k)

    all_chunks = SentinelDB.get_all_chunks()
    chunks_by_id = {c['chunk_id']: c for c in all_chunks}
    retrieved_chunks = [chunks_by_id[cid] for cid in chunk_ids if cid in chunks_by_id]
    retrieval_time = time.time() - retrieval_start
    logger.info(f"Retrieved {len(retrieved_chunks)} chunks in {retrieval_time*1000:.0f}ms")
    if not retrieved_chunks:
        return {
            'answer': "No supporting evidence was found within the uploaded documents.",
            'citations': [],
            'retrieval_time_ms': retrieval_time * 1000,
            'llm_time_ms': 0
        }

    # Build prompt using ONLY retrieved evidence
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
    
# LLM generation
    llm_start = time.time()
    answer = llm.generate(prompt)
    llm_time = time.time() - llm_start
    logger.info(f"LLM generated response in {llm_time*1000:.0f}ms")
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

    return {
        'answer': answer,
        'citations': citations,
        'retrieval_time_ms': retrieval_time * 1000,
        'llm_time_ms': llm_time * 1000
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
