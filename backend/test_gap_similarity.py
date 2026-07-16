from api.models.embedding import EmbeddingModel
import numpy as np

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

embedder = EmbeddingModel()

texts = [
    "The model was not tested on low-light conditions.",
    "Nighttime performance remains unevaluated.",
    "Future work should test under dark or low-light scenarios.",
]

embeddings = embedder.embed(texts)

for i in range(len(texts)):
    for j in range(i+1, len(texts)):
        sim = cosine_similarity(embeddings[i], embeddings[j])
        print(f"Similarity: {sim:.3f}")
        print(f"  A: {texts[i]}")
        print(f"  B: {texts[j]}\n")
