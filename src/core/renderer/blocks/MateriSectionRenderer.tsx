'use client';

import React, { useState } from 'react';
import { Shield, Star, CheckCircle2, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import type { MateriSectionBlock } from '../../schema/types';
import type { TokenResolver, SchemaRenderMode } from '../types';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';
import { fireConfettiMini } from '@/lib/confetti';

// NOTE: Use React.lazy() to break the circular dependency:
//   SceneRegistry → MateriSectionRenderer → SchemaRenderer → BlockSelectionOverlay → SceneRegistry
// Direct import of SchemaBlockRenderer creates the cycle.
// Lazy loading defers the reference until render time, breaking the cycle.
const SchemaBlockRenderer = React.lazy(() =>
  import('../SchemaRenderer').then(m => ({ default: m.SchemaBlockRenderer }))
);

// ═══════════════════════════════════════════════════════════════════
// MATERI SECTION RENDERER — BSNP-compliant material section
// ═══════════════════════════════════════════════════════════════════
// Renders a professional material section with:
//   - Section header with number badge, icon, title, BSNP badge
//   - Child content blocks rendered via SchemaBlockRenderer pipeline
//   - Key Takeaways section with check icons
//   - Self-Check prompt with thought bubble styling
//
// Creative Variants:
//   A "Klasik" — Full section with header, child blocks, takeaways, self-check
//   B "Majalah" — Magazine-style 2-column: content left, takeaways sidebar right,
//                 self-check as bottom banner
//   C "Pill" — Ultra-compact: header only, takeaways as pill badges,
//              self-check hidden behind expand toggle
//
// All text is in Indonesian. BSNP = Badan Standar Nasional Pendidikan.
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
    { key: 'B', label: 'Majalah' },
    { key: 'C', label: 'Pill' },
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

// ── Variant A "Klasik" — Original full section style ─────────────
function MateriVariantKlasik({
  block,
  mode,
  tokens,
  interactive,
  isCompact,
}: {
  block: MateriSectionBlock;
  mode: SchemaRenderMode;
  tokens: TokenResolver;
  interactive?: boolean;
  isCompact?: boolean;
}) {
  const accentColor = block.accentColor || 'c';
  const accent = tokens.color(accentColor);
  const accentAlpha = (a: number) => tokens.colorAlpha(accentColor, a);

  const sectionNumber = (() => {
    if (block.id) {
      const match = block.id.match(/(\d+)$/);
      if (match) return parseInt(match[1], 10);
    }
    return 1;
  })();

  const contentBlocks = block.content || [];
  const takeaways = block.takeaways || [];
  const selfCheck = block.selfCheck;

  return (
    <div
      className="rounded-2xl overflow-hidden premium-card-glow"
      style={{
        background: tokens.color('card'),
        boxShadow: tokens.raw.shadow.elevated,
        animation: 'fadeIn 0.4s ease',
        border: `1px solid ${accentAlpha(0.15)}`,
      }}
    >
      {/* ═══ SECTION HEADER ══════════════════════════════════════ */}
      <div
        style={{
          borderLeft: `4px solid ${accent}`,
          background: `linear-gradient(135deg, ${accentAlpha(0.08)}, ${accentAlpha(0.03)})`,
          padding: isCompact ? '12px 14px' : '18px 20px',
        }}
      >
        <div className="flex items-start gap-3">
          {/* Section number badge */}
          <MicroInteraction tokens={tokens} accent={accentColor} effect="glow">
          <div
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-black"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accentAlpha(0.7)})`,
              color: tokens.color('bg'),
              fontSize: isCompact ? '13px' : '15px',
              boxShadow: `0 4px 14px ${accentAlpha(0.35)}`,
            }}
          >
            {sectionNumber}
          </div>
          </MicroInteraction>

          {/* Title + subtitle */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {block.icon && (
                <span style={{ fontSize: isCompact ? '14px' : '18px' }} className="flex-shrink-0">
                  {block.icon}
                </span>
              )}
              <h2
                className="font-black leading-tight"
                style={{
                  fontFamily: tokens.fontFamily('display'),
                  fontSize: isCompact ? '16px' : '1.35rem',
                  color: tokens.color('text'),
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                {block.title}
              </h2>
            </div>
            {block.subtitle && (
              <p
                className="mt-1 leading-relaxed"
                style={{
                  fontSize: isCompact ? '11px' : '13px',
                  color: tokens.muted(0.75),
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                {block.subtitle}
              </p>
            )}
          </div>

          {/* BSNP badge */}
          {block.bsnpRequired && (
            <PremiumBadge tokens={tokens} accent="y" variant="solid" isCompact={isCompact}>
              <Shield size={isCompact ? 9 : 11} /> WAJIB BSNP
            </PremiumBadge>
          )}
        </div>

        {/* Gradient accent line under header */}
        <div
          className="mt-3 h-1 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${accent}, ${accentAlpha(0.2)}, transparent)`,
          }}
        />
      </div>

      {/* ═══ CONTENT AREA ════════════════════════════════════════ */}
      {contentBlocks.length > 0 && (
        <div
          className="flex flex-col gap-4"
          style={{
            padding: isCompact ? '12px 14px' : '18px 20px',
          }}
        >
          {contentBlocks.map((childBlock, i) => (
            <React.Suspense
              key={`materi-child-${childBlock.id || childBlock.type}-${i}`}
              fallback={null}
            >
              <SchemaBlockRenderer
                block={childBlock}
                mode={mode}
                tokens={tokens}
                interactive={interactive}
              />
            </React.Suspense>
          ))}
        </div>
      )}

      {/* ═══ KEY TAKEAWAYS ════════════════════════════════════════ */}
      {takeaways.length > 0 && (
        <div
          style={{
            margin: isCompact ? '0 14px 12px' : '0 20px 16px',
            padding: isCompact ? '10px 12px' : '14px 16px',
            background: tokens.colorAlpha('g', 0.08),
            border: `1px solid ${tokens.colorAlpha('g', 0.2)}`,
            borderRadius: tokens.radius('xl') + 'px',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: tokens.colorAlpha('g', 0.2),
              }}
            >
              <Star size={12} style={{ color: tokens.color('g') }} />
            </div>
            <span
              className="font-extrabold uppercase tracking-wider"
              style={{
                color: tokens.color('g'),
                fontSize: isCompact ? '10px' : '11px',
              }}
            >
              Poin Penting
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {takeaways.map((item, i) => (
              <MicroInteraction key={`materi-takeaway-mi-${block.id || 'ms'}-${i}`} tokens={tokens} accent="g" effect="squish">
              <div
                className="flex items-start gap-2.5 rounded-lg p-2"
                style={{
                  background: tokens.colorAlpha('g', 0.06),
                  border: `1px solid ${tokens.colorAlpha('g', 0.12)}`,
                }}
              >
                <CheckCircle2
                  size={isCompact ? 12 : 14}
                  className="flex-shrink-0 mt-0.5"
                  style={{ color: tokens.color('g') }}
                />
                <span
                  className="leading-relaxed"
                  style={{
                    fontSize: isCompact ? '11px' : '13px',
                    color: tokens.color('text'),
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                  }}
                >
                  {item}
                </span>
              </div>
              </MicroInteraction>
            ))}
          </div>
        </div>
      )}

      {/* ═══ SELF-CHECK PROMPT ════════════════════════════════════ */}
      {selfCheck && (
        <MicroInteraction tokens={tokens} accent="y" effect="bounce">
        <div
          style={{
            margin: isCompact ? '0 14px 14px' : '0 20px 20px',
            padding: isCompact ? '10px 12px' : '14px 16px',
            background: tokens.colorAlpha('y', 0.1),
            border: `1px solid ${tokens.colorAlpha('y', 0.25)}`,
            borderRadius: tokens.radius('xl') + 'px',
            borderLeft: `4px solid ${tokens.color('y')}`,
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${tokens.colorAlpha('y', 0.25)}, ${tokens.colorAlpha('y', 0.12)})`,
                boxShadow: `0 2px 8px ${tokens.colorAlpha('y', 0.2)}`,
              }}
            >
              <Brain size={14} style={{ color: tokens.color('y') }} />
            </div>
            <div className="min-w-0">
              <span
                className="font-extrabold block mb-1"
                style={{
                  color: tokens.color('y'),
                  fontSize: isCompact ? '10px' : '11px',
                  letterSpacing: '0.04em',
                }}
              >
                Apa yang sudah kamu pelajari?
              </span>
              <p
                className="leading-relaxed"
                style={{
                  fontSize: isCompact ? '11px' : '13px',
                  color: tokens.color('text'),
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                {selfCheck}
              </p>
            </div>
          </div>
        </div>
        </MicroInteraction>
      )}
    </div>
  );
}

// ── Variant B "Majalah" — Magazine 2-column layout ──────────────
function MateriVariantMajalah({
  block,
  mode,
  tokens,
  interactive,
  isCompact,
}: {
  block: MateriSectionBlock;
  mode: SchemaRenderMode;
  tokens: TokenResolver;
  interactive?: boolean;
  isCompact?: boolean;
}) {
  const accentColor = block.accentColor || 'c';
  const accent = tokens.color(accentColor);
  const accentAlpha = (a: number) => tokens.colorAlpha(accentColor, a);

  const sectionNumber = (() => {
    if (block.id) {
      const match = block.id.match(/(\d+)$/);
      if (match) return parseInt(match[1], 10);
    }
    return 1;
  })();

  const contentBlocks = block.content || [];
  const takeaways = block.takeaways || [];
  const selfCheck = block.selfCheck;

  return (
    <div
      className="rounded-2xl overflow-hidden premium-card-glow"
      style={{
        background: tokens.color('card'),
        boxShadow: tokens.raw.shadow.elevated,
        animation: 'fadeIn 0.4s ease',
        border: `1px solid ${accentAlpha(0.15)}`,
      }}
    >
      {/* ═══ SECTION HEADER ══════════════════════════════════════ */}
      <div
        style={{
          borderLeft: `4px solid ${accent}`,
          background: `linear-gradient(135deg, ${accentAlpha(0.08)}, ${accentAlpha(0.03)})`,
          padding: isCompact ? '12px 14px' : '18px 20px',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-black"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accentAlpha(0.7)})`,
              color: tokens.color('bg'),
              fontSize: isCompact ? '12px' : '14px',
            }}
          >
            {sectionNumber}
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
            {block.title}
          </h2>
          {block.bsnpRequired && (
            <PremiumBadge tokens={tokens} accent="y" variant="solid" isCompact={isCompact}>
              <Shield size={isCompact ? 9 : 11} /> WAJIB BSNP
            </PremiumBadge>
          )}
        </div>
      </div>

      {/* ═══ MAGAZINE 2-COLUMN LAYOUT ════════════════════════════ */}
      <div
        className={isCompact ? undefined : 'variant-magazine-layout'}
        style={{
          padding: isCompact ? '12px 14px' : '16px 20px',
          ...(isCompact ? { display: 'flex', flexDirection: 'column', gap: '12px' } : {}),
        }}
      >
        {/* Left column: content blocks */}
        <div className="flex flex-col gap-4">
          {contentBlocks.map((childBlock, i) => (
            <React.Suspense
              key={`materi-majalah-child-${childBlock.id || childBlock.type}-${i}`}
              fallback={null}
            >
              <SchemaBlockRenderer
                block={childBlock}
                mode={mode}
                tokens={tokens}
                interactive={interactive}
              />
            </React.Suspense>
          ))}
        </div>

        {/* Right column: takeaways sidebar */}
        {takeaways.length > 0 && (
          <div
            style={{
              ...(isCompact ? {} : { position: 'sticky', top: '16px', alignSelf: 'start' }),
              padding: isCompact ? '10px' : '14px',
              background: tokens.colorAlpha('g', 0.06),
              borderRadius: tokens.radius('xl') + 'px',
              border: `1px solid ${tokens.colorAlpha('g', 0.15)}`,
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Star size={11} style={{ color: tokens.color('g') }} />
              <span
                className="font-extrabold uppercase tracking-wider"
                style={{
                  color: tokens.color('g'),
                  fontSize: '10px',
                }}
              >
                Poin Penting
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {takeaways.map((item, i) => (
                <div
                  key={`materi-majalah-takeaway-${block.id || 'ms'}-${i}`}
                  className="flex items-start gap-2 p-1.5 rounded"
                  style={{
                    background: tokens.colorAlpha('g', 0.06),
                  }}
                >
                  <CheckCircle2
                    size={11}
                    className="flex-shrink-0 mt-0.5"
                    style={{ color: tokens.color('g') }}
                  />
                  <span
                    className="leading-relaxed"
                    style={{
                      fontSize: isCompact ? '10px' : '11px',
                      color: tokens.color('text'),
                      wordBreak: 'break-word',
                    }}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══ SELF-CHECK — bottom banner ══════════════════════════ */}
      {selfCheck && (
        <div
          style={{
            margin: isCompact ? '0 14px 14px' : '0 20px 20px',
            padding: isCompact ? '10px 14px' : '12px 18px',
            background: `linear-gradient(90deg, ${tokens.colorAlpha('y', 0.08)}, ${tokens.colorAlpha('y', 0.04)})`,
            borderRadius: tokens.radius('lg') + 'px',
            border: `1px solid ${tokens.colorAlpha('y', 0.15)}`,
            borderLeft: `4px solid ${tokens.color('y')}`,
          }}
        >
          <div className="flex items-center gap-3">
            <Brain size={14} style={{ color: tokens.color('y') }} />
            <div className="min-w-0">
              <span
                className="font-extrabold"
                style={{
                  color: tokens.color('y'),
                  fontSize: isCompact ? '10px' : '10px',
                  marginRight: '8px',
                }}
              >
                Cek Pemahaman:
              </span>
              <span
                className="leading-relaxed"
                style={{
                  fontSize: isCompact ? '10px' : '12px',
                  color: tokens.color('text'),
                  wordBreak: 'break-word',
                }}
              >
                {selfCheck}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Variant C "Pill" — Ultra-compact with expand toggle ──────────
function MateriVariantPill({
  block,
  mode,
  tokens,
  interactive,
  isCompact,
}: {
  block: MateriSectionBlock;
  mode: SchemaRenderMode;
  tokens: TokenResolver;
  interactive?: boolean;
  isCompact?: boolean;
}) {
  const accentColor = block.accentColor || 'c';
  const accent = tokens.color(accentColor);
  const accentAlpha = (a: number) => tokens.colorAlpha(accentColor, a);

  const sectionNumber = (() => {
    if (block.id) {
      const match = block.id.match(/(\d+)$/);
      if (match) return parseInt(match[1], 10);
    }
    return 1;
  })();

  const contentBlocks = block.content || [];
  const takeaways = block.takeaways || [];
  const selfCheck = block.selfCheck;

  const [showSelfCheck, setShowSelfCheck] = useState(false);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: tokens.color('card'),
        boxShadow: tokens.raw.shadow.card,
        border: `1px solid ${accentAlpha(0.12)}`,
      }}
    >
      {/* ═══ HEADER ONLY — title + number badge ══════════════════ */}
      <div
        className="flex items-center gap-2.5"
        style={{
          padding: isCompact ? '8px 12px' : '10px 16px',
          borderLeft: `3px solid ${accent}`,
        }}
      >
        <div
          className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center font-black"
          style={{
            background: `linear-gradient(135deg, ${accent}, ${accentAlpha(0.7)})`,
            color: tokens.color('bg'),
            fontSize: isCompact ? '10px' : '12px',
          }}
        >
          {sectionNumber}
        </div>
        <h2
          className="font-bold min-w-0"
          style={{
            fontFamily: tokens.fontFamily('display'),
            fontSize: isCompact ? '13px' : '15px',
            color: tokens.color('text'),
            wordBreak: 'break-word',
          }}
        >
          {block.title}
        </h2>
        {block.bsnpRequired && (
          <PremiumBadge tokens={tokens} accent="y" variant="outline" isCompact={isCompact}>
            WAJIB
          </PremiumBadge>
        )}
      </div>

      {/* ═══ CONTENT BLOCKS ══════════════════════════════════════ */}
      {contentBlocks.length > 0 && (
        <div
          className="flex flex-col gap-3"
          style={{
            padding: isCompact ? '8px 12px' : '10px 16px',
          }}
        >
          {contentBlocks.map((childBlock, i) => (
            <React.Suspense
              key={`materi-pill-child-${childBlock.id || childBlock.type}-${i}`}
              fallback={null}
            >
              <SchemaBlockRenderer
                block={childBlock}
                mode={mode}
                tokens={tokens}
                interactive={interactive}
              />
            </React.Suspense>
          ))}
        </div>
      )}

      {/* ═══ TAKEAWAYS — horizontal pill badges ══════════════════ */}
      {takeaways.length > 0 && (
        <div
          style={{
            padding: isCompact ? '4px 12px 8px' : '6px 16px 10px',
          }}
        >
          <div className="flex flex-wrap gap-1.5">
            {takeaways.map((item, i) => (
              <span
                key={`materi-pill-takeaway-${block.id || 'ms'}-${i}`}
                className="variant-compact-pill"
                style={{
                  borderColor: tokens.colorAlpha('g', 0.2),
                  color: tokens.color('g'),
                  background: tokens.colorAlpha('g', 0.06),
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={item}
              >
                <CheckCircle2 size={8} />
                <span style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: isCompact ? '100px' : '160px',
                  display: 'inline-block',
                  verticalAlign: 'bottom',
                }}>
                  {item}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ═══ SELF-CHECK — collapsible toggle ════════════════════ */}
      {selfCheck && (
        <div
          style={{
            padding: isCompact ? '4px 12px 8px' : '6px 16px 12px',
          }}
        >
          <MicroInteraction tokens={tokens} accent="y" effect="bounce">
          <button
            onClick={() => { setShowSelfCheck(!showSelfCheck); if (!showSelfCheck) fireConfettiMini(); }}
            type="button"
            className="flex items-center gap-1.5 w-full text-left"
            style={{
              padding: isCompact ? '4px 8px' : '6px 10px',
              borderRadius: '8px',
              background: tokens.colorAlpha('y', 0.06),
              border: `1px solid ${tokens.colorAlpha('y', 0.15)}`,
              color: tokens.color('y'),
              fontSize: isCompact ? '9px' : '10px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            aria-expanded={showSelfCheck}
            aria-label="Tampilkan cek pemahaman"
          >
            <Brain size={10} />
            <span>Cek Pemahaman</span>
            {showSelfCheck ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>
          </MicroInteraction>

          {showSelfCheck && (
            <div
              style={{
                marginTop: '6px',
                padding: isCompact ? '8px 10px' : '10px 14px',
                background: tokens.colorAlpha('y', 0.06),
                borderRadius: '8px',
                borderLeft: `3px solid ${tokens.color('y')}`,
                animation: 'fadeIn 0.3s ease',
              }}
            >
              <p
                className="leading-relaxed"
                style={{
                  fontSize: isCompact ? '10px' : '12px',
                  color: tokens.color('text'),
                  wordBreak: 'break-word',
                }}
              >
                {selfCheck}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
export function MateriSectionRenderer({ block, mode, tokens, interactive, isCompact, isEditing }: {
  block: MateriSectionBlock;
  mode: SchemaRenderMode;
  tokens: TokenResolver;
  interactive?: boolean;
  isCompact?: boolean;
  isEditing?: boolean;
}) {
  const [currentVariant, setCurrentVariant] = useState<'A' | 'B' | 'C'>(
    (block.variant as 'A' | 'B' | 'C') || 'A'
  );
  const variant = currentVariant;

  const handleVariantChange = (v: 'A' | 'B' | 'C') => {
    setCurrentVariant(v);
  };

  const sharedProps = {
    block,
    mode,
    tokens,
    interactive,
    isCompact,
  };

  const accentColor = block.accentColor || 'c';
  return (
    <PremiumBlockWrapper tokens={tokens} accent={accentColor} staggerIndex={0} gradientBorder>
      <ReadingProgressIndicator progress={1} tokens={tokens} accent={accentColor} height={2} position="top" />
      <div style={{ position: 'relative' }}>
        {isEditing && (
          <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 45 }}>
            <VariantSelector active={variant} onChange={handleVariantChange} />
          </div>
        )}

        {variant === 'A' && <MateriVariantKlasik {...sharedProps} />}
        {variant === 'B' && <MateriVariantMajalah {...sharedProps} />}
        {variant === 'C' && <MateriVariantPill {...sharedProps} />}
      </div>
    </PremiumBlockWrapper>
  );
}
