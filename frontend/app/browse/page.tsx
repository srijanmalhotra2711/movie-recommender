'use client';

import { useState, useEffect } from 'react';
import { movieAPI } from '@/lib/api';
import { MovieCard } from '@/components/movies/MovieCard';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Movie } from '@/types';

export default function BrowsePage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [minYear, setMinYear] = useState<number>(1900);
  const [maxYear, setMaxYear] = useState<number>(2025);
  const [sortBy, setSortBy] = useState<string>('title');
  const [minRating, setMinRating] = useState<number>(0);
  
  const { user, logout, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const genres = ['all', 'Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Animation', 'Documentary'];
  const sortOptions = [
    { value: 'title', label: 'Title (A-Z)' },
    { value: 'year', label: 'Year (Newest)' },
    { value: 'rating', label: 'Rating (Highest)' },
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchMovies();
  }, [page, isAuthenticated, router]);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await movieAPI.getMovies(page, 28, searchQuery);
      if (response.data.movies) {
        let filteredMovies = response.data.movies;
        
        if (selectedGenre !== 'all') {
          filteredMovies = filteredMovies.filter((m: Movie) => 
            m.genres?.some(g => g.name === selectedGenre)
          );
        }
        
        if (minYear || maxYear) {
          filteredMovies = filteredMovies.filter((m: Movie) => {
            const year = m.release_year || 0;
            return year >= minYear && year <= maxYear;
          });
        }
        
        if (minRating > 0) {
          filteredMovies = filteredMovies.filter((m: Movie) => {
            const rating = m.avg_rating || 0;
            return rating >= minRating;
          });
        }
        
        if (sortBy === 'title') {
          filteredMovies.sort((a: Movie, b: Movie) => a.title.localeCompare(b.title));
        } else if (sortBy === 'year') {
          filteredMovies.sort((a: Movie, b: Movie) => (b.release_year || 0) - (a.release_year || 0));
        } else if (sortBy === 'rating') {
          filteredMovies.sort((a: Movie, b: Movie) => (b.avg_rating || 0) - (a.avg_rating || 0));
        }
        
        setMovies(filteredMovies);
        setTotalPages(Math.ceil(response.data.total / 28) || 1);
      } else {
        setMovies([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMovies();
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchMovies();
  };

  const handleClearFilters = () => {
    setSelectedGenre('all');
    setMinYear(1900);
    setMaxYear(2025);
    setSortBy('title');
    setMinRating(0);
    setPage(1);
    fetchMovies();
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

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px 12px 45px',
    background: '#27272a',
    border: '2px solid #3f3f46',
    borderRadius: '10px',
    color: 'white',
    fontSize: '16px',
    outline: 'none',
  };

  if (loading && movies.length === 0) {
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
          <p style={{ color: '#9ca3af' }}>Loading movies...</p>
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
              style={{ ...buttonStyle, background: '#dc2626' }}
            >
              Browse
            </button>
            <button 
              onClick={() => router.push('/recommendations')} 
              style={{ padding: '12px 24px', background: 'transparent', color: '#9ca3af', border: 'none', cursor: 'pointer', fontSize: '16px' }}
            >
              Recommendations
            </button>
            <button 
              onClick={() => router.push('/trending')} 
              style={{ padding: '12px 24px', background: 'transparent', color: '#9ca3af', border: 'none', cursor: 'pointer', fontSize: '16px' }}
            >
              Trending
            </button>
            <button 
              onClick={() => router.push('/analytics')} 
              style={{ padding: '12px 24px', background: 'transparent', color: '#9ca3af', border: 'none', cursor: 'pointer', fontSize: '16px' }}
            >
              Analytics
            </button>
            <button 
              onClick={() => router.push('/ab-testing')} 
              style={{ padding: '12px 24px', background: 'transparent', color: '#9ca3af', border: 'none', cursor: 'pointer', fontSize: '16px' }}
            >
              A/B Testing
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
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: 'white', margin: '0 0 10px 0' }}>
            Discover Movies
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '18px', margin: 0 }}>
            Browse through {movies.length} amazing films
          </p>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#6b7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for movies..."
                style={searchInputStyle}
              />
            </div>
            <button 
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              style={{ ...buttonStyle, background: showFilters ? '#dc2626' : '#27272a' }}
            >
              Filters
            </button>
            <button type="submit" style={buttonStyle}>
              Search
            </button>
          </form>

          {showFilters && (
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', color: '#d1d5db', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>Genre</label>
                  <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    style={{ width: '100%', padding: '10px', background: '#27272a', border: '2px solid #3f3f46', borderRadius: '8px', color: 'white', outline: 'none' }}
                  >
                    {genres.map(g => <option key={g} value={g}>{g === 'all' ? 'All Genres' : g}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', color: '#d1d5db', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>Year Range</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      value={minYear}
                      onChange={(e) => setMinYear(parseInt(e.target.value) || 1900)}
                      placeholder="From"
                      style={{ width: '50%', padding: '10px', background: '#27272a', border: '2px solid #3f3f46', borderRadius: '8px', color: 'white', outline: 'none' }}
                    />
                    <input
                      type="number"
                      value={maxYear}
                      onChange={(e) => setMaxYear(parseInt(e.target.value) || 2025)}
                      placeholder="To"
                      style={{ width: '50%', padding: '10px', background: '#27272a', border: '2px solid #3f3f46', borderRadius: '8px', color: 'white', outline: 'none' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', color: '#d1d5db', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>Min Rating</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.5"
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '10px', background: '#27272a', border: '2px solid #3f3f46', borderRadius: '8px', color: 'white', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#d1d5db', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{ width: '100%', padding: '10px', background: '#27272a', border: '2px solid #3f3f46', borderRadius: '8px', color: 'white', outline: 'none' }}
                  >
                    {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={handleClearFilters} style={{ padding: '10px 20px', background: '#27272a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  Clear
                </button>
                <button onClick={handleApplyFilters} style={buttonStyle}>
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', marginBottom: '20px' }}>
            All Movies ({movies.length})
          </h3>
          {movies.length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '60px 0' }}>No movies found</p>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px', marginBottom: '40px' }}>
                {movies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  style={{ ...buttonStyle, opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                >
                  ← Previous
                </button>
                
                <span style={{ color: 'white', fontSize: '16px' }}>
                  Page {page} of {totalPages}
                </span>

                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  style={{ ...buttonStyle, opacity: page === totalPages ? 0.5 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}