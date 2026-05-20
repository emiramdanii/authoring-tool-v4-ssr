'use client';

import React, { useCallback, useState } from 'react';
import { Shield, Target, Link2, CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import type { TujuanDisplayBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { useCanvaStore } from '../../../store/canva/store';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';
import { RichText } from './RichText';
import { fireConfettiMini } from '@/lib/confetti';
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
      className="premium-card-glow rounded-2xl overflow-hidden"
      style={{
        background: tokens.color('card'),
        boxShadow: tokens.raw.shadow.elevated,
        border: `1px solid ${tokens.colorAlpha('y', 0.15)}`,
        animation: 'coverReveal 0.6s ease-out',
      }}
    >
      {/* ═══ HEADER ══════════════════════════════════════════════ */}
      <div
        style={{
          borderLeft: `4px solid ${tokens.color('y')}`,
          background: `linear-gradient(135deg, ${tokens.colorAlpha('y', 0.1)}, ${tokens.colorAlpha('y', 0.03)})`,
          padding: isCompact ? '10px 12px' : '14px 18px',
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: tokens.colorAlpha('y', 0.15),
                border: `1px solid ${tokens.colorAlpha('y', 0.3)}`,
                boxShadow: `0 0 12px ${tokens.colorAlpha('y', 0.1)}`,
              }}
            >
              <Target size={16} style={{ color: tokens.color('y') }} />
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
              <InlineTextEditor
                {...titleEditor}
                className="font-black leading-tight"
                style={{ fontSize: 'inherit', fontFamily: 'inherit', color: 'inherit', wordBreak: 'break-word' }}
              />
            </h2>
          </div>

          {/* BSNP Badge */}
          {block.bsnpRequired && (
            <PremiumBadge tokens={tokens} accent="y" variant="solid" isCompact={isCompact}>
              <Shield size={isCompact ? 8 : 10} /> WAJIB
            </PremiumBadge>
          )}
        </div>

        {/* Subtitle */}
        {block.subtitle && (
          <p
            className="mt-1.5 leading-relaxed"
            style={{
              fontSize: isCompact ? '10px' : '12px',
              color: tokens.muted(0.85),
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
            background: `linear-gradient(90deg, ${tokens.color('y')}, ${tokens.colorAlpha('c', 0.4)}, transparent)`,
          }}
        />
      </div>

      {/* ═══ OBJECTIVES LIST ═════════════════════════════════════ */}
      <div
        className="flex flex-col gap-2.5"
        style={{ padding: isCompact ? '10px 12px' : '14px 18px' }}
      >
        {objectives.map((obj, i) => (
          <MicroInteraction key={`td-a-mi-${block.id || 'td'}-${i}`} tokens={tokens} accent={obj.color} effect="squish">
          <div
            className="flex items-start gap-3 rounded-xl p-3 transition-all hover:-translate-y-0.5"
            style={{
              background: tokens.colorAlpha(obj.color, 0.08),
              border: `1px solid ${tokens.colorAlpha(obj.color, 0.2)}`,
              borderLeft: `4px solid ${tokens.color(obj.color)}`,
              borderRadius: tokens.radius('xl') + 'px',
              boxShadow: tokens.raw.shadow.card,
              animation: `blockStaggerIn 0.5s ease ${i * 0.08}s both`,
            }}
          >
            {/* Number badge */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-black flex-shrink-0"
              style={{
                background: tokens.colorAlpha(obj.color, 0.2),
                color: tokens.color(obj.color),
                fontSize: isCompact ? '11px' : '12px',
                boxShadow: `0 3px 10px ${tokens.colorAlpha(obj.color, 0.25)}`,
              }}
            >
              {i + 1}
            </div>

            {/* Objective content */}
            <div className="flex items-start gap-2 min-w-0 flex-1">
              {obj.icon && (
                <span className="flex-shrink-0 mt-0.5" style={{ fontSize: isCompact ? '13px' : '15px' }}>
                  {obj.icon}
                </span>
              )}
              <span
                className="leading-relaxed"
                style={{
                  fontSize: isCompact ? '11px' : '13px',
                  color: tokens.color('text'),
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                {obj.text}
              </span>
            </div>
          </div>
          </MicroInteraction>
        ))}
      </div>
      {/* ═══ COMPRESSION: Strategy-aware reveal/collapse UI ════
       *  REVEAL-SET: Fade gradient + "Lihat lainnya" / "Sembunyikan" toggle
       *  COLLAPSIBLE: "Selengkapnya" / "Ringkas" toggle
       *  Other strategies: Generic ShowMoreButton */}
      {isCompressed && isRevealSetMode && !block.profil && (
        <div style={{ margin: isCompact ? '0 12px 8px' : '0 18px 12px', position: 'relative' }}>
          {/* Fade gradient when not fully revealed */}
          {!isExpanded && (
            <div
              className="absolute bottom-8 left-0 right-0 pointer-events-none"
              style={{
                height: 40,
                background: `linear-gradient(transparent, ${tokens.colorAlpha('bg', 0.9)})`,
                zIndex: 2,
              }}
            />
          )}
          <button
            onClick={showMore}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all"
            style={{
              background: tokens.isDark() ? 'rgba(52, 211, 153, 0.12)' : 'rgba(52, 211, 153, 0.08)',
              border: `1px dashed ${tokens.isDark() ? 'rgba(52, 211, 153, 0.4)' : 'rgba(52, 211, 153, 0.3)'}`,
              color: tokens.isDark() ? 'rgba(52, 211, 153, 1)' : 'rgba(52, 211, 153, 0.9)',
              fontSize: isCompact ? '9px' : '11px',
              fontWeight: 700,
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
        <div style={{ margin: isCompact ? '0 12px 8px' : '0 18px 12px' }}>
          <button
            onClick={showMore}
            className="flex items-center justify-center gap-1 w-full py-2 rounded-xl transition-colors"
            style={{
              background: tokens.isDark() ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
              color: tokens.isDark() ? 'rgba(99, 102, 241, 1)' : 'rgba(99, 102, 241, 0.9)',
              fontSize: isCompact ? '9px' : '11px',
              cursor: 'pointer',
              fontWeight: 700,
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
        <div style={{ margin: isCompact ? '0 12px 8px' : '0 18px 12px' }}>
          <ShowMoreButton
            hiddenCount={hiddenCount}
            onShowMore={showMore}
            itemLabel="tujuan lainnya"
            isCompact={isCompact}
          />
        </div>
      )}

      {block.profil && (
        <div
          style={{
            margin: isCompact ? '0 12px 12px' : '0 18px 16px',
            padding: isCompact ? '8px 12px' : '12px 16px',
            background: tokens.colorAlpha(block.profilColor || 'g', 0.1),
            border: `1px solid ${tokens.colorAlpha(block.profilColor || 'g', 0.25)}`,
            borderLeft: `4px solid ${tokens.color(block.profilColor || 'g')}`,
            borderRadius: tokens.radius('xl') + 'px',
            boxShadow: tokens.raw.shadow.card,
          }}
        >
          <div className="flex items-start gap-2">
            <Link2 size={14} className="flex-shrink-0 mt-0.5" style={{ color: tokens.color(block.profilColor || 'g') }} />
            <div className="min-w-0">
              <strong
                style={{
                  color: tokens.color(block.profilColor || 'g'),
                  fontSize: isCompact ? '10px' : '11px',
                }}
              >
                Profil Pelajar Pancasila:
              </strong>
              <span
                className="ml-1"
                style={{
                  fontSize: isCompact ? '10px' : '12px',
                  color: tokens.color('text'),
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
      // Fire confetti when all objectives are checked
      if (objectives.length > 0 && Object.values(next).filter(Boolean).length === objectives.length) {
        fireConfettiMini();
      }
      return next;
    });
  };

  return (
    <div
      className="premium-card-glow rounded-2xl overflow-hidden"
      style={{
        background: tokens.color('card'),
        boxShadow: tokens.raw.shadow.elevated,
        border: `1px solid ${tokens.colorAlpha('y', 0.12)}`,
        animation: 'coverReveal 0.6s ease-out',
      }}
    >
      {/* Header — compact */}
      <div
        style={{
          padding: isCompact ? '10px 14px' : '14px 20px',
          borderBottom: `1px solid ${tokens.colorAlpha('c', 0.1)}`,
          background: tokens.colorAlpha('y', 0.04),
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 size={18} style={{ color: tokens.color('y') }} />
            <h2
              className="font-black leading-tight min-w-0"
              style={{
                fontFamily: tokens.fontFamily('display'),
                fontSize: isCompact ? '14px' : '1.15rem',
                color: tokens.color('text'),
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
            <PremiumBadge tokens={tokens} accent="y" variant="solid" isCompact={isCompact}>
              <Shield size={isCompact ? 8 : 10} /> WAJIB
            </PremiumBadge>
          )}
        </div>

        {block.subtitle && (
          <p
            className="mt-1"
            style={{
              fontSize: isCompact ? '10px' : '11px',
              color: tokens.muted(0.85),
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
          padding: isCompact ? '10px 14px' : '14px 20px',
        }}
      >
        <div className="flex flex-col gap-1">
          {objectives.map((obj, i) => {
            const isChecked = !!checked[i];
            return (
              <MicroInteraction key={`td-b-mi-${block.id || 'td'}-${i}`} tokens={tokens} accent={obj.color} effect="ripple">
              <div
                className="flex items-start gap-3 rounded-lg transition-all"
                style={{
                  padding: isCompact ? '8px 10px' : '10px 14px',
                  background: isChecked
                    ? tokens.colorAlpha(obj.color, 0.06)
                    : 'transparent',
                  animation: `blockStaggerIn 0.5s ease ${i * 0.08}s both`,
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
                    transition: 'all 0.2s ease',
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
                    <span className="flex-shrink-0 mt-0.5" style={{ fontSize: isCompact ? '12px' : '14px' }}>
                      {obj.icon}
                    </span>
                  )}
                  <span
                    className="leading-relaxed"
                    style={{
                      fontSize: isCompact ? '11px' : '13px',
                      color: isChecked ? tokens.muted(0.5) : tokens.color('text'),
                      textDecoration: isChecked ? 'line-through' : 'none',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {obj.text}
                  </span>
                </div>
              </div>
              </MicroInteraction>
            );
          })}
        </div>

        {/* Progress indicator */}
        {objectives.length > 0 && (
          <div
            className="mt-3 flex items-center gap-2"
            style={{ fontSize: '11px', color: tokens.muted(0.5) }}
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
                  background: `linear-gradient(90deg, ${tokens.color('y')}, ${tokens.color('g')})`,
                  transition: 'width 0.4s ease',
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
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl transition-all mt-2"
            style={{
              background: tokens.isDark() ? 'rgba(52, 211, 153, 0.12)' : 'rgba(52, 211, 153, 0.08)',
              border: `1px dashed ${tokens.isDark() ? 'rgba(52, 211, 153, 0.4)' : 'rgba(52, 211, 153, 0.3)'}`,
              color: tokens.isDark() ? 'rgba(52, 211, 153, 1)' : 'rgba(52, 211, 153, 0.9)',
              fontSize: isCompact ? '9px' : '11px',
              fontWeight: 700,
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
            className="flex items-center justify-center gap-1 w-full py-1.5 rounded-xl transition-colors mt-2"
            style={{
              background: tokens.isDark() ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
              color: tokens.isDark() ? 'rgba(99, 102, 241, 1)' : 'rgba(99, 102, 241, 0.9)',
              fontSize: isCompact ? '9px' : '11px',
              cursor: 'pointer',
              fontWeight: 700,
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
          />
        )}
      </div>

      {/* Profil section */}
      {block.profil && (
        <div
          style={{
            margin: isCompact ? '0 14px 12px' : '0 20px 16px',
            padding: isCompact ? '8px 12px' : '10px 14px',
            background: tokens.colorAlpha(block.profilColor || 'g', 0.06),
            borderRadius: tokens.radius('lg') + 'px',
            border: `1px solid ${tokens.colorAlpha(block.profilColor || 'g', 0.15)}`,
          }}
        >
          <div className="flex items-center gap-2">
            <Link2 size={12} style={{ color: tokens.color(block.profilColor || 'g') }} />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: tokens.color(block.profilColor || 'g'),
              }}
            >
              Profil Pelajar Pancasila:
            </span>
            <span
              style={{
                fontSize: isCompact ? '10px' : '11px',
                color: tokens.color('text'),
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
    const sx = parseFloat(pos.left);
    const sy = parseFloat(pos.top);

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
      background: `linear-gradient(90deg, ${tokens.colorAlpha('y', 0.3)}, ${tokens.colorAlpha('y', 0.08)})`,
      pointerEvents: 'none' as const,
      zIndex: 0,
    };
  };

  return (
    <div
      className="premium-card-glow rounded-2xl overflow-hidden"
      style={{
        background: tokens.color('card'),
        boxShadow: tokens.raw.shadow.elevated,
        border: `1px solid ${tokens.colorAlpha('y', 0.12)}`,
        animation: 'coverReveal 0.6s ease-out',
      }}
    >
      {/* BSNP Badge */}
      {block.bsnpRequired && isEditing && (
        <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 5 }}>
          <PremiumBadge tokens={tokens} accent="y" variant="solid" isCompact={isCompact}>
            <Shield size={8} /> WAJIB
          </PremiumBadge>
        </div>
      )}

      {/* Mind map container */}
      <div
        style={{
          position: 'relative',
          minHeight: isCompact ? '240px' : '320px',
          padding: isCompact ? '16px' : '24px',
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
            <MicroInteraction key={`td-c-mi-${block.id || 'td'}-${i}`} tokens={tokens} accent={obj.color} effect="bounce">
            <div
              key={`td-c-obj-${block.id || 'td'}-${i}`}
              className="premium-card-glow"
              style={{
                position: 'absolute',
                left: pos.left,
                top: pos.top,
                transform: 'translate(-50%, -50%)',
                zIndex: 2,
                minWidth: isCompact ? '80px' : '110px',
                maxWidth: isCompact ? '140px' : '180px',
                padding: isCompact ? '6px 10px' : '8px 14px',
                borderRadius: tokens.radius('lg') + 'px',
                background: tokens.colorAlpha(obj.color, 0.1),
                border: `1.5px solid ${tokens.colorAlpha(obj.color, 0.3)}`,
                boxShadow: `0 2px 12px ${tokens.colorAlpha(obj.color, 0.12)}`,
                textAlign: 'center',
                animation: `blockStaggerIn 0.5s ease ${i * 0.1 + 0.3}s both`,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              {/* Small icon */}
              {obj.icon && (
                <span style={{ fontSize: isCompact ? '14px' : '16px', display: 'block', marginBottom: '2px' }}>
                  {obj.icon}
                </span>
              )}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: tokens.color('text'),
                  lineHeight: 1.4,
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
            </MicroInteraction>
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
            animation: 'blockStaggerIn 0.5s ease both',
          }}
        >
          <div
            style={{
              width: isCompact ? '44px' : '52px',
              height: isCompact ? '44px' : '52px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${tokens.color('y')}, ${tokens.colorAlpha('y', 0.8)})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 20px ${tokens.colorAlpha('y', 0.35)}`,
              animation: 'breathe 4s ease-in-out infinite',
            }}
          >
            <Target size={isCompact ? 18 : 22} style={{ color: tokens.color('bg') }} />
          </div>
          <h2
            className="font-black leading-tight text-center"
            style={{
              fontFamily: tokens.fontFamily('display'),
              fontSize: isCompact ? '11px' : '13px',
              color: tokens.color('text'),
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
            margin: isCompact ? '0 12px 10px' : '0 18px 14px',
            padding: isCompact ? '6px 12px' : '8px 14px',
            background: tokens.colorAlpha(block.profilColor || 'g', 0.06),
            borderRadius: tokens.radius('lg') + 'px',
            border: `1px solid ${tokens.colorAlpha(block.profilColor || 'g', 0.15)}`,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Link2 size={12} style={{ color: tokens.color(block.profilColor || 'g'), flexShrink: 0 }} />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: tokens.color(block.profilColor || 'g'),
            }}
          >
            Profil Pelajar Pancasila:
          </span>
          <span
            style={{
              fontSize: isCompact ? '10px' : '11px',
              color: tokens.color('text'),
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
    <PremiumBlockWrapper tokens={tokens} accent="y" staggerIndex={0} gradientBorder>
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