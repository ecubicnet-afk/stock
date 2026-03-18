'use client';
import { useState, useEffect } from 'react';
import { isUploadingPlaceholder } from '../../services/storageMigration';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  placeholderClassName?: string;
}

export function SafeImage({ src, alt, placeholderClassName, className, onError, style, ...rest }: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error state when src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const srcStr = typeof src === 'string' ? src : undefined;

  // Handle __uploading__ placeholders
  if (srcStr && isUploadingPlaceholder(srcStr)) {
    return (
      <div className={placeholderClassName || className || 'w-12 h-12'} style={style}>
        <div className="w-full h-full rounded border border-border bg-bg-secondary flex items-center justify-center">
          <svg className="w-3.5 h-3.5 animate-spin text-text-secondary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    );
  }

  if (hasError || !srcStr) {
    return (
      <div className={`${placeholderClassName || className || 'w-12 h-12'} rounded border border-border bg-bg-secondary flex items-center justify-center`} style={style}>
        <svg className="w-5 h-5 text-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  const isExternal = srcStr.startsWith('http');

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      referrerPolicy={isExternal ? 'no-referrer' : undefined}
      onError={(e) => {
        setHasError(true);
        onError?.(e);
      }}
      {...rest}
    />
  );
}
