import type { LessonSchema } from '@/core/schema/types';

export const BHINNEKA_TUNGAL_IKA_LESSON: LessonSchema = {
  id: 'bhinneka-tunggal-ika',
  version: 1,
  title: 'Bhinneka Tunggal Ika',
  mapel: 'PPKn',
  kelas: 'VIII',
  themeId: 'bhinneka-tunggal-ika',
  navbar: {
    logoText: '🌈 Bhinneka Tunggal Ika',
    logoColor: 'c',
    progressGradient: ['c', 'g'],
  },
  screens: [
    // ──────────────────────── COVER ────────────────────────
    {
      id: 's-cover',
      templateType: 'cover',
      background: {
        type: 'radial',
        color1: 'c',
        color2: 'bg',
      },
      blocks: [
        {
          type: 'cover',
          icon: '🌈',
          title: 'Bhinneka Tunggal Ika',
          subtitle: 'Bab 5 — Pertemuan 1',
          badges: [
            { icon: '📋', text: 'TP 3', color: 'y' },
            { icon: '🎭', text: '3 Skenario', color: 'c' },
            { icon: '🎮', text: 'Sortir + Roda', color: 'g' },
            { icon: '📝', text: 'Refleksi', color: 'p' },
          ],
          meta: {
            durasi: '80 Menit',
            fase: 'Fase D',
            elemen: 'Bhinneka Tunggal Ika',
          },
          cta: {
            label: '▶ Mulai Pembelajaran',
            action: 's-petunjuk',
          },
          background: {
            type: 'gradient',
            color1: 'c',
            color2: 'bg',
          },
        } as any,
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
            {
              icon: '🎭',
              title: 'Skenario Interaktif',
              body: 'Hadapi 3 situasi nyata tentang keberagaman. Pilih tindakanmu dan temukan nilai kebersamaan!',
            },
            {
              icon: '📖',
              title: 'Baca & Eksplorasi',
              body: 'Pelajari asal-usul semboyan Bhinneka Tunggal Ika, arti setiap bait, dan maknanya bagi bangsa Indonesia.',
            },
            {
              icon: '💬',
              title: 'Diskusi & Tulis',
              body: 'Jawab pertanyaan diskusi — jawabanmu tersimpan dan tampil lagi di Refleksi sebagai portofoliomu.',
            },
            {
              icon: '🎮',
              title: 'Game Interaktif',
              body: 'Sortir contoh keberagaman dan mainkan Roda Game 8 soal untuk uji pemahamanmu!',
            },
          ],
          tips: '💡 Ikuti alur dari awal sampai akhir. Jawaban diskusimu akan muncul di Refleksi sebagai portofolio belajarmu!',
          tipsColor: 'c',
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
            {
              num: 1,
              verb: 'Menjelaskan',
              desc: 'asal-usul dan makna semboyan Bhinneka Tunggal Ika sebagai modal sosial bangsa Indonesia',
              color: 'y',
            },
            {
              num: 2,
              verb: 'Menganalisis',
              desc: 'bentuk-bentuk keberagaman di Indonesia (suku, agama, ras, budaya) dan tantangan menjaga harmoni',
              color: 'c',
            },
            {
              num: 3,
              verb: 'Merumuskan',
              desc: 'cara membangun harmoni dan gotong royong di tengah keberagaman dalam kehidupan sehari-hari',
              color: 'g',
            },
          ],
          profil: '🔗 Profil Pelajar Pancasila: Berkebinekaan Global · Bergotong Royong · Bernalar Kritis',
          profilColor: 'g',
        },
        {
          type: 'alur',
          title: '⏱️ Alur Kegiatan 80 Menit',
          totalDurasi: '80',
          steps: [
            { dot: 'p', durasi: '±10\'', judul: 'Apersepsi', deskripsi: '3 Skenario tentang keberagaman & harmoni' },
            { dot: 'y', durasi: '±15\'', judul: 'Materi 1', deskripsi: 'Asal-usul & makna Bhinneka Tunggal Ika' },
            { dot: 'c', durasi: '±15\'', judul: 'Materi 2', deskripsi: 'Bentuk keberagaman Indonesia & tantangannya' },
            { dot: 'g', durasi: '±15\'', judul: 'Materi 3', deskripsi: 'Membangun harmoni & gotong royong' },
            { dot: 'o', durasi: '±15\'', judul: 'Game', deskripsi: 'Sortir Game + Roda Game' },
            { dot: 'r', durasi: '±10\'', judul: 'Refleksi & Penutup', deskripsi: 'Portofolio diskusi + komitmen harmoni' },
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
          title: 'Berbeda tapi Bersatu!',
          chapters: [
            // ── Chapter 1: Teman Baru dari Daerah Lain ──
            {
              id: 'ch1',
              charEmoji: '🎒',
              title: '🌏 Teman Baru dari Papua',
              setup: [
                { speaker: 'NARRATOR', text: 'Seorang siswa baru dari Papua pindah ke sekolahmu di Jawa. Ia berpenampilan berbeda dan logat bicaranya khas.' },
                { speaker: 'TEMAN 😏', text: '"Lihat deh anak baru itu, pakaiannya aneh dan bicaranya nggak jelas. Awas aja kalau dia gangsing kelompok kita."' },
                { speaker: 'NARRATOR', text: 'Siswa baru itu terlihat kesepian di pojok kelas. Ia belum punya teman.' },
              ],
              choicePrompt: 'Apa yang kamu lakukan?',
              choices: [
                {
                  icon: '🤝',
                  label: 'Ajak ngobrol dan perkenalkan',
                  detail: 'Menghampiri siswa baru, memperkenalkan diri, dan mengajaknya bergabung dengan kelompokmu',
                  good: true,
                  pts: 20,
                  level: 'good',
                  resultTitle: 'Pilihan Terbaik! 🌟',
                  resultBody: 'Menyambut perbedaan adalah wujud nyata Bhinneka Tunggal Ika — berbeda tapi tetap satu!',
                  norma: 'Bhinneka Tunggal Ika: Menerima Keberagaman',
                  consequences: [
                    { icon: '✅', text: 'Siswa baru merasa diterima dan nyaman di lingkungan baru' },
                    { icon: '✅', text: 'Kamu membuktikan bahwa perbedaan bukan penghalang persahabatan' },
                    { icon: '✅', text: 'Kelas jadi lebih beragam dan kaya perspektif' },
                  ],
                  nextChapter: 1,
                },
                {
                  icon: '🙅',
                  label: 'Ikut menjauhi',
                  detail: 'Mengikuti teman-teman yang mengabaikan siswa baru itu',
                  good: false,
                  pts: 0,
                  level: 'bad',
                  resultTitle: 'Kurang Tepat ⚠️',
                  resultBody: 'Mengabaikan orang karena perbedaan melanggar semangat Bhinneka Tunggal Ika.',
                  norma: 'Melanggar Bhinneka Tunggal Ika: Diskriminasi',
                  consequences: [
                    { icon: '❌', text: 'Siswa baru merasa terisolasi dan tidak diterima' },
                    { icon: '❌', text: 'Perbedaan dijadikan alasan untuk menjauhi, bukan untuk saling mengenal' },
                    { icon: '⚠️', text: 'Diskriminasi kecil bisa tumbuh menjadi intoleransi yang lebih besar' },
                  ],
                  nextChapter: 1,
                },
                {
                  icon: '👀',
                  label: 'Diam saja, nanti sendiri datang',
                  detail: 'Tidak berbuat apa-apa, menunggu siswa baru yang mendekati',
                  good: false,
                  pts: 7,
                  level: 'mid',
                  resultTitle: 'Bisa Lebih Baik 🤔',
                  resultBody: 'Pasif tidak salah, tapi mengambil inisiatif menyambut perbedaan jauh lebih bermakna.',
                  norma: 'Bhinneka Tunggal Ika: Perlu Inisiatif',
                  consequences: [
                    { icon: '🟡', text: 'Siswa baru mungkin terlalu malu untuk mendekati duluan' },
                    { icon: '⚠️', text: 'Bhinneka Tunggal Ika butuh tindakan aktif, bukan sekadar toleransi pasif' },
                    { icon: '💡', text: 'Satu langkah kecil menyambut bisa mengubah seluruh pengalaman seseorang' },
                  ],
                  nextChapter: 1,
                },
              ],
            },
            // ── Chapter 2: Perayaan Budaya ──
            {
              id: 'ch2',
              charEmoji: '🎉',
              title: '🎭 Festival Budaya Kelas',
              setup: [
                { speaker: 'NARRATOR', text: 'Sekolah mengadakan festival budaya. Kelasmu harus mewakili satu budaya daerah. Mayoritas temanmu ingin menampilkan budaya Jawa karena paling mudah.' },
                { speaker: 'ANDI 🗣️', text: '"Kenapa nggak tampilkan budaya dari daerah lain? Kan di kelas kita ada yang dari Minang, Batak, dan Bali."' },
                { speaker: 'TEMAN 😕', text: '"Ribet ah, yang Jawa saja. Lagian penonton juga nggak ngerti budaya lain."' },
              ],
              choicePrompt: 'Apa saranmu?',
              choices: [
                {
                  icon: '🌈',
                  label: 'Tampilkan campuran budaya',
                  detail: 'Mengusulkan kolaborasi: setiap siswa menampilkan unsur budaya daerahnya masing-masing',
                  good: true,
                  pts: 20,
                  level: 'good',
                  resultTitle: 'Pilihan Terbaik! 🌟',
                  resultBody: 'Kolaborasi budaya adalah wujud nyata Bhinneka Tunggal Ika — berbeda tapi menyatu dalam satu pentas!',
                  norma: 'Bhinneka Tunggal Ika: Kolaborasi Budaya',
                  consequences: [
                    { icon: '✅', text: 'Setiap siswa merasa diwakili dan bangga dengan budayanya' },
                    { icon: '✅', text: 'Penonton belajar kekayaan budaya Indonesia yang beragam' },
                    { icon: '✅', text: 'Ini Bhinneka Tunggal Ika dalam aksi: berbeda-beda tapi tetap satu!' },
                  ],
                  nextChapter: 2,
                },
                {
                  icon: '☕',
                  label: 'Ikut yang Jawa saja',
                  detail: 'Menyetujui tampilan budaya Jawa karena paling mudah dan familiar',
                  good: false,
                  pts: 5,
                  level: 'mid',
                  resultTitle: 'Kurang Berani 🤔',
                  resultBody: 'Memilih yang mudah bukan salah, tapi melewatkan kesempatan menunjukkan keberagaman.',
                  norma: 'Bhinneka Tunggal Ika: Belum Terefleksi',
                  consequences: [
                    { icon: '🟡', text: 'Tampilan aman, tapi tidak merepresentasikan keberagaman kelas' },
                    { icon: '⚠️', text: 'Siswa dari daerah lain merasa budayanya tidak penting' },
                    { icon: '💡', text: 'Bhinneka Tunggal Ika bukan sekadar slogan — harus dihidupi!' },
                  ],
                  nextChapter: 2,
                },
                {
                  icon: '😤',
                  label: 'Protes, minta budaya daerahmu saja',
                  detail: 'Menuntut agar hanya budaya daerahmu yang ditampilkan karena paling menarik',
                  good: false,
                  pts: 2,
                  level: 'bad',
                  resultTitle: 'Tidak Tepat ⚠️',
                  resultBody: 'Memaksakan satu budaya bertentangan dengan semangat Bhinneka Tunggal Ika.',
                  norma: 'Melanggar Bhinneka Tunggal Ika: Egosentrisme Budaya',
                  consequences: [
                    { icon: '❌', text: 'Memaksakan satu budaya menyingkirkan budaya lain' },
                    { icon: '❌', text: 'Bhinneka Tunggal Ika mengajarkan saling menghargai, bukan saling menyingkirkan' },
                    { icon: '💡', text: 'Cantiknya Indonesia justru ada di keberagamannya, bukan keseragamannya' },
                  ],
                  nextChapter: 2,
                },
              ],
            },
            // ── Chapter 3: Stereotip ──
            {
              id: 'ch3',
              charEmoji: '💬',
              title: '📱 Stereotip di Media Sosial',
              setup: [
                { speaker: 'NARRATOR', text: 'Di grup WhatsApp kelas, seseorang membagikan meme yang melecehkan suku tertentu. Beberapa teman tertawa, tapi ada juga yang tidak nyaman.' },
                { speaker: 'TEMAN 😂', text: '"Hahaha bener banget, orang suku itu memang gitu kan!"' },
                { speaker: 'NARRATOR', text: 'Kamu tahu bahwa meme itu mengandung stereotip negatif. Temanmu dari suku yang diejek terdiam.' },
              ],
              choicePrompt: 'Apa yang kamu lakukan?',
              choices: [
                {
                  icon: '🛑',
                  label: 'Tegur dan hapus meme itu',
                  detail: 'Menegur teman yang membagikan, minta hapus, dan jelaskan bahwa itu stereotip berbahaya',
                  good: true,
                  pts: 20,
                  level: 'good',
                  resultTitle: 'Pilihan Terbaik! 🌟',
                  resultBody: 'Melawan stereotip adalah bentuk menjaga harmoni keberagaman — Bhinneka Tunggal Ika butuh pembela!',
                  norma: 'Bhinneka Tunggal Ika: Menentang Stereotip',
                  consequences: [
                    { icon: '✅', text: 'Temanmu dari suku yang diejek merasa dibela dan dihargai' },
                    { icon: '✅', text: 'Stereotip dihentikan sebelum merusak hubungan antarwarga' },
                    { icon: '✅', text: 'Kelas belajar bahwa lelucon atas dasar stereotip bukan lucu, tapi merendahkan' },
                  ],
                  nextChapter: 3,
                },
                {
                  icon: '😂',
                  label: 'Ikut tertawa, cuma bercanda',
                  detail: 'Menganggapnya hanya bercanda dan tidak perlu diperhatikan serius',
                  good: false,
                  pts: 3,
                  level: 'bad',
                  resultTitle: 'Bahaya! ⚠️',
                  resultBody: 'Stereotip yang dibiarkan akan tumbuh menjadi diskriminasi. Lelucon yang merendahkan suku bukan bercanda.',
                  norma: 'Melanggar Bhinneka Tunggal Ika: Membiarkan Diskriminasi',
                  consequences: [
                    { icon: '❌', text: 'Temanmu yang terdiskriminasi merasa tidak aman di lingkungannya sendiri' },
                    { icon: '❌', text: 'Stereotip yang dibiarkan menjadi normal — ini awal intoleransi' },
                    { icon: '⚠️', text: 'Yang bagi kamu "candaan" bisa menjadi luka bagi yang menjadi sasaran' },
                  ],
                  nextChapter: 3,
                },
                {
                  icon: '📧',
                  label: 'Chat pribadi teman yang diejek',
                  detail: 'Tidak tegur di grup, tapi menghubungi teman yang terdiskriminasi secara pribadi untuk memberi dukungan',
                  good: true,
                  pts: 12,
                  level: 'good',
                  resultTitle: 'Peduli, tapi... 🤔',
                  resultBody: 'Dukungan pribadi itu baik, tapi stereotip perlu ditegur secara terbuka agar semua belajar.',
                  norma: 'Bhinneka Tunggal Ika: Perlu Keberanian',
                  consequences: [
                    { icon: '✅', text: 'Teman yang diejek merasa didukung secara emosional' },
                    { icon: '🟡', text: 'Tapi stereotip tetap beredar di grup — tidak ada yang menghentikan' },
                    { icon: '💡', text: 'Idealnya: dukung teman sekaligus tegur pelaku di grup agar semua belajar' },
                  ],
                  nextChapter: 3,
                },
              ],
            },
          ],
        },
      ],
      nav: { prev: 's-tp', next: 's-materi1', nextLabel: 'Lanjut: Asal-Usul Semboyan' },
    },

    // ──────────────────────── MATERI 1: Asal-Usul ────────────────────────
    {
      id: 's-materi1',
      templateType: 'materi',
      sectionLabel: '📖 Materi 1 · ±15 Menit',
      sectionColor: 'y',
      blocks: [
        {
          type: 'def-box',
          borderColor: 'y',
          content: '<strong>Bhinneka Tunggal Ika</strong> berasal dari bahasa Sanskerta yang berarti "Berbeda-beda tetapi satu". Semboyan ini diambil dari kitab <strong>Sutasoma</strong> karya Mpu Tantular pada masa Kerajaan Majapahit (abad ke-14). Semboyan ini tertuang dalam <strong>Pasal 36A UUD NRI 1945</strong> dan tertulis di bawah Lambang Negara Garuda Pancasila.',
        },
        {
          type: 'nc-grid',
          cards: [
            {
              icon: '📜',
              title: 'Kitab Sutasoma',
              body: 'Karya Mpu Tantular (abad ke-14) dari Kerajaan Majapahit. Berisi ajaran toleransi antaragama dan persatuan di tengah keberagaman.',
              color: 'y',
            },
            {
              icon: '🗣️',
              title: 'Bhinneka',
              body: 'Dari kata "bhinna" yang berarti berbeda, rupa-rupa, aneka ragam. Merujuk pada keberagaman suku, agama, ras, budaya.',
              color: 'c',
            },
            {
              icon: '🔗',
              title: 'Tunggal Ika',
              body: '"Tunggal" berarti satu, "Ika" berarti itu. Jadi "Tunggal Ika" berarti "itu satu" — meski berbeda, tetap satu kesatuan.',
              color: 'g',
            },
            {
              icon: '🦅',
              title: 'Lambang Negara',
              body: 'Bhinneka Tunggal Ika tertulis di pita yang dicengkeram Garuda Pancasila, menandakan semboyan ini dijunjung tinggi bangsa Indonesia.',
              color: 'p',
            },
          ],
        },
        {
          type: 'flashcard-set',
          cards: [
            {
              q: 'Dari kitab manakah semboyan Bhinneka Tunggal Ika berasal?',
              a: 'Kitab Sutasoma karya Mpu Tantular dari Kerajaan Majapahit (abad ke-14).',
            },
            {
              q: 'Apa arti harfiah Bhinneka Tunggal Ika?',
              a: '"Berbeda-beda tetapi satu" — bhinneka = beraneka ragam, tunggal = satu, ika = itu.',
            },
            {
              q: 'Di manakah semboyan Bhinneka Tunggal Ika tertuang dalam konstitusi?',
              a: 'Pasal 36A UUD NRI 1945, tertulis di pita yang dicengkeram Garuda Pancasila.',
            },
            {
              q: 'Siapa Mpu Tantular dan apa perannya?',
              a: 'Mpu Tantular adalah pujangga Kerajaan Majapahit yang menulis Kitab Sutasoma, yang mengajarkan toleransi antaragama dan persatuan.',
            },
          ],
        },
        {
          type: 'diskusi',
          title: '✍️ Latihan Mandiri',
          questions: [
            {
              label: 'Latihan Mandiri',
              icon: '✍️',
              teks: 'Menurutmu, mengapa para pendiri bangsa memilih semboyan dari Kitab Sutasoma sebagai semboyan negara? Hubungkan dengan kondisi Indonesia yang beragam!',
              petunjuk: 'Tuliskan pendapatmu di sini… (jawabanmu akan tampil lagi di Refleksi)',
              color: 'y',
            },
          ],
        },
      ],
      nav: { prev: 's-apersepsi', next: 's-materi2', nextLabel: 'Lanjut: Keberagaman Indonesia' },
    },

    // ──────────────────────── MATERI 2: Keberagaman ────────────────────────
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
              icon: '🏘️',
              label: 'Suku Bangsa',
              content: [
                {
                  type: 'def-box',
                  borderColor: 'y',
                  content: 'Indonesia memiliki <strong>lebih dari 1.300 suku bangsa</strong> yang tersebar dari Sabang sampai Merauke. Setiap suku memiliki bahasa, adat istiadat, dan tradisi yang unik.',
                },
                {
                  type: 'nc-grid',
                  cards: [
                    { icon: '🏝️', title: 'Jawa', body: 'Suku terbesar di Indonesia, tersebar di Jawa Tengah, Jawa Timur, dan Yogyakarta', color: 'y' },
                    { icon: '🏔️', title: 'Sunda', body: 'Suku terbesar kedua, mendiami wilayah Jawa Barat dengan tradisi dan bahasa Sunda', color: 'y' },
                    { icon: '🌴', title: 'Dayak', body: 'Suku asli Kalimantan dengan kearifan lokal menjaga hutan dan sungai', color: 'y' },
                  ],
                },
              ],
            },
            {
              icon: '🕌',
              label: 'Agama',
              content: [
                {
                  type: 'def-box',
                  borderColor: 'c',
                  content: 'Indonesia mengakui <strong>6 agama resmi</strong>: Islam, Kristen Protestan, Katolik, Hindu, Buddha, dan Konghucu. Kerukunan antaragama adalah pilar utama persatuan bangsa.',
                },
                {
                  type: 'nc-grid',
                  cards: [
                    { icon: '🕌', title: 'Islam', body: 'Agama mayoritas di Indonesia, dianut sekitar 87% penduduk', color: 'c' },
                    { icon: '⛪', title: 'Kristen', body: 'Protestan dan Katolik tersebar terutama di Sulawesi, NTT, dan Papua', color: 'c' },
                    { icon: '🛕', title: 'Hindu & Buddha', body: 'Hindu dominan di Bali, Buddha terutama di komunitas Tionghoa', color: 'c' },
                  ],
                },
              ],
            },
            {
              icon: '🎭',
              label: 'Budaya',
              content: [
                {
                  type: 'def-box',
                  borderColor: 'g',
                  content: 'Indonesia memiliki <strong>lebih dari 3.000 tarian tradisional</strong>, ratusan jenis batik, dan beragam seni musik. Kekayaan budaya ini menjadi identitas dan kebanggaan bangsa.',
                },
                {
                  type: 'nc-grid',
                  cards: [
                    { icon: '👗', title: 'Batik', body: 'Diakui UNESCO sebagai Warisan Kemanusiaan untuk Budaya Lisan dan Nonbendawi', color: 'g' },
                    { icon: '💃', title: 'Tarian', body: 'Dari Saman (Aceh) hingga Caci (Flores) — setiap daerah punya tarian khas', color: 'g' },
                    { icon: '🎵', title: 'Musik', body: 'Gamelan, angklung, sasando, kolintang — alat musik tradisional yang mendunia', color: 'g' },
                  ],
                },
              ],
            },
            {
              icon: '⚠️',
              label: 'Tantangan',
              content: [
                {
                  type: 'def-box',
                  borderColor: 'r',
                  content: 'Keberagaman juga membawa tantangan: <strong>stereotip, diskriminasi, intoleransi, dan konflik</strong> antarkelompok masih terjadi. Membangun harmoni butuh kesadaran dan tindakan nyata.',
                },
                {
                  type: 'nc-grid',
                  cards: [
                    { icon: '💬', title: 'Stereotip', body: 'Anggapan negatif terhadap suku/agama/ras tertentu tanpa dasar yang benar', color: 'r' },
                    { icon: '🚫', title: 'Diskriminasi', body: 'Perlakuan berbeda terhadap seseorang karena suku, agama, atau rasnya', color: 'r' },
                    { icon: '😡', title: 'Intoleransi', body: 'Ketidakmauan menerima perbedaan keyakinan atau pandangan orang lain', color: 'r' },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'def-box',
          borderColor: 'c',
          content: '<strong>💡 Ingat:</strong> Keberagaman adalah kekayaan, bukan ancaman. Yang menjadi masalah bukan perbedaannya, tapi sikap kita terhadap perbedaan itu. Bhinneka Tunggal Ika mengajarkan: kaya karena berbeda, kuat karena bersatu!',
        },
        {
          type: 'flashcard-set',
          cards: [
            {
              q: 'Berapa jumlah suku bangsa di Indonesia?',
              a: 'Lebih dari 1.300 suku bangsa yang tersebar dari Sabang sampai Merauke.',
            },
            {
              q: 'Sebutkan 6 agama yang diakui di Indonesia!',
              a: 'Islam, Kristen Protestan, Katolik, Hindu, Buddha, dan Konghucu.',
            },
            {
              q: 'Apa perbedaan stereotip dan diskriminasi?',
              a: 'Stereotip adalah anggapan negatif tanpa dasar terhadap kelompok tertentu. Diskriminasi adalah tindakan memperlakukan orang berbeda karena kelompoknya.',
            },
            {
              q: 'Mengapa keberagaman bisa menjadi tantangan?',
              a: 'Karena tanpa sikap toleransi dan saling menghargai, perbedaan bisa memicu konflik, stereotip, diskriminasi, dan intoleransi.',
            },
          ],
        },
        {
          type: 'diskusi',
          title: '💬 Diskusi Kelas (±5 menit)',
          questions: [
            {
              label: 'Diskusi Kelas',
              icon: '💬',
              teks: 'Sebutkan satu contoh keberagaman di kelasmu dan jelaskan bagaimana kalian menjaga harmoni di tengah perbedaan itu!',
              petunjuk: 'Tuliskan pendapatmu di sini… (akan tampil di Refleksi)',
              color: 'c',
            },
          ],
        },
      ],
      nav: { prev: 's-materi1', next: 's-materi3', nextLabel: 'Lanjut: Membangun Harmoni' },
    },

    // ──────────────────────── MATERI 3: Membangun Harmoni ────────────────────────
    {
      id: 's-materi3',
      templateType: 'materi',
      sectionLabel: '📖 Materi 3 · ±15 Menit',
      sectionColor: 'g',
      blocks: [
        {
          type: 'def-box',
          borderColor: 'g',
          content: '<strong>Gotong royong</strong> adalah kunci membangun harmoni di tengah keberagaman. Gotong royong bukan sekadar kerja bakti — tapi sikap saling menghargai, bekerja sama, dan menyelesaikan masalah bersama tanpa membeda-bedakan suku, agama, atau ras.',
        },
        {
          type: 'tabel-accord',
          rows: [
            {
              icon: '🤝',
              title: 'Toleransi',
              color: 'y',
              details: [
                { label: 'Arti', value: 'Menghargai perbedaan dan tidak memaksakan kehendak pada orang lain' },
                { label: 'Contoh', value: 'Menghormati teman yang berbeda agama saat beribadah' },
                { label: 'Manfaat', value: 'Menciptakan lingkungan yang aman dan nyaman bagi semua' },
              ],
            },
            {
              icon: '💬',
              title: 'Musyawarah',
              color: 'c',
              details: [
                { label: 'Arti', value: 'Membicarakan masalah bersama untuk mencapai kesepakatan' },
                { label: 'Contoh', value: 'Kelas berdiskusi menentukan aturan bersama yang mengakomodasi semua' },
                { label: 'Manfaat', value: 'Keputusan diterima semua karena melibatkan semua pihak' },
              ],
            },
            {
              icon: '💪',
              title: 'Gotong Royong',
              color: 'g',
              details: [
                { label: 'Arti', value: 'Bekerja sama tanpa pamrih untuk kepentingan bersama' },
                { label: 'Contoh', value: 'Kerja bakti membersihkan lingkungan, Siskamling, dan arisan warga' },
                { label: 'Manfaat', value: 'Permasalahan besar teratasi karena dikerjakan bersama' },
              ],
            },
            {
              icon: '🎓',
              title: 'Pendidikan Keberagaman',
              color: 'p',
              details: [
                { label: 'Arti', value: 'Belajar memahami dan menghargai keberagaman sejak dini' },
                { label: 'Contoh', value: 'Mengikuti festival budaya, belajar bahasa daerah, studi lintas agama' },
                { label: 'Manfaat', value: 'Generasi muda tumbuh dengan sikap toleran dan terbuka' },
              ],
            },
            {
              icon: '⚖️',
              title: 'Keadilan Sosial',
              color: 'r',
              details: [
                { label: 'Arti', value: 'Memastikan setiap kelompok mendapat hak yang setara' },
                { label: 'Contoh', value: 'Akses pendidikan dan kesehatan yang sama untuk semua daerah' },
                { label: 'Manfaat', value: 'Tidak ada kelompok yang merasa terpinggirkan' },
              ],
            },
          ],
        },
        {
          type: 'nc-grid',
          cards: [
            {
              icon: '🌍',
              title: 'Ekonomi Pancasila',
              body: 'Sistem ekonomi yang berpadu dengan nilai gotong royong — koperasi, UMKM, dan ekonomi kerakyatan sebagai pilar utama.',
              color: 'g',
            },
            {
              icon: '🏘️',
              title: 'Modal Sosial',
              body: 'Kepercayaan, jaringan, dan norma bersama yang memudahkan kerjasama antarwarga yang berbeda latar belakang.',
              color: 'c',
            },
            {
              icon: '📚',
              title: 'Kearifan Lokal',
              body: 'Nilai-nilai luhur dari setiap daerah yang mengajarkan hidup harmonis: mapalus, subak, dan lain-lain.',
              color: 'y',
            },
            {
              icon: '🛡️',
              title: 'Hukum & Aturan',
              body: 'UU No. 40/2008 tentang Penghapusan Diskriminasi Ras dan Etnis melindungi hak semua warga.',
              color: 'p',
            },
          ],
        },
        {
          type: 'diskusi',
          title: '✍️ Latihan Mandiri',
          questions: [
            {
              label: 'Latihan Mandiri',
              icon: '✍️',
              teks: 'Tuliskan satu contoh gotong royong di lingkunganmu yang melibatkan orang-orang dari latar belakang berbeda. Apa yang bisa kamu pelajari dari contoh itu?',
              petunjuk: 'Tuliskan di sini… (jawabanmu akan tampil lagi di Refleksi)',
              color: 'g',
            },
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
          title: 'Pisahkan: Bentuk Keberagaman vs Tantangan!',
          pool: [
            { id: 's1', text: '1.300+ suku bangsa di Indonesia', category: 'keberagaman' },
            { id: 's2', text: 'Anggapan negatif terhadap suku tertentu', category: 'tantangan' },
            { id: 's3', text: '6 agama diakui secara resmi', category: 'keberagaman' },
            { id: 's4', text: 'Perlakuan berbeda karena ras', category: 'tantangan' },
            { id: 's5', text: '3.000+ tarian tradisional', category: 'keberagaman' },
            { id: 's6', text: 'Ketidakmauan menerima perbedaan', category: 'tantangan' },
            { id: 's7', text: 'Batik diakui UNESCO', category: 'keberagaman' },
            { id: 's8', text: 'Menyebarkan hoaks tentang kelompok lain', category: 'tantangan' },
            { id: 's9', text: 'Gotong royong lintas budaya', category: 'keberagaman' },
            { id: 's10', text: 'Memaksakan kehendak pada kelompok lain', category: 'tantangan' },
          ],
          kolom: [
            { id: 'keberagaman', label: '🌈 Keberagaman', color: 'g' },
            { id: 'tantangan', label: '⚠️ Tantangan', color: 'r' },
          ],
        },
        {
          type: 'diskusi',
          title: '💬 Refleksi Game',
          questions: [
            {
              label: 'Refleksi',
              icon: '💭',
              teks: 'Dari game tadi, tantangan mana yang paling sering kamu temui di lingkungan? Apa yang bisa kamu lakukan?',
              petunjuk: 'Tuliskan pendapatmu…',
              color: 'o',
            },
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
          title: 'Roda Bhinneka Tunggal Ika!',
          questions: [
            {
              q: 'Dari kitab manakah semboyan Bhinneka Tunggal Ika berasal?',
              diskusiHint: 'Ingat kitab karya Mpu Tantular dari Majapahit',
              opts: [
                { text: 'Kitab Negarakertagama', correct: false },
                { text: 'Kitab Sutasoma', correct: true },
                { text: 'Kitab Pararaton', correct: false },
                { text: 'Kitab Arjunawiwaha', correct: false },
              ],
              feedbackCorrect: 'Benar! Kitab Sutasoma karya Mpu Tantular adalah sumber semboyan Bhinneka Tunggal Ika.',
              feedbackWrong: 'Jawaban yang benar adalah Kitab Sutasoma karya Mpu Tantular dari Kerajaan Majapahit.',
            },
            {
              q: 'Apa arti kata "Bhinneka" dalam Bhinneka Tunggal Ika?',
              diskusiHint: 'Berhubungan dengan kata "berbeda" atau "aneka ragam"',
              opts: [
                { text: 'Satu', correct: false },
                { text: 'Bersatu', correct: false },
                { text: 'Berbeda-beda', correct: true },
                { text: 'Kekal', correct: false },
              ],
              feedbackCorrect: 'Benar! Bhinneka berarti berbeda-beda atau aneka ragam.',
              feedbackWrong: 'Bhinneka berasal dari kata "bhinna" yang berarti berbeda-beda atau rupa-rupa.',
            },
            {
              q: 'Berapa jumlah suku bangsa yang ada di Indonesia?',
              diskusiHint: 'Angkanya lebih dari seribu!',
              opts: [
                { text: 'Lebih dari 100', correct: false },
                { text: 'Lebih dari 500', correct: false },
                { text: 'Lebih dari 1.300', correct: true },
                { text: 'Lebih dari 5.000', correct: false },
              ],
              feedbackCorrect: 'Benar! Indonesia memiliki lebih dari 1.300 suku bangsa.',
              feedbackWrong: 'Indonesia memiliki lebih dari 1.300 suku bangsa — keberagaman yang luar biasa!',
            },
            {
              q: 'Stereotip terhadap suku tertentu termasuk kategori...',
              diskusiHint: 'Ini bukan bentuk keberagaman, tapi masalah yang harus diatasi',
              opts: [
                { text: 'Keberagaman budaya', correct: false },
                { text: 'Kekayaan bangsa', correct: false },
                { text: 'Tantangan keberagaman', correct: true },
                { text: 'Gotong royong', correct: false },
              ],
              feedbackCorrect: 'Benar! Stereotip adalah tantangan keberagaman yang harus dilawan.',
              feedbackWrong: 'Stereotip adalah tantangan keberagaman — anggapan negatif tanpa dasar terhadap kelompok tertentu.',
            },
            {
              q: 'Siapa penulis Kitab Sutasoma?',
              diskusiHint: 'Seorang pujangga dari Kerajaan Majapahit',
              opts: [
                { text: 'Mpu Prapanca', correct: false },
                { text: 'Mpu Tantular', correct: true },
                { text: 'Mpu Sindu', correct: false },
                { text: 'Mpu Kanwa', correct: false },
              ],
              feedbackCorrect: 'Benar! Mpu Tantular adalah pujangga Majapahit yang menulis Kitab Sutasoma.',
              feedbackWrong: 'Penulis Kitab Sutasoma adalah Mpu Tantular, pujangga Kerajaan Majapahit.',
            },
            {
              q: 'Gotong royong di tengah keberagaman berarti...',
              diskusiHint: 'Tidak membeda-bedakan dalam bekerja sama',
              opts: [
                { text: 'Hanya bekerja sama dengan suku yang sama', correct: false },
                { text: 'Bekerja sama tanpa membedakan latar belakang', correct: true },
                { text: 'Menghindari orang yang berbeda', correct: false },
                { text: 'Memisahkan tugas berdasarkan agama', correct: false },
              ],
              feedbackCorrect: 'Benar! Gotong royong sejati bekerja sama tanpa membedakan suku, agama, atau ras.',
              feedbackWrong: 'Gotong royong sejati adalah bekerja sama tanpa membedakan latar belakang — itulah Bhinneka Tunggal Ika.',
            },
            {
              q: 'UU No. 40 Tahun 2008 membahas tentang...',
              diskusiHint: 'Melindungi hak semua warga dari perlakuan tidak adil',
              opts: [
                { text: 'Pemerintahan daerah', correct: false },
                { text: 'Penghapusan Diskriminasi Ras dan Etnis', correct: true },
                { text: 'Sistem pendidikan nasional', correct: false },
                { text: 'Ketenagakerjaan', correct: false },
              ],
              feedbackCorrect: 'Benar! UU No. 40/2008 tentang Penghapusan Diskriminasi Ras dan Etnis.',
              feedbackWrong: 'UU No. 40 Tahun 2008 adalah tentang Penghapusan Diskriminasi Ras dan Etnis.',
            },
            {
              q: 'Di manakah semboyan Bhinneka Tunggal Ika tertulis?',
              diskusiHint: 'Perhatikan lambang negara Indonesia',
              opts: [
                { text: 'Di bendera Merah Putih', correct: false },
                { text: 'Di pita yang dicengkeram Garuda', correct: true },
                { text: 'Di Pancasila', correct: false },
                { text: 'Di dinding gedung MPR', correct: false },
              ],
              feedbackCorrect: 'Benar! Bhinneka Tunggal Ika tertulis di pita yang dicengkeram Garuda Pancasila.',
              feedbackWrong: 'Bhinneka Tunggal Ika tertulis di pita yang dicengkeram Garuda Pancasila sebagai lambang negara.',
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
      background: {
        type: 'radial',
        color1: 'g',
        color2: 'bg',
      },
      blocks: [
        {
          type: 'hasil',
          title: 'Bhinneka Tunggal Ika',
          subtitle: 'Pertemuan 1 Selesai! 🎉',
        },
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
            {
              teks: 'Hal baru apa yang kamu pelajari tentang Bhinneka Tunggal Ika hari ini?',
              petunjuk: 'Tuliskan 1–2 hal yang benar-benar baru bagimu…',
              warna: 'y',
              icon: '🌟',
            },
            {
              teks: 'Sebutkan satu tantangan keberagaman yang pernah kamu saksikan. Apa yang seharusnya dilakukan?',
              petunjuk: 'Ceritakan pengalamanmu dan solusi yang kamu pikirkan…',
              warna: 'c',
              icon: '🔍',
            },
            {
              teks: 'Satu komitmen nyata yang akan kamu lakukan untuk menjaga harmoni di tengah keberagaman:',
              petunjuk: 'Contoh: Saya akan menghentikan teman yang menyebarkan meme stereotip di grup',
              warna: 'g',
              icon: '🤝',
            },
          ],
          penugasan: {
            judul: '📌 Penugasan: Jurnal Keberagaman',
            isi: 'Selama 1 minggu, catat minimal 3 keberagaman yang kamu temui di lingkunganmu (suku, agama, budaya, makanan, bahasa). Tuliskan apa yang kamu syukuri dari setiap perbedaan itu.',
            contoh: 'Contoh: Senin — Di kantin, ada teman yang makan dengan tangan (tradisi Padang). Aku belajar itu adalah tradisi yang menghargai makanan.',
          },
        },
        {
          type: 'penutup',
          title: 'Sampai Jumpa!',
          subtitle: 'Pertemuan 2: Gotong Royong',
          preview: [
            { icon: '💪', judul: 'Gotong Royong', isi: 'Praktik kerja sama lintas perbedaan', warna: 'g' },
            { icon: '🎓', judul: 'Kearifan Lokal', isi: 'Nilai luhur dari setiap daerah', warna: 'c' },
            { icon: '🌍', judul: 'Ekonomi Pancasila', isi: 'Sistem ekonomi yang inklusif', warna: 'y' },
          ],
          nextPertemuan: {
            judul: 'Pertemuan 2: Gotong Royong di Tengah Keberagaman',
            deskripsi: 'Mendalami praktik gotong royong dan kearifan lokal sebagai perekat persatuan bangsa.',
            items: [
              { icon: '💪', judul: 'Gotong Royong', isi: 'Praktik dan makna kerja sama tanpa pamrih', warna: 'g' },
              { icon: '🎓', judul: 'Kearifan Lokal', isi: 'Mapalus, subak, dan tradisi kerja sama lainnya', warna: 'c' },
              { icon: '🌍', judul: 'Ekonomi Pancasila', isi: 'Koperasi dan ekonomi kerakyatan yang inklusif', warna: 'y' },
            ],
          },
        },
      ],
      nav: { prev: 's-hasil' },
    },
  ],
};
