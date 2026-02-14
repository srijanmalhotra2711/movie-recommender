import requests
import zipfile
import os
import pandas as pd
from sqlalchemy.orm import Session
from app.models.database import Movie, Genre, Rating, User, movie_genres
from app.database import SessionLocal, engine, create_tables
from app.core.security import get_password_hash
import json


DATA_DIR = "backend/data"
MOVIELENS_URL = "https://files.grouplens.org/datasets/movielens/ml-latest-small.zip"
ZIP_FILE = os.path.join(DATA_DIR, "ml-latest-small.zip")
EXTRACTED_DIR = os.path.join(DATA_DIR, "ml-latest-small")


def download_movielens():
    """Download MovieLens dataset"""
    print("Downloading MovieLens dataset...")
    
    os.makedirs(DATA_DIR, exist_ok=True)
    
    if os.path.exists(ZIP_FILE):
        print("Dataset already downloaded.")
        return
    
    response = requests.get(MOVIELENS_URL, stream=True)
    response.raise_for_status()
    
    with open(ZIP_FILE, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    
    print("Download complete!")


def extract_movielens():
    """Extract MovieLens dataset"""
    print("Extracting dataset...")
    
    if os.path.exists(EXTRACTED_DIR):
        print("Dataset already extracted.")
        return
    
    with zipfile.ZipFile(ZIP_FILE, 'r') as zip_ref:
        zip_ref.extractall(DATA_DIR)
    
    print("Extraction complete!")


def load_genres(db: Session):
    """Load genres into database"""
    print("Loading genres...")
    
    movies_df = pd.read_csv(os.path.join(EXTRACTED_DIR, "movies.csv"))
    
    # Extract unique genres
    all_genres = set()
    for genres_str in movies_df['genres']:
        if pd.notna(genres_str) and genres_str != "(no genres listed)":
            genres = genres_str.split('|')
            all_genres.update(genres)
    
    # Insert genres
    genre_map = {}
    for genre_name in sorted(all_genres):
        genre = Genre(name=genre_name)
        db.add(genre)
        db.flush()
        genre_map[genre_name] = genre.id
    
    db.commit()
    print(f"Loaded {len(genre_map)} genres")
    
    return genre_map


def load_movies(db: Session, genre_map: dict):
    """Load movies into database"""
    print("Loading movies...")
    
    movies_df = pd.read_csv(os.path.join(EXTRACTED_DIR, "movies.csv"))
    
    movie_id_map = {}  # Map MovieLens IDs to our database IDs
    
    for _, row in movies_df.iterrows():
        # Extract year from title
        title = row['title']
        year = None
        if title.endswith(')') and '(' in title:
            try:
                year_str = title.split('(')[-1].replace(')', '')
                year = int(year_str)
                title = title[:title.rfind('(')].strip()
            except ValueError:
                pass
        
        movie = Movie(
            title=title,
            release_year=year
        )
        db.add(movie)
        db.flush()
        
        # Add genres
        if pd.notna(row['genres']) and row['genres'] != "(no genres listed)":
            genres = row['genres'].split('|')
            for genre_name in genres:
                if genre_name in genre_map:
                    # Insert into association table
                    db.execute(
                        movie_genres.insert().values(
                            movie_id=movie.id,
                            genre_id=genre_map[genre_name]
                        )
                    )
        
        movie_id_map[row['movieId']] = movie.id
    
    db.commit()
    print(f"Loaded {len(movie_id_map)} movies")
    
    return movie_id_map


def create_demo_users(db: Session, num_users: int = 10):
    """Create demo users"""
    print(f"Creating {num_users} demo users...")
    
    user_map = {}
    
    for i in range(1, num_users + 1):
        user = User(
            email=f"user{i}@demo.com",
            username=f"user{i}",
            hashed_password=get_password_hash("password123")
        )
        db.add(user)
        db.flush()
        user_map[i] = user.id
    
    db.commit()
    print(f"Created {len(user_map)} demo users")
    
    return user_map


def load_ratings(db: Session, movie_id_map: dict, user_map: dict):
    """Load ratings into database"""
    print("Loading ratings...")
    
    ratings_df = pd.read_csv(os.path.join(EXTRACTED_DIR, "ratings.csv"))
    
    # Map MovieLens user IDs to our demo users (distribute evenly)
    unique_ml_users = ratings_df['userId'].unique()
    ml_user_to_our_user = {}
    
    for idx, ml_user_id in enumerate(unique_ml_users):
        our_user_id = (idx % len(user_map)) + 1
        ml_user_to_our_user[ml_user_id] = user_map[our_user_id]
    
    # Load ratings in batches
    batch_size = 1000
    ratings_loaded = 0
    
    for i in range(0, len(ratings_df), batch_size):
        batch = ratings_df.iloc[i:i+batch_size]
        
        for _, row in batch.iterrows():
            ml_movie_id = row['movieId']
            ml_user_id = row['userId']
            
            # Skip if movie wasn't loaded
            if ml_movie_id not in movie_id_map:
                continue
            
            rating = Rating(
                user_id=ml_user_to_our_user[ml_user_id],
                movie_id=movie_id_map[ml_movie_id],
                rating=row['rating']
            )
            db.add(rating)
            ratings_loaded += 1
        
        db.commit()
        print(f"Loaded {ratings_loaded} ratings...")
    
    print(f"Total ratings loaded: {ratings_loaded}")


def update_movie_stats(db: Session):
    """Update average ratings and rating counts for movies"""
    print("Updating movie statistics...")
    
    movies = db.query(Movie).all()
    
    for movie in movies:
        ratings = db.query(Rating).filter(Rating.movie_id == movie.id).all()
        
        if ratings:
            movie.rating_count = len(ratings)
            movie.avg_rating = sum(r.rating for r in ratings) / len(ratings)
        else:
            movie.rating_count = 0
            movie.avg_rating = 0.0
    
    db.commit()
    print("Movie statistics updated!")


def main():
    """Main function to load all data"""
    print("Starting MovieLens data loading process...")
    
    # Download and extract
    download_movielens()
    extract_movielens()
    
    # Create tables
    print("Creating database tables...")
    create_tables()
    
    # Get database session
    db = SessionLocal()
    
    try:
        # Check if data already loaded
        existing_movies = db.query(Movie).count()
        if existing_movies > 0:
            print(f"Database already contains {existing_movies} movies. Skipping data load.")
            print("To reload data, drop the database and run this script again.")
            return
        
        # Load data
        genre_map = load_genres(db)
        movie_id_map = load_movies(db, genre_map)
        user_map = create_demo_users(db, num_users=10)
        load_ratings(db, movie_id_map, user_map)
        update_movie_stats(db)
        
        print("\n" + "="*50)
        print("Data loading complete!")
        print("="*50)
        print(f"Genres: {len(genre_map)}")
        print(f"Movies: {len(movie_id_map)}")
        print(f"Users: {len(user_map)}")
        print(f"Ratings: {db.query(Rating).count()}")
        print("\nDemo user credentials:")
        print("Username: user1 to user10")
        print("Password: password123")
        print("="*50)
        
    except Exception as e:
        print(f"Error loading data: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
