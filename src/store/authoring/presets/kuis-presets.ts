// ── Kuis Presets ──────────────────────────────────────────────────
import type { KuisPreset } from '../types';

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
