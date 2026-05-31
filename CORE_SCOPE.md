# CORE_SCOPE — Aturan Fokus Pengembangan SILSE

## Tujuan Saat Ini

Saat ini SILSE tidak sedang menambah fitur baru.

Tujuan utama hanya:

1. Satu media pembelajaran bisa dibuka di workspace.
2. Satu media pembelajaran bisa diedit.
3. Satu media pembelajaran bisa dimainkan.
4. Satu media pembelajaran bisa diekspor sebagai HTML.

Jika pekerjaan tidak membantu 4 tujuan itu, maka pekerjaan tersebut tidak boleh dikerjakan sekarang.

---

# Prinsip Utama

## Fokus sekarang

Fokus hanya pada:

1. UI Workspace
2. Engine Tampilan Media
3. Runtime Media
4. Export HTML

## Jangan melebar

Jangan mengerjakan fitur tambahan, template baru, AI, SCORM, PWA, marketplace, atau sistem desain lanjutan.

Jika menemukan masalah di area yang diparkir, catat saja di `PARKED_NOTES.md`. Jangan diperbaiki sekarang.

---

# A. AREA CORE YANG BOLEH DIKERJAKAN

Hanya 4 area berikut yang boleh disentuh.

---

## 1. UI Workspace

UI Workspace adalah tempat guru bekerja.

Bahasa sederhana:

- kiri = daftar halaman
- tengah = tampilan media
- kanan = edit isi / pengaturan
- atas/bawah = toolbar dasar / navigasi

### File yang termasuk UI Workspace

Boleh disentuh jika masalahnya benar-benar berkaitan dengan workspace:

```txt
src/components/canva/CanvaBuilder.tsx
src/components/canva/LearningMediaShell.tsx
src/components/canva/LeftPanel.tsx
src/components/canva/right-panel/RightPanel.tsx
src/components/canva/page-renderer/
src/components/canva/stage/
src/components/canva/InlineEditableText.tsx
src/hooks/use-learning-editor.ts
```

### Yang boleh dikerjakan di UI Workspace

* memperbaiki workspace agar jelas
* memperbaiki daftar halaman di kiri
* memperbaiki halaman aktif yang tampil di tengah
* memperbaiki panel kanan agar sesuai halaman/blok aktif
* memperbaiki klik untuk edit
* memperbaiki klik luar untuk menyimpan
* memperbaiki pindah halaman saat sedang edit
* memastikan hanya satu halaman aktif yang tampil
* memastikan edit mode dan play mode tidak bercampur

### Yang tidak boleh dikerjakan di UI Workspace

* membuat dashboard baru
* membuat onboarding baru
* membuat template gallery baru
* membuat desain UI besar-besaran
* membuat color theme baru
* membuat animasi dekoratif baru
* menambah fitur yang tidak diminta

---

## 2. Engine Tampilan Media

Engine adalah bagian yang mengubah data media menjadi tampilan.

Bahasa sederhana:

```txt
data media → tampil jadi halaman interaktif
```

### File yang termasuk Engine Tampilan Media

Boleh disentuh jika masalahnya berkaitan dengan tampilan media:

```txt
src/core/engine/SchemaEngine.tsx
src/core/engine/SchemaEngine.utils.ts
src/core/renderer/SchemaRenderer.tsx
src/core/renderer/blocks/
src/core/registry/SceneRegistry.tsx
src/core/schema/
src/core/scene/SceneLayoutEngine.ts
src/core/layout/SceneOverflowEngine.ts
```

### Yang boleh dikerjakan di Engine

* memperbaiki data yang tidak tampil
* memperbaiki halaman/screen yang bertumpuk
* memperbaiki renderer yang membuat tampilan rusak
* memastikan media dirender lewat satu jalur yang jelas
* memastikan page/screen tidak keluar area
* memastikan renderer tidak dobel jalur
* memastikan preview/play memakai jalur render yang benar

### Yang tidak boleh dikerjakan di Engine

* membuat block baru tanpa permintaan
* membuat game baru
* membuat sistem desain baru
* membuat AI generator
* membuat layout grammar baru
* membuat visual linter baru
* membuat sistem baru jika sistem lama bisa diperbaiki

---

## 3. Runtime Media

Runtime adalah bagian yang membuat media bisa dimainkan siswa.

### Yang termasuk Runtime

* tombol Mulai
* tombol Berikutnya
* tombol Sebelumnya
* progress bar
* skor
* status halaman selesai
* kuis benar/salah
* game selesai
* refleksi tersimpan
* halaman terkunci sampai aktivitas selesai

### File yang termasuk Runtime

Boleh disentuh jika masalahnya berkaitan dengan interaksi belajar:

```txt
src/components/canva/LearningMediaShell.tsx
src/store/interactive-store.ts
src/store/canva/session-slice.ts
src/core/edu/page-runtime-contract.ts
src/hooks/use-score-animation.ts
src/hooks/use-learning-editor.ts
```

### Yang boleh dikerjakan di Runtime

* memperbaiki tombol lanjut/sebelumnya
* memperbaiki progress tidak berubah
* memperbaiki skor tidak naik
* memperbaiki halaman terkunci tidak terbuka
* memperbaiki kuis/game/refleksi agar mengubah status selesai
* memperbaiki play mode agar tidak masuk edit mode
* memperbaiki score/progress/completion agar sinkron

### Yang tidak boleh dikerjakan di Runtime

* badge system
* level system
* leaderboard
* streak
* koin
* avatar
* achievement dashboard
* reward animasi berlebihan
* gamifikasi tambahan

### Yang tetap boleh sebagai Runtime Core

* skor
* progress
* feedback benar/salah
* completion
* tombol ulangi
* navigation lock

---

## 4. Export HTML

Export HTML adalah bagian yang mengubah media menjadi file HTML.

### Yang termasuk Export HTML Core

* export HTML berhasil
* hasil export sama dengan preview/play
* data media masuk ke export
* tombol tetap jalan di export
* skor tetap jalan di export
* progress tetap jalan di export

### File yang termasuk Export HTML

Boleh disentuh jika masalahnya berkaitan langsung dengan export HTML:

```txt
src/app/api/export/route.ts
src/export/ExportApp.tsx
src/export/entry-client.tsx
src/export/export.css
src/lib/export/
```

### Yang boleh dikerjakan di Export HTML

* memperbaiki export gagal
* memastikan preview dan export sama
* memastikan data masuk ke export
* memastikan export memakai renderer yang sama
* memperbaiki tombol/skor/progress di export
* memperbaiki HTML standalone agar bisa dibuka

### Yang tidak boleh dikerjakan di Export

* SCORM dulu
* LMS tracking dulu
* export PDF dulu
* export PowerPoint dulu
* analytics dulu
* format export baru dulu

---

# B. AREA PARKIR — JANGAN DIKERJAKAN DULU

Area berikut tidak boleh dikerjakan sekarang, kecuali user secara eksplisit meminta.

Jika menemukan masalah di area ini, catat di `PARKED_NOTES.md`.

---

## 1. AI Generator

Diparkir dulu.

Yang tidak boleh dikerjakan:

* generate materi otomatis
* generate template otomatis
* generate soal otomatis
* refine AI
* prompt AI
* API AI
* auto-generate lesson
* auto-generate content

File yang diparkir:

```txt
src/app/api/ai/
src/components/authoring/auto-generate/
src/store/canva/auto-generate.ts
```

Alasan diparkir:

Saat ini targetnya bukan membuat otomatis, tetapi membuat satu media bisa berjalan normal.

---

## 2. Template Baru

Diparkir dulu.

Yang tidak boleh dikerjakan:

* menambah template baru
* menambah preset baru
* marketplace template
* template registry baru
* template subject baru
* template mapel baru

File yang diparkir:

```txt
src/presets/
src/core/preset/
src/components/canva/left-panel/template-gallery/
```

Alasan diparkir:

Template yang ada saja harus dibuktikan stabil dari workspace sampai export.

---

## 3. Design System Advance

Diparkir dulu.

Maksudnya: aturan desain yang terlalu rumit.

Yang tidak boleh dikerjakan:

* VCS
* Visual Composition Standard
* visual linter lanjutan
* token compliance lanjutan
* scene-aware typography
* emotional layer
* projector mode
* print mode
* student mode
* layout grammar
* transition rhythm
* typography redesign
* color system redesign

File yang diparkir:

```txt
src/core/edu/
src/core/vcs/
src/core/themes/
```

Yang masih boleh:

* font harus jelas
* tombol harus terlihat
* navbar harus terlihat
* card tidak boleh pecah
* warna dasar harus konsisten

Catatan:

Perbaikan kecil yang langsung membuat media bisa terbaca boleh dilakukan. Tetapi jangan membangun sistem desain baru.

---

## 4. Health Check Lanjutan

Diparkir dulu.

Yang tidak boleh dikerjakan:

* quality gate lanjutan
* auto repair lanjutan
* registry health dashboard
* visual score lanjutan
* health check baru
* validator baru

Yang masih boleh:

Health check yang sudah ada boleh dipakai untuk melihat error.

Tetapi jangan menambah sistem health check baru sekarang.

---

## 5. SCORM

Diparkir dulu.

Yang tidak boleh dikerjakan:

* SCORM zip
* LMSInitialize
* LMSSetValue
* Moodle tracking
* SCORM reporting
* LMS completion tracking

Yang masih boleh:

HTML export dulu.

---

## 6. PWA dan Offline

Diparkir dulu.

Yang tidak boleh dikerjakan:

* service worker
* manifest
* offline queue
* offline sync
* cache strategy
* offline-first improvement

Alasan diparkir:

App utama harus normal dulu sebelum offline dibuat rapi.

---

## 7. Gamifikasi Tambahan

Diparkir dulu.

Yang tidak boleh dikerjakan:

* badge
* level
* leaderboard
* streak
* coin
* avatar
* achievement
* reward dashboard
* lencana global
* koleksi reward

Yang tetap core dan boleh:

* skor
* progress
* feedback benar/salah
* completion
* tombol ulangi
* navigation lock

---

## 8. Dashboard dan Onboarding

Diparkir dulu.

Yang tidak boleh dikerjakan:

* dashboard baru
* tour baru
* onboarding baru
* homepage baru
* template gallery baru
* user journey baru

---

## 9. Import Baru

Diparkir dulu.

Yang tidak boleh dikerjakan:

* import Word baru
* import Excel baru
* import PDF baru
* import Canva baru
* import PowerPoint baru

---

# C. URUTAN KERJA UNTUK 1 AI

Karena hanya menggunakan 1 AI, kerjakan core secara berurutan.

## Urutan wajib

```txt
1. Workspace
2. Runtime
3. Engine
4. Export HTML
```

AI tidak boleh loncat ke Export jika Workspace dan Runtime belum dinyatakan stabil.

---

## Sprint 1 — Workspace

Target:

* guru bisa membuka media
* daftar halaman tampil di kiri
* klik halaman di kiri memindahkan halaman aktif
* media tampil di tengah
* panel kanan muncul sesuai konteks
* klik teks bisa edit
* klik luar menyimpan
* pindah halaman saat edit tetap menyimpan
* edit mode dan play mode tidak bercampur

Tidak boleh membahas:

* export
* template baru
* AI
* design system
* SCORM
* PWA

---

## Sprint 2 — Runtime

Target:

* tombol Mulai jalan
* tombol Berikutnya jalan
* tombol Sebelumnya jalan
* progress berubah
* skor naik
* kuis selesai membuka tombol lanjut
* game selesai membuka tombol lanjut
* refleksi tersimpan membuka tombol lanjut
* edit mode dan play mode terpisah

Tidak boleh membahas:

* template baru
* AI
* design system
* export lanjutan
* SCORM
* PWA

---

## Sprint 3 — Engine

Target:

* media tampil lewat jalur render yang jelas
* tidak ada halaman bertumpuk
* tidak ada renderer paralel yang membuat hasil berbeda
* preview/play memakai jalur yang sama
* data schema/page/screen terbaca stabil

Tidak boleh membahas:

* template baru
* AI
* design system advance
* health check lanjutan

---

## Sprint 4 — Export HTML

Target:

* export HTML berhasil
* hasil export sama dengan preview
* tombol tetap jalan di export
* progress tetap jalan di export
* score tetap jalan di export
* media bisa dibuka tanpa aplikasi

Tidak boleh membahas:

* SCORM
* LMS
* PDF
* PowerPoint
* analytics

---

# D. ATURAN KERJA WAJIB UNTUK AI

Setiap AI harus mengikuti aturan berikut.

---

## Aturan 1 — Baca CORE_SCOPE Dulu

Sebelum coding, AI wajib membaca:

```txt
CORE_SCOPE.md
```

Lalu menjawab:

```txt
Area core yang dikerjakan:
Masalah yang akan diperbaiki:
File yang akan disentuh:
File yang tidak akan disentuh:
Kenapa pekerjaan ini masuk core:
Cara test:
```

Kalau AI tidak menjawab ini, jangan izinkan coding.

---

## Aturan 2 — Kerjakan Satu Area Saja

AI hanya boleh mengerjakan satu area per sesi.

Contoh:

```txt
Sesi ini hanya Workspace.
```

Maka AI tidak boleh mengubah Export.

---

## Aturan 3 — Jangan Sentuh Area Parkir

Jika AI menyentuh area parkir tanpa izin, pekerjaan harus dihentikan.

---

## Aturan 4 — Catat, Jangan Perbaiki

Kalau AI menemukan masalah di area parkir, jangan diperbaiki.

Tulis di:

```txt
PARKED_NOTES.md
```

Format catatan:

```txt
Tanggal:
Area:
Temuan:
Kenapa tidak dikerjakan sekarang:
Kapan boleh dikerjakan:
```

---

## Aturan 5 — Tidak Boleh Membuat Sistem Baru

Jika masalah bisa diselesaikan dengan sistem yang sudah ada, jangan buat sistem baru.

---

## Aturan 6 — Tidak Boleh Menambah Fitur Baru

Saat ini tidak boleh menambah fitur baru.

Yang boleh:

* memperbaiki yang sudah ada
* menyambungkan flow yang putus
* menghapus jalur ganda
* menyamakan preview dan export
* memperbaiki bug yang menghalangi media dipakai

Yang tidak boleh:

* fitur AI baru
* template baru
* game baru
* dashboard baru
* mode baru
* export format baru

---

## Aturan 7 — Stop Jika Menemukan P0

Jika menemukan masalah besar P0, AI harus berhenti dan melaporkan.

Format:

```txt
P0 ditemukan:
File:
Penyebab:
Dampak:
Solusi minimal:
Butuh izin sebelum lanjut:
```

---

# E. FORMAT LAPORAN WAJIB SETELAH SELESAI

Setiap selesai kerja, AI wajib melaporkan dengan format ini:

```txt
Area core:
File yang diubah:
Masalah yang diperbaiki:
Kenapa ini masuk core:
Cara test:
Hasil test:
Area parkir yang tidak disentuh:
Risiko tersisa:
Langkah berikutnya:
```

---

# F. STOP CARD

Jika AI mulai melebar, balas dengan teks ini:

```txt
STOP. Itu area PARKIR.

Saat ini hanya boleh mengerjakan:
1. UI Workspace
2. Engine Tampilan Media
3. Runtime tombol/skor/progress/completion
4. Export HTML

Sekarang kita sedang di area: [ISI AREA SAAT INI].

Jelaskan hubungan pekerjaanmu dengan area core itu.
Kalau tidak ada hubungan langsung, catat di PARKED_NOTES.md dan jangan coding.
```

---

# G. CHECKLIST SEBELUM MERGE

Sebelum menerima hasil AI, cek:

```txt
1. Ini memperbaiki Workspace, Runtime, Engine, atau Export HTML?
2. Apakah file area parkir disentuh?
3. Apakah ada fitur baru?
4. Apakah cara test jelas?
5. Apakah hasil test ditulis?
6. Apakah preview masih jalan?
7. Apakah export masih jalan jika area export disentuh?
```

Jika jawabannya tidak jelas, jangan merge.

---

# H. TARGET SELESAI VERSI SEDERHANA

Aplikasi dianggap kembali ke jalur benar jika 12 hal ini berjalan:

1. Guru bisa membuka satu media.
2. Guru bisa melihat daftar halaman di kiri.
3. Guru bisa memilih halaman.
4. Media tampil di tengah.
5. Guru bisa edit teks dasar.
6. Kuis bisa dijawab.
7. Skor naik.
8. Tombol next/prev jalan.
9. Progress berubah.
10. Game bisa selesai.
11. Refleksi bisa disimpan.
12. Export HTML berhasil dan hasilnya sama dengan preview.

Jika 12 hal ini belum benar, jangan tambah fitur lain.

---

# I. KALIMAT SINGKAT UNTUK MEMULAI SESI AI

Gunakan ini setiap mulai sesi:

```txt
Baca CORE_SCOPE.md.

Mode kerja: CORE ONLY, satu AI.

Kerjakan hanya satu area sesuai urutan:
1. Workspace
2. Runtime
3. Engine
4. Export HTML

Jangan loncat ke area berikutnya sebelum area sekarang selesai dites.

Dilarang mengerjakan:
AI generator, template baru, marketplace, SCORM, PWA, offline sync, dashboard baru, onboarding baru, design system advance, VCS, typography redesign, color system redesign, health check lanjutan, gamifikasi tambahan, game baru, import baru.

Sebelum coding, tulis:
- area yang dikerjakan
- masalah yang mau diperbaiki
- file yang akan disentuh
- file yang tidak akan disentuh
- kenapa masuk core
- cara test

Jika menemukan masalah di area parkir, catat saja di PARKED_NOTES.md. Jangan diperbaiki.
```
