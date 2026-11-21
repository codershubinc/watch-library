import { MediaItem, WatchStatus } from './MediaItem';

export interface MovieItem extends MediaItem {
  type: 'movie';
  durationMinutes?: number;
  director?: string;
}

export type CreateMovieInput = Omit<MovieItem, 'id' | 'type' | 'createdAt' | 'updatedAt'>;
export type UpdateMovieInput = Partial<CreateMovieInput>;

/**
 * Validates and sanitizes movie-specific payload
 */
export function sanitizeMovieInput(input: any): Partial<MovieItem> {
  const sanitized: Partial<MovieItem> = { type: 'movie' };
  if (!input || typeof input !== 'object') return sanitized;

  if (typeof input.title === 'string' && input.title.trim()) {
    sanitized.title = input.title.trim();
  }
  if (typeof input.posterUrl === 'string') {
    sanitized.posterUrl = input.posterUrl.trim() || undefined;
  }
  if (typeof input.backdropUrl === 'string') {
    sanitized.backdropUrl = input.backdropUrl.trim() || undefined;
  }
  if (input.releaseYear !== undefined && input.releaseYear !== null && input.releaseYear !== '') {
    const yr = Number(input.releaseYear);
    if (!isNaN(yr) && yr >= 1800 && yr <= 2100) {
      sanitized.releaseYear = yr;
    }
  }
  if (['watching', 'completed', 'plan_to_watch', 'on_hold', 'dropped'].includes(input.status)) {
    sanitized.status = input.status as WatchStatus;
  }
  if (input.rating !== undefined && input.rating !== null && input.rating !== '') {
    const r = Number(input.rating);
    if (!isNaN(r) && r >= 0 && r <= 10) {
      sanitized.rating = r;
    }
  }
  if (Array.isArray(input.genres)) {
    sanitized.genres = input.genres
      .filter((g: any) => typeof g === 'string')
      .map((g: string) => g.trim())
      .filter(Boolean);
  } else if (typeof input.genres === 'string') {
    sanitized.genres = input.genres.split(',').map((g: string) => g.trim()).filter(Boolean);
  }
  if (typeof input.plot === 'string') sanitized.plot = input.plot.trim() || undefined;
  if (typeof input.notes === 'string') sanitized.notes = input.notes.trim() || undefined;
  if (typeof input.imdbId === 'string') sanitized.imdbId = input.imdbId.trim() || undefined;

  // Movie-specific fields
  if (input.durationMinutes !== undefined && input.durationMinutes !== null && input.durationMinutes !== '') {
    const dur = Number(input.durationMinutes);
    if (!isNaN(dur) && dur > 0) sanitized.durationMinutes = dur;
  }
  if (typeof input.director === 'string') {
    sanitized.director = input.director.trim() || undefined;
  }

  return sanitized;
}
