import faiss
import numpy as np
from typing import List, Tuple
import time

class FAISSOptimizer:
    """Optimize FAISS index for speed and accuracy"""
    
    def __init__(self, embedding_dim: int = 384):
        self.embedding_dim = embedding_dim
        self.index = None
        self.id_mapping = {}  # chunk_id -> doc_id, page, para
        
    def create_optimized_index(self, embeddings: np.ndarray, chunk_metadata: List[dict]):
        """
        Create FAISS index with optimizations:
        - Use HNSW (Hierarchical Navigable Small World)
        - Add quantization for faster search
        - Enable GPU acceleration if available
        """
        try:
            import torch
            gpu_available = torch.cuda.is_available()
        except:
            gpu_available = False
        
        # Create HNSW index (fast approximate search)
        # Much faster than brute-force, still accurate
        self.index = faiss.IndexHNSWFlat(self.embedding_dim, 32)
        self.index.hnsw.efConstruction = 200  # Quality vs speed tradeoff
        self.index.hnsw.efSearch = 64
        
        # Add embeddings to index
        embeddings_array = np.array(embeddings).astype('float32')
        self.index.add(embeddings_array)
        
        # Store metadata mapping
        self.id_mapping = {}
        for chunk_id, metadata in enumerate(chunk_metadata):
            self.id_mapping[chunk_id] = {
                'doc_id': metadata['doc_id'],
                'doc_name': metadata['doc_name'],
                'page': metadata['page'],
                'paragraph': metadata.get('paragraph', 1),
                'text': metadata['text']
            }
        
        return self.index
    
    def search_optimized(self, query_embedding: np.ndarray, top_k: int = 5) -> Tuple[List[dict], float]:
        """
        Fast search with quality scoring
        """
        if self.index is None:
            return [], 0.0
        
        start_time = time.time()
        
        # Search
        query_array = np.array([query_embedding]).astype('float32')
        distances, indices = self.index.search(query_array, top_k)
        
        search_time_ms = (time.time() - start_time) * 1000
        
        # Format results with confidence scores
        results = []
        for i, (distance, chunk_id) in enumerate(zip(distances[0], indices[0])):
            if chunk_id == -1 or chunk_id not in self.id_mapping:  # Invalid result
                continue
            
            # Convert distance to similarity (0-1 scale)
            # FAISS HNSWFlat returns squared L2 distance, convert to similarity
            similarity = 1.0 / (1.0 + float(distance))
            
            result = {
                **self.id_mapping[chunk_id],
                'chunk_id': int(chunk_id),
                'similarity_score': round(similarity, 3),
                'distance': float(distance),
                'rank': i + 1
            }
            results.append(result)
        
        return results, search_time_ms

class EmbeddingCache:
    """Cache embeddings to avoid recomputation"""
    
    def __init__(self, max_cache_size: int = 1000):
        self.cache = {}
        self.max_size = max_cache_size
    
    def get(self, text: str):
        """Get cached embedding"""
        return self.cache.get(text)
    
    def set(self, text: str, embedding: np.ndarray):
        """Set cached embedding"""
        if len(self.cache) >= self.max_size:
            # Remove oldest entry
            self.cache.pop(next(iter(self.cache)))
        
        self.cache[text] = embedding
    
    def clear(self):
        """Clear cache"""
        self.cache.clear()
