import { MediaItem, WatchStatus, SeriesProgress } from './MediaItem';

export type AiringStatus = 'airing' | 'ended' | 'canceled' | 'upcoming';

export interface SeriesItem extends MediaItem {
  type: 'series';
  progress: SeriesProgress; // Required for series
  totalSeasons?: number;
  totalEpisodes?: number;
  network?: string; // e.g. HBO, Netflix, Apple TV+, AMC
  airingStatus?: AiringStatus; // e.g. airing, ended
  nextEpisodeDate?: string; // e.g. 2026-12-01
  episodesPerSeason?: number[]; // episode counts per season
}

export type CreateSeriesInput = Omit<SeriesItem, 'id' | 'type' | 'createdAt' | 'updatedAt'>;
export type UpdateSeriesInput = Partial<CreateSeriesInput>;

/**
 * Validates and sanitizes series-specific payload (has more params than movie)
 */
export function sanitizeSeriesInput(input: any): Partial<SeriesItem> {
  const sanitized: Partial<SeriesItem> = { type: 'series' };
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

  // Series-specific progress
  sanitized.progress = {
    season: Number(input.progress?.season) || 1,
    episode: Number(input.progress?.episode) || 1,
    totalEpisodes: input.progress?.totalEpisodes ? Number(input.progress.totalEpisodes) : (input.totalEpisodes ? Number(input.totalEpisodes) : undefined),
    totalSeasons: input.progress?.totalSeasons ? Number(input.progress.totalSeasons) : (input.totalSeasons ? Number(input.totalSeasons) : undefined),
  };

  // Extra series parameters
  if (input.totalSeasons !== undefined && input.totalSeasons !== null && input.totalSeasons !== '') {
    const ts = Number(input.totalSeasons);
    if (!isNaN(ts) && ts > 0) sanitized.totalSeasons = ts;
  }
  if (input.totalEpisodes !== undefined && input.totalEpisodes !== null && input.totalEpisodes !== '') {
    const te = Number(input.totalEpisodes);
    if (!isNaN(te) && te > 0) sanitized.totalEpisodes = te;
  }
  if (typeof input.network === 'string') {
    sanitized.network = input.network.trim() || undefined;
  }
  if (['airing', 'ended', 'canceled', 'upcoming'].includes(input.airingStatus)) {
    sanitized.airingStatus = input.airingStatus;
  }
  if (typeof input.nextEpisodeDate === 'string') {
    sanitized.nextEpisodeDate = input.nextEpisodeDate.trim() || undefined;
  }
  if (Array.isArray(input.episodesPerSeason)) {
    sanitized.episodesPerSeason = input.episodesPerSeason.map(Number).filter((n: number) => !isNaN(n));
  }

  return sanitized;
}
