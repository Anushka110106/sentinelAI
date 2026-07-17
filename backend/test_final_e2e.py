import requests

BASE = "http://localhost:8000"

print("="*60)
print("FINAL END-TO-END TEST")
print("="*60)

r = requests.get(f"{BASE}/health")
print(f"\n1. Health: {r.status_code} - {r.json()}")
assert r.status_code == 200

r = requests.get(f"{BASE}/api/documents")
docs = r.json()['documents']
print(f"\n2. Documents: {len(docs)} found")
assert len(docs) >= 2

r = requests.post(f"{BASE}/api/query", json={"question": "What is RAG?"})
data = r.json()
print(f"\n3. Q&A test: {r.status_code}")
print(f"   Answer: {data['answer'][:150]}")
print(f"   Citations: {len(data['citations'])}")
assert r.status_code == 200 and len(data['citations']) > 0

r = requests.post(f"{BASE}/api/query", json={"question": "What is the capital of France?"})
data = r.json()
print(f"\n4. No-hallucination test: {r.status_code}")
print(f"   Answer: {data['answer'][:150]}")

r = requests.get(f"{BASE}/api/contradictions")
print(f"\n5. Contradictions: {r.status_code} - {len(r.json()['contradictions'])} found")
assert r.status_code == 200

r = requests.get(f"{BASE}/api/graph-data")
data = r.json()
print(f"\n6. Graph: {r.status_code} - {len(data['nodes'])} nodes, {len(data['links'])} links")
assert r.status_code == 200 and len(data['nodes']) > 0

r = requests.get(f"{BASE}/api/gaps")
data = r.json()
print(f"\n7. Gaps: {r.status_code} - {len(data['gaps'])} found")
assert r.status_code == 200

r = requests.post(f"{BASE}/api/query", json={"question": ""})
print(f"\n8. Empty question rejected: {r.status_code} (expect 400)")
assert r.status_code == 400

r = requests.delete(f"{BASE}/api/documents/fake-id-123")
print(f"\n9. Nonexistent doc delete: {r.status_code} (expect 404)")
assert r.status_code == 404

print("\n" + "="*60)
print("ALL FINAL CHECKS PASSED")
print("="*60)
