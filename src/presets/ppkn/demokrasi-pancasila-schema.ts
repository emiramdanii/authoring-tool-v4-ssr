import type { LessonSchema, SchemaBlock } from '@/core/schema/types';

export const DEMOKRASI_PANCASILA_LESSON: LessonSchema = {
  id: 'demokrasi-pancasila',
  version: 1,
  title: 'Demokrasi Pancasila',
  mapel: 'PPKn',
  kelas: 'IX',
  themeId: 'demokrasi-pancasila',
  navbar: {
    logoText: '🗳️ Demokrasi Pancasila',
    logoColor: 'o',
    progressGradient: ['o', 'g'],
  },
  screens: [
    // ──────────────────────── COVER ────────────────────────
    {
      id: 's-cover',
      templateType: 'cover',
      background: { type: 'radial', color1: 'o', color2: 'bg' },
      blocks: [
        {
          type: 'cover',
          icon: '🗳️',
          title: 'Demokrasi Pancasila',
          subtitle: 'Bab 4 — Pertemuan 1',
          badges: [
            { icon: '📋', text: 'TP 3', color: 'y' },
            { icon: '🎭', text: '3 Skenario', color: 'c' },
            { icon: '🎮', text: 'Sortir + Roda', color: 'g' },
            { icon: '📝', text: 'Refleksi', color: 'p' },
          ],
          meta: { durasi: '80 Menit', fase: 'Fase D', elemen: 'NKRI' },
          cta: { label: '▶ Mulai Pembelajaran', action: 's-petunjuk' },
          background: { type: 'gradient', color1: 'o', color2: 'bg' },
        } as SchemaBlock,
      ],
      nav: { next: 's-petunjuk', nextLabel: 'Petunjuk' },
    },

    // ──────────────────────── PETUNJUK ────────────────────────
    {
      id: 's-petunjuk',
      templateType: 'petunjuk',
      sectionLabel: '📌 Petunjuk',
      sectionColor: 'c',
      blocks: [
        {
          type: 'petunjuk',
          title: 'Cara Menggunakan',
          titleHighlight: 'Media Ini',
          items: [
            { icon: '🎭', title: 'Skenario Interaktif', body: 'Hadapi 3 situasi tentang demokrasi di lingkunganmu. Pilih tindakanmu dan temukan prinsip demokrasi Pancasila!' },
            { icon: '📖', title: 'Baca & Eksplorasi', body: 'Pelajari pengertian demokrasi, sejarahnya di Indonesia, dan prinsip-prinsip Demokrasi Pancasila.' },
            { icon: '💬', title: 'Diskusi & Tulis', body: 'Jawab pertanyaan diskusi — jawabanmu tersimpan dan tampil lagi di Refleksi.' },
            { icon: '🎮', title: 'Game Interaktif', body: 'Sortir ciri demokrasi sehat vs tidak, dan mainkan Roda Game 8 soal!' },
          ],
          tips: '💡 Ikuti alur dari awal sampai akhir. Jawaban diskusimu akan muncul di Refleksi sebagai portofolio belajarmu!',
          tipsColor: 'o',
        },
      ],
      nav: { prev: 's-cover', next: 's-tp', nextLabel: 'Tujuan Pembelajaran' },
    },

    // ──────────────────────── TP ────────────────────────
    {
      id: 's-tp',
      templateType: 'tp',
      sectionLabel: '🎯 Tujuan Pembelajaran',
      sectionColor: 'p',
      blocks: [
        {
          type: 'tp',
          title: 'Yang Akan Kamu',
          titleHighlight: 'Kuasai Hari Ini',
          items: [
            { num: 1, verb: 'Menjelaskan', desc: 'pengertian demokrasi dan sejarah perkembangan demokrasi di Indonesia', color: 'y' },
            { num: 2, verb: 'Menganalisis', desc: 'prinsip-prinsip Demokrasi Pancasila dan perbedaannya dengan demokrasi liberal', color: 'c' },
            { num: 3, verb: 'Mengidentifikasi', desc: 'tantangan demokrasi di Indonesia dan peran siswa dalam memperkuat demokrasi', color: 'g' },
          ],
          profil: '🔗 Profil Pelajar Pancasila: Bergotong Royong · Bernalar Kritis · Kreatif',
          profilColor: 'g',
        },
        {
          type: 'alur',
          title: '⏱️ Alur Kegiatan 80 Menit',
          totalDurasi: '80',
          steps: [
            { dot: 'p', durasi: '±10\'', judul: 'Apersepsi', deskripsi: '3 Skenario tentang demokrasi' },
            { dot: 'y', durasi: '±15\'', judul: 'Materi 1', deskripsi: 'Pengertian & sejarah demokrasi Indonesia' },
            { dot: 'c', durasi: '±15\'', judul: 'Materi 2', deskripsi: 'Prinsip Demokrasi Pancasila' },
            { dot: 'g', durasi: '±15\'', judul: 'Materi 3', deskripsi: 'Tantangan demokrasi & peran siswa' },
            { dot: 'o', durasi: '±15\'', judul: 'Game', deskripsi: 'Sortir Game + Roda Game' },
            { dot: 'r', durasi: '±10\'', judul: 'Refleksi & Penutup', deskripsi: 'Portofolio + komitmen demokratis' },
          ],
        },
      ],
      nav: { prev: 's-petunjuk', next: 's-apersepsi', nextLabel: 'Mulai Pembelajaran' },
    },

    // ──────────────────────── APERSEPSI ────────────────────────
    {
      id: 's-apersepsi',
      templateType: 'skenario',
      sectionLabel: '🎭 Apersepsi · ±10 Menit',
      sectionColor: 'p',
      blocks: [
        {
          type: 'skenario',
          title: 'Demokrasi di Sekitar Kita!',
          chapters: [
            {
              id: 'ch1',
              charEmoji: '🏫',
              title: '🗳️ Politik Uang di Kelas',
              setup: [
                { speaker: 'NARRATOR', text: 'Akan ada pemilihan ketua OSIS. Seorang calon membagikan makanan gratis dan uang saku kepada teman-teman agar dipilih.' },
                { speaker: 'CALON 😏', text: '"Ini bukan suap, cuma tanda persahabatan. Kalau kalian mendukungku, aku pasti balas bantu."' },
                { speaker: 'NARRATOR', text: 'Banyak siswa tergiur karena makanan gratis. Kamu tahu ini tidak adil.' },
              ],
              choicePrompt: 'Apa yang kamu lakukan?',
              choices: [
                {
                  icon: '🛑', label: 'Tolak dan lapor ke guru', detail: 'Menolak menerima dan melaporkan praktik politik uang ke guru pembimbing OSIS',
                  good: true, pts: 20, level: 'good',
                  resultTitle: 'Pilihan Terbaik! 🌟',
                  resultBody: 'Politik uang merusak demokrasi! Melaporkan berarti kamu melindungi demokrasi yang jujur.',
                  norma: 'Demokrasi Pancasila: Bebas dari Politik Uang',
                  consequences: [
                    { icon: '✅', text: 'Pemilihan OSIS menjadi adil dan jujur' },
                    { icon: '✅', text: 'Kamu membuktikan bahwa demokrasi sejati tidak dibeli dengan uang' },
                    { icon: '✅', text: 'Sekolah belajar arti demokrasi Pancasila: musyawarah, bukan transaksi' },
                  ],
                  nextChapter: 1,
                },
                {
                  icon: '💸', label: 'Terima, toh cuma makanan', detail: 'Menerima makanan dan memilih calon tersebut karena semua juga melakukannya',
                  good: false, pts: 0, level: 'bad',
                  resultTitle: 'Salah! ⚠️',
                  resultBody: 'Menerima suap — sekecil apa pun — tetap merusak demokrasi. Suara yang dibeli bukan suara bebas.',
                  norma: 'Melanggar Demokrasi: Politik Uang',
                  consequences: [
                    { icon: '❌', text: 'Ketua terpilih bukan yang terbaik, tapi yang paling banyak traktir' },
                    { icon: '❌', text: 'Demokrasi tergantikan oleh transaksi — suaramu dijual' },
                    { icon: '⚠️', text: 'Jika dibiarkan, politik uang jadi budaya yang sulit diubah' },
                  ],
                  nextChapter: 1,
                },
                {
                  icon: '🤷', label: 'Abaikan saja', detail: 'Tidak menerima tapi juga tidak melapor — diam saja',
                  good: false, pts: 7, level: 'mid',
                  resultTitle: 'Bisa Lebih Baik 🤔',
                  resultBody: 'Tidak menerima itu bagus, tapi diam berarti membiarkan demokrasi dirusak tanpa perlawanan.',
                  norma: 'Demokrasi Butuh Keberanian',
                  consequences: [
                    { icon: '🟡', text: 'Kamu tidak ikut suap, tapi juga tidak mencegah' },
                    { icon: '⚠️', text: 'Praktik politik uang terus berlanjut tanpa ada yang menghentikan' },
                    { icon: '💡', text: 'Demokrasi butuh pembela — lapor ke guru agar semua belajar!' },
                  ],
                  nextChapter: 1,
                },
              ],
            },
            {
              id: 'ch2',
              charEmoji: '📱',
              title: '📱 Hoaks di Grup Kelas',
              setup: [
                { speaker: 'NARRATOR', text: 'Menjelang pemilihan ketua kelas, seseorang membagikan berita palsu tentang salah satu calon di grup WhatsApp kelas.' },
                { speaker: 'PENGIRIM 📢', text: '"Tahukah kalian, calon A itu pernah mencuri di kantin! Awas, jangan pilih dia!"' },
                { speaker: 'NARRATOR', text: 'Kamu tahu berita itu tidak benar karena kamu mengenal calon A dengan baik. Beberapa teman sudah percaya dan membagikan lagi.' },
              ],
              choicePrompt: 'Apa yang kamu lakukan?',
              choices: [
                {
                  icon: '🔍', label: 'Cek fakta dan koreksi', detail: 'Membantah berita palsu dengan bukti dan mengingatkan teman untuk cek fakta',
                  good: true, pts: 20, level: 'good',
                  resultTitle: 'Pilihan Terbaik! 🌟',
                  resultBody: 'Melawan hoaks adalah bentuk menjaga demokrasi! Demokrasi yang sehat butuh informasi yang benar.',
                  norma: 'Demokrasi: Kebebasan Informasi yang Benar',
                  consequences: [
                    { icon: '✅', text: 'Calon A tidak dirugikan oleh berita palsu' },
                    { icon: '✅', text: 'Kelas belajar pentingnya cek fakta sebelum membagikan informasi' },
                    { icon: '✅', text: 'Demokrasi sehat membutuhkan informasi yang benar, bukan hoaks' },
                  ],
                  nextChapter: 2,
                },
                {
                  icon: '📢', label: 'Bagikan lagi agar cepat tersebar', detail: 'Meneruskan berita itu karena menganggapnya penting untuk diketahui semua orang',
                  good: false, pts: 0, level: 'bad',
                  resultTitle: 'Salah Besar! ⚠️',
                  resultBody: 'Menyebarkan hoaks merusak demokrasi! Keputusan yang didasari informasi palsu bukan demokrasi sejati.',
                  norma: 'Melanggar Demokrasi: Disinformasi',
                  consequences: [
                    { icon: '❌', text: 'Calon A dirugikan oleh berita yang tidak benar' },
                    { icon: '❌', text: 'Keputusan pemilih dipengaruhi informasi palsu — ini bukan demokrasi' },
                    { icon: '⚠️', text: 'Menyebarkan hoaks bisa melanggar UU ITE' },
                  ],
                  nextChapter: 2,
                },
                {
                  icon: '🤫', label: 'Diamkan saja', detail: 'Tidak ikut campur karena bukan urusanmu',
                  good: false, pts: 5, level: 'mid',
                  resultTitle: 'Kurang Bijak 🤔',
                  resultBody: 'Diam membiarkan kebohongan menyebar. Dalam demokrasi, kebenaran butuh pembela.',
                  norma: 'Demokrasi: Pasif terhadap Kebohongan',
                  consequences: [
                    { icon: '🟡', text: 'Hoaks terluas tanpa bantahan dan semakin banyak yang percaya' },
                    { icon: '⚠️', text: 'Demokrasi yang sehat butuh warga yang aktif melawan kebohongan' },
                    { icon: '💡', text: 'Satu bantahan berbasis fakta bisa menghentikan penyebaran hoaks' },
                  ],
                  nextChapter: 2,
                },
              ],
            },
            {
              id: 'ch3',
              charEmoji: '🗣️',
              title: '🎤 Musyawarah Kelas',
              setup: [
                { speaker: 'NARRATOR', text: 'Kelas sedang bermusyawarah menentukan tujuan study tour. Kelompok mayoritas ingin ke pantai, sementara 5 orang ingin ke museum.' },
                { speaker: 'MAYORITAS 😤', text: '"Yang penting mayoritas menang! Kalian yang mau ke museum ikut saja yang lain!"' },
                { speaker: 'MINORITAS 😞', text: '"Kami juga punya hak suara. Kenapa tidak dicari jalan tengah?"' },
              ],
              choicePrompt: 'Apa saranmu?',
              choices: [
                {
                  icon: '🤝', label: 'Cari jalan tengah', detail: 'Mengusulkan kompromi: setengah hari di museum, setengah hari di pantai',
                  good: true, pts: 20, level: 'good',
                  resultTitle: 'Pilihan Terbaik! 🌟',
                  resultBody: 'Musyawarah mufakat mencari jalan tengah — inilah esensi Demokrasi Pancasila!',
                  norma: 'Demokrasi Pancasila: Musyawarah Mufakat',
                  consequences: [
                    { icon: '✅', text: 'Semua pihak merasa dihargai dan kompromi tercapai' },
                    { icon: '✅', text: 'Bukan suara terbanyak yang menang, tapi solusi terbaik bersama' },
                    { icon: '✅', text: 'Ini Demokrasi Pancasila: musyawarah untuk mufakat, bukan voting untuk menang-kalah' },
                  ],
                  nextChapter: 3,
                },
                {
                  icon: '📊', label: 'Voting saja, mayoritas menang', detail: 'Mengusulkan voting dan yang menang menentukan tujuan',
                  good: false, pts: 8, level: 'mid',
                  resultTitle: 'Bisa Dimaklumi 🤔',
                  resultBody: 'Voting itu sah, tapi dalam Demokrasi Pancasila, musyawarah untuk mufakat lebih diutamakan daripada voting.',
                  norma: 'Demokrasi Liberal: Voting Bukan Mufakat',
                  consequences: [
                    { icon: '🟡', text: 'Mayoritas senang, tapi minoritas merasa tidak didengar' },
                    { icon: '⚠️', text: 'Voting menciptakan pemenang dan pecundang — bukan mufakat bersama' },
                    { icon: '💡', text: 'Demokrasi Pancasila mengutamakan musyawarah sebelum voting' },
                  ],
                  nextChapter: 3,
                },
                {
                  icon: '😤', label: 'Protes dan pergi', detail: 'Menolak hasil dan meninggalkan musyawarah karena merasa tidak didengar',
                  good: false, pts: 3, level: 'bad',
                  resultTitle: 'Tidak Membantu ⚠️',
                  resultBody: 'Pergi dari musyawarah bukan solusi. Demokrasi butuh partisipasi, bukan pengunduran diri.',
                  norma: 'Anti-Demokrasi: Menolak Dialog',
                  consequences: [
                    { icon: '❌', text: 'Suaramu tidak terwakili karena kamu pergi dari musyawarah' },
                    { icon: '❌', text: 'Musyawarah gagal jika peserta menolak berdialog' },
                    { icon: '💡', text: 'Sampaikan pendapatmu dan cari sekutu — jangan pergi dari meja diskusi!' },
                  ],
                  nextChapter: 3,
                },
              ],
            },
          ],
        },
      ],
      nav: { prev: 's-tp', next: 's-materi1', nextLabel: 'Lanjut: Pengertian Demokrasi' },
    },

    // ──────────────────────── MATERI 1: Pengertian & Sejarah ────────────────────────
    {
      id: 's-materi1',
      templateType: 'materi',
      sectionLabel: '📖 Materi 1 · ±15 Menit',
      sectionColor: 'y',
      blocks: [
        {
          type: 'def-box',
          borderColor: 'y',
          content: '<strong>Demokrasi</strong> berasal dari bahasa Yunani: <em>demos</em> (rakyat) dan <em>kratos</em> (pemerintahan) — artinya pemerintahan oleh rakyat. UUD NRI 1945 Pasal 1 Ayat 2 menegaskan: <em>"Kedaulatan adalah di tangan rakyat dan dilakukan menurut Undang-Undang Dasar."</em>',
        },
        {
          type: 'nc-grid',
          cards: [
            { icon: '📜', title: 'Demokrasi Liberal', body: '1950–1959. Sistem multi-partai, kabinet jatuh-bangun, keputusan melalui voting. Tidak stabil karena terlalu banyak konflik partai.', color: 'y' },
            { icon: '👑', title: 'Demokrasi Terpimpin', body: '1959–1966. Presiden memiliki kekuasaan besar, partai dibatasi, keputusan terpusat. Demokrasi dalam nama saja.', color: 'c' },
            { icon: '🏢', title: 'Demokrasi Pancasila Orba', body: '1966–1998. Pemilu ada tapi terkontrol, kebebasan dibatasi. MPR/DPR tidak independen. Korupsi merajalela.', color: 'g' },
            { icon: '🗳️', title: 'Demokrasi Reformasi', body: '1998–sekarang. Kebebasan pers, pemilu langsung, multi-partai, otonomi daerah. Demokrasi terbuka dan transparan.', color: 'p' },
          ],
        },
        {
          type: 'flashcard-set',
          cards: [
            { q: 'Apa arti kata "demokrasi" dari bahasa Yunani?', a: 'Demos (rakyat) + Kratos (pemerintahan) = pemerintahan oleh rakyat.' },
            { q: 'Apa isi UUD 1945 Pasal 1 Ayat 2?', a: 'Kedaulatan adalah di tangan rakyat dan dilakukan menurut Undang-Undang Dasar.' },
            { q: 'Mengapa Demokrasi Liberal (1950-59) gagal di Indonesia?', a: 'Karena sistem multi-partai menyebabkan kabinet jatuh-bangun dan instabilitas politik yang parah.' },
            { q: 'Apa perbedaan Demokrasi Reformasi dengan Orde Baru?', a: 'Reformasi menjamin kebebasan pers, pemilu langsung, multi-partai, dan otonomi daerah — yang semuanya dibatasi di Orba.' },
          ],
        },
        {
          type: 'diskusi',
          title: '✍️ Latihan Mandiri',
          questions: [
            { label: 'Latihan Mandiri', icon: '✍️', teks: 'Mengapa demokrasi yang cocok untuk Indonesia adalah Demokrasi Pancasila, bukan demokrasi liberal? Jelaskan dengan kata-katamu sendiri!', petunjuk: 'Tuliskan di sini… (jawabanmu akan tampil lagi di Refleksi)', color: 'y' },
          ],
        },
      ],
      nav: { prev: 's-apersepsi', next: 's-materi2', nextLabel: 'Lanjut: Prinsip Demokrasi Pancasila' },
    },

    // ──────────────────────── MATERI 2: Prinsip Demokrasi Pancasila ────────────────────────
    {
      id: 's-materi2',
      templateType: 'materi',
      sectionLabel: '📖 Materi 2 · ±15 Menit',
      sectionColor: 'c',
      blocks: [
        {
          type: 'ftab',
          showReadMarker: true,
          showProgress: true,
          tabs: [
            {
              icon: '🤝', label: 'Musyawarah',
              content: [
                { type: 'def-box', borderColor: 'y', content: '<strong>Musyawarah</strong> adalah inti Demokrasi Pancasila. Keputusan diambil melalui diskusi bersama untuk mencapai mufakat, bukan melalui voting yang menciptakan pemenang dan pecundang.' },
                { type: 'nc-grid', cards: [
                  { icon: '🗣️', title: 'Semua Bicara', body: 'Setiap pihak berkesempatan menyampaikan pendapatnya', color: 'y' },
                  { icon: '🤔', title: 'Dengarkan', body: 'Menghargai pendapat berbeda sebagai bagian dari proses', color: 'y' },
                  { icon: '✅', title: 'Mufakat', body: 'Mencapai kesepakatan bersama, bukan suara terbanyak', color: 'y' },
                ] },
              ],
            },
            {
              icon: '💪', label: 'Gotong Royong',
              content: [
                { type: 'def-box', borderColor: 'c', content: '<strong>Gotong Royong</strong> dalam demokrasi berarti bekerja sama lintas kelompok untuk kepentingan bersama, bukan kepentingan kelompok saja. Demokrasi Pancasila mengutamakan kebersamaan.' },
                { type: 'nc-grid', cards: [
                  { icon: '🏘️', title: 'Lintas Kelompok', body: 'Bekerja sama tanpa memandang suku, agama, atau partai', color: 'c' },
                  { icon: '🎯', title: 'Kepentingan Bersama', body: 'Mengutamakan kebaikan semua, bukan kelompok tertentu', color: 'c' },
                  { icon: '🔄', title: 'Saling Membantu', body: 'Yang kuat membantu yang lemah, yang mampu membantu yang membutuhkan', color: 'c' },
                ] },
              ],
            },
            {
              icon: '🧠', label: 'Hikmat Kebijaksanaan',
              content: [
                { type: 'def-box', borderColor: 'g', content: '<strong>Hikmat Kebijaksanaan</strong> berarti mengambil keputusan dengan pertimbangan matang dan bijaksana, bukan berdasarkan emosi atau tekanan kelompok.' },
                { type: 'nc-grid', cards: [
                  { icon: '🧠', title: 'Pertimbangan Matang', body: 'Menggunakan akal sehat dan data sebelum memutuskan', color: 'g' },
                  { icon: '⚖️', title: 'Adil dan Bijak', body: 'Keputusan harus mengakomodasi semua pihak, terutama yang lemah', color: 'g' },
                  { icon: '📚', title: 'Berlandaskan Nilai', body: 'Keputusan harus selaras dengan Pancasila dan UUD 1945', color: 'g' },
                ] },
              ],
            },
            {
              icon: '🏛️', label: 'Perwakilan',
              content: [
                { type: 'def-box', borderColor: 'p', content: '<strong>Perwakilan</strong> berarti rakyat memilih wakilnya melalui pemilu yang jujur dan adil. Wakil rakyat bertanggung jawab kepada rakyat, bukan kepada partai atau diri sendiri.' },
                { type: 'nc-grid', cards: [
                  { icon: '🗳️', title: 'Pemilu Jujur', body: 'Pemilihan umum yang bebas, adil, dan transparan', color: 'p' },
                  { icon: '📋', title: 'Tanggung Jawab', body: 'Wakil rakyat harus mempertanggungjawabkan keputusannya kepada rakyat', color: 'p' },
                  { icon: '🔄', title: 'Akuntabilitas', body: 'Rakyat berhak mengawasi dan mengevaluasi kinerja wakilnya', color: 'p' },
                ] },
              ],
            },
          ],
        },
        {
          type: 'def-box',
          borderColor: 'c',
          content: '<strong>💡 Perbedaan kunci:</strong> Demokrasi Liberal mengutamakan voting (suara terbanyak menang). Demokrasi Pancasila mengutamakan musyawarah mufakat (semua setuju). Voting hanya digunakan jika mufakat tidak tercapai.',
        },
        {
          type: 'flashcard-set',
          cards: [
            { q: 'Apa perbedaan musyawarah dan voting?', a: 'Musyawarah mencari kesepakatan bersama (mufakat), voting menentukan pemenang berdasarkan suara terbanyak. Pancasila mengutamakan musyawarah.' },
            { q: 'Apa arti "Hikmat Kebijaksanaan" dalam demokrasi?', a: 'Mengambil keputusan dengan pertimbangan matang, bijak, dan berlandaskan nilai Pancasila — bukan emosi atau tekanan.' },
            { q: 'Mengapa gotong royong penting dalam Demokrasi Pancasila?', a: 'Karena demokrasi bukan kompetisi kelompok, tapi kerja sama untuk kepentingan bersama.' },
            { q: 'Apa syarat pemilu yang demokratis?', a: 'Bebas, adil, transparan, dan rahasia. Setiap warga berhak memilih tanpa tekanan atau suap.' },
          ],
        },
        {
          type: 'diskusi',
          title: '💬 Diskusi Kelas (±5 menit)',
          questions: [
            { label: 'Diskusi Kelas', icon: '💬', teks: 'Ceritakan pengalaman musyawarah di kelasmu. Apakah berjalan sesuai prinsip Demokrasi Pancasila? Apa yang bisa diperbaiki?', petunjuk: 'Tuliskan pendapatmu di sini… (akan tampil di Refleksi)', color: 'c' },
          ],
        },
      ],
      nav: { prev: 's-materi1', next: 's-materi3', nextLabel: 'Lanjut: Tantangan Demokrasi' },
    },

    // ──────────────────────── MATERI 3: Tantangan ────────────────────────
    {
      id: 's-materi3',
      templateType: 'materi',
      sectionLabel: '📖 Materi 3 · ±15 Menit',
      sectionColor: 'g',
      blocks: [
        {
          type: 'def-box',
          borderColor: 'g',
          content: 'Demokrasi Indonesia menghadapi berbagai tantangan: <strong>politik uang, hoaks & disinformasi, radikalisme, populisme, dan diskriminasi</strong>. Setiap warga negara, termasuk siswa, punya peran menjaga dan memperkuat demokrasi.',
        },
        {
          type: 'tabel-accord',
          rows: [
            { icon: '💸', title: 'Politik Uang', color: 'y', details: [
              { label: 'Definisi', value: 'Membeli suara dengan uang, barang, atau jasa untuk memenangkan pemilu' },
              { label: 'Dampak', value: 'Pemimpin terpilih bukan yang terbaik, tapi yang terkaya' },
              { label: 'Solusi', value: 'Lapor ke Bawaslu, menolak menerima, dan mengedukasi teman' },
            ] },
            { icon: '📱', title: 'Hoaks & Disinformasi', color: 'c', details: [
              { label: 'Definisi', value: 'Informasi palsu yang sengaja disebarkan untuk menyesatkan pemilih' },
              { label: 'Dampak', value: 'Keputusan didasari informasi salah, demokrasi terdistorsi' },
              { label: 'Solusi', value: 'Cek fakta sebelum share, lapor hoaks, dan edukasi literasi digital' },
            ] },
            { icon: '⚔️', title: 'Radikalisme', color: 'r', details: [
              { label: 'Definisi', value: 'Paham yang menggunakan kekerasan untuk mencapai tujuan politik' },
              { label: 'Dampak', value: 'Merusak persatuan dan mengancam keberagaman bangsa' },
              { label: 'Solusi', value: 'Meningkatkan toleransi, dialog antaragama, dan waspada rekrutmen' },
            ] },
            { icon: '🎪', title: 'Populisme', color: 'p', details: [
              { label: 'Definisi', value: 'Menyatukan massa dengan menyerang kelompok tertentu sebagai musuh' },
              { label: 'Dampak', value: 'Masyarakat terbelah, minoritas menjadi korban' },
              { label: 'Solusi', value: 'Bernalar kritis, tidak mudah terprovokasi, dan menghargai perbedaan' },
            ] },
            { icon: '🚫', title: 'Diskriminasi Minoritas', color: 'o', details: [
              { label: 'Definisi', value: 'Perlakuan tidak adil terhadap kelompok minoritas dalam proses politik' },
              { label: 'Dampak', value: 'Hak kelompok minoritas tidak terwakili dalam demokrasi' },
              { label: 'Solusi', value: 'Memastikan kesetaraan akses dan partisipasi semua kelompok' },
            ] },
          ],
        },
        {
          type: 'nc-grid',
          cards: [
            { icon: '🗣️', title: 'Berani Bicara', body: 'Sampaikan pendapatmu dengan santun — demokrasi butuh suara yang berani, bukan diam', color: 'g' },
            { icon: '🔍', title: 'Cek Fakta', body: 'Selalu verifikasi informasi sebelum membagikan — jangan jadi penyebar hoaks!', color: 'c' },
            { icon: '🛡️', title: 'Tolak Politik Uang', body: 'Jangan jual suaramu — hak memilihmu terlalu berharga untuk dibeli', color: 'y' },
            { icon: '🤝', title: 'Hormati Perbedaan', body: 'Demokrasi bukan tentang menang-kalah, tapi tentang bermusyawarah dan mencari mufakat', color: 'p' },
          ],
        },
        {
          type: 'diskusi',
          title: '✍️ Latihan Mandiri',
          questions: [
            { label: 'Latihan Mandiri', icon: '✍️', teks: 'Sebagai siswa, apa satu tindakan nyata yang bisa kamu lakukan untuk memperkuat demokrasi di lingkunganmu?', petunjuk: 'Tuliskan di sini… (jawabanmu akan tampil lagi di Refleksi)', color: 'g' },
          ],
        },
      ],
      nav: { prev: 's-materi2', next: 's-game1', nextLabel: 'Lanjut ke Game 🎮' },
    },

    // ──────────────────────── GAME 1: Sortir ────────────────────────
    {
      id: 's-game1',
      templateType: 'game',
      sectionLabel: '🎮 Game 1 · ±7 Menit',
      sectionColor: 'o',
      blocks: [
        {
          type: 'sortir-game',
          title: 'Demokrasi Sehat vs Tidak Sehat!',
          pool: [
            { id: 'd1', text: 'Musyawarah untuk mencapai mufakat', category: 'sehat' },
            { id: 'd2', text: 'Membeli suara dengan uang', category: 'tidak' },
            { id: 'd3', text: 'Pemilu yang jujur dan transparan', category: 'sehat' },
            { id: 'd4', text: 'Menyebar hoaks tentang calon', category: 'tidak' },
            { id: 'd5', text: 'Menghargai pendapat berbeda', category: 'sehat' },
            { id: 'd6', text: 'Memaksakan kehendak pada minoritas', category: 'tidak' },
            { id: 'd7', text: 'Kebebasan berkumpul dan berserikat', category: 'sehat' },
            { id: 'd8', text: 'Mengintimidasi pemilih', category: 'tidak' },
            { id: 'd9', text: 'Gotong royong lintas kelompok', category: 'sehat' },
            { id: 'd10', text: 'Membatasi kebebasan pers', category: 'tidak' },
          ],
          kolom: [
            { id: 'sehat', label: '✅ Demokrasi Sehat', color: 'g' },
            { id: 'tidak', label: '❌ Tidak Sehat', color: 'r' },
          ],
        },
        {
          type: 'diskusi',
          title: '💬 Refleksi Game',
          questions: [
            { label: 'Refleksi', icon: '💭', teks: 'Dari game tadi, praktik mana yang paling sering kamu lihat? Apa yang bisa kamu lakukan?', petunjuk: 'Tuliskan pendapatmu…', color: 'o' },
          ],
        },
      ],
      nav: { prev: 's-materi3', next: 's-game2', nextLabel: 'Lanjut: Roda Game 🎡' },
    },

    // ──────────────────────── GAME 2: Roda ────────────────────────
    {
      id: 's-game2',
      templateType: 'game',
      sectionLabel: '🎮 Game 2 · ±8 Menit',
      sectionColor: 'g',
      blocks: [
        {
          type: 'roda-game',
          title: 'Roda Demokrasi Pancasila!',
          questions: [
            {
              q: 'Apa arti kata "demos" dalam istilah demokrasi?',
              diskusiHint: 'Dari bahasa Yunani, berhubungan dengan rakyat',
              opts: [
                { text: 'Pemerintahan', correct: false },
                { text: 'Rakyat', correct: true },
                { text: 'Kebebasan', correct: false },
                { text: 'Kekuasaan', correct: false },
              ],
              feedbackCorrect: 'Benar! Demos berarti rakyat — demokrasi = pemerintahan oleh rakyat.',
              feedbackWrong: 'Demos berarti rakyat dalam bahasa Yunani, sehingga demokrasi = pemerintahan oleh rakyat.',
            },
            {
              q: 'Masa demokrasi apa yang berlangsung dari 1959–1966?',
              diskusiHint: 'Presiden Soekarno memiliki kekuasaan sangat besar',
              opts: [
                { text: 'Demokrasi Liberal', correct: false },
                { text: 'Demokrasi Terpimpin', correct: true },
                { text: 'Demokrasi Pancasila Orba', correct: false },
                { text: 'Demokrasi Reformasi', correct: false },
              ],
              feedbackCorrect: 'Benar! Demokrasi Terpimpin (1959-1966) ditandai kekuasaan presiden yang sangat besar.',
              feedbackWrong: 'Periode 1959-1966 adalah Demokrasi Terpimpin di bawah Presiden Soekarno.',
            },
            {
              q: 'Apa perbedaan utama Demokrasi Pancasila dengan Demokrasi Liberal?',
              diskusiHint: 'Berhubungan dengan cara mengambil keputusan',
              opts: [
                { text: 'Pancasila tidak mengadakan pemilu', correct: false },
                { text: 'Pancasila mengutamakan musyawarah mufakat', correct: true },
                { text: 'Pancasila tidak mengenal kebebasan', correct: false },
                { text: 'Pancasila hanya untuk Indonesia', correct: false },
              ],
              feedbackCorrect: 'Benar! Demokrasi Pancasila mengutamakan musyawarah untuk mufakat, bukan voting semata.',
              feedbackWrong: 'Perbedaan utamanya: Demokrasi Pancasila mengutamakan musyawarah mufakat, sedangkan Liberal mengutamakan voting.',
            },
            {
              q: 'Apa yang dimaksud politik uang?',
              diskusiHint: 'Praktik yang merusak kejujuran pemilu',
              opts: [
                { text: 'Menggunakan uang negara untuk pembangunan', correct: false },
                { text: 'Membeli suara dengan uang atau barang untuk memenangkan pemilu', correct: true },
                { text: 'Membayar pajak untuk pembiayaan pemilu', correct: false },
                { text: 'Menggalang donasi untuk kampanye', correct: false },
              ],
              feedbackCorrect: 'Benar! Politik uang adalah membeli suara dengan uang atau barang — merusak demokrasi.',
              feedbackWrong: 'Politik uang adalah praktik membeli suara dengan uang, barang, atau jasa untuk memenangkan pemilu.',
            },
            {
              q: 'UUD 1945 Pasal 1 Ayat 2 berisi tentang...',
              diskusiHint: 'Siapa yang memegang kedaulatan?',
              opts: [
                { text: 'Bentuk negara kesatuan', correct: false },
                { text: 'Kedaulatan di tangan rakyat', correct: true },
                { text: 'Presiden sebagai kepala negara', correct: false },
                { text: 'Sistem pemerintahan', correct: false },
              ],
              feedbackCorrect: 'Benar! Pasal 1 Ayat 2: Kedaulatan adalah di tangan rakyat dan dilakukan menurut UUD.',
              feedbackWrong: 'UUD 1945 Pasal 1 Ayat 2: "Kedaulatan adalah di tangan rakyat dan dilakukan menurut Undang-Undang Dasar."',
            },
            {
              q: 'Apa arti "Hikmat Kebijaksanaan" dalam Sila ke-4?',
              diskusiHint: 'Cara mengambil keputusan yang tepat',
              opts: [
                { text: 'Keputusan cepat dan tegas', correct: false },
                { text: 'Mengambil keputusan dengan pertimbangan matang dan bijak', correct: true },
                { text: 'Mengikuti kehendak mayoritas', correct: false },
                { text: 'Menyerahkan keputusan pada pemimpin', correct: false },
              ],
              feedbackCorrect: 'Benar! Hikmat Kebijaksanaan berarti keputusan diambil dengan pertimbangan matang dan bijaksana.',
              feedbackWrong: 'Hikmat Kebijaksanaan berarti mengambil keputusan dengan pertimbangan matang, bijak, dan berlandaskan nilai.',
            },
            {
              q: 'Kapan Demokrasi Reformasi dimulai di Indonesia?',
              diskusiHint: 'Berhubungan dengan jatuhnya Orde Baru',
              opts: [
                { text: '1966', correct: false },
                { text: '1978', correct: false },
                { text: '1998', correct: true },
                { text: '2004', correct: false },
              ],
              feedbackCorrect: 'Benar! Demokrasi Reformasi dimulai 1998 setelah jatuhnya Orde Baru.',
              feedbackWrong: 'Demokrasi Reformasi dimulai tahun 1998, ditandai dengan jatuhnya pemerintahan Orde Baru.',
            },
            {
              q: 'Apa peran siswa dalam memperkuat demokrasi?',
              diskusiHint: 'Tindakan nyata yang bisa dilakukan sehari-hari',
              opts: [
                { text: 'Menunggu dewasa baru bisa berpartisipasi', correct: false },
                { text: 'Belajar demokrasi, cek fakta, dan menolak politik uang', correct: true },
                { text: 'Tidak perlu peduli karena masih sekolah', correct: false },
                { text: 'Mengikuti semua keputusan tanpa bertanya', correct: false },
              ],
              feedbackCorrect: 'Benar! Siswa bisa belajar demokrasi, cek fakta, dan menolak politik uang — bahkan sebelum bisa memilih!',
              feedbackWrong: 'Siswa bisa berperan dengan belajar demokrasi, mengecek fakta, dan menolak politik uang dalam lingkupnya.',
            },
          ],
        },
      ],
      nav: { prev: 's-game1', next: 's-hasil', nextLabel: 'Lihat Hasil 🏆' },
    },

    // ──────────────────────── HASIL ────────────────────────
    {
      id: 's-hasil',
      templateType: 'hasil',
      sectionLabel: '🏆 Hasil',
      sectionColor: 'g',
      background: { type: 'radial', color1: 'g', color2: 'bg' },
      blocks: [
        { type: 'hasil', title: 'Demokrasi Pancasila', subtitle: 'Pertemuan 1 Selesai! 🎉' },
      ],
      nav: { prev: 's-game2', next: 's-refleksi', nextLabel: 'Refleksi Diri 📝' },
    },

    // ──────────────────────── REFLEKSI ────────────────────────
    {
      id: 's-refleksi',
      templateType: 'refleksi',
      sectionLabel: '📝 Refleksi · ±10 Menit',
      sectionColor: 'p',
      blocks: [
        {
          type: 'refleksi',
          title: 'Refleksi Diri',
          intro: 'Jawaban jujurmu lebih berharga dari jawaban yang sempurna.',
          questions: [
            { teks: 'Hal baru apa yang kamu pelajari tentang Demokrasi Pancasila hari ini?', petunjuk: 'Tuliskan 1–2 hal yang benar-benar baru bagimu…', warna: 'y', icon: '🌟' },
            { teks: 'Ceritakan pengalaman musyawarah terbaik yang pernah kamu ikuti. Apa yang membuatnya berhasil?', petunjuk: 'Jelaskan dengan contoh konkret…', warna: 'c', icon: '🔍' },
            { teks: 'Satu komitmen nyata yang akan kamu lakukan untuk berlatih demokrasi Pancasila di lingkunganmu:', petunjuk: 'Contoh: Saya akan menghargai pendapat teman yang berbeda dan mencari jalan tengah', warna: 'g', icon: '🤝' },
          ],
          penugasan: {
            judul: '📌 Penugasan: Praktik Demokrasi',
            isi: 'Selama 1 minggu, praktikkan musyawarah dalam setiap keputusan kelompok (tugas kelompok, pilih tempat makan, dll). Catat hasilnya: apakah mufakat tercapai? Apa tantangannya?',
            contoh: 'Contoh: Senin — Kelompok tugas musyawarah pembagian tugas. Semua setuju tanpa voting. Hasilnya lebih merata karena semua diajak bicara.',
          },
        },
        {
          type: 'penutup',
          title: 'Sampai Jumpa!',
          subtitle: 'Pertemuan 2: Lembaga Demokrasi',
          preview: [
            { icon: '🏛️', judul: 'Lembaga Negara', isi: 'MPR, DPR, DPD, dan fungsinya', warna: 'g' },
            { icon: '🗳️', judul: 'Pemilu', isi: 'Proses dan prinsip pemilihan umum', warna: 'c' },
            { icon: '📋', judul: 'Partai Politik', isi: 'Fungsi dan perannya dalam demokrasi', warna: 'y' },
          ],
          nextPertemuan: {
            judul: 'Pertemuan 2: Lembaga-Lembaga Demokrasi',
            deskripsi: 'Mendalami lembaga-lembaga negara dalam sistem demokrasi Indonesia dan proses pemilu.',
            items: [
              { icon: '🏛️', judul: 'Lembaga Negara', isi: 'MPR, DPR, DPD, Presiden, MA', warna: 'g' },
              { icon: '🗳️', judul: 'Pemilu', isi: 'Prinsip dan proses pemilihan umum', warna: 'c' },
              { icon: '📋', judul: 'Partai Politik', isi: 'Fungsi dan peran dalam demokrasi', warna: 'y' },
            ],
          },
        },
      ],
      nav: { prev: 's-hasil' },
    },
  ],
};
