import { NextRequest, NextResponse } from 'next/server';
import { isTokenValid } from '@/server/auth';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ isAdmin: false });
  }

  const token = authHeader.split(' ')[1];
  const isValid = token ? await isTokenValid(token) : false;
  return NextResponse.json({ isAdmin: isValid });
}
