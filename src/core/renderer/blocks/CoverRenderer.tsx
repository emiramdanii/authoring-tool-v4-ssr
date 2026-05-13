'use client';

import React, { useCallback } from 'react';
import type { CoverBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { useCanvaStore } from '../../../store/canva/store';

// ═══════════════════════════════════════════════════════════════════
// COVER RENDERER — Premium Cover Page with 3 Creative Variants
// ═══════════════════════════════════════════════════════════════════
// Variants:
//   A "Klasik" — Centered layout, radial gradient bg, floating icon
//   B "Sinematik" — Cinematic full-bleed: icon as watermark, left-aligned,
//                    badges horizontal, animated gradient border
//   C "Minimalis" — Ultra-clean: solid bg, no icon container, thin accent
//                    line, small inline icon, left-aligned
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
// VARIANT A "Klasik" — Centered layout, radial gradient, floating icon
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
        background: 'radial-gradient(ellipse 90% 60% at 50% 0%, ' + tokens.colorAlpha(accentKey, 0.22) + ', transparent 60%), linear-gradient(180deg, ' + tokens.color('bg') + ', ' + tokens.color('bg2') + ')',
        animation: 'coverReveal 0.6s ease-out',
      }}>

      {/* Decorative top bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5"
        style={{ background: 'linear-gradient(90deg, ' + y + ', ' + c + ', ' + y + ')' }} />

      {/* Icon with glowing container + breathe effect */}
      <div className="mb-5 relative">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            background: tokens.colorAlpha(accentKey, 0.18),
            boxShadow: '0 0 40px ' + tokens.colorAlpha(accentKey, 0.25) + ', 0 8px 24px ' + tokens.colorAlpha('bg', 0.3),
            backdropFilter: 'blur(8px)',
          }}>
          <div className="text-4xl" style={{ animation: 'float 3s ease-in-out infinite, breathe 4s ease-in-out infinite' }}>
            {block.icon}
          </div>
        </div>
      </div>

      <div className="font-extrabold tracking-widest uppercase"
        style={{ fontSize: '13px', color: c }}>
        {block.meta?.elemen || ''} · Kelas {block.meta?.fase || 'VII'}
      </div>

      {/* Title — inline editable */}
      <h1 className="font-black leading-tight mt-3 min-w-0 line-clamp-3"
        style={{ fontSize: 'clamp(18px, 3.5vw, 32px)', fontFamily: tokens.fontFamily('display'), color: tokens.color('text'), textShadow: '0 2px 12px ' + tokens.colorAlpha('bg', 0.5), overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-word' }}>
        <InlineTextEditor
          {...titleEditor}
          className="font-black leading-tight"
          style={{ color: tokens.color('text'), fontSize: 'inherit', fontFamily: 'inherit', textShadow: 'inherit', wordBreak: 'break-word' }}
        />
        {block.title.includes(' — ') && <><br /><span>{block.title.split(' — ')[1]}</span></>}
      </h1>

      {/* Subtitle */}
      <InlineTextEditor
        {...subtitleEditor}
        className="mt-3 max-w-[380px]"
        style={{ fontSize: 'clamp(11px, 1.8vw, 16px)', color: tokens.textSecondary(0.7) }}
        placeholder="Ketik subtitle..."
      />

      {/* Badges — stagger entrance + premium-card-glow hover */}
      {block.badges && block.badges.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 max-w-full">
          {block.badges.map((b, i) => (
            <span key={`badge-a-${b.text?.slice(0,10)}-${i}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold min-w-0 premium-card-glow"
              style={{
                fontSize: '12px',
                background: tokens.colorAlpha(b.color, 0.2),
                color: tokens.color(b.color),
                border: '1px solid ' + tokens.colorAlpha(b.color, 0.35),
                backdropFilter: 'blur(12px)',
                boxShadow: '0 2px 8px ' + tokens.colorAlpha(b.color, 0.15),
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                wordBreak: 'break-word',
                maxWidth: '100%',
                animation: `blockStaggerIn 0.4s ease ${i * 0.1}s both`,
              }}>
              {b.icon && <span className="flex-shrink-0">{b.icon}</span>} <span className="min-w-0">{b.text}</span>
            </span>
          ))}
        </div>
      )}

      {/* Meta — glass card */}
      {block.meta && (
        <div className="mt-5 px-4 py-2.5 rounded-xl"
          style={{
            fontSize: '12px',
            color: tokens.muted(0.8),
            background: tokens.colorAlpha('c', 0.08),
            border: '1px solid ' + tokens.colorAlpha('c', 0.2),
            backdropFilter: 'blur(8px)',
          }}>
          ⏱️ {block.meta.durasi} | 🎯 Fase {block.meta.fase} | 📚 Elemen: {block.meta.elemen}
        </div>
      )}

      {/* CTA */}
      {block.cta && (
        <button className={`mt-6 rounded-[99px] text-[0.9rem] font-extrabold transition-all ${
          interactive ? 'hover:scale-105 active:scale-95 cursor-pointer' : 'cursor-default'
        }`}
          style={{
            background: 'linear-gradient(135deg, ' + y + ', ' + tokens.color('o') + ')',
            color: tokens.color('bg'),
            padding: '12px 28px',
            boxShadow: '0 6px 24px ' + tokens.colorAlpha('y', 0.4) + ', 0 2px 8px ' + tokens.colorAlpha('bg', 0.2),
          }}>
          {block.cta.label}
        </button>
      )}

      {/* Bottom decoration */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {[y, c, g].map((color, i) => (
          <div key={`cover-deco-a-${i}`} className="w-10 h-1.5 rounded-full" style={{ background: color, opacity: 0.7, boxShadow: '0 0 8px ' + tokens.colorAlpha(['y','c','g'][i], 0.4) }} />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VARIANT B "Sinematik" — Cinematic full-bleed, movie poster layout
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
        background: 'linear-gradient(180deg, ' + tokens.color('bg2') + ' 0%, ' + tokens.color('bg') + ' 60%, ' + tokens.colorAlpha(accentKey, 0.12) + ' 100%)',
        animation: 'coverReveal 0.6s ease-out',
        overflow: 'hidden',
      }}>

      {/* Animated gradient border on outer edge */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          border: '2px solid transparent',
          backgroundImage: `linear-gradient(${tokens.color('bg')}, ${tokens.color('bg')}), linear-gradient(135deg, ${y}, ${c}, ${y}, ${tokens.color('o')}, ${y})`,
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          animation: 'gradientBorderRotate 4s linear infinite',
          backgroundSize: '100% 100%, 300% 300%',
        }} />

      {/* Large watermark icon behind title */}
      <div className="absolute pointer-events-none"
        style={{
          top: '8%',
          right: '-5%',
          fontSize: 'clamp(120px, 30vw, 220px)',
          opacity: 0.08,
          lineHeight: 1,
          animation: 'float 6s ease-in-out infinite, breathe 8s ease-in-out infinite',
          filter: 'blur(1px)',
        }}>
        {block.icon}
      </div>

      {/* Content — left-aligned */}
      <div className="relative z-1 max-w-[90%]">
        {/* Meta label */}
        <div className="font-extrabold tracking-widest uppercase mb-2"
          style={{ fontSize: '11px', color: tokens.colorAlpha(accentKey, 0.7), letterSpacing: '0.15em' }}>
          {block.meta?.elemen || ''} · Kelas {block.meta?.fase || 'VII'}
        </div>

        {/* Title — left-aligned, bold */}
        <h1 className="font-black leading-tight min-w-0 line-clamp-3"
          style={{
            fontSize: 'clamp(22px, 5vw, 42px)',
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
          className="mt-3 max-w-[480px]"
          style={{ fontSize: 'clamp(12px, 2vw, 17px)', color: tokens.textSecondary(0.7), lineHeight: 1.6 }}
          placeholder="Ketik subtitle..."
        />

        {/* Badges — horizontal flow */}
        {block.badges && block.badges.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2 max-w-full">
            {block.badges.map((b, i) => (
              <span key={`badge-b-${b.text?.slice(0,10)}-${i}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold min-w-0 premium-card-glow"
                style={{
                  fontSize: '11px',
                  background: tokens.colorAlpha(b.color, 0.15),
                  color: tokens.color(b.color),
                  border: '1px solid ' + tokens.colorAlpha(b.color, 0.3),
                  backdropFilter: 'blur(12px)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  wordBreak: 'break-word',
                  maxWidth: '100%',
                  animation: `blockStaggerIn 0.4s ease ${i * 0.1}s both`,
                }}>
                {b.icon && <span className="flex-shrink-0">{b.icon}</span>} <span className="min-w-0">{b.text}</span>
              </span>
            ))}
          </div>
        )}

        {/* Meta — compact row */}
        {block.meta && (
          <div className="mt-4 flex items-center gap-3 flex-wrap"
            style={{ fontSize: '11px', color: tokens.muted(0.6) }}>
            <span>⏱️ {block.meta.durasi}</span>
            <span style={{ color: tokens.colorAlpha('c', 0.3) }}>|</span>
            <span>🎯 Fase {block.meta.fase}</span>
            <span style={{ color: tokens.colorAlpha('c', 0.3) }}>|</span>
            <span>📚 {block.meta.elemen}</span>
          </div>
        )}

        {/* CTA */}
        {block.cta && (
          <button className={`mt-5 rounded-lg text-[0.85rem] font-extrabold transition-all ${
            interactive ? 'hover:scale-105 active:scale-95 cursor-pointer' : 'cursor-default'
          }`}
            style={{
              background: 'linear-gradient(135deg, ' + y + ', ' + tokens.color('o') + ')',
              color: tokens.color('bg'),
              padding: '10px 24px',
              boxShadow: '0 4px 20px ' + tokens.colorAlpha('y', 0.35),
            }}>
            {block.cta.label}
          </button>
        )}
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1"
        style={{ background: `linear-gradient(90deg, ${y}, ${c}, ${y})` }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VARIANT C "Minimalis" — Ultra-clean, solid bg, left-aligned
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
        background: tokens.color('bg'),
        animation: 'coverReveal 0.6s ease-out',
      }}>

      {/* Thin accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: y }} />

      {/* Content — left-aligned with generous whitespace */}
      <div className="max-w-[85%]">
        {/* Small icon inline before title */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl" style={{ animation: 'breathe 5s ease-in-out infinite' }}>
            {block.icon}
          </span>
          <div className="font-extrabold tracking-widest uppercase"
            style={{ fontSize: '10px', color: tokens.muted(0.5), letterSpacing: '0.2em' }}>
            {block.meta?.elemen || ''} · Kelas {block.meta?.fase || 'VII'}
          </div>
        </div>

        {/* Title */}
        <h1 className="font-black leading-tight min-w-0 line-clamp-3"
          style={{
            fontSize: 'clamp(20px, 4vw, 36px)',
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
          className="mt-3 max-w-[440px]"
          style={{ fontSize: 'clamp(12px, 1.8vw, 16px)', color: tokens.textSecondary(0.6), lineHeight: 1.6 }}
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
          <div className="mt-5 flex items-center gap-4 flex-wrap"
            style={{ fontSize: '11px', color: tokens.muted(0.5) }}>
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
              color: y,
              padding: '10px 24px',
              border: '2px solid ' + y,
            }}>
            {block.cta.label}
          </button>
        )}
      </div>

      {/* Minimal bottom line */}
      <div className="absolute bottom-6 left-10 right-10">
        <div className="h-px" style={{ background: tokens.colorAlpha('c', 0.12) }} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT — CoverRenderer
// ═══════════════════════════════════════════════════════════════════
export function CoverRenderer({ block, tokens, interactive, isCompact, isEditing }: {
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

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <VariantSelector current={variant} onChange={handleVariantChange} isEditing={isEditing} />
      {variant === 'A' && <CoverVariantA {...sharedProps} />}
      {variant === 'B' && <CoverVariantB {...sharedProps} />}
      {variant === 'C' && <CoverVariantC {...sharedProps} />}
    </div>
  );
}
