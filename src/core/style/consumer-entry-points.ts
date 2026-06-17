// ═══════════════════════════════════════════════════════════════════
// STYLE CONTRACT — Canvas / Preview Entry Points  (Sprint 8.2A)
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.2A — Style Consumer Wiring: Canvas + Preview
//
// These wrappers exist ONLY so the parity test has explicit entry
// points to call. Both wrappers delegate to the SAME shared helper
// `resolvePageStyleTokens()`. They contain ZERO logic of their own.
//
// The senior reviewer explicitly forbade:
//   "Tidak boleh ada: resolveCanvasStyle() / resolvePreviewStyle()
//    dengan logika yang berbeda."
//
// These wrappers comply: they have NO logic. They are pure passthrough
// to the shared helper. If a future sprint needs Canvas-specific
// behavior, that behavior belongs in the shared helper (gated by a
// parameter), NOT in a divergent wrapper.
//
// Why have wrappers at all?
//   1. The parity test can import both entry points and assert they
//      produce identical output. This catches any future drift.
//   2. Callers that want to be explicit about their consumer role
//      (Canvas vs Preview) can name the function they call.
//   3. The wrappers are zero-cost — Vite/Next.js tree-shake the
//      indirection in production builds.
// ═══════════════════════════════════════════════════════════════════

import type { CanvaPage } from '@/components/canva/types';
import {
  resolvePageStyleTokens,
  type ResolvePageStyleTokensResult,
} from './consumer';

/**
 * Canvas entry point. Delegates to resolvePageStyleTokens() — no
 * Canvas-specific logic. Exists so the parity test can assert that
 * Canvas and Preview share the same resolution path.
 */
export function resolveCanvasConsumerTokens(
  page: CanvaPage,
): ResolvePageStyleTokensResult {
  return resolvePageStyleTokens(page);
}

/**
 * Preview entry point. Delegates to resolvePageStyleTokens() — no
 * Preview-specific logic. Exists so the parity test can assert that
 * Canvas and Preview share the same resolution path.
 */
export function resolvePreviewConsumerTokens(
  page: CanvaPage,
): ResolvePageStyleTokensResult {
  return resolvePageStyleTokens(page);
}
