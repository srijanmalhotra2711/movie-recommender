import axios from 'axios';

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export const tmdb = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
  },
});

export const getTMDBPosterUrl = (path: string | null, size = 'w500') => {
  if (!path) return '/images/placeholder-movie.png';
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

export const searchTMDBMovie = async (title: string, year?: number) => {
  try {
    const response = await tmdb.get('/search/movie', {
      params: { query: title, year },
    });
    return response.data.results[0] || null;
  } catch (error) {
    console.error('TMDB search error:', error);
    return null;
  }
};

export const getTMDBMovieDetails = async (tmdbId: number) => {
  try {
    const response = await tmdb.get(`/movie/${tmdbId}`);
    return response.data;
  } catch (error) {
    console.error('TMDB details error:', error);
    return null;
  }
};