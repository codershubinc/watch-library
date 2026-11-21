import { NextRequest, NextResponse } from 'next/server';
import { initMongo, mediaRepository } from '@/db';
import { guardReadOnly } from '@/server/auth';
import { handleCorsOptions } from '@/server/cors';

export async function OPTIONS() {
  return handleCorsOptions();
}

// GET /api/imdb/[id]
// Checks if title exists by IMDb ID (e.g. tt1375666) or Title (e.g. Inception)
// Public read with 30/sec rate limit; unlimited with API key
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardReadOnly(req);
  if (!guard.allowed) {
    return guard.response!;
  }

  try {
    await initMongo();
    const { id } = await params;
    const identifier = decodeURIComponent(id || '').trim();

    if (!identifier) {
      return NextResponse.json(
        { success: false, item: null, message: 'IMDb ID or Title parameter is required' },
        { status: 400, headers: guard.headers }
      );
    }

    // Determine if query looks like an IMDb ID (e.g. tt1234567)
    const isImdbPattern = /^tt\d{5,}$/i.test(identifier);

    let item = null;
    let matchType: 'imdbId' | 'title' = 'imdbId';

    if (isImdbPattern) {
      item = await mediaRepository.findByImdbId(identifier);
      if (!item) {
        // Fallback: check if any title matches this string
        item = await mediaRepository.findByTitle(identifier);
        if (item) matchType = 'title';
      }
    } else {
      // Query is a movie/series title
      matchType = 'title';
      item = await mediaRepository.findByTitle(identifier);
      if (!item) {
        // Fallback: check imdbId just in case
        item = await mediaRepository.findByImdbId(identifier);
        if (item) matchType = 'imdbId';
      }
    }

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          item: null,
          message: `No media found matching ${isImdbPattern ? 'IMDb ID' : 'title'}: "${identifier}"`,
        },
        { status: 404, headers: guard.headers }
      );
    }

    return NextResponse.json(
      {
        success: true,
        matchType,
        item,
      },
      { headers: guard.headers }
    );
  } catch (err: any) {
    console.error('Error finding entry by IMDb ID or Title:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to search by identifier' },
      { status: 500, headers: guard.headers }
    );
  }
}
