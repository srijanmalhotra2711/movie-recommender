export interface Movie {
    id: number;
    title: string;
    release_year: number | null;
    overview: string | null;
    poster_path: string | null;
    avg_rating: number;
    rating_count: number;
    genres: Genre[];
    user_rating: number | null;
  }
  
  export interface Genre {
    id: number;
    name: string;
  }
  
  export interface Rating {
    id: number;
    user_id: number;
    movie_id: number;
    rating: number;
    created_at: string;
    movie: Movie;
  }
  
  export interface Recommendation {
    movie: Movie;
    score: number;
    reason: string;
  }
  
  export interface User {
    id: number;
    username: string;
    email: string;
    created_at: string;
  }
  
  export interface RecommendationStats {
    total_ratings: number;
    avg_rating: number;
    favorite_genres: string[];
    rating_distribution: Record<string, number>;
  }