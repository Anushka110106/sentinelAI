from typing import List

"""
Optimized prompts for high-quality answers
Focuses on clarity, brevity, and accuracy
"""

SYSTEM_PROMPT_V2 = """You are an expert research assistant with deep knowledge of technical subjects.

CRITICAL RULES:
1. Answer ONLY based on the provided document excerpts
2. Never use general knowledge or assumptions
3. If information is missing, explicitly say so
4. Keep answers concise (2-3 sentences max)
5. Use technical terminology appropriately
6. Cite specific sources when making claims

RESPONSE FORMAT:
- Start with a clear, direct answer
- Keep supporting details minimal
- End with any important caveats or limitations"""

QUESTION_REFORMULATION_PROMPT = """Given a user question, reformulate it to be more specific and searchable.

User Question: {question}

Reformulated Question (more specific and search-optimized):"""

ANSWER_CONFIDENCE_PROMPT = """Based on the provided excerpts, how confident are you in your answer to this question?

Question: {question}
Answer: {answer}

Rate confidence on a scale:
- High (>80%): Clear evidence in all excerpts
- Medium (50-80%): Some evidence but incomplete information
- Low (<50%): Minimal or unclear evidence

Confidence Level (High/Medium/Low):"""

def get_optimized_prompt(question: str, context_chunks: List[str]) -> str:
    """
    Create optimized prompt that:
    - Emphasizes document-only answers
    - Provides context clearly
    - Requests concise responses
    """
    
    formatted_context = "\n\n".join([
        f"[Document Excerpt {i+1}]:\n{chunk}"
        for i, chunk in enumerate(context_chunks)
    ])
    
    return f"""{SYSTEM_PROMPT_V2}

RESEARCH DOCUMENTS (excerpts only):
{formatted_context}

USER QUESTION:
{question}

ANSWER (based ONLY on the above excerpts):"""
