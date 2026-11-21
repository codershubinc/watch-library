import { NextRequest, NextResponse } from 'next/server';
import { initMongo, mediaRepository } from '@/db';
import { isAuthorizedAdmin } from '@/server/auth';
import { sanitizeMediaInput } from '@/models';
import { handleCorsOptions, corsHeaders } from '@/server/cors';

export async function OPTIONS() {
  return handleCorsOptions();
}

// PUT /api/library/[id] (Admin or API Key Bearer)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthorizedAdmin(req))) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin authentication or valid API key required' },
      { status: 401, headers: corsHeaders() }
    );
  }

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

// DELETE /api/library/[id] (Admin or API Key Bearer)
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

    const success = await mediaRepository.deleteItem(id);
    return NextResponse.json({ success, message: 'Item removed successfully' }, { headers: corsHeaders() });
  } catch (err: any) {
    console.error('Error deleting item:', err);
    return NextResponse.json({ error: 'Failed to delete media item' }, { status: 500, headers: corsHeaders() });
  }
}
