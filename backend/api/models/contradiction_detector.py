import json
import re
import uuid
from api.models.embedding import EmbeddingModel
from api.models.llm import LLMClient
import numpy as np

embedder = EmbeddingModel()
llm = LLMClient()

def cosine_similarity(a, b):
    a = np.array(a)
    b = np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def find_contradictions(claims, similarity_threshold=0.75):
    """Compare claims pairwise across documents to find likely contradictions."""
    if len(claims) < 2:
        return []

    texts = [c['claim'] for c in claims]
    embeddings = embedder.embed(texts)

    contradictions = []
    checked_pairs = set()

    for i in range(len(claims)):
        for j in range(i + 1, len(claims)):
            # Only compare claims from DIFFERENT documents
            if claims[i]['doc_id'] == claims[j]['doc_id']:
                continue

            pair_key = tuple(sorted([i, j]))
            if pair_key in checked_pairs:
                continue
            checked_pairs.add(pair_key)

            sim = cosine_similarity(embeddings[i], embeddings[j])

            # Similar topic (high similarity) but potentially different claims
            if sim > similarity_threshold:
                explanation = explain_difference(claims[i]['claim'], claims[j]['claim'])
                if explanation:
                    contradictions.append({
                        'id': str(uuid.uuid4()),
                        'topic': 'Discrepancy',
                        'severity': 'Medium',
                        'claim_a': claims[i]['claim'],
                        'doc_a': claims[i]['doc_id'],
                        'page_a': 0,
                        'claim_b': claims[j]['claim'],
                        'doc_b': claims[j]['doc_id'],
                        'page_b': 0,
                        'description': explanation.get('summary', ''),
                        'explanation': explanation.get('reason', ''),
                        'differences': explanation.get('differences', {}),
                        'confidence': float(sim)
                    })

    return contradictions

def explain_difference(claim_a, claim_b):
    """Ask the LLM whether two similar claims actually conflict, and why."""
    prompt = f"""Compare these two claims from different research papers on a similar topic:

Claim A: {claim_a}
Claim B: {claim_b}

Do these claims genuinely contradict or conflict with each other? Respond with ONLY a JSON object, nothing else:
{{"contradicts": true or false, "summary": "short summary if they contradict", "reason": "likely reason for the difference if any"}}

JSON output:"""

    response = llm.generate(prompt, max_tokens=200)
    match = re.search(r'\{.*\}', response, re.DOTALL)
    if not match:
        return None

    try:
        result = json.loads(match.group(0))
    except json.JSONDecodeError:
        return None

    if not result.get('contradicts'):
        return None

    return {
        'summary': result.get('summary', ''),
        'reason': result.get('reason', ''),
        'differences': {}
    }
