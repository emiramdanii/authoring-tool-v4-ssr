// ═══════════════════════════════════════════════════════════════════
// THROTTLED RESIZE OBSERVER — FASE 4 Render Performance Hardening
// ═══════════════════════════════════════════════════════════════════
// Problem:
//   Raw ResizeObserver fires ~60 times/sec during window resize,
//   each callback triggers setState → re-render → layout recalc.
//   On Stage, PresentMode, PlayOverlay, PreviewMode — this causes
//   frame drops and jank.
//
// Solution:
//   Throttle ResizeObserver callbacks to fire at most once per
//   animation frame (16ms). This matches the browser's paint cycle,
//   so there's zero visual difference but ~4x fewer re-renders.
//
// Usage:
//   const observer = createThrottledResizeObserver(() => {
//     setScale(computeSceneScale(...));
//   });
//   observer.observe(element);
//   // Later:
//   observer.disconnect();
// ═══════════════════════════════════════════════════════════════════

export interface ThrottledResizeObserver extends ResizeObserver {
  /** Same as ResizeObserver.observe() */
  observe(target: Element, options?: ResizeObserverOptions): void;
  /** Same as ResizeObserver.unobserve() */
  unobserve(target: Element): void;
  /** Same as ResizeObserver.disconnect() */
  disconnect(): void;
}

/**
 * Create a ResizeObserver that throttles callbacks to once per animation frame.
 *
 * During resize, the browser fires ResizeObserver callbacks many times per frame.
 * Each callback that calls setState() causes a React re-render. By throttling
 * to requestAnimationFrame, we ensure at most ONE setState per paint cycle.
 *
 * This is the correct approach because:
 * 1. The browser only paints once per frame anyway
 * 2. Intermediate sizes are never visible to the user
 * 3. We skip all but the latest size in each frame
 * 4. Zero visual difference, significant performance improvement
 */
export function createThrottledResizeObserver(
  callback: () => void,
): ThrottledResizeObserver {
  let rafId: number | null = null;

  const throttledCallback = () => {
    // If we already have a pending frame, skip — the latest size
    // will be picked up when the frame fires
    if (rafId !== null) return;

    rafId = requestAnimationFrame(() => {
      rafId = null;
      callback();
    });
  };

  const observer = new ResizeObserver(throttledCallback);

  return observer as ThrottledResizeObserver;
}

/**
 * Create a ResizeObserver with debounce instead of throttle.
 *
 * Use this when you want to wait until resize STOPS before reacting,
 * rather than reacting on every frame during resize.
 *
 * Good for: expensive layout recalculations that shouldn't run
 * during active resize (e.g., layout engine recomputation).
 */
export function createDebouncedResizeObserver(
  callback: () => void,
  delayMs: number = 100,
): ThrottledResizeObserver {
  let timerId: ReturnType<typeof setTimeout> | null = null;

  const debouncedCallback = () => {
    if (timerId !== null) clearTimeout(timerId);
    timerId = setTimeout(() => {
      timerId = null;
      callback();
    }, delayMs);
  };

  const observer = new ResizeObserver(debouncedCallback);

  return observer as ThrottledResizeObserver;
}
