import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  register: (email: string, username: string, password: string) =>
    api.post('/auth/register', { email, username, password }),
  getMe: () => api.get('/auth/me'),
};

export const movieAPI = {
  getMovies: (page = 1, pageSize = 20, search?: string) =>
    api.get('/movies/', { params: { page, page_size: pageSize, search } }),
  getMovie: (id: number) => api.get(`/movies/${id}`),
  searchMovies: (query: string) => api.get('/movies/search', { params: { q: query } }),
};

export const ratingAPI = {
  rateMovie: (movieId: number, rating: number) =>
    api.post('/ratings/', { movie_id: movieId, rating }),
  updateRating: (movieId: number, rating: number) =>
    api.put(`/ratings/${movieId}`, { rating }),
  deleteRating: (ratingId: number) => 
    api.delete(`/ratings/${ratingId}`),
  getUserRatings: () => api.get('/ratings/me'),
};

export const recommendationAPI = {
  getRecommendations: (algorithm = 'hybrid', limit = 20) =>
    api.get('/recommendations/', { params: { algorithm, limit } }),
  getSimilarMovies: (movieId: number, limit = 10) =>
    api.get(`/recommendations/similar/${movieId}`, { params: { limit } }),
  getStats: () => api.get('/recommendations/stats'),
};

export default api;