import { useState, useRef } from 'react';

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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = maxImages - images.length;
    const toProcess = files.slice(0, remaining);

    toProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        onChange([...images, result]);
      };
      reader.readAsDataURL(file);
    });

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
                <img
                  src={img}
                  alt={`添付${i + 1}`}
                  style={{ width: 48, height: 48 }}
                  className="rounded object-cover cursor-pointer border border-border"
                  onClick={() => setLightboxIdx(i)}
                />
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
              className="flex items-center gap-1 text-xs text-text-secondary/60 hover:text-accent-cyan transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              画像を添付
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
          <img
            key={i}
            src={img}
            alt={`添付${i + 1}`}
            className="w-12 h-12 rounded object-cover cursor-pointer border border-border hover:border-accent-cyan/50 transition-colors"
            onClick={() => setLightboxIdx(i)}
          />
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
