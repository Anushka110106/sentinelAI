from fastapi import APIRouter, HTTPException
from typing import List
from sentence_transformers import SentenceTransformer
from src.contradiction_detector import ContradictionDetector
from src.claim_extractor import ClaimExtractor
from src.database import SentinelDB

router = APIRouter(prefix="/api", tags=["analysis"])

# Initialize detector and extractor
model = SentenceTransformer('all-MiniLM-L6-v2')
contradiction_detector = ContradictionDetector(embedding_model=model)
claim_extractor = ClaimExtractor()

@router.get("/contradictions")
async def get_contradictions():
    """
    Find contradictions across uploaded documents
    """
    try:
        # Get all chunks from database
        chunks = SentinelDB.get_all_chunks()
        
        if not chunks:
            return {
                "contradictions": [],
                "total_claims": 0,
                "contradictions_found": 0
            }
        
        # Extract claims
        claims = claim_extractor.extract_from_chunks(chunks)
        
        # Save extracted claims to DB
        SentinelDB.add_claims(claims)
        
        # Find contradictions
        contradictions = contradiction_detector.find_contradictions(claims)
        
        # Save contradictions to DB for history
        SentinelDB.save_contradictions(contradictions)
        
        # Sort by confidence
        contradictions.sort(key=lambda x: x['confidence'], reverse=True)
        
        return {
            "contradictions": contradictions,
            "total_claims": len(claims),
            "contradictions_found": len(contradictions)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
