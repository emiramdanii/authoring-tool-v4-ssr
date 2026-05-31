'use client';

import React, { useEffect, useState } from 'react';
import type { TabIconsBlock } from '../../schema/types';
import type { TokenResolver, SchemaRenderMode } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { PremiumBlockWrapper, ReadingProgressIndicator, MicroInteraction } from './PremiumBlockEffects';
import type { CompressionDecision } from '../../layout/CompressionEngine';
import { useBlockCompression } from '../../layout/useBlockCompression';
import { playSound } from '@/lib/sounds';

// ═══════════════════════════════════════════════════════════════════
// TAB ICONS RENDERER — Interactive icon-based tabs with flat content
// ═══════════════════════════════════════════════════════════════════
// Renders TabIconsBlock — each tab has icon, judul, warna, isi, poin, refleksi.
// Different from FtabRenderer which renders FtabBlock with nested SchemaBlock[] content.
//
// Layout variants:
//   horizontal — pill buttons in a row
//   vertical — stacked sidebar tabs
//   pills — rounded pill buttons with colored indicators
//
// Animation: fade, slide-up, zoom, bounce
// ═══════════════════════════════════════════════════════════════════

/** Inner tab button component */
function TabIconPill({ tab, tabIndex, blockId, isActive, onActivate, tokens, isCompact, edu, layout }: {
  tab: TabIconsBlock['tabs'][number];
  tabIndex: number;
  blockId: string;
  isActive: boolean;
  onActivate: () => void;
  tokens: TokenResolver;
  isCompact?: boolean;
  edu: ReturnType<typeof tokens.edu>;
  layout: 'horizontal' | 'vertical' | 'pills';
}) {
  const labelEditor = useInlineEditor({
    blockId,
    fieldKey: `tabs.${tabIndex}.judul`,
    value: tab.judul ?? '',
    tag: 'span',
  });

  const tabColor = tokens.color(tab.warna || 'c');
  const tabBg = isActive ? tokens.colorAlpha(tab.warna || 'c', 0.15) : tokens.colorAlpha(tab.warna || 'c', 0.05);
  const tabBorder = isActive ? tokens.colorAlpha(tab.warna || 'c', 0.35) : tokens.colorAlpha(tab.warna || 'c', 0.12);

  return (
    <MicroInteraction tokens={tokens} accent={tab.warna || 'c'} effect="squish">
      <button
        onClick={onActivate}
        className={`relative flex items-center gap-2 font-bold transition-all duration-200 ${
          layout === 'vertical' ? 'w-full text-left px-3 py-2 rounded-xl' :
          layout === 'pills' ? 'px-4 py-2 rounded-full' :
          'px-3.5 py-1.5 rounded-xl'
        } ${isActive ? 'scale-[1.02]' : 'opacity-60 hover:opacity-90'}`}
        style={{
          ...edu.caption(),
          background: tabBg,
          color: isActive ? tabColor : tokens.muted(0.7),
          border: `1px solid ${tabBorder}`,
          boxShadow: isActive ? `0 0 12px ${tokens.colorAlpha(tab.warna || 'c', 0.2)}` : 'none',
        }}
        aria-selected={isActive}
        role="tab"
      >
        {/* Active indicator bar */}
        {isActive && layout !== 'pills' && (
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full"
            style={{ background: tabColor }}
          />
        )}
        <span style={{ fontSize: isCompact ? '14px' : '18px' }}>{tab.icon}</span>
        <InlineTextEditor
          {...labelEditor}
          className={isCompact ? 'canvas-truncate-1' : ''}
          style={{ color: 'inherit', fontSize: 'inherit', fontWeight: isActive ? 700 : 500 }}
        />
      </button>
    </MicroInteraction>
  );
}

export const TabIconsRenderer = React.memo(function TabIconsRenderer({
  block, mode, tokens, interactive, isCompact, isEditing, compression
}: {
  block: TabIconsBlock;
  mode: SchemaRenderMode;
  tokens: TokenResolver;
  interactive?: boolean;
  isCompact?: boolean;
  isEditing?: boolean;
  compression?: CompressionDecision;
}) {
  const edu = tokens.edu('tab-icons', isCompact);
  const layout = block.layoutVariant || 'horizontal';
  const animation = block.animation || 'fade';

  const [activeTab, setActiveTab] = useState(0);
  const [readTabs, setReadTabs] = useState<Set<number>>(new Set());

  // Clamp activeTab when tabs change
  useEffect(() => {
    const tabCount = block.tabs?.length ?? 0;
    if (tabCount > 0 && activeTab >= tabCount) {
      setActiveTab(0);
      setReadTabs(new Set());
    }
  }, [block.tabs?.length, activeTab]);

  const handleTab = (i: number) => {
    setActiveTab(i);
    setReadTabs(prev => new Set([...prev, i]));
    if (interactive) playSound('tap');
  };

  const tabs = block.tabs || [];
  const safeActiveTab = Math.min(activeTab, Math.max(0, tabs.length - 1));
  const tab = tabs[safeActiveTab];

  // Compression-aware visibility
  const { isCompressed } = useBlockCompression({
    compression,
    totalItems: tabs.length,
  });

  const accentColor = block.accentColor || 'c';

  // Animation styles for tab content
  const animStyle: React.CSSProperties = (() => {
    const base: React.CSSProperties = {};
    switch (animation) {
      case 'slide-up':
        return { ...base, animation: 'fadeInUp 0.35s ease-out' };
      case 'zoom':
        return { ...base, animation: 'scaleIn 0.3s ease-out' };
      case 'bounce':
        return { ...base, animation: 'bounceIn 0.4s ease-out' };
      case 'fade':
      default:
        return { ...base, animation: 'fadeIn 0.3s ease' };
    }
  })();

  return (
    <PremiumBlockWrapper tokens={tokens} accent={accentColor} staggerIndex={0}>
      <ReadingProgressIndicator
        progress={tabs.length > 0 ? readTabs.size / tabs.length : 0}
        tokens={tokens}
        accent={accentColor}
        height={2}
        position="top"
      />

      <div>
        {/* Block title */}
        {block.title && (
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold"
              style={{
                ...edu.caption(),
                background: tokens.accentBg(accentColor, 0.08),
                color: tokens.color(accentColor),
                border: `1px solid ${tokens.colorAlpha(accentColor, 0.2)}`,
              }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>tab</span>
              {block.title}
            </span>
          </div>
        )}

        {/* Intro text */}
        {block.intro && (
          <p className="mb-3" style={{ ...edu.body(), color: edu.mutedText(0.8) }}>
            {block.intro}
          </p>
        )}

        {/* Tab bar */}
        <div className={`flex gap-1.5 ${
          layout === 'vertical' ? 'flex-col' : 'flex-wrap'
        }`}>
          {tabs.map((t: TabIconsBlock['tabs'][number], i: number) => (
            <TabIconPill
              key={`ti-btn-${t.judul?.slice(0,8)}-${i}`}
              tab={t}
              tabIndex={i}
              blockId={block.id!}
              isActive={safeActiveTab === i}
              onActivate={() => handleTab(i)}
              tokens={tokens}
              isCompact={isCompact}
              edu={edu}
              layout={layout}
            />
          ))}
        </div>

        {/* Tab content */}
        {tab && (
          <div
            className="mt-3 rounded-xl p-3.5"
            style={{
              background: tokens.colorAlpha(tab.warna || accentColor, 0.06),
              border: `1px solid ${tokens.colorAlpha(tab.warna || accentColor, 0.15)}`,
              ...animStyle,
            }}
          >
            {/* Tab isi (main content) */}
            {tab.isi && (
              <div className="leading-relaxed" style={{ ...edu.body(), color: edu.textColor() }}>
                {tab.isi}
              </div>
            )}

            {/* Tab poin (bullet points) */}
            {tab.poin && tab.poin.length > 0 && (
              <ul className="mt-2.5 space-y-1.5">
                {tab.poin.map((p: string, j: number) => (
                  <li key={`ti-poin-${j}`} className="flex items-start gap-2">
                    <span
                      className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5"
                      style={{ background: tokens.color(tab.warna || accentColor) }}
                    />
                    <span style={{ ...edu.body(), color: edu.mutedText(0.9) }}>{p}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Tab refleksi */}
            {tab.refleksi && (
              <div
                className="mt-3 p-2.5 rounded-lg"
                style={{
                  background: tokens.colorAlpha(tab.warna || accentColor, 0.08),
                  border: `1px dashed ${tokens.colorAlpha(tab.warna || accentColor, 0.25)}`,
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: tokens.color(tab.warna || accentColor) }}>
                    psychology
                  </span>
                  <span className="font-bold" style={{ ...edu.caption(), color: tokens.color(tab.warna || accentColor) }}>
                    Refleksi
                  </span>
                </div>
                <p style={{ ...edu.body(), color: edu.mutedText(0.85) }}>{tab.refleksi}</p>
              </div>
            )}
          </div>
        )}

        {/* Progress indicator */}
        {!isCompressed && tabs.length > 1 && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden"
              style={{ background: tokens.subtleBg(0.08) }}>
              <div className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(readTabs.size / tabs.length) * 100}%`,
                  background: tokens.color(accentColor),
                }}
              />
            </div>
            <span style={{ ...edu.caption(), color: edu.mutedText(0.6) }}>
              {readTabs.size}/{tabs.length}
            </span>
          </div>
        )}
      </div>
    </PremiumBlockWrapper>
  );
});
