'use client';

// ═══════════════════════════════════════════════════════════════════
// GOLDEN PAGE RENDERER — Structural Chrome for Golden Template Pages
// ═══════════════════════════════════════════════════════════════════
//
// FIX 3: This component adds the MISSING structural elements that make
// the output look like a professional presentation instead of a random
// collection of blocks. It wraps the SchemaScreenRenderer's output
// and adds:
//
//   1. Progress Bar — shows which page in the pertemuan flow
//   2. Phase Badge — shows the current learning phase (intro/materi/practice)
//   3. Consistent Header — section label + accent stripe at the top
//   4. Nav Bar — page navigation dots at the bottom
//
// This is NOT a replacement for SchemaScreenRenderer — it ENRICHES it.
// The SchemaScreenRenderer handles block positioning (resolveSceneLayout),
// while GoldenPageRenderer adds the page-level chrome that creates
// visual consistency across all pages in a pertemuan.
//
// Architecture:
//   PageRenderer
//     → GoldenPageRenderer (if golden contract active)
//       → SchemaScreenRenderer (block layout + rendering)
//         → SceneLayoutEngine (position calculation)
//           → Individual block renderers
//
// The golden template "Lock Mode" principle:
//   - ONE contract = ONE visual identity
//   - Every page has the same header, footer, progress style
//   - The only thing that changes per page is the CONTENT
//   - No block can pick its own accent — the contract decides
//
// ═══════════════════════════════════════════════════════════════════

import React from 'react';
import type { ContractResolvedStyle } from '../template/contract/TemplateThemeContract';
import type { SceneType } from '../edu/education-scene-types';
import type { TokenResolver } from './types';

// ── Scene Type to Phase Label Mapping ──────────────────────────

const PHASE_LABELS: Record<SceneType, string> = {
  intro: 'Pembukaan',
  concept: 'Konsep',
  example: 'Contoh',
  practice: 'Praktik',
  discussion: 'Diskusi',
  reflection: 'Refleksi',
  assessment: 'Asesmen',
  summary: 'Ringkasan',
};

const PHASE_ICONS: Record<SceneType, string> = {
  intro: '🎬',
  concept: '📖',
  example: '💡',
  practice: '✏️',
  discussion: '💬',
  reflection: '🪞',
  assessment: '📝',
  summary: '🏆',
};

// ── Props ──────────────────────────────────────────────────────

export interface GoldenPageRendererProps {
  /** The resolved contract style for this page */
  contractStyle: ContractResolvedStyle;
  /** The token resolver for this page */
  tokens: TokenResolver;
  /** Scene type for this page */
  sceneType: SceneType;
  /** Page type (cover, materi, kuis, etc.) */
  pageType: string;
  /** Current page index (0-based) */
  pageIndex: number;
  /** Total pages in this pertemuan */
  totalPages: number;
  /** Whether this is a cover page (no chrome) */
  isCoverPage: boolean;
  /** The rendered content (from SchemaScreenRenderer) */
  children: React.ReactNode;
}

// ═══════════════════════════════════════════════════════════════════
// GOLDEN PAGE RENDERER COMPONENT
// ═══════════════════════════════════════════════════════════════════

export const GoldenPageRenderer = React.memo(function GoldenPageRenderer({
  contractStyle,
  tokens,
  sceneType,
  pageType,
  pageIndex,
  totalPages,
  isCoverPage,
  children,
}: GoldenPageRendererProps) {
  // Cover pages get NO chrome — they fill the entire scene
  if (isCoverPage) {
    return <>{children}</>;
  }

  const accentToken = contractStyle.primaryAccentToken;
  const phaseLabel = PHASE_LABELS[sceneType] || 'Konten';
  const phaseIcon = PHASE_ICONS[sceneType] || '📄';
  const progress = totalPages > 1 ? (pageIndex + 1) / totalPages : 0;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* ══ PROGRESS BAR — top accent line ══════════════════════ */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          zIndex: 50,
          background: tokens.colorAlpha(accentToken, 0.15),
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: '100%',
            background: tokens.color(accentToken),
            borderRadius: '0 2px 2px 0',
            transition: 'width 0.4s ease-out',
          }}
        />
      </div>

      {/* ══ MAIN CONTENT — from SchemaScreenRenderer ═══════════ */}
      {children}

      {/* ══ PHASE BADGE — bottom-left ═══════════════════════════ */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 16,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 12,
          background: tokens.colorAlpha(accentToken, 0.1),
          border: `1px solid ${tokens.colorAlpha(accentToken, 0.2)}`,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.04em',
          color: tokens.color(accentToken),
          fontFamily: 'var(--font-nunito), Nunito, sans-serif',
        }}
      >
        <span style={{ fontSize: 13 }}>{phaseIcon}</span>
        <span style={{ textTransform: 'uppercase' }}>{phaseLabel}</span>
      </div>

      {/* ══ NAV DOTS — bottom-center ════════════════════════════ */}
      {totalPages > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 40,
            display: 'flex',
            gap: 5,
            padding: '3px 8px',
            borderRadius: 10,
            background: 'rgba(0,0,0,0.15)',
          }}
        >
          {Array.from({ length: totalPages }, (_, i) => (
            <div
              key={`nav-dot-${i}`}
              style={{
                width: i === pageIndex ? 14 : 5,
                height: 5,
                borderRadius: 3,
                background: i === pageIndex
                  ? tokens.color(accentToken)
                  : tokens.colorAlpha('muted', 0.4),
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      )}

      {/* ══ PAGE COUNTER — bottom-right ═════════════════════════ */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          right: 16,
          zIndex: 40,
          fontSize: 10,
          fontWeight: 700,
          color: tokens.muted(0.5),
          fontFamily: 'var(--font-nunito), Nunito, sans-serif',
          letterSpacing: '0.05em',
        }}
      >
        {pageIndex + 1} / {totalPages}
      </div>
    </div>
  );
});
