// Auto-extracted preset data — import types from ./types
import type { MetaPreset, CpPreset, TpPreset, AtpPreset, AlurPreset, KuisPreset, PetunjukData, DiskusiData, RefleksiData, PenutupData, SuaraConfig } from './types';

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
  'perilaku-patuhan': {
    id: 'perilaku-patuhan', label: 'Bab 3 – Pertemuan 3: Perilaku Patuh terhadap Norma',
    mapel: 'PPKn', kelas: 'VII', kurikulum: 'Kurikulum Merdeka',
    judulPertemuan: 'Pertemuan 3 – Perilaku Patuh terhadap Norma',
    subjudul: 'Bagaimana menerapkan norma dalam kehidupan sehari-hari?',
    ikon: '⚖️', durasi: '2 × 40 menit', namaBab: 'Perilaku Patuh terhadap Norma',
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
  'macam-norma-8soal': {
    id: 'macam-norma-8soal', label: 'Kuis Macam Norma – 8 Soal',
    soal: [
      { q: 'Norma yang bersumber dari Tuhan YME melalui kitab suci disebut norma...', opts: ['Kesusilaan', 'Kesopanan', 'Agama', 'Hukum'], ans: 2, ex: 'Norma agama bersumber dari wahyu Tuhan yang tertuang dalam kitab suci masing-masing agama.' },
      { q: 'Berdoa sebelum makan merupakan contoh pelaksanaan norma...', opts: ['Kesopanan', 'Kesusilaan', 'Agama', 'Hukum'], ans: 2, ex: 'Berdoa adalah bentuk hubungan vertikal dengan Tuhan yang termasuk dalam norma agama.' },
      { q: 'Norma kesusilaan bersumber dari...', opts: ['Kitab suci', 'Hati nurani manusia', 'Adat istiadat', 'Undang-undang'], ans: 1, ex: 'Norma kesusilaan lahir dari hati nurani manusia — nilai baik-buruk yang dirasakan secara naluriah.' },
      { q: 'Mengembalikan dompet yang ditemukan meskipun tidak ada yang tahu merupakan contoh norma...', opts: ['Agama', 'Kesusilaan', 'Kesopanan', 'Hukum'], ans: 1, ex: 'Mengembalikan tanpa paksaan dari luar menunjukkan norma kesusilaan yang berasal dari hati nurani.' },
      { q: 'Mengucap salam saat bertemu guru di lorong sekolah merupakan contoh norma...', opts: ['Agama', 'Kesusilaan', 'Kesopanan', 'Hukum'], ans: 2, ex: 'Mengucap salam adalah etika pergaulan yang berasal dari adat kebiasaan masyarakat — norma kesopanan.' },
      { q: 'Norma yang sanksinya berupa denda atau penjara adalah norma...', opts: ['Agama', 'Kesusilaan', 'Kesopanan', 'Hukum'], ans: 3, ex: 'Hanya norma hukum yang memiliki sanksi tegas berupa denda, penjara, atau pencabutan hak dari negara.' },
      { q: 'Norma yang berbeda-beda antar daerah karena berasal dari kebiasaan setempat adalah norma...', opts: ['Agama', 'Kesusilaan', 'Kesopanan', 'Hukum'], ans: 2, ex: 'Norma kesopanan berasal dari adat istiadat yang berbeda-beda di setiap daerah.' },
      { q: 'Norma hukum berbeda dari norma lainnya karena...', opts: ['Bersifat universal', 'Berasal dari hati nurani', 'Tertulis, tegas, dan ada aparat penegaknya', 'Tidak memiliki sanksi'], ans: 2, ex: 'Norma hukum bersifat tertulis, tegas, berlaku bagi seluruh warga negara, dan ada aparat penegak hukum.' },
    ],
  },
  'perilaku-patuhan-10soal': {
    id: 'perilaku-patuhan-10soal', label: 'Kuis Perilaku Patuh – 10 Soal',
    soal: [
      { q: 'Penerapan norma di lingkungan keluarga yang paling tepat adalah...', opts: ['Menolak perintah orang tua jika tidak suka', 'Membantu orang tua mengerjakan pekerjaan rumah dengan sukarela', 'Mengambil keputusan sendiri tanpa diskusi keluarga', 'Berkata kasar jika tidak setuju dengan orang tua'], ans: 1, ex: 'Membantu orang tua sukarela menunjukkan penerapan norma kesusilaan dan kesopanan dalam keluarga.' },
      { q: 'Di sekolah, siswa yang datang tepat waktu menunjukkan patuh terhadap norma...', opts: ['Kesusilaan', 'Kesopanan', 'Agama', 'Hukum'], ans: 3, ex: 'Tata tertib sekolah tentang jam masuk adalah bagian dari norma hukum (peraturan tertulis yang berlaku di lingkungan sekolah).' },
      { q: 'Seorang warga yang melaporkan tindak kriminal kepada polisi menunjukkan...', opts: ['Pelanggaran norma kesopanan', 'Ketidakpedulian terhadap sesama', 'Perilaku patuh terhadap norma hukum', 'Pelanggaran hak orang lain'], ans: 2, ex: 'Melaporkan tindak kriminal adalah wujud kepatuhan terhadap norma hukum dan ikut menjaga ketertiban masyarakat.' },
      { q: 'Contoh penerapan norma agama dalam kehidupan sehari-hari adalah...', opts: ['Membayar pajak tepat waktu', 'Berdoa sebelum makan dan belajar', 'Mengucap salam saat bertemu guru', 'Mengantre dengan tertib di kantin'], ans: 1, ex: 'Berdoa adalah hubungan vertikal dengan Tuhan yang merupakan penerapan norma agama dalam keseharian.' },
      { q: 'Ketika teman menyontek saat ulangan, tindakan yang patuh terhadap norma adalah...', opts: ['Diam saja agar tidak dianggap pengadu', 'Mencontek juga agar nilainya tidak ketinggalan', 'Menegur teman dan melaporkan jika tidak mau berhenti', 'Memfotokan jawaban untuk dibagikan ke teman lain'], ans: 2, ex: 'Menegur dan melaporkan adalah tindakan yang patuh terhadap norma kesusilaan (kejujuran) dan norma hukum (tata tertib sekolah).' },
      { q: 'Dampak pelanggaran norma bagi kehidupan bermasyarakat adalah...', opts: ['Masyarakat menjadi lebih bebas berekspresi', 'Terjadi ketidakpercayaan dan ketidakharmonisan sosial', 'Semua orang menjadi lebih mandiri', 'Norma-norma lama tergantikan oleh yang baru'], ans: 1, ex: 'Pelanggaran norma merusak kepercayaan dan keharmonisan — masyarakat menjadi tidak aman dan tidak tertib.' },
      { q: 'Seorang pemimpin yang memanfaatkan jabatannya untuk keuntungan pribadi melanggar norma...', opts: ['Kesopanan saja', 'Kesusilaan saja', 'Hukum saja', 'Kesusilaan dan hukum'], ans: 3, ex: 'Korupsi melanggar norma kesusilaan (tidak jujur/adil) dan norma hukum (melanggar UU Tipikor).' },
      { q: 'Budaya patuh terhadap norma di Indonesia ditunjukkan melalui...', opts: ['Gotong royong dan musyawarah', 'Mementingkan kepentingan pribadi', 'Mengabaikan adat istiadat daerah', 'Menolak semua aturan yang dianggap kuno'], ans: 0, ex: 'Gotong royong dan musyawarah adalah budaya bangsa Indonesia yang mencerminkan kepatuhan terhadap norma kesopanan dan hukum.' },
      { q: 'Perilaku patuh terhadap norma yang paling sulit dilakukan adalah...', opts: ['Mengikuti aturan saat diawasi orang lain', 'Membayar pajak karena takut denda', 'Menepati janji meskipun tidak ada yang tahu', 'Mengantre karena semua orang juga mengantre'], ans: 2, ex: 'Menepati janji tanpa pengawasan menunjukkan kepatuhan pada norma kesusilaan — yang paling sulit karena hanya hati nurani yang mengawasi.' },
      { q: 'Apa yang akan terjadi jika masyarakat tidak patuh terhadap norma hukum?', opts: ['Masyarakat menjadi lebih kreatif', 'Terjadi kekacauan dan ketidakadilan', 'Semua orang merasa lebih bebas', 'Hukum akan berubah mengikuti keinginan warga'], ans: 1, ex: 'Tanpa kepatuhan pada norma hukum, masyarakat kehilangan ketertiban, keadilan, dan kepastian hukum — kehidupan menjadi kacau.' },
    ],
  },
};

// ── Preset Skenario Data ────────────────────────────────────────
export const PRESETS_SKENARIO: Record<string, Array<Record<string, unknown>>> = {
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
  'perilaku-patuhan': [
    {
      title: '🏫 Saksi Pelanggaran di Sekolah',
      bg: 'sbg-kelas',
      charEmoji: '😯',
      charColor: '#e87070',
      charPants: '#4a6a9a',
      choicePrompt: 'Apa yang akan kamu lakukan?',
      setup: [
        { speaker: 'NARRATOR', text: 'Istirahat sekolah. Kamu melihat seorang siswa kelas 9 yang jauh lebih besar membully siswa kelas 7 di koridor belakang.' },
        { speaker: 'SIWA KECIL 😢', text: '"Tolong... dia mengambil uang sakuku dan mengancam akan memukulku jika melapor."' },
        { speaker: 'KAKAK KELAS 😠', text: '"Kamu jangan ikut campur! Ini urusan kami saja. Kamu juga mau diganggu?"' },
        { speaker: 'NARRATOR', text: 'Tidak ada guru di sekitar. Kamu satu-satunya saksi. Pilihanmu sekarang bisa menentukan keselamatan adik kelas itu.' },
      ],
      choices: [
        { icon: '👨‍🏫', label: 'Laporkan ke guru', detail: 'Segera mencari guru terdekat dan melaporkan kejadian bullying', good: true, pts: 20, norma: 'Perilaku Patuh terhadap Norma Hukum & Kesusilaan', level: 'good', resultTitle: 'Pilihan Terbaik! 🌟', resultBody: 'Melaporkan pelanggaran norma adalah wujud kepatuhan terhadap norma hukum (tata tertib sekolah) dan norma kesusilaan (melindungi yang lemah).', consequences: [{ icon: '✅', text: 'Korban bullying mendapat pertolongan dan merasa dilindungi' }, { icon: '✅', text: 'Pelajar melanggar norma mendapat sanksi sesuai tata tertib — keadilan ditegakkan' }, { icon: '✅', text: 'Budaya patuh norma di sekolah semakin kuat karena ada yang berani menegakkan' }] },
        { icon: '🤝', label: 'Hadapi kakak kelas', detail: 'Menghadapi langsung dan meminta mengembalikan uang serta berhenti membully', good: true, pts: 15, norma: 'Norma Kesusilaan — Melindungi yang Lemah', level: 'good', resultTitle: 'Pilihan Berani! 👍', resultBody: 'Berani melindungi yang lemah menunjukkan penerapan norma kesusilaan. Tapi tetap berhati-hati — bisa berbahaya jika sendirian.', consequences: [{ icon: '✅', text: 'Kamu menunjukkan keberanian melindungi yang lemah' }, { icon: '💡', text: 'Lebih aman melibatkan guru agar penyelesaiannya lebih terstruktur' }, { icon: '⚠️', text: 'Menghadapi sendiri bisa berisiko jika pelaku tidak kooperatif' }] },
        { icon: '🤫', label: 'Diam saja, bukan urusanku', detail: 'Pergi dari tempat kejadian dan pura-pura tidak melihat apa-apa', good: false, pts: 0, norma: 'Pelanggaran Norma Kesusilaan — Abaikan Penderitaan Orang Lain', level: 'bad', resultTitle: 'Norma Melemah ⚠️', resultBody: 'Membiarkan pelanggaran norma terjadi tanpa bertindak berarti ikut membiarkan ketidakadilan. Budaya patuh norma menjadi lemah.', consequences: [{ icon: '❌', text: 'Korban terus menderita dan bullying berlanjut' }, { icon: '❌', text: 'Budaya diam membuat pelanggaran norma semakin berani' }, { icon: '❌', text: 'Norma kesusilaan gagal berfungsi — tidak ada yang melindungi yang lemah' }] },
      ],
    },
    {
      title: '🏘️ Gotong Royong yang Memudar',
      bg: 'sbg-kampung',
      charEmoji: '🤔',
      charColor: '#3ecfcf',
      charPants: '#4a7a6a',
      choicePrompt: 'Apa yang akan kamu lakukan?',
      setup: [
        { speaker: 'NARRATOR', text: 'Kampungmu dulu terkenal dengan gotong royong. Setiap Sabtu pagi, warga bersih-bersih bersama. Tapi belakangan, kebiasaan itu makin ditinggalkan.' },
        { speaker: 'IBU 😔', text: '"Dulu ramai sekali, sekarang cuma 3-4 orang yang datang. Yang lain sibuk dengan urusannya masing-masing."' },
        { speaker: 'NARRATOR', text: 'Lingkungan mulai kotor dan tidak terawat. Kamu ingin mengembalikan semangat gotong royong.' },
      ],
      choices: [
        { icon: '💪', label: 'Inisiatif sendiri, ajak teman-teman', detail: 'Kumpulkan teman sebaya dan mulai bersih-bersih, semoga warga lain ikut terinspirasi', good: true, pts: 20, norma: 'Perilaku Patuh terhadap Norma Kesopanan — Gotong Royong', level: 'good', resultTitle: 'Pilihan Terbaik! 🌟', resultBody: 'Memulai dari diri sendiri adalah wujud nyata penerapan norma kesopanan (gotong royong). Tindakan nyata lebih kuat dari sekadar mengeluh.', consequences: [{ icon: '✅', text: 'Contoh nyata penerapan norma gotong royong di masyarakat' }, { icon: '✅', text: 'Tindakanmu menginspirasi orang lain untuk ikut serta' }, { icon: '✅', text: 'Budaya patuh norma dibangun dari langkah kecil yang konsisten' }] },
        { icon: '📋', label: 'Usulkan ke RT untuk jadwal tetap', detail: 'Minta RT mengaktifkan kembali jadwal gotong royong resmi dan mengirim undangan', good: true, pts: 15, norma: 'Perilaku Patuh terhadap Norma Hukum & Kesopanan', level: 'good', resultTitle: 'Langkah Bijak! 👍', resultBody: 'Melalui jalur resmi, gotong royong menjadi kegiatan yang terstruktur dan mengikat — ini penerapan norma hukum dan kesopanan sekaligus.', consequences: [{ icon: '✅', text: 'Gotong royong dijadwalkan resmi — warga merasa terikat untuk hadir' }, { icon: '✅', text: 'RT sebagai pemimpin dapat memberi arahan dan motivasi' }, { icon: '💡', text: 'Idealnya kamu juga ikut hadir sebagai contoh — jangan hanya mengusulkan' }] },
        { icon: '🙅', label: 'Urusi sendiri, bukan urusanku', detail: 'Itu tanggung jawab RT dan warga dewasa, bukan tugas siswa', good: false, pts: 3, norma: 'Norma kesopanan dan gotong royong diabaikan', level: 'bad', resultTitle: 'Norma Melemah ⚠️', resultBody: 'Gotong royong bukan hanya tanggung jawab RT — setiap warga termasuk siswa punya peran. Jika semua berpikir sama, norma akan semakin memudar.', consequences: [{ icon: '❌', text: 'Budaya gotong royong makin pudar tanpa regenerasi' }, { icon: '❌', text: 'Lingkungan semakin kotor dan tidak terawat' }, { icon: '❌', text: 'Norma kesopanan dan solidaritas gagal diwariskan ke generasi berikutnya' }] },
      ],
    },
  ],
  blank: [],
};

// ── Preset Modules Data ─────────────────────────────────────────
export const PRESETS_MODULES: Record<string, Array<Record<string, unknown>>> = {
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
      soal: [
        { teks: 'Norma yang sanksinya berupa dosa dan hukuman akhirat', jawaban: '🙏 Agama' },
        { teks: 'Norma yang berasal dari adat istiadat masyarakat', jawaban: '🤝 Kesopanan' },
        { teks: 'Norma yang bersifat tertulis dan ada aparat penegaknya', jawaban: '⚖️ Hukum' },
        { teks: 'Norma yang berasal dari hati nurani manusia', jawaban: '❤️ Kesusilaan' },
        { teks: 'Contoh: berdoa sebelum makan', jawaban: '🙏 Agama' },
        { teks: 'Contoh: mengucap salam saat bertemu guru', jawaban: '🤝 Kesopanan' },
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
  'perilaku-patuhan': [
    {
      type: 'petunjuk',
      title: 'Cara Belajar Hari Ini',
      intro: 'Pertemuan terakhir Bab 3 — saatnya menerapkan semua yang sudah dipelajari!',
      langkah: [
        { icon: '🔄', judul: 'Review P1 & P2', isi: 'Kilas balik hakikat norma dan macam-macam norma. Siapkan diri untuk menerapkan!' },
        { icon: '🏠', judul: 'Eksplorasi 4 Lingkungan', isi: 'Pelajari penerapan norma di keluarga, sekolah, masyarakat, dan negara melalui tab interaktif.' },
        { icon: '📝', judul: 'Kuis & Diskusi Kasus', isi: 'Kuis 10 soal tentang seluruh Bab 3, lalu diskusi kelompok analisis kasus konflik norma.' },
        { icon: '💪', judul: 'Refleksi & Komitmen', isi: 'Tulis komitmen pribadi dan tandatangani "Deklarasi Patuh Norma" secara simbolis.' },
      ],
    },
    {
      type: 'review',
      title: 'Ingat Kembali Pertemuan 1 & 2',
      intro: 'Apa saja yang sudah dipelajari dan apa yang akan dipelajari hari ini?',
      kartu: [
        { icon: '✅', judul: 'Pertemuan 1 — Hakikat Norma', isi: '• Manusia = makhluk sosial\n• Norma = aturan mengikat\n• 5 fungsi norma', warna: '#34d399' },
        { icon: '✅', judul: 'Pertemuan 2 — Macam-Macam Norma', isi: '• 4 jenis norma & sumbernya\n• Sanksi tiap norma\n• Hubungan antarnorma', warna: '#3ecfcf' },
        { icon: '🎯', judul: 'Hari ini — Perilaku Patuh', isi: '• Penerapan norma di 4 lingkungan\n• Budaya patuh norma\n• Komitmen pribadi', warna: '#f9c82e' },
      ],
    },
    {
      type: 'tab-icons',
      title: 'Penerapan Norma di 4 Lingkungan',
      intro: 'Eksplorasi bagaimana norma diterapkan dalam berbagai lingkungan kehidupan',
      layout: 'horizontal',
      animation: 'fade',
      tabs: [
        { icon: '🏠', judul: 'Keluarga', warna: '#f9c82e', isi: 'Di lingkungan keluarga, norma mengatur hubungan antar anggota keluarga. Norma agama mewarnai nilai-nilai keluarga, norma kesusilaan menjadi dasar kasih sayang, norma kesopanan mengatur tata krama, dan norma hukum melindungi hak-hak anggota keluarga.', poin: ['Menghormati dan membantu orang tua', 'Berkomunikasi dengan sopan dalam keluarga', 'Menjalankan tradisi dan nilai keluarga'], refleksi: 'Norma apa yang paling kuat di keluargamu? Beri contohnya!' },
        { icon: '🏫', judul: 'Sekolah', warna: '#3ecfcf', isi: 'Di lingkungan sekolah, norma diterapkan melalui tata tertib, etika belajar, dan hubungan antar warga sekolah. Norma hukum berupa peraturan sekolah, norma kesopanan mengatur etika bergaul, norma agama melalui kegiatan keagamaan, dan norma kesusilaan menjadi dasar kejujuran.', poin: ['Mematuhi tata tertib sekolah', 'Menghormati guru dan teman', 'Jujur dalam ulangan dan tugas'], refleksi: 'Norma mana yang paling sering kamu patuhi di sekolah?' },
        { icon: '🏘️', judul: 'Masyarakat', warna: '#34d399', isi: 'Di lingkungan masyarakat, norma berupa adat istiadat, gotong royong, dan peraturan daerah. Norma kesopanan paling menonjol dalam kehidupan bermasyarakat, diikuti norma hukum berupa peraturan daerah dan norma agama dalam kegiatan keagamaan komunal.', poin: ['Ikut gotong royong dan kegiatan sosial', 'Menghormati tetangga dan perbedaan', 'Mematuhi peraturan daerah setempat'], refleksi: 'Kegiatan gotong royong apa yang masih ada di lingkunganmu?' },
        { icon: '🇮🇩', judul: 'Negara', warna: '#a78bfa', isi: 'Dalam kehidupan berbangsa dan bernegara, norma hukum menjadi paling menonjol melalui UUD dan undang-undang. Norma agama memengaruhi hukum nasional, norma kesusilaan menjadi dasar kebijakan publik, dan norma kesopanan tercermin dalam etika berdemokrasi.', poin: ['Mematuhi undang-undang dan peraturan negara', 'Membayar pajak sebagai kewajiban warga negara', 'Menghormati lambang dan simbol negara'], refleksi: 'Sebagai warga negara, norma apa yang paling kamu rasakan manfaatnya?' },
      ],
    },
    {
      type: 'debat',
      title: 'Debat: Prioritas Norma',
      pertanyaan: 'Apakah norma hukum harus selalu diprioritaskan di atas norma lainnya?',
      konteks: 'Di Indonesia, norma agama dan hukum sering berjalan beriringan. Namun, kadang terjadi konflik antar norma — mana yang harus diutamakan?',
      pihakA: { label: 'Pro — Norma hukum harus diprioritaskan' },
      pihakB: { label: 'Kontra — Norma lain setara dan kontekstual' },
    },
    {
      type: 'truefalse',
      title: 'Game: Penerapan Norma',
      instruksi: 'Tentukan benar atau salah pernyataan berikut tentang penerapan norma!',
      soal: [
        { teks: 'Membantu orang tua sukarela adalah penerapan norma kesusilaan di keluarga', jawaban: true, penjelasan: 'Membantu sukarela tanpa paksaan menunjukkan hati nurani yang baik — penerapan norma kesusilaan.' },
        { teks: 'Norma hukum hanya berlaku di pengadilan, bukan di sekolah', jawaban: false, penjelasan: 'Tata tertib sekolah adalah bagian dari norma hukum — peraturan tertulis yang berlaku di lingkungan sekolah.' },
        { teks: 'Gotong royong adalah wujud penerapan norma kesopanan di masyarakat', jawaban: true, penjelasan: 'Gotong royong mencerminkan adat kebiasaan tolong-menolong — penerapan norma kesopanan.' },
        { teks: 'Pelanggaran norma tidak berdampak pada kehidupan bermasyarakat', jawaban: false, penjelasan: 'Pelanggaran norma merusak kepercayaan, keharmonisan, dan ketertiban masyarakat.' },
        { teks: 'Menepati janji tanpa pengawasan menunjukkan kepatuhan pada norma kesusilaan', jawaban: true, penjelasan: 'Hanya hati nurani yang mengawasi — inilah penerapan tertinggi norma kesusilaan.' },
      ],
    },
    {
      type: 'flashcard',
      title: 'Kartu Kilat: Penerapan Norma',
      instruksi: 'Ketuk kartu untuk melihat jawaban. Uji ingatanmu!',
      kartu: [
        { depan: 'Contoh norma di keluarga?', belakang: 'Membantu orang tua, menghormati kakak/adik, berdoa bersama, komunikasi sopan.' },
        { depan: 'Mengapa tata tertib sekolah termasuk norma hukum?', belakang: 'Karena tertulis, berlaku bagi semua siswa, dan ada sanksi jika dilanggar — ciri-ciri norma hukum.' },
        { depan: 'Apa itu budaya patuh norma?', belakang: 'Kebiasaan masyarakat untuk secara sukarela mematuhi norma tanpa paksaan — karena kesadaran, bukan takut sanksi.' },
        { depan: 'Mengapa gotong royong penting dalam penerapan norma?', belakang: 'Gotong royong adalah wujud nyata penerapan norma kesopanan dan solidaritas — tanpa paksaan, dari kesadaran bersama.' },
        { depan: 'Apa dampak jika masyarakat tidak patuh norma hukum?', belakang: 'Kehilangan ketertiban, keadilan, dan kepastian hukum — kehidupan menjadi kacau dan tidak aman.' },
        { depan: 'Norma apa yang paling sulit dipatuhi? Mengapa?', belakang: 'Norma kesusilaan — karena hanya hati nurani yang mengawasi, tidak ada sanksi eksternal yang memaksa.' },
      ],
    },
    {
      type: 'diskusi',
      title: 'Diskusi Kelas',
      intro: 'Diskusikan pertanyaan berikut tentang penerapan norma dalam kehidupan nyata',
      pertanyaan: [
        { label: 'Diskusi Konflik Norma', icon: '⚖️', teks: 'Bayangkan norma agama dan norma hukum bertentangan dalam satu kasus. Norma mana yang harus diprioritaskan? Berikan alasanmu!', petunjuk: 'Tidak ada jawaban mutlak — yang penting argumentasi yang jelas dan logis' },
        { label: 'Diskusi Penerapan Nyata', icon: '🏠', teks: 'Pilih 1 dari 4 lingkungan (keluarga, sekolah, masyarakat, negara). Ceritakan 1 contoh nyata penerapan norma yang kamu lakukan sendiri minggu ini!', petunjuk: 'Gunakan pengalaman pribadimu yang sesungguhnya' },
        { label: 'Diskusi Budaya Patuh', icon: '💪', teks: 'Mengapa budaya patuh norma lebih efektif daripada ketertiban karena takut sanksi? Bagaimana cara membangun budaya patuh di lingkunganmu?', petunjuk: 'Bandingkan kepatuhan karena kesadaran vs kepatuhan karena paksaan' },
      ],
    },
    {
      type: 'refleksi',
      title: 'Refleksi Akhir Bab 3',
      intro: 'Refleksi terakhir — rangkum seluruh pembelajaran 3 pertemuan',
      pertanyaan: [
        { teks: 'Dari 3 pertemuan Bab 3, apa hal paling berkesan yang kamu pelajari tentang norma?', petunjuk: 'Tulis 2-3 hal yang benar-benar mengubah cara pandangmu', warna: '#f9c82e', icon: '🌟' },
        { teks: 'Sebutkan 1 contoh nyata di mana kamu MENERAPKAN norma dalam kehidupan sehari-hari tanpa disuruh!', petunjuk: 'Fokus pada tindakan sukarela — bukan karena paksaan', warna: '#3ecfcf', icon: '🔍' },
        { teks: 'Tulis komitmen pribadimu: 1 tindakan nyata yang akan kamu lakukan sebagai wujud patuh terhadap norma', petunjuk: 'Contoh: Saya akan selalu mengantre dengan tertib dan tidak memotong antrian...', warna: '#34d399', icon: '💪' },
      ],
    },
  ],
  blank: [],
};

// ── Preset Materi Blok Data ─────────────────────────────────────
export const PRESETS_MATERI: Record<string, Array<Record<string, unknown>>> = {
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
  'perilaku-patuhan': [
    { tipe: 'definisi', judul: 'Penerapan Norma dalam Kehidupan Sehari-hari', isi: 'Penerapan norma berarti menjalankan aturan-aturan yang berlaku dalam kehidupan nyata — bukan hanya mengetahui, tetapi benar-benar melakukannya setiap hari di keluarga, sekolah, masyarakat, dan negara.' },
    { tipe: 'poin', judul: '4 Lingkungan Penerapan Norma', butir: ['🏠 Keluarga — Menghormati orang tua, berdoa bersama, membantu pekerjaan rumah, komunikasi sopan', '🏫 Sekolah — Mematuhi tata tertib, jujur dalam ulangan, menghormati guru dan teman', '🏘️ Masyarakat — Gotong royong, menghormati tetangga, mematuhi peraturan daerah', '🇮🇩 Negara — Mematuhi UUD dan UU, membayar pajak, menghormati lambang negara'] },
    { tipe: 'highlight', judul: 'Budaya Patuh Norma = Kehidupan yang Tertib', isi: 'Analogi: Bayangkan kota tanpa lampu lalu lintas — semua kendaraan saling berebut dan terjadi kekacauan. Budaya patuh norma adalah "lampu hijau" yang membuat kehidupan berjalan lancer karena setiap orang MENGIKUTI aturan secara sukarela, bukan karena takut sanksi.', icon: '🚦', warna: '#34d399' },
    { tipe: 'timeline', judul: 'Langkah Membangun Budaya Patuh', langkah: [
      { icon: '1️⃣', judul: 'Memahami', isi: 'Pahami norma yang berlaku — tahu apa yang boleh dan tidak boleh' },
      { icon: '2️⃣', judul: 'Menyadari', isi: 'Sadari pentingnya norma — bukan karena paksaan, tapi karena manfaatnya' },
      { icon: '3️⃣', judul: 'Menerapkan', isi: 'Terapkan dalam tindakan nyata — lakukan secara konsisten setiap hari' },
      { icon: '4️⃣', judul: 'Membiasakan', isi: 'Jadikan kebiasaan — dari kesadaran tumbuh menjadi budaya patuh' },
    ]},
  ],
  blank: [],
};

// ── Preset Petunjuk Data ─────────────────────────────────────────
export const PRESETS_PETUNJUK: Record<string, PetunjukData> = {
  'hakikat-norma': {
    title: 'Cara Menggunakan Media Ini',
    intro: 'Ikuti langkah-langkah berikut agar pembelajaran berjalan optimal',
    langkah: [
      { icon: '🎭', judul: 'Skenario Interaktif', isi: 'Hadapi 4 situasi nyata. Setiap pilihan punya konsekuensi — temukan sendiri kaitannya dengan norma!' },
      { icon: '📖', judul: 'Baca & Eksplorasi', isi: 'Pelajari pengertian dan fungsi norma. Tandai tiap tab setelah dibaca agar tidak ada yang terlewat!' },
      { icon: '💬', judul: 'Diskusi & Tulis', isi: 'Jawab pertanyaan diskusi — jawabanmu otomatis tersimpan dan akan tampil lagi di Refleksi sebagai portofoliomu' },
      { icon: '🎮', judul: 'Game Fungsi Norma', isi: 'Uji pemahamanmu dengan 8 soal skenario. Setiap jawaban benar memberi penjelasan mendalam!' },
    ],
    tips: 'Ikuti alur dari awal sampai akhir. Jawab semua pertanyaan diskusi — jawabanmu akan muncul di Refleksi sebagai portofolio belajarmu hari ini!',
  },
  'macam-norma': {
    title: 'Cara Belajar Hari Ini',
    intro: 'Setiap aktivitas dilengkapi panduan diskusi dan pertanyaan pemantik',
    langkah: [
      { icon: '👥', judul: 'Diskusi Kelompok', isi: 'Setiap aktivitas dilengkapi panduan diskusi dan pertanyaan pemantik. Diskusikan dulu sebelum menjawab!' },
      { icon: '🙏', judul: '4 Jenis Norma', isi: 'Pelajari kartu detail setiap norma. Bagi tugas membaca antar anggota kelompok!' },
      { icon: '🔢', judul: 'Game Sortir Norma', isi: 'Klasifikasikan 12 perilaku ke jenis norma yang tepat. Diskusi kelompok dulu sebelum menjawab!' },
      { icon: '🎡', judul: 'Roda Norma', isi: 'Putar roda dan jawab pertanyaan tentang macam-macam norma!' },
    ],
    tips: 'Pembelajaran hari ini berbasis kelompok. Diskusikan setiap pertanyaan sebelum menjawab bersama!',
  },
  'perilaku-patuhan': {
    title: 'Cara Belajar Hari Ini',
    intro: 'Pertemuan terakhir Bab 3 — saatnya menerapkan semua yang sudah dipelajari!',
    langkah: [
      { icon: '🔄', judul: 'Review P1 & P2', isi: 'Kilas balik hakikat norma dan macam-macam norma. Siapkan diri untuk menerapkan!' },
      { icon: '🏠', judul: 'Eksplorasi 4 Lingkungan', isi: 'Pelajari penerapan norma di keluarga, sekolah, masyarakat, dan negara melalui tab interaktif.' },
      { icon: '📝', judul: 'Kuis & Diskusi Kasus', isi: 'Kuis 10 soal tentang seluruh Bab 3, lalu diskusi kelompok analisis kasus konflik norma.' },
      { icon: '💪', judul: 'Refleksi & Komitmen', isi: 'Tulis komitmen pribadi dan tandatangani "Deklarasi Patuh Norma" secara simbolis.' },
    ],
    tips: 'Ini pertemuan terakhir! Berikan yang terbaik — semua yang kamu pelajari akan dirangkum dalam komitmen pribadimu.',
  },
  blank: { title: '', intro: '', langkah: [] },
};

// ── Preset Diskusi Data ──────────────────────────────────────────
export const PRESETS_DISKUSI: Record<string, DiskusiData> = {
  'hakikat-norma': {
    title: 'Diskusi Kelas',
    intro: 'Jawab pertanyaan berikut — jawabanmu akan tersimpan untuk portofolio refleksi',
    pertanyaan: [
      { label: 'Diskusi Makhluk Sosial', icon: '💬', teks: 'Bayangkan kamu tinggal di sebuah pulau bersama 30 orang yang tidak saling mengenal, tanpa pemimpin dan tanpa aturan sama sekali. Apa yang akan terjadi dalam 1 minggu pertama? Apa masalah yang paling pertama muncul?', petunjuk: 'Jawabanmu akan tampil lagi di Refleksi sebagai portofoliomu' },
      { label: 'Latihan Mandiri — Pengertian Norma', icon: '✍️', teks: 'Dengan kata-katamu sendiri, jelaskan apa yang dimaksud norma dan mengapa norma dibutuhkan. Gunakan contoh dari kehidupan sehari-harimu!', petunjuk: 'Gunakan pengalaman pribadimu sebagai contoh' },
      { label: 'Diskusi Kelompok — Fungsi Norma', icon: '💬', teks: 'Dari 5 fungsi norma yang kamu pelajari, fungsi mana yang paling terasa dalam kehidupanmu sehari-hari? Berikan satu contoh nyata dari pengalamanmu!', petunjuk: 'Fokus pada 1 fungsi yang paling bermakna bagimu' },
    ],
  },
  'macam-norma': {
    title: 'Diskusi Kelompok',
    intro: 'Diskusikan pertanyaan berikut bersama kelompokmu',
    pertanyaan: [
      { label: 'Diskusi Perbandingan Norma Keluarga', icon: '📝', teks: 'Tuliskan 1–2 temuan menarik dari perbandingan tabel norma keluarga kelompokmu. Norma apa yang sama? Norma apa yang unik/berbeda?', petunjuk: 'Jawabanmu akan tampil lagi di Refleksi' },
      { label: 'Diskusi Hubungan Antarnorma', icon: '💬', teks: 'Setelah semua presentasi: Norma mana yang paling berbeda dari yang kamu bayangkan sebelumnya? Mengapa sanksinya berbeda antar norma?', petunjuk: 'Diskusikan bersama kelompokmu' },
      { label: 'Diskusi Konflik Nilai — Kasus Deni & Rian', icon: '⚖️', teks: 'Deni tahu sahabatnya Rian menyontek. Jika Deni jujur → Rian bisa diskors. Jika diam → Deni membohongi guru. Norma mana yang harus diprioritaskan?', petunjuk: 'Tidak ada jawaban benar/salah — yang penting argumentasi yang jelas' },
    ],
  },
  'perilaku-patuhan': {
    title: 'Diskusi Kelas',
    intro: 'Diskusikan pertanyaan berikut tentang penerapan norma dalam kehidupan nyata',
    pertanyaan: [
      { label: 'Diskusi Konflik Norma', icon: '⚖️', teks: 'Bayangkan norma agama dan norma hukum bertentangan dalam satu kasus. Norma mana yang harus diprioritaskan? Berikan alasanmu!', petunjuk: 'Tidak ada jawaban mutlak — yang penting argumentasi yang jelas dan logis' },
      { label: 'Diskusi Penerapan Nyata', icon: '🏠', teks: 'Pilih 1 dari 4 lingkungan (keluarga, sekolah, masyarakat, negara). Ceritakan 1 contoh nyata penerapan norma yang kamu lakukan sendiri minggu ini!', petunjuk: 'Gunakan pengalaman pribadimu yang sesungguhnya' },
      { label: 'Diskusi Budaya Patuh', icon: '💪', teks: 'Mengapa budaya patuh norma lebih efektif daripada ketertiban karena takut sanksi? Bagaimana cara membangun budaya patuh di lingkunganmu?', petunjuk: 'Bandingkan kepatuhan karena kesadaran vs kepatuhan karena paksaan' },
    ],
  },
  blank: { title: '', intro: '', pertanyaan: [] },
};

// ── Preset Refleksi Data ──────────────────────────────────────────
export const PRESETS_REFLEKSI: Record<string, RefleksiData> = {
  'hakikat-norma': {
    title: 'Refleksi Diri',
    intro: 'Jawaban jujurmu lebih berharga dari jawaban yang sempurna.',
    pertanyaan: [
      { teks: 'Hal baru apa yang kamu pelajari hari ini tentang norma?', petunjuk: 'Tuliskan 1–2 hal yang benar-benar baru bagimu', warna: '#f9c82e', icon: '🌟' },
      { teks: 'Dari 5 fungsi norma, mana yang paling kamu rasakan manfaatnya di sekolah? Mengapa?', petunjuk: 'Jelaskan dengan contoh konkret', warna: '#3ecfcf', icon: '🔍' },
      { teks: 'Satu komitmen nyata yang akan kamu lakukan minggu ini sebagai wujud menghargai norma:', petunjuk: 'Contoh: Saya akan selalu mengantre dengan sabar di kantin dan tidak menyela antrian…', warna: '#34d399', icon: '💪' },
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
      { teks: 'Dari 4 jenis norma, mana yang paling sering kamu patuhi setiap hari? Beri 1 contoh konkret!', petunjuk: 'Contoh: Norma kesopanan — saya selalu menyapa guru saat bertemu di lorong sekolah...', warna: '#3ecfcf', icon: '🗂️' },
      { teks: 'Pernahkah kamu melihat pelanggaran norma di sekitarmu? Norma apa? Apa sanksi yang terjadi?', petunjuk: 'Ceritakan dengan jujur — tidak perlu menyebut nama orang', warna: '#ff6b6b', icon: '⚠️' },
      { teks: 'Komitmenmu: 1 tindakan nyata minggu ini berkaitan dengan salah satu dari 4 norma:', petunjuk: 'Contoh: Saya akan lebih berhati-hati menggunakan media sosial agar tidak melanggar norma kesusilaan...', warna: '#34d399', icon: '💪' },
    ],
    penugasan: {
      judul: 'Penugasan untuk Pertemuan 3',
      isi: 'Cari 1 kasus pelanggaran norma di sekitarmu atau dari berita. Analisis menggunakan panduan: Kasus | Norma yang Dilanggar | Sanksi yang Diterima | Pendapatmu: Apakah sanksinya sudah adil?',
      contoh: 'Contoh kasus yang bisa dianalisis:\n• Teman yang menyontek saat ulangan → norma kesusilaan + tata tertib sekolah\n• Buang sampah sembarangan di jalan → norma kesopanan + perda setempat\n• Kasus bullying di media sosial → norma kesusilaan + UU ITE\n• Pengendara motor tanpa helm → norma hukum lalu lintas',
    },
  },
  'perilaku-patuhan': {
    title: 'Refleksi Akhir Bab 3',
    intro: 'Refleksi terakhir — rangkum seluruh pembelajaran 3 pertemuan',
    pertanyaan: [
      { teks: 'Dari 3 pertemuan Bab 3, apa hal paling berkesan yang kamu pelajari tentang norma?', petunjuk: 'Tulis 2-3 hal yang benar-benar mengubah cara pandangmu', warna: '#f9c82e', icon: '🌟' },
      { teks: 'Sebutkan 1 contoh nyata di mana kamu MENERAPKAN norma dalam kehidupan sehari-hari tanpa disuruh!', petunjuk: 'Fokus pada tindakan sukarela — bukan karena paksaan', warna: '#3ecfcf', icon: '🔍' },
      { teks: 'Tulis komitmen pribadimu: 1 tindakan nyata yang akan kamu lakukan sebagai wujud patuh terhadap norma', petunjuk: 'Contoh: Saya akan selalu mengantre dengan tertib dan tidak memotong antrian...', warna: '#34d399', icon: '💪' },
    ],
    penugasan: {
      judul: 'Penugasan Akhir Bab 3 — Portofolio',
      isi: 'Kumpulkan semua tugas 3 pertemuan sebagai portofolio akhir Bab 3. Pastikan semua tugas lengkap dan rapi!',
      contoh: 'Portofolio Bab 3:\n• P1: Tabel norma keluarga (5 norma + contoh + sanksi)\n• P2: Analisis kasus pelanggaran norma\n• P3: Komitmen pribadi patuh norma + Deklarasi Patuh Norma',
    },
  },
  blank: { title: '', intro: '', pertanyaan: [] },
};

// ── Preset Penutup Data ──────────────────────────────────────────
export const PRESETS_PENUTUP: Record<string, PenutupData> = {
  'hakikat-norma': {
    title: 'Pertemuan 1',
    subjudul: 'Berhasil Diselesaikan!',
    preview: [
      { icon: '🧑‍🤝‍🧑', judul: 'Pertemuan 1', isi: '✅ Hakikat Norma', warna: '#34d399' },
      { icon: '🗂️', judul: 'Pertemuan 2', isi: '→ Macam-Macam Norma', warna: '#3ecfcf' },
      { icon: '🌟', judul: 'Pertemuan 3', isi: '→ Perilaku Patuh', warna: '#6e90b5' },
    ],
    nextPertemuan: {
      judul: 'Pertemuan 2 — Apa yang Akan Kamu Pelajari?',
      deskripsi: 'Kamu sudah paham apa itu norma dan mengapa norma penting. Sekarang saatnya mengenal 4 jenis norma yang mengatur kehidupanmu setiap hari!',
      items: [
        { icon: '🙏', judul: 'Norma Agama', isi: 'Bersumber dari Tuhan YME', warna: '#f9c82e' },
        { icon: '❤️', judul: 'Norma Kesusilaan', isi: 'Bersumber dari hati nurani', warna: '#ff6b6b' },
        { icon: '🤝', judul: 'Norma Kesopanan', isi: 'Bersumber dari adat istiadat', warna: '#3ecfcf' },
        { icon: '⚖️', judul: 'Norma Hukum', isi: 'Bersumber dari negara', warna: '#a78bfa' },
      ],
    },
  },
  'macam-norma': {
    title: 'Pertemuan 2',
    subjudul: 'Berhasil Diselesaikan!',
    preview: [
      { icon: '🧑‍🤝‍🧑', judul: 'Pertemuan 1', isi: '✅ Hakikat Norma', warna: '#34d399' },
      { icon: '🗂️', judul: 'Pertemuan 2', isi: '✅ Macam-Macam Norma', warna: '#3ecfcf' },
      { icon: '🌟', judul: 'Pertemuan 3', isi: '→ Perilaku Patuh', warna: '#6e90b5' },
    ],
    nextPertemuan: {
      judul: 'Pertemuan 3 — Apa yang Akan Kamu Pelajari?',
      deskripsi: 'Kamu sudah mengenal 4 jenis norma dan hubungan antarnorma. Sekarang saatnya menerapkan norma dalam kehidupan nyata!',
      items: [
        { icon: '🏠', judul: 'Keluarga', isi: 'Penerapan norma di lingkungan keluarga', warna: '#f9c82e' },
        { icon: '🏫', judul: 'Sekolah', isi: 'Penerapan norma di lingkungan sekolah', warna: '#3ecfcf' },
        { icon: '🏘️', judul: 'Masyarakat', isi: 'Penerapan norma di lingkungan masyarakat', warna: '#34d399' },
        { icon: '🇮🇩', judul: 'Negara', isi: 'Penerapan norma dalam kehidupan berbangsa', warna: '#a78bfa' },
      ],
    },
  },
  'perilaku-patuhan': {
    title: 'Bab 3 — Pertemuan 3',
    subjudul: 'Berhasil Diselesaikan! 🎉',
    preview: [
      { icon: '🧑‍🤝‍🧑', judul: 'Pertemuan 1', isi: '✅ Hakikat Norma', warna: '#34d399' },
      { icon: '🗂️', judul: 'Pertemuan 2', isi: '✅ Macam-Macam Norma', warna: '#3ecfcf' },
      { icon: '🌟', judul: 'Pertemuan 3', isi: '✅ Perilaku Patuh terhadap Norma', warna: '#f9c82e' },
    ],
  },
  blank: { title: '', subjudul: '', preview: [] },
};

// ── Preset Suara Config ──────────────────────────────────────────
export const PRESETS_SUARA: Record<string, SuaraConfig> = {
  'hakikat-norma': { navigasi: true, benar: true, salah: true, selesai: true, klik: true, skor: true },
  'macam-norma': { navigasi: true, benar: true, salah: true, selesai: true, klik: true, skor: true },
  'perilaku-patuhan': { navigasi: true, benar: true, salah: true, selesai: true, klik: true, skor: true },
  blank: { navigasi: false, benar: false, salah: false, selesai: false, klik: false, skor: false },
};

// ── Full Preset Mapping ──────────────────────────────────────────
export const FULL_PRESET_MAP: Record<string, { meta: string; cp: string; tp: string; atp: string; alur: string; kuis: string; skenario: string; modules: string; materi: string; petunjuk: string; diskusi: string; refleksi: string; penutup: string; suara: string }> = {
  'hakikat-norma': { meta: 'hakikat-norma', cp: 'ppkn-smp-bab3', tp: 'bab3-full', atp: 'bab3-3pertemuan', alur: 'hakikat-norma-80menit', kuis: 'norma-10-soal', skenario: 'hakikat-norma', modules: 'hakikat-norma', materi: 'hakikat-norma', petunjuk: 'hakikat-norma', diskusi: 'hakikat-norma', refleksi: 'hakikat-norma', penutup: 'hakikat-norma', suara: 'hakikat-norma' },
  'macam-norma': { meta: 'macam-norma', cp: 'ppkn-smp-bab3', tp: 'bab3-full', atp: 'bab3-3pertemuan', alur: 'macam-norma-80menit', kuis: 'macam-norma-8soal', skenario: 'macam-norma', modules: 'macam-norma', materi: 'macam-norma', petunjuk: 'macam-norma', diskusi: 'macam-norma', refleksi: 'macam-norma', penutup: 'macam-norma', suara: 'macam-norma' },
  'perilaku-patuhan': { meta: 'perilaku-patuhan', cp: 'ppkn-smp-bab3', tp: 'bab3-full', atp: 'bab3-3pertemuan', alur: 'perilaku-patuhan-80menit', kuis: 'perilaku-patuhan-10soal', skenario: 'perilaku-patuhan', modules: 'perilaku-patuhan', materi: 'perilaku-patuhan', petunjuk: 'perilaku-patuhan', diskusi: 'perilaku-patuhan', refleksi: 'perilaku-patuhan', penutup: 'perilaku-patuhan', suara: 'perilaku-patuhan' },
  blank: { meta: 'blank', cp: 'blank', tp: 'blank', atp: 'blank', alur: 'blank', kuis: 'blank', skenario: 'blank', modules: 'blank', materi: 'blank', petunjuk: 'blank', diskusi: 'blank', refleksi: 'blank', penutup: 'blank', suara: 'blank' },
};
