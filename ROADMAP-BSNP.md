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
| 6 | **Dokumen** | CP/TP/ATP (referensi guru) | ✅ Ada | - |
| 7 | **Materi** | Penyajian materi | ✅ Ada | - |
| 8 | **Rangkuman** | Penegasan materi | ❌ Belum ada | 13 |
| 9 | **Diskusi** | Aktivitas kolaboratif | ✅ Ada | - |
| 10 | **Kuis** | Evaluasi formatif | ✅ Ada | - |
| 11 | **Game** | Penguatan interaktif | ✅ Ada | - |
| 12 | **Skenario** | Higher-order thinking | ✅ Ada | - |
| 13 | **Refleksi** | Metakognisi | ✅ Ada | - |
| 14 | **Hasil** | Umpan balik | ⚠️ Perlu rekomendasi | 14 |
| 15 | **Sumber** | Referensi + glosarium | ❌ Belum ada | 14 |
| 16 | **Penutup** | Penutup + tindak lanjut | ✅ Ada | - |

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
