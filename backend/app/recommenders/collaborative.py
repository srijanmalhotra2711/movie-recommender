import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from typing import List, Tuple
from sklearn.metrics.pairwise import cosine_similarity
from app.models.database import Rating, Movie, User


class CollaborativeFilteringRecommender:
    """
    Collaborative filtering recommender using user-based approach.
    Finds similar users based on rating patterns and recommends movies they liked.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.user_item_matrix = None
        self.user_similarity_matrix = None
        self.user_ids = None
        self.movie_ids = None
        
    def build_user_item_matrix(self):
        """Build user-item rating matrix"""
        # Get all ratings
        ratings = self.db.query(Rating).all()
        
        if not ratings:
            return None
        
        # Create DataFrame
        ratings_data = [
            {"user_id": r.user_id, "movie_id": r.movie_id, "rating": r.rating}
            for r in ratings
        ]
        df = pd.DataFrame(ratings_data)
        
        # Create pivot table (user-item matrix)
        self.user_item_matrix = df.pivot_table(
            index='user_id',
            columns='movie_id',
            values='rating',
            fill_value=0
        )
        
        self.user_ids = self.user_item_matrix.index.tolist()
        self.movie_ids = self.user_item_matrix.columns.tolist()
        
        return self.user_item_matrix
    
    def compute_user_similarity(self):
        """Compute user similarity matrix using cosine similarity"""
        if self.user_item_matrix is None:
            self.build_user_item_matrix()
        
        if self.user_item_matrix is None:
            return None
        
        # Compute cosine similarity between users
        self.user_similarity_matrix = cosine_similarity(self.user_item_matrix)
        
        return self.user_similarity_matrix
    
    def get_similar_users(self, user_id: int, n: int = 10) -> List[Tuple[int, float]]:
        """
        Get top N most similar users to the given user.
        Returns list of (user_id, similarity_score) tuples.
        """
        if self.user_similarity_matrix is None:
            self.compute_user_similarity()
        
        if self.user_similarity_matrix is None:
            return []
        
        try:
            user_idx = self.user_ids.index(user_id)
        except ValueError:
            return []
        
        # Get similarity scores for this user
        similarities = self.user_similarity_matrix[user_idx]
        
        # Get indices of most similar users (excluding self)
        similar_indices = np.argsort(similarities)[::-1][1:n+1]
        
        # Return user IDs and similarity scores
        similar_users = [
            (self.user_ids[idx], similarities[idx])
            for idx in similar_indices
        ]
        
        return similar_users
    
    def predict_rating(self, user_id: int, movie_id: int, k: int = 10) -> float:
        """
        Predict rating for a user-movie pair using k nearest neighbors.
        Returns predicted rating or 0 if prediction cannot be made.
        """
        if self.user_item_matrix is None:
            self.build_user_item_matrix()
        
        if self.user_item_matrix is None:
            return 0.0
        
        # Check if user and movie exist in matrix
        if user_id not in self.user_ids or movie_id not in self.movie_ids:
            return 0.0
        
        # Get similar users
        similar_users = self.get_similar_users(user_id, n=k)
        
        if not similar_users:
            return 0.0
        
        # Compute weighted average of similar users' ratings
        weighted_sum = 0.0
        similarity_sum = 0.0
        
        for similar_user_id, similarity in similar_users:
            try:
                rating = self.user_item_matrix.loc[similar_user_id, movie_id]
                
                if rating > 0:  # User has rated this movie
                    weighted_sum += similarity * rating
                    similarity_sum += similarity
            except KeyError:
                continue
        
        if similarity_sum == 0:
            return 0.0
        
        predicted_rating = weighted_sum / similarity_sum
        
        # Clip to valid rating range
        return max(0.5, min(5.0, predicted_rating))
    
    def recommend(
        self,
        user_id: int,
        n: int = 10,
        min_rating_threshold: float = 3.5
    ) -> List[Tuple[int, float]]:
        """
        Recommend top N movies for a user.
        Returns list of (movie_id, predicted_rating) tuples.
        """
        if self.user_item_matrix is None:
            self.build_user_item_matrix()
        
        if self.user_item_matrix is None:
            return []
        
        # Check if user exists
        if user_id not in self.user_ids:
            return []
        
        # Get movies the user hasn't rated
        user_rated_movies = set(
            self.user_item_matrix.loc[user_id][
                self.user_item_matrix.loc[user_id] > 0
            ].index.tolist()
        )
        
        unrated_movies = [m for m in self.movie_ids if m not in user_rated_movies]
        
        if not unrated_movies:
            return []
        
        # Predict ratings for unrated movies
        predictions = []
        
        for movie_id in unrated_movies:
            predicted_rating = self.predict_rating(user_id, movie_id)
            
            if predicted_rating >= min_rating_threshold:
                predictions.append((movie_id, predicted_rating))
        
        # Sort by predicted rating and return top N
        predictions.sort(key=lambda x: x[1], reverse=True)
        
        return predictions[:n]
    
    def get_recommendations_with_details(
        self,
        user_id: int,
        n: int = 10
    ) -> List[Tuple[Movie, float]]:
        """
        Get movie recommendations with full movie details.
        Returns list of (Movie, predicted_rating) tuples.
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
