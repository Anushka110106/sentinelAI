from typing import List, Dict
import re
from src.llm import LLMClient

class ClaimExtractor:
    """Extract factual claims from documents"""
    
    def __init__(self, llm_model: str = "llama2"):
        self.llm = LLMClient()
        self.extraction_prompt = """Extract factual claims from this research excerpt.
        
TEXT:
{text}

List each claim on a new line in the format:
- [Claim]: [Result]

Example:
- Achieved 95% accuracy on ImageNet dataset
- Processing time is 150ms per image

CLAIMS:"""

    def _heuristic_extract(self, text: str, doc_id: str) -> List[Dict]:
        """Fallback method to extract claims using regex/rules on text."""
        claims = []
        # Look for sentences containing numbers, percentages, dates, or key operational verbs
        sentences = re.split(r"(?<=[.!?])\s+", text)
        
        # Operational patterns (DRDO/military/logistics theme)
        patterns = [
            r"\d+%",  # percentages
            r"\d+\s*ms",  # latencies
            r"coordinates?\s+\d+",  # coordinates
            r"at\s+\d{4}\s*hours",  # times
            r"departed",
            r"arrived",
            r"patrol",
            r"camp",
            r"convoy",
            r"manifest",
            r"accuracy\s*(?:of|is)?\s*\d+",
            r"increase\s*(?:of|is)?\s*\d+",
            r"decrease\s*(?:of|is)?\s*\d+"
        ]
        
        for s in sentences:
            s = s.strip()
            if len(s) < 25 or len(s) > 200:
                continue
                
            is_claim = False
            for pat in patterns:
                if re.search(pat, s, re.IGNORECASE):
                    is_claim = True
                    break
                    
            if is_claim:
                # Clean up sentence to look like a clean claim
                claim_text = s.rstrip(".")
                claims.append({
                    'doc_id': doc_id,
                    'claim': claim_text,
                    'source_text': s[:100] + '...',
                    'confidence': 0.8
                })
        return claims
    
    def extract_claims(self, text: str, doc_id: str) -> List[Dict]:
        """Extract claims from document chunk"""
        try:
            # Check if we have an active LLM (Ollama or Gemini API key)
            import os
            # If Ollama is running or GEMINI_API_KEY is set, try LLM
            has_llm = False
            # Quick check if Ollama is running
            import httpx
            try:
                # Synchronous check
                r = httpx.get("http://localhost:11434", timeout=0.5)
                if r.status_code == 200:
                    has_llm = True
            except:
                pass
                
            if os.environ.get("GEMINI_API_KEY"):
                has_llm = True
                
            if has_llm:
                formatted_prompt = self.extraction_prompt.format(text=text[:1200])
                claims_text = self.llm.invoke(formatted_prompt)
                
                claims = []
                for line in claims_text.split('\n'):
                    line = line.strip()
                    # Clean bullets
                    if line.startswith('-') or line.startswith('*') or (len(line) > 2 and line[0].isdigit() and line[1] in ('.', ')')):
                        # Strip bullet prefix
                        claim = re.sub(r'^[-*\d\.\)\s]+', '', line).strip()
                        if claim and len(claim) > 10:
                            claims.append({
                                'doc_id': doc_id,
                                'claim': claim,
                                'source_text': text[:100] + '...',
                                'confidence': 0.85
                            })
                if claims:
                    return claims
            
            # Fallback to heuristics
            return self._heuristic_extract(text, doc_id)
            
        except Exception as e:
            print(f"Error extracting claims: {e}")
            return self._heuristic_extract(text, doc_id)
    
    def extract_from_chunks(self, chunks: List[Dict]) -> List[Dict]:
        """Extract claims from multiple chunks"""
        all_claims = []
        for chunk in chunks:
            claims = self.extract_claims(chunk['text'], chunk['doc_id'])
            all_claims.extend(claims)
        return all_claims
