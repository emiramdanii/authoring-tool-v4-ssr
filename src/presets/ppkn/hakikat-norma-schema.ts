import type { LessonSchema } from '@/core/schema/types';

export const HAKIKAT_NORMA_LESSON: LessonSchema = {
  id: 'hakikat-norma',
  title: 'Hakikat Norma',
  mapel: 'PPKn',
  kelas: 'VII',
  themeId: 'hakikat-norma',
  navbar: {
    logoText: '🧑‍🤝‍🧑 Hakikat Norma',
    logoColor: 'y',
    progressGradient: ['y', 'c'],
  },
  screens: [
    // ──────────────────────── COVER ────────────────────────
    {
      id: 's-cover',
      templateType: 'cover',
      background: {
        type: 'radial',
        color1: 'y',
        color2: 'bg',
      },
      blocks: [
        {
          type: 'cover',
          icon: '🧑‍🤝‍🧑',
          title: 'Hakikat Norma',
          subtitle: 'Bab 3 — Pertemuan 1',
          badges: [
            { icon: '📋', text: 'TP 1', color: 'y' },
            { icon: '🎭', text: '4 Skenario', color: 'c' },
            { icon: '🎮', text: 'Game Fungsi Norma', color: 'g' },
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
            color1: 'y',
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
              body: 'Hadapi 4 situasi nyata. Setiap pilihan punya konsekuensi — temukan sendiri kaitannya dengan norma!',
            },
            {
              icon: '📖',
              title: 'Baca & Eksplorasi',
              body: 'Pelajari pengertian dan fungsi norma. Tandai tiap tab setelah dibaca agar tidak ada yang terlewat!',
            },
            {
              icon: '💬',
              title: 'Diskusi & Tulis',
              body: 'Jawab pertanyaan diskusi — jawabanmu otomatis tersimpan dan akan tampil lagi di Refleksi sebagai portofoliomu',
            },
            {
              icon: '🎮',
              title: 'Game Fungsi Norma',
              body: 'Uji pemahamanmu dengan 8 soal skenario. Setiap jawaban benar memberi penjelasan mendalam!',
            },
          ],
          tips: '💡 Ikuti alur dari awal sampai akhir. Jawab semua pertanyaan diskusi — jawabanmu akan muncul di Refleksi sebagai portofolio belajarmu hari ini!',
          tipsColor: 'y',
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
              desc: 'mengapa manusia disebut makhluk sosial (Zoon Politikon) dan bagaimana kebutuhan hidup bersama melahirkan norma',
              color: 'y',
            },
            {
              num: 2,
              verb: 'Mendefinisikan',
              desc: 'pengertian norma sebagai aturan yang mengikat dan berfungsi sebagai panduan, tatanan, serta pengendali tingkah laku',
              color: 'c',
            },
            {
              num: 3,
              verb: 'Mengidentifikasi',
              desc: 'fungsi-fungsi norma dalam kehidupan bermasyarakat: pedoman tingkah laku, ketertiban, perlindungan hak, solidaritas, dan keadilan',
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
              deskripsi: '4 Skenario Interaktif, hadapi situasi nyata & pilih tindakanmu',
            },
            {
              dot: 'c',
              durasi: '±15\'',
              judul: 'Diskusi',
              deskripsi: 'Manusia Makhluk Sosial, konsep Zoon Politikon & pertanyaan kelas',
            },
            {
              dot: 'y',
              durasi: '±15\'',
              judul: 'Materi 1',
              deskripsi: 'Pengertian Norma, definisi, analogi, kartu kilat ringkasan',
            },
            {
              dot: 'o',
              durasi: '±20\'',
              judul: 'Materi 2',
              deskripsi: 'Fungsi Norma, eksplorasi 5 fungsi + diskusi kelompok',
            },
            {
              dot: 'g',
              durasi: '±12\'',
              judul: 'Game',
              deskripsi: 'Uji pemahaman 8 soal skenario fungsi norma',
            },
            {
              dot: 'r',
              durasi: '±8\'',
              judul: 'Refleksi & Penutup',
              deskripsi: 'Portofolio jawaban diskusi + komitmen diri',
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
          title: 'Kamu yang Memilih!',
          chapters: [
            // ── Chapter 1: Perselisihan di Kampung ──
            {
              id: 'ch1',
              charEmoji: '😟',
              title: '🏘️ Perselisihan di Kampung',
              setup: [
                { speaker: 'NARRATOR', text: 'Pak Joko baru saja membangun pagar setinggi 3 meter yang menghalangi jalan setapak yang sudah dipakai warga selama puluhan tahun.' },
                { speaker: 'WARGA 😤', text: '"Jalan itu milik kita bersama! Pak Joko tidak boleh menutupnya begitu saja!"' },
                { speaker: 'PAK JOKO 😠', text: '"Tanah itu milik saya! Terserah saya mau bangun apa di sini."' },
                { speaker: 'NARRATOR', text: 'Kamu adalah Ketua RT yang dipercaya warga. Konflik ini perlu diselesaikan seadil mungkin.' },
              ],
              choicePrompt: 'Apa yang kamu lakukan sebagai Ketua RT?',
              choices: [
                {
                  icon: '🤝',
                  label: 'Adakan musyawarah warga',
                  detail: 'Undang Pak Joko dan warga untuk duduk bersama mencari solusi yang adil',
                  good: true,
                  pts: 20,
                  level: 'good',
                  resultTitle: 'Pilihan Terbaik! 🌟',
                  resultBody: 'Musyawarah adalah cara terbaik menyelesaikan konflik — inilah bukti norma berfungsi menciptakan ketertiban dan keadilan.',
                  norma: 'Fungsi Norma: Mencegah Konflik & Mewujudkan Keadilan',
                  consequences: [
                    { icon: '✅', text: 'Konflik bisa diselesaikan tanpa kekerasan dan semua pihak merasa didengar' },
                    { icon: '✅', text: 'Norma adat dan hukum dapat diterapkan bersama untuk menemukan solusi adil' },
                    { icon: '✅', text: 'Hubungan antarwarga tetap terjaga — itulah fungsi norma sebagai pemersatu' },
                  ],
                  nextChapter: 1,
                },
                {
                  icon: '⚖️',
                  label: 'Laporkan ke kelurahan',
                  detail: 'Bawa masalah ini ke aparat desa agar diselesaikan secara resmi',
                  good: true,
                  pts: 15,
                  level: 'good',
                  resultTitle: 'Langkah yang Tepat! 👍',
                  resultBody: 'Jalur hukum formal memastikan hak semua pihak terlindungi secara sah oleh negara.',
                  norma: 'Fungsi Norma Hukum: Perlindungan Hak',
                  consequences: [
                    { icon: '✅', text: 'Hak warga atas akses jalan dapat dilindungi secara hukum' },
                    { icon: '✅', text: 'Proses resmi memberi kepastian dan tidak bisa diabaikan' },
                    { icon: '💡', text: 'Idealnya coba musyawarah dulu — lebih cepat dan tetap menjaga hubungan warga' },
                  ],
                  nextChapter: 1,
                },
                {
                  icon: '😤',
                  label: 'Bela warga, paksa bongkar',
                  detail: 'Perintahkan warga untuk membongkar pagar secara paksa bersama-sama',
                  good: false,
                  pts: 0,
                  level: 'bad',
                  resultTitle: 'Pilihan Berbahaya! ⚠️',
                  resultBody: 'Tindakan main hakim sendiri justru melanggar norma — tidak ada masalah yang selesai dengan kekerasan.',
                  norma: 'Melanggar Norma Hukum & Norma Kesopanan',
                  consequences: [
                    { icon: '❌', text: 'Konflik semakin besar dan bisa berujung tindak pidana perusakan' },
                    { icon: '❌', text: 'Norma hukum dilanggar: pembongkaran paksa adalah tindakan melawan hukum' },
                    { icon: '❌', text: 'Fungsi norma sebagai penjaga ketertiban gagal karena kamu sendiri yang melanggar' },
                  ],
                  nextChapter: 1,
                },
              ],
            },
            // ── Chapter 2: Azan di Waktu Tidur ──
            {
              id: 'ch2',
              charEmoji: '😴',
              title: '🕌 Azan di Waktu Tidur',
              setup: [
                { speaker: 'NARRATOR', text: 'Subuh pukul 04.30. Suara azan berkumandang dari masjid depan rumah. Kamu baru tidur jam 02.00 karena tugas sekolah.' },
                { speaker: 'NARRATOR', text: 'Tetanggamu, Pak Budi yang non-muslim, mengetuk pintu. Wajahnya terlihat kesal.' },
                { speaker: 'PAK BUDI 😤', text: '"Bisa minta tolong minta masjidnya kecilkan volume? Itu mengganggu tidur kami setiap subuh!"' },
                { speaker: 'NARRATOR', text: 'Kamu tahu azan adalah kewajiban agama, tapi kamu juga menghormati tetangga yang berbeda keyakinan.' },
              ],
              choicePrompt: 'Bagaimana kamu merespons?',
              choices: [
                {
                  icon: '🤝',
                  label: 'Ajak bicara pengurus masjid',
                  detail: 'Sampaikan kekhawatiran Pak Budi kepada takmir masjid dengan sopan',
                  good: true,
                  pts: 20,
                  level: 'good',
                  resultTitle: 'Pilihan Terbaik! 🌟',
                  resultBody: 'Menjembatani dua kebutuhan dengan dialog — inilah fungsi norma menjaga solidaritas antarwarga yang berbeda.',
                  norma: 'Fungsi Norma: Solidaritas & Keadilan',
                  consequences: [
                    { icon: '✅', text: 'Hak beragama dan hak kenyamanan warga sama-sama dihormati' },
                    { icon: '✅', text: 'Fungsi norma sebagai pemersatu terwujud: perbedaan bukan penghalang hidup damai' },
                    { icon: '✅', text: 'Solusi bersama lebih langgeng dari sekadar memaksakan kehendak satu pihak' },
                  ],
                  nextChapter: 2,
                },
                {
                  icon: '🙏',
                  label: 'Maklumi, ini norma agama',
                  detail: 'Jelaskan kepada Pak Budi bahwa azan adalah kewajiban agama yang harus dihormati',
                  good: false,
                  pts: 7,
                  level: 'mid',
                  resultTitle: 'Kurang Lengkap 🤔',
                  resultBody: 'Menjelaskan norma agama itu benar, tapi mengabaikan perasaan tetangga bukan sikap yang bijak.',
                  norma: 'Norma Kesopanan kurang terjaga',
                  consequences: [
                    { icon: '🟡', text: 'Pak Budi mungkin menerima penjelasan, tapi merasa tidak dihiraukan' },
                    { icon: '⚠️', text: 'Hubungan bertetangga bisa renggang jika hanya melihat dari satu sudut pandang' },
                    { icon: '💡', text: 'Norma yang baik melindungi SEMUA pihak — bukan hanya satu kelompok saja' },
                  ],
                  nextChapter: 2,
                },
                {
                  icon: '📢',
                  label: 'Minta masjid matikan speaker',
                  detail: 'Langsung minta masjid mematikan pengeras suara agar Pak Budi tidak terganggu',
                  good: false,
                  pts: 3,
                  level: 'bad',
                  resultTitle: 'Kurang Tepat ⚠️',
                  resultBody: 'Meminta penghentian ibadah tanpa dialog tidak menghormati kebebasan beragama.',
                  norma: 'Melanggar Norma Agama & Kesopanan',
                  consequences: [
                    { icon: '❌', text: 'Kebebasan beragama dijamin UUD 1945 — tidak bisa begitu saja dibatasi' },
                    { icon: '❌', text: 'Norma agama dan norma hukum dilanggar sekaligus' },
                    { icon: '💡', text: 'Solusi terbaik harus menghormati hak semua pihak — dialog adalah kuncinya' },
                  ],
                  nextChapter: 2,
                },
              ],
            },
            // ── Chapter 3: Antrian di Pasar ──
            {
              id: 'ch3',
              charEmoji: '😐',
              title: '🛒 Antrian di Pasar',
              setup: [
                { speaker: 'NARRATOR', text: 'Kamu sedang membantu ibu berbelanja di pasar. Antrian kasir sangat panjang — kamu sudah 15 menit mengantri.' },
                { speaker: 'NARRATOR', text: 'Tiba-tiba seorang ibu tua dengan barang belanjaan yang banyak terhenti di depanmu. Dia terlihat lelah dan kesakitan.' },
                { speaker: 'IBU TUA 😓', text: '"Maaf dik, kaki saya sakit sekali. Boleh saya numpang antri di sini? Saya tidak kuat lama berdiri."' },
                { speaker: 'NARRATOR', text: 'Di belakangmu ada 10 orang yang juga sudah lama mengantri. Mereka memperhatikanmu.' },
              ],
              choicePrompt: 'Apa yang kamu lakukan?',
              choices: [
                {
                  icon: '😊',
                  label: 'Persilakan dengan senang hati',
                  detail: 'Persilakan ibu tua itu mengantri di depanmu karena ia membutuhkan bantuan',
                  good: true,
                  pts: 20,
                  level: 'good',
                  resultTitle: 'Pilihan Terbaik! 🌟',
                  resultBody: 'Mengutamakan yang membutuhkan adalah wujud solidaritas — salah satu fungsi norma yang paling mulia.',
                  norma: 'Fungsi Norma: Solidaritas & Norma Kesopanan',
                  consequences: [
                    { icon: '✅', text: 'Ibu tua mendapat pertolongan yang ia butuhkan' },
                    { icon: '✅', text: 'Kamu menunjukkan fungsi norma sebagai pemerkuat solidaritas dan kepedulian sosial' },
                    { icon: '🌟', text: 'Orang-orang di sekitarmu pun terinspirasi — kebaikan kecilmu berdampak besar' },
                  ],
                  nextChapter: 3,
                },
                {
                  icon: '🙅',
                  label: 'Tolak dengan sopan',
                  detail: 'Jelaskan bahwa kamu sudah lama mengantri dan orang di belakangmu juga menunggu',
                  good: false,
                  pts: 8,
                  level: 'mid',
                  resultTitle: 'Bisa Dimaklumi 🤔',
                  resultBody: 'Menolak itu hakmu, tapi memberi keringanan kepada yang membutuhkan adalah nilai yang lebih tinggi.',
                  norma: 'Norma Kesopanan',
                  consequences: [
                    { icon: '🟡', text: 'Norma antrian tetap terjaga, tapi nilai solidaritas terhadap sesama diabaikan' },
                    { icon: '⚠️', text: 'Kehidupan yang hanya berbasis aturan tanpa empati terasa dingin' },
                    { icon: '💡', text: 'Norma terbaik dijalankan dengan hati — bukan hanya dengan kepala' },
                  ],
                  nextChapter: 3,
                },
                {
                  icon: '🗣️',
                  label: 'Tanya pendapat yang antri',
                  detail: 'Tanya orang di belakangmu apakah mereka keberatan jika ibu tua ini masuk antrian',
                  good: true,
                  pts: 17,
                  level: 'good',
                  resultTitle: 'Pilihan Bijak! 👍',
                  resultBody: 'Melibatkan semua pihak sebelum memutuskan — inilah demokrasi dan keadilan dalam skala kecil!',
                  norma: 'Fungsi Norma: Solidaritas + Keadilan',
                  consequences: [
                    { icon: '✅', text: 'Semua pihak merasa dihargai pendapatnya' },
                    { icon: '✅', text: 'Solidaritas terbangun bersama — bukan hanya keputusan satu orang' },
                    { icon: '✅', text: 'Nilai gotong royong dan musyawarah tercermin dalam tindakan sederhana ini' },
                  ],
                  nextChapter: 3,
                },
              ],
            },
            // ── Chapter 4: Foto Tanpa Izin ──
            {
              id: 'ch4',
              charEmoji: '😳',
              title: '📱 Foto Tanpa Izin',
              setup: [
                { speaker: 'NARRATOR', text: 'Di kelas, teman sebangkumu diam-diam memfoto lembar jawabanmu saat ulangan berlangsung.' },
                { speaker: 'NARRATOR', text: 'Kamu menyadarinya. Guru sedang membelakangi kelas dan tidak ada yang melihat kejadian itu.' },
                { speaker: 'TEMAN 😅', text: '"Sst... jangan bilang siapa-siapa ya. Aku cuma lihat-lihat sebentar kok."' },
                { speaker: 'NARRATOR', text: 'Ini bukan hanya soal mencontek — tapi soal privasimu yang dilanggar tanpa izin.' },
              ],
              choicePrompt: 'Apa yang kamu lakukan?',
              choices: [
                {
                  icon: '🛑',
                  label: 'Tegur langsung dan minta hapus',
                  detail: 'Bisikkan: "Itu tidak boleh. Tolong hapus fotonya sekarang."',
                  good: true,
                  pts: 20,
                  level: 'good',
                  resultTitle: 'Pilihan Terbaik! 🌟',
                  resultBody: 'Menegur langsung melindungi hakmu sekaligus memberi kesempatan temanmu memperbaiki diri.',
                  norma: 'Norma Kesusilaan + Fungsi Norma: Perlindungan Hak',
                  consequences: [
                    { icon: '✅', text: 'Privasi dan hakmu terlindungi — norma berfungsi melindungi hak setiap individu' },
                    { icon: '✅', text: 'Kamu memberi temanmu kesempatan untuk sadar tanpa langsung dihukum' },
                    { icon: '✅', text: 'Norma kesusilaan ditegakkan: menghormati privasi orang lain adalah hak dasar manusia' },
                  ],
                  nextChapter: 4,
                },
                {
                  icon: '🤫',
                  label: 'Diam saja, tidak apa-apa',
                  detail: 'Pura-pura tidak melihat karena tidak mau ribut dan kasihan pada teman',
                  good: false,
                  pts: 3,
                  level: 'bad',
                  resultTitle: 'Kurang Tepat 😬',
                  resultBody: 'Diam bukan berarti damai. Membiarkan hakmu dilanggar melemahkan fungsi norma di lingkunganmu.',
                  norma: 'Hak pribadi diabaikan',
                  consequences: [
                    { icon: '❌', text: 'Pelanggaran privasi dibiarkan dan kemungkinan akan terulang' },
                    { icon: '❌', text: 'Fungsi norma sebagai pelindung hak tidak berjalan karena tidak ada yang menegakkannya' },
                    { icon: '⚠️', text: 'Foto jawabanmu bisa tersebar dan kalian berdua berpotensi mendapat masalah lebih besar' },
                  ],
                  nextChapter: 4,
                },
                {
                  icon: '👨‍🏫',
                  label: 'Lapor guru segera',
                  detail: 'Angkat tangan dan beritahu guru tentang apa yang terjadi barusan',
                  good: true,
                  pts: 15,
                  level: 'good',
                  resultTitle: 'Berani Melaporkan! 👍',
                  resultBody: 'Melibatkan guru adalah cara yang sah untuk menegakkan tata tertib sekolah dan melindungi hakmu.',
                  norma: 'Norma Hukum (Tata Tertib) + Perlindungan Hak',
                  consequences: [
                    { icon: '✅', text: 'Tata tertib sekolah ditegakkan oleh pihak yang berwenang' },
                    { icon: '✅', text: 'Hakmu atas privasi dilindungi secara formal' },
                    { icon: '💡', text: 'Cobalah menegur langsung dulu — memberi kesempatan temanmu memperbaiki diri sendiri' },
                  ],
                  nextChapter: 4,
                },
              ],
            },
          ],
        },
      ],
      nav: { prev: 's-tp', next: 's-diskusi1', nextLabel: 'Lanjut ke Diskusi' },
    },

    // ──────────────────────── DISKUSI 1 ────────────────────────
    {
      id: 's-diskusi1',
      templateType: 'diskusi',
      sectionLabel: '💬 Diskusi · ±15 Menit',
      sectionColor: 'c',
      blocks: [
        {
          type: 'def-box',
          borderColor: 'c',
          content: '<strong>Aristoteles (384–322 SM)</strong> menyebut manusia sebagai <strong><em>Zoon Politikon</em></strong> — makhluk yang selalu hidup berkelompok dan membutuhkan orang lain untuk memenuhi kebutuhannya.',
        },
        {
          type: 'nc-grid',
          cards: [
            {
              icon: '🍚',
              title: 'Kebutuhan Fisik',
              body: 'Kamu tidak menanam padi sendiri, menjahit baju sendiri, atau membangun rumah sendiri. Semua membutuhkan kerjasama.',
              color: 'y',
            },
            {
              icon: '❤️',
              title: 'Kebutuhan Emosional',
              body: 'Manusia butuh teman bicara, keluarga, sahabat. Kesepian berkepanjangan dapat merusak kesehatan jiwa dan raga.',
              color: 'c',
            },
            {
              icon: '📚',
              title: 'Kebutuhan Pengetahuan',
              body: 'Ilmu yang kamu pelajari hari ini adalah warisan ribuan orang. Tidak ada yang bisa belajar dari nol seorang diri.',
              color: 'g',
            },
            {
              icon: '🛡️',
              title: 'Kebutuhan Keamanan',
              body: 'Bersama lebih kuat. Masyarakat yang bersatu dapat saling melindungi dari ancaman yang tidak bisa dihadapi sendiri.',
              color: 'p',
            },
          ],
        },
        {
          type: 'diskusi',
          title: 'Manusia adalah Makhluk Sosial',
          intro: 'Mengapa kita tidak bisa hidup sendiri?',
          questions: [
            {
              label: 'Pertanyaan Diskusi Kelas',
              icon: '💬',
              teks: 'Bayangkan kamu tinggal di sebuah pulau bersama 30 orang yang tidak saling mengenal, tanpa pemimpin dan tanpa aturan sama sekali. Apa yang akan terjadi dalam 1 minggu pertama? Apa masalah yang paling pertama muncul?',
              petunjuk: 'Tuliskan pendapatmu di sini… (jawabanmu akan tampil lagi di Refleksi)',
              color: 'c',
            },
          ],
        },
      ],
      nav: { prev: 's-apersepsi', next: 's-materi1', nextLabel: 'Lanjut: Pengertian Norma' },
    },

    // ──────────────────────── MATERI 1 ────────────────────────
    {
      id: 's-materi1',
      templateType: 'materi',
      sectionLabel: '📖 Materi 1 · ±15 Menit',
      sectionColor: 'y',
      blocks: [
        {
          type: 'def-box',
          borderColor: 'y',
          content: '<strong>Norma</strong> adalah aturan atau ketentuan yang <em>mengikat</em> warga suatu kelompok masyarakat, dipakai sebagai <strong>panduan, tatanan, dan pengendali tingkah laku</strong> yang sesuai dan dapat diterima masyarakat.',
        },
        {
          type: 'nc-grid',
          cards: [
            {
              icon: '🔗',
              title: 'Mengikat',
              body: 'Berlaku wajib bagi semua anggota kelompok — tidak bisa dipilih untuk diikuti atau diabaikan sesuka hati',
              color: 'y',
            },
            {
              icon: '🗺️',
              title: 'Panduan',
              body: 'Memberi petunjuk: ini yang boleh, ini yang tidak boleh, ini yang harus dilakukan dalam situasi tertentu',
              color: 'c',
            },
            {
              icon: '⚙️',
              title: 'Tatanan',
              body: 'Menciptakan keteraturan sosial — setiap orang tahu perannya dan ada pola yang dapat diprediksi bersama',
              color: 'g',
            },
            {
              icon: '🎛️',
              title: 'Pengendali',
              body: 'Mengendalikan perilaku agar tidak merugikan orang lain — ada sanksi bagi yang melanggar',
              color: 'p',
            },
          ],
        },
        {
          type: 'flashcard-set',
          cards: [
            {
              q: 'Apa definisi norma menurut buku pelajaran?',
              a: 'Aturan atau ketentuan yang mengikat warga masyarakat, dipakai sebagai panduan, tatanan, dan pengendali tingkah laku.',
            },
            {
              q: 'Mengapa manusia disebut Zoon Politikon?',
              a: 'Karena manusia selalu hidup berkelompok dan tidak bisa memenuhi kebutuhannya seorang diri — ia selalu membutuhkan orang lain.',
            },
            {
              q: 'Sebutkan 4 kata kunci sifat norma!',
              a: 'Mengikat — Panduan — Tatanan — Pengendali. Keempatnya membuat norma efektif mengatur perilaku bersama.',
            },
            {
              q: 'Bagaimana proses lahirnya norma dalam masyarakat?',
              a: 'Manusia hidup bersama → timbul perbedaan kepentingan → muncul kebutuhan aturan → norma terbentuk dari adat, kesepakatan, agama, atau undang-undang.',
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
              teks: 'Dengan kata-katamu sendiri, jelaskan apa yang dimaksud norma dan mengapa norma dibutuhkan. Gunakan contoh dari kehidupan sehari-harimu!',
              petunjuk: 'Tuliskan di sini… (jawabanmu akan tampil lagi di Refleksi)',
              color: 'y',
            },
          ],
        },
      ],
      nav: { prev: 's-diskusi1', next: 's-materi2', nextLabel: 'Lanjut: Fungsi Norma' },
    },

    // ──────────────────────── MATERI 2 ────────────────────────
    {
      id: 's-materi2',
      templateType: 'materi',
      sectionLabel: '📖 Materi 2 · ±20 Menit',
      sectionColor: 'o',
      blocks: [
        {
          type: 'ftab',
          showReadMarker: true,
          showProgress: true,
          tabs: [
            // ── Tab 1: Pedoman ──
            {
              icon: '🗺️',
              label: 'Pedoman',
              content: [
                {
                  type: 'def-box',
                  borderColor: 'y',
                  content: 'Norma memberi petunjuk kepada setiap individu tentang cara bertindak yang baik dan benar dalam pergaulan sehari-hari.',
                },
                {
                  type: 'nc-grid',
                  cards: [
                    { icon: '→', title: 'Contoh 1', body: 'Norma sopan santun mengajarkan kita mengucapkan salam saat bertemu', color: 'y' },
                    { icon: '→', title: 'Contoh 2', body: 'Norma hukum lalu lintas memberi tahu kita harus berhenti saat lampu merah', color: 'y' },
                    { icon: '→', title: 'Contoh 3', body: 'Norma agama memandu kita untuk berdoa sebelum makan dan bekerja', color: 'y' },
                  ],
                },
              ],
            },
            // ── Tab 2: Ketertiban ──
            {
              icon: '🤝',
              label: 'Ketertiban',
              content: [
                {
                  type: 'def-box',
                  borderColor: 'c',
                  content: 'Norma mencegah kekacauan dan konflik. Dengan norma, setiap orang tahu apa yang boleh dan tidak boleh dilakukan sehingga kehidupan berjalan teratur.',
                },
                {
                  type: 'nc-grid',
                  cards: [
                    { icon: '→', title: 'Contoh 1', body: 'Norma antrian di kasir mencegah keributan dan memastikan semua dilayani adil', color: 'c' },
                    { icon: '→', title: 'Contoh 2', body: 'Peraturan sekolah membuat proses belajar-mengajar berlangsung kondusif', color: 'c' },
                    { icon: '→', title: 'Contoh 3', body: 'Aturan lalu lintas mencegah kecelakaan dan kemacetan di jalan raya', color: 'c' },
                  ],
                },
              ],
            },
            // ── Tab 3: Hak ──
            {
              icon: '🛡️',
              label: 'Hak',
              content: [
                {
                  type: 'def-box',
                  borderColor: 'r',
                  content: 'Norma menjamin setiap anggota masyarakat mendapatkan hak-haknya dan diperlakukan secara adil tanpa diskriminasi.',
                },
                {
                  type: 'nc-grid',
                  cards: [
                    { icon: '→', title: 'Contoh 1', body: 'Hukum melindungi hak milik — orang tidak boleh mencuri barang orang lain', color: 'r' },
                    { icon: '→', title: 'Contoh 2', body: 'Norma agama melindungi hak beribadah dari gangguan', color: 'r' },
                    { icon: '→', title: 'Contoh 3', body: 'Aturan sekolah melindungi setiap siswa dari perundungan (bullying)', color: 'r' },
                  ],
                },
              ],
            },
            // ── Tab 4: Solidaritas ──
            {
              icon: '💚',
              label: 'Solidaritas',
              content: [
                {
                  type: 'def-box',
                  borderColor: 'g',
                  content: 'Norma mempererat rasa kebersamaan, persatuan, dan kepedulian antaranggota masyarakat. Norma mengajarkan bahwa kita saling membutuhkan satu sama lain.',
                },
                {
                  type: 'nc-grid',
                  cards: [
                    { icon: '→', title: 'Contoh 1', body: 'Norma gotong royong mendorong warga saling membantu saat ada musibah', color: 'g' },
                    { icon: '→', title: 'Contoh 2', body: 'Norma saling menghormati memperkuat persatuan di tengah keberagaman', color: 'g' },
                    { icon: '→', title: 'Contoh 3', body: 'Tradisi saling mengunjungi saat hari raya mempererat tali silaturahmi', color: 'g' },
                  ],
                },
              ],
            },
            // ── Tab 5: Keadilan ──
            {
              icon: '⚖️',
              label: 'Keadilan',
              content: [
                {
                  type: 'def-box',
                  borderColor: 'p',
                  content: 'Norma memastikan setiap orang diperlakukan setara dan adil. Tidak ada yang boleh mendapat perlakuan berbeda hanya karena kekayaan, jabatan, atau kekuasaan.',
                },
                {
                  type: 'nc-grid',
                  cards: [
                    { icon: '→', title: 'Contoh 1', body: 'Hukum berlaku sama — kaya atau miskin, pejabat atau rakyat biasa', color: 'p' },
                    { icon: '→', title: 'Contoh 2', body: 'Norma antrian memastikan semua orang mendapat giliran yang sama', color: 'p' },
                    { icon: '→', title: 'Contoh 3', body: 'Penilaian di sekolah menggunakan kriteria yang sama untuk semua siswa', color: 'p' },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'def-box',
          borderColor: 'o',
          content: '<strong>💡 Ingat:</strong> Kelima fungsi norma saling berkaitan dan menguatkan. Norma yang ditaati bersama menciptakan masyarakat yang <strong>tertib, adil, aman, dan harmonis</strong>.',
        },
        {
          type: 'flashcard-set',
          cards: [
            {
              q: 'Apa fungsi norma sebagai pedoman tingkah laku?',
              a: 'Norma memberi petunjuk tentang cara bertindak yang baik dan benar dalam pergaulan — apa yang boleh, tidak boleh, dan harus dilakukan.',
            },
            {
              q: 'Bagaimana norma menciptakan ketertiban?',
              a: 'Norma mencegah kekacauan dan konflik sehingga setiap orang tahu batasnya dan kehidupan berjalan teratur dan dapat diprediksi.',
            },
            {
              q: 'Bagaimana norma melindungi hak warga?',
              a: 'Norma menjamin setiap anggota masyarakat mendapatkan haknya dan diperlakukan adil — tidak ada yang boleh merampas hak orang lain.',
            },
            {
              q: 'Apa hubungan norma dengan solidaritas?',
              a: 'Norma mempererat rasa kebersamaan dan kepedulian antaranggota masyarakat — mengajarkan bahwa kita saling membutuhkan satu sama lain.',
            },
            {
              q: 'Bagaimana norma mewujudkan keadilan?',
              a: 'Norma memastikan semua orang diperlakukan setara — kaya atau miskin, pejabat atau rakyat biasa, semua tunduk pada aturan yang sama.',
            },
          ],
        },
        {
          type: 'diskusi',
          title: '💬 Diskusi Kelompok (±5 menit)',
          questions: [
            {
              label: 'Diskusi Kelompok',
              icon: '💬',
              teks: 'Dari 5 fungsi norma yang kamu pelajari, fungsi mana yang paling terasa dalam kehidupanmu sehari-hari? Berikan satu contoh nyata dari pengalamanmu!',
              petunjuk: 'Tuliskan pendapat kelompokmu di sini… (akan tampil di Refleksi)',
              color: 'o',
            },
          ],
        },
      ],
      nav: { prev: 's-materi1', next: 's-game', nextLabel: 'Lanjut ke Game 🎮' },
    },

    // ──────────────────────── GAME ────────────────────────
    {
      id: 's-game',
      templateType: 'game',
      sectionLabel: '🎮 Game · ±12 Menit',
      sectionColor: 'g',
      blocks: [
        {
          type: 'kuis',
          title: 'Game Fungsi Norma!',
          questions: [
            {
              q: 'Di warung makan, seorang pelanggan mengambil makanan orang lain karena lapar. Fungsi norma apa yang tidak berjalan?',
              opts: ['Pedoman tingkah laku', 'Memperkuat solidaritas', 'Melindungi hak warga', 'Menciptakan ketertiban'],
              ans: 2,
              ex: 'Norma berfungsi melindungi hak milik setiap orang — makanan orang lain tidak boleh diambil tanpa izin.',
            },
            {
              q: 'Pak RT mengadakan kerja bakti setiap minggu. Warga antusias karena norma gotong royong sudah mengakar kuat. Ini fungsi norma sebagai...',
              opts: ['Pedoman tingkah laku', 'Memperkuat solidaritas', 'Mewujudkan keadilan', 'Melindungi hak warga'],
              ans: 1,
              ex: 'Gotong royong adalah contoh nyata norma yang mempererat solidaritas dan kebersamaan antarwarga.',
            },
            {
              q: 'Guru menilai hasil ujian semua siswa dengan rubrik yang sama, tidak pilih kasih. Ini mencerminkan fungsi norma...',
              opts: ['Menciptakan ketertiban', 'Memperkuat solidaritas', 'Melindungi hak warga', 'Mewujudkan keadilan'],
              ans: 3,
              ex: 'Penilaian adil tanpa diskriminasi adalah wujud fungsi norma mewujudkan keadilan bagi semua siswa.',
            },
            {
              q: 'Tata tertib sekolah membuat proses belajar-mengajar berlangsung kondusif dan tidak kacau. Ini fungsi norma...',
              opts: ['Mewujudkan keadilan', 'Menciptakan ketertiban', 'Memperkuat solidaritas', 'Melindungi hak warga'],
              ans: 1,
              ex: 'Tata tertib mencegah kekacauan sehingga proses belajar berjalan tertib — fungsi norma menciptakan ketertiban.',
            },
            {
              q: 'Seorang anak membantu tetangganya yang sakit karena norma kesopanan mengajarkan kepedulian. Fungsi norma yang paling menonjol?',
              opts: ['Mewujudkan keadilan', 'Menciptakan ketertiban', 'Memperkuat solidaritas', 'Melindungi hak warga'],
              ans: 2,
              ex: 'Membantu tetangga yang membutuhkan adalah wujud solidaritas — fungsi norma mempererat kebersamaan.',
            },
            {
              q: 'Warga negara wajib membayar pajak sesuai penghasilan masing-masing — yang lebih mampu membayar lebih. Ini fungsi norma...',
              opts: ['Pedoman tingkah laku', 'Menciptakan ketertiban', 'Mewujudkan keadilan', 'Memperkuat solidaritas'],
              ans: 2,
              ex: 'Pajak proporsional adalah wujud keadilan — setiap orang berkontribusi sesuai kemampuannya.',
            },
            {
              q: 'Norma "mengucap salam saat bertemu" mengajarkan cara berinteraksi yang baik. Ini fungsi norma sebagai...',
              opts: ['Pedoman tingkah laku', 'Menciptakan ketertiban', 'Melindungi hak warga', 'Mewujudkan keadilan'],
              ans: 0,
              ex: 'Norma salam adalah panduan bagaimana berperilaku dalam pergaulan — fungsi pedoman tingkah laku.',
            },
            {
              q: 'Hukum melarang seseorang masuk rumah orang lain tanpa izin, meski pintunya tidak terkunci. Fungsi norma yang paling utama?',
              opts: ['Memperkuat solidaritas', 'Menciptakan ketertiban', 'Melindungi hak warga', 'Pedoman tingkah laku'],
              ans: 2,
              ex: 'Larangan masuk tanpa izin melindungi hak privasi dan keamanan setiap orang di rumahnya sendiri.',
            },
          ],
        },
      ],
      nav: { prev: 's-materi2', next: 's-hasil', nextLabel: 'Lihat Hasil 🏆' },
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
          title: 'Pertemuan 1',
          subtitle: 'Selesai! 🎉',
        },
      ],
      nav: { prev: 's-game', next: 's-refleksi', nextLabel: 'Refleksi Diri 📝' },
    },

    // ──────────────────────── REFLEKSI ────────────────────────
    {
      id: 's-refleksi',
      templateType: 'refleksi',
      sectionLabel: '📝 Refleksi · ±8 Menit',
      sectionColor: 'p',
      blocks: [
        {
          type: 'refleksi',
          title: 'Refleksi Diri',
          intro: 'Jawaban jujurmu lebih berharga dari jawaban yang sempurna.',
          questions: [
            {
              teks: 'Hal baru apa yang kamu pelajari hari ini tentang norma?',
              petunjuk: 'Tuliskan 1–2 hal yang benar-benar baru bagimu…',
              warna: 'y',
              icon: '🌟',
            },
            {
              teks: 'Dari 5 fungsi norma, mana yang paling kamu rasakan manfaatnya di sekolah? Mengapa?',
              petunjuk: 'Jelaskan dengan contoh konkret…',
              warna: 'c',
              icon: '🔍',
            },
            {
              teks: 'Satu komitmen nyata yang akan kamu lakukan minggu ini sebagai wujud menghargai norma:',
              petunjuk: 'Contoh: Saya akan selalu mengantre dengan sabar di kantin dan tidak menyela antrian…',
              warna: 'g',
              icon: '💪',
            },
          ],
          penugasan: {
            judul: '📋 Penugasan untuk Pertemuan 2:',
            isi: 'Amati kehidupan di rumahmu selama 1 hari. Catat minimal 3 norma yang berlaku di keluargamu:',
            contoh: '| No | Norma | Contoh Perilaku | Sanksi jika Dilanggar |\n|----|---------|-----------------|-----------------------|\n| 1  | ...     | ...             | ...                   |',
          },
        },
      ],
      nav: { prev: 's-hasil', next: 's-penutup', nextLabel: 'Selesai ✅' },
    },

    // ──────────────────────── PENUTUP ────────────────────────
    {
      id: 's-penutup',
      templateType: 'penutup',
      background: {
        type: 'radial',
        color1: 'g',
        color2: 'bg',
      },
      blocks: [
        {
          type: 'penutup',
          title: 'Pertemuan 1',
          subtitle: 'Berhasil Diselesaikan!',
          preview: [
            {
              icon: '🧑‍🤝‍🧑',
              judul: 'Pertemuan 1',
              isi: 'Hakikat Norma',
              warna: 'g',
            },
            {
              icon: '🗂️',
              judul: 'Pertemuan 2',
              isi: 'Macam-Macam Norma',
              warna: 'c',
            },
            {
              icon: '🌟',
              judul: 'Pertemuan 3',
              isi: 'Perilaku Patuh',
              warna: 'muted',
            },
          ],
          nextPertemuan: {
            judul: '🗂️ Pertemuan 2 — Apa yang Akan Kamu Pelajari?',
            deskripsi: 'Kamu sudah paham apa itu norma dan mengapa norma penting. Sekarang saatnya mengenal 4 jenis norma yang mengatur kehidupanmu setiap hari!',
            items: [
              {
                icon: '🙏',
                judul: 'Norma Agama',
                isi: 'Bersumber dari Tuhan YME',
                warna: 'y',
              },
              {
                icon: '❤️',
                judul: 'Norma Kesusilaan',
                isi: 'Bersumber dari hati nurani',
                warna: 'r',
              },
              {
                icon: '🤝',
                judul: 'Norma Kesopanan',
                isi: 'Bersumber dari adat istiadat',
                warna: 'c',
              },
              {
                icon: '⚖️',
                judul: 'Norma Hukum',
                isi: 'Bersumber dari negara',
                warna: 'p',
              },
            ],
          },
        },
      ],
      nav: { prev: 's-refleksi' },
    },
  ],
};
