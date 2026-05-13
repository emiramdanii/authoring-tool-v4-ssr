// ═══════════════════════════════════════════════════════════════════
// A11Y UTILITIES — Accessibility helpers for the MPI Authoring Tool
// ═══════════════════════════════════════════════════════════════════
// Provides ARIA label generators, keyboard navigation helpers,
// focus trap utilities, and screen reader announcement functions.
// All interactive blocks should use these for consistent a11y.
// ═══════════════════════════════════════════════════════════════════

// ── ARIA Label Helpers ───────────────────────────────────────────

/**
 * Generate an ARIA label for an interactive game block.
 * @param gameType - e.g. 'Kuis', 'Game Memory', 'Teka Silang'
 * @param score - current score
 * @param maxScore - maximum possible score
 */
export function gameAriaLabel(gameType: string, score: number, maxScore: number): string {
  if (maxScore > 0) {
    return `${gameType}. Skor: ${score} dari ${maxScore}`;
  }
  return gameType;
}

/**
 * Generate ARIA attributes for a progress bar.
 */
export function progressBarAria(
  label: string,
  value: number,
  max: number,
): Record<string, string> {
  return {
    'role': 'progressbar',
    'aria-label': label,
    'aria-valuenow': String(value),
    'aria-valuemin': '0',
    'aria-valuemax': String(max),
  };
}

/**
 * Generate ARIA attributes for a button.
 */
export function buttonAria(
  label: string,
  pressed?: boolean,
  expanded?: boolean,
): Record<string, string> {
  const attrs: Record<string, string> = {
    'aria-label': label,
  };
  if (pressed !== undefined) attrs['aria-pressed'] = String(pressed);
  if (expanded !== undefined) attrs['aria-expanded'] = String(expanded);
  return attrs;
}

/**
 * Generate ARIA attributes for a live region.
 */
export function liveRegion(mode: 'polite' | 'assertive'): Record<string, string> {
  return {
    'aria-live': mode,
    'aria-atomic': 'true',
  };
}

// ── Keyboard Navigation Helpers ──────────────────────────────────

/**
 * Calculate the next index for roving tabindex pattern.
 * Supports ArrowUp/Down/Left/Right, Home, End.
 * @param total - total number of items
 * @param currentIndex - currently focused item index
 * @param key - keyboard event key
 * @param orientation - 'vertical' or 'horizontal' or 'both'
 * @param cols - number of columns (for grid navigation)
 */
export function handleRovingFocus(
  total: number,
  currentIndex: number,
  key: string,
  orientation: 'vertical' | 'horizontal' | 'both' = 'vertical',
  cols?: number,
): number {
  if (currentIndex < 0 || currentIndex >= total) return 0;

  switch (key) {
    case 'ArrowDown': {
      if (orientation === 'horizontal') return currentIndex;
      if (cols) {
        const next = currentIndex + cols;
        return next < total ? next : currentIndex;
      }
      return currentIndex + 1 < total ? currentIndex + 1 : currentIndex;
    }
    case 'ArrowUp': {
      if (orientation === 'horizontal') return currentIndex;
      if (cols) {
        const prev = currentIndex - cols;
        return prev >= 0 ? prev : currentIndex;
      }
      return currentIndex - 1 >= 0 ? currentIndex - 1 : currentIndex;
    }
    case 'ArrowRight': {
      if (orientation === 'vertical') return currentIndex;
      return currentIndex + 1 < total ? currentIndex + 1 : currentIndex;
    }
    case 'ArrowLeft': {
      if (orientation === 'vertical') return currentIndex;
      return currentIndex - 1 >= 0 ? currentIndex - 1 : currentIndex;
    }
    case 'Home':
      return 0;
    case 'End':
      return total - 1;
    default:
      return currentIndex;
  }
}

/**
 * Check if a keyboard event represents an activation action
 * (Enter or Space bar).
 */
export function isActivationKey(e: KeyboardEvent): boolean {
  return e.key === 'Enter' || e.key === ' ';
}

// ── Focus Trap ───────────────────────────────────────────────────

/**
 * Create a focus trap within a container element.
 * Returns activate/deactivate functions.
 * Useful for modal dialogs and overlay panels.
 */
export function createFocusTrap(container: HTMLElement): {
  activate: () => void;
  deactivate: () => void;
} {
  const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  let previouslyFocused: HTMLElement | null = null;
  let handler: ((e: KeyboardEvent) => void) | null = null;

  function getFocusableElements(): HTMLElement[] {
    return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
  }

  function activate(): void {
    previouslyFocused = document.activeElement as HTMLElement;

    handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    container.addEventListener('keydown', handler);

    // Auto-focus the first focusable element
    const focusable = getFocusableElements();
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  }

  function deactivate(): void {
    if (handler) {
      container.removeEventListener('keydown', handler);
      handler = null;
    }
    // Restore focus to the previously focused element
    if (previouslyFocused && previouslyFocused.focus) {
      previouslyFocused.focus();
    }
  }

  return { activate, deactivate };
}

// ── Screen Reader Announcements ──────────────────────────────────

let liveRegionEl: HTMLElement | null = null;

/**
 * Announce a message to screen readers via a visually hidden live region.
 * Creates the region lazily if it doesn't exist yet.
 * @param message - text to announce
 * @param priority - 'polite' waits for idle, 'assertive' interrupts
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite',
): void {
  // Find or create the live region element
  if (!liveRegionEl) {
    let el = document.getElementById('a11y-live-region');
    if (!el) {
      el = document.createElement('div');
      el.id = 'a11y-live-region';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-atomic', 'true');
      // Visually hidden but accessible to screen readers
      el.style.position = 'absolute';
      el.style.width = '1px';
      el.style.height = '1px';
      el.style.padding = '0';
      el.style.margin = '-1px';
      el.style.overflow = 'hidden';
      el.style.clip = 'rect(0, 0, 0, 0)';
      el.style.whiteSpace = 'nowrap';
      el.style.border = '0';
      document.body.appendChild(el);
    }
    liveRegionEl = el;
  }

  // Update the aria-live attribute based on priority
  liveRegionEl.setAttribute('aria-live', priority);

  // Clear and re-set the text to force screen readers to announce it
  liveRegionEl.textContent = '';
  // Use requestAnimationFrame to ensure the clearing is processed
  requestAnimationFrame(() => {
    if (liveRegionEl) {
      liveRegionEl.textContent = message;
    }
  });
}

// ── Reduced Motion & High Contrast Preferences ──────────────────

/**
 * Check if the user prefers reduced motion.
 * Returns false during SSR.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if the user prefers high contrast.
 * Returns false during SSR.
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: more)').matches;
}

/**
 * Return CSS styles that disable transitions and animations
 * when the user prefers reduced motion.
 */
export function getReducedMotionStyles(): React.CSSProperties {
  return prefersReducedMotion() ? {
    transition: 'none',
    animation: 'none',
  } : {};
}
