'use client';

// ═══════════════════════════════════════════════════════════════
// HISTORY PANEL — Edit history timeline with time-travel
// ═══════════════════════════════════════════════════════════════
// Visual timeline of all PatchHistory entries.
// Click any entry to time-travel (jump) to that state.
// Current position shown with cursor marker.
// Past entries = normal, Current = highlighted, Future = dimmed.

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { patchHistory } from '@/core/editor/patch-history';
import type { PatchHistoryEntry, PatchHistoryState } from '@/core/editor/patch-history';
// All icons migrated to Material Symbols Outlined

// ── Relative time formatter ─────────────────────────────────────
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 5000) return 'baru saja';
  if (diff < 60000) return `${Math.floor(diff / 1000)}d lalu`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m lalu`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}j lalu`;
  return new Date(timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

// ── Source icon mapping ─────────────────────────────────────────
function SourceBadge({ source }: { source?: string }) {
  if (!source || source === 'user') return <span className="material-symbols-outlined text-blue-400" style={{ fontSize: '9px' }}>person</span>;
  if (source === 'ai') return <span className="material-symbols-outlined text-purple-400" style={{ fontSize: '9px' }}>smart_toy</span>;
  if (source === 'sync') return <span className="material-symbols-outlined text-green-400" style={{ fontSize: '9px' }}>sync</span>;
  if (source === 'auto') return <span className="material-symbols-outlined text-amber-400" style={{ fontSize: '9px' }}>auto_awesome</span>;
  return <span className="material-symbols-outlined text-blue-400" style={{ fontSize: '9px' }}>person</span>;
}

// ── Parse description for display ───────────────────────────────
function parseDescription(entry: PatchHistoryEntry): { blockType: string; blockId: string } {
  const desc = entry.description ?? '';
  const dotIdx = desc.indexOf('.');
  if (dotIdx > 0) {
    return { blockType: desc.slice(0, dotIdx), blockId: desc.slice(dotIdx + 1) };
  }
  return { blockType: desc, blockId: '' };
}

export default function HistoryPanel() {
  const undo = useCanvaStore(s => s.undo);
  const redo = useCanvaStore(s => s.redo);
  const timeTravel = useCanvaStore(s => s.timeTravel);

  // Reactive state from PatchHistory
  const [historyState, setHistoryState] = useState<PatchHistoryState>(() => patchHistory.getState());
  const [entries, setEntries] = useState<PatchHistoryEntry[]>(() => patchHistory.getAllEntries());

  useEffect(() => {
    return patchHistory.subscribe(() => {
      setHistoryState(patchHistory.getState());
      setEntries(patchHistory.getAllEntries());
    });
  }, []);

  // Refresh every 10s to update relative timestamps
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  const canUndo = useCanvaStore(s => s._historyIdx > 0) || historyState.canUndo;
  const canRedo = useCanvaStore(s => s._historyIdx < s._history.length - 1) || historyState.canRedo;

  const currentIndex = historyState.currentIndex;

  // Handle time-travel click
  const handleJumpTo = useCallback((targetIndex: number) => {
    if (targetIndex === currentIndex) return;
    timeTravel(targetIndex);
  }, [currentIndex, timeTravel]);

  // Auto-scroll to current entry
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [currentIndex]);

  // No entries
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-app-elevated flex items-center justify-center mb-3">
          <span className="material-symbols-outlined text-app-muted" style={{ fontSize: '20px' }}>history</span>
        </div>
        <div className="text-[11px] font-bold text-app-secondary mb-1">Belum Ada Riwayat</div>
        <div className="text-[9px] text-app-muted leading-relaxed">
          Riwayat edit akan muncul di sini.<br />
          Setiap perubahan pada block akan tercatat.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[9px] font-bold text-app-secondary uppercase tracking-wider flex items-center gap-1.5">
          <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>history</span>
          Riwayat Edit
          <span className="text-app-muted">({entries.length})</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`p-1 rounded hover:bg-app-elevated/50 transition-colors ${!canUndo ? 'opacity-30 cursor-not-allowed' : 'text-app-secondary'}`}
            title="Undo (Ctrl+Z)"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>undo</span>
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className={`p-1 rounded hover:bg-app-elevated/50 transition-colors ${!canRedo ? 'opacity-30 cursor-not-allowed' : 'text-app-secondary'}`}
            title="Redo (Ctrl+Y)"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>redo</span>
          </button>
        </div>
      </div>

      {/* Info bar */}
      <div className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded-lg bg-app-elevated/40 border border-app-border/10">
        <span className="material-symbols-outlined text-app-muted" style={{ fontSize: '10px' }}>schedule</span>
        <span className="text-[8px] text-app-muted">
          Posisi: {currentIndex + 1}/{entries.length} · Klik untuk time-travel
        </span>
      </div>

      {/* Timeline */}
      <div ref={listRef} className="flex-1 overflow-y-auto custom-scrollbar space-y-0">
        {entries.map((entry, i) => {
          const isCurrent = i === currentIndex;
          const isPast = i < currentIndex;
          const isFuture = i > currentIndex;
          const { blockType, blockId } = parseDescription(entry);

          return (
            <div key={`hist-${i}-${entry.timestamp}`}>
              <button
                onClick={() => handleJumpTo(i)}
                data-active={isCurrent}
                className={`w-full text-left flex items-start gap-2.5 px-2 py-2 rounded-lg transition-[background-color,border-color] group ${
                  isCurrent
                    ? 'bg-blue-500/15 border border-blue-500/30 ring-1 ring-blue-400/20'
                    : isFuture
                      ? 'opacity-40 border border-transparent hover:opacity-70 hover:bg-app-elevated/30'
                      : 'border border-transparent hover:bg-app-elevated/40'
                }`}
                title={isCurrent ? 'Posisi saat ini' : isFuture ? 'Redo ke titik ini' : 'Undo ke titik ini'}
              >
                {/* Timeline dot + connector */}
                <div className="flex flex-col items-center flex-shrink-0 mt-0.5">
                  <div
                    className={`rounded-full transition-[background-color,transform] ${
                      isCurrent
                        ? 'w-3 h-3 bg-blue-400 shadow-md shadow-blue-500/40'
                        : isFuture
                          ? 'w-2.5 h-2.5 bg-app-muted/30 border border-app-border/30'
                          : 'w-2.5 h-2.5 bg-app-accent/50'
                    }`}
                  />
                  {i < entries.length - 1 && (
                    <div className={`w-0.5 h-4 mt-0.5 ${
                      i < currentIndex ? 'bg-app-accent/20' : 'bg-app-border/15'
                    }`} />
                  )}
                </div>

                {/* Entry content */}
                <div className="flex-1 min-w-0">
                  {/* Top row: blockType + source + time */}
                  <div className="flex items-center gap-1.5">
                    <SourceBadge source={entry.source} />
                    <span className={`text-[10px] font-bold truncate ${
                      isCurrent ? 'text-blue-300' : 'text-app-secondary'
                    }`}>
                      {blockType || 'Edit'}
                    </span>
                    <span className="ml-auto text-[8px] text-app-muted flex-shrink-0" key={tick}>
                      {formatRelativeTime(entry.timestamp)}
                    </span>
                  </div>

                  {/* Bottom row: blockId or description */}
                  <div className={`text-[8px] mt-0.5 truncate ${
                    isCurrent ? 'text-blue-400/60' : 'text-app-muted'
                  }`}>
                    {blockId ? (
                      <span className="font-mono">{blockId.slice(0, 12)}{blockId.length > 12 ? '…' : ''}</span>
                    ) : entry.description ? (
                      <span>{entry.description}</span>
                    ) : (
                      <span>Patch #{i + 1}</span>
                    )}
                  </div>

                  {/* Current indicator */}
                  {isCurrent && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      <span className="text-[7px] font-bold text-blue-400">SAAT INI</span>
                    </div>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="mt-3 pt-2 border-t border-app-border/15">
        <div className="text-[8px] text-app-muted leading-relaxed">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-1 align-middle" /> Saat ini
          <span className="mx-1.5">·</span>
          <span className="inline-block w-2 h-2 rounded-full bg-app-accent/50 mr-1 align-middle" /> Terapkan
          <span className="mx-1.5">·</span>
          <span className="inline-block w-2 h-2 rounded-full bg-app-muted/30 border border-app-border/30 mr-1 align-middle" /> Akan datang
        </div>
        <div className="text-[7px] text-app-muted/60 mt-1">
          Ctrl+Z undo · Ctrl+Y redo · Klik = time-travel
        </div>
      </div>
    </div>
  );
}
