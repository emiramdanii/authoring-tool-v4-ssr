'use client';

// ═══════════════════════════════════════════════════════════════════
// HOTSPOT IMAGE RENDERER — Sprint 8.8B / 3B
// ═══════════════════════════════════════════════════════════════════
// Renders an image with interactive hotspot buttons. Clicking a hotspot
// opens a card with title + body (plain text, NOT dangerouslySetInnerHTML).
//
// Per HOTSPOT-IMAGE-CONTRACT.md Patch-1:
// - Hotspot positions are percentage-based (0–100)
// - body is plain text rendered via {block.body} (React auto-escapes)
// - javascript: URLs are rejected at render time
// - Keyboard accessible: Tab to navigate, Enter/Space to open, Esc to close
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useEffect } from 'react';
import type { TokenResolver } from '../types';
import type { HotspotImageBlock } from '@/core/schema/types/blocks';

interface HotspotImageRendererProps {
  block: HotspotImageBlock;
  tokens: TokenResolver;
  interactive?: boolean;
  isCompact?: boolean;
  isEditing?: boolean;
  pageIndex?: number;
}

export const HotspotImageRenderer = React.memo(function HotspotImageRenderer({
  block,
  tokens,
  interactive = true,
  isCompact = false,
}: HotspotImageRendererProps) {
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  const accentColor = block.accentColor || 'y';
  const title = block.title || '';
  const imageUrl = block.image?.url || '';
  const imageAlt = block.image?.alt || title || 'Gambar hotspot';
  const hotspots: NonNullable<HotspotImageBlock['hotspots']> = block.hotspots || [];
  // Sprint 8.8B: use tokens directly — simpler than edu() for this renderer
  const stripeWidth = 4;

  // Security: reject javascript: URLs at render time
  const safeImageUrl = imageUrl && !imageUrl.toLowerCase().trim().startsWith('javascript:')
    ? imageUrl
    : '';

  // Esc handler
  useEffect(() => {
    if (!activeHotspot) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setActiveHotspot(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [activeHotspot]);

  const handleHotspotClick = useCallback((id: string) => {
    setActiveHotspot(prev => prev === id ? null : id);
  }, []);

  const handleHotspotKeyDown = useCallback((e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleHotspotClick(id);
    }
  }, [handleHotspotClick]);

  const activeHs = hotspots.find((h: typeof hotspots[number]) => h.id === activeHotspot);
  const activeColor = activeHs?.color || accentColor;

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        border: `1px solid ${tokens.colorAlpha(accentColor, 0.15)}`,
      }}
    >
      {/* Title */}
      {title && (
        <div className="px-4 pt-3 pb-1" style={{ fontSize: '14px', fontWeight: 700 }}>
          {title}
        </div>
      )}

      {/* Image container */}
      <div className="relative" style={{ minHeight: isCompact ? 200 : 300 }}>
        {safeImageUrl ? (
          <img
            src={safeImageUrl}
            alt={imageAlt}
            className="w-full h-auto block"
            style={{ maxHeight: isCompact ? 300 : 500, objectFit: 'contain' }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div
            className="flex items-center justify-center w-full h-full"
            style={{
              minHeight: isCompact ? 200 : 300,
              background: tokens.colorAlpha(accentColor, 0.05),
              color: tokens.colorAlpha(accentColor, 0.4),
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>
              {imageUrl ? 'broken_image' : 'image'}
            </span>
          </div>
        )}

        {/* Hotspot buttons */}
        {hotspots.map((hs: typeof hotspots[number], idx: number) => {
          const hsColor = hs.color || accentColor;
          const isActive = activeHotspot === hs.id;
          return (
            <button
              key={hs.id || idx}
              onClick={() => interactive && handleHotspotClick(hs.id)}
              onKeyDown={(e) => interactive && handleHotspotKeyDown(e, hs.id)}
              className="absolute flex items-center justify-center rounded-full font-bold transition-all duration-200"
              style={{
                left: `${hs.x}%`,
                top: `${hs.y}%`,
                transform: 'translate(-50%, -50%)',
                width: '32px',
                height: '32px',
                fontSize: '13px',
                background: isActive ? tokens.color(hsColor) : tokens.colorAlpha(hsColor, 0.85),
                color: tokens.color('bg'),
                border: `2px solid ${tokens.color('bg')}`,
                boxShadow: isActive ? `0 0 0 4px ${tokens.colorAlpha(hsColor, 0.3)}` : '0 2px 8px rgba(0,0,0,0.2)',
                cursor: interactive ? 'pointer' : 'default',
                zIndex: isActive ? 20 : 10,
              }}
              role="button"
              tabIndex={interactive ? 0 : -1}
              aria-label={`${hs.label}${hs.title ? ': ' + hs.title : ''}`}
              aria-expanded={isActive}
            >
              {hs.icon || hs.label}
            </button>
          );
        })}
      </div>

      {/* Card / popover for active hotspot */}
      {activeHs && (
        <div
          className="px-4 py-3 mx-4 mb-4 rounded-xl"
          style={{
            background: tokens.colorAlpha(activeColor, 0.06),
            border: `1px solid ${tokens.colorAlpha(activeColor, 0.2)}`,
            borderLeft: `${stripeWidth}px solid ${tokens.color(activeColor)}`,
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {activeHs.icon && <span style={{ fontSize: '18px' }}>{activeHs.icon}</span>}
              {activeHs.title && (
                <span className="font-extrabold truncate" style={{ fontSize: '13px', color: tokens.color(activeColor), fontWeight: 800 }}>
                  {activeHs.title}
                </span>
              )}
            </div>
            <button
              onClick={() => setActiveHotspot(null)}
              className="shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
              aria-label="Tutup"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
            </button>
          </div>
          {activeHs.body && (
            // Sprint 8.8B: body is PLAIN TEXT — React auto-escapes via {activeHs.body}.
            // NO dangerouslySetInnerHTML. Per HOTSPOT-IMAGE-CONTRACT.md security locks.
            <p className="mt-1.5 leading-relaxed" style={{ fontSize: '13px', lineHeight: '1.6' }}>
              {activeHs.body}
            </p>
          )}
        </div>
      )}
    </div>
  );
});
