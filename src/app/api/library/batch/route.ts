import { NextRequest, NextResponse } from 'next/server';
import { initMongo, mediaRepository } from '@/db';
import { guardMutation } from '@/server/auth';
import { handleCorsOptions, corsHeaders } from '@/server/cors';

export async function OPTIONS() {
  return handleCorsOptions();
}

// POST /api/library/batch (Requires API Key or Admin Session)
// Accepts: { items: [...], onDuplicate: 'skip' | 'update' }
export async function POST(req: NextRequest) {
  const unauth = await guardMutation(req);
  if (unauth) return unauth;

  // Max 5MB batch payload limit
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Payload exceeds 5MB batch limit' }, { status: 413, headers: corsHeaders() });
  }

  try {
    await initMongo();
    const body = await req.json();
    const { items, onDuplicate } = body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'An array of "items" is required in request body' },
        { status: 400, headers: corsHeaders() }
      );
    }

    if (items.length > 1000) {
      return NextResponse.json(
        { error: 'Batch import limit is 1,000 items per request' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const result = await mediaRepository.batchImport(
      items,
      onDuplicate === 'update' ? 'update' : 'skip'
    );

    return NextResponse.json(
      {
        success: true,
        message: `Successfully processed ${result.totalProcessed} items (Added: ${result.added}, Updated: ${result.updated}, Skipped: ${result.skipped})`,
        ...result,
      },
      { status: 201, headers: corsHeaders() }
    );
  } catch (err: any) {
    console.error('Error during batch import:', err);
    return NextResponse.json({ error: 'Failed to process batch import' }, { status: 500, headers: corsHeaders() });
  }
}
