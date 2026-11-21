import { NextRequest, NextResponse } from 'next/server';
import { initMongo, apiKeyRepository } from '@/db';
import { guardMutation } from '@/server/auth';
import { handleCorsOptions, corsHeaders } from '@/server/cors';

export async function OPTIONS() {
  return handleCorsOptions();
}

// DELETE /api/keys/[id] (Requires API Key or Admin Session)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await guardMutation(req);
  if (unauth) return unauth;

  try {
    await initMongo();
    const { id } = await params;

    const success = await apiKeyRepository.revokeKey(id);
    if (!success) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404, headers: corsHeaders() }
      );
    }

    return NextResponse.json(
      { success: true, message: 'API key revoked successfully' },
      { headers: corsHeaders() }
    );
  } catch (err: any) {
    console.error('Error revoking API key:', err);
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
