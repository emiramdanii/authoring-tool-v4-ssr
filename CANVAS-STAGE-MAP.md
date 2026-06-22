# CANVAS-STAGE-MAP.md

## EDITOR-RESET-V2-PHASE-1 — Canvas/Stage Sizing Map

### Canvas Sizing/Zoom/Overflow per Area

| Area | File | Size basis | Scale method | Overflow behavior | Risk | Status |
|---|---|---|---|---|---|---|
| MPI Studio Canvas | mpi-editor/MpiCanvasPanel.tsx | ResizeObserver measures container, computes 16:9 frame | Fixed pixel width/height from frameSize state | overflow-hidden on wrapper | clipping jika PageRenderer content > frame | OFFICIAL (VISUAL-STABILIZATION-01) |
| Advanced Editor Canvas | stage/index.tsx (Stage) | zoom = ZOOM_FIT (-1) = auto-fit; fitZoom calculated from viewport | transform: scale(zoom) on transformLayer | overflow-hidden on canvasAreaRef | clipping jika content > viewport; zoom bisa aneh | LEGACY |
| Preview Mode | PreviewMode.tsx | scale calculated from viewport vs ratio | transform: scale(scale) | overflow-hidden on wrapper | clipping jika content > scaled area | OFFICIAL |
| Present Mode | PresentMode.tsx | fullscreen, scale from viewport | transform: scale | overflow-hidden | minimal risk (fullscreen) | OFFICIAL |
| Export App (Vite SSR) | export/ExportApp.tsx → PageRenderer mode=export | fixed 1280×720 (ratio) | no scale (native size) | overflow-hidden | content at native size, no clipping | OFFICIAL |
| Export HTML (static) | lib/export/html-templates.ts → renderPageHtml | fixed ratioW × ratioH (1280×720 default) | no scale (native HTML) | CSS overflow on .page div | content at native size | OFFICIAL (but different renderer) |
| PageRenderer wrapper | page-renderer/PageRenderer.tsx | receives mode (canvas/preview/export/learn) | passes to PageFrame | PageFrame handles overflow | depends on caller wrapper | OFFICIAL |
| PageFrame | page-renderer/PageFrame.tsx | receives frameMode from PageRenderer | absolute positioning for bg layers | overflow-hidden on content area | content bisa keluar jika absolute positioned | OFFICIAL |
| Scene Layout Engine | core/layout/BlockMeasurer.tsx + SceneLayoutEngine.ts | measures block heights, calculates layout | flexbox/grid | overflow hidden on sections | long content bisa terpotong | OFFICIAL |
| Screen Shell | core/renderer/screens/ScreenShell.tsx | receives props from screen adapter | flexbox | overflow-y-auto on content | scroll untuk long content | OFFICIAL |

### Risk Detail

| # | Risk | Area | Severity | Detail |
|---|---|---|---|---|
| 1 | Clipping di MPI Studio | MpiCanvasPanel | P2 | ResizeObserver computes frame, overflow-hidden clips. Jika PageRenderer content lebih tinggi dari frame, bawah terpotong. VISUAL-STABILIZATION-01 memperbaiki dengan dynamic sizing, tapi tetap clipping jika content > available space. |
| 2 | Zoom terasa aneh di Advanced | Stage | P3 | zoom/pan bisa confusing untuk guru. fitZoom default bisa terlalu kecil/besar tergantung viewport. Tidak ada di MPI Studio. |
| 3 | Preview/Export mismatch | PreviewMode vs renderPageHtml | P1 | Preview pakai React PageRenderer (mode=preview). Export HTML static pakai renderPageHtml (completely different code). Visual bisa beda. |
| 4 | Content keluar frame di PageFrame | PageFrame | P3 | Background layers absolute positioned. Jika content block terlalu tinggi, bisa keluar dari overflow-hidden wrapper. |
| 5 | Scroll hilang di MPI Studio | MpiCanvasPanel | P2 | overflow-hidden (bukan overflow-auto). Jika content lebih tinggi dari frame, tidak bisa scroll. Guru tidak bisa lihat content yang terpotong. |
| 6 | Export HTML native size vs editor scaled | renderPageHtml vs PageRenderer | P2 | Export HTML render di 1280×720 native. Editor render di scaled frame. Content yang fit di editor mungkin tidak fit di export (atau sebaliknya). |
