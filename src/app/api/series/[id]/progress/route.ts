import { NextRequest, NextResponse } from 'next/server';
import { initMongo, mediaRepository } from '@/db';
import { isAuthorizedAdmin } from '@/server/auth';
import { handleCorsOptions, corsHeaders } from '@/server/cors';

export async function OPTIONS() {
  return handleCorsOptions();
}

// PATCH /api/series/[id]/progress (Admin or API Key Bearer)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthorizedAdmin(req))) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin authentication or valid API key required' },
      { status: 401, headers: corsHeaders() }
    );
  }

  try {
    await initMongo();
    const { id } = await params;
    const series = await mediaRepository.findSeriesById(id);
    if (!series) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404, headers: corsHeaders() });
    }

    const body = await req.json();
    const { season, episode, status } = body;

    if (season === undefined && episode === undefined && !status) {
      return NextResponse.json(
        { error: 'Season, episode, or status update required' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const updated = await mediaRepository.updateProgress(
      id,
      season !== undefined ? Number(season) : undefined,
      episode !== undefined ? Number(episode) : undefined,
      status
    );

    return NextResponse.json(updated, { headers: corsHeaders() });
  } catch (err: any) {
    console.error('Error updating series progress:', err);
    return NextResponse.json(
      { error: 'Failed to update series watching progress' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
