import os
os.environ['HF_HUB_OFFLINE'] = '1'
from sentence_transformers import SentenceTransformer
import numpy as np

class EmbeddingModel:
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        self.model = SentenceTransformer(model_name)

    def embed(self, texts):
        """Embed list of texts"""
        return self.model.encode(texts, convert_to_numpy=True)
