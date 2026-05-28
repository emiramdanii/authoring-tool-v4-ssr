'use client';

// ═══════════════════════════════════════════════════════════════════════
// AI REFINE SECTION — Quick AI refinement for selected blocks
// ═══════════════════════════════════════════════════════════════════════
// Shows when a block is selected. Provides quick-refine buttons:
// "Lebih Menarik", "Lebih Detail", "Lebih Sederhana", etc.
// One click → AI improves the block content → auto-apply to schema.
//
// This is the FAST path for AI refinement — no configuration needed.
// The full AIAssistantPanel is the SLOW path with more control.
// ═══════════════════════════════════════════════════════════════════════

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useSchemaContext } from '@/hooks/use-schema-navigator';
import { useAIRefine, getApplicableRefineModes, REFINE_MODES, type RefineMode } from './use-ai-refine';
import { ensurePageSchema } from '@/core/schema/ensure-schema';
import { Sparkles, Loader2, CheckCircle2, AlertCircle, RotateCcw, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function AIRefineSection() {
  const { loading, result, error, refine, clear } = useAIRefine();
  const pages = useCanvaStore(s => s.pages);
  const currentPageIndex = useCanvaStore(s => s.currentPageIndex);
  const selectedBlockId = useCanvaStore(s => s.selectedBlockId);
  const selectedBlockType = useCanvaStore(s => s.selectedBlockType);
  const updateSchemaBlock = useCanvaStore(s => s.updateSchemaBlock);
  const teacherMode = useCanvaStore(s => s.teacherMode);

  const { meta } = useSchemaContext();
  const mapel = meta.mapel || 'PPKn';
  const kelas = meta.kelas || 'Kelas VII';

  const [customInstruction, setCustomInstruction] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [lastAppliedMode, setLastAppliedMode] = useState<RefineMode | null>(null);

  const page = pages[currentPageIndex];

  // Get the selected block's content
  const selectedBlockContent = useMemo((): Record<string, unknown> | null => {
    if (!selectedBlockId || !page) return null;
    const schema = ensurePageSchema(page);
    if (!schema) return null;
    const block = schema.blocks.find(b => b.id === selectedBlockId);
    if (!block) return null;
    // Strip runtime-only fields before sending to AI
    const { compression, semantic, layout, variant, style, interactive, showIf, ...content } = block as Record<string, unknown>;
    return content;
  }, [selectedBlockId, page]);

  // Get applicable refine modes for this block type
  const applicableModes = useMemo(() => {
    if (!selectedBlockType) return [];
    return getApplicableRefineModes(selectedBlockType);
  }, [selectedBlockType]);

  // Handle refine — MUST be declared BEFORE the useEffect that references it
  const handleRefine = useCallback(async (mode: RefineMode) => {
    if (!selectedBlockType || !selectedBlockContent) {
      toast.warning('Pilih block terlebih dahulu');
      return;
    }

    if (mode === 'custom' && !customInstruction.trim()) {
      toast.warning('Tulis instruksi terlebih dahulu');
      return;
    }

    setLastAppliedMode(null);
    const res = await refine({
      blockType: selectedBlockType,
      blockContent: selectedBlockContent,
      mode,
      mapel,
      kelas,
      customInstruction: mode === 'custom' ? customInstruction.trim() : undefined,
    });

    if (res?.success && res.data && selectedBlockId) {
      // Auto-apply the refined content
      updateSchemaBlock(selectedBlockId, res.data);
      setLastAppliedMode(mode);
      toast.success('Konten berhasil disempurnakan!');
    }
  }, [selectedBlockType, selectedBlockContent, selectedBlockId, mapel, kelas, customInstruction, refine, updateSchemaBlock]);

  // Undo last refine (re-apply original)
  const handleUndo = useCallback(() => {
    if (!selectedBlockContent || !selectedBlockId) return;
    updateSchemaBlock(selectedBlockId, selectedBlockContent);
    setLastAppliedMode(null);
    clear();
    toast.info('Perubahan AI dibatalkan');
  }, [selectedBlockContent, selectedBlockId, updateSchemaBlock, clear]);

  // ── Listen for "ai-refine" custom event from BlockContextMenu ──
  // MUST be declared AFTER handleRefine to avoid TDZ (temporal dead zone)
  useEffect(() => {
    const handler = (e: Event) => {
      const { mode, blockId: eventBlockId } = (e as CustomEvent).detail as { mode: RefineMode; blockId?: string };
      if (eventBlockId) {
        useCanvaStore.getState().selectBlock(eventBlockId, useCanvaStore.getState().selectedBlockType || '');
      }
      // Small delay to let state settle after selectBlock
      setTimeout(() => handleRefine(mode), 50);
    };
    window.addEventListener('ai-refine', handler);
    return () => window.removeEventListener('ai-refine', handler);
  }, [handleRefine]);

  if (!selectedBlockId || !selectedBlockType) return null;

  // Color map for refine mode buttons
  const colorMap: Record<string, string> = {
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-300 hover:bg-amber-500/20',
    sky: 'bg-sky-500/10 border-sky-500/20 text-sky-300 hover:bg-sky-500/20',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20',
    violet: 'bg-violet-500/10 border-violet-500/20 text-violet-300 hover:bg-violet-500/20',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-300 hover:bg-blue-500/20',
    yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300 hover:bg-yellow-500/20',
    pink: 'bg-pink-500/10 border-pink-500/20 text-pink-300 hover:bg-pink-500/20',
  };

  return (
    <div className="space-y-2 px-3 py-2 border-t border-app-border/30">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <Sparkles size={11} className="text-amber-400" />
        <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">
          {teacherMode ? 'Sempurnakan dengan AI' : 'AI Refine'}
        </span>
      </div>

      {/* Quick refine buttons */}
      <div className="flex flex-wrap gap-1.5">
        {applicableModes.filter(m => m.id !== 'custom').map(mode => (
          <button
            key={mode.id}
            onClick={() => handleRefine(mode.id)}
            disabled={loading}
            className={`inline-flex items-center gap-1 px-2 py-1 text-[8px] font-semibold rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${colorMap[mode.color] || colorMap.amber}`}
            title={mode.description}
          >
            {loading && lastAppliedMode === null ? (
              <Loader2 size={9} className="animate-spin" />
            ) : (
              <span>{mode.icon}</span>
            )}
            {mode.label}
          </button>
        ))}
      </div>

      {/* Custom instruction input */}
      {showCustom ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1">
            <MessageSquare size={9} className="text-pink-400" />
            <span className="text-[8px] text-app-muted font-bold uppercase tracking-wider">Instruksi Bebas</span>
          </div>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={customInstruction}
              onChange={e => setCustomInstruction(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && customInstruction.trim()) handleRefine('custom'); }}
              placeholder="Contoh: Fokus pada contoh kehidupan sehari-hari"
              className="flex-1 h-6 px-2 text-[9px] bg-app-elevated/60 border border-app-border/30 rounded-lg focus:border-pink-500/50 focus:outline-none placeholder:text-app-muted"
              autoFocus
            />
            <button
              onClick={() => handleRefine('custom')}
              disabled={loading || !customInstruction.trim()}
              className="px-2 py-1 text-[8px] font-bold rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-300 hover:bg-pink-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 size={9} className="animate-spin" /> : 'Kirim'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCustom(true)}
          className="inline-flex items-center gap-1 text-[8px] text-app-muted hover:text-pink-300 transition-colors"
        >
          <MessageSquare size={9} />
          Tulis instruksi sendiri...
        </button>
      )}

      {/* Error display */}
      {error && (
        <div className="flex items-start gap-1.5 p-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle size={10} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-[8px] text-red-300">{error}</div>
        </div>
      )}

      {/* Success + undo */}
      {lastAppliedMode && (
        <div className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-1">
            <CheckCircle2 size={10} className="text-emerald-400" />
            <span className="text-[8px] text-emerald-300 font-semibold">
              {REFINE_MODES.find(m => m.id === lastAppliedMode)?.label} berhasil diterapkan
            </span>
          </div>
          <button
            onClick={handleUndo}
            className="inline-flex items-center gap-0.5 text-[8px] text-app-muted hover:text-amber-300 transition-colors"
          >
            <RotateCcw size={9} />
            Undo
          </button>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Loader2 size={10} className="animate-spin text-amber-400" />
          <span className="text-[8px] text-amber-300">AI sedang menyempurnakan konten...</span>
        </div>
      )}

      {/* Footer hint */}
      <div className="text-[7px] text-app-muted leading-relaxed">
        AI akan mempertahankan struktur data dan hanya memperbaiki isi konten.
        Selalu tinjau hasil sebelum digunakan.
      </div>
    </div>
  );
}
