// ═══════════════════════════════════════════════════════════════
// MEMORY LEAK DETECTOR — Dev-only heap growth monitoring
// ═══════════════════════════════════════════════════════════════
// Periodically samples `performance.memory` (Chromium) to detect
// sustained heap growth. All functions are no-ops in production.
//
// Usage:
//   startMemoryTracking();          // begin sampling
//   const report = getMemoryReport(); // check status
//   const finalReport = stopMemoryTracking(); // stop & return
//
// Thresholds:
//   - >1 MB/min sustained growth → flagged as leaking
//   - Samples stored in circular buffer (max 720 = 1h at 5s)
// ═══════════════════════════════════════════════════════════════

const IS_DEV = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

// ── Types ──────────────────────────────────────────────────────

export interface MemorySample {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
}

export interface MemoryReport {
  /** Total heap growth in MB across the sampling period */
  heapGrowthMB: number;
  /** Number of samples collected */
  sampleCount: number;
  /** Whether a leak is detected (>1 MB/min sustained) */
  isLeaking: boolean;
  /** Growth rate in MB/min */
  growthRate: number;
  /** Current heap size in MB */
  currentHeapMB: number;
  /** Sampling duration in minutes */
  durationMinutes: number;
}

// ── Circular Buffer ────────────────────────────────────────────
// Fixed-size ring buffer that overwrites oldest samples when full.
// Max 720 samples × 5s interval = 1 hour of data.

const MAX_SAMPLES = 720;
const SAMPLE_INTERVAL_MS = 5000; // 5 seconds
const LEAK_THRESHOLD_MB_PER_MIN = 1; // >1 MB/min = leaking

let samples: MemorySample[] = [];
let samplingInterval: ReturnType<typeof setInterval> | null = null;
let trackingStartTime: number = 0;

// ── Chromium memory API ────────────────────────────────────────

interface ChromiumPerformance {
  memory?: {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
  };
}

function getChromiumMemory(): MemorySample | null {
  if (typeof performance === 'undefined') return null;
  const perf = performance as unknown as ChromiumPerformance;
  if (!perf.memory) return null;
  return {
    timestamp: Date.now(),
    usedJSHeapSize: perf.memory.usedJSHeapSize,
    totalJSHeapSize: perf.memory.totalJSHeapSize,
  };
}

// ── Core API ───────────────────────────────────────────────────

/**
 * Start periodic memory sampling (every 5s).
 * No-op in production or if already tracking.
 */
export function startMemoryTracking(): void {
  if (!IS_DEV) return;
  if (typeof window === 'undefined') return;
  if (samplingInterval) return; // Already tracking

  trackingStartTime = Date.now();
  samples = [];

  // Take initial sample immediately
  const initial = getChromiumMemory();
  if (initial) samples.push(initial);

  samplingInterval = setInterval(() => {
    const sample = getChromiumMemory();
    if (!sample) return;

    // Circular buffer: if full, discard oldest
    if (samples.length >= MAX_SAMPLES) {
      samples.shift();
    }
    samples.push(sample);
  }, SAMPLE_INTERVAL_MS);
}

/**
 * Stop sampling and return the final report.
 * No-op in production.
 */
export function stopMemoryTracking(): MemoryReport {
  if (!IS_DEV) {
    return { heapGrowthMB: 0, sampleCount: 0, isLeaking: false, growthRate: 0, currentHeapMB: 0, durationMinutes: 0 };
  }

  if (samplingInterval) {
    clearInterval(samplingInterval);
    samplingInterval = null;
  }

  const report = computeReport();
  samples = [];
  trackingStartTime = 0;
  return report;
}

/**
 * Get a memory report without stopping tracking.
 * Returns zeroed report in production.
 */
export function getMemoryReport(): MemoryReport {
  if (!IS_DEV) {
    return { heapGrowthMB: 0, sampleCount: 0, isLeaking: false, growthRate: 0, currentHeapMB: 0, durationMinutes: 0 };
  }
  return computeReport();
}

/**
 * Detect if a memory leak is occurring.
 * Compares heap size over the sampling period, flags if growing
 * faster than LEAK_THRESHOLD_MB_PER_MIN sustained.
 */
export function detectLeak(): { isLeaking: boolean; growthRate: number; confidence: 'low' | 'medium' | 'high' } {
  if (!IS_DEV || samples.length < 6) {
    return { isLeaking: false, growthRate: 0, confidence: 'low' };
  }

  const report = computeReport();

  // Confidence increases with more samples
  let confidence: 'low' | 'medium' | 'high' = 'low';
  if (samples.length >= 60) confidence = 'medium';  // 5 minutes
  if (samples.length >= 120) confidence = 'high';   // 10 minutes

  return {
    isLeaking: report.isLeaking,
    growthRate: report.growthRate,
    confidence,
  };
}

// ── Internal ───────────────────────────────────────────────────

function computeReport(): MemoryReport {
  if (samples.length < 2) {
    return {
      heapGrowthMB: 0,
      sampleCount: samples.length,
      isLeaking: false,
      growthRate: 0,
      currentHeapMB: samples.length > 0 ? samples[samples.length - 1]!.usedJSHeapSize / 1048576 : 0,
      durationMinutes: 0,
    };
  }

  const first = samples[0];
  const last = samples[samples.length - 1];
  const growthBytes = last!.usedJSHeapSize - first!.usedJSHeapSize;
  const growthMB = growthBytes / 1048576;

  const durationMs = last!.timestamp - first!.timestamp;
  const durationMinutes = durationMs / 60000;

  // Growth rate in MB/min (avoid division by zero)
  const growthRate = durationMinutes > 0 ? growthMB / durationMinutes : 0;

  // Use linear regression on last 30% of samples for sustained growth detection
  // This avoids false positives from initial allocation spikes
  const sustainedSliceStart = Math.floor(samples.length * 0.7);
  const sustainedSamples = samples.slice(sustainedSliceStart);
  let sustainedGrowthRate = 0;

  if (sustainedSamples.length >= 2) {
    const sFirst = sustainedSamples[0];
    const sLast = sustainedSamples[sustainedSamples.length - 1];
    const sGrowthMB = (sLast!.usedJSHeapSize - sFirst!.usedJSHeapSize) / 1048576;
    const sDurationMin = (sLast!.timestamp - sFirst!.timestamp) / 60000;
    sustainedGrowthRate = sDurationMin > 0 ? sGrowthMB / sDurationMin : 0;
  }

  return {
    heapGrowthMB: Math.round(growthMB * 100) / 100,
    sampleCount: samples.length,
    isLeaking: sustainedGrowthRate > LEAK_THRESHOLD_MB_PER_MIN,
    growthRate: Math.round(growthRate * 100) / 100,
    currentHeapMB: Math.round((last!.usedJSHeapSize / 1048576) * 100) / 100,
    durationMinutes: Math.round(durationMinutes * 100) / 100,
  };
}
