// ═══════════════════════════════════════════════════════════════════
// USE BLOCK COMPRESSION — Hook for compression-aware block renderers
// ═══════════════════════════════════════════════════════════════════
//
// This hook lets block renderers know how many items to show
// when the engine decides compression is needed.
//
// Instead of wrapping the entire block in a generic container,
// each renderer uses this hook to:
//   1. Know how many items to show (visibleCount)
//   2. Know if there are hidden items (hasMore)
//   3. Provide a "show more" callback (showMore)
//   4. Know the compression strategy being used
//
// This gives each renderer FINE-GRAINED control over how
// compression affects its specific UI.
//
// Usage in a block renderer:
//   const { visibleCount, hasMore, showMore, strategy } = useBlockCompression({
//     compression,        // from SceneLayoutEngine
//     totalItems: items.length,
//   });
//
//   // Only render visible items
//   items.slice(0, visibleCount).map(item => ...)
//
//   // Show "Lihat lainnya" if there are hidden items
//   {hasMore && <button onClick={showMore}>Lihat {hiddenCount} lainnya</button>}
//
// ═══════════════════════════════════════════════════════════════════

import { useState, useCallback, useMemo } from 'react';
import type { CompressionDecision, CompressionStrategy } from '../layout/CompressionEngine';

export interface BlockCompressionConfig {
  /** The compression decision from the engine (undefined = no compression) */
  compression?: CompressionDecision;
  /** Total number of items in the block */
  totalItems: number;
  /** Default number of items to show when not compressed */
  defaultVisibleCount?: number;
}

export interface BlockCompressionResult {
  /** Number of items to render */
  visibleCount: number;
  /** Number of items hidden by compression */
  hiddenCount: number;
  /** Whether there are hidden items */
  hasMore: boolean;
  /** Whether compression is active */
  isCompressed: boolean;
  /** The compression strategy being used */
  strategy: CompressionStrategy | null;
  /** Callback to reveal more items */
  showMore: () => void;
  /** Callback to reveal all items */
  showAll: () => void;
  /** Whether user has manually expanded (overrides compression) */
  isExpanded: boolean;
  /** Compression decision (for advanced usage) */
  decision: CompressionDecision | null;
}

/**
 * Hook that provides compression-aware item visibility.
 *
 * When the SceneLayoutEngine decides a block should be compressed,
 * this hook calculates how many items to show based on the strategy:
 *
 *   - accordion: show 1-2 items (rest behind accordion headers)
 *   - reveal-set: show visibleItemCount from params
 *   - collapsible: show ~40% of items
 *   - step-reveal: show 1 item at a time
 *
 * The user can always expand to see all items.
 * The hook tracks the "manually expanded" state per block instance.
 */
export function useBlockCompression(config: BlockCompressionConfig): BlockCompressionResult {
  const { compression, totalItems, defaultVisibleCount } = config;

  // Track if user has manually expanded
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate visible count based on strategy and params
  const compressedVisibleCount = useMemo(() => {
    if (!compression || !compression.isCompressed) return totalItems;

    switch (compression.strategy) {
      case 'accordion':
        // Accordion: show first item expanded + N collapsed headers
        // We show the first 2 items in full, rest as collapsed headers
        return Math.min(2, totalItems);

      case 'reveal-set':
        // Reveal-set: show the configured number of visible items
        return compression.params.visibleItemCount ?? Math.ceil(totalItems * 0.4);

      case 'collapsible':
        // Collapsible: show ~40% as preview
        return Math.max(1, Math.ceil(totalItems * 0.4));

      case 'step-reveal':
        // Step-reveal: show one step at a time
        return 1;

      default:
        return Math.ceil(totalItems * 0.5);
    }
  }, [compression, totalItems]);

  // If user has manually expanded, show everything
  const visibleCount = isExpanded ? totalItems : (compression?.isCompressed ? compressedVisibleCount : (defaultVisibleCount ?? totalItems));
  const hiddenCount = totalItems - visibleCount;
  const hasMore = hiddenCount > 0;

  const showMore = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const showAll = useCallback(() => {
    setIsExpanded(true);
  }, []);

  return {
    visibleCount,
    hiddenCount,
    hasMore,
    isCompressed: compression?.isCompressed ?? false,
    strategy: compression?.strategy ?? null,
    showMore,
    showAll,
    isExpanded,
    decision: compression ?? null,
  };
}
