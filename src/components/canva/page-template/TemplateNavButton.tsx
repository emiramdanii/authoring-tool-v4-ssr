'use client';

import { alpha } from '@/lib/color-palette';
import { useInteractiveStore } from '@/store/interactive-store';
import { useCanvaStore } from '@/store/canva-store';
import { playSound } from '@/lib/sounds';

// ═══════════════════════════════════════════════════════════════
// TEMPLATE NAV BUTTON — Reusable page navigation button
// Used by all page templates to navigate between pages.
// Guards against navigation in canvas editor preview mode.
// ═══════════════════════════════════════════════════════════════

export type NavAction = 'next' | 'restart' | 'start';

interface TemplateNavButtonProps {
  /** What happens when clicked */
  action: NavAction;
  /** Button label text. Auto-defaults based on action if omitted. */
  label?: string;
  /** Accent color for the button */
  accent: string;
  /** Whether to show the button (defaults to true) */
  visible?: boolean;
  /** Additional className */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const DEFAULT_LABELS: Record<NavAction, string> = {
  start: 'Mulai Belajar →',
  next: 'Lanjut →',
  restart: '↩ Kembali ke Awal',
};

const SIZE_CLASSES: Record<string, string> = {
  sm: 'px-4 py-1.5 text-[9px]',
  md: 'px-5 py-2 text-[10px]',
  lg: 'px-6 py-2.5 text-[12px]',
};

export function TemplateNavButton({
  action,
  label,
  accent,
  visible = true,
  className = '',
  size = 'md',
}: TemplateNavButtonProps) {
  if (!visible) return null;

  const handleClick = () => {
    // Guard: only navigate in actual Play/Export mode, not canvas editor preview
    if (useInteractiveStore.getState().mode !== 'interactive') return;

    if (action === 'next' || action === 'start') {
      playSound('click');
      useInteractiveStore.getState().nextInteractivePage();
      const nextIdx = useInteractiveStore.getState().interactivePageIdx;
      useCanvaStore.getState().goPage(nextIdx);
    } else if (action === 'restart') {
      playSound('click');
      useInteractiveStore.getState().resetAllScores();
      useInteractiveStore.getState().goInteractivePage(0);
      useCanvaStore.getState().goPage(0);
    }
  };

  const btnLabel = label || DEFAULT_LABELS[action];
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  // Different styles based on action type
  if (action === 'start') {
    // Primary CTA — bold gradient button (like Cover "Mulai Belajar")
    return (
      <button
        onClick={handleClick}
        className={`rounded-xl font-extrabold transition-all hover:scale-105 active:scale-95 ${sizeClass} ${className}`}
        style={{
          background: `linear-gradient(135deg, ${accent}, ${alpha(accent, 0.8)})`,
          color: '#0f172a',
          boxShadow: `0 4px 20px ${alpha(accent, 0.35)}, 0 0 40px ${alpha(accent, 0.15)}`,
        }}
      >
        {btnLabel}
      </button>
    );
  }

  if (action === 'restart') {
    // Secondary — outlined button (like "Kembali ke Awal")
    return (
      <button
        onClick={handleClick}
        className={`rounded-xl font-bold transition-all hover:scale-105 active:scale-95 ${sizeClass} ${className}`}
        style={{
          background: alpha(accent, 0.15),
          border: `1px solid ${alpha(accent, 0.3)}`,
          color: accent,
        }}
      >
        {btnLabel}
      </button>
    );
  }

  // Default "next" — accent outlined button
  return (
    <button
      onClick={handleClick}
      className={`rounded-xl font-bold transition-all hover:scale-105 active:scale-95 ${sizeClass} ${className}`}
      style={{
        background: alpha(accent, 0.12),
        border: `1px solid ${alpha(accent, 0.3)}`,
        color: accent,
        boxShadow: `0 0 12px ${alpha(accent, 0.08)}`,
      }}
    >
      {btnLabel}
    </button>
  );
}
