// ═══════════════════════════════════════════════════════════════════
// COMPRESSED BLOCK WRAPPER — Compression UI for overflowing blocks
// ═══════════════════════════════════════════════════════════════════
//
// When the SceneLayoutEngine decides a block should be compressed,
// this wrapper provides the compression UI:
//   - Accordion: headers only, click to expand/collapse each item
//   - Reveal-set: show N items, "Lihat lainnya" for rest
//   - Collapsible: summary view, expand for full detail
//   - Step-reveal: one step at a time, prev/next navigation
//
// This wrapper does NOT modify the source block. It only controls
// what the user sees. The full content is always available for
// preview/export mode.
//
// ═══════════════════════════════════════════════════════════════════

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import type { CompressionDecision, CompressionParams, CompressionStrategy } from '../layout/CompressionEngine';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';

// ── Compressed Block Wrapper ───────────────────────────────────

export interface CompressedBlockWrapperProps {
  /** The compression decision from the engine */
  compression: CompressionDecision;
  /** The block content (rendered normally in expanded mode) */
  children: React.ReactNode;
  /** Block title for the compression header */
  title?: string;
  /** Whether in compact (canvas) mode */
  isCompact?: boolean;
}

/**
 * CompressedBlockWrapper — applies compression UI to a block.
 *
 * This wrapper is placed AROUND the block's content in the renderer.
 * When compression is active, it shows the compressed view.
 * The user can expand/interact to see full content.
 *
 * Usage in a block renderer:
 *   if (compression?.isCompressed) {
 *     return (
 *       <CompressedBlockWrapper compression={compression} title={block.title}>
 *         <FullContent />
 *       </CompressedBlockWrapper>
 *     );
 *   }
 *   return <FullContent />;
 */
export const CompressedBlockWrapper = React.memo(function CompressedBlockWrapper({
  compression,
  children,
  title,
  isCompact = false,
}: CompressedBlockWrapperProps) {
  const [params, setParams] = useState<CompressionParams>(compression.params);

  const updateParams = useCallback((updates: Partial<CompressionParams>) => {
    setParams(prev => ({ ...prev, ...updates }));
  }, []);

  switch (compression.strategy) {
    case 'accordion':
      return (
        <AccordionView
          params={params}
          onUpdate={updateParams}
          expandedHeight={compression.expandedHeight}
          title={title}
          isCompact={isCompact}
        >
          {children}
        </AccordionView>
      );
    case 'reveal-set':
      return (
        <RevealSetView
          params={params}
          onUpdate={updateParams}
          expandedHeight={compression.expandedHeight}
          title={title}
          isCompact={isCompact}
        >
          {children}
        </RevealSetView>
      );
    case 'collapsible':
      return (
        <CollapsibleView
          params={params}
          onUpdate={updateParams}
          expandedHeight={compression.expandedHeight}
          title={title}
          isCompact={isCompact}
        >
          {children}
        </CollapsibleView>
      );
    case 'step-reveal':
      return (
        <StepRevealView
          params={params}
          onUpdate={updateParams}
          expandedHeight={compression.expandedHeight}
          title={title}
          isCompact={isCompact}
        >
          {children}
        </StepRevealView>
      );
    default:
      return <>{children}</>;
  }
});

// ── Accordion View ─────────────────────────────────────────────

interface StrategyViewProps {
  params: CompressionParams;
  onUpdate: (updates: Partial<CompressionParams>) => void;
  expandedHeight: number;
  title?: string;
  isCompact: boolean;
  children: React.ReactNode;
}

const AccordionView = React.memo(function AccordionView({
  params,
  onUpdate,
  expandedHeight,
  title,
  isCompact,
  children,
}: StrategyViewProps) {
  // Accordion shows a header with expand/collapse toggle
  // Content is rendered inside a collapsible container
  const isExpanded = params.isExpanded ?? false;

  return (
    <div className="relative w-full">
      {/* Accordion header — always visible */}
      <button
        onClick={() => onUpdate({ isExpanded: !isExpanded })}
        className="w-full flex items-center justify-between px-3 py-2 rounded-t-lg transition-colors"
        style={{
          background: 'rgba(52, 211, 153, 0.08)',
          borderBottom: isExpanded ? '1px solid rgba(52, 211, 153, 0.2)' : 'none',
          borderRadius: isExpanded ? '8px 8px 0 0' : '8px',
          fontSize: isCompact ? 10 : 12,
          cursor: 'pointer',
        }}
      >
        <span className="flex items-center gap-1.5 font-semibold" style={{ color: 'rgba(52, 211, 153, 0.9)' }}>
          <span style={{ fontSize: isCompact ? 8 : 10 }}>{isExpanded ? '⊟' : '⊞'}</span>
          {title || 'Accordion'}
          {!isExpanded && (
            <span className="font-normal" style={{ color: 'rgba(52, 211, 153, 0.5)', fontSize: isCompact ? 8 : 9 }}>
              — klik untuk detail
            </span>
          )}
        </span>
        {isExpanded ? (
          <ChevronUp size={isCompact ? 12 : 14} style={{ color: 'rgba(52, 211, 153, 0.6)' }} />
        ) : (
          <ChevronDown size={isCompact ? 12 : 14} style={{ color: 'rgba(52, 211, 153, 0.6)' }} />
        )}
      </button>

      {/* Content — collapsible */}
      <div
        style={{
          maxHeight: isExpanded ? expandedHeight : 0,
          overflow: isExpanded ? 'auto' : 'hidden',
          transition: 'max-height 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
});

// ── Reveal Set View ────────────────────────────────────────────

const RevealSetView = React.memo(function RevealSetView({
  params,
  onUpdate,
  expandedHeight,
  title,
  isCompact,
  children,
}: StrategyViewProps) {
  const isRevealed = params.isExpanded ?? false;

  return (
    <div className="relative w-full">
      {/* Content — clipped when not revealed */}
      <div
        style={{
          maxHeight: isRevealed ? expandedHeight : (expandedHeight * 0.6),
          overflow: isRevealed ? 'auto' : 'hidden',
          transition: 'max-height 0.3s ease-out',
          position: 'relative',
        }}
      >
        {children}
        {/* Fade-out gradient at the bottom when not revealed */}
        {!isRevealed && (
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none"
            style={{
              height: 40,
              background: 'linear-gradient(transparent, rgba(15, 23, 42, 0.9))',
            }}
          />
        )}
      </div>

      {/* "Lihat lainnya" button */}
      <button
        onClick={() => onUpdate({ isExpanded: !isRevealed })}
        className="w-full flex items-center justify-center gap-1 py-1.5 transition-colors"
        style={{
          background: 'rgba(52, 211, 153, 0.08)',
          color: 'rgba(52, 211, 153, 0.9)',
          fontSize: isCompact ? 9 : 11,
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        {isRevealed ? (
          <>
            <EyeOff size={isCompact ? 10 : 12} />
            Sembunyikan
          </>
        ) : (
          <>
            <Eye size={isCompact ? 10 : 12} />
            Lihat lainnya
          </>
        )}
      </button>
    </div>
  );
});

// ── Collapsible View ───────────────────────────────────────────

const CollapsibleView = React.memo(function CollapsibleView({
  params,
  onUpdate,
  expandedHeight,
  title,
  isCompact,
  children,
}: StrategyViewProps) {
  const isExpanded = params.isExpanded ?? false;

  return (
    <div className="relative w-full">
      {/* Content — collapsed shows clipped view */}
      <div
        style={{
          maxHeight: isExpanded ? expandedHeight : (expandedHeight * 0.4),
          overflow: isExpanded ? 'auto' : 'hidden',
          transition: 'max-height 0.3s ease-out',
        }}
      >
        {children}
      </div>

      {/* Expand/Collapse toggle */}
      <button
        onClick={() => onUpdate({ isExpanded: !isExpanded })}
        className="flex items-center justify-center gap-1 py-1.5 px-3 rounded-b-lg transition-colors mx-auto"
        style={{
          background: 'rgba(99, 102, 241, 0.1)',
          color: 'rgba(99, 102, 241, 0.9)',
          fontSize: isCompact ? 9 : 11,
          cursor: 'pointer',
          fontWeight: 600,
          width: '100%',
        }}
      >
        {isExpanded ? (
          <>
            <ChevronUp size={isCompact ? 10 : 12} />
            Ringkas
          </>
        ) : (
          <>
            <ChevronDown size={isCompact ? 10 : 12} />
            Selengkapnya
          </>
        )}
      </button>
    </div>
  );
});

// ── Step Reveal View ───────────────────────────────────────────

const StepRevealView = React.memo(function StepRevealView({
  params,
  onUpdate,
  expandedHeight,
  title,
  isCompact,
  children,
}: StrategyViewProps) {
  // Step reveal shows one step at a time with prev/next navigation
  // For now, we use a simplified view that clips content and shows nav
  const currentStep = params.currentStep ?? 0;

  return (
    <div className="relative w-full">
      {/* Content — shown in full (the block renderer handles step logic internally) */}
      <div style={{ maxHeight: expandedHeight, overflow: 'auto' }}>
        {children}
      </div>

      {/* Step navigation bar */}
      <div
        className="flex items-center justify-between px-2 py-1"
        style={{
          background: 'rgba(52, 211, 153, 0.06)',
          borderTop: '1px solid rgba(52, 211, 153, 0.15)',
        }}
      >
        <button
          onClick={() => onUpdate({ currentStep: Math.max(0, currentStep - 1) })}
          disabled={currentStep === 0}
          className="flex items-center gap-0.5 transition-colors disabled:opacity-30"
          style={{ color: 'rgba(52, 211, 153, 0.8)', fontSize: isCompact ? 8 : 10, cursor: 'pointer' }}
        >
          <ChevronLeft size={isCompact ? 10 : 12} />
          Prev
        </button>

        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: isCompact ? 8 : 10 }} className="font-medium tabular-nums">
          Langkah {currentStep + 1}
        </span>

        <button
          onClick={() => onUpdate({ currentStep: currentStep + 1 })}
          className="flex items-center gap-0.5 transition-colors"
          style={{ color: 'rgba(52, 211, 153, 0.8)', fontSize: isCompact ? 8 : 10, cursor: 'pointer' }}
        >
          Next
          <ChevronRight size={isCompact ? 10 : 12} />
        </button>
      </div>
    </div>
  );
});

// ── Compression Badge ──────────────────────────────────────────

/**
 * A small badge that shows the compression strategy.
 * Used in the canvas editor to indicate that a block is compressed.
 */
export function CompressionBadge({ strategy, isCompact = false }: { strategy: CompressionStrategy; isCompact?: boolean }) {
  const label: Record<CompressionStrategy, string> = {
    accordion: '⊞ Accordion',
    'reveal-set': '⋯ Reveal',
    collapsible: '▾ Collapsible',
    'step-reveal': '▸ Steps',
  };

  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-bold"
      style={{
        background: 'rgba(52, 211, 153, 0.15)',
        color: 'rgba(52, 211, 153, 0.9)',
        fontSize: isCompact ? 7 : 8,
        letterSpacing: '0.02em',
      }}
    >
      {label[strategy]}
    </span>
  );
}
