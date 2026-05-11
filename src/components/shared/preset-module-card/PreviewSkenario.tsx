import React from 'react';
import type { LayoutVariant, M } from './types';
import { T } from './tokens';
import { arr, str } from './helpers';
import { AccentListItem } from '@/components/shared/AccentListItem';

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: SKENARIO
// ═══════════════════════════════════════════════════════════════════
export function PreviewSkenario({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const chapters = arr<Record<string, unknown>>(mod.chapters);
  if (!chapters.length) return <div className="text-xs" style={{ color: T.muted }}>Belum ada bab skenario.</div>;

  if (variant === 'D') {
    return (
      <div className="space-y-1">
        {chapters.map((ch, i) => (
          <AccentListItem key={i} accentColor="#f9c82e">
            <span className="text-[11px]" style={{ color: T.text }}>🎭 {str(ch.title)}</span>
          </AccentListItem>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {chapters.map((ch, i) => (
        <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(249,193,46,0.06)', border: '1px solid rgba(249,193,46,0.2)' }}>
          <span className={compact ? 'text-sm' : 'text-base'}>🎭</span>
          <span className="text-xs font-bold" style={{ color: T.text }}>{str(ch.title)}</span>
        </div>
      ))}
    </div>
  );
}
