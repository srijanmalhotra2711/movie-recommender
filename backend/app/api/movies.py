from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional, List

from app.database import get_db
from app.models.database import Movie, Genre, Rating, User
from app.models.schemas import MovieResponse, MovieListResponse, GenreResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/movies", tags=["Movies"])


@router.get("/", response_model=MovieListResponse)
async def get_movies(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    genre: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = Query("title", regex="^(title|rating|year|popular)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get paginated list of movies with optional filtering.
    
    - **page**: Page number (starts at 1)
    - **page_size**: Number of movies per page (1-100)
    - **genre**: Filter by genre name
    - **search**: Search in movie titles
    - **sort_by**: Sort by 'title', 'rating', 'year', or 'popular'
    """
    query = db.query(Movie)
    
    # Apply genre filter
    if genre:
        query = query.join(Movie.genres).filter(Genre.name == genre)
    
    # Apply search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(Movie.title.ilike(search_term))
    
    # Apply sorting
    if sort_by == "rating":
        query = query.order_by(Movie.avg_rating.desc(), Movie.rating_count.desc())
    elif sort_by == "year":
        query = query.filter(Movie.release_year.isnot(None)).order_by(Movie.release_year.desc())
    elif sort_by == "popular":
        query = query.order_by(Movie.rating_count.desc(), Movie.avg_rating.desc())
    else:  # title
        query = query.order_by(Movie.title)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * page_size
    movies = query.offset(offset).limit(page_size).all()
    
    # Get user's ratings for these movies
    movie_ids = [m.id for m in movies]
    user_ratings_dict = {}
    
    if movie_ids:
        user_ratings = db.query(Rating).filter(
            Rating.user_id == current_user.id,
            Rating.movie_id.in_(movie_ids)
        ).all()
        user_ratings_dict = {r.movie_id: r.rating for r in user_ratings}
    
    # Add user ratings to movie responses
    movie_responses = []
    for movie in movies:
        movie_dict = MovieResponse.from_orm(movie).dict()
        movie_dict['user_rating'] = user_ratings_dict.get(movie.id)
        movie_responses.append(MovieResponse(**movie_dict))
    
    return MovieListResponse(
        movies=movie_responses,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/genres", response_model=List[GenreResponse])
async def get_genres(db: Session = Depends(get_db)):
    """Get list of all movie genres"""
    genres = db.query(Genre).order_by(Genre.name).all()
    return genres


@router.get("/search", response_model=List[MovieResponse])
async def search_movies(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search movies by title.
    
    - **q**: Search query
    - **limit**: Maximum number of results
    """
    search_term = f"%{q}%"
    
    movies = db.query(Movie).filter(
        Movie.title.ilike(search_term)
    ).order_by(
        Movie.rating_count.desc()
    ).limit(limit).all()
    
    # Get user's ratings
    movie_ids = [m.id for m in movies]
    user_ratings_dict = {}
    
    if movie_ids:
        user_ratings = db.query(Rating).filter(
            Rating.user_id == current_user.id,
            Rating.movie_id.in_(movie_ids)
        ).all()
        user_ratings_dict = {r.movie_id: r.rating for r in user_ratings}
    
    # Add user ratings
    movie_responses = []
    for movie in movies:
        movie_dict = MovieResponse.from_orm(movie).dict()
        movie_dict['user_rating'] = user_ratings_dict.get(movie.id)
        movie_responses.append(MovieResponse(**movie_dict))
    
    return movie_responses


@router.get("/{movie_id}", response_model=MovieResponse)
async def get_movie(
    movie_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed information about a specific movie.
    
    - **movie_id**: Movie ID
    """
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    # Get user's rating if exists
    user_rating = db.query(Rating).filter(
        Rating.user_id == current_user.id,
        Rating.movie_id == movie_id
    ).first()
    
    movie_dict = MovieResponse.from_orm(movie).dict()
    movie_dict['user_rating'] = user_rating.rating if user_rating else None
    
    return MovieResponse(**movie_dict)


@router.get("/popular/top", response_model=List[MovieResponse])
async def get_popular_movies(
    limit: int = Query(20, ge=1, le=100),
    min_ratings: int = Query(50, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get most popular movies (by rating count and average rating).
    
    - **limit**: Number of movies to return
    - **min_ratings**: Minimum number of ratings required
    """
    movies = db.query(Movie).filter(
        Movie.rating_count >= min_ratings
    ).order_by(
        Movie.rating_count.desc(),
        Movie.avg_rating.desc()
    ).limit(limit).all()
    
    # Get user's ratings
    movie_ids = [m.id for m in movies]
    user_ratings_dict = {}
    
    if movie_ids:
        user_ratings = db.query(Rating).filter(
            Rating.user_id == current_user.id,
            Rating.movie_id.in_(movie_ids)
        ).all()
        user_ratings_dict = {r.movie_id: r.rating for r in user_ratings}
    
    # Add user ratings
    movie_responses = []
    for movie in movies:
        movie_dict = MovieResponse.from_orm(movie).dict()
        movie_dict['user_rating'] = user_ratings_dict.get(movie.id)
        movie_responses.append(MovieResponse(**movie_dict))
    
    return movie_responses
