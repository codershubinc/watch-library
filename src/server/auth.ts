import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { TokenSession } from '@/models';
import { apiKeyRepository } from '@/db/apiKeyRepository';
import { authRepository, VerifyAuthResult } from '@/db/authRepository';
import { corsHeaders } from '@/server/cors';

/**
 * Verifies the admin password strictly against the MongoDB database.
 * No password checking from environment variables.
 * Uses constant-time SHA-256 digest comparisons to prevent timing side-channel attacks.
 */
export async function verifyPassword(provided: string): Promise<VerifyAuthResult> {
  return authRepository.verifyPassword(provided);
}

// Generate a cryptographically secure random token
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

declare global {
  var _activeTokens: Map<string, TokenSession> | undefined;
  var _loginAttempts: Map<string, { count: number; resetAt: number }> | undefined;
  var _getRateLimits: Map<string, number[]> | undefined;
}

export const activeTokens: Map<string, TokenSession> =
  global._activeTokens || (global._activeTokens = new Map<string, TokenSession>());

export function addToken(token: string): void {
  const now = Date.now();
  activeTokens.set(token, {
    createdAt: now,
    expiresAt: now + TOKEN_TTL_MS,
  });
}

export function isTokenValid(token: string): boolean {
  if (!token) return false;
  const session = activeTokens.get(token);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    activeTokens.delete(token);
    return false;
  }
  return true;
}

export function revokeToken(token: string): void {
  activeTokens.delete(token);
}

// -------------------------------------------------------------
// In-memory rate limiting for login attempts (Brute-force shield)
// -------------------------------------------------------------
const loginAttempts =
  global._loginAttempts || (global._loginAttempts = new Map<string, { count: number; resetAt: number }>());
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function isLoginRateLimited(ip: string): boolean {
  const entry = loginAttempts.get(ip);
  if (!entry) return false;
  if (Date.now() > entry.resetAt) {
    loginAttempts.delete(ip);
    return false;
  }
  return entry.count >= MAX_LOGIN_ATTEMPTS;
}

export function recordLoginAttempt(ip: string, success: boolean): void {
  if (success) {
    loginAttempts.delete(ip);
    return;
  }
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

// -------------------------------------------------------------
// Rate Limiter for Public Read-Only / GET Requests (30/sec)
// -------------------------------------------------------------
export const GET_RATE_LIMIT = 30; // 30 requests per second
export const GET_WINDOW_MS = 1000; // 1-second sliding window

const getRateLimits: Map<string, number[]> =
  global._getRateLimits || (global._getRateLimits = new Map<string, number[]>());

export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  return '127.0.0.1';
}

export function checkGetRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
} {
  const now = Date.now();
  const cutoff = now - GET_WINDOW_MS;

  // Cleanup map if it grows excessively
  if (getRateLimits.size > 5000) {
    for (const [key, timestamps] of getRateLimits.entries()) {
      if (timestamps.length === 0 || timestamps[timestamps.length - 1] < cutoff) {
        getRateLimits.delete(key);
      }
    }
  }

  let timestamps = getRateLimits.get(ip);
  if (!timestamps) {
    timestamps = [];
    getRateLimits.set(ip, timestamps);
  }

  const recent = timestamps.filter((t) => t > cutoff);

  if (recent.length >= GET_RATE_LIMIT) {
    const oldest = recent[0] || cutoff;
    const resetMs = oldest + GET_WINDOW_MS - now;
    return {
      allowed: false,
      remaining: 0,
      resetSeconds: Math.max(1, Math.ceil(resetMs / 1000)),
    };
  }

  recent.push(now);
  getRateLimits.set(ip, recent);

  return {
    allowed: true,
    remaining: GET_RATE_LIMIT - recent.length,
    resetSeconds: 1,
  };
}

// -------------------------------------------------------------
// Unified API Key / Admin Bearer Authentication
// -------------------------------------------------------------

/**
 * Standard Web Request auth validator for Next.js Route Handlers.
 * Validates:
 * 1. Bearer token in 'Authorization: Bearer ...' (Admin session or wl_live_ API key)
 * 2. 'x-api-key: ...' header
 * 3. '?apiKey=...' or '?api_key=...' URL parameter
 */
export async function isAuthorizedAdmin(req: Request): Promise<boolean> {
  let token: string | null = null;

  // 1. Authorization: Bearer <token>
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1] || null;
  }

  // 2. x-api-key header
  if (!token) {
    token = req.headers.get('x-api-key');
  }

  // 3. Query string apiKey / api_key
  if (!token) {
    try {
      const url = new URL(req.url);
      token = url.searchParams.get('apiKey') || url.searchParams.get('api_key');
    } catch {
      // ignore
    }
  }

  if (!token) return false;

  // 1. Check active session tokens
  if (isTokenValid(token)) {
    return true;
  }

  // 2. Check API keys passed as Bearer tokens
  if (token.startsWith('wl_live_')) {
    return await apiKeyRepository.validateKey(token);
  }

  return false;
}

// -------------------------------------------------------------
// Endpoint Guards
// -------------------------------------------------------------

/**
 * Guards mutating endpoints (POST, PUT, PATCH, DELETE).
 * Requires a valid API Key or Admin Session Token.
 * Returns null if authorized, or a 401 NextResponse if unauthorized.
 */
export async function guardMutation(req: Request): Promise<NextResponse | null> {
  const authorized = await isAuthorizedAdmin(req);
  if (!authorized) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized: Valid API key (Authorization: Bearer wl_live_...) or Admin session token required.',
      },
      {
        status: 401,
        headers: corsHeaders(),
      }
    );
  }
  return null;
}

export interface ReadOnlyGuardResult {
  allowed: boolean;
  isKeyHolder: boolean;
  headers: Record<string, string>;
  response?: NextResponse;
}

/**
 * Guards read-only / GET endpoints:
 * - If called WITH a valid API key or admin token: unlimited access.
 * - If called WITHOUT an API key: rate limited to 30 requests/second per IP.
 */
export async function guardReadOnly(req: Request): Promise<ReadOnlyGuardResult> {
  const isKeyHolder = await isAuthorizedAdmin(req);
  if (isKeyHolder) {
    return {
      allowed: true,
      isKeyHolder: true,
      headers: {
        ...corsHeaders(),
        'X-RateLimit-Limit': 'unlimited',
      },
    };
  }

  // Unauthenticated GET: Enforce 30 req/sec per IP
  const ip = getClientIp(req);
  const result = checkGetRateLimit(ip);

  const rateHeaders: Record<string, string> = {
    ...corsHeaders(),
    'X-RateLimit-Limit': `${GET_RATE_LIMIT}`,
    'X-RateLimit-Remaining': `${result.remaining}`,
    'X-RateLimit-Reset': `${result.resetSeconds}`,
  };

  if (!result.allowed) {
    return {
      allowed: false,
      isKeyHolder: false,
      headers: rateHeaders,
      response: NextResponse.json(
        {
          success: false,
          error: `Rate limit exceeded. Maximum ${GET_RATE_LIMIT} requests per second for unauthenticated requests. Please provide an API key (Authorization: Bearer wl_live_...) for unrestricted access.`,
          limit: GET_RATE_LIMIT,
          window: '1 second',
        },
        {
          status: 429,
          headers: {
            ...rateHeaders,
            'Retry-After': `${result.resetSeconds}`,
          },
        }
      ),
    };
  }

  return {
    allowed: true,
    isKeyHolder: false,
    headers: rateHeaders,
  };
}
