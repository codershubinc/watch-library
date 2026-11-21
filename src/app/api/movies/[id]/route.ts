import { NextRequest, NextResponse } from 'next/server';
import { initMongo, mediaRepository } from '@/db';
import { isAuthorizedAdmin } from '@/server/auth';
import { sanitizeMovieInput } from '@/models';
import { handleCorsOptions, corsHeaders } from '@/server/cors';

export async function OPTIONS() {
  return handleCorsOptions();
}

// GET /api/movies/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initMongo();
    const { id } = await params;
    const movie = await mediaRepository.findMovieById(id);

    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404, headers: corsHeaders() });
    }
    return NextResponse.json(movie, { headers: corsHeaders() });
  } catch (err: any) {
    console.error('Error fetching movie:', err);
    return NextResponse.json({ error: 'Failed to fetch movie' }, { status: 500, headers: corsHeaders() });
  }
}

// PUT /api/movies/[id] (Admin or API Key Bearer)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const { id } = await params;
    const existing = await mediaRepository.findMovieById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404, headers: corsHeaders() });
    }

    const body = await req.json();
    const sanitizedUpdates = sanitizeMovieInput(body);

    const updated = await mediaRepository.updateItem(id, sanitizedUpdates);
    return NextResponse.json(updated, { headers: corsHeaders() });
  } catch (err: any) {
    console.error('Error updating movie:', err);
    return NextResponse.json({ error: 'Failed to update movie' }, { status: 500, headers: corsHeaders() });
  }
}

// DELETE /api/movies/[id] (Admin or API Key Bearer)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthorizedAdmin(req))) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin authentication or valid API key required' },
      { status: 401, headers: corsHeaders() }
    );
  }

  try {
    await initMongo();
    const { id } = await params;
    const existing = await mediaRepository.findMovieById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404, headers: corsHeaders() });
    }

    const success = await mediaRepository.deleteItem(id);
    return NextResponse.json({ success, message: 'Movie deleted successfully' }, { headers: corsHeaders() });
  } catch (err: any) {
    console.error('Error deleting movie:', err);
    return NextResponse.json({ error: 'Failed to delete movie' }, { status: 500, headers: corsHeaders() });
  }
}
