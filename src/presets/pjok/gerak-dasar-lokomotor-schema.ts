import type { LessonSchema, SchemaBlock } from '@/core/schema/types';

export const GERAK_DASAR_LOKOMOTOR_LESSON: LessonSchema = {
  id: 'gerak-dasar-lokomotor',
  version: 1,
  title: 'Gerak Dasar Lokomotor',
  mapel: 'PJOK',
  kelas: 'IV',
  themeId: 'nilai-pancasila',
  navbar: {
    logoText: '🏃 Gerak Lokomotor',
    logoColor: 'g',
    progressGradient: ['g', 'c'],
  },
  screens: [
    // ──────────────────────── COVER ────────────────────────
    {
      id: 's-cover',
      templateType: 'cover',
      background: { type: 'radial', color1: 'g', color2: 'bg' },
      blocks: [
        {
          type: 'cover',
          icon: '🏃',
          title: 'Gerak Dasar Lokomotor',
          subtitle: 'PJOK Kelas IV SD — Pertemuan 1',
          badges: [
            { icon: '📋', text: 'TP 3', color: 'g' },
            { icon: '📖', text: '3 Materi', color: 'c' },
            { icon: '🎮', text: 'Kuis 5 Soal', color: 'y' },
            { icon: '📝', text: 'Refleksi', color: 'p' },
          ],
          meta: { durasi: '70 Menit', fase: 'Fase B', elemen: 'Gerak Dasar' },
          cta: { label: '▶ Mulai Pembelajaran', action: 's-petunjuk' },
          background: { type: 'gradient', color1: 'g', color2: 'bg' },
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
            { icon: '📖', title: 'Pelajari Materi', body: 'Baca dan pahami penjelasan tentang gerak dasar lokomotor: berjalan, berlari, dan melompat. Perhatikan teknik yang benar!' },
            { icon: '🤸', title: 'Amati & Praktikkan', body: 'Perhatikan ilustrasi gerakan dan coba praktikkan di tempat yang aman. Ikuti langkah-langkahnya dengan tepat!' },
            { icon: '💬', title: 'Diskusi & Tulis', body: 'Jawab pertanyaan diskusi — jawabanmu tersimpan dan tampil lagi di Refleksi sebagai portofolio belajarmu!' },
            { icon: '🎮', title: 'Kuis Interaktif', body: 'Uji pemahamanmu dengan 5 soal tentang gerak dasar lokomotor. Setiap jawaban benar memberi penjelasan mendalam!' },
          ],
          tips: '💡 Ikuti alur dari awal sampai akhir. Siapkan ruang yang cukup untuk mempraktikkan gerakan secara aman!',
          tipsColor: 'g',
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
            { num: 1, verb: 'Menjelaskan', desc: 'pengertian gerak dasar lokomotor dan membedakannya dengan gerak non-lokomotor serta manipulatif', color: 'y' },
            { num: 2, verb: 'Mendemonstrasikan', desc: 'gerakan berjalan, berlari, dan melompat dengan teknik yang benar sesuai tahapan kelas IV', color: 'c' },
            { num: 3, verb: 'Mengidentifikasi', desc: 'contoh penerapan gerak dasar lokomotor dalam permainan dan aktivitas sehari-hari', color: 'g' },
          ],
          profil: '🔗 Profil Pelajar Pancasila: Bergotong Royong · Mandiri · Bernalar Kritis',
          profilColor: 'g',
        },
        {
          type: 'alur',
          title: '⏱️ Alur Kegiatan 70 Menit',
          totalDurasi: '70',
          steps: [
            { dot: 'p', durasi: '±5\'', judul: 'Petunjuk & TP', deskripsi: 'Mengetahui tujuan dan cara menggunakan media' },
            { dot: 'y', durasi: '±15\'', judul: 'Materi 1', deskripsi: 'Pengertian gerak lokomotor & berjalan' },
            { dot: 'c', durasi: '±15\'', judul: 'Materi 2', deskripsi: 'Berlari dan melompat dengan teknik benar' },
            { dot: 'g', durasi: '±15\'', judul: 'Materi 3', deskripsi: 'Penerapan gerak lokomotor dalam permainan' },
            { dot: 'o', durasi: '±10\'', judul: 'Kuis', deskripsi: 'Uji pemahaman 5 soal gerak lokomotor' },
            { dot: 'r', durasi: '±10\'', judul: 'Refleksi', deskripsi: 'Portofolio + komitmen bergerak aktif' },
          ],
        },
      ],
      nav: { prev: 's-petunjuk', next: 's-materi1', nextLabel: 'Mulai Materi' },
    },

    // ──────────────────────── MATERI 1: Pengertian & Berjalan ────────────────────────
    {
      id: 's-materi1',
      templateType: 'materi',
      sectionLabel: '📖 Materi 1 · ±15 Menit',
      sectionColor: 'y',
      blocks: [
        {
          type: 'def-box',
          borderColor: 'y',
          content: '<strong>Gerak dasar lokomotor</strong> adalah gerakan tubuh yang ditandai dengan perpindahan tempat dari satu titik ke titik lain. Kata "lokomotor" berasal dari bahasa Latin <em>locus</em> (tempat) dan <em>motio</em> (gerak). Jadi, gerak lokomotor = gerak berpindah tempat! Contoh: berjalan, berlari, melompat, meluncur, dan merangkak.',
        },
        {
          type: 'nc-grid',
          cards: [
            { icon: '🚶', title: 'Berjalan', body: 'Gerak pindah tempat dengan selalu ada kaki menyentuh tanah. Satu kaki bertumpu, kaki lain melangkah — bergantian terus-menerus', color: 'y' },
            { icon: '🏃', title: 'Berlari', body: 'Gerak pindah tempat dengan saat tertentu kedua kaki tidak menyentuh tanah (melayang). Lebih cepat dari berjalan', color: 'c' },
            { icon: '🤾', title: 'Melompat', body: 'Gerak pindah tempat dengan tolakan satu atau dua kaki, melayang di udara, lalu mendarat. Lebih tinggi dari melangkah', color: 'g' },
            { icon: '🧎', title: 'Merangkak', body: 'Gerak pindah tempat dengan posisi tubuh mendekati lantai, menggunakan tangan dan lutut untuk bertumpu', color: 'p' },
          ],
        },
        {
          type: 'materi-blok',
          tipe: 'poin',
          judul: 'Teknik Berjalan yang Benar',
          icon: '🚶',
          warna: 'y',
          butir: [
            'Tegakkan badan, pandangan ke depan, tidak menunduk',
            'Ayunkan lengan secara wajar berlawanan dengan kaki (kaki kiri maju → tangan kanan maju)',
            'Mendaratkan telapak kaki dari tumit ke ujung jari kaki (heel-toe pattern)',
            'Langkah teratur, tidak terlalu lebar dan tidak terlalu sempit',
            'Pinggul stabil, tidak bergoyang berlebihan ke kiri-kanan',
          ],
        } as SchemaBlock,
        {
          type: 'flashcard-set',
          cards: [
            { q: 'Apa yang dimaksud gerak lokomotor?', a: 'Gerakan tubuh yang ditandai dengan perpindahan tempat dari satu titik ke titik lain, seperti berjalan, berlari, dan melompat.' },
            { q: 'Apa perbedaan utama berjalan dan berlari?', a: 'Saat berjalan selalu ada kaki yang menyentuh tanah, sedangkan saat berlari ada saat kedua kaki melayang di udara (tidak menyentuh tanah).' },
            { q: 'Bagaimana pola mendarat kaki yang benar saat berjalan?', a: 'Mendaratkan telapak kaki dari tumit ke ujung jari kaki (heel-toe pattern), bukan mendarat dengan telapak kaki sekaligus.' },
          ],
        },
        {
          type: 'diskusi',
          title: '✍️ Latihan Mandiri',
          questions: [
            { label: 'Latihan Mandiri', icon: '✍️', teks: 'Sebutkan 3 contoh gerak lokomotor yang sering kamu lakukan di sekolah! Apakah kamu sudah melakukannya dengan teknik yang benar?', petunjuk: 'Tuliskan di sini… (jawabanmu akan tampil lagi di Refleksi)', color: 'y' },
          ],
        },
      ],
      nav: { prev: 's-tp', next: 's-materi2', nextLabel: 'Lanjut: Berlari & Melompat' },
    },

    // ──────────────────────── MATERI 2: Berlari & Melompat ────────────────────────
    {
      id: 's-materi2',
      templateType: 'materi',
      sectionLabel: '📖 Materi 2 · ±15 Menit',
      sectionColor: 'c',
      blocks: [
        {
          type: 'materi-blok',
          tipe: 'poin',
          judul: 'Teknik Berlari yang Benar',
          icon: '🏃',
          warna: 'c',
          butir: [
            'Condongkan badan sedikit ke depan (sekitar 10–15°) dari pinggul',
            'Ayunkan lengan dengan siku ditekuk sekitar 90° — tangan bergerak dari pinggul ke dada',
            'Angkat lutut cukup tinggi (high knees) untuk langkah yang lebih efisien',
            'Mendarat dengan bagian tengah telapak kaki (midfoot), bukan tumit',
            'Tarik napas melalui hidung, hembuskan melalui mulut secara ritmis',
            'Jaga langkah tetap ringan dan elastis — jangan menghentak keras ke tanah',
          ],
        } as SchemaBlock,
        {
          type: 'materi-blok',
          tipe: 'poin',
          judul: 'Teknik Melompat yang Benar',
          icon: '🦘',
          warna: 'g',
          butir: [
            'Sikap awal: berdiri dengan kedua kaki sejajar, selebar bahu',
            'Ayunkan kedua lengan ke belakang sebagai persiapan tolakan',
            'Tolak dengan kedua kaki secara bersamaan, ayunkan lengan ke atas untuk menambah daya dorong',
            'Saat melayang: lutut ditarik ke dada, badan sedikit condong ke depan',
            'Mendarat dengan kedua kaki secara bersamaan, lutut ditekuk (dibuang) untuk meredam gaya',
            'Jaga keseimbangan setelah mendarat — badan tidak boleh jatuh ke depan atau belakang',
          ],
        } as SchemaBlock,
        {
          type: 'compare',
          title: 'Perbandingan Berjalan vs Berlari vs Melompat',
          kiri: {
            icon: '🚶',
            judul: 'Berjalan',
            isi: 'Selalu ada kaki bertumpu • Kecepatan rendah • Mendarat tumit ke ujung kaki • Tidak ada fase melayang',
          },
          kanan: {
            icon: '🏃',
            judul: 'Berlari',
            isi: 'Ada fase melayang • Kecepatan tinggi • Mendarat midfoot • Badan condong ke depan • Lutut diangkat tinggi',
          },
          accentColor: 'c',
        },
        {
          type: 'def-box',
          borderColor: 'g',
          content: '<strong>💡 Tips Keamanan:</strong> Selalu lakukan pemanasan sebelum berlari atau melompat! Pemanasan mengurangi risiko cedera otot dan sendi. Gunakan sepatu olahraga yang nyaman dan pastikan area berlari/lompat bebas dari halangan.',
        },
        {
          type: 'flashcard-set',
          cards: [
            { q: 'Mengapa saat berlari badan harus sedikit condong ke depan?', a: 'Agar titik berat badan berada di depan tumpuan, sehingga gerakan ke depan lebih efisien dan keseimbangan terjaga.' },
            { q: 'Mengapa lutut harus ditekuk saat mendarat dari melompat?', a: 'Untuk meredam gaya pendaratan (shock absorber). Jika lutut lurus, gaya pendaratan langsung ke sendi dan bisa menyebabkan cedera lutut.' },
            { q: 'Apa fungsi mengayunkan lengan saat berlari?', a: 'Menjaga keseimbangan tubuh dan menambah daya dorong ke depan, sehingga berlari lebih efisien.' },
          ],
        },
        {
          type: 'diskusi',
          title: '💬 Diskusi Kelas (±5 menit)',
          questions: [
            { label: 'Diskusi Kelas', icon: '💬', teks: 'Mengapa kita harus mendarat dengan lutut ditekuk setelah melompat? Apa yang terjadi jika kita mendarat dengan lutut lurus?', petunjuk: 'Tuliskan pendapatmu di sini… (akan tampil di Refleksi)', color: 'c' },
          ],
        },
      ],
      nav: { prev: 's-materi1', next: 's-materi3', nextLabel: 'Lanjut: Penerapan dalam Permainan' },
    },

    // ──────────────────────── MATERI 3: Penerapan ────────────────────────
    {
      id: 's-materi3',
      templateType: 'materi',
      sectionLabel: '📖 Materi 3 · ±15 Menit',
      sectionColor: 'g',
      blocks: [
        {
          type: 'nc-grid',
          cards: [
            { icon: '🏃‍♂️', title: 'Lari Estafet', body: 'Menggunakan gerak berlari + memberi/menerima tongkat estafet. Latihan koordinasi tangan-mata-kaki', color: 'y' },
            { icon: '🐸', title: 'Lompat Kodok', body: 'Melompat seperti kodok dari jongkok — kombinasi lokomotor + non-lokomotor. Melatih kekuatan kaki', color: 'c' },
            { icon: '🎯', title: 'Lompat Tali', body: 'Melompati tali yang diputar — menggabungkan timing melompat dengan ritme tali. Melatih kelentukan & kecepatan', color: 'g' },
            { icon: '🤹', title: 'Permainan Ular Naga', body: 'Berlari mengikuti barisan ular-ularan — latihan berlari dengan perubahan arah. Melatih kelincahan', color: 'p' },
          ],
        },
        {
          type: 'tabel-accord',
          rows: [
            { icon: '🚶', title: 'Berjalan dalam Kehidupan', color: 'y', details: [
              { label: 'Di Sekolah', value: 'Berjalan dari kelas ke lapangan, berjalan saat upacara, berjalan ke perpustakaan' },
              { label: 'Di Rumah', value: 'Berjalan dari kamar ke dapur, berjalan saat berbelanja, berjalan di taman' },
              { label: 'Dalam Olahraga', value: 'Jalan cepat (power walking), hiking, orienteering' },
            ] },
            { icon: '🏃', title: 'Berlari dalam Kehidupan', color: 'c', details: [
              { label: 'Di Sekolah', value: 'Lari saat olahraga, lari mengejar bola, lari saat permainan petak umpet' },
              { label: 'Di Rumah', value: 'Berlari saat bermain dengan teman, lari mengejar bis, lari pagi bersama keluarga' },
              { label: 'Dalam Olahraga', value: 'Sprint 100m, lari jarak menengah, maraton, lari halang rintang' },
            ] },
            { icon: '🦘', title: 'Melompat dalam Kehidupan', color: 'g', details: [
              { label: 'Di Sekolah', value: 'Melompat saat lompat jauh, melompat untuk menangkap bola, melompati parit kecil' },
              { label: 'Di Rumah', value: 'Melompat tali, melompat dari batu ke batu di sungai, melompat di trampolin' },
              { label: 'Dalam Olahraga', value: 'Lompat jauh, lompat tinggi, lompat galah, lompat kangkang' },
            ] },
          ],
        },
        {
          type: 'def-box',
          borderColor: 'g',
          content: '<strong>💡 Ingat:</strong> Gerak lokomotor bukan hanya ada di pelajaran PJOK! Kamu menggunakannya setiap hari — saat berjalan ke sekolah, berlari bermain dengan teman, atau melompat kecil karena gembira. Semakin baik teknikmu, semakin aman dan efisien gerakanmu!',
        },
        {
          type: 'diskusi',
          title: '✍️ Latihan Mandiri',
          questions: [
            { label: 'Latihan Mandiri', icon: '✍️', teks: 'Pilih satu permainan tradisional yang kamu sukai. Sebutkan gerak lokomotor mana yang digunakan saat bermain permainan tersebut!', petunjuk: 'Tuliskan di sini… (jawabanmu akan tampil lagi di Refleksi)', color: 'g' },
          ],
        },
      ],
      nav: { prev: 's-materi2', next: 's-kuis', nextLabel: 'Lanjut ke Kuis 🎮' },
    },

    // ──────────────────────── KUIS ────────────────────────
    {
      id: 's-kuis',
      templateType: 'game',
      sectionLabel: '🎮 Kuis · ±10 Menit',
      sectionColor: 'o',
      blocks: [
        {
          type: 'kuis',
          title: 'Kuis Gerak Lokomotor!',
          questions: [
            {
              q: 'Gerak lokomotor ditandai oleh...',
              opts: ['Gerakan tubuh tanpa berpindah tempat', 'Perpindahan tempat dari satu titik ke titik lain', 'Gerakan menggerakkan benda', 'Gerakan di tempat dengan tangan'],
              ans: 1,
              ex: 'Gerak lokomotor ditandai oleh perpindahan tempat dari satu titik ke titik lain. "Lokomotor" berasal dari locus (tempat) + motio (gerak).',
            },
            {
              q: 'Perbedaan utama berjalan dan berlari adalah...',
              opts: ['Berjalan lebih cepat dari berlari', 'Saat berlari ada fase melayang, berjalan tidak', 'Berlari menggunakan tangan, berjalan tidak', 'Berjalan hanya dilakukan orang dewasa'],
              ans: 1,
              ex: 'Saat berlari ada fase kedua kaki melayang di udara (tidak menyentuh tanah), sedangkan berjalan selalu ada minimal satu kaki yang bertumpu di tanah.',
            },
            {
              q: 'Saat melompat, lutut harus ditekuk saat mendarat agar...',
              opts: ['Terlihat bagus dan rapi', 'Dapat melompat lagi dengan cepat', 'Meredam gaya pendaratan dan mencegah cedera', 'Badan menjadi lebih tinggi'],
              ans: 2,
              ex: 'Lutut ditekuk saat mendarat berfungsi sebagai shock absorber untuk meredam gaya pendaratan. Jika lutut lurus, gaya langsung ke sendi dan bisa menyebabkan cedera.',
            },
            {
              q: 'Berikut yang BUKAN merupakan gerak lokomotor adalah...',
              opts: ['Berlari', 'Melompat', 'Mengayun lengan di tempat', 'Merangkak'],
              ans: 2,
              ex: 'Mengayun lengan di tempat adalah gerak non-lokomotor karena tidak ada perpindahan tempat. Berlari, melompat, dan merangkak semuanya melibatkan perpindahan.',
            },
            {
              q: 'Saat berjalan yang benar, kaki mendarat dengan pola...',
              opts: ['Ujung jari kaki ke tumit', 'Telapak kaki sekaligus', 'Tumit ke ujung jari kaki (heel-toe)', 'Bagian luar telapak kaki'],
              ans: 2,
              ex: 'Pola mendarat yang benar saat berjalan adalah heel-toe pattern: tumit mendarat lebih dulu, kemudian bergulir ke ujung jari kaki. Ini membuat berjalan lebih efisien dan aman.',
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
      background: { type: 'radial', color1: 'g', color2: 'bg' },
      blocks: [
        { type: 'hasil', title: 'Gerak Dasar Lokomotor', subtitle: 'Pertemuan 1 Selesai! 🎉' },
      ],
      nav: { prev: 's-kuis', next: 's-refleksi', nextLabel: 'Refleksi Diri 📝' },
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
            { teks: 'Hal baru apa yang kamu pelajari hari ini tentang gerak lokomotor?', petunjuk: 'Tuliskan 1–2 hal yang benar-benar baru bagimu…', warna: 'y', icon: '🌟' },
            { teks: 'Dari ketiga gerak lokomotor (berjalan, berlari, melompat), mana yang paling sering kamu lakukan? Apakah kamu sudah melakukannya dengan teknik yang benar?', petunjuk: 'Jelaskan dengan contoh…', warna: 'c', icon: '🔍' },
            { teks: 'Satu komitmen yang akan kamu lakukan untuk lebih aktif bergerak setiap hari:', petunjuk: 'Contoh: Saya akan berjalan kaki ke sekolah setiap hari minimal 3 kali seminggu', warna: 'g', icon: '🤝' },
          ],
          penugasan: {
            judul: '📌 Penugasan: Jurnal Gerak Lokomotor',
            isi: 'Selama 1 minggu, catat setiap aktivitas yang menggunakan gerak lokomotor. Tuliskan jenis gerakan, durasi, dan situasinya. Kamu akan mempresentasikannya di pertemuan berikutnya!',
            contoh: 'Contoh: Senin — Berlari mengejar bis sekolah (5 menit), Berjalan dari gerbang ke kelas (3 menit)',
          },
        },
        {
          type: 'penutup',
          title: 'Sampai Jumpa!',
          subtitle: 'Pertemuan 2: Gerak Non-Lokomotor',
          preview: [
            { icon: '🤸', judul: 'Pertemuan 2', isi: 'Gerak Non-Lokomotor', warna: 'g' },
            { icon: '🎯', judul: 'Pertemuan 3', isi: 'Gerak Manipulatif', warna: 'c' },
          ],
          nextPertemuan: {
            judul: 'Pertemuan 2: Gerak Dasar Non-Lokomotor',
            deskripsi: 'Kamu sudah paham gerak berpindah tempat. Sekarang saatnya mempelajari gerak di tempat — mengayun, memutar, dan menekuk!',
            items: [
              { icon: '🔄', judul: 'Mengayun', isi: 'Gerakan lengan dan kaki ke depan-belakang', warna: 'c' },
              { icon: '🌀', judul: 'Memutar', isi: 'Gerakan sendi memutar persendian', warna: 'y' },
              { icon: '↕️', judul: 'Menekuk', isi: 'Melenturkan dan menggerakkan sendi', warna: 'g' },
            ],
          },
        },
      ],
      nav: { prev: 's-hasil' },
    },
  ],
};
