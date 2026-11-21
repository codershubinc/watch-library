export type MediaType = 'movie' | 'series';

export type WatchStatus = 'watching' | 'completed' | 'plan_to_watch' | 'on_hold' | 'dropped';

export interface SeriesProgress {
  season: number;
  episode: number;
  totalEpisodes?: number;
  totalSeasons?: number;
}

export interface LibraryStats {
  totalCount: number;
  moviesCount: number;
  seriesCount: number;
  statusBreakdown: {
    watching: number;
    completed: number;
    plan_to_watch: number;
    on_hold: number;
    dropped: number;
  };
  topGenres: { genre: string; count: number }[];
  averageRating: number | null;
  totalMovieDurationMinutes: number;
  totalEpisodesWatched: number;
}

/**
 * Universal Base Media interface
 */
export interface MediaItem {
  id: string;
  title: string;
  type: MediaType;
  imdbId: string; // Required unique IMDb identifier (e.g. tt0111161)
  posterUrl?: string;
  backdropUrl?: string;
  releaseYear?: number;
  status: WatchStatus;
  progress?: SeriesProgress;
  rating?: number;
  genres: string[];
  plot?: string;
  notes?: string;
  // Movie-specific optional fields:
  durationMinutes?: number;
  director?: string;
  // Series-specific optional fields:
  totalSeasons?: number;
  totalEpisodes?: number;
  network?: string;
  airingStatus?: string;
  nextEpisodeDate?: string;
  episodesPerSeason?: number[];
  lastSeen?: string; // Dedicated timestamp of when the title/episode was last watched (separate from updatedAt)
  createdAt: string;
  updatedAt: string;
}

export type BaseMediaItem = MediaItem;
export type CreateMediaInput = Omit<MediaItem, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateMediaInput = Partial<CreateMediaInput>;

import { sanitizeMovieInput } from './Movie';
import { sanitizeSeriesInput } from './Series';

/**
 * Dispatches to sanitizeMovieInput or sanitizeSeriesInput based on type
 */
export function sanitizeMediaInput(input: any): Partial<MediaItem> {
  if (!input || typeof input !== 'object') return {};
  if (input.type === 'movie') {
    return sanitizeMovieInput(input);
  } else if (input.type === 'series') {
    return sanitizeSeriesInput(input);
  }
  return input.progress || input.totalSeasons || input.totalEpisodes
    ? sanitizeSeriesInput(input)
    : sanitizeMovieInput(input);
}
