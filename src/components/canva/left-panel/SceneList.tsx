'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useLearningMediaStore } from '@/store/learning-media-store';
import { useOverflowWarningStore } from '@/store/overflow-warning-store';
import { TEMPLATE_BADGE_MAP } from '@/lib/canva-icon-maps';
import { getPageContract, type PageCompletionStatus } from '@/core/edu/page-runtime-contract';
import { validateSinglePage } from '@/core/template/health-check/template-health-check';
import { Button } from '@/components/ui/button';
import { FloatingPageMenu } from './FloatingPageMenu';
import type { PageTemplateType } from '@/components/canva/types';

// ═══════════════════════════════════════════════════════════════
// SCENE LIST v3 — SILSE v4 Stitch Reference Page Navigator
// ═══════════════════════════════════════════════════════════════
// Stitch spec:
//   - Active: bg-silse-primary-container text-silse-on-primary-container rounded-xl px-3 py-2 border border-silse-primary/20
//   - Inactive: hover:bg-silse-surface-container-high rounded-xl px-3 py-2
//   - Scene thumbnail: w-12 h-8 rounded with scene number
//   - "Scenes" uppercase label above list
//   - Drag reorder functionality
//   - Page completion indicators (✓ / ○ / 🔒) from PageRuntimeContract
// ═══════════════════════════════════════════════════════════════

// Badge color map using semantic tokens instead of hardcoded Tailwind colors
const BADGE_COLOR_MAP: Record<string, string> = {
  cover: 'bg-silse-primary-container/20 text-silse-primary border-silse-primary-container/30',
  petunjuk: 'bg-silse-secondary/15 text-silse-secondary border-silse-secondary/30',
  dokumen: 'bg-silse-secondary/15 text-silse-secondary border-silse-secondary/30',
  hero: 'bg-silse-tertiary-container/15 text-silse-tertiary-container border-silse-tertiary-container/30',
  materi: 'bg-silse-secondary-container/15 text-silse-secondary-container border-silse-secondary-container/30',
  skenario: 'bg-silse-error/15 text-silse-error border-silse-error/30',
  kuis: 'bg-silse-primary-container/20 text-silse-primary border-silse-primary-container/30',
  game: 'bg-silse-secondary/15 text-silse-secondary border-silse-secondary/30',
  diskusi: 'bg-silse-primary-container/20 text-silse-primary-container border-silse-primary/30',
  hasil: 'bg-silse-primary-container/20 text-silse-primary-container border-silse-primary/30',
  refleksi: 'bg-silse-secondary-container/15 text-silse-secondary-container border-silse-secondary-container/30',
  penutup: 'bg-silse-tertiary-container/15 text-silse-tertiary-container border-silse-tertiary-container/30',
  tujuan: 'bg-silse-secondary/15 text-silse-secondary border-silse-secondary/30',
  custom: 'bg-silse-surface-container/50 text-silse-on-surface-variant border-silse-outline-variant/30',
};

// ── Completion indicator icon per status ─────────────────────
function CompletionIndicator({ status }: { status: PageCompletionStatus }) {
  switch (status) {
    case 'completed':
      return (
        <span
          className="material-symbols-outlined text-emerald-500"
          style={{ fontSize: '14px' }}
          aria-label="Selesai"
          title="Selesai"
        >
          check_circle
        </span>
      );
    case 'locked':
      return (
        <span
          className="material-symbols-outlined text-amber-500"
          style={{ fontSize: '14px' }}
          aria-label="Terkunci"
          title="Terkunci — selesaikan dulu"
        >
          lock
        </span>
      );
    case 'incomplete':
    default:
      return (
        <span
          className="material-symbols-outlined text-slate-400"
          style={{ fontSize: '14px' }}
          aria-label="Belum selesai"
          title="Belum selesai"
        >
          radio_button_unchecked
        </span>
      );
  }
}

export function SceneList({ searchFilter = '' }: { searchFilter?: string } = {}) {
  const pages = useCanvaStore(s => s.pages);
  const currentPageIndex = useCanvaStore(s => s.currentPageIndex);
  const goPage = useCanvaStore(s => s.goPage);
  const duplicatePage = useCanvaStore(s => s.duplicatePage);
  const deletePage = useCanvaStore(s => s.deletePage);
  const reorderPage = useCanvaStore(s => s.reorderPage);
  const addPage = useCanvaStore(s => s.addPage);
  const addTemplatePage = useCanvaStore(s => s.addTemplatePage);
  const ratio = useCanvaStore(s => s.currentRatio());
  const teacherMode = useCanvaStore(s => s.teacherMode);
  const pageOverflowStatus = useOverflowWarningStore(s => s.pageOverflowStatus);

  // ── Learning progress (from PageRuntimeContract) ──
  // Only shown when a learning session has been initialized.
  const sessionInitialized = useLearningMediaStore(s => s.sessionInitialized);
  const getPageStatus = useLearningMediaStore(s => s.getPageStatus);
  const totalScreens = useLearningMediaStore(s => s.totalScreens);

  // Compute page statuses for completion indicators
  const pageStatuses = useMemo(() => {
    if (!sessionInitialized) return [];
    return pages.map((_, i) => getPageStatus(i));
  }, [sessionInitialized, pages.length, getPageStatus]);

  // Compute page health indicators (validation errors per page)
  const pageHealthIssues = useMemo(() => {
    return pages.map((page, i) => {
      const issues = validateSinglePage(page, i);
      const errors = issues.filter(issue => issue.severity === 'error').length;
      const warnings = issues.filter(issue => issue.severity === 'warning').length;
      return { errors, warnings, hasIssues: errors > 0 || warnings > 0 };
    });
  }, [pages]);

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

  const filteredPages = useMemo(() => {
    if (!searchFilter) return pages;
    const lower = searchFilter.toLowerCase();
    return pages.filter(p => p.label.toLowerCase().includes(lower));
  }, [pages, searchFilter]);

  return (
    <div className="flex flex-col gap-1">
      {/* Scenes label — now handled by LeftPanel, but keep for standalone use */}
      {filteredPages.map((p, i) => {
        // Find the original index in the full pages array
        const originalIndex = pages.indexOf(p);
        const isActive = originalIndex === currentPageIndex;
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
            onClick={() => goPage(originalIndex)}
            draggable
            onDragStart={() => setDragIdx(originalIndex)}
            onDragOver={(e) => { e.preventDefault(); setDragOverIdx(originalIndex); }}
            onDragLeave={() => setDragOverIdx(null)}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIdx !== null && dragIdx !== originalIndex) { reorderPage(dragIdx, originalIndex); }
              setDragIdx(null);
              setDragOverIdx(null);
            }}
            onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
            className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
              dragIdx === originalIndex
                ? 'opacity-40 scale-95'
                : dragOverIdx === originalIndex
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
              {isActive ? <span className="font-bold">{originalIndex + 1}</span> : <span className="text-silse-on-surface-variant font-medium">{originalIndex + 1}</span>}
            </div>

            {/* Scene Label + Completion Indicator */}
            <div className="flex-1 min-w-0">
              <span className={`text-[12px] font-medium truncate block ${
                isActive ? 'font-bold' : ''
              }`}>
                {isSchemaDriven && <span className="material-symbols-outlined inline mr-0.5" style={{ fontSize: '12px' }}>bolt</span>}
                Scene {originalIndex + 1}: {p.label}
                {pageOverflowStatus[p.id]?.hasOverflow && (
                  <span className="material-symbols-outlined inline ml-1 text-silse-tertiary" style={{ fontSize: '12px' }} aria-label="Konten melebihi kapasitas">warning</span>
                )}
                {/* Health check indicator — show if page has validation issues */}
                {pageHealthIssues[i]?.hasIssues && !sessionInitialized && (
                  <span
                    className={`inline ml-1 w-1.5 h-1.5 rounded-full ${pageHealthIssues[i]!.errors > 0 ? 'bg-silse-error' : 'bg-amber-500'}`}
                    title={`${pageHealthIssues[i]!.errors} error, ${pageHealthIssues[i]!.warnings} warning — lihat panel Validasi`}
                    aria-label="Ada masalah validasi"
                  />
                )}
              </span>
            </div>

            {/* Completion Indicator — only shown if learning session exists */}
            {sessionInitialized && pageStatuses[i] && (
              <CompletionIndicator status={pageStatuses[i]!} />
            )}
          </button>
        );
      })}

      {pages.length > 0 && (
        <div className="flex gap-1 pt-1">
          <Button variant="ghost" onClick={duplicatePage} className="flex-1 py-1.5 rounded-lg text-[11px] gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>content_copy</span> Duplikat
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (pages.length <= 1) return;
              if (confirm(`Hapus "${pages[currentPageIndex]!.label}"?`)) deletePage();
            }}
            className="flex-1 py-1.5 rounded-lg text-[11px] gap-1 text-silse-error/70 hover:text-silse-error bg-silse-error-container/10"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span> Hapus
          </Button>
        </div>
      )}

      {/* Sprint 1E.4: Add page via floating menu — guru pilih tipe halaman */}
      <FloatingPageMenu
        onSelect={(templateType: PageTemplateType) => addTemplatePage(templateType)}
        align="start"
        side="right"
      >
        <button
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-silse-outline-variant/40 hover:border-silse-primary/40 bg-silse-surface-container/20 hover:bg-silse-primary/5 text-silse-on-surface-variant hover:text-silse-primary text-[11px] font-medium transition-[transform,box-shadow,background-color] active:scale-[0.97]"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span> Tambah Halaman
        </button>
      </FloatingPageMenu>

      {/* Drag hint */}
      {pages.length > 1 && (
        <div className="text-[9px] text-silse-on-surface-variant/50 text-center pt-0.5">
          Drag halaman untuk mengubah urutan
        </div>
      )}
    </div>
  );
}
