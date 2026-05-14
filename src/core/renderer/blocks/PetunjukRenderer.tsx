'use client';

import React from 'react';
import { Lightbulb, Info, Compass, Target, BookOpen, Shield, GraduationCap } from 'lucide-react';
import type { PetunjukBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { RichText } from './RichText';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';
import { fireConfettiMini } from '@/lib/confetti';
import { useBlockCompression } from '../../layout/useBlockCompression';
import { ShowMoreButton } from '../../layout/ShowMoreButton';
import type { CompressionDecision } from '../../layout/CompressionEngine';

export function PetunjukRenderer({ block, tokens, interactive, isCompact, isEditing, pageIndex, compression }: {
  block: PetunjukBlock; tokens: TokenResolver; interactive?: boolean; isCompact: boolean; isEditing?: boolean; pageIndex?: number; compression?: CompressionDecision;
}) {
  const accentKey = block.tipsColor || 'c';
  const hasNav = block.navigation && block.navigation.length > 0;
  const hasObjectives = block.learningObjectives && block.learningObjectives.length > 0;
  const allItems = block.items || [];

  // ── Compression-aware item visibility ──────────────────────
  const { visibleCount, hasMore, hiddenCount, showMore, isCompressed } = useBlockCompression({
    compression,
    totalItems: allItems.length,
  });
  const items = isCompressed ? allItems.slice(0, visibleCount) : allItems;

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
    <PremiumBlockWrapper tokens={tokens} accent={accentKey} staggerIndex={0} gradientBorder>
    <ReadingProgressIndicator progress={1} tokens={tokens} accent={accentKey} height={2} position="top" />
    <div className={`${isCompact ? 'p-1' : 'p-2'} premium-card-glow`}
      style={{
        background: `linear-gradient(135deg, ${tokens.colorAlpha('c', 0.06)}, ${tokens.colorAlpha('y', 0.04)})`,
        borderRadius: tokens.radius('xl') + 'px',
        border: `2px solid ${tokens.colorAlpha('c', 0.2)}`,
        borderLeft: `5px solid ${tokens.color('c')}`,
        boxShadow: tokens.raw.shadow.card,
        position: 'relative',
        overflow: 'hidden',
      }}>

      {/* ══ BSNP Compliance Header ════════════════════════════════
       *  Every MPI must have Petunjuk as the first content page.
       *  The BSNP badge signals compliance to teachers/reviewers.
       *  Design: Ribbon-style badge at top-left with Info icon. */}
      <div className="absolute top-0 left-0"
        style={{
          background: `linear-gradient(135deg, ${tokens.color('c')}, ${tokens.colorAlpha('c', 0.85)})`,
          borderRadius: '0 0 10px 0',
          padding: '5px 12px 5px 10px',
          zIndex: 2,
          boxShadow: `2px 2px 8px ${tokens.colorAlpha('c', 0.3)}`,
        }}>
        <span style={{ fontSize: '12px', fontWeight: 900, color: tokens.color('bg'), display: 'flex', alignItems: 'center', gap: 4 }}>
          <Info size={12} /> Petunjuk
        </span>
      </div>

      {/* BSNP "Wajib" badge — top right */}
      <div className="absolute top-0 right-0" style={{ zIndex: 2, borderRadius: '0 0 0 10px', overflow: 'hidden' }}>
        <PremiumBadge tokens={tokens} accent="y" variant="solid" isCompact={isCompact}><Shield size={10} /> BSNP Wajib</PremiumBadge>
      </div>

      <div style={{ paddingTop: isCompact ? '24px' : '32px' }}>
        {/* ══ TITLE ════════════════════════════════════════════════ */}
        <h2 className="font-black leading-tight"
          style={{ fontSize: isCompact ? '16px' : '1.6rem', fontFamily: tokens.fontFamily('display'), color: tokens.color('text'), wordBreak: 'break-word', overflowWrap: 'break-word' }}>
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
              borderLeft: `4px solid ${tokens.color('g')}`,
            }}>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: tokens.colorAlpha('g', 0.2), boxShadow: '0 2px 8px ' + tokens.colorAlpha('g', 0.2) }}>
                <GraduationCap size={14} style={{ color: tokens.color('g') }} />
              </div>
              <span className="font-extrabold min-w-0" style={{ fontSize: isCompact ? '12px' : '14px', color: tokens.color('g') }}>
                Tujuan Pembelajaran
              </span>
              <span className="px-2 py-0.5 rounded-full font-extrabold flex-shrink-0"
                style={{
                  fontSize: '11px',
                  background: tokens.colorAlpha('g', 0.15),
                  color: tokens.color('g'),
                  border: '1px solid ' + tokens.colorAlpha('g', 0.25),
                  letterSpacing: '0.04em',
                }}>
                BSNP WAJIB
              </span>
            </div>
            <div className="space-y-2">
              {(block.learningObjectives || []).map((obj, i) => (
                <div key={`obj-${block.id || 'pet'}-${i}`}
                  className="flex items-start gap-2.5"
                  style={{ fontSize: isCompact ? '11px' : '13px' }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: tokens.colorAlpha('g', 0.15),
                      border: '1.5px solid ' + tokens.colorAlpha('g', 0.3),
                    }}>
                    <span className="font-extrabold" style={{ color: tokens.color('g'), fontSize: '10px' }}>{obj.num || i + 1}</span>
                  </div>
                  <div className={`min-w-0 leading-relaxed ${isCompact ? 'canvas-truncate-2' : ''}`}
                    style={{ color: tokens.color('text') }}>
                    <RichText content={obj.text ?? ''} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ GRID ITEMS (Step-by-step instructions) ══════════════
         *  Each item represents a step or instruction the student
         *  should follow. The color cycle provides visual variety.
         *  Step numbers are shown inside the icon circle for
         *  clear sequential ordering.
         *  When compressed, only visibleCount items are shown. */}
        <div className={`grid gap-3 mt-4 ${isCompact ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {items.map((item, i) => {
            const colorCycle = ['y', 'c', 'g', 'p'];
            const itemColor = colorCycle[i % colorCycle.length];
            return (
              <MicroInteraction key={`petunjuk-item-mi-${block.id || 'pet'}-${i}`} tokens={tokens} accent={itemColor} effect="squish">
              <div key={`petunjuk-item-${block.id || 'pet'}-${i}`} className="rounded-xl text-center transition-all hover:-translate-y-0.5 min-w-0"
                style={{
                  background: tokens.colorAlpha(itemColor, 0.1),
                  border: '1px solid ' + tokens.colorAlpha(itemColor, 0.2),
                  borderLeftWidth: '3px',
                  borderLeftColor: tokens.color(itemColor),
                  borderRadius: tokens.radius('xl') + 'px',
                  boxShadow: tokens.raw.shadow.card,
                  padding: isCompact ? '10px' : '14px',
                  overflow: 'hidden',
                }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-2 relative"
                  style={{
                    background: tokens.colorAlpha(itemColor, 0.2),
                    boxShadow: '0 4px 12px ' + tokens.colorAlpha(itemColor, 0.25),
                  }}>
                  <span style={{ fontSize: isCompact ? '15px' : '20px' }}>{item.icon}</span>
                  {/* Step number badge */}
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{
                      background: tokens.color(itemColor),
                      fontSize: '8px',
                      fontWeight: 900,
                      color: tokens.color('bg'),
                      border: '1.5px solid ' + tokens.color('bg'),
                    }}>
                    {i + 1}
                  </div>
                </div>
                <div className="font-extrabold mb-1.5" style={{ color: tokens.color(itemColor), fontSize: isCompact ? '12px' : '14px', wordBreak: 'break-word' }}>{item.title}</div>
                <div className={`leading-relaxed ${isCompact ? 'canvas-truncate-2' : ''}`} style={{ color: tokens.muted(0.8), fontSize: isCompact ? '11px' : '13px', wordBreak: 'break-word', overflowWrap: 'break-word' }}><RichText content={item.body ?? ''} /></div>
              </div>
              </MicroInteraction>
            );
          })}
        </div>

        {/* ══ COMPRESSION: Show More button ════════════════════════
         *  When compression hides items, show a "Lihat lainnya" button.
         *  This is the key UI that makes compression user-friendly. */}
        {hasMore && (
          <ShowMoreButton
            hiddenCount={hiddenCount}
            onShowMore={showMore}
            itemLabel="petunjuk lainnya"
            isCompact={isCompact}
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
              borderLeft: `4px solid ${tokens.color('p')}`,
            }}>
            <div className="flex items-center gap-2 mb-2">
              <Compass size={14} style={{ color: tokens.color('p') }} />
              <span className="font-extrabold" style={{ fontSize: isCompact ? '11px' : '13px', color: tokens.color('p') }}>
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
                    fontSize: isCompact ? '10px' : '12px',
                  }}>
                  <span>{nav.icon}</span>
                  <div className="min-w-0">
                    <div className="font-bold" style={{ color: tokens.color('p') }}>{nav.label}</div>
                    {!isCompact && <div style={{ color: tokens.muted(0.6), fontSize: '10px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{nav.description}</div>}
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
          <MicroInteraction tokens={tokens} accent={accentKey} effect="bounce">
          <div className="mt-4 p-3.5 rounded-xl leading-relaxed"
            style={{
              background: tokens.colorAlpha(accentKey, 0.12),
              border: '1px solid ' + tokens.colorAlpha(accentKey, 0.3),
              borderLeft: `4px solid ${tokens.color(accentKey)}`,
              boxShadow: tokens.raw.shadow.card,
              color: tokens.color('text'),
              fontSize: isCompact ? '11px' : '13px',
            }}>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: tokens.colorAlpha(accentKey, 0.25), boxShadow: '0 2px 8px ' + tokens.colorAlpha(accentKey, 0.2) }}>
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
          </MicroInteraction>
        )}

        {/* ══ BSNP COMPLIANCE FOOTER ═══════════════════════════════
         *  A subtle footer that indicates this Petunjuk block
         *  meets BSNP requirements for SMP interactive media.
         *  Shows the required components checkmark. */}
        <div className="mt-3 flex items-center justify-center gap-3 flex-wrap"
          style={{ fontSize: '11px', color: tokens.muted(0.6) }}>
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
}
