'use client';

import React, { useState, useCallback } from 'react';
import type { VisualLinterResult } from '../../core/vcs/types';

// ═══════════════════════════════════════════════════════════════
// COMPOSITION SCORE BADGE — Passive quality indicator
// ═══════════════════════════════════════════════════════════════
//
// Shows a compact score badge in the bottom-right corner of
// the canvas. Clicking it opens a diagnostic panel.
//
// Principle: Design Assistant, Not Design Police
//   - Badge is passive (doesn't block or interrupt)
//   - Only appears in canvas mode
//   - Score is guidance, not a gate
//   - Color encodes quality at a glance
//
// Design:
//   - Compact pill badge: "88 Sangat Baik" or "45 Kurang"
//   - Color: emerald/blue/amber/orange/red based on grade
//   - Subtle pulse animation for 'poor'/'bad' grades
//   - Click to toggle diagnostic panel

interface CompositionScoreBadgeProps {
  /** The lint result to display */
  result: VisualLinterResult;
  /** Whether in compact (canvas) mode */
  isCompact: boolean;
  /** Whether the diagnostic panel is open */
  isPanelOpen: boolean;
  /** Toggle the diagnostic panel */
  onTogglePanel: () => void;
}

export const CompositionScoreBadge = React.memo(function CompositionScoreBadge({
  result,
  isCompact,
  isPanelOpen,
  onTogglePanel,
}: CompositionScoreBadgeProps) {
  // Only show in canvas mode
  if (!isCompact) return null;

  const { score: compositionScore, grade, counts, warnings } = result;
  const color = grade === 'A' ? '#10b981' : grade === 'B' ? '#3b82f6' : grade === 'C' ? '#f59e0b' : grade === 'D' ? '#f97316' : '#ef4444';
  const label = grade === 'A' ? 'Sangat Baik' : grade === 'B' ? 'Baik' : grade === 'C' ? 'Cukup' : grade === 'D' ? 'Kurang' : 'Buruk';
  const hasWarnings = counts.warning > 0;
  const isLow = grade === 'D' || grade === 'F';

  return (
    <button
      onClick={onTogglePanel}
      className={`
        absolute bottom-2 right-2 z-50
        flex items-center gap-1.5 px-2 py-1 rounded-full
        text-[9px] font-bold whitespace-nowrap
        backdrop-blur-sm shadow-md
        transition-all duration-200
        hover:scale-105 active:scale-95
        ${isPanelOpen ? 'ring-1 ring-offset-1' : ''}
        ${isLow ? 'animate-pulse-subtle' : ''}
      `}
      style={{
        background: `${color}22`,
        color,
        borderColor: color,
        borderWidth: 1,
        borderStyle: 'solid',
        outline: isPanelOpen ? `2px solid ${color}44` : 'none',
        outlineOffset: '1px',
      }}
      title="Klik untuk detail komposisi visual"
    >
      {/* Score circle */}
      <span
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[8px] font-extrabold text-white"
        style={{ background: color }}
      >
        {compositionScore}
      </span>

      {/* Grade label */}
      <span>{label}</span>

      {/* Warning indicator */}
      {hasWarnings && (
        <span className="text-[8px]">⚠</span>
      )}

      {/* Expand/collapse indicator */}
      <span className="text-[7px] opacity-60">
        {isPanelOpen ? '✕' : '▸'}
      </span>
    </button>
  );
});

// ═══════════════════════════════════════════════════════════════
// DIAGNOSTIC PANEL — Expandable suggestion list
// ═══════════════════════════════════════════════════════════════
//
// Shows a compact panel with composition diagnostics.
// Sorted by priority (most important first).
// Each diagnostic shows severity badge + message + suggestion.
//
// Design:
//   - Compact floating panel anchored to bottom-right
//   - Score breakdown bar at top
//   - Diagnostic list with color-coded severity
//   - Actionable suggestions have a distinct style
//   - Max 5 diagnostics shown (with "show more" if needed)

interface DiagnosticPanelProps {
  /** The lint result to display */
  result: VisualLinterResult;
  /** Whether the panel is open */
  isOpen: boolean;
  /** Whether in compact (canvas) mode */
  isCompact: boolean;
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  warning: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', label: 'Penting' },
  suggestion: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', label: 'Saran' },
  info: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', label: 'Info' },
};

const MAX_VISIBLE_DIAGNOSTICS = 5;

export const DiagnosticPanel = React.memo(function DiagnosticPanel({
  result,
  isOpen,
  isCompact,
}: DiagnosticPanelProps) {
  const [showAll, setShowAll] = useState(false);

  if (!isOpen || !isCompact) return null;

  const {
    score: compositionScore,
    grade,
    categories,
    warnings: diagnostics,
    counts: diagnosticCounts,
  } = result;
  const hasFatalIssue = diagnosticCounts.error > 0;

  const color = grade === 'A' ? '#10b981' : grade === 'B' ? '#3b82f6' : grade === 'C' ? '#f59e0b' : grade === 'D' ? '#f97316' : '#ef4444';
  const visibleDiagnostics = showAll ? diagnostics : diagnostics.slice(0, MAX_VISIBLE_DIAGNOSTICS);
  const hasMore = diagnostics.length > MAX_VISIBLE_DIAGNOSTICS && !showAll;

  return (
    <div
      className="absolute bottom-10 right-2 z-50 w-64 max-h-72 overflow-y-auto rounded-lg shadow-xl border"
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderColor: `${color}44`,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* ── Score Breakdown ── */}
      <div className="px-3 py-2 border-b border-black/10">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-app-primary/80">Komposisi Visual</span>
          <span
            className="text-[11px] font-extrabold"
            style={{ color }}
          >
            {compositionScore}/100
          </span>
        </div>

        {/* Mini score bars */}
        <div className="grid grid-cols-5 gap-1">
          {categories.map(item => (
            <div key={item.category} className="flex flex-col items-center gap-0.5">
              <div className="w-full h-1 rounded-full bg-black/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${item.score}%`,
                    background: item.score >= 70 ? '#10b981' : item.score >= 50 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
              <span className="text-[6px] text-app-muted">{item.category}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Diagnostics List ── */}
      {diagnostics.length > 0 ? (
        <div className="px-2 py-1.5">
          {visibleDiagnostics.map((d: { severity: string; code: string; message: string; suggestion?: string }, i: number) => {
            const sev = SEVERITY_STYLES[d.severity] ?? SEVERITY_STYLES.info;
            return (
              <div
                key={`${d.code}-${i}`}
                className="flex items-start gap-1.5 py-1 border-b border-black/5 last:border-0"
              >
                {/* Severity badge */}
                <span
                  className="inline-flex items-center justify-center min-w-[14px] h-[14px] px-0.5 rounded text-[6px] font-bold shrink-0 mt-0.5"
                  style={{ background: sev.bg, color: sev.text }}
                >
                  {sev.label}
                </span>

                {/* Message + suggestion */}
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[8px] text-app-primary/70 leading-tight">
                    {d.message}
                  </span>
                  {d.suggestion && (
                    <span className="text-[7px] text-app-muted leading-tight italic">
                      {d.suggestion}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Show more */}
          {hasMore && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full text-center text-[7px] text-app-muted hover:text-app-primary/60 py-1 mt-0.5"
            >
              +{diagnostics.length - MAX_VISIBLE_DIAGNOSTICS} lagi...
            </button>
          )}
        </div>
      ) : (
        <div className="px-3 py-3 text-center">
          <span className="text-[9px] text-app-muted/50">Komposisi visual sudah baik</span>
        </div>
      )}

      {/* ── Fatal Warning ── */}
      {hasFatalIssue && (
        <div
          className="px-3 py-1.5 border-t border-red-500/30"
          style={{ background: 'rgba(239, 68, 68, 0.1)' }}
        >
          <span className="text-[8px] font-bold text-red-400">
            ⚠ Konten melampaui batas scene — perlu dibagi atau dikompres
          </span>
        </div>
      )}
    </div>
  );
});
