'use client';

// ═══════════════════════════════════════════════════════════════════
// LIVE ANNOUNCER — Screen reader live region for game state changes
// ═══════════════════════════════════════════════════════════════════
// Renders a visually hidden live region that screen readers monitor.
// Use `announceToScreenReader()` from @/lib/a11y to push messages.
// This component just provides the DOM mount point.
// ═══════════════════════════════════════════════════════════════════

import React from 'react';

export function LiveAnnouncer() {
  return (
    <div
      id="a11y-live-region"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {''}
    </div>
  );
}
