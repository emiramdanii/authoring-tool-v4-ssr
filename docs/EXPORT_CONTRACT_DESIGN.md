# EXPORT CONTRACT DESIGN

> Sprint 8.2S-1 — Design Doc (IMPLEMENTATION: Sprint 8.2C)
>
> Status: DESIGN — belum diimplementasi
>
> Tujuan: bekukan kontrak export HTML SEBELUM implementasi wiring
> (Sprint 8.2C). Keputusan terlambat dapat merombak renderer dan
> asset pipeline.

## Latar Belakang

Authoring tool ini menghasilkan media pembelajaran interaktif yang
akhirnya diputar oleh siswa. Target deployment utama: **Rumah
Belajar / lokal sekolah / offline**. Karena itu export HTML harus
memenuhi gate offline: tanpa internet, buka file HTML, semua
halaman tampil, gambar tampil, interaksi berjalan, navigation
berjalan, tidak ada request eksternal wajib.

## Keputusan Kontrak (DESIGN — perlu disetujui sebelum 8.2C)

| Pertanyaan | Proposal | Alasan |
|---|---|---|
| HTML standalone atau tidak? | **STANDALONE** — single `.html` file | Memudahkan distribusi guru ke siswa (tidak perlu zip) |
| Font embedded atau fallback? | **EMBEDDED** (base64 woff2) untuk display + body font | Konsistensi visual di environment tanpa internet |
| Gambar data URL atau file terpisah? | **DATA URL** (base64) untuk gambar <2MB; **EXTERNAL URL** untuk gambar besar | Hindari HTML >50MB yang crash browser |
| External CDN boleh? | **TIDAK** — semua harus inline atau data URL | Target offline |
| Audio/video bagaimana? | **DATA URL** untuk audio <5MB; **EXTERNAL URL** untuk video | Video besar tidak realistis di-inline |
| Ukuran maksimum HTML? | **50MB** (warning) / **100MB** (hard limit) | Browser dapat crash di atas 100MB |
| Browser target? | Chrome 100+, Edge 100+, Firefox 100+, Safari 15+ | Cakupan sekolah Indonesia |
| Service worker boleh? | **TIDAK** untuk single-file HTML; boleh untuk SCORM package | Service worker butuh origin, tidak jalan di `file://` |
| JavaScript framework runtime? | **INLINE React + ReactDOM** ( production build) atau **vanilla JS rewrite**? | TBD — perlu benchmark ukuran |
| Interactive widgets (quiz/game)? | **INLINE** sebagai web component atau preact component | Harus berjalan tanpa React dev server |

## Format Output

### 1. Single HTML (default)

```text
project-name.html
├── <head>
│   ├── <meta charset="utf-8">
│   ├── <meta name="viewport" content="...">
│   ├── <title>...</title>
│   ├── <style> /* all CSS inline */ </style>
│   └── <script> /* all JS inline, no external */ </script>
└── <body>
    └── <div id="root"> /* pre-rendered HTML + runtime hydration */ </div>
```

### 2. SCORM 1.2 package (opsional, untuk LMS)

```text
project-name-scorm.zip
├── imsmanifest.xml
├── index.html  (sama seperti single HTML)
├── api/
│   └── scorm-api.js
└── assets/
    └── (hanya jika ada gambar besar yang tidak di-inline)
```

### 3. PDF (render via Playwright headless, future)

Tidak masuk scope 8.2C.

## Asset Pipeline

```text
Source:                     Output:
page.schema.blocks[]     →  pre-rendered HTML + hydration data
page.bgDataUrl (base64)  →  <img src="data:..." /> atau <div style="background:url(data:...)">
page.schema.background   →  CSS background inline
interactive widget state →  JSON di <script type="application/json" id="widget-data">
quiz/game logic          →  inline JS module
```

## Gate Offline (Acceptance 8.2C)

```text
Skenario: tanpa internet
1. Buka file HTML via file:// atau double-click
2. Semua halaman tampil
3. Gambar tampil
4. Interaksi (quiz, game, navigation) berjalan
5. Tidak ada request eksternal wajib
6. Tidak ada error di console (warning boleh)
7. Browser tidak crash
```

## Batasan

- Tidak boleh import modul external saat runtime (tidak ada `import` di script).
- Tidak boleh pakai CDN (Google Fonts, unpkg, jsdelivr, dll).
- Tidak boleh pakai Web Worker yang load external script.
- Tidak boleh pakai `<iframe src="http://...">` (hanya `about:blank` atau sandbox).
- Tidak boleh pakai `<link rel="stylesheet" href="http://...">` (hanya inline).

## Test Plan

```text
fixtures/projects/
├── golden-pertemuan.json          (proyek lengkap dengan gambar)
├── macam-norma-legacy.json        (proyek legacy dengan bg image)
├── fresh-mission-adventure.json   (proyek baru preset)
├── interactive-quiz.json          (kuis kompleks)
└── image-background-large.json    (gambar besar, test batas data URL)

Test:
- export-to-html.test.ts: export → validasi HTML structure
- export-offline.test.ts: load HTML di jsdom, cek tidak ada fetch ke external
- export-size.test.ts: cek ukuran HTML < 50MB warning, < 100MB hard limit
- export-parity.test.ts: rendered HTML sama dengan preview (screenshot diff)
```

## Status Implementasi

```text
Sprint 8.2S-1: DESIGN doc (ini)
Sprint 8.2C:   implementasi export HTML pipeline
Sprint 8.5:    SCORM package + PDF (jika diprioritaskan)
```

## Pertanyaan Terbuka

1. **React runtime inline atau rewrite?** React production build (~45KB gzip) inline atau rewrite ke vanilla JS?
   - Inline React: lebih cepat implementasi, ukuran +45KB
   - Vanilla rewrite: ukuran lebih kecil, tapi refaktor besar
2. **Image lazy loading?** Gambar besar perlu lazy load?
3. **Print stylesheet?** PDF export via browser print atau Playwright headless?

Keputusan ditangguhkan ke Sprint 8.2C planning.

## Referensi

- `KNOWN_ISSUES.md` EXPORT-001
- `src/core/renderer/SchemaRenderer.tsx` (existing renderer, perlu adaptasi)
- `vite.export.config.ts` (existing Vite single-file build config, perlu integrasi)
- `src/app/api/export/route.ts` (existing export API endpoint, perlu update)
