from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.services.llm import llm_service
from app.core.config import settings
import httpx
from pydantic import BaseModel

router = APIRouter(prefix="/llm", tags=["LLM"])

class ModelRequest(BaseModel):
    name: str

@router.get("/models")
async def list_models():
    """List available models from the local Ollama instance."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{settings.OLLAMA_URL}/api/tags")
            if response.status_code == 200:
                models = response.json().get("models", [])
                active_model = await llm_service.get_active_model()
                return {"models": models, "active_model": active_model}
            return {"error": "Failed to fetch models", "details": response.text}
        except Exception as e:
            return {"error": "Connection failed", "details": str(e)}

@router.get("/active")
async def get_active_model():
    """Get the currently active model."""
    model = await llm_service.get_active_model()
    return {"active_model": model}

@router.post("/active")
async def set_active_model(request: ModelRequest):
    """Set the active model."""
    await llm_service.set_active_model(request.name)
    return {"status": "success", "active_model": request.name}

@router.post("/pull")
async def pull_model(request: ModelRequest, background_tasks: BackgroundTasks):
    """Trigger a model pull in the background."""
    background_tasks.add_task(llm_service.pull_model, request.name)
    return {"status": "started", "message": f"Pulling model {request.name} in background"}

@router.delete("/{model_name}")
async def delete_model(model_name: str):
    """Delete a model."""
    success = await llm_service.delete_model(model_name)
    if success:
        return {"status": "success", "message": f"Deleted {model_name}"}
    raise HTTPException(status_code=500, detail="Failed to delete model")

