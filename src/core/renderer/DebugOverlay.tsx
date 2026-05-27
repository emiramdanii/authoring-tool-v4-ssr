// ═══════════════════════════════════════════════════════════════════
// DEBUG OVERLAY — Visual diagnostic layers for the SILSE renderer
// ═══════════════════════════════════════════════════════════════════
//
// FASE 2 — DEBUG MODE overlay system for the SILSE canvas rendering
// pipeline. Part of the stabilization roadmap.
//
// This component renders debug information overlaid on the canvas
// when one or more debug modes are enabled. It is designed to be
// a ZERO-COST no-op when all modes are disabled.
//
// DESIGN PRINCIPLES:
//   1. Does NOT affect the rendering pipeline it's debugging
//      - Uses module-level mutable config (debug-config.ts), not React state
//      - pointer-events: none on overlay layers
//      - No useMemo/useEffect dependencies that would affect parent memoization
//
//   2. Zero-cost when disabled
//      - Early return null when no mode is active and panel is closed
//      - No computation, no DOM, no observers
//
//   3. Accurate positioning
//      - Uses absolute positioning in the scene's coordinate space
//      - Overlay positions match resolveSceneLayout() outputs exactly
//      - Scales with the scene container (no coordinate transforms needed)
//
// MODES:
//   SHOW_LAYOUT_BOXES  — Colored borders by overflow rule
//   SHOW_BLOCK_BOUNDS  — Block ID, type, dimensions, measurement status
//   SHOW_MEASUREMENTS  — Estimated / measured / compressed / pending
//   SHOW_SCENE_FLOW    — Scene boundaries, block-to-scene mapping
//
// USAGE (in SchemaRenderer.tsx):
//   <DebugOverlay
//     resolvedBlocks={resolvedBlocks}
//     scenePlan={scenePlan}
//     sceneRes={sceneRes}
//     safeArea={safeArea}
//     isCompact={isCompact}
//   />
//
// ═══════════════════════════════════════════════════════════════════

'use client';

import React, { useState, useCallback } from 'react';
import type { ResolvedBlockPosition, SceneResolution, SafeArea } from '../scene/SceneLayoutEngine';
import { estimateBlockHeight } from '../scene/SceneLayoutEngine';
import type { ScenePlan } from '../layout/SceneOverflowEngine';
import type { OverflowRule } from '../schema/capability-registry';
import { isBlockTypeMeasurable } from '../schema/capability-registry';
import { getMeasuredHeight, hasMeasurement } from '../layout/BlockMeasurer';
import { getCompressedHeight } from '../schema/session-state';
import { debugConfig, toggleDebugMode, isDebugMode, type DebugModeKey } from './debug-config';

// ── Overflow Rule Visual Mapping ────────────────────────────────

/**
 * Color mapping for overflow rules.
 * Each overflow rule gets a distinct, high-contrast color so you can
 * visually identify a block's overflow behavior at a glance.
 *
 *   clip           → red     (content is cut off at allocated height)
 *   autoResize     → green   (block grows to fit content up to maxHeight)
 *   internalScroll → blue    (fixed size with internal scroll)
 *   scaleDown      → purple  (content scaled down to fit)
 */
const OVERFLOW_COLORS: Record<OverflowRule, string> = {
  clip: '#ef4444',           // red-500
  autoResize: '#22c55e',     // green-500
  internalScroll: '#3b82f6', // blue-500
  scaleDown: '#a855f7',      // purple-500
};

/**
 * Short labels for overflow rules, shown in the layout box border tag.
 */
const OVERFLOW_LABELS: Record<OverflowRule, string> = {
  clip: 'CLIP',
  autoResize: 'AUTO',
  internalScroll: 'SCROLL',
  scaleDown: 'SCALE',
};

/**
 * Background colors (with alpha) for the overflow rule badge.
 * Slightly transparent so the block content behind is still partially visible.
 */
const OVERFLOW_BG: Record<OverflowRule, string> = {
  clip: 'rgba(239, 68, 68, 0.12)',       // red @ 12%
  autoResize: 'rgba(34, 197, 94, 0.08)',  // green @ 8%
  internalScroll: 'rgba(59, 130, 246, 0.10)', // blue @ 10%
  scaleDown: 'rgba(168, 85, 247, 0.10)',  // purple @ 10%
};

// ── Shared Label Styles ────────────────────────────────────────

/** Base style for all debug labels — consistent monospace appearance */
const LABEL_BASE: React.CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  fontSize: 8,
  lineHeight: 1.4,
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
};

/** Style for the small info badges in the top-left corner of blocks */
const BADGE_STYLE: React.CSSProperties = {
  ...LABEL_BASE,
  background: 'rgba(0, 0, 0, 0.78)',
  color: '#e5e5e5',
  padding: '2px 5px',
  borderRadius: 3,
  maxWidth: 260,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

// ── Props ──────────────────────────────────────────────────────

/**
 * Props for the DebugOverlay component.
 *
 * All of these are already computed in SchemaScreenRenderer —
 * no new computations or side effects are introduced.
 *
 * IMPORTANT: Adding new props here is safe because the overlay
 * is a leaf component — changes to its props don't cascade
 * further down the component tree.
 */
export interface DebugOverlayProps {
  /** Resolved block positions from resolveSceneLayout */
  resolvedBlocks: ResolvedBlockPosition[];
  /** Scene distribution plan from SceneOverflowEngine */
  scenePlan?: ScenePlan;
  /** Scene resolution (virtual canvas dimensions) */
  sceneRes: SceneResolution;
  /** Safe area (content bounds within the scene) */
  safeArea: SafeArea;
  /** Whether in compact (canvas) mode — affects height estimation */
  isCompact: boolean;
}

// ── Mode Panel Config ──────────────────────────────────────────

/** Configuration for the debug mode toggle panel */
const MODE_OPTIONS: ReadonlyArray<{
  key: DebugModeKey;
  label: string;
  description: string;
}> = [
  {
    key: 'SHOW_LAYOUT_BOXES',
    label: 'Layout Boxes',
    description: 'Colored borders by overflow rule',
  },
  {
    key: 'SHOW_BLOCK_BOUNDS',
    label: 'Block Bounds',
    description: 'ID, type, dimensions, measurement status',
  },
  {
    key: 'SHOW_MEASUREMENTS',
    label: 'Measurements',
    description: 'Estimated / measured / compressed / pending',
  },
  {
    key: 'SHOW_SCENE_FLOW',
    label: 'Scene Flow',
    description: 'Scene boundaries and split info',
  },
  {
    key: 'SHOW_RERENDER',
    label: 'Rerender Flash',
    description: 'Flash blocks on rerender — detect wasted renders',
  },
];

// ═══════════════════════════════════════════════════════════════════
// DEBUG OVERLAY COMPONENT
// ═══════════════════════════════════════════════════════════════════

/**
 * DebugOverlay — renders diagnostic information overlaid on the canvas.
 *
 * When no debug mode is active and the toggle panel is closed, this
 * component renders only a small toggle button in the corner. The
 * visualization layers are zero-cost when disabled (no DOM, no computation).
 *
 * When one or more modes are active, the overlay renders diagnostic
 * layers using absolute positioning that matches the scene coordinate
 * system. All overlay layers use pointer-events: none so they don't
 * intercept clicks or interfere with the canvas editor.
 *
 * The toggle button and panel are the only interactive elements — they
 * have pointer-events: auto and live outside the pointer-events: none
 * container.
 */
export const DebugOverlay = React.memo(function DebugOverlay({
  resolvedBlocks,
  scenePlan,
  sceneRes,
  safeArea,
  isCompact,
}: DebugOverlayProps) {
  // ── Local state (does NOT affect parent memoization) ──
  // panelOpen: whether the mode selection panel is visible
  // forceCounter: increment on config toggle to trigger local re-render
  const [panelOpen, setPanelOpen] = useState(false);
  const [forceCounter, setForceCounter] = useState(0);

  // Stable callback — toggles a mode and forces this component to re-render
  const handleToggle = useCallback((key: DebugModeKey) => {
    toggleDebugMode(key);
    setForceCounter(v => v + 1);
  }, []);

  // ── EARLY RETURN: Zero-cost no-op ──
  // When no mode is active and panel is closed, render only the toggle button.
  // This is the "zero-cost" path — no visualization layers, no computation.
  const anyModeActive = isDebugMode();
  if (!anyModeActive && !panelOpen) {
    // Void the forceCounter to suppress the unused-variable lint warning.
    // forceCounter is intentionally read here to make the component
    // re-render when the user toggles a mode (which increments the counter).
    void forceCounter;

    return (
      <ToggleBadge
        active={false}
        onClick={() => setPanelOpen(true)}
      />
    );
  }

  // ── VISUALIZATION LAYERS ──
  // Each mode contributes zero or more absolutely-positioned elements
  // that overlay exactly on the blocks in the scene coordinate space.
  const layers: React.ReactNode[] = [];

  // ── Layer 1: SHOW_LAYOUT_BOXES ──
  if (debugConfig.SHOW_LAYOUT_BOXES) {
    for (const rb of resolvedBlocks) {
      const color = OVERFLOW_COLORS[rb.overflow] || '#999';
      const bgColor = OVERFLOW_BG[rb.overflow] || 'rgba(0,0,0,0.05)';

      layers.push(
        <div
          key={`layout-${rb.key}`}
          style={{
            position: 'absolute',
            left: rb.x,
            top: rb.y,
            width: rb.width,
            height: rb.height,
            border: `2px solid ${color}`,
            background: bgColor,
            pointerEvents: 'none',
            zIndex: 9000,
            boxSizing: 'border-box' as const,
          }}
        >
          {/* Overflow rule badge — top-right corner */}
          <span
            style={{
              position: 'absolute',
              top: -1,
              right: -1,
              background: color,
              color: '#fff',
              fontSize: 7,
              fontWeight: 700,
              padding: '0 4px',
              lineHeight: '13px',
              borderRadius: '0 0 0 3px',
              fontFamily: LABEL_BASE.fontFamily,
              letterSpacing: '0.03em',
            }}
          >
            {OVERFLOW_LABELS[rb.overflow]}
          </span>
        </div>
      );
    }
  }

  // ── Layer 2: SHOW_BLOCK_BOUNDS ──
  if (debugConfig.SHOW_BLOCK_BOUNDS) {
    for (const rb of resolvedBlocks) {
      const blockId = rb.block.id || rb.key;
      const measurable = isBlockTypeMeasurable(rb.block.type);
      const hasMeas = rb.block.id ? hasMeasurement(rb.block.id) : false;

      // Determine measurement status label and color
      let statusLabel: string;
      let statusColor: string;
      if (!measurable) {
        statusLabel = 'fixed';
        statusColor = '#737373'; // neutral-500
      } else if (hasMeas) {
        statusLabel = 'measured';
        statusColor = '#22c55e'; // green-500
      } else {
        statusLabel = 'estimated';
        statusColor = '#a3a3a3'; // neutral-400
      }

      layers.push(
        <div
          key={`bounds-${rb.key}`}
          style={{
            position: 'absolute',
            left: rb.x + 3,
            top: rb.y + 3,
            pointerEvents: 'none',
            zIndex: 9001,
          }}
        >
          <div style={BADGE_STYLE}>
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>{blockId}</span>
            {' '}
            <span style={{ color: '#a3a3a3' }}>{rb.block.type}</span>
            {' '}
            <span style={{ color: '#d4d4d4' }}>
              {Math.round(rb.width)}x{Math.round(rb.height)}
            </span>
            {' '}
            <span style={{ color: statusColor }}>{statusLabel}</span>
          </div>
        </div>
      );
    }
  }

  // ── Layer 3: SHOW_MEASUREMENTS ──
  if (debugConfig.SHOW_MEASUREMENTS) {
    for (const rb of resolvedBlocks) {
      const blockId = rb.block.id;
      if (!blockId) continue;

      // Only show for measurable blocks (skip cover/hero/games)
      if (!isBlockTypeMeasurable(rb.block.type)) continue;

      // Compute all three height sources
      const { height: estimatedH } = estimateBlockHeight(rb.block, {
        isCompact,
        variant: rb.block.variant || 'A',
        availableWidth: rb.width,
        sceneH: sceneRes.h,
      });
      const measuredH = getMeasuredHeight(blockId);
      const compressedH = getCompressedHeight(blockId);
      const isPending = measuredH == null;
      const isCompressed = compressedH != null;

      layers.push(
        <div
          key={`meas-${rb.key}`}
          style={{
            position: 'absolute',
            left: rb.x + rb.width - 6,
            top: rb.y + 3,
            pointerEvents: 'none',
            zIndex: 9002,
            transform: 'translateX(-100%)',
          }}
        >
          <div
            style={{
              ...LABEL_BASE,
              background: 'rgba(0, 0, 0, 0.82)',
              padding: '3px 5px',
              borderRadius: 3,
              textAlign: 'right' as const,
              lineHeight: 1.5,
              fontSize: 7,
            }}
          >
            {/* Estimated height — always available */}
            <div style={{ color: '#a3a3a3' }}>
              est: {Math.round(estimatedH)}px
            </div>

            {/* Measured height — from BlockMeasurer's ResizeObserver */}
            {measuredH != null && (
              <div style={{ color: '#22c55e' }}>
                meas: {measuredH}px
              </div>
            )}

            {/* Compressed height — from session-state cache */}
            {isCompressed && (
              <div style={{ color: '#f59e0b' }}>
                comp: {compressedH}px
              </div>
            )}

            {/* Pending indicator — block hasn't been measured yet */}
            {isPending && (
              <div style={{ color: '#ef4444', fontWeight: 700 }}>
                PENDING
              </div>
            )}
          </div>
        </div>
      );
    }
  }

  // ── Layer 4: SHOW_SCENE_FLOW ──
  if (debugConfig.SHOW_SCENE_FLOW && scenePlan) {
    const contentTop = safeArea.top;
    const contentBottom = sceneRes.h - safeArea.bottom;
    const contentH = contentBottom - contentTop;
    const contentX = safeArea.left;
    const contentW = sceneRes.w - safeArea.left - safeArea.right;

    // ── Scene boundary lines ──
    // Each scene boundary is a dashed red line spanning the content width.
    // Only drawn between scenes (not at the top of the first scene).
    for (let i = 1; i < scenePlan.totalScenes; i++) {
      const boundaryY = contentTop + i * contentH;

      layers.push(
        <div
          key={`scene-boundary-${i}`}
          style={{
            position: 'absolute',
            left: contentX,
            top: boundaryY - 1,
            width: contentW,
            height: 2,
            background: `repeating-linear-gradient(90deg, #ef4444 0px, #ef4444 6px, transparent 6px, transparent 12px)`,
            pointerEvents: 'none',
            zIndex: 9003,
          }}
        />
      );
    }

    // ── Scene labels and overflow indicators ──
    for (let i = 0; i < scenePlan.scenes.length; i++) {
      const scene = scenePlan.scenes[i];
      const sceneTop = contentTop + i * contentH;

      // Scene number label — top-left of each scene
      layers.push(
        <div
          key={`scene-label-${i}`}
          style={{
            position: 'absolute',
            left: contentX + 2,
            top: sceneTop + 2,
            pointerEvents: 'none',
            zIndex: 9003,
          }}
        >
          <span
            style={{
              ...LABEL_BASE,
              background: 'rgba(239, 68, 68, 0.85)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 8,
              padding: '1px 5px',
              borderRadius: 2,
            }}
          >
            Scene {i + 1}/{scenePlan.totalScenes}
          </span>
        </div>
      );

      // Block count for this scene
      const sceneBlockCount = scene.blockIds.length;
      layers.push(
        <div
          key={`scene-blocks-${i}`}
          style={{
            position: 'absolute',
            left: contentX + 2,
            top: sceneTop + 16,
            pointerEvents: 'none',
            zIndex: 9003,
          }}
        >
          <span
            style={{
              ...LABEL_BASE,
              background: 'rgba(0, 0, 0, 0.7)',
              color: '#d4d4d4',
              fontSize: 7,
              padding: '1px 4px',
              borderRadius: 2,
            }}
          >
            {sceneBlockCount} block{sceneBlockCount !== 1 ? 's' : ''} | {Math.round(scene.totalHeight)}px
          </span>
        </div>
      );

      // Overflow warning indicator
      if (scene.hasOverflow) {
        const overflowY = sceneTop + contentH - 22;

        layers.push(
          <div
            key={`scene-overflow-${i}`}
            style={{
              position: 'absolute',
              left: contentX,
              top: overflowY,
              width: contentW,
              height: 20,
              background: `repeating-linear-gradient(45deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.15) 4px, transparent 4px, transparent 8px)`,
              pointerEvents: 'none',
              zIndex: 9003,
            }}
          >
            <span
              style={{
                position: 'absolute',
                right: 4,
                top: 4,
                fontSize: 8,
                fontWeight: 700,
                fontFamily: LABEL_BASE.fontFamily,
                color: '#ef4444',
              }}
            >
              OVERFLOW
            </span>
          </div>
        );
      }

      // ── Block-to-scene mapping lines ──
      // Draw thin connecting lines from scene label to each block
      // that belongs to this scene, so you can see which blocks
      // are assigned to which scene.
      const sceneBlockIds = new Set(scene.blockIds);
      const sceneBlocks = resolvedBlocks.filter(
        rb => rb.block.id != null && sceneBlockIds.has(rb.block.id)
      );

      for (const rb of sceneBlocks) {
        const blockCenterY = rb.y + Math.min(rb.height, 8);

        layers.push(
          <div
            key={`scene-map-${i}-${rb.key}`}
            style={{
              position: 'absolute',
              left: contentX - 3,
              top: blockCenterY - 1,
              width: 5,
              height: 2,
              background: 'rgba(239, 68, 68, 0.6)',
              pointerEvents: 'none',
              zIndex: 9003,
            }}
          />
        );
      }
    }

    // ── Scene flow summary panel ──
    layers.push(
      <div
        key="scene-flow-summary"
        style={{
          position: 'absolute',
          left: contentX + 2,
          bottom: safeArea.bottom + 6,
          pointerEvents: 'none',
          zIndex: 9003,
          background: 'rgba(0, 0, 0, 0.82)',
          borderRadius: 4,
          padding: '4px 7px',
          color: '#e5e5e5',
          fontSize: 8,
          fontFamily: LABEL_BASE.fontFamily,
          lineHeight: 1.5,
        }}
      >
        <div style={{ color: '#f59e0b', fontWeight: 700, marginBottom: 2 }}>
          Scene Flow
        </div>
        <div>Scenes: {scenePlan.totalScenes} {scenePlan.isSingleScene ? '(single)' : '(split)'}</div>
        <div>Blocks: {resolvedBlocks.length} total</div>
        <div>Splittable: {scenePlan.splittableBlockIds.length}</div>
        <div>Scene size: {Math.round(contentW)}x{Math.round(contentH)}px</div>
      </div>
    );
  }

  // ── Assemble final output ──
  return (
    <>
      {/* Visualization layers — pointer-events: none */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 9000,
          overflow: 'hidden',
        }}
      >
        {layers}
      </div>

      {/* Toggle button — always interactive */}
      <ToggleBadge
        active={anyModeActive}
        onClick={() => setPanelOpen(v => !v)}
      />

      {/* Mode selection panel */}
      {panelOpen && (
        <ModePanel
          onToggle={handleToggle}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </>
  );
});

// ═══════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════

// ── Toggle Badge ───────────────────────────────────────────────

interface ToggleBadgeProps {
  /** Whether any debug mode is currently active (affects styling) */
  active: boolean;
  /** Callback when the badge is clicked */
  onClick: () => void;
}

/**
 * Small circular badge in the bottom-right corner that toggles
 * the debug panel. This is the ONLY always-rendered element
 * from the debug overlay system.
 *
 * When no mode is active: gray, unobtrusive
 * When a mode is active: amber, to indicate debug state
 */
const ToggleBadge = React.memo(function ToggleBadge({
  active,
  onClick,
}: ToggleBadgeProps) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 8,
        right: 8,
        zIndex: 10000,
        pointerEvents: 'auto',
      }}
    >
      <button
        onClick={onClick}
        aria-label={active ? 'Debug overlay active — click to toggle' : 'Debug overlay — click to open'}
        title="Debug Overlay"
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: active ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.2)',
          background: active
            ? 'rgba(245, 158, 11, 0.9)'
            : 'rgba(80, 80, 80, 0.55)',
          color: active ? '#000' : 'rgba(255,255,255,0.6)',
          fontSize: 8,
          fontWeight: 800,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: active
            ? '0 0 8px rgba(245, 158, 11, 0.5)'
            : '0 1px 3px rgba(0,0,0,0.3)',
          transition: 'all 0.15s ease',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          letterSpacing: '0.04em',
          padding: 0,
          lineHeight: 1,
        }}
      >
        DBG
      </button>
    </div>
  );
});

// ── Mode Panel ─────────────────────────────────────────────────

interface ModePanelProps {
  /** Callback to toggle a specific debug mode */
  onToggle: (key: DebugModeKey) => void;
  /** Callback to close the panel */
  onClose: () => void;
}

/**
 * Floating panel with checkboxes for each debug mode.
 * Positioned above the toggle badge in the bottom-right corner.
 * Has pointer-events: auto so it's fully interactive.
 */
const ModePanel = React.memo(function ModePanel({
  onToggle,
  onClose,
}: ModePanelProps) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 38,
        right: 8,
        zIndex: 10000,
        pointerEvents: 'auto',
        background: 'rgba(10, 10, 10, 0.92)',
        borderRadius: 8,
        padding: '10px 14px',
        color: '#e5e5e5',
        fontSize: 10,
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
        minWidth: 220,
        boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
          paddingBottom: 6,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 11, color: '#f59e0b' }}>
          DEBUG MODE
        </span>
        <button
          onClick={onClose}
          aria-label="Close debug panel"
          style={{
            background: 'none',
            border: 'none',
            color: '#737373',
            cursor: 'pointer',
            fontSize: 12,
            padding: '0 2px',
            lineHeight: 1,
          }}
        >
          x
        </button>
      </div>

      {/* Mode checkboxes */}
      {MODE_OPTIONS.map(({ key, label, description }) => (
        <label
          key={key}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          <input
            type="checkbox"
            checked={debugConfig[key]}
            onChange={() => onToggle(key)}
            style={{
              marginTop: 2,
              accentColor: '#f59e0b',
              cursor: 'pointer',
            }}
          />
          <div>
            <div style={{ fontWeight: 600, color: '#d4d4d4' }}>
              {label}
            </div>
            <div style={{ fontSize: 8, color: '#737373', marginTop: 1 }}>
              {description}
            </div>
          </div>
        </label>
      ))}

      {/* Color legend for SHOW_LAYOUT_BOXES */}
      {debugConfig.SHOW_LAYOUT_BOXES && (
        <div
          style={{
            marginTop: 8,
            paddingTop: 6,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            fontSize: 8,
          }}
        >
          <div style={{ color: '#a3a3a3', marginBottom: 3, fontWeight: 600 }}>
            Overflow Colors:
          </div>
          {(['clip', 'autoResize', 'internalScroll', 'scaleDown'] as OverflowRule[]).map(
            (rule) => (
              <div
                key={rule}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '1px 0',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: OVERFLOW_COLORS[rule],
                  }}
                />
                <span style={{ color: '#a3a3a3' }}>
                  {rule}
                </span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
});
