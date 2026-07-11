from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import time

from src.routes.documents import faiss_optimizer_instance
from src.query_optimizer import QueryOptimizer
from src.prompts import SYSTEM_PROMPT_V2, get_optimized_prompt
from src.llm import LLMClient

router = APIRouter(prefix="/api", tags=["query"])

# Initialize optimizers
query_optimizer = QueryOptimizer()
llm = LLMClient()

class QueryRequest(BaseModel):
    question: str
    top_k: int = 5
    use_multi_query: bool = True  # Use variants for better retrieval
    return_confidence: bool = True  # Return confidence scores

class Citation(BaseModel):
    doc_id: str
    doc_name: str
    page: int
    paragraph: int
    snippet: str
    similarity_score: float

class QueryResponse(BaseModel):
    question: str
    answer: str
    citations: List[Citation]
    found_evidence: bool
    confidence_score: Optional[float]
    retrieval_time_ms: float
    generation_time_ms: float
    metadata: dict  # For debugging/monitoring

@router.post("/query", response_model=QueryResponse)
async def query_documents(request: QueryRequest):
    """
    Optimized query endpoint with:
    - Multi-query retrieval
    - Confidence scoring
    - Performance metrics
    """
    try:
        # Preprocess query
        processed_query = query_optimizer.preprocess_query(request.question)
        
        # Step 1: Retrieve documents (optimized)
        retrieval_start = time.time()
        
        # Rebuild/check if index exists
        if faiss_optimizer_instance.index is None:
            # Try to build it if we have chunks in database
            from src.routes.documents import rebuild_faiss_index
            rebuild_faiss_index()
            
        if faiss_optimizer_instance.index is None:
            return QueryResponse(
                question=request.question,
                answer="No documents are uploaded yet. Please upload PDF files to start.",
                citations=[],
                found_evidence=False,
                confidence_score=0.0,
                retrieval_time_ms=0.0,
                generation_time_ms=0.0,
                metadata={"no_evidence": True, "reason": "empty_database"}
            )
        
        if request.use_multi_query:
            # Multi-query retrieval for better coverage
            chunks = query_optimizer.multi_query_search(
                processed_query,
                search_func=faiss_optimizer_instance.search_optimized,
                top_k=request.top_k
            )
        else:
            # Single query
            question_embedding = query_optimizer.model.encode(processed_query)
            chunks, _ = faiss_optimizer_instance.search_optimized(
                question_embedding,
                top_k=request.top_k
            )
        
        retrieval_time_ms = (time.time() - retrieval_start) * 1000
        
        # Step 2: Check if evidence found
        # FAISS returns similarity. Threshold of 0.1 indicates basic connection.
        if not chunks or all(c['similarity_score'] < 0.1 for c in chunks):
            return QueryResponse(
                question=request.question,
                answer="I could not find supporting evidence in the uploaded documents.",
                citations=[],
                found_evidence=False,
                confidence_score=0.0,
                retrieval_time_ms=retrieval_time_ms,
                generation_time_ms=0.0,
                metadata={"no_evidence": True}
            )
        
        # Step 3: Generate answer using LLM
        generation_start = time.time()
        
        context = [chunk['text'] for chunk in chunks[:request.top_k]]
        prompt = get_optimized_prompt(request.question, context)
        
        answer = await llm.generate(
            prompt=prompt,
            max_tokens=300,
            temperature=0.3  # Low temperature for accuracy
        )
        
        generation_time_ms = (time.time() - generation_start) * 1000
        
        # Step 4: Format citations
        citations = [
            Citation(
                doc_id=chunk['doc_id'],
                doc_name=chunk['doc_name'],
                page=chunk['page'],
                paragraph=chunk.get('paragraph', 1),
                snippet=chunk['text'][:150] + ("..." if len(chunk['text']) > 150 else ""),
                similarity_score=chunk['similarity_score']
            )
            for chunk in chunks[:request.top_k]
        ]
        
        # Step 5: Calculate confidence (optional)
        confidence = None
        if request.return_confidence and citations:
            avg_similarity = sum(c.similarity_score for c in citations) / len(citations)
            # Confidence: 0.3-0.7 similarity = medium, >0.7 = high
            confidence = min(1.0, avg_similarity * 1.5)
        
        return QueryResponse(
            question=request.question,
            answer=answer.strip(),
            citations=citations,
            found_evidence=True,
            confidence_score=confidence,
            retrieval_time_ms=round(retrieval_time_ms, 2),
            generation_time_ms=round(generation_time_ms, 2),
            metadata={
                "chunks_used": len(chunks),
                "multi_query_used": request.use_multi_query,
                "avg_similarity": round(sum(c['similarity_score'] for c in chunks) / len(chunks), 3) if chunks else 0.0
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
