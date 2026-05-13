// ── Activity Presets (Petunjuk, Diskusi, Refleksi, Penutup, Suara) ─
import type { PetunjukData, DiskusiData, RefleksiData, PenutupData, SuaraConfig } from '../types';

// ── Petunjuk Presets ─────────────────────────────────────────────
export const PRESETS_PETUNJUK: Record<string, PetunjukData> = {
  'hakikat-norma': {
    title: 'Cara Menggunakan Media Ini',
    intro: 'Ikuti langkah-langkah berikut agar pembelajaran berjalan optimal',
    langkah: [
      { icon: '\uD83C\uDFAD', judul: 'Skenario Interaktif', isi: 'Hadapi 4 situasi nyata. Setiap pilihan punya konsekuensi — temukan sendiri kaitannya dengan norma!' },
      { icon: '\uD83D\uDCD6', judul: 'Baca & Eksplorasi', isi: 'Pelajari pengertian dan fungsi norma. Tandai tiap tab setelah dibaca agar tidak ada yang terlewat!' },
      { icon: '\uD83D\uDCAC', judul: 'Diskusi & Tulis', isi: 'Jawab pertanyaan diskusi — jawabanmu otomatis tersimpan dan akan tampil lagi di Refleksi sebagai portofoliomu' },
      { icon: '\uD83C\uDFAE', judul: 'Game Fungsi Norma', isi: 'Uji pemahamanmu dengan 8 soal skenario. Setiap jawaban benar memberi penjelasan mendalam!' },
    ],
    tips: 'Ikuti alur dari awal sampai akhir. Jawab semua pertanyaan diskusi — jawabanmu akan muncul di Refleksi sebagai portofolio belajarmu hari ini!',
  },
  'macam-norma': {
    title: 'Cara Belajar Hari Ini',
    intro: 'Setiap aktivitas dilengkapi panduan diskusi dan pertanyaan pemantik',
    langkah: [
      { icon: '\uD83D\uDC65', judul: 'Diskusi Kelompok', isi: 'Setiap aktivitas dilengkapi panduan diskusi dan pertanyaan pemantik. Diskusikan dulu sebelum menjawab!' },
      { icon: '\uD83D\uDE4F', judul: '4 Jenis Norma', isi: 'Pelajari kartu detail setiap norma. Bagi tugas membaca antar anggota kelompok!' },
      { icon: '\uD83D\uDD1F', judul: 'Game Sortir Norma', isi: 'Klasifikasikan 12 perilaku ke jenis norma yang tepat. Diskusi kelompok dulu sebelum menjawab!' },
      { icon: '\uD83C\uDFA1', judul: 'Roda Norma', isi: 'Putar roda dan jawab pertanyaan tentang macam-macam norma!' },
    ],
    tips: 'Pembelajaran hari ini berbasis kelompok. Diskusikan setiap pertanyaan sebelum menjawab bersama!',
  },
  'perilaku-patuhan': {
    title: 'Cara Belajar Hari Ini',
    intro: 'Pertemuan terakhir Bab 3 — saatnya menerapkan semua yang sudah dipelajari!',
    langkah: [
      { icon: '\uD83D\uDD04', judul: 'Review P1 & P2', isi: 'Kilas balik hakikat norma dan macam-macam norma. Siapkan diri untuk menerapkan!' },
      { icon: '\uD83C\uDFE0', judul: 'Eksplorasi 4 Lingkungan', isi: 'Pelajari penerapan norma di keluarga, sekolah, masyarakat, dan negara melalui tab interaktif.' },
      { icon: '\uD83D\uDCDD', judul: 'Kuis & Diskusi Kasus', isi: 'Kuis 10 soal tentang seluruh Bab 3, lalu diskusi kelompok analisis kasus konflik norma.' },
      { icon: '\uD83D\uDCAA', judul: 'Refleksi & Komitmen', isi: 'Tulis komitmen pribadi dan tandatangani "Deklarasi Patuh Norma" secara simbolis.' },
    ],
    tips: 'Ini pertemuan terakhir! Berikan yang terbaik — semua yang kamu pelajari akan dirangkum dalam komitmen pribadimu.',
  },
  blank: { title: '', intro: '', langkah: [] },
};

// ── Diskusi Presets ──────────────────────────────────────────────
export const PRESETS_DISKUSI: Record<string, DiskusiData> = {
  'hakikat-norma': {
    title: 'Diskusi Kelas',
    intro: 'Jawab pertanyaan berikut — jawabanmu akan tersimpan untuk portofolio refleksi',
    pertanyaan: [
      { label: 'Diskusi Makhluk Sosial', icon: '\uD83D\uDCAC', teks: 'Bayangkan kamu tinggal di sebuah pulau bersama 30 orang yang tidak saling mengenal, tanpa pemimpin dan tanpa aturan sama sekali. Apa yang akan terjadi dalam 1 minggu pertama? Apa masalah yang paling pertama muncul?', petunjuk: 'Jawabanmu akan tampil lagi di Refleksi sebagai portofoliomu' },
      { label: 'Latihan Mandiri — Pengertian Norma', icon: '\u270D\uFE0F', teks: 'Dengan kata-katamu sendiri, jelaskan apa yang dimaksud norma dan mengapa norma dibutuhkan. Gunakan contoh dari kehidupan sehari-harimu!', petunjuk: 'Gunakan pengalaman pribadimu sebagai contoh' },
      { label: 'Diskusi Kelompok — Fungsi Norma', icon: '\uD83D\uDCAC', teks: 'Dari 5 fungsi norma yang kamu pelajari, fungsi mana yang paling terasa dalam kehidupanmu sehari-hari? Berikan satu contoh nyata dari pengalamanmu!', petunjuk: 'Fokus pada 1 fungsi yang paling bermakna bagimu' },
    ],
  },
  'macam-norma': {
    title: 'Diskusi Kelompok',
    intro: 'Diskusikan pertanyaan berikut bersama kelompokmu',
    pertanyaan: [
      { label: 'Diskusi Perbandingan Norma Keluarga', icon: '\uD83D\uDCDD', teks: 'Tuliskan 1\u20132 temuan menarik dari perbandingan tabel norma keluarga kelompokmu. Norma apa yang sama? Norma apa yang unik/berbeda?', petunjuk: 'Jawabanmu akan tampil lagi di Refleksi' },
      { label: 'Diskusi Hubungan Antarnorma', icon: '\uD83D\uDCAC', teks: 'Setelah semua presentasi: Norma mana yang paling berbeda dari yang kamu bayangkan sebelumnya? Mengapa sanksinya berbeda antar norma?', petunjuk: 'Diskusikan bersama kelompokmu' },
      { label: 'Diskusi Konflik Nilai — Kasus Deni & Rian', icon: '\u2696\uFE0F', teks: 'Deni tahu sahabatnya Rian menyontek. Jika Deni jujur → Rian bisa diskors. Jika diam → Deni membohongi guru. Norma mana yang harus diprioritaskan?', petunjuk: 'Tidak ada jawaban benar/salah — yang penting argumentasi yang jelas' },
    ],
  },
  'perilaku-patuhan': {
    title: 'Diskusi Kelas',
    intro: 'Diskusikan pertanyaan berikut tentang penerapan norma dalam kehidupan nyata',
    pertanyaan: [
      { label: 'Diskusi Konflik Norma', icon: '\u2696\uFE0F', teks: 'Bayangkan norma agama dan norma hukum bertentangan dalam satu kasus. Norma mana yang harus diprioritaskan? Berikan alasanmu!', petunjuk: 'Tidak ada jawaban mutlak — yang penting argumentasi yang jelas dan logis' },
      { label: 'Diskusi Penerapan Nyata', icon: '\uD83C\uDFE0', teks: 'Pilih 1 dari 4 lingkungan (keluarga, sekolah, masyarakat, negara). Ceritakan 1 contoh nyata penerapan norma yang kamu lakukan sendiri minggu ini!', petunjuk: 'Gunakan pengalaman pribadimu yang sesungguhnya' },
      { label: 'Diskusi Budaya Patuh', icon: '\uD83D\uDCAA', teks: 'Mengapa budaya patuh norma lebih efektif daripada ketertiban karena takut sanksi? Bagaimana cara membangun budaya patuh di lingkunganmu?', petunjuk: 'Bandingkan kepatuhan karena kesadaran vs kepatuhan karena paksaan' },
    ],
  },
  blank: { title: '', intro: '', pertanyaan: [] },
};

// ── Refleksi Presets ─────────────────────────────────────────────
export const PRESETS_REFLEKSI: Record<string, RefleksiData> = {
  'hakikat-norma': {
    title: 'Refleksi Diri',
    intro: 'Jawaban jujurmu lebih berharga dari jawaban yang sempurna.',
    pertanyaan: [
      { teks: 'Hal baru apa yang kamu pelajari hari ini tentang norma?', petunjuk: 'Tuliskan 1\u20132 hal yang benar-benar baru bagimu', warna: '#f9c82e', icon: '\uD83C\uDF1F' },
      { teks: 'Dari 5 fungsi norma, mana yang paling kamu rasakan manfaatnya di sekolah? Mengapa?', petunjuk: 'Jelaskan dengan contoh konkret', warna: '#3ecfcf', icon: '\uD83D\uDD0D' },
      { teks: 'Satu komitmen nyata yang akan kamu lakukan minggu ini sebagai wujud menghargai norma:', petunjuk: 'Contoh: Saya akan selalu mengantre dengan sabar di kantin dan tidak menyela antrian\u2026', warna: '#34d399', icon: '\uD83D\uDCAA' },
    ],
    penugasan: {
      judul: 'Penugasan untuk Pertemuan 2',
      isi: 'Amati kehidupan di rumahmu selama 1 hari. Catat minimal 3 norma yang berlaku di keluargamu menggunakan tabel: No | Norma | Contoh Perilaku | Sanksi jika Dilanggar',
      contoh: '| No | Norma | Contoh Perilaku | Sanksi jika Dilanggar |\n|----|---------|-----------------|-----------------------|\n| 1  | ...     | ...             | ...                   |',
    },
  },
  'macam-norma': {
    title: 'Refleksi Diri',
    intro: 'Jawaban jujur lebih berharga dari jawaban sempurna.',
    pertanyaan: [
      { teks: 'Dari 4 jenis norma, mana yang paling sering kamu patuhi setiap hari? Beri 1 contoh konkret!', petunjuk: 'Contoh: Norma kesopanan — saya selalu menyapa guru saat bertemu di lorong sekolah...', warna: '#3ecfcf', icon: '\uD83D\uDCC2' },
      { teks: 'Pernahkah kamu melihat pelanggaran norma di sekitarmu? Norma apa? Apa sanksi yang terjadi?', petunjuk: 'Ceritakan dengan jujur — tidak perlu menyebut nama orang', warna: '#ff6b6b', icon: '\u26A0\uFE0F' },
      { teks: 'Komitmenmu: 1 tindakan nyata minggu ini berkaitan dengan salah satu dari 4 norma:', petunjuk: 'Contoh: Saya akan lebih berhati-hati menggunakan media sosial agar tidak melanggar norma kesusilaan...', warna: '#34d399', icon: '\uD83D\uDCAA' },
    ],
    penugasan: {
      judul: 'Penugasan untuk Pertemuan 3',
      isi: 'Cari 1 kasus pelanggaran norma di sekitarmu atau dari berita. Analisis menggunakan panduan: Kasus | Norma yang Dilanggar | Sanksi yang Diterima | Pendapatmu: Apakah sanksinya sudah adil?',
      contoh: 'Contoh kasus yang bisa dianalisis:\n\u2022 Teman yang menyontek saat ulangan → norma kesusilaan + tata tertib sekolah\n\u2022 Buang sampah sembarangan di jalan → norma kesopanan + perda setempat\n\u2022 Kasus bullying di media sosial → norma kesusilaan + UU ITE\n\u2022 Pengendara motor tanpa helm → norma hukum lalu lintas',
    },
  },
  'perilaku-patuhan': {
    title: 'Refleksi Akhir Bab 3',
    intro: 'Refleksi terakhir — rangkum seluruh pembelajaran 3 pertemuan',
    pertanyaan: [
      { teks: 'Dari 3 pertemuan Bab 3, apa hal paling berkesan yang kamu pelajari tentang norma?', petunjuk: 'Tulis 2-3 hal yang benar-benar mengubah cara pandangmu', warna: '#f9c82e', icon: '\uD83C\uDF1F' },
      { teks: 'Sebutkan 1 contoh nyata di mana kamu MENERAPKAN norma dalam kehidupan sehari-hari tanpa disuruh!', petunjuk: 'Fokus pada tindakan sukarela — bukan karena paksaan', warna: '#3ecfcf', icon: '\uD83D\uDD0D' },
      { teks: 'Tulis komitmen pribadimu: 1 tindakan nyata yang akan kamu lakukan sebagai wujud patuh terhadap norma', petunjuk: 'Contoh: Saya akan selalu mengantre dengan tertib dan tidak memotong antrian...', warna: '#34d399', icon: '\uD83D\uDCAA' },
    ],
    penugasan: {
      judul: 'Penugasan Akhir Bab 3 — Portofolio',
      isi: 'Kumpulkan semua tugas 3 pertemuan sebagai portofolio akhir Bab 3. Pastikan semua tugas lengkap dan rapi!',
      contoh: 'Portofolio Bab 3:\n\u2022 P1: Tabel norma keluarga (5 norma + contoh + sanksi)\n\u2022 P2: Analisis kasus pelanggaran norma\n\u2022 P3: Komitmen pribadi patuh norma + Deklarasi Patuh Norma',
    },
  },
  blank: { title: '', intro: '', pertanyaan: [] },
};

// ── Penutup Presets ──────────────────────────────────────────────
export const PRESETS_PENUTUP: Record<string, PenutupData> = {
  'hakikat-norma': {
    title: 'Pertemuan 1',
    subjudul: 'Berhasil Diselesaikan!',
    preview: [
      { icon: '\uD83E\uDDD1\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1', judul: 'Pertemuan 1', isi: '\u2705 Hakikat Norma', warna: '#34d399' },
      { icon: '\uD83D\uDCC2', judul: 'Pertemuan 2', isi: '\u2192 Macam-Macam Norma', warna: '#3ecfcf' },
      { icon: '\uD83C\uDF1F', judul: 'Pertemuan 3', isi: '\u2192 Perilaku Patuh', warna: '#6e90b5' },
    ],
    nextPertemuan: {
      judul: 'Pertemuan 2 — Apa yang Akan Kamu Pelajari?',
      deskripsi: 'Kamu sudah paham apa itu norma dan mengapa norma penting. Sekarang saatnya mengenal 4 jenis norma yang mengatur kehidupanmu setiap hari!',
      items: [
        { icon: '\uD83D\uDE4F', judul: 'Norma Agama', isi: 'Bersumber dari Tuhan YME', warna: '#f9c82e' },
        { icon: '\u2764\uFE0F', judul: 'Norma Kesusilaan', isi: 'Bersumber dari hati nurani', warna: '#ff6b6b' },
        { icon: '\uD83E\uDD1D', judul: 'Norma Kesopanan', isi: 'Bersumber dari adat istiadat', warna: '#3ecfcf' },
        { icon: '\u2696\uFE0F', judul: 'Norma Hukum', isi: 'Bersumber dari negara', warna: '#a78bfa' },
      ],
    },
  },
  'macam-norma': {
    title: 'Pertemuan 2',
    subjudul: 'Berhasil Diselesaikan!',
    preview: [
      { icon: '\uD83E\uDDD1\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1', judul: 'Pertemuan 1', isi: '\u2705 Hakikat Norma', warna: '#34d399' },
      { icon: '\uD83D\uDCC2', judul: 'Pertemuan 2', isi: '\u2705 Macam-Macam Norma', warna: '#3ecfcf' },
      { icon: '\uD83C\uDF1F', judul: 'Pertemuan 3', isi: '\u2192 Perilaku Patuh', warna: '#6e90b5' },
    ],
    nextPertemuan: {
      judul: 'Pertemuan 3 — Apa yang Akan Kamu Pelajari?',
      deskripsi: 'Kamu sudah mengenal 4 jenis norma dan hubungan antarnorma. Sekarang saatnya menerapkan norma dalam kehidupan nyata!',
      items: [
        { icon: '\uD83C\uDFE0', judul: 'Keluarga', isi: 'Penerapan norma di lingkungan keluarga', warna: '#f9c82e' },
        { icon: '\uD83C\uDFEB', judul: 'Sekolah', isi: 'Penerapan norma di lingkungan sekolah', warna: '#3ecfcf' },
        { icon: '\uD83C\uDFD8\uFE0F', judul: 'Masyarakat', isi: 'Penerapan norma di lingkungan masyarakat', warna: '#34d399' },
        { icon: '\uD83C\uDDEE\uD83C\uDDE9', judul: 'Negara', isi: 'Penerapan norma dalam kehidupan berbangsa', warna: '#a78bfa' },
      ],
    },
  },
  'perilaku-patuhan': {
    title: 'Bab 3 — Pertemuan 3',
    subjudul: 'Berhasil Diselesaikan! \uD83C\uDF89',
    preview: [
      { icon: '\uD83E\uDDD1\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1', judul: 'Pertemuan 1', isi: '\u2705 Hakikat Norma', warna: '#34d399' },
      { icon: '\uD83D\uDCC2', judul: 'Pertemuan 2', isi: '\u2705 Macam-Macam Norma', warna: '#3ecfcf' },
      { icon: '\uD83C\uDF1F', judul: 'Pertemuan 3', isi: '\u2705 Perilaku Patuh terhadap Norma', warna: '#f9c82e' },
    ],
  },
  blank: { title: '', subjudul: '', preview: [] },
};

// ── Suara Presets ────────────────────────────────────────────────
export const PRESETS_SUARA: Record<string, SuaraConfig> = {
  'hakikat-norma': { navigasi: true, benar: true, salah: true, selesai: true, klik: true, skor: true },
  'macam-norma': { navigasi: true, benar: true, salah: true, selesai: true, klik: true, skor: true },
  'perilaku-patuhan': { navigasi: true, benar: true, salah: true, selesai: true, klik: true, skor: true },
  blank: { navigasi: false, benar: false, salah: false, selesai: false, klik: false, skor: false },
};
