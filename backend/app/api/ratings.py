from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.database import get_db
from app.models.database import Rating, Movie, User
from app.models.schemas import RatingCreate, RatingUpdate, RatingResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/ratings", tags=["Ratings"])


@router.post("/", response_model=RatingResponse, status_code=201)
async def create_rating(
    rating_data: RatingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit a rating for a movie.
    If a rating already exists, it will be updated.
    
    - **movie_id**: ID of the movie to rate
    - **rating**: Rating value (0.5 to 5.0 in 0.5 increments)
    """
    # Check if movie exists
    movie = db.query(Movie).filter(Movie.id == rating_data.movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    # Check if rating already exists
    existing_rating = db.query(Rating).filter(
        Rating.user_id == current_user.id,
        Rating.movie_id == rating_data.movie_id
    ).first()
    
    if existing_rating:
        # Update existing rating
        existing_rating.rating = rating_data.rating
        db.commit()
        db.refresh(existing_rating)
        
        # Update movie statistics
        update_movie_stats(db, rating_data.movie_id)
        
        return existing_rating
    
    # Create new rating
    new_rating = Rating(
        user_id=current_user.id,
        movie_id=rating_data.movie_id,
        rating=rating_data.rating
    )
    
    db.add(new_rating)
    db.commit()
    db.refresh(new_rating)
    
    # Update movie statistics
    update_movie_stats(db, rating_data.movie_id)
    
    return new_rating


@router.put("/{rating_id}", response_model=RatingResponse)
async def update_rating(
    rating_id: int,
    rating_data: RatingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an existing rating.
    
    - **rating_id**: ID of the rating to update
    - **rating**: New rating value (0.5 to 5.0 in 0.5 increments)
    """
    # Get rating
    rating = db.query(Rating).filter(Rating.id == rating_id).first()
    
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")
    
    # Check if user owns this rating
    if rating.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this rating")
    
    # Update rating
    rating.rating = rating_data.rating
    db.commit()
    db.refresh(rating)
    
    # Update movie statistics
    update_movie_stats(db, rating.movie_id)
    
    return rating


@router.delete("/{rating_id}")
async def delete_rating(
    rating_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a rating.
    
    - **rating_id**: ID of the rating to delete
    """
    # Get rating
    rating = db.query(Rating).filter(Rating.id == rating_id).first()
    
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")
    
    # Check if user owns this rating
    if rating.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this rating")
    
    movie_id = rating.movie_id
    
    # Delete rating
    db.delete(rating)
    db.commit()
    
    # Update movie statistics
    update_movie_stats(db, movie_id)
    
    return {"message": "Rating deleted successfully"}


@router.get("/my-ratings", response_model=List[RatingResponse])
async def get_my_ratings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's ratings with movie details.
    
    - **page**: Page number
    - **page_size**: Number of ratings per page
    """
    offset = (page - 1) * page_size
    
    ratings = db.query(Rating).filter(
        Rating.user_id == current_user.id
    ).order_by(
        Rating.timestamp.desc()
    ).offset(offset).limit(page_size).all()
    
    # Include movie details in response
    for rating in ratings:
        rating.movie  # This triggers loading of the relationship
    
    return ratings


@router.get("/movie/{movie_id}/stats")
async def get_movie_rating_stats(
    movie_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get rating statistics for a specific movie.
    
    - **movie_id**: Movie ID
    """
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    # Get rating distribution
    rating_distribution = db.query(
        Rating.rating,
        func.count(Rating.id).label('count')
    ).filter(
        Rating.movie_id == movie_id
    ).group_by(Rating.rating).all()
    
    distribution = {float(rating): count for rating, count in rating_distribution}
    
    # Get user's rating if exists
    user_rating = db.query(Rating).filter(
        Rating.user_id == current_user.id,
        Rating.movie_id == movie_id
    ).first()
    
    return {
        "movie_id": movie_id,
        "avg_rating": movie.avg_rating,
        "rating_count": movie.rating_count,
        "distribution": distribution,
        "user_rating": user_rating.rating if user_rating else None
    }


def update_movie_stats(db: Session, movie_id: int):
    """Helper function to update movie rating statistics"""
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    
    if not movie:
        return
    
    ratings = db.query(Rating).filter(Rating.movie_id == movie_id).all()
    
    if ratings:
        movie.rating_count = len(ratings)
        movie.avg_rating = sum(r.rating for r in ratings) / len(ratings)
    else:
        movie.rating_count = 0
        movie.avg_rating = 0.0
    
    db.commit()
