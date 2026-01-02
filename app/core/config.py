from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Local-Mind"
    DEBUG: bool = False
    
    # Database URLs
    REDIS_URL: str
    QDRANT_URL: str
    OLLAMA_URL: str

    class Config:
        env_file = ".env"

settings = Settings()
