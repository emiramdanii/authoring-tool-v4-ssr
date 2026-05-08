import React from 'react';
import type { M } from './types';
import { T } from './tokens';
import { str } from './helpers';
import { alpha } from '@/lib/color-palette';

// ═══════════════════════════════════════════════════════════════════
// PREVIEW: VIDEO
// ═══════════════════════════════════════════════════════════════════
export function PreviewVideo({ mod, compact }: { mod: M; compact: boolean }) {
  const platform = str(mod.platform, 'youtube');
  const url = str(mod.url, '');
  const duration = str(mod.durasi, '');

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: T.bg, border: `1px solid ${alpha(T.r, 0.15)}` }}>
      {/* Video placeholder area */}
      <div className="relative flex items-center justify-center" style={{ background: '#0a0a0a', minHeight: compact ? 32 : 56 }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: alpha(T.r, 0.19) }}>
          <span className="text-sm">▶</span>
        </div>
        {duration && (
          <div className="absolute bottom-1 right-1 text-[9px] px-1 rounded" style={{ background: 'rgba(0,0,0,0.7)', color: T.text }}>
            {duration}
          </div>
        )}
        <div className="absolute top-1 left-1 text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase" style={{ background: alpha(T.r, 0.12), color: T.r }}>
          {platform}
        </div>
      </div>
      {!compact && url && (
        <div className="p-1.5 text-[10px] truncate" style={{ color: T.muted }}>{url}</div>
      )}
    </div>
  );
}
