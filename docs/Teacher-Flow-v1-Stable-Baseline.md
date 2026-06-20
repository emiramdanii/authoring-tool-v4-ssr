# Teacher Flow v1 — Stable Baseline

**Tanggal:** 2026-06-02
**Status:** LOCKED
**Commit terakhir:** `a6a8636` (fix: add guided editor for roda game)
**Repo:** `emiramdanii/authoring-tool-v4-ssr`

---

## 1. Apa yang Sudah Stabil

### 1.1 Fondasi Aplikasi

Fondasi SILSE telah diverifikasi melalui 31 ronde audit dan fix. Item berikut berstatus PASS atau ACCEPTABLE:

| ID | Item | Status | Catatan |
|----|------|--------|---------|
| Sprint 0 | Server HTTP stability | PASS | Server hidup setelah 5+ request, API 503 sandbox, fallback OK |
| Sprint 0B | Browser chunk stability | PASS | Dashboard hydrate OK, Canvas chunks load OK |
| Sprint 1A | Workspace gutter | PASS | Gutter 16-24px, panel 20%/55%/25% |
| Sprint 1B | Teacher flow label | PASS | Navigasi label diperbaiki |
| Sprint 1C.1 | Workspace labels & AI tab | PASS | Label disederhanakan, AI tab disembunyikan |
| Sprint 1C.2 | Right panel simplification | PASS | ValidationSection dipindah, header kontekstual |
| Sprint 1D | Template entry point | PASS | Flow inta benar, presetId wired |
| Sprint 1E.1 | Left panel simplification | PASS | SchemaBlockTree menghormati teacher mode |
| Sprint 1E.2 | BottomPageStrip | PASS | Horizontal page strip di bawah canvas |
| Sprint 1E.3 | Template tab cleanup | PASS | Tab Template disembunyikan di teacher mode |
| Sprint 1E.4 | Floating add menu | PASS | Popover tambah halaman tanpa kehilangan daftar |
| Sprint 1F | Canvas readability | PASS | Readability safety layer untuk dark theme + light canvas |
| Sprint 1G | Background-based media mode | PASS | Background visual sebagai layer, overlay/scrim adaptif |
| Sprint 2A | Kuis guided editor polish | PASS | Jawaban benar A/B/C/D select |
| Sprint 2B | MateriBlok guided editor | PARTIAL PASS | 6 dari 13 tipe prioritas; showWhen conditional fields |
| Sprint R1 | Panel kanan 3 zona | PASS | Isi Utama/Tampilan/Lanjutan |
| Sprint R2 | Header konteks ganda | PASS | 3-baris: title + subtitle + description |
| P0 | Background source of truth | PASS | schema.background disatukan |
| D1/D3 | Export fallback safety | PASS | Tidak ada silent degraded export |
| D2 | Schema block update path alignment | PASS | updateSchemaBlock + applyGuidedSchemaPatch sejajar |
| D6 | createPage schema.background | PASS | Background sejak creation-time |
| D7 | Dual score store | ACCEPTABLE | Separation of concerns intentional, R7.1 stale scores fixed |
| D8 P0 | Curated filter AddBlockPanel | PASS | Teacher mode: 10 curated blocks (bukan 42) |
| D8 P1 | Fix POPULAR_BLOCK_TYPES | PASS | Selaras dengan TEACHER_ADDABLE_BLOCKS |
| D8 P2 | Rename Tambah Konten → Tambah Isi | PASS | Semua label UI diubah |
| D8 P3A | Guided editor gambar minimal | PASS | 4 field, URL tetap text (paste) |
| D8 P3B | Guided editor roda pertanyaan | PASS | 6 field, boolean toggle untuk correct |

### 1.2 Prinsip Arsitektur yang Terjaga

- **Schema sebagai Single Source of Truth**: Semua konten disimpan di `page.schema.blocks`, bukan di store terpisah
- **GuidedFormEditor sebagai satu-satunya jalur edit guru**: Guru tidak pernah jatuh ke SchemaDrivenEditor mentah untuk 10 curated blocks
- **Don't show feature to teacher if not fully usable**: Fitur yang belum vertical slice lengkap tidak dimunculkan di teacher mode
- **Export source of truth**: Path A (Vite SSR) adalah satu-satunya jalur export resmi; tidak ada silent fallback
- **Overflow awareness**: Edit yang melebihi kapasitas halaman terdeteksi dan diperingatkan

---

## 2. Flow Guru Sekarang

Flow guru (teacher mode / sederhana mode) dari awal sampai export:

### 2.1 10 Langkah Flow Guru

```
1. Dashboard → Pilih Template (preset PPkKn, MTK, IPA, PJOK)
2. Edit Media → Masuk workspace Canvas
3. Tambah Halaman → Pilih tipe halaman (Materi, Kuis, Diskusi, dll.)
4. Tambah Isi → Klik blok dari 10 curated blocks
5. Edit Isi → GuidedFormEditor muncul di panel kanan
6. Atur Tampilan → Section "Tampilan" (collapsed) untuk warna/icon
7. Preview → Klik Preview untuk melihat hasil
8. Navigasi Halaman → BottomPageStrip atau panel kiri
9. Atur Background → Section background di panel kanan
10. Export HTML → Tombol export di toolbar
```

### 2.2 Detail Setiap Langkah

**Langkah 1 — Pilih Template:** Guru membuka Dashboard, memilih template dari galeri preset. Setiap preset sudah terisi konten bermakna (bukan kosong). Template yang tersedia: PPkKn (Macam Norma, Misi Penjelajah Pancasila, dll.), MTK, IPA, PJOK.

**Langkah 2 — Masuk Workspace:** Setelah pilih template, guru masuk ke Canvas workspace. Layout 3-panel (kiri/kanan/toolbar) langsung terlihat. Di sederhana mode, panel kiri menampilkan daftar halaman, panel kanan menampilkan GuidedFormEditor, dan BottomPageStrip di bawah canvas untuk navigasi cepat.

**Langkah 3 — Tambah Halaman:** Guru klik tombol tambah halaman, memilih tipe (Materi, Kuis, Diskusi, Game, Refleksi, dll.). Setiap halaman baru langsung terisi konten default yang bermakna — tidak ada canvas kosong. Source: `createDefaultSchemaForTemplateType()` → `BLOCK_DEFINITIONS[type].createDefault()`.

**Langkah 4 — Tambah Isi:** Guru klik tab "Tambah Isi" di panel kiri. Muncul daftar 10 curated blocks yang sudah dikelompokkan: "Isi & Materi" (materi-section, def-box, gambar) dan "Interaktif" (kuis, diskusi, refleksi, sortir-game, roda-game, rangkuman, motivasi). Ada juga grid "Paling Sering Digunakan" untuk akses cepat.

**Langkah 5 — Edit Isi:** Setelah blok ditambahkan dan dipilih, panel kanan menampilkan GuidedFormEditor. Header 3-baris: title (bold), subtitle (kontekstual), description (statis per tipe). Field-field dikelompokkan di section "Isi Utama" (terbuka) dan "Tampilan" (collapsed). Semua edit langsung tersimpan ke schema.

**Langkah 6 — Atur Tampilan:** Section "Tampilan" berisi field visual (warna border, accent color, ikon). Default collapsed supaya tidak mengganggu, tapi guru bisa buka jika perlu. Hanya muncul di block type yang punya field visual.

**Langkah 7 — Preview:** Guru klik tombol Preview di toolbar. Mode preview menampilkan media interaktif persis seperti siswa akan melihat. Score dimulai dari 0 (replayAll on mount). Navigasi halaman via keyboard atau swipe.

**Langkah 8 — Navigasi Halaman:** BottomPageStrip di bawah canvas memungkinkan navigasi cepat. Panel kiri juga menampilkan daftar halaman yang bisa diklik. SceneNavigator di canvas untuk navigasi antar scene.

**Langkah 9 — Atur Background:** Saat halaman dipilih (bukan blok), panel kanan menampilkan pengaturan halaman termasuk background. Guru bisa upload gambar, atur overlay (gelap/terang/gradien), transparansi, dan blur. Konten tetap terbaca di atas gambar background.

**Langkah 10 — Export HTML:** Guru klik tombol Export di toolbar. Export menggunakan Vite SSR + React ExportApp (Path A). Jika gagal, error ditampilkan jelas (bukan silent degraded export). Hasil export parity dengan preview.

---

## 3. Fitur yang Sudah Layak Dipakai

### 3.1 Daftar 10 Blok Curated (TEACHER_ADDABLE_BLOCKS)

| # | Block Type | Nama | Ikon | Personality | Guided Editor | Grup Sederhana |
|---|-----------|------|------|-------------|--------------|----------------|
| 1 | `materi-section` | Bagian Materi | 📖 | understanding | ✅ | Isi & Materi |
| 2 | `def-box` | Kotak Definisi | 📦 | understanding | ✅ | Isi & Materi |
| 3 | `gambar` | Gambar | 🖼️ | understanding | ✅ (P3A) | Isi & Materi |
| 4 | `kuis` | Kuis | 📝 | assessment | ✅ | Interaktif |
| 5 | `diskusi` | Diskusi | 💬 | discussion | ✅ | Interaktif |
| 6 | `refleksi` | Refleksi | 🪞 | reflection | ✅ | Interaktif |
| 7 | `sortir-game` | Game Sortir | 🔀 | assessment | ✅ | Interaktif |
| 8 | `roda-game` | Roda Pertanyaan | 🎡 | assessment | ✅ (P3B) | Interaktif |
| 9 | `rangkuman` | Rangkuman | 📋 | reflection | ✅ | Interaktif |
| 10 | `motivasi` | Motivasi / Apersepsi | 💡 | reflection | ✅ | Interaktif |

### 3.2 Guided Editor Detail per Block

**materi-section** — Field: title (text, required). Note: konten dalam materi-section berupa nested SchemaBlock array, terlalu kompleks untuk guided form sederhana. Guided editor saat ini hanya expose title.

**def-box** — Field: content (richtext, required), borderColor (color, select). Sections: Isi Utama (content), Tampilan (borderColor, collapsed).

**gambar** — Field: title (text), url (text, required — paste URL), caption (textarea), accentColor (color, default 'c'). Sections: Isi Utama (title, url, caption), Tampilan (accentColor, collapsed). ImageUploader integration ditunda.

**kuis** — Field: title (text, required), questions[] (array, maxItems:1) dengan subfield: q (textarea, required), opts[] (array, maxItems:4, flat string), ans (select A/B/C/D), ex (textarea). Section: Isi Utama.

**diskusi** — Field: title (text, required), intro (textarea), questions[] (array, maxItems:3) dengan subfield: label (text), icon (icon), teks (textarea, required), petunjuk (textarea). Section: Isi Utama.

**refleksi** — Field: title (text, required), intro (textarea), questions[] (array, maxItems:3) dengan subfield: teks (textarea, required), petunjuk (textarea), icon (icon). Section: Isi Utama.

**sortir-game** — Field: title (text, required), pool (array), kolom (array). Section: Isi Utama.

**roda-game** — Field: title (text, required), questions[] (array, maxItems:6) dengan subfield: q (textarea, required), opts[] (array, maxItems:4) dengan text (text, required) + correct (boolean), feedbackCorrect (text), feedbackWrong (text), diskusiHint (text, optional). Section: Isi Utama. Field yang TIDAK dimunculkan: stepMode, currentQuestionIndex, variant, accentColor (renderer tidak membaca).

**rangkuman** — Field: title (text), concepts[] (array, maxItems:4) dengan icon, title, body, color, closingStatement (textarea). Section: Isi Utama.

**motivasi** — Field: title (text), hookQuestion (textarea, required). Section: Isi Utama.

### 3.3 Fitur Pendukung yang Stabil

- **Teacher mode toggle**: Guru bisa switch antara sederhana dan lengkap
- **Terminologi ramah guru**: "Isi" bukan "Block", "Tambah Isi" bukan "Tambah Konten"
- **Panel kanan 3 zona**: Isi Utama (terbuka), Tampilan (collapsed), Lanjutan (collapsed)
- **Header konteks ganda**: Title + subtitle + description di panel kanan
- **Background image + overlay**: Upload, overlay adaptif (gelap/terang/gradien), readability guaranteed
- **Export HTML**: Vite SSR + React ExportApp, parity dengan preview
- **BottomPageStrip**: Navigasi cepat di bawah canvas
- **Floating add menu**: Tambah halaman tanpa kehilangan konteks
- **Readability safety**: Warna konten adaptif saat dark theme di light canvas
- **Score replay**: Preview/Present mode dimulai dari 0, tidak ada stale scores
- **Overflow detection**: Warning saat konten melebihi kapasitas halaman
- **Undo/redo**: History tracking untuk semua schema edits
- **Auto-save**: Perubahan tersimpan otomatis ke localStorage

---

## 4. Fitur yang Diparkir

### 4.1 Diparkir — Sprint 3 (Butuh Vertical Slice Besar)

| Fitur | Alasan | Estimasi Scope |
|-------|--------|---------------|
| **D8 P3C — Gambar Interaktif / Hotspot** | Block baru `hotspot-image`, butuh renderer baru + export parity + ~13 file. X/Y manual berisiko membingungkan guru. Prinsip: jangan tampilkan fitur ke teacher mode jika belum full vertical slice. | ~13 file termasuk renderer, guided editor, export, registry |

### 4.2 Ditunda — Follow-up Polish

| Fitur | Alasan | Prioritas |
|-------|--------|-----------|
| **diskusi label/icon** | Guided editor belum expose label dan icon per pertanyaan secara optimal | Tinggi (sering dipakai) |
| **refleksi warna/icon** | Sama seperti diskusi, field visual belum optimal di guided editor | Tinggi (sering dipakai) |
| **kuis opts schema fallback** | Opsi kuis pakai flat string array, bukan object array — bisa improvement | Sedang |
| **roda-game jawaban benar A/B/C/D** | Boolean toggle untuk `correct` sudah berfungsi tapi A/B/C/D selector lebih ramah guru | Sedang |
| **ImageUploader integration** | Perlu tipe field baru `'image'` di GuidedFieldDef, sentuh guided-field-renderer | Sedang |
| **materi-blok guided editor** | 7 tipe belum didukung: compare, studi, tabel, timeline, gambar, kutipan, statistik | Rendah |
| **materi-section konten** | Guided editor hanya expose title; konten nested terlalu kompleks untuk form sederhana | Rendah |

### 4.3 Ditunda — Arsitektur / Tech Debt

| Fitur | Alasan | Prioritas |
|-------|--------|-----------|
| **useScoreBridge() hook** | Bridge code duplicate di Shell & ExportApp — extract ke hook | Rendah |
| **accentColor di materi-blok** | Field ada di guided editor (forward compat) tapi renderer belum membaca | Rendah |
| **Cover preset metadata** | Cover preset tidak mengambil project metadata (title, kelas, semester) | Rendah |
| **Client-side export cleanup** | `exportClientSide()` masih tersedia tapi ditandai "DEGRADED" | Rendah |

### 4.4 Blok yang Sengaja TIDAK Ditampilkan di Teacher Mode

| Block Type | Alasan |
|-----------|--------|
| `hotspot-image` | Belum ada block schema (P3C — Sprint 3) |
| `cover`, `tp`, `petunjuk`, `penutup` | Page-level — ditambah via Tambah Halaman |
| `ftab`, `nc-grid`, `nk-card`, `tabel-accord` | Terlalu teknis untuk guru |
| `memory-game`, `matching-game`, `crossword-game`, dll. | Game minor — bisa diakses via advanced mode |
| `materi-blok` | addable:false (internal container) |

---

## 5. Risiko Tersisa

### 5.1 Risiko Tinggi

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| **Export Vite SSR gagal di production** | Guru tidak bisa export media. Error message sudah jelas, tapi tetap blocking. | Pastikan `npm run export:build` jalan sebelum deploy. Monitor error rate. |
| **Overflow content tidak tertangani di semua edge case** | Halaman bisa terlihat terpotong di preview/export. Overflow detection aktif untuk 'warn' policy, tapi 'auto-split' masih risiko. | Manual QA setiap template. Test halaman panjang. |

### 5.2 Risiko Sedang

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| **MateriBlok hanya 6/13 tipe** | Guru yang butuh tipe kutipan/gambar/compare/tabel di materi-blok tidak bisa edit via guided form — jatuh ke SchemaDrivenEditor di lengkap mode. | Sprint 2C: tambah tipe prioritas. Sementara, guru bisa switch ke lengkap mode. |
| **Gambar hanya paste URL** | Guru harus tahu cara dapat URL gambar — tidak ada upload file di guided editor. | Sprint 2C: ImageUploader integration. Sementara, bisa upload di background section. |
| ~~**Roda-game correct = boolean toggle**~~ | ~~Guru harus toggle setiap opsi untuk menandai jawaban benar, bukan langsung pilih A/B/C/D.~~ | ✅ CLOSED (Sprint 8.7B): `exclusiveToggle` radio button A/B/C/D. Schema unchanged. |
| **Cover preset tidak ambil metadata project** | Cover yang dibuat dari preset tidak otomatis terisi judul/kelas dari metadata. | Low impact — guru bisa edit manual via guided editor. |

### 5.3 Risiko Rendah

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| **Dual score store bridge duplicate** | Code duplication di LearningMediaShell & ExportApp. Tidak berdampak fungsional. | Extract `useScoreBridge()` hook saat ada waktu. |
| **accentColor di materi-blok dead field** | Field ada di guided editor tapi renderer tidak membaca. Tidak crash, hanya membingungkan. | Catat di P3 backlog. Hapus atau implement di renderer. |
| **Legacy background fields masih ada** | `bgColor`, `bgDataUrl`, `overlay` tetap ada di page object. Tidak berdampak — schema.background adalah source of truth. | Perlahan migrasi saat ada kesempatan. |

---

## 6. Roadmap Sprint Berikutnya

### Sprint 2C — Guided Editor Lanjutan (CLOSED via Sprint 8.7A/8.7B)

**Tujuan:** Polish guided editor untuk fitur yang paling sering dipakai guru.

**Status: CLOSED** — Semua item dikerjakan di Sprint 8.7A (flow gate + ledger sync)
dan Sprint 8.7B (guided editor polish).

**Urutan prioritas (paling sering dipakai dulu):**

1. ✅ **diskusi label/icon** — Sudah ada di GUIDED_EDITOR_REGISTRY (label, icon, teks, petunjuk, color). Guard test di `guided-editor-polish.test.ts`.
2. ✅ **refleksi warna/icon** — `warna` field ditambahkan ke guided editor di Sprint 8.7B. Icon sudah ada sebelumnya. Renderer sudah membaca `q.warna`.
3. ⏸️ **kuis opts schema fallback** — Sengaja TIDAK diubah. Senior review: "jangan ubah besar kalau tidak perlu." Opts tetap `string[]`, ans tetapat `number`. Guard test memverifikasi tidak ada regresi.
4. ✅ **roda-game jawaban benar A/B/C/D** — `exclusiveToggle` radio button ditambahkan di Sprint 8.7B. Schema unchanged (`opts[].correct: boolean`). UI: klik opsi → set true + siblings false.

**Estimasi:** Selesai. CI run `27863757407` — 3/3 jobs success.

### Sprint 3 — Gambar Interaktif / Hotspot

**Tujuan:** Tambah block baru `hotspot-image` dengan full vertical slice.

**Kontrak:** FROZEN di `docs/HOTSPOT-IMAGE-CONTRACT.md` (Sprint 8.8A / 3A).

**Sub-sprints:**
- **Sprint 3A (8.8A):** Pre-Hotspot Contract + Roadmap Sync — kontrak ini, roadmap sync, guard tests
- **Sprint 3B (8.8B):** Hotspot Image Minimal Vertical Slice — implementasi block type + renderer + guided editor + export parity

**Scope 3B:**
- Block schema definition (`blocks.ts`) — sesuai kontrak
- Guided editor (`guided-patch.ts`) — preset posisi 3×3, bukan raw X/Y
- Renderer baru (`HotspotImageRenderer.tsx`) — gambar + hotspot + kartu
- Export parity via PageRenderer mode="export" (otomatis via Style Contract)
- Registry entry (`SceneRegistry.tsx` / `BlockDefinitionRegistry`)
- AddBlockPanel entry (`TEACHER_ADDABLE_BLOCKS`) — hanya setelah semua siap
- ~8-10 file total (lebih kecil dari estimasi awal 13 file)

**Catatan:** X/Y manual berisiko membingungkan guru. Kontrak 3A memutuskan:
V1 pakai preset posisi 3×3 grid. Visual picker click-on-image ditunda ke Sprint 4.

### Sprint 4 — Polish UI + QA Export

**Tujuan:** Final polish sebelum release ke guru.

**Scope:**
- ImageUploader integration (tipe field `'image'`)
- MateriBlok tipe sisa (kutipan, gambar, compare, tabel, timeline, statistik)
- Cover preset metadata auto-fill
- QA export menyeluruh (semua template, semua block type, semua browser)
- Performance audit (bundle size, load time, memory)
- Accessibility audit (keyboard navigation, screen reader, contrast)

### Urutan yang Aman

```
Sprint 2C (polish) ✅ CLOSED via 8.7A/8.7B
→ Manual test guru ✅ Gate tests di flow-guru-gate.test.ts (8.7A)
→ Sprint 3A (8.8A) — Pre-Hotspot Contract + Roadmap Sync ✅ THIS SPRINT
→ Sprint 3B (8.8B) — Hotspot Image Minimal Vertical Slice (NEXT)
→ Manual test guru
→ Sprint 4 (final polish + QA)
```

**Sebelum mulai Sprint 2C:** Jalankan minimal 1 kali uji manual guru melalui flow lengkap:

```
Dashboard → pilih template → Edit Media → tambah halaman
→ Tambah Isi → tambah 10 blok curated → Edit panel kanan
→ Preview → Export HTML
```

Jika flow ini aman, lanjut sprint berikutnya. Jika ada bug, fix dulu sebelum tambah fitur baru.

---

## Lampiran A — Commit History Relevan

| Commit | Deskripsi | Ronde |
|--------|-----------|-------|
| `677e2df` | fix: add guided editor for image block (gambar) | Ronde 30 (D8 P3A) |
| `a6a8636` | fix: add guided editor for roda game | Ronde 31 (D8 P3B) |

Commits sebelumnya tercatat di `CORE_VERIFICATION_REPORT.md`.

## Lampiran B — File Kunci

| File | Peran |
|------|-------|
| `src/core/schema/guided-patch.ts` | GUIDED_EDITOR_REGISTRY — definisi field per block type |
| `src/components/canva/left-panel/AddBlockPanel.tsx` | TEACHER_ADDABLE_BLOCKS, POPULAR_BLOCK_TYPES |
| `src/components/canva/right-panel/block-properties/GuidedFormEditor.tsx` | Renderer guided form |
| `src/components/canva/right-panel/block-properties/guided-field-renderer.tsx` | Field renderer (text, textarea, select, array, dll.) |
| `src/core/i18n/teacher-terminology.ts` | Terminologi ramah guru |
| `src/store/canva/schema-crud-slice.ts` | updateSchemaBlock — core write path |
| `src/lib/use-vite-export.ts` | Export source of truth (Path A) |
| `CORE_VERIFICATION_REPORT.md` | Log audit lengkap 31 ronde |

## Lampiran C — Terminologi Teacher Mode

| Istilah Teknis | Istilah Guru (Sederhana) |
|---------------|--------------------------|
| Block | Isi |
| SchemaBlock | Isi |
| Tambah Konten | Tambah Isi |
| Composite Block | Isi Gabungan |
| Konten & Materi (grup) | Isi & Materi |
| Konten lainnya (grup) | Isi lainnya |

---

**Dokumen ini adalah baseline resmi. Semua perubahan baru harus diuji terhadap baseline ini.**
