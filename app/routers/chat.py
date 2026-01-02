from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.memory import memory_service
from app.services.vectors import vector_service
from app.services.llm import llm_service
import asyncio

router = APIRouter()

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
            
            # RAG: Search for relevant facts (Simple implementation)
            # In a real app we'd embedding the 'data' first.
            query_embedding = await llm_service.generate_embedding(data)
            relevant_facts = []
            if query_embedding:
                relevant_facts = vector_service.search_relevant(query_embedding)
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
