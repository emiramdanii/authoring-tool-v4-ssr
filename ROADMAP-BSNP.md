# 🗺️ Roadmap Media Pembelajaran — Standar BSNP

> **Dokumen perencanaan** berdasarkan audit template vs Standar BSNP 
> (Permendikbudristek No. 8 Tahun 2024 — Media Pembelajaran Interaktif)
> 
> **Dibuat**: 9 Mei 2026 | **Status**: Planning

---

## 📋 Fase Saat Ini (Sedang Dikerjakan)

### Phase 11: Navigation Button System
- [x] Buat komponen `TemplateNavButton` yang reusable
- [x] Tambah nav button ke DokumenTemplate (Guided Flow: CP → TP → ATP → Next Page)
- [x] Tambah nav button ke MateriTemplate
- [ ] Tambah nav button ke KuisTemplate (setelah kuis selesai)
- [ ] Tambah nav button ke GameTemplate (interactive mode)
- [ ] Perbaiki PetunjukTemplate — "Lanjut →" di step terakhir jadi navigasi halaman
- [ ] Perbaiki DiskusiTemplate — "Lanjut →" di pertanyaan terakhir jadi navigasi halaman
- [ ] Perbaiki RefleksiTemplate — "Lanjut →" di pertanyaan terakhir jadi navigasi halaman
- [ ] Perbaiki SkenarioTemplate — tambah "Lanjut →" saat skenario completed
- [ ] Perbaiki HeroTemplate — fallback CTA jika td.cta kosong
- [ ] Perbaiki HasilTemplate — nav button walau tanpa skor
- [ ] Smart label kontekstual (gunakan getNextLabel dari ExportApp)
- [ ] Build & test semua perubahan

---

## 🔴 Phase 12: P1 BSNP — Kriteria Wajib

### 12.1 TujuanTemplate — TP Ditampilkan ke Siswa
**Alasan**: BSNP mewajibkan tujuan pembelajaran ditampilkan eksplisit kepada siswa sebelum materi dimulai. Saat ini TP tersembunyi di tab Dokumen.

**Desain**:
```
┌─────────────────────────────────────┐
│  🎯 Tujuan Pembelajaran             │
│─────────────────────────────────────│
│  Setelah mempelajari materi ini,    │
│  siswa mampu:                       │
│                                     │
│  ✅ Menjelaskan konsep X            │
│  ✅ Menganalisis hubungan Y         │
│  ✅ Menerapkan prinsip Z            │
│                                     │
│  🏛️ Profil Pelajar Pancasila:      │
│  [Bernalar Kritis] [Gotong Royong] │
│                                     │
│       [Mulai Belajar →]             │
└─────────────────────────────────────┘
```

**Data source**: `authoringStore.tp` + `authoringStore.cp.profil`

**Task**:
- [ ] Buat `TujuanTemplate.tsx` di `page-template/`
- [ ] Tambah `tujuan` ke `PageTemplateType` di `types.ts`
- [ ] Tambah case di `PageTemplate.tsx` router
- [ ] Tambah `buildTemplateData` case `tujuan`
- [ ] Tambah icon + label di template selector panel
- [ ] Tambah ke `TEMPLATE_ICON` map di Stage.tsx dan ExportApp.tsx

### 12.2 Cover Template — Identitas Lengkap BSNP
**Alasan**: BSNP mewajibkan identitas modul yang lengkap (semester, penyusun, instansi, tahun).

**Perubahan**:
- Tambah field: `semester`, `penyusun`, `instansi`, `tahun` ke cover templateData
- Tambah display area di CoverTemplate (semua variant A/B/C)
- Update `buildTemplateData` untuk cover
- Update authoring store `meta` untuk field baru

**Task**:
- [ ] Tambah field meta di authoring store
- [ ] Update CoverTemplate tampilan identitas
- [ ] Update buildTemplateData cover
- [ ] Update panel authoring (form identitas)

---

## 🟡 Phase 13: P2 BSNP — Sangat Direkomendasikan

### 13.1 MotivasiTemplate — Apersepsi / Hook Pembuka
**Alasan**: BSNP mewajibkan ada stimulus awal (apersepsi) yang menghubungkan pengalaman siswa dengan materi baru.

**Desain**:
```
┌─────────────────────────────────────┐
│  💡 Motivasi Belajar                │
│─────────────────────────────────────│
│  Pertanyaan Pemicu:                 │
│  "Pernahkah kamu merasa...?"       │
│                                     │
│  📺 Media Stimulus                  │
│  [video/gambar ilustrasi]           │
│                                     │
│  🔗 Koneksi:                       │
│  "Hari ini kita akan pelajari..."  │
│                                     │
│          [Lanjut ke Tujuan →]       │
└─────────────────────────────────────┘
```

**Data source**: Baru — `authoringStore.motivasi` (pertanyaanPemicu, mediaUrl, koneksi)

**Task**:
- [ ] Buat `MotivasiTemplate.tsx`
- [ ] Tambah `motivasi` ke `PageTemplateType`
- [ ] Tambah slice `motivasi` di authoring store
- [ ] Tambah form di panel Konten
- [ ] Tambah ke auto-generate system

### 13.2 RangkumanTemplate — Penegasan Materi
**Alasan**: BSNP mewajibkan ada penegasan/reinforcement setelah penyajian materi.

**Desain**:
```
┌─────────────────────────────────────┐
│  📝 Rangkuman                       │
│─────────────────────────────────────│
│  Poin-poin penting hari ini:        │
│                                     │
│  1. Konsep utama X adalah...        │
│  2. Hubungan Y dan Z menunjukkan..  │
│  3. Prinsip dasar yang perlu...     │
│                                     │
│  💡 Tips Ingat:                     │
│  "Rumus mudah: ABC = ..."           │
│                                     │
│        [Lanjut ke Evaluasi →]       │
└─────────────────────────────────────┘
```

**Data source**: Baru — `authoringStore.rangkuman` (poin[], tips)

**Task**:
- [ ] Buat `RangkumanTemplate.tsx`
- [ ] Tambah `rangkuman` ke `PageTemplateType`
- [ ] Tambah slice di authoring store
- [ ] Tambah form di panel Konten
- [ ] Auto-generate dari materi blok

---

## 🟢 Phase 14: P3 BSNP — Direkomendasikan

### 14.1 PetaKonsepTemplate — Visual Overview
**Alasan**: BSNP merekomendasikan gambaran umum/overview materi sebelum penyajian konten.

**Desain**:
```
┌─────────────────────────────────────┐
│  🗺️ Peta Konsep                    │
│─────────────────────────────────────│
│        ┌──────────┐                 │
│        │ Topik Utama│                │
│        └────┬─────┘                 │
│       ┌─────┼─────┐                 │
│   Sub A    Sub B   Sub C            │
│   ┌───┐   ┌───┐   ┌───┐           │
│   │d1 │   │d2 │   │d3 │            │
│   └───┘   └───┘   └───┘            │
│                                     │
│          [Lanjut ke Materi →]       │
└─────────────────────────────────────┘
```

**Task**:
- [ ] Buat `PetaKonsepTemplate.tsx` dengan visual tree/mind map
- [ ] Tambah `petakonsep` ke `PageTemplateType`
- [ ] Data dari `authoringStore.materi.blok` (auto-extract struktur)
- [ ] Atau input manual: node[], edges[]

### 14.2 SumberTemplate — Referensi & Glosarium
**Alasan**: BSNP mewajibkan daftar sumber belajar dan penjelasan istilah teknis.

**Desain**:
```
┌─────────────────────────────────────┐
│  📚 Sumber Belajar & Glosarium      │
│─────────────────────────────────────│
│  📖 Referensi:                      │
│  1. Buku Paket Kelas X, Hal. 20-45 │
│  2. Kemendikbud, 2024              │
│                                     │
│  📕 Glosarium:                      │
│  • Fotosintesis → Proses...         │
│  • Klorofil → Pigmen hijau...       │
│                                     │
│          [Lanjut →]                 │
└─────────────────────────────────────┘
```

**Task**:
- [ ] Buat `SumberTemplate.tsx`
- [ ] Tambah `sumber` ke `PageTemplateType`
- [ ] Tambah slice `sumber` (referensi[], glosarium[]) di authoring store
- [ ] Tambah form di panel Konten

### 14.3 Hasil Template — Rekomendasi Tindak Lanjut
**Alasan**: Umpan balik BSNP harus lebih dari sekadar skor — perlu rekomendasi spesifik.

**Perubahan**:
```
Sekarang:                    BSNP Mewajibkan:
🏆 75%                      🏆 75% Baik
↩ Ulangi Semua              ✅ Kamu sudah menguasai X, Y
                             📝 Perlu latihan lagi: Z
                             🎯 Rekomendasi: Ulangi bagian Z
```

**Task**:
- [ ] Tambah rekomendasi berdasarkan skor range
- [ ] Tambah tampilan poin yang sudah/belum dikuasai
- [ ] Update HasilTemplate

---

## 🔄 Alur Template BSNP Ideal

```
Cover ──→ Motivasi ──→ Tujuan ──→ Peta Konsep ──→ Petunjuk
   │                                                      │
   │                                                  Dokumen (guru)
   │                                                      │
   └──────→ Materi ──→ Rangkuman ──→ Diskusi ──→ Kuis ──→ Game
                                                               │
           Skenario ←── Refleksi ←── Hasil ←── Game            │
               │                                               │
               └──→ Sumber ──→ Penutup ────────────────────────┘
```

### Template Wajib BSNP (urut):

| No | Template | Fungsi BSNP | Status | Phase |
|----|----------|-------------|--------|-------|
| 1 | **Cover** | Identitas modul | ⚠️ Perlu perbaikan identitas | 12 |
| 2 | **Motivasi** | Apersepsi / stimulus awal | ❌ Belum ada | 13 |
| 3 | **Tujuan** | TP + Profil Pelajar Pancasila ke siswa | ❌ Belum ada | 12 |
| 4 | **Peta Konsep** | Gambaran umum materi | ❌ Belum ada | 14 |
| 5 | **Petunjuk** | Cara menggunakan media | ✅ Ada | - |
| 6 | **Dokumen** | CP/TP/ATP (referensi guru) | ⚠️ Perlu self-assessment | 15 |
| 7 | **Materi** | Penyajian materi | ⚠️ Perlu accordion + read tracking | 15 |
| 8 | **Rangkuman** | Penegasan materi | ❌ Belum ada | 13 |
| 9 | **Diskusi** | Aktivitas kolaboratif | ✅ Ada | - |
| 10 | **Kuis** | Evaluasi formatif | ⚠️ Perlu review jawaban | 15 |
| 11 | **Game** | Penguatan interaktif | ✅ Ada | - |
| 12 | **Skenario** | Higher-order thinking | ✅ Ada | - |
| 13 | **Refleksi** | Metakognisi | ✅ Ada | - |
| 14 | **Hasil** | Umpan balik | ⚠️ Perlu breakdown + rekomendasi | 15 |
| 15 | **Sumber** | Referensi + glosarium | ❌ Belum ada | 14 |
| 16 | **Penutup** | Penutup + tindak lanjut | ⚠️ Perlu sertifikat/badge | 15 |

---

## 🎮 Phase 15: Komponen Interaktif — Pembelajaran Aktif

> Diskusi 9 Mei 2026: Audit interaktivitas template menunjukkan
> Dokumen dan Materi (2 template terpenting) 100% PASIF.
> BSNP mewajibkan pembelajaran aktif, bukan hanya membaca.

### 15.1 Self-Assessment Check — Checkbox "Saya Sudah Pahami" di TP

**Template terpengaruh**: DokumenTemplate (tab TP)

```
┌─────────────────────────────────────┐
│  🎯 Tujuan Pembelajaran             │
│─────────────────────────────────────│
│  ☐ 1. Menjelaskan konsep X         │
│  ✅ 2. Menganalisis hubungan Y      │
│  ☐ 3. Menerapkan prinsip Z          │
│                                     │
│  Progress: 1/3 dipahami ████░░░░    │
│                                     │
│  [Lanjut ke Alur Tujuan →]          │
└─────────────────────────────────────┘
```

- Checkbox per item TP — siswa klik "Saya sudah paham"
- Progress bar otomatis update
- Di step terakhir: jika semua dicentang → "Siap Belajar →", jika belum → "Belum semua dipahami, yakin lanjut?"
- **Data**: session-only (tidak perlu persist untuk MVP)
- **BSNP**: Memenuhi kriteria metakognisi & pembelajaran aktif

**Task**:
- [ ] Buat state `understoodItems: Set<number>` di DokumenTemplate
- [ ] Tambah checkbox per item TP
- [ ] Tambah progress bar
- [ ] Conditional label nav button berdasarkan progress

### 15.2 Accordion + "Sudah Baca" per Blok Materi

**Template terpengaruh**: MateriTemplate

```
┌─────────────────────────────────────┐
│  ▸ 📦 Pengertian                    │  ← collapsed
├─────────────────────────────────────┤
│  ▾ 📦 Jenis-Jenis                   │  ← expanded
│  Penjelasan detail tentang jenis... │
│                                     │
│  ☐ ✅ Saya sudah membaca blok ini   │
├─────────────────────────────────────┤
│  ▸ 📦 Contoh                        │  ← collapsed
└─────────────────────────────────────┘
```

- Default: semua collapsed di interactive mode, expanded di design mode
- Setiap blok punya checkbox "Saya sudah baca"
- Progress: X/Y blok dibaca
- **BSNP**: Pembelajaran aktif + pengecekan pemahaman

**Task**:
- [ ] Tambah accordion (expand/collapse) per blok di interactive mode
- [ ] Tambah checkbox "Sudah baca" per blok
- [ ] Tambah progress indicator
- [ ] Nav button hanya muncul setelah semua blok dibaca (opsional)

### 15.3 Hasil Breakdown Per Aktivitas + Rekomendasi

**Template terpengaruh**: HasilTemplate

```
┌─────────────────────────────────────┐
│  🏆 75% Baik                        │
│─────────────────────────────────────│
│  ✅ Kuis 1: 90% (Sangat Baik)      │
│  ✅ Game Flashcard: 80% (Baik)      │
│  ⚠️ Kuis 2: 55% (Perlu Latihan)    │
│                                     │
│  💡 Rekomendasi:                    │
│  "Ulangi Kuis 2 tentang konsep Z"  │
│                                     │
│  [↩ Ulangi Yang Salah] [↩ Ulangi Semua] │
└─────────────────────────────────────┘
```

- Tampil skor per aktivitas (bukan hanya total)
- Rekomendasi otomatis berdasarkan skor rendah
- Tombol "Ulangi Yang Salah" — reset hanya skor yang di bawah threshold
- **BSNP**: Umpan balik spesifik, tepat waktu, membangun

**Task**:
- [ ] Update HasilTemplate — breakdown per aktivitas dari scores[]
- [ ] Tambah rekomendasi otomatis
- [ ] Tambah tombol "Ulangi Yang Salah"

### 15.4 Kuis Review Jawaban Setelah Selesai

**Template terpengaruh**: KuisTemplate

```
┌─────────────────────────────────────┐
│  ✅ Kuis Selesai! Skor: 80%        │
│─────────────────────────────────────│
│  1. ✅ Apa itu fotosintesis?       │
│     Jawabanmu: Proses... ✅ Benar!  │
│                                     │
│  2. ❌ Faktor yang mempengaruhi...  │
│     Jawabanmu: B. Suhu             │
│     ❌ Salah. Jawaban: C. Cahaya   │
│     💡 Selain suhu, cahaya juga... │
│                                     │
│  [Lanjut ke Hasil →]               │
└─────────────────────────────────────┘
```

- Setelah kuis selesai, tampil review jawaban benar/salah
- Jawaban salah diberi penjelasan singkat
- **BSNP**: Umpan balik tepat waktu

**Task**:
- [ ] Tambah state "review mode" di QuizWidget / KuisTemplate
- [ ] Tampil review jawaban setelah submit
- [ ] Tambah penjelasan per soal (dari data kuis.explanation)

### 15.5 Step Completion Tracking — Petunjuk

**Template terpengaruh**: PetunjukTemplate

- Setiap step bisa ditandai selesai (✅)
- Progress: X/Y langkah selesai
- Semua step selesai → nav button muncul "Siap Belajar →"

**Task**:
- [ ] Tambah checkbox "Selesai" per step di interactive mode
- [ ] Tambah progress tracking

### 15.6 Sertifikat / Badge Penyelesaian — Penutup

**Template terpengaruh**: PenutupTemplate

- Tampil badge/sertifikat visual berdasarkan skor akhir
- Bisa di-screenshot (visual only, tidak perlu download untuk MVP)
- Badge level: 🥇 Sangat Baik (≥85%), 🥈 Baik (≥70%), 🥉 Cukup (≥50%)

**Task**:
- [ ] Tambah badge visual di PenutupTemplate
- [ ] Tampil berdasarkan skor dari interactive store

### 15.7 Catatan Siswa (Sticky Notes) — Materi & Dokumen

**Template terpengaruh**: MateriTemplate, DokumenTemplate

- Tab kecil "📝 Catatan" di pojok kanan bawah
- Klik → buka textarea untuk menulis catatan per halaman
- Data disimpan di localStorage per page ID
- **Kompleksitas tinggi** — simpan untuk phase akhir

**Task**:
- [ ] Buat komponen `StudentNotes` (floating widget)
- [ ] Persist ke localStorage per pageId
- [ ] Integrasikan ke MateriTemplate & DokumenTemplate

---

## 🔧 Phase 16: Fitur Teknis Pendukung

> Fitur infrastruktur yang diperlukan untuk mendukung
> semua phase di atas dan meningkatkan kualitas teknis.

### 16.1 Aksesibilitas (A11y) — Diversitas Pembelajar

**BSNP mewajibkan**: Media pembelajaran harus accessible untuk semua siswa termasuk yang berkebutuhan khusus.

**Task**:
- [ ] Semua template: tambah ARIA labels pada elemen interaktif
- [ ] Keyboard navigation lengkap (Tab, Enter, Escape)
- [ ] Color contrast ratio min 4.5:1 (WCAG AA)
- [ ] Screen reader friendly — alt text pada ikon/dekorasi
- [ ] Focus indicators yang jelas pada semua tombol
- [ ] Reduced motion support (prefers-reduced-motion)

### 16.2 Audio/Narasi — Panduan Belajar

**BSNP mewajibkan**: Penyajian materi harus mendukung multimodal (visual + audio).

**Task**:
- [ ] Tambah field `narasiUrl` per template/blok
- [ ] Audio player widget di MateriTemplate
- [ ] Text-to-Speech option untuk aksesibilitas
- [ ] Auto-play narasi di Play/Export mode (opsional)

### 16.3 Video Embed — Stimulus Visual

**Saat ini**: Tidak ada template yang support video embed.

**Task**:
- [ ] Tambah video embed support di MotivasiTemplate (stimulus)
- [ ] Video embed widget sebagai element type baru (`video`)
- [ ] Support YouTube/Vimeo embed URL + self-hosted video

### 16.4 Bookmarking / Progress Resume

**Masalah**: Jika siswa menutup browser, progress hilang semua.

**Task**:
- [ ] Simpan interactivePageIdx + scores ke localStorage
- [ ] Resume: "Lanjutkan dari halaman 5?" saat buka kembali
- [ ] Simpan catatan siswa per pageId

### 16.5 SCORM / LMS Integration

**BSNP jangka panjang**: Media pembelajaran harus bisa diintegrasikan ke LMS.

**Task**:
- [ ] SCORM 1.2 / 2004 wrapper untuk export
- [ ] cmi.core.lesson_status, cmi.core.score.raw
- [ ] LMS commit pada setiap score update
- [ ] Export format: ZIP dengan imsmanifest.xml

### 16.6 Print Mode / PDF Export

**BSNP**: Media harus bisa dicetak untuk siswa yang tidak punya akses digital.

**Task**:
- [ ] CSS @media print yang bersih (tanpa nav bar, tanpa dekorasi)
- [ ] Export per halaman sebagai PDF
- [ ] Opsi: "Cetak Semua Halaman" vs "Cetak Halaman Ini"

### 16.7 Teacher vs Student Mode

**Masalah**: Beberapa konten (CP/ATP detail, skor breakdown) hanya untuk guru, bukan siswa.

**Task**:
- [ ] Role flag: `mode: 'teacher' | 'student'`
- [ ] DokumenTemplate: guru lihat semua tab, siswa lihat TP + profil saja
- [ ] HasilTemplate: guru lihat breakdown lengkap, siswa lihat ringkasan
- [ ] Export: pilih role saat generate

### 16.8 Analytics / Learning Tracking

**Masalah**: Guru tidak tahu bagaimana siswa berinteraksi dengan media.

**Task**:
- [ ] Track waktu per halaman (time on page)
- [ ] Track interaksi per elemen (berapa kali klik, jawaban yang dipilih)
- [ ] Report untuk guru: heatmap engagement
- [ ] Export analytics sebagai CSV/JSON

---

## 🏗️ Infrastruktur yang Perlu Diupdate Per Phase

### Setiap template baru membutuhkan:
1. `src/components/canva/page-template/[Nama]Template.tsx` — Komponen template
2. `src/components/canva/types.ts` — Tambah ke `PageTemplateType` union type
3. `src/components/canva/page-template/PageTemplate.tsx` — Tambah case di switch
4. `src/store/canva/template-data.ts` — Tambah case di `buildTemplateData` + `getTemplateLabel`
5. `src/store/authoring-store.ts` atau slice baru — Data store untuk konten
6. `src/components/canva/Stage.tsx` — Tambah icon di `templateIcon` map
7. `src/export/ExportApp.tsx` — Tambah icon di `TEMPLATE_ICON` map + `getNextLabel`
8. `src/lib/canva-constants.ts` — Tambah ke `populateTemplateElements` jika perlu
9. Panel Konten di sidebar — Form input untuk data template
10. Template selector — Card untuk pilih template baru

---

## 📌 Catatan Penting

- **4-Layer Sync** (buildTemplateData → syncTemplateData → orphan cleanup → auto-subscription) **JANGAN DIUBAH** — sudah stabil
- Semua nav button menggunakan `TemplateNavButton` komponen — konsisten
- Guard pattern: `useInteractiveStore.getState().mode !== 'interactive'` — hanya navigasi di Play/Export
- Template baru harus mengikuti pola `SubTemplateProps` yang sudah ada
- Setiap phase harus di-build dan di-test sebelum lanjut ke phase berikutnya
- Push ke git setelah setiap phase selesai

---

*Roadmap ini akan diupdate seiring progres implementasi.*
