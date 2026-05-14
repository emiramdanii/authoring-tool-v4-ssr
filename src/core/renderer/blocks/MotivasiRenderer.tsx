'use client';

import React, { useCallback } from 'react';
import { Shield, Lightbulb, ArrowRight, Sparkles } from 'lucide-react';
import type { MotivasiBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { RichText } from './RichText';
import { useCanvaStore } from '../../../store/canva/store';
import { PremiumBlockWrapper, PremiumBadge, ReadingProgressIndicator, MicroInteraction } from './PremiumBlockEffects';
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
  const connections = block.connections || [];
  const visual = block.visual;
  const gradientFrom = visual?.bgGradient?.[0] || 'y';
  const gradientTo = visual?.bgGradient?.[1] || 'c';

  return (
    <div
      className="rounded-2xl overflow-hidden premium-card-glow"
      style={{
        background: tokens.color('card'),
        boxShadow: tokens.raw.shadow.elevated,
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
          borderLeft: `4px solid ${tokens.color(gradientFrom)}`,
          background: `linear-gradient(135deg, ${tokens.colorAlpha(gradientFrom, 0.1)}, ${tokens.colorAlpha(gradientTo, 0.03)})`,
          padding: isCompact ? '10px 12px' : '14px 18px',
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
                fontFamily: tokens.fontFamily('display'),
                fontSize: isCompact ? '14px' : '1.2rem',
                color: tokens.color('text'),
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
            <PremiumBadge tokens={tokens} accent="y" variant="solid" isCompact={isCompact}>
              <Shield size={isCompact ? 8 : 10} /> WAJIB
            </PremiumBadge>
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
          margin: isCompact ? '10px 12px' : '14px 18px',
          padding: isCompact ? '14px 16px' : '20px 24px',
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
            <MicroInteraction tokens={tokens} accent={gradientFrom} effect="bounce">
            <div
              className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${tokens.colorAlpha(gradientFrom, 0.2)}, ${tokens.colorAlpha(gradientTo, 0.15)})`,
                boxShadow: `0 4px 16px ${tokens.colorAlpha(gradientFrom, 0.3)}`,
                fontSize: isCompact ? '22px' : '28px',
                animation: 'float 3s ease-in-out infinite',
              }}
            >
              {visual.emoji}
            </div>
            </MicroInteraction>
          )}

          <div className="flex-1 min-w-0">
            <div
              className="font-extrabold uppercase tracking-wider mb-2"
              style={{
                color: tokens.color(gradientFrom),
                fontSize: '11px',
                letterSpacing: '0.08em',
              }}
            >
              Pertanyaan Pemicu
            </div>
            <InlineTextEditor
              {...hookEditor}
              className="font-bold leading-relaxed"
              style={{
                fontSize: isCompact ? '13px' : '16px',
                color: tokens.color('text'),
                fontFamily: tokens.fontFamily('display'),
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
        <div style={{ padding: isCompact ? '0 12px 10px' : '0 18px 14px' }}>
          <div
            className="font-extrabold uppercase tracking-wider mb-2.5 flex items-center gap-1.5"
            style={{
              color: tokens.muted(0.6),
              fontSize: isCompact ? '9px' : '10px',
              letterSpacing: '0.08em',
            }}
          >
            <Lightbulb size={10} />
            Koneksi Pengetahuan
          </div>

          <div className="flex flex-col gap-2">
            {connections.map((conn, i) => (
              <MicroInteraction key={`mot-conn-mi-${block.id || 'mot'}-${i}`} tokens={tokens} accent={conn.color} effect="squish">
              <div
                className="flex items-start gap-2.5 rounded-lg p-2.5"
                style={{
                  background: tokens.colorAlpha(conn.color, 0.08),
                  border: `1px solid ${tokens.colorAlpha(conn.color, 0.2)}`,
                  borderLeft: `3px solid ${tokens.color(conn.color)}`,
                  borderRadius: tokens.radius('lg') + 'px',
                }}
              >
                <span className="flex-shrink-0" style={{ fontSize: isCompact ? '13px' : '15px' }}>
                  {conn.icon}
                </span>
                <div className="min-w-0">
                  <div
                    className="font-extrabold"
                    style={{
                      color: tokens.color(conn.color),
                      fontSize: '12px',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                    }}
                  >
                    {conn.label}
                  </div>
                  <RichText content={conn.description ?? ''}
                    className="leading-relaxed mt-0.5"
                    style={{
                      fontSize: '12px',
                      color: tokens.muted(0.8),
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                    }}
                  />
                </div>
              </div>
              </MicroInteraction>
            ))}
          </div>
        </div>
      )}

      {/* ═══ TRANSITION — hidden when compressed ════════════════ */}
      {!isCompressed && block.transition && (
        <div
          style={{
            margin: isCompact ? '0 12px 12px' : '0 18px 16px',
            padding: isCompact ? '8px 14px' : '10px 18px',
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
                fontSize: isCompact ? '10px' : '12px',
                color: tokens.color('text'),
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
  const connections = block.connections || [];
  const visual = block.visual;
  const gradientFrom = visual?.bgGradient?.[0] || 'y';
  const gradientTo = visual?.bgGradient?.[1] || 'c';

  return (
    <div
      className="rounded-2xl overflow-hidden premium-card-glow"
      style={{
        background: tokens.color('card'),
        boxShadow: tokens.raw.shadow.elevated,
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
          padding: isCompact ? '20px 16px' : '32px 24px',
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
                fontFamily: tokens.fontFamily('display'),
                fontSize: isCompact ? '12px' : '14px',
                color: tokens.muted(0.7),
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
            <PremiumBadge tokens={tokens} accent="y" variant="solid" isCompact={isCompact}>
              <Shield size={isCompact ? 8 : 10} /> WAJIB
            </PremiumBadge>
          )}
        </div>

        {/* Centered emoji */}
        {visual?.emoji && (
          <MicroInteraction tokens={tokens} accent={gradientFrom} effect="bounce">
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
          </MicroInteraction>
        )}

        {/* Hook question — hero text */}
        <div style={{ textAlign: 'center' }}>
          <InlineTextEditor
            {...hookEditor}
            className="font-bold leading-relaxed"
            style={{
              fontSize: isCompact ? '15px' : '18px',
              color: tokens.color('text'),
              fontFamily: tokens.fontFamily('display'),
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
            padding: isCompact ? '10px 12px' : '14px 18px',
            borderTop: `1px solid ${tokens.subtleBorder(0.08)}`,
          }}
        >
          <div
            className="font-extrabold uppercase tracking-wider mb-2"
            style={{
              color: tokens.muted(0.7),
              fontSize: '11px',
              letterSpacing: '0.08em',
            }}
          >
            Koneksi Pengetahuan
          </div>
          <div className="flex flex-wrap gap-2">
            {connections.map((conn, i) => (
              <MicroInteraction key={`mot-pill-mi-${block.id || 'mot'}-${i}`} tokens={tokens} accent={conn.color} effect="squish">
              <div
                className="variant-compact-pill"
                style={{
                  borderColor: tokens.colorAlpha(conn.color, 0.25),
                  color: tokens.color(conn.color),
                }}
                title={conn.description}
              >
                <span style={{ fontSize: isCompact ? '11px' : '13px' }}>{conn.icon}</span>
                <span style={{ fontWeight: 700, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{conn.label}</span>
              </div>
              </MicroInteraction>
            ))}
          </div>
        </div>
      )}

      {/* ═══ TRANSITION — hidden when compressed ════════════════ */}
      {!isCompressed && block.transition && (
        <MicroInteraction tokens={tokens} accent={gradientTo} effect="bounce">
        <div
          style={{
            margin: isCompact ? '0 12px 10px' : '0 18px 14px',
            padding: isCompact ? '6px 12px' : '8px 16px',
            background: tokens.colorAlpha(gradientTo, 0.06),
            borderRadius: '8px',
          }}
        >
          <div className="flex items-center gap-2">
            <ArrowRight size={10} style={{ color: tokens.color(gradientTo) }} />
            <span
              className="italic"
              style={{
                fontSize: isCompact ? '10px' : '11px',
                color: tokens.muted(0.7),
              }}
            >
              <RichText content={block.transition ?? ''} />
            </span>
          </div>
        </div>
        </MicroInteraction>
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
  const visual = block.visual;
  const gradientFrom = visual?.bgGradient?.[0] || 'y';

  return (
    <div
      className="rounded-2xl overflow-hidden premium-card-glow"
      style={{
        background: tokens.color('card'),
        boxShadow: tokens.raw.shadow.elevated,
        border: `1px solid ${tokens.colorAlpha(gradientFrom, 0.12)}`,
        animation: 'fadeIn 0.4s ease',
        padding: isCompact ? '14px 16px' : '20px 24px',
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
              fontFamily: tokens.fontFamily('display'),
              fontSize: isCompact ? '11px' : '13px',
              color: tokens.muted(0.6),
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
          <PremiumBadge tokens={tokens} accent="y" variant="solid" isCompact={isCompact}>
            <Shield size={7} /> WAJIB
          </PremiumBadge>
        )}
      </div>

      {/* Hook question — large italic quote */}
      <div className="variant-quote">
        <InlineTextEditor
          {...hookEditor}
          className="italic leading-relaxed"
          style={{
            fontSize: isCompact ? '15px' : '18px',
            color: tokens.color('text'),
            fontFamily: tokens.fontFamily('display'),
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            lineHeight: 1.7,
          }}
          placeholder="Ketik pertanyaan pemicu..."
        />
      </div>

      {/* Transition only — connections hidden; also hidden when compressed */}
      {!isCompressed && block.transition && (
        <MicroInteraction tokens={tokens} accent={gradientFrom} effect="bounce">
        <div
          style={{
            marginTop: isCompact ? '10px' : '14px',
            padding: isCompact ? '6px 12px' : '8px 16px',
            background: tokens.colorAlpha(gradientFrom, 0.05),
            borderRadius: '8px',
            borderLeft: `3px solid ${tokens.colorAlpha(gradientFrom, 0.3)}`,
          }}
        >
          <div className="flex items-center gap-2">
            <ArrowRight size={10} style={{ color: tokens.color(gradientFrom) }} />
            <span
              className="italic"
              style={{
                fontSize: isCompact ? '10px' : '11px',
                color: tokens.muted(0.7),
              }}
            >
              <RichText content={block.transition ?? ''} />
            </span>
          </div>
        </div>
        </MicroInteraction>
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
    <PremiumBlockWrapper tokens={tokens} accent={gradientFrom} staggerIndex={0} gradientBorder>
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