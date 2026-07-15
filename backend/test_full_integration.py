import requests
import time

BASE = "http://localhost:8000"

def timed_request(method, url, **kwargs):
    start = time.time()
    if method == "GET":
        r = requests.get(url, **kwargs)
    else:
        r = requests.post(url, **kwargs)
    elapsed = time.time() - start
    return r, elapsed

print("="*60)
print("1. Checking documents in system")
r, t = timed_request("GET", f"{BASE}/api/documents")
docs = r.json()['documents']
print(f"Found {len(docs)} documents in {t:.1f}s")
for d in docs:
    print(f"  - {d['filename']} ({d.get('total_pages', '?')} pages)")

print("\n" + "="*60)
print("2. Testing Module 1 (Q&A)")
r, t = timed_request("POST", f"{BASE}/api/query", json={"question": "What is attention in the context of neural networks?"})
data = r.json()
print(f"Status: {r.status_code} | Time: {t:.1f}s")
print(f"Answer: {data.get('answer', 'ERROR')[:200]}")
print(f"Citations: {len(data.get('citations', []))}")

print("\n" + "="*60)
print("3. Testing Module 2 (Contradictions)")
r, t = timed_request("GET", f"{BASE}/api/contradictions")
data = r.json()
print(f"Status: {r.status_code} | Time: {t:.1f}s")
print(f"Contradictions found: {len(data.get('contradictions', []))}")

print("\n" + "="*60)
print("4. Testing Module 3 (Graph)")
r, t = timed_request("GET", f"{BASE}/api/graph-data")
data = r.json()
print(f"Status: {r.status_code} | Time: {t:.1f}s")
print(f"Nodes: {len(data.get('nodes', []))} | Links: {len(data.get('links', []))}")

print("\n" + "="*60)
print("5. Testing Module 4 (Gaps)")
r, t = timed_request("GET", f"{BASE}/api/gaps")
data = r.json()
print(f"Status: {r.status_code} | Time: {t:.1f}s")
print(f"Gaps found: {len(data.get('gaps', []))}")
for g in data.get('gaps', []):
    print(f"  - {g['title'][:80]} (sources: {g['source_ref']})")

print("\n" + "="*60)
print("ALL TESTS COMPLETE")
