---
Task ID: 1
Agent: Main Agent
Task: Implement Vite SSR Export Pipeline for Authoring Tool v4

Work Log:
- Explored entire project structure: stores, templates, export pipeline, game engines
- Identified root problem: two renderers (React for preview, string HTML for export) always drift apart
- Designed solution: Hybrid Vite SSR Export — same React components for both preview and export
- Key architecture: Pre-populate Zustand stores from window.__EXPORT_DATA__, then render ExportApp
- Rewrote src/export/entry-client.tsx: Pre-populates useAuthoringStore, useCanvaStore, useInteractiveStore from export data
- Rewrote src/export/ExportApp.tsx: Uses PageTemplate (same as preview), handles navigation via interactiveStore
- Created src/app/api/export/route.ts: Next.js API route that reads pre-built template + injects data
- Created src/lib/use-vite-export.ts: React hook for calling the export API from UI
- Updated src/components/authoring/import-export/import-export-component.tsx: Uses new Vite export hook
- Updated src/components/canva/Toolbar.tsx: Uses new Vite export hook
- Updated src/export/export.css: Added @source directives for Tailwind v4 content detection
- Updated package.json: Build script runs Vite build first, dev script auto-builds template
- Removed src/export/build-export.ts (replaced by API route)
- Both Vite build (972KB single HTML) and Next.js build succeed

Stage Summary:
- Vite SSR Export pipeline fully implemented
- Same React template components (PageTemplate) used for both preview and export
- Export = pre-built Vite template + data injection via window.__EXPORT_DATA__
- All 12 template types work (cover, dokumen, materi, kuis, game, hasil, hero, skenario, petunjuk, diskusi, refleksi, penutup)
- Game engines work via React components (QuizWidget, GameWidget) with pre-populated stores
- Score tracking works via interactiveStore
- Navigation works via interactiveStore (keyboard, touch/swipe, buttons)
