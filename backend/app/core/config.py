from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "AI Voice Agent"
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # Database Configuration (Supabase)
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    
    # Retell AI Configuration
    RETELL_API_KEY: str = ""
    
    # OpenAI Configuration
    OPENAI_API_KEY: str = ""
    
    # Environment
    ENVIRONMENT: str = "development"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
