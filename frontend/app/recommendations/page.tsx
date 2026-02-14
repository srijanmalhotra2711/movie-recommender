'use client';

import { useState, useEffect } from 'react';
import { recommendationAPI } from '@/lib/api';
import { MovieCard } from '@/components/movies/MovieCard';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Recommendation } from '@/types';

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [algorithm, setAlgorithm] = useState<'hybrid' | 'collaborative' | 'content' | 'adaptive'>('hybrid');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchRecommendations();
    fetchStats();
  }, [algorithm, isAuthenticated, router]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await recommendationAPI.getRecommendations(algorithm, 20);
      setRecommendations(response.data.recommendations || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await recommendationAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const algorithms = [
    { id: 'hybrid', name: 'Hybrid', desc: 'Best of both', icon: '✨' },
    { id: 'collaborative', name: 'Collaborative', desc: 'User similarity', icon: '📊' },
    { id: 'content', name: 'Content', desc: 'Movie features', icon: '🧠' },
    { id: 'adaptive', name: 'Adaptive', desc: 'Auto-select', icon: '⚡' },
  ];

  const userStats = stats?.user_stats || {};
  const genreCounts = userStats.favorite_genres || [];
  const topGenre = genreCounts.length > 0 ? genreCounts[0].genre : 'N/A';

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

  const statCardStyle = {
    background: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center' as const,
  };

  if (loading && !recommendations.length) {
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
          <p style={{ color: '#9ca3af', fontSize: '18px' }}>Generating recommendations...</p>
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
            <button 
              onClick={() => router.push('/browse')} 
              style={{ padding: '12px 24px', background: 'transparent', color: '#9ca3af', border: 'none', cursor: 'pointer', fontSize: '16px' }}
            >
              Browse
            </button>
            <button 
              style={{ ...buttonStyle, background: '#dc2626' }}
            >
              Recommendations
            </button>
            <button 
              onClick={() => router.push('/profile')} 
              style={{ padding: '12px 24px', background: 'transparent', color: '#9ca3af', border: 'none', cursor: 'pointer', fontSize: '16px' }}
            >
              Profile
            </button>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>
              Welcome, <span style={{ color: 'white' }}>{user?.username}</span>
            </span>
            <button onClick={handleLogout} style={buttonStyle}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '30px 20px' }}>
        {/* Title */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: 'white', margin: '0 0 10px 0' }}>
            Your Recommendations
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '18px', margin: 0 }}>
            Personalized movies picked just for you
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ background: '#18181b', borderRadius: '16px', padding: '30px', marginBottom: '40px', border: '1px solid #27272a' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🏆 Your Movie Profile
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div style={statCardStyle}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>❤️</div>
                <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 8px 0' }}>Total Ratings</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc2626', margin: 0 }}>
                  {userStats.rating_count || 0}
                </p>
              </div>

              <div style={statCardStyle}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>⭐</div>
                <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 8px 0' }}>Avg Rating</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#fbbf24', margin: 0 }}>
                  {userStats.avg_rating?.toFixed(1) || 'N/A'}
                </p>
              </div>

              <div style={statCardStyle}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎬</div>
                <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 8px 0' }}>Top Genre</p>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6', margin: 0 }}>
                  {topGenre}
                </p>
              </div>

              <div style={statCardStyle}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>✨</div>
                <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 8px 0' }}>Suggestions</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#a855f7', margin: 0 }}>
                  {recommendations.length}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Algorithm Selector */}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', marginBottom: '20px' }}>
            Choose Algorithm
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {algorithms.map((algo) => {
              const isActive = algorithm === algo.id;
              return (
                <button
                  key={algo.id}
                  onClick={() => setAlgorithm(algo.id as typeof algorithm)}
                  style={{
                    padding: '24px',
                    background: isActive ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' : '#18181b',
                    border: isActive ? '2px solid #dc2626' : '2px solid #27272a',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center' as const,
                  }}
                >
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>{algo.icon}</div>
                  <h4 style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', margin: '0 0 8px 0' }}>
                    {algo.name}
                  </h4>
                  <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
                    {algo.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', marginBottom: '20px' }}>
            For You {loading && <span style={{ fontSize: '14px', color: '#9ca3af', fontWeight: 'normal' }}>Updating...</span>}
          </h3>
          {recommendations.length === 0 ? (
            <div style={{ background: '#18181b', borderRadius: '16px', padding: '60px', textAlign: 'center', border: '1px solid #27272a' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>✨</div>
              <h4 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', margin: '0 0 12px 0' }}>
                No recommendations yet
              </h4>
              <p style={{ color: '#9ca3af', marginBottom: '24px' }}>
                Rate at least 5 movies to get personalized recommendations
              </p>
              <button onClick={() => router.push('/browse')} style={buttonStyle}>
                Browse Movies
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
              {recommendations.map((rec, index) => (
                <div key={`${rec.movie.id}-${index}`} style={{ position: 'relative' }}>
                  <MovieCard movie={rec.movie} />
                  {rec.score && (
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      padding: '6px 10px',
                      borderRadius: '20px',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                      zIndex: 30,
                    }}>
                      {(rec.score * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}