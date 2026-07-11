import time
import numpy as np
from src.faiss_optimizer import FAISSOptimizer
from src.query_optimizer import QueryOptimizer

def test_query_latency():
    """Test that queries complete within target latency"""
    
    optimizer = FAISSOptimizer()
    query_opt = QueryOptimizer()
    
    # Create dummy embeddings (dim=384 for all-MiniLM-L6-v2)
    embeddings = np.random.rand(1000, 384).astype('float32')
    chunks = [{'doc_id': f'doc{i}', 'doc_name': f'doc{i}.pdf', 
               'page': i % 50, 'paragraph': i % 10, 'text': f'chunk{i}'} 
              for i in range(1000)]
    
    optimizer.create_optimized_index(embeddings, chunks)
    
    # Test query time
    query = "What is adaptive beamforming?"
    query_embedding = query_opt.model.encode(query).astype('float32')
    
    start = time.time()
    results, search_time = optimizer.search_optimized(query_embedding, top_k=5)
    total_time = (time.time() - start) * 1000
    
    print(f"\nFAISS Search latency: {search_time:.2f}ms")
    print(f"Total latency (including python overhead): {total_time:.2f}ms")
    
    assert search_time < 500, f"FAISS Search too slow: {search_time:.2f}ms"
    assert total_time < 800, f"Total latency too high: {total_time:.2f}ms"

def test_multi_query_retrieval():
    """Test that multi-query creates variants correctly"""
    query_opt = QueryOptimizer()
    query = "What is adaptive beamforming?"
    variants = query_opt.generate_query_variants(query)
    
    assert len(variants) > 1
    assert query in variants
    print(f"\nGenerated query variants: {variants}")
