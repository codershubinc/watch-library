import { NextRequest, NextResponse } from 'next/server';
import { initMongo, mediaRepository } from '@/db';
import { guardReadOnly, guardMutation } from '@/server/auth';
import { sanitizeMediaInput } from '@/models';
import { handleCorsOptions, corsHeaders } from '@/server/cors';

export async function OPTIONS() {
  return handleCorsOptions();
}

// GET /api/library/[id] (Public read with 30/sec rate limit; unlimited with API key)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardReadOnly(req);
  if (!guard.allowed) {
    return guard.response!;
  }

  try {
    await initMongo();
    const { id } = await params;
    const item = await mediaRepository.findItemById(id);
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404, headers: guard.headers });
    }
    return NextResponse.json(item, { headers: guard.headers });
  } catch (err: any) {
    console.error('Error fetching item:', err);
    return NextResponse.json({ error: 'Failed to fetch media item' }, { status: 500, headers: guard.headers });
  }
}

// PUT /api/library/[id] (Requires API Key or Admin Session)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await guardMutation(req);
  if (unauth) return unauth;

  // Request payload size limit (Max 1MB)
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 1024 * 1024) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413, headers: corsHeaders() });
  }

  try {
    await initMongo();
    const { id } = await params;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Valid ID is required' }, { status: 400, headers: corsHeaders() });
    }

    const body = await req.json();
    const sanitizedUpdates = sanitizeMediaInput(body);

    const updatedItem = await mediaRepository.updateItem(id, sanitizedUpdates);
    if (!updatedItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404, headers: corsHeaders() });
    }
    return NextResponse.json(updatedItem, { headers: corsHeaders() });
  } catch (err: any) {
    console.error('Error updating item:', err);
    return NextResponse.json({ error: 'Failed to update media item' }, { status: 500, headers: corsHeaders() });
  }
}

// DELETE /api/library/[id] (Requires API Key or Admin Session)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await guardMutation(req);
  if (unauth) return unauth;

  try {
    await initMongo();
    const { id } = await params;

    const success = await mediaRepository.deleteItem(id);
    return NextResponse.json({ success, message: 'Item removed successfully' }, { headers: corsHeaders() });
  } catch (err: any) {
    console.error('Error deleting item:', err);
    return NextResponse.json({ error: 'Failed to delete media item' }, { status: 500, headers: corsHeaders() });
  }
}
