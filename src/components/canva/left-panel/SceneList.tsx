'use client';

import { useState, useRef, useEffect } from 'react';
import { Copy, Trash2, Zap, Plus, AlertTriangle } from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
import { useOverflowWarningStore } from '@/store/overflow-warning-store';
import { TEMPLATE_BADGE_MAP } from '@/lib/canva-icon-maps';
import { Button } from '@/components/ui/button';
import { SchemaBlockTreeCompact } from './SchemaBlockTree';

// ═══════════════════════════════════════════════════════════════
// SCENE LIST — Page navigator with thumbnails + drag reorder
// ═══════════════════════════════════════════════════════════════

// Badge color map using semantic tokens instead of hardcoded Tailwind colors
const BADGE_COLOR_MAP: Record<string, string> = {
  cover: 'bg-app-accent/20 text-app-accent border-app-accent/30',
  petunjuk: 'bg-app-info/20 text-app-info border-app-info/30',
  dokumen: 'bg-app-info/20 text-app-info border-app-info/30',
  hero: 'bg-app-warning/20 text-app-warning border-app-warning/30',
  materi: 'bg-app-accent-secondary/20 text-app-accent-secondary border-app-accent-secondary/30',
  skenario: 'bg-app-error/20 text-app-error border-app-error/30',
  kuis: 'bg-app-accent/20 text-app-accent border-app-accent/30',
  game: 'bg-app-info/20 text-app-info border-app-info/30',
  diskusi: 'bg-app-success/20 text-app-success border-app-success/30',
  hasil: 'bg-app-success/20 text-app-success border-app-success/30',
  refleksi: 'bg-app-accent-secondary/20 text-app-accent-secondary border-app-accent-secondary/30',
  penutup: 'bg-app-warning/20 text-app-warning border-app-warning/30',
  tujuan: 'bg-app-info/20 text-app-info border-app-info/30',
  custom: 'bg-app-elevated/50 text-app-muted border-app-border/30',
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
    <div className="space-y-1.5">
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
            className={`w-full text-left card-hover relative rounded-xl overflow-hidden transition-[transform,background-color,border-color] ${
              dragIdx === i
                ? 'opacity-40 scale-95'
                : dragOverIdx === i
                  ? 'ring-2 ring-app-accent/60 ring-offset-1 ring-offset-app-surface translate-y-0.5'
                  : isActive
                    ? 'ring-2 ring-app-accent ring-offset-2 ring-offset-app-surface'
                    : 'hover:ring-1 hover:ring-app-border-strong'
            }`}
          >
            <div className="flex items-center gap-2 p-2">
              <div className="w-5 text-[9px] font-bold text-app-muted text-center flex-shrink-0">{i + 1}</div>
              <div
                className="w-12 h-8 rounded-lg flex-shrink-0 overflow-hidden relative"
                style={{ ...bgStyle, aspectRatio: `${ratio.w}/${ratio.h}` }}
              >
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute top-0 right-0 text-[6px]! p-0.5">{badge!.icon}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-app-primary truncate flex items-center gap-1">
                  {isSchemaDriven && <Zap size={10} className="text-app-success inline" />}
                  <span className="truncate">{p.label}</span>
                  {pageOverflowStatus[p.id]?.hasOverflow && (
                    <AlertTriangle size={9} className="text-amber-400 flex-shrink-0" title="Konten melebihi kapasitas" />
                  )}
                </div>
                <div className="text-[8px] mt-0.5 flex items-center gap-1">
                  <span className={`inline-flex items-center px-1.5 py-0 rounded text-[7px] font-bold uppercase tracking-wider border ${badgeColor}`}>
                    {badge!.name}
                  </span>
                  {p.label?.includes('— P') && (
                    <span className="inline-flex items-center px-1 py-0 rounded text-[6px] font-bold bg-app-accent/15 text-app-accent border border-app-accent/20">
                      {p.label.match(/— P(\d+)/)?.[1] ? `P${p.label.match(/— P(\d+)/)![1]}` : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Schema Block Tree — collapsible block navigator */}
            <SchemaBlockTreeCompact
              page={p}
              pageIndex={i}
              isActive={isActive}
            />
          </button>
        );
      })}

      {pages.length > 0 && (
        <div className="flex gap-1 pt-1">
          <Button variant="ghost" onClick={duplicatePage} className="flex-1 py-1.5 rounded-lg text-[10px] gap-1">
            <Copy size={10} /> Duplikat
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (pages.length <= 1) return;
              if (confirm(`Hapus "${pages[currentPageIndex]!.label}"?`)) deletePage();
            }}
            className="flex-1 py-1.5 rounded-lg text-[10px] gap-1 text-app-error/70 hover:text-app-error hover:bg-app-error/10"
          >
            <Trash2 size={10} /> Hapus
          </Button>
        </div>
      )}

      {/* Add page button */}
      <button
        onClick={() => addPage()}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-app-border/40 hover:border-app-accent/40 bg-app-elevated/20 hover:bg-app-accent/5 text-app-muted hover:text-app-accent text-[10px] font-medium transition-[transform,box-shadow,background-color] active:scale-[0.97]"
      >
        <Plus size={12} /> Tambah Halaman
      </button>

      {/* Drag hint */}
      {pages.length > 1 && (
        <div className="text-[7px] text-app-muted/50 text-center pt-0.5">
          Drag halaman untuk mengubah urutan
        </div>
      )}
    </div>
  );
}
