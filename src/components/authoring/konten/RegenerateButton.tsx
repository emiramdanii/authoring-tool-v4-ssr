'use client';

import { useState } from 'react';
import { isEnabled } from '@/config/feature-flags';
import { Zap, Loader2 } from 'lucide-react';
import { useAuthoringStore } from '@/store/authoring-store';
import { canRegenerate, getStoredText } from '../auto-generate/regenerate';

// ── Regenerate Button ────────────────────────────────────────────
// A subtle but discoverable button that re-generates content for
// a specific section using the stored auto-generate source text.
// If no source text exists, clicking redirects to the Auto-Generate panel.

interface RegenerateButtonProps {
  /** Label shown next to the icon (e.g. "Materi", "Skenario") */
  label: string;
  /** Async callback that performs the actual regeneration and applies to store */
  onRegenerate: () => Promise<void>;
  /** Whether to show the button even when there's no stored source text.
   *  If false (default), the button only shows when canRegenerate() is true
   *  OR when hasExistingData is true. */
  hasExistingData?: boolean;
  /** Optional extra CSS class */
  className?: string;
}

export function RegenerateButton({
  label,
  onRegenerate,
  hasExistingData = false,
  className = '',
}: RegenerateButtonProps) {
  const [loading, setLoading] = useState(false);
  const storedText = getStoredText();
  const showButton = canRegenerate() || hasExistingData;

  // Feature flag guard — after all hooks, before conditional returns
  if (!isEnabled('aiRefinement')) return null;

  if (!showButton) return null;

  const handleClick = async () => {
    // If no stored text, redirect to auto-generate panel
    if (!storedText) {
      useAuthoringStore.getState().setActivePanel('autogen');
      return;
    }

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
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5
        text-xs font-medium rounded-lg
        bg-app-elevated/70 border border-app-border/50
        text-app-secondary hover:text-app-accent
        hover:border-app-accent/30 hover:bg-app-accent/5
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
        ${className}
      `}
      title={storedText ? `Regenerate ${label} dari teks sumber` : `Buka Auto-Generate untuk mengisi teks sumber`}
    >
      {loading ? (
        <Loader2 size={13} className="animate-spin" />
      ) : (
        <Zap size={13} />
      )}
      {loading ? 'Generating...' : 'Regenerate'}
    </button>
  );
}
