'use client';

// ═══════════════════════════════════════════════════════════════
// MPI EDITOR SHELL — Simple 3-panel editor for teachers
// ═══════════════════════════════════════════════════════════════
// EDITOR-RADICAL-RESET-01: Replaces the old CanvaBuilder 3-panel
// layout (IconRail + Stage + RightPanel + SceneTabBar + StatusBar)
// with a clean, teacher-friendly shell:
//
//   ┌─────────────────────────────────────────────────────────┐
//   │ MpiTopBar (Title | Style | Preview | Export)           │
//   ├──────────┬──────────────────────────┬──────────────────┤
//   │ MpiScene │ MpiCanvasPanel           │ MpiInspector     │
//   │ Rail     │ (PageRenderer)           │ (Edit/Settings)  │
//   │ (pages)  │                          │                  │
//   ├──────────┴──────────────────────────┴──────────────────┤
//   │ MpiAddContentBar (+ Halaman | + Blok | + Game)         │
//   └─────────────────────────────────────────────────────────┘
//
// Hidden from teacher mode (per sprint scope):
//   - IconRail, SceneTabBar, BottomPageStrip, StatusBar
//   - Command Palette, AI button, Tour developer
//   - Resizable panel handles
//
// Engine reused (NOT replaced):
//   - useCanvaStore (state)
//   - PageRenderer (canvas rendering)
//   - useExportActions (export pipeline)
//   - addPage/addSchemaBlock/goPage (store actions)

import React from 'react';
import { MpiTopBar } from './MpiTopBar';
import { MpiSceneRail } from './MpiSceneRail';
import { MpiCanvasPanel } from './MpiCanvasPanel';
import { MpiInspector } from './MpiInspector';
import { MpiAddContentBar } from './MpiAddContentBar';

export function MpiEditorShell() {
  return (
    <div
      className="flex flex-col h-screen w-full bg-slate-100 overflow-hidden"
      id="mpi-editor-shell"
      data-testid="mpi-editor-shell"
    >
      {/* Top bar — title, style, preview, export */}
      <MpiTopBar />

      {/* Main 3-panel row */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Scene rail (page list) */}
        <MpiSceneRail />

        {/* Center: Canvas (PageRenderer) */}
        <MpiCanvasPanel />

        {/* Right: Inspector (edit/settings) */}
        <MpiInspector />
      </div>

      {/* Bottom: Add content bar */}
      <MpiAddContentBar />
    </div>
  );
}
