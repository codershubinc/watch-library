import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { initMongo, mediaRepository } from '@/db';
import { isAuthorizedAdmin } from '@/server/auth';
import { MediaItem, sanitizeMediaInput } from '@/models';
import { handleCorsOptions, corsHeaders } from '@/server/cors';

export async function OPTIONS() {
  return handleCorsOptions();
}

// GET /api/library
export async function GET(req: NextRequest) {
  try {
    await initMongo();
    const { searchParams } = new URL(req.url);

    const rawPage = parseInt(searchParams.get('page') || '', 10);
    const rawLimit = parseInt(searchParams.get('limit') || '', 10);

    const page = !isNaN(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = !isNaN(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 1000) : 25;
    const skip = (page - 1) * limit;

    const { items, total } = await mediaRepository.findItems(skip, limit);
    return NextResponse.json({ items, total }, { headers: corsHeaders() });
  } catch (err: any) {
    console.error('Error fetching library:', err);
    return NextResponse.json({ error: 'Failed to fetch library items' }, { status: 500, headers: corsHeaders() });
  }
}

// POST /api/library (Admin or API Key Bearer)
export async function POST(req: NextRequest) {
  if (!(await isAuthorizedAdmin(req))) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin authentication or valid API key required' },
      { status: 401, headers: corsHeaders() }
    );
  }

  // Request payload size limit (Max 1MB)
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 1024 * 1024) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413, headers: corsHeaders() });
  }

  try {
    await initMongo();
    const body = await req.json();
    const sanitized = sanitizeMediaInput(body);

    if (!sanitized.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400, headers: corsHeaders() });
    }

    const imdbId = sanitized.imdbId;
    if (imdbId) {
      const existing = await mediaRepository.findByImdbId(imdbId);
      if (existing) {
        return NextResponse.json({ error: 'Item with this IMDb ID already exists' }, { status: 409, headers: corsHeaders() });
      }
    }

    const newItem: MediaItem = {
      id: crypto.randomUUID(),
      title: sanitized.title,
      type: sanitized.type || 'movie',
      posterUrl: sanitized.posterUrl,
      backdropUrl: sanitized.backdropUrl,
      releaseYear: sanitized.releaseYear,
      status: sanitized.status || 'watching',
      progress: sanitized.type === 'series' ? (sanitized.progress || { season: 1, episode: 1 }) : undefined,
      rating: sanitized.rating,
      genres: sanitized.genres || [],
      plot: sanitized.plot,
      notes: sanitized.notes,
      imdbId: sanitized.imdbId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await mediaRepository.createItem(newItem);
    return NextResponse.json(created, { status: 201, headers: corsHeaders() });
  } catch (err: any) {
    console.error('Error adding item:', err);
    return NextResponse.json({ error: 'Failed to add media item' }, { status: 500, headers: corsHeaders() });
  }
}
