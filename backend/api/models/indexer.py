import os
from api.database import SentinelDB
from api.models.embedding import EmbeddingModel
from api.models.faiss_index import FAISSIndex

INDEX_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "faiss_index", "index.bin")

def rebuild_index():
    embedder = EmbeddingModel()
    chunks = SentinelDB.get_all_chunks()

    if not chunks:
        print("No chunks found in database")
        return None

    texts = [chunk['text'] for chunk in chunks]
    embeddings = embedder.embed(texts)

    faiss_index = FAISSIndex()
    chunk_ids = [chunk['chunk_id'] for chunk in chunks]
    faiss_index.add(embeddings, chunk_ids)

    os.makedirs(os.path.dirname(INDEX_PATH), exist_ok=True)
    faiss_index.save(INDEX_PATH)

    print(f"Indexed {len(chunks)} chunks")
    return faiss_index
