// ═══════════════════════════════════════════════════════════════════
// SCHEMA RENDERER ENGINE — Converts JSON Schema → React UI
// ═══════════════════════════════════════════════════════════════════
// This is the core engine. It reads LessonSchema/ScreenSchema JSON
// and produces the same visual output as the original HTML templates,
// but using the existing React component system (PageFrame, BlockRenderer).
//
// The principle: NEVER store HTML. Store schema. Renderer produces UI.
// This enables: consistent rendering, export to HTML/React/PDF/PPT/SCORM.

'use client';

import React from 'react';
import { alpha } from '@/lib/color-palette';
import type { DesignTokens } from '../themes/tokens';
import { resolveTokens } from '../themes/tokens';
import type {
  SchemaBlock,
  ScreenSchema,
  LessonSchema,
  CoverBlock,
  PetunjukBlock,
  TpBlock,
  AlurBlock,
  SkenarioBlock,
  DefBoxBlock,
  NcGridBlock,
  FlashcardSetBlock,
  FtabBlock,
  NormaKartuBlock,
  DiskusiBlock,
  KuisBlock,
  SortirGameBlock,
  RodaGameBlock,
  RefleksiBlock,
  PenutupBlock,
  TabelAccordionBlock,
  HasilBlock,
} from '../schema/types';

// ═══════════════════════════════════════════════════════════════════
// RENDER MODE — Same as PageRendererMode
// ═══════════════════════════════════════════════════════════════════

export type SchemaRenderMode = 'canvas' | 'preview' | 'export';

export interface SchemaRendererProps {
  schema: LessonSchema;
  screenIndex: number;
  mode: SchemaRenderMode;
  /** Override theme (for preview switching) */
  themeOverride?: string;
  /** Interactive mode (playable widgets) */
  interactive?: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// TOKEN RESOLVER — Maps token keys to actual CSS values
// ═══════════════════════════════════════════════════════════════════

export class TokenResolver {
  private tokens: DesignTokens;

  constructor(themeId?: string) {
    this.tokens = resolveTokens(themeId);
  }

  /** Get a color by token key (e.g., 'y' → '#f9c12e') */
  color(key: string): string {
    const colors = this.tokens.colors as Record<string, string>;
    return colors[key] || key; // Pass through if not a token key (already a hex)
  }

  /** Get color with alpha */
  colorAlpha(key: string, a: number): string {
    return alpha(this.color(key), a);
  }

  /** Get spacing value in px */
  spacing(key: keyof DesignTokens['spacing']): string {
    return `${this.tokens.spacing[key]}px`;
  }

  /** Get radius value in px */
  radius(key: keyof DesignTokens['radius']): string {
    return `${this.tokens.radius[key]}px`;
  }

  /** Get font family */
  fontFamily(key: keyof DesignTokens['typography']['fontFamily']): string {
    // Use CSS variables from next/font/google (defined in layout.tsx)
    // Falls back to the token value if CSS vars aren't available
    if (key === 'display') return 'var(--font-fredoka), Fredoka, cursive';
    if (key === 'body') return 'var(--font-nunito), Nunito, sans-serif';
    return this.tokens.typography.fontFamily[key];
  }

  /** Get font size */
  fontSize(key: keyof DesignTokens['typography']['fontSize']): string {
    return this.tokens.typography.fontSize[key];
  }

  /** Get raw tokens */
  get raw(): DesignTokens {
    return this.tokens;
  }
}

// ═══════════════════════════════════════════════════════════════════
// SCREEN RENDERER — Renders a single ScreenSchema
// ═══════════════════════════════════════════════════════════════════

export interface ScreenRendererProps {
  screen: ScreenSchema;
  mode: SchemaRenderMode;
  tokens: TokenResolver;
  interactive?: boolean;
}

export function SchemaScreenRenderer({ screen, mode, tokens, interactive = false }: ScreenRendererProps) {
  const isCompact = mode === 'canvas';
  // Cover blocks render as absolute (full-page), other blocks flow
  const hasCoverBlock = screen.blocks.length === 1 && screen.blocks[0].type === 'cover';

  // Respect screen.background if defined (from schema)
  const bgStyle: React.CSSProperties = {};
  if (screen.background && hasCoverBlock) {
    if (screen.background.type === 'radial') {
      bgStyle.background = `radial-gradient(ellipse 90% 60% at 50% 0%, ${tokens.colorAlpha(screen.background.color1 || 'y', 0.18)}, transparent 60%), linear-gradient(180deg, ${tokens.color(screen.background.color2 || 'bg')}, ${tokens.color('bg2')})`;
    } else if (screen.background.type === 'gradient') {
      bgStyle.background = `linear-gradient(180deg, ${tokens.color(screen.background.color1 || 'y')}, ${tokens.color(screen.background.color2 || 'bg')})`;
    }
  }

  return (
    <div className={hasCoverBlock ? 'absolute inset-0' : 'relative flex flex-col h-full'}
      style={{ fontFamily: tokens.fontFamily('body'), color: tokens.color('text'), ...bgStyle }}>
      {/* Section label chip — preset-style */}
      {screen.sectionLabel && !hasCoverBlock && (
        <div className="px-4 pt-3">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-extrabold text-[10px] uppercase"
            style={{
              background: tokens.colorAlpha(screen.sectionColor || 'y', 0.15),
              color: tokens.color(screen.sectionColor || 'y'),
              letterSpacing: '0.08em',
            }}
          >
            {screen.sectionLabel}
          </span>
        </div>
      )}

      {/* Blocks — preset-style padding with max-width for content */}
      <div className={`flex-1 min-h-0 overflow-y-auto custom-scrollbar ${hasCoverBlock ? '' : 'px-4 py-5'}`}
        style={hasCoverBlock ? undefined : { maxWidth: 860, margin: '0 auto', width: '100%' }}>
        {screen.blocks.map((block, i) => (
          <SchemaBlockRenderer
            key={block.id || i}
            block={block}
            mode={mode}
            tokens={tokens}
            interactive={interactive}
          />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// BLOCK RENDERER — Dispatches to type-specific renderers
// ═══════════════════════════════════════════════════════════════════

export interface BlockRenderProps {
  block: SchemaBlock;
  mode: SchemaRenderMode;
  tokens: TokenResolver;
  interactive?: boolean;
}

export function SchemaBlockRenderer({ block, mode, tokens, interactive = false }: BlockRenderProps) {
  const isCompact = mode === 'canvas';

  switch (block.type) {
    case 'cover':
      return <CoverRenderer block={block as CoverBlock} tokens={tokens} interactive={interactive} />;
    case 'petunjuk':
      return <PetunjukRenderer block={block as PetunjukBlock} tokens={tokens} isCompact={isCompact} />;
    case 'tp':
      return <TpRenderer block={block as TpBlock} tokens={tokens} isCompact={isCompact} />;
    case 'alur':
      return <AlurRenderer block={block as AlurBlock} tokens={tokens} isCompact={isCompact} />;
    case 'skenario':
      return <SkenarioRenderer block={block as SkenarioBlock} tokens={tokens} interactive={interactive} />;
    case 'def-box':
      return <DefBoxRenderer block={block as DefBoxBlock} tokens={tokens} isCompact={isCompact} />;
    case 'nc-grid':
      return <NcGridRenderer block={block as NcGridBlock} tokens={tokens} isCompact={isCompact} />;
    case 'flashcard-set':
      return <FlashcardRenderer block={block as FlashcardSetBlock} tokens={tokens} isCompact={isCompact} />;
    case 'ftab':
      return <FtabRenderer block={block as FtabBlock} mode={mode} tokens={tokens} />;
    case 'nk-card':
      return <NormaKartuRenderer block={block as NormaKartuBlock} tokens={tokens} isCompact={isCompact} />;
    case 'diskusi':
      return <DiskusiRenderer block={block as DiskusiBlock} tokens={tokens} interactive={interactive} isCompact={isCompact} />;
    case 'kuis':
      return <KuisRenderer block={block as KuisBlock} tokens={tokens} interactive={interactive} isCompact={isCompact} />;
    case 'sortir-game':
      return <SortirGameRenderer block={block as SortirGameBlock} tokens={tokens} interactive={interactive} isCompact={isCompact} />;
    case 'roda-game':
      return <RodaGameRenderer block={block as RodaGameBlock} tokens={tokens} interactive={interactive} isCompact={isCompact} />;
    case 'hasil':
      return <HasilRenderer block={block as HasilBlock} tokens={tokens} />;
    case 'refleksi':
      return <RefleksiRenderer block={block as RefleksiBlock} tokens={tokens} interactive={interactive} isCompact={isCompact} />;
    case 'penutup':
      return <PenutupRenderer block={block as PenutupBlock} tokens={tokens} isCompact={isCompact} />;
    case 'tabel-accord':
      return <TabelAccordionRenderer block={block as TabelAccordionBlock} tokens={tokens} isCompact={isCompact} />;
    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// TYPE-SPECIFIC RENDERERS
// ═══════════════════════════════════════════════════════════════════
// Each renderer maps schema data → styled React components using
// design tokens (NOT hardcoded values).

// ── Cover ──────────────────────────────────────────────────────

function CoverRenderer({ block, tokens, interactive }: {
  block: CoverBlock; tokens: TokenResolver; interactive?: boolean;
}) {
  const y = tokens.color('y');
  const c = tokens.color('c');
  const g = tokens.color('g');
  const accentKey = block.accentColor || 'y';

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
      style={{ background: `radial-gradient(ellipse 90% 60% at 50% 0%, ${tokens.colorAlpha(accentKey, 0.22)}, transparent 60%), linear-gradient(180deg, ${tokens.color('bg')}, ${tokens.color('bg2')})` }}>

      {/* Decorative top bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5"
        style={{ background: `linear-gradient(90deg, ${y}, ${c}, ${y})` }} />

      {/* Icon with glowing container */}
      <div className="mb-5 relative">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            background: tokens.colorAlpha(accentKey, 0.18),
            boxShadow: `0 0 40px ${tokens.colorAlpha(accentKey, 0.25)}, 0 8px 24px rgba(0,0,0,.3)`,
            backdropFilter: 'blur(8px)',
          }}>
          <div className="text-4xl" style={{ animation: 'float 3s ease-in-out infinite' }}>
            {block.icon}
          </div>
        </div>
      </div>

      <div className="text-[11px] font-extrabold tracking-widest uppercase"
        style={{ color: c }}>
        {block.meta?.elemen || ''} · Kelas {block.meta?.fase || 'VII'}
      </div>

      <h1 className="font-black text-white leading-tight mt-3"
        style={{ fontSize: 'clamp(18px, 3.5vw, 32px)', fontFamily: tokens.fontFamily('display'), textShadow: '0 2px 12px rgba(0,0,0,.5)' }}>
        <span style={{ color: y }}>{block.title.split(' — ')[0]}</span>
        {block.title.includes(' — ') && <><br />{block.title.split(' — ')[1]}</>}
      </h1>

      <p className="mt-3 max-w-[380px] text-white/70"
        style={{ fontSize: 'clamp(11px, 1.8vw, 16px)' }}>
        {block.subtitle}
      </p>

      {/* Badges — glass-morphism pill style */}
      {block.badges && block.badges.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {block.badges.map((b, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold"
              style={{
                background: tokens.colorAlpha(b.color, 0.2),
                color: tokens.color(b.color),
                border: `1px solid ${tokens.colorAlpha(b.color, 0.35)}`,
                backdropFilter: 'blur(12px)',
                boxShadow: `0 2px 8px ${tokens.colorAlpha(b.color, 0.15)}`,
              }}>
              {b.icon && <span>{b.icon}</span>} {b.text}
            </span>
          ))}
        </div>
      )}

      {/* Meta — glass card */}
      {block.meta && (
        <div className="mt-5 px-4 py-2.5 rounded-xl text-[10px] text-white/60"
          style={{
            background: tokens.colorAlpha('c', 0.08),
            border: `1px solid ${tokens.colorAlpha('c', 0.2)}`,
            backdropFilter: 'blur(8px)',
          }}>
          ⏱️ {block.meta.durasi} | 🎯 Fase {block.meta.fase} | 📚 Elemen: {block.meta.elemen}
        </div>
      )}

      {/* CTA — show always; interactive hover only in preview/export */}
      {block.cta && (
        <button className={`mt-6 rounded-[99px] text-[0.9rem] font-extrabold transition-all ${
          interactive ? 'hover:scale-105 active:scale-95 cursor-pointer' : 'cursor-default'
        }`}
          style={{
            background: `linear-gradient(135deg, ${y}, ${tokens.color('o')})`,
            color: tokens.color('bg'),
            padding: '12px 28px',
            boxShadow: `0 6px 24px ${tokens.colorAlpha('y', 0.4)}, 0 2px 8px rgba(0,0,0,.2)`,
          }}>
          {block.cta.label}
        </button>
      )}

      {/* Bottom decoration */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {[y, c, g].map((color, i) => (
          <div key={i} className="w-10 h-1.5 rounded-full" style={{ background: color, opacity: 0.7, boxShadow: `0 0 8px ${tokens.colorAlpha(['y','c','g'][i], 0.4)}` }} />
        ))}
      </div>
    </div>
  );
}

// ── Petunjuk ───────────────────────────────────────────────────

function PetunjukRenderer({ block, tokens, isCompact }: {
  block: PetunjukBlock; tokens: TokenResolver; isCompact: boolean;
}) {
  const accentKey = block.tipsColor || 'y';

  return (
    <div className={isCompact ? 'p-1' : 'p-2'}>
      <h2 className="font-black leading-tight"
        style={{ fontSize: isCompact ? '14px' : '1.6rem', fontFamily: tokens.fontFamily('display'), color: tokens.color('text') }}>
        {block.title} <span style={{ color: tokens.color('y') }}>{block.titleHighlight}</span>
      </h2>

      <div className={`grid grid-cols-2 gap-3 mt-4`}>
        {block.items.map((item, i) => {
          const colorCycle = ['y', 'c', 'g', 'p'];
          const itemColor = colorCycle[i % colorCycle.length];
          return (
            <div key={i} className="rounded-xl p-3.5 text-center transition-all hover:-translate-y-0.5"
              style={{
                background: tokens.colorAlpha(itemColor, 0.1),
                border: `1px solid ${tokens.colorAlpha(itemColor, 0.2)}`,
                borderLeftWidth: '3px',
                borderLeftColor: tokens.color(itemColor),
                borderRadius: `${tokens.radius('xl')}px`,
                boxShadow: tokens.raw.shadow.card,
              }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2"
                style={{
                  background: tokens.colorAlpha(itemColor, 0.2),
                  boxShadow: `0 4px 12px ${tokens.colorAlpha(itemColor, 0.25)}`,
                }}>
                <span className="text-xl">{item.icon}</span>
              </div>
              <div className="text-[11px] font-extrabold mb-1.5" style={{ color: tokens.color(itemColor) }}>{item.title}</div>
              <div className="text-[10px] text-white/55 leading-relaxed">{item.body}</div>
            </div>
          );
        })}
      </div>

      {block.tips && (
        <div className="mt-4 p-3.5 rounded-xl text-[11px] leading-relaxed"
          style={{
            background: tokens.colorAlpha(accentKey, 0.12),
            border: `1px solid ${tokens.colorAlpha(accentKey, 0.3)}`,
            boxShadow: tokens.raw.shadow.card,
          }}>
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: tokens.colorAlpha(accentKey, 0.25), boxShadow: `0 2px 8px ${tokens.colorAlpha(accentKey, 0.2)}` }}>
              <span className="text-xs">💡</span>
            </div>
            <div>
              <strong style={{ color: tokens.color(accentKey) }}>Tips:</strong> {block.tips}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TP ─────────────────────────────────────────────────────────

function TpRenderer({ block, tokens, isCompact }: {
  block: TpBlock; tokens: TokenResolver; isCompact: boolean;
}) {
  return (
    <div className={isCompact ? 'p-1' : 'p-2'}>
      <h2 className="font-black leading-tight"
        style={{ fontSize: isCompact ? '14px' : '1.6rem', fontFamily: tokens.fontFamily('display') }}>
        {block.title} <span style={{ color: tokens.color('y') }}>{block.titleHighlight}</span>
      </h2>

      <div className="flex flex-col gap-3 mt-4">
        {block.items.map((item, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl p-3 transition-all hover:-translate-y-0.5"
            style={{
              background: tokens.colorAlpha(item.color, 0.1),
              border: `1px solid ${tokens.colorAlpha(item.color, 0.25)}`,
              borderLeft: `4px solid ${tokens.color(item.color)}`,
              borderRadius: `${tokens.radius('xl')}px`,
              boxShadow: tokens.raw.shadow.card,
            }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-black flex-shrink-0"
              style={{
                background: tokens.colorAlpha(item.color, 0.2),
                color: tokens.color(item.color),
                boxShadow: `0 4px 12px ${tokens.colorAlpha(item.color, 0.25)}`,
              }}>
              {item.num}
            </div>
            <div>
              <div className="text-[11px] font-extrabold" style={{ color: tokens.color(item.color) }}>{item.verb}</div>
              <div className="text-[10px] text-white/60 leading-relaxed mt-0.5">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {block.profil && (
        <div className="mt-4 p-3.5 rounded-xl text-[11px] leading-relaxed"
          style={{
            background: tokens.colorAlpha('g', 0.12),
            border: `1px solid ${tokens.colorAlpha('g', 0.3)}`,
            borderLeft: `4px solid ${tokens.color('g')}`,
            borderRadius: `${tokens.radius('xl')}px`,
            boxShadow: tokens.raw.shadow.card,
          }}>
          <strong style={{ color: tokens.color('g') }}>🔗 Profil Pelajar Pancasila:</strong> {block.profil}
        </div>
      )}
    </div>
  );
}

// ── Alur ───────────────────────────────────────────────────────

function AlurRenderer({ block, tokens, isCompact }: {
  block: AlurBlock; tokens: TokenResolver; isCompact: boolean;
}) {
  return (
    <div className={`mt-3 rounded-xl ${isCompact ? 'p-2' : 'p-4'}`}
      style={{
        background: tokens.colorAlpha('c', 0.08),
        border: `1px solid ${tokens.colorAlpha('c', 0.2)}`,
        boxShadow: tokens.raw.shadow.card,
      }}>
      <div className="text-[10px] font-extrabold uppercase tracking-wider mb-3"
        style={{ color: tokens.color('c') }}>
        ⏱️ Alur Kegiatan {block.totalDurasi || ''}
      </div>
      <div className="flex flex-col gap-2">
        {block.steps.map((step, i) => (
          <div key={i} className="flex gap-2.5 items-start p-3 rounded-lg transition-all hover:-translate-y-0.5"
            style={{
              background: tokens.colorAlpha(step.dot, 0.08),
              border: `1px solid ${tokens.colorAlpha(step.dot, 0.15)}`,
              borderLeft: `3px solid ${tokens.color(step.dot)}`,
            }}>
            <div className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
              style={{ background: tokens.color(step.dot), boxShadow: `0 0 8px ${tokens.colorAlpha(step.dot, 0.4)}` }} />
            <span className="text-[11px] font-black min-w-[36px] flex-shrink-0 mt-0.5"
              style={{ color: tokens.color(step.dot) }}>
              {step.durasi}
            </span>
            <span className="text-[10px] leading-relaxed">
              <strong className="text-white">{step.judul}</strong> — {step.deskripsi}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Def Box ────────────────────────────────────────────────────

function DefBoxRenderer({ block, tokens, isCompact }: {
  block: DefBoxBlock; tokens: TokenResolver; isCompact: boolean;
}) {
  const borderColor = tokens.color(block.borderColor || 'y');
  const colorKey = block.borderColor || 'y';
  return (
    <div className={isCompact ? 'rounded-lg p-2.5 my-2' : 'rounded-lg p-4 my-3'}
      style={{
        borderLeft: `${isCompact ? 3 : 4}px solid ${borderColor}`,
        background: tokens.colorAlpha(colorKey, 0.1),
        borderRadius: `0 ${tokens.radius('xl')}px ${tokens.radius('xl')}px 0`,
        fontSize: isCompact ? '10px' : '0.91rem',
        lineHeight: 1.7,
        boxShadow: tokens.raw.shadow.card,
      }}>
      <span dangerouslySetInnerHTML={{ __html: block.content }} />
    </div>
  );
}

// ── NC Grid ────────────────────────────────────────────────────

function NcGridRenderer({ block, tokens, isCompact }: {
  block: NcGridBlock; tokens: TokenResolver; isCompact: boolean;
}) {
  return (
    <div className={`grid grid-cols-2 gap-3 my-3`}>
      {block.cards.map((card, i) => (
        <div key={i} className="rounded-xl p-3.5 border transition-all hover:-translate-y-1 hover:shadow-lg"
          style={{
            background: tokens.colorAlpha(card.color, 0.1),
            borderColor: tokens.colorAlpha(card.color, 0.25),
            borderRadius: `${tokens.radius('xl')}px`,
            boxShadow: tokens.raw.shadow.card,
          }}>
          <div className="flex items-center gap-2.5 mb-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0`}
              style={{
                background: tokens.colorAlpha(card.color, 0.2),
                boxShadow: `0 4px 12px ${tokens.colorAlpha(card.color, 0.25)}`,
              }}>
              <span className={isCompact ? 'text-base' : 'text-xl'}>{card.icon}</span>
            </div>
            <span className="font-extrabold text-[11px]" style={{ color: tokens.color(card.color) }}>{card.title}</span>
          </div>
          <div className="text-[10px] text-white/55 leading-relaxed">{card.body}</div>
        </div>
      ))}
    </div>
  );
}

// ── Flashcard ──────────────────────────────────────────────────

function FlashcardRenderer({ block, tokens, isCompact }: {
  block: FlashcardSetBlock; tokens: TokenResolver; isCompact: boolean;
}) {
  const [idx, setIdx] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const cards = block.cards;
  if (cards.length === 0) return null;
  const card = cards[idx];

  return (
    <div className={isCompact ? 'mt-2' : 'mt-4'}>
      <div className="text-[10px] font-extrabold uppercase tracking-wider mb-3"
        style={{ color: tokens.color('y') }}>
        🃏 Kartu Kilat — Uji Ingatanmu
      </div>
      <div className="rounded-xl cursor-pointer"
        style={{
          minHeight: isCompact ? 80 : 130,
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'none',
          transition: 'transform 0.6s',
        }}
        onClick={() => setFlipped(!flipped)}>

        {/* Front */}
        <div className="rounded-xl p-4 flex flex-col justify-center"
          style={{
            background: tokens.color('card'),
            border: `2px solid ${tokens.colorAlpha('y', 0.3)}`,
            backfaceVisibility: 'hidden',
            boxShadow: `${tokens.raw.shadow.card}, 0 0 20px ${tokens.colorAlpha('y', 0.1)}`,
          }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: tokens.colorAlpha('y', 0.2) }}>
              <span className="text-[10px]">❓</span>
            </div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: tokens.color('y') }}>Pertanyaan</div>
          </div>
          <div className="font-extrabold text-[12px] leading-relaxed">{card.q}</div>
        </div>

        {/* Back */}
        {flipped && (
          <div className="rounded-xl p-4 mt-2"
            style={{
              background: tokens.colorAlpha('g', 0.12),
              border: `2px solid ${tokens.colorAlpha('g', 0.35)}`,
              boxShadow: `${tokens.raw.shadow.card}, 0 0 20px ${tokens.colorAlpha('g', 0.1)}`,
            }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: tokens.colorAlpha('g', 0.2) }}>
                <span className="text-[10px]">✅</span>
              </div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: tokens.color('g') }}>Jawaban</div>
            </div>
            <div className="text-[11px] leading-relaxed" style={{ color: tokens.color('g') }}>{card.a}</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between mt-3">
        <button className="px-3 py-1.5 rounded-full text-[10px] font-bold transition-all hover:scale-105"
          style={{
            background: tokens.colorAlpha('y', 0.15),
            color: tokens.color('y'),
            border: `1px solid ${tokens.colorAlpha('y', 0.3)}`,
          }}
          onClick={() => { setIdx(Math.max(0, idx - 1)); setFlipped(false); }} disabled={idx === 0}>
          ← Prev
        </button>
        <div className="flex gap-1.5">
          {cards.map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full transition-all"
              style={{
                background: i === idx ? tokens.color('y') : i < idx ? tokens.color('g') : 'rgba(255,255,255,.12)',
                boxShadow: i === idx ? `0 0 8px ${tokens.colorAlpha('y', 0.5)}` : 'none',
              }} />
          ))}
        </div>
        <button className="px-3 py-1.5 rounded-full text-[10px] font-bold transition-all hover:scale-105"
          style={{
            background: tokens.colorAlpha('y', 0.15),
            color: tokens.color('y'),
            border: `1px solid ${tokens.colorAlpha('y', 0.3)}`,
          }}
          onClick={() => { setIdx(Math.min(cards.length - 1, idx + 1)); setFlipped(false); }}
          disabled={idx >= cards.length - 1}>
          Next →
        </button>
      </div>
    </div>
  );
}

// ── Ftab (Fungsi Tabs) ─────────────────────────────────────────

function FtabRenderer({ block, mode, tokens }: {
  block: FtabBlock; mode: SchemaRenderMode; tokens: TokenResolver;
}) {
  const [activeTab, setActiveTab] = React.useState(0);
  const [readTabs, setReadTabs] = React.useState<Set<number>>(new Set());

  const handleTab = (i: number) => {
    setActiveTab(i);
    setReadTabs(prev => new Set([...prev, i]));
  };

  const tab = block.tabs[activeTab];

  return (
    <div>
      <div className="flex gap-2 flex-wrap">
        {block.tabs.map((t, i) => (
          <button key={i} onClick={() => handleTab(i)}
            className={`relative px-3.5 py-1.5 rounded-full text-[10px] font-extrabold transition-all ${
              activeTab === i ? 'scale-105' : 'opacity-60 hover:opacity-90'
            }`}
            style={{
              background: activeTab === i ? tokens.color('y') : 'rgba(255,255,255,.06)',
              color: activeTab === i ? tokens.color('bg') : tokens.colorAlpha('muted', 0.6),
              border: `1px solid ${activeTab === i ? tokens.color('y') : 'rgba(255,255,255,.1)'}`,
              boxShadow: activeTab === i ? `0 0 16px ${tokens.colorAlpha('y', 0.35)}` : 'none',
            }}>
            {t.icon} {t.label}
            {block.showReadMarker && readTabs.has(i) && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black"
                style={{ background: tokens.color('g'), color: tokens.color('bg'), boxShadow: `0 0 8px ${tokens.colorAlpha('g', 0.5)}` }}>✓</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab && (
        <div className="mt-3 rounded-xl p-3"
          style={{
            background: 'rgba(255,255,255,.04)',
            border: `1px solid ${tokens.colorAlpha('y', 0.15)}`,
            animation: 'fadeIn 0.3s ease',
          }}>
          {tab.content.map((b, i) => (
            <SchemaBlockRenderer key={i} block={b} mode={mode} tokens={tokens} />
          ))}
        </div>
      )}

      {/* Progress */}
      {block.showProgress && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,.08)' }}>
            <div className="h-full rounded-full transition-all"
              style={{
                width: `${(readTabs.size / block.tabs.length) * 100}%`,
                background: tokens.color('g'),
                boxShadow: `0 0 8px ${tokens.colorAlpha('g', 0.4)}`,
              }} />
          </div>
          <span className="text-[10px] font-bold" style={{ color: tokens.color('g') }}>
            {readTabs.size}/{block.tabs.length}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Norma Kartu ────────────────────────────────────────────────

function NormaKartuRenderer({ block, tokens, isCompact }: {
  block: NormaKartuBlock; tokens: TokenResolver; isCompact: boolean;
}) {
  const colorMap: Record<string, string> = {
    agama: 'y',
    kesusilaan: 'r',
    kesopanan: 'c',
    hukum: 'p',
  };
  const colorKey = colorMap[block.normaType] || 'y';
  const color = tokens.color(colorKey);

  return (
    <div className="rounded-2xl p-4" style={{
      background: tokens.colorAlpha(colorKey, 0.12),
      border: `1px solid ${tokens.colorAlpha(colorKey, 0.3)}`,
      boxShadow: tokens.raw.shadow.card,
      animation: 'fadeIn 0.3s ease',
    }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{
            background: tokens.colorAlpha(colorKey, 0.25),
            boxShadow: `0 6px 16px ${tokens.colorAlpha(colorKey, 0.3)}`,
          }}>
          {block.icon}
        </div>
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color }}>{block.label}</div>
          <div className="font-black text-[16px] mt-0.5" style={{ fontFamily: tokens.fontFamily('display'), color }}>{block.title}</div>
        </div>
      </div>

      {/* Definition */}
      <div className="text-[11px] leading-relaxed mb-4">{block.definition}</div>

      {/* Characteristics 2-col */}
      {block.characteristics.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5">
          {block.characteristics.map((c, i) => (
            <div key={i} className="rounded-xl p-3"
              style={{
                background: tokens.colorAlpha(colorKey, 0.08),
                border: `1px solid ${tokens.colorAlpha(colorKey, 0.15)}`,
              }}>
              <div className="text-[10px] font-extrabold uppercase tracking-wider mb-1" style={{ color }}>{c.label}</div>
              <div className="text-[10px] leading-relaxed">{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Sanksi */}
      {block.sanksi && (
        <div className="rounded-xl p-3 mt-3"
          style={{
            background: tokens.colorAlpha('o', 0.08),
            border: `1px solid ${tokens.colorAlpha('o', 0.2)}`,
            borderLeft: `3px solid ${tokens.color('o')}`,
          }}>
          <div className="text-[10px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: tokens.color('o') }}>{block.sanksi.title}</div>
          {block.sanksi.items.map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-[10px] mb-1.5 leading-relaxed">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ background: s.dot || color }} />
              {s.text}
            </div>
          ))}
        </div>
      )}

      {/* Contoh */}
      {block.contoh && (
        <div className="mt-3 p-3 rounded-xl text-[10px] leading-relaxed"
          style={{
            background: tokens.colorAlpha(colorKey, 0.08),
            border: `1px solid ${tokens.colorAlpha(colorKey, 0.15)}`,
            borderLeft: `3px solid ${color}`,
          }}>
          <span className="font-extrabold" style={{ color }}>📖 Contoh:</span> {block.contoh}
        </div>
      )}

      {/* Pelanggaran */}
      {block.pelanggaran && (
        <div className="mt-3 p-3 rounded-xl"
          style={{
            background: tokens.colorAlpha('r', 0.08),
            border: `1px solid ${tokens.colorAlpha('r', 0.25)}`,
            borderLeft: `3px solid ${tokens.color('r')}`,
          }}>
          <div className="text-[10px] font-extrabold uppercase tracking-wider mb-1.5"
            style={{ color: tokens.color('r') }}>{block.pelanggaran.title}</div>
          {block.pelanggaran.items.map((p, i) => (
            <div key={i} className="flex gap-2 text-[10px] mb-1.5 leading-relaxed">
              <span>{p.icon}</span> {p.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Diskusi ────────────────────────────────────────────────────

function DiskusiRenderer({ block, tokens, interactive, isCompact }: {
  block: DiskusiBlock; tokens: TokenResolver; interactive: boolean; isCompact: boolean;
}) {
  return (
    <div className="mt-3 rounded-2xl p-4"
      style={{
        background: tokens.colorAlpha('c', 0.1),
        border: `2px solid ${tokens.colorAlpha('c', 0.3)}`,
        boxShadow: `${tokens.raw.shadow.card}, 0 0 24px ${tokens.colorAlpha('c', 0.08)}`,
      }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: tokens.colorAlpha('c', 0.2), boxShadow: `0 4px 12px ${tokens.colorAlpha('c', 0.25)}` }}>
          <span className="text-sm">💬</span>
        </div>
        <div className="text-[12px] font-extrabold" style={{ color: tokens.color('c') }}>
          {block.title}
        </div>
      </div>
      {block.intro && <p className="text-[11px] mt-1 leading-relaxed font-bold mb-3">{block.intro}</p>}

      {block.questions.map((q, i) => (
        <div key={i} className="mt-4 rounded-xl p-3"
          style={{
            background: 'rgba(255,255,255,.05)',
            border: `1px solid ${tokens.colorAlpha('c', 0.15)}`,
            borderLeft: `3px solid ${tokens.color('c')}`,
          }}>
          <div className="flex items-center gap-2">
            <span className="text-base">{q.icon}</span>
            <span className="text-[11px] font-extrabold" style={{ color: tokens.color('c') }}>{q.label}</span>
          </div>
          <p className="text-[11px] mt-1.5 leading-relaxed font-bold">{q.teks}</p>
          {interactive ? (
            <textarea className="w-full mt-2 rounded-lg p-2.5 text-[11px] text-white resize-y min-h-[60px]"
              style={{
                background: 'rgba(255,255,255,.06)',
                border: `1px solid ${tokens.colorAlpha('c', 0.2)}`,
              }}
              placeholder={q.petunjuk} />
          ) : (
            <div className="w-full mt-2 rounded-lg p-2.5 text-[10px] text-white/30 min-h-[40px]"
              style={{
                background: 'rgba(255,255,255,.03)',
                border: `1px dashed ${tokens.colorAlpha('c', 0.25)}`,
              }}>
              {q.petunjuk}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Skenario ───────────────────────────────────────────────────

function SkenarioRenderer({ block, tokens, interactive }: {
  block: SkenarioBlock; tokens: TokenResolver; interactive: boolean;
}) {
  const [chapter, setChapter] = React.useState(0);
  const [history, setHistory] = React.useState<Array<{ chapterIdx: number; choiceIdx: number; good: boolean; pts: number }>>([]);
  const [selectedChoice, setSelectedChoice] = React.useState<{ choiceIdx: number; choice: typeof block.chapters[0]['choices'][0] } | null>(null);
  const [showFeedback, setShowFeedback] = React.useState(false);

  const ch = block.chapters[chapter];
  const isCompleted = chapter >= block.chapters.length;

  const handleChoice = (choiceIdx: number) => {
    const choice = ch.choices[choiceIdx];
    setHistory(prev => [...prev, { chapterIdx: chapter, choiceIdx, good: choice.good, pts: choice.pts }]);
    setSelectedChoice({ choiceIdx, choice });
    setShowFeedback(true);

    setTimeout(() => {
      setShowFeedback(false);
      setSelectedChoice(null);
      const nextCh = choice.nextChapter != null ? choice.nextChapter : chapter + 1;
      if (nextCh < block.chapters.length) {
        setChapter(nextCh);
      } else {
        setChapter(nextCh); // Mark completed
      }
    }, 3000);
  };

  const totalPts = history.reduce((sum, h) => sum + h.pts, 0);
  const green = tokens.color('g');
  const red = tokens.color('r');
  const yellow = tokens.color('y');

  return (
    <div className="mt-3 rounded-2xl overflow-hidden border-2"
      style={{ background: tokens.color('bg'), borderColor: tokens.colorAlpha('c', 0.3), boxShadow: tokens.raw.shadow.elevated }}>
      {/* HUD with gradient accent line */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: `linear-gradient(90deg, ${tokens.color('c')}, ${yellow}, ${tokens.color('c')})` }} />
        <div className="flex items-center justify-between p-3 border-b-2"
          style={{ background: `linear-gradient(90deg, ${tokens.color('bg')}, ${tokens.color('bg2')})`, borderColor: tokens.colorAlpha('c', 0.2) }}>
          <span className="font-black text-[11px]" style={{ color: yellow, fontFamily: tokens.fontFamily('display') }}>
            🎭 {block.title}
          </span>
          <div className="flex gap-2">
            <span className="px-2.5 py-1 rounded-full text-[9px] font-extrabold"
              style={{ background: tokens.colorAlpha('y', 0.15), color: yellow, border: `1px solid ${tokens.colorAlpha('y', 0.3)}`, boxShadow: `0 0 8px ${tokens.colorAlpha('y', 0.15)}` }}>
              ⭐ {totalPts}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[9px] font-extrabold"
              style={{ background: tokens.colorAlpha('c', 0.15), color: tokens.color('c'), border: `1px solid ${tokens.colorAlpha('c', 0.3)}` }}>
              Babak {Math.min(chapter + 1, block.chapters.length)}/{block.chapters.length}
            </span>
          </div>
        </div>
      </div>

      {/* Body — always render content; interactive controls only when interactive */}
      {ch && !showFeedback && (
        <div className="p-4">
          {/* Setup */}
          {ch.setup && ch.setup.length > 0 && (
            <div className="mb-4 space-y-2">
              {ch.setup.map((line, i) => {
                const isNarrator = line.speaker.toUpperCase() === 'NARRATOR' || line.speaker.toUpperCase() === 'NARATOR';
                return (
                  <div key={i} className={`flex gap-2 ${isNarrator ? 'italic' : ''}`}>
                    <span className={`text-[10px] font-bold flex-shrink-0 mt-0.5 ${isNarrator ? 'text-white/40' : 'text-pink-300'}`}>
                      {isNarrator ? '📖' : line.speaker ? `${line.speaker}:` : ''}
                    </span>
                    <span className={`text-[11px] leading-relaxed ${isNarrator ? 'text-white/50' : 'text-white/75'}`}>
                      {line.text}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Choice prompt */}
          {ch.choicePrompt && (
            <div className="text-[10px] text-white/60 italic mb-3 p-2.5 rounded-lg"
              style={{
                background: tokens.colorAlpha('c', 0.08),
                border: `1px solid ${tokens.colorAlpha('c', 0.2)}`,
              }}>
              💭 {ch.choicePrompt}
            </div>
          )}

          {/* Choices — interactive or read-only preview */}
          <div className="space-y-2.5">
            {ch.choices.map((c, j) => (
              interactive ? (
                <button key={j} onClick={() => handleChoice(j)}
                  className="w-full flex items-start gap-2.5 px-4 py-3 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'rgba(255,255,255,.05)',
                    border: `1px solid rgba(255,255,255,.12)`,
                    boxShadow: tokens.raw.shadow.card,
                  }}>
                  <span className="text-lg mt-0.5">{c.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-white">{c.label}</div>
                    {c.detail && <div className="text-[10px] text-white/40 mt-0.5 line-clamp-2">{c.detail}</div>}
                  </div>
                </button>
              ) : (
                <div key={j}
                  className="w-full flex items-start gap-2.5 px-4 py-3 rounded-xl text-left"
                  style={{
                    background: 'rgba(255,255,255,.05)',
                    border: `1px solid rgba(255,255,255,.12)`,
                    boxShadow: tokens.raw.shadow.card,
                  }}>
                  <span className="text-lg mt-0.5">{c.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-white">{c.label}</div>
                    {c.detail && <div className="text-[10px] text-white/40 mt-0.5 line-clamp-2">{c.detail}</div>}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Feedback */}
      {showFeedback && selectedChoice && (
        <div className="p-4 space-y-2.5">
          <div className={`p-3 rounded-xl text-center ${
            selectedChoice.choice.good ? '' : ''
          }`}
            style={{
              background: selectedChoice.choice.good ? tokens.colorAlpha('g', 0.12) : tokens.colorAlpha('r', 0.12),
              border: `2px solid ${selectedChoice.choice.good ? tokens.colorAlpha('g', 0.4) : tokens.colorAlpha('r', 0.4)}`,
              boxShadow: selectedChoice.choice.good ? `0 0 16px ${tokens.colorAlpha('g', 0.15)}` : `0 0 16px ${tokens.colorAlpha('r', 0.15)}`,
            }}>
            <div className="text-lg mb-1">{selectedChoice.choice.resultTitle || (selectedChoice.choice.good ? '✅' : '❌')}</div>
            <div className="text-xs font-bold" style={{ color: selectedChoice.choice.good ? tokens.color('g') : tokens.color('r') }}>
              {selectedChoice.choice.good
                ? (selectedChoice.choice.feedbackGood || 'Pilihan tepat!')
                : (selectedChoice.choice.feedbackBad || 'Coba lagi!')}
            </div>
          </div>

          {selectedChoice.choice.resultBody && (
            <div className="p-3 rounded-xl"
              style={{
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.1)',
              }}>
              <div className="text-[10px] text-white/75 leading-relaxed">{selectedChoice.choice.resultBody}</div>
            </div>
          )}

          {selectedChoice.choice.norma && (
            <div className="p-3 rounded-xl"
              style={{ background: tokens.colorAlpha('y', 0.1), border: `1px solid ${tokens.colorAlpha('y', 0.25)}` }}>
              <div className="text-[10px] font-bold mb-0.5" style={{ color: yellow }}>📜 Kaitan Norma</div>
              <div className="text-[10px] text-white/65 leading-relaxed">{selectedChoice.choice.norma}</div>
            </div>
          )}

          {selectedChoice.choice.consequences && selectedChoice.choice.consequences.length > 0 && (
            <div className="p-3 rounded-xl"
              style={{
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.1)',
              }}>
              <div className="text-[10px] font-bold text-white/50 mb-1.5">🔔 Dampak</div>
              {selectedChoice.choice.consequences.map((con, k) => (
                <div key={k} className="flex items-start gap-1.5 text-[10px] text-white/60 leading-relaxed mb-1">
                  <span className="mt-px">{con.icon}</span> {con.text}
                </div>
              ))}
            </div>
          )}

          {selectedChoice.choice.pts > 0 && (
            <div className="text-center">
              <span className="text-[10px] font-bold px-3 py-1 rounded-full"
                style={{ background: tokens.colorAlpha('g', 0.15), color: green, boxShadow: `0 0 8px ${tokens.colorAlpha('g', 0.2)}` }}>
                +{selectedChoice.choice.pts} poin
              </span>
            </div>
          )}
        </div>
      )}

      {/* Progress bar — more visible */}
      <div className="flex gap-1 p-3 border-t"
        style={{ background: tokens.color('bg'), borderColor: tokens.colorAlpha('c', 0.15) }}>
        {block.chapters.map((_, i) => (
          <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
            style={{
              background: i < chapter ? green : i === chapter ? yellow : tokens.colorAlpha('muted', 0.2),
              boxShadow: i === chapter ? `0 0 8px ${yellow}` : i < chapter ? `0 0 4px ${tokens.colorAlpha('g', 0.3)}` : 'none',
            }} />
        ))}
      </div>
    </div>
  );
}

// ── Kuis (Quiz) ────────────────────────────────────────────────

function KuisRenderer({ block, tokens, interactive, isCompact }: {
  block: KuisBlock; tokens: TokenResolver; interactive: boolean; isCompact: boolean;
}) {
  const [current, setCurrent] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<number, number>>({});

  const q = block.questions[current];
  if (!q) return null;

  const totalAnswered = Object.keys(answers).length;
  const totalCorrect = Object.entries(answers).filter(([idx, ans]) => ans === block.questions[Number(idx)]?.ans).length;

  return (
    <div className="space-y-3">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-extrabold" style={{ color: tokens.color('y') }}>
          🎮 {block.title}
        </div>
        <span className="px-2.5 py-1 rounded-full text-[9px] font-extrabold"
          style={{
            background: tokens.colorAlpha('y', 0.15),
            color: tokens.color('y'),
            border: `1px solid ${tokens.colorAlpha('y', 0.3)}`,
          }}>
          {current + 1}/{block.questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,.08)' }}>
        <div className="h-full rounded-full transition-all"
          style={{
            width: `${(totalAnswered / block.questions.length) * 100}%`,
            background: `linear-gradient(90deg, ${tokens.color('y')}, ${tokens.color('g')})`,
            boxShadow: `0 0 8px ${tokens.colorAlpha('y', 0.3)}`,
          }} />
      </div>

      {/* Question card */}
      <div className="p-4 rounded-xl"
        style={{
          background: tokens.colorAlpha('y', 0.06),
          border: `1px solid ${tokens.colorAlpha('y', 0.2)}`,
          boxShadow: tokens.raw.shadow.card,
        }}>
        <div className="text-[12px] font-bold leading-relaxed mb-3">{q.q}</div>
        <div className="grid grid-cols-2 gap-2.5">
          {q.opts.map((opt, i) => {
            const isAnswered = answers[current] !== undefined;
            const isCorrect = i === q.ans;
            const isPicked = answers[current] === i;
            let bg = 'rgba(255,255,255,.06)';
            let border = 'rgba(255,255,255,.1)';
            let boxShd = 'none';
            if (isAnswered) {
              if (isCorrect) {
                bg = tokens.colorAlpha('g', 0.15);
                border = tokens.color('g');
                boxShd = `0 0 12px ${tokens.colorAlpha('g', 0.2)}`;
              } else if (isPicked) {
                bg = tokens.colorAlpha('r', 0.15);
                border = tokens.color('r');
                boxShd = `0 0 12px ${tokens.colorAlpha('r', 0.2)}`;
              }
            }
            return (
              <button key={i} disabled={isAnswered}
                onClick={() => interactive && setAnswers(prev => ({ ...prev, [current]: i }))}
                className="p-2.5 rounded-xl text-[11px] font-bold text-center transition-all hover:scale-[1.02]"
                style={{ background: bg, border: `2px solid ${border}`, boxShadow: boxShd }}>
                {opt}
              </button>
            );
          })}
        </div>
        {/* Answer feedback */}
        {answers[current] !== undefined && (
          <div className="mt-3 p-3 rounded-xl text-[10px] leading-relaxed"
            style={{
              background: answers[current] === q.ans ? tokens.colorAlpha('g', 0.1) : tokens.colorAlpha('r', 0.1),
              border: `1px solid ${answers[current] === q.ans ? tokens.colorAlpha('g', 0.3) : tokens.colorAlpha('r', 0.3)}`,
              color: answers[current] === q.ans ? tokens.color('g') : tokens.color('r'),
            }}>
            {answers[current] === q.ans ? '✅ ' : '❌ '}{q.ex}
          </div>
        )}
      </div>

      {/* Next button */}
      {answers[current] !== undefined && current < block.questions.length - 1 && (
        <button className="px-5 py-2 rounded-xl text-[11px] font-extrabold transition-all hover:scale-105"
          onClick={() => setCurrent(current + 1)}
          style={{
            background: `linear-gradient(135deg, ${tokens.color('y')}, ${tokens.color('o')})`,
            color: tokens.color('bg'),
            boxShadow: `0 4px 16px ${tokens.colorAlpha('y', 0.35)}`,
          }}>
          Lanjut →
        </button>
      )}
    </div>
  );
}

// ── Sortir Game ────────────────────────────────────────────────

function SortirGameRenderer({ block, tokens, interactive, isCompact }: {
  block: SortirGameBlock; tokens: TokenResolver; interactive: boolean; isCompact: boolean;
}) {
  const [pool, setPool] = React.useState(block.pool.map(p => ({ ...p, placed: false })));
  const [kolomItems, setKolomItems] = React.useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    block.kolom.forEach(k => { init[k.id] = []; });
    return init;
  });
  const [selected, setSelected] = React.useState<string | null>(null);

  const handlePoolClick = (id: string) => {
    if (!interactive) return;
    setSelected(prev => prev === id ? null : id);
  };

  const handleKolomClick = (kolomId: string) => {
    if (!interactive || !selected) return;
    const item = pool.find(p => p.id === selected);
    if (!item) return;

    const isCorrect = item.category === kolomId;
    if (isCorrect) {
      setPool(prev => prev.map(p => p.id === selected ? { ...p, placed: true } : p));
      setKolomItems(prev => ({ ...prev, [kolomId]: [...prev[kolomId], item.text] }));
    }
    setSelected(null);
  };

  return (
    <div>
      {/* Pool */}
      <div className="flex flex-wrap gap-2.5 min-h-[50px] p-4 border-2 border-dashed rounded-xl mb-4"
        style={{
          borderColor: tokens.colorAlpha('y', 0.25),
          background: tokens.colorAlpha('y', 0.04),
        }}>
        <div className="w-full text-[9px] font-extrabold uppercase tracking-wider mb-2" style={{ color: tokens.color('y') }}>
          📦 Pilih Item
        </div>
        {pool.filter(p => !p.placed).map(p => (
          <button key={p.id} onClick={() => handlePoolClick(p.id)}
            className="px-3.5 py-2 rounded-full text-[10px] font-extrabold transition-all hover:scale-105"
            style={{
              background: selected === p.id ? tokens.colorAlpha('y', 0.2) : 'rgba(255,255,255,.07)',
              border: `2px solid ${selected === p.id ? tokens.color('y') : 'rgba(255,255,255,.15)'}`,
              boxShadow: selected === p.id ? `0 0 16px ${tokens.colorAlpha('y', 0.35)}` : tokens.raw.shadow.card,
              animation: selected === p.id ? 'pulse 1.5s ease-in-out infinite' : 'none',
            }}>
            {p.text}
          </button>
        ))}
      </div>

      {/* Kolom grid */}
      <div className="grid grid-cols-2 gap-3">
        {block.kolom.map(k => (
          <div key={k.id} onClick={() => handleKolomClick(k.id)}
            className="rounded-xl p-3.5 min-h-[70px] border-2 transition-all cursor-pointer"
            style={{
              borderColor: selected ? tokens.colorAlpha(k.color, 0.5) : tokens.colorAlpha(k.color, 0.2),
              background: selected ? tokens.colorAlpha(k.color, 0.08) : tokens.colorAlpha(k.color, 0.04),
              boxShadow: selected ? `0 0 16px ${tokens.colorAlpha(k.color, 0.15)}` : tokens.raw.shadow.card,
            }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: tokens.colorAlpha(k.color, 0.2) }}>
                <span className="text-[10px]">📂</span>
              </div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider"
                style={{ color: tokens.color(k.color) }}>
                {k.label}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {kolomItems[k.id].map((text, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full text-[9px] font-bold"
                  style={{
                    background: tokens.colorAlpha(k.color, 0.2),
                    color: tokens.color(k.color),
                    border: `1px solid ${tokens.colorAlpha(k.color, 0.3)}`,
                  }}>
                  {text}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Roda Game ──────────────────────────────────────────────────

function RodaGameRenderer({ block, tokens, interactive, isCompact }: {
  block: RodaGameBlock; tokens: TokenResolver; interactive: boolean; isCompact: boolean;
}) {
  const [current, setCurrent] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<number, number>>({});

  const q = block.questions[current];
  if (!q) return null;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: tokens.color('bg'),
        border: `2px solid ${tokens.colorAlpha('c', 0.3)}`,
        boxShadow: tokens.raw.shadow.elevated,
      }}>
      {/* Header */}
      <div className="p-3 border-b"
        style={{
          background: `linear-gradient(90deg, ${tokens.color('bg')}, ${tokens.color('bg2')})`,
          borderColor: tokens.colorAlpha('c', 0.15),
        }}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold" style={{ color: tokens.color('c'), fontFamily: tokens.fontFamily('display') }}>
            🎡 Roda Pengetahuan
          </span>
          <span className="px-2.5 py-1 rounded-full text-[9px] font-extrabold"
            style={{
              background: tokens.colorAlpha('c', 0.15),
              color: tokens.color('c'),
              border: `1px solid ${tokens.colorAlpha('c', 0.3)}`,
            }}>
            {current + 1}/{block.questions.length}
          </span>
        </div>
      </div>

      <div className="p-4">
        {/* Discussion hint */}
        {q.diskusiHint && (
          <div className="mb-3 p-3 rounded-xl"
            style={{
              background: tokens.colorAlpha('c', 0.08),
              border: `1px solid ${tokens.colorAlpha('c', 0.25)}`,
              borderLeft: `3px solid ${tokens.color('c')}`,
            }}>
            <div className="text-[10px] leading-relaxed"><strong style={{ color: tokens.color('c') }}>💬 Diskusi:</strong> {q.diskusiHint}</div>
          </div>
        )}

        {/* Question */}
        <div className="p-3 rounded-xl mb-3"
          style={{
            background: tokens.colorAlpha('y', 0.08),
            border: `1px solid ${tokens.colorAlpha('y', 0.2)}`,
          }}>
          <div className="text-[12px] font-bold leading-relaxed">{q.q}</div>
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {q.opts.map((opt, i) => {
            const isAnswered = answers[current] !== undefined;
            let bg = 'rgba(255,255,255,.05)';
            let border = 'rgba(255,255,255,.1)';
            let boxShd = 'none';
            if (isAnswered) {
              if (opt.correct) {
                bg = tokens.colorAlpha('g', 0.15);
                border = tokens.color('g');
                boxShd = `0 0 12px ${tokens.colorAlpha('g', 0.2)}`;
              } else if (answers[current] === i) {
                bg = tokens.colorAlpha('r', 0.15);
                border = tokens.color('r');
                boxShd = `0 0 12px ${tokens.colorAlpha('r', 0.2)}`;
              }
            }
            return (
              <button key={i} disabled={isAnswered}
                onClick={() => interactive && setAnswers(prev => ({ ...prev, [current]: i }))}
                className="w-full p-3 rounded-xl text-[11px] font-bold text-left transition-all hover:scale-[1.01]"
                style={{ background: bg, border: `2px solid ${border}`, boxShadow: boxShd }}>
                {opt.text}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {answers[current] !== undefined && (
          <div className="mt-3 p-3 rounded-xl text-[10px] leading-relaxed font-bold"
            style={{
              background: q.opts[answers[current]].correct ? tokens.colorAlpha('g', 0.1) : tokens.colorAlpha('r', 0.1),
              border: `1px solid ${q.opts[answers[current]].correct ? tokens.colorAlpha('g', 0.3) : tokens.colorAlpha('r', 0.3)}`,
              color: q.opts[answers[current]].correct ? tokens.color('g') : tokens.color('r'),
            }}>
            {q.opts[answers[current]].correct ? '✅ ' : '❌ '}
            {q.opts[answers[current]].correct ? (q.feedbackCorrect || 'Benar!') : (q.feedbackWrong || 'Kurang tepat.')}
          </div>
        )}

        {/* Next button */}
        {answers[current] !== undefined && current < block.questions.length - 1 && (
          <button className="mt-3 px-5 py-2 rounded-xl text-[11px] font-extrabold transition-all hover:scale-105"
            onClick={() => setCurrent(current + 1)}
            style={{
              background: `linear-gradient(135deg, ${tokens.color('y')}, ${tokens.color('o')})`,
              color: tokens.color('bg'),
              boxShadow: `0 4px 16px ${tokens.colorAlpha('y', 0.35)}`,
            }}>
            Soal Berikutnya →
          </button>
        )}
      </div>
    </div>
  );
}

// ── Hasil ──────────────────────────────────────────────────────

function HasilRenderer({ block, tokens }: {
  block: HasilBlock; tokens: TokenResolver;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-6">
      {/* Circle progress */}
      <div className="relative w-32 h-32 mb-5">
        <div className="w-32 h-32 rounded-full flex items-center justify-center"
          style={{
            background: `conic-gradient(${tokens.color('g')} 0%, ${tokens.color('g')} 75%, ${tokens.colorAlpha('g', 0.1)} 75%, ${tokens.colorAlpha('g', 0.1)} 100%)`,
            boxShadow: `0 0 30px ${tokens.colorAlpha('g', 0.15)}`,
          }}>
          <div className="w-28 h-28 rounded-full flex items-center justify-center"
            style={{ background: tokens.color('bg2') }}>
            <div className="text-center">
              <div className="text-3xl mb-1" style={{ animation: 'float 3s ease-in-out infinite' }}>🏆</div>
            </div>
          </div>
        </div>
      </div>

      <h2 className="font-black text-lg" style={{ fontFamily: tokens.fontFamily('display') }}>{block.title}</h2>
      <p className="text-[11px] text-white/55 mt-1 max-w-[320px]">{block.subtitle}</p>

      {/* Summary badges */}
      <div className="mt-4 flex gap-3">
        <div className="px-4 py-2 rounded-xl text-center"
          style={{
            background: tokens.colorAlpha('g', 0.12),
            border: `1px solid ${tokens.colorAlpha('g', 0.3)}`,
            boxShadow: tokens.raw.shadow.card,
          }}>
          <div className="text-[10px] font-extrabold" style={{ color: tokens.color('g') }}>Selesai!</div>
          <div className="font-black text-sm" style={{ color: tokens.color('g') }}>🎉</div>
        </div>
        <div className="px-4 py-2 rounded-xl text-center"
          style={{
            background: tokens.colorAlpha('y', 0.12),
            border: `1px solid ${tokens.colorAlpha('y', 0.3)}`,
            boxShadow: tokens.raw.shadow.card,
          }}>
          <div className="text-[10px] font-extrabold" style={{ color: tokens.color('y') }}>Hasil</div>
          <div className="font-black text-sm" style={{ color: tokens.color('y') }}>⭐</div>
        </div>
      </div>
    </div>
  );
}

// ── Refleksi ───────────────────────────────────────────────────

function RefleksiRenderer({ block, tokens, interactive, isCompact }: {
  block: RefleksiBlock; tokens: TokenResolver; interactive: boolean; isCompact: boolean;
}) {
  return (
    <div>
      {block.title && (
        <h2 className="font-black text-sm mb-1" style={{ fontFamily: tokens.fontFamily('display') }}>{block.title}</h2>
      )}
      {block.intro && <p className="text-[10px] text-white/55 mb-3">{block.intro}</p>}

      {block.questions.map((q, i) => {
        const qColor = q.warna || 'y';
        return (
          <div key={i} className="rounded-xl p-3.5 mb-3 transition-all hover:-translate-y-0.5"
            style={{
              background: tokens.colorAlpha(qColor, 0.06),
              border: `1px solid ${tokens.colorAlpha(qColor, 0.2)}`,
              borderLeft: `4px solid ${tokens.color(qColor)}`,
              boxShadow: tokens.raw.shadow.card,
            }}>
            <label className="text-[11px] font-extrabold block mb-2"
              style={{ color: tokens.color(qColor) }}>
              {q.icon && <span className="mr-1">{q.icon}</span>} {q.teks}
            </label>
            {interactive ? (
              <textarea className="w-full rounded-lg p-2.5 text-[11px] text-white resize-y min-h-[50px]"
                style={{
                  background: 'rgba(255,255,255,.06)',
                  border: `1px solid ${tokens.colorAlpha(qColor, 0.2)}`,
                }}
                placeholder={q.petunjuk} />
            ) : (
              <div className="w-full mt-1 rounded-lg p-2.5 text-[10px] text-white/30 min-h-[40px]"
                style={{
                  background: 'rgba(255,255,255,.03)',
                  border: `1px dashed ${tokens.colorAlpha(qColor, 0.25)}`,
                }}>
                {q.petunjuk}
              </div>
            )}
          </div>
        );
      })}

      {block.penugasan && (
        <div className="mt-4 p-4 rounded-xl"
          style={{
            background: tokens.colorAlpha('p', 0.1),
            border: `1px solid ${tokens.colorAlpha('p', 0.25)}`,
            borderLeft: `4px solid ${tokens.color('p')}`,
            boxShadow: tokens.raw.shadow.card,
          }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: tokens.colorAlpha('p', 0.2), boxShadow: `0 4px 12px ${tokens.colorAlpha('p', 0.25)}` }}>
              <span className="text-sm">📝</span>
            </div>
            <div className="text-[11px] font-extrabold" style={{ color: tokens.color('p') }}>{block.penugasan.judul}</div>
          </div>
          <div className="text-[10px] text-white/60 leading-relaxed">{block.penugasan.isi}</div>
          {block.penugasan.contoh && (
            <div className="mt-2 text-[10px] text-white/40 italic p-2 rounded-lg"
              style={{ background: tokens.colorAlpha('p', 0.06) }}>
              Contoh: {block.penugasan.contoh}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Penutup ────────────────────────────────────────────────────

function PenutupRenderer({ block, tokens, isCompact }: {
  block: PenutupBlock; tokens: TokenResolver; isCompact: boolean;
}) {
  return (
    <div>
      <h2 className="font-black text-sm" style={{ fontFamily: tokens.fontFamily('display') }}>
        {block.title} <span style={{ color: tokens.color('g') }}>{block.subtitle}</span>
      </h2>

      {/* Preview items */}
      {block.preview.length > 0 && (
        <div className="mt-4 p-4 rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${tokens.colorAlpha('c', 0.1)}, ${tokens.colorAlpha('p', 0.1)})`,
            border: `1px solid ${tokens.colorAlpha('c', 0.25)}`,
            boxShadow: tokens.raw.shadow.card,
          }}>
          <div className="text-[10px] font-extrabold uppercase tracking-wider mb-3" style={{ color: tokens.color('c') }}>
            📋 Ringkasan
          </div>
          {block.preview.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl mb-2 text-[10px] font-bold leading-relaxed transition-all hover:-translate-y-0.5"
              style={{
                background: tokens.colorAlpha(item.warna, 0.1),
                border: `1px solid ${tokens.colorAlpha(item.warna, 0.2)}`,
                boxShadow: tokens.raw.shadow.card,
              }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: tokens.colorAlpha(item.warna, 0.2) }}>
                <span className="text-xs">{item.icon}</span>
              </div>
              <div><strong style={{ color: tokens.color(item.warna) }}>{item.judul}</strong> — <span className="text-white/55">{item.isi}</span></div>
            </div>
          ))}
        </div>
      )}

      {/* Next pertemuan preview */}
      {block.nextPertemuan && (
        <div className="mt-4 p-4 rounded-2xl"
          style={{
            background: tokens.colorAlpha('g', 0.08),
            border: `1px solid ${tokens.colorAlpha('g', 0.2)}`,
            borderLeft: `4px solid ${tokens.color('g')}`,
            boxShadow: tokens.raw.shadow.card,
          }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: tokens.colorAlpha('g', 0.2), boxShadow: `0 4px 12px ${tokens.colorAlpha('g', 0.25)}` }}>
              <span className="text-sm">📌</span>
            </div>
            <div className="text-[11px] font-extrabold" style={{ color: tokens.color('g') }}>Pertemuan Berikutnya: {block.nextPertemuan.judul}</div>
          </div>
          <div className="text-[10px] text-white/55 mb-3">{block.nextPertemuan.deskripsi}</div>
          <div className="grid grid-cols-2 gap-2">
            {block.nextPertemuan.items.map((item, i) => (
              <div key={i} className="rounded-xl p-2.5 text-[10px] font-bold text-center transition-all hover:-translate-y-0.5"
                style={{
                  background: tokens.colorAlpha(item.warna, 0.12),
                  color: tokens.color(item.warna),
                  border: `1px solid ${tokens.colorAlpha(item.warna, 0.25)}`,
                  boxShadow: tokens.raw.shadow.card,
                }}>
                {item.icon} {item.judul}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tabel Accordion ────────────────────────────────────────────

function TabelAccordionRenderer({ block, tokens, isCompact }: {
  block: TabelAccordionBlock; tokens: TokenResolver; isCompact: boolean;
}) {
  const [openIdx, setOpenIdx] = React.useState<number | null>(null);

  return (
    <div className="flex flex-col gap-2 mt-3">
      {block.rows.map((row, i) => (
        <div key={i} className="rounded-xl overflow-hidden transition-all"
          style={{
            border: `1px solid ${openIdx === i ? tokens.colorAlpha(row.color, 0.35) : tokens.colorAlpha(row.color, 0.12)}`,
            background: openIdx === i ? tokens.colorAlpha(row.color, 0.08) : tokens.colorAlpha(row.color, 0.04),
            boxShadow: tokens.raw.shadow.card,
          }}>
          <button className="w-full flex items-center gap-2.5 p-3 font-extrabold text-[11px] cursor-pointer transition-all hover:bg-white/[0.03]"
            onClick={() => setOpenIdx(openIdx === i ? null : i)}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: tokens.colorAlpha(row.color, 0.2), boxShadow: `0 2px 8px ${tokens.colorAlpha(row.color, 0.2)}` }}>
              <span className="text-sm">{row.icon}</span>
            </div>
            <span style={{ color: tokens.color(row.color) }}>{row.title}</span>
            <span className="ml-auto text-[10px] transition-transform duration-300"
              style={{ transform: openIdx === i ? 'rotate(180deg)' : 'none', color: tokens.color(row.color) }}>▼</span>
          </button>
          {openIdx === i && (
            <div className="px-3.5 pb-3.5"
              style={{ animation: 'fadeIn 0.3s ease' }}>
              <div className="grid grid-cols-2 gap-2.5">
                {row.details.map((d, j) => (
                  <div key={j} className="rounded-xl p-2.5"
                    style={{
                      background: tokens.colorAlpha(row.color, 0.08),
                      border: `1px solid ${tokens.colorAlpha(row.color, 0.12)}`,
                    }}>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider mb-1" style={{ color: tokens.color(row.color) }}>{d.label}</div>
                    <div className="text-[10px] leading-relaxed">{d.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
