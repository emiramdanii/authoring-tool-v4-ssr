'use client';

import React, { useCallback, useState } from 'react';
import { Shield, Target, Link2, CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import type { TujuanDisplayBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { useCanvaStore } from '../../../store/canva/store';
import { PremiumBlockWrapper, ReadingProgressIndicator } from './PremiumBlockEffects';
import { RichText } from './RichText';

import { useBlockCompression } from '../../layout/useBlockCompression';
import { ShowMoreButton } from '../../layout/ShowMoreButton';
import type { CompressionDecision } from '../../layout/CompressionEngine';
import { Eye, EyeOff } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════
// TUJUAN DISPLAY RENDERER — Premium with 3 Creative Variants
// ═══════════════════════════════════════════════════════════════════
// Variants:
//   A "Klasik" — Header, numbered objective cards, profil section
//   B "Checklist" — Checkbox style with custom checkbox circles
//   C "Peta Konsep" — Mind map style with central + satellite nodes
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
// VARIANT A "Klasik" — Header, numbered objective cards, profil
// ═══════════════════════════════════════════════════════════════════
function TujuanVariantA({
  block, tokens, isCompact, isEditing, titleEditor, compression,
}: {
  block: TujuanDisplayBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean;
  titleEditor: ReturnType<typeof useInlineEditor>;
  compression?: CompressionDecision;
}) {
  const allObjectives = block.objectives || [];
  const edu = tokens.edu('tujuan-display', isCompact);

  // ── Compression-aware objective visibility (strategy-aware) ──
  const { visibleCount, hasMore, hiddenCount, showMore, isCompressed, strategy, isExpanded } = useBlockCompression({
    compression,
    totalItems: allObjectives.length,
  });

  // Collapsible strategy: show collapsed summary, expand for detail
  const isCollapsibleMode = isCompressed && strategy === 'collapsible';
  const isRevealSetMode = isCompressed && strategy === 'reveal-set';

  // For collapsible: show all when expanded, truncate when collapsed
  // For reveal-set: slice to visibleCount
  const objectives = isCollapsibleMode
    ? (isExpanded ? allObjectives : allObjectives.slice(0, Math.max(1, Math.ceil(allObjectives.length * 0.4))))
    : (isRevealSetMode ? allObjectives.slice(0, visibleCount) : (isCompressed ? allObjectives.slice(0, visibleCount) : allObjectives));

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        ...edu.cardStyle(),
        ...edu.entrance(0, 'fadeIn'),
      }}
    >
      {/* ═══ HEADER ══════════════════════════════════════════════ */}
      <div
        style={{
          ...edu.headerStyle(),
          background: `linear-gradient(135deg, ${edu.accentBg()}, ${edu.accentAlpha(0.03)})`,
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                width: edu.iconSize('md'),
                height: edu.iconSize('md'),
                background: edu.accentAlpha(0.15),
                border: `1px solid ${edu.accentAlpha(0.3)}`,
                boxShadow: 'none',
              }}
            >
              <Target size={16} style={{ color: edu.accent() }} />
            </div>
            <h2
              className="font-black leading-tight min-w-0"
              style={{
                ...edu.heading(),
                color: edu.textColor(),
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

          {/* BSNP Badge */}
          {block.bsnpRequired && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold"
              style={{ ...edu.micro(), background: edu.accentBg(), color: edu.accent(), border: `1px solid ${edu.accentAlpha(0.2)}` }}>
              <Shield size={isCompact ? 8 : 10} /> WAJIB
            </span>
          )}
        </div>

        {/* Subtitle */}
        {block.subtitle && (
          <p
            className="mt-1.5 leading-relaxed"
            style={{
              ...edu.caption(),
              color: edu.mutedText(0.85),
              marginLeft: isCompact ? '44px' : '52px',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            <RichText content={block.subtitle ?? ''} />
          </p>
        )}

        {/* Decorative gradient line */}
        <div
          className="mt-3 h-1 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${edu.accent()}, ${tokens.colorAlpha('c', 0.4)}, transparent)`,
          }}
        />
      </div>

      {/* ═══ OBJECTIVES LIST ═════════════════════════════════════ */}
      <div
        className="flex flex-col gap-2.5"
        style={{ ...edu.componentPadding() }}
      >
        {objectives.map((obj, i) => (
          
          <div
            className="flex items-start gap-3 rounded-xl p-3 transition-[transform,background-color,border-color,box-shadow] hover:-translate-y-0.5"
            style={{
              background: tokens.colorAlpha(obj.color, 0.08),
              border: `1px solid ${tokens.colorAlpha(obj.color, 0.2)}`,
              borderLeft: `4px solid ${tokens.color(obj.color)}`,
              borderRadius: edu.radius('xl'),
              boxShadow: edu.shadow('card'),
              ...edu.entrance(i, 'slideUp'),
            }}
          >
            {/* Number badge */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-black flex-shrink-0"
              style={{
                ...edu.caption(),
                background: tokens.colorAlpha(obj.color, 0.2),
                color: tokens.color(obj.color),
                boxShadow: 'none',
              }}
            >
              {i + 1}
            </div>

            {/* Objective content */}
            <div className="flex items-start gap-2 min-w-0 flex-1">
              {obj.icon && (
                <span className="flex-shrink-0 mt-0.5" style={{ ...edu.bodyLg() }}>
                  {obj.icon}
                </span>
              )}
              <span
                className="leading-relaxed"
                style={{
                  ...edu.body(),
                  color: edu.textColor(),
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                {obj.text}
              </span>
            </div>
          </div>
          
        ))}
      </div>
      {/* ═══ COMPRESSION: Strategy-aware reveal/collapse UI ════
       *  REVEAL-SET: Fade gradient + "Lihat lainnya" / "Sembunyikan" toggle
       *  COLLAPSIBLE: "Selengkapnya" / "Ringkas" toggle
       *  Other strategies: Generic ShowMoreButton */}
      {isCompressed && isRevealSetMode && !block.profil && (
        <div style={{ ...tokens.iosInnerMargin(isCompact), marginBottom: isCompact ? 8 : 12, position: 'relative' }}>
          {/* Fade gradient when not fully revealed */}
          {!isExpanded && (
            <div
              className="absolute bottom-8 left-0 right-0 pointer-events-none"
              style={{
                height: 40,
                background: `linear-gradient(transparent, ${tokens.eduPageBg()})`,
                zIndex: 2,
              }}
            />
          )}
          <button
            onClick={showMore}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl transition-[background-color,border-color,color]"
            style={{
              background: tokens.colorAlpha('g', tokens.isDark() ? 0.12 : 0.08),
              border: `1px dashed ${tokens.colorAlpha('g', tokens.isDark() ? 0.4 : 0.3)}`,
              color: tokens.colorAlpha('g', tokens.isDark() ? 1 : 0.9),
              ...edu.micro(),
              cursor: 'pointer',
            }}
          >
            {isExpanded
              ? <><EyeOff size={isCompact ? 10 : 12} /> Sembunyikan</>
              : <><Eye size={isCompact ? 10 : 12} /> Lihat {hiddenCount} tujuan lainnya</>
            }
          </button>
        </div>
      )}
      {isCompressed && isCollapsibleMode && (
        <div style={{ ...tokens.iosInnerMargin(isCompact), marginBottom: isCompact ? 8 : 12 }}>
          <button
            onClick={showMore}
            className={`flex items-center justify-center gap-1 w-full py-2 rounded-xl ${tokens.iosExpandTw()} `}
            style={{
              background: tokens.colorAlpha('p', tokens.isDark() ? 0.15 : 0.1),
              color: tokens.colorAlpha('p', tokens.isDark() ? 1 : 0.9),
              ...edu.micro(),
              cursor: 'pointer',
            }}
          >
            {isExpanded
              ? <><ChevronUp size={isCompact ? 10 : 12} /> Ringkas</>
              : <><ChevronDown size={isCompact ? 10 : 12} /> Selengkapnya</>
            }
          </button>
        </div>
      )}
      {hasMore && !isRevealSetMode && !isCollapsibleMode && !block.profil && (
        <div style={{ ...tokens.iosInnerMargin(isCompact), marginBottom: isCompact ? 8 : 12 }}>
          <ShowMoreButton
            hiddenCount={hiddenCount}
            onShowMore={showMore}
            itemLabel="tujuan lainnya"
            isCompact={isCompact}
            tokens={tokens}
          />
        </div>
      )}

      {block.profil && (
        <div
          style={{
            ...tokens.iosInnerMargin(isCompact), marginTop: 0,
            ...tokens.iosCardPadding(isCompact),
            background: tokens.colorAlpha(block.profilColor || 'g', 0.1),
            border: `1px solid ${tokens.colorAlpha(block.profilColor || 'g', 0.25)}`,
            borderLeft: `4px solid ${tokens.color(block.profilColor || 'g')}`,
            borderRadius: edu.radius('xl'),
            boxShadow: edu.shadow('card'),
          }}
        >
          <div className="flex items-start gap-2">
            <Link2 size={14} className="flex-shrink-0 mt-0.5" style={{ color: tokens.color(block.profilColor || 'g') }} />
            <div className="min-w-0">
              <strong
                style={{
                  ...edu.caption(),
                  color: tokens.color(block.profilColor || 'g'),
                }}
              >
                Profil Pelajar Pancasila:
              </strong>
              <span
                className="ml-1"
                style={{
                  ...edu.body(),
                  color: edu.textColor(),
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                <RichText content={block.profil ?? ''} />
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VARIANT B "Checklist" — Checkbox style with checkmark circles
// ═══════════════════════════════════════════════════════════════════
function TujuanVariantB({
  block, tokens, isCompact, isEditing, titleEditor, compression,
}: {
  block: TujuanDisplayBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean;
  titleEditor: ReturnType<typeof useInlineEditor>;
  compression?: CompressionDecision;
}) {
  const allObjectives = block.objectives || [];
  const edu = tokens.edu('tujuan-display', isCompact);
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  // ── Compression-aware objective visibility (strategy-aware) ──
  const { visibleCount, hasMore, hiddenCount, showMore, isCompressed, strategy, isExpanded } = useBlockCompression({
    compression,
    totalItems: allObjectives.length,
  });

  const isCollapsibleMode = isCompressed && strategy === 'collapsible';
  const isRevealSetMode = isCompressed && strategy === 'reveal-set';
  const objectives = isCollapsibleMode
    ? (isExpanded ? allObjectives : allObjectives.slice(0, Math.max(1, Math.ceil(allObjectives.length * 0.4))))
    : (isCompressed ? allObjectives.slice(0, visibleCount) : allObjectives);

  const toggleCheck = (idx: number) => {
    setChecked(prev => {
      const next = { ...prev, [idx]: !prev[idx] };
      return next;
    });
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        ...edu.cardStyle(),
        ...edu.entrance(0, 'fadeIn'),
      }}
    >
      {/* Header — compact */}
      <div
        style={{
          ...edu.headerStyle(),
          borderBottom: `1px solid ${tokens.colorAlpha('c', 0.1)}`,
          background: edu.accentBg(),
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 size={edu.iconSize('sm')} style={{ color: edu.accent() }} />
            <h2
              className="font-black leading-tight min-w-0"
              style={{
                ...edu.heading(),
                color: edu.textColor(),
                wordBreak: 'break-word',
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
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold"
              style={{ ...edu.micro(), background: edu.accentBg(), color: edu.accent(), border: `1px solid ${edu.accentAlpha(0.2)}` }}>
              <Shield size={isCompact ? 8 : 10} /> WAJIB
            </span>
          )}
        </div>

        {block.subtitle && (
          <p
            className="mt-1"
            style={{
              ...edu.caption(),
              color: edu.mutedText(0.85),
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            <RichText content={block.subtitle ?? ''} />
          </p>
        )}
      </div>

      {/* Checklist items */}
      <div
        style={{
          ...edu.componentPadding(),
        }}
      >
        <div className="flex flex-col gap-1">
          {objectives.map((obj, i) => {
            const isChecked = !!checked[i];
            return (
              
              <div
                className="flex items-start gap-3 rounded-lg transition-[background-color,border-color,color]"
                style={{
                  ...edu.nestedPadding(),
                  background: isChecked
                    ? tokens.colorAlpha(obj.color, 0.06)
                    : 'transparent',
                  ...edu.entrance(i, 'slideUp'),
                  cursor: isEditing ? 'default' : 'pointer',
                }}
                onClick={() => { if (!isEditing) toggleCheck(i); }}
                role={isEditing ? undefined : 'checkbox'}
                aria-checked={isChecked}
              >
                {/* Checkbox circle */}
                <div
                  className="flex-shrink-0 mt-0.5"
                  style={{
                    width: isCompact ? '18px' : '22px',
                    height: isCompact ? '18px' : '22px',
                    borderRadius: '50%',
                    border: `2px solid ${isChecked ? tokens.color(obj.color) : tokens.colorAlpha(obj.color, 0.4)}`,
                    background: isChecked
                      ? tokens.colorAlpha(obj.color, 0.2)
                      : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...edu.transition('background-color, border-color, color, transform', 'fast'),
                  }}
                >
                  {isChecked && (
                    <CheckCircle2
                      size={isCompact ? 12 : 15}
                      style={{ color: tokens.color(obj.color) }}
                    />
                  )}
                </div>

                {/* Objective text */}
                <div className="flex items-start gap-1.5 min-w-0 flex-1">
                  {obj.icon && (
                    <span className="flex-shrink-0 mt-0.5" style={{ ...edu.bodyLg() }}>
                      {obj.icon}
                    </span>
                  )}
                  <span
                    className="leading-relaxed"
                    style={{
                      ...edu.body(),
                      color: isChecked ? edu.mutedText(0.5) : edu.textColor(),
                      textDecoration: isChecked ? 'line-through' : 'none',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      ...edu.transition('color, text-decoration-color', 'fast'),
                    }}
                  >
                    {obj.text}
                  </span>
                </div>
              </div>
              
            );
          })}
        </div>

        {/* Progress indicator */}
        {objectives.length > 0 && (
          <div
            className="mt-3 flex items-center gap-2"
            style={{ ...edu.caption(), color: edu.mutedText(0.5) }}
          >
            <div
              style={{
                flex: 1,
                height: '3px',
                borderRadius: '99px',
                background: tokens.colorAlpha('c', 0.1),
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${(Object.values(checked).filter(Boolean).length / allObjectives.length) * 100}%`,
                  borderRadius: '99px',
                  background: `linear-gradient(90deg, ${edu.accent()}, ${tokens.color('g')})`,
                  ...edu.transition('width', 'slow'),
                }}
              />
            </div>
            <span>
              {Object.values(checked).filter(Boolean).length}/{allObjectives.length} tercapai
            </span>
          </div>
        )}

        {/* Compression: Strategy-aware show/reveal UI */}
        {isCompressed && isRevealSetMode && (
          <button
            onClick={showMore}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl transition-[background-color,border-color,color] mt-2"
            style={{
              background: tokens.colorAlpha('g', tokens.isDark() ? 0.12 : 0.08),
              border: `1px dashed ${tokens.colorAlpha('g', tokens.isDark() ? 0.4 : 0.3)}`,
              color: tokens.colorAlpha('g', tokens.isDark() ? 1 : 0.9),
              ...edu.micro(),
              cursor: 'pointer',
            }}
          >
            {isExpanded
              ? <><EyeOff size={isCompact ? 10 : 12} /> Sembunyikan</>
              : <><Eye size={isCompact ? 10 : 12} /> Lihat {hiddenCount} tujuan lagi</>
            }
          </button>
        )}
        {isCompressed && isCollapsibleMode && (
          <button
            onClick={showMore}
            className={`flex items-center justify-center gap-1 w-full py-1.5 rounded-xl ${tokens.iosExpandTw()} mt-2`}
            style={{
              background: tokens.colorAlpha('p', tokens.isDark() ? 0.15 : 0.1),
              color: tokens.colorAlpha('p', tokens.isDark() ? 1 : 0.9),
              ...edu.micro(),
              cursor: 'pointer',
            }}
          >
            {isExpanded
              ? <><ChevronUp size={isCompact ? 10 : 12} /> Ringkas</>
              : <><ChevronDown size={isCompact ? 10 : 12} /> Selengkapnya</>
            }
          </button>
        )}
        {hasMore && !isRevealSetMode && !isCollapsibleMode && (
          <ShowMoreButton
            hiddenCount={hiddenCount}
            onShowMore={showMore}
            itemLabel="tujuan lagi"
            isCompact={isCompact}
            tokens={tokens}
          />
        )}
      </div>

      {/* Profil section */}
      {block.profil && (
        <div
          style={{
            ...tokens.iosInnerMargin(isCompact), marginTop: 0,
            ...edu.nestedPadding(),
            background: tokens.colorAlpha(block.profilColor || 'g', 0.06),
            borderRadius: edu.radius('lg'),
            border: `1px solid ${tokens.colorAlpha(block.profilColor || 'g', 0.15)}`,
          }}
        >
          <div className="flex items-center gap-2">
            <Link2 size={12} style={{ color: tokens.color(block.profilColor || 'g') }} />
            <span
              style={{
                ...edu.caption(),
                color: tokens.color(block.profilColor || 'g'),
              }}
            >
              Profil Pelajar Pancasila:
            </span>
            <span
              style={{
                ...edu.body(),
                color: edu.textColor(),
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              <RichText content={block.profil ?? ''} />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VARIANT C "Peta Konsep" — Mind map style with central + satellites
// ═══════════════════════════════════════════════════════════════════
function TujuanVariantC({
  block, tokens, isCompact, isEditing, titleEditor, compression,
}: {
  block: TujuanDisplayBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean;
  titleEditor: ReturnType<typeof useInlineEditor>;
  compression?: CompressionDecision;
}) {
  const allObjectives = block.objectives || [];
  const edu = tokens.edu('tujuan-display', isCompact);

  // ── Compression-aware objective visibility (strategy-aware) ──
  const { visibleCount, hasMore, hiddenCount, showMore, isCompressed, strategy, isExpanded } = useBlockCompression({
    compression,
    totalItems: allObjectives.length,
  });

  const isCollapsibleMode = isCompressed && strategy === 'collapsible';
  const isRevealSetMode = isCompressed && strategy === 'reveal-set';
  const objectives = isCollapsibleMode
    ? (isExpanded ? allObjectives : allObjectives.slice(0, Math.max(1, Math.ceil(allObjectives.length * 0.4))))
    : (isCompressed ? allObjectives.slice(0, visibleCount) : allObjectives);
  const count = allObjectives.length;

  // Calculate satellite positions in a circle around the center
  const getSatellitePosition = (index: number, total: number) => {
    if (total <= 1) return { left: '50%', top: '18%' };
    if (total === 2) {
      // Two items: top-left and top-right
      const positions = [
        { left: '22%', top: '12%' },
        { left: '68%', top: '12%' },
      ];
      return positions[index] || positions[0];
    }
    // Arrange in upper semicircle for 3+, or full circle for 5+
    const useFullCircle = total > 4;
    const startAngle = useFullCircle ? -90 : -150;
    const endAngle = useFullCircle ? 270 : -30;
    const angleRange = endAngle - startAngle;
    const angle = startAngle + (angleRange / Math.max(total - 1, 1)) * index;
    const rad = (angle * Math.PI) / 180;
    // Radius as percentage from center
    const radiusX = 36;
    const radiusY = 28;
    const cx = 50 + radiusX * Math.cos(rad);
    const cy = 45 + radiusY * Math.sin(rad);
    return { left: `${cx}%`, top: `${cy}%` };
  };

  // Calculate line endpoints from center to satellite
  const getLineStyle = (index: number, total: number) => {
    const pos = getSatellitePosition(index, total);
    // Center is at (50%, 68%) approximately
    const cx = 50;
    const cy = 65;
    const sx = parseFloat(pos!.left);
    const sy = parseFloat(pos!.top);

    // Calculate line from center to satellite
    const dx = sx - cx;
    const dy = sy - cy;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    return {
      position: 'absolute' as const,
      left: `${cx}%`,
      top: `${cy}%`,
      width: `${length}%`,
      height: '2px',
      transformOrigin: '0 0',
      transform: `rotate(${angle}deg)`,
      background: `linear-gradient(90deg, ${edu.accentAlpha(0.3)}, ${edu.accentAlpha(0.08)})`,
      pointerEvents: 'none' as const,
      zIndex: 0,
    };
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        ...edu.cardStyle(),
        ...edu.entrance(0, 'fadeIn'),
      }}
    >
      {/* BSNP Badge */}
      {block.bsnpRequired && isEditing && (
        <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 5 }}>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold"
              style={{ ...edu.micro(), background: edu.accentBg(), color: edu.accent(), border: `1px solid ${edu.accentAlpha(0.2)}` }}>
            <Shield size={8} /> WAJIB
          </span>
        </div>
      )}

      {/* Mind map container */}
      <div
        style={{
          position: 'relative',
          minHeight: isCompact ? '240px' : '320px',
          ...edu.componentPadding(),
          overflow: 'hidden',
        }}
      >
        {/* Connecting lines */}
        {objectives.map((obj, i) => (
          <div
            key={`td-c-line-${block.id || 'td'}-${i}`}
            style={getLineStyle(i, count)}
          />
        ))}

        {/* Satellite nodes (objectives) */}
        {objectives.map((obj, i) => {
          const pos = getSatellitePosition(i, count);
          return (
            
            <div
              key={`td-c-obj-${block.id || 'td'}-${i}`}
              className=""
              style={{
                position: 'absolute',
                left: pos!.left,
                top: pos!.top,
                transform: 'translate(-50%, -50%)',
                zIndex: 2,
                minWidth: isCompact ? '80px' : '110px',
                maxWidth: isCompact ? '140px' : '180px',
                ...edu.nestedPadding(),
                borderRadius: edu.radius('lg'),
                background: tokens.colorAlpha(obj.color, 0.1),
                border: `1.5px solid ${tokens.colorAlpha(obj.color, 0.3)}`,
                boxShadow: 'none',
                textAlign: 'center',
                ...edu.entrance(i, 'slideUp'),
                ...edu.transition('transform, box-shadow', 'fast'),
              }}
            >
              {/* Small icon */}
              {obj.icon && (
                <span style={{ ...edu.bodyLg(), display: 'block', marginBottom: '2px' }}>
                  {obj.icon}
                </span>
              )}
              <span
                style={{
                  ...edu.body(),
                  fontWeight: 600,
                  color: edu.textColor(),
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  wordBreak: 'break-word',
                }}
              >
                {obj.text}
              </span>
            </div>
            
          );
        })}

        {/* Central node (title) */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '65%',
            transform: 'translate(-50%, -50%)',
            zIndex: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            ...edu.entrance(0, 'slideUp'),
          }}
        >
          <div
            style={{
              width: isCompact ? '44px' : '52px',
              height: isCompact ? '44px' : '52px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${edu.accent()}, ${edu.accentAlpha(0.8)})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: edu.shadow('card'),
              animation: 'breathe 4s ease-in-out infinite',
            }}
          >
            <Target size={isCompact ? 18 : 22} style={{ color: tokens.color('bg') }} />
          </div>
          <h2
            className="font-black leading-tight text-center"
            style={{
              ...edu.heading(),
              color: edu.textColor(),
              wordBreak: 'break-word',
              maxWidth: isCompact ? '120px' : '160px',
            }}
          >
            <InlineTextEditor
              {...titleEditor}
              className="font-black leading-tight text-center"
              style={{ fontSize: 'inherit', fontFamily: 'inherit', color: 'inherit', wordBreak: 'break-word', textAlign: 'center' }}
            />
          </h2>
        </div>
      </div>

      {/* Profil — bottom strip */}
      {block.profil && (
        <div
          style={{
            ...tokens.iosInnerMargin(isCompact),
            marginTop: 0,
            ...edu.nestedPadding(),
            background: tokens.colorAlpha(block.profilColor || 'g', 0.06),
            borderRadius: edu.radius('lg'),
            border: `1px solid ${tokens.colorAlpha(block.profilColor || 'g', 0.15)}`,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Link2 size={12} style={{ color: tokens.color(block.profilColor || 'g'), flexShrink: 0 }} />
          <span
            style={{
              ...edu.caption(),
              color: tokens.color(block.profilColor || 'g'),
            }}
          >
            Profil Pelajar Pancasila:
          </span>
          <span
            style={{
              ...edu.body(),
              color: edu.textColor(),
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            <RichText content={block.profil ?? ''} />
          </span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT — TujuanDisplayRenderer
// ═══════════════════════════════════════════════════════════════════
export const TujuanDisplayRenderer = React.memo(function TujuanDisplayRenderer({ block, tokens, isCompact, isEditing, compression }: {
  block: TujuanDisplayBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean; compression?: CompressionDecision;
}) {
  const variant: 'A' | 'B' | 'C' = (block.variant as 'A' | 'B' | 'C') || 'A';

  const titleEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'title',
    value: block.title ?? '',
    tag: 'span',
  });

  const updateSchemaBlock = useCanvaStore((s) => s.updateSchemaBlock);
  const handleVariantChange = useCallback((v: string) => {
    if (block.id) updateSchemaBlock(block.id, { variant: v });
  }, [block.id, updateSchemaBlock]);

  const sharedProps = {
    block,
    tokens,
    isCompact,
    isEditing,
    titleEditor,
    compression,
  };

  return (
    <PremiumBlockWrapper tokens={tokens} accent="y" staggerIndex={0}>
      <ReadingProgressIndicator progress={1} tokens={tokens} accent="y" height={2} position="top" />
      <div style={{ position: 'relative' }}>
        <VariantSelector current={variant} onChange={handleVariantChange} isEditing={isEditing} />
        {variant === 'A' && <TujuanVariantA {...sharedProps} />}
        {variant === 'B' && <TujuanVariantB {...sharedProps} />}
        {variant === 'C' && <TujuanVariantC {...sharedProps} />}
      </div>
    </PremiumBlockWrapper>
  );
});