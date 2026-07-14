import faiss
import numpy as np
import json
import os

class FAISSIndex:
    def __init__(self, embedding_dim=384):
        self.index = faiss.IndexFlatL2(embedding_dim)
        self.chunk_mapping = {}  # Maps FAISS index -> chunk_id

    def add(self, embeddings, chunk_ids):
        """Add embeddings to index"""
        embeddings = np.array(embeddings, dtype='float32')
        self.index.add(embeddings)
        for i, chunk_id in enumerate(chunk_ids):
            self.chunk_mapping[len(self.chunk_mapping)] = chunk_id

    def search(self, query_embedding, top_k=5):
        """Find top-k most similar chunks"""
        distances, indices = self.index.search(
            np.array([query_embedding], dtype='float32'),
            top_k
        )
        return [self.chunk_mapping[i] for i in indices[0] if i in self.chunk_mapping]

    def save(self, path):
        faiss.write_index(self.index, path)
        mapping_path = path + '.mapping.json'
        with open(mapping_path, 'w') as f:
            json.dump(self.chunk_mapping, f)

    def load(self, path):
        self.index = faiss.read_index(path)
        mapping_path = path + '.mapping.json'
        if os.path.exists(mapping_path):
            with open(mapping_path, 'r') as f:
                loaded = json.load(f)
                self.chunk_mapping = {int(k): v for k, v in loaded.items()}
