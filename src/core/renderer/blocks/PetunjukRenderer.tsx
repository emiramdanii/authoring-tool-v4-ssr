'use client';

import React from 'react';
import { Lightbulb, Info, Compass, Target } from 'lucide-react';
import type { PetunjukBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';

export function PetunjukRenderer({ block, tokens, isCompact, isEditing }: {
  block: PetunjukBlock; tokens: TokenResolver; isCompact: boolean; isEditing?: boolean;
}) {
  const accentKey = block.tipsColor || 'c';
  const hasNav = block.navigation && block.navigation.length > 0;
  const hasObjectives = block.learningObjectives && block.learningObjectives.length > 0;

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
    <div className={isCompact ? 'p-1' : 'p-2'}
      style={{
        background: `linear-gradient(135deg, ${tokens.colorAlpha('c', 0.06)}, ${tokens.colorAlpha('y', 0.04)})`,
        borderRadius: tokens.radius('xl') + 'px',
        border: `2px solid ${tokens.colorAlpha('c', 0.2)}`,
        borderLeft: `5px solid ${tokens.color('c')}`,
        boxShadow: tokens.raw.shadow.card,
        position: 'relative',
        overflow: 'hidden',
      }}>

      {/* Info badge — top left */}
      <div className="absolute top-0 left-0"
        style={{
          background: tokens.color('c'),
          borderRadius: '0 0 8px 0',
          padding: '4px 10px',
          zIndex: 2,
        }}>
        <span style={{ fontSize: '12px', fontWeight: 900, color: tokens.color('bg'), display: 'flex', alignItems: 'center', gap: 4 }}>
          <Info size={12} /> Petunjuk
        </span>
      </div>

      <div style={{ paddingTop: isCompact ? '20px' : '28px' }}>
        {/* Title */}
        <h2 className="font-black leading-tight"
          style={{ fontSize: isCompact ? '16px' : '1.6rem', fontFamily: tokens.fontFamily('display'), color: tokens.color('text') }}>
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

        {/* Grid items */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {(block.items || []).map((item, i) => {
            const colorCycle = ['y', 'c', 'g', 'p'];
            const itemColor = colorCycle[i % colorCycle.length];
            return (
              <div key={`petunjuk-item-${block.id || i}-${i}`} className="rounded-xl text-center transition-all hover:-translate-y-0.5 min-w-0"
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
                <div className="w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-2"
                  style={{
                    background: tokens.colorAlpha(itemColor, 0.2),
                    boxShadow: '0 4px 12px ' + tokens.colorAlpha(itemColor, 0.25),
                  }}>
                  <span style={{ fontSize: isCompact ? '15px' : '20px' }}>{item.icon}</span>
                </div>
                <div className="font-extrabold mb-1.5" style={{ color: tokens.color(itemColor), fontSize: isCompact ? '12px' : '14px', wordBreak: 'break-word' }}>{item.title}</div>
                <div className={`leading-relaxed ${isCompact ? 'canvas-truncate-2' : ''}`} style={{ color: tokens.muted(0.8), fontSize: isCompact ? '11px' : '13px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{item.body}</div>
              </div>
            );
          })}
        </div>

        {/* Navigation section */}
        {hasNav && (
          <div className="mt-4 p-3 rounded-xl"
            style={{
              background: tokens.colorAlpha('p', 0.06),
              border: '1px solid ' + tokens.colorAlpha('p', 0.15),
            }}>
            <div className="flex items-center gap-2 mb-2">
              <Compass size={14} style={{ color: tokens.color('p') }} />
              <span className="font-extrabold" style={{ fontSize: isCompact ? '11px' : '13px', color: tokens.color('p') }}>
                Navigasi
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(block.navigation || []).map((nav, i) => (
                <div key={`nav-${block.id || 'def'}-${i}`}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                  style={{
                    background: tokens.colorAlpha('p', 0.08),
                    border: '1px solid ' + tokens.colorAlpha('p', 0.15),
                    fontSize: isCompact ? '10px' : '12px',
                  }}>
                  <span>{nav.icon}</span>
                  <div>
                    <div className="font-bold" style={{ color: tokens.color('p') }}>{nav.label}</div>
                    {!isCompact && <div style={{ color: tokens.muted(0.6), fontSize: '10px' }}>{nav.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Learning Objectives section */}
        {hasObjectives && (
          <div className="mt-4 p-3 rounded-xl"
            style={{
              background: tokens.colorAlpha('g', 0.06),
              border: '1px solid ' + tokens.colorAlpha('g', 0.15),
            }}>
            <div className="flex items-center gap-2 mb-2">
              <Target size={14} style={{ color: tokens.color('g') }} />
              <span className="font-extrabold" style={{ fontSize: isCompact ? '11px' : '13px', color: tokens.color('g') }}>
                Tujuan Pembelajaran
              </span>
            </div>
            <div className="space-y-1.5">
              {(block.learningObjectives || []).map((obj, i) => (
                <div key={`obj-${block.id || 'def'}-${i}`}
                  className="flex items-start gap-2"
                  style={{ fontSize: isCompact ? '11px' : '13px' }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: tokens.colorAlpha('g', 0.15) }}>
                    <span className="font-extrabold" style={{ color: tokens.color('g'), fontSize: '10px' }}>{obj.num || i + 1}</span>
                  </div>
                  <div className={`min-w-0 ${isCompact ? 'canvas-truncate-1' : ''}`} style={{ color: tokens.color('text'), lineHeight: 1.5 }}>{obj.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips section */}
        {block.tips && (
          <div className="mt-4 p-3.5 rounded-xl leading-relaxed"
            style={{
              background: tokens.colorAlpha(accentKey, 0.12),
              border: '1px solid ' + tokens.colorAlpha(accentKey, 0.3),
              boxShadow: tokens.raw.shadow.card,
              color: tokens.color('text'),
              fontSize: isCompact ? '11px' : '13px',
            }}>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: tokens.colorAlpha(accentKey, 0.25), boxShadow: '0 2px 8px ' + tokens.colorAlpha(accentKey, 0.2) }}>
                <Lightbulb size={12} className="inline" />
              </div>
              <div>
                <strong style={{ color: tokens.color(accentKey) }}>Tips:</strong> <InlineTextEditor
                  {...tipsEditor}
                  className="leading-relaxed"
                  style={{ fontSize: 'inherit' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
