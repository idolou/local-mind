from fastapi import APIRouter, HTTPException
from app.services.vectors import vector_service
from app.services.llm import llm_service
from pydantic import BaseModel

router = APIRouter(prefix="/knowledge", tags=["Knowledge"])

class SearchQuery(BaseModel):
    query: str
    limit: int = 3

class FactInput(BaseModel):
    text: str

@router.post("/search")
async def search_knowledge(search: SearchQuery):
    """Debug endpoint: Search the vector database for relevant facts."""
    embedding = await llm_service.generate_embedding(search.query)
    if not embedding:
        raise HTTPException(status_code=500, detail="Failed to generate embedding")
    
    results = vector_service.search_relevant(embedding, limit=search.limit)
    return {"results": results}

@router.post("/add")
async def add_fact(fact: FactInput):
    """Manually add a piece of knowledge to the vector DB."""
    embedding = await llm_service.generate_embedding(fact.text)
    if not embedding:
        raise HTTPException(status_code=500, detail="Failed to generate embedding")
    
    vector_service.upsert_fact(fact.text, embedding)
    return {"status": "success", "message": "Fact added to knowledge base"}
