# Performance Baselines

Measured on M1 MacBook, 8GB RAM, as of Day 17.

## Retrieval pipeline (consistently fast)
- FAISS index load (cached in memory): <1ms
- Query embedding: 300-2500ms (varies with system load)
- FAISS search: 5-350ms
- DB fetch: 5-40ms
- Total retrieval: typically under 1.5s

## LLM generation (dominant cost)
- Range observed: 12-67 seconds
- Primary factor: system memory pressure (observed only 106MB free RAM
  during testing caused 3-4x slowdown vs a fresh system)
- Secondary factor: first call after Ollama starts is slower (model
  loading into memory)
- max_tokens capped at 150, temperature 0.1 (tuned Day 6/12)

## Cached endpoints (contradictions/gaps/graph-data)
- Under 1 second - data is precomputed on upload/delete, not per-request
  (Day 10 fix cut these from 100-180s down to instant)

## Full analysis run (triggered on upload/delete)
- 450-500 seconds for 4 documents (claim extraction + contradiction
  detection + gap clustering + graph building, all via LLM calls)
- This happens once per upload, not per page view

## Recommendations for demo day
- Close unnecessary apps/browser tabs to free RAM before presenting
- Expect the first Q&A query to be slower (Ollama warm-up)
- Mention local-only processing as a feature (privacy/cost) when explaining wait times
