// ═══════════════════════════════════════════════════════════════════
// STYLE CONTRACT — Consumer Helper  (Sprint 8.2A)
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.2A — Style Consumer Wiring: Canvas + Preview
//
// `resolvePageStyleTokens()` is the SINGLE shared helper that Canvas
// and Preview both call to obtain resolved style tokens for a page.
//
//   Canvas  ─┐
//            ├─→ resolvePageStyleTokens(page) → ResolvedStyleTokens
//   Preview ─┘
//
// Neither Canvas nor Preview is allowed to implement its own resolution
// logic. They MUST import this helper. The parity test enforces that
// both entry points use the same helper.
//
// Pipeline:
//   CanvaPage
//     → createStyleContractFromPage(page)
//       → StyleContract
//         → resolveStyleContract()
//           → ResolvedStyleTokens
//
// Contract guarantees:
//   - Pure. No side effects. Deterministic.
//   - No React. No Zustand. No DOM.
//   - SSR-safe — used by both Canvas ('use client') and Preview.
//   - Same input → identical output, regardless of caller.
//
// IMPORTANT — this helper does NOT replace TokenResolver:
//   The legacy `TokenResolver` class (src/core/renderer/types.ts) is
//   deeply embedded in 30+ block renderers. Replacing it would break
//   the frozen boundary. Instead:
//     - Canvas / Preview call `resolvePageStyleTokens(page)` to get
//       the canonical ResolvedStyleTokens for page-level concerns
//       (background, overlay, navbar style, page accent).
//     - The legacy TokenResolver continues to be used by block
//       renderers, but is constructed with the same themeId that
//       this helper derived — so colors stay consistent.
//     - Sprint 8.2B (Present) and 8.2C (Export) will follow the same
//       pattern: use this helper for page-level tokens, keep the
//       existing block renderer pipeline.
// ═══════════════════════════════════════════════════════════════════

import type { CanvaPage } from '@/components/canva/types';
import {
  createStyleContractFromPage,
  type PageStyleAdapterResult,
  type PageStyleSource,
} from './page-style-adapter';
import { resolveStyleContract } from './resolve-style-contract';
import type { ResolvedStyleTokens } from './types';

// ─────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────

/**
 * Result of `resolvePageStyleTokens()`. Mirrors the adapter result
 * but adds the fully-resolved tokens.
 */
export interface ResolvePageStyleTokensResult {
  /** Fully-resolved style tokens — consumer-ready, no second resolver. */
  tokens: ResolvedStyleTokens;
  /** How the contract was derived (mirrors adapter source). */
  source: PageStyleSource;
  /** Original page.contractId when source === 'explicit-contract'. */
  explicitContractId?: string;
  /** Original legacy theme id when the page carries a KNOWN legacy id. */
  legacyThemeId?: string;
  /**
   * Unrecognized theme id (diagnostic only — must NOT be fed to a
   * legacy renderer). Patch (P1-hardening — Senior Review 8.2A).
   */
  unrecognizedThemeId?: string;
  /** StylePresetId chosen by the adapter. */
  presetId: PageStyleAdapterResult['presetId'];
}

// ─────────────────────────────────────────────────────────────────
// THE helper
// ─────────────────────────────────────────────────────────────────

/**
 * Resolve a CanvaPage into fully-resolved style tokens.
 *
 * Pure. Deterministic. SSR-safe. No React / Zustand / DOM access.
 *
 * Canvas and Preview MUST both call this helper. They are NOT allowed
 * to implement their own resolution logic — the parity test enforces
 * this by importing both entry points and comparing their outputs.
 *
 * @param page — the CanvaPage to resolve (schema OR legacy element page)
 * @returns resolved tokens + source metadata
 */
export function resolvePageStyleTokens(
  page: CanvaPage,
): ResolvePageStyleTokensResult {
  const adapted = createStyleContractFromPage({ page });
  const tokens = resolveStyleContract(adapted.contract);

  return {
    tokens,
    source: adapted.source,
    explicitContractId: adapted.explicitContractId,
    legacyThemeId: adapted.legacyThemeId,
    unrecognizedThemeId: adapted.unrecognizedThemeId,
    presetId: adapted.presetId,
  };
}

/**
 * Convenience: resolve tokens for an array of pages. Returns the same
 * array shape — useful for consumers that need to render multiple
 * pages (e.g. Present mode's slide stack).
 *
 * Pure. Deterministic. SSR-safe.
 */
export function resolvePageStyleTokensBatch(
  pages: CanvaPage[],
): ResolvePageStyleTokensResult[] {
  return pages.map((page) => resolvePageStyleTokens(page));
}
