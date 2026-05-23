// ═══════════════════════════════════════════════════════════════════
// MEASUREMENT COMMIT QUEUE — Batch DOM measurements, commit once
// ═══════════════════════════════════════════════════════════════════
//
// PROBLEM:
//   Currently, each BlockMeasurer fires onMeasured independently.
//   If a page has 10 blocks, that's 10 separate setState(measurementVersion+1)
//   calls → 10 re-renders → 10 resolveSceneLayout() calls → LAYOUT JITTER.
//
//   The first render uses estimates. Then 10 ResizeObserver callbacks fire
//   within ~16ms of each other, but each triggers a separate React update.
//   This creates a "waterfall" of layout shifts.
//
// SOLUTION:
//   Collect all measurements in a queue. After a short debounce window
//   (when no new measurements arrive), commit ALL measurements at once
//   with a single setState. This means:
//     - 1 re-render instead of N re-renders
//     - Stable intermediate state (estimates) until commit
//     - Deterministic: commit only when DOM is settled
//
// ARCHITECTURE:
//   BlockMeasurer.onMeasured → queue.add(blockId, height)
//                                     ↓
//                              debounce timer (16ms)
//                                     ↓
//                              onCommit(measurements)
//                                     ↓
//                              SchemaScreenRenderer: setMeasurementVersion(+1)
//
// ═══════════════════════════════════════════════════════════════════

import { setMeasuredHeight } from './BlockMeasurer';

// ── Types ──────────────────────────────────────────────────────

/** A single measurement report from ResizeObserver */
export interface MeasurementEntry {
  blockId: string;
  height: number;
}

/** Callback fired when measurements are committed (after debounce) */
export type MeasurementCommitCallback = (measurements: MeasurementEntry[]) => void;

// ── Configuration ──────────────────────────────────────────────

/** Time to wait after last measurement before committing (ms) */
const COMMIT_DEBOUNCE_MS = 32; // ~2 frames at 60fps — enough for batch

/** Maximum time to wait before forcing a commit (ms) */
const MAX_COMMIT_DELAY_MS = 200; // Safety valve — don't wait forever

// ── Measurement Commit Queue ───────────────────────────────────

/**
 * MeasurementCommitQueue — batches DOM measurements and commits them
 * as a single React state update.
 *
 * Usage:
 *   const queue = new MeasurementCommitQueue((measurements) => {
 *     // This fires once per commit, NOT per measurement
 *     setMeasurementVersion(v => v + 1);
 *   });
 *
 *   // Each block reports its height via the queue
 *   queue.add('block-1', 245);
 *   queue.add('block-2', 180);
 *   // ... after 32ms with no new measurements:
 *   // onCommit fires with [{blockId:'block-1',height:245},{blockId:'block-2',height:180}]
 *
 * IMPORTANT:
 *   - The queue does NOT call setMeasuredHeight() — that's done by
 *     BlockMeasurer directly (for synchronous cache reads).
 *   - The queue only controls WHEN the React re-render happens.
 *   - This means the cache is always up-to-date, but the layout
 *     engine only re-runs on commit.
 */
export class MeasurementCommitQueue {
  private pending: MeasurementEntry[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private maxDelayTimer: ReturnType<typeof setTimeout> | null = null;
  private onCommit: MeasurementCommitCallback;
  private isActive: boolean = true;

  constructor(onCommit: MeasurementCommitCallback) {
    this.onCommit = onCommit;
  }

  /**
   * Add a measurement to the queue.
   * This is called by BlockMeasurer's onMeasured callback.
   *
   * The measurement is stored in the cache immediately (by BlockMeasurer),
   * but the React re-render is deferred until commit.
   */
  add(blockId: string, height: number): void {
    if (!this.isActive) return;

    // Update cache immediately for synchronous reads
    setMeasuredHeight(blockId, height);

    // Add to pending batch
    // If this blockId was already pending, update it (latest measurement wins)
    const existing = this.pending.findIndex(m => m.blockId === blockId);
    if (existing >= 0) {
      this.pending[existing]!.height = height;
    } else {
      this.pending.push({ blockId, height });
    }

    // Reset debounce timer — wait for measurements to settle
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => this.commit(), COMMIT_DEBOUNCE_MS);

    // Start max-delay timer if not already running (safety valve)
    if (this.maxDelayTimer === null) {
      this.maxDelayTimer = setTimeout(() => this.commit(), MAX_COMMIT_DELAY_MS);
    }
  }

  /**
   * Force-commit all pending measurements immediately.
   * Useful when switching pages or before export.
   */
  commit(): void {
    if (this.pending.length === 0) return;

    // Take ownership of pending measurements
    const measurements = this.pending;
    this.pending = [];

    // Clear timers
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.maxDelayTimer !== null) {
      clearTimeout(this.maxDelayTimer);
      this.maxDelayTimer = null;
    }

    // Fire commit callback with batch
    this.onCommit(measurements);
  }

  /**
   * Flush any pending measurements synchronously.
   * Call this before operations that need accurate layout (e.g., export).
   */
  flush(): void {
    this.commit();
  }

  /**
   * Disable the queue — no more measurements will be accepted.
   * Call this when the component unmounts.
   */
  dispose(): void {
    this.isActive = false;
    this.commit(); // Flush any remaining measurements
  }

  /**
   * Re-enable the queue after dispose (e.g., when component remounts).
   */
  reactivate(): void {
    this.isActive = true;
  }

  /**
   * Get the number of pending measurements (for debugging).
   */
  get pendingCount(): number {
    return this.pending.length;
  }
}

// ── Singleton Factory ──────────────────────────────────────────

/**
 * Create a MeasurementCommitQueue bound to a setState callback.
 *
 * Usage in SchemaScreenRenderer:
 *   const commitQueue = useMemo(
 *     () => createMeasurementQueue((measurements) => {
 *       setMeasurementVersion(v => v + 1);
 *     }),
 *     []
 *   );
 *
 *   // In MeasuredBlock's onMeasured:
 *   commitQueue.add(blockId, height);
 *
 *   // On unmount:
 *   commitQueue.dispose();
 */
export function createMeasurementQueue(
  onCommit: MeasurementCommitCallback
): MeasurementCommitQueue {
  return new MeasurementCommitQueue(onCommit);
}
