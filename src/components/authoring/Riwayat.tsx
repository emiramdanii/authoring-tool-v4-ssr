'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthoringStore } from '@/store/authoring-store';
import { toast } from 'sonner';
import { Zap, Camera, FileEdit, RotateCcw, Trash2 } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────
interface VersionEntry {
  name: string;
  savedAt: string;
  mapel: string;
  judul: string;
  state: string;
  isAuto?: boolean;
}

const STORAGE_KEY = 'at_versions_v1';
const MAX_VERSIONS = 20;

// ── Helpers ────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function generateTimestamp(): string {
  return new Date().toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function loadVersions(): VersionEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function persistVersions(versions: VersionEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
}

function takeSnapshot(name?: string, isAuto = false): VersionEntry | null {
  try {
    const s = useAuthoringStore.getState();
    const entry: VersionEntry = {
      name: name || generateTimestamp(),
      savedAt: new Date().toISOString(),
      mapel: s.meta?.mapel || '',
      judul: s.meta?.judulPertemuan || '',
      state: JSON.stringify({
        meta: s.meta,
        cp: s.cp,
        tp: s.tp,
        atp: s.atp,
        alur: s.alur,
        skenario: s.skenario,
        kuis: s.kuis,
        modules: s.modules,
        games: s.games,
        materi: s.materi,
        guruPw: s.guruPw,
      }),
      isAuto,
    };
    return entry;
  } catch {
    return null;
  }
}

// ── Component ──────────────────────────────────────────────────────
export default function Riwayat() {
  const [versions, setVersions] = useState<VersionEntry[]>(() => loadVersions());
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when shown
  useEffect(() => {
    if (showSaveInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showSaveInput]);

  // ── Save ─────────────────────────────────────────────────────────
  const handleSave = useCallback(
    (name?: string, isAuto = false) => {
      const entry = takeSnapshot(name, isAuto);
      if (!entry) {
        toast.error('❌ Gagal membuat snapshot');
        return;
      }

      setVersions((prev) => {
        const updated = [entry, ...prev];
        // Enforce max versions — delete oldest
        if (updated.length > MAX_VERSIONS) {
          const trimmed = updated.slice(0, MAX_VERSIONS);
          persistVersions(trimmed);
          return trimmed;
        }
        persistVersions(updated);
        return updated;
      });

      if (isAuto) {
        toast.success('📸 Auto-saved ke riwayat versi');
      } else {
        toast.success(`📸 Snapshot "${entry.name}" tersimpan`);
      }
    },
    [],
  );

  const openSaveInput = () => {
    setSaveName('');
    setShowSaveInput(true);
  };

  const confirmSave = () => {
    const name = saveName.trim() || generateTimestamp();
    handleSave(name);
    setShowSaveInput(false);
    setSaveName('');
  };

  const cancelSave = () => {
    setShowSaveInput(false);
    setSaveName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') confirmSave();
    if (e.key === 'Escape') cancelSave();
  };

  // ── Restore ──────────────────────────────────────────────────────
  const handleRestore = useCallback((entry: VersionEntry) => {
    const displayName = entry.name.length > 40 ? entry.name.slice(0, 40) + '…' : entry.name;
    const confirmed = window.confirm(
      `Kembalikan ke versi "${displayName}"?\n\nPerubahan saat ini yang belum disimpan akan hilang.`,
    );
    if (!confirmed) return;

    try {
      const parsed = JSON.parse(entry.state);
      useAuthoringStore.setState({ ...parsed, dirty: false });
      toast.success(`↩️ Versi "${displayName}" dipulihkan`);
    } catch {
      toast.error('❌ Gagal memulihkan versi — data rusak');
    }
  }, []);

  // ── Delete ───────────────────────────────────────────────────────
  const handleDelete = useCallback((entry: VersionEntry) => {
    const displayName = entry.name.length > 40 ? entry.name.slice(0, 40) + '…' : entry.name;
    const confirmed = window.confirm(`Hapus versi "${displayName}" secara permanen?`);
    if (!confirmed) return;

    setVersions((prev) => {
      const updated = prev.filter((v) => v.savedAt !== entry.savedAt);
      persistVersions(updated);
      return updated;
    });
    toast.success('🗑️ Versi dihapus');
  }, []);

  // ── Auto-snapshot (called externally) ────────────────────────────
  // Expose via window for external use (e.g. from "Simpan Semua" button)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__atAutoSnapshot = () => handleSave(undefined, true);
    }
  }, [handleSave]);

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-app-primary flex items-center gap-2">
          <span>🕐</span> Riwayat Versi
        </h2>
        <p className="text-sm text-app-secondary mt-1">
          Simpan snapshot proyek kapan saja dan kembalikan ke versi sebelumnya.
          Maksimal {MAX_VERSIONS} versi tersimpan.
        </p>
      </div>

      {/* Save button area */}
      <div className="space-y-3">
        {showSaveInput ? (
          <div className="bg-app-surface border border-app-border rounded-lg p-4 space-y-3">
            <label className="text-sm text-app-secondary font-medium">
              Nama snapshot (opsional):
            </label>
            <input
              ref={inputRef}
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Contoh: Sebelum revisi alur…"
              className="w-full px-3 py-2 bg-app-elevated border border-app-border rounded-md text-sm text-app-primary placeholder-app-muted focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={confirmSave}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-lg transition-colors"
              >
                💾 Simpan
              </button>
              <button
                onClick={cancelSave}
                className="px-3 py-1.5 bg-app-elevated hover:bg-app-elevated text-app-primary text-xs rounded-md transition-colors"
              >
                Batal
              </button>
              <span className="text-xs text-app-muted ml-auto">
                Kosongkan = timestamp otomatis
              </span>
            </div>
          </div>
        ) : (
          <button
            onClick={openSaveInput}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-lg transition-colors flex items-center gap-2"
          >
            <Camera size={14} className="inline" /> Simpan Snapshot Baru
          </button>
        )}
      </div>

      {/* Version list */}
      <div className="space-y-2">
        {versions.length === 0 ? (
          /* Empty state */
          <div className="bg-app-surface border border-app-border rounded-xl p-8 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-lg font-semibold text-app-primary mb-2">
              Belum ada versi tersimpan
            </h3>
            <p className="text-sm text-app-secondary max-w-md mx-auto">
              Klik &quot;Simpan Snapshot Baru&quot; di atas untuk mulai menyimpan versi proyek Anda.
              Setiap snapshot merekam seluruh data meta, CP, TP, ATP, alur, kuis, dan lainnya.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs text-app-muted">
                {versions.length} / {MAX_VERSIONS} versi tersimpan
              </p>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {versions.map((entry) => (
                <VersionCard
                  key={entry.savedAt}
                  entry={entry}
                  onRestore={handleRestore}
                  onDelete={handleDelete}
                  isRestoring={restoringId === entry.savedAt}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Version Card ───────────────────────────────────────────────────
interface VersionCardProps {
  entry: VersionEntry;
  onRestore: (entry: VersionEntry) => void;
  onDelete: (entry: VersionEntry) => void;
  isRestoring: boolean;
}

function VersionCard({ entry, onRestore, onDelete, isRestoring }: VersionCardProps) {
  const displayName =
    entry.name.length > 50 ? entry.name.slice(0, 50) + '…' : entry.name;

  return (
    <div className="bg-app-surface border border-app-border rounded-lg p-4 flex items-start sm:items-center gap-4 flex-col sm:flex-row hover:border-app-border transition-colors group">
      {/* Icon */}
      <div className="flex-shrink-0 text-2xl w-10 h-10 rounded-lg bg-app-elevated flex items-center justify-center">
        {entry.isAuto ? <Zap size={14} /> : <Camera size={14} />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-app-primary truncate">
            {displayName}
          </p>
          {entry.isAuto && (
            <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              Auto-saved
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-app-secondary flex items-center gap-1">
            📅 {formatDate(entry.savedAt)}
          </span>
          {entry.mapel && (
            <span className="text-xs text-app-muted flex items-center gap-1">
              📚 {entry.mapel}
            </span>
          )}
          {entry.judul && (
            <span className="text-xs text-app-muted flex items-center gap-1">
              <FileEdit size={12} className="inline" /> {entry.judul.length > 30 ? entry.judul.slice(0, 30) + '…' : entry.judul}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onRestore(entry)}
          disabled={isRestoring}
          className="px-3 py-1.5 bg-app-elevated hover:bg-app-elevated text-app-primary text-xs rounded-md transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Pulihkan versi ini"
        >
          <RotateCcw size={14} className="inline" /> Pulihkan
        </button>
        <button
          onClick={() => onDelete(entry)}
          className="px-3 py-1.5 bg-app-elevated hover:bg-red-900/60 text-app-primary hover:text-red-300 text-xs rounded-md transition-colors flex items-center gap-1.5"
          title="Hapus versi ini"
        >
          <Trash2 size={14} className="inline" />
        </button>
      </div>
    </div>
  );
}
