import crypto from 'crypto';
import { TokenSession } from '@/models';
import { apiKeyRepository } from '@/db/apiKeyRepository';

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || 'admin123';
}

/**
 * Constant-time password verification using SHA-256 digests and crypto.timingSafeEqual
 * to prevent timing side-channel attacks.
 */
export function verifyPassword(provided: string): boolean {
  if (typeof provided !== 'string') return false;
  const adminPassword = getAdminPassword();
  const providedHash = crypto.createHash('sha256').update(provided).digest();
  const expectedHash = crypto.createHash('sha256').update(adminPassword).digest();
  return crypto.timingSafeEqual(providedHash, expectedHash);
}

// Generate a cryptographically secure random token
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}


const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

declare global {
  var _activeTokens: Map<string, TokenSession> | undefined;
  var _loginAttempts: Map<string, { count: number; resetAt: number }> | undefined;
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

// In-memory rate limiting for login attempts
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

/**
 * Standard Web Request auth validator for Next.js Route Handlers.
 * Validates both Admin session tokens and generated API Keys passed as Bearer tokens.
 */
export async function isAuthorizedAdmin(req: Request): Promise<boolean> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.split(' ')[1];
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
