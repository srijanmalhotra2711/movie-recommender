from sqlalchemy.orm import Session
from typing import List, Tuple, Dict
from app.models.database import Movie, Rating
from app.recommenders.collaborative import CollaborativeFilteringRecommender
from app.recommenders.content_based import ContentBasedRecommender
from app.config import settings


class HybridRecommender:
    """
    Hybrid recommender that combines collaborative and content-based filtering.
    Uses weighted average of scores from both methods.
    """
    
    def __init__(
        self,
        db: Session,
        collaborative_weight: float = None,
        content_weight: float = None
    ):
        self.db = db
        self.collaborative_weight = collaborative_weight or settings.COLLABORATIVE_WEIGHT
        self.content_weight = content_weight or settings.CONTENT_WEIGHT
        
        # Initialize both recommenders
        self.collaborative_recommender = CollaborativeFilteringRecommender(db)
        self.content_recommender = ContentBasedRecommender(db)
        
        # Normalize weights
        total = self.collaborative_weight + self.content_weight
        self.collaborative_weight /= total
        self.content_weight /= total
    
    def get_user_rating_count(self, user_id: int) -> int:
        """Get number of ratings a user has made"""
        return self.db.query(Rating).filter(Rating.user_id == user_id).count()
    
    def recommend(
        self,
        user_id: int,
        n: int = 10,
        algorithm: str = "hybrid"
    ) -> List[Tuple[Movie, float, str]]:
        """
        Get hybrid recommendations for a user.
        
        Args:
            user_id: User ID
            n: Number of recommendations to return
            algorithm: "hybrid", "collaborative", "content", or "adaptive"
        
        Returns:
            List of (Movie, score, reason) tuples where reason indicates
            which algorithm was used ("collaborative", "content", "hybrid")
        """
        user_rating_count = self.get_user_rating_count(user_id)
        
        # Cold start handling (user has too few ratings)
        if user_rating_count < settings.MIN_RATINGS_FOR_RECOMMENDATIONS:
            return self._recommend_popular(n)
        
        # Choose algorithm
        if algorithm == "adaptive":
            # Adaptive: Use content-based for new users, collaborative for experienced users
            if user_rating_count < 20:
                algorithm = "content"
            else:
                algorithm = "hybrid"
        
        # Get recommendations based on algorithm
        if algorithm == "collaborative":
            return self._recommend_collaborative(user_id, n)
        elif algorithm == "content":
            return self._recommend_content_based(user_id, n)
        else:  # hybrid
            return self._recommend_hybrid(user_id, n)
    
    def _recommend_collaborative(
        self,
        user_id: int,
        n: int
    ) -> List[Tuple[Movie, float, str]]:
        """Get recommendations using collaborative filtering only"""
        recommendations = self.collaborative_recommender.get_recommendations_with_details(
            user_id, n=n
        )
        
        return [(movie, score, "collaborative") for movie, score in recommendations]
    
    def _recommend_content_based(
        self,
        user_id: int,
        n: int
    ) -> List[Tuple[Movie, float, str]]:
        """Get recommendations using content-based filtering only"""
        recommendations = self.content_recommender.get_recommendations_with_details(
            user_id, n=n
        )
        
        return [(movie, score, "content-based") for movie, score in recommendations]
    
    def _recommend_hybrid(
        self,
        user_id: int,
        n: int
    ) -> List[Tuple[Movie, float, str]]:
        """Get recommendations using hybrid approach"""
        # Get recommendations from both methods
        collaborative_recs = self.collaborative_recommender.recommend(user_id, n=n*2)
        content_recs = self.content_recommender.recommend(user_id, n=n*2)
        
        # Create score dictionaries
        collab_scores = {movie_id: score for movie_id, score in collaborative_recs}
        content_scores = {movie_id: score for movie_id, score in content_recs}
        
        # Combine scores
        all_movie_ids = set(collab_scores.keys()) | set(content_scores.keys())
        
        hybrid_scores = []
        
        for movie_id in all_movie_ids:
            # Normalize scores to 0-1 range for combination
            collab_score = collab_scores.get(movie_id, 0) / 5.0  # Ratings are 0-5
            content_score = content_scores.get(movie_id, 0)  # Already 0-1 (cosine similarity)
            
            # Weighted combination
            hybrid_score = (
                self.collaborative_weight * collab_score +
                self.content_weight * content_score
            )
            
            hybrid_scores.append((movie_id, hybrid_score))
        
        # Sort by hybrid score
        hybrid_scores.sort(key=lambda x: x[1], reverse=True)
        
        # Get top N movies with details
        results = []
        for movie_id, score in hybrid_scores[:n]:
            movie = self.db.query(Movie).filter(Movie.id == movie_id).first()
            if movie:
                results.append((movie, score, "hybrid"))
        
        return results
    
    def _recommend_popular(self, n: int) -> List[Tuple[Movie, float, str]]:
        """
        Recommend popular movies (for cold start users).
        Returns movies with highest average ratings and enough rating counts.
        """
        movies = self.db.query(Movie).filter(
            Movie.rating_count >= 50  # Minimum ratings threshold
        ).order_by(
            Movie.avg_rating.desc()
        ).limit(n).all()
        
        # Return with popularity score (avg_rating) and reason
        return [(movie, movie.avg_rating / 5.0, "popular") for movie in movies]
    
    def evaluate_algorithm(
        self,
        user_id: int,
        algorithm: str,
        test_ratings: List[Rating]
    ) -> Dict[str, float]:
        """
        Evaluate recommendation algorithm using test ratings.
        Returns metrics like precision, recall, NDCG.
        
        This is useful for A/B testing different algorithms.
        """
        # Get recommendations
        recommendations = self.recommend(user_id, n=10, algorithm=algorithm)
        recommended_movie_ids = {movie.id for movie, _, _ in recommendations}
        
        # Get movies the user actually liked in test set
        liked_movie_ids = {
            rating.movie_id for rating in test_ratings
            if rating.rating >= 4.0
        }
        
        if not liked_movie_ids:
            return {"precision": 0.0, "recall": 0.0, "hit_rate": 0.0}
        
        # Calculate metrics
        hits = recommended_movie_ids & liked_movie_ids
        
        precision = len(hits) / len(recommended_movie_ids) if recommended_movie_ids else 0
        recall = len(hits) / len(liked_movie_ids) if liked_movie_ids else 0
        hit_rate = 1.0 if hits else 0.0
        
        return {
            "precision": precision,
            "recall": recall,
            "hit_rate": hit_rate,
            "num_recommendations": len(recommendations),
            "num_relevant": len(liked_movie_ids)
        }
