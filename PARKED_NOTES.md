# PARKED_NOTES — Catatan Area yang Diparkir

File ini dipakai untuk mencatat masalah yang ditemukan di area parkir.

Masalah di area parkir tidak boleh langsung diperbaiki sekarang.

---

## Format Catatan

```txt
Tanggal:
Area:
Temuan:
Kenapa tidak dikerjakan sekarang:
Kapan boleh dikerjakan:
```

---

## Area yang Diparkir

1. AI Generator
2. Template Baru
3. Marketplace
4. SCORM
5. PWA / Offline Sync
6. Dashboard Baru
7. Onboarding Baru
8. Design System Advance
9. VCS
10. Typography Redesign
11. Color System Redesign
12. Health Check Lanjutan
13. Gamifikasi Tambahan
14. Game Baru
15. Import Baru

---

## Catatan

### 1. Duplicate navigation di export

Tanggal: 2026-06-09
Area: Export HTML
Temuan: ExportApp dan PageFrame sama-sama memiliki kontrol navigasi (prev/next) untuk schema-driven pages di mode export. Ini menyebabkan dua set tombol navigasi yang mungkin out-of-sync karena terhubung ke store yang berbeda (canva-store vs learning-media-store).
Kenapa tidak dikerjakan sekarang: Masuk area Export, bukan runtime sprint ini. Perlu audit export tersendiri.
Kapan boleh dikerjakan: Sprint 4 — Export HTML

### 2. Answer tracking di interactive-store

Tanggal: 2026-06-09
Area: Runtime / Data Model
Temuan: interactive-store hanya menyimpan score dan completed per block, tetapi tidak menyimpan jawaban siswa (option mana yang dipilih). Kembali ke halaman kuis → UI mungkin tidak menampilkan jawaban sebelumnya. Perlu desain answersByPage atau responsesByBlockId.
Kenapa tidak dikerjakan sekarang: Ini bukan fix kecil. Perlu desain struktur state dan perubahan schema interactive-store yang cukup besar.
Kapan boleh dikerjakan: Setelah Sprint 4 — Export HTML, sebagai runtime improvement terpisah
