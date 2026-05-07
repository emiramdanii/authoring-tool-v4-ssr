'use client';

import { create } from 'zustand';
import { toast } from 'sonner';
import { generateModuleId, ensureModuleIds } from '@/lib/module-resolver';

// ── Types ────────────────────────────────────────────────────────
export type PanelId = 'dashboard' | 'dokumen' | 'konten' | 'canva' | 'autogen' | 'projects' | 'import' | 'preview' | 'versions';

export interface MetaState {
  judulPertemuan: string;
  subjudul: string;
  ikon: string;
  durasi: string;
  namaBab: string;
  mapel: string;
  kelas: string;
  kurikulum: string;
}

export interface CpState {
  elemen: string;
  subElemen: string;
  capaianFase: string;
  profil: string[];
  fase: string;
  kelas: string;
}

export interface TpItem {
  verb: string;
  desc: string;
  pertemuan: number;
  color: string;
}

export interface AtpPertemuan {
  judul: string;
  tp: string;
  durasi: string;
  kegiatan: string;
  penilaian: string;
}

export interface AtpState {
  namaBab: string;
  jumlahPertemuan: number;
  pertemuan: AtpPertemuan[];
}

export interface AlurItem {
  fase: string;
  durasi: string;
  judul: string;
  deskripsi: string;
}

export interface KuisItem {
  q: string;
  opts: string[];
  ans: number;
  ex: string;
}

export interface MateriBlok {
  tipe: string;
  judul?: string;
  isi?: string;
  icon?: string;
  warna?: string;
  butir?: string[];
  baris?: string[][];
  langkah?: Array<{ icon: string; judul: string; isi: string }>;
  kiri?: { icon?: string; judul?: string; isi?: string };
  kanan?: { icon?: string; judul?: string; isi?: string };
  items?: Array<{ icon?: string; angka?: string; satuan?: string; label?: string; warna?: string; judul?: string; isi?: string }>;
  style?: string;
  karakter?: string;
  situasi?: string;
  pertanyaan?: string;
  pesan?: string;
}

export interface MateriState {
  blok: MateriBlok[];
}

// ── Preset Types ─────────────────────────────────────────────────
interface MetaPreset {
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

interface CpPreset {
  id: string;
  label: string;
  elemen: string;
  subElemen: string;
  capaianFase: string;
  profil: string[];
  fase: string;
  kelas: string;
}

interface TpPreset {
  id: string;
  label: string;
  items: TpItem[];
}

interface AtpPreset {
  id: string;
  label: string;
  namaBab: string;
  jumlahPertemuan: number;
  pertemuan: AtpPertemuan[];
}

interface AlurPreset {
  id: string;
  label: string;
  steps: AlurItem[];
}

interface KuisPreset {
  id: string;
  label: string;
  soal: KuisItem[];
}

// ── Preset Data ──────────────────────────────────────────────────
const PRESETS_META: Record<string, MetaPreset> = {
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

const PRESETS_CP: Record<string, CpPreset> = {
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

const PRESETS_TP: Record<string, TpPreset> = {
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

const PRESETS_ATP: Record<string, AtpPreset> = {
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

const PRESETS_ALUR: Record<string, AlurPreset> = {
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
  blank: { id: 'blank', label: 'Kosong – Isi Manual', steps: [] },
};

const PRESETS_KUIS: Record<string, KuisPreset> = {
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

// ── Preset Skenario Data ────────────────────────────────────────
const PRESETS_SKENARIO: Record<string, Array<Record<string, unknown>>> = {
  'hakikat-norma': [
    {
      title: '🏘️ Perselisihan di Kampung',
      bg: 'sbg-kampung',
      charEmoji: '😟',
      charColor: '#e87070',
      charPants: '#4a6a9a',
      choicePrompt: 'Apa yang kamu lakukan sebagai Ketua RT?',
      setup: [
        { speaker: 'NARRATOR', text: 'Pak Joko baru saja membangun pagar setinggi 3 meter yang menghalangi jalan setapak yang sudah dipakai warga selama puluhan tahun.' },
        { speaker: 'WARGA 😤', text: '"Jalan itu milik kita bersama! Pak Joko tidak boleh menutupnya begitu saja!"' },
        { speaker: 'PAK JOKO 😠', text: '"Tanah itu milik saya! Terserah saya mau bangun apa di sini."' },
        { speaker: 'NARRATOR', text: 'Kamu adalah Ketua RT yang dipercaya warga. Konflik ini perlu diselesaikan seadil mungkin.' },
      ],
      choices: [
        { icon: '🤝', label: 'Adakan musyawarah warga', detail: 'Undang Pak Joko dan warga untuk duduk bersama mencari solusi yang adil', good: true, pts: 20, norma: 'Fungsi Norma: Mencegah Konflik & Mewujudkan Keadilan', level: 'good', resultTitle: 'Pilihan Terbaik! 🌟', resultBody: 'Musyawarah adalah cara terbaik menyelesaikan konflik — inilah bukti norma berfungsi menciptakan ketertiban dan keadilan.', consequences: [{ icon: '✅', text: 'Konflik bisa diselesaikan tanpa kekerasan dan semua pihak merasa didengar' }, { icon: '✅', text: 'Norma adat dan hukum dapat diterapkan bersama untuk menemukan solusi adil' }, { icon: '✅', text: 'Hubungan antarwarga tetap terjaga — itulah fungsi norma sebagai pemersatu' }] },
        { icon: '⚖️', label: 'Laporkan ke kelurahan', detail: 'Bawa masalah ini ke aparat desa agar diselesaikan secara resmi', good: true, pts: 15, norma: 'Fungsi Norma Hukum: Perlindungan Hak', level: 'good', resultTitle: 'Langkah yang Tepat! 👍', resultBody: 'Jalur hukum formal memastikan hak semua pihak terlindungi secara sah oleh negara.', consequences: [{ icon: '✅', text: 'Hak warga atas akses jalan dapat dilindungi secara hukum' }, { icon: '✅', text: 'Proses resmi memberi kepastian dan tidak bisa diabaikan' }, { icon: '💡', text: 'Idealnya coba musyawarah dulu — lebih cepat dan tetap menjaga hubungan warga' }] },
        { icon: '😤', label: 'Bela warga, paksa bongkar', detail: 'Perintahkan warga untuk membongkar pagar secara paksa bersama-sama', good: false, pts: 0, norma: 'Melanggar Norma Hukum & Norma Kesopanan', level: 'bad', resultTitle: 'Pilihan Berbahaya! ⚠️', resultBody: 'Tindakan main hakim sendiri justru melanggar norma — tidak ada masalah yang selesai dengan kekerasan.', consequences: [{ icon: '❌', text: 'Konflik semakin besar dan bisa berujung tindak pidana perusakan' }, { icon: '❌', text: 'Norma hukum dilanggar: pembongkaran paksa adalah tindakan melawan hukum' }, { icon: '❌', text: 'Fungsi norma sebagai penjaga ketertiban gagal karena kamu sendiri yang melanggar' }] },
      ],
    },
    {
      title: '🕌 Azan di Waktu Tidur',
      bg: 'sbg-masjid',
      charEmoji: '😴',
      charColor: '#4a7a9a',
      charPants: '#2d4a7a',
      choicePrompt: 'Bagaimana kamu merespons?',
      setup: [
        { speaker: 'NARRATOR', text: 'Subuh pukul 04.30. Suara azan berkumandang dari masjid depan rumah. Kamu baru tidur jam 02.00 karena tugas sekolah.' },
        { speaker: 'NARRATOR', text: 'Tetanggamu, Pak Budi yang non-muslim, mengetuk pintu. Wajahnya terlihat kesal.' },
        { speaker: 'PAK BUDI 😤', text: '"Bisa minta tolong minta masjidnya kecilkan volume? Itu mengganggu tidur kami setiap subuh!"' },
        { speaker: 'NARRATOR', text: 'Kamu tahu azan adalah kewajiban agama, tapi kamu juga menghormati tetangga yang berbeda keyakinan.' },
      ],
      choices: [
        { icon: '🤝', label: 'Ajak bicara pengurus masjid', detail: 'Sampaikan kekhawatiran Pak Budi kepada takmir masjid dengan sopan', good: true, pts: 20, norma: 'Fungsi Norma: Solidaritas & Keadilan', level: 'good', resultTitle: 'Pilihan Terbaik! 🌟', resultBody: 'Menjembatani dua kebutuhan dengan dialog — inilah fungsi norma menjaga solidaritas antarwarga yang berbeda.', consequences: [{ icon: '✅', text: 'Hak beragama dan hak kenyamanan warga sama-sama dihormati' }, { icon: '✅', text: 'Fungsi norma sebagai pemersatu terwujud: perbedaan bukan penghalang hidup damai' }, { icon: '✅', text: 'Solusi bersama lebih langgeng dari sekadar memaksakan kehendak satu pihak' }] },
        { icon: '🙏', label: 'Maklumi, ini norma agama', detail: 'Jelaskan kepada Pak Budi bahwa azan adalah kewajiban agama yang harus dihormati', good: false, pts: 7, norma: 'Norma Kesopanan kurang terjaga', level: 'mid', resultTitle: 'Kurang Lengkap 🤔', resultBody: 'Menjelaskan norma agama itu benar, tapi mengabaikan perasaan tetangga bukan sikap yang bijak.', consequences: [{ icon: '🟡', text: 'Pak Budi mungkin menerima penjelasan, tapi merasa tidak dihiraukan' }, { icon: '⚠️', text: 'Hubungan bertetangga bisa renggang jika hanya melihat dari satu sudut pandang' }, { icon: '💡', text: 'Norma yang baik melindungi SEMUA pihak — bukan hanya satu kelompok saja' }] },
        { icon: '📢', label: 'Minta masjid matikan speaker', detail: 'Langsung minta masjid mematikan pengeras suara agar Pak Budi tidak terganggu', good: false, pts: 3, norma: 'Melanggar Norma Agama & Kesopanan', level: 'bad', resultTitle: 'Kurang Tepat ⚠️', resultBody: 'Meminta penghentian ibadah tanpa dialog tidak menghormati kebebasan beragama.', consequences: [{ icon: '❌', text: 'Kebebasan beragama dijamin UUD 1945 — tidak bisa begitu saja dibatasi' }, { icon: '❌', text: 'Norma agama dan norma hukum dilanggar sekaligus' }, { icon: '💡', text: 'Solusi terbaik harus menghormati hak semua pihak — dialog adalah kuncinya' }] },
      ],
    },
    {
      title: '🛒 Antrian di Pasar',
      bg: 'sbg-pasar',
      charEmoji: '😐',
      charColor: '#e8a030',
      charPants: '#3a5a7a',
      choicePrompt: 'Apa yang kamu lakukan?',
      setup: [
        { speaker: 'NARRATOR', text: 'Kamu sedang membantu ibu berbelanja di pasar. Antrian kasir sangat panjang — kamu sudah 15 menit mengantri.' },
        { speaker: 'NARRATOR', text: 'Tiba-tiba seorang ibu tua dengan barang belanjaan yang banyak terhenti di depanmu. Dia terlihat lelah dan kesakitan.' },
        { speaker: 'IBU TUA 😓', text: '"Maaf dik, kaki saya sakit sekali. Boleh saya numpang antri di sini? Saya tidak kuat lama berdiri."' },
        { speaker: 'NARRATOR', text: 'Di belakangmu ada 10 orang yang juga sudah lama mengantri. Mereka memperhatikanmu.' },
      ],
      choices: [
        { icon: '😊', label: 'Persilakan dengan senang hati', detail: 'Persilakan ibu tua itu mengantri di depanmu karena ia membutuhkan bantuan', good: true, pts: 20, norma: 'Fungsi Norma: Solidaritas & Norma Kesopanan', level: 'good', resultTitle: 'Pilihan Terbaik! 🌟', resultBody: 'Mengutamakan yang membutuhkan adalah wujud solidaritas — salah satu fungsi norma yang paling mulia.', consequences: [{ icon: '✅', text: 'Ibu tua mendapat pertolongan yang ia butuhkan' }, { icon: '✅', text: 'Kamu menunjukkan fungsi norma sebagai pemerkuat solidaritas dan kepedulian sosial' }, { icon: '🌟', text: 'Orang-orang di sekitarmu pun terinspirasi — kebaikan kecilmu berdampak besar' }] },
        { icon: '🙅', label: 'Tolak dengan sopan', detail: 'Jelaskan bahwa kamu sudah lama mengantri dan orang di belakangmu juga menunggu', good: false, pts: 8, norma: 'Norma Kesopanan', level: 'mid', resultTitle: 'Bisa Dimaklumi 🤔', resultBody: 'Menolak itu hakmu, tapi memberi keringanan kepada yang membutuhkan adalah nilai yang lebih tinggi.', consequences: [{ icon: '🟡', text: 'Norma antrian tetap terjaga, tapi nilai solidaritas terhadap sesama diabaikan' }, { icon: '⚠️', text: 'Kehidupan yang hanya berbasis aturan tanpa empati terasa dingin' }, { icon: '💡', text: 'Norma terbaik dijalankan dengan hati — bukan hanya dengan kepala' }] },
        { icon: '🗣️', label: 'Tanya pendapat yang antri', detail: 'Tanya orang di belakangmu apakah mereka keberatan jika ibu tua ini masuk antrian', good: true, pts: 17, norma: 'Fungsi Norma: Solidaritas + Keadilan', level: 'good', resultTitle: 'Pilihan Bijak! 👍', resultBody: 'Melibatkan semua pihak sebelum memutuskan — inilah demokrasi dan keadilan dalam skala kecil!', consequences: [{ icon: '✅', text: 'Semua pihak merasa dihargai pendapatnya' }, { icon: '✅', text: 'Solidaritas terbangun bersama — bukan hanya keputusan satu orang' }, { icon: '✅', text: 'Nilai gotong royong dan musyawarah tercermin dalam tindakan sederhana ini' }] },
      ],
    },
    {
      title: '📱 Foto Tanpa Izin',
      bg: 'sbg-kelas',
      charEmoji: '😳',
      charColor: '#9a5a9a',
      charPants: '#2a3a6a',
      choicePrompt: 'Apa yang kamu lakukan?',
      setup: [
        { speaker: 'NARRATOR', text: 'Di kelas, teman sebangkumu diam-diam memfoto lembar jawabanmu saat ulangan berlangsung.' },
        { speaker: 'NARRATOR', text: 'Kamu menyadarinya. Guru sedang membelakangi kelas dan tidak ada yang melihat kejadian itu.' },
        { speaker: 'TEMAN 😅', text: '"Sst... jangan bilang siapa-siapa ya. Aku cuma lihat-lihat sebentar kok."' },
        { speaker: 'NARRATOR', text: 'Ini bukan hanya soal mencontek — tapi soal privasimu yang dilanggar tanpa izin.' },
      ],
      choices: [
        { icon: '🛑', label: 'Tegur langsung dan minta hapus', detail: 'Bisikkan: "Itu tidak boleh. Tolong hapus fotonya sekarang."', good: true, pts: 20, norma: 'Norma Kesusilaan + Fungsi Norma: Perlindungan Hak', level: 'good', resultTitle: 'Pilihan Terbaik! 🌟', resultBody: 'Menegur langsung melindungi hakmu sekaligus memberi kesempatan temanmu memperbaiki diri.', consequences: [{ icon: '✅', text: 'Privasi dan hakmu terlindungi — norma berfungsi melindungi hak setiap individu' }, { icon: '✅', text: 'Kamu memberi temanmu kesempatan untuk sadar tanpa langsung dihukum' }, { icon: '✅', text: 'Norma kesusilaan ditegakkan: menghormati privasi orang lain adalah hak dasar manusia' }] },
        { icon: '🤫', label: 'Diam saja, tidak apa-apa', detail: 'Pura-pura tidak melihat karena tidak mau ribut dan kasihan pada teman', good: false, pts: 3, norma: 'Hak pribadi diabaikan', level: 'bad', resultTitle: 'Kurang Tepat 😬', resultBody: 'Diam bukan berarti damai. Membiarkan hakmu dilanggar melemahkan fungsi norma di lingkunganmu.', consequences: [{ icon: '❌', text: 'Pelanggaran privasi dibiarkan dan kemungkinan akan terulang' }, { icon: '❌', text: 'Fungsi norma sebagai pelindung hak tidak berjalan karena tidak ada yang menegakkannya' }, { icon: '⚠️', text: 'Foto jawabanmu bisa tersebar dan kalian berdua berpotensi mendapat masalah lebih besar' }] },
        { icon: '👨‍🏫', label: 'Lapor guru segera', detail: 'Angkat tangan dan beritahu guru tentang apa yang terjadi barusan', good: true, pts: 15, norma: 'Norma Hukum (Tata Tertib) + Perlindungan Hak', level: 'good', resultTitle: 'Berani Melaporkan! 👍', resultBody: 'Melibatkan guru adalah cara yang sah untuk menegakkan tata tertib sekolah dan melindungi hakmu.', consequences: [{ icon: '✅', text: 'Tata tertib sekolah ditegakkan oleh pihak yang berwenang' }, { icon: '✅', text: 'Hakmu atas privasi dilindungi secara formal' }, { icon: '💡', text: 'Cobalah menegur langsung dulu — memberi kesempatan temanmu memperbaiki diri sendiri' }] },
      ],
    },
  ],
  'macam-norma': [
    {
      title: '🔀 Review P1: Norma Keluarga',
      bg: 'sbg-kampung',
      charEmoji: '🤔',
      charColor: '#e87070',
      charPants: '#4a6a9a',
      choicePrompt: 'Apa yang akan kamu lakukan?',
      setup: [
        { speaker: 'NARRATOR', text: 'Kamu sudah mempelajari fungsi norma di Pertemuan 1. Sekarang bayangkan: di keluargamu ada peraturan "wajib makan bersama setiap Minggu".' },
        { speaker: 'NARRATOR', text: 'Adikmu menolak karena ingin bermain game dengan temannya. Orang tuamu marah.' },
      ],
      choices: [
        { icon: '🤝', label: 'Ajak diskusi', detail: 'Bicara dengan adikmu tentang pentingnya makan bersama dan cari solusi bersama', good: true, pts: 20, norma: 'Norma Kesopanan & Solidaritas Keluarga', level: 'good', resultTitle: 'Pilihan Terbaik! 🌟', resultBody: 'Dialog adalah cara norma kesopanan bekerja — menghormati perasaan semua pihak.', consequences: [{ icon: '✅', text: 'Hubungan keluarga tetap harmonis' }, { icon: '✅', text: 'Adikmu merasa dihargai dan lebih kooperatif' }, { icon: '💡', text: 'Norma keluarga ditegakkan dengan cara yang bijak, bukan paksaan' }] },
        { icon: '😤', label: 'Paksa adik ikut', detail: 'Paksa adikmu agar ikut makan bersama sesuai aturan keluarga', good: false, pts: 5, norma: 'Norma tanpa dialog = pemaksaan', level: 'mid', resultTitle: 'Kurang Bijak 🤔', resultBody: 'Aturan tanpa dialog bisa menimbulkan perasaan tidak dihargai, meski tujuannya baik.', consequences: [{ icon: '🟡', text: 'Norma keluarga terpenuhi, tapi adikmu merasa dipaksa' }, { icon: '⚠️', text: 'Kepatuhan tanpa pemahaman tidak membentuk karakter' }] },
        { icon: '🙅', label: 'Biarkan saja', detail: 'Tidak campur tangan, biarkan adikmu memilih sendiri', good: false, pts: 3, norma: 'Norma keluarga diabaikan', level: 'bad', resultTitle: 'Norma Melemah ⚠️', resultBody: 'Jika aturan keluarga bisa diabaikan tanpa konsekuensi, norma akan semakin lemah.', consequences: [{ icon: '❌', text: 'Norma keluarga kehilangan kekuatan mengikatnya' }, { icon: '❌', text: 'Adikmu belajar bahwa aturan bisa diabaikan' }] },
      ],
    },
  ],
  blank: [],
};

// ── Preset Modules Data ─────────────────────────────────────────
const PRESETS_MODULES: Record<string, Array<Record<string, unknown>>> = {
  'hakikat-norma': [
    {
      type: 'petunjuk',
      title: 'Cara Menggunakan Media Ini',
      intro: 'Ikuti langkah-langkah berikut agar pembelajaran berjalan optimal',
      langkah: [
        { icon: '🎭', judul: 'Skenario Interaktif', isi: 'Hadapi 4 situasi nyata. Setiap pilihan punya konsekuensi — temukan sendiri kaitannya dengan norma!' },
        { icon: '📖', judul: 'Baca & Eksplorasi', isi: 'Pelajari pengertian dan fungsi norma. Tandai tiap tab setelah dibaca agar tidak ada yang terlewat!' },
        { icon: '💬', judul: 'Diskusi & Tulis', isi: 'Jawab pertanyaan diskusi — jawabanmu otomatis tersimpan dan akan tampil lagi di Refleksi sebagai portofoliomu' },
        { icon: '🎮', judul: 'Game Fungsi Norma', isi: 'Uji pemahamanmu dengan 5 soal benar-salah. Setiap jawaban benar memberi penjelasan mendalam!' },
      ],
    },
    {
      type: 'tab-icons',
      title: '5 Fungsi Norma',
      intro: 'Eksplorasi 5 fungsi norma dalam kehidupan bermasyarakat',
      layout: 'horizontal',
      animation: 'fade',
      tabs: [
        { icon: '🗺️', judul: 'Pedoman', warna: '#f9c82e', isi: 'Norma memberi petunjuk kepada setiap individu tentang cara bertindak yang baik dan benar dalam pergaulan sehari-hari.', poin: ['Mengajarkan cara bertindak yang baik', 'Memberi tahu apa yang boleh dan tidak boleh', 'Panduan perilaku dalam situasi sosial'], refleksi: 'Sebutkan 1 norma yang selama ini menjadi panduan perilakumu di sekolah!' },
        { icon: '🤝', judul: 'Ketertiban', warna: '#3ecfcf', isi: 'Norma mencegah kekacauan dan konflik. Dengan norma, setiap orang tahu apa yang boleh dan tidak boleh dilakukan sehingga kehidupan berjalan teratur.', poin: ['Mencegah kekacauan dan konflik', 'Setiap orang tahu batasnya', 'Kehidupan berjalan teratur dan dapat diprediksi'], refleksi: 'Bayangkan jika tidak ada aturan di kelasmu — apa yang akan terjadi dalam 1 jam pelajaran?' },
        { icon: '🛡️', judul: 'Melindungi Hak', warna: '#ff6b6b', isi: 'Norma menjamin setiap anggota masyarakat mendapatkan hak-haknya dan diperlakukan secara adil tanpa diskriminasi.', poin: ['Menjamin hak setiap orang', 'Mencegah perampasan hak', 'Perlindungan tanpa diskriminasi'], refleksi: 'Hak apa yang kamu rasakan paling terlindungi oleh norma di lingkunganmu?' },
        { icon: '💚', judul: 'Solidaritas', warna: '#34d399', isi: 'Norma mempererat rasa kebersamaan, persatuan, dan kepedulian antaranggota masyarakat. Norma mengajarkan bahwa kita saling membutuhkan satu sama lain.', poin: ['Mempererat kebersamaan', 'Mengajarkan kepedulian sosial', 'Membangun gotong royong'], refleksi: 'Contoh kegiatan gotong royong apa yang masih ada di lingkunganmu saat ini?' },
        { icon: '⚖️', judul: 'Keadilan', warna: '#a78bfa', isi: 'Norma memastikan setiap orang diperlakukan setara dan adil. Tidak ada yang boleh mendapat perlakuan berbeda hanya karena kekayaan, jabatan, atau kekuasaan.', poin: ['Setiap orang diperlakukan setara', 'Tidak ada diskriminasi', 'Hukum berlaku sama untuk semua'], refleksi: 'Pernahkah kamu melihat ketidakadilan di sekitarmu? Norma apa yang seharusnya ditegakkan?' },
      ],
    },
    {
      type: 'flashcard',
      title: 'Kartu Kilat: Hakikat Norma',
      instruksi: 'Ketuk kartu untuk melihat jawaban. Uji ingatanmu!',
      kartu: [
        { depan: 'Apa definisi norma?', belakang: 'Aturan atau ketentuan yang mengikat warga masyarakat, dipakai sebagai panduan, tatanan, dan pengendali tingkah laku.' },
        { depan: 'Mengapa manusia disebut Zoon Politikon?', belakang: 'Karena manusia selalu hidup berkelompok dan tidak bisa memenuhi kebutuhannya seorang diri — ia selalu membutuhkan orang lain.' },
        { depan: 'Sebutkan 4 kata kunci sifat norma!', belakang: 'Mengikat — Panduan — Tatanan — Pengendali' },
        { depan: 'Bagaimana proses lahirnya norma?', belakang: 'Manusia hidup bersama → timbul perbedaan kepentingan → muncul kebutuhan aturan → norma terbentuk dari adat, kesepakatan, agama, atau undang-undang.' },
        { depan: 'Apa fungsi norma sebagai pedoman tingkah laku?', belakang: 'Norma memberi petunjuk tentang cara bertindak yang baik dan benar dalam pergaulan — apa yang boleh, tidak boleh, dan harus dilakukan.' },
        { depan: 'Bagaimana norma melindungi hak warga?', belakang: 'Norma menjamin setiap anggota masyarakat mendapatkan haknya dan diperlakukan adil — tidak ada yang boleh merampas hak orang lain.' },
      ],
    },
    {
      type: 'truefalse',
      title: 'Game: Fungsi Norma',
      instruksi: 'Tentukan benar atau salah pernyataan berikut tentang fungsi norma!',
      soal: [
        { teks: 'Norma hanya berfungsi sebagai larangan', jawaban: false, penjelasan: 'Norma bukan hanya larangan — ia juga berfungsi sebagai pedoman, pelindung hak, pemersatu, dan penegak keadilan.' },
        { teks: 'Gotong royong adalah contoh norma yang memperkuat solidaritas', jawaban: true, penjelasan: 'Gotong royong mempererat rasa kebersamaan dan kepedulian antarwarga.' },
        { teks: 'Norma hukum berlaku berbeda untuk orang kaya dan miskin', jawaban: false, penjelasan: 'Norma hukum memastikan semua orang diperlakukan setara — kaya atau miskin.' },
        { teks: 'Norma kesopanan menciptakan ketertiban dalam masyarakat', jawaban: true, penjelasan: 'Dengan norma, setiap orang tahu apa yang boleh dan tidak boleh dilakukan sehingga tercipta ketertiban.' },
        { teks: 'Pelanggaran norma tidak memiliki konsekuensi apapun', jawaban: false, penjelasan: 'Setiap norma memiliki sanksi — mulai dari rasa bersalah (internal) hingga hukuman resmi (eksternal).' },
      ],
    },
    {
      type: 'diskusi',
      title: 'Diskusi Kelas',
      intro: 'Jawab pertanyaan berikut — jawabanmu akan tersimpan untuk portofolio refleksi',
      pertanyaan: [
        { label: 'Diskusi Makhluk Sosial', icon: '💬', teks: 'Bayangkan kamu tinggal di sebuah pulau bersama 30 orang yang tidak saling mengenal, tanpa pemimpin dan tanpa aturan sama sekali. Apa yang akan terjadi dalam 1 minggu pertama? Apa masalah yang paling pertama muncul?', petunjuk: 'Jawabanmu akan tampil lagi di Refleksi sebagai portofoliomu' },
        { label: 'Latihan Mandiri', icon: '✍️', teks: 'Dengan kata-katamu sendiri, jelaskan apa yang dimaksud norma dan mengapa norma dibutuhkan. Gunakan contoh dari kehidupan sehari-harimu!', petunjuk: 'Gunakan pengalaman pribadimu sebagai contoh' },
      ],
    },
    {
      type: 'refleksi',
      title: 'Refleksi Akhir',
      intro: 'Tuliskan refleksimu tentang pembelajaran hari ini',
      pertanyaan: [
        { teks: 'Apa yang paling kamu pelajari hari ini tentang hakikat norma?', petunjuk: 'Tulis 2-3 hal yang paling berkesan' },
        { teks: 'Bagaimana kamu akan menerapkan pemahaman tentang norma dalam kehidupan sehari-hari?', petunjuk: 'Tulis rencana aksi nyata yang bisa kamu lakukan' },
      ],
    },
  ],
  'macam-norma': [
    {
      type: 'petunjuk',
      title: 'Cara Belajar Hari Ini',
      intro: 'Setiap aktivitas dilengkapi panduan diskusi dan pertanyaan pemantik',
      langkah: [
        { icon: '👥', judul: 'Diskusi Kelompok', isi: 'Setiap aktivitas dilengkapi panduan diskusi dan pertanyaan pemantik. Diskusikan dulu sebelum menjawab!' },
        { icon: '🙏', judul: '4 Jenis Norma', isi: 'Pelajari kartu detail setiap norma. Bagi tugas membaca antar anggota kelompok!' },
        { icon: '🔢', judul: 'Game Sortir Norma', isi: 'Klasifikasikan 12 perilaku ke jenis norma yang tepat. Diskusi kelompok dulu sebelum menjawab!' },
        { icon: '🎡', judul: 'Roda Norma', isi: 'Putar roda dan jawab pertanyaan tentang macam-macam norma!' },
      ],
    },
    {
      type: 'review',
      title: 'Ingat Kembali Pertemuan 1',
      intro: 'Apa saja yang sudah dipelajari dan apa yang akan dipelajari hari ini?',
      kartu: [
        { icon: '✅', judul: 'Sudah dipelajari', isi: '• Manusia = makhluk sosial\n• Norma = aturan mengikat\n• 5 fungsi norma', warna: '#34d399' },
        { icon: '🎯', judul: 'Hari ini', isi: '• 4 jenis norma & sumbernya\n• Sanksi tiap norma\n• Hubungan antarnorma', warna: '#3ecfcf' },
      ],
    },
    {
      type: 'icon-explore',
      title: '4 Jenis Norma',
      intro: 'Klik ikon untuk mempelajari setiap jenis norma secara mendalam',
      layout: 'grid',
      animation: 'fade',
      items: [
        { icon: '🙏', judul: 'Norma Agama', warna: '#f9c82e', ringkasan: 'Norma dari Tuhan melalui kitab suci', isi: 'Norma agama berasal dari Tuhan Yang Maha Esa melalui kitab suci. Bersifat universal bagi pemeluknya, mengatur hubungan vertikal (dengan Tuhan) dan horizontal (sesama manusia). Sanksinya berupa dosa dan rasa bersalah batin.', contoh: ['Shalat lima waktu bagi Muslim', 'Berdoa sebelum makan', 'Tidak berbohong karena Tuhan Maha Mengetahui'], sanksi: 'Dosa di akhirat, rasa bersalah batin, sanksi sosial keagamaan' },
        { icon: '❤️', judul: 'Norma Kesusilaan', warna: '#ff6b6b', ringkasan: 'Norma dari hati nurani manusia', isi: 'Norma kesusilaan berasal dari hati nurani manusia — nilai baik-buruk yang dirasakan naluriah. Bersifat universal, tidak tertulis, dan tidak bisa dipaksakan dari luar. Sanksinya berupa rasa bersalah dan malu dari dalam diri sendiri.', contoh: ['Mengembalikan dompet yang ditemukan', 'Jujur meski tidak ada yang tahu', 'Tidak menyontek karena hati nurani'], sanksi: 'Rasa bersalah, rasa malu, dikucilkan lingkungan' },
        { icon: '🤝', judul: 'Norma Kesopanan', warna: '#3ecfcf', ringkasan: 'Norma dari adat istiadat masyarakat', isi: 'Norma kesopanan berasal dari adat istiadat dan kebiasaan masyarakat secara turun-temurun. Berbeda-beda antar daerah, tidak tertulis, tapi sangat kuat pengaruhnya secara sosial. Sanksinya berupa teguran dan pengucilan sosial.', contoh: ['Mengucap salam saat bertemu', 'Membungkuk saat melewati orang lebih tua', 'Tidak memotong pembicaraan orang lain'], sanksi: 'Ditegur, dicela, dijauhi, dikucilkan' },
        { icon: '⚖️', judul: 'Norma Hukum', warna: '#a78bfa', ringkasan: 'Norma dari negara, tertulis dan tegas', isi: 'Norma hukum berasal dari negara/lembaga resmi berwenang. Bersifat tertulis, tegas, berlaku bagi seluruh warga negara tanpa pengecualian, dan ada aparat penegak hukum. Sanksinya berupa denda, penjara, atau pencabutan hak.', contoh: ['Larangan mencuri (KUHP)', 'Wajib menggunakan helm saat berkendara', 'Membayar pajak sesuai penghasilan'], sanksi: 'Denda, penjara, pencabutan hak oleh negara' },
      ],
    },
    {
      type: 'sorting',
      title: 'Game Sortir Norma',
      instruksi: 'Klasifikasikan setiap perilaku ke jenis norma yang tepat!',
      kategori: [
        { label: 'Norma Agama', color: '#f9c82e', id: 'agama' },
        { label: 'Norma Kesusilaan', color: '#ff6b6b', id: 'kesusilaan' },
        { label: 'Norma Kesopanan', color: '#3ecfcf', id: 'kesopanan' },
        { label: 'Norma Hukum', color: '#a78bfa', id: 'hukum' },
      ],
      items: [
        { teks: 'Berdoa sebelum makan', kategori: 'agama' },
        { teks: 'Mengembalikan dompet yang ditemukan', kategori: 'kesusilaan' },
        { teks: 'Mengucap salam saat bertemu guru', kategori: 'kesopanan' },
        { teks: 'Tidak mencuri karena dilarang UU', kategori: 'hukum' },
        { teks: 'Tidak mencontek karena dosa', kategori: 'agama' },
        { teks: 'Jujur meski tidak ada yang tahu', kategori: 'kesusilaan' },
        { teks: 'Tidak memutar musik keras di perumahan', kategori: 'kesopanan' },
        { teks: 'Membayar pajak tepat waktu', kategori: 'hukum' },
        { teks: 'Berpuasa di bulan Ramadhan', kategori: 'agama' },
        { teks: 'Membantu korban kecelakaan tanpa pamrih', kategori: 'kesusilaan' },
        { teks: 'Minta maaf saat bersalah', kategori: 'kesopanan' },
        { teks: 'Memakai helm saat naik motor', kategori: 'hukum' },
      ],
    },
    {
      type: 'roda',
      title: 'Roda Norma',
      instruksi: 'Putar roda dan jawab pertanyaan tentang norma!',
      opsi: [
        '🙏 Agama',
        '❤️ Kesusilaan',
        '🤝 Kesopanan',
        '⚖️ Hukum',
      ],
    },
    {
      type: 'comparison',
      title: 'Hubungan Antarnorma',
      intro: 'Norma-norma tidak berdiri sendiri — mereka saling terkait dan memengaruhi satu sama lain',
      animation: 'fade',
      kolom: [
        { icon: '🙏', judul: 'Norma Agama', warna: '#f9c82e' },
        { icon: '⚖️', judul: 'Norma Hukum', warna: '#a78bfa' },
      ],
      baris: [
        { label: 'Sumber', icon: '📌', nilai: ['Tuhan / Kitab Suci', 'Negara / UU'] },
        { label: 'Sifat', icon: '⚙️', nilai: ['Universal bagi pemeluknya', 'Mengikat seluruh warga negara'] },
        { label: 'Sanksi', icon: '⚠️', nilai: ['Dosa & sanksi akhirat', 'Denda, penjara, pencabutan hak'] },
        { label: 'Contoh', icon: '💡', nilai: ['Shalat, berdoa, jujur', 'Membayar pajak, taat UU'] },
      ],
      tanya: 'Bagaimana hubungan antara norma agama dan norma hukum di Indonesia?',
    },
    {
      type: 'flashcard',
      title: 'Kartu Kilat: Macam-Macam Norma',
      instruksi: 'Ketuk kartu untuk melihat jawaban. Uji ingatanmu!',
      kartu: [
        { depan: 'Apa sumber norma agama?', belakang: 'Tuhan Yang Maha Esa melalui kitab suci dan wahyu. Bersifat universal bagi pemeluk agama tersebut.' },
        { depan: 'Apa sanksi pelanggaran norma kesusilaan?', belakang: 'Rasa bersalah dan malu dari dalam diri sendiri. Sanksi bersifat internal karena berasal dari hati nurani.' },
        { depan: 'Mengapa norma kesopanan berbeda antar daerah?', belakang: 'Karena norma kesopanan berasal dari adat istiadat dan kebiasaan masyarakat yang berbeda-beda di setiap daerah.' },
        { depan: 'Apa yang membedakan norma hukum dari norma lainnya?', belakang: 'Norma hukum bersifat tertulis, tegas, berlaku bagi seluruh warga negara, dan ada aparat penegak hukum dengan sanksi denda/penjara.' },
        { depan: 'Berikan contoh hubungan antara norma agama dan hukum!', belakang: 'Di Indonesia, norma agama melarang mencuri dan norma hukum juga mengaturnya dalam KUHP. Keduanya saling memperkuat.' },
        { depan: 'Norma apa yang sanksinya paling tegas dan mengikat?', belakang: 'Norma Hukum — sanksinya berupa denda, penjara, atau pencabutan hak oleh negara melalui aparat penegak hukum.' },
      ],
    },
    {
      type: 'diskusi',
      title: 'Diskusi Kelompok',
      intro: 'Diskusikan pertanyaan berikut bersama kelompokmu',
      pertanyaan: [
        { label: 'Diskusi Perbandingan Norma Keluarga', icon: '📝', teks: 'Tuliskan 1-2 temuan menarik dari perbandingan tabel norma keluarga kelompokmu. Norma apa yang sama? Norma apa yang unik/berbeda?', petunjuk: 'Jawabanmu akan tampil lagi di Refleksi' },
        { label: 'Diskusi Hubungan Antarnorma', icon: '💬', teks: 'Setelah semua presentasi: Norma mana yang paling berbeda dari yang kamu bayangkan sebelumnya? Mengapa sanksinya berbeda antar norma?', petunjuk: 'Diskusikan bersama kelompokmu' },
      ],
    },
    {
      type: 'refleksi',
      title: 'Refleksi Akhir',
      intro: 'Tuliskan refleksimu tentang pembelajaran hari ini',
      pertanyaan: [
        { teks: 'Norma mana yang paling sering kamu jumpai dalam kehidupan sehari-hari? Berikan contohnya!', petunjuk: 'Pikirkan norma yang kamu temui di rumah, sekolah, dan masyarakat' },
        { teks: 'Mengapa keempat jenis norma saling melengkapi? Apa yang terjadi jika hanya ada satu jenis norma?', petunjuk: 'Gunakan contoh dari diskusi sebelumnya' },
      ],
    },
  ],
  blank: [],
};

// ── Preset Materi Blok Data ─────────────────────────────────────
const PRESETS_MATERI: Record<string, Array<Record<string, unknown>>> = {
  'hakikat-norma': [
    { tipe: 'definisi', judul: 'Definisi Norma', isi: 'Norma adalah aturan atau ketentuan yang mengikat warga suatu kelompok masyarakat, dipakai sebagai panduan, tatanan, dan pengendali tingkah laku yang sesuai dan dapat diterima masyarakat.' },
    { tipe: 'highlight', judul: 'Analogi: Norma = Lampu Lalu Lintas Kehidupan', isi: 'Bayangkan persimpangan tanpa lampu merah — semua kendaraan saling berebut dan terjadi kekacauan. Norma adalah "lampu merah" kehidupan yang mengatur agar semua orang dapat hidup bersama dengan tertib, aman, dan harmonis.', icon: '🚦', warna: '#f9c82e' },
    { tipe: 'poin', judul: '4 Kata Kunci Norma', butir: ['🔗 Mengikat — Berlaku wajib bagi semua anggota kelompok', '🗺️ Panduan — Memberi petunjuk: ini yang boleh, ini yang tidak boleh', '⚙️ Tatanan — Menciptakan keteraturan sosial', '🎛️ Pengendali — Mengendalikan perilaku agar tidak merugikan orang lain'] },
    { tipe: 'timeline', judul: 'Bagaimana Norma Lahir?', langkah: [
      { icon: '1️⃣', judul: 'Hidup Bersama', isi: 'Manusia hidup bersama dalam kelompok (keluarga, kampung, negara)' },
      { icon: '2️⃣', judul: 'Perbedaan Kepentingan', isi: 'Timbul perbedaan kepentingan dan potensi konflik antarpihak' },
      { icon: '3️⃣', judul: 'Kebutuhan Aturan', isi: 'Muncul kebutuhan mengatur perilaku agar semua pihak terlindungi' },
      { icon: '4️⃣', judul: 'Norma Terbentuk', isi: 'Dari adat, kesepakatan, agama, maupun undang-undang' },
    ]},
  ],
  'macam-norma': [
    { tipe: 'tabel', judul: 'Perbandingan 4 Jenis Norma', baris: [
      ['', '🙏 Agama', '❤️ Kesusilaan', '🤝 Kesopanan', '⚖️ Hukum'],
      ['Sumber', 'Tuhan/Kitab Suci', 'Hati Nurani', 'Adat Istiadat', 'Negara/UU'],
      ['Sifat', 'Universal bagi pemeluk', 'Universal & internal', 'Berbeda antar daerah', 'Tertulis & tegas'],
      ['Sanksi', 'Dosa & akhirat', 'Rasa bersalah', 'Teguran & dikucilkan', 'Denda & penjara'],
    ]},
    { tipe: 'definisi', judul: 'Hubungan Antarnorma', isi: 'Keempat norma tidak berdiri sendiri. Norma agama membentuk kesusilaan, kesusilaan mendorong kesopanan, dan kesopanan sering menjadi dasar hukum. Di Indonesia, norma agama dan hukum saling memengaruhi.' },
  ],
  blank: [],
};

// ── Full Preset Mapping ──────────────────────────────────────────
const FULL_PRESET_MAP: Record<string, { meta: string; cp: string; tp: string; atp: string; alur: string; kuis: string; skenario: string; modules: string; materi: string }> = {
  'hakikat-norma': { meta: 'hakikat-norma', cp: 'ppkn-smp-bab3', tp: 'bab3-full', atp: 'bab3-3pertemuan', alur: 'hakikat-norma-80menit', kuis: 'norma-10-soal', skenario: 'hakikat-norma', modules: 'hakikat-norma', materi: 'hakikat-norma' },
  'macam-norma': { meta: 'macam-norma', cp: 'ppkn-smp-bab3', tp: 'bab3-full', atp: 'bab3-3pertemuan', alur: 'macam-norma-80menit', kuis: 'norma-10-soal', skenario: 'macam-norma', modules: 'macam-norma', materi: 'macam-norma' },
  blank: { meta: 'blank', cp: 'blank', tp: 'blank', atp: 'blank', alur: 'blank', kuis: 'blank', skenario: 'blank', modules: 'blank', materi: 'blank' },
};

// ── Verb options ─────────────────────────────────────────────────
export const VERB_OPTIONS = [
  'Menjelaskan', 'Mengidentifikasi', 'Menganalisis', 'Memberikan contoh',
  'Menerapkan', 'Mengevaluasi', 'Membandingkan', 'Menyimpulkan',
  'Mendeskripsikan', 'Merancang', 'Membuat', 'Mempresentasikan',
];

const COLOR_OPTIONS = ['#f9c82e', '#3ecfcf', '#a78bfa', '#34d399', '#ff6b6b', '#fb923c'];

function colorForIndex(i: number): string {
  return COLOR_OPTIONS[i % COLOR_OPTIONS.length];
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

const STORAGE_KEY = 'at_state_v1';

// ── Store Interface ──────────────────────────────────────────────
interface AuthoringState {
  // Navigation
  activePanel: PanelId;

  // Mode tracking
  activePreset: string | null; // null = project mode, string = preset key

  // Data
  meta: MetaState;
  cp: CpState;
  tp: TpItem[];
  atp: AtpState;
  alur: AlurItem[];
  skenario: Array<Record<string, unknown>>;
  kuis: KuisItem[];
  modules: Array<Record<string, unknown>>;
  games: Array<Record<string, unknown>>;
  materi: MateriState;

  // System
  dirty: boolean;
  guruPw: string;

  // Navigation actions
  setActivePanel: (panel: PanelId) => void;

  // Meta actions
  updateMeta: (key: keyof MetaState, value: string) => void;

  // CP actions
  updateCp: (key: string, value: unknown) => void;
  addProfil: (value: string) => void;
  removeProfil: (index: number) => void;

  // TP actions
  addTp: () => void;
  deleteTp: (index: number) => void;
  updateTp: (index: number, key: keyof TpItem, value: unknown) => void;
  reorderTp: (fromIndex: number, toIndex: number) => void;

  // ATP actions
  updateAtpNamaBab: (value: string) => void;
  addAtpPertemuan: () => void;
  deleteAtpPertemuan: (index: number) => void;
  updateAtpPertemuan: (index: number, key: keyof AtpPertemuan, value: string) => void;

  // Alur actions
  addAlur: () => void;
  deleteAlur: (index: number) => void;
  updateAlur: (index: number, key: keyof AlurItem, value: string) => void;
  reorderAlur: (fromIndex: number, toIndex: number) => void;

  // Kuis actions
  addKuis: () => void;
  deleteKuis: (index: number) => void;
  updateKuis: (index: number, key: string, value: unknown) => void;
  updateKuisOpt: (index: number, optIndex: number, value: string) => void;
  reorderKuis: (fromIndex: number, toIndex: number) => void;

  // Materi block actions
  addMateriBlok: (tipe: string) => void;
  removeMateriBlok: (index: number) => void;
  updateMateriBlok: (index: number, key: string, value: unknown) => void;
  moveMateriBlok: (fromIndex: number, toIndex: number) => void;

  // Module actions
  addModule: (typeId: string) => void;
  removeModule: (index: number) => void;
  updateModuleField: (index: number, key: string, value: unknown) => void;
  moveModule: (fromIndex: number, toIndex: number) => void;
  addModuleItem: (moduleIndex: number, arrayKey: string, defaultItem: Record<string, unknown>) => void;
  removeModuleItem: (moduleIndex: number, arrayKey: string, itemIndex: number) => void;
  updateModuleItem: (moduleIndex: number, arrayKey: string, itemIndex: number, key: string, value: unknown) => void;

  // Skenario actions
  setSkenario: (data: Array<Record<string, unknown>>) => void;
  addSkenarioChapter: () => void;
  removeSkenarioChapter: (index: number) => void;
  updateSkenarioChapter: (index: number, key: string, value: unknown) => void;
  addSkenarioSetup: (chapterIndex: number) => void;
  removeSkenarioSetup: (chapterIndex: number, setupIndex: number) => void;
  updateSkenarioSetup: (chapterIndex: number, setupIndex: number, key: string, value: unknown) => void;
  addSkenarioChoice: (chapterIndex: number) => void;
  removeSkenarioChoice: (chapterIndex: number, choiceIndex: number) => void;
  updateSkenarioChoice: (chapterIndex: number, choiceIndex: number, key: string, value: unknown) => void;
  addSkenarioConsequence: (chapterIndex: number, choiceIndex: number) => void;
  removeSkenarioConsequence: (chapterIndex: number, choiceIndex: number, consIndex: number) => void;
  updateSkenarioConsequence: (chapterIndex: number, choiceIndex: number, consIndex: number, key: string, value: unknown) => void;

  // System actions
  markDirty: () => void;
  markClean: () => void;
  saveToStorage: () => void;
  loadFromStorage: () => boolean;

  // Completeness
  calcCompleteness: () => number;

  // Presets
  applyFullPreset: (presetKey: string) => void;
  applyKuisPreset: (presetKey: string) => void;
  applyTpPreset: (presetKey: string) => void;
  applyCpPreset: (presetKey: string) => void;
  applyAtpPreset: (presetKey: string) => void;
  applyAlurPreset: (presetKey: string) => void;
  applyMetaPreset: (presetKey: string) => void;
  newProject: () => void;
}

// ── Create Store ─────────────────────────────────────────────────
export const useAuthoringStore = create<AuthoringState>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────
  activePanel: 'dashboard' as PanelId,
  activePreset: null as string | null,

  meta: {
    judulPertemuan: '', subjudul: '', ikon: '\uD83D\uDCDA', durasi: '',
    namaBab: '', mapel: '', kelas: '', kurikulum: '',
  },
  cp: {
    elemen: '', subElemen: '', capaianFase: '', profil: [],
    fase: 'D', kelas: '',
  },
  tp: [],
  atp: { namaBab: '', jumlahPertemuan: 3, pertemuan: [] },
  alur: [],
  skenario: [],
  kuis: [],
  modules: [],
  games: [],
  materi: { blok: [] },

  dirty: false,
  guruPw: 'guru123',

  // ── Navigation ─────────────────────────────────────────────────
  setActivePanel: (panel) => set({ activePanel: panel }),

  // ── Meta ───────────────────────────────────────────────────────
  updateMeta: (key, value) => {
    set((s) => ({ meta: { ...s.meta, [key]: value }, dirty: true }));
  },

  // ── CP ─────────────────────────────────────────────────────────
  updateCp: (key, value) => {
    set((s) => ({ cp: { ...s.cp, [key]: value }, dirty: true }));
  },
  addProfil: (value) => {
    set((s) => ({ cp: { ...s.cp, profil: [...s.cp.profil, value] }, dirty: true }));
  },
  removeProfil: (index) => {
    set((s) => ({
      cp: { ...s.cp, profil: s.cp.profil.filter((_, i) => i !== index) },
      dirty: true,
    }));
  },

  // ── TP ─────────────────────────────────────────────────────────
  addTp: () => {
    const { tp } = get();
    const newTp: TpItem = {
      verb: 'Menjelaskan', desc: '', pertemuan: 1,
      color: colorForIndex(tp.length),
    };
    set({ tp: [...tp, newTp], dirty: true });
  },
  deleteTp: (index) => {
    set((s) => ({ tp: s.tp.filter((_, i) => i !== index), dirty: true }));
  },
  updateTp: (index, key, value) => {
    set((s) => {
      const newTp = [...s.tp];
      newTp[index] = { ...newTp[index], [key]: value };
      return { tp: newTp, dirty: true };
    });
  },
  reorderTp: (fromIndex, toIndex) => {
    set((s) => {
      const tp = [...s.tp];
      const [moved] = tp.splice(fromIndex, 1);
      tp.splice(toIndex, 0, moved);
      return { tp, dirty: true };
    });
  },

  // ── ATP ────────────────────────────────────────────────────────
  updateAtpNamaBab: (value) => {
    set((s) => ({ atp: { ...s.atp, namaBab: value }, dirty: true }));
  },
  addAtpPertemuan: () => {
    set((s) => ({
      atp: {
        ...s.atp,
        pertemuan: [...s.atp.pertemuan, { judul: '', tp: '', durasi: '2\u00D740 menit', kegiatan: '', penilaian: '' }],
      },
      dirty: true,
    }));
  },
  deleteAtpPertemuan: (index) => {
    set((s) => ({
      atp: { ...s.atp, pertemuan: s.atp.pertemuan.filter((_, i) => i !== index) },
      dirty: true,
    }));
  },
  updateAtpPertemuan: (index, key, value) => {
    set((s) => {
      const newPertemuan = [...s.atp.pertemuan];
      newPertemuan[index] = { ...newPertemuan[index], [key]: value };
      return { atp: { ...s.atp, pertemuan: newPertemuan }, dirty: true };
    });
  },

  // ── Alur ───────────────────────────────────────────────────────
  addAlur: () => {
    set((s) => ({
      alur: [...s.alur, { fase: 'Inti', durasi: '15 menit', judul: '', deskripsi: '' }],
      dirty: true,
    }));
  },
  deleteAlur: (index) => {
    set((s) => ({ alur: s.alur.filter((_, i) => i !== index), dirty: true }));
  },
  updateAlur: (index, key, value) => {
    set((s) => {
      const newAlur = [...s.alur];
      newAlur[index] = { ...newAlur[index], [key]: value };
      return { alur: newAlur, dirty: true };
    });
  },
  reorderAlur: (fromIndex, toIndex) => {
    set((s) => {
      const alur = [...s.alur];
      const [moved] = alur.splice(fromIndex, 1);
      alur.splice(toIndex, 0, moved);
      return { alur, dirty: true };
    });
  },

  // ── Kuis ───────────────────────────────────────────────────────
  addKuis: () => {
    set((s) => ({
      kuis: [...s.kuis, { q: '', opts: ['', '', '', ''], ans: 0, ex: '' }],
      dirty: true,
    }));
  },
  deleteKuis: (index) => {
    set((s) => ({ kuis: s.kuis.filter((_, i) => i !== index), dirty: true }));
  },
  updateKuis: (index, key, value) => {
    set((s) => {
      const newKuis = [...s.kuis];
      newKuis[index] = { ...newKuis[index], [key]: value };
      return { kuis: newKuis, dirty: true };
    });
  },
  updateKuisOpt: (index, optIndex, value) => {
    set((s) => {
      const newKuis = [...s.kuis];
      const opts = [...(newKuis[index].opts || ['', '', '', ''])];
      opts[optIndex] = value;
      newKuis[index] = { ...newKuis[index], opts };
      return { kuis: newKuis, dirty: true };
    });
  },
  reorderKuis: (fromIndex, toIndex) => {
    set((s) => {
      const kuis = [...s.kuis];
      const [moved] = kuis.splice(fromIndex, 1);
      kuis.splice(toIndex, 0, moved);
      return { kuis, dirty: true };
    });
  },

  // ── Materi Block ─────────────────────────────────────────────
  addMateriBlok: (tipe) => {
    const base: MateriBlok = { tipe };
    switch (tipe) {
      case 'teks':      base.judul = ''; base.isi = ''; break;
      case 'definisi':  base.judul = ''; base.isi = ''; break;
      case 'poin':      base.judul = ''; base.butir = ['']; break;
      case 'tabel':     base.judul = ''; base.baris = [['', ''], ['', '']]; break;
      case 'kutipan':   base.judul = ''; base.isi = ''; break;
      case 'gambar':    base.judul = ''; base.isi = ''; break;
      case 'timeline':  base.judul = ''; base.langkah = [{ icon: '📌', judul: '', isi: '' }]; break;
      case 'highlight': base.judul = ''; base.icon = '⚡'; base.warna = '#f9c82e'; base.isi = ''; break;
      case 'compare':   base.judul = ''; base.kiri = { icon: '', judul: '', isi: '' }; base.kanan = { icon: '', judul: '', isi: '' }; break;
      case 'infobox':   base.judul = ''; base.style = 'info'; base.isi = ''; break;
      case 'checklist': base.judul = ''; base.butir = ['']; break;
      case 'statistik': base.judul = ''; base.items = [{ icon: '📊', angka: '', label: '', warna: '#3ecfcf' }]; break;
      case 'studi':     base.judul = ''; base.karakter = '🧑'; base.situasi = ''; base.pertanyaan = ''; base.pesan = ''; break;
    }
    set((s) => ({ materi: { blok: [...s.materi.blok, base] }, dirty: true }));
  },
  removeMateriBlok: (index) => {
    set((s) => ({ materi: { blok: s.materi.blok.filter((_, i) => i !== index) }, dirty: true }));
  },
  updateMateriBlok: (index, key, value) => {
    set((s) => {
      const blok = [...s.materi.blok];
      blok[index] = { ...blok[index], [key]: value };
      return { materi: { blok }, dirty: true };
    });
  },
  moveMateriBlok: (fromIndex, toIndex) => {
    set((s) => {
      const blok = [...s.materi.blok];
      const [moved] = blok.splice(fromIndex, 1);
      blok.splice(toIndex, 0, moved);
      return { materi: { blok }, dirty: true };
    });
  },

  // ── Modules ──────────────────────────────────────────────────
  addModule: (typeId) => {
    const defaults: Record<string, Record<string, unknown>> = {
      skenario: { type: 'skenario', title: '', chapters: [] },
      video: { type: 'video', title: '', url: '', platform: 'youtube', durasi: '', instruksi: '', pertanyaan: [] },
      flashcard: { type: 'flashcard', title: '', instruksi: '', kartu: [] },
      infografis: { type: 'infografis', title: '', layout: 'grid', intro: '', kartu: [] },
      'studi-kasus': { type: 'studi-kasus', title: '', teks: '', sumber: '', pertanyaan: [] },
      debat: { type: 'debat', title: '', pertanyaan: '', konteks: '', pihakA: { label: 'Pro / Setuju' }, pihakB: { label: 'Kontra / Tidak Setuju' } },
      timeline: { type: 'timeline', title: '', intro: '', events: [] },
      matching: { type: 'matching', title: '', instruksi: '', pasangan: [] },
      materi: { type: 'materi', title: '', intro: '', blok: [] },
      truefalse: { type: 'truefalse', title: '', instruksi: '', soal: [] },
      memory: { type: 'memory', title: '', pasangan: [] },
      roda: { type: 'roda', title: '', opsi: [] },
      hero: { type: 'hero', title: '', subjudul: '', icon: '\uD83D\uDE80', gradient: 'sunset', cta: '', chips: '' },
      kutipan: { type: 'kutipan', quote: '', source: '', title: '', display: 'card', accent: '#f9c82e' },
      langkah: { type: 'langkah', title: '', intro: '', style: 'numbered', steps: [{ icon: '\uD83D\uDCCC', judul: '', isi: '', color: '#3ecfcf' }] },
      accordion: { type: 'accordion', title: '', intro: '', items: [{ icon: '\uD83D\uDCCC', judul: '', isi: '' }] },
      statistik: { type: 'statistik', title: '', intro: '', layout: 'grid', items: [{ icon: '\uD83D\uDCCA', angka: '', satuan: '', label: '', color: '#3ecfcf' }] },
      polling: { type: 'polling', title: '', instruksi: '', tipe: 'single', anonymous: false, opsi: [{ icon: '', teks: '', warna: '#3ecfcf' }] },
      embed: { type: 'embed', title: '', url: '', height: 400, label: 'Buka di tab baru' },
      'tab-icons': { type: 'tab-icons', title: '', intro: '', layout: 'horizontal', animation: 'fade', tabs: [{ icon: '', judul: '', warna: '#3ecfcf', isi: '', poin: [], refleksi: '' }] },
      'icon-explore': { type: 'icon-explore', title: '', intro: '', layout: 'grid', animation: 'fade', items: [{ icon: '', judul: '', warna: '#3ecfcf', ringkasan: '', isi: '', contoh: [], sanksi: '' }] },
      comparison: { type: 'comparison', title: '', intro: '', animation: 'fade', kolom: [{ icon: '', judul: '', warna: '#3ecfcf' }, { icon: '', judul: '', warna: '#a78bfa' }], baris: [{ label: '', icon: '', nilai: ['', ''] }], tanya: '' },
      'card-showcase': { type: 'card-showcase', title: '', intro: '', layout: 'grid', animation: 'fade', cards: [{ icon: '', judul: '', subtitle: '', isi: '', tag: [], warna: '#3ecfcf' }] },
      'hotspot-image': { type: 'hotspot-image', title: '', intro: '', imageUrl: '', height: 300, mode: 'tooltip', animation: 'fade', hotspots: [{ x: 50, y: 50, icon: '\uD83D\uDCCC', judul: '', warna: '#f9c82e', isi: '' }] },
      sorting: { type: 'sorting', title: '', instruksi: '', kategori: [{ label: 'Kategori 1', color: '#3ecfcf', id: 'cat1' }, { label: 'Kategori 2', color: '#a78bfa', id: 'cat2' }], items: [{ teks: '', kategori: 'cat1' }] },
      spinwheel: { type: 'spinwheel', title: '', instruksi: '', soal: [{ teks: '', kategori: '' }] },
      teambuzzer: { type: 'teambuzzer', title: '', instruksi: '', timA: 'Tim A', timB: 'Tim B', soal: [{ teks: '', jawaban: '', poin: 10 }] },
      wordsearch: { type: 'wordsearch', title: '', instruksi: '', kata: [], ukuran: 10 },
    };
    const base = defaults[typeId] || { type: typeId, title: '' };
    set((s) => ({ modules: [...s.modules, { ...base, _id: generateModuleId() }], dirty: true }));
  },
  removeModule: (index) => {
    set((s) => ({ modules: s.modules.filter((_, i) => i !== index), dirty: true }));
  },
  updateModuleField: (index, key, value) => {
    set((s) => {
      const modules = [...s.modules];
      modules[index] = { ...modules[index], [key]: value };
      return { modules, dirty: true };
    });
  },
  moveModule: (fromIndex, toIndex) => {
    set((s) => {
      const modules = [...s.modules];
      const [moved] = modules.splice(fromIndex, 1);
      modules.splice(toIndex, 0, moved);
      return { modules, dirty: true };
    });
  },
  addModuleItem: (moduleIndex, arrayKey, defaultItem) => {
    set((s) => {
      const modules = [...s.modules];
      const mod = { ...modules[moduleIndex] };
      const arr = [...((mod[arrayKey] as unknown[]) || [])];
      arr.push(defaultItem);
      (mod as Record<string, unknown>)[arrayKey] = arr;
      modules[moduleIndex] = mod;
      return { modules, dirty: true };
    });
  },
  removeModuleItem: (moduleIndex, arrayKey, itemIndex) => {
    set((s) => {
      const modules = [...s.modules];
      const mod = { ...modules[moduleIndex] };
      const arr = ((mod[arrayKey] as unknown[]) || []).filter((_, i) => i !== itemIndex);
      (mod as Record<string, unknown>)[arrayKey] = arr;
      modules[moduleIndex] = mod;
      return { modules, dirty: true };
    });
  },
  updateModuleItem: (moduleIndex, arrayKey, itemIndex, key, value) => {
    set((s) => {
      const modules = [...s.modules];
      const mod = { ...modules[moduleIndex] };
      const arr = [...((mod[arrayKey] as Record<string, unknown>[]) || [])];
      arr[itemIndex] = { ...arr[itemIndex], [key]: value };
      (mod as Record<string, unknown>)[arrayKey] = arr;
      modules[moduleIndex] = mod;
      return { modules, dirty: true };
    });
  },
  // ── Skenario ───────────────────────────────────────────────────
  setSkenario: (data) => set({ skenario: data, dirty: true }),
  addSkenarioChapter: () => {
    const newChapter: Record<string, unknown> = {
      title: '',
      bg: 'sbg-kampung',
      charEmoji: '🧑',
      charColor: '#3ecfcf',
      charPants: '#2563eb',
      choicePrompt: 'Apa yang akan kamu lakukan?',
      setup: [{ speaker: 'NARRATOR', text: '' }],
      choices: [{
        icon: '🤝', label: '', detail: '', good: true, pts: 10, level: 'good',
        norma: '', resultTitle: '', resultBody: '',
        consequences: [{ icon: '✅', text: '' }],
      }],
    };
    set((s) => ({ skenario: [...s.skenario, newChapter], dirty: true }));
  },
  removeSkenarioChapter: (index) => {
    set((s) => ({ skenario: s.skenario.filter((_, i) => i !== index), dirty: true }));
  },
  updateSkenarioChapter: (index, key, value) => {
    set((s) => {
      const next = [...s.skenario];
      next[index] = { ...next[index], [key]: value };
      return { skenario: next, dirty: true };
    });
  },
  addSkenarioSetup: (chapterIndex) => {
    set((s) => {
      const next = [...s.skenario];
      const chapter = { ...next[chapterIndex] };
      const setup = [...((chapter.setup as Array<Record<string, unknown>>) || []), { speaker: '', text: '' }];
      chapter.setup = setup;
      next[chapterIndex] = chapter;
      return { skenario: next, dirty: true };
    });
  },
  removeSkenarioSetup: (chapterIndex, setupIndex) => {
    set((s) => {
      const next = [...s.skenario];
      const chapter = { ...next[chapterIndex] };
      const setup = ((chapter.setup as Array<Record<string, unknown>>) || []).filter((_, i) => i !== setupIndex);
      chapter.setup = setup.length > 0 ? setup : [{ speaker: '', text: '' }];
      next[chapterIndex] = chapter;
      return { skenario: next, dirty: true };
    });
  },
  updateSkenarioSetup: (chapterIndex, setupIndex, key, value) => {
    set((s) => {
      const next = [...s.skenario];
      const chapter = { ...next[chapterIndex] };
      const setup = [...((chapter.setup as Array<Record<string, unknown>>) || [])];
      setup[setupIndex] = { ...setup[setupIndex], [key]: value };
      chapter.setup = setup;
      next[chapterIndex] = chapter;
      return { skenario: next, dirty: true };
    });
  },
  addSkenarioChoice: (chapterIndex) => {
    set((s) => {
      const next = [...s.skenario];
      const chapter = { ...next[chapterIndex] };
      const choices = [...((chapter.choices as Array<Record<string, unknown>>) || []), {
        icon: '🤝', label: '', detail: '', good: false, pts: 5, level: 'mid',
        norma: '', resultTitle: '', resultBody: '',
        consequences: [{ icon: '⚠️', text: '' }],
      }];
      chapter.choices = choices;
      next[chapterIndex] = chapter;
      return { skenario: next, dirty: true };
    });
  },
  removeSkenarioChoice: (chapterIndex, choiceIndex) => {
    set((s) => {
      const next = [...s.skenario];
      const chapter = { ...next[chapterIndex] };
      const choices = ((chapter.choices as Array<Record<string, unknown>>) || []).filter((_, i) => i !== choiceIndex);
      chapter.choices = choices;
      next[chapterIndex] = chapter;
      return { skenario: next, dirty: true };
    });
  },
  updateSkenarioChoice: (chapterIndex, choiceIndex, key, value) => {
    set((s) => {
      const next = [...s.skenario];
      const chapter = { ...next[chapterIndex] };
      const choices = [...((chapter.choices as Array<Record<string, unknown>>) || [])];
      choices[choiceIndex] = { ...choices[choiceIndex], [key]: value };
      chapter.choices = choices;
      next[chapterIndex] = chapter;
      return { skenario: next, dirty: true };
    });
  },
  addSkenarioConsequence: (chapterIndex, choiceIndex) => {
    set((s) => {
      const next = [...s.skenario];
      const chapter = { ...next[chapterIndex] };
      const choices = [...((chapter.choices as Array<Record<string, unknown>>) || [])];
      const choice = { ...choices[choiceIndex] };
      const consequences = [...((choice.consequences as Array<Record<string, unknown>>) || []), { icon: '📌', text: '' }];
      choice.consequences = consequences;
      choices[choiceIndex] = choice;
      chapter.choices = choices;
      next[chapterIndex] = chapter;
      return { skenario: next, dirty: true };
    });
  },
  removeSkenarioConsequence: (chapterIndex, choiceIndex, consIndex) => {
    set((s) => {
      const next = [...s.skenario];
      const chapter = { ...next[chapterIndex] };
      const choices = [...((chapter.choices as Array<Record<string, unknown>>) || [])];
      const choice = { ...choices[choiceIndex] };
      const consequences = ((choice.consequences as Array<Record<string, unknown>>) || []).filter((_, i) => i !== consIndex);
      choice.consequences = consequences;
      choices[choiceIndex] = choice;
      chapter.choices = choices;
      next[chapterIndex] = chapter;
      return { skenario: next, dirty: true };
    });
  },
  updateSkenarioConsequence: (chapterIndex, choiceIndex, consIndex, key, value) => {
    set((s) => {
      const next = [...s.skenario];
      const chapter = { ...next[chapterIndex] };
      const choices = [...((chapter.choices as Array<Record<string, unknown>>) || [])];
      const choice = { ...choices[choiceIndex] };
      const consequences = [...((choice.consequences as Array<Record<string, unknown>>) || [])];
      consequences[consIndex] = { ...consequences[consIndex], [key]: value };
      choice.consequences = consequences;
      choices[choiceIndex] = choice;
      chapter.choices = choices;
      next[chapterIndex] = chapter;
      return { skenario: next, dirty: true };
    });
  },

  // ── System ─────────────────────────────────────────────────────
  markDirty: () => set({ dirty: true }),
  markClean: () => set({ dirty: false }),

  saveToStorage: () => {
    try {
      const s = get();
      const data = {
        meta: s.meta, cp: s.cp, tp: s.tp, atp: s.atp, alur: s.alur,
        skenario: s.skenario, kuis: s.kuis, modules: s.modules,
        games: s.games, materi: s.materi, guruPw: s.guruPw,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      set({ dirty: false });
      toast.success('\u2705 Tersimpan ke browser');
      return true;
    } catch {
      toast.error('\u274C Gagal menyimpan');
      return false;
    }
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      set({
        activePreset: null, // Loaded data is always a project, not a preset
        meta: data.meta || get().meta,
        cp: data.cp || get().cp,
        tp: data.tp || [],
        atp: data.atp || get().atp,
        alur: data.alur || [],
        skenario: data.skenario || [],
        kuis: data.kuis || [],
        modules: ensureModuleIds(data.modules || []),
        games: ensureModuleIds(data.games || []),
        materi: data.materi || { blok: [] },
        guruPw: data.guruPw || 'guru123',
        dirty: false,
      });
      toast.info('\uD83D\uDCC2 Data tersimpan dimuat');
      return true;
    } catch {
      return false;
    }
  },

  // ── Completeness ───────────────────────────────────────────────
  calcCompleteness: () => {
    const s = get();
    let pts = 0;
    let max = 0;
    const check = (val: boolean, w = 1) => { max += w; if (val) pts += w; };
    check(!!s.meta.judulPertemuan, 2);
    check(!!s.meta.kelas);
    check(!!s.cp.capaianFase, 2);
    check(s.tp.length > 0, 2);
    check(s.atp.pertemuan.length > 0, 2);
    check(s.alur.length >= 3, 2);
    check(s.kuis.length >= 5, 2);
    check(s.modules.length > 0, 1);
    return Math.round((pts / max) * 100);
  },

  // ── Full Preset ────────────────────────────────────────────────
  applyFullPreset: (presetKey) => {
    const mapping = FULL_PRESET_MAP[presetKey];
    if (!mapping) { toast.error('Preset tidak ditemukan'); return; }

    const mp = PRESETS_META[mapping.meta];
    const cp = PRESETS_CP[mapping.cp];
    const tp = PRESETS_TP[mapping.tp];
    const atp = PRESETS_ATP[mapping.atp];
    const alur = PRESETS_ALUR[mapping.alur];
    const kuis = PRESETS_KUIS[mapping.kuis];
    const skenario = PRESETS_SKENARIO[mapping.skenario];
    const modules = PRESETS_MODULES[mapping.modules];
    const materi = PRESETS_MATERI[mapping.materi];

    set({
      activePreset: presetKey === 'blank' ? null : presetKey,
      meta: mp ? deepClone(mp) : get().meta,
      cp: cp ? deepClone(cp) : get().cp,
      tp: tp ? deepClone(tp.items) : [],
      atp: atp ? deepClone(atp) : get().atp,
      alur: alur ? deepClone(alur.steps) : [],
      kuis: kuis ? deepClone(kuis.soal) : [],
      skenario: skenario ? deepClone(skenario) : [],
      materi: materi ? { blok: deepClone(materi) as unknown as MateriBlok[] } : { blok: [] },
      modules: modules ? ensureModuleIds(deepClone(modules)) : [],
      games: [],
      dirty: false,
    });
    if (presetKey === 'blank') {
      toast.success('\u2728 Proyek kosong dibuat');
    } else {
      toast.success(`\u26A1 Preset diterapkan: ${presetKey}`);
    }
  },

  applyKuisPreset: (presetKey) => {
    const p = PRESETS_KUIS[presetKey];
    if (!p) return;
    set({ kuis: deepClone(p.soal), dirty: true });
    toast.success(`\u2705 Preset Kuis diterapkan: ${p.label}`);
  },

  applyTpPreset: (presetKey) => {
    const p = PRESETS_TP[presetKey];
    if (!p) return;
    set({ tp: deepClone(p.items), dirty: true });
    toast.success(`\u2705 Preset TP diterapkan: ${p.label}`);
  },

  applyCpPreset: (presetKey) => {
    const p = PRESETS_CP[presetKey];
    if (!p) return;
    set({ cp: deepClone(p), dirty: true });
    toast.success(`\u2705 Preset CP diterapkan: ${p.label}`);
  },

  applyAtpPreset: (presetKey) => {
    const p = PRESETS_ATP[presetKey];
    if (!p) return;
    set({ atp: deepClone(p), dirty: true });
    toast.success(`\u2705 Preset ATP diterapkan: ${p.label}`);
  },

  applyAlurPreset: (presetKey) => {
    const p = PRESETS_ALUR[presetKey];
    if (!p) return;
    set({ alur: deepClone(p.steps), dirty: true });
    toast.success(`\u2705 Preset Alur diterapkan: ${p.label}`);
  },

  applyMetaPreset: (presetKey) => {
    const p = PRESETS_META[presetKey];
    if (!p) return;
    set({ meta: deepClone(p), dirty: true });
    toast.success(`\u2705 Preset meta diterapkan: ${p.label}`);
  },

  newProject: () => {
    set({
      activePreset: null,
      meta: { judulPertemuan: '', subjudul: '', ikon: '\uD83D\uDCDA', durasi: '', namaBab: '', mapel: '', kelas: '', kurikulum: '' },
      cp: { elemen: '', subElemen: '', capaianFase: '', profil: [], fase: 'D', kelas: '' },
      tp: [],
      atp: { namaBab: '', jumlahPertemuan: 3, pertemuan: [] },
      alur: [],
      skenario: [],
      kuis: [],
      modules: [],
      games: [],
      materi: { blok: [] },
      dirty: false,
      activePanel: 'dashboard',
    });
    toast.success('\u2728 Proyek baru dibuat');
  },
}));

export { COLOR_OPTIONS };
