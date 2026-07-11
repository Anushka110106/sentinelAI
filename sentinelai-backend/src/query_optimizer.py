from typing import List, Tuple
import re
from sentence_transformers import SentenceTransformer

class QueryOptimizer:
    """Optimize queries for better retrieval"""
    
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.stopwords = {
            'the', 'a', 'an', 'and', 'or', 'is', 'are', 'was', 'were',
            'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
            'will', 'would', 'could', 'should', 'may', 'might', 'can'
        }
    
    def preprocess_query(self, query: str) -> str:
        """
        Clean and optimize query for better search
        - Remove stopwords that don't help search
        - Enhance key terms
        - Fix common misspellings
        """
        
        # Convert to lowercase
        query = query.lower().strip()
        
        # Remove extra spaces
        query = re.sub(r'\s+', ' ', query)
        
        # Remove punctuation except key symbols
        query = re.sub(r'[^\w\s\-\+]', ' ', query)
        
        # Remove stopwords (but keep question words)
        question_words = {'what', 'why', 'how', 'where', 'when', 'which', 'who'}
        words = query.split()
        
        filtered = []
        for word in words:
            if word not in self.stopwords or word in question_words:
                filtered.append(word)
        
        return ' '.join(filtered).strip()
    
    def generate_query_variants(self, query: str, num_variants: int = 3) -> List[str]:
        """
        Generate multiple formulations of the same question
        for better retrieval coverage
        """
        
        variants = [query]  # Original
        
        # Variant 1: Remove question words (e.g., "What is X?" -> "X")
        variant1 = re.sub(r'^(what|why|how|where|when|which|who)\s+', '', query.lower())
        if variant1 != query and variant1.strip():
            variants.append(variant1)
        
        # Variant 2: Add related terms if applicable
        variant2 = query + " explain describe overview"
        variants.append(variant2)
        
        return variants[:num_variants]
    
    def multi_query_search(self, 
                          query: str, 
                          search_func, 
                          top_k: int = 5) -> List[dict]:
        """
        Execute multi-query retrieval:
        1. Search with original query
        2. Search with variants
        3. Merge and deduplicate results
        4. Return top-k by combined score
        """
        
        all_results = []
        seen_chunks = {}
        
        variants = self.generate_query_variants(query)
        
        for variant in variants:
            # We encode the variant to pass to the search function
            variant_embedding = self.model.encode(variant)
            results, _ = search_func(variant_embedding, top_k=top_k)
            
            for result in results:
                chunk_id = result['chunk_id']
                
                if chunk_id in seen_chunks:
                    # Boost score if appears in multiple variants
                    seen_chunks[chunk_id]['combined_score'] += result['similarity_score']
                    seen_chunks[chunk_id]['variant_count'] += 1
                else:
                    result['combined_score'] = result['similarity_score']
                    result['variant_count'] = 1
                    seen_chunks[chunk_id] = result
        
        # Sort by combined score
        merged = sorted(seen_chunks.values(), 
                       key=lambda x: x['combined_score'], 
                       reverse=True)
        
        # Normalize combined score to fit similarity scale
        for m in merged:
            m['similarity_score'] = round(m['combined_score'] / min(m['variant_count'], 2), 3)
            
        return merged[:top_k]
