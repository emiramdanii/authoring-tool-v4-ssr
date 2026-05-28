'use client';

import { useState, useRef, useEffect } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useOverflowWarningStore } from '@/store/overflow-warning-store';
import { TEMPLATE_BADGE_MAP } from '@/lib/canva-icon-maps';
import { Button } from '@/components/ui/button';

// ═══════════════════════════════════════════════════════════════
// SCENE LIST — Page navigator with thumbnails + drag reorder
// ═══════════════════════════════════════════════════════════════

// Badge color map using semantic tokens instead of hardcoded Tailwind colors
const BADGE_COLOR_MAP: Record<string, string> = {
  cover: 'bg-silse-primary-container/20 text-silse-primary border-silse-primary-container/30',
  petunjuk: 'bg-app-info/20 text-app-info border-app-info/30',
  dokumen: 'bg-app-info/20 text-app-info border-app-info/30',
  hero: 'bg-app-warning/20 text-app-warning border-app-warning/30',
  materi: 'bg-app-accent-secondary/20 text-silse-primary-secondary border-app-accent-secondary/30',
  skenario: 'bg-app-error/20 text-app-error border-app-error/30',
  kuis: 'bg-silse-primary-container/20 text-silse-primary border-silse-primary-container/30',
  game: 'bg-app-info/20 text-app-info border-app-info/30',
  diskusi: 'bg-silse-primary-container/20 text-silse-primary-container border-app-success/30',
  hasil: 'bg-silse-primary-container/20 text-silse-primary-container border-app-success/30',
  refleksi: 'bg-app-accent-secondary/20 text-silse-primary-secondary border-app-accent-secondary/30',
  penutup: 'bg-app-warning/20 text-app-warning border-app-warning/30',
  tujuan: 'bg-app-info/20 text-app-info border-app-info/30',
  custom: 'bg-silse-surface-container/50 text-silse-on-surface-variant border-silse-outline-variant/30',
};

export function SceneList() {
  const pages = useCanvaStore(s => s.pages);
  const currentPageIndex = useCanvaStore(s => s.currentPageIndex);
  const goPage = useCanvaStore(s => s.goPage);
  const duplicatePage = useCanvaStore(s => s.duplicatePage);
  const deletePage = useCanvaStore(s => s.deletePage);
  const reorderPage = useCanvaStore(s => s.reorderPage);
  const addPage = useCanvaStore(s => s.addPage);
  const ratio = useCanvaStore(s => s.currentRatio());
  const teacherMode = useCanvaStore(s => s.teacherMode);
  const pageOverflowStatus = useOverflowWarningStore(s => s.pageOverflowStatus);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // ── Auto-scroll: scroll active page into view when currentPageIndex changes ──
  // Previously, navigating via toolbar/keyboard would update the canvas
  // but the page list wouldn't scroll to show the active page — making
  // navigation feel broken when many pages exist.
  const activeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [currentPageIndex]);

  return (
    <div className="flex flex-col gap-2">
      {pages.map((p, i) => {
        const isActive = i === currentPageIndex;
        const badge = TEMPLATE_BADGE_MAP[p.templateType || 'custom'] || TEMPLATE_BADGE_MAP.custom;
        const bgStyle = p.bgDataUrl
          ? { backgroundImage: `url('${p.bgDataUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : p.bgColor?.includes('gradient')
            ? { background: p.bgColor }
            : { background: p.bgColor || 'var(--semantic-bg-primary, #ffffff)' };

        const isSchemaDriven = !!p.schema;
        const badgeColor = BADGE_COLOR_MAP[p.templateType || 'custom'] || BADGE_COLOR_MAP.custom;

        return (
          <button
            key={p.id}
            ref={isActive ? activeRef : undefined}
            data-testid={`page-tab-${i}`}
            onClick={() => goPage(i)}
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => { e.preventDefault(); setDragOverIdx(i); }}
            onDragLeave={() => setDragOverIdx(null)}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIdx !== null && dragIdx !== i) { reorderPage(dragIdx, i); }
              setDragIdx(null);
              setDragOverIdx(null);
            }}
            onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
            className={`w-full text-left flex items-center gap-3 rounded-xl px-3 py-2 transition-all ${
              dragIdx === i
                ? 'opacity-40 scale-95'
                : dragOverIdx === i
                  ? 'ring-2 ring-silse-primary/40 bg-silse-surface-container-high'
                  : isActive
                    ? 'bg-silse-primary-container text-silse-on-primary-container border border-silse-primary/20'
                    : 'hover:bg-silse-surface-container-high text-silse-on-surface-variant'
            }`}
          >
            {/* Scene Number Thumbnail — SILSE v4 reference style */}
            <div
              className={`w-12 h-8 rounded flex items-center justify-center text-[10px] flex-shrink-0 ${
                isActive
                  ? 'bg-black/10'
                  : 'bg-silse-surface-container-highest'
              }`}
              style={isActive ? {} : bgStyle}
            >
              {isActive ? <span className="font-bold">{i + 1}</span> : <span className="text-silse-on-surface-variant font-medium">{i + 1}</span>}
            </div>

            {/* Scene Label */}
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-medium truncate block ${
                isActive ? 'font-bold' : ''
              }`}>
                {isSchemaDriven && <span className="material-symbols-outlined inline mr-0.5" style={{ fontSize: '12px' }}>bolt</span>}
                Scene {i + 1}: {p.label}
                {pageOverflowStatus[p.id]?.hasOverflow && (
                  <span className="material-symbols-outlined inline ml-1 text-amber-400" style={{ fontSize: '12px' }} aria-label="Konten melebihi kapasitas">warning</span>
                )}
              </span>
            </div>
          </button>
        );
      })}

      {pages.length > 0 && (
        <div className="flex gap-1 pt-1">
          <Button variant="ghost" onClick={duplicatePage} className="flex-1 py-1.5 rounded-lg text-[10px] gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>content_copy</span> Duplikat
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (pages.length <= 1) return;
              if (confirm(`Hapus "${pages[currentPageIndex]!.label}"?`)) deletePage();
            }}
            className="flex-1 py-1.5 rounded-lg text-[10px] gap-1 text-destructive/70 hover:text-destructive bg-destructive/10"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span> Hapus
          </Button>
        </div>
      )}

      {/* Add page button */}
      <button
        onClick={() => addPage()}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-silse-outline-variant/40 hover:border-silse-primary/40 bg-silse-surface-container/20 hover:bg-silse-primary/5 text-silse-on-surface-variant hover:text-silse-primary text-[10px] font-medium transition-[transform,box-shadow,background-color] active:scale-[0.97]"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span> Tambah Halaman
      </button>

      {/* Drag hint */}
      {pages.length > 1 && (
        <div className="text-[7px] text-silse-on-surface-variant/50 text-center pt-0.5">
          Drag halaman untuk mengubah urutan
        </div>
      )}
    </div>
  );
}
