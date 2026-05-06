// ── Preset Types ─────────────────────────────────────────────────
import type { TpItem, AtpPertemuan, AlurItem, KuisItem } from './authoring-store';

export interface MetaPreset {
  id: string;
  label: string;
  mapel: string;
  kelas: string;
  kurikulum: string;
  judulPertemuan: string;
  subjudul: string;
  ikon: string;
  durasi: string;
  namaBab: string;
}

export interface CpPreset {
  id: string;
  label: string;
  elemen: string;
  subElemen: string;
  capaianFase: string;
  profil: string[];
  fase: string;
  kelas: string;
}

export interface TpPreset {
  id: string;
  label: string;
  items: TpItem[];
}

export interface AtpPreset {
  id: string;
  label: string;
  namaBab: string;
  jumlahPertemuan: number;
  pertemuan: AtpPertemuan[];
}

export interface AlurPreset {
  id: string;
  label: string;
  steps: AlurItem[];
}

export interface KuisPreset {
  id: string;
  label: string;
  soal: KuisItem[];
}

// ── Preset Data ──────────────────────────────────────────────────
export const PRESETS_META: Record<string, MetaPreset> = {
  'hakikat-norma': {
    id: 'hakikat-norma', label: 'Bab 3 – Pertemuan 1: Hakikat Norma',
    mapel: 'PPKn', kelas: 'VII', kurikulum: 'Kurikulum Merdeka',
    judulPertemuan: 'Pertemuan 1 – Hakikat Norma',
    subjudul: 'Mengapa manusia membutuhkan norma?',
    ikon: '\uD83E\uDDD1\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1', durasi: '2 \u00D7 40 menit', namaBab: 'Hakikat Norma',
  },
  'macam-norma': {
    id: 'macam-norma', label: 'Bab 3 – Pertemuan 2: Macam-Macam Norma',
    mapel: 'PPKn', kelas: 'VII', kurikulum: 'Kurikulum Merdeka',
    judulPertemuan: 'Pertemuan 2 – Macam-Macam Norma',
    subjudul: 'Apa saja jenis norma yang mengatur kehidupan kita?',
    ikon: '\uD83D\uDCDC', durasi: '2 \u00D7 40 menit', namaBab: 'Macam-Macam Norma',
  },
  blank: {
    id: 'blank', label: 'Kosong – Mulai dari Nol',
    mapel: '', kelas: '', kurikulum: 'Kurikulum Merdeka',
    judulPertemuan: '', subjudul: '', ikon: '\uD83D\uDCDA', durasi: '2 \u00D7 40 menit', namaBab: '',
  },
};

export const PRESETS_CP: Record<string, CpPreset> = {
  'ppkn-smp-bab3': {
    id: 'ppkn-smp-bab3',
    label: 'PPKn SMP – Bab 3: Patuh terhadap Norma',
    elemen: 'Pancasila',
    subElemen: 'Pemahaman norma dan nilai',
    capaianFase: 'Peserta didik mampu menganalisis pentingnya norma dalam kehidupan bermasyarakat, berbangsa, dan bernegara; serta menunjukkan perilaku patuh terhadap norma sebagai wujud kesadaran hukum.',
    profil: ['Beriman & Bertakwa kepada Tuhan YME', 'Berkebhinekaan Global', 'Bergotong Royong', 'Bernalar Kritis'],
    fase: 'D', kelas: 'VII',
  },
  blank: { id: 'blank', label: 'Kosong – Isi Manual', elemen: '', subElemen: '', capaianFase: '', profil: [], fase: 'D', kelas: '' },
};

export const PRESETS_TP: Record<string, TpPreset> = {
  'bab3-full': {
    id: 'bab3-full', label: 'Bab 3 – 5 TP Lengkap',
    items: [
      { verb: 'Menjelaskan', desc: 'pengertian norma sebagai aturan yang mengikat warga masyarakat dan berfungsi sebagai pedoman tingkah laku dalam kehidupan bersama', pertemuan: 1, color: '#f9c82e' },
      { verb: 'Mengidentifikasi', desc: 'macam-macam norma (agama, kesusilaan, kesopanan, dan hukum) beserta sumber, sanksi, dan sifatnya masing-masing', pertemuan: 2, color: '#3ecfcf' },
      { verb: 'Menganalisis', desc: 'pentingnya patuh terhadap norma dan dampak pelanggaran norma bagi diri sendiri, masyarakat, serta kehidupan berbangsa dan bernegara', pertemuan: 2, color: '#a78bfa' },
      { verb: 'Memberikan contoh', desc: 'penerapan norma di lingkungan keluarga, sekolah, dan masyarakat dalam kehidupan sehari-hari', pertemuan: 3, color: '#34d399' },
      { verb: 'Menerapkan', desc: 'perilaku patuh terhadap norma sebagai wujud kesadaran hukum dan tanggung jawab sebagai warga negara yang baik', pertemuan: 3, color: '#ff6b6b' },
    ],
  },
  blank: { id: 'blank', label: 'Kosong – Isi Manual', items: [] },
};

export const PRESETS_ATP: Record<string, AtpPreset> = {
  'bab3-3pertemuan': {
    id: 'bab3-3pertemuan', label: 'Bab 3 – 3 Pertemuan',
    namaBab: 'Bab 3 \u2014 Patuh terhadap Norma',
    jumlahPertemuan: 3,
    pertemuan: [
      { judul: 'Hakikat Norma', tp: 'TP 1 \u2014 Menjelaskan pengertian & fungsi norma', durasi: '2\u00D740 menit', kegiatan: 'Apersepsi skenario \u2192 Manusia makhluk sosial (Zoon Politikon) \u2192 Pengertian norma \u2192 Fungsi norma \u2192 Diskusi kelompok & kuis tim', penilaian: 'Observasi + Pemantik' },
      { judul: 'Macam-Macam Norma', tp: 'TP 2 & 3 \u2014 Mengidentifikasi 4 jenis norma + menganalisis sanksi & dampak pelanggaran', durasi: '2\u00D740 menit', kegiatan: '4 jenis norma (agama, kesusilaan, kesopanan, hukum) \u2192 sanksinya \u2192 Game Sortir Norma \u2192 Roda Norma \u2192 Diskusi kelompok', penilaian: 'Game + Presentasi' },
      { judul: 'Perilaku Patuh terhadap Norma', tp: 'TP 4 & 5 \u2014 Memberikan contoh penerapan + menerapkan perilaku patuh', durasi: '2\u00D740 menit', kegiatan: 'Penerapan norma di 4 lingkungan (keluarga, sekolah, masyarakat, negara) \u2192 Budaya patuh \u2192 Kuis 10 soal \u2192 Refleksi & portofolio', penilaian: 'Kuis + Portofolio' },
    ],
  },
  blank: { id: 'blank', label: 'Kosong – Isi Manual', namaBab: '', jumlahPertemuan: 3, pertemuan: [] },
};

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
      { fase: 'Inti', durasi: '25 menit', judul: 'Eksplorasi 4 Norma', deskripsi: 'Kartu detail 4 jenis norma + tabel accordion perbandingan + diskusi berpasangan.' },
      { fase: 'Inti', durasi: '15 menit', judul: 'Game Sortir Norma', deskripsi: 'Klasifikasikan 12 perilaku ke jenis norma yang tepat. Diskusi kelompok dulu sebelum menjawab.' },
      { fase: 'Inti', durasi: '15 menit', judul: 'Hubungan Antarnorma', deskripsi: 'Analisis kasus konflik nilai + diskusi kelompok tentang hubungan norma agama dan hukum.' },
      { fase: 'Inti', durasi: '12 menit', judul: 'Game Roda Norma', deskripsi: 'Tiap soal ada pertanyaan pemantik kelompok sebelum dijawab.' },
      { fase: 'Penutup', durasi: '8 menit', judul: 'Refleksi & Penutup', deskripsi: 'Kartu kilat + portofolio jawaban diskusi + komitmen diri + penugasan P3.' },
    ],
  },
  blank: { id: 'blank', label: 'Kosong – Isi Manual', steps: [] },
};

export const PRESETS_KUIS: Record<string, KuisPreset> = {
  'norma-10-soal': {
    id: 'norma-10-soal', label: 'Kuis Norma \u2013 10 Soal Pilihan Ganda',
    soal: [
      { q: 'Norma adalah aturan atau pedoman yang mengatur...', opts: ['Cara berpakaian di sekolah saja', 'Perilaku manusia dalam kehidupan bermasyarakat', 'Peraturan tentang pajak negara', 'Tata cara beribadah di tempat ibadah'], ans: 1, ex: 'Norma mengatur perilaku manusia secara umum dalam kehidupan sosial bersama.' },
      { q: 'Aristoteles menyebut manusia sebagai Zoon Politikon karena...', opts: ['Manusia adalah makhluk paling cerdas di bumi', 'Manusia selalu membutuhkan orang lain dalam hidupnya', 'Manusia bisa berpolitik dan memimpin negara', 'Manusia memiliki akal budi yang membedakan dari hewan'], ans: 1, ex: 'Zoon Politikon berarti makhluk sosial \u2014 manusia tidak bisa hidup sendiri tanpa bantuan orang lain.' },
      { q: 'Fungsi norma yang paling utama dalam masyarakat adalah...', opts: ['Memberikan sanksi bagi pelanggar', 'Mengatur dan menciptakan ketertiban bersama', 'Menghukum orang yang berbuat salah', 'Membatasi kebebasan setiap warga'], ans: 1, ex: 'Fungsi utama norma adalah menciptakan ketertiban agar kehidupan bersama berjalan dengan harmonis.' },
      { q: 'Norma yang bersumber dari keyakinan tentang perintah dan larangan Tuhan disebut norma...', opts: ['Hukum', 'Kesopanan', 'Kesusilaan', 'Agama'], ans: 3, ex: 'Norma agama bersumber dari wahyu Tuhan dan pedoman keagamaan masing-masing agama.' },
      { q: 'Pak Budi membuang sampah di sungai dan diabaikan oleh warga. Fungsi norma apa yang gagal?', opts: ['Pedoman tingkah laku', 'Memperkuat solidaritas', 'Melindungi hak warga', 'Menciptakan ketertiban'], ans: 3, ex: 'Norma seharusnya menjaga ketertiban lingkungan \u2014 membuang sampah sembarangan merusak ketertiban bersama.' },
      { q: 'Contoh norma kesopanan di sekolah adalah...', opts: ['Membayar iuran sekolah tepat waktu', 'Mengucap salam kepada guru saat berpapasan', 'Tidak mencuri barang milik teman', 'Berdoa sebelum memulai pelajaran'], ans: 1, ex: 'Mengucap salam adalah norma kesopanan yang mengatur etika pergaulan dan menghormati orang lain.' },
      { q: 'Norma yang pelanggarannya dikenai sanksi berupa hukuman dari negara disebut norma...', opts: ['Agama', 'Kesusilaan', 'Kesopanan', 'Hukum'], ans: 3, ex: 'Norma hukum punya sanksi tegas dari negara berupa denda, penjara, atau sanksi formal lainnya.' },
      { q: 'Ketika ada warga yang terkena musibah dan tetangga membantu gotong royong, ini menunjukkan fungsi norma sebagai...', opts: ['Pedoman tingkah laku', 'Penentu sanksi', 'Memperkuat solidaritas', 'Melindungi hak warga'], ans: 2, ex: 'Gotong royong adalah wujud norma yang memperkuat solidaritas dan rasa kebersamaan antaranggota masyarakat.' },
      { q: 'Jika seseorang melanggar norma agama, sanksi yang paling utama diterimanya adalah...', opts: ['Denda dari pemerintah', 'Penjara', 'Dikucilkan dari masyarakat', 'Dosa dan hukuman dari Tuhan'], ans: 3, ex: 'Sanksi norma agama bersifat spiritual \u2014 berupa dosa yang dipercaya akan dipertanggungjawabkan kepada Tuhan.' },
      { q: 'Tujuan utama mempelajari norma bagi siswa kelas VII adalah...', opts: ['Agar bisa menjadi hakim di masa depan', 'Agar paham cara menghindari hukuman', 'Agar dapat berperilaku sesuai aturan sebagai warga negara yang baik', 'Agar tahu sanksi yang akan diterima jika melanggar'], ans: 2, ex: 'Mempelajari norma bertujuan membentuk karakter warga negara yang baik, taat aturan, dan bertanggung jawab.' },
    ],
  },
  blank: { id: 'blank', label: 'Kosong – Isi Manual', soal: [] },
};

// ── Full Preset Mapping ──────────────────────────────────────────
export const FULL_PRESET_MAP: Record<string, { meta: string; cp: string; tp: string; atp: string; alur: string; kuis: string }> = {
  'hakikat-norma': { meta: 'hakikat-norma', cp: 'ppkn-smp-bab3', tp: 'bab3-full', atp: 'bab3-3pertemuan', alur: 'hakikat-norma-80menit', kuis: 'norma-10-soal' },
  'macam-norma': { meta: 'macam-norma', cp: 'ppkn-smp-bab3', tp: 'bab3-full', atp: 'bab3-3pertemuan', alur: 'macam-norma-80menit', kuis: 'norma-10-soal' },
  blank: { meta: 'blank', cp: 'blank', tp: 'blank', atp: 'blank', alur: 'blank', kuis: 'blank' },
};

// ── Verb options ─────────────────────────────────────────────────
export const VERB_OPTIONS = [
  'Menjelaskan', 'Mengidentifikasi', 'Menganalisis', 'Memberikan contoh',
  'Menerapkan', 'Mengevaluasi', 'Membandingkan', 'Menyimpulkan',
  'Mendeskripsikan', 'Merancang', 'Membuat', 'Mempresentasikan',
];

export const COLOR_OPTIONS = ['#f9c82e', '#3ecfcf', '#a78bfa', '#34d399', '#ff6b6b', '#fb923c'];

export function colorForIndex(i: number): string {
  return COLOR_OPTIONS[i % COLOR_OPTIONS.length];
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
