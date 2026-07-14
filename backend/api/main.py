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
    return {'status': 'ok'}

@app.post("/api/query")
async def query(payload: dict):
    question = payload.get("question", "")
    top_k = payload.get("top_k", 7)

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
    prompt = f"""You are a strict evidence-based assistant. You must NEVER use knowledge outside the evidence below, even if you know the answer from general knowledge. This is critical.

Evidence:
{evidence_text}

Question: {question}

Instructions: Check if the evidence above actually contains information that answers the question. If it does not, you MUST respond with exactly this sentence and nothing else: "No supporting evidence was found within the uploaded documents."

Do not answer from general knowledge under any circumstances, even for simple factual questions.

Answer:"""

    # LLM generation
    llm_start = time.time()
    answer = llm.generate(prompt)
    llm_time = time.time() - llm_start

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
