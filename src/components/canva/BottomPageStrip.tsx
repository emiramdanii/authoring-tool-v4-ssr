'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { TEMPLATE_BADGE_MAP } from '@/lib/canva-icon-maps';
import { FloatingPageMenu } from '@/components/canva/left-panel/FloatingPageMenu';
import type { PageTemplateType } from '@/components/canva/types';

// ═══════════════════════════════════════════════════════════════════
// BOTTOM PAGE STRIP — Horizontal page navigator below the canvas
// ═══════════════════════════════════════════════════════════════════
// Shows all pages as compact pills with horizontal scroll.
// Gives teachers quick page navigation without opening the left panel.
//
// Architecture:
//   READ:  CanvaStore.pages[] + currentPageIndex
//   NAV:   goPage(idx) for navigation
//   ADD:   FloatingPageMenu → addTemplatePage() for new page
//   ICON:  TEMPLATE_BADGE_MAP for page type emoji
//
// D-P0A Fix: "+" button now opens FloatingPageMenu instead of
// creating a blank page via addPage(). This ensures all teacher-facing
// page creation goes through the template flow:
//   guru pilih jenis → addTemplatePage() → schema dibuat → primary block dipilih
// ═══════════════════════════════════════════════════════════════════

export function BottomPageStrip() {
  const pages = useCanvaStore(s => s.pages);
  const currentPageIndex = useCanvaStore(s => s.currentPageIndex);
  const goPage = useCanvaStore(s => s.goPage);
  const addTemplatePage = useCanvaStore(s => s.addTemplatePage);

  // Ref for auto-scrolling to the active pill
  const activePillRef = useRef<HTMLButtonElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active page when currentPageIndex changes
  useEffect(() => {
    if (activePillRef.current && stripRef.current) {
      const pill = activePillRef.current;
      const strip = stripRef.current;

      // Calculate scroll position to center the active pill
      const stripRect = strip.getBoundingClientRect();
      const pillRect = pill.getBoundingClientRect();
      const scrollLeft = strip.scrollLeft + pillRect.left - stripRect.left - (stripRect.width / 2) + (pillRect.width / 2);

      strip.scrollTo({
        left: scrollLeft,
        behavior: 'smooth',
      });
    }
  }, [currentPageIndex]);

  // Compute pill data — lightweight, only what's needed for display
  const pillData = useMemo(() => {
    return pages.map((page, index) => {
      const badge = TEMPLATE_BADGE_MAP[page.templateType || 'custom'] || TEMPLATE_BADGE_MAP.custom;
      return {
        id: page.id,
        index,
        label: page.label || `Halaman ${index + 1}`,
        icon: badge.icon,
        name: badge.name,
        isActive: index === currentPageIndex,
      };
    });
  }, [pages, currentPageIndex]);

  // Don't render if there are no pages (shouldn't happen, but guard)
  if (pages.length === 0) return null;

  return (
    <div
      className="flex items-center gap-1 px-2 bg-silse-surface-container-low border-t border-silse-outline-variant/40 select-none"
      style={{ height: '36px' }}
      role="navigation"
      aria-label="Navigasi halaman"
    >
      {/* Scrollable pill container */}
      <div
        ref={stripRef}
        className="flex items-center gap-1 flex-1 overflow-x-auto custom-scrollbar"
        style={{ scrollSnapType: 'x proximity' }}
      >
        {pillData.map((pill) => (
          <button
            key={pill.id}
            ref={pill.isActive ? activePillRef : undefined}
            onClick={() => goPage(pill.index)}
            className={`
              flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium
              whitespace-nowrap flex-shrink-0 transition-[background-color,color] duration-150
              ${
                pill.isActive
                  ? 'bg-silse-primary-container text-silse-on-primary-container font-bold shadow-sm'
                  : 'text-silse-on-surface-variant hover:bg-silse-surface-container-high/50 hover:text-silse-on-surface'
              }
            `}
            style={{ scrollSnapAlign: 'center' }}
            aria-current={pill.isActive ? 'page' : undefined}
            title={`${pill.name}: ${pill.label}`}
          >
            <span className="text-[11px]">{pill.icon}</span>
            <span>{pill.label}</span>
          </button>
        ))}
      </div>

      {/* D-P0A: Add page button — opens FloatingPageMenu, same pattern as SceneList */}
      <FloatingPageMenu
        onSelect={(templateType: PageTemplateType) => addTemplatePage(templateType)}
        align="end"
        side="top"
      >
        <button
          className="
            flex items-center justify-center gap-1 px-2 py-1 rounded-lg
            border border-dashed border-silse-outline-variant/50
            text-silse-on-surface-variant hover:border-silse-primary/40
            hover:bg-silse-primary/5 hover:text-silse-primary
            text-[10px] font-medium flex-shrink-0 transition-[border-color,background-color,color] duration-150
          "
          title="Tambah Halaman"
          aria-label="Tambah halaman baru"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
          <span className="hidden sm:inline">Tambah</span>
        </button>
      </FloatingPageMenu>
    </div>
  );
}
