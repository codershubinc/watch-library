import { NextRequest, NextResponse } from 'next/server';
import { initMongo, mongoDbConnected } from '@/db';
import { guardReadOnly } from '@/server/auth';
import { handleCorsOptions } from '@/server/cors';

export async function OPTIONS() {
  return handleCorsOptions();
}

// GET /api/status (Public read with 30/sec rate limit; unlimited with API key)
export async function GET(req: NextRequest) {
  const guard = await guardReadOnly(req);
  if (!guard.allowed) {
    return guard.response!;
  }

  await initMongo();

  return NextResponse.json(
    {
      type: mongoDbConnected ? 'mongodb' : 'local',
      connected: mongoDbConnected,
      message: mongoDbConnected
        ? 'Connected to MongoDB'
        : 'Using Local In-Memory Storage (Set MONGODB_URI to connect to MongoDB Atlas)',
    },
    {
      headers: {
        ...guard.headers,
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    }
  );
}
