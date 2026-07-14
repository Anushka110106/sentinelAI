import requests

class LLMClient:
    def __init__(self, model='llama3.2', endpoint='http://localhost:11434'):
        self.model = model
        self.endpoint = endpoint

    def generate(self, prompt, max_tokens=250):
        response = requests.post(
            f'{self.endpoint}/api/generate',
            json={
                'model': self.model,
                'prompt': prompt,
                'stream': False,
                'options': {
                    'num_predict': max_tokens
                }
            }
        )
        return response.json()['response']
