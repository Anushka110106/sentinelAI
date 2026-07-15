import requests
import time

questions = [
    "What is the main contribution of this paper?",
    "What is RAG?",
    "What models were used as the generator in RAG?",
    "What dataset was used for open-domain question answering?",
    "Who are the authors of this paper?",
    "What is the capital of France?",  # should say no evidence
    "What is the recipe for chocolate cake?",  # should say no evidence
    "What is MIPS in the context of this paper?",
    "What are the two RAG formulations described?",
    "What year was this paper published?",
]

for q in questions:
    print(f"\n{'='*60}")
    print(f"Q: {q}")
    start = time.time()
    response = requests.post(
        "http://localhost:8000/api/query",
        json={"question": q}
    )
    elapsed = time.time() - start
    data = response.json()
    print(f"A: {data['answer'][:300]}")
    print(f"Time: {elapsed:.1f}s | Retrieval: {data['retrieval_time_ms']:.0f}ms | LLM: {data['llm_time_ms']:.0f}ms")
