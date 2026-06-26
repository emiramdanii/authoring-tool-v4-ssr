// @ts-nocheck — BATCH-12: quarantined to src/legacy-disabled/, not type-checked
'use client';

import { useEffect, useState } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { TEMPLATE_BADGE_MAP } from '@/lib/canva-icon-maps';

/**
 * Page info footer — always visible at the bottom of the right panel.
 * Self-contained: reads pages and currentPageIndex from the store.
 */
export default function PageInfo() {
  const page = useCanvaStore(s => s.pages[s.currentPageIndex]);
  const currentPageIndex = useCanvaStore(s => s.currentPageIndex);
  const totalPages = useCanvaStore(s => s.pages.length);

  if (!page) return null;

  return (
    <div className="mt-auto">
      <div className="section-divider" />
      <div className="p-2">
        <div className="text-[9px] text-silse-on-surface-variant">
          Halaman {currentPageIndex + 1}/{totalPages} &middot; {TEMPLATE_BADGE_MAP[page.templateType]?.name || page.templateType}
        </div>
      </div>
    </div>
  );
}
