from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
import redis.asyncio as redis
from qdrant_client import QdrantClient

from app.routers import chat, memory, knowledge, llm

app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local dev, allow all. In prod, specify domains.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(memory.router)
app.include_router(knowledge.router)
app.include_router(llm.router)


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

    # Ensure Default Model (Async)
    from app.services.llm import llm_service
    import asyncio
    print(f"🚀 Triggering auto-pull for default model: {settings.DEFAULT_MODEL}")
    asyncio.create_task(llm_service.pull_model(settings.DEFAULT_MODEL))

@app.get("/")
def health_check():
    return {"status": "ok", "service": settings.APP_NAME}
