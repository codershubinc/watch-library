import { NextRequest, NextResponse } from 'next/server';
import { revokeToken } from '@/server/auth';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    revokeToken(token);
  }
  return NextResponse.json({ success: true, message: 'Logged out' });
}
