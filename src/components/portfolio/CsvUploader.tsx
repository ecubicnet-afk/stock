'use client';
import { useState, useRef, useCallback } from 'react';
import { Badge } from '../ui/Badge';

interface FileStatus {
  name: string;
  type: string;
  status: 'success' | 'error' | 'loading';
  message: string;
}

interface CsvUploaderProps {
  onFilesSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  logs?: string[];
}

export function CsvUploader({ onFilesSelected, logs = [] }: CsvUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      Array.from(files).forEach(f => dataTransfer.items.add(f));
      fileInputRef.current.files = dataTransfer.files;
      const event = new Event('change', { bubbles: true });
      fileInputRef.current.dispatchEvent(event);
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const statuses: FileStatus[] = files.map((f) => {
      const isMargin = f.name.toLowerCase().includes('marginbalance');
      return {
        name: f.name,
        type: isMargin ? '信用' : '現物',
        status: 'loading' as const,
        message: '読み込み中...',
      };
    });
    setFileStatuses(statuses);
    onFilesSelected(e);

    // Update statuses after a short delay (parsing is synchronous)
    setTimeout(() => {
      setFileStatuses(prev => prev.map(s => ({
        ...s,
        status: 'success',
        message: '取込完了',
      })));
    }, 500);
  }, [onFilesSelected]);

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-accent-cyan bg-accent-cyan/5'
            : 'border-border hover:border-accent-cyan/50 hover:bg-bg-tertiary/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv"
          onChange={handleChange}
          className="hidden"
        />
        <svg className="w-8 h-8 mx-auto mb-2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-sm text-text-secondary">
          {isDragging ? (
            <span className="text-accent-cyan font-medium">ドロップしてアップロード</span>
          ) : (
            <>楽天証券CSVファイルをドラッグ&ドロップ、または<span className="text-accent-cyan"> クリックして選択</span></>
          )}
        </p>
        <p className="text-xs text-text-muted mt-1">現物2ファイル + 信用1ファイル（任意）</p>
      </div>

      {/* File statuses */}
      {fileStatuses.length > 0 && (
        <div className="space-y-2">
          {fileStatuses.map((file, idx) => (
            <div key={idx} className="flex items-center gap-3 px-3 py-2 bg-bg-primary/50 rounded-lg border border-border">
              <svg className="w-4 h-4 text-text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs text-text-primary flex-1 truncate">{file.name}</span>
              <Badge variant={file.type === '信用' ? 'warning' : 'cyan'}>{file.type}</Badge>
              <Badge variant={file.status === 'success' ? 'success' : file.status === 'error' ? 'danger' : 'info'}>
                {file.message}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Logs */}
      {logs.length > 0 && (
        <div className="max-h-24 overflow-y-auto bg-bg-primary/50 rounded-lg border border-border p-2">
          {logs.slice(0, 10).map((log, idx) => (
            <p key={idx} className="text-[10px] font-mono text-text-muted leading-relaxed">{log}</p>
          ))}
        </div>
      )}
    </div>
  );
}
