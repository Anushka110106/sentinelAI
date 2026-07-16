from api.models.embedding import EmbeddingModel
import numpy as np

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

embedder = EmbeddingModel()

pairs = [
    ("The model achieved 95% accuracy on the test set.", "The model achieved only 68% accuracy on the same test set."),
    ("Increasing batch size improves training stability.", "Larger batch sizes led to unstable training in our experiments."),
    ("The model uses a transformer architecture with 12 layers.", "Our approach is based on a 12-layer transformer."),
    ("The dataset contains 10,000 labeled images.", "We propose a new loss function for regression tasks."),
]

for a, b in pairs:
    emb = embedder.embed([a, b])
    sim = cosine_similarity(emb[0], emb[1])
    print(f"Similarity: {sim:.3f}")
    print(f"  A: {a}")
    print(f"  B: {b}\n")
