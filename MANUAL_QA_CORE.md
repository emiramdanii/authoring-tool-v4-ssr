# MANUAL QA CORE — SILSE

Tanggal dibuat: 2026-05-31
Tujuan: Membuktikan 5 target core yang masih MANUAL REQUIRED
Aturan: Jangan ubah kode. Jangan refactor. Jangan lanjut area parkir.
Status yang boleh diisi: **PASS** atau **FAIL** saja.

---

## PERSIAPAN SEBELUM TEST

1. Pastikan dev server berjalan: `cd /home/z/my-project/silse && npm run dev`
2. Buka browser di `http://localhost:3000`
3. Pastikan halaman utama SILSE muncul (tidak blank)
4. Siapkan catatan untuk setiap test

---

## CARA MASUK LEARN MODE

Ada 2 cara:

**Cara A — Dari ModeSwitch (Toolbar atas):**
- Di toolbar atas, cari pill toggle dengan 4 ikon
- Klik ikon **GraduationCap** (topi akademik) — label "Belajar"

**Cara B — Dari Preview Mode:**
- Klik ikon **Eye** (mata) di ModeSwitch untuk masuk Preview
- Di floating nav bawah, klik tombol **▶ Main** ("Main sebagai Siswa")
- Atau tekan keyboard `L`

Setelah masuk Learn mode, Anda akan melihat:
- TopNavbar atas: ← Kembali | Judul Halaman | Progress bar | Skor
- Phase badge: emoji + label (contoh: 🏠 Cover, 📝 Kuis, 🎮 Game)
- Edit/Main toggle: pill biru "✏️ Edit" atau pill hijau "▶ Main"
- BottomNav bawah: tombol navigasi + dot indicators

---

## TARGET T8 — EDIT TEKS

### Tujuan
Membuktikan bahwa guru bisa mengedit teks di Learn mode, teks tersimpan, dan tetap tersimpan setelah pindah halaman.

### Prasyarat
- Sudah masuk Learn mode
- Ada halaman yang mengandung teks (judul atau isi)

### Langkah Test

| Langkah | Aksi | Yang Harus Terlihat |
|---------|------|---------------------|
| T8.1 | Di Learn mode, klik pill **✏️ Edit** (biru) di phase badge row | Pill berubah jadi hijau "▶ Main". Tooltip: "Mode Edit — klik teks untuk mengedit" |
| T8.2 | Arahkan kursor ke teks di canvas (judul/isi) | Kursor berubah jadi pointer. Hover muncul warna biru muda (bg-blue-50/60). Tooltip: "Klik untuk mengedit" |
| T8.3 | Klik teks tersebut | Teks masuk mode edit: muncul ring biru (ring-2 ring-blue-400/50), kursor berubah jadi text cursor, teks menjadi contentEditable |
| T8.4 | Ubah 1 kata (hapus kata lama, ketik kata baru) | Teks berubah sesuai ketikan |
| T8.5 | Klik area kosong di luar teks (blur) | Ring biru hilang. Teks kembali ke tampilan normal. **Teks yang diubah tetap tersimpan** — tidak balik ke teks lama |
| T8.6 | Klik dot halaman lain di BottomNav | Halaman berpindah |
| T8.7 | Klik dot halaman tadi untuk kembali | **Teks yang diubah masih tersimpan** — tidak hilang atau balik |
| T8.8 | Tekan keyboard `Escape` untuk kembali ke edit mode utama | Kembali ke CanvaBuilder edit mode |

### Hasil yang Diharapkan
- Teks bisa diklik dan diubah di Learn Edit sub-mode
- Setelah blur, teks tersimpan
- Setelah pindah halaman dan kembali, teks tetap berubah
- Tidak crash

### Jika FAIL, Catat:

```
Target FAIL: T8 Edit Teks
Langkah ke: (misal: T8.5)
Yang saya klik: (misal: area kosong setelah edit)
Yang saya harapkan: (misal: teks "Halo Dunia" tersimpan)
Yang terjadi: (misal: teks balik jadi "Hello World")
Screenshot/log: (lampirkan)
```

### Status: _______________ (PASS / FAIL)

---

## TARGET T11 — KUIS DIJAWAB

### Tujuan
Membuktikan bahwa kuis bisa dijawab, feedback muncul, dan jawaban tersimpan.

### Prasyarat
- Sudah masuk Learn mode
- Ada halaman bertipe **kuis** di media (ditandai badge 📝 Kuis)

### Langkah Test

| Langkah | Aksi | Yang Harus Terlihat |
|---------|------|---------------------|
| T11.1 | Pastikan di sub-mode **▶ Main** (hijau). Jika masih ✏️ Edit, klik pill tersebut untuk toggle | Pill hijau "▶ Main". Tooltip: "Mode Main — klik interaksi untuk bermain" |
| T11.2 | Navigasi ke halaman kuis (klik dot yang bertanda 📝 atau navigasi dengan Selanjutnya) | Halaman kuis muncul. Terlihat: progress bar tipis, "Soal 1/n", "Skor: 0", pertanyaan, dan opsi jawaban (A. ..., B. ..., dst) |
| T11.3 | Klik salah satu opsi jawaban (misal opsi A) | **Opsi terpilih** → warna berubah. Jika benar: hijau (bg-emerald-500/20) + ikon check_circle. Jika salah: merah (bg-red-500/20) + ikon cancel. **Feedback muncul.** Opsi lain ter-disable. Jika ada penjelasan (💡), muncul kotak biru |
| T11.4 | Tunggu 1.5 detik | **Auto-advance** ke soal berikutnya. "Soal 2/n" muncul. Skor bertambah jika jawaban benar |
| T11.5 | Jawab soal berikutnya | Sama seperti T11.3 — feedback muncul, opsi berubah warna |
| T11.6 | Lanjut sampai soal terakhir dijawab | Masuk **Result phase**: terlihat persentase besar, label tier ("Sangat Baik"/"Baik"/"Perlu Latihan"), "Skor: x dari y soal benar", tombol "Ulangi Kuis" |
| T11.7 | Cek BottomNav | Tombol **Selanjutnya** seharusnya sudah terbuka (tidak terkunci 🔒) karena kuis sudah dijawab |

### Hasil yang Diharapkan
- Klik opsi → feedback muncul (warna hijau/merah + ikon)
- Auto-advance ke soal berikutnya
- Result phase muncul setelah semua soal dijawab
- Jawaban tidak hilang (navigasi ke halaman lain dan kembali → kuis tetap terjawab)
- Navigasi terbuka setelah kuis selesai

### Catatan Khusus
- Jika halaman kuis terkunci (🔒 Terkunci), itu NORMAL — kuis harus dijawab dulu
- Setelah kuis dijawab, 🔒 harus hilang dan diganti **Selanjutnya**
- Jika kuis TIDAK ada soal, akan muncul: "❓ Belum ada soal" — itu berarti media contoh tidak punya soal kuis, bukan bug kuis

### Jika FAIL, Catat:

```
Target FAIL: T11 Kuis Dijawab
Langkah ke: (misal: T11.3)
Yang saya klik: (misal: opsi A di soal 1)
Yang saya harapkan: (misal: feedback hijau muncul + skor naik)
Yang terjadi: (misal: klik tidak bereaksi, tidak ada feedback)
Screenshot/log: (lampirkan)
```

### Status: _______________ (PASS / FAIL)

---

## TARGET T12 — SKOR NAIK

### Tujuan
Membuktikan bahwa skor naik saat menjawab benar, tidak naik saat salah, dan skor tetap saat pindah halaman.

### Prasyarat
- Sudah masuk Learn mode, sub-mode ▶ Main
- Ada halaman kuis di media

### Langkah Test

| Langkah | Aksi | Yang Harus Terlihat |
|---------|------|---------------------|
| T12.1 | Lihat TopNavbar atas — cari elemen skor (🏆) | Jika ada kuis/game, terlihat **🏆 0/100** (atau angka max lain) |
| T12.2 | Navigasi ke halaman kuis | Kuis muncul |
| T12.3 | Jawab soal dengan **benar** | Feedback hijau + check_circle. Di kuis: "Skor: 1" (bertambah). Di TopNavbar: 🏆 angka bertambah |
| T12.4 | Setelah auto-advance, jawab soal berikutnya dengan **benar** | Skor terus bertambah |
| T12.5 | Jawab satu soal dengan **salah** | Feedback merah + cancel. Skor TIDAK bertambah |
| T12.6 | Setelah kuis selesai, lihat TopNavbar | 🏆 menunjukkan skor akumulasi. Misal: 🏆 40/100 |
| T12.7 | Klik dot halaman lain (bukan kuis) | Halaman berpindah |
| T12.8 | Lihat TopNavbar di halaman baru | **Skor tetap sama** — tidak reset ke 0 |
| T12.9 | Kembali ke halaman kuis | Skor tetap sama. Kuis sudah terjawab (tidak bisa dijawab ulang tanpa klik "Ulangi Kuis") |

### Hasil yang Diharapkan
- Jawaban benar → skor naik
- Jawaban salah → skor tidak naik
- Pindah halaman → skor tetap (tidak reset)
- Skor terlihat di TopNavbar (🏆 earned/max)
- Skor juga terlihat di QuizWidget ("Skor: n")

### Jika FAIL, Catat:

```
Target FAIL: T12 Skor Naik
Langkah ke: (misal: T12.8)
Yang saya klik: (misal: dot halaman materi)
Yang saya harapkan: (misal: skor tetap 40/100)
Yang terjadi: (misal: skor reset jadi 0/100)
Screenshot/log: (lampirkan)
```

### Status: _______________ (PASS / FAIL)

---

## TARGET T14 — PROGRESS BERUBAH

### Tujuan
Membuktikan bahwa progress berubah sesuai halaman yang dikunjungi/diselesaikan, dan progress penuh di akhir.

### Prasyarat
- Sudah masuk Learn mode, sub-mode ▶ Main
- Media punya beberapa halaman

### Langkah Test

| Langkah | Aksi | Yang Harus Terlihat |
|---------|------|---------------------|
| T14.1 | Mulai di halaman pertama (Cover) | TopNavbar: progress bar kecil + angka misal **14%** (1/7 halaman). Phase badge: 🏠 Cover. BottomNav: tombol **▶ Mulai** |
| T14.2 | Catat angka progress sekarang | Tulis di catatan: "Progress awal = ____%" |
| T14.3 | Klik **▶ Mulai** (atau **Selanjutnya**) | Pindah ke halaman 2. Progress bar bertambah. Angka berubah (misal 28%). Dot halaman 1 berubah jadi hijau (completed ✓) |
| T14.4 | Klik **Selanjutnya** lagi | Pindah ke halaman 3. Progress berubah lagi. Dot halaman 2 berubah jadi hijau |
| T14.5 | Lanjut navigasi beberapa halaman | Progress terus bertambah seiring halaman selesai |
| T14.6 | Jika menemukan halaman terkunci (🔒), selesaikan aktivitasnya (kuis/game/refleksi) | Setelah selesai, 🔒 hilang, **Selanjutnya** terbuka, dot berubah hijau |
| T14.7 | Navigasi sampai halaman terakhir | BottomNav: tombol **✓ Selesai**. Progress mendekati/semua 100% |
| T14.8 | Klik **✓ Selesai** | **CompletionModal** muncul: "Pembelajaran Selesai!", bintang 1-3, skor, progress bar penuh |

### Hasil yang Diharapkan
- Progress dimulai rendah (bukan 0% karena cover otomatis completed saat dikunjungi)
- Setiap kali pindah ke halaman baru, progress bertambah
- Dot indicators berubah: abu-abu → hijau (✓) saat halaman selesai
- Halaman terkunci (amber 🔒) menjadi completed setelah aktivitas selesai
- Di halaman terakhir, progress penuh
- CompletionModal muncul dengan progress 100%

### Detail Dot Indicators

| Warna Dot | Arti |
|-----------|------|
| Biru (pill lebar) | Halaman aktif/sekarang |
| Hijau + ✓ | Halaman selesai (completed) |
| Abu-abu (slate) | Halaman belum dikunjungi |
| Amber + 🔒 | Halaman terkunci (butuh aktivitas) |

### Jika FAIL, Catat:

```
Target FAIL: T14 Progress Berubah
Langkah ke: (misal: T14.3)
Yang saya klik: (misal: tombol Selanjutnya)
Yang saya harapkan: (misal: progress naik dari 14% ke 28%)
Yang terjadi: (misal: progress tetap 14%, dot tidak berubah)
Screenshot/log: (lampirkan)
```

### Status: _______________ (PASS / FAIL)

---

## TARGET T15 — GAME SELESAI

### Tujuan
Membuktikan bahwa game bisa dimainkan sampai selesai, status selesai muncul, next terbuka, dan score/progress berubah.

### Prasyarat
- Sudah masuk Learn mode, sub-mode ▶ Main
- Ada halaman bertipe **game** di media (ditandai badge 🎮 Game)

### Langkah Test

| Langkah | Aksi | Yang Harus Terlihat |
|---------|------|---------------------|
| T15.1 | Pastikan di sub-mode **▶ Main** (hijau) | Pill hijau "▶ Main" |
| T15.2 | Navigasi ke halaman game | Halaman game muncul. Phase badge: 🎮 Game. BottomNav: mungkin 🔒 Terkunci (harus selesaikan game dulu) |
| T15.3 | Mainkan game sesuai tipenya | Game merespons interaksi. Lihat panduan per tipe game di bawah |
| T15.4 | Selesaikan game sampai akhir | **Result/status selesai muncul**. Misal: persentase, "x/y benar", tombol "Ulangi" |
| T15.5 | Cek BottomNav | Tombol **Selanjutnya** seharusnya sudah terbuka (tidak 🔒 lagi) |
| T15.6 | Cek TopNavbar | 🏆 skor bertambah. Progress bar bertambah |
| T15.7 | Klik **Selanjutnya** | Berpindah ke halaman berikutnya tanpa masalah |

### Panduan per Tipe Game

Jika game yang muncul adalah:

**Benar/Salah (TrueFalseGame):**
- Klik tombol **✅ Benar** atau **❌ Salah**
- 1.2 detik setelah jawaban, auto-advance ke soal berikutnya
- Setelah semua soal, muncul result phase

**Sorting (SortingGame):**
- Drag item ke kolom yang benar
- Urutkan item sesuai instruksi

**Memory (MemoryGame):**
- Klik kartu untuk membalik
- Cari pasangan yang cocok

**Matching (MatchingGame):**
- Cocokkan pasangan item

**Flashcard (FlashcardGame):**
- Klik kartu untuk membalik
- Next/Prev untuk navigasi kartu

**Fill in the Blank (FillBlankGame):**
- Ketik jawaban di kolom kosong

**Jika muncul "🎮 Belum ada game":**
- Media contoh tidak punya data game. Ini BUKAN bug — berarti tidak ada halaman game yang bisa ditest. Catat sebagai "TIDAK BISA DITEST — tidak ada halaman game di media"

### Hasil yang Diharapkan
- Game merespons klik/interaksi
- Setelah game selesai, result/status muncul
- Tombol Selanjutnya terbuka (🔒 hilang)
- Skor bertambah di TopNavbar
- Progress bertambah

### Jika FAIL, Catat:

```
Target FAIL: T15 Game Selesai
Langkah ke: (misal: T15.4)
Yang saya klik: (misal: tombol Benar di game Benar/Salah)
Yang saya harapkan: (misal: game selesai, next terbuka)
Yang terjadi: (misal: game tidak merespons klik / next tetap 🔒)
Tipe game: (misal: TrueFalseGame / SortingGame / MemoryGame / dll)
Screenshot/log: (lampirkan)
```

### Status: _______________ (PASS / FAIL)

---

## RINGKASAN HASIL TEST

Setelah melakukan semua test, isi tabel ini:

| Target | Nama | Status | Catatan |
|--------|------|--------|---------|
| T8 | Edit Teks | _______ | |
| T11 | Kuis Dijawab | _______ | |
| T12 | Skor Naik | _______ | |
| T14 | Progress Berubah | _______ | |
| T15 | Game Selesai | _______ | |

### Jika Semua PASS
→ Core 16/16 terbukti. Area parkir boleh dibuka sesuai kebutuhan.

### Jika Ada FAIL
→ Berikan detail FAIL menggunakan format di atas.
→ AI akan memperbaiki bug spesifik yang jelas, bukan menebak.
→ Jangan refactor besar. Fix minimal saja.

### Jika Tidak Bisa Ditest
→ Misalnya media contoh tidak punya halaman kuis/game.
→ Catat: "TIDAK BISA DITEST — [alasan]"
→ AI perlu menyiapkan data test yang sesuai.

---

## STATUS PROYEK SAAT INI

```
Base App:     PASS
Workspace:    PASS
Preview:      PASS
Runtime:      PARTIAL — butuh manual QA (T11, T12, T14, T15)
Engine:       PASS sementara
Export HTML:  PASS
Area Parkir:  TETAP DITAHAN
```
