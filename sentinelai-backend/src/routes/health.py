from fastapi import APIRouter
from src.database import SentinelDB

router = APIRouter(prefix="/api", tags=["health"])

@router.get("/health")
async def health_check():
    try:
        docs = SentinelDB.get_all_documents()
        chunks = SentinelDB.get_all_chunks()
        
        # Count documents with status = "indexed"
        indexed_docs = len([d for d in docs if d.get('status') == 'indexed'])
        
        return {
            "status": "healthy",
            "documents_indexed": indexed_docs,
            "total_chunks": len(chunks)
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "documents_indexed": 0,
            "total_chunks": 0
        }
