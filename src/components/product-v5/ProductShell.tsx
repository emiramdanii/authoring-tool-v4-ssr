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
// ═══════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import { DashboardV5 } from './DashboardV5';
import { TemplatePickerV5 } from './TemplatePickerV5';
import { CleanEditorV5 } from './CleanEditorV5';
import { PreviewV5 } from './PreviewV5';
import { ExportPanelV5 } from './ExportPanelV5';
import { useCanvaStore } from '@/store/canva-store';
import { ProjectProvider } from '@/hooks/use-project-manager';
import { CanvaAutoSaveSync } from '@/components/canva/CanvaAutoSaveSync';

export type ProductView = 'dashboard' | 'template' | 'editor' | 'preview' | 'export';

export interface ProductShellProps {
  /** Initial view (default: 'dashboard') */
  initialView?: ProductView;
}

export function ProductShell({ initialView = 'dashboard' }: ProductShellProps) {
  const [view, setView] = useState<ProductView>(initialView);
  const pages = useCanvaStore((s) => s.pages);

  // V5-HARDENING-01 AUDIT-005: removed dead useEffect that only
  // checked pages.length === 0 + view === 'dashboard' without any
  // side effect. The "Lanjut Edit" button enable/disable state is
  // already handled by DashboardV5 via the `hasProject` prop below.

  const goDashboard = useCallback(() => setView('dashboard'), []);
  const goTemplate = useCallback(() => setView('template'), []);
  const goEditor = useCallback(() => setView('editor'), []);
  const goPreview = useCallback(() => setView('preview'), []);
  const goExport = useCallback(() => setView('export'), []);

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
      </div>
    </ProjectProvider>
  );
}
