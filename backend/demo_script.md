# SentinelAI Demo Script

## Documents Used (4 papers, pre-loaded)
1. sample.pdf - Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks (Lewis et al.)
2. second_paper.pdf - A survey paper on RAG
3. 3rd.pdf - BERT
4. 4th.pdf - Attention Is All You Need (Transformers)

## Pre-demo checklist
- [ ] Close unnecessary apps/browser tabs to free RAM before starting
- [ ] Confirm Ollama is running: `curl http://localhost:11434`
- [ ] Confirm server is running: `curl http://localhost:8000/health`
- [ ] Confirm all 4 docs present: `curl http://localhost:8000/api/documents`

## MODULE 1 (Chat/Q&A) - ~45-50s response time (local LLM, mention this)
Q: "What is RAG-Sequence and how does it differ from RAG-Token?"
Expected: Specific answer distinguishing the two approaches, 5 citations from sample.pdf
Talking point while waiting: "This runs entirely locally, no cloud API - trade-off is speed for privacy/cost"

## MODULE 2 (Contradictions) - instant (cached)
Expected: 0 contradictions found
Talking point: "These 4 papers are complementary, not conflicting - system correctly avoids false positives rather than forcing a result"

## MODULE 3 (Graph) - instant (cached)
Expected: 17 nodes, 11 relationships covering RAG, BERT, Transformer concepts

## MODULE 4 (Gaps) - instant (cached)
Expected: 3 gaps found:
  1. "Hallucinations" - sample.pdf + second_paper.pdf
  2. Hybrid parametric/non-parametric memory limitations - 3rd.pdf + sample.pdf
  3. Knowledge provenance/updating - sample.pdf + second_paper.pdf
Talking point: each gap is independently mentioned in 2+ papers using different wording - system uses LLM-assisted matching, not just keyword search, to find these
