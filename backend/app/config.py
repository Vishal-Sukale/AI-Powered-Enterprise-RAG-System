import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")
    EMBEDDING_MODEL: str = os.getenv(
        "EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"
    )

    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "app/uploads")
    VECTORSTORE_DIR: str = os.getenv("VECTORSTORE_DIR", "app/database/faiss_index")

    CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", 800))
    CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", 200))
    TOP_K: int = int(os.getenv("TOP_K", 6))

    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    API_KEY: str = os.getenv("API_KEY", "")

    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "change-this-secret-in-production")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", 480))
    APP_DB_PATH: str = os.getenv("APP_DB_PATH", "app/database/app.db")


settings = Settings()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.VECTORSTORE_DIR, exist_ok=True)
