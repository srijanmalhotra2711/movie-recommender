import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
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
    
    # CORS - Frontend URLs allowed to access the API
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    @property
    def CORS_ORIGINS(self) -> List[str]:
        """
        Dynamic CORS origins - allows both production and development URLs
        """
        origins = [
            self.FRONTEND_URL,  # Production frontend URL from env
            "http://localhost:3000",  # Local development
            "http://127.0.0.1:3000",  # Local development alternative
        ]
        
        # If FRONTEND_URL is a Vercel URL, also allow preview deployments
        if "vercel.app" in self.FRONTEND_URL:
            # Allow all Vercel preview deployments for your app
            base_domain = self.FRONTEND_URL.split("//")[1].split(".")[0]
            origins.append(f"https://{base_domain}-*.vercel.app")
            origins.append("https://*.vercel.app")  # Allows all Vercel previews
        
        # Remove duplicates and empty strings
        origins = list(set([o for o in origins if o]))
        
        return origins
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()