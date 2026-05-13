'use client';

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE PREVIEW THUMBNAIL — Miniature visual preview for templates
// ═══════════════════════════════════════════════════════════════════
// Renders a compact wireframe-style thumbnail showing the structure
// of a template's screens using colored rectangles and block icons.
// Uses the template's theme colors for visual identity.

import React from 'react';
import type { MarketplaceTemplate, PreviewScreenInfo } from '@/core/templates/marketplace-templates';
import { resolveTokens } from '@/core/themes/tokens';

// ── Block type → visual category ───────────────────────────────
type BlockCategory = 'cover' | 'content' | 'game' | 'navigation' | 'reflection';

function categorizeBlock(type: string): BlockCategory {
  if (type === 'cover') return 'cover';
  if (type.endsWith('-game') || type === 'kuis' || type === 'skenario') return 'game';
  if (type === 'refleksi' || type === 'diskusi') return 'reflection';
  if (type === 'petunjuk' || type === 'alur' || type === 'tp' || type === 'tujuan-display') return 'navigation';
  return 'content';
}

// ── Category → shape style ─────────────────────────────────────
const CATEGORY_STYLES: Record<BlockCategory, { height: string; opacity: number; radius: string }> = {
  cover: { height: '35%', opacity: 0.9, radius: '3px 3px 1px 1px' },
  content: { height: '16%', opacity: 0.5, radius: '2px' },
  game: { height: '20%', opacity: 0.65, radius: '2px' },
  navigation: { height: '10%', opacity: 0.35, radius: '2px' },
  reflection: { height: '14%', opacity: 0.45, radius: '1px 1px 3px 3px' },
};

// ── Resolve gradient to CSS string ─────────────────────────────
function resolveGradientCSS(colors: [string, string]): string {
  const tokens = resolveTokens('default');
  const colorMap: Record<string, string> = {
    y: tokens.colors.y,
    c: tokens.colors.c,
    r: tokens.colors.r,
    p: tokens.colors.p,
    g: tokens.colors.g,
    o: tokens.colors.o,
  };
  const c1 = colorMap[colors[0]] || colors[0];
  const c2 = colorMap[colors[1]] || colors[1];
  return `linear-gradient(135deg, ${c1}, ${c2})`;
}

// ── Resolve single token color ─────────────────────────────────
function resolveColor(token: string): string {
  const tokens = resolveTokens('default');
  const colorMap: Record<string, string> = {
    y: tokens.colors.y,
    c: tokens.colors.c,
    r: tokens.colors.r,
    p: tokens.colors.p,
    g: tokens.colors.g,
    o: tokens.colors.o,
  };
  return colorMap[token] || token;
}

// ── Screen wireframe block ──────────────────────────────────────
function ScreenBlock({
  screen,
  gradient,
  accentColor,
}: {
  screen: PreviewScreenInfo;
  gradient: string;
  accentColor: string;
}) {
  // Build mini wireframe blocks
  const blocks = screen.blocks.map((block, i) => {
    const category = categorizeBlock(block.type);
    const style = CATEGORY_STYLES[category];

    return (
      <div
        key={`sb-${i}`}
        className="relative flex items-center gap-0.5 px-1 overflow-hidden"
        style={{
          height: style.height,
          opacity: style.opacity,
          borderRadius: style.radius,
          background: category === 'cover'
            ? gradient
            : category === 'game'
              ? `${accentColor}33`
              : 'rgba(255,255,255,0.12)',
        }}
      >
        <span className="text-[6px] leading-none shrink-0" style={{ opacity: 0.8 }}>
          {block.icon}
        </span>
        {/* Text placeholder lines */}
        <div className="flex-1 flex flex-col gap-px py-0.5">
          <div
            className="h-px rounded-full"
            style={{
              width: `${50 + Math.random() * 30}%`,
              background: 'rgba(255,255,255,0.3)',
            }}
          />
          {category !== 'navigation' && (
            <div
              className="h-px rounded-full"
              style={{
                width: `${30 + Math.random() * 25}%`,
                background: 'rgba(255,255,255,0.15)',
              }}
            />
          )}
        </div>
      </div>
    );
  });

  return (
    <div className="flex flex-col gap-px w-full h-full">
      {blocks}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

interface TemplatePreviewThumbnailProps {
  template: MarketplaceTemplate;
  /** Width in pixels (default: 200) */
  width?: number;
  /** Height in pixels (default: 112 — ~16:9) */
  height?: number;
  /** Show template name overlay (default: true) */
  showName?: boolean;
  /** Show screen dots (default: true) */
  showDots?: boolean;
  /** Currently active screen index (for preview modal) */
  activeScreen?: number;
}

export default function TemplatePreviewThumbnail({
  template,
  width = 200,
  height = 112,
  showName = true,
  showDots = true,
  activeScreen = 0,
}: TemplatePreviewThumbnailProps) {
  const gradient = resolveGradientCSS(template.coverGradient);
  const accentColor = resolveColor(template.coverGradient[0]);
  const currentScreen = template.previewBlocks[activeScreen] || template.previewBlocks[0];

  return (
    <div
      className="relative rounded-lg overflow-hidden border border-white/10"
      style={{
        width,
        height,
        aspectRatio: `${width}/${height}`,
        background: 'rgba(0,0,0,0.4)',
      }}
    >
      {/* Screen wireframe */}
      <div className="absolute inset-0 p-1.5 flex items-stretch">
        <ScreenBlock
          screen={currentScreen}
          gradient={gradient}
          accentColor={accentColor}
        />
      </div>

      {/* Template name overlay */}
      {showName && (
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
          <div className="text-white text-[8px] font-bold truncate leading-tight">
            {template.name}
          </div>
        </div>
      )}

      {/* Screen dots */}
      {showDots && template.previewBlocks.length > 1 && (
        <div className="absolute top-1.5 right-1.5 flex gap-0.5">
          {template.previewBlocks.map((_, i) => (
            <div
              key={`dot-${i}`}
              className="rounded-full transition-all"
              style={{
                width: i === activeScreen ? 6 : 3,
                height: 3,
                background: i === activeScreen ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
              }}
            />
          ))}
        </div>
      )}

      {/* Subject badge */}
      <div
        className="absolute top-1.5 left-1.5 px-1 py-px rounded text-[6px] font-bold text-white/80"
        style={{ background: `${accentColor}55` }}
      >
        {template.subject}
      </div>
    </div>
  );
}
