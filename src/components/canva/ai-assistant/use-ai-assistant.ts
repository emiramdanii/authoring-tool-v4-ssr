// ═══════════════════════════════════════════════════════════════════════
// AI ASSISTANT HOOK — React hook for calling the AI Content API
// ═══════════════════════════════════════════════════════════════════════
// Handles API calls, loading state, error handling, and result caching.
// Provides a simple interface for the AI Assistant panel UI.
// ═══════════════════════════════════════════════════════════════════════

'use client';

import { useState, useCallback, useRef } from 'react';

// ── Types ────────────────────────────────────────────────────────────

export type AIAction =
  | 'kuis'
  | 'matching'
  | 'fill-blank'
  | 'word-search'
  | 'crossword'
  | 'true-false'
  | 'drag-drop'
  | 'memory'
  | 'roda'
  | 'sortir'
  | 'diskusi'
  | 'refleksi'
  | 'materi-summary'
  | 'tp'
  | 'petunjuk'
  | 'motivasi';

export interface AIGenerateParams {
  action: AIAction;
  mapel: string;
  kelas: string;
  topik: string;
  konteks?: string;
  jumlah?: number;
  instruksi?: string;
}

export interface AIResult {
  success: boolean;
  data?: unknown;
  error?: string;
  raw?: string;
}

export interface UseAIAssistantReturn {
  /** Current loading state */
  loading: boolean;
  /** Last generated result */
  result: AIResult | null;
  /** Error message if any */
  error: string | null;
  /** Generate content via AI */
  generate: (params: AIGenerateParams) => Promise<AIResult | null>;
  /** Clear the current result */
  clear: () => void;
  /** Generation history (last 10 results) */
  history: Array<{ params: AIGenerateParams; result: AIResult; timestamp: number }>;
}

// ── Hook ─────────────────────────────────────────────────────────────

export function useAIAssistant(): UseAIAssistantReturn {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ params: AIGenerateParams; result: AIResult; timestamp: number }>>([]);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (params: AIGenerateParams): Promise<AIResult | null> => {
    // Abort previous request if still pending
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      const data: AIResult = await response.json();

      if (!response.ok) {
        const errMsg = data.error || 'Gagal menghasilkan konten AI';
        setError(errMsg);
        setResult({ success: false, error: errMsg });
        return { success: false, error: errMsg };
      }

      setResult(data);
      setHistory(prev => {
        const entry = { params, result: data, timestamp: Date.now() };
        const next = [entry, ...prev].slice(0, 10);
        return next;
      });
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

  return { loading, result, error, generate, clear, history };
}
