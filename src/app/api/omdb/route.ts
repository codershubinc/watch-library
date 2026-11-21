import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/server/auth';
import { handleCorsOptions, corsHeaders } from '@/server/cors';

export async function OPTIONS() {
  return handleCorsOptions();
}

// GET /api/omdb (Admin only)
export async function GET(req: NextRequest) {
  if (!(await isAuthorizedAdmin(req))) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin authentication or valid API key required' },
      { status: 401, headers: corsHeaders() }
    );
  }

  try {
    const apiKey = process.env.OMDB_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OMDB_API_KEY is not configured in .env' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const { searchParams } = new URL(req.url);
    const title = searchParams.get('t');
    if (!title) {
      return NextResponse.json({ error: 'Title or IMDB ID is required' }, { status: 400, headers: corsHeaders() });
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
      return NextResponse.json({ error: data.Error || 'Not found on OMDB' }, { status: 404, headers: corsHeaders() });
    }

    return NextResponse.json(data, { headers: corsHeaders() });
  } catch (err: any) {
    console.error('OMDB fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch from OMDB' }, { status: 500, headers: corsHeaders() });
  }
}
