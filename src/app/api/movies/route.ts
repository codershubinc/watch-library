import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { initMongo, mediaRepository } from '@/db';
import { isAuthorizedAdmin } from '@/server/auth';
import { MovieItem, sanitizeMovieInput } from '@/models';
import { handleCorsOptions, corsHeaders } from '@/server/cors';

export async function OPTIONS() {
  return handleCorsOptions();
}

// GET /api/movies
export async function GET(req: NextRequest) {
  try {
    await initMongo();
    const { searchParams } = new URL(req.url);

    const rawPage = parseInt(searchParams.get('page') || '', 10);
    const rawLimit = parseInt(searchParams.get('limit') || '', 10);

    const page = !isNaN(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = !isNaN(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 1000) : 25;
    const skip = (page - 1) * limit;

    const { movies, total } = await mediaRepository.findMovies(skip, limit);
    return NextResponse.json({ movies, total }, { headers: corsHeaders() });
  } catch (err: any) {
    console.error('Error fetching movies:', err);
    return NextResponse.json({ error: 'Failed to fetch movies' }, { status: 500, headers: corsHeaders() });
  }
}

// POST /api/movies (Admin or API Key Bearer)
export async function POST(req: NextRequest) {
  if (!(await isAuthorizedAdmin(req))) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin authentication or valid API key required' },
      { status: 401, headers: corsHeaders() }
    );
  }

  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 1024 * 1024) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413, headers: corsHeaders() });
  }

  try {
    await initMongo();
    const body = await req.json();
    const sanitized = sanitizeMovieInput(body);

    if (!sanitized.title) {
      return NextResponse.json({ error: 'Movie title is required' }, { status: 400, headers: corsHeaders() });
    }

    const imdbId = sanitized.imdbId;
    if (imdbId) {
      const existing = await mediaRepository.findByImdbId(imdbId);
      if (existing) {
        return NextResponse.json({ error: 'Movie with this IMDb ID already exists' }, { status: 409, headers: corsHeaders() });
      }
    }

    const newMovie: MovieItem = {
      id: crypto.randomUUID(),
      title: sanitized.title,
      type: 'movie',
      posterUrl: sanitized.posterUrl,
      backdropUrl: sanitized.backdropUrl,
      releaseYear: sanitized.releaseYear,
      status: sanitized.status || 'watching',
      rating: sanitized.rating,
      genres: sanitized.genres || [],
      plot: sanitized.plot,
      notes: sanitized.notes,
      durationMinutes: sanitized.durationMinutes,
      director: sanitized.director,
      imdbId: sanitized.imdbId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await mediaRepository.createItem(newMovie);
    return NextResponse.json(created, { status: 201, headers: corsHeaders() });
  } catch (err: any) {
    console.error('Error adding movie:', err);
    return NextResponse.json({ error: 'Failed to add movie' }, { status: 500, headers: corsHeaders() });
  }
}
