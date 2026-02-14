from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.database import User, Rating
from app.models.schemas import RecommendationsResponse, RecommendationResponse, MovieResponse
from app.core.security import get_current_user
from app.recommenders.hybrid import HybridRecommender
from app.config import settings

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("/", response_model=RecommendationsResponse)
async def get_recommendations(
    algorithm: str = Query("hybrid", regex="^(hybrid|collaborative|content|adaptive|popular)$"),
    n: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get personalized movie recommendations for the current user.
    
    - **algorithm**: Recommendation algorithm to use
        - hybrid: Combines collaborative and content-based filtering
        - collaborative: User-based collaborative filtering only
        - content: Content-based filtering only
        - adaptive: Automatically chooses based on user's rating count
        - popular: Returns popular movies (for cold start)
    - **n**: Number of recommendations to return (1-50)
    """
    # Get user's rating count
    user_rating_count = db.query(Rating).filter(Rating.user_id == current_user.id).count()
    
    # Initialize recommender
    recommender = HybridRecommender(db)
    
    # Handle cold start (user has too few ratings)
    if user_rating_count < settings.MIN_RATINGS_FOR_RECOMMENDATIONS and algorithm != "popular":
        # Return popular movies for cold start users
        recommendations = recommender.recommend(current_user.id, n=n, algorithm="popular")
        algorithm_used = "popular (cold start)"
    else:
        # Get recommendations using specified algorithm
        try:
            recommendations = recommender.recommend(current_user.id, n=n, algorithm=algorithm)
            algorithm_used = algorithm
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error generating recommendations: {str(e)}"
            )
    
    # Format recommendations
    recommendation_responses = []
    
    for movie, score, reason in recommendations:
        movie_response = MovieResponse.from_orm(movie)
        
        recommendation_responses.append(
            RecommendationResponse(
                movie=movie_response,
                score=score,
                reason=reason
            )
        )
    
    return RecommendationsResponse(
        recommendations=recommendation_responses,
        algorithm=algorithm_used,
        user_rating_count=user_rating_count
    )


@router.get("/similar/{movie_id}")
async def get_similar_movies(
    movie_id: int,
    n: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get movies similar to a specific movie (content-based).
    
    - **movie_id**: ID of the movie to find similar movies for
    - **n**: Number of similar movies to return
    """
    from app.recommenders.content_based import ContentBasedRecommender
    
    # Check if movie exists
    from app.models.database import Movie
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    # Get similar movies
    recommender = ContentBasedRecommender(db)
    
    try:
        similar_movies = recommender.get_similar_movies(movie_id, n=n)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error finding similar movies: {str(e)}"
        )
    
    # Format response
    results = []
    
    for similar_movie_id, similarity_score in similar_movies:
        similar_movie = db.query(Movie).filter(Movie.id == similar_movie_id).first()
        
        if similar_movie:
            movie_response = MovieResponse.from_orm(similar_movie)
            results.append({
                "movie": movie_response,
                "similarity_score": similarity_score
            })
    
    return {
        "source_movie": MovieResponse.from_orm(movie),
        "similar_movies": results
    }


@router.post("/initialize-embeddings")
async def initialize_embeddings(
    force_regenerate: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Initialize or regenerate content-based embeddings for all movies.
    This can take several minutes for large datasets.
    
    - **force_regenerate**: Force regeneration even if embeddings exist
    
    Note: This should typically be run once during setup or when adding new movies.
    """
    from app.recommenders.content_based import ContentBasedRecommender
    
    recommender = ContentBasedRecommender(db)
    
    try:
        recommender.generate_movie_embeddings(force_regenerate=force_regenerate)
        
        return {
            "message": "Embeddings initialized successfully",
            "num_movies": len(recommender.movie_embeddings)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error initializing embeddings: {str(e)}"
        )


@router.get("/stats")
async def get_recommendation_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get statistics about the recommendation system and user's engagement.
    """
    from app.models.database import Movie
    
    # User stats
    user_rating_count = db.query(Rating).filter(Rating.user_id == current_user.id).count()
    
    user_ratings = db.query(Rating).filter(Rating.user_id == current_user.id).all()
    avg_user_rating = sum(r.rating for r in user_ratings) / len(user_ratings) if user_ratings else 0
    
    # Get user's favorite genres
    from app.models.database import Genre, movie_genres
    from sqlalchemy import func, desc
    
    favorite_genres = db.query(
        Genre.name,
        func.count(Rating.id).label('count')
    ).join(
        movie_genres, Genre.id == movie_genres.c.genre_id
    ).join(
        Rating, Rating.movie_id == movie_genres.c.movie_id
    ).filter(
        Rating.user_id == current_user.id
    ).group_by(Genre.name).order_by(desc('count')).limit(5).all()
    
    # System stats
    total_movies = db.query(Movie).count()
    total_ratings = db.query(Rating).count()
    total_users = db.query(User).count()
    
    return {
        "user_stats": {
            "rating_count": user_rating_count,
            "avg_rating": round(avg_user_rating, 2),
            "favorite_genres": [{"genre": name, "count": count} for name, count in favorite_genres],
            "can_get_recommendations": user_rating_count >= settings.MIN_RATINGS_FOR_RECOMMENDATIONS
        },
        "system_stats": {
            "total_movies": total_movies,
            "total_ratings": total_ratings,
            "total_users": total_users
        }
    }
