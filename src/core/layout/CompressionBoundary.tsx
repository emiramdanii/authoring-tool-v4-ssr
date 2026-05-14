// ═══════════════════════════════════════════════════════════════════
// COMPRESSION BOUNDARY — Universal compression fallback for blocks
// ═══════════════════════════════════════════════════════════════════
//
// This component sits between SchemaBlockRenderer and block renderers.
// It provides automatic compression support for blocks whose renderers
// don't handle compression natively (via useBlockCompression).
//
// HOW IT WORKS:
//   1. If the block has no compression decision → pass through (no wrapper)
//   2. If the block's renderer handles compression natively → pass through
//   3. If the block has compression but renderer doesn't handle it →
//      wrap the block in CompressedBlockWrapper
//
// This ensures ALL blocks with compression profiles get compression UI,
// even if their renderers haven't been updated yet.
//
// RENDERERS THAT HANDLE COMPRESSION NATIVELY (handlesCompression: true):
//   petunjuk, tp, alur, kuis, def-box, tujuan-display, materi-section,
//   diskusi, refleksi, penutup, tabel-accord, rangkuman
//
// RENDERERS THAT USE THIS BOUNDARY (handlesCompression: false):
//   skenario, nc-grid, ftab, nk-card, motivasi, flashcard-set,
//   game blocks, cover, hero, hasil
//
// ═══════════════════════════════════════════════════════════════════

'use client';

import React from 'react';
import type { CompressionDecision } from './CompressionEngine';
import { CompressedBlockWrapper } from './CompressedBlockWrapper';

export interface CompressionBoundaryProps {
  /** Whether the block's renderer handles compression natively */
  handlesCompression: boolean;
  /** The compression decision from the layout engine */
  compression?: CompressionDecision;
  /** Block title for compression header */
  title?: string;
  /** Whether in compact (canvas) mode */
  isCompact?: boolean;
  /** The block content */
  children: React.ReactNode;
}

/**
 * CompressionBoundary — automatic compression wrapper for blocks.
 *
 * When a block has a compression decision but its renderer doesn't
 * handle compression natively, this boundary wraps the block in
 * CompressedBlockWrapper, providing:
 *   - accordion: headers only, expand/collapse
 *   - reveal-set: show N items, "Lihat lainnya"
 *   - collapsible: summary view, expand for detail
 *   - step-reveal: one step at a time, prev/next
 *
 * Blocks whose renderers DO handle compression natively pass through
 * without any wrapper — the renderer manages its own compression UI.
 */
export const CompressionBoundary = React.memo(function CompressionBoundary({
  handlesCompression,
  compression,
  title,
  isCompact = false,
  children,
}: CompressionBoundaryProps) {
  // No compression decision → pass through (no wrapper needed)
  if (!compression || !compression.isCompressed) {
    return <>{children}</>;
  }

  // Renderer handles compression natively → pass through
  // The renderer uses useBlockCompression internally
  if (handlesCompression) {
    return <>{children}</>;
  }

  // Renderer does NOT handle compression → wrap in CompressedBlockWrapper
  // This provides generic compression UI for any block type
  return (
    <CompressedBlockWrapper
      compression={compression}
      title={title}
      isCompact={isCompact}
    >
      {children}
    </CompressedBlockWrapper>
  );
});
