from fastapi import APIRouter, HTTPException
from src.gap_detector import GapDetector
from src.database import SentinelDB

router = APIRouter(prefix="/api", tags=["analysis"])

@router.get("/gaps")
async def get_gaps():
    """
    Find research gaps across uploaded documents
    """
    try:
        # Get all chunks
        chunks = SentinelDB.get_all_chunks()
        
        detector = GapDetector()
        gaps = detector.find_gaps(chunks)
        
        # Save gaps to database (if chunks were present, otherwise we returned mock fallbacks)
        if chunks:
            SentinelDB.save_gaps(gaps)
            
        return gaps
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
