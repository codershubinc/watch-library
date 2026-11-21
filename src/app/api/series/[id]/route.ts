import { NextRequest, NextResponse } from 'next/server';
import { initMongo, mediaRepository } from '@/db';
import { isAuthorizedAdmin } from '@/server/auth';
import { sanitizeSeriesInput } from '@/models';
import { handleCorsOptions, corsHeaders } from '@/server/cors';

export async function OPTIONS() {
  return handleCorsOptions();
}

// GET /api/series/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initMongo();
    const { id } = await params;
    const series = await mediaRepository.findSeriesById(id);

    if (!series) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404, headers: corsHeaders() });
    }
    return NextResponse.json(series, { headers: corsHeaders() });
  } catch (err: any) {
    console.error('Error fetching series:', err);
    return NextResponse.json({ error: 'Failed to fetch series' }, { status: 500, headers: corsHeaders() });
  }
}

// PUT /api/series/[id] (Admin or API Key Bearer)
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
    const existing = await mediaRepository.findSeriesById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404, headers: corsHeaders() });
    }

    const body = await req.json();
    const sanitizedUpdates = sanitizeSeriesInput(body);

    const updated = await mediaRepository.updateItem(id, sanitizedUpdates);
    return NextResponse.json(updated, { headers: corsHeaders() });
  } catch (err: any) {
    console.error('Error updating series:', err);
    return NextResponse.json({ error: 'Failed to update series' }, { status: 500, headers: corsHeaders() });
  }
}

// DELETE /api/series/[id] (Admin or API Key Bearer)
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
    const existing = await mediaRepository.findSeriesById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404, headers: corsHeaders() });
    }

    const success = await mediaRepository.deleteItem(id);
    return NextResponse.json({ success, message: 'Series deleted successfully' }, { headers: corsHeaders() });
  } catch (err: any) {
    console.error('Error deleting series:', err);
    return NextResponse.json({ error: 'Failed to delete series' }, { status: 500, headers: corsHeaders() });
  }
}
