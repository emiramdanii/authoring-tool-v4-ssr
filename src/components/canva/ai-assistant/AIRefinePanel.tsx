'use client';

// ═══════════════════════════════════════════════════════════════════
// AI REFINE PANEL — Page-level and block-level content refinement
// ═══════════════════════════════════════════════════════════════════
// Provides AI-powered content refinement for the current page or
// selected block. Can:
//   - Improve text clarity and grammar
//   - Add BSNP alignment hints
//   - Suggest interactive activities
//   - Expand thin content
//   - Simplify complex content
//
// TEACHER MODE: In 'sederhana' mode, simplified refinement options.
// ═══════════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from 'react';
import { isEnabled } from '@/config/feature-flags';
// All icons migrated to Material Symbols Outlined
import { useCanvaStore } from '@/store/canva-store';
import { useSchemaContext } from '@/hooks/use-schema-navigator';
import { toast } from 'sonner';
import { ensurePageSchema } from '@/core/schema/ensure-schema';
import { useAIAssistant, type AIAction, type AIGenerateParams } from '../ai-assistant/use-ai-assistant';
import { teacherTerm } from '@/core/i18n/teacher-terminology';

// ── Refinement types ──────────────────────────────────────
type RefinementType =
  | 'improve-clarity'    // Improve text clarity and grammar
  | 'add-bsnp'          // Add BSNP alignment
  | 'suggest-interactive' // Suggest interactive activities
  | 'expand-content'    // Expand thin content
  | 'simplify'          // Simplify complex content
  | 'add-questions'     // Add evaluation questions
  | 'localize-context';  // Add local/Indonesian context

interface RefinementOption {
  id: RefinementType;
  label: string;
  sederhanaLabel: string;
  icon: string;
  description: string;
  prompt: string;
}

const REFINEMENT_OPTIONS: RefinementOption[] = [
  {
    id: 'improve-clarity',
    label: 'Improve Clarity',
    sederhanaLabel: 'Perbaiki Tulisan',
    icon: '✨',
    description: 'Perbaiki tata bahasa, kejelasan, dan keterbacaan konten',
    prompt: 'Improve the clarity, grammar, and readability of the following content. Keep the original meaning but make it more engaging and easier to understand for SMP students in Indonesia.',
  },
  {
    id: 'add-bsnp',
    label: 'BSNP Alignment',
    sederhanaLabel: 'Sesuaikan BSNP',
    icon: '🎯',
    description: 'Tambahkan penanda BSNP dan profil pelajar Pancasila',
    prompt: 'Add BSNP (Badan Standar Nasional Pendidikan) alignment to this content. Include Profil Pelajar Pancasila indicators and ensure the content follows the Kurikulum Merdeka framework. Mark which BSNP standards are addressed.',
  },
  {
    id: 'suggest-interactive',
    label: 'Interactive Activities',
    sederhanaLabel: 'Tambah Aktivitas',
    icon: '🎮',
    description: 'Sarankan aktivitas interaktif untuk meningkatkan keterlibatan siswa',
    prompt: 'Suggest 3-5 interactive activities that could be added to enhance student engagement. For each activity, describe the type (game, discussion, quiz, scenario), the specific content, and how it connects to the learning objectives.',
  },
  {
    id: 'expand-content',
    label: 'Expand Content',
    sederhanaLabel: 'Kembangkan Konten',
    icon: '📖',
    description: 'Kembangkan konten yang terlalu singkat dengan detail dan contoh',
    prompt: 'Expand this content by adding more detail, examples, and explanations. Add real-world examples relevant to Indonesian SMP students. Include at least 2 additional supporting details for each main point.',
  },
  {
    id: 'simplify',
    label: 'Simplify Language',
    sederhanaLabel: 'Sederhanakan',
    icon: '📝',
    description: 'Sederhanakan bahasa agar lebih mudah dipahami siswa SMP',
    prompt: 'Simplify the language of this content to make it more accessible for SMP (middle school) students in Indonesia. Use shorter sentences, simpler vocabulary, and add analogies from everyday Indonesian life. Keep all key concepts intact.',
  },
  {
    id: 'add-questions',
    label: 'Add Questions',
    sederhanaLabel: 'Tambah Soal',
    icon: '❓',
    description: 'Tambahkan pertanyaan evaluasi bertingkat (C1-C6)',
    prompt: 'Generate 5 evaluation questions based on this content, following Bloom\'s Taxonomy levels (C1-C6). For each question, indicate the cognitive level, provide 4 multiple choice options, mark the correct answer, and add an explanation.',
  },
  {
    id: 'localize-context',
    label: 'Localize Context',
    sederhanaLabel: 'Konteks Lokal',
    icon: '🇮🇩',
    description: 'Tambahkan konteks lokal Indonesia yang relevan',
    prompt: 'Add relevant Indonesian local context to this content. Include examples from Indonesian culture, geography, history, or daily life that make the content more relatable for Indonesian SMP students. Replace generic examples with Indonesian-specific ones.',
  },
];

export default function AIRefinePanel() {
  const teacherMode = useCanvaStore(s => s.teacherMode);
  const isSederhana = teacherMode;
  const { meta } = useSchemaContext();

  const pages = useCanvaStore(s => s.pages);
  const currentPageIndex = useCanvaStore(s => s.currentPageIndex);
  const selectedBlockId = useCanvaStore(s => s.selectedBlockId);
  const selectedBlockType = useCanvaStore(s => s.selectedBlockType);
  const updateSchemaBlock = useCanvaStore(s => s.updateSchemaBlock);

  const { loading, result, error, generate, clear } = useAIAssistant();

  const [selectedRefinement, setSelectedRefinement] = useState<RefinementType | null>(null);
  const [applied, setApplied] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const page = pages[currentPageIndex];

  // Extract current page content for context
  const pageContext = useMemo(() => {
    if (!page) return '';
    const schema = ensurePageSchema(page);
    if (!schema) return '';
    const texts: string[] = [];
    for (const block of schema.blocks) {
      const b = block as unknown as Record<string, unknown>;
      if (typeof b.content === 'string') texts.push(b.content);
      if (typeof b.title === 'string') texts.push(b.title);
      if (typeof b.subtitle === 'string') texts.push(b.subtitle);
      if (typeof b.text === 'string') texts.push(b.text);
      if (typeof b.hookQuestion === 'string') texts.push(b.hookQuestion);
      if (typeof b.intro === 'string') texts.push(b.intro);
      if (typeof b.closingStatement === 'string') texts.push(b.closingStatement);
    }
    return texts.join('\n\n').substring(0, 3000);
  }, [page]);

  // Selected block content
  const selectedBlockContent = useMemo(() => {
    if (!page || !selectedBlockId) return '';
    const schema = ensurePageSchema(page);
    if (!schema) return '';
    const block = schema.blocks.find(b => b.id === selectedBlockId);
    if (!block) return '';
    return JSON.stringify(block, null, 2).substring(0, 2000);
  }, [page, selectedBlockId]);

  // Visible options
  const visibleOptions = showAll ? REFINEMENT_OPTIONS : REFINEMENT_OPTIONS.slice(0, 4);

  // ── Handle Refine ─────────────────────────────────────
  const handleRefine = useCallback(async (option: RefinementOption) => {
    setSelectedRefinement(option.id);
    setApplied(false);

    const contextText = selectedBlockContent || pageContext;
    if (!contextText.trim()) {
      toast.warning('Tidak ada konten untuk diperbaiki. Pilih block atau buat halaman terlebih dahulu.');
      return;
    }

    const params: AIGenerateParams = {
      action: 'materi-summary' as AIAction,
      mapel: meta.mapel || 'PPKn',
      kelas: meta.kelas || 'Kelas VII',
      topik: meta.judulPertemuan || 'Materi Pembelajaran',
      konteks: contextText,
      jumlah: 5,
      instruksi: `${option.prompt}\n\nContent to refine:\n${contextText}`,
    };

    const res = await generate(params);
    if (res?.success) {
      toast.success(`Refinement "${isSederhana ? option.sederhanaLabel : option.label}" berhasil!`);
    }
  }, [selectedBlockContent, pageContext, meta, generate, isSederhana]);

  // ── Apply refined content ─────────────────────────────
  const handleApply = useCallback(() => {
    if (!result?.success || !result.data || !selectedBlockId) {
      toast.warning('Tidak ada konten untuk diterapkan atau tidak ada block yang dipilih');
      return;
    }
    updateSchemaBlock(selectedBlockId, result.data as Record<string, unknown>);
    setApplied(true);
    toast.success('Konten AI diterapkan ke block!');
  }, [result, selectedBlockId, updateSchemaBlock]);

  // ── Clear ─────────────────────────────────────────────
  const handleClear = useCallback(() => {
    setSelectedRefinement(null);
    setApplied(false);
    clear();
  }, [clear]);

  // Feature flag guard — after all hooks, before JSX
  if (!isEnabled('aiRefinement')) return null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-violet-400" style={ { fontSize: '14px' } }>auto_fix</span>
        <div className="text-[9px] font-bold text-violet-400 uppercase tracking-wider">
          {isSederhana ? 'Perbaiki Konten AI' : 'AI Refine'}
        </div>
        <span className="text-[7px] text-app-muted bg-violet-500/10 px-1.5 py-0.5 rounded-full font-bold">NEW</span>
      </div>

      {/* Context indicator */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-app-elevated/20 border border-app-border/10">
        <span className="text-[10px]">{selectedBlockId ? '🎯' : '📄'}</span>
        <span className="text-[8px] text-app-muted">
          {selectedBlockId
            ? `Refine block "${selectedBlockType || selectedBlockId}"`
            : 'Refine semua konten halaman ini'}
        </span>
      </div>

      {/* Refinement options */}
      <div className="space-y-1">
        <div className="text-[8px] font-bold text-app-secondary uppercase tracking-wider mb-1">
          Pilih Perbaikan
        </div>

        {visibleOptions.map(option => {
          const isActive = selectedRefinement === option.id;
          return (
            <button
              key={option.id}
              onClick={() => handleRefine(option)}
              disabled={loading}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-[transform,box-shadow,background-color] text-left active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${
                isActive
                  ? 'bg-violet-500/15 border-violet-500/30 text-violet-300'
                  : 'bg-app-elevated/30 border-app-border/15 text-app-secondary hover:border-violet-500/20 hover:text-app-primary'
              }`}
            >
              <span className="text-sm flex-shrink-0">{option.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-bold truncate">
                  {isSederhana ? option.sederhanaLabel : option.label}
                </div>
                <div className="text-[7px] text-app-muted truncate">{option.description}</div>
              </div>
              {isActive && loading && (
                <span className="material-symbols-outlined animate-spin text-violet-300 flex-shrink-0" style={ { fontSize: '10px' } }>progress_activity</span>
              )}
            </button>
          );
        })}

        {/* Show more/less toggle */}
        {REFINEMENT_OPTIONS.length > 4 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full py-1 text-[8px] text-app-muted hover:text-app-secondary transition-colors flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined" style={ { fontSize: '8px' } }>expand_more</span>
            {showAll ? 'Lebih sedikit' : `+${REFINEMENT_OPTIONS.length - 4} lainnya`}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <span className="material-symbols-outlined text-red-400 flex-shrink-0 mt-0.5" style={ { fontSize: '12px' } }>error</span>
          <div className="text-[9px] text-red-300">{error}</div>
        </div>
      )}

      {/* Result */}
      {result?.success && result.data != null && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-400" style={ { fontSize: '10px' } }>check_circle</span>
              <span className="text-[9px] font-bold text-emerald-300">Refinement Berhasil</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => selectedRefinement && handleRefine(REFINEMENT_OPTIONS.find(o => o.id === selectedRefinement)!)}
                className="p-1 rounded hover:bg-app-elevated/50 text-app-muted hover:text-app-secondary transition-colors"
                title="Regenerate"
              >
                <span className="material-symbols-outlined" style={ { fontSize: '10px' } }>refresh</span>
              </button>
            </div>
          </div>

          {/* Result preview */}
          <div className="max-h-32 overflow-y-auto rounded-lg bg-app-elevated/40 border border-app-border/20 p-2">
            <pre className="text-[7px] text-app-muted whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(result.data, null, 2).substring(0, 800)}
            </pre>
          </div>

          {/* Apply button */}
          {selectedBlockId && (
            <button
              onClick={handleApply}
              disabled={applied}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold transition-[transform,box-shadow,background-color] active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none ${
                applied
                  ? 'bg-emerald-500/20 text-emerald-400/60 border border-emerald-500/20'
                  : 'bg-violet-500/15 border border-violet-500/30 text-violet-300 hover:bg-violet-500/25'
              }`}
            >
              {applied ? (
                <><span className="material-symbols-outlined" style={ { fontSize: '12px' } }>check_circle</span> Sudah Diterapkan</>
              ) : (
                <><span className="material-symbols-outlined" style={ { fontSize: '12px' } }>auto_awesome</span> Terapkan ke Block</>
              )}
            </button>
          )}

          {!selectedBlockId && (
            <div className="text-[8px] text-app-muted text-center">
              Pilih block terlebih dahulu untuk menerapkan hasil refinement
            </div>
          )}
        </div>
      )}

      {/* Reset */}
      {(selectedRefinement || result) && (
        <button
          onClick={handleClear}
          className="w-full py-1.5 rounded-lg text-[9px] text-app-muted hover:text-app-secondary bg-app-elevated/20 border border-app-border/15 hover:border-app-border/30 transition-[background-color,border-color]"
        >
          Reset Refinement
        </button>
      )}

      {/* Footer hint */}
      <div className="text-[7px] text-app-muted pt-1 border-t border-app-border/10 leading-relaxed">
        AI Refine membantu memperbaiki konten secara otomatis. Selalu tinjau hasil sebelum digunakan.
      </div>
    </div>
  );
}
