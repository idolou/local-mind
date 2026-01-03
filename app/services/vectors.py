from qdrant_client import QdrantClient
from qdrant_client.http import models
from app.core.config import settings
import uuid

class VectorService:
    def __init__(self):
        self.client = QdrantClient(url=settings.QDRANT_URL)
        self.collection_name = "knowledge_base"
        # Gemma 2B = 2048, Llama 3 = 4096. We default to 2048 now.
        self._ensure_collection(dimension=2048)

    def _ensure_collection(self, dimension: int = 2048):
        collections = self.client.get_collections()
        exists = any(c.name == self.collection_name for c in collections.collections)
        
        if exists:
            # Check if dimension matches
            info = self.client.get_collection(self.collection_name)
            print(f"DEBUG: Qdrant Collection Info: {info}")
            try:
                # Handle both object and dict access for compatibility
                current_dim = None
                if hasattr(info.config.params.vectors, 'size'):
                    current_dim = info.config.params.vectors.size
                elif isinstance(info.config.params.vectors, dict):
                    current_dim = info.config.params.vectors.get('size')
                
                print(f"DEBUG: Detected dimension: {current_dim}")

                if current_dim != dimension:
                    print(f"Dimension mismatch (Expected {dimension}, Found {current_dim}). Recreating collection...")
                    self.client.delete_collection(self.collection_name)
                    exists = False
            except Exception as e:
                print(f"DEBUG: Error checking dimensions: {e}")
                # Fallback: Recreate if we can't verify
                self.client.delete_collection(self.collection_name)
                exists = False
        
        if not exists:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=models.VectorParams(size=dimension, distance=models.Distance.COSINE),
            )
            print(f"Created Qdrant collection: {self.collection_name} with dim {dimension}")

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
        results = self.client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            limit=limit
        ).points
        return [hit.payload["text"] for hit in results]

vector_service = VectorService()
