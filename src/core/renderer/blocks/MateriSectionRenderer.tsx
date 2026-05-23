'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Shield, Star, CheckCircle2, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import type { MateriSectionBlock, MateriContentTab } from '../../schema/types';
import type { TokenResolver, SchemaRenderMode } from '../types';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';
import { RichText, hasHtmlTags, stripHtmlTags } from './RichText';
import { fireConfettiMini } from '@/lib/confetti';
import { useCanvaStore } from '../../../store/canva/store';
import { useBlockCompression } from '../../layout/useBlockCompression';
import { ShowMoreButton } from '../../layout/ShowMoreButton';
import type { CompressionDecision } from '../../layout/CompressionEngine';
import { Scissors } from 'lucide-react';
import { IOS_SPACING } from '../../themes/ios-visual-contract';

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
          className={`variant-pill focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent ${active === v.key ? 'active' : ''}`}
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

// ── MateriTabBar — Pill-style tab bar for tabbed content ─────────
function MateriTabBar({
  tabs, activeIndex, onSelect, accentColor, tokens, interactive
}: {
  tabs: MateriContentTab[];
  activeIndex: number;
  onSelect: (i: number) => void;
  accentColor?: string;
  tokens: TokenResolver;
  interactive?: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
      {tabs.map((tab, i) => {
        const isActive = i === activeIndex;
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(i)}
            type="button"
            className={tokens.iosTabTw(interactive)}
            style={{
              ...tokens.iosTypography('footnote', { fontWeight: isActive ? 600 : 400 }),
              padding: `${IOS_SPACING.tabPadding.py}px ${IOS_SPACING.tabPadding.px}px`,
              borderRadius: tokens.radius('full'),
              border: `1px solid ${isActive ? tokens.colorAlpha(accentColor || 'p', 0.4) : tokens.subtleBorder(0.1)}`,
              background: isActive ? tokens.accentBg(accentColor || 'p', 0.08) : 'transparent',
              color: isActive ? tokens.accentText(accentColor || 'p') : tokens.muted(0.85),
              cursor: interactive ? 'pointer' : 'default',
            }}
          >
            {tab.icon && <span style={{ marginRight: 4 }}>{tab.icon}</span>}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Overflow Indicator — Shows when content overflows beyond compression ──
function OverflowIndicator({
  overflowCount, onSplit, tokens, interactive, isCompact,
}: {
  overflowCount: number;
  onSplit?: () => void;
  tokens: TokenResolver;
  interactive: boolean;
  isCompact?: boolean;
}) {
  if (overflowCount <= 0) return null;

  return (
    <div style={{
      ...tokens.iosNestedPadding(isCompact),
      marginTop: 4,
      borderRadius: tokens.radius('md'),
      background: tokens.colorAlpha('y', 0.08),
      border: `1px dashed ${tokens.colorAlpha('y', 0.3)}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    }}>
      <span style={{ ...tokens.iosTypography('caption1', { fontSize: isCompact ? 11 : 13, color: tokens.textSecondary(0.9) }) }}>
        {overflowCount} blok tidak cukup ruang di halaman ini
      </span>
      {onSplit && interactive && (
        <button
          onClick={onSplit}
          className={`hover:opacity-80 active:scale-[0.97] ${tokens.iosFocusRing()}`}
          style={{
            ...tokens.iosButtonPadding('md'),
            borderRadius: tokens.radius('sm'),
            fontSize: isCompact ? 10 : 12,
            fontWeight: 600,
            background: tokens.colorAlpha('p', 0.15),
            color: tokens.color('p'),
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Scissors size={isCompact ? 10 : 12} />
          Bagi Halaman
        </button>
      )}
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
  compression,
  activeContent,
  hasTabs,
  activeTabIndex,
  onTabChange,
  overflowCount,
  onSplit,
}: {
  block: MateriSectionBlock;
  mode: SchemaRenderMode;
  tokens: TokenResolver;
  interactive?: boolean;
  isCompact?: boolean;
  compression?: CompressionDecision;
  activeContent: import('../../schema/types').SchemaBlock[];
  hasTabs: boolean;
  activeTabIndex: number;
  onTabChange: (i: number) => void;
  overflowCount?: number;
  onSplit?: () => void;
}) {
  const accentColor = block.accentColor || 'c';
  const accent = tokens.color(accentColor);
  const accentAlpha = (a: number) => tokens.colorAlpha(accentColor, a);

  const sectionNumber = React.useMemo(() => {
    if (block.id) {
      const match = block.id.match(/(\d+)$/);
      if (match) return parseInt!(match[1], 10);
    }
    return 1;
  }, [block.id]);

  const allContentBlocks = activeContent || [];
  const takeaways = block.takeaways || [];
  const selfCheck = block.selfCheck;

  // ── Compression-aware content visibility (strategy-aware) ──
  const { visibleCount, hasMore, hiddenCount, showMore, isCompressed, strategy, isExpanded } = useBlockCompression({
    compression,
    totalItems: allContentBlocks.length,
  });

  const isAccordionMode = isCompressed && strategy === 'accordion';
  const isCollapsibleMode = isCompressed && strategy === 'collapsible';
  const isClipped = compression?.clipped ?? false;

  // Accordion state: first content block expanded, rest collapsed
  const [expandedSections, setExpandedSections] = React.useState<Set<number>>(new Set([0]));
  const toggleSection = React.useCallback((idx: number) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }, []);

  const contentBlocks = isAccordionMode
    ? allContentBlocks
    : (isCollapsibleMode
      ? (isExpanded ? allContentBlocks : allContentBlocks.slice(0, Math.max(1, Math.ceil(allContentBlocks.length * 0.4))))
      : (isCompressed ? allContentBlocks.slice(0, visibleCount) : allContentBlocks)
    );

  // ── Overflow detection: how many blocks are hidden beyond compression ──
  // When clipped (compression can't fit everything) or when there's a significant
  // number of hidden blocks, we show the OverflowIndicator.
  const effectiveOverflowCount = overflowCount ?? Math.max(0, allContentBlocks.length - contentBlocks.length);

  return (
    <div
      style={{
        ...tokens.cardStyle(),
        overflow: 'hidden',
      }}
    >
      {/* ═══ SECTION HEADER ══════════════════════════════════════ */}
      <div
        style={{
          borderLeft: tokens.accentStripe(accentColor, 3),
          background: tokens.color('card'),
          ...tokens.iosSectionPadding(isCompact),
          borderBottom: `1px solid ${tokens.subtleBorder(0.06)}`,
        }}
      >
        <div className="flex items-start gap-3">
          {/* Section number badge */}
          <div
            className="flex-shrink-0 rounded-xl flex items-center justify-center font-black"
            style={{
              ...tokens.iosIconSize('md'),
              background: tokens.accentBg(accentColor, 0.12),
              color: tokens.accentText(accentColor),
              ...tokens.iosTypography('headline', { fontSize: isCompact ? 13 : 15 }),
            }}
          >
            {sectionNumber}
          </div>

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
                  ...tokens.iosTypography('title3', { fontSize: isCompact ? 16 : 22, fontFamily: tokens.fontFamily('display'), color: tokens.color('text') }),
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
                  ...tokens.iosTypography('subheadline', { fontSize: isCompact ? 11 : 13, color: tokens.muted(0.85), lineHeight: 1.7 }),
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                <RichText content={block.subtitle ?? ''} />
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
      </div>

      {/* ═══ TAB BAR ═════════════════════════════════════════════ */}
      {hasTabs && block.tabs && (
        <div style={{ ...tokens.iosSectionPadding(isCompact), paddingBottom: 0 }}>
          <MateriTabBar
            tabs={block.tabs}
            activeIndex={activeTabIndex}
            onSelect={onTabChange}
            accentColor={accentColor}
            tokens={tokens}
            interactive={interactive}
          />
        </div>
      )}

      {/* ═══ CONTENT AREA — Strategy-aware compression ══════════ */}
      {contentBlocks.length > 0 && (
        <div
          className="flex flex-col gap-4"
          style={{
            ...tokens.iosContentPadding(isCompact),
            position: 'relative',
            maxWidth: tokens.contentWidth(),
            lineHeight: 1.7,
          }}
        >
          {contentBlocks.map((childBlock, i) => (
            <React.Suspense
              key={`materi-child-${childBlock.id || childBlock.type}-${i}`}
              fallback={null}
            >
              {isAccordionMode ? (
                <div className="rounded-lg overflow-hidden"
                  style={{
                    border: `1px solid ${tokens.colorAlpha(accentColor, 0.12)}`,
                    borderRadius: tokens.radius('lg') + 'px',
                    background: expandedSections.has(i) ? accentAlpha(0.04) : 'transparent',
                  }}
                >
                  <button
            onClick={() => toggleSection(i)}
            className={`w-full flex items-center gap-2 text-left ${tokens.iosAccordionTw(interactive)}`}
                    style={{
                      ...tokens.iosNestedPadding(isCompact),
                      cursor: 'pointer',
                      background: expandedSections.has(i) ? accentAlpha(0.06) : 'transparent',
                      ...tokens.iosTypography('caption1', { fontWeight: 700, color: accent }),
                    }}
                  >
                    <span className="flex-shrink-0" style={{ ...tokens.iosTypography('caption1', { fontSize: isCompact ? 11 : 13 }) }}>
                      {(childBlock as Record<string, unknown>).icon as string || '📄'}
                    </span>
                    <span className="flex-1 min-w-0 truncate">
                      {(childBlock as Record<string, unknown>).title as string || `Bagian ${i + 1}`}
                    </span>
                    {expandedSections.has(i)
                      ? <ChevronUp size={isCompact ? 11 : 13} style={{ opacity: 0.5 }} />
                      : <ChevronDown size={isCompact ? 11 : 13} style={{ opacity: 0.5 }} />
                    }
                  </button>
                  <div style={{
                    maxHeight: expandedSections.has(i) ? 2000 : 0,
                    overflow: 'hidden',
                    // Sprint 3C: Use iosTransitionStyle for accordion expand
                    ...tokens.iosTransitionStyle('max-height', 'slow'),
                  }}>
                    <div style={{ ...tokens.iosNestedPadding(isCompact), paddingTop: isCompact ? 2 : 4, paddingBottom: isCompact ? 6 : 8 }}>
                      <SchemaBlockRenderer
                        block={childBlock}
                        mode={mode}
                        tokens={tokens}
                        interactive={interactive}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <SchemaBlockRenderer
                  block={childBlock}
                  mode={mode}
                  tokens={tokens}
                  interactive={interactive}
                />
              )}
            </React.Suspense>
          ))}
          {/* Clipped indicator — fade-out gradient when content is hard-clipped */}
          {isClipped && !isExpanded && (
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 40,
              background: `linear-gradient(transparent, ${tokens.color('card')})`,
              pointerEvents: 'none',
            }} />
          )}
        </div>
      )}

      {/* ═══ KEY TAKEAWAYS ════════════════════════════════════════
       *  Hidden when compressed to save vertical space.
       *  Takeaways are supplementary — core content is the content blocks. */}
      {!isCompressed && takeaways.length > 0 && (
        <div
          className="ios-entrance-card"
          style={{
            ...tokens.nestedCardStyle(),
            ...tokens.iosInnerMargin(isCompact),
            ...tokens.iosNestedPadding(isCompact),
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: tokens.colorAlpha('g', 0.12),
              }}
            >
              <Star size={12} style={{ color: tokens.color('g') }} />
            </div>
            <span
              className="font-extrabold uppercase tracking-wider"
              style={{
                ...tokens.iosTypography('caption2', { color: tokens.color('g') }),
              }}
            >
              Poin Penting
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {takeaways.map((item, i) => (
              <div
                key={`materi-takeaway-mi-${block.id || 'ms'}-${i}`}
                className="flex items-start gap-2.5 rounded-lg p-2"
                style={{
                  background: tokens.subtleBg(0.02),
                  border: `1px solid ${tokens.subtleBorder(0.06)}`,
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
                    ...tokens.iosTypography('subheadline', { fontSize: isCompact ? 12 : 13, lineHeight: 1.7, color: tokens.color('text') }),
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                  }}
                >
                  <RichText content={item} />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ SELF-CHECK PROMPT ════════════════════════════════════
       *  Hidden when compressed to save vertical space. */}
      {!isCompressed && selfCheck && (
        <div
          className="ios-entrance-card"
          style={{
            ...tokens.nestedCardStyle(),
            ...tokens.iosInnerMargin(isCompact),
            ...tokens.iosNestedPadding(isCompact),
            background: tokens.accentBg('y', 0.04),
            borderLeft: tokens.accentStripe('y', 3),
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: tokens.colorAlpha('y', 0.12),
              }}
            >
              <Brain size={14} style={{ color: tokens.color('y') }} />
            </div>
            <div className="min-w-0">
              <span
                className="font-extrabold block mb-1"
                style={{
                  ...tokens.iosTypography('caption2', { color: tokens.color('y') }),
                  letterSpacing: '0.04em',
                }}
              >
                Apa yang sudah kamu pelajari?
              </span>
              <p
                className="leading-relaxed"
                style={{
                  ...tokens.iosTypography('subheadline', { fontSize: isCompact ? 11 : 13, lineHeight: 1.7, color: tokens.color('text') }),
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                <RichText content={selfCheck} />
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ COMPRESSION: Strategy-aware show-more UI ═══════════
       *  Accordion mode: No ShowMore needed — all items are visible as headers.
       *  Collapsible mode: "Selengkapnya" / "Ringkas" toggle.
       *  Other strategies: Generic ShowMoreButton. */}
      {isCompressed && isCollapsibleMode && (
        <div style={{ ...tokens.iosInnerMargin(isCompact) }}>
          <button
            onClick={showMore}
            className={`flex items-center justify-center gap-1 w-full py-2 rounded-xl ${tokens.iosExpandTw(interactive)}`}
            style={{
              background: tokens.accentBg(accentColor, 0.08),
              color: tokens.accentText(accentColor),
              ...tokens.iosTypography('caption2', { fontWeight: 700 }),
            }}
          >
            {isExpanded
              ? <><ChevronUp size={isCompact ? 10 : 12} /> Ringkas</>
              : <><ChevronDown size={isCompact ? 10 : 12} /> Selengkapnya ({hiddenCount} bagian)</>
            }
          </button>
        </div>
      )}
      {hasMore && !isAccordionMode && !isCollapsibleMode && (
        <div style={{ ...tokens.iosInnerMargin(isCompact) }}>
          <ShowMoreButton
            hiddenCount={hiddenCount}
            onShowMore={showMore}
            itemLabel="bagian materi lagi"
            isCompact={isCompact}
            tokens={tokens}
          />
        </div>
      )}

      {/* ═══ OVERFLOW INDICATOR — Auto-split prompt (canvas/edit mode only) */}
      {mode === 'canvas' && (
        <div style={{ ...tokens.iosInnerMargin(isCompact) }}>
          <OverflowIndicator
            overflowCount={effectiveOverflowCount}
            onSplit={onSplit}
            tokens={tokens}
            interactive={!!interactive}
            isCompact={isCompact}
          />
        </div>
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
  compression,
  activeContent,
  hasTabs,
  activeTabIndex,
  onTabChange,
  overflowCount,
  onSplit,
}: {
  block: MateriSectionBlock;
  mode: SchemaRenderMode;
  tokens: TokenResolver;
  interactive?: boolean;
  isCompact?: boolean;
  compression?: CompressionDecision;
  activeContent: import('../../schema/types').SchemaBlock[];
  hasTabs: boolean;
  activeTabIndex: number;
  onTabChange: (i: number) => void;
  overflowCount?: number;
  onSplit?: () => void;
}) {
  const accentColor = block.accentColor || 'c';
  const accent = tokens.color(accentColor);
  const accentAlpha = (a: number) => tokens.colorAlpha(accentColor, a);

  const sectionNumber = React.useMemo(() => {
    if (block.id) {
      const match = block.id.match(/(\d+)$/);
      if (match) return parseInt!(match[1], 10);
    }
    return 1;
  }, [block.id]);

  const allContentBlocks = activeContent || [];
  const takeaways = block.takeaways || [];
  const selfCheck = block.selfCheck;

  // ── Compression-aware content visibility (strategy-aware) ──
  const { visibleCount, hasMore, hiddenCount, showMore, isCompressed, strategy, isExpanded } = useBlockCompression({
    compression,
    totalItems: allContentBlocks.length,
  });

  const isCollapsibleMode = isCompressed && strategy === 'collapsible';
  const isClipped = compression?.clipped ?? false;
  const contentBlocks = isCollapsibleMode
    ? (isExpanded ? allContentBlocks : allContentBlocks.slice(0, Math.max(1, Math.ceil(allContentBlocks.length * 0.4))))
    : (isCompressed ? allContentBlocks.slice(0, visibleCount) : allContentBlocks);

  // ── Overflow detection ──
  const effectiveOverflowCount = overflowCount ?? Math.max(0, allContentBlocks.length - contentBlocks.length);

  return (
    <div
      style={{
        ...tokens.cardStyle(),
        overflow: 'hidden',
      }}
    >
      {/* ═══ SECTION HEADER ══════════════════════════════════════ */}
      <div
        style={{
          borderLeft: tokens.accentStripe(accentColor, 3),
          background: tokens.color('card'),
          ...tokens.iosSectionPadding(isCompact),
          borderBottom: `1px solid ${tokens.subtleBorder(0.06)}`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex-shrink-0 rounded-lg flex items-center justify-center font-black"
            style={{
              ...tokens.iosIconSize('sm'),
              background: tokens.accentBg(accentColor, 0.12),
              color: tokens.accentText(accentColor),
              ...tokens.iosTypography('headline', { fontSize: isCompact ? 12 : 14 }),
            }}
          >
            {sectionNumber}
          </div>
          <h2
            className="font-black leading-tight min-w-0"
            style={{
              ...tokens.iosTypography('title3', { fontSize: isCompact ? 14 : 22, fontFamily: tokens.fontFamily('display'), color: tokens.color('text') }),
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

      {/* ═══ TAB BAR ═════════════════════════════════════════════ */}
      {hasTabs && block.tabs && (
        <div style={{ ...tokens.iosSectionPadding(isCompact), paddingBottom: 0 }}>
          <MateriTabBar
            tabs={block.tabs}
            activeIndex={activeTabIndex}
            onSelect={onTabChange}
            accentColor={accentColor}
            tokens={tokens}
            interactive={interactive}
          />
        </div>
      )}

      {/* ═══ MAGAZINE 2-COLUMN LAYOUT ════════════════════════════ */}
      <div
        className={isCompact ? undefined : 'variant-magazine-layout'}
        style={{
          ...tokens.iosSectionPadding(isCompact),
          ...(isCompact ? { display: 'flex', flexDirection: 'column', gap: '12px' } : {}),
        }}
      >
        {/* Left column: content blocks */}
        <div className="flex flex-col gap-4" style={{ position: 'relative' }}>
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
          {/* Clipped indicator — fade-out gradient when content is hard-clipped */}
          {isClipped && !isExpanded && (
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 40,
              background: `linear-gradient(transparent, ${tokens.color('card')})`,
              pointerEvents: 'none',
            }} />
          )}
        </div>

        {/* Right column: takeaways sidebar */}
        {takeaways.length > 0 && (
          <div
            style={{
              ...(isCompact ? {} : { position: 'sticky', top: '16px', alignSelf: 'start' }),
              ...tokens.nestedCardStyle(),
              ...tokens.iosNestedPadding(isCompact),
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Star size={11} style={{ color: tokens.color('g') }} />
              <span
                className="font-extrabold uppercase tracking-wider"
                style={{
                  ...tokens.iosTypography('caption2', { color: tokens.color('g') }),
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
                    background: tokens.subtleBg(0.02),
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
                      ...tokens.iosTypography('subheadline', { fontSize: 12, lineHeight: 1.7, color: tokens.color('text') }),
                      wordBreak: 'break-word',
                    }}
                  >
                    <RichText content={item} />
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
          className="ios-entrance-card"
          style={{
            ...tokens.nestedCardStyle(),
            ...tokens.iosInnerMargin(isCompact),
            ...tokens.iosNestedPadding(isCompact),
            background: tokens.accentBg('y', 0.04),
            borderLeft: tokens.accentStripe('y', 3),
          }}
        >
          <div className="flex items-center gap-3">
            <Brain size={14} style={{ color: tokens.color('y') }} />
            <div className="min-w-0">
              <span
                className="font-extrabold"
                style={{
                  ...tokens.iosTypography('caption2', { color: tokens.color('y') }),
                  marginRight: '8px',
                }}
              >
                Cek Pemahaman:
              </span>
              <span
                className="leading-relaxed"
                style={{
                  ...tokens.iosTypography('subheadline', { fontSize: 12, lineHeight: 1.7, color: tokens.color('text') }),
                  wordBreak: 'break-word',
                }}
              >
                <RichText content={selfCheck} />
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ OVERFLOW INDICATOR — Auto-split prompt (canvas/edit mode only) */}
      {mode === 'canvas' && (
        <div style={{ ...tokens.iosInnerMargin(isCompact) }}>
          <OverflowIndicator
            overflowCount={effectiveOverflowCount}
            onSplit={onSplit}
            tokens={tokens}
            interactive={!!interactive}
            isCompact={isCompact}
          />
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
  compression,
  activeContent,
  hasTabs,
  activeTabIndex,
  onTabChange,
  overflowCount,
  onSplit,
}: {
  block: MateriSectionBlock;
  mode: SchemaRenderMode;
  tokens: TokenResolver;
  interactive?: boolean;
  isCompact?: boolean;
  compression?: CompressionDecision;
  activeContent: import('../../schema/types').SchemaBlock[];
  hasTabs: boolean;
  activeTabIndex: number;
  onTabChange: (i: number) => void;
  overflowCount?: number;
  onSplit?: () => void;
}) {
  const accentColor = block.accentColor || 'c';
  const accent = tokens.color(accentColor);
  const accentAlpha = (a: number) => tokens.colorAlpha(accentColor, a);

  const sectionNumber = React.useMemo(() => {
    if (block.id) {
      const match = block.id.match(/(\d+)$/);
      if (match) return parseInt!(match[1], 10);
    }
    return 1;
  }, [block.id]);

  const allContentBlocks = activeContent || [];
  const takeaways = block.takeaways || [];
  const selfCheck = block.selfCheck;

  const [showSelfCheck, setShowSelfCheck] = useState(false);

  // ── Compression-aware content visibility (strategy-aware) ──
  const { visibleCount, hasMore, hiddenCount, showMore, isCompressed, strategy, isExpanded } = useBlockCompression({
    compression,
    totalItems: allContentBlocks.length,
  });

  const isCollapsibleMode = isCompressed && strategy === 'collapsible';
  const isClipped = compression?.clipped ?? false;
  const contentBlocks = isCollapsibleMode
    ? (isExpanded ? allContentBlocks : allContentBlocks.slice(0, Math.max(1, Math.ceil(allContentBlocks.length * 0.4))))
    : (isCompressed ? allContentBlocks.slice(0, visibleCount) : allContentBlocks);

  // ── Overflow detection ──
  const effectiveOverflowCount = overflowCount ?? Math.max(0, allContentBlocks.length - contentBlocks.length);

  return (
    <div
      style={{
        ...tokens.cardStyle(),
        overflow: 'hidden',
      }}
    >
      {/* ═══ HEADER ONLY — title + number badge ══════════════════ */}
      <div
        className="flex items-center gap-2.5"
        style={{
          ...tokens.iosSectionPadding(isCompact),
          borderLeft: tokens.accentStripe(accentColor, 3),
        }}
      >
        <div
          className="flex-shrink-0 rounded-md flex items-center justify-center font-black"
          style={{
            ...tokens.iosIconSize('sm'),
            background: tokens.accentBg(accentColor, 0.12),
            color: tokens.accentText(accentColor),
            ...tokens.iosTypography('caption1', { fontSize: isCompact ? 10 : 12 }),
          }}
        >
          {sectionNumber}
        </div>
        <h2
          className="font-bold min-w-0"
          style={{
            ...tokens.iosTypography('headline', { fontSize: isCompact ? 13 : 15, fontFamily: tokens.fontFamily('display'), color: tokens.color('text') }),
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

      {/* ═══ TAB BAR ═════════════════════════════════════════════ */}
      {hasTabs && block.tabs && (
        <div style={{ ...tokens.iosCardPadding(isCompact), paddingBottom: 0 }}>
          <MateriTabBar
            tabs={block.tabs}
            activeIndex={activeTabIndex}
            onSelect={onTabChange}
            accentColor={accentColor}
            tokens={tokens}
            interactive={interactive}
          />
        </div>
      )}

      {/* ═══ CONTENT BLOCKS ══════════════════════════════════════ */}
      {contentBlocks.length > 0 && (
        <div
          className="flex flex-col gap-3"
          style={{
            ...tokens.iosContentPadding(isCompact),
            position: 'relative',
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
          {/* Clipped indicator — fade-out gradient when content is hard-clipped */}
          {isClipped && !isExpanded && (
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 40,
              background: `linear-gradient(transparent, ${tokens.color('card')})`,
              pointerEvents: 'none',
            }} />
          )}
        </div>
      )}

      {/* ═══ TAKEAWAYS — horizontal pill badges ══════════════════ */}
      {takeaways.length > 0 && (
        <div
          style={{
            ...tokens.iosCardPadding(isCompact),
            paddingTop: isCompact ? 4 : 6,
            paddingBottom: isCompact ? 8 : 10,
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
                title={stripHtmlTags(item)}
              >
                <CheckCircle2 size={8} />
                <span style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: isCompact ? '140px' : '220px',
                  display: 'inline-block',
                  verticalAlign: 'bottom',
                }}>
                  <RichText content={item} />
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
            ...tokens.iosCardPadding(isCompact),
            paddingTop: isCompact ? 4 : 6,
            paddingBottom: isCompact ? 8 : 12,
          }}
        >
          <MicroInteraction tokens={tokens} accent="y" effect="bounce">
          <button
            onClick={() => { setShowSelfCheck(!showSelfCheck); if (!showSelfCheck) fireConfettiMini(); }}
            type="button"
            className={`flex items-center gap-1.5 w-full text-left ${tokens.iosExpandTw(interactive)}`}
            style={{
              ...tokens.iosNestedPadding(isCompact),
              borderRadius: tokens.radius('sm'),
              background: tokens.accentBg('y', 0.06),
              border: `1px solid ${tokens.subtleBorder(0.06)}`,
              color: tokens.color('y'),
              ...tokens.iosTypography('caption2', { color: tokens.color('y') }),
              cursor: 'pointer',
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
                ...tokens.iosNestedPadding(isCompact),
                background: tokens.accentBg('y', 0.04),
                borderRadius: tokens.radius('sm'),
                borderLeft: tokens.accentStripe('y', 3),
                animation: 'fadeIn 0.3s ease',
              }}
            >
              <p
                className="leading-relaxed"
                style={{
                  ...tokens.iosTypography('subheadline', { fontSize: 12, color: tokens.color('text') }),
                  wordBreak: 'break-word',
                }}
              >
                <RichText content={selfCheck} />
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══ OVERFLOW INDICATOR — Auto-split prompt (canvas/edit mode only) */}
      {mode === 'canvas' && (
        <div style={{ ...tokens.iosInnerMargin(isCompact) }}>
          <OverflowIndicator
            overflowCount={effectiveOverflowCount}
            onSplit={onSplit}
            tokens={tokens}
            interactive={!!interactive}
            isCompact={isCompact}
          />
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
export const MateriSectionRenderer = React.memo(function MateriSectionRenderer({ block, mode, tokens, interactive, isCompact, isEditing, compression }: {
  block: MateriSectionBlock;
  mode: SchemaRenderMode;
  tokens: TokenResolver;
  interactive?: boolean;
  isCompact?: boolean;
  isEditing?: boolean;
  compression?: CompressionDecision;
}) {
  const variant: 'A' | 'B' | 'C' = (block.variant as 'A' | 'B' | 'C') || 'A';

  // ── Tab state management ──────────────────────────────────────
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const hasTabs = !!(block.tabs && block.tabs.length > 0);
  const activeContent = hasTabs
    ? (block.tabs![activeTabIndex]?.content ?? [])
    : block.content;

  // Clamp activeTabIndex when block.tabs changes
  useEffect(() => {
    if (hasTabs && activeTabIndex >= block.tabs!.length) {
      setActiveTabIndex(0);
    }
  }, [block.tabs?.length, activeTabIndex, hasTabs]);

  const handleTabChange = useCallback((i: number) => {
    setActiveTabIndex(i);
  }, []);

  const updateSchemaBlock = useCanvaStore((s) => s.updateSchemaBlock);
  const splitMateriContent = useCanvaStore((s) => s.splitMateriContent);
  const handleVariantChange = useCallback((v: 'A' | 'B' | 'C') => {
    if (block.id) updateSchemaBlock(block.id, { variant: v });
  }, [block.id, updateSchemaBlock]);

  // ── Overflow detection & split handler ──────────────────────────
  // Compute how many content blocks are hidden beyond compression
  const allContentBlocks = activeContent || [];
  const overflowCount = React.useMemo(() => {
    if (!compression?.isCompressed) return 0;
    // When clipped, all hidden blocks are overflow candidates
    if (compression.clipped) {
      return allContentBlocks.length - 1; // At least 1 visible, rest overflow
    }
    // When compressed but not clipped, check if hidden count is significant
    const visibleCount = compression.params?.visibleItemCount ?? Math.ceil(allContentBlocks.length * 0.4);
    return Math.max(0, allContentBlocks.length - visibleCount);
  }, [compression, allContentBlocks.length]);

  const handleSplit = useCallback(() => {
    if (!block.id) return;
    // Split after the first half of visible blocks
    const splitPoint = Math.max(0, Math.ceil(allContentBlocks.length / 2) - 1);
    splitMateriContent(block.id, splitPoint);
  }, [block.id, allContentBlocks.length, splitMateriContent]);

  const sharedProps = {
    block,
    mode,
    tokens,
    interactive,
    isCompact,
    compression,
    activeContent,
    hasTabs,
    activeTabIndex,
    onTabChange: handleTabChange,
    overflowCount,
    onSplit: handleSplit,
  };

  const accentColor = block.accentColor || 'c';
  return (
    <PremiumBlockWrapper tokens={tokens} accent={accentColor} staggerIndex={0}>
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
});