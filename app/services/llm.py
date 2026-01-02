import httpx
import json
from app.core.config import settings

class LLMService:
    def __init__(self):
        self.ollama_url = settings.OLLAMA_URL

    async def generate_embedding(self, text: str) -> list[float]:
        """Get vector embedding for text using Ollama."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.ollama_url}/api/embeddings",
                json={"model": "llama3", "prompt": text},
                timeout=30.0
            )
            if response.status_code != 200:
                print(f"Embedding failed: {response.text}")
                return []
            return response.json().get("embedding", [])

    async def stream_chat(self, messages: list, context_text: str = ""):
        """Stream chat response from Ollama."""
        
        system_prompt = "You are Local-Mind, a helpful AI assistant."
        if context_text:
            system_prompt += f"\nRelevant Context from Memory:\n{context_text}"
        
        # Prepend system message
        messages_with_system = [{"role": "system", "content": system_prompt}] + messages

        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                f"{self.ollama_url}/api/chat",
                json={"model": "llama3", "messages": messages_with_system},
                timeout=None
            ) as response:
                async for line in response.aiter_lines():
                    if line:
                        try:
                            json_response = json.loads(line)
                            if "message" in json_response:
                                yield json_response["message"]["content"]
                            if json_response.get("done"):
                                break
                        except json.JSONDecodeError:
                            continue

llm_service = LLMService()
