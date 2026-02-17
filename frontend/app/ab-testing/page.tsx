'use client';

import { useState, useEffect } from 'react';
import { recommendationAPI } from '@/lib/api';
import { MovieCard } from '@/components/movies/MovieCard';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Recommendation } from '@/types';

type Algorithm = 'hybrid' | 'collaborative' | 'content' | 'adaptive';

export default function ABTestingPage() {
  const [algorithmA, setAlgorithmA] = useState<Algorithm>('hybrid');
  const [algorithmB, setAlgorithmB] = useState<Algorithm>('collaborative');
  const [recommendationsA, setRecommendationsA] = useState<Recommendation[]>([]);
  const [recommendationsB, setRecommendationsB] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [winner, setWinner] = useState<'A' | 'B' | null>(null);
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  const algorithms: { id: Algorithm; name: string; icon: string; desc: string }[] = [
    { id: 'hybrid', name: 'Hybrid', icon: '✨', desc: 'Combines collaborative + content' },
    { id: 'collaborative', name: 'Collaborative', icon: '📊', desc: 'Based on similar users' },
    { id: 'content', name: 'Content-Based', icon: '🧠', desc: 'Based on movie features' },
    { id: 'adaptive', name: 'Adaptive', icon: '⚡', desc: 'Auto-selects best algorithm' },
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  const runTest = async () => {
    if (algorithmA === algorithmB) {
      alert('Please select two different algorithms to compare!');
      return;
    }

    setLoading(true);
    setWinner(null);
    
    try {
      const [responseA, responseB] = await Promise.all([
        recommendationAPI.getRecommendations(algorithmA, 10),
        recommendationAPI.getRecommendations(algorithmB, 10),
      ]);

      setRecommendationsA(responseA.data.recommendations || []);
      setRecommendationsB(responseB.data.recommendations || []);
    } catch (error) {
      console.error('Error running A/B test:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (recommendations: Recommendation[]) => {
    if (recommendations.length === 0) return { avgScore: 0, diversity: 0, coverage: 0 };

    const avgScore = recommendations.reduce((sum, rec) => sum + (rec.score || 0), 0) / recommendations.length;
    
    const genres = new Set();
    recommendations.forEach(rec => {
      rec.movie.genres?.forEach(g => genres.add(g.name));
    });
    const diversity = genres.size;

    const uniqueMovies = new Set(recommendations.map(rec => rec.movie.id));
    const coverage = uniqueMovies.size;

    return { avgScore, diversity, coverage };
  };

  const metricsA = calculateMetrics(recommendationsA);
  const metricsB = calculateMetrics(recommendationsB);

  const declareWinner = () => {
    const scoreA = metricsA.avgScore * 0.6 + metricsA.diversity * 0.2 + metricsA.coverage * 0.2;
    const scoreB = metricsB.avgScore * 0.6 + metricsB.diversity * 0.2 + metricsB.coverage * 0.2;
    
    setWinner(scoreA > scoreB ? 'A' : 'B');
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

  return (
    <div style={{ minHeight: '100vh', background: '#000' }}>
      {/* Header */}
      <header style={headerStyle}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
            <button onClick={() => router.push('/analytics')} style={{ padding: '12px 24px', background: 'transparent', color: '#9ca3af', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
              Analytics
            </button>
            <button style={{ ...buttonStyle, background: '#dc2626' }}>
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

      <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '30px 20px' }}>
        {/* Hero */}
        <div style={{ 
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          borderRadius: '20px',
          padding: '60px 40px',
          marginBottom: '40px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(245, 158, 11, 0.3)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🧪</div>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', color: 'white', margin: '0 0 16px 0' }}>
            A/B Testing Lab
          </h1>
          <p style={{ fontSize: '20px', color: 'rgba(255, 255, 255, 0.9)', margin: 0 }}>
            Compare recommendation algorithms side-by-side
          </p>
        </div>

        {/* Algorithm Selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '24px', marginBottom: '40px', alignItems: 'center' }}>
          {/* Algorithm A */}
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', marginBottom: '16px', textAlign: 'center' }}>
              Algorithm A
            </h3>
            <select
              value={algorithmA}
              onChange={(e) => setAlgorithmA(e.target.value as Algorithm)}
              style={{ width: '100%', padding: '16px', background: '#18181b', border: '2px solid #3f3f46', borderRadius: '12px', color: 'white', fontSize: '16px', outline: 'none' }}
            >
              {algorithms.map(algo => (
                <option key={algo.id} value={algo.id}>{algo.icon} {algo.name} - {algo.desc}</option>
              ))}
            </select>
          </div>

          {/* VS */}
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#dc2626', padding: '0 20px' }}>
            VS
          </div>

          {/* Algorithm B */}
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', marginBottom: '16px', textAlign: 'center' }}>
              Algorithm B
            </h3>
            <select
              value={algorithmB}
              onChange={(e) => setAlgorithmB(e.target.value as Algorithm)}
              style={{ width: '100%', padding: '16px', background: '#18181b', border: '2px solid #3f3f46', borderRadius: '12px', color: 'white', fontSize: '16px', outline: 'none' }}
            >
              {algorithms.map(algo => (
                <option key={algo.id} value={algo.id}>{algo.icon} {algo.name} - {algo.desc}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Run Test Button */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <button
            onClick={runTest}
            disabled={loading}
            style={{ ...buttonStyle, fontSize: '18px', padding: '16px 48px', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '🔬 Running Test...' : '▶️ Run A/B Test'}
          </button>
        </div>

        {/* Results */}
        {(recommendationsA.length > 0 || recommendationsB.length > 0) && (
          <>
            {/* Metrics Comparison */}
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '30px', marginBottom: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', margin: 0 }}>
                  📊 Performance Metrics
                </h3>
                <button onClick={declareWinner} style={{ ...buttonStyle, padding: '10px 20px' }}>
                  🏆 Declare Winner
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '32px' }}>
                {/* Algorithm A Metrics */}
                <div>
                  <div style={{ background: winner === 'A' ? '#10b981' : '#27272a', padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
                    <h4 style={{ color: 'white', fontSize: '18px', marginBottom: '16px', textAlign: 'center' }}>
                      {algorithms.find(a => a.id === algorithmA)?.name}
                      {winner === 'A' && ' 🏆'}
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#9ca3af' }}>Avg Match Score:</span>
                        <span style={{ color: 'white', fontWeight: 'bold' }}>{(metricsA.avgScore * 100).toFixed(1)}%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#9ca3af' }}>Genre Diversity:</span>
                        <span style={{ color: 'white', fontWeight: 'bold' }}>{metricsA.diversity} genres</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#9ca3af' }}>Unique Movies:</span>
                        <span style={{ color: 'white', fontWeight: 'bold' }}>{metricsA.coverage}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ width: '2px', background: '#3f3f46' }}></div>

                {/* Algorithm B Metrics */}
                <div>
                  <div style={{ background: winner === 'B' ? '#10b981' : '#27272a', padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
                    <h4 style={{ color: 'white', fontSize: '18px', marginBottom: '16px', textAlign: 'center' }}>
                      {algorithms.find(a => a.id === algorithmB)?.name}
                      {winner === 'B' && ' 🏆'}
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#9ca3af' }}>Avg Match Score:</span>
                        <span style={{ color: 'white', fontWeight: 'bold' }}>{(metricsB.avgScore * 100).toFixed(1)}%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#9ca3af' }}>Genre Diversity:</span>
                        <span style={{ color: 'white', fontWeight: 'bold' }}>{metricsB.diversity} genres</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#9ca3af' }}>Unique Movies:</span>
                        <span style={{ color: 'white', fontWeight: 'bold' }}>{metricsB.coverage}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Side by Side Results */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Algorithm A Results */}
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '16px' }}>
                  {algorithms.find(a => a.id === algorithmA)?.icon} {algorithms.find(a => a.id === algorithmA)?.name} Results
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                  {recommendationsA.map((rec, index) => (
                    <div key={`a-${index}`} style={{ position: 'relative' }}>
                      <MovieCard movie={rec.movie} />
                      {rec.score && (
                        <div style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          background: '#3b82f6',
                          color: 'white',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          zIndex: 30,
                        }}>
                          {(rec.score * 100).toFixed(0)}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Algorithm B Results */}
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '16px' }}>
                  {algorithms.find(a => a.id === algorithmB)?.icon} {algorithms.find(a => a.id === algorithmB)?.name} Results
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                  {recommendationsB.map((rec, index) => (
                    <div key={`b-${index}`} style={{ position: 'relative' }}>
                      <MovieCard movie={rec.movie} />
                      {rec.score && (
                        <div style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          background: '#a855f7',
                          color: 'white',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          zIndex: 30,
                        }}>
                          {(rec.score * 100).toFixed(0)}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}