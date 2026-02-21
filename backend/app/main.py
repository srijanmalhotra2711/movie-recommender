from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.config import settings
import logging

from app.api import auth, movies, ratings, recommendations

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)
logger.info("Database tables created/verified")

app = FastAPI(
    title="Movie Recommender API",
    description="AI-powered movie recommendation system",
    version="1.0.0"
)

# CORS middleware - handle comma-separated origins
allowed_origins = ["http://localhost:3000"]
if settings.FRONTEND_URL:
    # Split comma-separated URLs and add them
    frontend_urls = [url.strip() for url in settings.FRONTEND_URL.split(",")]
    allowed_origins.extend(frontend_urls)

logger.info(f"Allowed CORS origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(movies.router, prefix="/movies", tags=["movies"])
app.include_router(ratings.router, prefix="/ratings", tags=["ratings"])
app.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to Movie Recommender API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    import os
    
    port = int(os.getenv("PORT", 8000))
    logger.info(f"Starting server on port {port}")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=False
    )