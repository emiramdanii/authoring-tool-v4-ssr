'use client';

// ═══════════════════════════════════════════════════════════════════
// SCREEN SHELL — Consistent chrome wrapper for screen-based rendering
// ═══════════════════════════════════════════════════════════════════
// The ScreenShell wraps each screen with consistent chrome:
//   - Screen header: optional section label + icon
//   - Content area: renders the page's blocks
//   - Screen footer: navigation hint text
//
// Full-page screens (cover, penutup) get NO chrome.
// Interactive screens get a "Selesaikan dulu" badge when not completed.
//
// This enforces the 1 screen = 1 page principle:
//   - No overlap between screens
//   - No free stacking of unrelated content
//   - Each page has a clear purpose defined by its screen type
// ═══════════════════════════════════════════════════════════════════

import React from 'react';
import type { ScreenConfig } from './ScreenTypeRegistry';
import { getScreenConfig, isFullPageScreen } from './ScreenTypeRegistry';
import type { TokenResolver } from '../types';

// ── Props ────────────────────────────────────────────────────────

export interface ScreenShellProps {
  /** The screen type — determines chrome behavior */
  screenType: string;
  /** The screen config — pre-resolved for performance */
  screenConfig?: ScreenConfig;
  /** The token resolver for styling */
  tokens: TokenResolver;
  /** Section label from the page schema */
  sectionLabel?: string;
  /** Section color from the page schema */
  sectionColor?: string;
  /** Whether the user has completed this screen's interaction */
  isCompleted?: boolean;
  /** Whether we're in compact/canvas mode (less chrome) */
  isCompact?: boolean;
  /** Page index for progress display */
  pageIndex?: number;
  /** Total pages for progress display */
  totalPages?: number;
  /** Whether inline editing is enabled for this screen (teacher mode) */
  editable?: boolean;
  /** V5-PRODUCT-STABILIZATION-01: Hide "Selesaikan dulu" badge.
   *  In preview mode, guru should be able to browse freely without
   *  the badge suggesting they must complete the kuis first.
   *  In export/student mode, the badge stays to guide learning. */
  hideCompletionBadge?: boolean;
  /** The rendered content (from SchemaScreenRenderer) */
  children: React.ReactNode;
}

// ═══════════════════════════════════════════════════════════════════
// SCREEN SHELL COMPONENT
// ═══════════════════════════════════════════════════════════════════

export const ScreenShell = React.memo(function ScreenShell({
  screenType,
  screenConfig: externalConfig,
  tokens,
  sectionLabel,
  sectionColor: _sectionColor,
  isCompleted = false,
  isCompact = false,
  pageIndex = 0,
  totalPages = 1,
  editable = false,
  hideCompletionBadge = false,
  children,
}: ScreenShellProps) {
  const config = externalConfig ?? getScreenConfig(screenType);

  // ═══ FULL-PAGE SCREENS: No chrome at all ══════════════════════
  // Cover and penutup screens fill the entire scene — no header,
  // no footer, no badges. The content IS the screen.
  // When editable, wrap with a subtle blue top border indicator.
  if (isFullPageScreen(screenType)) {
    if (editable) {
      return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {/* Blue top border indicating edit mode */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              zIndex: 50,
              background: 'rgba(59,130,246,0.5)',
              borderRadius: '0 0 2px 2px',
            }}
          />
          {children}
        </div>
      );
    }
    return <>{children}</>;
  }

  // ═══ CONTENT SCREENS: Full chrome ═════════════════════════════
  const accent = config.accentColor;
  const displayLabel = sectionLabel || config.displayName;
  const progress = totalPages > 1 ? (pageIndex + 1) / totalPages : 0;

  // Navigation hint text based on screen type
  // V5-PRODUCT-STABILIZATION-01: In preview mode (hideCompletionBadge=true),
  // don't show "Selesaikan dulu" — guru can browse freely.
  const navHint = config.isInteractive && !hideCompletionBadge
    ? (isCompleted ? 'Tekan Selanjutnya untuk lanjut' : 'Selesaikan dulu untuk lanjut')
    : 'Tekan Selanjutnya untuk lanjut';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* ══ EDIT MODE INDICATOR — blue top border when editable ════ */}
      {editable && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            zIndex: 51,
            background: 'rgba(59,130,246,0.5)',
            borderRadius: '0 0 2px 2px',
          }}
        />
      )}

      {/* ══ PROGRESS BAR — top accent line ══════════════════════ */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          zIndex: 50,
          background: tokens.colorAlpha(accent, 0.12),
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: '100%',
            background: tokens.color(accent),
            borderRadius: '0 2px 2px 0',
            transition: 'width 0.4s ease-out',
          }}
        />
      </div>

      {/* ══ MAIN CONTENT ═══════════════════════════════════════ */}
      {children}

      {/* ══ SECTION LABEL + INTERACTION BADGE — bottom-left ════ */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 16,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {/* Section label pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 16,
            background: tokens.colorAlpha(accent, 0.1),
            border: `1px solid ${tokens.colorAlpha(accent, 0.2)}`,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: tokens.color(accent),
            fontFamily: tokens.fontFamily('body'),
          }}
        >
          <span style={{ fontSize: 13 }}>{getSectionIcon(screenType)}</span>
          <span style={{ textTransform: 'uppercase' }}>{displayLabel}</span>
        </div>

        {/* "Selesaikan dulu" badge for incomplete interactive screens
            V5-PRODUCT-STABILIZATION-01: Hidden in preview mode (hideCompletionBadge) */}
        {config.isInteractive && !isCompleted && !hideCompletionBadge && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 12,
              background: tokens.colorAlpha('o', 0.1),
              border: `1px solid ${tokens.colorAlpha('o', 0.25)}`,
              fontSize: 10,
              fontWeight: 700,
              color: tokens.color('o'),
              fontFamily: tokens.fontFamily('body'),
              animation: 'pulse-badge 2s ease-in-out infinite',
            }}
          >
            ⚠ Selesaikan dulu
          </div>
        )}
      </div>

      {/* ══ NAV HINT — bottom-center ═══════════════════════════ */}
      {!isCompact && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 40,
            padding: '3px 10px',
            borderRadius: 10,
            background: 'rgba(0,0,0,0.12)',
            fontSize: 10,
            fontWeight: 600,
            color: tokens.muted(0.6),
            fontFamily: tokens.fontFamily('body'),
            whiteSpace: 'nowrap',
          }}
        >
          {navHint}
        </div>
      )}

      {/* ══ PAGE COUNTER — bottom-right ════════════════════════ */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          right: 16,
          zIndex: 40,
          fontSize: 10,
          fontWeight: 700,
          color: tokens.muted(0.5),
          fontFamily: tokens.fontFamily('body'),
          letterSpacing: '0.05em',
        }}
      >
        {pageIndex + 1} / {totalPages}
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════
// HELPER: Section icon for each screen type
// ═══════════════════════════════════════════════════════════════════

function getSectionIcon(screenType: string): string {
  const icons: Record<string, string> = {
    cover: '📖',
    petunjuk: '📌',
    tujuan: '🎯',
    motivasi: '💡',
    materi: '📖',
    diskusi: '💬',
    kuis: '📝',
    game: '🎮',
    refleksi: '🪞',
    rangkuman: '📋',
    penutup: '🏁',
    skenario: '🎭',
    hasil: '🏆',
  };
  return icons[screenType] ?? '📄';
}
