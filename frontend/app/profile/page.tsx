'use client';

import { useState, useEffect } from 'react';
import { recommendationAPI, ratingAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [stats, setStats] = useState<any>(null);
  const [userRatings, setUserRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchProfileData();
  }, [isAuthenticated, router]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const statsResponse = await recommendationAPI.getStats();
      setStats(statsResponse.data);

      try {
        const ratingsResponse = await ratingAPI.getUserRatings();
        setUserRatings(ratingsResponse.data || []);
      } catch (error) {
        console.log('Could not fetch ratings');
        setUserRatings([]);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
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

  const statCardStyle = {
    background: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '12px',
    padding: '24px',
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
          <p style={{ color: '#9ca3af' }}>Loading your profile...</p>
        </div>
      </div>
    );
  }

  const userStats = stats?.user_stats || {};
  const systemStats = stats?.system_stats || {};
  const favoriteGenres = userStats.favorite_genres || [];
  
  const ratingDistribution = [0, 0, 0, 0, 0];
  userRatings.forEach((r: any) => {
    if (r.rating >= 1 && r.rating <= 5) {
      ratingDistribution[r.rating - 1]++;
    }
  });

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
        {/* Profile Header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              background: 'linear-gradient(135deg, #dc2626, #991b1b)', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px'
            }}>
              👤
            </div>
            <div>
              <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: 'white', margin: '0 0 8px 0' }}>
                {user?.username}
              </h2>
              <p style={{ color: '#9ca3af', fontSize: '16px', margin: 0 }}>
                Movie Enthusiast • Member since {user?.email || 'Recently'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ fontSize: '28px' }}>❤️</div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'white', margin: 0 }}>Total Ratings</h3>
            </div>
            <p style={{ fontSize: '40px', fontWeight: 'bold', color: '#dc2626', margin: '0 0 8px 0' }}>
              {userStats.rating_count || 0}
            </p>
            <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>movies rated</p>
          </div>

          <div style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ fontSize: '28px' }}>⭐</div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'white', margin: 0 }}>Average Rating</h3>
            </div>
            <p style={{ fontSize: '40px', fontWeight: 'bold', color: '#fbbf24', margin: '0 0 8px 0' }}>
              {userStats.avg_rating?.toFixed(1) || 'N/A'}
            </p>
            <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>out of 5 stars</p>
          </div>

          <div style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ fontSize: '28px' }}>🎬</div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'white', margin: 0 }}>Top Genre</h3>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6', margin: '0 0 8px 0' }}>
              {favoriteGenres[0]?.genre || 'N/A'}
            </p>
            <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
              {favoriteGenres[0]?.count || 0} movies
            </p>
          </div>

          <div style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ fontSize: '28px' }}>📊</div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'white', margin: 0 }}>Activity</h3>
            </div>
            <p style={{ fontSize: '40px', fontWeight: 'bold', color: '#10b981', margin: '0 0 8px 0' }}>
              {Math.round((userStats.rating_count / systemStats.total_movies) * 100) || 0}%
            </p>
            <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>database explored</p>
          </div>
        </div>

        {/* Charts Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          {/* Rating Distribution */}
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '30px' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📊 Rating Distribution
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = ratingDistribution[stars - 1];
                const percentage = userStats.rating_count > 0 ? (count / userStats.rating_count) * 100 : 0;
                return (
                  <div key={stars}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '600', color: 'white' }}>{stars}</span>
                        <span style={{ color: '#fbbf24' }}>⭐</span>
                      </div>
                      <span style={{ fontSize: '14px', color: '#9ca3af' }}>
                        {count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#27272a', borderRadius: '4px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${percentage}%`, 
                          height: '100%', 
                          background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
                          transition: 'width 0.3s'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Genres */}
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '30px' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🏆 Top Genres
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {favoriteGenres.slice(0, 5).map((genre: any, index: number) => {
                const maxCount = favoriteGenres[0]?.count || 1;
                const percentage = (genre.count / maxCount) * 100;
                const colors = [
                  'linear-gradient(to right, #3b82f6, #2563eb)',
                  'linear-gradient(to right, #a855f7, #9333ea)',
                  'linear-gradient(to right, #10b981, #059669)',
                  'linear-gradient(to right, #f59e0b, #d97706)',
                  'linear-gradient(to right, #ef4444, #dc2626)',
                ];
                return (
                  <div key={genre.genre}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '16px', fontWeight: '600', color: 'white' }}>{genre.genre}</span>
                      <span style={{ fontSize: '14px', color: '#9ca3af' }}>{genre.count} movies</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#27272a', borderRadius: '4px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${percentage}%`, 
                          height: '100%', 
                          background: colors[index],
                          transition: 'width 0.3s'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Ratings */}
        {userRatings.length > 0 && (
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '30px 30px 0 30px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📅 Recent Ratings ({userRatings.length})
              </h3>
            </div>
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#0f172a', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '16px 30px', fontSize: '14px', fontWeight: '600', color: '#9ca3af' }}>Movie</th>
                    <th style={{ textAlign: 'left', padding: '16px 30px', fontSize: '14px', fontWeight: '600', color: '#9ca3af' }}>Your Rating</th>
                    <th style={{ textAlign: 'left', padding: '16px 30px', fontSize: '14px', fontWeight: '600', color: '#9ca3af' }}>Avg Rating</th>
                    <th style={{ textAlign: 'left', padding: '16px 30px', fontSize: '14px', fontWeight: '600', color: '#9ca3af' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {userRatings.slice(0, 20).map((rating: any) => (
                    <tr 
                      key={rating.id}
                      onClick={() => router.push(`/movie/${rating.movie_id}`)}
                      style={{ 
                        borderTop: '1px solid #27272a',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#27272a'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '20px 30px' }}>
                        <div style={{ fontWeight: '600', color: 'white', marginBottom: '4px' }}>
                          {rating.movie?.title || 'Unknown Movie'}
                        </div>
                        <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                          {rating.movie?.release_year || 'N/A'}
                        </div>
                      </td>
                      <td style={{ padding: '20px 30px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: '#fbbf24' }}>⭐</span>
                          <span style={{ fontWeight: '700', color: 'white', fontSize: '18px' }}>{rating.rating}</span>
                        </div>
                      </td>
                      <td style={{ padding: '20px 30px' }}>
                        <span style={{ color: '#9ca3af' }}>{rating.movie?.avg_rating?.toFixed(1) || 'N/A'}</span>
                      </td>
                      <td style={{ padding: '20px 30px', fontSize: '14px', color: '#9ca3af' }}>
                        {rating.created_at ? new Date(rating.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}