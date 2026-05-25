'use client';

import React from 'react';
import { Lightbulb, Info, Compass, Target, BookOpen, Shield, GraduationCap } from 'lucide-react';
import type { PetunjukBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { RichText } from './RichText';
import { PremiumBlockWrapper } from './PremiumBlockEffects';

import { useBlockCompression } from '../../layout/useBlockCompression';
import { ShowMoreButton } from '../../layout/ShowMoreButton';
import type { CompressionDecision, CompressionStrategy } from '../../layout/CompressionEngine';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const PetunjukRenderer = React.memo(function PetunjukRenderer({ block, tokens, interactive, isCompact, isEditing, pageIndex, compression }: {
  block: PetunjukBlock; tokens: TokenResolver; interactive?: boolean; isCompact: boolean; isEditing?: boolean; pageIndex?: number; compression?: CompressionDecision;
}) {
  const accentKey = block.tipsColor || 'c';
  const hasNav = block.navigation && block.navigation.length > 0;
  const hasObjectives = block.learningObjectives && block.learningObjectives.length > 0;
  const allItems = block.items || [];
  const edu = tokens.edu('petunjuk', isCompact);

  // ── Compression-aware item visibility ──────────────────────
  const { visibleCount, hasMore, hiddenCount, showMore, isCompressed, strategy } = useBlockCompression({
    compression,
    totalItems: allItems.length,
  });

  // ── Strategy-aware accordion state ────────────────────────────
  // When strategy is 'accordion', track which items are expanded.
  // First 2 items are expanded by default; rest are collapsed headers.
  const [expandedAccordions, setExpandedAccordions] = React.useState<Set<number>>(new Set([0, 1]));
  const toggleAccordion = React.useCallback((idx: number) => {
    setExpandedAccordions(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }, []);

  // For accordion strategy: show ALL items (as collapsed headers)
  // For other strategies: slice to visibleCount
  const isAccordionMode = isCompressed && strategy === 'accordion';
  const items = isAccordionMode ? allItems : (isCompressed ? allItems.slice(0, visibleCount) : allItems);

  // ── Inline editing hooks ─────────────────────────────────────
  const titleEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'title',
    value: block.title ?? '',
    tag: 'span',
  });
  const titleHighlightEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'titleHighlight',
    value: block.titleHighlight ?? '',
    tag: 'span',
  });
  const tipsEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'tips',
    value: block.tips ?? '',
    tag: 'span',
  });

  return (
    <PremiumBlockWrapper tokens={tokens} accent={accentKey} staggerIndex={0}>
    <div className={`${isCompact ? 'p-1' : 'p-2'}`}
      style={{
        background: edu.cardBg(),
        borderRadius: tokens.radius('xl') + 'px',
        border: `1px solid ${edu.accentBorder()}`,
        borderLeft: `${edu.stripeWidth()}px solid ${edu.accent()}`,
        boxShadow: edu.shadow('card'),
        position: 'relative',
        overflow: 'hidden',
      }}>

      {/* ══ BSNP Compliance Header ════════════════════════════════
       *  Every MPI must have Petunjuk as the first content page.
       *  The BSNP badge signals compliance to teachers/reviewers.
       *  Design: Ribbon-style badge at top-left with Info icon. */}
      <div className="absolute top-0 left-0"
        style={{
          background: tokens.color('c'),
          borderRadius: '0 0 10px 0',
          padding: '4px 10px 4px 8px',
          zIndex: 2,
        }}>
        <span style={{ ...edu.micro(), color: tokens.color('bg'), display: 'flex', alignItems: 'center', gap: 4 }}>
          <Info size={11} /> Petunjuk
        </span>
      </div>

      {/* BSNP "Wajib" badge — top right */}
      <div className="absolute top-0 right-0" style={{ zIndex: 2, borderRadius: '0 0 0 10px', overflow: 'hidden' }}>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full font-bold"
          style={{ ...edu.micro(), background: tokens.accentBg('y', 0.1), color: tokens.color('y'), border: `1px solid ${tokens.colorAlpha('y', 0.2)}` }}>
          <Shield size={9} /> BSNP Wajib
        </span>
      </div>

      <div style={{ paddingTop: isCompact ? '24px' : '32px' }}>
        {/* ══ TITLE ════════════════════════════════════════════════ */}
        <h2 className="font-black leading-tight"
          style={{ ...edu.heading(), color: edu.textColor(), wordBreak: 'break-word', overflowWrap: 'break-word' }}>
          <InlineTextEditor
            {...titleEditor}
            className="font-black leading-tight"
            style={{ fontSize: 'inherit', fontFamily: 'inherit', color: 'inherit' }}
          /> <InlineTextEditor
            {...titleHighlightEditor}
            className="font-black leading-tight"
            style={{ color: tokens.color('y'), fontSize: 'inherit', fontFamily: 'inherit' }}
          />
        </h2>

        {/* ══ BSNP LEARNING OBJECTIVES (Tujuan Pembelajaran) ══════
         *  BSNP mandates that every MPI states Tujuan Pembelajaran
         *  prominently. We render it ABOVE the grid items for
         *  maximum visibility — students see goals first.
         *  Visual: Green accent section with numbered objectives,
         *  each with a circular number badge. */}
        {hasObjectives && (
          <div className="mt-4 p-3.5 rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${tokens.colorAlpha('g', 0.06)}, ${tokens.colorAlpha('g', 0.02)})`,
              border: `1.5px solid ${tokens.colorAlpha('g', 0.2)}`,
              borderLeft: `${edu.stripeWidth()}px solid ${tokens.color('g')}`,
            }}>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: tokens.colorAlpha('g', 0.2), boxShadow: '0 2px 8px ' + tokens.colorAlpha('g', 0.2) }}>
                <GraduationCap size={14} style={{ color: tokens.color('g') }} />
              </div>
              <span className="font-extrabold min-w-0" style={{ ...edu.caption(), color: tokens.color('g') }}>
                Tujuan Pembelajaran
              </span>
              <span className="px-2 py-0.5 rounded-full font-extrabold flex-shrink-0"
                style={{
                  ...edu.micro(),
                  background: tokens.colorAlpha('g', 0.15),
                  color: tokens.color('g'),
                  border: '1px solid ' + tokens.colorAlpha('g', 0.25),
                }}>
                BSNP WAJIB
              </span>
            </div>
            <div className="space-y-2">
              {(block.learningObjectives || []).map((obj, i) => (
                <div key={`obj-${block.id || 'pet'}-${i}`}
                  className="flex items-start gap-2.5"
                  style={{ ...edu.body() }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: tokens.colorAlpha('g', 0.15),
                      border: '1.5px solid ' + tokens.colorAlpha('g', 0.3),
                    }}>
                    <span className="font-extrabold" style={{ ...edu.micro(), color: tokens.color('g') }}>{obj.num || i + 1}</span>
                  </div>
                  <div className={`min-w-0 leading-relaxed ${isCompact ? 'canvas-truncate-2' : ''}`}
                    style={{ color: edu.textColor() }}>
                    <RichText content={obj.text ?? ''} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ GRID ITEMS — Strategy-aware compression rendering ═══
         *  ACCORDION strategy: All items visible, but collapsed items
         *  show only a header row. Click to expand/collapse.
         *  REVEAL-SET / COLLAPSIBLE: Slice to visibleCount + ShowMore.
         *  NO COMPRESSION: Full grid with all items expanded. */}
        <div className={`mt-4 ${isAccordionMode ? 'flex flex-col gap-2' : `grid gap-3 ${isCompact ? 'grid-cols-1' : 'grid-cols-2'}`}`}>
          {items.map((item, i) => {
            const colorCycle = ['y', 'c', 'g', 'p'];
            const itemColor = colorCycle[i % colorCycle.length];

            // ── Accordion mode: collapsible item with header ──────
            if (isAccordionMode) {
              const isExpanded = expandedAccordions.has(i);
              return (
                <div key={`petunjuk-acc-${block.id || 'pet'}-${i}`}
                  className="rounded-xl overflow-hidden transition-[background-color,border-color]"
                  style={{
                    background: tokens.colorAlpha!(itemColor, 0.06),
                    border: `1px solid ${tokens.colorAlpha!(itemColor, isExpanded ? 0.3 : 0.15)}`,
                    borderLeftWidth: `${edu.stripeWidth()}px`,
                    borderLeftColor: tokens.color!(itemColor),
                    borderRadius: tokens.radius('lg') + 'px',
                  }}
                >
                  {/* Accordion header — always visible */}
                  <button
                    onClick={() => toggleAccordion(i)}
                    className={`w-full flex items-center gap-2.5 text-left ${tokens.iosAccordionTw()}`}
                    style={{
                      ...edu.nestedPadding(),
                      cursor: 'pointer',
                      background: isExpanded ? tokens.colorAlpha!(itemColor, 0.08) : 'transparent',
                    }}
                  >
                    <span style={{ fontSize: isCompact ? '13px' : '16px' }}>{item.icon}</span>
                    <span className="font-bold flex-1 min-w-0" style={{
                      ...edu.caption(),
                      color: tokens.color!(itemColor),
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>{item.title}</span>
                    <span className="flex-shrink-0 font-black" style={{
                      ...edu.micro(),
                      color: tokens.colorAlpha!(itemColor, 0.5),
                      minWidth: '16px',
                      textAlign: 'center',
                    }}>{i + 1}</span>
                    {isExpanded
                      ? <ChevronUp size={isCompact ? 12 : 14} style={{ color: tokens.colorAlpha!(itemColor, 0.5) }} />
                      : <ChevronDown size={isCompact ? 12 : 14} style={{ color: tokens.colorAlpha!(itemColor, 0.5) }} />
                    }
                  </button>
                  {/* Accordion content — expandable */}
                  <div style={{
                    maxHeight: isExpanded ? 500 : 0,
                    overflow: 'hidden',
                  ...edu.transition('max-height', 'standard'),
                  }}>
                    <div style={{ ...edu.nestedPadding(), paddingTop: isCompact ? 4 : 6, paddingBottom: isCompact ? 8 : 10 }}>
                      <div className="leading-relaxed" style={{
                        ...edu.body(),
                        color: tokens.muted(0.8),
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                      }}><RichText content={item.body ?? ''} /></div>
                    </div>
                  </div>
                </div>
              );
            }

            // ── Normal (non-accordion) mode: full card rendering ──
            return (
              <div key={`petunjuk-item-${block.id || 'pet'}-${i}`} className="rounded-xl text-center transition-[transform,background-color,border-color,box-shadow] hover:-translate-y-0.5 min-w-0"
                style={{
                  background: tokens.colorAlpha!(itemColor, 0.1),
                  border: '1px solid ' + tokens.colorAlpha!(itemColor, 0.2),
              borderLeftWidth: `${edu.stripeWidth()}px`,
                  borderLeftColor: tokens.color!(itemColor),
                  borderRadius: tokens.radius('xl') + 'px',
                  boxShadow: edu.shadow('card'),
                  ...edu.componentPadding(),
                  overflow: 'hidden',
                }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-2 relative"
                  style={{
                    background: tokens.colorAlpha!(itemColor, 0.2),
                    boxShadow: 'none',
                  }}>
                  <span style={{ fontSize: isCompact ? '15px' : '20px' }}>{item.icon}</span>
                  {/* Step number badge */}
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{
                      background: tokens.color!(itemColor),
                      fontSize: '8px',
                      fontWeight: 900,
                      color: tokens.color('bg'),
                      border: '1.5px solid ' + tokens.color('bg'),
                    }}>
                    {i + 1}
                  </div>
                </div>
                <div className="font-extrabold mb-1.5" style={{ ...edu.caption(), color: tokens.color!(itemColor), wordBreak: 'break-word' }}>{item.title}</div>
                <div className={`leading-relaxed ${isCompact ? 'canvas-truncate-2' : ''}`} style={{ ...edu.body(), color: tokens.muted(0.8), wordBreak: 'break-word', overflowWrap: 'break-word' }}><RichText content={item.body ?? ''} /></div>
              </div>
            );
          })}
        </div>

        {/* ══ COMPRESSION: Strategy-aware show-more UI ═════════════
         *  Accordion mode: No ShowMore needed — all items are visible as headers.
         *  Reveal-set / Collapsible: Show "Lihat lainnya" button. */}
        {hasMore && !isAccordionMode && (
          <ShowMoreButton
            hiddenCount={hiddenCount}
            onShowMore={showMore}
            itemLabel="petunjuk lainnya"
            isCompact={isCompact}
            tokens={tokens}
          />
        )}

        {/* ══ NAVIGATION SECTION ══════════════════════════════════
         *  Shows available navigation controls in the MPI.
         *  BSNP requires that students can navigate freely
         *  between sections of the learning media. */}
        {hasNav && (
          <div className="mt-4 p-3 rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${tokens.colorAlpha('p', 0.06)}, ${tokens.colorAlpha('p', 0.02)})`,
              border: `1.5px solid ${tokens.colorAlpha('p', 0.15)}`,
              borderLeft: `${edu.stripeWidth()}px solid ${tokens.color('p')}`,
            }}>
            <div className="flex items-center gap-2 mb-2">
              <Compass size={14} style={{ color: tokens.color('p') }} />
              <span className="font-extrabold" style={{ ...edu.caption(), color: tokens.color('p') }}>
                Navigasi
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(block.navigation || []).map((nav, i) => (
                <div key={`nav-${block.id || 'pet'}-${i}`}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                  style={{
                    background: tokens.colorAlpha('p', 0.08),
                    border: '1px solid ' + tokens.colorAlpha('p', 0.15),
                    ...edu.caption(),
                  }}>
                  <span>{nav.icon}</span>
                  <div className="min-w-0">
                    <div className="font-bold" style={{ color: tokens.color('p') }}>{nav.label}</div>
                    {!isCompact && <div style={{ ...edu.caption(), color: tokens.muted(0.85), wordBreak: 'break-word', overflowWrap: 'break-word' }}>{nav.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ TIPS SECTION ═════════════════════════════════════════
         *  Tips provide additional guidance for students.
         *  Displayed with a lightbulb icon and accent color. */}
        {block.tips && (
          <div className="mt-4 p-3.5 rounded-xl leading-relaxed"
            style={{
              background: tokens.accentBg(accentKey, 0.06),
              border: '1px solid ' + tokens.colorAlpha(accentKey, 0.2),
              borderLeft: `${edu.stripeWidth()}px solid ${tokens.color(accentKey)}`,
              boxShadow: edu.shadow('card'),
              ...edu.body(),
              color: edu.textColor(),
            }}>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: tokens.accentBg(accentKey, 0.15) }}>
                <Lightbulb size={12} className="inline" />
              </div>
              <div className="min-w-0" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                <strong style={{ color: tokens.color(accentKey) }}>Tips:</strong> <InlineTextEditor
                  {...tipsEditor}
                  className="leading-relaxed"
                  style={{ fontSize: 'inherit' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ══ BSNP COMPLIANCE FOOTER ═══════════════════════════════
         *  A subtle footer that indicates this Petunjuk block
         *  meets BSNP requirements for SMP interactive media.
         *  Shows the required components checkmark. */}
        <div className="mt-3 flex items-center justify-center gap-3 flex-wrap"
          style={{ ...edu.caption(), color: tokens.muted(0.85) }}>
          {['Petunjuk', 'KD/TP', 'Materi', 'Evaluasi', 'Profil'].map(comp => (
            <span key={`bsnp-${comp}`} className="flex items-center gap-0.5">
              <BookOpen size={8} /> {comp}
            </span>
          ))}
        </div>
      </div>
    </div>
    </PremiumBlockWrapper>
  );
});
