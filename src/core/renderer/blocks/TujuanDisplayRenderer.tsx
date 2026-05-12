'use client';

import React from 'react';
import { Shield, Target, Link2 } from 'lucide-react';
import type { TujuanDisplayBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';

// ═══════════════════════════════════════════════════════════════════
// TUJUAN DISPLAY RENDERER — BSNP-compliant student-facing TP
// ═══════════════════════════════════════════════════════════════════
// Displays learning objectives in a visually appealing format for
// students. Unlike the TP block (which is a planning document),
// this is designed for student consumption with:
//   - Clear header with BSNP badge
//   - Objectives as numbered cards with icons and colors
//   - Profil Pelajar Pancasila connection at bottom
// ═══════════════════════════════════════════════════════════════════

export function TujuanDisplayRenderer({ block, tokens, isCompact, isEditing }: {
  block: TujuanDisplayBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean;
}) {
  const titleEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'title',
    value: block.title ?? '',
    tag: 'span',
  });

  const objectives = block.objectives || [];

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: tokens.color('card'),
        boxShadow: tokens.raw.shadow.elevated,
        border: `1px solid ${tokens.colorAlpha('y', 0.15)}`,
        animation: 'fadeIn 0.4s ease',
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
            <div
              className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full font-extrabold uppercase"
              style={{
                background: `linear-gradient(135deg, ${tokens.color('y')}, ${tokens.colorAlpha('y', 0.8)})`,
                color: tokens.color('bg'),
                fontSize: isCompact ? '7px' : '8px',
                letterSpacing: '0.1em',
                boxShadow: `0 2px 8px ${tokens.colorAlpha('y', 0.35)}`,
              }}
            >
              <Shield size={isCompact ? 8 : 10} />
              <span>WAJIB</span>
            </div>
          )}
        </div>

        {/* Subtitle */}
        {block.subtitle && (
          <p
            className="mt-1.5 leading-relaxed"
            style={{
              fontSize: isCompact ? '10px' : '12px',
              color: tokens.muted(0.7),
              marginLeft: isCompact ? '44px' : '52px',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            {block.subtitle}
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
          <div
            key={`td-obj-${block.id || 'td'}-${i}`}
            className="flex items-start gap-3 rounded-xl p-3 transition-all hover:-translate-y-0.5"
            style={{
              background: tokens.colorAlpha(obj.color, 0.08),
              border: `1px solid ${tokens.colorAlpha(obj.color, 0.2)}`,
              borderLeft: `4px solid ${tokens.color(obj.color)}`,
              borderRadius: tokens.radius('xl') + 'px',
              boxShadow: tokens.raw.shadow.card,
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
        ))}
      </div>

      {/* ═══ PROFIL PELAJAR PANCASILA ════════════════════════════ */}
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
                {block.profil}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
