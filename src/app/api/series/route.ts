import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { initMongo, mediaRepository } from '@/db';
import { guardReadOnly, guardMutation } from '@/server/auth';
import { SeriesItem, sanitizeSeriesInput } from '@/models';
import { handleCorsOptions, corsHeaders } from '@/server/cors';

export async function OPTIONS() {
  return handleCorsOptions();
}

// GET /api/series (Public read with 30/sec rate limit; unlimited with API key)
export async function GET(req: NextRequest) {
  const guard = await guardReadOnly(req);
  if (!guard.allowed) {
    return guard.response!;
  }

  try {
    await initMongo();
    const { searchParams } = new URL(req.url);

    const rawPage = parseInt(searchParams.get('page') || '', 10);
    const rawLimit = parseInt(searchParams.get('limit') || '', 10);

    const page = !isNaN(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = !isNaN(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 1000) : 25;
    const skip = (page - 1) * limit;

    const { series, total } = await mediaRepository.findSeries(skip, limit);
    return NextResponse.json({ series, total }, { headers: guard.headers });
  } catch (err: any) {
    console.error('Error fetching series:', err);
    return NextResponse.json({ error: 'Failed to fetch series' }, { status: 500, headers: guard.headers });
  }
}

// POST /api/series (Requires API Key or Admin Session)
export async function POST(req: NextRequest) {
  const unauth = await guardMutation(req);
  if (unauth) return unauth;

  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 1024 * 1024) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413, headers: corsHeaders() });
  }

  try {
    await initMongo();
    const body = await req.json();
    const sanitized = sanitizeSeriesInput(body);

    if (!sanitized.title) {
      return NextResponse.json({ error: 'Series title is required' }, { status: 400, headers: corsHeaders() });
    }

    if (!sanitized.imdbId) {
      return NextResponse.json({ error: 'IMDb ID (e.g. tt1234567) is required' }, { status: 400, headers: corsHeaders() });
    }

    const imdbId = sanitized.imdbId;
    const existing = await mediaRepository.findByImdbId(imdbId);
    if (existing) {
      return NextResponse.json({ error: 'Series with this IMDb ID already exists' }, { status: 409, headers: corsHeaders() });
    }

    const now = new Date().toISOString();
    const newSeries: SeriesItem = {
      id: crypto.randomUUID(),
      title: sanitized.title,
      type: 'series',
      imdbId: sanitized.imdbId,
      posterUrl: sanitized.posterUrl,
      backdropUrl: sanitized.backdropUrl,
      releaseYear: sanitized.releaseYear,
      status: sanitized.status || 'watching',
      rating: sanitized.rating,
      genres: sanitized.genres || [],
      plot: sanitized.plot,
      notes: sanitized.notes,
      progress: sanitized.progress || {
        season: 1,
        episode: 1,
        totalSeasons: sanitized.totalSeasons || 1,
        totalEpisodes: sanitized.totalEpisodes || 1,
      },
      totalSeasons: sanitized.totalSeasons || 1,
      totalEpisodes: sanitized.totalEpisodes || 1,
      network: sanitized.network,
      airingStatus: sanitized.airingStatus,
      nextEpisodeDate: sanitized.nextEpisodeDate,
      episodesPerSeason: sanitized.episodesPerSeason,
      lastSeen: sanitized.lastSeen || (sanitized.status === 'watching' || sanitized.status === 'completed' ? now : undefined),
      createdAt: now,
      updatedAt: now,
    };

    const created = await mediaRepository.createItem(newSeries);
    return NextResponse.json(created, { status: 201, headers: corsHeaders() });
  } catch (err: any) {
    console.error('Error adding series:', err);
    return NextResponse.json({ error: 'Failed to add series' }, { status: 500, headers: corsHeaders() });
  }
}
