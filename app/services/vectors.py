from qdrant_client import QdrantClient
from qdrant_client.http import models
from app.core.config import settings
import uuid

class VectorService:
    def __init__(self):
        self.client = QdrantClient(url=settings.QDRANT_URL)
        self.collection_name = "knowledge_base"
        self._ensure_collection()

    def _ensure_collection(self):
        collections = self.client.get_collections()
        if not any(c.name == self.collection_name for c in collections.collections):
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=models.VectorParams(size=4096, distance=models.Distance.COSINE), # Ollama embeddings are often 4096 dim
            )
            print(f"Created Qdrant collection: {self.collection_name}")

    def upsert_fact(self, text: str, embedding: list[float]):
        """Save a fact with its vector embedding."""
        point_id = str(uuid.uuid4())
        self.client.upsert(
            collection_name=self.collection_name,
            points=[
                models.PointStruct(
                    id=point_id,
                    vector=embedding,
                    payload={"text": text}
                )
            ]
        )

    def search_relevant(self, query_vector: list[float], limit: int = 3):
        """Find facts similar to the query vector."""
        results = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_vector,
            limit=limit
        )
        return [hit.payload["text"] for hit in results]

vector_service = VectorService()
