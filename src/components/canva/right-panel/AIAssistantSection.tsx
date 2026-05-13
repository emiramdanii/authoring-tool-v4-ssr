'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useCanvaStore } from '@/store/canva-store';
import { ensurePageSchema } from '@/core/schema/ensure-schema';
import type { SchemaBlock } from '@/core/schema/types';
import AIAssistantPanel from '../ai-assistant/AIAssistantPanel';
import Section from './Section';

// ═══════════════════════════════════════════════════════════════════
// AI ASSISTANT SECTION — Self-contained wrapper with discoverability
// ═══════════════════════════════════════════════════════════════════
// Features:
//   - Listens for "open-ai-assistant" custom event (toolbar, shortcut, cmd)
//   - Auto-expands when a block with empty content is selected
//   - Shows a one-time floating hint for first-time block additions
// ═══════════════════════════════════════════════════════════════════

const HINT_DISMISSED_KEY = 'mpi_ai_assistant_hint_dismissed';

/**
 * Check if a schema block appears to have no meaningful content.
 * Different block types store content in different fields (title, questions,
 * pairs, items, etc). We check common content fields.
 */
function isBlockEmpty(block: SchemaBlock): boolean {
  const b = block as unknown as Record<string, unknown>;

  // If the block has a title, check if it's non-empty
  if (typeof b.title === 'string' && b.title.trim().length > 0) return false;

  // Check common array-based content fields
  const arrayFields = ['questions', 'pairs', 'items', 'cards', 'words', 'steps', 'pool', 'concepts', 'chapters', 'content'];
  for (const field of arrayFields) {
    if (Array.isArray(b[field]) && b[field].length > 0) return false;
  }

  // Check string content fields
  const stringFields = ['hookQuestion', 'content', 'subtitle', 'text'];
  for (const field of stringFields) {
    if (typeof b[field] === 'string' && (b[field] as string).trim().length > 0) return false;
  }

  // If we get here, the block appears empty
  return true;
}

export default function AIAssistantSection() {
  // Track whether the user has manually toggled the section
  // (prevents auto-expand from overriding user intent)
  const [manuallyCollapsed, setManuallyCollapsed] = useState(true);
  const [forceOpen, setForceOpen] = useState(false);

  // ── Store selectors ─────────────────────────────────────────────
  const selectedBlockId = useCanvaStore((s) => s.selectedBlockId);
  const currentPageIndex = useCanvaStore((s) => s.currentPageIndex);
  const pages = useCanvaStore((s) => s.pages);

  // ── Check if selected block has empty content ───────────────────
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

  // ── Listen for "open-ai-assistant" custom event ─────────────────
  useEffect(() => {
    const handler = () => setForceOpen(true);
    window.addEventListener('open-ai-assistant', handler);
    return () => window.removeEventListener('open-ai-assistant', handler);
  }, []);

  // Reset forceOpen when manually toggling
  const handleToggle = useCallback(() => {
    setForceOpen(false);
    setManuallyCollapsed((c) => !c);
  }, []);

  // ── Compute collapsed state ─────────────────────────────────────
  // Priority: forceOpen (from event/shortcut) > auto-expand for empty block > manual
  const collapsed = forceOpen
    ? false
    : (selectedBlockEmpty && selectedBlockId)
      ? false
      : manuallyCollapsed;

  // ── Floating hint logic ─────────────────────────────────────────
  const [showHint, setShowHint] = useState(false);
  const hintDismissedRef = useRef(false);

  // Check localStorage once on mount
  useEffect(() => {
    try {
      if (localStorage.getItem(HINT_DISMISSED_KEY) === 'true') {
        hintDismissedRef.current = true;
      }
    } catch {
      // Ignore
    }
  }, []);

  // Show hint when a block is selected (first time only)
  useEffect(() => {
    if (hintDismissedRef.current) return;
    if (!selectedBlockId) return;

    // Small delay so the user notices the block first
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

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (!showHint) return;
    const timer = setTimeout(dismissHint, 6000);
    return () => clearTimeout(timer);
  }, [showHint, dismissHint]);

  return (
    <>
      <Section
        icon={<span className="text-xs">🤖</span>}
        title="AI Assistant"
        collapsed={collapsed}
        onToggle={handleToggle}
      >
        <AIAssistantPanel />
      </Section>

      {/* Floating hint — first time only, positioned near right panel */}
      {showHint && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed z-[150] animate-in fade-in slide-in-from-right-4 duration-500"
          style={{
            right: '300px',
            top: '50%',
            transform: 'translateY(-50%)',
          }}
          onClick={dismissHint}
        >
          <div className="relative bg-amber-500/90 text-amber-950 px-4 py-3 rounded-xl shadow-lg shadow-amber-500/20 max-w-[260px] cursor-pointer border border-amber-400/30">
            <div className="text-[11px] font-bold leading-tight">
              💡 Gunakan AI Assistant untuk mengisi konten secara otomatis
            </div>
            <div className="text-[9px] text-amber-800/70 mt-1">
              Klik tombol AI di toolbar, atau tekan Ctrl+I
            </div>
            {/* Arrow pointing right towards the panel */}
            <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-amber-500/90" />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
