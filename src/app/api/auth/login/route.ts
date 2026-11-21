import { NextRequest, NextResponse } from 'next/server';
import {
  verifyPassword,
  generateToken,
  addToken,
  isLoginRateLimited,
  recordLoginAttempt,
} from '@/server/auth';

export async function POST(req: NextRequest) {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : 'client';

  // 1. Rate Limiting Protection (Brute-Force defense)
  if (isLoginRateLimited(clientIp)) {
    return NextResponse.json(
      { error: 'Too many failed login attempts. Please wait 15 minutes before trying again.' },
      { status: 429 }
    );
  }

  // 2. Request payload size limit (Max 32KB for login)
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 32 * 1024) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request' }, { status: 400 });
  }

  const { password } = body || {};
  if (!password || typeof password !== 'string') {
    return NextResponse.json({ error: 'Password is required' }, { status: 400 });
  }

  // 3. Constant-Time Timing-Safe Password Check
  if (verifyPassword(password)) {
    recordLoginAttempt(clientIp, true);
    const token = generateToken();
    addToken(token);
    return NextResponse.json({
      success: true,
      token,
      message: 'Admin authenticated successfully',
    });
  } else {
    recordLoginAttempt(clientIp, false);
    return NextResponse.json(
      { success: false, error: 'Incorrect admin password' },
      { status: 401 }
    );
  }
}
