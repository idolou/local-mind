import redis.asyncio as redis
import json
import uuid
import time
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
        try:
            # Push to the list (Right Push)
            await r.rpush(f"session:{session_id}", json.dumps(message))
            # Set expiry for 24 hours so we don't leak memory forever
            await r.expire(f"session:{session_id}", 86400)
        except Exception as e:
            print(f"ERROR: Failed to add message to Redis: {e}", flush=True)
        finally:
            await r.close()

    async def get_history(self, session_id: str):
        """Retrieve the full chat history for context."""
        r = await self._get_connection()
        try:
            messages = await r.lrange(f"session:{session_id}", 0, -1)
            return [json.loads(m) for m in messages]
        except Exception as e:
            print(f"ERROR: Failed to get history from Redis: {e}", flush=True)
            return []
        finally:
            await r.close()

    async def delete_history(self, session_id: str):
        """Clear the history for a specific session."""
        r = await self._get_connection()
        await r.delete(f"session:{session_id}")
        await r.delete(f"session_meta:{session_id}")
        await r.close()

    async def create_session(self, title: str = "New Chat"):
        """Create a new session with metadata."""
        session_id = str(uuid.uuid4())
        r = await self._get_connection()
        meta = {
            "id": session_id,
            "title": title,
            "created_at": int(time.time())
        }
        await r.set(f"session_meta:{session_id}", json.dumps(meta))
        await r.close()
        return meta

    async def list_sessions(self):
        """List all available sessions sorted by creation time."""
        r = await self._get_connection()
        keys = await r.keys("session_meta:*")
        sessions = []
        if keys:
            # redis.keys returns a list of keys, using mget to fetch all at once is efficient
            values = await r.mget(keys)
            for v in values:
                if v:
                    sessions.append(json.loads(v))
        await r.close()
        # Sort by created_at descending (newest first)
        sessions.sort(key=lambda x: x.get("created_at", 0), reverse=True)
        return sessions

    async def update_session_title(self, session_id: str, title: str):
        """Update the title of an existing session."""
        r = await self._get_connection()
        key = f"session_meta:{session_id}"
        data = await r.get(key)
        if data:
            meta = json.loads(data)
            meta["title"] = title
            await r.set(key, json.dumps(meta))
        await r.close()

memory_service = MemoryService()
