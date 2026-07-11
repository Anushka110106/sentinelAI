import os
import httpx
import re
from typing import List

class HeuristicLLM:
    """A fallback rule-based NLP answer generator when no LLM is running."""
    
    def generate_answer(self, prompt: str) -> str:
        # Extract user query and context chunks from the prompt
        query_match = re.search(r"USER QUESTION:\s*(.*)", prompt, re.DOTALL)
        question = query_match.group(1).strip() if query_match else ""
        
        excerpts = re.findall(r"\[Document Excerpt \d+\]:\s*(.*?)(?=\[Document Excerpt \d+\]|USER QUESTION:|$)", prompt, re.DOTALL)
        excerpts = [e.strip() for e in excerpts if e.strip()]
        
        if not question or not excerpts:
            return "I could not find supporting evidence in the uploaded documents."
            
        # Tokenize question words (lowercase, alphanumeric)
        q_words = set(re.findall(r"\w+", question.lower()))
        stopwords = {'what', 'is', 'are', 'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'about', 'how', 'why', 'where', 'when', 'who'}
        q_keywords = q_words - stopwords
        if not q_keywords:
            q_keywords = q_words

        sentences = []
        for excerpt in excerpts:
            # Simple sentence tokenizer
            raw_sentences = re.split(r"(?<=[.!?])\s+", excerpt)
            for s in raw_sentences:
                s_clean = s.strip()
                if len(s_clean) > 15:
                    sentences.append(s_clean)
                    
        # Score sentences based on keyword overlap
        scored_sentences = []
        for s in sentences:
            s_words = set(re.findall(r"\w+", s.lower()))
            overlap = len(q_keywords.intersection(s_words))
            
            # Boost score if sentence contains exact phrases or matches more keyword tokens
            score = overlap
            if score > 0:
                # Deduplicate identical/extremely similar sentences
                if not any(abs(len(s) - len(existing[1])) < 5 and existing[1][:10] == s[:10] for existing in scored_sentences):
                    scored_sentences.append((score, s))
                    
        # Sort sentences by score descending
        scored_sentences.sort(key=lambda x: x[0], reverse=True)
        
        # Take the top 2-3 matching sentences and assemble into a paragraph
        selected_sentences = [s for score, s in scored_sentences[:3] if score > 0]
        
        if not selected_sentences:
            # If no sentences contain query keywords, return a fallback text
            return f"The documents address terms related to the question, but do not contain a direct answer. Key topics mentioned include: {', '.join(list(q_keywords)[:4])}."
            
        return " ".join(selected_sentences)

class LLMClient:
    """Standardized LLM client with local/remote fallbacks."""
    
    def __init__(self, ollama_url: str = "http://localhost:11434"):
        self.ollama_url = ollama_url
        self.fallback = HeuristicLLM()
        
    async def generate(self, prompt: str, max_tokens: int = 300, temperature: float = 0.3) -> str:
        # 1. Try local Ollama directly via API
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": "llama2",
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": temperature,
                            "num_predict": max_tokens
                        }
                    }
                )
                if response.status_code == 200:
                    data = response.json()
                    return data.get("response", "").strip()
        except Exception:
            pass
            
        # 2. Try Gemini API if GEMINI_API_KEY env is set
        gemini_api_key = os.environ.get("GEMINI_API_KEY")
        if gemini_api_key:
            try:
                # We can call the Gemini API via standard rest client
                async with httpx.AsyncClient(timeout=10.0) as client:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_api_key}"
                    response = await client.post(
                        url,
                        json={
                            "contents": [{"parts": [{"text": prompt}]}],
                            "generationConfig": {
                                "temperature": temperature,
                                "maxOutputTokens": max_tokens
                            }
                        }
                    )
                    if response.status_code == 200:
                        data = response.json()
                        return data['candidates'][0]['content']['parts'][0]['text'].strip()
            except Exception:
                pass
                
        # 3. Fallback to high-quality local heuristic model
        return self.fallback.generate_answer(prompt)

    def invoke(self, prompt: str) -> str:
        """Synchronous version of generate for LangChain compatibility."""
        import asyncio
        try:
            # Get current event loop or run fresh one
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If already running, call synchronous fallback directly
                return self.fallback.generate_answer(prompt)
            else:
                return loop.run_until_complete(self.generate(prompt))
        except Exception:
            return self.fallback.generate_answer(prompt)
