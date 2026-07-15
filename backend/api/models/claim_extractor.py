import json
import re
from api.models.llm import LLMClient

llm = LLMClient()

def extract_claims(doc_chunks, doc_id):
    """Extract research claims from a document's chunks using the LLM."""
    # Join a reasonable amount of text (avoid overloading the prompt)
    combined_text = " ".join([c['text'] for c in doc_chunks[:30]])[:4000]

    prompt = f"""From the following research document excerpt, extract the main claims, reported results, and conclusions.

Format your response as a JSON array like this, and output ONLY the JSON, nothing else:
[
  {{"claim": "...", "type": "metric or conclusion or method"}}
]

Document excerpt:
{combined_text}

JSON output:"""

    response = llm.generate(prompt, max_tokens=400)

    # LLMs often wrap JSON in extra text or markdown fences - extract just the array
    match = re.search(r'\[.*\]', response, re.DOTALL)
    if not match:
        return []

    try:
        claims = json.loads(match.group(0))
    except json.JSONDecodeError:
        return []

    return [
        {
            'doc_id': doc_id,
            'claim': c.get('claim', ''),
            'source_text': combined_text[:200],
            'confidence': 0.8
        }
        for c in claims if c.get('claim')
    ]
