// ═══════════════════════════════════════════════════════════════════════
// BLOCK SKELETON — Content-shaped loading placeholder for lazy blocks
// ═══════════════════════════════════════════════════════════════════════
// Uses the iOS Visual Contract shimmer animation from globals.css
// to provide content-shaped skeletons per block type while React.lazy()
// chunks are being loaded. This replaces the old animate-pulse empty div
// with a visually informative placeholder that matches block geometry.
//
// DESIGN: iOS/Notion aesthetic — soft, light, no jarring animations.
// The shimmer is a gentle sweeping highlight (200% → -200%) that
// communicates "loading" without being distracting.
// ═══════════════════════════════════════════════════════════════════════

'use client';

import React from 'react';

// ── Skeleton type shapes ────────────────────────────────────────
// Each block type has a distinct geometric signature that users
// learn to recognize. The skeleton mimics this shape so the layout
// doesn't shift when the real content loads.

type SkeletonVariant =
  | 'card'       // def-box, nc-grid, nk-card, checklist, etc.
  | 'fullpage'   // cover, hero
  | 'tabs'       // ftab
  | 'composite'  // materi-section
  | 'game'       // all *-game blocks
  | 'text'       // petunjuk, alur, skenario, tujuan-display, etc.
  | 'interactive'// kuis, diskusi, refleksi
  | 'table'      // tabel, tabel-accord
  | 'media';     // gambar, timeline

function getVariant(blockType: string): SkeletonVariant {
  if (blockType === 'cover' || blockType === 'hero') return 'fullpage';
  if (blockType === 'ftab') return 'tabs';
  if (blockType === 'materi-section') return 'composite';
  if (blockType.endsWith('-game')) return 'game';
  if (blockType === 'kuis' || blockType === 'diskusi' || blockType === 'refleksi') return 'interactive';
  if (blockType === 'tabel' || blockType === 'tabel-accord') return 'table';
  if (blockType === 'gambar' || blockType === 'timeline') return 'media';
  if (blockType === 'def-box' || blockType === 'nc-grid' || blockType === 'nk-card'
    || blockType === 'checklist' || blockType === 'rangkuman' || blockType === 'statistik'
    || blockType === 'studi' || blockType === 'compare' || blockType === 'reveal'
    || blockType === 'flashcard-set' || blockType === 'materi-blok') return 'card';
  return 'text';
}

// ── Shimmer bar helper ──────────────────────────────────────────
// A single shimmer bar — mimics a line of text or a UI element.

function ShimmerBar({ width = '100%', height = '12px', className = '' }: {
  width?: string;
  height?: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-sm ${className}`}
      style={{
        width,
        height,
        background: 'linear-gradient(90deg, rgba(15,23,42,0.04) 25%, rgba(15,23,42,0.08) 50%, rgba(15,23,42,0.04) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.8s ease-in-out infinite',
      }}
    />
  );
}

// ── Variant skeletons ───────────────────────────────────────────

function FullpageSkeleton() {
  return (
    <div className="w-full rounded-xl overflow-hidden" style={{ aspectRatio: '16/9', background: 'rgba(15,23,42,0.02)' }}>
      <div className="flex flex-col items-center justify-center h-full gap-3 p-8">
        <ShimmerBar width="60%" height="28px" />
        <ShimmerBar width="40%" height="16px" />
        <ShimmerBar width="30%" height="12px" />
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.6)' }}>
      <div className="flex flex-col gap-2.5">
        <ShimmerBar width="45%" height="14px" />
        <ShimmerBar width="100%" height="12px" />
        <ShimmerBar width="90%" height="12px" />
        <ShimmerBar width="75%" height="12px" />
      </div>
    </div>
  );
}

function TabsSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.6)' }}>
      {/* Tab bar */}
      <div className="flex gap-2 p-3 border-b" style={{ borderColor: 'rgba(15,23,42,0.06)' }}>
        <ShimmerBar width="64px" height="28px" className="rounded-full" />
        <ShimmerBar width="72px" height="28px" className="rounded-full" />
        <ShimmerBar width="56px" height="28px" className="rounded-full" />
      </div>
      {/* Tab content */}
      <div className="p-4 flex flex-col gap-2">
        <ShimmerBar width="100%" height="12px" />
        <ShimmerBar width="85%" height="12px" />
        <ShimmerBar width="70%" height="12px" />
      </div>
    </div>
  );
}

function CompositeSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.6)' }}>
      {/* Section header */}
      <div className="p-4 border-b" style={{ borderColor: 'rgba(15,23,42,0.06)' }}>
        <ShimmerBar width="50%" height="16px" />
      </div>
      {/* Content blocks */}
      <div className="p-4 flex flex-col gap-3">
        <div className="p-3 rounded-lg" style={{ background: 'rgba(15,23,42,0.02)' }}>
          <ShimmerBar width="40%" height="12px" />
          <div className="mt-2">
            <ShimmerBar width="100%" height="10px" />
          </div>
        </div>
        <div className="p-3 rounded-lg" style={{ background: 'rgba(15,23,42,0.02)' }}>
          <ShimmerBar width="35%" height="12px" />
          <div className="mt-2">
            <ShimmerBar width="90%" height="10px" />
          </div>
        </div>
      </div>
    </div>
  );
}

function GameSkeleton() {
  return (
    <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.6)' }}>
      {/* Game title */}
      <div className="flex items-center gap-2 mb-4">
        <ShimmerBar width="36px" height="36px" className="rounded-lg" />
        <ShimmerBar width="40%" height="16px" />
      </div>
      {/* Game area */}
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg"
            style={{
              aspectRatio: '2/1',
              background: 'rgba(15,23,42,0.03)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.8s ease-in-out infinite',
              animationDelay: `${i * 150}ms`,
            }}
          />
        ))}
      </div>
      {/* Score bar */}
      <div className="mt-4 flex items-center gap-2">
        <ShimmerBar width="80px" height="20px" className="rounded-full" />
        <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(15,23,42,0.04)' }} />
      </div>
    </div>
  );
}

function InteractiveSkeleton() {
  return (
    <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.6)' }}>
      <ShimmerBar width="55%" height="14px" />
      <div className="mt-3 flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(15,23,42,0.02)' }}>
            <ShimmerBar width="18px" height="18px" className="rounded-full" />
            <ShimmerBar width={`${70 - i * 10}%`} height="12px" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.6)' }}>
      {/* Header row */}
      <div className="flex gap-0 border-b" style={{ borderColor: 'rgba(15,23,42,0.06)' }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex-1 p-3">
            <ShimmerBar width="60%" height="12px" />
          </div>
        ))}
      </div>
      {/* Data rows */}
      {[1, 2, 3].map(row => (
        <div key={row} className="flex gap-0 border-b" style={{ borderColor: 'rgba(15,23,42,0.03)' }}>
          {[1, 2, 3].map(col => (
            <div key={col} className="flex-1 p-3">
              <ShimmerBar width={`${50 + Math.random() * 30}%`} height="10px" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function MediaSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.6)' }}>
      {/* Image placeholder */}
      <div
        className="w-full"
        style={{
          aspectRatio: '16/9',
          background: 'rgba(15,23,42,0.04)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.8s ease-in-out infinite',
        }}
      />
      {/* Caption */}
      <div className="p-3">
        <ShimmerBar width="50%" height="10px" />
      </div>
    </div>
  );
}

function TextSkeleton() {
  return (
    <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.6)' }}>
      <div className="flex flex-col gap-2">
        <ShimmerBar width="70%" height="14px" />
        <ShimmerBar width="100%" height="10px" />
        <ShimmerBar width="95%" height="10px" />
        <ShimmerBar width="80%" height="10px" />
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────

export interface BlockSkeletonProps {
  /** Block type to determine skeleton shape */
  blockType: string;
  /** Optional className for outer wrapper */
  className?: string;
}

/**
 * Content-shaped skeleton placeholder for lazy-loaded block renderers.
 *
 * Uses the iOS Visual Contract shimmer animation (from globals.css)
 * to show a block-type-specific loading placeholder while the
 * React.lazy() chunk is being downloaded.
 *
 * Replaces the old generic animate-pulse div with a visually
 * informative placeholder that:
 *   1. Matches the block's geometric signature
 *   2. Prevents layout shift when content loads
 *   3. Communicates loading state without jarring animations
 */
export function BlockSkeleton({ blockType, className = '' }: BlockSkeletonProps) {
  const variant = getVariant(blockType);

  const skeletons: Record<SkeletonVariant, React.ReactNode> = {
    fullpage: <FullpageSkeleton />,
    card: <CardSkeleton />,
    tabs: <TabsSkeleton />,
    composite: <CompositeSkeleton />,
    game: <GameSkeleton />,
    interactive: <InteractiveSkeleton />,
    table: <TableSkeleton />,
    media: <MediaSkeleton />,
    text: <TextSkeleton />,
  };

  return (
    <div
      className={`block-skeleton ${className}`}
      role="status"
      aria-label={`Memuat blok ${blockType}`}
      aria-busy="true"
    >
      {skeletons[variant]}
      {/* Screen reader announcement */}
      <span className="sr-only">Memuat konten...</span>
    </div>
  );
}

export default BlockSkeleton;
