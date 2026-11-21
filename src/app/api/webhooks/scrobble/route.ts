import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { initMongo, mediaRepository } from '@/db';
import { guardMutation } from '@/server/auth';
import { handleCorsOptions, corsHeaders } from '@/server/cors';
import { MediaItem } from '@/models';

export async function OPTIONS() {
  return handleCorsOptions();
}

/**
 * Auto-enriches metadata (artwork poster, plot, genres, year, director)
 * from OMDb when an item is newly created or missing artwork.
 */
async function enrichFromOmdb(imdbId: string): Promise<Partial<MediaItem> | null> {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`http://www.omdbapi.com/?i=${encodeURIComponent(imdbId)}&apikey=${apiKey}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    if (data.Response === 'False') return null;

    const enriched: Partial<MediaItem> = {};
    if (data.Title) enriched.title = data.Title;
    if (data.Type === 'series' || data.Type === 'movie') enriched.type = data.Type;
    if (data.Poster && data.Poster !== 'N/A') enriched.posterUrl = data.Poster;
    if (data.Plot && data.Plot !== 'N/A') enriched.plot = data.Plot;
    if (data.Director && data.Director !== 'N/A') enriched.director = data.Director;

    if (data.Year) {
      const parsedYear = parseInt(data.Year, 10);
      if (!isNaN(parsedYear)) enriched.releaseYear = parsedYear;
    }

    if (data.Genre && data.Genre !== 'N/A') {
      enriched.genres = data.Genre.split(',').map((g: string) => g.trim()).filter(Boolean);
    }

    if (data.totalSeasons && data.totalSeasons !== 'N/A') {
      const parsedSeasons = parseInt(data.totalSeasons, 10);
      if (!isNaN(parsedSeasons)) enriched.totalSeasons = parsedSeasons;
    }

    if (data.Runtime && data.Runtime !== 'N/A') {
      const parsedRuntime = parseInt(data.Runtime, 10);
      if (!isNaN(parsedRuntime)) enriched.durationMinutes = parsedRuntime;
    }

    return enriched;
  } catch (err) {
    console.warn('[scrobble] OMDb auto-enrichment skipped:', err);
    return null;
  }
}

// POST /api/webhooks/scrobble (Requires API Key or Admin Session)
// Auto-scrobble endpoint for Plex, Jellyfin, Kodi, Home Assistant, or automated agents
export async function POST(req: NextRequest) {
  const unauth = await guardMutation(req);
  if (unauth) return unauth;

  try {
    await initMongo();
    const payload = await req.json();

    const {
      title,
      type,
      imdbId,
      tmdbId,
      tmdb,
      season,
      episode,
      rating,
      status,
      posterUrl,
      artwork,
      poster,
      backdropUrl,
      backdrop,
      releaseYear,
      year,
      genres,
      genre,
      plot,
      overview,
      summary,
      director,
      durationMinutes,
      runtime,
      network,
      totalSeasons,
      totalEpisodes,
    } = payload || {};

    if (!imdbId || !String(imdbId).trim()) {
      return NextResponse.json(
        { error: 'IMDb ID (e.g. tt1234567) is required for scrobbling' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const cleanImdbId = String(imdbId).trim();
    const cleanTmdbId = tmdbId ? String(tmdbId).trim() : (tmdb ? String(tmdb).trim() : undefined);
    const providedPoster = posterUrl || artwork || poster;
    const providedBackdrop = backdropUrl || backdrop;
    const providedPlot = plot || overview || summary;
    const providedYear = releaseYear !== undefined ? Number(releaseYear) : (year !== undefined ? Number(year) : undefined);
    const providedDuration = durationMinutes !== undefined ? Number(durationMinutes) : (runtime !== undefined ? Number(runtime) : undefined);

    let parsedGenres: string[] | undefined = undefined;
    if (Array.isArray(genres)) {
      parsedGenres = genres.map(String);
    } else if (typeof genres === 'string' && genres.trim()) {
      parsedGenres = genres.split(',').map((g) => g.trim()).filter(Boolean);
    } else if (typeof genre === 'string' && genre.trim()) {
      parsedGenres = genre.split(',').map((g) => g.trim()).filter(Boolean);
    }

    const now = new Date().toISOString();

    // 1. Look for existing entry by IMDb ID
    let existing: MediaItem | null = await mediaRepository.findByImdbId(cleanImdbId);

    // 2. If item exists, update progress or watch state and backfill any missing artwork/metadata
    if (existing) {
      const updates: Partial<MediaItem> = {
        lastSeen: now,
        updatedAt: now,
      };

      if (cleanTmdbId && !existing.tmdbId) {
        updates.tmdbId = cleanTmdbId;
      }
      if (providedPoster && (!existing.posterUrl || existing.posterUrl !== providedPoster)) {
        updates.posterUrl = providedPoster;
      }
      if (providedBackdrop && (!existing.backdropUrl || existing.backdropUrl !== providedBackdrop)) {
        updates.backdropUrl = providedBackdrop;
      }
      if (providedPlot && !existing.plot) {
        updates.plot = providedPlot;
      }
      if (rating !== undefined && !isNaN(Number(rating))) {
        updates.rating = Number(rating);
      }

      // If existing item is missing artwork, auto-enrich from OMDb
      if (!existing.posterUrl && !providedPoster) {
        const enriched = await enrichFromOmdb(cleanImdbId);
        if (enriched?.posterUrl) updates.posterUrl = enriched.posterUrl;
        if (enriched?.plot && !existing.plot) updates.plot = enriched.plot;
      }

      // If series: update episode progress
      if (existing.type === 'series' && (season !== undefined || episode !== undefined)) {
        const currentProg = existing.progress || { season: 1, episode: 1 };
        const newProg = {
          ...currentProg,
          ...(season !== undefined && !isNaN(Number(season)) ? { season: Number(season) } : {}),
          ...(episode !== undefined && !isNaN(Number(episode)) ? { episode: Number(episode) } : {}),
          ...(totalSeasons !== undefined && !isNaN(Number(totalSeasons)) ? { totalSeasons: Number(totalSeasons) } : {}),
          ...(totalEpisodes !== undefined && !isNaN(Number(totalEpisodes)) ? { totalEpisodes: Number(totalEpisodes) } : {}),
        };
        updates.progress = newProg;
        updates.status = status || existing.status || 'watching';

        const updated = await mediaRepository.updateItem(existing.id, updates);
        return NextResponse.json(
          {
            success: true,
            action: 'updated_series_progress',
            item: updated,
          },
          { headers: corsHeaders() }
        );
      }

      // If movie or general item, mark completed and set lastSeen
      updates.status = status || 'completed';
      const updated = await mediaRepository.updateItem(existing.id, updates);
      return NextResponse.json(
        {
          success: true,
          action: 'updated_media_status',
          item: updated,
        },
        { headers: corsHeaders() }
      );
    }

    // 3. If item does not exist: auto-fetch artwork & full metadata from OMDb
    const enriched = await enrichFromOmdb(cleanImdbId);

    const resolvedType = type === 'series' || enriched?.type === 'series' || season !== undefined || episode !== undefined
      ? 'series'
      : 'movie';

    const resolvedTitle = String(title || enriched?.title || cleanImdbId).trim();
    const resolvedPoster = providedPoster || enriched?.posterUrl || undefined;
    const resolvedBackdrop = providedBackdrop || undefined;
    const resolvedPlot = providedPlot || enriched?.plot || undefined;
    const resolvedYear = providedYear || enriched?.releaseYear || undefined;
    const resolvedDirector = director || enriched?.director || undefined;
    const resolvedGenres = (parsedGenres && parsedGenres.length > 0) ? parsedGenres : (enriched?.genres || []);
    const resolvedDuration = providedDuration || enriched?.durationMinutes || undefined;
    const resolvedTotalSeasons = totalSeasons !== undefined && !isNaN(Number(totalSeasons))
      ? Number(totalSeasons)
      : (enriched?.totalSeasons || undefined);

    const newItem: MediaItem = {
      id: crypto.randomUUID(),
      title: resolvedTitle,
      type: resolvedType,
      imdbId: cleanImdbId,
      tmdbId: cleanTmdbId,
      posterUrl: resolvedPoster,
      backdropUrl: resolvedBackdrop,
      releaseYear: resolvedYear,
      status: resolvedType === 'series' ? (status || 'watching') : (status || 'completed'),
      rating: rating !== undefined && !isNaN(Number(rating)) ? Number(rating) : undefined,
      genres: resolvedGenres,
      plot: resolvedPlot,
      director: resolvedDirector,
      durationMinutes: resolvedDuration,
      totalSeasons: resolvedTotalSeasons,
      totalEpisodes: totalEpisodes !== undefined && !isNaN(Number(totalEpisodes)) ? Number(totalEpisodes) : undefined,
      network: network ? String(network).trim() : undefined,
      lastSeen: now,
      progress: resolvedType === 'series'
        ? {
            season: season !== undefined && !isNaN(Number(season)) ? Number(season) : 1,
            episode: episode !== undefined && !isNaN(Number(episode)) ? Number(episode) : 1,
            totalSeasons: resolvedTotalSeasons,
            totalEpisodes: totalEpisodes !== undefined && !isNaN(Number(totalEpisodes)) ? Number(totalEpisodes) : undefined,
          }
        : undefined,
      createdAt: now,
      updatedAt: now,
    };

    const created = await mediaRepository.createItem(newItem);
    return NextResponse.json(
      {
        success: true,
        action: 'auto_created_and_scrobbled',
        item: created,
      },
      { status: 201, headers: corsHeaders() }
    );
  } catch (err: any) {
    console.error('Error during scrobble webhook:', err);
    return NextResponse.json({ error: 'Failed to process scrobble webhook' }, { status: 500, headers: corsHeaders() });
  }
}
