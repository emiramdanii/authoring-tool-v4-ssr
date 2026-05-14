'use client';

import React, { useMemo, useCallback } from 'react';
import { BookOpen, Sparkles, ChevronDown } from 'lucide-react';
import type { DefBoxBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { RichText } from './RichText';
import { PremiumStepNavigator, usePremiumStepNavigator } from './PremiumStepNavigator';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';
import { useCanvaStore } from '../../../store/canva/store';
import { useBlockCompression } from '../../layout/useBlockCompression';
import type { CompressionDecision } from '../../layout/CompressionEngine';

// ═══════════════════════════════════════════════════════════════════
// DEF BOX RENDERER — BSNP Definition Box with Variants & Step Mode
// ═══════════════════════════════════════════════════════════════════
// Variants:
//   A "Klasik" — Current style (accent bar top, left border, clean)
//   B "Kreatif" — Glassmorphism card with gradient border, floating icon
//   C "Ringkas" — Ultra-compact pill/badge style, minimal vertical space
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
  const borderColor = tokens.color(colorKey);
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
              borderLeft: `${isCompact ? 3 : 4}px solid ${borderColor}`,
              paddingLeft: isCompact ? '10px' : '12px',
              fontSize: isCompact ? '12px' : '14.5px',
              lineHeight: 1.7,
              color: tokens.color('text'),
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}
            dangerouslySetInnerHTML={{ __html: step.content }}
          />
        </div>
      </PremiumStepNavigator>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
export function DefBoxRenderer({ block, tokens, isCompact, isEditing, compression }: {
  block: DefBoxBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean; compression?: CompressionDecision;
}) {
  const colorKey = block.borderColor || 'y';
  const borderColor = tokens.color(colorKey);
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

  // ── Variant A "Klasik" ──────────────────────────────────────
  if (variant === 'A') {
    return (
      <PremiumBlockWrapper tokens={tokens} accent={colorKey} staggerIndex={0} gradientBorder>
      <ReadingProgressIndicator progress={1} tokens={tokens} accent={colorKey} height={2} position="top" />
        <div style={{ position: 'relative' }}>
          {isEditing && (
            <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 45 }}>
              <VariantSelector active={variant} onChange={handleVariantChange} />
            </div>
          )}
        <div
          className="rounded-xl overflow-hidden premium-card-glow"
            style={{
              background: tokens.colorAlpha(colorKey, 0.08),
              border: '1px solid ' + tokens.colorAlpha(colorKey, 0.25),
              boxShadow: tokens.raw.shadow.card,
            }}
          >
          {/* Top accent bar */}
          <div className="h-1.5"
            style={{ background: `linear-gradient(90deg, ${borderColor}, ${tokens.colorAlpha(colorKey, 0.4)})` }} />

          {/* Icon row */}
          <div style={{ padding: isCompact ? '10px 12px' : '13px 15px' }}>
            <div className="flex items-center gap-2 mb-2">
              <MicroInteraction tokens={tokens} accent={colorKey} effect="glow">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: tokens.colorAlpha(colorKey, 0.2) }}>
                <BookOpen size={10} className="inline" style={{ color: borderColor }} />
              </div>
              </MicroInteraction>
              <PremiumBadge tokens={tokens} accent={colorKey} variant="glass">
                Definisi
              </PremiumBadge>
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
                borderLeft: `${isCompact ? 3 : 4}px solid ${borderColor}`,
                paddingLeft: isCompact ? '10px' : '12px',
                fontSize: isCompact ? '12px' : '14.5px',
                lineHeight: 1.7,
                color: tokens.color('text'),
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
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
                      background: 'linear-gradient(transparent, rgba(15, 23, 42, 0.85))',
                    }}
                  />
                )}
              </div>
            )}
            {/* Collapsible expand button */}
            {isContentCollapsed && (
              <button
                onClick={expandContent}
                className="flex items-center justify-center gap-1 w-full py-1.5 mt-1 rounded-b-lg transition-colors"
                style={{
                  background: tokens.colorAlpha(colorKey, 0.08),
                  color: tokens.color(colorKey),
                  fontSize: isCompact ? '9px' : '11px',
                  cursor: 'pointer',
                  fontWeight: 700,
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

  // ── Variant B "Kreatif" — Glassmorphism card ────────────────
  if (variant === 'B') {
    return (
      <PremiumBlockWrapper tokens={tokens} accent={colorKey} staggerIndex={0} glass gradientBorder>
        <ReadingProgressIndicator progress={1} tokens={tokens} accent={colorKey} height={2} position="top" />
        <div style={{ position: 'relative' }}>
          {isEditing && (
            <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 45 }}>
              <VariantSelector active={variant} onChange={handleVariantChange} />
            </div>
          )}
        <div
          className="variant-glass-card"
          style={{
            padding: isCompact ? '16px' : '24px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Gradient border effect */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              padding: '2px',
              background: `linear-gradient(135deg, ${borderColor}, ${tokens.colorAlpha(colorKey, 0.3)}, ${tokens.color('c')})`,
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              pointerEvents: 'none',
            }}
          />

          {/* Floating icon */}
          <div
            style={{
              position: 'absolute',
              top: isCompact ? '-8px' : '-12px',
              right: isCompact ? '-4px' : '-8px',
              width: isCompact ? '40px' : '56px',
              height: isCompact ? '40px' : '56px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${tokens.colorAlpha(colorKey, 0.25)}, ${tokens.colorAlpha(colorKey, 0.1)})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 20px ${tokens.colorAlpha(colorKey, 0.2)}`,
            }}
          >
            <Sparkles
              size={isCompact ? 16 : 22}
              style={{ color: borderColor, opacity: 0.7 }}
            />
          </div>

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="flex items-center gap-2 mb-3">
              <MicroInteraction tokens={tokens} accent={colorKey} effect="glow">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${borderColor}, ${tokens.colorAlpha(colorKey, 0.7)})`,
                  boxShadow: `0 2px 8px ${tokens.colorAlpha(colorKey, 0.3)}`,
                }}
              >
                <BookOpen size={12} style={{ color: tokens.color('bg') }} />
              </div>
              </MicroInteraction>
              <PremiumBadge tokens={tokens} accent={colorKey} variant="gradient">
                Definisi
              </PremiumBadge>
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
                  fontSize: isCompact ? '12px' : '15px',
                  lineHeight: 1.8,
                  color: tokens.color('text'),
                  paddingLeft: isCompact ? '8px' : '12px',
                  borderLeft: `3px solid ${tokens.colorAlpha(colorKey, 0.3)}`,
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
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
                    style={{ height: 30, background: 'linear-gradient(transparent, rgba(15, 23, 42, 0.85))' }} />
                )}
              </div>
            )}
            {isContentCollapsed && (
              <button onClick={expandContent}
                className="flex items-center justify-center gap-1 w-full py-1.5 mt-1 rounded-b-lg transition-colors"
                style={{ background: tokens.colorAlpha(colorKey, 0.08), color: tokens.color(colorKey), fontSize: isCompact ? '9px' : '11px', cursor: 'pointer', fontWeight: 700 }}>
                <ChevronDown size={isCompact ? 10 : 12} /> Selengkapnya
              </button>
            )}
          </div>
        </div>
      </div>
      </PremiumBlockWrapper>
    );
  }

  // ── Variant C "Ringkas" — Ultra-compact pill/badge ──────────
  return (
    <PremiumBlockWrapper tokens={tokens} accent={colorKey} staggerIndex={0} gradientBorder>
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
          borderRadius: '12px',
          background: tokens.colorAlpha(colorKey, 0.06),
          border: `1px solid ${tokens.colorAlpha(colorKey, 0.15)}`,
        }}
      >
        <MicroInteraction tokens={tokens} accent={colorKey} effect="glow">
        <div
          className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: tokens.colorAlpha(colorKey, 0.2) }}
        >
          <BookOpen size={9} style={{ color: borderColor }} />
        </div>
        </MicroInteraction>
        <div className="min-w-0 flex-1">
          <PremiumBadge tokens={tokens} accent={colorKey} variant="outline" isCompact={isCompact}>
            Definisi
          </PremiumBadge>
          <div
            style={{
              fontSize: isCompact ? '12px' : '13px',
              lineHeight: 1.6,
              color: tokens.color('text'),
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
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
                style={{ height: 20, background: 'linear-gradient(transparent, rgba(15, 23, 42, 0.85))' }} />
            )}
          </div>
          {isContentCollapsed && (
            <button onClick={expandContent}
              className="flex items-center justify-center gap-0.5 w-full py-1 mt-0.5 rounded-b-lg transition-colors"
              style={{ background: tokens.colorAlpha(colorKey, 0.06), color: tokens.color(colorKey), fontSize: isCompact ? '8px' : '9px', cursor: 'pointer', fontWeight: 700 }}>
              <ChevronDown size={8} /> Selengkapnya
            </button>
          )}
        </div>
      </div>
    </div>
    </PremiumBlockWrapper>
  );
}
