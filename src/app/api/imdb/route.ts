import { NextRequest, NextResponse } from 'next/server';
import { initMongo, mediaRepository } from '@/db';
import { guardReadOnly } from '@/server/auth';
import { handleCorsOptions } from '@/server/cors';

export async function OPTIONS() {
  return handleCorsOptions();
}

// GET /api/imdb?id=... or ?imdbId=... or ?title=...
// Checks if title exists by IMDb ID or Title
// Public read with 30/sec rate limit; unlimited with API key
export async function GET(req: NextRequest) {
  const guard = await guardReadOnly(req);
  if (!guard.allowed) {
    return guard.response!;
  }

  try {
    await initMongo();
    const { searchParams } = new URL(req.url);
    const titleParam = searchParams.get('title') || searchParams.get('q');
    const idParam = searchParams.get('id') || searchParams.get('imdbId');

    const identifier = (idParam || titleParam || '').trim();

    if (!identifier) {
      return NextResponse.json(
        { success: false, item: null, message: 'Query parameter "id", "imdbId", or "title" is required' },
        { status: 400, headers: guard.headers }
      );
    }

    // If explicit ?title= was passed, prioritize title search
    let item = null;
    let matchType: 'imdbId' | 'title' = 'imdbId';

    if (titleParam && !idParam) {
      matchType = 'title';
      item = await mediaRepository.findByTitle(titleParam.trim());
      if (!item && /^tt\d{5,}$/i.test(titleParam.trim())) {
        item = await mediaRepository.findByImdbId(titleParam.trim());
        if (item) matchType = 'imdbId';
      }
    } else {
      const isImdbPattern = /^tt\d{5,}$/i.test(identifier);
      if (isImdbPattern) {
        matchType = 'imdbId';
        item = await mediaRepository.findByImdbId(identifier);
        if (!item) {
          item = await mediaRepository.findByTitle(identifier);
          if (item) matchType = 'title';
        }
      } else {
        matchType = 'title';
        item = await mediaRepository.findByTitle(identifier);
        if (!item) {
          item = await mediaRepository.findByImdbId(identifier);
          if (item) matchType = 'imdbId';
        }
      }
    }

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          item: null,
          message: `No media found matching identifier: "${identifier}"`,
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
