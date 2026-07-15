import json
import re
import uuid
from api.models.llm import LLMClient

llm = LLMClient()

VALID_TYPES = {'technology', 'algorithm', 'dataset', 'result'}

def extract_entities_and_relationships(doc_chunks, doc_id, doc_name):
    """Extract key concepts and how they relate, for graph visualization."""
    combined_text = " ".join([c['text'] for c in doc_chunks[:30]])[:4000]

    prompt = f"""From the following research document excerpt, identify the 5-8 MOST IMPORTANT concepts only (not every mention).

For each concept, the "type" MUST be exactly one of these four words: technology, algorithm, dataset, result. Do not use any other word.

Then identify AT LEAST 3-5 relationships between these concepts using words like: uses, compares, extends, improves.

Output ONLY JSON in this exact format, nothing else:
{{
  "entities": [{{"name": "...", "type": "technology"}}],
  "relationships": [{{"source": "...", "target": "...", "type": "uses"}}]
}}

Document excerpt:
{combined_text}

JSON output:"""

    response = llm.generate(prompt, max_tokens=400)
    match = re.search(r'\{.*\}', response, re.DOTALL)
    if not match:
        return {'nodes': [], 'links': []}

    try:
        result = json.loads(match.group(0))
    except json.JSONDecodeError:
        return {'nodes': [], 'links': []}

    entity_colors = {
        'technology': '#4A90D9',
        'algorithm': '#7ED321',
        'dataset': '#F5A623',
        'result': '#D0021B'
    }

    nodes = []
    seen_names = set()
    for e in result.get('entities', []):
        name = e.get('name', '').strip()
        if not name or name in seen_names:
            continue
        seen_names.add(name)
        node_type = e.get('type', 'technology').strip().lower()
        if node_type not in VALID_TYPES:
            node_type = 'technology'  # safe fallback instead of an invalid/unknown type
        nodes.append({
            'id': name,
            'label': name,
            'type': node_type,
            'desc': f"From {doc_name}",
            'color': entity_colors.get(node_type, '#999999'),
            'x': 0,
            'y': 0
        })

    links = []
    for r in result.get('relationships', []):
        source = r.get('source', '').strip()
        target = r.get('target', '').strip()
        if source in seen_names and target in seen_names:
            links.append({
                'source': source,
                'target': target,
                'type': r.get('type', 'relates to'),
                'color': '#CCCCCC'
            })

    return {'nodes': nodes, 'links': links}


def merge_graphs(graph_list):
    """Merge multiple documents' graphs into one, deduplicating nodes by name."""
    all_nodes = {}
    all_links = []

    for graph in graph_list:
        for node in graph['nodes']:
            if node['id'] not in all_nodes:
                all_nodes[node['id']] = node
        all_links.extend(graph['links'])

    return {'nodes': list(all_nodes.values()), 'links': all_links}

