from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import logging
import uuid
import os

from api.models.pdf_processor import extract_text_with_metadata
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

@app.on_event("startup")
async def startup():
    init_db()
    logger.info("Database initialized")

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

    return {
        'status': 'ok' if not errors else 'partial',
        'documents': uploaded_docs,
        'errors': errors
    }

@app.get("/api/documents")
async def get_documents():
    docs = SentinelDB.get_all_documents()
    return {'documents': docs}
