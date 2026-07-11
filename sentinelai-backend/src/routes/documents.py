import os
import uuid
import shutil
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import fitz  # PyMuPDF
import numpy as np

from src.database import SentinelDB
from src.faiss_optimizer import FAISSOptimizer

router = APIRouter(prefix="/api", tags=["documents"])

# Global FAISS index instance
faiss_optimizer_instance = FAISSOptimizer()

# Uploads directory
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

class DocumentInfo(BaseModel):
    id: str
    filename: str
    total_pages: int
    status: str

class DocumentListResponse(BaseModel):
    documents: List[DocumentInfo]

def rebuild_faiss_index():
    """Rebuild the FAISS index from all chunks in the database."""
    global faiss_optimizer_instance
    from sentence_transformers import SentenceTransformer
    
    # Get all chunks
    all_chunks = SentinelDB.get_all_chunks()
    if not all_chunks:
        faiss_optimizer_instance.index = None
        faiss_optimizer_instance.id_mapping = {}
        return
        
    model = SentenceTransformer('all-MiniLM-L6-v2')
    texts = [c['text'] for c in all_chunks]
    
    # Generate embeddings
    embeddings = model.encode(texts, show_progress_bar=False)
    
    # Recreate index
    faiss_optimizer_instance.create_optimized_index(embeddings, all_chunks)

@router.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    """Upload research PDFs, parse text, chunk, and index them."""
    errors = []
    processed_files = []
    
    for file in files:
        if not file.filename.endswith('.pdf'):
            errors.append({"filename": file.filename, "error": "Only PDF files are supported"})
            continue
            
        doc_id = str(uuid.uuid4())
        file_path = os.path.join(UPLOAD_DIR, f"{doc_id}_{file.filename}")
        
        try:
            # Save file locally
            with open(file_path, "wb") as f:
                shutil.copyfileobj(file.file, f)
                
            # Parse PDF
            doc = fitz.open(file_path)
            total_pages = len(doc)
            
            # Save doc metadata in db
            SentinelDB.add_document(doc_id, file.filename, total_pages, file_path, "uploaded")
            
            # Chunking text
            chunks = []
            for page_num in range(total_pages):
                page = doc[page_num]
                text = page.get_text().strip()
                if not text:
                    continue
                    
                # Split text into paragraphs
                paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
                for p_idx, para_text in enumerate(paragraphs):
                    # If paragraph is too small, skip
                    if len(para_text) < 30:
                        continue
                        
                    # Split huge paragraphs into 600-character chunks
                    chunk_limit = 600
                    if len(para_text) > chunk_limit:
                        # Simple word-based split
                        words = para_text.split()
                        current_chunk = []
                        current_len = 0
                        for word in words:
                            current_chunk.append(word)
                            current_len += len(word) + 1
                            if current_len >= chunk_limit:
                                chunk_txt = " ".join(current_chunk)
                                chunks.append({
                                    'doc_id': doc_id,
                                    'doc_name': file.filename,
                                    'page': page_num + 1,
                                    'paragraph': p_idx + 1,
                                    'text': chunk_txt
                                })
                                current_chunk = []
                                current_len = 0
                        if current_chunk:
                            chunks.append({
                                'doc_id': doc_id,
                                'doc_name': file.filename,
                                'page': page_num + 1,
                                'paragraph': p_idx + 1,
                                'text': " ".join(current_chunk)
                            })
                    else:
                        chunks.append({
                            'doc_id': doc_id,
                            'doc_name': file.filename,
                            'page': page_num + 1,
                            'paragraph': p_idx + 1,
                            'text': para_text
                        })
            
            if chunks:
                SentinelDB.add_chunks(chunks)
                
            # Mark status as indexed
            SentinelDB.update_document_status(doc_id, "indexed")
            processed_files.append(file.filename)
            
        except Exception as e:
            if os.path.exists(file_path):
                os.remove(file_path)
            SentinelDB.delete_document(doc_id)
            errors.append({"filename": file.filename, "error": str(e)})
            
    # If any file was successfully processed, rebuild the FAISS index
    if processed_files:
        try:
            rebuild_faiss_index()
        except Exception as e:
            errors.append({"filename": "System FAISS Indexing", "error": f"Failed to build index: {str(e)}"})
            
    return {
        "message": f"Successfully processed {len(processed_files)} files",
        "processed": processed_files,
        "errors": errors
    }

@router.get("/documents", response_model=DocumentListResponse)
async def list_documents():
    """Retrieve all indexed documents."""
    docs = SentinelDB.get_all_documents()
    documents = [
        DocumentInfo(
            id=d['id'],
            filename=d['filename'],
            total_pages=d['total_pages'],
            status=d['status']
        )
        for d in docs
    ]
    return DocumentListResponse(documents=documents)

@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document, its chunks, and rebuild the FAISS index."""
    # Find document
    docs = SentinelDB.get_all_documents()
    doc_match = [d for d in docs if d['id'] == doc_id]
    
    if not doc_match:
        raise HTTPException(status_code=404, detail="Document not found")
        
    doc = doc_match[0]
    file_path = doc.get('filepath')
    
    try:
        # Delete file if exists
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
            
        # Delete database entries
        SentinelDB.delete_document(doc_id)
        
        # Rebuild FAISS index
        rebuild_faiss_index()
        
        return {"message": f"Successfully deleted {doc['filename']}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
