from api.models.llm import LLMClient

llm = LLMClient()

prompt = """Compare these two claims from different research papers on a similar topic:

Claim A: The model achieved 95% accuracy on the test set.
Claim B: The model achieved only 68% accuracy on the same test set.

Do these claims genuinely contradict or conflict with each other? Respond with ONLY a JSON object, nothing else:
{"contradicts": true or false, "summary": "short summary if they contradict", "reason": "likely reason for the difference if any"}

JSON output:"""

response = llm.generate(prompt, max_tokens=200)
print("RAW RESPONSE:")
print(response)
