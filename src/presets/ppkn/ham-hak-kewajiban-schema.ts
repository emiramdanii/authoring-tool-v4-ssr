import type { LessonSchema } from '@/core/schema/types';

export const HAM_HAK_KEWAJIBAN_LESSON: LessonSchema = {
  id: 'ham-hak-kewajiban',
  version: 1,
  title: 'HAM, Hak & Kewajiban Warga Negara',
  mapel: 'PPKn',
  kelas: 'VIII',
  themeId: 'ham-hak-kewajiban',
  navbar: {
    logoText: '⚖️ HAM & Kewajiban',
    logoColor: 'p',
    progressGradient: ['p', 'c'],
  },
  screens: [
    // ──────────────────────── COVER ────────────────────────
    {
      id: 's-cover',
      templateType: 'cover',
      background: { type: 'radial', color1: 'p', color2: 'bg' },
      blocks: [
        {
          type: 'cover',
          icon: '⚖️',
          title: 'HAM, Hak & Kewajiban',
          subtitle: 'Bab 3 — Pertemuan 1',
          badges: [
            { icon: '📋', text: 'TP 3', color: 'y' },
            { icon: '🎭', text: '3 Skenario', color: 'c' },
            { icon: '🎮', text: 'Sortir + Roda', color: 'g' },
            { icon: '📝', text: 'Refleksi', color: 'p' },
          ],
          meta: { durasi: '80 Menit', fase: 'Fase D', elemen: 'UUD NRI 1945' },
          cta: { label: '▶ Mulai Pembelajaran', action: 's-petunjuk' },
          background: { type: 'gradient', color1: 'p', color2: 'bg' },
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
            { icon: '🎭', title: 'Skenario Interaktif', body: 'Hadapi 3 situasi seputar hak dan kewajiban. Pilih tindakanmu dan pelajari konsekuensinya!' },
            { icon: '📖', title: 'Baca & Eksplorasi', body: 'Pelajari pengertian HAM, hak-kewajiban UUD 1945, dan bentuk-bentuk pelanggarannya.' },
            { icon: '💬', title: 'Diskusi & Tulis', body: 'Jawab pertanyaan diskusi — jawabanmu tersimpan dan tampil lagi di Refleksi.' },
            { icon: '🎮', title: 'Game Interaktif', body: 'Sortir hak vs kewajiban dan mainkan Roda Game 8 soal untuk uji pemahaman!' },
          ],
          tips: '💡 Ikuti alur dari awal sampai akhir. Jawaban diskusimu akan muncul di Refleksi sebagai portofolio belajarmu!',
          tipsColor: 'p',
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
            { num: 1, verb: 'Menjelaskan', desc: 'pengertian HAM dan prinsip-prinsip dasarnya (universal, inherent, inalienable, indivisible)', color: 'y' },
            { num: 2, verb: 'Menganalisis', desc: 'hak dan kewajiban warga negara berdasarkan UUD NRI 1945 Pasal 27–34', color: 'c' },
            { num: 3, verb: 'Mengidentifikasi', desc: 'contoh pelanggaran hak dan pengingkaran kewajiban serta upaya penegakkannya', color: 'g' },
          ],
          profil: '🔗 Profil Pelajar Pancasila: Beriman & Bertakwa · Bergotong Royong · Bernalar Kritis',
          profilColor: 'g',
        },
        {
          type: 'alur',
          title: '⏱️ Alur Kegiatan 80 Menit',
          totalDurasi: '80',
          steps: [
            { dot: 'p', durasi: '±10\'', judul: 'Apersepsi', deskripsi: '3 Skenario tentang hak & kewajiban' },
            { dot: 'y', durasi: '±15\'', judul: 'Materi 1', deskripsi: 'Pengertian HAM dan prinsip-prinsip dasarnya' },
            { dot: 'c', durasi: '±15\'', judul: 'Materi 2', deskripsi: 'Hak & Kewajiban berdasarkan UUD 1945' },
            { dot: 'g', durasi: '±15\'', judul: 'Materi 3', deskripsi: 'Pelanggaran hak & pengingkaran kewajiban' },
            { dot: 'o', durasi: '±15\'', judul: 'Game', deskripsi: 'Sortir Game + Roda Game' },
            { dot: 'r', durasi: '±10\'', judul: 'Refleksi & Penutup', deskripsi: 'Portofolio + komitmen menegakkan hak' },
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
          title: 'Hakmu, Kewajibanmu!',
          chapters: [
            {
              id: 'ch1',
              charEmoji: '🏫',
              title: '📱 Ponsel Disita Guru',
              setup: [
                { speaker: 'NARRATOR', text: 'Guru menyita ponselmu saat jam istirahat karena ia mengira kamu bermain di kelas. Padahal kamu sedang menghubungi orang tua karena ada darurat keluarga.' },
                { speaker: 'GURU 😠', text: '"Aturan sekolah: tidak boleh bawa ponsel! Sita dulu, ambil akhir semester."' },
                { speaker: 'NARRATOR', text: 'Kamu tahu aturan itu ada, tapi kebutuhan mendesak orang tuamu juga penting. Apa yang harus kamu lakukan?' },
              ],
              choicePrompt: 'Apa yang kamu lakukan?',
              choices: [
                {
                  icon: '🗣️', label: 'Jelaskan dengan sopan', detail: 'Menjelaskan situasi darurat kepada guru dan minta ponsel dikembalikan',
                  good: true, pts: 20, level: 'good',
                  resultTitle: 'Pilihan Terbaik! 🌟',
                  resultBody: 'Kamu membela hakmu dengan cara yang santun — inilah cara melindungi hak tanpa melanggar aturan.',
                  norma: 'Hak Komunikasi + Kewajiban Patuh Aturan',
                  consequences: [
                    { icon: '✅', text: 'Hakmu untuk komunikasi darurat terlindungi' },
                    { icon: '✅', text: 'Guru memahami situasi dan bisa mengembalikan ponselmu' },
                    { icon: '✅', text: 'Aturan tetap dihormati, tapi hak darurat juga diakui' },
                  ],
                  nextChapter: 1,
                },
                {
                  icon: '😤', label: 'Protes keras dan ambil paksa', detail: 'Merampas kembali ponselmu dari meja guru dengan marah',
                  good: false, pts: 0, level: 'bad',
                  resultTitle: 'Cara Salah! ⚠️',
                  resultBody: 'Membela hak dengan cara melanggar aturan justru melemahkan posisimu. Ada jalan yang lebih baik.',
                  norma: 'Melanggar Kewajiban Patuh Aturan',
                  consequences: [
                    { icon: '❌', text: 'Tindakan paksa melanggar kewajiban patuh aturan sekolah' },
                    { icon: '❌', text: 'Guru mungkin makin tidak mau mengembalikan ponselmu' },
                    { icon: '⚠️', text: 'Membela hak dengan cara salah justru merugikan diri sendiri' },
                  ],
                  nextChapter: 1,
                },
                {
                  icon: '😞', label: 'Diam dan terima saja', detail: 'Menyerah dan menunggu akhir semester untuk mengambil ponsel',
                  good: false, pts: 5, level: 'mid',
                  resultTitle: 'Kurang Berani 🤔',
                  resultBody: 'Patuh aturan itu baik, tapi hakmu juga perlu diperjuangkan dengan cara yang tepat.',
                  norma: 'Hak Tidak Diperjuangkan',
                  consequences: [
                    { icon: '🟡', text: 'Orang tuamu tidak bisa menghubungimu saat darurat' },
                    { icon: '⚠️', text: 'Hakmu atas komunikasi penting tidak terpenuhi karena kamu tidak menjelaskannya' },
                    { icon: '💡', text: 'Bisa patuh aturan sekaligus menjelaskan situasi darurat' },
                  ],
                  nextChapter: 1,
                },
              ],
            },
            {
              id: 'ch2',
              charEmoji: '🏘️',
              title: '🚫 Ditolak karena Berbeda',
              setup: [
                { speaker: 'NARRATOR', text: 'Kamu mendaftar ke ekskul futsal, tapi ketua ekskul menolak dengan alasan: "Kamu kan perempuan, futsal bukan untuk cewek."' },
                { speaker: 'KETUA 😏', text: '"Cari ekskul lain aja deh, yang lebih cocok buat kamu."' },
                { speaker: 'NARRATOR', text: 'Kamu sangat ingin bermain futsal dan tahu bahwa semua siswa punya hak yang sama untuk mengikuti kegiatan sekolah.' },
              ],
              choicePrompt: 'Apa yang kamu lakukan?',
              choices: [
                {
                  icon: '🛡️', label: 'Lapor ke guru dan minta keadilan', detail: 'Melaporkan diskriminasi ke guru pembimbing dan meminta hakmu diperjuangkan',
                  good: true, pts: 20, level: 'good',
                  resultTitle: 'Pilihan Terbaik! 🌟',
                  resultBody: 'Melawan diskriminasi dengan jalur yang benar — inilah cara menegakkan hak asasi manusia!',
                  norma: 'HAM: Bebas dari Diskriminasi',
                  consequences: [
                    { icon: '✅', text: 'Hakmu untuk mengikuti ekskul dilindungi' },
                    { icon: '✅', text: 'Diskriminasi gender dihentikan di lingkungan sekolah' },
                    { icon: '✅', text: 'Siswa lain juga mendapat manfaat karena sekolah lebih inklusif' },
                  ],
                  nextChapter: 2,
                },
                {
                  icon: '😢', label: 'Menyerah dan cari ekskul lain', detail: 'Menerima penolakan dan mendaftar ekskul lain yang "lebih cocok"',
                  good: false, pts: 5, level: 'mid',
                  resultTitle: 'Sayang 🤔',
                  resultBody: 'Hakmu dirampas dan kamu tidak memperjuangkannya. Diskriminasi akan terus berlanjut jika tidak ada yang melawan.',
                  norma: 'Hak Diterima Tanpa Perlawanan',
                  consequences: [
                    { icon: '🟡', text: 'Kamu kehilangan kesempatan yang kamu inginkan' },
                    { icon: '⚠️', text: 'Diskriminasi akan terus berulang karena tidak ada yang menentang' },
                    { icon: '💡', text: 'Perjuangkan hakmu — UUD 1945 Pasal 27 menjamin kesetaraan!' },
                  ],
                  nextChapter: 2,
                },
                {
                  icon: '😠', label: 'Memaksa masuk tanpa izin', detail: 'Datang ke latihan dan main paksa meski ditolak',
                  good: false, pts: 3, level: 'bad',
                  resultTitle: 'Kurang Tepat ⚠️',
                  resultBody: 'Memaksa bukan cara menegakkan hak. Cara yang benar adalah melalui jalur yang sah.',
                  norma: 'Cara Salah Memperjuangkan Hak',
                  consequences: [
                    { icon: '❌', text: 'Konflik bisa membesar dan kamu yang disalahkan' },
                    { icon: '❌', text: 'Ada jalur yang lebih baik: bicara ke guru atau wali kelas' },
                    { icon: '💡', text: 'Memperjuangkan hak harus dengan cara yang sah dan sopan' },
                  ],
                  nextChapter: 2,
                },
              ],
            },
            {
              id: 'ch3',
              charEmoji: '💻',
              title: '🤐 Ditengkam Cyberbullying',
              setup: [
                { speaker: 'NARRATOR', text: 'Teman sekelasmu menjadi korban cyberbullying — fotonya diedit dan disebar di media sosial dengan caption yang merendahkan.' },
                { speaker: 'KORBAN 😢', text: '"Aku malu banget, nggak mau sekolah lagi. Semua orang ngejek aku."' },
                { speaker: 'NARRATOR', text: 'Beberapa teman tahu siapa pelakunya, tapi tidak ada yang berani bicara karena takut menjadi target berikutnya.' },
              ],
              choicePrompt: 'Apa yang kamu lakukan?',
              choices: [
                {
                  icon: '🛑', label: 'Lapor dan dampingi korban', detail: 'Melaporkan ke guru/BK dan mendampingi teman yang menjadi korban',
                  good: true, pts: 20, level: 'good',
                  resultTitle: 'Pilihan Terbaik! 🌟',
                  resultBody: 'Melindungi hak orang lain dari pelanggaran juga adalah kewajibanmu sebagai warga negara!',
                  norma: 'Kewajiban: Menghormati HAM Orang Lain',
                  consequences: [
                    { icon: '✅', text: 'Korban merasa didukung dan berani melanjutkan sekolah' },
                    { icon: '✅', text: 'Pelaku mendapat konsekuensi — cyberbullying adalah pelanggaran hak' },
                    { icon: '✅', text: 'Kamu membuktikan bahwa melindungi hak orang lain adalah tanggung jawab bersama' },
                  ],
                  nextChapter: 3,
                },
                {
                  icon: '🤫', label: 'Diam, bukan urusanku', detail: 'Tidak ikut campur karena takut jadi target berikutnya',
                  good: false, pts: 2, level: 'bad',
                  resultTitle: 'Bahaya! ⚠️',
                  resultBody: 'Diam membiarkan pelanggaran hak terjadi. Kewajibanmu bukan hanya menjaga hakmu sendiri, tapi juga hak orang lain.',
                  norma: 'Melanggar Kewajiban: Tidak Melindungi HAM',
                  consequences: [
                    { icon: '❌', text: 'Korban makin terpuruk karena tidak ada yang membela' },
                    { icon: '❌', text: 'Pelaku makin berani karena tidak ada konsekuensi' },
                    { icon: '⚠️', text: 'Siapa pun bisa jadi korban berikutnya — termasuk kamu' },
                  ],
                  nextChapter: 3,
                },
                {
                  icon: '📱', label: 'Sebar balik foto pelaku', detail: 'Membalas dengan menyebarkan foto pelaku juga agar jera',
                  good: false, pts: 3, level: 'bad',
                  resultTitle: 'Salah Besar! ⚠️',
                  resultBody: 'Membalas pelanggaran hak dengan pelanggaran hak lainnya tidak menyelesaikan masalah — malah memperparah!',
                  norma: 'Melanggar HAM: Balas Dendam Bukan Keadilan',
                  consequences: [
                    { icon: '❌', text: 'Kamu juga menjadi pelaku cyberbullying — sama salahnya' },
                    { icon: '❌', text: 'Masalah makin runyam, dan kamu bisa kena sanksi juga' },
                    { icon: '💡', text: 'Lapor ke pihak berwenang — itu cara yang benar menegakkan keadilan' },
                  ],
                  nextChapter: 3,
                },
              ],
            },
          ],
        },
      ],
      nav: { prev: 's-tp', next: 's-materi1', nextLabel: 'Lanjut: Pengertian HAM' },
    },

    // ──────────────────────── MATERI 1: Pengertian HAM ────────────────────────
    {
      id: 's-materi1',
      templateType: 'materi',
      sectionLabel: '📖 Materi 1 · ±15 Menit',
      sectionColor: 'y',
      blocks: [
        {
          type: 'def-box',
          borderColor: 'y',
          content: '<strong>Hak Asasi Manusia (HAM)</strong> adalah hak dasar yang melekat pada diri setiap manusia sejak lahir, bersifat universal dan tidak dapat dicabut oleh siapa pun. HAM dijamin oleh <strong>UUD NRI 1945</strong>, <strong>UU No. 39/1999 tentang HAM</strong>, dan <strong>Deklarasi Universal HAM (UDHR) 1948</strong> PBB.',
        },
        {
          type: 'nc-grid',
          cards: [
            { icon: '🌍', title: 'Universal', body: 'Berlaku untuk semua manusia di dunia tanpa memandang suku, agama, ras, gender, atau status', color: 'y' },
            { icon: '🧬', title: 'Inherent', body: 'Melekat sejak lahir — bukan diberikan negara atau orang lain, tapi sudah menjadi milik setiap manusia', color: 'c' },
            { icon: '🔒', title: 'Inalienable', body: 'Tidak dapat dicabut atau dirampas oleh siapa pun — bahkan negara sekalipun tidak boleh menghapus HAM', color: 'g' },
            { icon: '🔗', title: 'Indivisible', body: 'Semua hak saling berkaitan — tidak bisa menikmati satu hak sambil merampas hak orang lain', color: 'p' },
          ],
        },
        {
          type: 'flashcard-set',
          cards: [
            { q: 'Apa yang dimaksud HAM?', a: 'Hak Asasi Manusia adalah hak dasar yang melekat pada diri setiap manusia sejak lahir, bersifat universal, dan tidak dapat dicabut.' },
            { q: 'Apa arti prinsip "universal" dalam HAM?', a: 'Berlaku untuk semua manusia di dunia tanpa memandang suku, agama, ras, gender, atau status ekonomi.' },
            { q: 'Sebutkan 2 instrumen hukum yang menjamin HAM di Indonesia!', a: 'UUD NRI 1945 dan UU No. 39 Tahun 1999 tentang Hak Asasi Manusia.' },
            { q: 'Kapan Deklarasi Universal HAM (UDHR) dideklarasikan PBB?', a: '10 Desember 1948 — setiap 10 Desember diperingati sebagai Hari HAM Internasional.' },
          ],
        },
        {
          type: 'diskusi',
          title: '✍️ Latihan Mandiri',
          questions: [
            { label: 'Latihan Mandiri', icon: '✍️', teks: 'Dengan kata-katamu sendiri, jelaskan mengapa HAM disebut "melekat sejak lahir" dan tidak bisa dicabut oleh negara!', petunjuk: 'Tuliskan di sini… (jawabanmu akan tampil lagi di Refleksi)', color: 'y' },
          ],
        },
      ],
      nav: { prev: 's-apersepsi', next: 's-materi2', nextLabel: 'Lanjut: Hak & Kewajiban UUD 1945' },
    },

    // ──────────────────────── MATERI 2: Hak & Kewajiban UUD 1945 ────────────────────────
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
              icon: '⚖️', label: 'Pasal 27',
              content: [
                { type: 'def-box', borderColor: 'y', content: '<strong>Pasal 27:</strong> (1) Segala warga negara bersamaan kedudukannya di dalam hukum dan pemerintahan. (2) Tiap-tiap warga negara berhak atas pekerjaan dan penghidupan yang layak.' },
                { type: 'nc-grid', cards: [
                  { icon: '⚖️', title: 'Kesetaraan Hukum', body: 'Kaya atau miskin, pejabat atau rakyat — semua sama di mata hukum', color: 'y' },
                  { icon: '💼', title: 'Hak Bekerja', body: 'Setiap warga negara berhak mendapat pekerjaan yang layak', color: 'y' },
                  { icon: '🏠', title: 'Hidup Layak', body: 'Setiap orang berhak atas penghidupan yang layak bagi kemanusiaan', color: 'y' },
                ] },
              ],
            },
            {
              icon: '🛡️', label: 'Pasal 28',
              content: [
                { type: 'def-box', borderColor: 'c', content: '<strong>Pasal 28:</strong> Kemerdekaan berserikat, berkumpul, dan mengeluarkan pendapat. Pasal 28A–J mengatur berbagai hak asasi secara rinci: hak hidup, hak pendidikan, hak beragama, dan hak atas perlindungan.' },
                { type: 'nc-grid', cards: [
                  { icon: '🗣️', title: 'Bebas Berpendapat', body: 'Setiap warga negara berhak mengeluarkan pendapat secara lisan maupun tulisan', color: 'c' },
                  { icon: '🤝', title: 'Bebas Berserikat', body: 'Berhak membentuk dan bergabung organisasi sesuai kepentingan', color: 'c' },
                  { icon: '📚', title: 'Hak Pendidikan', body: 'Setiap anak berhak mendapat pendidikan yang layak (Pasal 28C)', color: 'c' },
                ] },
              ],
            },
            {
              icon: '🙏', label: 'Pasal 29',
              content: [
                { type: 'def-box', borderColor: 'g', content: '<strong>Pasal 29:</strong> (1) Negara berdasarkan atas Ketuhanan Yang Maha Esa. (2) Negara menjamin kemerdekaan tiap-tiap penduduk untuk memeluk agamanya masing-masing dan beribadat menurut agamanya dan kepercayaannya itu.' },
                { type: 'nc-grid', cards: [
                  { icon: '🕌', title: 'Bebas Beragama', body: 'Setiap orang berhak memeluk agama dan beribadah menurut keyakinannya', color: 'g' },
                  { icon: '🛡️', title: 'Negara Melindungi', body: 'Negara wajib menjamin kebebasan beragama semua pemeluk', color: 'g' },
                  { icon: '🤝', title: 'Toleransi', body: 'Tidak boleh memaksakan agama kepada orang lain', color: 'g' },
                ] },
              ],
            },
            {
              icon: '🎓', label: 'Pasal 30-31',
              content: [
                { type: 'def-box', borderColor: 'p', content: '<strong>Pasal 30:</strong> Tiap-tiap warga negara berhak dan wajib ikut serta dalam usaha pertahanan dan keamanan negara. <strong>Pasal 31:</strong> (1) Setiap warga negara berhak mendapat pendidikan. (2) Pemerintah mengusahakan satu sistem pendidikan nasional.' },
                { type: 'nc-grid', cards: [
                  { icon: '🛡️', title: 'Bela Negara', body: 'Wajib ikut serta menjaga keamanan dan pertahanan NKRI', color: 'p' },
                  { icon: '🎓', title: 'Hak Pendidikan', body: 'Setiap warga negara berhak mendapat pendidikan yang layak', color: 'p' },
                  { icon: '📚', title: 'Wajib Belajar', body: 'Pemerintah wajib menyelenggarakan sistem pendidikan nasional', color: 'p' },
                ] },
              ],
            },
            {
              icon: '💰', label: 'Pasal 32-34',
              content: [
                { type: 'def-box', borderColor: 'r', content: '<strong>Pasal 32:</strong> Negara memajukan kebudayaan nasional. <strong>Pasal 33:</strong> Bumi, air, dan kekayaan alam dikuasai negara dan dipergunakan untuk sebesar-besar kemakmuran rakyat. <strong>Pasal 34:</strong> Fakir miskin dan anak terlantar dipelihara oleh negara.' },
                { type: 'nc-grid', cards: [
                  { icon: '🎭', title: 'Kebudayaan', body: 'Negara wajib memajukan kebudayaan nasional Indonesia', color: 'r' },
                  { icon: '💎', title: 'Sumber Daya Alam', body: 'Kekayaan alam dikelola untuk kemakmuran rakyat, bukan segelintir orang', color: 'r' },
                  { icon: '🤲', title: 'Kesejahteraan', body: 'Negara wajib memelihara fakir miskin dan anak terlantar', color: 'r' },
                ] },
              ],
            },
          ],
        },
        {
          type: 'def-box',
          borderColor: 'c',
          content: '<strong>💡 Ingat:</strong> Hak dan kewajiban selalu berpasangan. Setiap hak yang kamu miliki, ada kewajiban yang harus kamu jalankan. Hak atas pendidikan → kewajiban belajar. Hak atas perlindungan → kewajiban mematuhi hukum.',
        },
        {
          type: 'flashcard-set',
          cards: [
            { q: 'Apa isi UUD 1945 Pasal 27 ayat (1)?', a: 'Segala warga negara bersamaan kedudukannya di dalam hukum dan pemerintahan — semua setara di mata hukum.' },
            { q: 'Apa yang dijamin Pasal 28 tentang HAM?', a: 'Kemerdekaan berserikat, berkumpul, dan mengeluarkan pendapat, serta berbagai hak asasi rinci.' },
            { q: 'Apa hubungan antara hak dan kewajiban?', a: 'Setiap hak berpasangan dengan kewajiban. Hak atas pendidikan punya kewajiban belajar; hak perlindungan punya kewajiban patuh hukum.' },
            { q: 'Siapa yang dijamin oleh Pasal 34?', a: 'Fakir miskin dan anak terlantar dipelihara oleh negara — ini wujud keadilan sosial.' },
          ],
        },
        {
          type: 'diskusi',
          title: '💬 Diskusi Kelas (±5 menit)',
          questions: [
            { label: 'Diskusi Kelas', icon: '💬', teks: 'Sebutkan satu hak yang kamu nikmati sebagai siswa dan kewajiban apa yang harus kamu jalankan sebagai konsekuensinya!', petunjuk: 'Tuliskan pendapatmu di sini… (akan tampil di Refleksi)', color: 'c' },
          ],
        },
      ],
      nav: { prev: 's-materi1', next: 's-materi3', nextLabel: 'Lanjut: Pelanggaran Hak' },
    },

    // ──────────────────────── MATERI 3: Pelanggaran & Pengingkaran ────────────────────────
    {
      id: 's-materi3',
      templateType: 'materi',
      sectionLabel: '📖 Materi 3 · ±15 Menit',
      sectionColor: 'g',
      blocks: [
        {
          type: 'def-box',
          borderColor: 'g',
          content: '<strong>Pelanggaran hak</strong> adalah tidak terpenuhinya hak asasi seseorang akibat perbuatan atau kelalaian. <strong>Pengingkaran kewajiban</strong> adalah kegagalan memenuhi tanggung jawab yang seharusnya dilakukan, sehingga hak orang lain ikut terlanggar.',
        },
        {
          type: 'tabel-accord',
          rows: [
            { icon: '🏫', title: 'Perusakan Fasilitas Umum', color: 'y', details: [
              { label: 'Bentuk', value: 'Merusak tempat duduk, mencoret tembok, membuang sampah sembarangan' },
              { label: 'Hak yang Dilanggar', value: 'Hak semua warga atas fasilitas umum yang layak' },
              { label: 'Kewajiban Diingkari', value: 'Kewajiban menjaga fasilitas umum dan kebersihan' },
            ] },
            { icon: '💻', title: 'Cyberbullying', color: 'c', details: [
              { label: 'Bentuk', value: 'Menghina, mengancam, menyebarkan foto tanpa izin di media sosial' },
              { label: 'Hak yang Dilanggar', value: 'Hak privasi, hak atas kehormatan, dan hak rasa aman' },
              { label: 'Kewajiban Diingkari', value: 'Kewajiban menghormati harga diri dan hak privasi orang lain' },
            ] },
            { icon: '🚫', title: 'Diskriminasi', color: 'g', details: [
              { label: 'Bentuk', value: 'Menolak seseorang karena suku, agama, ras, atau gender' },
              { label: 'Hak yang Dilanggar', value: 'Hak atas kesetaraan (Pasal 27 UUD 1945)' },
              { label: 'Kewajiban Diingkari', value: 'Kewajiban memperlakukan semua orang secara adil' },
            ] },
            { icon: '😡', title: 'Intoleransi', color: 'p', details: [
              { label: 'Bentuk', value: 'Memaksakan keyakinan, menghina agama lain, melarang ibadah' },
              { label: 'Hak yang Dilanggar', value: 'Hak beragama dan beribadah (Pasal 29 UUD 1945)' },
              { label: 'Kewajiban Diingkari', value: 'Kewajiban menghormati kebebasan beragama orang lain' },
            ] },
            { icon: '📱', title: 'Penyebaran Hoaks', color: 'r', details: [
              { label: 'Bentuk', value: 'Membuat dan menyebarkan informasi palsu yang merugikan' },
              { label: 'Hak yang Dilanggar', value: 'Hak atas informasi yang benar dan hak reputasi' },
              { label: 'Kewajiban Diingkari', value: 'Kewajiban menyampaikan kebenaran dan tidak merugikan orang lain' },
            ] },
          ],
        },
        {
          type: 'nc-grid',
          cards: [
            { icon: '🏛️', title: 'Komnas HAM', body: 'Komisi Nasional Hak Asasi Manusia — menerima pengaduan pelanggaran HAM dan melakukan mediasi', color: 'g' },
            { icon: '👶', title: 'KPAI', body: 'Komisi Perlindungan Anak Indonesia — melindungi hak-hak anak dari segala bentuk kekerasan dan eksploitasi', color: 'c' },
            { icon: '🛡️', title: 'LPSK', body: 'Lembaga Perlindungan Saksi dan Korban — memberikan perlindungan bagi saksi dan korban tindak pidana', color: 'y' },
            { icon: '🔍', title: 'Metode ASIK', body: 'Analisis → Sesuaikan → Inisiatif → Kembangkan — langkah sistematis menyelesaikan kasus pelanggaran hak', color: 'p' },
          ],
        },
        {
          type: 'diskusi',
          title: '✍️ Latihan Mandiri',
          questions: [
            { label: 'Latihan Mandiri', icon: '✍️', teks: 'Pilih satu bentuk pelanggaran hak yang paling sering terjadi di lingkunganmu. Jelaskan hak apa yang dilanggar dan apa yang bisa kamu lakukan!', petunjuk: 'Tuliskan di sini… (jawabanmu akan tampil lagi di Refleksi)', color: 'g' },
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
          title: 'Pisahkan: Hak atau Kewajiban?',
          pool: [
            { id: 'h1', text: 'Mendapat pendidikan yang layak', category: 'hak' },
            { id: 'h2', text: 'Mematuhi hukum dan peraturan', category: 'kewajiban' },
            { id: 'h3', text: 'Mengeluarkan pendapat secara bebas', category: 'hak' },
            { id: 'h4', text: 'Ikut serta dalam usaha pertahanan negara', category: 'kewajiban' },
            { id: 'h5', text: 'Memeluk agama dan beribadah', category: 'hak' },
            { id: 'h6', text: 'Menghormati hak orang lain', category: 'kewajiban' },
            { id: 'h7', text: 'Mendapat pekerjaan yang layak', category: 'hak' },
            { id: 'h8', text: 'Menjaga kebersihan lingkungan', category: 'kewajiban' },
            { id: 'h9', text: 'Mendapat perlindungan hukum', category: 'hak' },
            { id: 'h10', text: 'Membayar pajak sesuai penghasilan', category: 'kewajiban' },
          ],
          kolom: [
            { id: 'hak', label: '🛡️ Hak', color: 'y' },
            { id: 'kewajiban', label: '📋 Kewajiban', color: 'c' },
          ],
        },
        {
          type: 'diskusi',
          title: '💬 Refleksi Game',
          questions: [
            { label: 'Refleksi', icon: '💭', teks: 'Dari game tadi, adakah yang menurutmu bisa sekaligus hak DAN kewajiban? Contohnya apa?', petunjuk: 'Tuliskan pendapatmu…', color: 'o' },
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
          title: 'Roda HAM & Kewajiban!',
          questions: [
            {
              q: 'Apa yang dimaksud dengan prinsip "inalienable" dalam HAM?',
              diskusiHint: 'Berhubungan dengan tidak bisa dirampas',
              opts: [
                { text: 'Berlaku untuk semua orang', correct: false },
                { text: 'Tidak dapat dicabut oleh siapa pun', correct: true },
                { text: 'Melekat sejak lahir', correct: false },
                { text: 'Semua hak saling berkaitan', correct: false },
              ],
              feedbackCorrect: 'Benar! Inalienable berarti hak asasi tidak dapat dicabut atau dirampas oleh siapa pun.',
              feedbackWrong: 'Inalienable berarti hak asasi tidak dapat dicabut atau dirampas oleh siapa pun — bahkan negara sekalipun.',
            },
            {
              q: 'Pasal berapa UUD 1945 yang menjamin kesetaraan di hadapan hukum?',
              diskusiHint: 'Pasal tentang kedudukan warga negara',
              opts: [
                { text: 'Pasal 28', correct: false },
                { text: 'Pasal 29', correct: false },
                { text: 'Pasal 27', correct: true },
                { text: 'Pasal 30', correct: false },
              ],
              feedbackCorrect: 'Benar! Pasal 27 ayat (1) menjamin kesamaan kedudukan semua warga negara di hadapan hukum.',
              feedbackWrong: 'Pasal 27 ayat (1) UUD 1945 menjamin segala warga negara bersamaan kedudukannya di dalam hukum.',
            },
            {
              q: 'Cyberbullying melanggar hak asasi mana?',
              diskusiHint: 'Hak yang berhubungan dengan kehormatan dan keamanan',
              opts: [
                { text: 'Hak atas pendidikan', correct: false },
                { text: 'Hak atas privasi dan kehormatan', correct: true },
                { text: 'Hak atas pekerjaan', correct: false },
                { text: 'Hak atas kepemilikan', correct: false },
              ],
              feedbackCorrect: 'Benar! Cyberbullying melanggar hak privasi, kehormatan, dan rasa aman seseorang.',
              feedbackWrong: 'Cyberbullying melanggar hak atas privasi dan kehormatan — menghina dan menyebarkan foto tanpa izin adalah pelanggaran HAM.',
            },
            {
              q: 'Kapan Hari HAM Internasional diperingati?',
              diskusiHint: 'Berkaitan dengan deklarasi UDHR oleh PBB',
              opts: [
                { text: '17 Agustus', correct: false },
                { text: '1 Juni', correct: false },
                { text: '10 Desember', correct: true },
                { text: '1 Januari', correct: false },
              ],
              feedbackCorrect: 'Benar! 10 Desember — tanggal Deklarasi Universal HAM (UDHR) oleh PBB tahun 1948.',
              feedbackWrong: 'Hari HAM Internasional diperingati setiap 10 Desember, bertepatan dengan Deklarasi Universal HAM PBB 1948.',
            },
            {
              q: 'Apa fungsi Komnas HAM?',
              diskusiHint: 'Lembaga yang menerima pengaduan pelanggaran HAM',
              opts: [
                { text: 'Menghukum pelaku HAM', correct: false },
                { text: 'Menerima pengaduan dan melakukan mediasi pelanggaran HAM', correct: true },
                { text: 'Membuat undang-undang HAM', correct: false },
                { text: 'Mengganti peran pengadilan', correct: false },
              ],
              feedbackCorrect: 'Benar! Komnas HAM menerima pengaduan pelanggaran HAM dan melakukan mediasi serta investigasi.',
              feedbackWrong: 'Komnas HAM berfungsi menerima pengaduan pelanggaran HAM, melakukan mediasi, dan investigasi — bukan menghukum.',
            },
            {
              q: 'Apa yang dimaksud pengingkaran kewajiban?',
              diskusiHint: 'Kebalikan dari menjalankan tanggung jawab',
              opts: [
                { text: 'Melaksanakan hak secara berlebihan', correct: false },
                { text: 'Kegagalan memenuhi tanggung jawab yang seharusnya dilakukan', correct: true },
                { text: 'Meminta hak tanpa batas', correct: false },
                { text: 'Melanggar hak orang lain secara sengaja', correct: false },
              ],
              feedbackCorrect: 'Benar! Pengingkaran kewajiban adalah kegagalan memenuhi tanggung jawab, sehingga hak orang lain terlanggar.',
              feedbackWrong: 'Pengingkaran kewajiban adalah kegagalan memenuhi tanggung jawab yang seharusnya dilakukan, berdampak pada hak orang lain.',
            },
            {
              q: 'UU No. 39 Tahun 1999 membahas tentang...',
              diskusiHint: 'Undang-undang khusus tentang hak dasar manusia',
              opts: [
                { text: 'Pemerintahan daerah', correct: false },
                { text: 'Sistem pendidikan nasional', correct: false },
                { text: 'Hak Asasi Manusia', correct: true },
                { text: 'Perlindungan anak', correct: false },
              ],
              feedbackCorrect: 'Benar! UU No. 39 Tahun 1999 adalah Undang-Undang tentang Hak Asasi Manusia.',
              feedbackWrong: 'UU No. 39 Tahun 1999 adalah Undang-Undang tentang Hak Asasi Manusia — instrumen hukum penting perlindungan HAM di Indonesia.',
            },
            {
              q: 'Pasal 34 UUD 1945 menjamin hak bagi...',
              diskusiHint: 'Kelompok yang paling membutuhkan perlindungan negara',
              opts: [
                { text: 'Pegawai negeri', correct: false },
                { text: 'Fakir miskin dan anak terlantar', correct: true },
                { text: 'Pengusaha besar', correct: false },
                { text: 'Anggota militer', correct: false },
              ],
              feedbackCorrect: 'Benar! Pasal 34 menegaskan fakir miskin dan anak terlantar dipelihara oleh negara.',
              feedbackWrong: 'Pasal 34 UUD 1945: "Fakir miskin dan anak terlantar dipelihara oleh negara" — wujud keadilan sosial.',
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
        { type: 'hasil', title: 'HAM & Kewajiban', subtitle: 'Pertemuan 1 Selesai! 🎉' },
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
            { teks: 'Hal baru apa yang kamu pelajari tentang HAM hari ini?', petunjuk: 'Tuliskan 1–2 hal yang benar-benar baru bagimu…', warna: 'y', icon: '🌟' },
            { teks: 'Sebutkan satu contoh di mana hakmu terpenuhi karena kamu menjalankan kewajibanmu!', petunjuk: 'Jelaskan hubungan hak dan kewajiban dengan contoh…', warna: 'c', icon: '🔍' },
            { teks: 'Satu komitmen nyata yang akan kamu lakukan untuk menegakkan hak orang lain:', petunjuk: 'Contoh: Saya akan berani menegur teman yang melakukan cyberbullying', warna: 'g', icon: '🤝' },
          ],
          penugasan: {
            judul: '📌 Penugasan: Kampanye Anti-Pelanggaran Hak',
            isi: 'Buat poster digital atau infografis tentang satu bentuk pelanggaran hak yang sering terjadi di lingkunganmu. Sertakan: bentuk pelanggaran, hak yang dilanggar, dan cara mengatasinya.',
            contoh: 'Contoh: Poster "Stop Cyberbullying" — hak privasi dilanggar, laporkan ke guru BK atau Komnas HAM.',
          },
        },
        {
          type: 'penutup',
          title: 'Sampai Jumpa!',
          subtitle: 'Pertemuan 2: Penegakan HAM',
          preview: [
            { icon: '🏛️', judul: 'Komnas HAM', isi: 'Peran dan kewenangan lembaga HAM', warna: 'g' },
            { icon: '⚖️', judul: 'Penegakan Hukum', isi: 'Cara melaporkan pelanggaran hak', warna: 'c' },
            { icon: '🤝', judul: 'Gotong Royong', isi: 'Bersama melindungi hak semua orang', warna: 'y' },
          ],
          nextPertemuan: {
            judul: 'Pertemuan 2: Penegakan HAM di Indonesia',
            deskripsi: 'Mendalami peran lembaga penegak HAM dan cara melindungi hak asasi di lingkungan sekitar.',
            items: [
              { icon: '🏛️', judul: 'Komnas HAM', isi: 'Fungsi dan kewenangan lembaga HAM nasional', warna: 'g' },
              { icon: '⚖️', judul: 'Penegakan Hukum', isi: 'Jalur hukum untuk melaporkan pelanggaran', warna: 'c' },
              { icon: '🤝', judul: 'Peran Siswa', isi: 'Apa yang bisa kamu lakukan', warna: 'y' },
            ],
          },
        },
      ],
      nav: { prev: 's-hasil' },
    },
  ],
};
