'use client';

import React from 'react';
import type { FtabBlock } from '../../schema/types';
import type { TokenResolver, SchemaRenderMode } from '../types';
// NOTE: Use React.lazy() to break the circular dependency:
//   SceneRegistry → FtabRenderer → SchemaRenderer → BlockSelectionOverlay → SceneRegistry
// Direct import of SchemaBlockRenderer creates the cycle.
// Lazy loading defers the reference until render time, breaking the cycle.
import type { SchemaBlockRenderer as SchemaBlockRendererType } from '../SchemaRenderer';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';
import type { CompressionDecision } from '../../layout/CompressionEngine';

const SchemaBlockRenderer = React.lazy(() =>
  import('../SchemaRenderer').then(m => ({ default: m.SchemaBlockRenderer }))
);

/** Inner tab button component so hooks are not called in loops */
function FtabButton({ tab, tabIndex, blockId, isActive, onActivate, tokens, showReadMarker, isRead, isCompact }: {
  tab: FtabBlock['tabs'][number];
  tabIndex: number;
  blockId: string;
  isActive: boolean;
  onActivate: () => void;
  tokens: TokenResolver;
  showReadMarker?: boolean;
  isRead: boolean;
  isCompact?: boolean;
}) {
  const labelEditor = useInlineEditor({
    blockId,
    fieldKey: `tabs.${tabIndex}.label`,
    value: tab.label ?? '',
    tag: 'span',
  });

  return (
    <MicroInteraction tokens={tokens} accent="y" effect="squish">
    <button onClick={onActivate}
      className={`relative px-3.5 py-1.5 rounded-full font-extrabold transition-all ${
        isActive ? 'scale-105' : 'opacity-60 hover:opacity-90'
      }`}
      style={{
        fontSize: '12px',
        background: isActive ? tokens.color('y') : tokens.subtleBg(0.06),
        color: isActive ? tokens.color('bg') : tokens.muted(0.6),
        border: '1px solid ' + (isActive ? tokens.color('y') : tokens.subtleBorder(0.1)),
        boxShadow: isActive ? '0 0 16px ' + tokens.colorAlpha('y', 0.35) : 'none',
        overflow: 'hidden',
      }}>
      {tab.icon} <span className={isCompact ? 'canvas-truncate-1' : ''}><InlineTextEditor {...labelEditor} style={{ color: 'inherit', fontSize: 'inherit' }} /></span>
      {showReadMarker && isRead && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black"
          style={{ background: tokens.color('g'), color: tokens.color('bg'), boxShadow: '0 0 8px ' + tokens.colorAlpha('g', 0.5) }}>✓</span>
      )}
    </button>
    </MicroInteraction>
  );
}

export function FtabRenderer({ block, mode, tokens, interactive, isCompact, isEditing, compression }: {
  block: FtabBlock; mode: SchemaRenderMode; tokens: TokenResolver; interactive?: boolean; isCompact?: boolean; isEditing?: boolean; compression?: CompressionDecision;
}) {
  const [activeTab, setActiveTab] = React.useState(0);
  const [readTabs, setReadTabs] = React.useState<Set<number>>(new Set());

  const handleTab = (i: number) => {
    setActiveTab(i);
    setReadTabs(prev => new Set([...prev, i]));
  };

  const tabs = block.tabs || [];
  const tab = tabs[activeTab];
  const isCompressed = compression?.isCompressed ?? false;

  return (
    <PremiumBlockWrapper tokens={tokens} accent="c" staggerIndex={0}>
      <ReadingProgressIndicator progress={1} tokens={tokens} accent="c" height={2} position="top" />
    <div>
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t, i) => (
          <FtabButton
            key={`ftab-btn-${t.label?.slice(0,8)}-${i}`}
            tab={t}
            tabIndex={i}
            blockId={block.id!}
            isActive={activeTab === i}
            onActivate={() => handleTab(i)}
            tokens={tokens}
            showReadMarker={block.showReadMarker}
            isRead={readTabs.has(i)}
            isCompact={isCompact}
          />
        ))}
      </div>

      {/* Tab content */}
      {tab && (
        <div className="mt-3 rounded-xl premium-card-glow p-3"
          style={{
            background: tokens.subtleBg(0.04),
            border: '1px solid ' + tokens.colorAlpha('y', 0.15),
            animation: 'fadeIn 0.3s ease',
          }}>
          {(tab.content || []).map((b, i) => (
            <React.Suspense key={`ftab-content-${b.id || b.type}-${i}`} fallback={null}>
              <SchemaBlockRenderer block={b} mode={mode} tokens={tokens} interactive={interactive} />
            </React.Suspense>
          ))}
        </div>
      )}

      {/* Progress — hidden when compressed */}
      {!isCompressed && block.showProgress && tabs.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden"
            style={{ background: tokens.subtleBg(0.08) }}>
            <div className="h-full rounded-full transition-all"
              style={{
                width: (readTabs.size / tabs.length) * 100 + '%',
                background: tokens.color('g'),
                boxShadow: '0 0 8px ' + tokens.colorAlpha('g', 0.4),
              }} />
          </div>
          <PremiumBadge tokens={tokens} accent="g" variant="glass">{readTabs.size}/{tabs.length}</PremiumBadge>
        </div>
      )}
    </div>
    </PremiumBlockWrapper>
  );
}
