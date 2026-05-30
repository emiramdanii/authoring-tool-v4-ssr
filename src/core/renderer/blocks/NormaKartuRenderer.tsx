'use client';

import React from 'react';
import type { NormaKartuBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { RichText } from './RichText';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';
import type { CompressionDecision } from '../../layout/CompressionEngine';
import { useBlockCompression } from '../../layout/useBlockCompression';

// ═══════════════════════════════════════════════════════════════════
// SECTION ACCORDION — Per-section collapsible with tap-to-expand
// Each nk-card section (Characteristics, Sanksi, Contoh, Pelanggaran)
// can be independently expanded/collapsed to fit 1280×720 canvas.
// ═══════════════════════════════════════════════════════════════════

function SectionAccordion({ title, titleColor, accentKey, tokens, edu, isCompact, children, defaultOpen = false }: {
  title: string;
  titleColor: string;
  accentKey: string;
  tokens: TokenResolver;
  edu: ReturnType<TokenResolver['edu']>;
  isCompact: boolean;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="mt-3 rounded-xl overflow-hidden"
      style={{
        border: '1px solid ' + tokens.colorAlpha(accentKey, 0.2),
        borderLeft: `${edu.stripeWidth()}px solid ${tokens.color(accentKey)}`,
      }}>
      {/* Accordion Header — always visible, tappable */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between p-2.5 text-left transition-colors"
        style={{
          background: isOpen ? tokens.colorAlpha(accentKey, 0.12) : tokens.colorAlpha(accentKey, 0.06),
          cursor: 'pointer',
        }}
        aria-expanded={isOpen}
      >
        <span className="font-extrabold uppercase tracking-wider" style={{ ...edu.caption(), color: titleColor }}>
          {title}
        </span>
        <span
          className="material-symbols-outlined text-base transition-transform duration-200"
          style={{
            color: titleColor,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            fontVariationSettings: "'FILL' 0, 'wght' 600, 'GRAD' 0, 'opsz' 20",
          }}
        >
          expand_more
        </span>
      </button>
      {/* Accordion Body — only rendered when open */}
      {isOpen && (
        <div className="p-3" style={{
          background: tokens.colorAlpha(accentKey, 0.04),
          animation: 'fadeIn 0.2s ease',
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

export const NormaKartuRenderer = React.memo(function NormaKartuRenderer({ block, tokens, isCompact, isEditing, compression }: {
  block: NormaKartuBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean; compression?: CompressionDecision;
}) {
  // ── Edu rendering context ────────────────────────────────────
  const edu = tokens.edu('nk-card', isCompact);

  const colorMap: Record<string, string> = {
    agama: 'y',
    kesusilaan: 'r',
    kesopanan: 'c',
    hukum: 'p',
  };
  const colorKey = colorMap[block.normaType] || 'y';
  const color = tokens.color(colorKey);

  // ── Compression-aware visibility ────────────────────────────
  // When isCompressed=true, ALL sections collapse to headers-only
  // When isCompressed=false, characteristics open by default,
  // other sections collapsed (tap to expand) — fits 572px available
  const { isCompressed } = useBlockCompression({
    compression,
    totalItems: 1,
  });

  // ── Inline editing hooks ─────────────────────────────────────
  const titleEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'title',
    value: block.title ?? '',
    tag: 'span',
  });
  const definitionEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'definition',
    value: block.definition ?? '',
    tag: 'span',
  });
  const contohEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'contoh',
    value: block.contoh ?? '',
    tag: 'span',
  });

  return (
    <PremiumBlockWrapper tokens={tokens} accent="c" staggerIndex={0} gradientBorder>
      <ReadingProgressIndicator progress={1} tokens={tokens} accent="c" height={2} position="top" />
    <div className="rounded-2xl premium-card-glow p-4" style={{
      background: tokens.colorAlpha(colorKey, 0.12),
      border: '1px solid ' + tokens.colorAlpha(colorKey, 0.3),
      boxShadow: edu.shadow('card'),
      animation: 'fadeIn 0.3s ease',
      overflow: 'hidden',
    }}>
      {/* Header — always visible */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{
            background: tokens.colorAlpha(colorKey, 0.25),
            boxShadow: '0 6px 16px ' + tokens.colorAlpha(colorKey, 0.3),
          }}>
          {block.icon}
        </div>
        <div className="min-w-0">
          <PremiumBadge tokens={tokens} accent={colorKey} variant="solid">{block.label}</PremiumBadge>
          <div className="font-black mt-0.5" style={{ ...edu.heading(), fontFamily: tokens.fontFamily('display'), color }}>
            <InlineTextEditor {...titleEditor} className="font-black" style={{ color, fontSize: 'inherit', fontFamily: 'inherit' }} />
          </div>
        </div>
      </div>

      {/* Definition — always visible */}
      <div className={`leading-relaxed mb-3 ${isCompact ? 'canvas-truncate-2' : ''}`} style={{ ...edu.body(), color: edu.textColor(), wordBreak: 'break-word', overflowWrap: 'break-word' }}>
        <InlineTextEditor {...definitionEditor} className="leading-relaxed" style={{ overflowWrap: 'break-word', fontSize: 'inherit' }} placeholder="Ketik definisi..." />
      </div>

      {/* ══ SECTIONS AS ACCORDIONS ════════════════════════════════
          Each section is independently collapsible.
          When isCompressed: ALL sections collapsed (header only = ~370px)
          When not compressed: Characteristics open by default,
          others collapsed — one expanded section at ~170px fits in 572px.
      */}

      {/* Characteristics — default open when not compressed */}
      {!isCompressed && (block.characteristics || []).length > 0 && (
        <SectionAccordion
          title="📌 Karakteristik"
          titleColor={color}
          accentKey={colorKey}
          tokens={tokens}
          edu={edu}
          isCompact={isCompact}
          defaultOpen={true}
        >
          <div className="grid grid-cols-2 gap-2.5">
            {(block.characteristics || []).map((c, i) => (
              <MicroInteraction key={`nk-char-mi-${c.label?.slice(0,8)}-${i}`} tokens={tokens} accent={colorKey} effect="squish">
              <div className="rounded-xl p-2.5 min-w-0 overflow-hidden"
                style={{
                  background: tokens.colorAlpha(colorKey, 0.08),
                  border: '1px solid ' + tokens.colorAlpha(colorKey, 0.15),
                }}>
                <div className="font-extrabold uppercase tracking-wider mb-0.5" style={{ ...edu.caption(), color, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{c.label}</div>
                <div className={`leading-relaxed ${isCompact ? 'canvas-truncate-1' : ''}`} style={{ ...edu.body(), color: edu.textColor(), wordBreak: 'break-word', overflowWrap: 'break-word' }}><RichText content={c.value ?? ''} /></div>
              </div>
              </MicroInteraction>
            ))}
          </div>
        </SectionAccordion>
      )}

      {/* Sanksi — collapsed by default */}
      {!isCompressed && block.sanksi && (
        <SectionAccordion
          title={block.sanksi.title}
          titleColor={tokens.color('o')}
          accentKey="o"
          tokens={tokens}
          edu={edu}
          isCompact={isCompact}
          defaultOpen={false}
        >
          {block.sanksi.items.map((s, i) => (
            <div key={`nk-sanksi-${s.text?.slice(0,8)}-${i}`} className={`flex items-start gap-2 mb-1.5 leading-relaxed min-w-0 ${isCompact ? 'canvas-truncate-1' : ''}`} style={{ ...edu.body(), color: edu.textColor() }}>
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ background: s.dot || color }} />
              <span className="min-w-0" style={{ wordBreak: 'break-word' }}><RichText content={s.text ?? ''} /></span>
            </div>
          ))}
        </SectionAccordion>
      )}

      {/* Contoh — collapsed by default */}
      {!isCompressed && block.contoh && (
        <SectionAccordion
          title="📖 Contoh"
          titleColor={color}
          accentKey={colorKey}
          tokens={tokens}
          edu={edu}
          isCompact={isCompact}
          defaultOpen={false}
        >
          <div className="leading-relaxed"
            style={{
              ...edu.body(),
              overflow: 'hidden',
              wordBreak: 'break-word',
            }}>
            <InlineTextEditor {...contohEditor} className={`leading-relaxed ${isCompact ? 'canvas-truncate-2' : ''}`} style={{ wordBreak: 'break-word', overflowWrap: 'break-word', fontSize: 'inherit' }} placeholder="Ketik contoh..." />
          </div>
        </SectionAccordion>
      )}

      {/* Pelanggaran — collapsed by default */}
      {!isCompressed && block.pelanggaran && (
        <SectionAccordion
          title={block.pelanggaran.title}
          titleColor={tokens.color('r')}
          accentKey="r"
          tokens={tokens}
          edu={edu}
          isCompact={isCompact}
          defaultOpen={false}
        >
          {block.pelanggaran.items.map((p, i) => (
            <div key={`nk-pelanggaran-${p.text?.slice(0,8)}-${i}`} className="flex gap-2 mb-1.5 leading-relaxed min-w-0" style={{ ...edu.body(), color: edu.textColor() }}>
              <span className="flex-shrink-0">{p.icon}</span> <span className="min-w-0" style={{ wordBreak: 'break-word' }}><RichText content={p.text ?? ''} /></span>
            </div>
          ))}
        </SectionAccordion>
      )}

      {/* Compressed state: show section labels only as tappable badges */}
      {isCompressed && (
        <div className="flex flex-wrap gap-2 mt-2">
          {(block.characteristics || []).length > 0 && (
            <span className="px-3 py-1.5 rounded-lg font-bold" style={{ ...edu.caption(), background: tokens.colorAlpha(colorKey, 0.1), color, border: '1px solid ' + tokens.colorAlpha(colorKey, 0.2) }}>
              📌 Karakteristik
            </span>
          )}
          {block.sanksi && (
            <span className="px-3 py-1.5 rounded-lg font-bold" style={{ ...edu.caption(), background: tokens.colorAlpha('o', 0.1), color: tokens.color('o'), border: '1px solid ' + tokens.colorAlpha('o', 0.2) }}>
              {block.sanksi.title}
            </span>
          )}
          {block.contoh && (
            <span className="px-3 py-1.5 rounded-lg font-bold" style={{ ...edu.caption(), background: tokens.colorAlpha(colorKey, 0.1), color, border: '1px solid ' + tokens.colorAlpha(colorKey, 0.2) }}>
              📖 Contoh
            </span>
          )}
          {block.pelanggaran && (
            <span className="px-3 py-1.5 rounded-lg font-bold" style={{ ...edu.caption(), background: tokens.colorAlpha('r', 0.1), color: tokens.color('r'), border: '1px solid ' + tokens.colorAlpha('r', 0.2) }}>
              {block.pelanggaran.title}
            </span>
          )}
        </div>
      )}
    </div>
    </PremiumBlockWrapper>
  );
});
