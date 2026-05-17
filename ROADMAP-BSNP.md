# Roadmap Media Pembelajaran Interaktif

> **Prinsip**: Media pembelajaran, bukan modul pembelajaran.
> Flow searah, remedial serahkan ke guru.
> Lean & praktis — hindari over-engineering.
>
> **Dibuat**: 9 Mei 2026 | **Update**: 18 Mei 2026

---

## ✅ Phase 11: Navigation Button System (SELESAI)
- [x] Buat komponen `TemplateNavButton` yang reusable
- [x] Tambah nav button ke DokumenTemplate
- [x] Tambah nav button ke MateriTemplate
- [x] Tambah nav button ke KuisTemplate (setelah kuis selesai)
- [x] Tambah nav button ke GameTemplate (interactive mode)
- [x] Perbaiki PetunjukTemplate — "Lanjut" di step terakhir jadi navigasi halaman
- [x] Perbaiki DiskusiTemplate — "Lanjut" di pertanyaan terakhir jadi navigasi halaman
- [x] Perbaiki RefleksiTemplate — "Lanjut" di pertanyaan terakhir jadi navigasi halaman
- [x] Perbaiki SkenarioTemplate — tambah "Lanjut" saat skenario completed
- [x] Perbaiki HeroTemplate — fallback CTA jika td.cta kosong
- [x] Perbaiki HasilTemplate — nav button walau tanpa skor
- [x] Build & test semua perubahan

---

## Phase 17: Sound Effect + Pertemuan Tag (Fondasi)

> Diskusi 10 Mei 2026: Sound effect belum ada, pertemuan tag perlu untuk
> organisasi konten. Keduanya fondasi untuk fitur lain.

### 17.1 Sound Effect — Inline, Bukan Sistem Terpisah

**Prinsip**: Tidak perlu SoundManager class. Cukup helper function + file audio.

**Suara yang diperlukan**:
| Event | File | Kapan |
|-------|------|-------|
| Jawaban benar | `correct.mp3` | QuizWidget jawab benar |
| Jawaban salah | `incorrect.mp3` | QuizWidget jawab salah |
| Kuis selesai | `complete.mp3` | QuizWidget phase=result |
| Klik tombol navigasi | `click.mp3` | TemplateNavButton, MulaiButton |
| Klik tombol pilihan | `tap.mp3` | SkenarioTemplate pilih, GameWidget |
| Skenario benar | `ding.mp3` | Skenario good choice |
| Skenario salah | `buzz.mp3` | Skenario bad choice |

**Implementasi**:
```typescript
// src/lib/sounds.ts — simple helper
const cache = new Map<string, HTMLAudioElement>();

export function playSound(id: string) {
  const suara = useAuthoringStore.getState().suara;
  if (!suara[id as keyof typeof suara]) return; // cek config
  
  let audio = cache.get(id);
  if (!audio) {
    audio = new Audio(`/sounds/${id}.mp3`);
    cache.set(id, audio);
  }
  audio.currentTime = 0;
  audio.volume = 0.3;
  audio.play().catch(() => {});
}
```

**SuaraConfig yang sudah ada** (tinggal aktifkan):
```typescript
interface SuaraConfig {
  navigasi: boolean;  // → click.mp3
  benar: boolean;     // → correct.mp3
  salah: boolean;     // → incorrect.mp3
  selesai: boolean;   // → complete.mp3
  klik: boolean;      // → tap.mp3
  skor: boolean;      // → ding.mp3 (skor tinggi)
}
```

**Task**:
- [x] Buat `src/lib/sounds.ts` (helper function)
- [x] Buat `public/sounds/` + 7 file audio (free SFX, <30KB each)
- [x] Tambah `playSound('correct')` di QuizWidget saat jawab benar
- [x] Tambah `playSound('incorrect')` di QuizWidget saat jawab salah
- [x] Tambah `playSound('complete')` di QuizWidget phase=result
- [x] Tambah `playSound('click')` di TemplateNavButton + MulaiButton
- [x] Tambah `playSound('tap')` di SkenarioTemplate pilihan + GameWidget
- [x] Tambah `playSound('ding')` / `playSound('buzz')` di SkenarioTemplate feedback
- [x] Tambah toggle suara di Toolbar (gunakan SuaraConfig yang sudah ada)

### 17.2 Pertemuan Tag di KuisItem

**Alasan**: Tanpa tag pertemuan, soal kuis tidak bisa diorganisir per pertemuan.
Ini fondasi untuk auto-generate per pertemuan nanti.

**Perubahan minimal**:
```typescript
interface KuisItem {
  // Yang sudah ada (JANGAN DIUBAH):
  _id?: string;
  q: string;
  opts: string[];
  ans: number;
  ex: string;
  
  // Tambahan:
  pertemuan?: number;  // pertemuan ke berapa, default = tanpa tag
}
```

**Task**:
- [x] Tambah `pertemuan` field ke `KuisItem` di types.ts
- [x] Update `addKuis()` default — pertemuan: undefined (backward compatible)
- [x] Update KuisTab form — tambah dropdown pertemuan (dinamis dari ATP, opsional)
- [x] Update `genKuis()` — auto-tag pertemuan berdasarkan settings
- [x] Update `genKuisSchema()` — auto-tag pertemuan di KuisBlock.questions
- [x] Tambah `pertemuan` field ke KuisBlock.questions di schema/types.ts

---

## Phase 18: Data-Driven Materi + Generator Baru

> Diskusi 10 Mei 2026: MateriBlok SUDAH punya field `tipe` (13 jenis)
> tapi MateriTemplate mengabaikannya — semua jadi card list.
> Fix: render beda berdasarkan tipe. Tidak perlu komponen baru,
> cukup pola render berbeda di template yang sama.

### 18.1 MateriTemplate Data-Driven Render

**Sekarang**: Semua blok → card list (abaikan tipe)
**Sesudah**: Render berdasarkan `blok.tipe`

| tipe | Render | Pakai Field |
|------|--------|------------|
| `teks` | Card dengan paragraf | `isi` |
| `definisi` | Kotak highlight kuning | `judul`, `isi` |
| `poin` | Bullet list | `butir[]` |
| `tabel` | HTML table | `baris[][]` |
| `kutipan` | Quote block besar | `isi`, `karakter` |
| `timeline` | Step vertikal | `langkah[]` |
| `compare` | 2 kolom kiri-kanan | `kiri`, `kanan` |
| `highlight` | Card accent | `isi`, `warna` |
| `infobox` | Info box biru | `isi` |
| `checklist` | Checkbox list | `butir[]` |
| `statistik` | Angka besar + label | `items[]` |
| `studi` | Kasus + pertanyaan | `situasi`, `pertanyaan`, `pesan` |
| `gambar` | Image + caption | `isi` (URL) |

**Task**:
- [x] Refactor MateriTemplate — switch render per `blok.tipe`
- [x] Buat helper `renderBlok(blok)` dengan 13 pola render (BlokRenderer.tsx)
- [x] Test semua 13 tipe blok di design mode + interactive mode
- [x] Hapus variant B/C yang tidak diperlukan lagi (opsional — diputuskan tetap dipertahankan)

### 18.2 Generator: Materi + Diskusi + Refleksi

**Alasan**: 5 section tidak punya generator, guru harus isi manual.
Dengan generator, guru bisa re-generate yang gak cocok.

**Enhanced (Sprint A)**: Generator sekarang menghasilkan SchemaBlock[] yang lebih beragam:
- genMateriSchema: def-box, nc-grid, ftab (3+ functions), tabel-accord (long enumerations)
- genDiskusiSchema: 6 pola pertanyaan (Bloom C1-C5, sebab-akibat, setuju/tidak)
- genRefleksiSchema: 5-6 pertanyaan metakognisi (recall, transfer, commitment, monitoring, self-regulation, teach-back)

**Task**:
- [x] Buat `genMateri(parsed)` — deteksi struktur → assign tipe per blok → SchemaBlock[]
  - Definisi → `def-box` (yellow border)
  - Enumerasi (≤3) → `nc-grid` (card grid)
  - Enumerasi (>3) → `tabel-accord` (accordion table)
  - Functions (3+) → `ftab` (tabbed view)
  - Functions (1-2) → `def-box` (cyan border)
  - Causes → `nc-grid` (sebab-akibat cards)
  - Semua dibungkus `materi-section` dengan BSNP badge + takeaways
- [x] Buat `genDiskusi(parsed, tp)` — 6 pola pertanyaan dari konten + TP
  - Definitions → "Jelaskan apa yang dimaksud..." (C2)
  - Enumerations → "Sebutkan dan diskusikan..." (C1)
  - Functions → "Mengapa X berfungsi...?" (C4)
  - Causes → "Diskusikan sebab-akibat..." (C4)
  - TP → "Bagaimana [tujuan]?" (C3-C5)
  - Sentences → "Setuju atau tidak? Mengapa?" (C5)
- [x] Buat `genRefleksi(parsed)` — pertanyaan metakognisi dinamis
  - Q1: Recall + awareness (defTerm-based)
  - Q2: Transfer + application (fnSubject-based)
  - Q3: Commitment + agency
  - Q4: Metacognitive monitoring (challengeTopic-based)
  - Q5: Self-regulation (if causes/functions rich)
  - Q6: Teach-back (deepest Bloom level)
- [x] Tambah ke GEN_BUTTONS di constants.ts
- [x] Tambah ke useAutoGenerate hook (generate + apply)
- [x] Tambah preview komponen

### 18.3 Tombol Re-generate di Panel Konten

**Alasan**: Guru tidak harus ke panel Auto-Generate untuk re-generate.
Bisa langsung dari tab yang sedang dikerjakan.

**Task**:
- [x] Tambah tombol "⚡ Re-generate" di MateriTab
- [x] Tambah tombol "⚡ Re-generate" di tab Diskusi (kalau ada)
- [x] Tambah tombol "⚡ Re-generate" di tab Refleksi (kalau ada)
- [x] Alur: klik → pakai parsed data terakhir → generate → replace di store

---

## Phase 19: Auto-Generate Per Pertemuan

> Prasyarat: Phase 17.2 (pertemuan tag) sudah selesai.
> Baru setelah itu bisa implementasi auto-split per pertemuan.

**Alur baru**:
```
Guru pilih "Full Interaktif" → Toggle "Per Pertemuan" → Jumlah pertemuan (dari ATP)
→ Generate:
    Halaman GLOBAL: Cover, Dokumen, Petunjuk
    Per PERTEMUAN: Materi P1, Kuis P1, Game P1
                  Materi P2, Kuis P2
                  Materi P3, Kuis P3, Diskusi P3
    Halaman PENUTUP: Hasil, Penutup
```

**Task**:
- [x] Tambah `perPertemuan` config di `PageTypeBlueprint`
- [x] Update `generateFromPageType()` — repeat template set per pertemuan
- [x] Filter kuis by `pertemuan` di `buildTemplateData('kuis')`
- [x] Filter materi blok by `pertemuan` (tambah field di MateriBlok)
- [x] UI: toggle "Per Pertemuan" + jumlah pertemuan di PageTypeCreator
- [x] Tambah label pertemuan di page thumbnails

---

## Phase 20: BSNP Template Baru

> Template yang belum ada tapi BSNP sarankan.
> Prioritas berdasarkan kebutuhan nyata, bukan checklist lengkap.

### 20.1 TujuanTemplate — TP ke Siswa (P1)
- [x] Buat `TujuanDisplayRenderer.tsx` — tampilkan TP + Profil Pelajar Pancasila
- Data: `authoringStore.tp` + `cp.profil` (SUDAH ADA)
- 3 variants: Klasik (card list), Checklist (interactive checkboxes), Peta Konsep (mind map)
- [x] Tambah ke `PageTemplateType`, `SceneRegistry`, `genTujuanDisplaySchema`

### 20.2 MotivasiTemplate — Apersepsi (P2)
- [x] Buat `MotivasiRenderer.tsx` — pertanyaan pemicu + koneksi
- Data: `genMotivasiSchema()` generates hookQuestion + connections + transition
- 3 variants: Klasik (full card), Kartu Hook (hero + pills), Kutipan (quote style)
- [x] Tambah ke `SceneRegistry`, `genMotivasiSchema`

### 20.3 RangkumanTemplate — Penegasan (P2)
- [x] Buat `RangkumanRenderer.tsx` — poin penting + tips
- Data: `genRangkumanSchema()` generates concept cards with BSNP badge
- 3 variants: Klasik (card grid), Kreatif (timeline stepper), Ringkas (accordion)
- [x] Tambah ke `SceneRegistry`, `genRangkumanSchema`

---

## Phase 21: Interaktivitas Ringan (Opsional)

> Tambahan kecil yang bikin media lebih engaging.
> Hanya jika ada waktu, bukan prioritas utama.

- [x] Checkbox "Sudah Paham" per TP di DokumenTemplate — Variant B "Checklist" di TujuanDisplayRenderer
- [x] Accordion per blok di MateriTemplate (interactive mode) — Variant A "Klasik" dengan accordion compression
- [x] Badge visual di PenutupTemplate berdasarkan skor
- [x] HasilTemplate — tampilkan skor per aktivitas (bukan hanya total)

---

## Phase 22: Block Renderer Audit & Bug Fix

> Full audit 37 block renderers. Fix critical & moderate bugs.

**Critical Fixes (P0)**:
- [x] Add 6 missing block types to validation registry (`tabel`, `gambar`, `timeline`, `checklist`, `statistik`, `studi`)
- [x] Fix `handlesCompression` mismatch: 4 renderers declared `true` but didn't implement `useBlockCompression` → set to `false`

**Bug Fixes (P1)**:
- [x] Fix `ChecklistRenderer` — accept & respect `interactive` prop (was always interactive even in preview/export mode)
- [x] Fix `GambarRenderer` — reset `hasError` state when URL changes via `useEffect`

**Improvements (P2)**:
- [x] Update variant declarations in registry: `diskusi` now `['A','B','C']`, `hasil` now `['A','B','C']`
- [x] Fix `HasilRenderer` — persist variant to store via `updateSchemaBlock` (was using local `useState`)
- [x] Normalize store imports — all renderers now use consistent `../../../store/canva/store` path

**Audit Results**:
| Aspect | Status |
|--------|--------|
| SceneRegistry coverage | All 37 types registered |
| Schema types | All 37 types have TypeScript interfaces |
| BlockDefinitionRegistry | All 37 types have metadata |
| PremiumBlockWrapper | All renderers use premium effects |
| React.memo | All renderers wrapped |
| TokenResolver | Consistent usage |
| Build | Clean (0 errors) |

---

## Catatan Penting

- **4-Layer Sync** JANGAN DIUBAH — sudah stabil
- **SuaraConfig** sudah ada di store — tinggal aktifkan
- **MateriBlok.tipe** sudah ada — tinggal pakai di template
- **Flow searah** — tidak ada remedial, tugas guru
- **Media pembelajaran** — bukan modul, jangan over-engineer
- Setiap phase: build & test → push git

---

*Roadmap diupdate berdasarkan diskusi 10 Mei 2026.*
