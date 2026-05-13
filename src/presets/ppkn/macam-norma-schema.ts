import type { LessonSchema, SchemaBlock } from '@/core/schema/types';

export const MACAM_NORMA_LESSON: LessonSchema = {
  id: 'macam-norma',
  version: 1,
  title: 'Macam-Macam Norma',
  mapel: 'PPKn',
  kelas: 'VII',
  themeId: 'macam-norma',
  navbar: {
    logoText: '⚖️ Macam Norma',
    logoColor: 'c',
    progressGradient: ['c', 'p'],
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
          icon: '🗂️',
          title: 'Macam-Macam Norma',
          subtitle: 'Bab 3 — Pertemuan 2',
          badges: [
            { icon: '🙏', text: 'Norma Agama', color: 'y' },
            { icon: '❤️', text: 'Norma Kesusilaan', color: 'r' },
            { icon: '🤝', text: 'Norma Kesopanan', color: 'c' },
            { icon: '⚖️', text: 'Norma Hukum', color: 'p' },
          ],
          meta: {
            durasi: '80 Menit',
            fase: 'Fase D',
            elemen: 'Pancasila · Bhinneka Tunggal Ika',
          },
          cta: {
            label: '▶ Lihat CP · TP · ATP',
            action: 's-cp',
          },
          background: {
            type: 'gradient',
            color1: 'c',
            color2: 'bg',
          },
        } as SchemaBlock,
      ],
      nav: { next: 's-cp', nextLabel: 'CP · TP · ATP' },
    },

    // ──────────────────────── PETUNJUK ────────────────────────
    {
      id: 's-petunjuk',
      templateType: 'petunjuk',
      sectionLabel: '📌 Petunjuk Penggunaan',
      sectionColor: 'c',
      blocks: [
        {
          type: 'petunjuk',
          title: 'Cara Belajar',
          titleHighlight: 'Hari Ini',
          items: [
            { icon: '📖', title: 'Baca & Pahami', body: 'Klik tab norma untuk membaca kartu detail. Tandai ✓ setelah selesai membaca setiap norma.' },
            { icon: '🎮', title: 'Mainkan Game', body: 'Sortir perilaku ke kolom norma yang tepat, lalu putar roda untuk menjawab pertanyaan pemantik.' },
            { icon: '💬', title: 'Diskusi Kelompok', body: 'Setiap game diikuti diskusi. Tulis jawaban kelompokmu di area yang tersedia.' },
            { icon: '📝', title: 'Refleksi & Portofolio', body: 'Tulis refleksi jujur di akhir pembelajaran. Semua jawaban tercatat sebagai portofoliomu.' },
          ],
          tips: 'Klik kartu norma satu per satu, jangan skip! Setiap kartu berisi contoh pelanggaran dan sanksi yang relevan dengan kehidupanmu sehari-hari.',
          tipsColor: 'c',
        },
      ],
      nav: { prev: 's-cover', next: 's-cp', nextLabel: 'CP · TP · ATP' },
    },

    // ──────────────────────── CP / TP / ATP ────────────────────────
    {
      id: 's-cp',
      templateType: 'cp',
      sectionLabel: '📋 Kurikulum Merdeka',
      sectionColor: 'p',
      blocks: [
        {
          type: 'ftab',
          showReadMarker: false,
          showProgress: false,
          tabs: [
            // ── Tab CP ──
            {
              icon: '📌',
              label: 'CP',
              content: [
                {
                  type: 'def-box',
                  borderColor: 'y',
                  content: '<strong>ELEMEN: PANCASILA</strong> — Peserta didik mampu <strong>memahami dan melaksanakan norma dan aturan</strong> yang berlaku, menganalisis pentingnya kepatuhan terhadap norma dalam kehidupan bermasyarakat, berbangsa, dan bernegara demi terwujudnya kehidupan yang tertib, aman, dan harmonis.',
                },
                {
                  type: 'def-box',
                  borderColor: 'c',
                  content: '<strong>ELEMEN: BHINNEKA TUNGGAL IKA</strong> — Peserta didik mampu mengidentifikasi keberagaman norma yang berlaku di masyarakat sebagai wujud kekayaan budaya bangsa Indonesia dan menunjukkan sikap <strong>toleran serta patuh terhadap norma bersama.</strong>',
                },
                {
                  type: 'nc-grid',
                  cards: [
                    {
                      icon: '📎',
                      title: 'Profil Pelajar Pancasila',
                      body: 'Beriman & Bertakwa · Berkebinekaan Global · Bergotong Royong · Bernalar Kritis',
                      color: 'g',
                    },
                  ],
                },
              ],
            },
            // ── Tab TP ──
            {
              icon: '🎯',
              label: 'TP',
              content: [
                {
                  type: 'tp',
                  title: 'Tujuan Pembelajaran',
                  titleHighlight: 'Bab 3',
                  items: [
                    {
                      num: 1,
                      verb: 'Menjelaskan',
                      desc: 'pengertian norma sebagai aturan yang mengikat warga masyarakat dan berfungsi sebagai pedoman tingkah laku dalam kehidupan bersama',
                      color: 'y',
                    },
                    {
                      num: 2,
                      verb: 'Mengidentifikasi',
                      desc: 'macam-macam norma (agama, kesusilaan, kesopanan, dan hukum) beserta sumber, sanksi, dan sifatnya masing-masing',
                      color: 'c',
                    },
                    {
                      num: 3,
                      verb: 'Menganalisis',
                      desc: 'pentingnya patuh terhadap norma dan dampak pelanggaran norma bagi diri sendiri, masyarakat, serta kehidupan berbangsa dan bernegara',
                      color: 'r',
                    },
                    {
                      num: 4,
                      verb: 'Memberikan contoh',
                      desc: 'penerapan norma di lingkungan keluarga, sekolah, dan masyarakat dalam kehidupan sehari-hari',
                      color: 'p',
                    },
                    {
                      num: 5,
                      verb: 'Menerapkan',
                      desc: 'perilaku patuh terhadap norma sebagai wujud kesadaran hukum dan tanggung jawab sebagai warga negara yang baik',
                      color: 'g',
                    },
                  ],
                },
                {
                  type: 'def-box',
                  borderColor: 'c',
                  content: '🎯 <strong>Fokus Pertemuan 2 ini:</strong> TP 2 (Mengidentifikasi 4 norma) & TP 3 (Menganalisis dampak pelanggaran norma)',
                },
              ],
            },
            // ── Tab ATP ──
            {
              icon: '🗓️',
              label: 'ATP',
              content: [
                {
                  type: 'nc-grid',
                  cards: [
                    {
                      icon: 'P–1',
                      title: 'Hakikat Norma',
                      body: 'TP 1 — Manusia makhluk sosial, pengertian & fungsi norma',
                      color: 'y',
                    },
                    {
                      icon: 'P–2',
                      title: 'Macam-Macam Norma',
                      body: 'TP 2, TP 3 — 4 jenis norma, sumber, sanksi + Game Sortir ← Kamu di sini',
                      color: 'c',
                    },
                    {
                      icon: 'P–3',
                      title: 'Perilaku Patuh',
                      body: 'TP 4, TP 5 — Penerapan di berbagai lingkungan + Kuis + Refleksi',
                      color: 'g',
                    },
                  ],
                },
                {
                  type: 'def-box',
                  borderColor: 'g',
                  content: '<strong>ATP Bab 3:</strong> 3 Pertemuan × 2 JP × 40 Menit = 80 Menit per pertemuan',
                },
              ],
            },
          ],
        },
      ],
      nav: { prev: 's-cover', next: 's-tp', nextLabel: 'Tujuan Hari Ini' },
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
              num: 2,
              verb: 'Mengidentifikasi',
              desc: 'macam-macam norma (agama, kesusilaan, kesopanan, dan hukum) beserta sumber, sanksi, dan sifatnya masing-masing',
              color: 'c',
            },
            {
              num: 3,
              verb: 'Menganalisis',
              desc: 'pentingnya patuh terhadap norma dan dampak pelanggaran norma bagi diri sendiri, masyarakat, serta kehidupan berbangsa dan bernegara',
              color: 'r',
            },
          ],
          profil: '🔗 Profil Pelajar Pancasila: Beriman & Bertakwa · Bernalar Kritis · Berkebinekaan Global · Bergotong Royong',
          profilColor: 'g',
        },
        {
          type: 'alur',
          title: '⏱️ Alur Kegiatan 80 Menit',
          totalDurasi: '80',
          steps: [
            {
              dot: 'y',
              durasi: '±5\'',
              judul: 'Review P1',
              deskripsi: 'Kumpulkan tugas, diskusi singkat norma keluarga',
            },
            {
              dot: 'c',
              durasi: '±25\'',
              judul: 'Eksplorasi 4 Norma',
              deskripsi: 'Kartu detail + tabel accordion + diskusi berpasangan',
            },
            {
              dot: 'g',
              durasi: '±15\'',
              judul: 'Game Sortir Norma',
              deskripsi: 'Diskusi kelompok, lalu sortir perilaku ke kolom yang tepat',
            },
            {
              dot: 'p',
              durasi: '±15\'',
              judul: 'Hubungan Antarnorma',
              deskripsi: 'Analisis kasus + diskusi konflik nilai',
            },
            {
              dot: 'o',
              durasi: '±12\'',
              judul: 'Game Roda Norma',
              deskripsi: 'Tiap soal ada pertanyaan pemantik kelompok sebelum dijawab',
            },
            {
              dot: 'r',
              durasi: '±8\'',
              judul: 'Refleksi & Penutup',
              deskripsi: 'Kartu kilat + portofolio + penugasan P3',
            },
          ],
        },
        {
          type: 'def-box',
          borderColor: 'y',
          content: '📋 <strong>Tugas P1 dikumpulkan sekarang!</strong> Tabel norma keluargamu akan digunakan sebagai bahan diskusi di layar berikutnya.',
        },
      ],
      nav: { prev: 's-cp', next: 's-review', nextLabel: 'Mulai' },
    },

    // ──────────────────────── REVIEW P1 ────────────────────────
    {
      id: 's-review',
      templateType: 'review',
      sectionLabel: '🔄 Review · ±5 Menit',
      sectionColor: 'y',
      blocks: [
        {
          type: 'nc-grid',
          cards: [
            {
              icon: '✅',
              title: 'Sudah dipelajari',
              body: '• Manusia = makhluk sosial\n• Norma = aturan mengikat\n• 5 fungsi norma',
              color: 'g',
            },
            {
              icon: '🎯',
              title: 'Hari ini',
              body: '• 4 jenis norma & sumbernya\n• Sanksi tiap norma\n• Hubungan antarnorma',
              color: 'c',
            },
          ],
        },
        {
          type: 'diskusi',
          title: 'Bahas Tugas P1 Bersama!',
          intro: 'Tunjukkan tabel norma keluargamu kepada anggota kelompok. Bandingkan:',
          questions: [
            {
              label: 'Diskusi Kelompok · ±3 Menit',
              icon: '👥',
              teks: '① Norma apa saja yang sama di setiap keluarga? ② Norma apa yang unik/berbeda? ③ Siapa yang sanksinya paling unik jika melanggar?',
              petunjuk: 'Tuliskan 1–2 temuan menarik dari perbandingan tabel norma keluarga kelompokmu…',
              color: 'g',
            },
          ],
        },
        {
          type: 'def-box',
          borderColor: 'y',
          content: '<strong>💡 Sambungan dari P1:</strong> Norma tidak hanya satu macam — ada norma dari Tuhan, dari hati nurani, dari kebiasaan masyarakat, dan dari negara. Masing-masing punya <strong>kekuatan</strong> dan <strong>sanksi</strong> yang berbeda!',
        },
      ],
      nav: { prev: 's-tp', next: 's-materi', nextLabel: 'Eksplorasi 4 Norma' },
    },

    // ──────────────────────── MATERI — 4 NORMA ────────────────────────
    {
      id: 's-materi',
      templateType: 'materi',
      sectionLabel: '📖 Eksplorasi · ±25 Menit',
      sectionColor: 'c',
      blocks: [
        {
          type: 'diskusi',
          title: 'Bagi Tugas Membaca!',
          intro: 'Bagi 4 kartu norma kepada anggota kelompok. Tiap orang/pasangan membaca 1 kartu secara mendalam, lalu jelaskan ke anggota lain. Setelah semua presentasi, diskusikan tabel perbandingan bersama!',
          questions: [
            {
              label: 'Cara Belajar Kelompok',
              icon: '📖',
              teks: 'Klik tiap kartu untuk melihat sumber, sifat, pelanggaran, dan sanksinya. Tandai ✓ setelah membaca!',
              petunjuk: '',
              color: 'y',
            },
          ],
          kelompok: [
            {
              icon: '📖',
              label: 'Cara Belajar Kelompok',
              judul: 'Bagi Tugas Membaca!',
              isi: 'Bagi 4 kartu norma kepada anggota kelompok. Tiap orang/pasangan membaca 1 kartu secara mendalam, lalu jelaskan ke anggota lain. Setelah semua presentasi, diskusikan tabel perbandingan bersama!',
              color: 'y',
            },
          ],
        },
        // ── 4 Norma Tabs with nk-card blocks ──
        {
          type: 'ftab',
          showReadMarker: true,
          showProgress: true,
          tabs: [
            // ── Tab: Norma Agama ──
            {
              icon: '🙏',
              label: 'Agama',
              content: [
                {
                  type: 'nk-card',
                  normaType: 'agama',
                  icon: '🙏',
                  title: 'Norma Agama',
                  label: 'NORMA AGAMA',
                  definition: '',
                  characteristics: [
                    {
                      label: '📌 Sumber',
                      value: 'Tuhan Yang Maha Esa melalui kitab suci (Al-Qur\'an, Injil, Weda, Tripitaka, Kitab Suci Khonghucu)',
                    },
                    {
                      label: '⚙️ Sifat',
                      value: 'Universal bagi pemeluknya; mengatur hubungan manusia dengan Tuhan (vertikal) dan sesama manusia (horizontal)',
                    },
                    {
                      label: '🎯 Tujuan',
                      value: 'Membentuk manusia beriman, berakhlak mulia, dan bertaqwa kepada Tuhan YME',
                    },
                  ],
                  sanksi: {
                    title: '⚠️ Sanksi Akhirat & Internal',
                    items: [
                      { dot: 'y', text: 'Dosa yang dipertanggungjawabkan di akhirat' },
                      { dot: 'y', text: 'Rasa bersalah dan gelisah secara batin' },
                      { dot: 'y', text: 'Dalam beberapa komunitas: sanksi sosial keagamaan' },
                    ],
                  },
                  contoh: '💡 <strong>Contoh nyata:</strong> Seorang pelajar jujur dalam ujian karena yakin Tuhan Maha Melihat, meskipun tidak ada pengawas.',
                  pelanggaran: {
                    title: '🚨 Contoh Pelanggaran Pelajar & Sanksinya',
                    items: [
                      { icon: '😒', text: 'Tidak salat meski sudah balig (bagi Muslim) — Sanksi: Dosa, rasa bersalah, ditegur keluarga' },
                      { icon: '🤥', text: 'Bersumpah palsu menggunakan nama Tuhan — Sanksi: Dosa besar dalam semua agama' },
                      { icon: '😤', text: 'Tidak menghormati orang tua (durhaka) — Sanksi: Dosa dan sanksi sosial keluarga' },
                    ],
                  },
                } as SchemaBlock,
              ],
            },
            // ── Tab: Norma Kesusilaan ──
            {
              icon: '❤️',
              label: 'Kesusilaan',
              content: [
                {
                  type: 'nk-card',
                  normaType: 'kesusilaan',
                  icon: '❤️',
                  title: 'Norma Kesusilaan',
                  label: 'NORMA KESUSILAAN',
                  definition: '',
                  characteristics: [
                    {
                      label: '📌 Sumber',
                      value: 'Hati nurani manusia — nilai baik-buruk yang dirasakan setiap orang secara naluriah',
                    },
                    {
                      label: '⚙️ Sifat',
                      value: 'Universal (berlaku di mana saja), tidak tertulis, tidak bisa dipaksakan dari luar diri',
                    },
                    {
                      label: '🎯 Tujuan',
                      value: 'Membentuk pribadi jujur, bertanggung jawab, dan menghargai sesama sebagai manusia',
                    },
                  ],
                  sanksi: {
                    title: '⚠️ Sanksi Internal (dari diri sendiri)',
                    items: [
                      { dot: 'r', text: 'Rasa bersalah yang terus menghantui' },
                      { dot: 'r', text: 'Rasa malu yang mendalam kepada diri sendiri' },
                      { dot: 'r', text: 'Dikucilkan lingkungan sosial karena dinilai tidak bermoral' },
                    ],
                  },
                  contoh: '💡 <strong>Contoh nyata:</strong> Siswa yang menemukan dompet terjatuh mengembalikannya bukan karena takut hukum, tapi karena hati nurani.',
                  pelanggaran: {
                    title: '🚨 Contoh Pelanggaran Pelajar & Sanksinya',
                    items: [
                      { icon: '📝', text: 'Menyontek saat ulangan meski tidak ketahuan — Sanksi: Rasa bersalah, tidak percaya diri' },
                      { icon: '🤫', text: 'Membohongi orang tua tentang nilai rapor — Sanksi: Gelisah dan rasa bersalah berkepanjangan' },
                      { icon: '📱', text: 'Menyebarkan foto teman tanpa izin di grup chat — Sanksi: Dikucilkan, reputasi rusak di lingkungan teman' },
                    ],
                  },
                } as SchemaBlock,
              ],
            },
            // ── Tab: Norma Kesopanan ──
            {
              icon: '🤝',
              label: 'Kesopanan',
              content: [
                {
                  type: 'nk-card',
                  normaType: 'kesopanan',
                  icon: '🤝',
                  title: 'Norma Kesopanan',
                  label: 'NORMA KESOPANAN',
                  definition: '',
                  characteristics: [
                    {
                      label: '📌 Sumber',
                      value: 'Adat istiadat dan kebiasaan yang berlaku dalam masyarakat secara turun-temurun',
                    },
                    {
                      label: '⚙️ Sifat',
                      value: 'Berbeda-beda antar daerah dan budaya, tidak tertulis, tapi sangat kuat pengaruhnya secara sosial',
                    },
                    {
                      label: '🎯 Tujuan',
                      value: 'Menciptakan kerukunan, kenyamanan, dan saling menghargai dalam pergaulan sehari-hari',
                    },
                  ],
                  sanksi: {
                    title: '⚠️ Sanksi Sosial (dari lingkungan)',
                    items: [
                      { dot: 'c', text: 'Ditegur atau diingatkan orang di sekitar' },
                      { dot: 'c', text: 'Dicela, dipergunjingkan, atau dijauhi' },
                      { dot: 'c', text: 'Dalam kasus berat: dikucilkan dari komunitas' },
                    ],
                  },
                  contoh: '💡 <strong>Contoh nyata:</strong> Di Jawa, orang yang melewati orang lebih tua harus membungkuk sambil berkata "permisi".',
                  pelanggaran: {
                    title: '🚨 Contoh Pelanggaran Pelajar & Sanksinya',
                    items: [
                      { icon: '🗣️', text: 'Memotong pembicaraan guru di kelas — Sanksi: Ditegur guru, dianggap tidak sopan' },
                      { icon: '😒', text: 'Tidak menyapa tetangga yang sudah menyapa duluan — Sanksi: Dianggap sombong, hubungan merenggang' },
                      { icon: '🎵', text: 'Memutar musik keras di perumahan tengah malam — Sanksi: Ditegur warga, diadukan ke ketua RT' },
                    ],
                  },
                } as SchemaBlock,
              ],
            },
            // ── Tab: Norma Hukum ──
            {
              icon: '⚖️',
              label: 'Hukum',
              content: [
                {
                  type: 'nk-card',
                  normaType: 'hukum',
                  icon: '⚖️',
                  title: 'Norma Hukum',
                  label: 'NORMA HUKUM',
                  definition: '',
                  characteristics: [
                    {
                      label: '📌 Sumber',
                      value: 'Negara / lembaga resmi berwenang (DPR, Presiden, Mahkamah Agung)',
                    },
                    {
                      label: '⚙️ Sifat',
                      value: 'Tertulis, tegas, berlaku bagi seluruh warga negara tanpa pengecualian, dan ada aparat penegak hukum',
                    },
                    {
                      label: '🎯 Tujuan',
                      value: 'Menjamin keadilan, ketertiban, dan keamanan masyarakat secara formal dan mengikat',
                    },
                  ],
                  sanksi: {
                    title: '⚠️ Sanksi Tegas dari Negara',
                    items: [
                      { dot: 'p', text: 'Denda sesuai ketentuan undang-undang' },
                      { dot: 'p', text: 'Hukuman penjara untuk pelanggaran serius' },
                      { dot: 'p', text: 'Pencabutan hak-hak tertentu oleh negara' },
                    ],
                  },
                  contoh: '💡 <strong>Contoh nyata:</strong> Siswa yang mencuri di toko dapat dilaporkan ke polisi dan diproses secara hukum.',
                  pelanggaran: {
                    title: '🚨 Contoh Pelanggaran Pelajar & Sanksinya',
                    items: [
                      { icon: '🏍️', text: 'Siswa SMP mengendarai motor tanpa SIM ke sekolah — Sanksi: Ditilang, motor disita, orang tua dipanggil' },
                      { icon: '💬', text: 'Menyebarkan berita bohong di media sosial — Sanksi: Bisa terjerat UU ITE, dipanggil polisi' },
                      { icon: '🚫', text: 'Buang sampah di sungai (ada perda larangan) — Sanksi: Denda sesuai peraturan daerah' },
                    ],
                  },
                } as SchemaBlock,
              ],
            },
          ],
        },
        // ── Tabel Accordion ──
        {
          type: 'tabel-accord',
          rows: [
            {
              icon: '🙏',
              title: 'Norma Agama',
              color: 'y',
              details: [
                { label: 'Sumber', value: 'Tuhan Yang Maha Esa melalui kitab suci' },
                { label: 'Sifat Sanksi', value: 'Sanksi Akhirat & Internal' },
                { label: 'Sanksi Utama', value: 'Dosa yang dipertanggungjawabkan di akhirat' },
                { label: 'Contoh Pelanggaran', value: 'Tidak salat meski sudah balig (bagi Muslim)' },
              ],
            },
            {
              icon: '❤️',
              title: 'Norma Kesusilaan',
              color: 'r',
              details: [
                { label: 'Sumber', value: 'Hati nurani manusia' },
                { label: 'Sifat Sanksi', value: 'Sanksi Internal (dari diri sendiri)' },
                { label: 'Sanksi Utama', value: 'Rasa bersalah yang terus menghantui' },
                { label: 'Contoh Pelanggaran', value: 'Menyontek saat ulangan meski tidak ketahuan' },
              ],
            },
            {
              icon: '🤝',
              title: 'Norma Kesopanan',
              color: 'c',
              details: [
                { label: 'Sumber', value: 'Adat istiadat dan kebiasaan masyarakat' },
                { label: 'Sifat Sanksi', value: 'Sanksi Sosial (dari lingkungan)' },
                { label: 'Sanksi Utama', value: 'Ditegur atau diingatkan orang di sekitar' },
                { label: 'Contoh Pelanggaran', value: 'Memotong pembicaraan guru di kelas' },
              ],
            },
            {
              icon: '⚖️',
              title: 'Norma Hukum',
              color: 'p',
              details: [
                { label: 'Sumber', value: 'Negara / lembaga resmi berwenang' },
                { label: 'Sifat Sanksi', value: 'Sanksi Tegas dari Negara' },
                { label: 'Sanksi Utama', value: 'Denda sesuai ketentuan undang-undang' },
                { label: 'Contoh Pelanggaran', value: 'Siswa SMP mengendarai motor tanpa SIM ke sekolah' },
              ],
            },
          ],
        },
        // ── Diskusi setelah membaca ──
        {
          type: 'diskusi',
          title: '📝 Catatan Diskusi Kelompok',
          intro: 'Setelah semua presentasi: Norma mana yang paling berbeda dari yang kamu bayangkan sebelumnya? Mengapa sanksinya berbeda antar norma?',
          questions: [
            {
              label: 'Diskusi Berpasangan · ±5 Menit',
              icon: '💬',
              teks: 'Setiap anggota menjelaskan kartu norma yang sudah dibacanya. Fokus pada: sumber, sanksi, dan 1 contoh pelanggaran paling menarik menurutmu.',
              petunjuk: 'Tuliskan jawaban bersama kelompokmu… (jawabanmu akan tampil lagi di Refleksi)',
              color: 'p',
            },
          ],
          kelompok: [
            {
              icon: '💬',
              label: 'Diskusi Berpasangan · ±5 Menit',
              judul: 'Presentasi Mini!',
              isi: 'Setiap anggota menjelaskan kartu norma yang sudah dibacanya. Fokus pada: sumber, sanksi, dan 1 contoh pelanggaran paling menarik menurutmu. Yang lain boleh bertanya!',
              color: 'p',
            },
          ],
        },
      ],
      nav: { prev: 's-review', next: 's-game1', nextLabel: 'Game Sortir Norma 🎮' },
    },

    // ──────────────────────── GAME SORTIR ────────────────────────
    {
      id: 's-game1',
      templateType: 'game',
      sectionLabel: '🎮 Game Sortir · ±15 Menit',
      sectionColor: 'g',
      blocks: [
        {
          type: 'sortir-game',
          title: 'Sortir Norma!',
          pool: [
            { id: 's1', text: 'Berdoa sebelum memulai aktivitas', category: 'agama' },
            { id: 's2', text: 'Mengembalikan uang kembalian lebih', category: 'kesusilaan' },
            { id: 's3', text: 'Membungkuk saat lewat orang lebih tua', category: 'kesopanan' },
            { id: 's4', text: 'Memakai helm saat berkendara motor', category: 'hukum' },
            { id: 's5', text: 'Merasa malu setelah berbohong kepada orang tua', category: 'kesusilaan' },
            { id: 's6', text: 'Mengucap salam saat masuk rumah orang lain', category: 'kesopanan' },
            { id: 's7', text: 'Membayar pajak tepat waktu', category: 'hukum' },
            { id: 's8', text: 'Berpuasa di bulan Ramadan', category: 'agama' },
            { id: 's9', text: 'Tidak menyontek meski tidak ada pengawas', category: 'kesusilaan' },
            { id: 's10', text: 'Antre tertib tanpa menyerobot', category: 'kesopanan' },
            { id: 's11', text: 'Tidak membuang sampah sembarangan', category: 'hukum' },
            { id: 's12', text: 'Membantu teman yang kesulitan tanpa pamrih', category: 'kesusilaan' },
          ],
          kolom: [
            { id: 'agama', label: '🙏 Agama', color: 'y' },
            { id: 'kesusilaan', label: '❤️ Kesusilaan', color: 'r' },
            { id: 'kesopanan', label: '🤝 Kesopanan', color: 'c' },
            { id: 'hukum', label: '⚖️ Hukum', color: 'p' },
          ],
        },
        {
          type: 'diskusi',
          title: 'Kartu mana yang paling membingungkan?',
          intro: 'Diskusikan bersama: ① Kartu apa yang sempat diperdebatkan kelompokmu? ② Mengapa satu perilaku bisa masuk beberapa norma sekaligus?',
          questions: [
            {
              label: 'Diskusi Pasca-Game · ±3 Menit',
              icon: '🤔',
              teks: 'Kartu apa yang sempat diperdebatkan kelompokmu? Mengapa satu perilaku bisa masuk beberapa norma sekaligus?',
              petunjuk: 'Diskusikan bersama kelompokmu…',
              color: 'g',
            },
          ],
        },
      ],
      nav: { prev: 's-materi', next: 's-hubungan', nextLabel: 'Lanjut ke Hubungan Norma' },
    },

    // ──────────────────────── HUBUNGAN ANTARNORMA ────────────────────────
    {
      id: 's-hubungan',
      templateType: 'materi',
      sectionLabel: '🔗 Materi · ±15 Menit',
      sectionColor: 'p',
      blocks: [
        // ── LANGKAH 1: Baca & Pahami ──
        {
          type: 'tabel-accord',
          rows: [
            {
              icon: '🙏➡️❤️',
              title: 'Agama → Kesusilaan',
              color: 'y',
              details: [
                { label: 'Penjelasan', value: 'Ajaran agama membentuk hati nurani seseorang. Seseorang yang taat beragama diajarkan untuk jujur, bertanggung jawab, dan menghormati sesama — semua itu adalah isi dari norma kesusilaan.' },
                { label: '💡 Contoh nyata', value: 'Ahmad rajin ibadah sejak kecil. Saat menemukan dompet di jalan, tanpa pikir panjang ia mengembalikannya — bukan karena takut hukum, tapi karena hati nuraninya terbentuk oleh ajaran agamanya.' },
              ],
            },
            {
              icon: '❤️➡️🤝',
              title: 'Kesusilaan → Kesopanan',
              color: 'r',
              details: [
                { label: 'Penjelasan', value: 'Hati nurani yang baik secara alami mendorong seseorang untuk berlaku sopan. Orang yang peduli perasaan orang lain (kesusilaan) akan menunjukkan itu lewat tutur kata dan perilaku yang sopan (kesopanan).' },
                { label: '💡 Contoh nyata', value: 'Siti yang berempati tinggi selalu mengucap "permisi" saat melewati orang, tidak memotong pembicaraan, dan berbicara pelan di tempat umum — bukan karena ada aturan tertulis, tapi karena kepeduliannya.' },
              ],
            },
            {
              icon: '🤝➡️⚖️',
              title: 'Kesopanan → Hukum',
              color: 'c',
              details: [
                { label: 'Penjelasan', value: 'Banyak aturan hukum lahir dari kebiasaan sosial (norma kesopanan) yang sudah lama diakui masyarakat. Kebiasaan yang dipandang penting akhirnya dikodifikasi menjadi undang-undang.' },
                { label: '💡 Contoh nyata', value: 'Kebiasaan antre yang sudah lama berlaku di masyarakat akhirnya diperkuat dalam peraturan pelayanan publik. Larangan buang sampah sembarangan, awalnya norma kesopanan, kini jadi perda dengan sanksi denda.' },
              ],
            },
            {
              icon: '🙏⬅️⚖️',
              title: 'Agama ↔ Hukum',
              color: 'p',
              details: [
                { label: 'Penjelasan', value: 'Di Indonesia, hukum dan agama saling memengaruhi. Nilai-nilai agama menginspirasi banyak produk hukum, sementara hukum memberi sanksi tegas bagi pelanggaran yang juga dilarang agama.' },
                { label: '💡 Contoh nyata', value: 'Larangan korupsi ada dalam hukum pidana (UU Tipikor) sekaligus dilarang tegas dalam semua agama sebagai pengkhianatan amanah. UU Perlindungan Anak juga sejalan dengan kewajiban agama menjaga generasi muda.' },
              ],
            },
          ],
        },
        // ── LANGKAH 2: Analisis Kasus ──
        {
          type: 'nc-grid',
          cards: [
            {
              icon: '😤',
              title: 'Pencurian di Kantin Sekolah',
              body: 'Seorang siswa mengambil bekal temannya dari tas tanpa izin.\nNorma yang dilanggar: ⚖️ Norma Hukum (pencurian), ❤️ Norma Kesusilaan (melanggar kejujuran), 🙏 Norma Agama (mencuri dilarang)',
              color: 'r',
            },
            {
              icon: '📱',
              title: 'Screenshot Chat Pribadi Disebarkan',
              body: 'Seorang siswa menyebarkan tangkapan layar chat pribadi temannya ke seluruh kelas tanpa izin.\nNorma yang dilanggar: ⚖️ Norma Hukum (UU ITE), ❤️ Norma Kesusilaan (tidak jujur), 🤝 Norma Kesopanan (mempermalukan)',
              color: 'o',
            },
            {
              icon: '🚌',
              title: 'Tidak Memberi Tempat di Angkot',
              body: 'Siswa SMP memenuhi kursi depan angkot, padahal ada ibu hamil berdiri kelelahan.\nNorma yang dilanggar: 🤝 Norma Kesopanan, ❤️ Norma Kesusilaan (kurang empati)',
              color: 'y',
            },
          ],
        },
        // ── LANGKAH 3: Diskusi Konflik Nilai ──
        {
          type: 'diskusi',
          title: 'Diskusi Kelompok — Konflik Nilai',
          intro: 'Deni tahu bahwa sahabatnya, Rian, menyontek saat ulangan. Guru bertanya kepada Deni: "Apakah ada yang menyontek?" Jika Deni jujur → Rian bisa diskors dan kehilangan beasiswa. Jika Deni diam → Deni membohongi guru.',
          questions: [
            {
              label: 'Norma yang saling tarik-menarik',
              icon: '⚡',
              teks: '❤️ Norma Kesusilaan: Hati nurani mengatakan jujur itu wajib, berbohong merusak integritas diri\n🙏 Norma Agama: Ajaran agama: amanah & jujur, namun juga mengajarkan kasih sayang kepada sesama\n🤝 Norma Kesopanan: Menjaga perasaan teman & tidak mempermalukan di depan umum\n⚖️ Norma Hukum: Tata tertib sekolah: wajib melaporkan kecurangan yang diketahui',
              petunjuk: 'Tulis Kesimpulan Bersama: norma mana yang paling tepat diprioritaskan Deni?',
              color: 'g',
            },
          ],
          kelompok: [
            {
              icon: '🗣️',
              label: 'Giliran Bicara',
              judul: 'Satu per Satu',
              isi: 'Masing-masing anggota mengambil giliran bicara. Gunakan kalimat starter atau tulis pendapatmu sendiri. Setelah semua selesai, sepakati bersama norma mana yang paling tepat diprioritaskan!',
              color: 'g',
            },
          ],
        },
      ],
      nav: { prev: 's-game1', next: 's-game2', nextLabel: 'Game Roda Norma 🎡' },
    },

    // ──────────────────────── GAME RODA NORMA ────────────────────────
    {
      id: 's-game2',
      templateType: 'game',
      sectionLabel: '🎡 Roda Norma · ±12 Menit',
      sectionColor: 'o',
      blocks: [
        {
          type: 'roda-game',
          title: 'Roda Norma!',
          questions: [
            {
              q: 'Ahmad tidak berdoa sebelum berangkat ke sekolah meski sudah diingatkan orang tua. Norma apa yang dilanggar?',
              diskusiHint: '💬 Diskusikan: Apakah tidak berdoa hanya masalah pribadi, atau mempengaruhi orang lain juga?',
              opts: [
                { text: 'Norma Agama', correct: true },
                { text: 'Norma Kesusilaan', correct: false },
                { text: 'Norma Kesopanan', correct: false },
                { text: 'Norma Hukum', correct: false },
              ],
              feedbackCorrect: 'Berdoa sebelum berangkat adalah ajaran agama — sanksinya bersifat internal dan akhirat, bukan dari negara.',
              feedbackWrong: 'Jawaban: Norma Agama — Berdoa sebelum berangkat adalah ajaran agama, sanksinya bersifat internal dan akhirat.',
            },
            {
              q: 'Dina menemukan bolpoin milik teman di lantai dan diam-diam menyimpannya. Sanksi yang paling mungkin ia rasakan?',
              diskusiHint: '💬 Diskusikan: Apa bedanya "tidak ketahuan" dengan "tidak melanggar norma"?',
              opts: [
                { text: 'Dipanggil guru BK', correct: false },
                { text: 'Rasa bersalah dan gelisah', correct: true },
                { text: 'Dikucilkan warga', correct: false },
                { text: 'Ditilang polisi', correct: false },
              ],
              feedbackCorrect: 'Norma kesusilaan berbasis hati nurani — pelanggarnya merasakan sanksi internal: rasa bersalah dan gelisah, bahkan jika tidak ketahuan.',
              feedbackWrong: 'Jawaban: Rasa bersalah dan gelisah — Norma kesusilaan berbasis hati nurani, sanksinya bersifat internal.',
            },
            {
              q: 'Roni menerobos antrian di kantin sekolah karena buru-buru. Norma yang paling langsung dilanggar?',
              diskusiHint: '💬 Diskusikan: Ada tidak peraturan tertulis tentang antrian? Kalau tidak ada, apakah itu bukan pelanggaran?',
              opts: [
                { text: 'Norma Hukum', correct: false },
                { text: 'Norma Agama', correct: false },
                { text: 'Norma Kesopanan', correct: true },
                { text: 'Norma Kesusilaan', correct: false },
              ],
              feedbackCorrect: 'Antri adalah norma kesopanan dari kebiasaan sosial. Tidak ada undang-undang tentang antrian, tapi sanksi sosialnya nyata.',
              feedbackWrong: 'Jawaban: Norma Kesopanan — Antri adalah norma kesopanan dari kebiasaan sosial, sanksinya bersifat sosial.',
            },
            {
              q: 'Siswa SMP mengendarai motor ke sekolah tanpa SIM dan ditilang polisi. Norma apa yang dilanggar?',
              diskusiHint: '💬 Diskusikan: Kalau tidak ada polisi, apakah tetap melanggar norma? Norma mana?',
              opts: [
                { text: 'Norma Agama', correct: false },
                { text: 'Norma Kesusilaan', correct: false },
                { text: 'Norma Kesopanan', correct: false },
                { text: 'Norma Hukum', correct: true },
              ],
              feedbackCorrect: 'Kewajiban SIM diatur UU No.22/2009 — norma hukum yang berlaku meski tidak ada yang melihat.',
              feedbackWrong: 'Jawaban: Norma Hukum — Kewajiban SIM diatur undang-undang, norma hukum berlaku meski tidak ada yang melihat.',
            },
            {
              q: 'Bu Siti selalu mengajarkan anaknya jujur karena "Allah Maha Melihat". Ini menunjukkan hubungan antara...',
              diskusiHint: '💬 Diskusikan: Apakah seseorang yang tidak beragama bisa jujur? Apa sumber kejujurannya kalau bukan agama?',
              opts: [
                { text: 'Norma Hukum membentuk perilaku', correct: false },
                { text: 'Norma Agama membentuk kesusilaan', correct: true },
                { text: 'Norma Kesopanan dari adat', correct: false },
                { text: 'Sanksi hukum yang menakutkan', correct: false },
              ],
              feedbackCorrect: 'Keyakinan agama membentuk hati nurani dan kesusilaan — salah satu hubungan antarnorma yang paling kuat.',
              feedbackWrong: 'Jawaban: Norma Agama membentuk kesusilaan — Keyakinan agama membentuk hati nurani dan kesusilaan.',
            },
            {
              q: 'Tono tidak menyontek meski ada kesempatan — bukan karena takut ketahuan guru, tapi karena merasa tidak benar. Ini norma...',
              diskusiHint: '💬 Diskusikan: Apa yang mendorong kalian tidak menyontek — takut ketahuan, atau ada alasan lain?',
              opts: [
                { text: 'Norma Hukum', correct: false },
                { text: 'Norma Agama', correct: false },
                { text: 'Norma Kesusilaan', correct: true },
                { text: 'Norma Kesopanan', correct: false },
              ],
              feedbackCorrect: 'Ketika seseorang tidak melakukan kesalahan karena hati nurani (bukan takut sanksi luar) — itulah norma kesusilaan.',
              feedbackWrong: 'Jawaban: Norma Kesusilaan — Ketika hati nurani yang mendorong, bukan takut sanksi luar, itulah norma kesusilaan.',
            },
            {
              q: 'Di upacara bendera, semua siswa wajib berdiri tegak dan tidak boleh bermain HP. Norma yang berlaku?',
              diskusiHint: '💬 Diskusikan: Kalau guru tidak melihat, apakah boleh main HP? Dari norma mana alasanmu?',
              opts: [
                { text: 'Norma Hukum (tata tertib sekolah)', correct: true },
                { text: 'Norma Agama Pancasila', correct: false },
                { text: 'Norma Kesusilaan pribadi', correct: false },
                { text: 'Norma Kesopanan adat Jawa', correct: false },
              ],
              feedbackCorrect: 'Tata tertib sekolah adalah norma hukum dalam lingkup sekolah — tertulis, wajib, ada sanksi resmi dari pihak sekolah.',
              feedbackWrong: 'Jawaban: Norma Hukum (tata tertib sekolah) — tertulis, wajib, ada sanksi resmi dari pihak sekolah.',
            },
            {
              q: 'Siswa yang lolos dari sanksi tata tertib (tidak terbukti curang) tetap dijauhi teman-temannya. Ini menunjukkan...',
              diskusiHint: '💬 Diskusikan: Apakah adil seseorang dihukum secara sosial padahal sudah "bebas" dari hukum formal?',
              opts: [
                { text: 'Norma hukum selalu berjalan sempurna', correct: false },
                { text: 'Sanksi sosial dan kesusilaan tetap berlaku', correct: true },
                { text: 'Norma agama tidak relevan', correct: false },
                { text: 'Teman-temannya salah menilai', correct: false },
              ],
              feedbackCorrect: 'Meski lolos dari hukum sekolah, pelanggar norma kesusilaan tetap menerima sanksi sosial. Bukti norma saling melengkapi!',
              feedbackWrong: 'Jawaban: Sanksi sosial dan kesusilaan tetap berlaku — Bukti norma saling melengkapi!',
            },
          ],
        },
      ],
      nav: { prev: 's-hubungan', next: 's-hasil', nextLabel: 'Lihat Hasil 🏆' },
    },

    // ──────────────────────── HASIL ────────────────────────
    {
      id: 's-hasil',
      templateType: 'hasil',
      sectionLabel: '🏆 Hasil',
      sectionColor: 'p',
      background: {
        type: 'radial',
        color1: 'p',
        color2: 'bg',
      },
      blocks: [
        {
          type: 'hasil',
          title: 'Pertemuan 2',
          subtitle: 'Selesai! 🎉',
        },
        {
          type: 'flashcard-set',
          cards: [
            {
              q: 'Sebutkan 4 jenis norma yang berlaku di masyarakat!',
              a: 'Norma Agama (dari Tuhan), Norma Kesusilaan (hati nurani), Norma Kesopanan (adat istiadat), dan Norma Hukum (negara).',
            },
            {
              q: 'Apa perbedaan sanksi norma kesusilaan dan norma hukum?',
              a: 'Sanksi kesusilaan bersifat internal — rasa bersalah dari diri sendiri. Sanksi hukum bersifat eksternal dan tegas — denda atau penjara dari negara.',
            },
            {
              q: 'Mengapa norma hukum dianggap paling kuat sanksinya?',
              a: 'Karena tertulis, tegas, berlaku untuk semua tanpa pengecualian, dan ada aparat penegak hukum yang memastikan sanksinya diterapkan.',
            },
            {
              q: 'Bagaimana hubungan antara norma agama dan norma kesusilaan?',
              a: 'Ajaran agama membentuk hati nurani. Orang taat beragama biasanya memiliki kesusilaan kuat karena keyakinannya mengajarkan nilai moral.',
            },
            {
              q: 'Bolehkah seseorang memilih norma mana yang diikuti?',
              a: 'Tidak. Semua norma mengikat seluruh anggota masyarakat. Melanggar satu norma tetap ada konsekuensinya — internal, sosial, atau hukum.',
            },
          ],
        },
      ],
      nav: { prev: 's-game2', next: 's-refleksi', nextLabel: 'Refleksi 📝' },
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
          intro: 'Jawaban jujur lebih berharga dari jawaban sempurna.',
          questions: [
            {
              teks: '🗂️ Dari 4 jenis norma, mana yang paling sering kamu patuhi setiap hari? Beri 1 contoh konkret!',
              petunjuk: 'Contoh: Norma kesopanan — saya selalu menyapa guru saat bertemu di lorong sekolah…',
              warna: 'c',
              icon: '🗂️',
            },
            {
              teks: '⚠️ Pernahkah kamu melihat pelanggaran norma di sekitarmu? Norma apa? Apa sanksi yang terjadi?',
              petunjuk: 'Ceritakan dengan jujur — tidak perlu menyebut nama orang…',
              warna: 'r',
              icon: '⚠️',
            },
            {
              teks: '💪 Komitmenmu: 1 tindakan nyata minggu ini berkaitan dengan salah satu dari 4 norma:',
              petunjuk: 'Contoh: Saya akan lebih berhati-hati menggunakan media sosial agar tidak melanggar norma kesusilaan…',
              warna: 'g',
              icon: '💪',
            },
          ],
          penugasan: {
            judul: '📋 Penugasan untuk Pertemuan 3:',
            isi: 'Cari 1 kasus pelanggaran norma di sekitarmu atau dari berita. Analisis menggunakan panduan:\n📰 Kasus: ______________________\n📌 Norma yang dilanggar: Agama / Kesusilaan / Kesopanan / Hukum\n⚠️ Sanksi yang diterima: ______________________\n💡 Pendapatmu: Apakah sanksinya sudah adil? Mengapa?',
            contoh: '🔸 Teman yang menyontek saat ulangan → norma kesusilaan + tata tertib sekolah\n🔸 Buang sampah sembarangan di jalan → norma kesopanan + perda setempat\n🔸 Kasus bullying di media sosial → norma kesusilaan + UU ITE\n🔸 Pengendara motor tanpa helm → norma hukum lalu lintas',
          },
        },
      ],
      nav: { prev: 's-hasil', next: 's-penutup', nextLabel: 'Selesai ✅' },
    },

    // ──────────────────────── PENUTUP ────────────────────────
    {
      id: 's-penutup',
      templateType: 'penutup',
      sectionLabel: '🎊 Penutup',
      sectionColor: 'p',
      background: {
        type: 'radial',
        color1: 'p',
        color2: 'bg',
      },
      blocks: [
        {
          type: 'penutup',
          title: 'Pertemuan 2',
          subtitle: 'Berhasil Diselesaikan!',
          preview: [
            {
              icon: '🧑‍🤝‍🧑',
              judul: 'Pertemuan 1',
              isi: '✅ Hakikat Norma',
              warna: 'g',
            },
            {
              icon: '🗂️',
              judul: 'Pertemuan 2',
              isi: '✅ Macam-Macam Norma',
              warna: 'p',
            },
            {
              icon: '🌟',
              judul: 'Pertemuan 3',
              isi: '→ Perilaku Patuh',
              warna: 'c',
            },
          ],
          nextPertemuan: {
            judul: '🌟 Pertemuan 3 — Perilaku Patuh terhadap Norma',
            deskripsi: 'Kamu sudah tahu norma apa saja yang ada. Sekarang: bagaimana caramu patuh pada norma di setiap lingkungan kehidupanmu?',
            items: [
              {
                icon: '🏠',
                judul: 'Patuh di Keluarga',
                isi: '',
                warna: 'g',
              },
              {
                icon: '🏫',
                judul: 'Patuh di Sekolah',
                isi: '',
                warna: 'y',
              },
              {
                icon: '🏘️',
                judul: 'Patuh di Masyarakat',
                isi: '',
                warna: 'c',
              },
              {
                icon: '🇮🇩',
                judul: 'Patuh sebagai Warga Negara',
                isi: '',
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
