'use client';
import { useState, useRef } from 'react';
import { uploadImage } from '../../services/firebaseStorage';
import { isFirebaseConfigured } from '../../services/firebase';
import { isUploadingPlaceholder } from '../../services/storageMigration';
import type { Settings } from '../../types';

// Compression settings for base64 fallback (when Firebase Storage is not available)
const FALLBACK_MAX_DIMENSION = 1200;
const FALLBACK_JPEG_QUALITY = 0.7;
// Thumbnail for preview when uploading to Storage
const PREVIEW_MAX_DIMENSION = 400;

/**
 * Process an image file for upload.
 * - forStorage=true: original file as blob (no quality loss), small preview dataUrl
 * - forStorage=false: resized + JPEG compressed for localStorage
 */
export function compressImage(file: File, forStorage = false): Promise<{ dataUrl: string; blob: Blob }> {
  if (forStorage) {
    // Storage mode: keep original quality, generate small preview only
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Generate a small preview for immediate display
        let { width, height } = img;
        if (width > PREVIEW_MAX_DIMENSION || height > PREVIEW_MAX_DIMENSION) {
          const ratio = Math.min(PREVIEW_MAX_DIMENSION / width, PREVIEW_MAX_DIMENSION / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        URL.revokeObjectURL(img.src);
        resolve({ dataUrl, blob: file });
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        const reader = new FileReader();
        reader.onload = () => resolve({ dataUrl: reader.result as string, blob: file });
        reader.readAsDataURL(file);
      };
      img.src = URL.createObjectURL(file);
    });
  }

  // Fallback mode: compress for localStorage
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > FALLBACK_MAX_DIMENSION || height > FALLBACK_MAX_DIMENSION) {
        const ratio = Math.min(FALLBACK_MAX_DIMENSION / width, FALLBACK_MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', FALLBACK_JPEG_QUALITY);
      canvas.toBlob(
        (blob) => {
          resolve({ dataUrl, blob: blob || new Blob([dataUrl], { type: 'image/jpeg' }) });
        },
        'image/jpeg',
        FALLBACK_JPEG_QUALITY,
      );
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve({ dataUrl, blob: file });
      };
      reader.readAsDataURL(file);
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}

/** Read Firebase settings from localStorage (avoids hook dependency) */
function getSettings(): Settings | null {
  try {
    const raw = localStorage.getItem('stock-app-settings');
    if (!raw) return null;
    const s = JSON.parse(raw) as Settings;
    return isFirebaseConfigured(s) ? s : null;
  } catch {
    return null;
  }
}

function LightboxModal({ images, currentIdx, onClose, onNavigate }: {
  images: string[];
  currentIdx: number;
  onClose: () => void;
  onNavigate?: (idx: number) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <img
          src={images[currentIdx]}
          alt="拡大表示"
          className="max-w-full max-h-[85vh] object-contain rounded-lg"
        />
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 bg-bg-card border border-border rounded-full text-text-primary flex items-center justify-center hover:bg-bg-primary"
        >
          ×
        </button>
        {images.length > 1 && onNavigate && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => onNavigate(i)}
                className={`w-2 h-2 rounded-full ${i === currentIdx ? 'bg-accent-cyan' : 'bg-white/40'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageAttachment({ images, onChange, maxImages = 5 }: Props) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = maxImages - images.length;
    const toProcess = files.slice(0, remaining);
    const settings = getSettings();

    const useStorage = !!settings;
    setUploading(true);
    try {
      // Upload all images in parallel for speed
      const uploadPromises = toProcess.map(async (file) => {
        const { dataUrl, blob } = await compressImage(file, useStorage);
        if (settings) {
          try {
            return await uploadImage(settings, blob);
          } catch (err) {
            console.error('[ImageAttachment] Storage upload failed, using base64:', err);
            const fallback = await compressImage(file, false);
            return fallback.dataUrl;
          }
        }
        return dataUrl;
      });

      const newUrls = await Promise.all(uploadPromises);
      onChange([...images, ...newUrls]);
    } finally {
      setUploading(false);
    }

    e.target.value = '';
  };

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <>
      <div className="space-y-2">
        {images.length > 0 && (
          <div className="flex flex-col gap-1">
            {images.map((img, i) => (
              <div key={i} className="relative group" style={{ width: 48, height: 48 }}>
                {isUploadingPlaceholder(img) ? (
                  <div className="w-12 h-12 rounded border border-border bg-bg-secondary flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 animate-spin text-text-secondary" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                ) : (
                  <img
                    src={img}
                    alt={`添付${i + 1}`}
                    width={48}
                    height={48}
                    loading="lazy"
                    decoding="async"
                    className="rounded object-cover cursor-pointer border border-border"
                    onClick={() => setLightboxIdx(i)}
                  />
                )}
                <button
                  onClick={() => handleRemove(i)}
                  className="absolute top-0 right-0 w-4 h-4 bg-black/70 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-bl"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {images.length < maxImages && (
          <>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1 text-xs text-text-secondary/60 hover:text-accent-cyan transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  アップロード中...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  画像を添付
                </>
              )}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </>
        )}
      </div>

      {lightboxIdx !== null && (
        <LightboxModal
          images={images}
          currentIdx={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNavigate={setLightboxIdx}
        />
      )}
    </>
  );
}

export function ImageThumbnails({ images }: { images?: string[] }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {images.map((img, i) => (
          isUploadingPlaceholder(img) ? (
            <div key={i} className="w-12 h-12 rounded border border-border bg-bg-secondary flex items-center justify-center">
              <svg className="w-3.5 h-3.5 animate-spin text-text-secondary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <img
              key={i}
              src={img}
              alt={`添付${i + 1}`}
              width={48}
              height={48}
              loading="lazy"
              decoding="async"
              className="w-12 h-12 rounded object-cover cursor-pointer border border-border hover:border-accent-cyan/50 transition-colors"
              onClick={() => setLightboxIdx(i)}
            />
          )
        ))}
      </div>
      {lightboxIdx !== null && (
        <LightboxModal
          images={images}
          currentIdx={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNavigate={images.length > 1 ? setLightboxIdx : undefined}
        />
      )}
    </>
  );
}
