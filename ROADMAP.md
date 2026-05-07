# 🗺️ ROADMAP — Authoring Tool v3
> "Supaya guru bisa bikin media pembelajaran interaktif yang bikin siswa semangat belajar"

---

## 📍 Kondisi Sekarang (7 Mei 2026)

### ✅ Yang Sudah Bekerja Baik
- [x] Halaman Canva untuk menyusun blok-blok konten
- [x] Template halaman: Cover, Dokumen, Materi, Kuis, Game, Hasil, Skenario
- [x] Panel kiri untuk mengatur halaman dan menambah blok
- [x] Panel kanan untuk mengedit properti blok
- [x] Export ke HTML (Unified Export) — sudah bisa download file
- [x] Tombol Play untuk preview interaktif
- [x] Auto-generate halaman dari tipe (Full Interaktif, Materi Fokus, dll)
- [x] Drag & drop blok di canva
- [x] Gradient dan warna background halaman
- [x] Layout preset (2 kolom, sidebar, headline, dll)
- [x] Undo/Redo
- [x] Simpan otomatis ke browser

### 🔴 Masalah Inti yang HARUS Diperbaiki Dulu

**Alur utama app: PRESET → CANVA → EXPORT**

Sekarang alur ini **putus di 3 titik**:

```
  PRESET ──────► CANVA ──────► EXPORT
    ❌              ❌              ❌
  Tidak lengkap   Tampil jelek   Beda dengan canva
  & kurang cantik & tidak full    & interaktif rusak
```

---

## 🎯 Rencana Kerja — Prioritas Baru (Revisi)

### FASE 1: 🔴 INTI APP — Preset → Canva → Export WYSIWYG
> **Tanpa ini, app TIDAK BERFUNGSI sebagai media pembelajaran.**
> Ini yang guru pakai langsung. Kalau ini rusak, semua fitur lain tidak ada gunanya.

| # | Masalah | Bahasanya Guru | Status |
|---|---------|---------------|--------|
| 1.1 | **Preset tidak lengkap & kurang cantik** | "Saya pilih Full Interaktif, tapi halamannya jelek dan sederhana. Tidak ada kartu, tidak ada ikon, tidak ada visual menarik." | ❌ |
| 1.2 | **Canva tidak menampilkan halaman secara full** | "Yang muncul di canva cuma teks polos. Harusnya kelihatan seperti slide presentasi yang cantik — ada kartu warna, ikon, layout rapi." | ❌ |
| 1.3 | **Export berbeda dengan tampilan di Canva** | "Yang saya susun di canva TIDAK SAMA dengan yang keluar di export. Susun cantik, keluar jelek." | ❌ |
| 1.4 | **Interaktif tidak berfungsi di Export** | "Kuis dan game tidak bisa dimainkan di file export. Siswa klik tapi tidak ada respons." | ❌ |
| 1.5 | **Game engine CSS tidak lengkap** | "Tampilan game di export jelek — tidak ada animasi, tombol tidak menarik, layout berantakan." | ❌ |

### FASE 2: 🟡 KUALITAS — Skor, Sinkronisasi, Navigasi
> **Setelah tampilan benar, perbaiki kualitas interaksinya.**
> P2 (dataIdx) dan P3 (sync) masuk sini — penting tapi tidak membuat tampilan jadi cantik.

| # | Masalah | Bahasanya Guru | Status |
|---|---------|---------------|--------|
| 2.1 | **Skor game selalu 100%** | "Siswa jawab salah tapi dapat nilai sempurna. Guru tertipu." | ❌ |
| 2.2 | **Data kuis bisa salah referensi** | "Kalau saya hapus soal no.3, kuis di bawahnya jadi kacau." | ❌ |
| 2.3 | **Edit materi tidak otomatis update ke canva** | "Saya edit materi di kiri, tapi canva tidak berubah. Harus hapus dan taruh ulang." | ❌ |
| 2.4 | **Setting navigasi tidak berpengaruh di export** | "Saya atur navigasi tapi di export tetap sama." | ❌ |
| 2.5 | **Crossword pakai popup browser** | "Teka silang tidak bisa dipakai di HP." | ❌ |
| 2.6 | **Flashcard tidak ada efek flip 3D** | "Kartu tidak ada efek putar, kurang menarik." | ❌ |

### FASE 3: 🟢 KENYAMANAN — Fitur Tambahan
> **Dilakukan setelah inti dan kualitas OK.**

| # | Masalah | Bahasanya Guru | Status |
|---|---------|---------------|--------|
| 3.1 | Halaman tidak otomatis terbagi saat penuh | ❌ |
| 3.2 | Tidak bisa edit nama halaman | ❌ |
| 3.3 | Label halaman generik di export | ❌ |
| 3.4 | Tema navbar tidak muncul di export | ❌ |
| 3.5 | Sinkronisasi penuh (orphan cleanup + auto-add) | ❌ |

### FASE 4: ⭐ PREMIUM — Penyempurnaan
> **Nice to have — setelah semua yang di atas selesai.**

| # | Masalah | Status |
|---|---------|:------:|
| 4.1 | Game engine versi premium (stage-based, feedback, sound) | 📋 |
| 4.2 | Animasi cantik (flip, shake, confetti) | 📋 |
| 4.3 | Aksesibilitas (screen reader, keyboard nav) | 📋 |
| 4.4 | Testing otomatis | 📋 |
| 4.5 | Performa (lazy-load) | 📋 |
| 4.6 | Cleanup file kode lama (P1 Pipeline) | 📋 |

---

## 🗓️ Timeline

```
SEKARANG ───────────────────────────────────────────────────────────►

  FASE 1               FASE 2            FASE 3         FASE 4
  INTI APP             KUALITAS          KENYAMANAN     PREMIUM
  ─────────            ─────────         ─────────      ─────────
  • Preset cantik      • Skor benar      • Auto-split   • Stage-based
  • Canva full         • Data stabil     • Edit nama    • Animasi
  • Export = Canva     • Sync otomatis   • Label        • Sound FX
  • Interaktif jalan   • NavConfig       • Tema navbar  • Aksesibilitas
  • Game CSS cantik    • Crossword HP    • Full sync    • Testing
                       • Flashcard 3D                   • Cleanup

  ◄───── PRIORITAS ──────►                     ◄── NANTI ──►
```

---

## 📊 Progress Tracker

| Fase | Total Item | Selesai | Progress |
|------|-----------|---------|----------|
| Fase 1: Inti App | 5 | 0 | ░░░░░ 0% |
| Fase 2: Kualitas | 6 | 0 | ░░░░░░ 0% |
| Fase 3: Kenyamanan | 5 | 0 | ░░░░░ 0% |
| Fase 4: Premium | 6 | 0 | ░░░░░░ 0% |

---

## 🎓 Catatan untuk Guru

**Inti app yang harus jalan dulu:**
1. Preset → menghasilkan halaman yang **cantik dan lengkap**
2. Canva → menampilkan halaman **full sesuai preset**
3. Export → **sama persis** dengan yang ada di canva
4. Interaktif → kuis dan game **bisa dimainkan** di export

**Baru setelah itu:**
- Skor dihitung benar
- Data stabil (tidak kacau kalau hapus soal)
- Edit otomatis update
- Dll

**Jadi: Tampilan dulu, kualitas skor belakangan.**

---

*Dokumen ini diperbarui setiap kali ada progress.*
*Terakhir diperbarui: 7 Mei 2026*
