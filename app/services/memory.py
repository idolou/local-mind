import redis.asyncio as redis
import json
from app.core.config import settings

class MemoryService:
    def __init__(self):
        self.redis_url = settings.REDIS_URL

    async def _get_connection(self):
        return redis.from_url(self.redis_url, encoding="utf-8", decode_responses=True)

    async def add_message(self, session_id: str, role: str, content: str):
        """Append a message to the session's list."""
        r = await self._get_connection()
        message = {"role": role, "content": content}
        # Push to the list (Right Push)
        await r.rpush(f"session:{session_id}", json.dumps(message))
        # Set expiry for 24 hours so we don't leak memory forever
        await r.expire(f"session:{session_id}", 86400)
        await r.close()

    async def get_history(self, session_id: str):
        """Retrieve the full chat history for context."""
        r = await self._get_connection()
        messages = await r.lrange(f"session:{session_id}", 0, -1)
        await r.close()
        return [json.loads(m) for m in messages]

memory_service = MemoryService()
