'use client';

import { useState, useEffect } from 'react';
import { movieAPI } from '@/lib/api';
import { MovieCard } from '@/components/movies/MovieCard';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Movie } from '@/types';

interface GenreStats {
  name: string;
  count: number;
  totalRating: number;
}

export default function TrendingPage() {
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [popularGenres, setPopularGenres] = useState<GenreStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchTrendingData();
  }, [isAuthenticated, router]);

  const fetchTrendingData = async () => {
    try {
      setLoading(true);
      
      const response = await movieAPI.getMovies(1, 100);
      const allMovies = response.data.movies || [];
      
      const trending = [...allMovies]
        .sort((a, b) => (b.rating_count || 0) - (a.rating_count || 0))
        .slice(0, 20);
      setTrendingMovies(trending);
      
      const topRated = [...allMovies]
        .filter(m => (m.rating_count || 0) >= 10 && (m.avg_rating || 0) >= 4.0)
        .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))
        .slice(0, 20);
      setTopRatedMovies(topRated);
      
      const genreMap = new Map<string, GenreStats>();
      allMovies.forEach((movie: Movie) => {
        if (movie.genres && Array.isArray(movie.genres)) {
          movie.genres.forEach(genre => {
            if (genre && genre.name) {
              const current = genreMap.get(genre.name) || { 
                name: genre.name, 
                count: 0, 
                totalRating: 0 
              };
              genreMap.set(genre.name, {
                name: genre.name,
                count: current.count + (movie.rating_count || 0),
                totalRating: current.totalRating + (movie.avg_rating || 0)
              });
            }
          });
        }
      });
      
      const genres = Array.from(genreMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      setPopularGenres(genres);
      
    } catch (error) {
      console.error('Error fetching trending:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const headerStyle: React.CSSProperties = {
    background: '#18181b',
    borderBottom: '1px solid #27272a',
    padding: '16px',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  };

  const buttonStyle: React.CSSProperties = {
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
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            border: '4px solid #3f3f46',
            borderTop: '4px solid #dc2626',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: '#9ca3af' }}>Loading trending movies...</p>
        </div>
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
            <button style={{ ...buttonStyle, background: '#dc2626' }}>
              Trending
            </button>
            <button onClick={() => router.push('/analytics')} style={{ padding: '12px 24px', background: 'transparent', color: '#9ca3af', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
              Analytics
            </button>
            <button onClick={() => router.push('/ab-testing')} style={{ padding: '12px 24px', background: 'transparent', color: '#9ca3af', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
              A/B Testing
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

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '30px 20px' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
          borderRadius: '20px',
          padding: '60px 40px',
          marginBottom: '50px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(220, 38, 38, 0.3)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔥</div>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', color: 'white', margin: '0 0 16px 0' }}>
            What's Hot Right Now
          </h1>
          <p style={{ fontSize: '20px', color: 'rgba(255, 255, 255, 0.9)', margin: 0 }}>
            Discover the most popular movies everyone's watching
          </p>
        </div>

        <div style={{ marginBottom: '50px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '36px' }}>🎭</span> Popular Genres
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {popularGenres.map((genre, index) => {
              const colors = [
                'linear-gradient(135deg, #3b82f6, #2563eb)',
                'linear-gradient(135deg, #a855f7, #9333ea)',
                'linear-gradient(135deg, #10b981, #059669)',
                'linear-gradient(135deg, #f59e0b, #d97706)',
                'linear-gradient(135deg, #ef4444, #dc2626)',
                'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                'linear-gradient(135deg, #ec4899, #db2777)',
                'linear-gradient(135deg, #06b6d4, #0891b2)',
                'linear-gradient(135deg, #84cc16, #65a30d)',
                'linear-gradient(135deg, #f97316, #ea580c)',
              ];
              return (
                <div key={genre.name} style={{
                  background: colors[index % colors.length],
                  padding: '24px',
                  borderRadius: '16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', margin: '0 0 8px 0' }}>
                    {genre.name}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>
                    {genre.count} ratings
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: '50px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '36px' }}>🔥</span> Trending Now
            <span style={{ fontSize: '18px', color: '#9ca3af', fontWeight: 'normal' }}>Most rated movies</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
            {trendingMovies.map((movie, index) => (
              <div key={movie.id} style={{ position: 'relative' }}>
                <MovieCard movie={movie} />
                {index < 3 && (
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    left: '-8px',
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    padding: '8px 12px',
                    borderRadius: '50%',
                    boxShadow: '0 4px 12px rgba(251, 191, 36, 0.5)',
                    zIndex: 30,
                  }}>
                    #{index + 1}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '50px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '36px' }}>⭐</span> Top Rated
            <span style={{ fontSize: '18px', color: '#9ca3af', fontWeight: 'normal' }}>4+ stars with 10+ ratings</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
            {topRatedMovies.map(movie => (
              <div key={movie.id} style={{ position: 'relative' }}>
                <MovieCard movie={movie} />
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  padding: '6px 10px',
                  borderRadius: '20px',
                  boxShadow: '0 4px 12px rgba(251, 191, 36, 0.5)',
                  zIndex: 30,
                }}>
                  {movie.avg_rating?.toFixed(1)} ⭐
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}