'use client';

import React from 'react';
import { Shield, Star, CheckCircle2, Brain } from 'lucide-react';
import type { MateriSectionBlock } from '../../schema/types';
import type { TokenResolver, SchemaRenderMode } from '../types';

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
// All text is in Indonesian. BSNP = Badan Standar Nasional Pendidikan.
// ═══════════════════════════════════════════════════════════════════

export function MateriSectionRenderer({ block, mode, tokens, interactive, isCompact, isEditing }: {
  block: MateriSectionBlock;
  mode: SchemaRenderMode;
  tokens: TokenResolver;
  interactive?: boolean;
  isCompact?: boolean;
  isEditing?: boolean;
}) {
  const accentColor = block.accentColor || 'c';
  const accent = tokens.color(accentColor);
  const accentAlpha = (a: number) => tokens.colorAlpha(accentColor, a);

  // Section number from block id (e.g. "materi-1" → 1) or fallback to 1
  const sectionNumber = (() => {
    if (block.id) {
      const match = block.id.match(/(\d+)$/);
      if (match) return parseInt(match[1], 10);
    }
    return 1;
  })();

  const contentBlocks = block.content || [];
  const takeaways = block.takeaways || [];
  const selfCheck = block.selfCheck;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: tokens.color('card'),
        boxShadow: tokens.raw.shadow.elevated,
        animation: 'fadeIn 0.4s ease',
        border: `1px solid ${accentAlpha(0.15)}`,
      }}
    >
      {/* ═══ SECTION HEADER ══════════════════════════════════════ */}
      <div
        style={{
          borderLeft: `4px solid ${accent}`,
          background: `linear-gradient(135deg, ${accentAlpha(0.08)}, ${accentAlpha(0.03)})`,
          padding: isCompact ? '12px 14px' : '18px 20px',
        }}
      >
        <div className="flex items-start gap-3">
          {/* Section number badge */}
          <div
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-black"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accentAlpha(0.7)})`,
              color: tokens.color('bg'),
              fontSize: isCompact ? '13px' : '15px',
              boxShadow: `0 4px 14px ${accentAlpha(0.35)}`,
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
                  fontFamily: tokens.fontFamily('display'),
                  fontSize: isCompact ? '16px' : '1.35rem',
                  color: tokens.color('text'),
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
                  fontSize: isCompact ? '11px' : '13px',
                  color: tokens.muted(0.75),
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                {block.subtitle}
              </p>
            )}
          </div>

          {/* BSNP "WAJIB" badge */}
          {block.bsnpRequired && (
            <div
              className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full font-extrabold uppercase"
              style={{
                background: `linear-gradient(135deg, ${tokens.color('y')}, ${tokens.colorAlpha('y', 0.8)})`,
                color: tokens.color('bg'),
                fontSize: isCompact ? '8px' : '9px',
                letterSpacing: '0.1em',
                boxShadow: `0 2px 10px ${tokens.colorAlpha('y', 0.4)}`,
              }}
            >
              <Shield size={isCompact ? 9 : 11} />
              <span>WAJIB BSNP</span>
            </div>
          )}
        </div>

        {/* Gradient accent line under header */}
        <div
          className="mt-3 h-1 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${accent}, ${accentAlpha(0.2)}, transparent)`,
          }}
        />
      </div>

      {/* ═══ CONTENT AREA — child SchemaBlock[] ═══════════════════ */}
      {contentBlocks.length > 0 && (
        <div
          className="flex flex-col gap-4"
          style={{
            padding: isCompact ? '12px 14px' : '18px 20px',
          }}
        >
          {contentBlocks.map((childBlock, i) => (
            <React.Suspense
              key={`materi-child-${childBlock.id || childBlock.type}-${i}`}
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
        </div>
      )}

      {/* ═══ KEY TAKEAWAYS ════════════════════════════════════════ */}
      {takeaways.length > 0 && (
        <div
          style={{
            margin: isCompact ? '0 14px 12px' : '0 20px 16px',
            padding: isCompact ? '10px 12px' : '14px 16px',
            background: tokens.colorAlpha('g', 0.08),
            border: `1px solid ${tokens.colorAlpha('g', 0.2)}`,
            borderRadius: tokens.radius('xl') + 'px',
          }}
        >
          {/* "Poin Penting" heading */}
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: tokens.colorAlpha('g', 0.2),
              }}
            >
              <Star size={12} style={{ color: tokens.color('g') }} />
            </div>
            <span
              className="font-extrabold uppercase tracking-wider"
              style={{
                color: tokens.color('g'),
                fontSize: isCompact ? '10px' : '11px',
              }}
            >
              Poin Penting
            </span>
          </div>

          {/* Takeaway items */}
          <div className="flex flex-col gap-2">
            {takeaways.map((item, i) => (
              <div
                key={`materi-takeaway-${block.id || 'ms'}-${i}`}
                className="flex items-start gap-2.5 rounded-lg p-2"
                style={{
                  background: tokens.colorAlpha('g', 0.06),
                  border: `1px solid ${tokens.colorAlpha('g', 0.12)}`,
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
                    fontSize: isCompact ? '11px' : '13px',
                    color: tokens.color('text'),
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                  }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ SELF-CHECK PROMPT ════════════════════════════════════ */}
      {selfCheck && (
        <div
          style={{
            margin: isCompact ? '0 14px 14px' : '0 20px 20px',
            padding: isCompact ? '10px 12px' : '14px 16px',
            background: tokens.colorAlpha('y', 0.1),
            border: `1px solid ${tokens.colorAlpha('y', 0.25)}`,
            borderRadius: tokens.radius('xl') + 'px',
            borderLeft: `4px solid ${tokens.color('y')}`,
          }}
        >
          <div className="flex items-start gap-3">
            {/* Brain icon in thought bubble */}
            <div
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${tokens.colorAlpha('y', 0.25)}, ${tokens.colorAlpha('y', 0.12)})`,
                boxShadow: `0 2px 8px ${tokens.colorAlpha('y', 0.2)}`,
              }}
            >
              <Brain size={14} style={{ color: tokens.color('y') }} />
            </div>

            <div className="min-w-0">
              <span
                className="font-extrabold block mb-1"
                style={{
                  color: tokens.color('y'),
                  fontSize: isCompact ? '10px' : '11px',
                  letterSpacing: '0.04em',
                }}
              >
                Apa yang sudah kamu pelajari?
              </span>
              <p
                className="leading-relaxed"
                style={{
                  fontSize: isCompact ? '11px' : '13px',
                  color: tokens.color('text'),
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                {selfCheck}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
