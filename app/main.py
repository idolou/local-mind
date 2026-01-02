from fastapi import FastAPI
from app.core.config import settings
import redis.asyncio as redis
from qdrant_client import QdrantClient

from app.routers import chat

app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)

app.include_router(chat.router)


@app.on_event("startup")
async def startup_event():
    # Verify Redis Connection
    try:
        r = redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
        await r.ping()
        print(f"✅ Connected to Redis at {settings.REDIS_URL}")
        await r.close()
    except Exception as e:
        print(f"❌ Failed to connect to Redis: {e}")

    # Verify Qdrant Connection
    try:
        qdrant = QdrantClient(url=settings.QDRANT_URL)
        # Simple check: list collections
        qdrant.get_collections()
        print(f"✅ Connected to Qdrant at {settings.QDRANT_URL}")
    except Exception as e:
        print(f"❌ Failed to connect to Qdrant: {e}")

@app.get("/")
def health_check():
    return {"status": "ok", "service": settings.APP_NAME}
