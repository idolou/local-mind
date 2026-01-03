import httpx
import json
import redis.asyncio as redis
from app.core.config import settings

class LLMService:
    def __init__(self):
        self.ollama_url = settings.OLLAMA_URL
        self.redis_url = settings.REDIS_URL

    async def _get_redis(self):
        return redis.from_url(self.redis_url, encoding="utf-8", decode_responses=True)

    async def get_active_model(self) -> str:
        """Get the currently active model from Redis, or default."""
        r = await self._get_redis()
        model = await r.get("llm:active_model")
        await r.close()
        return model if model else settings.DEFAULT_MODEL

    async def set_active_model(self, model_name: str):
        """Set the active model in Redis."""
        r = await self._get_redis()
        await r.set("llm:active_model", model_name)
        await r.close()

    async def pull_model(self, model_name: str):
        """Trigger a model pull request to Ollama."""
        async with httpx.AsyncClient(timeout=None) as client:
            # We use stream=True to not block forever, but here we just trigger it
            # In a real world scenario we might want to stream the progress back
            async with client.stream("POST", f"{self.ollama_url}/api/pull", json={"name": model_name}) as response:
                async for line in response.aiter_lines():
                    # We iterate to keep the connection alive until done, or valid JSON
                    pass
        return True

    async def delete_model(self, model_name: str):
        """Delete a model from Ollama."""
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.ollama_url}/api/delete",
                json={"name": model_name}
            )
            return response.status_code == 200

    async def generate_embedding(self, text: str) -> list[float]:
        """Get vector embedding for text using Ollama."""
        active_model = await self.get_active_model()
        print(f"DEBUG: Generating embedding for text: {text[:50]}... using {active_model}")
        async with httpx.AsyncClient() as client:
            try:
                print("DEBUG: Sending embedding request to Ollama...")
                response = await client.post(
                    f"{self.ollama_url}/api/embeddings",
                    json={"model": active_model, "prompt": text},
                    timeout=None # Allow time for model loading
                )
                print(f"DEBUG: Embedding response status: {response.status_code}")
                if response.status_code != 200:
                    print(f"Embedding failed: {response.text}")
                    return []
                return response.json().get("embedding", [])
            except (httpx.ConnectError, httpx.ReadTimeout) as e:
                print(f"Embedding connection error: {e}")
                return []

    async def stream_chat(self, messages: list, context_text: str = ""):
        """Stream chat response from Ollama."""
        active_model = await self.get_active_model()
        print(f"DEBUG: Starting stream_chat with {active_model}...")
        
        system_prompt = (
            "You are Local-Mind, a helpful AI assistant. "
            "You have access to the following memory context. "
            "ALWAYS use this context to answer questions about the user or past conversations. "
            "If the answer is in the context, repeat it accurately."
        )
        if context_text:
            system_prompt += f"\n\n=== MEMORY CONTEXT ===\n{context_text}\n======================"
        
        # Prepend system message
        messages_with_system = [{"role": "system", "content": system_prompt}] + messages

        async with httpx.AsyncClient() as client:
            try:
                print("DEBUG: Connecting to Ollama chat endpoint...")
                async with client.stream(
                    "POST",
                    f"{self.ollama_url}/api/chat",
                    json={"model": active_model, "messages": messages_with_system},
                    timeout=None
                ) as response:
                    print(f"DEBUG: Chat response status: {response.status_code}")
                    if response.status_code == 404:
                         yield f"Error: Model '{active_model}' not found. Please pull it first."
                         return
                    elif response.status_code != 200:
                         yield f"Error: Ollama service returned {response.status_code}."
                         return

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
            except httpx.ConnectError:
                yield "Error: Could not connect to Ollama. Is the container running?"

llm_service = LLMService()
