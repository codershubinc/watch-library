import { NextRequest, NextResponse } from 'next/server';
import { initMongo, mediaRepository } from '@/db';
import { guardReadOnly } from '@/server/auth';
import { handleCorsOptions } from '@/server/cors';

export async function OPTIONS() {
  return handleCorsOptions();
}

// GET /api/stats (Public with 30/s rate limit; unlimited with API key)
export async function GET(req: NextRequest) {
  const guard = await guardReadOnly(req);
  if (!guard.allowed) {
    return guard.response!;
  }

  try {
    await initMongo();
    const stats = await mediaRepository.getStats();
    return NextResponse.json(stats, { headers: guard.headers });
  } catch (err: any) {
    console.error('Error fetching library stats:', err);
    return NextResponse.json({ error: 'Failed to compute library statistics' }, { status: 500, headers: guard.headers });
  }
}
