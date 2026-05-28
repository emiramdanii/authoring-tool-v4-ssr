'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { isEnabled } from '@/config/feature-flags';
import { createPortal } from 'react-dom';
import { useCanvaStore } from '@/store/canva-store';
import { ensurePageSchema } from '@/core/schema/ensure-schema';
import type { SchemaBlock } from '@/core/schema/types';
import AIAssistantPanel from '../ai-assistant/AIAssistantPanel';
import AIGenerateLessonPanel from '../ai-assistant/AIGenerateLessonPanel';
import AIRefinePanel from '../ai-assistant/AIRefinePanel';
import Section from './Section';

// ═══════════════════════════════════════════════════════════════════
// AI ASSISTANT SECTION — Self-contained wrapper with discoverability
// ═══════════════════════════════════════════════════════════════════
// Features:
//   - Tabbed view: "Buat Materi" (generate lesson) / "Konten AI" (per-block)
//   - Listens for "open-ai-assistant" custom event (toolbar, shortcut, cmd)
//   - Auto-expands when a block with empty content is selected
//   - Shows a one-time floating hint for first-time block additions
// ═══════════════════════════════════════════════════════════════════

const HINT_DISMISSED_KEY = 'mpi_ai_assistant_hint_dismissed';

type AITab = 'generate' | 'content' | 'refine';

/**
 * Check if a schema block appears to have no meaningful content.
 */
function isBlockEmpty(block: SchemaBlock): boolean {
  const b = block as unknown as Record<string, unknown>;

  if (typeof b.title === 'string' && b.title.trim().length > 0) return false;

  const arrayFields = ['questions', 'pairs', 'items', 'cards', 'words', 'steps', 'pool', 'concepts', 'chapters', 'content'];
  for (const field of arrayFields) {
    if (Array.isArray(b[field]) && b[field].length > 0) return false;
  }

  const stringFields = ['hookQuestion', 'content', 'subtitle', 'text'];
  for (const field of stringFields) {
    if (typeof b[field] === 'string' && (b[field] as string).trim().length > 0) return false;
  }

  return true;
}

export default function AIAssistantSection() {
  const [manuallyCollapsed, setManuallyCollapsed] = useState(true);
  const [forceOpen, setForceOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AITab>('generate');

  const selectedBlockId = useCanvaStore((s) => s.selectedBlockId);
  const currentPageIndex = useCanvaStore((s) => s.currentPageIndex);
  const pages = useCanvaStore((s) => s.pages);

  // Check if selected block has empty content
  const selectedBlockEmpty = (() => {
    if (!selectedBlockId) return false;
    const currentPage = pages[currentPageIndex];
    if (!currentPage) return false;
    const schema = ensurePageSchema(currentPage);
    if (!schema) return false;
    const block = schema.blocks.find((b) => b.id === selectedBlockId);
    if (!block) return false;
    return isBlockEmpty(block);
  })();

  // Listen for "open-ai-assistant" custom event
  useEffect(() => {
    const handler = () => setForceOpen(true);
    window.addEventListener('open-ai-assistant', handler);
    return () => window.removeEventListener('open-ai-assistant', handler);
  }, []);

  const handleToggle = useCallback(() => {
    setForceOpen(false);
    setManuallyCollapsed((c) => !c);
  }, []);

  const collapsed = forceOpen
    ? false
    : (selectedBlockEmpty && selectedBlockId)
      ? false
      : manuallyCollapsed;

  // Switch to content tab when a block with empty content is selected
  useEffect(() => {
    if (selectedBlockEmpty && selectedBlockId) {
      setActiveTab('content');
    }
  }, [selectedBlockEmpty, selectedBlockId]);

  // Floating hint logic
  const [showHint, setShowHint] = useState(false);
  const hintDismissedRef = useRef(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(HINT_DISMISSED_KEY) === 'true') {
        hintDismissedRef.current = true;
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    if (hintDismissedRef.current) return;
    if (!selectedBlockId) return;
    const timer = setTimeout(() => {
      if (!hintDismissedRef.current) {
        setShowHint(true);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [selectedBlockId]);

  const dismissHint = useCallback(() => {
    setShowHint(false);
    hintDismissedRef.current = true;
    try {
      localStorage.setItem(HINT_DISMISSED_KEY, 'true');
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    if (!showHint) return;
    const timer = setTimeout(dismissHint, 6000);
    return () => clearTimeout(timer);
  }, [showHint, dismissHint]);

  // Feature flag guard — after all hooks, before JSX
  if (!isEnabled('aiAssistant')) return null;

  return (
    <>
      <Section
        icon={<span className="text-xs">🤖</span>}
        title="AI Assistant"
        collapsed={collapsed}
        onToggle={handleToggle}
      >
        {/* Tab bar */}
        <div className="flex gap-0.5 mb-3 bg-silse-surface-container-low/30 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[9px] font-bold transition-[background-color,border-color,color] ${
              activeTab === 'generate'
                ? 'bg-silse-tertiary-container/15 text-silse-tertiary border border-silse-tertiary-container/20'
                : 'text-silse-on-surface-variant hover:text-silse-on-surface-variant border border-transparent'
            }`}
          >
            <span className="text-[10px]">✨</span>
            Buat Materi
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[9px] font-bold transition-[background-color,border-color,color] ${
              activeTab === 'content'
                ? 'bg-silse-tertiary-container/15 text-silse-tertiary border border-silse-tertiary-container/20'
                : 'text-silse-on-surface-variant hover:text-silse-on-surface-variant border border-transparent'
            }`}
          >
            <span className="text-[10px]">🤖</span>
            Konten AI
          </button>
          <button
            onClick={() => setActiveTab('refine')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[8px] font-bold transition-[background-color,border-color,color] ${
              activeTab === 'refine'
                ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                : 'text-silse-on-surface-variant hover:text-silse-on-surface-variant border border-transparent'
            }`}
          >
            <span className="text-[10px]">🪄</span>
            Refine
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'generate' ? (
          <AIGenerateLessonPanel />
        ) : activeTab === 'content' ? (
          <AIAssistantPanel />
        ) : (
          <AIRefinePanel />
        )}
      </Section>

      {/* Floating hint */}
      {showHint && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed z-[150] animate-in fade-in slide-in-from-right-4 duration-300"
          style={{
            right: '300px',
            top: '50%',
            transform: 'translateY(-50%)',
          }}
          onClick={dismissHint}
        >
          <div className="relative bg-silse-tertiary-container/90 text-silse-on-tertiary px-4 py-3 rounded-xl shadow-lg max-w-[260px] cursor-pointer border border-silse-tertiary/30">
            <div className="text-[11px] font-bold leading-tight">
              💡 Gunakan AI Assistant untuk mengisi konten secara otomatis
            </div>
            <div className="text-[9px] text-silse-on-tertiary/70 mt-1">
              Klik tombol AI di toolbar, atau tekan Ctrl+I
            </div>
            <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-silse-tertiary-container/90" />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
