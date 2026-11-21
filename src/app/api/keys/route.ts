import { NextRequest, NextResponse } from 'next/server';
import { initMongo, apiKeyRepository } from '@/db';
import { guardMutation } from '@/server/auth';
import { handleCorsOptions, corsHeaders } from '@/server/cors';

export async function OPTIONS() {
  return handleCorsOptions();
}

// GET /api/keys (Requires API Key or Admin Session)
export async function GET(req: NextRequest) {
  const unauth = await guardMutation(req);
  if (unauth) return unauth;

  try {
    await initMongo();
    const keys = await apiKeyRepository.listKeys();
    return NextResponse.json({ keys }, { headers: corsHeaders() });
  } catch (err: any) {
    console.error('Error listing API keys:', err);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// POST /api/keys (Requires API Key or Admin Session)
export async function POST(req: NextRequest) {
  const unauth = await guardMutation(req);
  if (unauth) return unauth;

  try {
    await initMongo();
    const body = await req.json();
    const { name, scope } = body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'A descriptive name for the API key is required' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const created = await apiKeyRepository.createKey(
      name.trim(),
      scope === 'read_only' ? 'read_only' : 'full_access'
    );

    return NextResponse.json(created, { status: 201, headers: corsHeaders() });
  } catch (err: any) {
    console.error('Error generating API key:', err);
    return NextResponse.json(
      { error: 'Failed to generate API key' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
