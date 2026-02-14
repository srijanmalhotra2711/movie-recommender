import numpy as np
import json
from sqlalchemy.orm import Session
from typing import List, Tuple, Dict
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
from app.models.database import Movie, Rating, Genre


class ContentBasedRecommender:
    """
    Content-based recommender using movie features (genres, descriptions).
    Recommends movies similar to ones the user has liked.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.model = None
        self.movie_embeddings = {}
        self.embedding_dim = 384  # Default for all-MiniLM-L6-v2
        
    def load_embedding_model(self):
        """Load sentence transformer model for generating embeddings"""
        if self.model is None:
            print("Loading sentence transformer model...")
            self.model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        return self.model
    
    def get_movie_feature_text(self, movie: Movie) -> str:
        """
        Generate a text representation of movie features for embedding.
        Combines title, genres, and overview.
        """
        parts = [movie.title]
        
        # Add genres
        if movie.genres:
            genre_names = [g.name for g in movie.genres]
            parts.append(" ".join(genre_names))
        
        # Add overview if available
        if movie.overview:
            parts.append(movie.overview)
        
        return " ".join(parts)
    
    def generate_movie_embeddings(self, force_regenerate: bool = False):
        """
        Generate embeddings for all movies in the database.
        Stores embeddings in the database for persistence.
        """
        movies = self.db.query(Movie).all()
        
        if not movies:
            return {}
        
        # Load model
        self.load_embedding_model()
        
        embeddings_generated = 0
        
        for movie in movies:
            # Skip if embedding already exists (unless forcing regeneration)
            if not force_regenerate and movie.content_embedding:
                try:
                    embedding = json.loads(movie.content_embedding)
                    self.movie_embeddings[movie.id] = np.array(embedding)
                    continue
                except (json.JSONDecodeError, ValueError):
                    pass
            
            # Generate embedding
            feature_text = self.get_movie_feature_text(movie)
            embedding = self.model.encode(feature_text, convert_to_numpy=True)
            
            # Store in memory
            self.movie_embeddings[movie.id] = embedding
            
            # Store in database
            movie.content_embedding = json.dumps(embedding.tolist())
            embeddings_generated += 1
            
            # Commit in batches
            if embeddings_generated % 100 == 0:
                self.db.commit()
                print(f"Generated {embeddings_generated} embeddings...")
        
        # Final commit
        self.db.commit()
        print(f"Total embeddings generated: {embeddings_generated}")
        
        return self.movie_embeddings
    
    def load_movie_embeddings(self):
        """Load movie embeddings from database into memory"""
        if self.movie_embeddings:
            return self.movie_embeddings
        
        movies = self.db.query(Movie).filter(Movie.content_embedding.isnot(None)).all()
        
        for movie in movies:
            try:
                embedding = json.loads(movie.content_embedding)
                self.movie_embeddings[movie.id] = np.array(embedding)
            except (json.JSONDecodeError, ValueError):
                continue
        
        return self.movie_embeddings
    
    def compute_similarity(self, movie_id1: int, movie_id2: int) -> float:
        """Compute cosine similarity between two movies"""
        if not self.movie_embeddings:
            self.load_movie_embeddings()
        
        if movie_id1 not in self.movie_embeddings or movie_id2 not in self.movie_embeddings:
            return 0.0
        
        emb1 = self.movie_embeddings[movie_id1].reshape(1, -1)
        emb2 = self.movie_embeddings[movie_id2].reshape(1, -1)
        
        similarity = cosine_similarity(emb1, emb2)[0][0]
        
        return float(similarity)
    
    def get_similar_movies(
        self,
        movie_id: int,
        n: int = 10,
        min_similarity: float = 0.3
    ) -> List[Tuple[int, float]]:
        """
        Find movies most similar to the given movie.
        Returns list of (movie_id, similarity_score) tuples.
        """
        if not self.movie_embeddings:
            self.load_movie_embeddings()
        
        if movie_id not in self.movie_embeddings:
            return []
        
        target_embedding = self.movie_embeddings[movie_id].reshape(1, -1)
        
        similarities = []
        
        for other_movie_id, other_embedding in self.movie_embeddings.items():
            if other_movie_id == movie_id:
                continue
            
            other_emb = other_embedding.reshape(1, -1)
            similarity = cosine_similarity(target_embedding, other_emb)[0][0]
            
            if similarity >= min_similarity:
                similarities.append((other_movie_id, float(similarity)))
        
        # Sort by similarity and return top N
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        return similarities[:n]
    
    def get_user_preference_profile(self, user_id: int, min_rating: float = 4.0) -> np.ndarray:
        """
        Build a user preference profile based on movies they've rated highly.
        Returns average embedding of liked movies.
        """
        if not self.movie_embeddings:
            self.load_movie_embeddings()
        
        # Get user's high ratings
        high_ratings = self.db.query(Rating).filter(
            Rating.user_id == user_id,
            Rating.rating >= min_rating
        ).all()
        
        if not high_ratings:
            return None
        
        # Collect embeddings of liked movies
        liked_embeddings = []
        
        for rating in high_ratings:
            if rating.movie_id in self.movie_embeddings:
                liked_embeddings.append(self.movie_embeddings[rating.movie_id])
        
        if not liked_embeddings:
            return None
        
        # Compute average embedding (user profile)
        user_profile = np.mean(liked_embeddings, axis=0)
        
        return user_profile
    
    def recommend(
        self,
        user_id: int,
        n: int = 10,
        min_similarity: float = 0.3
    ) -> List[Tuple[int, float]]:
        """
        Recommend movies based on user's preference profile.
        Returns list of (movie_id, similarity_score) tuples.
        """
        if not self.movie_embeddings:
            self.load_movie_embeddings()
        
        # Build user profile
        user_profile = self.get_user_preference_profile(user_id)
        
        if user_profile is None:
            return []
        
        # Get movies the user has already rated
        user_ratings = self.db.query(Rating).filter(Rating.user_id == user_id).all()
        rated_movie_ids = {r.movie_id for r in user_ratings}
        
        # Find similar movies to user profile
        user_profile_reshaped = user_profile.reshape(1, -1)
        
        recommendations = []
        
        for movie_id, movie_embedding in self.movie_embeddings.items():
            # Skip already rated movies
            if movie_id in rated_movie_ids:
                continue
            
            movie_emb = movie_embedding.reshape(1, -1)
            similarity = cosine_similarity(user_profile_reshaped, movie_emb)[0][0]
            
            if similarity >= min_similarity:
                recommendations.append((movie_id, float(similarity)))
        
        # Sort by similarity and return top N
        recommendations.sort(key=lambda x: x[1], reverse=True)
        
        return recommendations[:n]
    
    def get_recommendations_with_details(
        self,
        user_id: int,
        n: int = 10
    ) -> List[Tuple[Movie, float]]:
        """
        Get movie recommendations with full movie details.
        Returns list of (Movie, similarity_score) tuples.
        """
        recommendations = self.recommend(user_id, n=n)
        
        if not recommendations:
            return []
        
        # Fetch movie details
        results = []
        for movie_id, score in recommendations:
            movie = self.db.query(Movie).filter(Movie.id == movie_id).first()
            if movie:
                results.append((movie, score))
        
        return results
