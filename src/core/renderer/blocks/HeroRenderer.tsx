'use client';

import React, { useCallback } from 'react';
import type { HeroBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { useCanvaStore } from '../../../store/canva/store';
import { PremiumBlockWrapper, MicroInteraction } from './PremiumBlockEffects';

// ═══════════════════════════════════════════════════════════════════
// HERO RENDERER — Banner/section header with 3 Creative Variants
// ═══════════════════════════════════════════════════════════════════
// Unlike Cover (full-page), Hero is a banner block within a page.
// It introduces a section but doesn't dominate the entire scene.
//
// Variants:
//   A "Megah" — Grand banner with gradient, large title, badges
//   B "Kompak" — Compact horizontal layout, icon left, text right
//   C "Bercahaya" — Glowing accent line, centered, subtle animation
//
// All text/labels in Indonesian (Bahasa Indonesia).
//
// EDU MIGRATION: Replaced iosTypography() with edu tokens.
//   - iosTypography('title2','title3','hero') → edu.title() (scene-aware)
//   - iosTypography('caption2','footnote','subheadline') → edu.caption()/edu.body()
//   - Hardcoded 9-12px badge text → edu.micro()
//   - iosSectionPadding → edu.sectionPadding()
//   - iosEntranceStyle → edu.entrance()
//   - iosIconSize → edu.iconSize()
//   - tokens.accentStripe() → edu.stripeWidth() + accent (scene-aware density)
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
          className={`variant-pill focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent ${current === v ? 'active' : ''}`}
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
// VARIANT A "Megah" — Grand banner with gradient + large title
// ═══════════════════════════════════════════════════════════════════
function HeroVariantA({
  block, tokens, interactive, isEditing, isCompact,
  titleEditor, subtitleEditor,
}: {
  block: HeroBlock; tokens: TokenResolver; interactive?: boolean; isEditing?: boolean; isCompact?: boolean;
  titleEditor: ReturnType<typeof useInlineEditor>;
  subtitleEditor: ReturnType<typeof useInlineEditor>;
}) {
  const accentKey = block.accentColor || 'y';
  const y = tokens.color(accentKey);
  const c = tokens.color('c');
  const edu = tokens.edu('hero', isCompact);

  return (
    <div className="relative overflow-hidden rounded-2xl"
      style={{
        background: `linear-gradient(135deg, ${tokens.colorAlpha(accentKey, 0.15)}, ${tokens.colorAlpha('c', 0.05)})`,
        border: `1px solid ${tokens.colorAlpha(accentKey, 0.15)}`,
        ...edu.sectionPadding(),
        ...edu.entrance(0, 'fadeIn'),
      }}>

      {/* Accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{ background: y }} />

      {/* Icon */}
      <div className="mb-3">
        <div className="inline-flex items-center justify-center rounded-xl"
          style={{
            width: edu.iconSize('lg'),
            height: edu.iconSize('lg'),
            background: tokens.colorAlpha(accentKey, 0.15),
            border: `1px solid ${tokens.colorAlpha(accentKey, 0.3)}`,
            fontSize: isCompact ? '18px' : '24px',
            boxShadow: 'none',
          }}>
          {block.icon}
        </div>
      </div>

      {/* Meta label */}
      <div className="font-extrabold tracking-widest uppercase mb-1 truncate"
        style={{ ...edu.caption(), color: tokens.colorAlpha(accentKey, 0.7), letterSpacing: '0.12em' }}>
        {block.meta?.elemen || ''} {block.meta?.fase ? `· Kelas ${block.meta.fase}` : ''}
      </div>

      {/* Title — edu.title() for scene-aware section opener headline */}
      <h1 className="font-black leading-tight min-w-0"
        style={{
          ...edu.title(),
          color: edu.textColor(),
          wordBreak: 'break-word',
        }}>
        <InlineTextEditor
          {...titleEditor}
          className="font-black leading-tight"
          style={{ color: edu.textColor(), fontSize: 'inherit', fontFamily: 'inherit', wordBreak: 'break-word' }}
        />
      </h1>

      {/* Subtitle */}
      <InlineTextEditor
        {...subtitleEditor}
        className="mt-2 overflow-hidden"
        style={{ ...edu.body(), color: tokens.textSecondary(0.7), lineHeight: 1.6, maxWidth: tokens.iosSubtitleWidth('hero') }}
        placeholder="Ketik subtitle..."
      />

      {/* Badges — stagger entrance */}
      {block.badges && block.badges.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 max-w-full">
          {block.badges.map((b, i) => (
            <span key={`hero-badge-a-${b.text?.slice(0,10)}-${i}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold"
              style={{
                ...edu.micro(),
                background: tokens.accentBg(b.color, 0.08),
                color: tokens.color(b.color),
                border: `1px solid ${tokens.colorAlpha(b.color, 0.2)}`,
                ...edu.entrance(i, 'slideUp'),
              }}>
              {b.icon && <span className="flex-shrink-0">{b.icon}</span>} {b.text}
            </span>
          ))}
        </div>
      )}

      {/* CTA — wrapped in MicroInteraction for tactile feedback */}
      {block.cta && (
          <MicroInteraction tokens={tokens} accent={accentKey} effect="squish">
          <button className={`mt-4 rounded-lg font-bold ${tokens.iosButtonTw(interactive)}`}
            style={{
              ...edu.caption(),
              fontWeight: 700,
              background: y,
              color: tokens.color('bg'),
              ...tokens.iosButtonPadding('md'),
              boxShadow: tokens.iosShadow('whisper'),
            }}>
            {block.cta.label}
          </button>
          </MicroInteraction>
      )}

      {/* Bottom accent dots */}
      <div className="absolute bottom-3 right-4 flex gap-1.5">
        {[y, c, tokens.color('g')].map((color, i) => (
          <div key={`hero-deco-a-${i}`} className="w-4 h-0.5 rounded-full"
            style={{ background: color, opacity: 0.3 }} />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VARIANT B "Kompak" — Horizontal layout, icon left, text right
// ═══════════════════════════════════════════════════════════════════
function HeroVariantB({
  block, tokens, interactive, isEditing, isCompact,
  titleEditor, subtitleEditor,
}: {
  block: HeroBlock; tokens: TokenResolver; interactive?: boolean; isEditing?: boolean; isCompact?: boolean;
  titleEditor: ReturnType<typeof useInlineEditor>;
  subtitleEditor: ReturnType<typeof useInlineEditor>;
}) {
  const accentKey = block.accentColor || 'y';
  const y = tokens.color(accentKey);
  const edu = tokens.edu('hero', isCompact);

  return (
    <div className="relative overflow-hidden rounded-2xl flex items-center gap-4"
      style={{
        background: edu.cardBg(),
        border: `1px solid ${tokens.colorAlpha(accentKey, 0.15)}`,
        borderLeft: `${edu.stripeWidth()}px solid ${tokens.color(accentKey)}`,
        ...edu.sectionPadding(),
        ...edu.entrance(0, 'fadeIn'),
      }}>

      {/* Icon */}
      <div className="flex-shrink-0 flex items-center justify-center rounded-xl"
        style={{
          width: edu.iconSize('xl'),
          height: edu.iconSize('xl'),
          background: tokens.colorAlpha(accentKey, 0.12),
          border: `1px solid ${tokens.colorAlpha(accentKey, 0.25)}`,
          fontSize: isCompact ? '20px' : '26px',
        }}>
        {block.icon}
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {block.meta?.elemen && (
            <span className="font-bold tracking-wider uppercase truncate"
              style={{ ...edu.micro(), color: tokens.colorAlpha(accentKey, 0.6), letterSpacing: '0.1em' }}>
              {block.meta.elemen}
            </span>
          )}
        </div>
        <h2 className="font-black leading-tight min-w-0 truncate"
          style={{
            ...edu.heading(),
            color: edu.textColor(),
          }}>
          <InlineTextEditor
            {...titleEditor}
            className="font-black leading-tight"
            style={{ color: edu.textColor(), fontSize: 'inherit', fontFamily: 'inherit' }}
          />
        </h2>
        <InlineTextEditor
          {...subtitleEditor}
          className="mt-1 overflow-hidden"
          style={{ ...edu.caption(), color: tokens.textSecondary(0.6), lineHeight: 1.5 }}
          placeholder="Ketik subtitle..."
        />
      </div>

      {/* CTA — MicroInteraction tactile feedback */}
      {block.cta && (
        <MicroInteraction tokens={tokens} accent={accentKey} effect="squish">
        <button className={`flex-shrink-0 rounded-lg font-bold ${tokens.iosButtonTw(interactive)}`}
          style={{
            ...edu.caption(),
            fontWeight: 700,
            background: y,
            color: tokens.color('bg'),
            ...tokens.iosButtonPadding('md'),
          }}>
          {block.cta.label}
        </button>
        </MicroInteraction>
      )}

      {/* Badges — inline right with stagger entrance */}
      {block.badges && block.badges.length > 0 && (
        <div className="flex-shrink-0 flex items-center gap-1.5">
          {block.badges.map((b, i) => (
            <span key={`hero-badge-b-${b.text?.slice(0,10)}-${i}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold"
              style={{
                ...edu.micro(),
                background: tokens.colorAlpha(b.color, 0.1),
                color: tokens.color(b.color),
                border: `1px solid ${tokens.colorAlpha(b.color, 0.2)}`,
                ...edu.entrance(i, 'slideUp'),
              }}>
              {b.icon && <span>{b.icon}</span>} {b.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VARIANT C "Bercahaya" — Glowing accent line, centered
// ═══════════════════════════════════════════════════════════════════
function HeroVariantC({
  block, tokens, interactive, isEditing, isCompact,
  titleEditor, subtitleEditor,
}: {
  block: HeroBlock; tokens: TokenResolver; interactive?: boolean; isEditing?: boolean; isCompact?: boolean;
  titleEditor: ReturnType<typeof useInlineEditor>;
  subtitleEditor: ReturnType<typeof useInlineEditor>;
}) {
  const accentKey = block.accentColor || 'y';
  const y = tokens.color(accentKey);
  const edu = tokens.edu('hero', isCompact);

  return (
    <div className="relative overflow-hidden text-center"
      style={{
        ...edu.sectionPadding(),
        ...edu.entrance(0, 'fadeIn'),
      }}>

      {/* Accent line */}
      <div className="mx-auto mb-4 rounded-full"
        style={{
          width: isCompact ? 40 : 60,
          height: 2,
          background: y,
        }} />

      {/* Icon — small inline */}
      <div className="mb-2">
        <span style={{ fontSize: isCompact ? '20px' : '28px' }}>
          {block.icon}
        </span>
      </div>

      {/* Meta */}
      <div className="font-extrabold tracking-widest uppercase mb-1 truncate"
        style={{ ...edu.caption(), color: tokens.muted(0.5), letterSpacing: '0.15em' }}>
        {block.meta?.elemen || ''} {block.meta?.fase ? `· Kelas ${block.meta.fase}` : ''}
      </div>

      {/* Title */}
      <h2 className="font-black leading-tight min-w-0 mx-auto"
        style={{
          ...edu.heading(),
          color: edu.textColor(),
          maxWidth: '90%',
          wordBreak: 'break-word',
        }}>
        <InlineTextEditor
          {...titleEditor}
          className="font-black leading-tight"
          style={{ color: edu.textColor(), fontSize: 'inherit', fontFamily: 'inherit', wordBreak: 'break-word' }}
        />
      </h2>

      {/* Subtitle */}
      <InlineTextEditor
        {...subtitleEditor}
        className="mt-2 mx-auto overflow-hidden"
        style={{ ...edu.body(), color: tokens.textSecondary(0.6), lineHeight: 1.6, maxWidth: tokens.iosSubtitleWidth('heroCentered') }}
        placeholder="Ketik subtitle..."
      />

      {/* Badges — centered with stagger entrance */}
      {block.badges && block.badges.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 max-w-full">
          {block.badges.map((b, i) => (
            <span key={`hero-badge-c-${b.text?.slice(0,10)}-${i}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold"
              style={{
                ...edu.micro(),
                background: tokens.colorAlpha(b.color, 0.08),
                color: tokens.color(b.color),
                border: `1px solid ${tokens.colorAlpha(b.color, 0.15)}`,
                ...edu.entrance(i, 'slideUp'),
              }}>
              {b.icon && <span>{b.icon}</span>} {b.text}
            </span>
          ))}
        </div>
      )}

      {/* CTA — MicroInteraction tactile feedback */}
      {block.cta && (
        <MicroInteraction tokens={tokens} accent={accentKey} effect="squish">
        <button className={`mt-4 rounded-lg font-bold ${tokens.iosButtonTw(interactive)}`}
          style={{
            ...edu.caption(),
            fontWeight: 700,
            background: 'transparent',
            color: y,
            ...tokens.iosButtonPadding('md'),
            border: `1px solid ${y}`,
          }}>
          {block.cta.label}
        </button>
        </MicroInteraction>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT — HeroRenderer
// ═══════════════════════════════════════════════════════════════════
export const HeroRenderer = React.memo(function HeroRenderer({ block, tokens, interactive, isCompact, isEditing }: {
  block: HeroBlock; tokens: TokenResolver; interactive?: boolean; isCompact?: boolean; isEditing?: boolean;
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
    isCompact,
    titleEditor,
    subtitleEditor,
  };

  const accentKey = block.accentColor || 'y';
  return (
    <PremiumBlockWrapper tokens={tokens} accent={accentKey} staggerIndex={0}
      style={{ width: '100%' }}>
      <div style={{ position: 'relative', overflow: 'hidden', maxWidth: tokens.contentWidth(), margin: '0 auto' }}>
        <VariantSelector current={variant} onChange={handleVariantChange} isEditing={isEditing} />
        {variant === 'A' && <HeroVariantA {...sharedProps} />}
        {variant === 'B' && <HeroVariantB {...sharedProps} />}
        {variant === 'C' && <HeroVariantC {...sharedProps} />}
      </div>
    </PremiumBlockWrapper>
  );
});
