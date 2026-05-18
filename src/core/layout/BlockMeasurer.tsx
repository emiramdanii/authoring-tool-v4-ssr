// ═══════════════════════════════════════════════════════════════════
// BLOCK MEASURER — Real DOM Measurement via ResizeObserver
// ═══════════════════════════════════════════════════════════════════
//
// PROBLEM:
//   SceneLayoutEngine.estimateBlockHeight() uses GUESSES.
//   Real content height ≠ guessed height.
//   This means: WYSIWYG is wrong, auto-split is wrong, overflow is wrong.
//
// SOLUTION:
//   Render blocks → Measure real DOM height → Feed back to engine
//   Pipeline: Render → Measure → Layout → Commit
//
// ARCHITECTURE:
//   - BlockMeasurer wraps each block in a ResizeObserver
//   - When a block's real height is measured, it reports to a callback
//   - The callback updates a measurement cache (Map<blockId, height>)
//   - SceneLayoutEngine uses the cache instead of estimates
//   - This makes layout DETERMINISTIC — measured, not guessed
//
// IMPORTANT:
//   - Measurement is ASYNC (after paint), estimation is SYNC (before paint)
//   - First render uses estimates, subsequent renders use measurements
//   - This is intentional — avoids layout flicker on first paint
//   - The measurement cache persists across re-renders

'use client';

import React, { useRef, useEffect, useCallback } from 'react';

// ── Measurement Cache ──────────────────────────────────────────

/**
 * Global measurement cache — stores real DOM heights for blocks.
 * Key: block ID (string)
 * Value: measured height in px (number)
 *
 * This is a MODULE-LEVEL singleton because:
 *   1. Measurements persist across component re-renders
 *   2. Measurements persist across page switches
 *   3. No need for React state (avoids re-render loops)
 *   4. Can be read synchronously by SceneLayoutEngine
 *
 * Invalidate with: clearMeasurementCache() or removeMeasurement(blockId)
 */
const measurementCache = new Map<string, number>();

/**
 * Get a cached measurement for a block.
 * Returns undefined if not yet measured.
 */
export function getMeasuredHeight(blockId: string): number | undefined {
  return measurementCache.get(blockId);
}

/**
 * Check if a block has been measured.
 */
export function hasMeasurement(blockId: string): boolean {
  return measurementCache.has(blockId);
}

/**
 * Store a measurement in the cache.
 */
export function setMeasuredHeight(blockId: string, height: number): void {
  measurementCache.set(blockId, Math.round(height));
}

/**
 * Remove a single block's measurement (e.g., when block is deleted).
 */
export function removeMeasurement(blockId: string): void {
  measurementCache.delete(blockId);
}

/**
 * Clear all cached measurements (e.g., when project changes).
 */
export function clearMeasurementCache(): void {
  measurementCache.clear();
}

/**
 * Get all measurements as a readonly map (for debugging).
 */
export function getAllMeasurements(): ReadonlyMap<string, number> {
  return measurementCache;
}

// ── Measured Block Component ───────────────────────────────────

export interface MeasuredBlockProps {
  /** The block ID — used as cache key */
  blockId: string;
  /** Callback when the block's height is measured or changes */
  onMeasured?: (blockId: string, height: number) => void;
  /** The block content to measure */
  children: React.ReactNode;
}

/**
 * MeasuredBlock — wraps a block in a ResizeObserver.
 *
 * How it works:
 *   1. Renders children inside a div
 *   2. Attaches ResizeObserver to the div
 *   3. When the div's height changes:
 *      a. Stores height in measurementCache
 *      b. Calls onMeasured callback
 *   4. SceneLayoutEngine reads from measurementCache on next resolve
 *
 * The measurement flow:
 *   Render (estimated) → Paint → Measure (real) → Re-render (measured)
 *
 * This means:
 *   - First frame: estimated heights (no flicker)
 *   - Second frame: real heights (accurate WYSIWYG)
 *   - Subsequent frames: cached heights (no re-measurement unless content changes)
 */
export const MeasuredBlock = React.memo(function MeasuredBlock({
  blockId,
  onMeasured,
  children,
}: MeasuredBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const lastHeightRef = useRef<number>(0);

  // Stable callback ref to avoid re-creating observer
  const onMeasuredRef = useRef(onMeasured);
  onMeasuredRef.current = onMeasured;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Create ResizeObserver for this block
    observerRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Use borderBoxSize for accurate height including padding+border
        const height = entry.borderBoxSize?.[0]?.blockSize
          ?? entry.contentRect.height;

        // Only update if height actually changed (avoid infinite loops)
        if (Math.round(height) !== lastHeightRef.current) {
          lastHeightRef.current = Math.round(height);
          setMeasuredHeight(blockId, height);
          onMeasuredRef.current?.(blockId, Math.round(height));
        }
      }
    });

    observerRef.current.observe(el);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [blockId]);

  // When blockId changes, clean up old measurement
  useEffect(() => {
    return () => {
      // Don't remove measurement — it stays in cache for next render
      // Only disconnect observer (done in effect above)
    };
  }, [blockId]);

  return (
    <div
      ref={ref}
      data-measured-block={blockId}
      style={{ width: '100%', height: '100%', minHeight: '100%' }}
    >
      {children}
    </div>
  );
});

// ── Measurement Report Callback ────────────────────────────────

/**
 * Type for the callback that fires when a block is measured.
 * Used by SchemaScreenRenderer to trigger re-layout.
 */
export type MeasurementCallback = (blockId: string, height: number) => void;
