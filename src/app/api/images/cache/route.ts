import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import net from 'net';
import dns from 'dns';
import { guardReadOnly } from '@/server/auth';
import { handleCorsOptions } from '@/server/cors';

export async function OPTIONS() {
  return handleCorsOptions();
}

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

function isPrivateOrReservedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
      return true;
    }
    if (parts[0] === 0) return true;
    if (parts[0] === 10) return true;
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 0 && parts[2] === 0) return true;
    if (parts[0] === 192 && parts[1] === 0 && parts[2] === 2) return true;
    if (parts[0] === 192 && parts[1] === 88 && parts[2] === 99) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 198 && (parts[1] === 18 || parts[1] === 19)) return true;
    if (parts[0] === 198 && parts[1] === 51 && parts[2] === 100) return true;
    if (parts[0] === 203 && parts[1] === 0 && parts[2] === 113) return true;
    if (parts[0] >= 224 && parts[0] <= 239) return true;
    if (parts[0] >= 240) return true;
    if (ip === '255.255.255.255') return true;

    return false;
  }

  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;
    if (lower === '::' || lower === '0:0:0:0:0:0:0:0') return true;
    if (lower.startsWith('::ffff:')) {
      const v4Part = lower.replace('::ffff:', '');
      return isPrivateOrReservedIp(v4Part);
    }
    if (/^f[cd][0-9a-f]{2}:/i.test(lower)) return true;
    if (/^fe[89ab][0-9a-f]:/i.test(lower)) return true;

    return false;
  }

  return true;
}

async function isSafeUrl(targetUrl: string): Promise<boolean> {
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.localhost')
    ) {
      return false;
    }

    const addresses = await dns.promises.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      return false;
    }

    for (const record of addresses) {
      if (isPrivateOrReservedIp(record.address)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

async function fetchSafeImage(initialUrl: string): Promise<{ buffer: Buffer; contentType: string }> {
  let currentUrl = initialUrl;
  let redirects = 0;
  const maxRedirects = 3;

  while (redirects <= maxRedirects) {
    const safe = await isSafeUrl(currentUrl);
    if (!safe) {
      throw new Error('Restricted or unsafe image URL');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let res: globalThis.Response;
    try {
      res = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: 'manual',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        },
      });
    } finally {
      clearTimeout(timeout);
    }

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const location = res.headers.get('location');
      if (!location) {
        throw new Error('Redirect missing location header');
      }
      currentUrl = new URL(location, currentUrl).toString();
      redirects++;
      continue;
    }

    if (!res.ok) {
      throw new Error(`Remote image server returned status ${res.status}`);
    }

    const rawContentType = res.headers.get('content-type') || '';
    const cleanContentType = rawContentType.split(';')[0].trim().toLowerCase();

    if (!ALLOWED_MIME_TYPES.has(cleanContentType)) {
      throw new Error(`Unsupported or unsafe content type: ${cleanContentType || 'unknown'}`);
    }

    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_IMAGE_SIZE_BYTES) {
      throw new Error('Image exceeds maximum allowed size (10MB)');
    }

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
      throw new Error('Image exceeds maximum allowed size (10MB)');
    }

    return {
      buffer: Buffer.from(arrayBuffer),
      contentType: cleanContentType,
    };
  }

  throw new Error('Too many redirects');
}

export async function GET(req: NextRequest) {
  const guard = await guardReadOnly(req);
  if (!guard.allowed) {
    return guard.response!;
  }

  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({ error: 'Query parameter "url" is required' }, { status: 400, headers: guard.headers });
  }

  // Generate deterministic ETag based on image URL
  const hash = crypto.createHash('sha256').update(imageUrl).digest('hex');
  const etag = `"${hash}"`;

  // 1. Browser HTTP conditional caching check (If-None-Match)
  const ifNoneMatch = req.headers.get('if-none-match');
  if (ifNoneMatch === etag || ifNoneMatch === hash) {
    return new Response(null, {
      status: 304,
      headers: {
        ...guard.headers,
        ETag: etag,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  // 2. Fetch remote image securely in memory (no disk caching)
  try {
    const { buffer, contentType } = await fetchSafeImage(imageUrl);

    return new Response(buffer, {
      headers: {
        ...guard.headers,
        'Content-Type': contentType,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=31536000, immutable',
        ETag: etag,
      },
    });
  } catch (fetchErr: any) {
    console.error('[ImageCache] Failed to fetch image:', fetchErr?.message || fetchErr);
    return NextResponse.json(
      { error: fetchErr?.message || 'Failed to retrieve remote image' },
      { status: 400, headers: guard.headers }
    );
  }
}
