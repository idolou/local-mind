from fastapi import APIRouter, WebSocket, WebSocketDisconnect, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from app.services.memory import memory_service
from app.services.vectors import vector_service
from app.services.llm import llm_service
import asyncio

router = APIRouter()

class SessionResponse(BaseModel):
    id: str
    title: str
    created_at: int

class CreateSessionRequest(BaseModel):
    title: Optional[str] = "New Chat"

@router.get("/sessions", response_model=List[SessionResponse])
async def get_sessions():
    return await memory_service.list_sessions()

@router.post("/sessions", response_model=SessionResponse)
async def create_session(request: CreateSessionRequest):
    return await memory_service.create_session(request.title)

@router.get("/sessions/{session_id}/history")
async def get_session_history(session_id: str):
    return await memory_service.get_history(session_id)

async def summarize_session(session_id: str, first_message: str):
    """Background task to generate a title for the session."""
    # Delay slightly to let the chat flow continue
    await asyncio.sleep(2)
    
    prompt = f"Summarize the following message into a short title (max 5 words). Do not use quotes. Message: {first_message}"
    messages = [{"role": "user", "content": prompt}]
    
    title = ""
    # We reuse stream_chat but just collect the full text
    async for token in llm_service.stream_chat(messages):
        title += token
    
    title = title.strip().replace('"', '').replace("Title:", "").strip()
    if title:
        await memory_service.update_session_title(session_id, title)


@router.websocket("/ws/chat/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    try:
        while True:
            # 1. Receive User Message
            data = await websocket.receive_text()
            
            # 2. Save User Message to Redis
            await memory_service.add_message(session_id, "user", data)
            
            # 3. Retrieve Context (History + RAG)
            history = await memory_service.get_history(session_id)
            
            # If history was empty BEFORE this new user message (which we just added),
            # it means this is the start of the conversation. 
            # Note: We added the user message in step 2, so history will have 1 item now if it was new.
            # Let's check if there is only 1 message (the one we just added).
            full_history = await memory_service.get_history(session_id)
            if len(full_history) == 1:
                 asyncio.create_task(summarize_session(session_id, data))
            
            # RAG: Search for relevant facts (Simple implementation)
            # In a real app we'd embedding the 'data' first.
            query_embedding = await llm_service.generate_embedding(data)
            relevant_facts = []
            if query_embedding:
                relevant_facts = vector_service.search_relevant(query_embedding)
            
            # Filter out facts that collide exactly with the query (to avoid redundancy)
            relevant_facts = [f for f in relevant_facts if f.strip() != data.strip()]

            context_str = "\n".join(relevant_facts)

            # 4. Stream Response
            full_response = ""
            async for token in llm_service.stream_chat(history, context_text=context_str):
                await websocket.send_text(token)
                full_response += token
            
            # 5. Save AI Response to Redis
            await memory_service.add_message(session_id, "assistant", full_response)
            
            # 6. Store User Message in Long-Term Memory (Dreaming - simplified for now)
            # We blindly upsert the user message as a "fact" for now to test Qdrant
            if query_embedding:
                vector_service.upsert_fact(data, query_embedding)

    except WebSocketDisconnect:
        print(f"Session {session_id} disconnected")
