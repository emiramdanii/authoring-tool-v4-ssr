'use client';

import React from 'react';
import type { FtabBlock } from '../../schema/types';
import type { TokenResolver, SchemaRenderMode } from '../types';
import { SchemaBlockRenderer } from '../SchemaRenderer';

export function FtabRenderer({ block, mode, tokens, interactive, isCompact }: {
  block: FtabBlock; mode: SchemaRenderMode; tokens: TokenResolver; interactive?: boolean; isCompact?: boolean;
}) {
  const [activeTab, setActiveTab] = React.useState(0);
  const [readTabs, setReadTabs] = React.useState<Set<number>>(new Set());

  const handleTab = (i: number) => {
    setActiveTab(i);
    setReadTabs(prev => new Set([...prev, i]));
  };

  const tabs = block.tabs || [];
  const tab = tabs[activeTab];

  return (
    <div>
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t, i) => (
          <button key={i} onClick={() => handleTab(i)}
            className={`relative px-3.5 py-1.5 rounded-full text-[10px] font-extrabold transition-all ${
              activeTab === i ? 'scale-105' : 'opacity-60 hover:opacity-90'
            }`}
            style={{
              background: activeTab === i ? tokens.color('y') : 'rgba(255,255,255,.06)',
              color: activeTab === i ? tokens.color('bg') : tokens.colorAlpha('muted', 0.6),
              border: '1px solid ' + (activeTab === i ? tokens.color('y') : 'rgba(255,255,255,.1)'),
              boxShadow: activeTab === i ? '0 0 16px ' + tokens.colorAlpha('y', 0.35) : 'none',
            }}>
            {t.icon} {t.label}
            {block.showReadMarker && readTabs.has(i) && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black"
                style={{ background: tokens.color('g'), color: tokens.color('bg'), boxShadow: '0 0 8px ' + tokens.colorAlpha('g', 0.5) }}>✓</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab && (
        <div className="mt-3 rounded-xl p-3"
          style={{
            background: 'rgba(255,255,255,.04)',
            border: '1px solid ' + tokens.colorAlpha('y', 0.15),
            animation: 'fadeIn 0.3s ease',
          }}>
          {(tab.content || []).map((b, i) => (
            <SchemaBlockRenderer key={i} block={b} mode={mode} tokens={tokens} interactive={interactive} />
          ))}
        </div>
      )}

      {/* Progress */}
      {block.showProgress && tabs.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,.08)' }}>
            <div className="h-full rounded-full transition-all"
              style={{
                width: (readTabs.size / tabs.length) * 100 + '%',
                background: tokens.color('g'),
                boxShadow: '0 0 8px ' + tokens.colorAlpha('g', 0.4),
              }} />
          </div>
          <span className="text-[10px] font-bold" style={{ color: tokens.color('g') }}>
            {readTabs.size}/{tabs.length}
          </span>
        </div>
      )}
    </div>
  );
}
