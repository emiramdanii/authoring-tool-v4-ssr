'use client';

// ═══════════════════════════════════════════════════════════════
// PERFORMANCE MONITOR — Dev-only floating performance panel
// ═══════════════════════════════════════════════════════════════
// Shows render times, render counts, memory usage, and FPS.
// Only renders in development mode. Toggleable floating panel.
// Uses React.Profiler data collected via the performance utility.
//
// [G.4] Enhanced with Memory Dashboard tab showing:
//   - Current heap size
//   - Heap growth rate (MB/min)
//   - Subscription count (from SubscriptionManager)
//   - History queue size (from getHistorySize)
//   - Schema tree size (from estimateSchemaSize)
//   - Leak detection status (🟢 healthy / 🟡 growing / 🔴 leaking)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react';
import { Profiler } from 'react';
import { isEnabled } from '@/config/feature-flags';
import {
  initPerfCollector,
  getMemoryUsage,
  createProfilerCallback,
  SLOW_RENDER_MS,
  CRITICAL_RENDER_MS,
  type RenderEntry,
  type PerfCollector,
} from '@/lib/performance';
import { getMemoryReport, detectLeak } from '@/lib/memory-leak-detector';
import { subscriptionManager } from '@/store/canva/subscription-manager';
import { getHistorySize } from '@/store/canva/history-slice';
import { estimateSchemaSize, getSchemaStats } from '@/core/schema/schema-gc';
import { useCanvaStore } from '@/store/canva-store';
import { Activity, Cpu, HardDrive, X, ChevronUp, ChevronDown, RotateCcw, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
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
    return () => cancelAnimationFrame(rafId); // [G.4] Fixed: cleanup for requestAnimationFrame
  }, []);

  return fps;
}

// ═══════════════════════════════════════════════════════════════
// [G.4] Memory Dashboard Data Hook
// ═══════════════════════════════════════════════════════════════

interface MemoryDashboardData {
  currentHeapMB: number;
  growthRate: number;
  isLeaking: boolean;
  leakConfidence: 'low' | 'medium' | 'high';
  subscriptionCount: number;
  activeSubscriptions: string[];
  historySizeMB: number;
  historyEntryCount: number;
  schemaSizeKB: number;
  schemaBlockCount: number;
  schemaMaxDepth: number;
  leakStatus: 'healthy' | 'growing' | 'leaking';
}

function useMemoryDashboard(): MemoryDashboardData {
  const [data, setData] = useState<MemoryDashboardData>({
    currentHeapMB: 0,
    growthRate: 0,
    isLeaking: false,
    leakConfidence: 'low',
    subscriptionCount: 0,
    activeSubscriptions: [],
    historySizeMB: 0,
    historyEntryCount: 0,
    schemaSizeKB: 0,
    schemaBlockCount: 0,
    schemaMaxDepth: 0,
    leakStatus: 'healthy',
  });

  useEffect(() => {
    const interval = setInterval(() => {
      // Memory report from leak detector
      const memReport = getMemoryReport();
      const leakInfo = detectLeak();

      // Subscription count
      const subCount = subscriptionManager.getSubscriptionCount();
      const activeSubs = subscriptionManager.getActiveSubscriptions();

      // History queue size
      const history = useCanvaStore.getState()._history;
      const historyBytes = getHistorySize(history);
      const historyMB = historyBytes / 1048576;

      // Schema tree size (current page)
      const currentPage = useCanvaStore.getState().currentPage();
      let schemaSizeKB = 0;
      let schemaBlockCount = 0;
      let schemaMaxDepth = 0;
      if (currentPage?.schema) {
        const stats = getSchemaStats(currentPage.schema);
        schemaSizeKB = stats.totalBytes / 1024;
        schemaBlockCount = stats.blockCount;
        schemaMaxDepth = stats.maxDepth;
      }

      // Determine leak status
      let leakStatus: 'healthy' | 'growing' | 'leaking' = 'healthy';
      if (leakInfo.isLeaking) {
        leakStatus = 'leaking';
      } else if (memReport.growthRate > 0.5) {
        leakStatus = 'growing';
      }

      setData({
        currentHeapMB: memReport.currentHeapMB,
        growthRate: memReport.growthRate,
        isLeaking: leakInfo.isLeaking,
        leakConfidence: leakInfo.confidence,
        subscriptionCount: subCount,
        activeSubscriptions: activeSubs,
        historySizeMB: Math.round(historyMB * 100) / 100,
        historyEntryCount: history.length,
        schemaSizeKB: Math.round(schemaSizeKB * 100) / 100,
        schemaBlockCount,
        schemaMaxDepth,
        leakStatus,
      });
    }, 2000); // Update every 2s

    return () => clearInterval(interval); // [G.4] Fixed: cleanup for setInterval
  }, []);

  return data;
}

// ═══════════════════════════════════════════════════════════════
// PERFORMANCE MONITOR PANEL
// ═══════════════════════════════════════════════════════════════

function PerformancePanel() {
  const fps = useFPS();
  const memData = useMemoryDashboard();
  const [collector, setCollector] = useState<PerfCollector | null>(() => initPerfCollector());
  const [slowRenders, setSlowRenders] = useState<RenderEntry[]>([]);
  const [renderCounts, setRenderCounts] = useState<Record<string, number>>({});
  const [memory, setMemory] = useState<ReturnType<typeof getMemoryUsage>>({ available: false });
  const [expanded, setExpanded] = useState(true);
  const [tab, setTab] = useState<'renders' | 'counts' | 'memory'>('renders');

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

  // Leak status icon + color
  const leakStatusConfig = {
    healthy: { icon: <CheckCircle2 size={10} className="text-emerald-400" />, label: 'Healthy', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    growing: { icon: <AlertTriangle size={10} className="text-amber-400" />, label: 'Growing', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    leaking: { icon: <ShieldAlert size={10} className="text-red-400" />, label: 'Leaking!', color: 'text-red-400', bg: 'bg-red-500/10' },
  };
  const leakConfig = leakStatusConfig[memData.leakStatus];

  return (
    <div
      className="fixed bottom-3 right-3 z-[200] w-[320px] rounded-xl border border-app-border bg-app-surface/95 backdrop-blur-md shadow-2xl text-app-primary overflow-hidden select-none"
      role="complementary"
      aria-label="Performance Monitor"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-app-border/30 bg-app-elevated/50">
        <div className="flex items-center gap-2">
          <Activity size={12} className="text-emerald-400" />
          <span className="text-[10px] font-bold text-app-primary">Performance</span>
          <span className={`text-[10px] font-mono font-bold ${fpsColor}`}>{fps} FPS</span>
          {/* [G.4] Leak status badge */}
          <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${leakConfig.bg} border border-current/10`}>
            {leakConfig.icon}
            <span className={`text-[8px] font-bold ${leakConfig.color}`}>{leakConfig.label}</span>
          </div>
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
          <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
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
              <div className="p-2 space-y-2">
                {/* [G.4] Leak Detection Status */}
                <div className={`px-2 py-2 rounded-lg ${leakConfig.bg} border border-current/10`}>
                  <div className="flex items-center gap-2">
                    {leakConfig.icon}
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold ${leakConfig.color}`}>
                          {leakConfig.label}
                        </span>
                        {memData.leakConfidence !== 'low' && (
                          <span className="text-[7px] text-app-muted">
                            (confidence: {memData.leakConfidence})
                          </span>
                        )}
                      </div>
                      <div className="text-[8px] text-app-muted mt-0.5">
                        Growth rate: {memData.growthRate} MB/min
                      </div>
                    </div>
                  </div>
                </div>

                {/* JS Heap */}
                {memory.available ? (
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-app-elevated/40 border border-app-border/20">
                    <HardDrive size={12} className="text-app-muted" />
                    <div className="flex-1">
                      <div className="text-[9px] font-bold text-app-primary">JS Heap</div>
                      <div className="text-[8px] text-app-muted">
                        {memory.usedMB} MB / {memory.totalMB} MB
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-app-elevated/40 border border-app-border/20">
                    <HardDrive size={12} className="text-app-muted/40" />
                    <div className="flex-1">
                      <div className="text-[9px] font-bold text-app-muted">JS Heap</div>
                      <div className="text-[8px] text-app-muted/60">API not available (use Chromium)</div>
                    </div>
                  </div>
                )}

                {/* Usage bar */}
                {memory.available && (
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
                )}

                {/* [G.4] G.4 Metrics Grid */}
                <div className="grid grid-cols-2 gap-1.5 px-2">
                  {/* Subscriptions */}
                  <div className="px-2 py-1.5 rounded-lg bg-app-elevated/40 border border-app-border/20">
                    <div className="text-[8px] text-app-muted uppercase tracking-wider">Subscriptions</div>
                    <div className={`text-[12px] font-mono font-bold ${
                      memData.subscriptionCount > 10 ? 'text-amber-400' : 'text-app-primary'
                    }`}>
                      {memData.subscriptionCount}
                    </div>
                  </div>

                  {/* History Queue */}
                  <div className="px-2 py-1.5 rounded-lg bg-app-elevated/40 border border-app-border/20">
                    <div className="text-[8px] text-app-muted uppercase tracking-wider">History</div>
                    <div className={`text-[12px] font-mono font-bold ${
                      memData.historySizeMB > 3 ? 'text-amber-400' : 'text-app-primary'
                    }`}>
                      {memData.historySizeMB}MB
                    </div>
                    <div className="text-[7px] text-app-muted">
                      {memData.historyEntryCount} entries
                    </div>
                  </div>

                  {/* Schema Tree */}
                  <div className="px-2 py-1.5 rounded-lg bg-app-elevated/40 border border-app-border/20">
                    <div className="text-[8px] text-app-muted uppercase tracking-wider">Schema</div>
                    <div className={`text-[12px] font-mono font-bold ${
                      memData.schemaSizeKB > 500 ? 'text-amber-400' : 'text-app-primary'
                    }`}>
                      {memData.schemaSizeKB}KB
                    </div>
                    <div className="text-[7px] text-app-muted">
                      {memData.schemaBlockCount} blocks · depth {memData.schemaMaxDepth}
                    </div>
                  </div>

                  {/* Heap Limit */}
                  <div className="px-2 py-1.5 rounded-lg bg-app-elevated/40 border border-app-border/20">
                    <div className="text-[8px] text-app-muted uppercase tracking-wider">Heap Limit</div>
                    <div className="text-[12px] font-mono font-bold text-app-primary">
                      {memory.available ? ((memory.jsHeapSizeLimit || 0) / 1048576).toFixed(0) : '—'}MB
                    </div>
                  </div>
                </div>

                {/* [G.4] Active Subscriptions List (expandable) */}
                {memData.activeSubscriptions.length > 0 && (
                  <div className="px-2">
                    <div className="text-[8px] text-app-muted uppercase tracking-wider mb-1">Active Subscriptions</div>
                    <div className="max-h-16 overflow-y-auto custom-scrollbar">
                      {memData.activeSubscriptions.map(key => (
                        <div key={key} className="text-[8px] font-mono text-app-secondary py-0.5">
                          • {key}
                        </div>
                      ))}
                    </div>
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
  if (!IS_DEV || !isEnabled('performanceMonitor')) return null;
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
