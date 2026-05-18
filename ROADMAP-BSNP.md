# Roadmap Media Pembelajaran Interaktif

> **Prinsip**: Media pembelajaran, bukan modul pembelajaran.
> Flow searah, remedial serahkan ke guru.
> Lean & praktis — hindari over-engineering.
>
> **Dibuat**: 9 Mei 2026 | **Update**: 10 Mei 2026

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
- [x] Update KuisTab form — tambah dropdown pertemuan (1-8, opsional)
- [x] Update `genKuis()` — auto-tag pertemuan berdasarkan settings
- [x] Update `buildTemplateData('kuis')` — support filter by pertemuan (opsional)

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
- [x] Hapus variant B/C yang tidak diperlukan lagi (opsional) — Semua variant B/C dipertahankan karena masing-masing memiliki tujuan visual yang berbeda

### 18.2 Generator: Materi + Diskusi + Refleksi

**Alasan**: 5 section tidak punya generator, guru harus isi manual.
Dengan generator, guru bisa re-generate yang gak cocok.

**Task**:
- [x] Buat `genMateri(parsed)` — deteksi struktur → assign tipe per blok
  - Definisi → `definisi` blok
  - Enumerasi → `poin` blok
  - Langkah → `timeline` blok
  - Perbandingan → `compare` blok
  - Sisanya → `teks` blok
- [x] Buat `genDiskusi(parsed, tp)` — buat pertanyaan dari konten + TP
- [x] Buat `genRefleksi(parsed)` — buat pertanyaan refleksi metakognisi
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

## Phase 19: Auto-Generate Per Pertemuan (SELESAI)

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

## Phase 20: BSNP Template Baru (SELESAI)

> Template yang belum ada tapi BSNP sarankan.
> Prioritas berdasarkan kebutuhan nyata, bukan checklist lengkap.

### 20.1 TujuanTemplate — TP ke Siswa (P1)
- [x] Buat `TujuanTemplate.tsx` — tampilkan TP + Profil Pelajar Pancasila
  → Diimplementasi sebagai SchemaBlock `tujuan-display` dengan TujuanDisplayRenderer (3 varian)
- [x] Tambah ke `PageTemplateType`, `PageTemplate.tsx`, `buildTemplateData`, dll

### 20.2 MotivasiTemplate — Apersepsi (P2)
- [x] Buat `MotivasiTemplate.tsx` — pertanyaan pemicu + koneksi
  → Diimplementasi sebagai SchemaBlock `motivasi` dengan MotivasiRenderer (3 varian)
- [x] Tambah slice di authoring store + form di panel
  → motivasi-rangkuman-slice.ts + MotivasiTab.tsx di panel Konten

### 20.3 RangkumanTemplate — Penegasan (P2)
- [x] Buat `RangkumanTemplate.tsx` — poin penting + tips
  → Diimplementasi sebagai SchemaBlock `rangkuman` dengan RangkumanRenderer (3 varian)
- [x] Tambah slice + form
  → motivasi-rangkuman-slice.ts + RangkumanTab.tsx di panel Konten

---

## Phase 21: Interaktivitas Ringan (SELESAI)

> Tambahan kecil yang bikin media lebih engaging.

- [x] Checkbox "Sudah Paham" per TP di DokumenTemplate → TpRenderer interactive mode
- [x] Accordion per blok di MateriTemplate (interactive mode) → CompressionEngine accordion strategy
- [x] Badge visual di PenutupTemplate berdasarkan skor → PenutupRenderer score badges
- [x] HasilTemplate — tampilkan skor per aktivitas → HasilRenderer ActivityBreakdown

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
