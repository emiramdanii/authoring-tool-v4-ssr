'use client';

import type { CanvaElement } from '../types';
import { ELEMENT_ICON_MAP, ELEMENT_COLOR_MAP, ELEMENT_TEXT_COLOR_MAP } from './constants';
import { COLORS } from '@/lib/color-palette';

/* ── Compact element preview for canvas editing mode ────────── */
export function CanvasElementPreview({ element }: { element: CanvaElement }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center rounded-sm"
      style={{ background: ELEMENT_COLOR_MAP[element.type] || 'rgba(255,255,255,.1)' }}>
      <span className="text-2xl">{ELEMENT_ICON_MAP[element.type] || '📦'}</span>
      <span className="text-[9px] font-bold mt-1" style={{ color: ELEMENT_TEXT_COLOR_MAP[element.type] || COLORS.textWhite }}>
        {element.label || element.type}
      </span>
    </div>
  );
}
