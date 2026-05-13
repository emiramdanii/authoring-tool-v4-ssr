'use client';

import React, { useState, useMemo } from 'react';
import { BookOpen, Sparkles, ListChecks, ChevronLeft, ChevronRight } from 'lucide-react';
import type { DefBoxBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';

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
  tokens,
}: {
  active: 'A' | 'B' | 'C';
  onChange: (v: 'A' | 'B' | 'C') => void;
  tokens: TokenResolver;
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

// ── Step Mode Sub-component ──────────────────────────────────────
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
  const [activeStep, setActiveStep] = useState(0);
  const borderColor = tokens.color(colorKey);
  const totalSteps = steps.length;
  const progress = totalSteps <= 1 ? 1 : (activeStep + 1) / totalSteps;

  const step = steps[activeStep];

  return (
    <div
      style={{
        padding: isCompact ? '10px 12px' : '13px 15px',
      }}
    >
      {/* Step chips */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          marginBottom: isCompact ? '8px' : '10px',
          overflowX: 'auto',
          scrollbarWidth: 'none' as const,
        }}
      >
        {steps.map((s, i) => {
          const isActive = i === activeStep;
          const isPast = i < activeStep;
          return (
            <button
              key={`def-step-${i}`}
              onClick={() => setActiveStep(i)}
              type="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: isCompact ? '3px 10px' : '4px 12px',
                borderRadius: '9999px',
                fontSize: isCompact ? '9px' : '10px',
                fontWeight: 700,
                border: `1px solid ${isActive ? tokens.colorAlpha(colorKey, 0.3) : 'transparent'}`,
                background: isActive
                  ? tokens.colorAlpha(colorKey, 0.12)
                  : isPast
                    ? tokens.colorAlpha(colorKey, 0.05)
                    : 'transparent',
                color: isActive
                  ? borderColor
                  : isPast
                    ? tokens.colorAlpha(colorKey, 0.6)
                    : tokens.muted(0.6),
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {isPast && <span style={{ fontSize: '9px' }}>&#10003;</span>}
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: isCompact ? '2px' : '3px',
          borderRadius: '9999px',
          background: tokens.subtleBg(0.06),
          marginBottom: isCompact ? '8px' : '10px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress * 100}%`,
            borderRadius: '9999px',
            background: `linear-gradient(90deg, ${borderColor}, ${tokens.colorAlpha(colorKey, 0.6)})`,
            transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>

      {/* Step content */}
      <div
        style={{
          borderLeft: `${isCompact ? 3 : 4}px solid ${borderColor}`,
          paddingLeft: isCompact ? '10px' : '12px',
          fontSize: isCompact ? '12px' : '14.5px',
          lineHeight: 1.7,
          color: tokens.color('text'),
          animation: 'fadeIn 0.3s ease',
        }}
      >
        {step.content}
      </div>

      {/* Navigation */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: isCompact ? '8px' : '10px',
          borderTop: `1px solid ${tokens.subtleBorder(0.08)}`,
          paddingTop: isCompact ? '6px' : '8px',
        }}
      >
        <button
          onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
          disabled={activeStep === 0}
          type="button"
          aria-label="Langkah sebelumnya"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: isCompact ? '4px 10px' : '5px 12px',
            borderRadius: '8px',
            fontSize: isCompact ? '9px' : '10px',
            fontWeight: 700,
            border: `1px solid ${activeStep === 0 ? 'transparent' : tokens.colorAlpha(colorKey, 0.25)}`,
            background: activeStep === 0 ? 'transparent' : tokens.colorAlpha(colorKey, 0.08),
            color: activeStep === 0 ? tokens.muted(0.4) : borderColor,
            cursor: activeStep === 0 ? 'default' : 'pointer',
            opacity: activeStep === 0 ? 0.4 : 1,
            transition: 'all 0.2s ease',
          }}
        >
          <ChevronLeft size={10} />
          Sebelumnya
        </button>

        <span
          style={{
            fontSize: isCompact ? '9px' : '10px',
            fontWeight: 700,
            color: tokens.muted(0.6),
          }}
        >
          {activeStep + 1} / {totalSteps}
        </span>

        <button
          onClick={() => setActiveStep(Math.min(totalSteps - 1, activeStep + 1))}
          disabled={activeStep === totalSteps - 1}
          type="button"
          aria-label="Langkah berikutnya"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: isCompact ? '4px 10px' : '5px 12px',
            borderRadius: '8px',
            fontSize: isCompact ? '9px' : '10px',
            fontWeight: 700,
            border: `1px solid ${activeStep === totalSteps - 1 ? 'transparent' : tokens.colorAlpha(colorKey, 0.25)}`,
            background: activeStep === totalSteps - 1 ? 'transparent' : tokens.colorAlpha(colorKey, 0.08),
            color: activeStep === totalSteps - 1 ? tokens.muted(0.4) : borderColor,
            cursor: activeStep === totalSteps - 1 ? 'default' : 'pointer',
            opacity: activeStep === totalSteps - 1 ? 0.4 : 1,
            transition: 'all 0.2s ease',
          }}
        >
          Berikutnya
          <ChevronRight size={10} />
        </button>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
export function DefBoxRenderer({ block, tokens, isCompact, isEditing }: {
  block: DefBoxBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean;
}) {
  const colorKey = block.borderColor || 'y';
  const borderColor = tokens.color(colorKey);
  const variant: 'A' | 'B' | 'C' = block.variant || 'A';

  // ── Inline editing hooks ─────────────────────────────────────
  const contentEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'content',
    value: block.content ?? '',
    tag: 'span',
  });

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
      <div style={{ position: 'relative' }}>
        {isEditing && (
          <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 15 }}>
            <VariantSelector active={variant} onChange={() => {}} tokens={tokens} />
          </div>
        )}
        <div
          className="rounded-xl overflow-hidden"
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
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: tokens.colorAlpha(colorKey, 0.2) }}>
                <BookOpen size={10} className="inline" style={{ color: borderColor }} />
              </div>
              <span className="font-extrabold uppercase tracking-wider"
                style={{ color: borderColor, fontSize: isCompact ? '10px' : '11px' }}>
                Definisi
              </span>
            </div>

            {/* Content — step mode or inline */}
            {shouldUseStepMode ? (
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
              }}>
                <InlineTextEditor
                  {...contentEditor}
                  className={isCompact ? 'canvas-truncate-3' : ''}
                  style={{ fontSize: 'inherit', lineHeight: 'inherit', color: 'inherit' }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Variant B "Kreatif" — Glassmorphism card ────────────────
  if (variant === 'B') {
    return (
      <div style={{ position: 'relative' }}>
        {isEditing && (
          <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 15 }}>
            <VariantSelector active={variant} onChange={() => {}} tokens={tokens} />
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
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${borderColor}, ${tokens.colorAlpha(colorKey, 0.7)})`,
                  boxShadow: `0 2px 8px ${tokens.colorAlpha(colorKey, 0.3)}`,
                }}
              >
                <BookOpen size={12} style={{ color: tokens.color('bg') }} />
              </div>
              <span
                className="font-extrabold uppercase tracking-wider"
                style={{
                  color: borderColor,
                  fontSize: isCompact ? '10px' : '12px',
                  letterSpacing: '0.08em',
                }}
              >
                Definisi
              </span>
            </div>

            {shouldUseStepMode ? (
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
                }}
              >
                <InlineTextEditor
                  {...contentEditor}
                  className={isCompact ? 'canvas-truncate-3' : ''}
                  style={{ fontSize: 'inherit', lineHeight: 'inherit', color: 'inherit' }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Variant C "Ringkas" — Ultra-compact pill/badge ──────────
  return (
    <div style={{ position: 'relative' }}>
      {isEditing && (
        <div style={{ position: 'absolute', top: '4px', right: '4px', zIndex: 15 }}>
          <VariantSelector active={variant} onChange={() => {}} tokens={tokens} />
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
        <div
          className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: tokens.colorAlpha(colorKey, 0.2) }}
        >
          <BookOpen size={9} style={{ color: borderColor }} />
        </div>
        <div className="min-w-0 flex-1">
          <span
            className="variant-compact-pill"
            style={{
              marginBottom: '4px',
              display: 'inline-flex',
              borderColor: tokens.colorAlpha(colorKey, 0.3),
              color: borderColor,
              background: tokens.colorAlpha(colorKey, 0.1),
            }}
          >
            Definisi
          </span>
          <div
            style={{
              fontSize: isCompact ? '11px' : '13px',
              lineHeight: 1.6,
              color: tokens.color('text'),
            }}
          >
            <InlineTextEditor
              {...contentEditor}
              className="canvas-truncate-2"
              style={{ fontSize: 'inherit', lineHeight: 'inherit', color: 'inherit' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
