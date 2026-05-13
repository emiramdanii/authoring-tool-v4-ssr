'use client';

// ═══════════════════════════════════════════════════════════════════
// SKIP NAV LINK — Keyboard-accessible skip-to-content link
// ═══════════════════════════════════════════════════════════════════
// Appears on Tab focus, hidden otherwise. Links to #main-content
// so keyboard users can skip repetitive navigation.
// ═══════════════════════════════════════════════════════════════════

import React from 'react';

export function SkipNavLink() {
  return (
    <a
      href="#main-content"
      className="skip-nav-link sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold focus:text-sm focus:outline-none focus:ring-2"
      style={{
        background: 'var(--color-accent, #f59e0b)',
        color: 'var(--color-bg, #0e1c2f)',
      }}
    >
      Langsung ke konten
    </a>
  );
}
