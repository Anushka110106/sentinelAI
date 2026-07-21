# SentinelAI Backend

FastAPI backend for SentinelAI - an evidence-based AI research intelligence platform.

## Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Install and start Ollama (https://ollama.com):
```bash
ollama pull llama3.2
ollama serve
```

## Running

```bash
./venv/bin/python -m uvicorn api.main:app --reload
```

Server runs on http://localhost:8000

## Architecture
## Database Schema

SQLite file at `api/sentinelai.db`. Tables: `documents`, `chunks`, `claims`,
`contradictions`, `gaps`, `graph_nodes`, `graph_links`, `chat_history`.
See `api/database.py` for the `SentinelDB` class with all query methods.

## API Endpoints

- `GET /health` / `GET /api/health` - system status (ollama connection, index status). Both paths supported since frontend calls /api/health.
- `POST /api/upload` - upload PDF(s), triggers indexing + analysis
- `GET /api/documents` - list uploaded documents
- `DELETE /api/documents/{id}` - remove a document
- `POST /api/query` - ask a question, get answer + citations + found_evidence flag (Module 1)
- `GET /api/contradictions` - cached contradiction analysis (Module 2)
- `GET /api/graph-data` - cached entity/relationship graph, includes x/y positions (Module 3)
- `GET /api/gaps` - cached research gap analysis (Module 4)
- `GET /api/chat-history` - saved question/answer history
- `POST /api/chat-history/clear` - clear chat history

## Key Design Notes

- Contradictions/gaps/graph are computed once on upload/delete and cached in
  the database (not recomputed per request) - see Day 10 performance fix.
- Contradiction detection uses embedding similarity (threshold 0.70) as a
  pre-filter, then LLM judgment to confirm. Gap clustering uses a lower
  embedding threshold (0.40) plus mandatory LLM confirmation, since
  limitation/future-work phrasing varies more across papers than claims do.
- Graph nodes are assigned positions via a simple circular layout in
  merge_graphs() (Day 16 fix - originally all nodes had x:0,y:0 and rendered
  stacked on top of each other).
- Every /api/query call is automatically saved to chat_history (Day 16).
- Known limitation: semantic search underperforms on metadata-style questions
  (author names, dates) since these don't embed close to natural-language
  questions about them.
- LLM generation is the dominant latency cost (12-50s typical on M1 8GB),
  not the retrieval pipeline (consistently under 1.5s). This is a hardware/model
  size constraint, not a code bottleneck - see Day 12 profiling results.

## Performance Baselines (measured on M1 MacBook, 8GB RAM)
- Retrieval (embed + FAISS search + DB fetch): ~1-1.5s
- LLM generation: 12-50s depending on system memory pressure
- Cached endpoints (contradictions/gaps/graph): under 1s

## Frontend Integration Notes (Day 16 findings)
- CORS is configured for http://localhost:3000 - update in main.py if frontend
  runs on a different port.
- Frontend and backend must run on the SAME machine unless backend is exposed
  via a real IP/tunnel - localhost only refers to the machine it runs on.
- Frontend expects found_evidence (bool) in query responses to distinguish
  real answers from "no evidence" cases.
