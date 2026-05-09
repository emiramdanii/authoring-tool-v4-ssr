# Roadmap Media Pembelajaran Interaktif

> **Prinsip**: Media pembelajaran, bukan modul pembelajaran.
> Flow searah, remedial serahkan ke guru.
> Lean & praktis — hindari over-engineering.
>
> **Dibuat**: 9 Mei 2026 | **Update**: 10 Mei 2026

---

## Fase Saat Ini

### Phase 11: Navigation Button System
- [x] Buat komponen `TemplateNavButton` yang reusable
- [x] Tambah nav button ke DokumenTemplate
- [x] Tambah nav button ke MateriTemplate
- [ ] Tambah nav button ke KuisTemplate (setelah kuis selesai)
- [ ] Tambah nav button ke GameTemplate (interactive mode)
- [ ] Perbaiki PetunjukTemplate — "Lanjut" di step terakhir jadi navigasi halaman
- [ ] Perbaiki DiskusiTemplate — "Lanjut" di pertanyaan terakhir jadi navigasi halaman
- [ ] Perbaiki RefleksiTemplate — "Lanjut" di pertanyaan terakhir jadi navigasi halaman
- [ ] Perbaiki SkenarioTemplate — tambah "Lanjut" saat skenario completed
- [ ] Perbaiki HeroTemplate — fallback CTA jika td.cta kosong
- [ ] Perbaiki HasilTemplate — nav button walau tanpa skor
- [ ] Build & test semua perubahan

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
- [ ] Buat `src/lib/sounds.ts` (helper function)
- [ ] Buat `public/sounds/` + 6 file audio (free SFX, <30KB each)
- [ ] Tambah `playSound('correct')` di QuizWidget saat jawab benar
- [ ] Tambah `playSound('incorrect')` di QuizWidget saat jawab salah
- [ ] Tambah `playSound('complete')` di QuizWidget phase=result
- [ ] Tambah `playSound('click')` di TemplateNavButton + MulaiButton
- [ ] Tambah `playSound('tap')` di SkenarioTemplate pilihan + GameWidget
- [ ] Tambah `playSound('ding')` / `playSound('buzz')` di SkenarioTemplate feedback
- [ ] Tambah toggle suara di panel (gunakan SuaraConfig yang sudah ada)

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
- [ ] Tambah `pertemuan` field ke `KuisItem` di types.ts
- [ ] Update `addKuis()` default — pertemuan: undefined (backward compatible)
- [ ] Update KuisTab form — tambah dropdown pertemuan (1-8, opsional)
- [ ] Update `genKuis()` — auto-tag pertemuan berdasarkan settings
- [ ] Update `buildTemplateData('kuis')` — support filter by pertemuan (opsional)

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
- [ ] Refactor MateriTemplate — switch render per `blok.tipe`
- [ ] Buat helper `renderBlok(blok)` dengan 13 pola render
- [ ] Test semua 13 tipe blok di design mode + interactive mode
- [ ] Hapus variant B/C yang tidak diperlukan lagi (opsional)

### 18.2 Generator: Materi + Diskusi + Refleksi

**Alasan**: 5 section tidak punya generator, guru harus isi manual.
Dengan generator, guru bisa re-generate yang gak cocok.

**Task**:
- [ ] Buat `genMateri(parsed)` — deteksi struktur → assign tipe per blok
  - Definisi → `definisi` blok
  - Enumerasi → `poin` blok
  - Langkah → `timeline` blok
  - Perbandingan → `compare` blok
  - Sisanya → `teks` blok
- [ ] Buat `genDiskusi(parsed, tp)` — buat pertanyaan dari konten + TP
- [ ] Buat `genRefleksi(parsed)` — buat pertanyaan refleksi metakognisi
- [ ] Tambah ke GEN_BUTTONS di constants.ts
- [ ] Tambah ke useAutoGenerate hook (generate + apply)
- [ ] Tambah preview komponen

### 18.3 Tombol Re-generate di Panel Konten

**Alasan**: Guru tidak harus ke panel Auto-Generate untuk re-generate.
Bisa langsung dari tab yang sedang dikerjakan.

**Task**:
- [ ] Tambah tombol "⚡ Re-generate" di MateriTab
- [ ] Tambah tombol "⚡ Re-generate" di tab Diskusi (kalau ada)
- [ ] Tambah tombol "⚡ Re-generate" di tab Refleksi (kalau ada)
- [ ] Alur: klik → pakai parsed data terakhir → generate → replace di store

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
- [ ] Tambah `perPertemuan` config di `PageTypeBlueprint`
- [ ] Update `generateFromPageType()` — repeat template set per pertemuan
- [ ] Filter kuis by `pertemuan` di `buildTemplateData('kuis')`
- [ ] Filter materi blok by `pertemuan` (tambah field di MateriBlok)
- [ ] UI: toggle "Per Pertemuan" + jumlah pertemuan di PageTypeCreator
- [ ] Tambah label pertemuan di page thumbnails

---

## Phase 20: BSNP Template Baru

> Template yang belum ada tapi BSNP sarankan.
> Prioritas berdasarkan kebutuhan nyata, bukan checklist lengkap.

### 20.1 TujuanTemplate — TP ke Siswa (P1)
- [ ] Buat `TujuanTemplate.tsx` — tampilkan TP + Profil Pelajar Pancasila
- Data: `authoringStore.tp` + `cp.profil` (SUDAH ADA)
- [ ] Tambah ke `PageTemplateType`, `PageTemplate.tsx`, `buildTemplateData`, dll

### 20.2 MotivasiTemplate — Apersepsi (P2)
- [ ] Buat `MotivasiTemplate.tsx` — pertanyaan pemicu + koneksi
- Data: baru (pertanyaanPemicu, koneksi)
- [ ] Tambah slice di authoring store + form di panel

### 20.3 RangkumanTemplate — Penegasan (P2)
- [ ] Buat `RangkumanTemplate.tsx` — poin penting + tips
- Data: baru (poin[], tips) atau auto-extract dari materi
- [ ] Tambah slice + form

---

## Phase 21: Interaktivitas Ringan (Opsional)

> Tambahan kecil yang bikin media lebih engaging.
> Hanya jika ada waktu, bukan prioritas utama.

- [ ] Checkbox "Sudah Paham" per TP di DokumenTemplate
- [ ] Accordion per blok di MateriTemplate (interactive mode)
- [ ] Badge visual di PenutupTemplate berdasarkan skor
- [ ] HasilTemplate — tampilkan skor per aktivitas (bukan hanya total)

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
