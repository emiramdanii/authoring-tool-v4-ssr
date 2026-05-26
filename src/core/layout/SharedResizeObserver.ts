// ═══════════════════════════════════════════════════════════════════
// SHARED RESIZE OBSERVER — Single observer for ALL block measurements
// ═══════════════════════════════════════════════════════════════════
// FASE 4: Render Performance Hardening
//
// Problem:
//   Each MeasuredBlock creates its own ResizeObserver instance.
//   For N blocks = N ResizeObservers = N browser observation entries.
//   This is expensive because:
//   - Each observer has its own internal callback queue
//   - Browser must track N separate observation relationships
//   - Each callback triggers a separate microtask
//   - No batching across observers
//
// Solution:
//   A single shared ResizeObserver that dispatches to per-block callbacks.
//   Browser tracks 1 observation → N elements instead of N observations.
//   Callbacks are batched by the browser in a single microtask.
//
// Performance Impact:
//   - 100 blocks: 100 ResizeObservers → 1 (99% reduction)
//   - 1000 blocks: 1000 ResizeObservers → 1 (99.9% reduction)
//   - Browser's internal observation tracking: O(N) → O(1)
//
// Usage:
//   import { sharedResizeObserver } from './SharedResizeObserver';
//   sharedResizeObserver.observe(element, blockId, callback);
//   sharedResizeObserver.unobserve(element, blockId);
// ═══════════════════════════════════════════════════════════════════

export type BlockMeasurementCallback = (blockId: string, height: number) => void;

interface ObserverEntry {
  element: HTMLElement;
  blockId: string;
  callback: BlockMeasurementCallback;
  lastHeight: number;
}

/**
 * SharedResizeObserver — a singleton that replaces per-block ResizeObserver instances.
 *
 * Design decisions:
 * 1. Singleton pattern — there's only ever one ResizeObserver for block measurements
 * 2. Registry-based dispatch — the single callback looks up the block by element
 * 3. Height change detection — only fires callback when height actually changes
 * 4. Throttling — built-in rAF throttling to prevent measurement storms
 */
class SharedResizeObserverImpl {
  private observer: ResizeObserver | null = null;
  private registry: Map<HTMLElement, ObserverEntry> = new Map();
  private pendingRaf: number | null = null;
  private pendingEntries: ResizeObserverEntry[] = [];

  constructor() {
    // Lazy init — ResizeObserver doesn't exist in SSR (Node.js)
    // The observer is created on first observe() call, not at module evaluation
  }

  /**
   * Get or create the ResizeObserver instance (lazy initialization).
   * This avoids SSR issues where ResizeObserver is not available.
   */
  private getObserver(): ResizeObserver {
    if (!this.observer) {
      this.observer = new ResizeObserver((entries) => {
        // Buffer entries — process in next animation frame for batching
        this.pendingEntries.push(...entries);

        if (this.pendingRaf === null) {
          this.pendingRaf = requestAnimationFrame(() => {
            this.flush();
          });
        }
      });
    }
    return this.observer;
  }

  /**
   * Observe an element for size changes.
   * When the element's height changes, the callback fires with the new height.
   */
  observe(element: HTMLElement, blockId: string, callback: BlockMeasurementCallback): void {
    // Clean up any existing observation for this element
    if (this.registry.has(element)) {
      this.unobserve(element, blockId);
    }

    const entry: ObserverEntry = {
      element,
      blockId,
      callback,
      lastHeight: 0,
    };

    this.registry.set(element, entry);
    this.getObserver().observe(element);
  }

  /**
   * Stop observing an element.
   */
  unobserve(element: HTMLElement, _blockId: string): void {
    this.registry.delete(element);
    this.observer?.unobserve(element);
  }

  /**
   * Process all buffered ResizeObserver entries.
   * Called once per animation frame via requestAnimationFrame.
   */
  private flush(): void {
    this.pendingRaf = null;
    const entries = this.pendingEntries;
    this.pendingEntries = [];

    for (const entry of entries) {
      const el = entry.target as HTMLElement;
      const regEntry = this.registry.get(el);
      if (!regEntry) continue;

      // Get height — prefer borderBoxSize for accuracy
      const height = entry.borderBoxSize?.[0]?.blockSize
        ?? entry.contentRect.height;

      // Skip zero-height measurements
      if (height <= 0) continue;

      // Only fire callback if height actually changed
      const roundedHeight = Math.round(height);
      if (roundedHeight !== regEntry.lastHeight) {
        regEntry.lastHeight = roundedHeight;
        regEntry.callback(regEntry.blockId, roundedHeight);
      }
    }
  }

  /**
   * Get the number of currently observed elements (for debugging).
   */
  get observedCount(): number {
    return this.registry.size;
  }

  /**
   * Disconnect all observations (for cleanup).
   */
  disconnect(): void {
    this.observer?.disconnect();
    this.registry.clear();
    if (this.pendingRaf !== null) {
      cancelAnimationFrame(this.pendingRaf);
      this.pendingRaf = null;
    }
    this.pendingEntries = [];
  }
}

/**
 * Singleton shared ResizeObserver instance.
 *
 * Import this and use it instead of creating new ResizeObserver instances.
 */
export const sharedResizeObserver = new SharedResizeObserverImpl();
