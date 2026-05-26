// ═══════════════════════════════════════════════════════════════════
// VISUAL CONTRACT — iOS Light Design Standard
// ═══════════════════════════════════════════════════════════════════
// Sprint 3A: Standard visual contract constants for the iOS Light
// design system. These define the canonical patterns for cards,
// spacing, typography, and content width discipline.
//
// Usage: Import VISUAL_CONTRACT in renderers for consistent styling.
// TokenResolver methods (cardStyle, nestedCardStyle, etc.) already
// implement these contracts. Use this file for Tailwind class names
// or when you need static constants.

export const VISUAL_CONTRACT = {
  // ── Surface Hierarchy ────────────────────────────────────────────
  // App BG → Section → Nested Card → Interactive
  surface: {
    appBg: 'bg-[#F5F7FB]',        // Level 0: App background
    section: 'bg-white',           // Level 1: Section/card surface
    nestedCard: 'bg-[#F8FAFC]',    // Level 2: Inset/nested surface
    interactive: 'bg-blue-50/50',  // Level 3: Interactive/hover
  },

  // ── Card Style ───────────────────────────────────────────────────
  // rounded-[24px] border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]
  card: {
    base: 'rounded-3xl border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
    elevated: 'rounded-3xl border border-black/5 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]',
    nested: 'rounded-2xl border border-black/[0.03] bg-[#F8FAFC]',
    interactive: 'rounded-2xl border border-blue-200/30 bg-blue-50/40',
  },

  // ── Section Padding ──────────────────────────────────────────────
  // px-8 py-7 → 32px horizontal, 28px vertical
  sectionPadding: {
    standard: 'px-8 py-7',    // 32px 28px
    compact: 'px-6 py-5',     // 24px 20px
    spacious: 'px-10 py-8',   // 40px 32px
  },

  // ── Typography Scale ─────────────────────────────────────────────
  // iOS-style type ramp
  typography: {
    hero: 'text-4xl font-semibold tracking-tight',       // ~36px
    sectionTitle: 'text-2xl font-semibold tracking-tight', // ~24px
    cardTitle: 'text-lg font-medium',                     // ~18px
    body: 'text-[15px] leading-7',                        // 15px / 28px line-height
    caption: 'text-sm text-slate-500',                    // 14px
    overline: 'text-xs font-medium uppercase tracking-wider text-slate-400',
  },

  // ── Vertical Rhythm ──────────────────────────────────────────────
  // Gaps between elements
  rhythm: {
    titleToSubtitle: 8,       // 8px  — title → subtitle gap
    subtitleToContent: 16,    // 16px — subtitle → body gap
    contentBlock: 24,         // 24px — between content blocks
    majorSection: 40,         // 40px — between major sections
    cardGap: 16,              // 16px — between sibling cards
    cardInternal: 20,         // 20px — padding inside cards
  },

  // ── Content Width Discipline ─────────────────────────────────────
  // Max-width for different content types
  width: {
    paragraph: '700px',       // 680-720px range
    quiz: '640px',            // Kuis/assessment
    reflection: '560px',      // Refleksi/intimate
    hero: '900px',            // Hero/cover
    grid: '100%',             // Full-width grids
  },

  // ── Shadow Discipline ────────────────────────────────────────────
  // Only soft ambient shadows, never shadow-2xl
  shadow: {
    card: '0 1px 2px rgba(0,0,0,0.04)',
    elevated: '0 8px 24px rgba(15,23,42,0.06)',
    subtle: '0 1px 3px rgba(0,0,0,0.03)',
    none: 'none',
  },

  // ── Border Discipline ────────────────────────────────────────────
  // Only subtle borders
  border: {
    card: '1px solid rgba(0,0,0,0.05)',
    nested: '1px solid rgba(0,0,0,0.03)',
    interactive: '1px solid rgba(59,130,246,0.2)',
    divider: '1px solid rgba(0,0,0,0.04)',
  },

  // ── Animation ────────────────────────────────────────────────────
  // Subtle, iOS-style transitions
  animation: {
    fast: '150ms ease',
    normal: '250ms ease',
    slow: '350ms ease',
    spring: '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

// Type for contract keys
export type VisualContract = typeof VISUAL_CONTRACT;
