# 🎯 MPI v5.Z — Master Plan

> Versi: 1.3 | Terakhir diperbarui: 5 Mei 2026  
> Lokasi project: `/home/z/my-project/authoring-tool-v3/`  
> Dev server: `localhost:3000` | Gateway: `port 81`

---

## 📋 Daftar Isi

1. [Visi Produk](#1-visi-produk)
2. [Arsitektur Utama](#2-arsitektur-utama)
3. [Design System](#3-design-system)
4. [Template System](#4-template-system)
5. [Canvas & Module Positioning](#5-canvas--module-positioning)
6. [Play Preview Overlay](#6-play-preview-overlay)
7. [Export Slideshow Interaktif](#7-export-slideshow-interaktif)
8. [Kondisi Export Saat Ini](#8-kondisi-export-saat-ini)
9. [Quiz & Game Widget](#9-quiz--game-widget)
10. [Flow Guru (Teacher Workflow)](#10-flow-guru-teacher-workflow)
11. [Halaman Hasil (Results Page)](#11-halaman-hasil-results-page)
12. [Backlog & Prioritas](#12-backlog--prioritas)
13. [Riwayat Diskusi & Keputusan](#13-riwayat-diskusi--keputusan)

---

## 1. Visi Produk

**MPI v5.Z** adalah authoring tool untuk guru Indonesia yang memungkinkan pembuatan materi pembelajaran interaktif tanpa coding. Guru cukup pilih template → isi konten → preview → export.

### Prinsip Utama
- **Template = 1 Paket Komplit** — layout, styling, posisi, background, dan interaksi sudah included
- **Guru cuma klik ▶ Play** — tidak perlu paham teknis, tinggal isi konten dan preview
- **Export = Pengalaman Play** — apa yang dilihat di Play Preview, itulah yang siswa dapat di export

---

## 2. Arsitektur Utama

### Tech Stack
| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| State Management | Zustand (multi-store) |
| Styling | Tailwind CSS + CSS Variables (design tokens) |
| Canvas | Custom canvas system (drag, resize, free position) |
| Export | Inline HTML generation (no server) |
| Gateway | Caddy (port 81 → localhost:3000) |

### Store Architecture
| Store | File | Tanggung Jawab |
|-------|------|---------------|
| `authoring-store` | `src/store/authoring-store.ts` | Meta, CP, TP, ATP, Alur, Skenario, Kuis, Materi |
| `canva-store` | `src/store/canva-store.ts` | Pages[], elements[], currentPage, goPage(), exportPageHTML(), exportSlideshowHTML() |
| `interactive-store` *(NEW)* | `src/stores/interactive-store.ts` | Scores tracking, reportScore(), totalScore(), resetAll() |

### Konsep: Same Store, Dual Renderer
```
canva-store (data yang sama)
    ├── Design Mode  → Canvas dengan drag, panel, toolbar
    └── Play Mode    → Full-screen overlay, elemen dirender interaktif
```
Data store tidak berubah, yang berubah hanya cara merender.

---

## 3. Design System

### Design Tokens (CSS Variables)
```css
--bg:   #0e1c2f;    /* Background utama */
--bg2:  #13243a;    /* Background sekunder */
--card: #182d45;    /* Card/panel background */
--y:    #f9c12e;    /* Yellow — aksen utama */
--c:    #3ecfcf;    /* Cyan — info/secondary */
--r:    #ff6b6b;    /* Red — error/danger */
--p:    #a78bfa;    /* Purple — game/quiz */
--g:    #34d399;    /* Green — success */
--o:    #fb923c;    /* Orange — warning */
--text: #e8f2ff;    /* Text utama */
--muted:#6e90b5;    /* Text secondary */
```

### Screen Types
| Tipe | Kode | Deskripsi |
|------|------|-----------|
| Cover | `s-cover` | Halaman sampul pertemuan |
| Cap Pembelajaran | `s-cp` | Tujuan/cap pembelajaran |
| Subkompetensi | `s-sk` | Sub-kompetensi |
| Modules | `s-modules` | Daftar modul/materi |
| Materi | `s-materi` | Konten materi detail |
| Kuis | `s-kuis` | Kuis interaktif |
| Hasil | `s-hasil` | Hasil & skor |

---

## 4. Template System

### Tipe Template
| Template | Deskripsi | Layout Variants |
|----------|-----------|-----------------|
| CoverTemplate | Halaman sampul | A, B, C, D |
| DokumenTemplate | Dokumen teks | A, B, C, D |
| MateriTemplate | Konten materi | A, B, C, D |
| KuisTemplate | Kuis interaktif | A, B, C, D |
| GameTemplate | Game interaktif | A, B, C, D |
| HasilTemplate | Hasil & skor | A, B, C, D |
| HeroTemplate | Hero section | A, B, C, D |
| SkenarioTemplate | Skenario interaktif | A, B, C, D |

### Prinsip Template
- **1 Template = 1 Paket Komplit** — design + layout + posisi + background + interaksi
- Guru TIDAK perlu desain dari awal
- Kuis dan game menggunakan widget yang sudah ada (QuizWidget, GameWidget)
- Template hanya mengatur tata letak dan styling, widget tetap sama

---

## 5. Canvas & Module Positioning

### Sistem: Free Position + Layout Presets
- Modul ditempatkan secara **free position** di canvas (drag & drop)
- Guru bisa atur posisi modul di mana saja di halaman
- **Layout Presets** (NEW): 10 layout preset untuk cepat mengatur posisi elemen
- **Snap-to-Grid** (NEW): Elemen otomatis snap ke grid saat drag/resize

### Layout Presets
| Preset | Icon | Deskripsi | Slot |
|--------|------|-----------|------|
| Bebas | ✋ | Posisi bebas | — |
| Penuh | ⬜ | 1 elemen memenuhi halaman | 1 |
| Headline | 📰 | Judul atas + konten bawah | 2 |
| Sidebar | 📐 | Main + sidebar kanan | 2 |
| 2 Kolom | ▥ | Dua kolom sejajar | 2 |
| 3 Kolom | ▤ | Tiga kolom sejajar | 3 |
| Kuis | ❓ | Header kecil + area kuis besar | 2 |
| Media + Teks | 🖼️ | Media kiri, teks kanan | 2 |
| 2×2 Grid | ⊞ | Empat kuadran | 4 |
| Hero + CTA | 🚀 | Hero besar + tombol CTA | 2 |

### Grid & Snap System
| Fitur | Deskripsi |
|-------|-----------|
| Grid Overlay | Garis grid transparan di canvas (toggle on/off) |
| Grid Size | 2%–20% (default 5%) |
| Snap-to-Grid | Elemen otomatis snap ke grid saat drag/resize |
| Visual | Grid hanya muncul di Design Mode, tidak di export |

### Background System
| Tipe Background | Deskripsi |
|-----------------|-----------|
| Upload Image | Gambar custom sebagai background |
| Solid Color | Warna solid |
| Gradient | Gradien warna |
| Overlay | Overlay di atas gambar |

### Roadmap Positioning
- ✅ **Phase 1**: Free position
- ✅ **Phase 2**: Layout presets (10 preset layout untuk posisi modul)
- ✅ **Phase 3**: Snap-to-grid (grid overlay + snap saat drag/resize)

### Konsep: Background Pre-made Content
- Guru bisa upload PDF/gambar yang sudah berisi materi sebagai background
- Modul interaktif (kuis, game, tombol) ditempatkan di atas background tersebut
- Ini memungkinkan guru menggunakan materi yang sudah jadi + tambahkan interaktivitas

---

## 6. Play Preview Overlay

### Konsep
**BUKAN mode toggle** — melainkan overlay full-screen yang muncul di atas canvas. Canvas tidak tersentuh.

```
┌─────────────────────────────────┐
│         Canvas (Design)         │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │    ▶ Play Preview         │  │  ← Tombol di Toolbar
│  │       Overlay             │  │
│  │                           │  │
│  │  ◀ ▶ Nav    Score: 85    │  │  ← Navigation bar
│  │  ● ● ● ○ ○              │  │  ← Page dots
│  │                           │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### Mengapa Overlay (bukan Mode Toggle)?
| Kriteria | Mode Toggle | Play Overlay |
|----------|-------------|--------------|
| Risiko | Tinggi — harus toggle seluruh UI state | Rendah — canvas tidak tersentuh |
| Kompleksitas | ~2 hari kerja | ~1 hari kerja |
| Bug potential | Tinggi — drag/panel bisa broken | Minimal — overlay mandiri |
| UX | Perlu switch mode bolak-balik | Klik ▶ Play, klik ✕ tutup |
| Maintenance | Sulit — dua mode harus sync | Mudah — overlay terpisah |

### Komponen yang Sudah Dibuat ✅

#### 6.1 Interactive Store (`interactive-store.ts`) ✅
```typescript
interface InteractiveState {
  // Mode
  mode: 'design' | 'interactive';
  openPlay: () => void;
  closePlay: () => void;

  // Navigation
  interactivePageIdx: number;
  goInteractivePage: (idx: number) => void;
  nextInteractivePage: () => void;
  prevInteractivePage: () => void;

  // Scores
  scores: ScoreEntry[];
  reportScore: (entry) => void;
  resetAllScores: () => void;

  // Computed
  totalScore: () => number;
  totalMax: () => number;
  totalPct: () => number;
  pageScore: (pageIndex: number) => { score: number; max: number };
  isPageComplete: (pageIndex: number) => boolean;
  allPagesComplete: () => boolean;
}
```

#### 6.2 ▶ Play Button (di Toolbar) ✅
- Posisi: Toolbar kanan atas
- Aksi: `openPlay()` dari `useInteractiveStore` → buka PlayOverlay
- Style: Button dengan ikon ▶, warna accent (emerald)

#### 6.3 PlayOverlay Component ✅
- Full-screen overlay (`fixed inset-0 z-50 bg-zinc-950`)
- Mount di `CanvaBuilder.tsx` sebagai child terakhir
- Conditional render: hanya muncul saat `mode === 'interactive'`
- PlayCanvas: ResizeObserver untuk responsive scaling
- Keyboard: Escape tutup, ArrowLeft/Right navigasi, Space next
- PlayElement: Quiz/Game dirender interaktif dengan `onComplete` callback

#### 6.4 InteractiveNav Component ✅
- Bar navigasi di bawah overlay
- Komponen:
  - ◀ Previous / ▶ Next button
  - Page dots dengan ikon template (🏠📋📝❓🎮🏆🚀🎭)
  - Completion indicator (green dot) pada halaman yang sudah dikerjakan
  - Score badge: `🏆 85% 12/14`
  - Page counter: `3/8`
  - 🔄 Reset Skor & Ulangi button
- Progress bar gradient (emerald → cyan)

#### 6.5 Wiring QuizWidget → Score Store ✅
- QuizWidget sudah punya `onComplete` prop bawaan
- PlayElement menghubungkan `onComplete` ke `interactive-store.reportScore()`
- `scoreReported = useRef(false)` mencegah double-reporting
- Tambah callback `onComplete(score, max)` saat kuis selesai
- PlayOverlay menghubungkan callback ini ke `interactive-store.reportScore()`

#### 6.6 Wiring GameWidget → Score Store ✅
- GameWidget sudah punya `onComplete` prop bawaan
- 7 dari 9 game mengirim onComplete (truefalse, memory, matching, sorting, teambuzzer, wordsearch, flashcard)
- 2 game tanpa scoring (roda, spinwheel — spinner berbasis keberuntungan)
- PlayElement menghubungkan `onComplete` ke `interactive-store.reportScore()`
- Tambah callback `onComplete(score, max)` saat game selesai
- PlayOverlay menghubungkan ke `interactive-store.reportScore()`

### Status Play Preview: ✅ SELESAI

---

## 7. Export Slideshow Interaktif

### Konsep
Export semua halaman canva sebagai **1 file HTML** dengan pengalaman yang sama persis dengan Play Preview Overlay.

```
Export HTML (1 file)
├── Slide 1: Cover
├── Slide 2: CP/TP
├── Slide 3: Materi
├── Slide 4: Kuis ← interaktif, skor tercatat
├── Slide 5: Game ← interaktif, skor tercatat
├── Slide 6: Hasil ← baca total skor dari JS
└── Nav Bar: ◀ ▶ ● ● ● Score Badge
```

### Upgrade yang Sudah Dikerjakan ✅

#### 7.1 Hasil Page Conic-Gradient + Level Labels ✅
- Circle dengan `conic-gradient` animasi berdasarkan skor
- Level label dinamis: Sangat Baik (≥85%), Baik (≥70%), Perlu Latihan (>0%)
- Appreciation legend: 3 level dots (🟢 Sangat Baik, 🟡 Baik, 🔴 Perlu Latihan)
- `updateHasil()` mengupdate conic-gradient, level label, dan detail text

#### 7.2 Direct Score Reporting dari Quiz/Game ✅
- Quiz engine sekarang langsung memanggil `reportScore(slideIdx, score, max)` saat selesai
- TrueFalse game engine juga memanggil `reportScore()` saat selesai
- Double insurance: MutationObserver (`initScoreBridge`) + direct `reportScore` call

#### 7.3 Touch/Swipe + Responsive Scaling ✅
- `scaleSlide()` function: responsive scaling berdasarkan viewport
- Touch/swipe: swipe left → next, swipe right → prev (threshold: 50px)
- Window resize handler: otomatis rescale saat window berubah
- `#slide-wrap` container untuk flexible layout

#### 7.4 Fitur Export yang Sudah Ada (dari sebelumnya)
- ✅ Navigation bar (prev/next, dots, score badge, progress bar)
- ✅ Page label dengan template type
- ✅ Keyboard navigation (ArrowLeft/ArrowRight)
- ✅ MutationObserver-based score bridge
- ✅ `updateHasil()` yang update hasil page DOM

### Status Export Upgrade: ✅ SELESAI

---

## 8. Kondisi Export Saat Ini

### Export Modes yang Ada
| Mode | Fungsi | Format | Scope | Interaktif? |
|------|--------|--------|-------|-------------|
| 🎓 Export HTML Siswa | `generateExportHtml()` | 1 HTML | 1 pertemuan (format lama) | ✅ Kuis + skor + hasil |
| 🎞 Canva Slideshow | `exportSlideshowHTML()` | 1 HTML | Semua halaman canva | ✅ Kuis + 12 game + skor + hasil |
| 🎨 Canva Single Page | `exportPageHTML()` | 1 HTML | 1 halaman saja | ✅ Kuis/game jalan |
| 🖨 Cetak Dokumen Admin | `generatePrintAdminHtml()` | Print | Dokumen admin | ❌ |
| 📋 JSON | Full state dump | .json | Full state | ❌ |
| 📊 Excel | 6-sheet template | .xlsx | META/CP/TP/ATP/ALUR/KUIS | ❌ |

### Gap yang Perlu Di-bridge
```
TARGET:    exportSlideshowHTML() → navigasi ✅, skor ✅, hasil ✅
           = Sama persis dengan Play Preview Overlay ✅ DONE
```

### Key Files Export
| File | Isi |
|------|-----|
| `src/lib/export-html.ts` | `generateExportHtml()`, `generatePrintAdminHtml()` |
| `src/lib/render-module-html.tsx` | `renderModuleToStyledHTML()` — 28+ module types |
| `src/store/canva-store.ts` | `exportPageHTML()`, `exportSlideshowHTML()` |
| `public/exporter.js` | Legacy v1.0 (tidak dipakai v3) |

---

## 9. Quiz & Game Widget

### QuizWidget
- ✅ Sudah interaktif: klik jawaban, scoring, auto-advance, result screen
- ✅ Sudah punya `onComplete(score, max)` callback

### GameWidget — 12 Game Types
| Game | Play Preview | Export Engine | onComplete? |
|------|-------------|---------------|------------|
| TrueFalse | ✅ | ✅ | ✅ Accuracy-based |
| Memory | ✅ | ✅ | ✅ Participation |
| Matching | ✅ | ✅ | ✅ Participation |
| Sorting | ✅ | ✅ | ✅ Participation |
| WordSearch | ✅ | ✅ | ✅ Participation |
| Flashcard | ✅ | ✅ | ✅ Participation |
| TeamBuzzer | ✅ | ✅ | ✅ Variable scoring |
| Roda | ✅ | ✅ Interactive SVG spin | ❌ No scoring (random) |
| SpinWheel | ✅ | ✅ Interactive SVG spin | ❌ No scoring (random) |
| Crossword | ✅ | ✅ | ✅ Participation |
| FillBlank | ✅ | ✅ | ✅ Accuracy-based |
| DragDrop | ✅ | ✅ | ✅ Participation |

### Export Game Engines Architecture
| File | Role |
|------|------|
| `src/lib/export-game-engines.ts` | CSS + JS for all 13 engines (quiz + 12 games) |
| `src/store/canva-store.ts` → `exportSlideshowHTML()` | GAMEDATA generation + engine injection |
| `src/store/canva-store.ts` → `renderTemplateExportHTML()` | HTML containers for quiz & game pages |

**GAMEDATA structure**: `{ quizzes: {pageIdx: [...]}, truefalse: {"pageIdx-gameIdx": {...}}, ... }`
**Engine ID pattern**: `{prefix}-engine-{pageIdx}-{gameIdx}` (e.g., `tf-engine-3-0`)
**Score reporting**: Each engine calls `reportScore(pageIdx, score, max)` on completion

### Wiring Plan
```
QuizWidget.onComplete(score, max)  →  interactive-store.reportScore(elId, score, max)
GameWidget.onComplete(score, max)  →  interactive-store.reportScore(elId, score, max)
                                         ↓
                                   scores: { [elId]: {score, max} }
                                         ↓
                                   totalScore() → { earned, possible }
                                         ↓
                                   Hasil page baca totalScore()
```

---

## 10. Flow Guru (Teacher Workflow)

### 4 Langkah Sederhana

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  DESIGN  │ →  │  PLAY    │ →  │  EDIT    │ →  │  SHARE   │
│          │    │ PREVIEW  │    │          │    │ (EXPORT) │
│ Pilih    │    │ Klik ▶   │    │ Koreksi  │    │ Download │
│ Template │    │ Cek flow │    │ Konten   │    │ 1 HTML   │
│ Isi      │    │ Test     │    │          │    │ Bagikan  │
│ Konten   │    │ kuis/game│    │          │    │ ke siswa │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### Detail Per Step

**1. DESIGN** — Guru pilih template & isi konten
- Pilih template dari galeri (Cover, Materi, Kuis, Game, Hasil)
- Isi konten: teks, gambar, soal kuis, game settings
- Atur posisi modul via drag & drop (free position)
- Upload background custom (opsional)

**2. PLAY PREVIEW** — Guru klik ▶ Play untuk preview
- Overlay full-screen muncul
- Guru bisa navigasi antar halaman
- Test kuis dan game — skor tercatat
- Cek halaman hasil — skor total terakumulasi
- Klik ✕ untuk kembali ke canvas

**3. EDIT** — Guru koreksi berdasarkan preview
- Kembali ke canvas, edit konten
- Ulangi Play Preview sampai puas

**4. SHARE (EXPORT)** — Guru export & bagikan
- Klik 🎞 Export Slideshow Interaktif
- 1 file HTML terdownload
- Pengalaman siswa = pengalaman Play Preview
- Bagikan via LMS, WA, atau USB

---

## 11. Halaman Hasil (Results Page)

### Di Play Preview
- Membaca `interactive-store.totalScore()`
- Menampilkan: skor total, persentase, bintang/feedback
- Real-time update saat kuis/game diselesaikan

### Di Export HTML
- Membaca `getTotalScore()` dari inline JS
- Menampilkan: skor total, persentase, bintang/feedback
- Update otomatis saat semua kuis/game selesai

### Komponen Hasil
| Elemen | Deskripsi |
|--------|-----------|
| Skor Angka | `85/100` besar di tengah |
| Persentase | `85%` |
| Bintang | ⭐⭐⭐ (0-5 berdasarkan persentase) |
| Feedback | Pesan motivasi berdasarkan skor |
| Detail | Breakdown per kuis/game |

---

## 12. Backlog & Prioritas

### 🔴 P1 — Must Have (Sprint Ini)
| # | Task | Estimasi | Status |
|---|------|----------|--------|
| 1 | Buat `interactive-store.ts` | 30 menit | ✅ Selesai |
| 2 | Tambah ▶ Play button di Toolbar | 15 menit | ✅ Selesai |
| 3 | Build PlayOverlay component | 2 jam | ✅ Selesai |
| 4 | Build InteractiveNav component | 1 jam | ✅ Selesai |
| 5 | Wire QuizWidget → score store | 45 menit | ✅ Selesai |
| 6 | Wire GameWidget → score store | 45 menit | ✅ Selesai |
| 7 | Hasil page baca live score | 30 menit | ✅ Selesai |
| 8a | Export: Hasil page conic-gradient + level labels | 45 menit | ✅ Selesai |
| 8b | Export: Fix score bridge (direct reportScore) | 30 menit | ✅ Selesai |
| 8c | Export: Touch/swipe + responsive scaling | 45 menit | ✅ Selesai |

### 🟡 P2 — Nice to Have (Sprint Berikutnya)
| # | Task | Estimasi | Status |
|---|------|----------|--------|
| 10 | ✅ Interactive game engines di export (quiz + 12 game types) | 3 jam | ✅ Selesai |
| 11 | Layout presets untuk module positioning | 3 jam | ✅ Selesai |
| 12 | Snap-to-grid (opsional) | 2 jam | ✅ Selesai |
| 13 | Export progress indicator | 1 jam | ✅ Selesai |
| 14 | Template galeri UI improvement | 2 jam | ✅ Selesai |
| 15 | Roda/SpinWheel interactive di export (CSS rotation animation) | 2 jam | ✅ Selesai |
| 16 | ✅ Efisiensi: Extract shared constants (GAME_TYPES, MATERI_MODULE_TYPES) | 30 menit | ✅ Selesai |
| 17 | ✅ Efisiensi: Extract getHeroData helper (reduce 3x duplication) | 15 menit | ✅ Selesai |
| 18 | ✅ Efisiensi: Optimize exportSlideshowHTML (direct slide build, no regex transform) | 1 jam | ✅ Selesai |
| 19 | ✅ Efisiensi: Remove duplicate quiz CSS in export HTML | 15 menit | ✅ Selesai |
| 20 | ✅ Efisiensi: Replace JSON.parse/stringify with structuredClone for undo/redo | 15 menit | ✅ Selesai |
| 21 | ✅ Efisiensi: Add history push for nudgeSelected (undo support) | 10 menit | ✅ Selesai |

### 🟢 P3 — Future
| # | Task | Estimasi | Status |
|---|------|----------|--------|
| 14 | Multi-pertemuan export (gabung beberapa pertemuan) | 4 jam | ⬜ |
| 15 | SCORM export untuk LMS | 6 jam | ⬜ |
| 16 | Analytics dashboard (tracking siswa) | 8 jam | ⬜ |
| 17 | Collaborative editing (real-time) | 12 jam | ⬜ |

---

## 13. Riwayat Diskusi & Keputusan

### Keputusan Penting

| # | Topik | Keputusan | Alasan |
|---|-------|-----------|--------|
| D1 | Mode Toggle vs Play Overlay | **Play Overlay** | Lebih efisien (~1 hari vs ~2 hari), risiko rendah, canvas tidak tersentuh |
| D2 | Module Positioning | **Free Position dulu** | Paling fleksibel, layout presets bisa ditambah nanti |
| D3 | Template Definition | **1 Paket Komplit** | Guru tidak perlu desain dari awal, semua sudah included |
| D4 | Quiz/Game dari Template | **Reuse existing widgets** | Tidak build dari nol, widget sudah jadi dan tested |
| D5 | Export Format | **1 HTML file (Interactive Slideshow)** | Siswa cukup buka 1 file, pengalaman = Play Preview |
| D6 | Background Pre-made | **Hybrid** | Free position + bisa upload background yang sudah ada materi |
| D7 | Export Alignment | **Export = Play Preview** | Konsistensi pengalaman, tidak ada gap antara preview dan export |

### Riwayat Perbaikan (Session Sebelumnya)
- ✅ 38 TypeScript errors fixed
- ✅ Export bugs fixed
- ✅ P1/P2 bugs fixed
- ✅ All pushed to git

---

## 📎 Quick Reference

### Key File Paths
```
src/store/canva-store.ts          → Canvas state, pages, export functions
src/store/authoring-store.ts      → Authoring data (meta, CP, TP, ATP, etc.)
src/stores/interactive-store.ts   → (NEW) Score tracking for Play mode
src/components/canva/Toolbar.tsx   → Toolbar with export & play buttons
src/components/canva/PlayOverlay.tsx → (NEW) Full-screen play preview
src/components/canva/InteractiveNav.tsx → (NEW) Navigation for play mode
src/lib/export-html.ts            → Export HTML functions
src/lib/render-module-html.tsx    → Module-to-HTML renderer
src/components/widgets/QuizWidget.tsx → Quiz interactive widget
src/components/widgets/GameWidget.tsx → Game interactive widget (9 games)
```

### Development Commands
```bash
# Start dev server
npm run dev

# Build production
npm run build

# Check TypeScript
npx tsc --noEmit

# Git
git add . && git commit -m "feat: description"
git push
```

---

> **Catatan**: Master plan ini hidup — update seiring progress dan keputusan baru.
