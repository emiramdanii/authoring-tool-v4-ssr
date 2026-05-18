# SILSE — Masterplan Produksi
## Structured Interactive Learning Scene Engine
### "PowerPoint Interaktif untuk Guru Indonesia"

---

## 0. Identitas Produk

| Atribut | Nilai |
|---------|-------|
| **Nama** | SILSE — Structured Interactive Learning Scene Engine |
| **Tagline** | PowerPoint Interaktif untuk Guru Indonesia |
| **Target** | Guru Indonesia (SD/SMP/SMA/SMK) |
| **Ukuran Scene** | 1280×720 (fixed, landscape) |
| **Paradigma** | Content-First, Schema-Driven, Pedagogical by Design |
| **Formula** | 70% Smart Blocks + Interaksi, 20% Komposisi/Layout, 10% Visual Dekorasi |

**SILSE bukan HTML editor.** SILSE adalah mesin presentasi interaktif pendidikan.
Guru isi konten → Engine yang desain → Siswa interaksi → Pembelajaran terstruktur.

---

## 1. Arsitektur 4 Mode

SILSE memiliki 4 mode operasi yang masing-masing punya UI chrome berbeda:

| Mode | Tujuan | UI Chrome |
|------|--------|-----------|
| **EDIT** | Menyusun scene & block | Full: Sidebar + Toolbar + Right Panel + Stage |
| **PREVIEW** | Melihat hasil seperti siswa | Minimal: Stage saja, floating controls |
| **PRESENT** | Proyektor ke siswa | Fullscreen: 1280×720, navigasi keyboard |
| **EXPORT** | Bagikan file | Dialog: format, opsi, progress bar |

### State Machine

```
EDIT ←→ PREVIEW ←→ PRESENT
  ↓                     ↓
EXPORT ←─────────────── EXPORT
```

- **EDIT → PREVIEW**: Tombol "Preview" di toolbar (shortcut: `P`)
- **PREVIEW → EDIT**: Tombol "Back to Edit" / `Esc`
- **PREVIEW → PRESENT**: Tombol "Full Screen" / `F5`
- **PRESENT → EDIT**: `Esc` (2x konfirmasi)
- **Any → EXPORT**: Tombol "Export" / `Ctrl+E`

### Mode Switching Rules

1. EDIT adalah mode default saat membuka project
2. Mode disimpan di URL query (`?mode=edit|preview|present`) agar bisa share link
3. Setiap mode punya keyboard shortcut map sendiri
4. EXIT dari PRESENT selalu kembali ke EDIT (bukan PREVIEW)
5. EXPORT bukan mode permanen — setelah selesai, kembali ke mode sebelumnya

---

## 2. Layout System (Mode EDIT)

```
┌──────────────────────────────────────────────────────────┐
│  TOOLBAR (minimal, contextual)                           │
├────────┬─────────────────────────────────┬───────────────┤
│        │                                 │               │
│ SCENE  │      STAGE VIEWPORT             │   CONTEXT     │
│ PANEL  │      (1280×720 zoom-to-fit)     │   PANEL      │
│        │                                 │               │
│ 240px  │         flex-1                  │   280px       │
│        │                                 │               │
│ scene  │   ┌─────────────────────┐       │  contextual   │
│ list   │   │  1280×720 Scene     │       │  to selected  │
│ +      │   │  (scale to fit)     │       │  block/scene  │
│ add    │   └─────────────────────┘       │               │
│        │                                 │               │
├────────┴─────────────────────────────────┴───────────────┤
│  STATUS BAR (zoom, scene info, mode indicator)           │
└──────────────────────────────────────────────────────────┘
```

### Scene Panel (Kiri) — 240px
- Daftar scene dengan thumbnail kecil
- Drag-reorder scene
- Tombol "+" untuk tambah scene (buka template picker)
- Klik scene → load di stage
- Selected scene = highlight + border accent

### Context Panel (Kanan) — 280px
- **Kontekstual**: Berubah berdasarkan seleksi
- Tidak ada block → tampilkan Scene Properties
- Block terpilih → tampilkan Block Properties
- Multiple blocks → tampilkan Alignment Tools
- Tab: Properties | Style | AI Bantuan

### Toolbar (Atas) — Minimal
- Bukan "Adobe toolbar" dengan 50 tombol
- Hanya: Logo | Mode Switch | Scene Navigation | Quick Actions | Export
- Contextual group muncul hanya saat relevan

### Stage (Tengah)
- Viewport 1280×720 yang di-scale agar fit
- Zoom control di status bar
- Scene preview real-time
- Block selection overlay saat mode EDIT

---

## 3. Smart Block System — Block Personalities

Block dikelompokkan berdasarkan **niat pedagogis** (bukan kategori teknis):

### 🔵 Kelompok 1: MEMBANGUN PEMAHAMAN (Understanding)
*"Siswa perlu memahami konsep ini"*

| Block | Personality | Varian | Deskripsi |
|-------|------------|--------|-----------|
| `def-box` | 📖 Definisi | A | Kotak definisi formal |
| `materi-section` | 📚 Materi | A | Bagian materi utama |
| `nk-card` | 🏛️ Norma | A | Kartu norma detail |
| `nc-grid` | 📊 Grid Norma | A | Grid kartu norma |
| `ftab` | 🔖 Tab Fungsi | A | Konten bertab |
| `tabel-accord` | 📋 Tabel | A | Tabel accordion |
| `tujuan-display` | 🎯 Tujuan | A | Tampilan tujuan |

### 🟢 Kelompok 2: MENGEMBANGKAN DISKUSI (Discussion)
*"Siswa perlu berdiskusi dan berkolaborasi"*

| Block | Personality | Varian | Deskripsi |
|-------|------------|--------|-----------|
| `diskusi` | 💬 Diskusi | A/B | Prompt diskusi terstruktur |
| `skenario` | 🎭 Skenario | A | Studi kasus / situasi |
| `compare` | ⚖️ Perbandingan | A | Side-by-side comparison |
| `timeline` | 📅 Alur Waktu | A | Kronologi peristiwa |

### 🟡 Kelompok 3: MENDALAMKAN REFLEKSI (Reflection)
*"Siswa perlu merenung dan merefleksi"*

| Block | Personality | Varian | Deskripsi |
|-------|------------|--------|-----------|
| `refleksi` | 🪞 Refleksi | A/B | Prompt refleksi |
| `motivasi` | ✨ Motivasi | A | Kutipan motivasi |
| `rangkuman` | 📝 Rangkuman | A/B/C | Ringkasan materi |

### 🔴 Kelompok 4: MENGUKUR PEMAHAMAN (Assessment)
*"Siswa perlu diuji pemahamannya"*

| Block | Personality | Varian | Deskripsi |
|-------|------------|--------|-----------|
| `kuis` | ❓ Kuis | A | Soal kuis interaktif |
| `fill-blank-game` | ✏️ Isian | A | Lengkapi kalimat |
| `true-false-game` | ✅ Benar-Salah | A | Pernyataan B/S |
| `drag-drop-game` | 🎯 Seret-Letakkan | A | Cocokkan drag & drop |
| `matching-game` | 🔗 Pasangkan | A | Cocokkan pasangan |
| `sortir-game` | 📊 Urutkan | A | Sortir urutan |
| `word-search-game` | 🔍 Cari Kata | A | Teka-teki kata |
| `crossword-game` | 🧩 Teka Silang | A | Crossword puzzle |
| `team-buzzer-game` | 🏆 Kuis Tim | A | Kuis berbasis tim |

### ⚡ Kelompok 5: MENGHIDUPKAN KELAS (Activation)
*"Siswa perlu aktivitas menyenangkan"*

| Block | Personality | Varian | Deskripsi |
|-------|------------|--------|-----------|
| `flashcard-set` | 🃏 Kartu Kilat | A | Flashcard interaktif |
| `roda-game` | 🎡 Roda | A | Roda keberuntungan |
| `memory-game` | 🧠 Memory | A | Game mencocokkan gambar |
| `reveal` | 🎁 Reveal | A | Konten tersembunyi |

### 🏗️ Kelompok 6: MEMBANGUN STRUKTUR (Structure)
*"Saya perlu kerangka presentasi"*

| Block | Personality | Varian | Deskripsi |
|-------|------------|--------|-----------|
| `cover` | 🎬 Cover | A/B/C | Halaman pembuka |
| `hero` | 🌟 Hero | A/B/C | Banner besar |
| `petunjuk` | 📌 Petunjuk | A | Instruksi penggunaan |
| `tp` | 🎯 Tujuan | A | Tujuan pembelajaran |
| `alur` | 🗺️ Alur | A | Alur kegiatan |
| `hasil` | 📊 Hasil | A | Hasil pembelajaran |
| `penutup` | 🏁 Penutup | A | Halaman penutup |

### 70-20-10 Formula Implementation

```
70% — Smart Blocks + Interaksi (Kelompok 1-5)
20% — Komposisi & Layout (Kelompok 6 + positioning)
10% — Visual Dekorasi (warna, font, dekorasi tema)
```

AddBlockPanel menampilkan kelompok 1-5 sebagai **rekomendasi utama**,
kelompok 6 sebagai "Struktur & Navigasi" di bawah.

---

## 4. Content-First Design

### Prinsip Utama
**Guru isi konten, engine yang desain.**

### Implementasi

1. **Auto-Beautification**: Setiap block punya default styling yang sudah bagus
   - Guru tidak perlu pilih font size, padding, border — semuanya auto
   - Yang guru atur: teks konten, gambar, pilihan jawaban
   - Engine yang handle: layout, spacing, typography, color harmony

2. **Content-First Block Properties**:
   - Tab pertama di Right Panel selalu: **Konten** (teks, media, pilihan)
   - Tab kedua: **Tampilan** (varian, warna aksen) — minimal
   - Tab ketiga: **Tata Letak** (posisi, ukuran) — advance, tersembunyi default

3. **Smart Defaults per Template**:
   - Setiap Course Template punya preset warna & font yang konsisten
   - Block yang ditambahkan otomatis ikut tema template
   - Override hanya jika guru explicitly ingin custom

4. **Zero-Config Blocks**:
   - Tambah block → langsung tampil bagus dengan placeholder konten
   - Contoh: Tambah "Definisi" → muncul kotak biru elegan dengan "Tulis definisi di sini..."
   - Guru tinggal klik teks → edit → selesai

---

## 5. Structured Template System — 3 Level

### Level 1: Course Template (Template Kursus)
**"Satu file PDF, satu Course Template"**

Course Template adalah blueprint lengkap alur pembelajaran:

```
Course Template = Scene[] + Theme + Metadata
```

Contoh Course Template:
- **Modul PPKn Kelas 7**: 12 scene, tema biru-merah, alur: Cover → TP → Motivasi → Materi×4 → Diskusi → Kuis → Refleksi → Penutup
- **Modul IPA Kelas 8**: 10 scene, tema hijau-biru, alur: Cover → TP → Skenario → Materi×3 → Eksperimen → Kuis → Rangkuman
- **Template Kosong**: Hanya Cover + Penutup, guru bebas menambahkan

Setiap Course Template punya:
- **Scene sequence** yang direkomendasikan
- **Theme preset** yang konsisten
- **Block suggestions** per scene
- **Metadata**: mata pelajaran, kelas, semester, KD

### Level 2: Scene Template (Template Scene)
**"Satu halaman, satu Scene Template"**

Scene Template adalah blueprint satu scene:

```
Scene Template = Block[] + Layout + Scene-level style
```

Contoh Scene Template:
- **Scene Materi**: tp + materi-section + def-box
- **Scene Diskusi**: hero-text + diskusi + refleksi
- **Scene Kuis**: petunjuk + kuis + hasil
- **Scene Pembuka**: cover + tp + motivasi

### Level 3: Block Preset (Preset Block)
**"Satu block, beberapa gaya"**

Block Preset adalah varian styling block:

```
Block Preset = Variant + Style Override + Content Template
```

Contoh Block Preset:
- **Definisi — Formal**: border kiri tebal, font serif, background biru muda
- **Definisi — Modern**: card style, shadow, icon buku
- **Definisi — Minimal**: garis bawah judul, tanpa background
- **Diskusi — Think-Pair-Share**: 3 kolom prompt
- **Diskusi — Debat**: 2 sisi pro/kontra

### Template Wizard (Alur Guided)

```
┌──────────────────────────────────────────┐
│  🧙 Template Wizard                      │
│                                          │
│  Step 1: Pilih Mata Pelajaran            │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│  │PPKn │ │ IPA │ │ MTK │ │ B.Ind│      │
│  └─────┘ └─────┘ └─────┘ └─────┘      │
│                                          │
│  Step 2: Pilih Kelas & Semester          │
│  [Kelas 7▼] [Semester 1▼]              │
│                                          │
│  Step 3: Pilih Course Template           │
│  ┌────────────────────────────┐         │
│  │ 📘 Modul PPKn 7.1         │ ←       │
│  │ 12 scenes • Biru-Merah    │         │
│  │ Cover→TP→Materi→...→Tutup │         │
│  └────────────────────────────┘         │
│  ┌────────────────────────────┐         │
│  │ 📗 Modul PPKn 7.2         │         │
│  │ 10 scenes • Hijau-Biru    │         │
│  └────────────────────────────┘         │
│  ┌────────────────────────────┐         │
│  │ 📄 Template Kosong         │         │
│  │ 2 scenes • Bebas tema      │         │
│  └────────────────────────────┘         │
│                                          │
│  Step 4: Isi Info Dasar                  │
│  Judul: [___________________]           │
│  Guru:  [___________________]           │
│  Sekolah:[__________________]           │
│                                          │
│  [← Kembali]  [Buat Project →]         │
└──────────────────────────────────────────┘
```

Setelah wizard selesai → Buka editor dalam mode EDIT
dengan semua scene template sudah terisi placeholder konten.
Guru tinggal klik-teks-edit per block.

---

## 6. Design System

### Prinsip Visual

1. **Bukan Adobe**: Tidak ada panel property yang menakutkan
2. **Canva-grade friendly**: Klik → Edit → Selesai
3. **Pedagogical cues**: Warna block mengikuti kelompok pedagogis
   - 🔵 Pemahaman → Biru
   - 🟢 Diskusi → Hijau
   - 🟡 Refleksi → Kuning
   - 🔴 Assessment → Merah
   - ⚡ Aktivasi → Ungu
   - 🏗️ Struktur → Abu-abu
4. **Indonesian-first**: Semua label, placeholder, tooltip dalam Bahasa Indonesia

### Warna Block Personality

```css
--block-understanding: #3B82F6;  /* blue-500 */
--block-discussion:   #22C55E;  /* green-500 */
--block-reflection:   #EAB308;  /* yellow-500 */
--block-assessment:   #EF4444;  /* red-500 */
--block-activation:   #A855F7;  /* purple-500 */
--block-structure:    #6B7280;  /* gray-500 */
```

### Typography

- **Scene title**: 24px, Noto Sans SC Bold
- **Block title**: 18px, Noto Sans SC SemiBold
- **Body text**: 14px, Noto Sans SC Regular
- **Caption/hint**: 12px, Noto Sans SC Light

### Spacing

- Scene internal padding: 48px horizontal, 36px vertical
- Block gap: 16px
- Block internal padding: 20px

---

## 7. Execution Plan — Fase Implementasi

### Phase F-1: UI Redesign (Week 1)
**Tujuan**: Layout baru Canva-style + mode architecture

| Task | File | Status |
|------|------|--------|
| F-1.1 | Buat `AppMode` type & state di store | ✅ |
| F-1.2 | Refactor `CanvaBuilder.tsx` ke layout 3-column | ✅ |
| F-1.3 | Refactor `LeftPanel.tsx` → ScenePanel (scene-only) | ✅ |
| F-1.4 | Refactor `RightPanel.tsx` → ContextPanel (contextual) | ✅ |
| F-1.5 | Simplify `Toolbar.tsx` → minimal contextual toolbar | ✅ |
| F-1.6 | Tambah mode PREVIEW overlay | ✅ |
| F-1.7 | Tambah mode PRESENT fullscreen | ✅ |
| F-1.8 | Mode switching keyboard shortcuts | ✅ |
| F-1.9 | URL-based mode state (`?mode=edit|preview|present`) | ✅ |
| F-1.10 | Status bar (zoom, scene info, mode) | ✅ |

### Phase F-2: Smart Block Library (Week 2)
**Tujuan**: Block grouping pedagogis + content-first

| Task | File | Status |
|------|------|--------|
| F-2.1 | Definisikan `BlockPersonality` enum & mapping | ✅ |
| F-2.2 | Tambah `personality` field ke BlockDefinitionRegistry | ✅ |
| F-2.3 | Refactor `AddBlockPanel.tsx` → pedagogical groups | ✅ |
| F-2.4 | Content-first property tab order | ✅ |
| F-2.5 | Zero-config block defaults (beautiful placeholders) | ✅ |
| F-2.6 | Block personality color coding | ✅ |
| F-2.7 | Smart block suggestions per scene type | ✅ |

### Phase F-3: Mode Architecture (Week 2-3)
**Tujuan**: Full 4-mode system

| Task | File | Status |
|------|------|--------|
| F-3.1 | Mode state machine implementation | ✅ |
| F-3.2 | EDIT mode: Full chrome layout | ✅ |
| F-3.3 | PREVIEW mode: Stage-only + floating nav | ✅ |
| F-3.4 | PRESENT mode: Fullscreen + keyboard nav | ✅ |
| F-3.5 | EXPORT mode: Dialog with format options | ✅ |
| F-3.6 | Mode-specific keyboard shortcuts | ✅ |
| F-3.7 | Mode transition animations | ✅ |

### Phase F-4: Template Wizard (Week 3-4)
**Tujuan**: 3-level template system + wizard UI

| Task | File | Status |
|------|------|--------|
| F-4.1 | Definisikan `CourseTemplate` schema | ✅ |
| F-4.2 | Definisikan `SceneTemplate` schema | ✅ |
| F-4.3 | Definisikan `BlockPreset` schema | ✅ |
| F-4.4 | Buat `CourseTemplateRegistry` | ✅ |
| F-4.5 | Buat Template Wizard UI (4-step) | ✅ |
| F-4.6 | Wizard → auto-populate scenes with templates | ✅ |
| F-4.7 | Scene template picker di ScenePanel | ✅ |
| F-4.8 | Block preset switcher di ContextPanel | ✅ |
| F-4.9 | Template metadata (mapel, kelas, semester, KD) | ✅ |

---

## 8. Prinsip Development

1. **Schema is King**: Semua perubahan UI harus melewati schema, bukan DOM langsung
2. **Component-Driven**: shadcn/ui first, custom only jika tidak ada yang cocok
3. **Composition > Duplication**: Abstraksi via composition, bukan copy-paste
4. **Indonesian-First**: Semua string user-facing dalam Bahasa Indonesia
5. **Zero-Config by Default**: Block langsung bagus tanpa konfigurasi
6. **Progressive Disclosure**: Basic dulu, advance tersembunyi
7. **Type Safety**: Zod schema untuk semua data, strict TypeScript
8. **Performance**: Lazy-load game renderers, virtual scrolling untuk scene list

---

## 9. Metrics Sukses

| Metric | Target |
|--------|--------|
| Guru bisa buat presentasi 12 scene dalam < 15 menit | ✅ |
| Zero config: tambah block → langsung bagus | ✅ |
| Template wizard: 4 step → project siap edit | ✅ |
| Mode switch: < 200ms | ✅ |
| Present mode: smooth fullscreen di proyektor | ✅ |
| Build size: < 500KB first load | ✅ |

---

*Dokumen ini adalah masterplan terpadu dari 4 vision message: Product Identity, UX Structure, Design System + Smart Blocks, dan Template System. Semua fase saling terkait dan dieksekusi berurutan.*
