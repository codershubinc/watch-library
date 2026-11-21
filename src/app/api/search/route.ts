import { NextRequest, NextResponse } from 'next/server';
import { initMongo, mediaRepository } from '@/db';
import { guardReadOnly } from '@/server/auth';
import { handleCorsOptions } from '@/server/cors';

export async function OPTIONS() {
  return handleCorsOptions();
}

// GET /api/search?q=query&limit=20 (Fast title, director, network, genre search)
// Public with 30/s rate limit; unlimited with API key
export async function GET(req: NextRequest) {
  const guard = await guardReadOnly(req);
  if (!guard.allowed) {
    return guard.response!;
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || searchParams.get('query') || '';
  const rawLimit = parseInt(searchParams.get('limit') || '20', 10);
  const limit = isNaN(rawLimit) || rawLimit <= 0 ? 20 : Math.min(rawLimit, 100);

  if (!q.trim()) {
    return NextResponse.json({ query: '', results: [], total: 0 }, { headers: guard.headers });
  }

  try {
    await initMongo();
    const results = await mediaRepository.search(q, limit);
    return NextResponse.json(
      {
        query: q.trim(),
        total: results.length,
        results,
      },
      { headers: guard.headers }
    );
  } catch (err: any) {
    console.error('Error during search:', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500, headers: guard.headers });
  }
}
