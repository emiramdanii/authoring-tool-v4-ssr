'use client';

import React, { useCallback } from 'react';
import { Shield, Lightbulb, ArrowRight, Sparkles } from 'lucide-react';
import type { MotivasiBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { RichText } from './RichText';
import { useCanvaStore } from '../../../store/canva/store';
import { PremiumBlockWrapper, ReadingProgressIndicator } from './PremiumBlockEffects';
import type { CompressionDecision } from '../../layout/CompressionEngine';
import { useBlockCompression } from '../../layout/useBlockCompression';

// ═══════════════════════════════════════════════════════════════════
// MOTIVASI RENDERER — BSNP Apersepsi / Motivation Hook
// ═══════════════════════════════════════════════════════════════════
// Engages students with a provocative question and connects to
// prior knowledge. BSNP requires apersepsi as an opening element
// to activate students' background knowledge before new material.
//
// Creative Variants:
//   A "Klasik" — Full card with header, hook question, connections, transition
//   B "Kartu Hook" — Hook question as standalone hero card, connections as icon pills
//   C "Kutipan" — Quote-style: large italic hook question in quotation marks, minimal
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
    { key: 'B', label: 'Kartu Hook' },
    { key: 'C', label: 'Kutipan' },
  ];

  return (
    <div className="variant-selector">
      {variants.map((v) => (
        <button
          key={v.key}
          className={`variant-pill ${active === v.key ? 'active' : ''} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent`}
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

// ── Variant A "Klasik" — Original full-card style ───────────────
function MotivasiVariantKlasik({
  block,
  tokens,
  isCompact,
  titleEditor,
  hookEditor,
  isCompressed,
}: {
  block: MotivasiBlock;
  tokens: TokenResolver;
  isCompact: boolean;
  titleEditor: ReturnType<typeof useInlineEditor>;
  hookEditor: ReturnType<typeof useInlineEditor>;
  isCompressed?: boolean;
}) {
  const edu = tokens.edu('motivasi', isCompact);
  const connections = block.connections || [];
  const visual = block.visual;
  const gradientFrom = visual?.bgGradient?.[0] || 'y';
  const gradientTo = visual?.bgGradient?.[1] || 'c';

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: edu.cardBg(),
        boxShadow: edu.shadow('elevated'),
        border: `1px solid ${tokens.colorAlpha(gradientFrom, 0.15)}`,
        animation: 'fadeIn 0.4s ease',
      }}
    >
      {/* Reading progress indicator */}
      <ReadingProgressIndicator
        progress={1}
        tokens={tokens}
        accent={gradientFrom}
        height={2}
        position="top"
      />
      {/* ═══ HEADER ══════════════════════════════════════════════ */}
      <div
        style={{
          borderLeft: `${edu.stripeWidth()}px solid ${tokens.color(gradientFrom)}`,
          background: `linear-gradient(135deg, ${tokens.colorAlpha(gradientFrom, 0.1)}, ${tokens.colorAlpha(gradientTo, 0.03)})`,
          ...edu.sectionPadding(),
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: tokens.colorAlpha(gradientFrom, 0.15),
                border: `1px solid ${tokens.colorAlpha(gradientFrom, 0.3)}`,
              }}
            >
              <Lightbulb size={16} style={{ color: tokens.color(gradientFrom) }} />
            </div>
            <h2
              className="font-black leading-tight min-w-0"
              style={{
                ...edu.heading(),
                color: edu.textColor(),
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              <InlineTextEditor
                {...titleEditor}
                className="font-black leading-tight"
                style={{ fontSize: 'inherit', fontFamily: 'inherit', color: 'inherit', wordBreak: 'break-word' }}
              />
            </h2>
          </div>

          {block.bsnpRequired && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold" style={{ ...edu.micro(), background: tokens.accentBg('y', 0.1), color: tokens.color('y'), border: `1px solid ${tokens.colorAlpha('y', 0.2)}` }}>
              <Shield size={isCompact ? 8 : 10} /> WAJIB
            </span>
          )}
        </div>

        {/* Decorative gradient line */}
        <div
          className="mt-3 h-1 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${tokens.color(gradientFrom)}, ${tokens.colorAlpha(gradientTo, 0.4)}, transparent)`,
          }}
        />
      </div>

      {/* ═══ HOOK QUESTION ═══════════════════════════════════════ */}
      <div
        style={{
          ...tokens.iosInnerMargin(isCompact),
          ...edu.componentPadding(),
          background: `linear-gradient(135deg, ${tokens.colorAlpha(gradientFrom, 0.12)}, ${tokens.colorAlpha(gradientTo, 0.08)})`,
          border: `2px solid ${tokens.colorAlpha(gradientFrom, 0.25)}`,
          borderRadius: tokens.radius('xl'),
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative sparkle */}
        <div
          className="absolute top-2 right-3"
          style={{ animation: 'float 3s ease-in-out infinite', opacity: 0.3 }}
        >
          <Sparkles size={isCompact ? 14 : 20} style={{ color: tokens.color(gradientFrom) }} />
        </div>

        <div className="flex items-start gap-4 relative">
          {visual?.emoji && (
            <div
              className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${tokens.colorAlpha(gradientFrom, 0.2)}, ${tokens.colorAlpha(gradientTo, 0.15)})`,
                boxShadow: 'none',
                fontSize: isCompact ? '22px' : '28px',
                animation: 'float 3s ease-in-out infinite',
              }}
            >
              {visual.emoji}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div
              className="font-extrabold uppercase tracking-wider mb-2"
              style={{
                ...edu.caption(),
                color: tokens.color(gradientFrom),
              }}
            >
              Pertanyaan Pemicu
            </div>
            <InlineTextEditor
              {...hookEditor}
              className="font-bold leading-relaxed"
              style={{
                ...edu.bodyLg(),
                fontWeight: 700,
                color: edu.textColor(),
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
              placeholder="Ketik pertanyaan pemicu..."
            />
          </div>
        </div>
      </div>

      {/* ═══ CONNECTIONS — hidden when compressed ══════════════════ */}
      {!isCompressed && connections.length > 0 && (
        <div style={{ ...tokens.iosContentPadding(isCompact), paddingTop: 0, paddingBottom: isCompact ? 10 : 14 }}>
          <div
            className="font-extrabold uppercase tracking-wider mb-2.5 flex items-center gap-1.5"
            style={{
              ...edu.caption(),
              color: tokens.muted(0.85),
            }}
          >
            <Lightbulb size={10} />
            Koneksi Pengetahuan
          </div>

          <div className="flex flex-col gap-2">
            {connections.map((conn, i) => (
              <div
                className="flex items-start gap-2.5 rounded-lg p-2.5"
                style={{
                  background: tokens.colorAlpha(conn.color, 0.08),
                  border: `1px solid ${tokens.colorAlpha(conn.color, 0.2)}`,
                  borderLeft: `3px solid ${tokens.color(conn.color)}`,
                  borderRadius: tokens.radius('lg') + 'px',
                }}
              >
                <span className="flex-shrink-0" style={{ fontSize: edu.body().fontSize }}>
                  {conn.icon}
                </span>
                <div className="min-w-0">
                  <div
                    className="font-extrabold"
                    style={{
                      ...edu.bodyLg(),
                      fontWeight: 700,
                      color: tokens.color(conn.color),
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                    }}
                  >
                    {conn.label}
                  </div>
                  <RichText content={conn.description ?? ''}
                    className="leading-relaxed mt-0.5"
                    style={{
                      ...edu.body(),
                      color: tokens.muted(0.8),
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ TRANSITION — hidden when compressed ════════════════ */}
      {!isCompressed && block.transition && (
        <div
          style={{
            ...tokens.iosInnerMargin(isCompact), marginTop: 0,
            ...edu.nestedPadding(),
            background: `linear-gradient(90deg, ${tokens.colorAlpha(gradientTo, 0.12)}, ${tokens.colorAlpha(gradientTo, 0.04)})`,
            borderRadius: tokens.radius('xl') + 'px',
            borderLeft: `3px solid ${tokens.color(gradientTo)}`,
          }}
        >
          <div className="flex items-center gap-2">
            <ArrowRight size={12} style={{ color: tokens.color(gradientTo) }} />
            <RichText content={block.transition ?? ''}
              className="italic leading-relaxed"
              style={{
                ...edu.caption(),
                color: edu.textColor(),
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Variant B "Kartu Hook" — Hero hook card + icon pills ────────
function MotivasiVariantKartuHook({
  block,
  tokens,
  isCompact,
  titleEditor,
  hookEditor,
  isCompressed,
}: {
  block: MotivasiBlock;
  tokens: TokenResolver;
  isCompact: boolean;
  titleEditor: ReturnType<typeof useInlineEditor>;
  hookEditor: ReturnType<typeof useInlineEditor>;
  isCompressed?: boolean;
}) {
  const edu = tokens.edu('motivasi', isCompact);
  const connections = block.connections || [];
  const visual = block.visual;
  const gradientFrom = visual?.bgGradient?.[0] || 'y';
  const gradientTo = visual?.bgGradient?.[1] || 'c';

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: edu.cardBg(),
        boxShadow: edu.shadow('elevated'),
        border: `1px solid ${tokens.colorAlpha(gradientFrom, 0.15)}`,
        animation: 'fadeIn 0.4s ease',
      }}
    >
      {/* Reading progress indicator */}
      <ReadingProgressIndicator
        progress={1}
        tokens={tokens}
        accent={gradientFrom}
        height={2}
        position="top"
      />
      {/* ═══ HOOK HERO CARD ═════════════════════════════════════ */}
      <div
        style={{
          ...tokens.iosContentPadding(isCompact),
          background: `linear-gradient(135deg, ${tokens.colorAlpha(gradientFrom, 0.1)}, ${tokens.colorAlpha(gradientTo, 0.05)})`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Minimal header with title + BSNP badge */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <Lightbulb size={14} style={{ color: tokens.color(gradientFrom) }} />
            <h2
              className="font-bold leading-tight min-w-0"
              style={{
                ...edu.bodyLg(),
                fontWeight: 700,
                color: tokens.muted(0.85),
                wordBreak: 'break-word',
              }}
            >
              <InlineTextEditor
                {...titleEditor}
                className="font-bold leading-tight"
                style={{ fontSize: 'inherit', fontFamily: 'inherit', color: 'inherit' }}
              />
            </h2>
          </div>
          {block.bsnpRequired && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold" style={{ ...edu.micro(), background: tokens.accentBg('y', 0.1), color: tokens.color('y'), border: `1px solid ${tokens.colorAlpha('y', 0.2)}` }}>
              <Shield size={isCompact ? 8 : 10} /> WAJIB
            </span>
          )}
        </div>

        {/* Centered emoji */}
        {visual?.emoji && (
          <div
            style={{
              textAlign: 'center',
              marginBottom: isCompact ? '12px' : '16px',
              fontSize: isCompact ? '36px' : '48px',
              animation: 'float 3s ease-in-out infinite',
            }}
          >
            {visual.emoji}
          </div>
        )}

        {/* Hook question — hero text */}
        <div style={{ textAlign: 'center' }}>
          <InlineTextEditor
            {...hookEditor}
            className="font-bold leading-relaxed"
            style={{
              ...edu.bodyLg(),
              fontWeight: 700,
              color: edu.textColor(),
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              textAlign: 'center',
            }}
            placeholder="Ketik pertanyaan pemicu..."
          />
        </div>
      </div>

      {/* ═══ CONNECTIONS — hidden when compressed ══════════════════ */}
      {!isCompressed && connections.length > 0 && (
        <div
          style={{
            ...edu.sectionPadding(),
            borderTop: `1px solid ${tokens.subtleBorder(0.08)}`,
          }}
        >
          <div
            className="font-extrabold uppercase tracking-wider mb-2"
            style={{
              ...edu.caption(),
              color: tokens.muted(0.85),
            }}
          >
            Koneksi Pengetahuan
          </div>
          <div className="flex flex-wrap gap-2">
            {connections.map((conn, i) => (
              <div
                className="variant-compact-pill"
                style={{
                  borderColor: tokens.colorAlpha(conn.color, 0.25),
                  color: tokens.color(conn.color),
                }}
                title={conn.description}
              >
                <span style={{ fontSize: edu.caption().fontSize }}>{conn.icon}</span>
                <span style={{ fontWeight: 700, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{conn.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ TRANSITION — hidden when compressed ════════════════ */}
      {!isCompressed && block.transition && (
        <div
          style={{
            ...tokens.iosInnerMargin(isCompact),
            marginTop: 0,
            ...edu.nestedPadding(),
            background: tokens.colorAlpha(gradientTo, 0.06),
            borderRadius: tokens.radius('sm'),
          }}
        >
          <div className="flex items-center gap-2">
            <ArrowRight size={10} style={{ color: tokens.color(gradientTo) }} />
            <span
              className="italic"
              style={{
                ...edu.caption(),
                color: tokens.muted(0.85),
              }}
            >
              <RichText content={block.transition ?? ''} />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Variant C "Kutipan" — Quote style ──────────────────────────
function MotivasiVariantKutipan({
  block,
  tokens,
  isCompact,
  titleEditor,
  hookEditor,
  isCompressed,
}: {
  block: MotivasiBlock;
  tokens: TokenResolver;
  isCompact: boolean;
  titleEditor: ReturnType<typeof useInlineEditor>;
  hookEditor: ReturnType<typeof useInlineEditor>;
  isCompressed?: boolean;
}) {
  const edu = tokens.edu('motivasi', isCompact);
  const visual = block.visual;
  const gradientFrom = visual?.bgGradient?.[0] || 'y';

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: edu.cardBg(),
        boxShadow: edu.shadow('elevated'),
        border: `1px solid ${tokens.colorAlpha(gradientFrom, 0.12)}`,
        animation: 'fadeIn 0.4s ease',
        ...edu.componentPadding(),
      }}
    >
      {/* Reading progress indicator */}
      <ReadingProgressIndicator
        progress={1}
        tokens={tokens}
        accent={gradientFrom}
        height={2}
        position="top"
      />
      {/* Minimal header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Lightbulb size={12} style={{ color: tokens.color(gradientFrom) }} />
          <h2
            className="font-semibold min-w-0"
            style={{
              ...edu.bodyLg(),
              fontWeight: 600,
              color: tokens.muted(0.85),
              wordBreak: 'break-word',
            }}
          >
            <InlineTextEditor
              {...titleEditor}
              className="font-semibold"
              style={{ fontSize: 'inherit', fontFamily: 'inherit', color: 'inherit' }}
            />
          </h2>
        </div>
        {block.bsnpRequired && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold" style={{ ...edu.micro(), background: tokens.accentBg('y', 0.1), color: tokens.color('y'), border: `1px solid ${tokens.colorAlpha('y', 0.2)}` }}>
            <Shield size={7} /> WAJIB
          </span>
        )}
      </div>

      {/* Hook question — large italic quote */}
      <div className="variant-quote">
        <InlineTextEditor
          {...hookEditor}
          className="italic leading-relaxed"
          style={{
            ...edu.bodyLg(),
            fontWeight: 700,
            color: edu.textColor(),
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            lineHeight: 1.7,
          }}
          placeholder="Ketik pertanyaan pemicu..."
        />
      </div>

      {/* Transition only — connections hidden; also hidden when compressed */}
      {!isCompressed && block.transition && (
        <div
          style={{
            marginTop: isCompact ? '10px' : '14px',
            ...edu.nestedPadding(),
            background: tokens.colorAlpha(gradientFrom, 0.05),
            borderRadius: tokens.radius('sm'),
            borderLeft: `3px solid ${tokens.colorAlpha(gradientFrom, 0.3)}`,
          }}
        >
          <div className="flex items-center gap-2">
            <ArrowRight size={10} style={{ color: tokens.color(gradientFrom) }} />
            <span
              className="italic"
              style={{
                ...edu.caption(),
                color: tokens.muted(0.85),
              }}
            >
              <RichText content={block.transition ?? ''} />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
export const MotivasiRenderer = React.memo(function MotivasiRenderer({ block, tokens, isCompact, isEditing, compression }: {
  block: MotivasiBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean; compression?: CompressionDecision;
}) {
  const variant: 'A' | 'B' | 'C' = (block.variant as 'A' | 'B' | 'C') || 'A';

  const updateSchemaBlock = useCanvaStore((s) => s.updateSchemaBlock);
  const handleVariantChange = useCallback((v: 'A' | 'B' | 'C') => {
    if (block.id) updateSchemaBlock(block.id, { variant: v });
  }, [block.id, updateSchemaBlock]);

  const titleEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'title',
    value: block.title ?? '',
    tag: 'span',
  });

  const hookEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'hookQuestion',
    value: block.hookQuestion ?? '',
    tag: 'div',
    multiline: true,
  });

  // ── Compression-aware visibility (collapsible strategy) ──────
  const { isCompressed } = useBlockCompression({
    compression,
    totalItems: 1, // Motivasi is a single content unit
  });

  const gradientFrom = block.visual?.bgGradient?.[0] || 'y';

  const sharedProps = {
    block,
    tokens,
    isCompact,
    titleEditor,
    hookEditor,
    isCompressed,
  };

  return (
    <PremiumBlockWrapper tokens={tokens} accent={gradientFrom} staggerIndex={0}>
      <div style={{ position: 'relative' }}>
        {isEditing && (
          <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 45 }}>
            <VariantSelector active={variant} onChange={handleVariantChange} />
          </div>
        )}

        {variant === 'A' && <MotivasiVariantKlasik {...sharedProps} />}
        {variant === 'B' && <MotivasiVariantKartuHook {...sharedProps} />}
        {variant === 'C' && <MotivasiVariantKutipan {...sharedProps} />}
      </div>
    </PremiumBlockWrapper>
  );
});