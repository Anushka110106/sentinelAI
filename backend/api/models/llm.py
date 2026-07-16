import requests
import logging

logger = logging.getLogger(__name__)

class LLMClient:
    def __init__(self, model='llama3.2', endpoint='http://localhost:11434'):
        self.model = model
        self.endpoint = endpoint

    def generate(self, prompt, max_tokens=250, retries=2, timeout=90):
        last_error = None
        for attempt in range(retries + 1):
            try:
                response = requests.post(
                    f'{self.endpoint}/api/generate',
                    json={
                        'model': self.model,
                        'prompt': prompt,
                        'stream': False,
                        'options': {
                            'num_predict': max_tokens,
                            'temperature': 0.1}
                    },
                    timeout=timeout
                )
                response.raise_for_status()
                return response.json()['response']
            except requests.exceptions.Timeout:
                last_error = "LLM request timed out"
                logger.warning(f"Attempt {attempt+1} timed out")
            except requests.exceptions.ConnectionError:
                last_error = "Could not connect to Ollama - is it running?"
                logger.warning(f"Attempt {attempt+1}: connection error")
            except Exception as e:
                last_error = str(e)
                logger.warning(f"Attempt {attempt+1} failed: {e}")

        return f"Error: {last_error}. Please try again."
