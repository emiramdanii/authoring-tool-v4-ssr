'use client';

import React from 'react';
import { Shield, Lightbulb, ArrowRight, Sparkles } from 'lucide-react';
import type { MotivasiBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';

// ═══════════════════════════════════════════════════════════════════
// MOTIVASI RENDERER — BSNP Apersepsi / Motivation Hook
// ═══════════════════════════════════════════════════════════════════
// Engages students with a provocative question and connects to
// prior knowledge. BSNP requires apersepsi as an opening element
// to activate students' background knowledge before new material.
//
// Features:
//   - Central hook question with animated visual
//   - Prior knowledge connection cards
//   - Smooth transition to main content
//   - BSNP badge when required
// ═══════════════════════════════════════════════════════════════════

export function MotivasiRenderer({ block, tokens, isCompact, isEditing }: {
  block: MotivasiBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean;
}) {
  const titleEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'title',
    value: block.title ?? '',
    tag: 'span',
  });

  const hookEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'hookQuestion',
    value: block.hookQuestion ?? '',
    tag: 'div',
    multiline: true,
  });

  const connections = block.connections || [];
  const visual = block.visual;
  const gradientFrom = visual?.bgGradient?.[0] || 'y';
  const gradientTo = visual?.bgGradient?.[1] || 'c';

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: tokens.color('card'),
        boxShadow: tokens.raw.shadow.elevated,
        border: `1px solid ${tokens.colorAlpha(gradientFrom, 0.15)}`,
        animation: 'fadeIn 0.4s ease',
      }}
    >
      {/* ═══ HEADER ══════════════════════════════════════════════ */}
      <div
        style={{
          borderLeft: `4px solid ${tokens.color(gradientFrom)}`,
          background: `linear-gradient(135deg, ${tokens.colorAlpha(gradientFrom, 0.1)}, ${tokens.colorAlpha(gradientTo, 0.03)})`,
          padding: isCompact ? '10px 12px' : '14px 18px',
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: tokens.colorAlpha(gradientFrom, 0.15),
                border: `1px solid ${tokens.colorAlpha(gradientFrom, 0.3)}`,
              }}
            >
              <Lightbulb size={16} style={{ color: tokens.color(gradientFrom) }} />
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

        {/* Decorative gradient line */}
        <div
          className="mt-3 h-1 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${tokens.color(gradientFrom)}, ${tokens.colorAlpha(gradientTo, 0.4)}, transparent)`,
          }}
        />
      </div>

      {/* ═══ HOOK QUESTION — central visual element ══════════════ */}
      <div
        style={{
          margin: isCompact ? '10px 12px' : '14px 18px',
          padding: isCompact ? '14px 16px' : '20px 24px',
          background: `linear-gradient(135deg, ${tokens.colorAlpha(gradientFrom, 0.12)}, ${tokens.colorAlpha(gradientTo, 0.08)})`,
          border: `2px solid ${tokens.colorAlpha(gradientFrom, 0.25)}`,
          borderRadius: tokens.radius('xl'),
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative sparkle in background */}
        <div
          className="absolute top-2 right-3"
          style={{ animation: 'float 3s ease-in-out infinite', opacity: 0.3 }}
        >
          <Sparkles size={isCompact ? 14 : 20} style={{ color: tokens.color(gradientFrom) }} />
        </div>

        <div className="flex items-start gap-4 relative">
          {/* Visual emoji */}
          {visual?.emoji && (
            <div
              className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${tokens.colorAlpha(gradientFrom, 0.2)}, ${tokens.colorAlpha(gradientTo, 0.15)})`,
                boxShadow: `0 4px 16px ${tokens.colorAlpha(gradientFrom, 0.3)}`,
                fontSize: isCompact ? '22px' : '28px',
                animation: 'float 3s ease-in-out infinite',
              }}
            >
              {visual.emoji}
            </div>
          )}

          {/* Hook question text */}
          <div className="flex-1 min-w-0">
            <div
              className="font-extrabold uppercase tracking-wider mb-2"
              style={{
                color: tokens.color(gradientFrom),
                fontSize: isCompact ? '9px' : '10px',
                letterSpacing: '0.08em',
              }}
            >
              Pertanyaan Pemicu
            </div>
            <InlineTextEditor
              {...hookEditor}
              className="font-bold leading-relaxed"
              style={{
                fontSize: isCompact ? '13px' : '16px',
                color: tokens.color('text'),
                fontFamily: tokens.fontFamily('display'),
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
              placeholder="Ketik pertanyaan pemicu..."
            />
          </div>
        </div>
      </div>

      {/* ═══ CONNECTIONS — prior knowledge cards ══════════════════ */}
      {connections.length > 0 && (
        <div
          style={{ padding: isCompact ? '0 12px 10px' : '0 18px 14px' }}
        >
          <div
            className="font-extrabold uppercase tracking-wider mb-2.5 flex items-center gap-1.5"
            style={{
              color: tokens.muted(0.6),
              fontSize: isCompact ? '9px' : '10px',
              letterSpacing: '0.08em',
            }}
          >
            <Lightbulb size={10} />
            Koneksi Pengetahuan
          </div>

          <div className="flex flex-col gap-2">
            {connections.map((conn, i) => (
              <div
                key={`mot-conn-${block.id || 'mot'}-${i}`}
                className="flex items-start gap-2.5 rounded-lg p-2.5"
                style={{
                  background: tokens.colorAlpha(conn.color, 0.08),
                  border: `1px solid ${tokens.colorAlpha(conn.color, 0.2)}`,
                  borderLeft: `3px solid ${tokens.color(conn.color)}`,
                  borderRadius: tokens.radius('lg') + 'px',
                }}
              >
                <span className="flex-shrink-0" style={{ fontSize: isCompact ? '13px' : '15px' }}>
                  {conn.icon}
                </span>
                <div className="min-w-0">
                  <div
                    className="font-extrabold"
                    style={{
                      color: tokens.color(conn.color),
                      fontSize: isCompact ? '10px' : '12px',
                      wordBreak: 'break-word',
                    }}
                  >
                    {conn.label}
                  </div>
                  <div
                    className="leading-relaxed mt-0.5"
                    style={{
                      fontSize: isCompact ? '10px' : '12px',
                      color: tokens.muted(0.8),
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                    }}
                  >
                    {conn.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ TRANSITION STATEMENT ═════════════════════════════════ */}
      {block.transition && (
        <div
          style={{
            margin: isCompact ? '0 12px 12px' : '0 18px 16px',
            padding: isCompact ? '8px 14px' : '10px 18px',
            background: `linear-gradient(90deg, ${tokens.colorAlpha(gradientTo, 0.12)}, ${tokens.colorAlpha(gradientTo, 0.04)})`,
            borderRadius: tokens.radius('xl') + 'px',
            borderLeft: `3px solid ${tokens.color(gradientTo)}`,
          }}
        >
          <div className="flex items-center gap-2">
            <ArrowRight size={12} style={{ color: tokens.color(gradientTo) }} />
            <span
              className="italic leading-relaxed"
              style={{
                fontSize: isCompact ? '10px' : '12px',
                color: tokens.color('text'),
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              {block.transition}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
