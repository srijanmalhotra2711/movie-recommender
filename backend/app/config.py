import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    model_config = ConfigDict(extra='ignore')  # Ignore extra fields
    
    # App Info
    APP_NAME: str = "CineMatch API"
    VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./movie_recommender.db")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-CHANGE-IN-PRODUCTION-12345")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Recommendations
    MIN_RATINGS_FOR_RECOMMENDATIONS: int = 5
    NUM_RECOMMENDATIONS: int = 10
    COLLABORATIVE_WEIGHT: float = 0.6
    CONTENT_WEIGHT: float = 0.4
    
    # CORS - Frontend URLs allowed to access the API
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    @property
    def CORS_ORIGINS(self) -> List[str]:
        """Dynamic CORS origins"""
        origins = [
            self.FRONTEND_URL,
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
        
        if "vercel.app" in self.FRONTEND_URL:
            origins.append("https://*.vercel.app")
        
        return list(set([o for o in origins if o]))

settings = Settings()