'use client';

import { useState } from 'react';
import { isEnabled } from '@/config/feature-flags';
// All icons migrated to Material Symbols Outlined
import { canRegenerate } from '../auto-generate/regenerate';

// ── Item Regenerate Button ─────────────────────────────────────────
// Phase 18.3: Per-item regenerate button for partial scoped regeneration.
// Appears next to individual questions/blocks in Konten tabs.
// Smaller and more subtle than the full-section RegenerateButton.

interface ItemRegenerateButtonProps {
  /** Async callback that performs the single-item regeneration */
  onRegenerate: () => Promise<void>;
  /** Optional tooltip text */
  title?: string;
}

export function ItemRegenerateButton({
  onRegenerate,
  title = 'Regenerate soal ini dari teks sumber',
}: ItemRegenerateButtonProps) {
  const [loading, setLoading] = useState(false);
  const canRegen = canRegenerate();

  // Feature flag guard — after all hooks, before conditional returns
  if (!isEnabled('aiRefinement')) return null;

  if (!canRegen) return null;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent card click
    setLoading(true);
    try {
      await onRegenerate();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center justify-center w-7 h-7 rounded-md
        text-app-muted hover:text-app-accent hover:bg-app-accent/10
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200"
      title={title}
    >
      {loading ? (
        <span className="material-symbols-outlined animate-spin" style={ { fontSize: '13px' } }>progress_activity</span>
      ) : (
        <span className="material-symbols-outlined" style={ { fontSize: '13px' } }>refresh</span>
      )}
    </button>
  );
}
