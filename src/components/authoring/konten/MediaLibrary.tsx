'use client';

import { useState, useEffect, useCallback } from 'react';
// All icons migrated to Material Symbols Outlined
import { toast } from 'sonner';

// ── Types ────────────────────────────────────────────────────────
interface MediaImage {
  url: string;
  filename: string;
  size: number;
  lastModified: string;
}

interface MediaLibraryProps {
  /** Callback when user selects an image — returns the URL */
  onSelect: (url: string) => void;
  /** Whether the panel is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
}

// ── Helper: Format file size ─────────────────────────────────────
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ── MediaLibrary Component ───────────────────────────────────────
export function MediaLibrary({ onSelect, isOpen, onClose }: MediaLibraryProps) {
  const [images, setImages] = useState<MediaImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  // ── Fetch images ───────────────────────────────────────────────
  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const response = await fetch(`/api/upload?${params.toString()}`);
      const result = await response.json();
      if (result.success) {
        setImages(result.data || []);
      } else {
        toast.error('Gagal memuat gambar', { description: result.error });
      }
    } catch {
      toast.error('Gagal memuat gambar', { description: 'Kesalahan jaringan' });
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (isOpen) {
      fetchImages();
    }
  }, [isOpen, fetchImages]);

  // ── Delete handler ─────────────────────────────────────────────
  const handleDelete = useCallback(
    async (filename: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setDeleting(filename);
      try {
        const response = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}`, {
          method: 'DELETE',
        });
        const result = await response.json();
        if (result.success) {
          setImages((prev) => prev.filter((img) => img.filename !== filename));
          toast.success('Gambar berhasil dihapus');
        } else {
          toast.error('Gagal menghapus gambar', { description: result.error });
        }
      } catch {
        toast.error('Gagal menghapus gambar');
      } finally {
        setDeleting(null);
      }
    },
    [],
  );

  // ── Search with debounce ───────────────────────────────────────
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setSearch(val);
      // Debounce fetch
      if (searchTimeout) clearTimeout(searchTimeout);
      const timeout = setTimeout(() => {
        // fetchImages will be triggered by the useEffect
      }, 300);
      setSearchTimeout(timeout);
    },
    [searchTimeout],
  );

  // Re-fetch when search changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) fetchImages();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, isOpen, fetchImages]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-app-surface border border-app-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-app-border">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-app-accent" style={ { fontSize: '18px' } }>image</span>
            <h3 className="text-sm font-semibold text-app-primary">Pustaka Media</h3>
            <span className="text-xs text-app-muted">({images.length} gambar)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchImages}
              disabled={loading}
              className="p-1.5 text-app-muted hover:text-app-primary hover:bg-app-elevated rounded-lg transition-colors disabled:opacity-50"
              title="Segarkan"
            >
              <span className="material-symbols-outlined" style={ { fontSize: '14px' } }>refresh</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-app-muted hover:text-app-primary hover:bg-app-elevated rounded-lg transition-colors"
              title="Tutup"
            >
              <span className="material-symbols-outlined" style={ { fontSize: '14px' } }>close</span>
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-5 py-3 border-b border-app-border/50">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" style={ { fontSize: '14px' } }>search</span>
            <input
              type="text"
              placeholder="Cari berdasarkan nama file..."
              value={search}
              onChange={handleSearchChange}
              className="w-full bg-app-elevated border border-app-border rounded-lg pl-9 pr-3 py-2 text-sm text-app-primary placeholder:text-app-muted focus:outline-none focus:ring-2 focus:ring-app-accent/50 focus:border-app-accent/50 transition-colors"
            />
          </div>
        </div>

        {/* Image grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="material-symbols-outlined text-app-accent animate-spin mb-3" style={ { fontSize: '24px' } }>refresh</span>
              <p className="text-sm text-app-muted">Memuat gambar...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="material-symbols-outlined text-app-muted/40 mb-3" style={ { fontSize: '40px' } }>image</span>
              <p className="text-sm font-medium text-app-secondary mb-1">Belum ada gambar</p>
              <p className="text-xs text-app-muted">Unggah gambar menggunakan ImageUploader di atas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((img) => (
                <div
                  key={img.filename}
                  onClick={() => {
                    onSelect(img.url);
                    onClose();
                  }}
                  className="group relative rounded-lg border border-app-border/50 bg-app-elevated/30 overflow-hidden cursor-pointer hover:border-app-accent/50 hover:ring-1 hover:ring-app-accent/30 transition-all"
                  title={`${img.filename}\n${formatSize(img.size)}\n${new Date(img.lastModified).toLocaleString('id-ID')}`}
                >
                  {/* Thumbnail */}
                  <div className="aspect-square overflow-hidden bg-app-elevated/50">
                    <img
                      src={img.url}
                      alt={img.filename}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  </div>

                  {/* Filename & size */}
                  <div className="p-2">
                    <p className="text-[0.65rem] text-app-secondary truncate font-medium">
                      {img.filename}
                    </p>
                    <p className="text-[0.6rem] text-app-muted">
                      {formatSize(img.size)}
                    </p>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(img.filename, e)}
                    disabled={deleting === img.filename}
                    className="absolute top-1.5 right-1.5 p-1 bg-red-500/80 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 disabled:opacity-50"
                    title="Hapus gambar"
                  >
                    {deleting === img.filename ? (
                      <span className="material-symbols-outlined animate-spin" style={ { fontSize: '10px' } }>refresh</span>
                    ) : (
                      <span className="material-symbols-outlined" style={ { fontSize: '10px' } }>delete</span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-5 py-3 border-t border-app-border/50 text-center">
          <p className="text-[0.65rem] text-app-muted">
            Klik gambar untuk memasukkan URL ke editor
          </p>
        </div>
      </div>
    </div>
  );
}
