'use client';

import { useState, useRef, useCallback, type DragEvent } from 'react';
import { Upload, ImagePlus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// ── Types ────────────────────────────────────────────────────────
interface ImageUploaderProps {
  /** Current image URL (if already set) */
  value?: string;
  /** Callback when upload completes — returns the URL of uploaded image */
  onUpload: (url: string) => void;
  /** Callback to clear the current image */
  onClear?: () => void;
  /** Optional class name */
  className?: string;
}

// ── Constants ────────────────────────────────────────────────────
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml';
const MAX_SIZE_MB = 5;

// ── ImageUploader Component ──────────────────────────────────────
export function ImageUploader({ value, onUpload, onClear, className }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Upload logic ───────────────────────────────────────────────
  const uploadFile = useCallback(async (file: File) => {
    // Validate type
    if (!ACCEPTED_TYPES.split(',').includes(file.type)) {
      toast.error('Tipe file tidak didukung', {
        description: 'Hanya JPG, PNG, GIF, WebP, dan SVG yang diperbolehkan.',
      });
      return;
    }

    // Validate size
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error('Ukuran file terlalu besar', {
        description: `Maksimum ${MAX_SIZE_MB}MB. File Anda: ${(file.size / 1024 / 1024).toFixed(1)}MB`,
      });
      return;
    }

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gagal mengunggah file');
      }

      // Small delay for progress bar to reach 100%
      await new Promise((r) => setTimeout(r, 300));

      onUpload(result.url);
      toast.success('Gambar berhasil diunggah!', {
        description: result.filename,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan';
      toast.error('Gagal mengunggah gambar', { description: message });
      setPreview(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Clean up object URL
      if (preview) URL.revokeObjectURL(preview);
    }
  }, [onUpload, preview]);

  // ── Drag handlers ──────────────────────────────────────────────
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        uploadFile!(files[0]);
      }
    },
    [uploadFile],
  );

  // ── File picker ────────────────────────────────────────────────
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        uploadFile!(files[0]);
      }
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [uploadFile],
  );

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // ── Clear handler ──────────────────────────────────────────────
  const handleClear = useCallback(() => {
    setPreview(null);
    onClear?.();
  }, [onClear]);

  // ── Determine what to show as preview ──────────────────────────
  const displayUrl = preview || value;

  return (
    <div className={className}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Pilih file gambar"
      />

      {/* If there's an existing image, show preview with actions */}
      {displayUrl && !isUploading ? (
        <div className="relative group">
          <div className="rounded-lg border border-app-border overflow-hidden bg-app-elevated/50">
            <img
              src={displayUrl}
              alt="Pratinjau gambar"
              className="w-full max-h-64 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          {/* Action overlay */}
          <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={openFilePicker}
              className="p-1.5 bg-app-surface/90 border border-app-border rounded-lg text-app-secondary hover:text-app-primary hover:bg-app-elevated transition-colors"
              title="Ganti gambar"
            >
              <ImagePlus size={14} />
            </button>
            {onClear && (
              <button
                onClick={handleClear}
                className="p-1.5 bg-app-surface/90 border border-app-border rounded-lg text-app-muted hover:text-red-400 hover:border-red-400/50 transition-colors"
                title="Hapus gambar"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      ) : isUploading ? (
        /* Upload progress state */
        <div className="rounded-lg border border-app-border bg-app-elevated/50 p-6 flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-app-accent animate-spin" />
          <span className="text-sm text-app-secondary">Mengunggah...</span>
          {/* Progress bar */}
          <div className="w-full max-w-xs h-1.5 bg-app-border/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-app-accent rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span className="text-xs text-app-muted">{uploadProgress}%</span>
        </div>
      ) : (
        /* Drop zone — no image yet */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFilePicker}
          className={`
            rounded-lg border-2 border-dashed cursor-pointer
            flex flex-col items-center justify-center gap-2 py-8 px-4
            transition-colors duration-200
            ${
              isDragging
                ? 'border-app-accent bg-app-accent/10 text-app-accent'
                : 'border-app-border/60 bg-app-elevated/30 text-app-muted hover:border-app-accent/40 hover:bg-app-elevated/50'
            }
          `}
          role="button"
          tabIndex={0}
          aria-label="Seret gambar ke sini atau klik untuk memilih file"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openFilePicker();
            }
          }}
        >
          <Upload size={28} className={isDragging ? 'text-app-accent' : 'text-app-muted'} />
          <p className="text-sm font-medium text-app-secondary">
            {isDragging ? 'Lepaskan file di sini' : 'Seret gambar ke sini'}
          </p>
          <p className="text-xs text-app-muted">atau</p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openFilePicker();
            }}
            className="px-3 py-1.5 bg-app-accent/15 border border-app-accent/30 text-app-accent text-xs font-medium rounded-lg hover:bg-app-accent/25 transition-colors"
          >
            Pilih File
          </button>
          <p className="text-[0.65rem] text-app-muted mt-1">
            JPG, PNG, GIF, WebP, SVG • Maks 5MB
          </p>
        </div>
      )}
    </div>
  );
}
