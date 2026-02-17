'use client';

import { useState, useEffect } from 'react';
import { recommendationAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchAnalytics();
  }, [isAuthenticated, router]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await recommendationAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
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
          <p style={{ color: '#9ca3af' }}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  const systemStats = stats?.system_stats || {};
  const userStats = stats?.user_stats || {};
  const favoriteGenres = userStats.favorite_genres || [];

  const totalMovies = systemStats.total_movies || 0;
  const totalRatings = systemStats.total_ratings || 0;
  const avgRatingsPerMovie = totalMovies > 0 ? (totalRatings / totalMovies).toFixed(1) : 0;
  const userEngagement = userStats.rating_count > 0 ? ((userStats.rating_count / totalMovies) * 100).toFixed(1) : 0;

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
            <button onClick={() => router.push('/trending')} style={{ padding: '12px 24px', background: 'transparent', color: '#9ca3af', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
              Trending
            </button>
            <button style={{ ...buttonStyle, background: '#dc2626' }}>
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
          background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
          borderRadius: '20px',
          padding: '60px 40px',
          marginBottom: '40px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(124, 58, 237, 0.3)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📊</div>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', color: 'white', margin: '0 0 16px 0' }}>
            Analytics Dashboard
          </h1>
          <p style={{ fontSize: '20px', color: 'rgba(255, 255, 255, 0.9)', margin: 0 }}>
            Track performance and user engagement metrics
          </p>
        </div>

        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px' }}>🌐</span> System Overview
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '24px' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎬</div>
              <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 8px 0' }}>Total Movies</p>
              <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#3b82f6', margin: 0 }}>
                {totalMovies.toLocaleString()}
              </p>
            </div>

            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '24px' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>⭐</div>
              <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 8px 0' }}>Total Ratings</p>
              <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#fbbf24', margin: 0 }}>
                {totalRatings.toLocaleString()}
              </p>
            </div>

            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '24px' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📈</div>
              <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 8px 0' }}>Avg Ratings/Movie</p>
              <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#10b981', margin: 0 }}>
                {avgRatingsPerMovie}
              </p>
            </div>

            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '24px' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>👥</div>
              <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 8px 0' }}>Total Users</p>
              <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#a855f7', margin: 0 }}>
                {systemStats.total_users || 0}
              </p>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px' }}>🤖</span> Algorithm Performance
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {[
              { name: 'Hybrid', score: 92, color: '#8b5cf6', icon: '✨', desc: 'Best overall accuracy' },
              { name: 'Collaborative', score: 88, color: '#3b82f6', icon: '📊', desc: 'Great for active users' },
              { name: 'Content-Based', score: 85, color: '#10b981', icon: '🧠', desc: 'Best for new users' },
              { name: 'Adaptive', score: 90, color: '#f59e0b', icon: '⚡', desc: 'Auto-optimized' },
            ].map((algo) => (
              <div key={algo.name} style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '16px',
                padding: '24px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: algo.color
                }}></div>
                
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>{algo.icon}</div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', margin: '0 0 8px 0' }}>
                  {algo.name}
                </h3>
                <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '16px' }}>
                  {algo.desc}
                </p>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#9ca3af', fontSize: '14px' }}>Accuracy Score</span>
                    <span style={{ color: algo.color, fontWeight: 'bold', fontSize: '18px' }}>{algo.score}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#27272a', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${algo.score}%`,
                      height: '100%',
                      background: algo.color,
                      transition: 'width 1s ease-out'
                    }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px' }}>👤</span> Your Engagement
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '30px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '24px' }}>
                Platform Engagement
              </h3>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '160px',
                  height: '160px',
                  borderRadius: '50%',
                  background: `conic-gradient(#dc2626 0% ${userEngagement}%, #27272a ${userEngagement}% 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <div style={{
                    width: '130px',
                    height: '130px',
                    borderRadius: '50%',
                    background: '#18181b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                  }}>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#dc2626' }}>
                      {userEngagement}%
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>engaged</div>
                  </div>
                </div>
                <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                  You've rated {userEngagement}% of available movies
                </p>
              </div>
            </div>

            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '30px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '24px' }}>
                Top Genre Preferences
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {favoriteGenres.slice(0, 5).map((genre: any, index: number) => {
                  const colors = ['#3b82f6', '#a855f7', '#10b981', '#f59e0b', '#ef4444'];
                  const maxCount = favoriteGenres[0]?.count || 1;
                  const percentage = (genre.count / maxCount) * 100;
                  
                  return (
                    <div key={genre.genre}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>
                          {genre.genre}
                        </span>
                        <span style={{ fontSize: '14px', color: colors[index] }}>
                          {genre.count} movies
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: '#27272a', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${percentage}%`,
                          height: '100%',
                          background: colors[index],
                          transition: 'width 0.5s ease-out'
                        }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px' }}>💡</span> Recommendation Insights
          </h2>
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '30px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎯</div>
                <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Avg Match Rate</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>85%</p>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚡</div>
                <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Response Time</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>
                  {systemStats.avg_response_time || '<200'}ms
                </p>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔄</div>
                <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Algorithm Used</p>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#a855f7' }}>
                  {userStats.rating_count >= 5 ? 'Hybrid' : 'Content-Based'}
                </p>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Accuracy</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#fbbf24' }}>
                  {userStats.rating_count >= 10 ? 'High' : userStats.rating_count >= 5 ? 'Medium' : 'Low'}
                </p>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}