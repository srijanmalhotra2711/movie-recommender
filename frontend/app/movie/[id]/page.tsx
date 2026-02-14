'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { movieAPI, ratingAPI, recommendationAPI } from '@/lib/api';
import { MovieCard } from '@/components/movies/MovieCard';
import { useAuthStore } from '@/lib/store';
import { Movie } from '@/types';
import { searchTMDBMovie, getTMDBPosterUrl } from '@/lib/tmdb';

export default function MovieDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [backdropUrl, setBackdropUrl] = useState<string | null>(null);

  const movieId = parseInt(params.id as string);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchMovieDetails();
    fetchSimilarMovies();
  }, [movieId, isAuthenticated, router]);

  const fetchMovieDetails = async () => {
    try {
      setLoading(true);
      const response = await movieAPI.getMovie(movieId);
      const movieData = response.data;
      setMovie(movieData);
      setUserRating(movieData.user_rating || 0);

      if (!movieData.poster_path) {
        const tmdbMovie = await searchTMDBMovie(movieData.title, movieData.release_year);
        if (tmdbMovie?.poster_path) {
          setPosterUrl(getTMDBPosterUrl(tmdbMovie.poster_path, 'w500'));
          if (tmdbMovie.backdrop_path) {
            setBackdropUrl(`https://image.tmdb.org/t/p/original${tmdbMovie.backdrop_path}`);
          }
        }
      } else {
        setPosterUrl(movieData.poster_path);
      }
    } catch (error) {
      console.error('Error fetching movie:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarMovies = async () => {
    try {
      const response = await recommendationAPI.getSimilarMovies(movieId, 10);
      if (response.data.similar_movies) {
        const movies = response.data.similar_movies.map((item: any) => item.movie);
        setSimilarMovies(movies);
      }
    } catch (error) {
      console.error('Error fetching similar movies:', error);
    }
  };

  const handleRating = async (rating: number) => {
    try {
      await ratingAPI.rateMovie(movieId, rating);
      setUserRating(rating);
      fetchMovieDetails();
    } catch (error: any) {
      console.error('Error rating movie:', error);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const headerStyle = {
    background: '#18181b',
    borderBottom: '1px solid #27272a',
    padding: '16px',
    position: 'sticky' as const,
    top: 0,
    zIndex: 50,
  };

  const buttonStyle = {
    padding: '12px 24px',
    background: 'linear-gradient(to right, #dc2626, #991b1b)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
        <div style={{ 
          width: '60px', 
          height: '60px', 
          border: '4px solid #3f3f46',
          borderTop: '4px solid #dc2626',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
        <p style={{ color: '#9ca3af' }}>Movie not found</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000' }}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <header style={headerStyle}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 
            onClick={() => router.push('/browse')}
            style={{ fontSize: '28px', fontWeight: '900', color: '#dc2626', cursor: 'pointer', margin: 0 }}
          >
            CineMatch
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => router.push('/browse')} style={{ padding: '12px 24px', background: 'transparent', color: '#9ca3af', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
              Browse
            </button>
            <button onClick={() => router.push('/recommendations')} style={{ padding: '12px 24px', background: 'transparent', color: '#9ca3af', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
              Recommendations
            </button>
            <button onClick={() => router.push('/profile')} style={{ padding: '12px 24px', background: 'transparent', color: '#9ca3af', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
              Profile
            </button>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>
              Welcome, <span style={{ color: 'white' }}>{user?.username}</span>
            </span>
            <button onClick={handleLogout} style={buttonStyle}>Logout</button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div style={{ position: 'relative' }}>
        {backdropUrl && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '500px', overflow: 'hidden', zIndex: 0 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)', zIndex: 1 }}></div>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)', zIndex: 1 }}></div>
            <img src={backdropUrl} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
          </div>
        )}

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' }}>
          <button
            onClick={() => router.back()}
            style={{ padding: '12px 20px', background: 'rgba(24, 24, 27, 0.8)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', marginBottom: '30px', backdropFilter: 'blur(10px)' }}
          >
            ← Back
          </button>

          <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
            {/* Poster */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ 
                width: '280px', 
                height: '420px', 
                background: 'linear-gradient(135deg, #27272a, #18181b)', 
                borderRadius: '16px', 
                overflow: 'hidden',
                border: '2px solid #3f3f46',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8)'
              }}>
                {posterUrl ? (
                  <img src={posterUrl} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px' }}>
                    🎬
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '48px', fontWeight: 'bold', color: 'white', margin: '0 0 20px 0' }}>
                {movie.title}
              </h1>

              <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <div style={{ padding: '12px 20px', background: 'rgba(24, 24, 27, 0.8)', borderRadius: '10px', backdropFilter: 'blur(10px)' }}>
                  <span style={{ color: '#9ca3af', marginRight: '8px' }}>📅</span>
                  <span style={{ color: 'white', fontWeight: '600' }}>{movie.release_year || 'Unknown'}</span>
                </div>
                <div style={{ padding: '12px 20px', background: 'rgba(24, 24, 27, 0.8)', borderRadius: '10px', backdropFilter: 'blur(10px)' }}>
                  <span style={{ color: '#fbbf24', marginRight: '8px' }}>⭐</span>
                  <span style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>{movie.avg_rating?.toFixed(1)}</span>
                  <span style={{ color: '#9ca3af', fontSize: '14px' }}> /5</span>
                </div>
                <div style={{ padding: '12px 20px', background: 'rgba(24, 24, 27, 0.8)', borderRadius: '10px', backdropFilter: 'blur(10px)' }}>
                  <span style={{ color: '#3b82f6', marginRight: '8px' }}>👥</span>
                  <span style={{ color: 'white', fontWeight: '600' }}>{movie.rating_count} ratings</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
                {movie.genres?.map((genre) => (
                  <span 
                    key={genre.id} 
                    style={{ 
                      padding: '8px 16px', 
                      background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.2), rgba(153, 27, 27, 0.2))',
                      border: '1px solid rgba(220, 38, 38, 0.3)',
                      borderRadius: '20px',
                      fontSize: '14px',
                      color: '#fca5a5',
                      fontWeight: '500'
                    }}
                  >
                    {genre.name}
                  </span>
                ))}
              </div>

              {/* Rating Section */}
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(24, 24, 27, 0.9), rgba(39, 39, 42, 0.9))',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                padding: '30px',
                border: '1px solid #3f3f46'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🎯 Rate This Movie
                  </h3>
                  {userRating > 0 && (
                    <span style={{ 
                      padding: '8px 16px', 
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'white'
                    }}>
                      You rated: {userRating} ★
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{ 
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '48px',
                        transition: 'transform 0.2s',
                        padding: 0
                      }}
                    >
                      {star <= (hoverRating || userRating) ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
                <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '16px' }}>
                  {hoverRating > 0 
                    ? `Rate ${hoverRating} star${hoverRating > 1 ? 's' : ''}`
                    : userRating > 0 
                    ? 'Click to update your rating'
                    : 'Click stars to rate'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Movies */}
      {similarMovies.length > 0 && (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 20px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginBottom: '30px' }}>
            More Like This ({similarMovies.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
            {similarMovies.map((similar, index) => (
              <MovieCard key={`${similar.id}-${index}`} movie={similar} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}