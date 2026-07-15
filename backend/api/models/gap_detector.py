import json
import re
import uuid
from api.models.llm import LLMClient
from api.models.embedding import EmbeddingModel
import numpy as np

llm = LLMClient()
embedder = EmbeddingModel()

def extract_limitations(doc_chunks, doc_id, doc_name):
    """Extract stated limitations, future work, and open challenges from a document."""
    combined_text = " ".join([c['text'] for c in doc_chunks[:30]])[:4000]

    prompt = f"""From the following research document excerpt, extract:
1. Stated limitations
2. Suggested future work
3. Open challenges

Format your response as a JSON object, output ONLY the JSON, nothing else:
{{"limitations": ["...", "..."], "future_work": ["...", "..."], "challenges": ["...", "..."]}}

Document excerpt:
{combined_text}

JSON output:"""

    response = llm.generate(prompt, max_tokens=400)
    match = re.search(r'\{.*\}', response, re.DOTALL)
    if not match:
        return []

    try:
        result = json.loads(match.group(0))
    except json.JSONDecodeError:
        return []

    items = []
    for category in ['limitations', 'future_work', 'challenges']:
        for text in result.get(category, []):
            if text and isinstance(text, str):
                items.append({
                    'doc_id': doc_id,
                    'doc_name': doc_name,
                    'category': category,
                    'text': text
                })
    return items


def cosine_similarity(a, b):
    a = np.array(a)
    b = np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


def cluster_and_rank_gaps(all_items, similarity_threshold=0.75, min_doc_mentions=2):
    """Group similar limitation/future-work mentions across documents.
    Only surface gaps mentioned in 2+ distinct documents (reduces noise)."""
    if len(all_items) < 2:
        return []

    texts = [item['text'] for item in all_items]
    embeddings = embedder.embed(texts)

    used = set()
    clusters = []

    for i in range(len(all_items)):
        if i in used:
            continue
        cluster = [i]
        used.add(i)
        for j in range(i + 1, len(all_items)):
            if j in used:
                continue
            sim = cosine_similarity(embeddings[i], embeddings[j])
            if sim > similarity_threshold:
                cluster.append(j)
                used.add(j)
        clusters.append(cluster)

    gaps = []
    for cluster in clusters:
        doc_ids_in_cluster = set(all_items[idx]['doc_id'] for idx in cluster)
        if len(doc_ids_in_cluster) < min_doc_mentions:
            continue  # only keep gaps mentioned in multiple distinct documents

        representative = all_items[cluster[0]]
        mentions = [all_items[idx] for idx in cluster]

        gaps.append({
            'id': str(uuid.uuid4()),
            'title': representative['text'][:100],
            'priority': 'High' if len(doc_ids_in_cluster) >= 3 else 'Medium',
            'details': representative['text'],
            'source_ref': ", ".join(sorted(set(m['doc_name'] for m in mentions))),
            'suggestion': f"Mentioned by {len(doc_ids_in_cluster)} document(s): " + "; ".join(m['text'][:100] for m in mentions)
        })

    # Rank by how many documents mention it
    gaps.sort(key=lambda g: g['source_ref'].count(',') + 1, reverse=True)
    return gaps
