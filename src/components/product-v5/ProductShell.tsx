'use client';

// ═══════════════════════════════════════════════════════════════
// AUTHORING-RESET-V5 — ProductShell
// ═══════════════════════════════════════════════════════════════
// Single runtime route for the entire app. State-machine navigation
// (no URL routing — Next.js app router only exposes `/`).
//
// View flow:
//   dashboard → template → editor → preview → export
//
// All legacy editors (MpiEditorShell, CanvaBuilder old, Advanced)
// are disconnected from runtime. ProductShell is the ONLY entry.
//
// BATCH-06B: view now persists to localStorage via
// `silse_v5_last_view` key and restores on boot with safe fallback.
// See src/lib/v5-view-persistence.ts for the safety contract.
// ═══════════════════════════════════════════════════════════════

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DashboardV5 } from './DashboardV5';
import { TemplatePickerV5 } from './TemplatePickerV5';
import { CleanEditorV5 } from './CleanEditorV5';
import { PreviewV5 } from './PreviewV5';
import { ExportPanelV5 } from './ExportPanelV5';
import { ImportJsonPanelV5 } from './ImportJsonPanelV5';
import { useCanvaStore } from '@/store/canva-store';
import { ProjectProvider } from '@/hooks/use-project-manager';
import { CanvaAutoSaveSync } from '@/components/canva/CanvaAutoSaveSync';
import { restoreLastView, persistLastView } from '@/lib/v5-view-persistence';

export type ProductView = 'dashboard' | 'template' | 'editor' | 'preview' | 'export';

export interface ProductShellProps {
  /** Initial view (default: 'dashboard'). Override for tests only. */
  initialView?: ProductView;
}

export function ProductShell({ initialView }: ProductShellProps) {
  // BATCH-06B: We need access to the canva store's pages BEFORE
  // initializing useState so we can call restoreLastView(pages.length)
  // synchronously. The canva store loads from localStorage in
  // StoreInit.tsx (a parent), so by the time ProductShell mounts,
  // pages is already populated.
  //
  // Use a lazy initializer so restoreLastView runs ONCE on first render,
  // not on every re-render. This is the recommended React pattern for
  // "compute initial state from external source".
  const pagesRef = useRef<number | null>(null);
  if (pagesRef.current === null) {
    // Read once synchronously — do NOT subscribe (we subscribe below
    // for reactivity, this is just for the initial view decision).
    try {
      const snapshot = useCanvaStore.getState();
      pagesRef.current = snapshot.pages.length;
    } catch {
      pagesRef.current = 0;
    }
  }

  // Decide the initial view:
  //   - If caller passed initialView prop, use it (test override)
  //   - Otherwise, restore from localStorage with safe fallback
  const [view, setView] = useState<ProductView>(() => {
    if (initialView) return initialView;
    return restoreLastView(pagesRef.current);
  });

  // Subscribe to pages changes (for reactivity — affects DashboardV5
  // hasProject/pageCount props).
  const pages = useCanvaStore((s) => s.pages);

  // BATCH-06B: Persist current view to localStorage whenever it changes.
  // Uses a ref guard to skip the very first effect run (the restore
  // already wrote that value, no need to write it again).
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      // Even on first run, ensure the restored view IS persisted
      // (in case localStorage had a stale value that was cleared
      // by restoreLastView due to invalid view). This makes the
      // stored value always reflect reality.
      persistLastView(view);
      return;
    }
    persistLastView(view);
  }, [view]);

  // BATCH-06B: Safety net — if user is in editor/preview/export and
  // pages becomes empty (e.g., they cleared the canvas via some
  // future "reset" action), fall back to dashboard. Without this,
  // they'd be stuck on an editor view with nothing to render.
  //
  // This is a GUARD, not normal navigation. It only fires on the
  // edge case where pages.length drops to 0 while in a pages-required
  // view. Normal flow (clearing all pages via UI) should never happen
  // because the editor doesn't expose a "delete all pages" button.
  useEffect(() => {
    if (pages.length === 0) {
      if (view === 'editor' || view === 'preview' || view === 'export') {
        setView('dashboard');
      }
    }
  }, [pages.length, view]);

  const goDashboard = useCallback(() => setView('dashboard'), []);
  const goTemplate = useCallback(() => setView('template'), []);
  const goEditor = useCallback(() => setView('editor'), []);
  const goPreview = useCallback(() => setView('preview'), []);
  const goExport = useCallback(() => setView('export'), []);

  // BATCH-09A: Import JSON modal state. This is a MODAL, not a view —
  // it doesn't go through the persistence layer (no 'import' in
  // ProductView union). Opens from Dashboard, closes back to Dashboard.
  const [importPanelOpen, setImportPanelOpen] = useState(false);
  const openImportPanel = useCallback(() => setImportPanelOpen(true), []);
  const closeImportPanel = useCallback(() => setImportPanelOpen(false), []);

  return (
    <ProjectProvider>
      <div
        className="h-screen w-screen flex flex-col bg-slate-50 overflow-hidden"
        data-testid="product-shell-v5"
        data-view={view}
      >
        {/* V5-HARDENING-01 AUDIT-002: CanvaAutoSaveSync ensures
            schema edits persist to localStorage via debounced auto-save.
            Without this, edits in CleanEditorV5 were lost on reload
            because the auto-save hook was only rendered in legacy
            CanvaBuilder (which V5 doesn't use). */}
        <CanvaAutoSaveSync />
        {view === 'dashboard' && (
          <DashboardV5
            onPickTemplate={goTemplate}
            onResumeEdit={goEditor}
            hasProject={pages.length > 0}
            pageCount={pages.length}
            onOpenImport={openImportPanel}
          />
        )}
        {view === 'template' && (
          <TemplatePickerV5
            onBack={goDashboard}
            onTemplateApplied={goEditor}
          />
        )}
        {view === 'editor' && (
          <CleanEditorV5
            onBack={goDashboard}
            onPreview={goPreview}
            onExport={goExport}
          />
        )}
        {view === 'preview' && (
          <PreviewV5
            onBack={goEditor}
            onExport={goExport}
          />
        )}
        {view === 'export' && (
          <ExportPanelV5
            onBack={goEditor}
          />
        )}

        {/* BATCH-09A: Import JSON validation modal.
            Rendered OUTSIDE the view switch because it's a modal overlay,
            not a view. Can be opened from Dashboard via onOpenImport prop. */}
        <ImportJsonPanelV5
          open={importPanelOpen}
          onClose={closeImportPanel}
        />
      </div>
    </ProjectProvider>
  );
}
