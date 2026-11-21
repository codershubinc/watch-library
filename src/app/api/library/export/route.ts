import { NextRequest, NextResponse } from 'next/server';
import { initMongo, mediaRepository } from '@/db';
import { guardMutation } from '@/server/auth';
import { handleCorsOptions, corsHeaders } from '@/server/cors';

export async function OPTIONS() {
  return handleCorsOptions();
}

// GET /api/library/export?format=json|csv (Requires API Key or Admin Session)
export async function GET(req: NextRequest) {
  const unauth = await guardMutation(req);
  if (unauth) return unauth;

  try {
    await initMongo();
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';

    const items = await mediaRepository.exportAll();

    if (format === 'csv') {
      const headers = ['id', 'title', 'type', 'releaseYear', 'rating', 'status', 'imdbId', 'genres', 'director', 'durationMinutes', 'totalSeasons', 'totalEpisodes', 'updatedAt'];
      const rows = items.map((item) => [
        `"${item.id}"`,
        `"${(item.title || '').replace(/"/g, '""')}"`,
        `"${item.type || 'movie'}"`,
        item.releaseYear || '',
        item.rating || '',
        `"${item.status || ''}"`,
        `"${item.imdbId || ''}"`,
        `"${(item.genres || []).join('; ')}"`,
        `"${(item.director || '').replace(/"/g, '""')}"`,
        item.durationMinutes || '',
        item.totalSeasons || '',
        item.totalEpisodes || '',
        `"${item.updatedAt || ''}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      return new Response(csvContent, {
        headers: {
          ...corsHeaders(),
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="watch-library-backup-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    // Default JSON format
    return NextResponse.json(
      {
        exportedAt: new Date().toISOString(),
        totalItems: items.length,
        items,
      },
      {
        headers: {
          ...corsHeaders(),
          'Content-Disposition': `attachment; filename="watch-library-backup-${new Date().toISOString().slice(0, 10)}.json"`,
        },
      }
    );
  } catch (err: any) {
    console.error('Error during library export:', err);
    return NextResponse.json({ error: 'Failed to export library' }, { status: 500, headers: corsHeaders() });
  }
}
