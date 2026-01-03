import asyncio
import websockets
import json

async def test_chat():
    uri = "ws://localhost:8000/ws/chat/test_session_123"
    async with websockets.connect(uri) as websocket:
        # 1. Send Name
        print("Sending: My name is Ido")
        await websocket.send("My name is Ido")
        
        # Receive response (streamed)
        response = ""
        while True:
            try:
                chunk = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                response += chunk
            except asyncio.TimeoutError:
                break
        print(f"Bot A: {response}")

        # 2. Ask Name
        print("Sending: What is my name?")
        await websocket.send("What is my name?")
        
        # Receive response
        response = ""
        while True:
            try:
                chunk = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                response += chunk
            except asyncio.TimeoutError:
                break
        print(f"Bot B: {response}")

if __name__ == "__main__":
    asyncio.run(test_chat())
