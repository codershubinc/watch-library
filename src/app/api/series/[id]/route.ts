import { NextRequest, NextResponse } from 'next/server';
import { initMongo, mediaRepository } from '@/db';
import { guardReadOnly, guardMutation } from '@/server/auth';
import { sanitizeSeriesInput } from '@/models';
import { handleCorsOptions, corsHeaders } from '@/server/cors';

export async function OPTIONS() {
  return handleCorsOptions();
}

// GET /api/series/[id] (Public read with 30/sec rate limit; unlimited with API key)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardReadOnly(req);
  if (!guard.allowed) {
    return guard.response!;
  }

  try {
    await initMongo();
    const { id } = await params;
    const series = await mediaRepository.findSeriesById(id);

    if (!series) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404, headers: guard.headers });
    }
    return NextResponse.json(series, { headers: guard.headers });
  } catch (err: any) {
    console.error('Error fetching series:', err);
    return NextResponse.json({ error: 'Failed to fetch series' }, { status: 500, headers: guard.headers });
  }
}

// PUT /api/series/[id] (Requires API Key or Admin Session)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await guardMutation(req);
  if (unauth) return unauth;

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

// DELETE /api/series/[id] (Requires API Key or Admin Session)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await guardMutation(req);
  if (unauth) return unauth;

  try {
    await initMongo();
    const { id } = await params;
    const existing = await mediaRepository.findSeriesById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404, headers: corsHeaders() });
    }

    await mediaRepository.deleteItem(id);
    return NextResponse.json({ message: 'Series deleted successfully' }, { headers: corsHeaders() });
  } catch (err: any) {
    console.error('Error deleting series:', err);
    return NextResponse.json({ error: 'Failed to delete series' }, { status: 500, headers: corsHeaders() });
  }
}
