import { NextResponse } from 'next/server';
import { initMongo, mongoDbConnected } from '@/db';
import { handleCorsOptions, corsHeaders } from '@/server/cors';

export async function OPTIONS() {
  return handleCorsOptions();
}

export async function GET() {
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
        ...corsHeaders(),
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    }
  );
}
