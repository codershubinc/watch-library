import { NextRequest, NextResponse } from 'next/server';
import { initMongo, mediaRepository } from '@/db';
import { guardReadOnly } from '@/server/auth';
import { handleCorsOptions } from '@/server/cors';

export async function OPTIONS() {
  return handleCorsOptions();
}

// GET /api/random?type=movie|series&status=plan_to_watch&genre=Sci-Fi
// Public with 30/s rate limit; unlimited with API key
export async function GET(req: NextRequest) {
  const guard = await guardReadOnly(req);
  if (!guard.allowed) {
    return guard.response!;
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || undefined;
  const status = searchParams.get('status') || undefined;
  const genre = searchParams.get('genre') || undefined;

  try {
    await initMongo();
    const item = await mediaRepository.getRandom({ type, status, genre });

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          item: null,
          message: 'No matching titles found with the specified criteria',
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
    console.error('Error fetching random title:', err);
    return NextResponse.json({ error: 'Failed to pick a random title' }, { status: 500, headers: guard.headers });
  }
}
