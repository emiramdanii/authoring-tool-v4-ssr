// ═══════════════════════════════════════════════════════════════════════
// AI LESSON GENERATION HOOK — Generate full lesson structure from topic
// ═══════════════════════════════════════════════════════════════════════
// Uses the AI API to generate a complete lesson plan:
//   1. Teacher provides: topic, mapel, kelas
//   2. AI generates: lesson structure (page types + content outline)
//   3. System instantiates pages from the AI structure
//   4. Each page gets AI-generated content via the existing generators
//
// This is the "guru capek pulang sekolah" FAST path:
//   Topic → AI → Complete Lesson → Edit → Done
// ═══════════════════════════════════════════════════════════════════════

'use client';

import { useState, useCallback, useRef } from 'react';
import type { PageTemplateType } from '@/components/canva/types';

// ── Types ────────────────────────────────────────────────────────────

export interface LessonGenerationRequest {
  /** The topic/chapter title */
  topik: string;
  /** Subject (e.g., 'PPKn', 'IPA', 'MTK') */
  mapel: string;
  /** Grade level (e.g., '7', '8', '9') */
  kelas: string;
  /** Semester ('1' or '2') */
  semester?: string;
  /** Additional context (existing materi text, etc.) */
  konteks?: string;
  /** Pattern preference */
  pattern?: 'standar' | 'interaktif' | 'eksperimen' | 'mini';
}

/** AI-generated page specification */
export interface AIGeneratedPage {
  type: PageTemplateType;
  title: string;
  description: string;
  contentHints: string[];
}

/** AI-generated lesson structure */
export interface AIGeneratedLesson {
  title: string;
  subtitle: string;
  pages: AIGeneratedPage[];
  keyConcepts: string[];
  definitions: { term: string; meaning: string }[];
}

export interface LessonGenerationResult {
  success: boolean;
  data?: AIGeneratedLesson;
  error?: string;
  raw?: string;
}

export interface UseAILessonGenerationReturn {
  loading: boolean;
  result: LessonGenerationResult | null;
  error: string | null;
  generateLesson: (params: LessonGenerationRequest) => Promise<LessonGenerationResult | null>;
  clear: () => void;
}

// ── Hook ─────────────────────────────────────────────────────────────

export function useAILessonGeneration(): UseAILessonGenerationReturn {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LessonGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const generateLesson = useCallback(async (params: LessonGenerationRequest): Promise<LessonGenerationResult | null> => {
    // Abort previous request if still pending
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      const data: LessonGenerationResult = await response.json();

      if (!response.ok) {
        const errMsg = data.error || 'Gagal menghasilkan struktur pembelajaran';
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

  return { loading, result, error, generateLesson, clear };
}
