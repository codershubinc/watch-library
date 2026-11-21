import { NextRequest, NextResponse } from 'next/server';
import { initMongo, apiKeyRepository } from '@/db';
import { isAuthorizedAdmin } from '@/server/auth';
import { handleCorsOptions, corsHeaders } from '@/server/cors';

export async function OPTIONS() {
  return handleCorsOptions();
}

// DELETE /api/keys/[id] (Admin only: Revokes an API key)
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
