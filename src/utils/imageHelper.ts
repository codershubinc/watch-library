/**
 * Converts a remote image URL to use the local server-side image cache proxy.
 * If the image URL is already a relative path, data URL, or empty, it is returned as is.
 */
export function getImageCacheUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();

  // If already relative, data URL, or blob URL, return directly
  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // If http or https, route through server cache proxy
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return `/api/images/cache?url=${encodeURIComponent(trimmed)}`;
  }

  return trimmed;
}

export const FALLBACK_MEDIA_POSTER =
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop';
