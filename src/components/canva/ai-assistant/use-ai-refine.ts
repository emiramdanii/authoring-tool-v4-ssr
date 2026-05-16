// ═══════════════════════════════════════════════════════════════════════
// AI REFINE HOOK — React hook for calling the AI Refine API
// ═══════════════════════════════════════════════════════════════════════
// Provides a simple interface for refining existing block content via AI.
// Handles loading state, error handling, and abort control.
// ═══════════════════════════════════════════════════════════════════════

'use client';

import { useState, useCallback, useRef } from 'react';

// ── Types ────────────────────────────────────────────────────────────

export type RefineMode = 'menarik' | 'detail' | 'sederhana' | 'contoh' | 'bsnp' | 'kuis-more' | 'custom';

export interface RefineParams {
  blockType: string;
  blockContent: Record<string, unknown>;
  mode: RefineMode;
  mapel: string;
  kelas: string;
  customInstruction?: string;
}

export interface RefineResult {
  success: boolean;
  data?: Record<string, unknown>;
  mode?: RefineMode;
  error?: string;
  raw?: string;
}

export interface UseAIRefineReturn {
  /** Current loading state */
  loading: boolean;
  /** Last refine result */
  result: RefineResult | null;
  /** Error message if any */
  error: string | null;
  /** Refine block content via AI */
  refine: (params: RefineParams) => Promise<RefineResult | null>;
  /** Clear the current result */
  clear: () => void;
}

// ── Refinement Mode Metadata ─────────────────────────────────────────

export interface RefineModeConfig {
  id: RefineMode;
  label: string;
  icon: string;
  description: string;
  color: string;
}

export const REFINE_MODES: RefineModeConfig[] = [
  { id: 'menarik', label: 'Lebih Menarik', icon: '✨', description: 'Bahasa lebih hidup dan engaging', color: 'amber' },
  { id: 'detail', label: 'Lebih Detail', icon: '🔍', description: 'Tambah penjelasan dan kedalaman', color: 'sky' },
  { id: 'sederhana', label: 'Lebih Sederhana', icon: '💡', description: 'Bahasa lebih mudah dipahami', color: 'emerald' },
  { id: 'contoh', label: 'Tambah Contoh', icon: '📝', description: 'Sisipkan contoh konkret', color: 'violet' },
  { id: 'bsnp', label: 'BSNP Compliance', icon: '📋', description: 'Tingkatkan kepatuhan standar BSNP', color: 'blue' },
  { id: 'kuis-more', label: 'Tambah Soal', icon: '➕', description: 'Tambah soal/pertanyaan baru', color: 'yellow' },
  { id: 'custom', label: 'Instruksi Bebas', icon: '🎯', description: 'Tulis instruksi sendiri', color: 'pink' },
];

/**
 * Get applicable refine modes for a block type.
 * Some modes only make sense for certain block types.
 */
export function getApplicableRefineModes(blockType: string): RefineModeConfig[] {
  const gameTypes = ['kuis', 'matching-game', 'true-false-game', 'memory-game', 'fill-blank-game',
    'sortir-game', 'roda-game', 'drag-drop-game', 'word-search-game', 'crossword-game'];

  const hasQuestions = gameTypes.includes(blockType) || ['diskusi', 'refleksi'].includes(blockType);

  return REFINE_MODES.filter(mode => {
    // 'kuis-more' only applies to blocks with questions
    if (mode.id === 'kuis-more' && !hasQuestions) return false;
    return true;
  });
}

// ── Hook ─────────────────────────────────────────────────────────────

export function useAIRefine(): UseAIRefineReturn {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RefineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refine = useCallback(async (params: RefineParams): Promise<RefineResult | null> => {
    // Abort previous request if still pending
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      const data: RefineResult = await response.json();

      if (!response.ok) {
        const errMsg = data.error || 'Gagal menyempurnakan konten';
        setError(errMsg);
        setResult({ success: false, error: errMsg });
        return { success: false, error: errMsg };
      }

      setResult(data);
      return data;
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return null;
      }
      const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan';
      setError(errMsg);
      setResult({ success: false, error: errMsg });
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { loading, result, error, refine, clear };
}
