// ── Alur Presets ──────────────────────────────────────────────────
import type { AlurPreset } from '../types';

export const PRESETS_ALUR: Record<string, AlurPreset> = {
  'hakikat-norma-80menit': {
    id: 'hakikat-norma-80menit', label: 'Hakikat Norma \u2013 2\u00D740 menit',
    steps: [
      { fase: 'Pendahuluan', durasi: '10 menit', judul: 'Apersepsi & Motivasi', deskripsi: 'Guru menyapa, memeriksa kesiapan, menampilkan skenario konflik Kampung. Siswa memprediksi apa yang terjadi tanpa norma.' },
      { fase: 'Inti', durasi: '15 menit', judul: 'Skenario Interaktif', deskripsi: 'Siswa bermain 3 skenario konflik norma secara individual di perangkat masing-masing. Guru memantau dan mencatat respons.' },
      { fase: 'Inti', durasi: '20 menit', judul: 'Materi Konsep', deskripsi: 'Guru menjelaskan Zoon Politikon (Aristoteles), pengertian norma, sumber norma, dan pentingnya norma dalam kehidupan sosial.' },
      { fase: 'Inti', durasi: '20 menit', judul: 'Fungsi Norma & Diskusi', deskripsi: 'Eksplorasi 5 fungsi norma melalui tab interaktif. Siswa menulis jawaban refleksi di kolom diskusi masing-masing fungsi.' },
      { fase: 'Penutup', durasi: '15 menit', judul: 'Kuis Tim & Refleksi', deskripsi: 'Kuis tim 5 soal antar kelompok. Siswa mengisi refleksi akhir. Guru memberi umpan balik dan menutup pembelajaran.' },
    ],
  },
  'macam-norma-80menit': {
    id: 'macam-norma-80menit', label: 'Macam-Macam Norma \u2013 2\u00D740 menit',
    steps: [
      { fase: 'Pendahuluan', durasi: '5 menit', judul: 'Review P1', deskripsi: 'Kumpulkan tugas P1, diskusi singkat norma keluarga. Bandingkan tabel norma keluarga antar anggota kelompok.' },
      { fase: 'Inti', durasi: '25 menit', judul: 'Eksplorasi 4 Norma', deskripsi: 'Kartu detail 4 jenis norma (agama, kesusilaan, kesopanan, hukum) + tabel accordion perbandingan + diskusi berpasangan.' },
      { fase: 'Inti', durasi: '15 menit', judul: 'Game Sortir Norma', deskripsi: 'Diskusi kelompok, lalu sortir perilaku ke kolom jenis norma yang tepat. Klasifikasi 12 perilaku.' },
      { fase: 'Inti', durasi: '15 menit', judul: 'Hubungan Antarnorma', deskripsi: 'Analisis kasus konflik nilai antar norma + diskusi kelompok tentang hubungan norma agama dan hukum.' },
      { fase: 'Inti', durasi: '12 menit', judul: 'Game Roda Norma', deskripsi: 'Tiap soal ada pertanyaan pemantik kelompok sebelum dijawab. 6 soal roda putar.' },
      { fase: 'Penutup', durasi: '8 menit', judul: 'Refleksi & Penutup', deskripsi: 'Kartu kilat ringkasan + portofolio jawaban diskusi + komitmen diri + penugasan P3.' },
    ],
  },
  'perilaku-patuhan-80menit': {
    id: 'perilaku-patuhan-80menit', label: 'Perilaku Patuh – 2×40 menit',
    steps: [
      { fase: 'Pendahuluan', durasi: '10 menit', judul: 'Review & Apersepsi', deskripsi: 'Guru me-review P1 & P2 secara kilat. Tanya jawab: Norma apa yang paling sering kamu langgar? Skenario: Kamu jadi saksi pelanggaran norma — apa yang kamu lakukan?' },
      { fase: 'Inti', durasi: '20 menit', judul: 'Penerapan Norma di 4 Lingkungan', deskripsi: 'Eksplorasi penerapan norma di keluarga, sekolah, masyarakat, dan negara melalui tab interaktif. Siswa mencatat contoh nyata dari pengalaman masing-masing.' },
      { fase: 'Inti', durasi: '20 menit', judul: 'Kuis 10 Soal & Diskusi Kasus', deskripsi: 'Kuis mandiri 10 soal tentang seluruh Bab 3. Lalu diskusi kelompok: analisis 2 kasus konflik norma — mana yang harus diprioritaskan?' },
      { fase: 'Inti', durasi: '15 menit', judul: 'Budaya Patuh & Komitmen Diri', deskripsi: 'Membangun budaya patuh norma. Siswa menulis komitmen pribadi dan menandatangani "Deklarasi Patuh Norma" secara simbolis.' },
      { fase: 'Penutup', durasi: '15 menit', judul: 'Refleksi & Portofolio', deskripsi: 'Siswa mengisi refleksi akhir dan menyerahkan portofolio tugas 3 pertemuan. Guru memberi apresiasi dan menutup pembelajaran Bab 3.' },
    ],
  },
  blank: { id: 'blank', label: 'Kosong – Isi Manual', steps: [] },
};
