import { NextRequest, NextResponse } from 'next/server';
import { initMongo, mediaRepository } from '@/db';
import { guardReadOnly } from '@/server/auth';
import { handleCorsOptions } from '@/server/cors';

export async function OPTIONS() {
  return handleCorsOptions();
}

// GET /api/last-seen (Supports optional ?type=movie|series and ?status=completed|watching|watched)
// Public read with 30/sec rate limit; unlimited with API key
export async function GET(req: NextRequest) {
  const guard = await guardReadOnly(req);
  if (!guard.allowed) {
    return guard.response!;
  }

  try {
    await initMongo();
    const { searchParams } = new URL(req.url);
    const typeParam = searchParams.get('type');
    const type = typeParam === 'movie' || typeParam === 'series' ? typeParam : undefined;

    const rawStatus = searchParams.get('status')?.trim().toLowerCase();
    // Normalize user/agent alias 'watched' to 'completed'
    const status = rawStatus === 'watched' ? 'completed' : rawStatus;

    const item = await mediaRepository.findLastSeen(type, status);

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          item: null,
          message: type ? `No watched ${type} found in library` : 'No watched entries found in library',
        },
        { headers: guard.headers }
      );
    }

    return NextResponse.json(
      {
        success: true,
        item,
      },
      { headers: guard.headers }
    );
  } catch (err: any) {
    console.error('Error fetching last seen entry:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve last seen entry' },
      { status: 500, headers: guard.headers }
    );
  }
}
