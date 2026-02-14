from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime


# User Schemas
class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None


# Movie Schemas
class GenreResponse(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True


class MovieBase(BaseModel):
    title: str
    release_year: Optional[int] = None
    overview: Optional[str] = None
    poster_path: Optional[str] = None


class MovieResponse(BaseModel):
    id: int
    title: str
    release_year: Optional[int]
    overview: Optional[str]
    poster_path: Optional[str]
    avg_rating: float
    rating_count: int
    genres: List[GenreResponse] = []
    user_rating: Optional[float] = None  # User's rating if they've rated this movie
    
    class Config:
        from_attributes = True


class MovieListResponse(BaseModel):
    movies: List[MovieResponse]
    total: int
    page: int
    page_size: int


# Rating Schemas
class RatingCreate(BaseModel):
    movie_id: int
    rating: float = Field(..., ge=0.5, le=5.0)
    
    @validator('rating')
    def rating_must_be_half_increment(cls, v):
        if v % 0.5 != 0:
            raise ValueError('Rating must be in 0.5 increments')
        return v


class RatingUpdate(BaseModel):
    rating: float = Field(..., ge=0.5, le=5.0)
    
    @validator('rating')
    def rating_must_be_half_increment(cls, v):
        if v % 0.5 != 0:
            raise ValueError('Rating must be in 0.5 increments')
        return v


class RatingResponse(BaseModel):
    id: int
    user_id: int
    movie_id: int
    rating: float
    timestamp: datetime
    movie: Optional[MovieResponse] = None
    
    class Config:
        from_attributes = True


# Recommendation Schemas
class RecommendationResponse(BaseModel):
    movie: MovieResponse
    score: float
    reason: str  # "collaborative", "content-based", or "hybrid"


class RecommendationsResponse(BaseModel):
    recommendations: List[RecommendationResponse]
    algorithm: str  # For A/B testing tracking
    user_rating_count: int
