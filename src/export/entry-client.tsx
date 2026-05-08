// ═══════════════════════════════════════════════════════════════════════
// EXPORT ENTRY CLIENT — Client-side entry point for exported HTML
// This hydrates the SSR-rendered HTML and attaches interactivity
// ═══════════════════════════════════════════════════════════════════════

import React from 'react';
import { createRoot } from 'react-dom/client';
import ExportApp from './ExportApp';
import './export.css';

// Get export data injected by the build script
const exportData = (window as any).__EXPORT_DATA__;

if (exportData) {
  const root = createRoot(document.getElementById('root')!);
  root.render(
    <React.StrictMode>
      <ExportApp {...exportData} />
    </React.StrictMode>
  );
}
