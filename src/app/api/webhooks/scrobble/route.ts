import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { initMongo, mediaRepository } from '@/db';
import { guardMutation } from '@/server/auth';
import { handleCorsOptions, corsHeaders } from '@/server/cors';
import { MediaItem } from '@/models';

export async function OPTIONS() {
  return handleCorsOptions();
}

// POST /api/webhooks/scrobble (Requires API Key or Admin Session)
// Auto-scrobble endpoint for Plex, Jellyfin, Kodi, or home scripts
export async function POST(req: NextRequest) {
  const unauth = await guardMutation(req);
  if (unauth) return unauth;

  try {
    await initMongo();
    const payload = await req.json();
    const { title, type, imdbId, season, episode, rating, status } = payload || {};

    if (!imdbId || !String(imdbId).trim()) {
      return NextResponse.json(
        { error: 'IMDb ID (e.g. tt1234567) is required for scrobbling' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const cleanImdbId = String(imdbId).trim();

    // 1. Look for existing entry by IMDb ID
    let existing: MediaItem | null = await mediaRepository.findByImdbId(cleanImdbId);

    const now = new Date().toISOString();

    // 2. If item exists, update progress or watch state
    if (existing) {
      if (existing.type === 'series' && (season !== undefined || episode !== undefined)) {
        const updated = await mediaRepository.updateProgress(
          existing.id,
          season !== undefined ? Number(season) : undefined,
          episode !== undefined ? Number(episode) : undefined,
          status || 'watching'
        );
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
      const updates: Partial<MediaItem> = {
        status: status || 'completed',
        lastSeen: now,
        updatedAt: now,
      };
      if (rating !== undefined && !isNaN(Number(rating))) {
        updates.rating = Number(rating);
      }

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

    // 3. If item does not exist, auto-create it
    const mediaType = type === 'series' ? 'series' : 'movie';
    const newItem: MediaItem = {
      id: crypto.randomUUID(),
      title: String(title || cleanImdbId).trim(),
      type: mediaType,
      imdbId: cleanImdbId,
      status: mediaType === 'series' ? (status || 'watching') : (status || 'completed'),
      rating: rating !== undefined ? Number(rating) : undefined,
      genres: [],
      lastSeen: now,
      progress: mediaType === 'series'
        ? {
            season: season !== undefined ? Number(season) : 1,
            episode: episode !== undefined ? Number(episode) : 1,
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
