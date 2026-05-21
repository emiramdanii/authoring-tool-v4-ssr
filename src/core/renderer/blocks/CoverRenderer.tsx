'use client';

import React, { useCallback } from 'react';
import type { CoverBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { useCanvaStore } from '../../../store/canva/store';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';

// ═══════════════════════════════════════════════════════════════════
// COVER RENDERER — Premium Cover Page with 3 Creative Variants
// ═══════════════════════════════════════════════════════════════════
// Variants:
//   A "Klasik" — Clean light surface, centered layout, soft accent icon
//   B "Sinematik" — Elegant light with subtle gradient accent, watermark
//   C "Minimalis" — Pure white, thin accent line, maximum whitespace
//
// All text/labels in Indonesian (Bahasa Indonesia).
// ═══════════════════════════════════════════════════════════════════

// ── Variant Selector ─────────────────────────────────────────────
function VariantSelector({
  current,
  onChange,
  isEditing,
}: {
  current: string;
  onChange: (v: string) => void;
  isEditing?: boolean;
}) {
  if (!isEditing) return null;
  return (
    <div className="variant-selector" style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
      {(['A', 'B', 'C'] as const).map(v => (
        <button
          key={v}
          className={`variant-pill ${current === v ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); onChange(v); }}
          type="button"
          aria-label={`Varian ${v}`}
          title={`Varian ${v}`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VARIANT A "Klasik" — Clean light surface, centered layout, soft accent icon
// ═══════════════════════════════════════════════════════════════════
function CoverVariantA({
  block, tokens, interactive, isEditing,
  titleEditor, subtitleEditor,
}: {
  block: CoverBlock; tokens: TokenResolver; interactive?: boolean; isEditing?: boolean;
  titleEditor: ReturnType<typeof useInlineEditor>;
  subtitleEditor: ReturnType<typeof useInlineEditor>;
}) {
  const y = tokens.color('y');
  const c = tokens.color('c');
  const g = tokens.color('g');
  const accentKey = block.accentColor || 'y';

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
      style={{
        background: tokens.color('bg'),
        animation: 'coverReveal 0.6s ease-out',
        overflow: 'hidden',
      }}>

      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: tokens.color(accentKey) }} />

      {/* Icon with soft accent background */}
      <div className="mb-6 relative">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            background: tokens.accentBg(accentKey, 0.1),
            boxShadow: tokens.raw.shadow.card,
          }}>
          <div className="text-4xl" style={{ animation: 'breathe 5s ease-in-out infinite' }}>
            {block.icon}
          </div>
        </div>
      </div>

      <div className="font-extrabold tracking-widest uppercase truncate"
        style={{ fontSize: tokens.fontSize('sm'), color: tokens.accentText(accentKey) }}>
        {block.meta?.elemen || ''} · Kelas {block.meta?.fase || 'VII'}
      </div>

      {/* Title — inline editable */}
      <h1 className="font-black leading-tight mt-4 min-w-0 line-clamp-4"
        style={{ fontSize: '32px', fontFamily: tokens.fontFamily('display'), color: tokens.color('text'), overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-word' }}>
        <InlineTextEditor
          {...titleEditor}
          className="font-black leading-tight"
          style={{ color: tokens.color('text'), fontSize: 'inherit', fontFamily: 'inherit', wordBreak: 'break-word' }}
        />
      </h1>

      {/* Subtitle */}
      <InlineTextEditor
        {...subtitleEditor}
        className="mt-5 max-w-[380px] overflow-hidden"
        style={{ fontSize: '15px', color: tokens.textSecondary(0.85), lineHeight: 1.6 }}
        placeholder="Ketik subtitle..."
      />

      {/* Badges — stagger entrance + premium-card-glow hover */}
      {block.badges && block.badges.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 max-w-full">
          {block.badges.map((b, i) => (
            <PremiumBadge key={`badge-a-${b.text?.slice(0,10)}-${i}`}
              tokens={tokens} accent={b.color} variant="glass">
              {b.icon && <span className="flex-shrink-0">{b.icon}</span>} {b.text}
            </PremiumBadge>
          ))}
        </div>
      )}

      {/* Meta — subtle card */}
      {block.meta && (
        <div className="mt-6 px-4 py-2.5 rounded-xl flex-wrap min-w-0"
          style={{
            fontSize: '12px',
            color: tokens.muted(0.8),
            background: tokens.subtleBg(0.04),
            border: '1px solid ' + tokens.subtleBorder(0.06),
          }}>
          ⏱️ {block.meta.durasi} | 🎯 Fase {block.meta.fase} | 📚 Elemen: {block.meta.elemen}
        </div>
      )}

      {/* CTA */}
      {block.cta && (
        <MicroInteraction tokens={tokens} accent={accentKey} effect="squish">
        <button className={`mt-7 rounded-[99px] text-[0.9rem] font-extrabold transition-all ${
          interactive ? 'hover:scale-105 active:scale-95 cursor-pointer' : 'cursor-default'
        }`}
          style={{
            background: tokens.color(accentKey),
            color: tokens.color('bg'),
            padding: '12px 28px',
            boxShadow: tokens.raw.shadow.elevated,
          }}>
          {block.cta.label}
        </button>
        </MicroInteraction>
      )}

      {/* Bottom decoration — subtle dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {[y, c, g].map((color, i) => (
          <div key={`cover-deco-a-${i}`} className="w-6 h-1 rounded-full" style={{ background: color, opacity: 0.5 }} />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VARIANT B "Sinematik" — Elegant light with subtle gradient accent, watermark
// ═══════════════════════════════════════════════════════════════════
function CoverVariantB({
  block, tokens, interactive, isEditing,
  titleEditor, subtitleEditor,
}: {
  block: CoverBlock; tokens: TokenResolver; interactive?: boolean; isEditing?: boolean;
  titleEditor: ReturnType<typeof useInlineEditor>;
  subtitleEditor: ReturnType<typeof useInlineEditor>;
}) {
  const y = tokens.color('y');
  const c = tokens.color('c');
  const accentKey = block.accentColor || 'y';

  return (
    <div className="absolute inset-0 flex flex-col justify-end p-8 pb-12"
      style={{
        background: tokens.color('bg2'),
        animation: 'coverReveal 0.6s ease-out',
        overflow: 'hidden',
        // Prevent bottom-anchored content from overflowing upward.
        // When title/subtitle/badges stack is tall, justify-end pushes
        // content up — max-height constrains it to the available space.
        maxHeight: '100%',
      }}>

      {/* Subtle accent gradient band at top */}
      <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none"
        style={{
          background: `linear-gradient(180deg, ${tokens.accentBg(accentKey, 0.06)}, transparent)`,
        }} />

      {/* Large watermark icon behind title */}
      <div className="absolute pointer-events-none"
        style={{
          top: '8%',
          right: '-5%',
          // Fixed px — vw units reference browser viewport, not the 1280px
          // virtual canvas. On wide monitors, 30vw could be 576px+.
          fontSize: '160px',
          color: tokens.textSubtle(0.08),
          lineHeight: 1,
          animation: 'breathe 8s ease-in-out infinite',
        }}>
        {block.icon}
      </div>

      {/* Content — left-aligned */}
      <div className="relative z-1 max-w-[90%]">
        {/* Meta label */}
        <div className="font-extrabold tracking-widest uppercase mb-2 truncate"
          style={{ fontSize: tokens.fontSize('sm'), color: tokens.accentText(accentKey), letterSpacing: '0.15em' }}>
          {block.meta?.elemen || ''} · Kelas {block.meta?.fase || 'VII'}
        </div>

        {/* Title — left-aligned, bold */}
        <h1 className="font-black leading-tight min-w-0 line-clamp-4"
          style={{
            // Fixed px — vw references browser viewport which can be much
            // wider than the 1280px canvas, causing text to overflow upward.
            fontSize: '38px',
            fontFamily: tokens.fontFamily('display'),
            color: tokens.color('text'),
            wordBreak: 'break-word',
          }}>
          <InlineTextEditor
            {...titleEditor}
            className="font-black leading-tight"
            style={{ color: tokens.color('text'), fontSize: 'inherit', fontFamily: 'inherit', wordBreak: 'break-word' }}
          />
        </h1>

        {/* Subtitle */}
        <InlineTextEditor
          {...subtitleEditor}
          className="mt-5 max-w-[480px] overflow-hidden"
          style={{ fontSize: '16px', color: tokens.textSecondary(0.85), lineHeight: 1.6 }}
          placeholder="Ketik subtitle..."
        />

        {/* Badges — horizontal flow */}
        {block.badges && block.badges.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2 max-w-full">
            {block.badges.map((b, i) => (
              <span key={`badge-b-${b.text?.slice(0,10)}-${i}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold min-w-0"
                style={{
                  fontSize: '11px',
                  background: tokens.accentBg(b.color, 0.1),
                  color: tokens.color(b.color),
                  border: '1px solid ' + tokens.colorAlpha(b.color, 0.2),
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                  animation: `blockStaggerIn 0.4s ease ${i * 0.1}s both`,
                }}>
                {b.icon && <span className="flex-shrink-0">{b.icon}</span>} <span className="min-w-0" style={{ overflow: 'hidden' }}>{b.text}</span>
              </span>
            ))}
          </div>
        )}

        {/* Meta — compact row */}
        {block.meta && (
          <div className="mt-4 flex items-center gap-3 flex-wrap min-w-0"
            style={{ fontSize: '11px', color: tokens.muted(0.7) }}>
            <span>⏱️ {block.meta.durasi}</span>
            <span style={{ color: tokens.subtleBorder(0.15) }}>|</span>
            <span>🎯 Fase {block.meta.fase}</span>
            <span style={{ color: tokens.subtleBorder(0.15) }}>|</span>
            <span>📚 {block.meta.elemen}</span>
          </div>
        )}

        {/* CTA */}
        {block.cta && (
          <button className={`mt-5 rounded-lg text-[0.85rem] font-extrabold transition-all ${
            interactive ? 'hover:scale-105 active:scale-95 cursor-pointer' : 'cursor-default'
          }`}
            style={{
              background: tokens.color(accentKey),
              color: tokens.color('bg'),
              padding: '10px 24px',
              boxShadow: tokens.raw.shadow.elevated,
            }}>
            {block.cta.label}
          </button>
        )}
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5"
        style={{ background: tokens.color(accentKey) }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VARIANT C "Minimalis" — Pure white, thin accent line, maximum whitespace
// ═══════════════════════════════════════════════════════════════════
function CoverVariantC({
  block, tokens, interactive, isEditing,
  titleEditor, subtitleEditor,
}: {
  block: CoverBlock; tokens: TokenResolver; interactive?: boolean; isEditing?: boolean;
  titleEditor: ReturnType<typeof useInlineEditor>;
  subtitleEditor: ReturnType<typeof useInlineEditor>;
}) {
  const y = tokens.color('y');
  const accentKey = block.accentColor || 'y';

  return (
    <div className="absolute inset-0 flex flex-col justify-center p-10"
      style={{
        background: tokens.color('bg2'),
        animation: 'coverReveal 0.6s ease-out',
        overflow: 'hidden',
      }}>

      {/* Thin accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: tokens.color(accentKey) }} />

      {/* Content — left-aligned with generous whitespace */}
      <div className="max-w-full">
        {/* Small icon inline before title */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl" style={{ animation: 'breathe 5s ease-in-out infinite' }}>
            {block.icon}
          </span>
          <div className="font-extrabold tracking-widest uppercase truncate"
            style={{ fontSize: '11px', color: tokens.muted(0.7), letterSpacing: '0.2em' }}>
            {block.meta?.elemen || ''} · Kelas {block.meta?.fase || 'VII'}
          </div>
        </div>

        {/* Title */}
        <h1 className="font-black leading-tight min-w-0 line-clamp-4"
          style={{
            // Fixed px — vw references viewport width which doesn't match
            // the 1280px canvas coordinate space.
            fontSize: '34px',
            fontFamily: tokens.fontFamily('display'),
            color: tokens.color('text'),
            wordBreak: 'break-word',
          }}>
          <InlineTextEditor
            {...titleEditor}
            className="font-black leading-tight"
            style={{ color: tokens.color('text'), fontSize: 'inherit', fontFamily: 'inherit', wordBreak: 'break-word' }}
          />
        </h1>

        {/* Subtitle */}
        <InlineTextEditor
          {...subtitleEditor}
          className="mt-5 max-w-[440px] overflow-hidden"
          style={{ fontSize: '15px', color: tokens.textSecondary(0.85), lineHeight: 1.6 }}
          placeholder="Ketik subtitle..."
        />

        {/* Badges — subtle pill style */}
        {block.badges && block.badges.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-2 max-w-full">
            {block.badges.map((b, i) => (
              <span key={`badge-c-${b.text?.slice(0,10)}-${i}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold min-w-0"
                style={{
                  fontSize: '10px',
                  background: tokens.colorAlpha(b.color, 0.08),
                  color: tokens.color(b.color),
                  border: '1px solid ' + tokens.colorAlpha(b.color, 0.15),
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  wordBreak: 'break-word',
                  maxWidth: '100%',
                  animation: `blockStaggerIn 0.4s ease ${i * 0.1}s both`,
                }}>
                {b.icon && <span className="flex-shrink-0" style={{ fontSize: '10px' }}>{b.icon}</span>} <span className="min-w-0">{b.text}</span>
              </span>
            ))}
          </div>
        )}

        {/* Meta — minimal inline */}
        {block.meta && (
          <div className="mt-5 flex items-center gap-4 flex-wrap min-w-0"
            style={{ fontSize: '11px', color: tokens.muted(0.7) }}>
            <span>⏱️ {block.meta.durasi}</span>
            <span>🎯 Fase {block.meta.fase}</span>
            <span>📚 {block.meta.elemen}</span>
          </div>
        )}

        {/* CTA — minimal outline */}
        {block.cta && (
          <button className={`mt-6 rounded-lg text-[0.85rem] font-bold transition-all ${
            interactive ? 'hover:scale-105 active:scale-95 cursor-pointer' : 'cursor-default'
          }`}
            style={{
              background: 'transparent',
              color: tokens.color(accentKey),
              padding: '10px 24px',
              border: '1px solid ' + tokens.color(accentKey),
            }}>
            {block.cta.label}
          </button>
        )}
      </div>

      {/* Minimal bottom line */}
      <div className="absolute bottom-6 left-10 right-10">
        <div className="h-px" style={{ background: tokens.subtleBorder(0.1) }} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT — CoverRenderer
// ═══════════════════════════════════════════════════════════════════
export const CoverRenderer = React.memo(function CoverRenderer({ block, tokens, interactive, isCompact, isEditing }: {
  block: CoverBlock; tokens: TokenResolver; interactive?: boolean; isCompact?: boolean; isEditing?: boolean;
}) {
  const variant: 'A' | 'B' | 'C' = (block.variant as 'A' | 'B' | 'C') || 'A';

  const titleEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'title',
    value: block.title ?? '',
    tag: 'span',
  });
  const subtitleEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'subtitle',
    value: block.subtitle ?? '',
    tag: 'p',
  });

  const updateSchemaBlock = useCanvaStore((s) => s.updateSchemaBlock);
  const handleVariantChange = useCallback((v: string) => {
    if (block.id) updateSchemaBlock(block.id, { variant: v });
  }, [block.id, updateSchemaBlock]);

  const sharedProps = {
    block,
    tokens,
    interactive,
    isEditing,
    titleEditor,
    subtitleEditor,
  };

  const accentKey = block.accentColor || 'y';
  return (
    <PremiumBlockWrapper tokens={tokens} accent={accentKey} staggerIndex={0}
      style={{ width: '100%', height: '100%' }}
      // Disable entrance animation for full-page cover blocks:
      // The blockStaggerIn translateY(8px→0) animation causes the cover
      // to shift during render, creating a visual "bounce" that looks
      // like overflow. Cover blocks fill the entire scene and don't need
      // stagger animation.
      noAnimation
      hoverLift={false}
    >
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <VariantSelector current={variant} onChange={handleVariantChange} isEditing={isEditing} />
        {variant === 'A' && <CoverVariantA {...sharedProps} />}
        {variant === 'B' && <CoverVariantB {...sharedProps} />}
        {variant === 'C' && <CoverVariantC {...sharedProps} />}
      </div>
    </PremiumBlockWrapper>
  );
});