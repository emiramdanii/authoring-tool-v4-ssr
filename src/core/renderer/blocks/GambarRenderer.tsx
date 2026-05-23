'use client';

import React, { useState, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import type { GambarBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';
import { RichText } from './RichText';
import type { CompressionDecision } from '../../layout/CompressionEngine';

// ═══════════════════════════════════════════════════════════════════
// GAMBAR RENDERER — Premium Image Block for Materi Section
// ═══════════════════════════════════════════════════════════════════
// Renders an image with premium styling:
//   - Rounded corners and shadow
//   - Caption below the image
//   - Placeholder with icon if URL is invalid/empty
//   - Title above if present
//
// All text/labels in Indonesian (Bahasa Indonesia).
// ═══════════════════════════════════════════════════════════════════

function isValidUrl(url: string): boolean {
  if (!url || url.trim() === '') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export const GambarRenderer = React.memo(function GambarRenderer({ block, tokens, isCompact, isEditing, compression }: {
  block: GambarBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean; compression?: CompressionDecision;
}) {
  const colorKey = block.accentColor || 'c';
  const accentColor = tokens.color(colorKey);
  const accentAlpha = (a: number) => tokens.colorAlpha(colorKey, a);

  const [hasError, setHasError] = useState(false);
  // Reset error state when URL changes so new URL gets a chance to load
  useEffect(() => { setHasError(false); }, [block.url]);
  const showImage = isValidUrl(block.url) && !hasError;

  return (
    <PremiumBlockWrapper tokens={tokens} accent={colorKey} staggerIndex={0} gradientBorder>
      <ReadingProgressIndicator progress={1} tokens={tokens} accent={colorKey} height={2} position="top" />
      <div
        className="rounded-xl overflow-hidden premium-card-glow"
        style={{
          background: tokens.colorAlpha(colorKey, 0.06),
          border: `1px solid ${accentAlpha(0.2)}`,
          boxShadow: tokens.raw.shadow.card,
        }}
      >
        {/* Top accent bar */}
        <div
          className="h-1"
          style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentAlpha(0.4)})` }}
        />

        <div style={{ ...tokens.iosSectionPadding(isCompact) }}>
          {/* Header row with badge */}
          <div className="flex items-center gap-2 mb-3">
            <MicroInteraction tokens={tokens} accent={colorKey} effect="glow">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: accentAlpha(0.2) }}
              >
                <ImageIcon size={10} style={{ color: accentColor }} />
              </div>
            </MicroInteraction>
            <PremiumBadge tokens={tokens} accent={colorKey} variant="glass">
              Gambar
            </PremiumBadge>
          </div>

          {/* Title */}
          {block.title && (
            <div
              className="font-extrabold mb-3"
              style={{
                fontFamily: tokens.fontFamily('display'),
                fontSize: isCompact ? '13px' : '15px',
                color: tokens.color('text'),
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              <RichText content={block.title} />
            </div>
          )}

          {/* Image or placeholder */}
          {showImage ? (
            <div
              style={{
                borderRadius: tokens.radius('lg') + 'px',
                overflow: 'hidden',
                boxShadow: tokens.raw.shadow.card,
                border: `1px solid ${accentAlpha(0.12)}`,
              }}
            >
              <img
                src={block.url}
                alt={block.caption || block.title || 'Gambar materi'}
                style={{
                  width: '100%',
                  maxHeight: isCompact ? '200px' : '320px',
                  objectFit: 'cover',
                  display: 'block',
                }}
                onError={() => setHasError(true)}
              />
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center gap-2"
              style={{
                borderRadius: tokens.radius('lg') + 'px',
                background: accentAlpha(0.06),
                border: `2px dashed ${accentAlpha(0.25)}`,
                ...tokens.iosContentPadding(isCompact),
                minHeight: isCompact ? '100px' : '140px',
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: isCompact ? '32px' : '44px',
                  height: isCompact ? '32px' : '44px',
                  borderRadius: '50%',
                  background: accentAlpha(0.12),
                }}
              >
                <ImageIcon
                  size={isCompact ? 16 : 22}
                  style={{ color: accentAlpha(0.5) }}
                />
              </div>
              <span
                style={{
                  fontSize: isCompact ? '10px' : '12px',
                  color: tokens.muted(0.5),
                  fontWeight: 600,
                }}
              >
                Belum ada gambar
              </span>
            </div>
          )}

          {/* Caption */}
          {block.caption && (
            <div
              className="mt-2 text-center"
              style={{
                fontSize: isCompact ? '10px' : '12px',
                color: tokens.muted(0.7),
                fontStyle: 'italic',
                lineHeight: 1.5,
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              <RichText content={block.caption} />
            </div>
          )}
        </div>
      </div>
    </PremiumBlockWrapper>
  );
});
