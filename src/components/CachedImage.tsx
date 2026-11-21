import React, { useState } from 'react';
import { getImageCacheUrl, FALLBACK_MEDIA_POSTER } from '../utils/imageHelper';

interface CachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  fallbackIcon?: React.ReactNode;
  containerClassName?: string;
}

export const CachedImage: React.FC<CachedImageProps> = ({
  src,
  alt,
  className = '',
  containerClassName = '',
  fallbackSrc = FALLBACK_MEDIA_POSTER,
  fallbackIcon,
  loading = 'lazy',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // If no source is provided at all
  if (!src) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-slate-900 ${containerClassName}`}>
        {fallbackIcon || null}
      </div>
    );
  }

  const effectiveSrc = hasError
    ? fallbackSrc
    : typeof src === 'string'
      ? getImageCacheUrl(src)
      : fallbackSrc;

  return (
    <div className={`relative w-full h-full overflow-hidden ${containerClassName}`}>
      {/* Loading Skeleton / Shimmer */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-slate-900 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border border-slate-700/50" />
        </div>
      )}

      <img
        src={effectiveSrc}
        alt={alt || ''}
        loading={loading}
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          if (!hasError) {
            setHasError(true);
            setIsLoaded(true);
          }
        }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        {...props}
      />
    </div>
  );
};
