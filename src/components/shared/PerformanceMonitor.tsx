'use client';

// ═══════════════════════════════════════════════════════════════
// PERFORMANCE MONITOR — Dev-only floating performance panel
// ═══════════════════════════════════════════════════════════════
// Shows render times, render counts, memory usage, and FPS.
// Only renders in development mode. Toggleable floating panel.
// Uses React.Profiler data collected via the performance utility.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react';
import { Profiler } from 'react';
import {
  initPerfCollector,
  getMemoryUsage,
  createProfilerCallback,
  SLOW_RENDER_MS,
  CRITICAL_RENDER_MS,
  type RenderEntry,
  type PerfCollector,
} from '@/lib/performance';
import { Activity, Cpu, HardDrive, X, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Skip in production ─────────────────────────────────────────
const IS_DEV = process.env.NODE_ENV === 'development';

// ═══════════════════════════════════════════════════════════════
// FPS Counter Hook
// ═══════════════════════════════════════════════════════════════

function useFPS(): number {
  const fpsRef = useRef(60);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const [fps, setFps] = useState(60);

  useEffect(() => {
    let rafId: number;

    const tick = (now: number) => {
      frameCountRef.current++;
      const elapsed = now - lastTimeRef.current;
      if (elapsed >= 1000) {
        fpsRef.current = Math.round((frameCountRef.current * 1000) / elapsed);
        setFps(fpsRef.current);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return fps;
}

// ═══════════════════════════════════════════════════════════════
// PERFORMANCE MONITOR PANEL
// ═══════════════════════════════════════════════════════════════

function PerformancePanel() {
  const fps = useFPS();
  const [collector, setCollector] = useState<PerfCollector | null>(null);
  const [slowRenders, setSlowRenders] = useState<RenderEntry[]>([]);
  const [renderCounts, setRenderCounts] = useState<Record<string, number>>({});
  const [memory, setMemory] = useState<ReturnType<typeof getMemoryUsage>>({ available: false });
  const [expanded, setExpanded] = useState(true);
  const [tab, setTab] = useState<'renders' | 'counts' | 'memory'>('renders');

  // Initialize collector
  useEffect(() => {
    const c = initPerfCollector();
    setCollector(c);
  }, []);

  // Poll for updates every 1s
  useEffect(() => {
    if (!collector) return;
    const interval = setInterval(() => {
      setSlowRenders(collector.getSlowRenders());
      setRenderCounts(collector.getRenderCounts());
      setMemory(getMemoryUsage());
    }, 1000);
    return () => clearInterval(interval);
  }, [collector]);

  const handleClear = useCallback(() => {
    collector?.clear();
    setSlowRenders([]);
    setRenderCounts({});
  }, [collector]);

  // FPS color
  const fpsColor = fps >= 55 ? 'text-emerald-400' : fps >= 30 ? 'text-amber-400' : 'text-red-400';

  // Sort render counts descending
  const sortedCounts = Object.entries(renderCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div
      className="fixed bottom-3 right-3 z-[200] w-[280px] rounded-xl border border-app-border bg-app-surface/95 backdrop-blur-md shadow-2xl text-app-primary overflow-hidden select-none"
      role="complementary"
      aria-label="Performance Monitor"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-app-border/30 bg-app-elevated/50">
        <div className="flex items-center gap-2">
          <Activity size={12} className="text-emerald-400" />
          <span className="text-[10px] font-bold text-app-primary">Performance</span>
          <span className={`text-[10px] font-mono font-bold ${fpsColor}`}>{fps} FPS</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleClear}
            className="p-1 rounded hover:bg-app-elevated/60 text-app-muted hover:text-app-secondary transition-colors"
            title="Clear data"
          >
            <RotateCcw size={10} />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded hover:bg-app-elevated/60 text-app-muted hover:text-app-secondary transition-colors"
          >
            {expanded ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
          </button>
        </div>
      </div>

      {expanded && (
        <>
          {/* Tab bar */}
          <div className="flex border-b border-app-border/20">
            {(['renders', 'counts', 'memory'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-1.5 text-[8px] font-bold uppercase tracking-wider transition-colors ${
                  tab === t
                    ? 'text-app-accent border-b-2 border-app-accent bg-app-accent/5'
                    : 'text-app-muted hover:text-app-secondary'
                }`}
              >
                {t === 'renders' ? 'Slow Renders' : t === 'counts' ? 'Render Counts' : 'Memory'}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="max-h-[240px] overflow-y-auto custom-scrollbar">
            {tab === 'renders' && (
              <div className="p-2">
                {slowRenders.length === 0 ? (
                  <div className="text-center py-4">
                    <Cpu size={16} className="mx-auto text-app-muted/40 mb-1" />
                    <p className="text-[9px] text-app-muted">No slow renders detected</p>
                    <p className="text-[8px] text-app-muted/60">Renders &gt; {SLOW_RENDER_MS}ms will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {slowRenders.slice(0, 20).map((r, i) => (
                      <div
                        key={`${r.componentName}-${r.timestamp}-${i}`}
                        className={`px-2 py-1.5 rounded-lg border text-[9px] ${
                          r.actualDuration > CRITICAL_RENDER_MS
                            ? 'bg-red-500/10 border-red-500/20'
                            : 'bg-amber-500/10 border-amber-500/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold truncate max-w-[140px]">{r.componentName}</span>
                          <span className={`font-mono font-bold ${
                            r.actualDuration > CRITICAL_RENDER_MS ? 'text-red-400' : 'text-amber-400'
                          }`}>
                            {r.actualDuration.toFixed(1)}ms
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[8px] text-app-muted mt-0.5">
                          <span>{r.phase} • base: {r.baseDuration.toFixed(1)}ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'counts' && (
              <div className="p-2">
                {sortedCounts.length === 0 ? (
                  <div className="text-center py-4">
                    <Activity size={16} className="mx-auto text-app-muted/40 mb-1" />
                    <p className="text-[9px] text-app-muted">No render data yet</p>
                    <p className="text-[8px] text-app-muted/60">Interact with the app to collect data</p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {sortedCounts.map(([name, count]) => (
                      <div
                        key={name}
                        className="flex items-center justify-between px-2 py-1 rounded text-[9px] hover:bg-app-elevated/40"
                      >
                        <span className="truncate max-w-[160px] text-app-secondary">{name}</span>
                        <span className={`font-mono font-bold ${
                          count > 20 ? 'text-red-400' : count > 10 ? 'text-amber-400' : 'text-app-muted'
                        }`}>
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'memory' && (
              <div className="p-2">
                {memory.available ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-app-elevated/40 border border-app-border/20">
                      <HardDrive size={12} className="text-app-muted" />
                      <div className="flex-1">
                        <div className="text-[9px] font-bold text-app-primary">JS Heap</div>
                        <div className="text-[8px] text-app-muted">
                          {memory.usedMB} MB / {memory.totalMB} MB
                        </div>
                      </div>
                    </div>
                    {/* Usage bar */}
                    <div className="px-2">
                      <div className="h-2 rounded-full bg-app-elevated overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, ((Number(memory.usedMB) || 0) / (Number(memory.totalMB) || 1)) * 100)}%`,
                            background: (Number(memory.usedMB) || 0) / (Number(memory.totalMB) || 1) > 0.8
                              ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                              : 'linear-gradient(90deg, #34d399, #06b6d4)',
                          }}
                        />
                      </div>
                      <div className="text-[7px] text-app-muted mt-0.5 text-right">
                        {((Number(memory.usedMB) || 0) / (Number(memory.totalMB) || 1) * 100).toFixed(0)}% used
                      </div>
                    </div>
                    <div className="text-[8px] text-app-muted px-2">
                      Limit: {((memory.jsHeapSizeLimit || 0) / 1048576).toFixed(0)} MB
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <HardDrive size={16} className="mx-auto text-app-muted/40 mb-1" />
                    <p className="text-[9px] text-app-muted">Memory API not available</p>
                    <p className="text-[8px] text-app-muted/60">Use Chromium-based browser for memory stats</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer with FPS badge */}
          <div className="px-3 py-1.5 border-t border-app-border/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[8px] text-app-muted">
              <span>Threshold: {SLOW_RENDER_MS}ms / {CRITICAL_RENDER_MS}ms</span>
            </div>
            <div className={`text-[9px] font-bold font-mono ${fpsColor}`}>
              {fps} fps
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT — Conditional wrapper
// ═══════════════════════════════════════════════════════════════

/**
 * PerformanceMonitor renders a floating performance panel in dev mode.
 * In production, it renders nothing.
 *
 * Usage: Just add `<PerformanceMonitor />` at the top level of your app.
 */
export default function PerformanceMonitor() {
  if (!IS_DEV) return null;
  return <PerformancePanel />;
}

/**
 * ProfilerWrapper wraps children with React.Profiler in dev mode.
 * In production, it renders children directly (no profiler overhead).
 */
export function ProfilerWrapper({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  if (!IS_DEV) return <>{children}</>;

  return (
    <Profiler id={id} onRender={createProfilerCallback(id)}>
      {children}
    </Profiler>
  );
}
