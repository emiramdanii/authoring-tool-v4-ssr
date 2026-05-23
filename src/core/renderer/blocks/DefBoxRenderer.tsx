'use client';

import React, { useMemo, useCallback } from 'react';
import { BookOpen, Sparkles, ChevronDown } from 'lucide-react';
import type { DefBoxBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { RichText } from './RichText';
import { PremiumStepNavigator, usePremiumStepNavigator } from './PremiumStepNavigator';
import { PremiumBlockWrapper, ReadingProgressIndicator } from './PremiumBlockEffects';
import { useCanvaStore } from '../../../store/canva/store';
import { useBlockCompression } from '../../layout/useBlockCompression';
import type { CompressionDecision } from '../../layout/CompressionEngine';

// ═══════════════════════════════════════════════════════════════════
// DEF BOX RENDERER — BSNP Definition Box with Variants & Step Mode
// ═══════════════════════════════════════════════════════════════════
// Variants:
//   A "Klasik" — Clean card with left accent stripe, subtle fill
//   B "Kreatif" — Light card with left accent, softer rounded feel
//   C "Ringkas" — Pill-style badge, minimal padding
//
// Step Mode: When content is long (>200 chars) or has examples/sanctions,
//   splits into navigable steps: Definisi → Contoh → Sanksi
//
// All text/labels in Indonesian (Bahasa Indonesia).
// ═══════════════════════════════════════════════════════════════════

// ── Variant Selector ─────────────────────────────────────────────
function VariantSelector({
  active,
  onChange,
}: {
  active: 'A' | 'B' | 'C';
  onChange: (v: 'A' | 'B' | 'C') => void;
}) {
  const variants: Array<{ key: 'A' | 'B' | 'C'; label: string }> = [
    { key: 'A', label: 'Klasik' },
    { key: 'B', label: 'Kreatif' },
    { key: 'C', label: 'Ringkas' },
  ];

  return (
    <div className="variant-selector">
      {variants.map((v) => (
        <button
          key={v.key}
          className={`variant-pill ${active === v.key ? 'active' : ''}`}
          onClick={() => onChange(v.key)}
          aria-label={`Varian ${v.label}`}
          title={`Varian ${v.label}`}
          type="button"
        >
          {v.key}
        </button>
      ))}
    </div>
  );
}

// ── Step Mode Sub-component (Premium) ──────────────────────────────
function DefBoxStepMode({
  steps,
  tokens,
  isCompact,
  colorKey,
}: {
  steps: Array<{ label: string; content: string }>;
  tokens: TokenResolver;
  isCompact: boolean;
  colorKey: string;
}) {
  const totalSteps = steps.length;
  const { activeStep, ...nav } = usePremiumStepNavigator(totalSteps);

  const labels = steps.map((s) => s.label);
  const step = steps[activeStep];
  const progress = totalSteps <= 1 ? 1 : (activeStep + 1) / totalSteps;

  return (
    <div>
      <ReadingProgressIndicator
        progress={progress}
        tokens={tokens}
        accent={colorKey}
        height={isCompact ? 2 : 3}
        position="top"
      />
      <PremiumStepNavigator
        labels={labels}
        activeStep={activeStep}
        onStepChange={nav.goTo}
        tokens={tokens}
        accent={colorKey}
        isCompact={isCompact}
      >
        <div
          style={{
            padding: isCompact ? '10px 12px' : '13px 15px',
            maxHeight: isCompact ? '180px' : '300px',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              borderLeft: tokens.accentStripe(colorKey, isCompact ? 3 : 4),
              paddingLeft: isCompact ? '10px' : '12px',
              ...tokens.iosTypography('body', { fontSize: isCompact ? 12 : 15, color: tokens.color('text'), wordBreak: 'break-word', overflowWrap: 'break-word' }),
            }}
            dangerouslySetInnerHTML={{ __html: step.content }}
          />
        </div>
      </PremiumStepNavigator>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
export const DefBoxRenderer = React.memo(function DefBoxRenderer({ block, tokens, isCompact, isEditing, compression }: {
  block: DefBoxBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean; compression?: CompressionDecision;
}) {
  const colorKey = block.borderColor || 'y';
  const variant: 'A' | 'B' | 'C' = (block.variant as 'A' | 'B' | 'C') || 'A';

  const updateSchemaBlock = useCanvaStore((s) => s.updateSchemaBlock);
  const handleVariantChange = useCallback((v: 'A' | 'B' | 'C') => {
    if (block.id) updateSchemaBlock(block.id, { variant: v });
  }, [block.id, updateSchemaBlock]);

  // ── Inline editing hooks ─────────────────────────────────────
  const contentEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'content',
    value: block.content ?? '',
    tag: 'span',
    allowHtml: true,  // DefBox content often contains <strong>, <em>, <br/> from schema
  });

  // ── Compression-aware visibility (collapsible strategy) ──────
  // DefBox compression works differently from item-based blocks.
  // When compressed with 'collapsible', the content is truncated
  // and a "Selengkapnya" button is shown to expand.
  const { isCompressed, isExpanded, showMore: expandContent } = useBlockCompression({
    compression,
    totalItems: 1, // DefBox is a single content unit, not a list
  });
  const isContentCollapsed = isCompressed && !isExpanded;

  // ── Step detection ───────────────────────────────────────────
  // DefBoxBlock doesn't have examples/sanctions fields in the type.
  // If content > 200 chars, split into "Definisi" and "Penjelasan" steps.
  const shouldUseStepMode = (block.content?.length ?? 0) > 200;

  const steps = useMemo(() => {
    if (!shouldUseStepMode) return [];
    const content = block.content ?? '';
    const mid = Math.floor(content.length / 2);
    // Try to split at the nearest sentence boundary
    const splitIdx = content.indexOf('.', mid);
    const cutPoint = splitIdx > 0 && splitIdx < mid + 80 ? splitIdx + 1 : mid;
    return [
      { label: 'Definisi', content: content.slice(0, cutPoint).trim() },
      { label: 'Penjelasan', content: content.slice(cutPoint).trim() },
    ];
  }, [block.content, shouldUseStepMode]);

  // ── Variant A "Klasik" — Clean card with left accent stripe, subtle fill ──
  if (variant === 'A') {
    return (
      <PremiumBlockWrapper tokens={tokens} accent={colorKey} staggerIndex={0}>
      <ReadingProgressIndicator progress={1} tokens={tokens} accent={colorKey} height={2} position="top" />
        <div style={{ position: 'relative' }}>
          {isEditing && (
            <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 45 }}>
              <VariantSelector active={variant} onChange={handleVariantChange} />
            </div>
          )}
        <div
          style={{
            background: tokens.accentBg(colorKey, 0.04),
            borderLeft: tokens.accentStripe(colorKey, 3),
            borderRight: `1px solid ${tokens.subtleBorder(0.06)}`,
            borderTop: `1px solid ${tokens.subtleBorder(0.06)}`,
            borderBottom: `1px solid ${tokens.subtleBorder(0.06)}`,
            borderRadius: tokens.radius('lg'),
            boxShadow: tokens.iosShadow('whisper'),
            overflow: 'hidden',
          }}
        >
          {/* Icon row */}
          <div style={{ ...tokens.iosCardPadding(isCompact) }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: tokens.colorAlpha(colorKey, 0.12) }}>
                <BookOpen size={10} className="inline" style={{ color: tokens.accentText(colorKey) }} />
              </div>
              <span
                style={{
                  ...tokens.iosTypography('caption2', { color: tokens.accentText(colorKey), textTransform: 'uppercase' }),
                }}
              >
                Definisi
              </span>
            </div>

            {/* Content — step mode or inline */}
            {/* When compressed with 'collapsible': truncate content and show expand button */}
            {shouldUseStepMode && !isContentCollapsed ? (
              <DefBoxStepMode
                steps={steps}
                tokens={tokens}
                isCompact={isCompact}
                colorKey={colorKey}
              />
            ) : (
              <div style={{
                borderLeft: tokens.accentStripe(colorKey, isCompact ? 3 : 4),
                paddingLeft: isCompact ? '10px' : '12px',
                ...tokens.iosTypography('body', { fontSize: isCompact ? 12 : 15, color: tokens.color('text'), wordBreak: 'break-word', overflowWrap: 'break-word' }),
                maxHeight: isContentCollapsed ? (isCompact ? '60px' : '80px') : undefined,
                overflow: isContentCollapsed ? 'hidden' : undefined,
                transition: 'max-height 0.3s ease-out',
                position: 'relative',
              }}>
                <InlineTextEditor
                  {...contentEditor}
                  className={isCompact ? 'canvas-truncate-3' : ''}
                  style={{ fontSize: 'inherit', lineHeight: 'inherit', color: 'inherit' }}
                  allowHtml={true}
                />
                {/* Fade-out gradient when collapsed */}
                {isContentCollapsed && (
                  <div
                    className="absolute bottom-0 left-0 right-0 pointer-events-none"
                    style={{
                      height: 30,
                      background: `linear-gradient(transparent, ${tokens.accentBg(colorKey, 0.04)})`,
                    }}
                  />
                )}
              </div>
            )}
            {/* Collapsible expand button */}
            {isContentCollapsed && (
              <button
                onClick={expandContent}
                className={`flex items-center justify-center gap-1 w-full py-1.5 mt-1 rounded-b-lg ${tokens.iosExpandTw()}`}
                style={{
                  background: tokens.accentBg(colorKey, 0.06),
                  ...tokens.iosTypography('caption2', { color: tokens.accentText(colorKey), cursor: 'pointer', border: 'none' }),
                }}
              >
                <ChevronDown size={isCompact ? 10 : 12} />
                Selengkapnya
              </button>
            )}
          </div>
        </div>
      </div>
      </PremiumBlockWrapper>
    );
  }

  // ── Variant B "Kreatif" — Light card with left accent, softer rounded feel ──
  if (variant === 'B') {
    return (
      <PremiumBlockWrapper tokens={tokens} accent={colorKey} staggerIndex={0}>
        <ReadingProgressIndicator progress={1} tokens={tokens} accent={colorKey} height={2} position="top" />
        <div style={{ position: 'relative' }}>
          {isEditing && (
            <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 45 }}>
              <VariantSelector active={variant} onChange={handleVariantChange} />
            </div>
          )}
        <div
          style={{
            background: tokens.accentBg(colorKey, 0.04),
            borderLeft: tokens.accentStripe(colorKey, 3),
            borderRight: `1px solid ${tokens.subtleBorder(0.06)}`,
            borderTop: `1px solid ${tokens.subtleBorder(0.06)}`,
            borderBottom: `1px solid ${tokens.subtleBorder(0.06)}`,
            borderRadius: tokens.radius('xl'),
            boxShadow: tokens.iosShadow('whisper'),
            ...tokens.iosCardPadding(isCompact),
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle floating icon — lighter feel */}
          <div
            style={{
              position: 'absolute',
              top: isCompact ? '8px' : '12px',
              right: isCompact ? '8px' : '12px',
              width: isCompact ? '32px' : '40px',
              height: isCompact ? '32px' : '40px',
              borderRadius: '50%',
              background: tokens.colorAlpha(colorKey, 0.08),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <Sparkles
              size={isCompact ? 14 : 18}
              style={{ color: tokens.accentText(colorKey), opacity: 0.5 }}
            />
          </div>

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: tokens.colorAlpha(colorKey, 0.12),
                }}
              >
                <BookOpen size={12} style={{ color: tokens.accentText(colorKey) }} />
              </div>
              <span
                style={{
                  ...tokens.iosTypography('caption2', { color: tokens.accentText(colorKey), textTransform: 'uppercase' }),
                }}
              >
                Definisi
              </span>
            </div>

            {shouldUseStepMode && !isContentCollapsed ? (
              <DefBoxStepMode
                steps={steps}
                tokens={tokens}
                isCompact={isCompact}
                colorKey={colorKey}
              />
            ) : (
              <div
                style={{
                  ...tokens.iosTypography('body', { fontSize: isCompact ? 12 : 15, color: tokens.color('text'), wordBreak: 'break-word', overflowWrap: 'break-word' }),
                  paddingLeft: isCompact ? '8px' : '12px',
                  borderLeft: tokens.accentStripe(colorKey, 3),
                  maxHeight: isContentCollapsed ? (isCompact ? '60px' : '80px') : undefined,
                  overflow: isContentCollapsed ? 'hidden' : undefined,
                  transition: 'max-height 0.3s ease-out',
                  position: 'relative',
                }}
              >
                <InlineTextEditor
                  {...contentEditor}
                  className={isCompact ? 'canvas-truncate-3' : ''}
                  style={{ fontSize: 'inherit', lineHeight: 'inherit', color: 'inherit' }}
                  allowHtml={true}
                />
                {isContentCollapsed && (
                  <div className="absolute bottom-0 left-0 right-0 pointer-events-none"
                    style={{ height: 30, background: `linear-gradient(transparent, ${tokens.accentBg(colorKey, 0.04)})` }} />
                )}
              </div>
            )}
            {isContentCollapsed && (
              <button onClick={expandContent}
                className={`flex items-center justify-center gap-1 w-full py-1.5 mt-1 rounded-b-lg ${tokens.iosExpandTw()}`}
                style={{ background: tokens.accentBg(colorKey, 0.06), ...tokens.iosTypography('caption2', { color: tokens.accentText(colorKey), cursor: 'pointer', border: 'none' }) }}>
                <ChevronDown size={isCompact ? 10 : 12} /> Selengkapnya
              </button>
            )}
          </div>
        </div>
      </div>
      </PremiumBlockWrapper>
    );
  }

  // ── Variant C "Ringkas" — Pill-style badge, minimal padding ──
  return (
    <PremiumBlockWrapper tokens={tokens} accent={colorKey} staggerIndex={0}>
      <ReadingProgressIndicator progress={1} tokens={tokens} accent={colorKey} height={2} position="top" />
      <div style={{ position: 'relative' }}>
        {isEditing && (
        <div style={{ position: 'absolute', top: '4px', right: '4px', zIndex: 45 }}>
          <VariantSelector active={variant} onChange={handleVariantChange} />
        </div>
      )}
      <div
        className="flex items-start gap-2"
        style={{
          padding: isCompact ? '6px 10px' : '8px 14px',
          borderRadius: tokens.radius('lg'),
          background: tokens.accentBg(colorKey, 0.04),
          borderLeft: tokens.accentStripe(colorKey, 3),
          borderRight: `1px solid ${tokens.subtleBorder(0.06)}`,
          borderTop: `1px solid ${tokens.subtleBorder(0.06)}`,
          borderBottom: `1px solid ${tokens.subtleBorder(0.06)}`,
        }}
      >
        <div
          className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: tokens.colorAlpha(colorKey, 0.12) }}
        >
          <BookOpen size={9} style={{ color: tokens.accentText(colorKey) }} />
        </div>
        <div className="min-w-0 flex-1">
          <span
            style={{
              ...tokens.iosTypography('caption2', { fontSize: isCompact ? 9 : 10, color: tokens.accentText(colorKey), textTransform: 'uppercase' }),
            }}
          >
            Definisi
          </span>
          <div
            style={{
              ...tokens.iosTypography('body', { fontSize: isCompact ? 12 : 15, color: tokens.color('text'), wordBreak: 'break-word', overflowWrap: 'break-word' }),
              maxHeight: isContentCollapsed ? (isCompact ? '40px' : '50px') : undefined,
              overflow: isContentCollapsed ? 'hidden' : undefined,
              transition: 'max-height 0.3s ease-out',
              position: 'relative',
            }}
          >
            <InlineTextEditor
              {...contentEditor}
              className={isCompact ? 'canvas-truncate-3' : ''}
              style={{ fontSize: 'inherit', lineHeight: 'inherit', color: 'inherit' }}
              allowHtml={true}
            />
            {isContentCollapsed && (
              <div className="absolute bottom-0 left-0 right-0 pointer-events-none"
                style={{ height: 20, background: `linear-gradient(transparent, ${tokens.accentBg(colorKey, 0.04)})` }} />
            )}
          </div>
          {isContentCollapsed && (
            <button onClick={expandContent}
              className={`flex items-center justify-center gap-0.5 w-full py-1 mt-0.5 rounded-b-lg ${tokens.iosExpandTw()}`}
              style={{ background: tokens.accentBg(colorKey, 0.06), ...tokens.iosTypography('caption2', { fontSize: isCompact ? 8 : 9, color: tokens.accentText(colorKey), cursor: 'pointer', border: 'none' }) }}>
              <ChevronDown size={8} /> Selengkapnya
            </button>
          )}
        </div>
      </div>
    </div>
    </PremiumBlockWrapper>
  );
});
