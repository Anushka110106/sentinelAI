import requests
import time

BASE = "http://localhost:8000"

def timed(label, method, url, **kwargs):
    print(f"\n{'='*60}")
    print(label)
    start = time.time()
    if method == "GET":
        r = requests.get(url, **kwargs)
    else:
        r = requests.post(url, **kwargs)
    elapsed = time.time() - start
    print(f"Status: {r.status_code} | Time: {elapsed:.1f}s")
    return r, elapsed

r, t = timed("Documents check", "GET", f"{BASE}/api/documents")
docs = r.json()['documents']
print(f"Documents: {len(docs)}")
for d in docs:
    print(f"  - {d['filename']}")

r, t = timed("MODULE 1: Q&A demo query", "POST", f"{BASE}/api/query",
             json={"question": "What is RAG-Sequence and how does it differ from RAG-Token?"})
data = r.json()
print(f"Answer: {data.get('answer', 'ERROR')[:300]}")
print(f"Citations: {len(data.get('citations', []))}")

r, t = timed("MODULE 2: Contradictions demo", "GET", f"{BASE}/api/contradictions")
print(f"Contradictions: {len(r.json().get('contradictions', []))}")

r, t = timed("MODULE 3: Graph demo", "GET", f"{BASE}/api/graph-data")
data = r.json()
print(f"Nodes: {len(data.get('nodes', []))} | Links: {len(data.get('links', []))}")

r, t = timed("MODULE 4: Gaps demo", "GET", f"{BASE}/api/gaps")
data = r.json()
print(f"Gaps: {len(data.get('gaps', []))}")
for g in data.get('gaps', []):
    print(f"  - {g['title'][:70]} (sources: {g['source_ref']})")

print(f"\n{'='*60}")
print("DEMO REHEARSAL COMPLETE")
print("If Module 1 took >20s, consider closing background apps before the real demo")
print("If Modules 2/3/4 took >2s, the cache may need refreshing - run trigger_analysis.py")
