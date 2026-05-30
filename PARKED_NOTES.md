# PARKED_NOTES — Catatan Area yang Diparkir

File ini dipakai untuk mencatat masalah yang ditemukan di area parkir.

Masalah di area parkir tidak boleh langsung diperbaiki sekarang.

---

## Format Catatan

```txt
Tanggal:
Area:
Temuan:
Kenapa tidak dikerjakan sekarang:
Kapan boleh dikerjakan:
```

---

## Area yang Diparkir

1. AI Generator
2. Template Baru
3. Marketplace
4. SCORM
5. PWA / Offline Sync
6. Dashboard Baru
7. Onboarding Baru
8. Design System Advance
9. VCS
10. Typography Redesign
11. Color System Redesign
12. Health Check Lanjutan
13. Gamifikasi Tambahan
14. Game Baru
15. Import Baru

---

## Catatan

### Catatan 1 — Auto-Generate button dan card merujuk ke AI Generator

Tanggal: 2026-05-30 (diperbarui Sprint 1)
Area: AI Generator (#1)
Temuan: Stage empty state dan CanvasEmptyState punya tombol/kartu "Auto-Generate" yang memanggil `panelRequest: 'autogen'`. Kartu AI sudah dihapus dari CanvasEmptyState (Sprint 1), tombol AI sudah dihapus dari Stage empty state (Sprint 0). Namun handler `panelRequest: 'autogen'` masih ada di: (1) `CommandPalette.tsx` line 495 (feature-flagged, disabled), (2) `use-schema-navigator.ts` line 1839 (internal hook, not user-visible).
Kenapa tidak dikerjakan sekarang: AI Generator adalah area parkir. Fitur auto-generate belum siap dikerjakan.
Kapan boleh dikerjakan: Setelah semua 6 area core stabil dan user secara eksplisit meminta.

### Catatan 2 — InlineEditableQuizOption belum punya onStopEdit

Tanggal: 2026-05-30 (diperbarui Sprint 3)
Area: AI Generator (#1) — terkait inline editing
Temuan: `InlineEditableQuizOption.tsx` punya pola yang sama dengan `InlineEditableText` (blur handler save, tapi tidak notify parent untuk stopEdit). Perlu ditambahkan `onStopEdit` prop yang sama. Sprint 3 memverifikasi bahwa komponen ini tetap tidak digunakan secara aktif di flow utama Learn mode — kuis di-render via KuisRenderer (bukan InlineEditableQuizOption) dan score dilaporkan langsung ke interactive-store. Masih low-priority karena tidak menghalangi runtime flow.
Kenapa tidak dikerjakan sekarang: Komponen ini belum digunakan aktif di workspace editor atau learn mode. Tidak menghalangi Sprint 3 targets.
Kapan boleh dikerjakan: Saat refactoring inline editing setelah semua sprint selesai.

### Catatan 3 — AI Assistant shortcut dan tab di RightPanel

Tanggal: 2026-05-30
Area: AI Generator (#1)
Temuan: `CanvaBuilder.tsx` punya `openAIAssistant` keyboard shortcut dan `RightPanel.tsx` punya AI tab dengan `AIAssistantSection` + `AIRefineSection` lazy-loaded. Shortcut sudah dihapus, tapi AI tab masih di-feature-flag (`isEnabled('aiAssistant')`) dan tidak ditampilkan jika flag disabled.
Kenapa tidak dikerjakan sekarang: AI Generator adalah area parkir. Feature flag sudah menonaktifkan tampilan AI.
Kapan boleh dikerjakan: Setelah semua 6 area core stabil dan user secara eksplisit meminta.

### Catatan 4 — Template Gallery, PageTypeCreator, TemplateWizard di LeftPanel

Tanggal: 2026-05-30
Area: Template Baru (#2)
Temuan: `LeftPanel.tsx` meng-import `TemplateGalleryPanel`, `PageTypeCreator`, dan `TemplateWizard` secara dynamic. Komponen ini terkait template gallery yang diparkir.
Kenapa tidak dikerjakan sekarang: Template Baru adalah area parkir. Komponen hanya dimuat saat tab "Templates" diklik, tidak mengganggu workspace.
Kapan boleh dikerjakan: Setelah semua 6 area core stabil dan user secara eksplisit meminta.

### Catatan 5 — PreviewMode sekarang punya score/progress tracking dasar (RESOLVED di Sprint 2)

Tanggal: 2026-05-30 (diperbarui Sprint 2)
Area: Preview / Play Mode — RESOLVED
Temuan: PreviewMode sebelumnya tidak punya score, progress, atau completion tracking. Sprint 2 sudah menambahkan: (1) Score pill dari interactive-store (earned/max), (2) Page completion dots (completed=emerald, incomplete=gray), (3) Progress bar (completed/total), (4) Replay button pada score pill. PresentMode juga diperbaiki: progress bar berbasis completion (bukan page index), score display, tombol "Ulangi". Kedua mode sekarang menunjukkan interaktivitas dasar (kuis bisa dijawab, game bisa dimainkan, score/progress terlihat).
Status: RESOLVED — PreviewMode dan PresentMode sekarang interaktif dengan score/progress/completion.

### Catatan 6 — ToolbarActions.tsx orphan file dengan AI button

Tanggal: 2026-05-30
Area: AI Generator (#1)
Temuan: `src/components/canva/toolbar/ToolbarActions.tsx` punya tombol "AI" yang dispatch `window.dispatchEvent(new CustomEvent('open-ai-assistant'))`. File ini TIDAK di-import di mana pun — toolbar baru (Toolbar.tsx) menggantikan komponen ini. File ini juga punya tombol "Play" yang menggunakan `interactive-store.openPlay()` (bukan learn mode).
Kenapa tidak dikerjakan sekarang: File orphan, tidak di-render, tidak mengganggu. AI Generator adalah area parkir.
Kapan boleh dikerjakan: Saat cleanup dead code, atau saat AI Generator diaktifkan kembali.

### Catatan 7 — PlayOverlay (interactive-store) vs LearningMediaShell (learning-media-store) dual system

Tanggal: 2026-05-30 (diperbarui Sprint 2)
Area: Dashboard Baru (#8) — terkait arsitektur
Temuan: Ada dua sistem paralel untuk mode interaktif: (1) PlayOverlay menggunakan `interactive-store` dengan score tracking sederhana, diaktifkan via `interactive-store.openPlay()`, (2) LearningMediaShell menggunakan `learning-media-store` dengan PageRuntimeContract, navigation locks, progress, completion, dan score bridge. PlayOverlay masih di-render di CanvaBuilder untuk mode present dan preview (sebagai overlay). Namun tombol "Play" di ToolbarActions (orphan) yang memanggil `openPlay()` tidak lagi digunakan — tombol "Main" baru menggunakan `setAppMode('learn')` yang masuk ke LearningMediaShell. Sprint 2 juga menambahkan score/progress di PreviewMode dan PresentMode langsung dari interactive-store (bukan via PlayOverlay), sehingga PlayOverlay semakin tidak digunakan.
Kenapa tidak dikerjakan sekarang: Kedua sistem berjalan tanpa konflik. PlayOverlay tidak aktif kecuali `interactive-store.mode === 'interactive'` yang tidak pernah diset di flow saat ini. LearningMediaShell adalah jalur utama yang sudah dikonfirmasi di Sprint 2. PreviewMode dan PresentMode sekarang punya score/progress langsung tanpa PlayOverlay.
Kapan boleh dikerjakan: Saat cleanup arsitektur setelah semua sprint selesai. PlayOverlay bisa dihapus atau digabung dengan LearningMediaShell.

### Catatan 8 — interactive-store persistence ke localStorage bisa menyebabkan stale state

Tanggal: 2026-05-30 (Sprint 3)
Area: Design System Advance (#8) — terkait data architecture
Temuan: `interactive-store` menggunakan `zustand/persist` yang menyimpan `scores`, `interactivePageIdx`, dan `replayGeneration` ke localStorage. Ini berarti skor dari sesi sebelumnya tetap ada bahkan setelah browser ditutup. Sprint 3 sudah memperbaiki dampaknya di LearningMediaShell: (1) `replayAll()` dipanggil saat mount agar sesi Learn selalu fresh, (2) `replayAll()` dipanggil di handleRestart agar tombol "Ulangi" benar-benar reset. Namun root cause (persist) masih ada — jika ada komponen lain yang membaca interactive-store tanpa reset, bisa terjadi stale state. Juga, `replayAll()` memaksa reset setiap kali Learn mode dimasuki, yang berarti progress dari PreviewMode juga hilang saat masuk Learn.
Kenapa tidak dikerjakan sekarang: Fix Sprint 3 sudah memitigasi masalah untuk Learn mode. Perubahan persistence strategy adalah refactoring arsitektur yang lebih besar.
Kapan boleh dikerjakan: Saat cleanup arsitektur setelah semua sprint selesai. Pertimbangkan: (a) hapus persist dari interactive-store, atau (b) gunakan key berbeda per session, atau (c) hanya persist saat export mode.

### Catatan 9 — scroll completionType selalu return 'completed' setelah visited

Tanggal: 2026-05-30 (Sprint 3)
Area: Design System Advance (#8) — terkait tracking
Temuan: `page-runtime-contract.ts` untuk completionType='scroll' (materi, rangkuman, skenario) langsung return 'completed' setelah halaman dikunjungi — tidak ada tracking scroll depth. Comment di code: "for now; future: track scroll depth". Ini berarti halaman materi/rangkuman dianggap selesai segera setelah dikunjungi, bukan setelah dibaca sampai bawah.
Kenapa tidak dikerjakan sekarang: Ini adalah perilaku yang diterima untuk Sprint 3. Tracking scroll depth adalah fitur tambahan yang masuk area Design System Advance. Tidak menghalangi runtime flow.
Kapan boleh dikerjakan: Setelah semua sprint selesai, sebagai peningkatan UX.

### Catatan 10 — SchemaEngine.tsx komponen React adalah dead rendering code (RESOLVED di Sprint 4)

Tanggal: 2026-05-30 (diperbarui Sprint 4)
Area: Engine Tampilan Media — RESOLVED
Temuan: `src/core/engine/SchemaEngine.tsx` mengekspor komponen React `SchemaEngine` yang membungkus `SchemaScreenRenderer`. Komponen ini membuat jalur render paralel yang tidak digunakan. Sprint 4 sudah: (1) Menghapus komponen React `SchemaEngine` dari file, hanya menyimpan re-export utility functions. (2) Me-refactor `SchemaPlayer.tsx` agar langsung menggunakan `SchemaScreenRenderer` (bukan via SchemaEngine). (3) Menghapus barrel export `SchemaEngine` dari `core/index.ts`. (4) Menghapus dead file `engine/SceneLayoutEngine.ts` (class-based legacy, tidak di-import mana pun).
Status: RESOLVED — Jalur render paralel dihapus. Semua rendering sekarang melalui SchemaScreenRenderer secara langsung (PageRenderer dan SchemaPlayer).

### Catatan 11 — GoldenPageRenderer vs ScreenShell chrome divergence

Tanggal: 2026-05-30 (Sprint 4)
Area: Design System Advance (#3) — terkait chrome consistency
Temuan: Ada dua sistem chrome yang berbeda: (1) `GoldenPageRenderer` untuk canvas mode (nav dots, phase label, contract-aware fonts/colors), (2) `ScreenShell` untuk preview/export/learn mode (section label pill, nav hint text, interactive badge, edit border). Konten (SchemaScreenRenderer) identik di kedua jalur, tapi chrome overlay berbeda secara visual dan arsitektural. Perbedaan ini BY DESIGN — canvas mode menampilkan editing tools, student-facing modes menampilkan student UI. Namun gap WYSIWYG antara yang guru lihat di canvas vs yang siswa lihat di preview bisa membingungkan.
Kenapa tidak dikerjakan sekarang: Menggabungkan dua chrome system adalah refactoring besar yang masuk area Design System Advance. Konten rendering (SchemaScreenRenderer) sudah konsisten — target Sprint 4 tercapai.
Kapan boleh dikerjakan: Saat Design System Advance diaktifkan setelah semua sprint selesai. Pertimbangkan: menjadikan ScreenShell sebagai satu-satunya chrome provider untuk semua mode, dengan isCompact mengontrol density.

### Catatan 12 — PlayOverlay di CanvaBuilder masih di-render tapi tidak aktif

Tanggal: 2026-05-30 (Sprint 4)
Area: Dashboard Baru (#8) — terkait dead code
Temuan: `PlayOverlay` masih di-render di CanvaBuilder untuk mode edit, preview, dan present. Namun PlayOverlay hanya aktif jika `interactive-store.mode === 'interactive'` yang tidak pernah diset di flow saat ini. Tombol yang memanggil `openPlay()` sudah dihapus (ToolbarActions.tsx orphan). PlayOverlay adalah dead code yang menambah bundle size.
Kenapa tidak dikerjakan sekarang: PlayOverlay tidak mengganggu fungsionalitas. Menghapusnya adalah cleanup yang tidak mempengaruhi core area.
Kapan boleh dikerjakan: Saat cleanup arsitektur setelah semua sprint selesai. PlayOverlay bisa dihapus atau digabung dengan LearningMediaShell.

### Catatan 13 — String-based export pipeline (Pipeline B) increasingly diverged from Vite export

Tanggal: 2026-05-30 (Sprint 5)
Area: Design System Advance (#3) — terkait export quality
Temuan: The string-based client-side fallback export (`src/lib/export/`) produces dramatically different output from the Vite export pipeline. It uses hardcoded CSS, no theme/contract system, no scene layout engine, simplified game logic, global state conflicts in games, and no navigation locks or completion tracking. Sprint 5 enhanced the Vite export (Pipeline A) to match LearningMediaShell's student experience with TopNavbar, BottomNav, CompletionModal, navigation locks, and score bridge. The string fallback now diverges even further. If the Vite template isn't pre-built (`npm run export:build`), users get this degraded version.
Kenapa tidak dikerjakan sekarang: The Vite export is the primary pipeline and now provides the full student experience. The string fallback is a safety net for when the Vite template is missing. Removing it or enhancing it would be either a breaking change or a significant effort that doesn't match Sprint 5 targets.
Kapan boleh dikerjakan: After all sprints complete. Consider: (a) remove string fallback entirely and require `npm run export:build`, or (b) make string fallback a minimal "content only" export with a warning, or (c) invest in bringing string export to parity (high effort).

### Catatan 14 — No sound effects in Vite export

Tanggal: 2026-05-30 (Sprint 5)
Area: Design System Advance (#3) — terkait media completeness
Temuan: Preview/Learn mode in the main app uses sound effects from `public/sounds/` for quiz correct/wrong answers, game events, and navigation. The Vite export doesn't include these sound files because the single HTML file format doesn't embed binary assets. Interactive widgets still function (quiz, game, score) but without audio feedback.
Kenapa tidak dikerjakan sekarang: Sound effects are a polish feature. The core export targets (buttons work, scores work, progress works, completion works) are all met without sound. Adding embedded audio would require converting sounds to base64 data URIs and modifying all renderer components to use them, which is a significant effort not matching Sprint 5 scope.
Kapan boleh dikerjakan: After all sprints complete. Consider: base64-encode small audio files and inject them as data URIs in the export template.

### Catatan 15 — token-compliance test failure (transition-all di renderer blocks)

Tanggal: 2026-05-30 (Core Verification)
Area: Design System Advance (#3)
Temuan: `AccordionRenderer.tsx` dan `TabIconsRenderer.tsx` menggunakan `transition-all` yang melanggar token compliance rules. Unit test `token-compliance.test.ts` gagal pada 2 assertion. Ini adalah masalah di area PARKIR (Design System Advance), bukan area core.
Kenapa tidak dikerjakan sekarang: Design System Advance adalah area parkir. Perbaikan `transition-all` ke specific transition properties adalah cosmetic polish yang tidak menghalangi fungsionalitas core.
Kapan boleh dikerjakan: Saat Design System Advance diaktifkan setelah semua sprint selesai.

### Catatan 16 — Module shadowing: BlockDefinitionRegistry.ts vs BlockDefinitionRegistry/ directory (RESOLVED)

Tanggal: 2026-05-30 (Core Verification)
Area: Engine Tampilan Media — RESOLVED
Temuan: File standalone `BlockDefinitionRegistry.ts` men-shadow directory `BlockDefinitionRegistry/index.ts`, menyebabkan hanya 31 dari 43 block types yang terdaftar. Solusi: hapus file standalone agar module resolution ke directory yang lebih lengkap.
Status: RESOLVED — File standalone dihapus, sekarang 43/43 blocks terdaftar, test 27/27 PASS.
