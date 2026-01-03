from fastapi import APIRouter, HTTPException
from app.services.memory import memory_service
from pydantic import BaseModel

router = APIRouter(prefix="/memory", tags=["Memory"])

class Message(BaseModel):
    role: str
    content: str

@router.get("/{session_id}", response_model=list[Message])
async def get_history(session_id: str):
    """Retrieve chat history for a session."""
    return await memory_service.get_history(session_id)

@router.delete("/{session_id}")
async def delete_history(session_id: str):
    """Clear chat history for a session."""
    await memory_service.delete_history(session_id)
    return {"status": "success", "message": f"History cleared for session {session_id}"}
