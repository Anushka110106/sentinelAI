import uuid
from typing import List, Dict, Tuple
import numpy as np
from sentence_transformers import util
from src.claim_extractor import ClaimExtractor
from src.llm import LLMClient

class ContradictionDetector:
    """Detect and explain contradictions between claims"""
    
    def __init__(self, embedding_model):
        self.embedding_model = embedding_model
        self.claim_extractor = ClaimExtractor()
        self.llm = LLMClient()
        
        self.contradiction_prompt = """Analyze these two claims. Do they contradict each other?

Claim A (from {doc_a}): {claim_a}
Claim B (from {doc_b}): {claim_b}

If they contradict, explain:
1. How they contradict
2. Possible reasons (different datasets, methodologies, experimental conditions, parameters, etc.)
3. Which might be more reliable and why

FORMAT:
Contradiction: Yes/No
Explanation: [explanation]
Confidence: [0-100]"""

    def find_contradictions(self, claims: List[Dict]) -> List[Dict]:
        """
        Find all contradictions in a set of claims
        """
        contradictions = []
        
        # Compare each pair of claims
        for i in range(len(claims)):
            for j in range(i + 1, len(claims)):
                claim_a = claims[i]
                claim_b = claims[j]
                
                # Skip same document
                if claim_a['doc_id'] == claim_b['doc_id']:
                    continue
                
                # Calculate semantic similarity
                embedding_a = self.embedding_model.encode(claim_a['claim'], convert_to_tensor=True)
                embedding_b = self.embedding_model.encode(claim_b['claim'], convert_to_tensor=True)
                
                similarity = util.cos_sim(embedding_a, embedding_b).item()
                
                # Only check contradictions for similar claims (talking about same topic)
                if 0.45 < similarity < 0.96:
                    result = self._analyze_contradiction(claim_a, claim_b, similarity)
                    if result and result['is_contradiction']:
                        contradictions.append(result)
        
        return contradictions
    
    def _analyze_contradiction(self, claim_a: Dict, claim_b: Dict, similarity: float) -> Dict:
        """Analyze if two claims actually contradict"""
        
        # 1. Look for obvious logical/numeric differences in claims using fallback rules first
        text_a = claim_a['claim'].lower()
        text_b = claim_b['claim'].lower()
        
        # Heuristic check for numbers
        numbers_a = set(re.findall(r"\b\d+(?:\.\d+)?\b", text_a))
        numbers_b = set(re.findall(r"\b\d+(?:\.\d+)?\b", text_b))
        
        # If they share some numbers but differ on key numbers, or if one has negative words
        negatives = {"no", "not", "never", "empty", "fail", "absent", "without", "clash"}
        has_neg_a = any(w in text_a.split() for w in negatives)
        has_neg_b = any(w in text_b.split() for w in negatives)
        
        is_logical_clash = (has_neg_a != has_neg_b)
        
        # Check for coordinate or time values difference
        has_numeric_diff = False
        if numbers_a and numbers_b:
            # If they contain different sets of numbers (representing stats or values)
            common_numbers = numbers_a.intersection(numbers_b)
            if len(common_numbers) < max(len(numbers_a), len(numbers_b)):
                has_numeric_diff = True
                
        # If there's a strong logical clash or numeric difference on the same topic, it is highly likely a contradiction
        is_contradiction = is_logical_clash or has_numeric_diff
        
        # Determine severity
        severity = "High" if is_logical_clash else ("Medium" if has_numeric_diff else "Low")
        
        # Try LLM to refine analysis
        try:
            import os
            # If LLM (Ollama/Gemini) is available, use it to verify/explain
            has_llm = False
            # Check Ollama
            import httpx
            try:
                r = httpx.get("http://localhost:11434", timeout=0.5)
                if r.status_code == 200:
                    has_llm = True
            except:
                pass
            if os.environ.get("GEMINI_API_KEY"):
                has_llm = True
                
            if has_llm:
                prompt = self.contradiction_prompt.format(
                    doc_a=claim_a['doc_name'],
                    claim_a=claim_a['claim'],
                    doc_b=claim_b['doc_name'],
                    claim_b=claim_b['claim']
                )
                response = self.llm.invoke(prompt)
                
                # Parse LLM response
                is_contra_llm = "contradiction: yes" in response.lower()
                explanation_match = re.search(r"Explanation:\s*(.*)", response, re.IGNORECASE)
                explanation = explanation_match.group(1).strip() if explanation_match else response
                
                # Confidence parsing
                confidence_match = re.search(r"Confidence:\s*(\d+)", response, re.IGNORECASE)
                confidence = float(confidence_match.group(1)) / 100.0 if confidence_match else 0.8
                
                return {
                    'id': f"c-{uuid.uuid4().hex[:6]}",
                    'topic': self._infer_topic(claim_a['claim'], claim_b['claim']),
                    'severity': severity,
                    'claim_a': claim_a['claim'],
                    'doc_a': claim_a['doc_name'],
                    'claim_b': claim_b['claim'],
                    'doc_b': claim_b['doc_name'],
                    'is_contradiction': is_contra_llm or is_contradiction,
                    'explanation': explanation,
                    'differences': {
                        'dataset': "dataset" in response.lower() or "data" in response.lower(),
                        'methodology': "methodology" in response.lower() or "method" in response.lower(),
                        'parameters': "parameters" in response.lower() or "param" in response.lower(),
                        'experimental': "experimental" in response.lower() or "experiment" in response.lower(),
                        'timeline': "time" in response.lower() or "clock" in response.lower()
                    },
                    'confidence': confidence
                }
        except:
            pass
            
        # Fallback explanation generator
        topic = self._infer_topic(claim_a['claim'], claim_b['claim'])
        if is_contradiction:
            explanation = f"Variance detected regarding '{topic}'. Version A states: '{claim_a['claim']}' while Version B states: '{claim_b['claim']}'. This suggests an operational discrepancy, likely due to reporting time offsets or varying dataset collection conditions."
        else:
            explanation = f"Potential difference in focus or reporting detail for '{topic}' between '{claim_a['doc_name']}' and '{claim_b['doc_name']}'."
            
        return {
            'id': f"c-{uuid.uuid4().hex[:6]}",
            'topic': topic,
            'severity': severity,
            'claim_a': claim_a['claim'],
            'doc_a': claim_a['doc_name'],
            'claim_b': claim_b['claim'],
            'doc_b': claim_b['doc_name'],
            'is_contradiction': is_contradiction,
            'explanation': explanation,
            'differences': {
                'dataset': "data" in text_a or "data" in text_b,
                'methodology': "method" in text_a or "method" in text_b or "approach" in text_a or "approach" in text_b,
                'parameters': "parameters" in text_a or "parameters" in text_b or "setting" in text_a or "setting" in text_b,
                'experimental': "experiment" in text_a or "experiment" in text_b or "test" in text_a or "test" in text_b,
                'timeline': "time" in text_a or "time" in text_b or "hours" in text_a or "hours" in text_b
            },
            'confidence': round(similarity * 1.1, 2)
        }
        
    def _infer_topic(self, claim_a: str, claim_b: str) -> str:
        """Infer the topic of contradiction from claim texts."""
        words_a = set(re.findall(r"\w+", claim_a.lower()))
        words_b = set(re.findall(r"\w+", claim_b.lower()))
        
        stopwords = {'the', 'a', 'an', 'and', 'or', 'is', 'are', 'was', 'were', 'to', 'for', 'of', 'in', 'on', 'at', 'with', 'by', 'that', 'from', 'this', 'it'}
        common_words = (words_a.intersection(words_b)) - stopwords
        
        if len(common_words) >= 2:
            return " ".join(list(common_words)[:3]).title()
        elif len(common_words) == 1:
            return f"{list(common_words)[0].title()} Discrepancy"
        else:
            return "Operational Discrepancy"
