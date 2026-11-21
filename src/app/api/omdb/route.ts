import { NextRequest, NextResponse } from 'next/server';
import { guardReadOnly } from '@/server/auth';
import { handleCorsOptions } from '@/server/cors';

export async function OPTIONS() {
  return handleCorsOptions();
}

// GET /api/omdb (Public read with 30/sec rate limit; unlimited with API key)
export async function GET(req: NextRequest) {
  const guard = await guardReadOnly(req);
  if (!guard.allowed) {
    return guard.response!;
  }

  try {
    const apiKey = process.env.OMDB_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OMDB_API_KEY is not configured in .env' },
        { status: 400, headers: guard.headers }
      );
    }

    const { searchParams } = new URL(req.url);
    const title = searchParams.get('t');
    if (!title) {
      return NextResponse.json({ error: 'Title or IMDB ID is required' }, { status: 400, headers: guard.headers });
    }

    const isImdbId = /^tt\d{5,}$/i.test(title.trim());
    let url = `http://www.omdbapi.com/?${isImdbId ? 'i' : 't'}=${encodeURIComponent(title.trim())}&apikey=${apiKey}`;

    const season = searchParams.get('Season');
    if (season) {
      url += `&Season=${encodeURIComponent(season)}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.Response === 'False') {
      return NextResponse.json({ error: data.Error || 'Not found on OMDB' }, { status: 404, headers: guard.headers });
    }

    return NextResponse.json(data, { headers: guard.headers });
  } catch (err: any) {
    console.error('OMDB fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch from OMDB' }, { status: 500, headers: guard.headers });
  }
}
