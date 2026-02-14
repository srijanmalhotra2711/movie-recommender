'use client';

import { Movie } from '@/types';
import { Star, Film } from 'lucide-react';
import { useState, useEffect } from 'react';
import { searchTMDBMovie, getTMDBPosterUrl } from '@/lib/tmdb';
import { useRouter } from 'next/navigation';

interface MovieCardProps {
  movie: Movie;
}

export function MovieCard({ movie }: MovieCardProps) {
  const router = useRouter();
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPoster = async () => {
      if (movie.poster_path) {
        setPosterUrl(movie.poster_path);
        setLoading(false);
        return;
      }

      try {
        const tmdbMovie = await searchTMDBMovie(movie.title, movie.release_year || undefined);
        if (tmdbMovie?.poster_path) {
          setPosterUrl(getTMDBPosterUrl(tmdbMovie.poster_path, 'w185'));
        }
      } catch (error) {
        console.error('Error fetching poster:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPoster();
  }, [movie.title, movie.release_year, movie.poster_path]);

  return (
    <div
      onClick={() => router.push(`/movie/${movie.id}`)}
      className="bg-dark-800 rounded-lg overflow-hidden hover:scale-105 hover:z-10 transition-transform duration-300 cursor-pointer shadow-lg"
    >
      {/* Poster */}
      <div className="w-full h-48 bg-gradient-to-br from-dark-700 to-dark-900 overflow-hidden">
        {loading ? (
          <div className="w-full h-full animate-pulse bg-dark-700" />
        ) : posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="w-12 h-12 text-gray-600" />
          </div>
        )}
      </div>

      {/* Info Below - Compact */}
      <div className="p-2">
        <h3 className="font-semibold text-xs line-clamp-2 mb-1 h-8">{movie.title}</h3>
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />
          <span className="text-xs font-semibold">
            {movie.avg_rating ? movie.avg_rating.toFixed(1) : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
}