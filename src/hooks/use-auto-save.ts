'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';

/**
 * Unified auto-save hook — single source of truth for saving both stores.
 *
 * Supports two persistence modes:
 *   1. **Database mode** (preferred): When a `projectId` is available
 *      (either from the argument or from ProjectContext),
 *      saves both stores to the database via `/api/projects/[id]/save`.
 *   2. **localStorage fallback**: When no `projectId`, saves to localStorage
 *      (for offline/new users or before first project creation).
 *
 * Called ONCE from CanvaBuilder (the primary editing context).
 */

const DEBOUNCE_MS = 2000;
const HIDE_SAVED_MS = 3000;

// ── Helper: convert canva pages → save API format ─────────────
function canvaPagesToSavePages(pages: import('@/components/canva/types').CanvaPage[]) {
  return pages.map((page) => ({
    id: page.id,
    label: page.label,
    templateType: page.templateType,
    templateVariant: page.templateVariant,
    bgColor: page.bgColor,
    bgDataUrl: page.bgDataUrl,
    overlay: page.overlay,
    schema: page.schema || null,
    navConfig: page.navConfig,
    templateData: page.templateData,
    colorPalette: page.colorPalette,
    blocks: (page.schema?.blocks || []).map((block) => ({
      type: block.type,
      id: block.id,
      content: Object.fromEntries(
        Object.entries(block).filter(([k]) => !['type', 'id', 'layout', 'children'].includes(k))
      ),
      layout: block.layout,
      variant: block.variant,
      style: block.style,
      children: block.children,
    })),
    elements: page.elements.map((el) => ({
      type: el.type,
      id: el.id,
      content: Object.fromEntries(
        Object.entries(el).filter(([k]) => !['type', 'id'].includes(k))
      ),
    })),
  }));
}

export function useAutoSave(projectId?: string | null) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDBSaveRef = useRef<number>(0);

  // ── Core save logic ────────────────────────────────────────────
  const saveNow = useCallback(async () => {
    try {
      useCanvaStore.setState({ _saveStatus: 'saving' });

      // Always save to localStorage as a backup
      useCanvaStore.getState().saveToStorage();
      useAuthoringStore.getState().saveToStorage();

      // If projectId is set, also save to database
      const effectiveProjectId = projectId;
      if (effectiveProjectId) {
        // Throttle DB saves (min 2s between)
        const now = Date.now();
        if (now - lastDBSaveRef.current >= 2000) {
          lastDBSaveRef.current = now;

          const canvaState = useCanvaStore.getState();
          const authoringState = useAuthoringStore.getState();
          const savePages = canvaPagesToSavePages(canvaState.pages);

          try {
            const res = await fetch(`/api/projects/${effectiveProjectId}/save`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                pages: savePages,
                ratioId: canvaState.ratioId,
                meta: {
                  title: authoringState.meta.judulPertemuan || 'Proyek Baru',
                  subject: authoringState.meta.mapel,
                  grade: authoringState.meta.kelas,
                },
                authoringData: {
                  meta: authoringState.meta,
                  cp: authoringState.cp,
                  tp: authoringState.tp,
                  atp: authoringState.atp,
                  alur: authoringState.alur,
                  skenario: authoringState.skenario,
                  kuis: authoringState.kuis,
                  modules: authoringState.modules,
                  games: authoringState.games,
                  materi: authoringState.materi,
                  petunjuk: authoringState.petunjuk,
                  diskusi: authoringState.diskusi,
                  refleksi: authoringState.refleksi,
                  penutup: authoringState.penutup,
                  suara: authoringState.suara,
                },
              }),
            });

            if (!res.ok) {
              console.warn('[useAutoSave] DB save failed:', res.status);
            }
          } catch (dbError) {
            console.warn('[useAutoSave] DB save error (localStorage still OK):', dbError);
          }
        }
      }

      useCanvaStore.setState({ _saveStatus: 'saved' });

      // Auto-hide "saved" indicator after HIDE_SAVED_MS
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const current = useCanvaStore.getState()._saveStatus;
        if (current === 'saved') {
          useCanvaStore.setState({ _saveStatus: 'unsaved' });
        }
      }, HIDE_SAVED_MS);
    } catch (error) {
      console.error('[useAutoSave] Auto-save failed:', error);
      useCanvaStore.setState({ _saveStatus: 'error' });
    }
  }, [projectId]);

  // ── Subscribe to both stores for change detection ────────────────
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleSave = () => {
      // Mark as "unsaved" immediately so UI responds
      const currentStatus = useCanvaStore.getState()._saveStatus;
      if (currentStatus !== 'saving') {
        useCanvaStore.setState({ _saveStatus: 'unsaved' });
      }

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        saveNow();
      }, DEBOUNCE_MS);
    };

    // Subscribe to canva store — uses subscribeWithSelector so we can
    // watch only the slices that represent meaningful edits.
    const unsubscribeCanva = useCanvaStore.subscribe(
      (state) => ({
        pages: state.pages,
        currentPageIndex: state.currentPageIndex,
      }),
      () => {
        scheduleSave();
      },
    );

    // Subscribe to authoring store — no subscribeWithSelector middleware,
    // so we subscribe to every change and manually check `dirty`.
    let prevDirty = useAuthoringStore.getState().dirty;
    const unsubscribeAuth = useAuthoringStore.subscribe((state) => {
      if (state.dirty && state.dirty !== prevDirty) {
        prevDirty = state.dirty;
        scheduleSave();
      }
    });

    return () => {
      unsubscribeCanva();
      unsubscribeAuth();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [saveNow]);

  return { saveNow };
}
