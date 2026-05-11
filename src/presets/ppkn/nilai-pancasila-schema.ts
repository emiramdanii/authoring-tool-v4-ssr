import type { LessonSchema } from '@/core/schema/types';

export const NILAI_PANCASILA_LESSON: LessonSchema = {
  id: 'nilai-pancasila',
  version: 1,
  title: 'Nilai-Nilai Pancasila',
  mapel: 'PPKn',
  kelas: 'VII',
  themeId: 'nilai-pancasila',
  navbar: {
    logoText: '🇮🇩 Nilai Pancasila',
    logoColor: 'r',
    progressGradient: ['r', 'y'],
  },
  screens: [
    // ──────────────────────── COVER ────────────────────────
    {
      id: 's-cover',
      templateType: 'cover',
      background: {
        type: 'radial',
        color1: 'r',
        color2: 'bg',
      },
      blocks: [
        {
          type: 'cover',
          icon: '🇮🇩',
          title: 'Nilai-Nilai Pancasila',
          subtitle: 'Bab 1 — Pertemuan 1',
          badges: [
            { icon: '📋', text: 'TP 3', color: 'y' },
            { icon: '🎭', text: '3 Skenario', color: 'c' },
            { icon: '🎮', text: 'Game 10 Soal', color: 'g' },
            { icon: '📝', text: 'Refleksi', color: 'p' },
          ],
          meta: {
            durasi: '80 Menit',
            fase: 'Fase D',
            elemen: 'Pancasila',
          },
          cta: {
            label: '▶ Mulai Pembelajaran',
            action: 's-petunjuk',
          },
          background: {
            type: 'gradient',
            color1: 'r',
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
              body: 'Hadapi 3 situasi nyata seputar nilai Pancasila. Setiap pilihan menunjukkan sila mana yang sedang diuji!',
            },
            {
              icon: '📖',
              title: 'Baca & Eksplorasi',
              body: 'Pelajari sejarah, kedudukan, dan penerapan nilai setiap sila Pancasila. Tandai tiap tab setelah dibaca!',
            },
            {
              icon: '💬',
              title: 'Diskusi & Tulis',
              body: 'Jawab pertanyaan diskusi — jawabanmu otomatis tersimpan dan akan tampil lagi di Refleksi sebagai portofoliomu.',
            },
            {
              icon: '🎮',
              title: 'Game Pancasila',
              body: 'Uji pemahamanmu dengan 10 soal seputar nilai Pancasila. Setiap jawaban benar memberi penjelasan mendalam!',
            },
          ],
          tips: '💡 Ikuti alur dari awal sampai akhir. Jawab semua pertanyaan diskusi — jawabanmu akan muncul di Refleksi sebagai portofolio belajarmu hari ini!',
          tipsColor: 'r',
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
              desc: 'sejarah perumusan Pancasila sebagai dasar negara oleh para pendiri bangsa melalui sidang BPUPK dan PPKI',
              color: 'y',
            },
            {
              num: 2,
              verb: 'Menganalisis',
              desc: 'kedudukan Pancasila sebagai dasar negara, pandangan hidup bangsa, dan sumber segala sumber hukum Indonesia',
              color: 'c',
            },
            {
              num: 3,
              verb: 'Mengidentifikasi',
              desc: 'penerapan nilai-nilai setiap sila Pancasila dalam kehidupan sehari-hari di lingkungan keluarga, sekolah, dan masyarakat',
              color: 'g',
            },
          ],
          profil: '🔗 Profil Pelajar Pancasila: Beriman & Bertakwa · Bergotong Royong · Bernalar Kritis',
          profilColor: 'g',
        },
        {
          type: 'alur',
          title: '⏱️ Alur Kegiatan 80 Menit',
          totalDurasi: '80',
          steps: [
            {
              dot: 'p',
              durasi: '±10\'',
              judul: 'Apersepsi',
              deskripsi: '3 Skenario Interaktif, hadapi situasi nyata & pilih tindakanmu',
            },
            {
              dot: 'y',
              durasi: '±15\'',
              judul: 'Materi 1',
              deskripsi: 'Sejarah Lahirnya Pancasila, sidang BPUPK & tokoh-tokoh perumus',
            },
            {
              dot: 'c',
              durasi: '±15\'',
              judul: 'Materi 2',
              deskripsi: 'Kedudukan Pancasila, dasar negara, pandangan hidup, sumber hukum',
            },
            {
              dot: 'g',
              durasi: '±15\'',
              judul: 'Materi 3',
              deskripsi: 'Penerapan nilai per sila, contoh nyata di kehidupan sehari-hari',
            },
            {
              dot: 'o',
              durasi: '±15\'',
              judul: 'Game',
              deskripsi: 'Uji pemahaman 10 soal seputar nilai Pancasila',
            },
            {
              dot: 'r',
              durasi: '±10\'',
              judul: 'Refleksi & Penutup',
              deskripsi: 'Portofolio jawaban diskusi + komitmen pengamalan Pancasila',
            },
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
          title: 'Pancasila di Sekitar Kita!',
          chapters: [
            // ── Chapter 1: Diskon di Toko ──
            {
              id: 'ch1',
              charEmoji: '🛒',
              title: '🏪 Kasir yang Jujur',
              setup: [
                { speaker: 'NARRATOR', text: 'Kamu bekerja paruh waktu di toko kelontong. Seorang pelanggan membayar belanjaannya, tapi kamu menyadari ia membayar lebih dari harga sebenarnya.' },
                { speaker: 'PELANGGAN 😊', text: '"Ini kak, bayarnya." Ia menyerahkan uang dan berbalik hendak pergi.' },
                { speaker: 'NARRATOR', text: 'Kamu tahu uang kembalian cukup besar. Tidak ada yang melihat. Teman sekerjamu berbisik: "Diamkan saja, rejeki tuh!"' },
              ],
              choicePrompt: 'Apa yang kamu lakukan?',
              choices: [
                {
                  icon: '💰',
                  label: 'Panggil dan kembalikan uangnya',
                  detail: 'Segera memanggil pelanggan dan mengembalikan uang kembalian yang berlebih',
                  good: true,
                  pts: 20,
                  level: 'good',
                  resultTitle: 'Pilihan Terbaik! 🌟',
                  resultBody: 'Kejujuran adalah wujud nyata Sila ke-1 Ketuhanan Yang Maha Esa — berbuat jujur karena penghayatan nilai spiritual.',
                  norma: 'Sila 1: Ketuhanan Yang Maha Esa — Kejujuran',
                  consequences: [
                    { icon: '✅', text: 'Kamu menunjukkan bahwa kejujuran tidak bisa dibeli dengan uang' },
                    { icon: '✅', text: 'Pelanggan merasa dihargai dan percaya pada tokomu' },
                    { icon: '✅', text: 'Nilai Ketuhanan terwujud: berbuat baik karena Tuhan melihat, bukan karena manusia' },
                  ],
                  nextChapter: 1,
                },
                {
                  icon: '🤫',
                  label: 'Diamkan saja, rejeki',
                  detail: 'Simpan uang kembalian itu karena tidak ada yang tahu',
                  good: false,
                  pts: 0,
                  level: 'bad',
                  resultTitle: 'Pilihan Kurang Tepat ⚠️',
                  resultBody: 'Mengambil yang bukan hakmu melanggar nilai kejujuran yang diajarkan semua agama dan Pancasila.',
                  norma: 'Melanggar Sila 1 & 5 — Tidak Jujur & Tidak Adil',
                  consequences: [
                    { icon: '❌', text: 'Mengambil hak orang lain bertentangan dengan ajaran semua agama' },
                    { icon: '❌', text: 'Sila ke-5 Keadilan Sosial dilanggar: kamu mengambil yang bukan hakmu' },
                    { icon: '⚠️', text: 'Uang yang didapat secara tidak jujur tidak akan membawa berkah' },
                  ],
                  nextChapter: 1,
                },
                {
                  icon: '🤔',
                  label: 'Bagi dengan teman sekerja',
                  detail: 'Simpan sebagian dan bagi sebagian dengan teman yang berbisik tadi',
                  good: false,
                  pts: 3,
                  level: 'bad',
                  resultTitle: 'Tetap Salah 😬',
                  resultBody: 'Membagi hasil yang bukan hakmu tidak membuatnya menjadi benar. Salah tetap salah, berapa pun porsinya.',
                  norma: 'Melanggar Sila 2 & 5 — Kemanusiaan & Keadilan',
                  consequences: [
                    { icon: '❌', text: 'Berbagi hasil kecurangan bukan gotong royong — itu persekongkolan' },
                    { icon: '❌', text: 'Keduanya bersalah karena melanggar hak pelanggan' },
                    { icon: '💡', text: 'Gotong royong yang benar adalah bersama-sama berbuat baik, bukan bersama berbuat curang' },
                  ],
                  nextChapter: 1,
                },
              ],
            },
            // ── Chapter 2: Perayaan Agama Berbeda ──
            {
              id: 'ch2',
              charEmoji: '🤝',
              title: '🕌 Undangan Perayaan',
              setup: [
                { speaker: 'NARRATOR', text: 'Teman sekelasmu, Rina, mengundangmu ke perayaan hari besar agamanya. Kamu beragama berbeda dengannya.' },
                { speaker: 'RINA 😊', text: '"Aku mau rayain hari besar agamaku nanti. Kamu mau datang? Aku senang kalau kamu bisa ikut merayakan bersama!"' },
                { speaker: 'NARRATOR', text: 'Beberapa temanmu menyarankan untuk tidak ikut karena berbeda agama. Kamu ragu.' },
              ],
              choicePrompt: 'Apa yang kamu lakukan?',
              choices: [
                {
                  icon: '🤝',
                  label: 'Datang dengan senang hati',
                  detail: 'Hadir sebagai tanda menghormati teman dan merayakan keberagaman',
                  good: true,
                  pts: 20,
                  level: 'good',
                  resultTitle: 'Pilihan Terbaik! 🌟',
                  resultBody: 'Menghormati teman yang berbeda agama adalah wujud nyata Sila ke-1 dan Sila ke-3 — toleransi dan persatuan!',
                  norma: 'Sila 1: Ketuhanan — Toleransi & Sila 3: Persatuan',
                  consequences: [
                    { icon: '✅', text: 'Kamu menunjukkan bahwa berbeda agama bukan penghalang untuk saling menghormati' },
                    { icon: '✅', text: 'Persatuan terjaga — Sila ke-3 mengajarkan bhinneka tunggal ika' },
                    { icon: '✅', text: 'Rina merasa dihargai dan persahabatan kalian makin erat' },
                  ],
                  nextChapter: 2,
                },
                {
                  icon: '🙅',
                  label: 'Tolak karena berbeda agama',
                  detail: 'Menolak undangan karena tidak nyaman dengan perayaan agama lain',
                  good: false,
                  pts: 3,
                  level: 'bad',
                  resultTitle: 'Kurang Tepat ⚠️',
                  resultBody: 'Menolak hanya karena perbedaan agama bertentangan dengan toleransi yang diajarkan Pancasila.',
                  norma: 'Melanggar Sila 1 — Tidak Toleran',
                  consequences: [
                    { icon: '❌', text: 'Rina mungkin merasa tidak diterima hanya karena berbeda agama' },
                    { icon: '❌', text: 'Intoleransi melemahkan persatuan bangsa yang beragam' },
                    { icon: '💡', text: 'Menghormati agama lain bukan berarti mengikuti ritualnya — cukup hadir sebagai tanda hormat' },
                  ],
                  nextChapter: 2,
                },
                {
                  icon: '😊',
                  label: 'Datang sebentar sebagai tanda hormat',
                  detail: 'Hadir sesaat untuk memberi selamat, lalu pulang dengan sopan',
                  good: true,
                  pts: 15,
                  level: 'good',
                  resultTitle: 'Pilihan Bijak! 👍',
                  resultBody: 'Memberi penghormatan tanpa harus mengikuti seluruh ritual adalah bentuk toleransi yang seimbang.',
                  norma: 'Sila 1: Toleransi Beragama',
                  consequences: [
                    { icon: '✅', text: 'Kamu tetap menghormati Rina tanpa mengorbankan keyakinanmu sendiri' },
                    { icon: '✅', text: 'Sila ke-1 mengajarkan saling menghormati pemeluk agama lain' },
                    { icon: '💡', text: 'Saatnya kamu juga bisa mengundang Rina ke perayaan agamamu — saling menghormati!' },
                  ],
                  nextChapter: 2,
                },
              ],
            },
            // ── Chapter 3: Pemilihan Ketua Kelas ──
            {
              id: 'ch3',
              charEmoji: '🗳️',
              title: '🗳️ Politik Uang di Kelas',
              setup: [
                { speaker: 'NARRATOR', text: 'Akan ada pemilihan ketua kelas. Kamu salah satu calon. Temanmu yang juga calon menawarkan jajan gratis kepada teman-teman agar memilih dirinya.' },
                { speaker: 'TEMAN 😏', text: '"Gini deh, aku traktir jajan semua orang. Yang penting aku terpilih, nanti aku balas bantu kalian."' },
                { speaker: 'NARRATOR', text: 'Beberapa teman tergiur dan sudah bersedia memilihnya. Kamu tahu ini tidak adil, tapi kamu juga ingin menang.' },
              ],
              choicePrompt: 'Apa yang kamu lakukan?',
              choices: [
                {
                  icon: '🛑',
                  label: 'Tolak dan lapor ke guru',
                  detail: 'Menentang politik uang dan melaporkan ke guru bahwa pemilihan tidak adil',
                  good: true,
                  pts: 20,
                  level: 'good',
                  resultTitle: 'Pilihan Terbaik! 🌟',
                  resultBody: 'Demokrasi yang sehat mengutamakan musyawarah dan suara terbanyak, bukan suara yang dibeli!',
                  norma: 'Sila 4: Kerakyatan — Demokrasi yang Jujur',
                  consequences: [
                    { icon: '✅', text: 'Pemilihan menjadi adil — Sila ke-4 mengajankan musyawarah, bukan uang' },
                    { icon: '✅', text: 'Kamu membuktikan bahwa menang dengan cara terhormat lebih bermakna' },
                    { icon: '✅', text: 'Kelas belajar arti demokrasi sejati: suara bebas tanpa tekanan atau suap' },
                  ],
                  nextChapter: 3,
                },
                {
                  icon: '💸',
                  label: 'Ikut traktir juga agar menang',
                  detail: 'Menawarkan jajan juga agar bisa bersaing dengan temanmu itu',
                  good: false,
                  pts: 0,
                  level: 'bad',
                  resultTitle: 'Salah Besar! ⚠️',
                  resultBody: 'Membeli suara melanggar prinsip demokrasi Pancasila. Menang dengan cara curang tetap salah.',
                  norma: 'Melanggar Sila 4 — Memperjualbelikan Demokrasi',
                  consequences: [
                    { icon: '❌', text: 'Pemilihan kelas jadi seperti pasar — siapa kaya dia menang' },
                    { icon: '❌', text: 'Sila ke-4 Kerakyatan dikhianati: musyawarah diganti transaksi' },
                    { icon: '⚠️', text: 'Ketua terpilih bukan yang terbaik, tapi yang paling banyak traktir' },
                  ],
                  nextChapter: 3,
                },
                {
                  icon: '😤',
                  label: 'Protes keras dan pergi',
                  detail: 'Marah-marah di kelas dan menolak ikut pemilihan sama sekali',
                  good: false,
                  pts: 5,
                  level: 'mid',
                  resultTitle: 'Kurang Bijak 🤔',
                  resultBody: 'Protes itu wajar, tapi cara yang tidak sopan justru melemahkan posisimu. Ada jalan yang lebih baik.',
                  norma: 'Sila 4: Musyawarah, Bukan Emosi',
                  consequences: [
                    { icon: '🟡', text: 'Protes tanpa solusi tidak mengubah keadaan' },
                    { icon: '⚠️', text: 'Sila ke-4 mengajarkan musyawarah — bicarakan dengan kepala dingin' },
                    { icon: '💡', text: 'Coba sampaikan keberatan secara santun dan bawa ke guru pembimbing' },
                  ],
                  nextChapter: 3,
                },
              ],
            },
          ],
        },
      ],
      nav: { prev: 's-tp', next: 's-materi1', nextLabel: 'Lanjut: Sejarah Pancasila' },
    },

    // ──────────────────────── MATERI 1: Sejarah ────────────────────────
    {
      id: 's-materi1',
      templateType: 'materi',
      sectionLabel: '📖 Materi 1 · ±15 Menit',
      sectionColor: 'y',
      blocks: [
        {
          type: 'def-box',
          borderColor: 'y',
          content: '<strong>Pancasila</strong> dirumuskan oleh para pendiri bangsa melalui proses panjang sidang <strong>BPUPK</strong> (Badan Penyelidik Usaha-Usaha Persiapan Kemerdekaan Indonesia) dan <strong>PPKI</strong> (Panitia Persiapan Kemerdekaan Indonesia) pada tahun 1945. Tiga tokoh utama mengusulkan rumusan dasar negara: <strong>Moh. Yamin</strong> (29 Mei), <strong>Soepomo</strong> (31 Mei), dan <strong>Soekarno</strong> (1 Juni 1945).',
        },
        {
          type: 'nc-grid',
          cards: [
            {
              icon: '📋',
              title: 'Sidang BPUPK I',
              body: '29 Mei – 1 Juni 1945. Tiga tokoh menyampaikan usulan dasar negara. Soekarno pertama kali mengucapkan kata "Pancasila" pada 1 Juni 1945.',
              color: 'y',
            },
            {
              icon: '📝',
              title: 'Moh. Yamin',
              body: '29 Mei 1945. Mengusulkan lima asas: Peri Kebangsaan, Peri Kemanusiaan, Peri Ketuhanan, Kerdemokrasian, dan Kesejahteraan Rakyat.',
              color: 'c',
            },
            {
              icon: '🏛️',
              title: 'Soepomo',
              body: '31 Mei 1945. Mengusulkan dasar negara berdasarkan integrasi jati diri bangsa: Paham kekeluargaan, mufakat, keseimbangan, musyawarah.',
              color: 'g',
            },
            {
              icon: '🎤',
              title: 'Soekarno (1 Juni)',
              body: 'Mengusulkan nama "Pancasila" dengan lima sila: Kebangsaan, Internasionalisme, Mufakat, Kesejahteraan Sosial, dan Ketuhanan.',
              color: 'p',
            },
          ],
        },
        {
          type: 'flashcard-set',
          cards: [
            {
              q: 'Kapan sidang BPUPK pertama dilaksanakan?',
              a: '29 Mei – 1 Juni 1945. Dalam sidang ini, tiga tokoh menyampaikan usulan rumusan dasar negara Indonesia.',
            },
            {
              q: 'Siapa yang pertama kali mengucapkan kata "Pancasila"?',
              a: 'Ir. Soekarno, pada pidatonya tanggal 1 Juni 1945 di hadapan sidang BPUPK.',
            },
            {
              q: 'Apa peran Piagam Jakarta dalam sejarah Pancasila?',
              a: 'Piagam Jakarta (22 Juni 1945) adalah rumusan awal dasar negara oleh Panitia Sembilan. Sila pertama awlnya memuat "dengan kewajiban menjalankan syariat Islam" yang kemudian dihapus pada 18 Agustus 1945.',
            },
            {
              q: 'Mengapa tanggal 1 Juni diperingati sebagai Hari Lahir Pancasila?',
              a: 'Karena pada tanggal 1 Juni 1945, Soekarno untuk pertama kalinya mengusulkan nama "Pancasila" sebagai dasar negara dalam sidang BPUPK.',
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
              teks: 'Mengapa para pendiri bangsa perlu merumuskan dasar negara? Jelaskan dengan kata-katamu sendiri dan hubungkan dengan pentingnya memiliki pedoman bersama!',
              petunjuk: 'Tuliskan di sini… (jawabanmu akan tampil lagi di Refleksi)',
              color: 'y',
            },
          ],
        },
      ],
      nav: { prev: 's-apersepsi', next: 's-materi2', nextLabel: 'Lanjut: Kedudukan Pancasila' },
    },

    // ──────────────────────── MATERI 2: Kedudukan ────────────────────────
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
              icon: '🏛️',
              label: 'Dasar Negara',
              content: [
                {
                  type: 'def-box',
                  borderColor: 'y',
                  content: 'Pancasila sebagai <strong>dasar negara</strong> berarti Pancasila merupakan fondasi bagi berdirinya Negara Kesatuan Republik Indonesia. Segala aturan hukum dan penyelenggaraan negara harus berdasarkan Pancasila.',
                },
                {
                  type: 'nc-grid',
                  cards: [
                    { icon: '📜', title: 'UUD 1945 Pembukaan', body: 'Pancasila tercantum dalam Pembukaan UUD 1945 yang tidak dapat diubah karena merupakan jiwa dan roka negara', color: 'y' },
                    { icon: '⚖️', title: 'Dasar Hukum', body: 'Semua undang-undang dan peraturan harus selaras dengan Pancasila — tidak boleh bertentangan', color: 'y' },
                    { icon: '🇮🇩', title: 'Fondasi NKRI', body: 'Tanpa Pancasila sebagai dasar, negara tidak memiliki pedoman untuk menentukan arah kebijakan', color: 'y' },
                  ],
                },
              ],
            },
            {
              icon: '🗺️',
              label: 'Pandangan Hidup',
              content: [
                {
                  type: 'def-box',
                  borderColor: 'c',
                  content: 'Pancasila sebagai <strong>pandangan hidup bangsa</strong> berarti nilai-nilai Pancasila menjadi pedoman dalam kehidupan sehari-hari setiap warga negara Indonesia, baik secara pribadi maupun bersama.',
                },
                {
                  type: 'nc-grid',
                  cards: [
                    { icon: '👨‍👩‍👧‍👦', title: 'Keluarga', body: 'Menghormati orang tua, saling membantu, dan menjaga keharmonisan rumah tangga', color: 'c' },
                    { icon: '🏫', title: 'Sekolah', body: 'Taat aturan, menghargai guru, bergotong royong dalam piket dan kegiatan kelas', color: 'c' },
                    { icon: '🏘️', title: 'Masyarakat', body: 'Musyawarah dalam RT/RW, gotong royong kerja bakti, dan toleransi antarwarga', color: 'c' },
                  ],
                },
              ],
            },
            {
              icon: '⚖️',
              label: 'Sumber Hukum',
              content: [
                {
                  type: 'def-box',
                  borderColor: 'g',
                  content: 'Pancasila sebagai <strong>sumber segala sumber hukum</strong> berarti Pancasila adalah sumber dari segala sumber hukum yang berlaku di Indonesia (UUD 1945 Pasal 1 Ayat 3). Maksudnya, setiap peraturan perundang-undangan harus mencerminkan nilai Pancasila.',
                },
                {
                  type: 'nc-grid',
                  cards: [
                    { icon: '📋', title: 'TAP MPR', body: 'Ketetapan MPR harus berdasarkan Pancasila sebagai pedoman penyelenggaraan negara', color: 'g' },
                    { icon: '📕', title: 'Undang-Undang', body: 'Setiap UU yang dibuat DPR dan Presiden harus selaras dengan nilai-nilai Pancasila', color: 'g' },
                    { icon: '📄', title: 'Peraturan Lain', body: 'PP, Perpres, Perda, dan semua peraturan turunan tidak boleh bertentangan dengan Pancasila', color: 'g' },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'def-box',
          borderColor: 'c',
          content: '<strong>💡 Ingat:</strong> Ketiga kedudukan Pancasila ini saling berkaitan. Sebagai dasar negara ia menjadi fondasi, sebagai pandangan hidup ia menjadi pedoman harian, dan sebagai sumber hukum ia menjadi tolak ukur keabsahan setiap aturan.',
        },
        {
          type: 'flashcard-set',
          cards: [
            {
              q: 'Apa arti Pancasila sebagai dasar negara?',
              a: 'Pancasila adalah fondasi berdirinya NKRI. Segala aturan hukum dan penyelenggaraan negara harus berdasarkan Pancasila.',
            },
            {
              q: 'Mengapa Pancasila disebut pandangan hidup bangsa?',
              a: 'Karena nilai-nilai Pancasila menjadi pedoman kehidupan sehari-hari setiap warga negara — di keluarga, sekolah, dan masyarakat.',
            },
            {
              q: 'Apa maksud Pancasila sebagai sumber segala sumber hukum?',
              a: 'Setiap peraturan perundang-undangan di Indonesia harus mencerminkan dan tidak boleh bertentangan dengan nilai-nilai Pancasila.',
            },
            {
              q: 'Di mana tertuang bahwa Pancasila adalah sumber segala sumber hukum?',
              a: 'UUD NRI 1945 Pasal 1 Ayat 3: "Negara Indonesia adalah negara hukum." Pancasila sebagai sumber segala sumber hukum ditegaskan dalam ketetapan MPR.',
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
              teks: 'Dari tiga kedudukan Pancasila, mana yang paling kamu rasakan dalam kehidupan sehari-hari? Berikan contoh nyata!',
              petunjuk: 'Tuliskan pendapatmu di sini… (akan tampil di Refleksi)',
              color: 'c',
            },
          ],
        },
      ],
      nav: { prev: 's-materi1', next: 's-materi3', nextLabel: 'Lanjut: Penerapan Nilai Sila' },
    },

    // ──────────────────────── MATERI 3: Penerapan per Sila ────────────────────────
    {
      id: 's-materi3',
      templateType: 'materi',
      sectionLabel: '📖 Materi 3 · ±15 Menit',
      sectionColor: 'g',
      blocks: [
        {
          type: 'nc-grid',
          cards: [
            {
              icon: '🙏',
              title: 'Sila 1: Ketuhanan',
              body: 'Memeluk agama masing-masing, menghormati pemeluk agama lain, tidak memaksakan keyakinan, dan bekerja sama lintas agama.',
              color: 'y',
            },
            {
              icon: '❤️',
              title: 'Sila 2: Kemanusiaan',
              body: 'Menentang perundungan (bullying), menolong sesama yang kesulitan, menghargai hak setiap manusia, dan peduli lingkungan.',
              color: 'c',
            },
            {
              icon: '🤝',
              title: 'Sila 3: Persatuan',
              body: 'Menjaga tradisi budaya daerah, mengutamakan kepentingan bersama, membeli produk lokal, dan tidak menyebarkan hoaks yang memecah.',
              color: 'g',
            },
            {
              icon: '🗣️',
              title: 'Sila 4: Kerakyatan',
              body: 'Tidak memaksakan kehendak, bermusyawarah dalam mengambil keputusan, menghargai perbedaan pendapat, dan menggunakan akal sehat.',
              color: 'p',
            },
            {
              icon: '⚖️',
              title: 'Sila 5: Keadilan',
              body: 'Tidak memeras dan memperdaya orang lain, bersikap adil, tidak boros, menolong yang lemah, dan menjaga kesehatan diri.',
              color: 'r',
            },
          ],
        },
        {
          type: 'def-box',
          borderColor: 'g',
          content: '<strong>💡 Penerapan Pancasila itu konkret!</strong> Bukan hanya dihafal — tapi dihidupi. Setiap sila punya wujud nyata dalam tindakan sehari-hari. Sila 1 bukan sekadar "beragama", tapi juga toleransi. Sila 4 bukan sekadar "musyawarah", tapi juga menghargai pendapat yang berbeda.',
        },
        {
          type: 'flashcard-set',
          cards: [
            {
              q: 'Sebutkan contoh penerapan Sila ke-1 di sekolah!',
              a: 'Saling menghormati teman yang berbeda agama, tidak menghina keyakinan orang lain, dan ikut kerja bakti lintas agama.',
            },
            {
              q: 'Bagaimana penerapan Sila ke-2 dalam kehidupan sehari-hari?',
              a: 'Menolong teman yang kesulitan, menentang perundungan, dan peduli terhadap sesama tanpa membeda-bedakan.',
            },
            {
              q: 'Mengapa membeli produk lokal termasuk penerapan Sila ke-3?',
              a: 'Karena membeli produk dalam negeri memperkuat ekonomi bangsa dan mendukung persatuan ekonomi Indonesia.',
            },
            {
              q: 'Apa perbedaan musyawarah dan voting dalam konteks Sila ke-4?',
              a: 'Musyawarah mengutamakan kesepakatan bersama melalui diskusi, sedangkan voting mengutamakan suara terbanyak. Pancasila mengutamakan musyawarah mufakat.',
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
              teks: 'Pilih satu sila Pancasila dan tuliskan 3 contoh nyata penerapannya dalam kehidupanmu di rumah, sekolah, atau masyarakat!',
              petunjuk: 'Tuliskan di sini… (jawabanmu akan tampil lagi di Refleksi)',
              color: 'g',
            },
          ],
        },
      ],
      nav: { prev: 's-materi2', next: 's-game', nextLabel: 'Lanjut ke Game 🎮' },
    },

    // ──────────────────────── GAME ────────────────────────
    {
      id: 's-game',
      templateType: 'game',
      sectionLabel: '🎮 Game · ±15 Menit',
      sectionColor: 'o',
      blocks: [
        {
          type: 'kuis',
          title: 'Game Nilai Pancasila!',
          questions: [
            {
              q: 'Siapa yang pertama kali mengusulkan nama "Pancasila" sebagai dasar negara?',
              opts: ['Moh. Yamin', 'Soepomo', 'Soekarno', 'Moh. Hatta'],
              ans: 2,
              ex: 'Ir. Soekarno mengusulkan nama "Pancasila" pada pidato tanggal 1 Juni 1945 di sidang BPUPK.',
            },
            {
              q: 'Kedudukan Pancasila sebagai dasar negara tertuang dalam...',
              opts: ['Pasal 1 UUD 1945', 'Pembukaan UUD 1945', 'Pasal 33 UUD 1945', 'Penjelasan UUD 1945'],
              ans: 1,
              ex: 'Pancasila tercantum dalam Pembukaan UUD 1945 yang merupakan jiwa dan roka negara tidak dapat diubah.',
            },
            {
              q: 'Sila ke-4 Pancasila "Kerakyatan yang Dipimpin oleh Hikmat Kebijaksanaan" mengajarkan tentang...',
              opts: ['Gotong royong', 'Musyawarah mufakat', 'Keadilan sosial', 'Ketuhanan'],
              ans: 1,
              ex: 'Sila ke-4 mengajarkan pengambilan keputusan melalui musyawarah untuk mufakat, bukan voting atau pemaksaan kehendak.',
            },
            {
              q: 'Contoh penerapan Sila ke-1 di sekolah adalah...',
              opts: ['Membayar pajak', 'Menghormati teman berbeda agama', 'Ikut pemilu', 'Menjaga kebersihan'],
              ans: 1,
              ex: 'Menghormati teman yang berbeda agama adalah wujud toleransi beragama sesuai Sila ke-1 Ketuhanan Yang Maha Esa.',
            },
            {
              q: 'Pancasila sebagai pandangan hidup bangsa artinya...',
              opts: ['Pancasila hanya berlaku di pemerintahan', 'Nilai Pancasila menjadi pedoman kehidupan sehari-hari warga negara', 'Pancasila hanya untuk orang beragama', 'Pancasila wajib dihafal saja'],
              ans: 1,
              ex: 'Pandangan hidup berarti nilai-nilai Pancasila menjadi pedoman dalam kehidupan sehari-hari di keluarga, sekolah, dan masyarakat.',
            },
            {
              q: 'Pancasila sebagai sumber segala sumber hukum artinya...',
              opts: ['Pancasila menggantikan UUD', 'Setiap peraturan harus mencerminkan nilai Pancasila', 'Hanya Pancasila yang berlaku', 'Pancasila tidak perlu peraturan pelaksana'],
              ans: 1,
              ex: 'Sebagai sumber segala sumber hukum, setiap peraturan perundang-undangan di Indonesia harus selaras dan tidak boleh bertentangan dengan Pancasila.',
            },
            {
              q: 'Tanggal 1 Juni diperingati sebagai Hari Lahir Pancasila karena...',
              opts: ['Hari kemerdekaan Indonesia', 'Hari Soekarno pertama kali mengusulkan nama Pancasila', 'Hari disahkannya UUD 1945', 'Hari dibentuknya BPUPK'],
              ans: 1,
              ex: 'Pada 1 Juni 1945, Soekarno untuk pertama kalinya mengusulkan nama "Pancasila" dalam sidang BPUPK.',
            },
            {
              q: 'Membeli produk dalam negeri merupakan penerapan Sila ke...',
              opts: ['Sila 1', 'Sila 2', 'Sila 3', 'Sila 4'],
              ans: 2,
              ex: 'Membeli produk lokal memperkuat ekonomi bangsa dan mendukung persatuan — ini penerapan Sila ke-3 Persatuan Indonesia.',
            },
            {
              q: 'Apa yang terjadi jika nilai Pancasila tidak dijalankan dalam kehidupan bermasyarakat?',
              opts: ['Masyarakat menjadi lebih maju', 'Timbul konflik, ketidakadilan, dan perpecahan', 'Tidak ada pengaruh', 'Hukum menjadi lebih kuat'],
              ans: 1,
              ex: 'Tanpa Pancasila sebagai pedoman, masyarakat rentan terhadap konflik, ketidakadilan, intoleransi, dan perpecahan bangsa.',
            },
            {
              q: 'Gotong royong membersihkan desa bersama warga merupakan penerapan Sila ke...',
              opts: ['Sila 1 saja', 'Sila 2 saja', 'Sila 3 saja', 'Sila 2, 3, dan 4 sekaligus'],
              ans: 3,
              ex: 'Gotong royong mengandung nilai kemanusiaan (Sila 2), persatuan (Sila 3), dan kerakyatan (Sila 4) — sila-sila Pancasila saling berkaitan!',
            },
          ],
        },
      ],
      nav: { prev: 's-materi3', next: 's-hasil', nextLabel: 'Lihat Hasil 🏆' },
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
          title: 'Nilai-Nilai Pancasila',
          subtitle: 'Pertemuan 1 Selesai! 🎉',
        },
      ],
      nav: { prev: 's-game', next: 's-refleksi', nextLabel: 'Refleksi Diri 📝' },
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
              teks: 'Hal baru apa yang kamu pelajari hari ini tentang Pancasila?',
              petunjuk: 'Tuliskan 1–2 hal yang benar-benar baru bagimu…',
              warna: 'y',
              icon: '🌟',
            },
            {
              teks: 'Dari kelima sila Pancasila, sila mana yang paling sering kamu terapkan? Mana yang masih perlu diperbaiki?',
              petunjuk: 'Jelaskan dengan contoh konkret…',
              warna: 'c',
              icon: '🔍',
            },
            {
              teks: 'Satu komitmen nyata yang akan kamu lakukan minggu ini sebagai wujud pengamalan Pancasila:',
              petunjuk: 'Contoh: Saya akan lebih menghargai pendapat teman yang berbeda dengan saya',
              warna: 'g',
              icon: '🤝',
            },
          ],
          penugasan: {
            judul: '📌 Penugasan: Portofolio Pancasila',
            isi: 'Selama 1 minggu, catat minimal 3 tindakanmu yang mencerminkan nilai Pancasila. Bisa di rumah, sekolah, atau masyarakat. Tuliskan sila mana yang tercermin.',
            contoh: 'Contoh: Senin — Membantu ibu berbelanja di pasar (Sila 2: Kemanusiaan & Sila 5: Keadilan)',
          },
        },
        {
          type: 'penutup',
          title: 'Sampai Jumpa!',
          subtitle: 'Pertemuan 2: Kedudukan Pancasila',
          preview: [
            { icon: '🏛️', judul: 'Dasar Negara', isi: 'Mengapa Pancasila menjadi fondasi NKRI', warna: 'y' },
            { icon: '🗺️', judul: 'Pandangan Hidup', isi: 'Bagaimana Pancasila membimbing kehidupan kita', warna: 'c' },
            { icon: '⚖️', judul: 'Sumber Hukum', isi: 'Pancasila sebagai tolak ukur keabsahan aturan', warna: 'g' },
          ],
          nextPertemuan: {
            judul: 'Pertemuan 2: Kedudukan Pancasila',
            deskripsi: 'Akan membahas lebih dalam tentang tiga kedudukan Pancasila dan implikasinya dalam kehidupan berbangsa.',
            items: [
              { icon: '🏛️', judul: 'Dasar Negara', isi: 'Fondasi hukum dan penyelenggaraan negara', warna: 'y' },
              { icon: '🗺️', judul: 'Pandangan Hidup', isi: 'Pedoman kehidupan sehari-hari bangsa', warna: 'c' },
              { icon: '⚖️', judul: 'Sumber Hukum', isi: 'Sumber dari segala peraturan perundang-undangan', warna: 'g' },
            ],
          },
        },
      ],
      nav: { prev: 's-hasil' },
    },
  ],
};
