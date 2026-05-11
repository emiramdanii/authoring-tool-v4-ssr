import type { LessonSchema } from '@/core/schema/types';

export const GLOBALISASI_LESSON: LessonSchema = {
  id: 'globalisasi',
  version: 1,
  title: 'Globalisasi & Pancasila',
  mapel: 'PPKn',
  kelas: 'IX',
  themeId: 'globalisasi',
  navbar: {
    logoText: '🌍 Globalisasi',
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
          icon: '🌍',
          title: 'Globalisasi & Pancasila',
          subtitle: 'Bab 6 — Pertemuan 1',
          badges: [
            { icon: '📋', text: 'TP 3', color: 'y' },
            { icon: '🎭', text: '3 Skenario', color: 'c' },
            { icon: '🎮', text: 'Kuis 10 Soal', color: 'g' },
            { icon: '📝', text: 'Refleksi', color: 'p' },
          ],
          meta: { durasi: '80 Menit', fase: 'Fase D', elemen: 'Bhinneka Tunggal Ika' },
          cta: { label: '▶ Mulai Pembelajaran', action: 's-petunjuk' },
          background: { type: 'gradient', color1: 'g', color2: 'bg' },
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
            { icon: '🎭', title: 'Skenario Interaktif', body: 'Hadapi 3 situasi tentang dampak globalisasi. Pilih tindakanmu dan temukan peran Pancasila sebagai filter!' },
            { icon: '📖', title: 'Baca & Eksplorasi', body: 'Pelajari pengertian globalisasi, dampak positif-negatifnya, dan bagaimana Pancasila menjadi pemandu.' },
            { icon: '💬', title: 'Diskusi & Tulis', body: 'Jawab pertanyaan diskusi — jawabanmu tersimpan dan tampil lagi di Refleksi.' },
            { icon: '🎮', title: 'Kuis Globalisasi', body: 'Uji pemahamanmu dengan 10 soal tentang globalisasi dan Pancasila!' },
          ],
          tips: '💡 Ikuti alur dari awal sampai akhir. Jawaban diskusimu akan muncul di Refleksi sebagai portofolio belajarmu!',
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
            { num: 1, verb: 'Menjelaskan', desc: 'pengertian globalisasi dan ciri-cirinya dalam kehidupan sehari-hari', color: 'y' },
            { num: 2, verb: 'Menganalisis', desc: 'dampak positif dan negatif globalisasi bagi bangsa Indonesia', color: 'c' },
            { num: 3, verb: 'Merumuskan', desc: 'peran Pancasila sebagai filter globalisasi agar Indonesia tetap menjaga identitasnya', color: 'g' },
          ],
          profil: '🔗 Profil Pelajar Pancasila: Berkebinekaan Global · Bernalar Kritis · Kreatif',
          profilColor: 'g',
        },
        {
          type: 'alur',
          title: '⏱️ Alur Kegiatan 80 Menit',
          totalDurasi: '80',
          steps: [
            { dot: 'p', durasi: '±10\'', judul: 'Apersepsi', deskripsi: '3 Skenario tentang globalisasi' },
            { dot: 'y', durasi: '±15\'', judul: 'Materi 1', deskripsi: 'Pengertian & ciri-ciri globalisasi' },
            { dot: 'c', durasi: '±15\'', judul: 'Materi 2', deskripsi: 'Dampak positif & negatif globalisasi' },
            { dot: 'g', durasi: '±15\'', judul: 'Materi 3', deskripsi: 'Pancasila sebagai filter globalisasi' },
            { dot: 'o', durasi: '±15\'', judul: 'Game', deskripsi: 'Kuis 10 soal globalisasi & Pancasila' },
            { dot: 'r', durasi: '±10\'', judul: 'Refleksi & Penutup', deskripsi: 'Portofolio + komitmen jadi warga global' },
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
          title: 'Globalisasi di Ambang Pintu!',
          chapters: [
            {
              id: 'ch1',
              charEmoji: '📱',
              title: '🎵 K-Pop vs Gamelan',
              setup: [
                { speaker: 'NARRATOR', text: 'Teman-temanmu sangat mengidolakan budaya K-Pop Korea. Mereka menganggap budaya Indonesia kuno dan membosankan.' },
                { speaker: 'TEMAN 😒', text: '"Gamelan? Wayang? Itu ketinggalan zaman lah! K-Pop jauh lebih keren dan modern!"' },
                { speaker: 'NARRATOR', text: 'Kamu menyukai K-Pop juga, tapi kamu tahu budaya Indonesia punya nilai tinggi yang diakui dunia.' },
              ],
              choicePrompt: 'Apa sikapmu?',
              choices: [
                {
                  icon: '🌍', label: 'Nikmati keduanya', detail: 'Menikmati K-Pop sambil tetap melestarikan budaya Indonesia — keduanya bisa berdampingan',
                  good: true, pts: 20, level: 'good',
                  resultTitle: 'Pilihan Terbaik! 🌟',
                  resultBody: 'Globalisasi bukan tentang mengganti budaya, tapi tentang menyerap yang baik sambil menjaga identitas!',
                  norma: 'Pancasila Filter: Serap yang Baik, Jaga Identitas',
                  consequences: [
                    { icon: '✅', text: 'Kamu menikmati hiburan global tanpa kehilangan jati diri' },
                    { icon: '✅', text: 'Budaya Indonesia tetap dihargai dan dilestarikan' },
                    { icon: '✅', text: 'Ini contoh Pancasila sebagai filter globalisasi — selektif, bukan anti-global' },
                  ],
                  nextChapter: 1,
                },
                {
                  icon: '🙅', label: 'Tinggalkan budaya Indonesia', detail: 'Mengikuti teman-teman dan menganggap budaya lokal ketinggalan zaman',
                  good: false, pts: 0, level: 'bad',
                  resultTitle: 'Bahaya! ⚠️',
                  resultBody: 'Meninggalkan budaya sendiri karena pengaruh asing adalah contoh negatif globalisasi — erosi identitas!',
                  norma: 'Dampak Negatif: Erosi Budaya Lokal',
                  consequences: [
                    { icon: '❌', text: 'Budaya Indonesia yang kaya terancam punah jika semua meninggalkannya' },
                    { icon: '❌', text: 'Kehilangan identitas = kehilangan jati diri sebagai bangsa' },
                    { icon: '⚠️', text: 'Bangsa yang tidak menghargai budayanya sendiri akan mudah terjajah secara budaya' },
                  ],
                  nextChapter: 1,
                },
                {
                  icon: '😠', label: 'Tolak semua budaya asing', detail: 'Menolak K-Pop dan semua budaya asing karena mengancam budaya lokal',
                  good: false, pts: 5, level: 'mid',
                  resultTitle: 'Terlalu Ekstrem 🤔',
                  resultBody: 'Menolak semua budaya asing juga tidak bijak. Globalisasi membawa banyak hal positif yang bisa dipelajari.',
                  norma: 'Anti-Global Bukan Solusi',
                  consequences: [
                    { icon: '🟡', text: 'Menolak semua budaya asing berarti menutup diri dari kemajuan' },
                    { icon: '⚠️', text: 'Pancasila bukan mengajarkan menolak, tapi menyaring — ambil yang baik, tolak yang buruk' },
                    { icon: '💡', text: 'Korea sendiri maju karena belajar dari budaya lain lalu mengembangkan identitasnya' },
                  ],
                  nextChapter: 1,
                },
              ],
            },
            {
              id: 'ch2',
              charEmoji: '🍔',
              title: '🍔 Cepat Saji vs Makanan Lokal',
              setup: [
                { speaker: 'NARRATOR', text: 'Restoran cepat saji internasional baru buka di dekat sekolahmu. Harganya murah dan rasanya disukai banyak orang.' },
                { speaker: 'NARRATOR', text: 'Pedagang makanan lokal di sekitar mulai kehilangan pelanggan. Ibu-ibu penjual pecel dan soto terlihat sedih.' },
                { speaker: 'IBU PENJUAL 😢', text: '"Dulu ramai, sekarang sepi. Anak-anak lebih suka burger daripada pecel."' },
              ],
              choicePrompt: 'Apa sikapmu?',
              choices: [
                {
                  icon: '⚖️', label: 'Seimbang: coba keduanya', detail: 'Kadang makan cepat saji, tapi rutin beli makanan lokal untuk mendukung pedagang kecil',
                  good: true, pts: 20, level: 'good',
                  resultTitle: 'Pilihan Terbaik! 🌟',
                  resultBody: 'Globalisasi membawa pilihan baru, tapi kita tetap harus mendukung ekonomi lokal — ini Sila ke-5 Keadilan Sosial!',
                  norma: 'Sila 5: Keadilan Sosial + Ekonomi Lokal',
                  consequences: [
                    { icon: '✅', text: 'Pedagang lokal tetap bisa mencari nafkah' },
                    { icon: '✅', text: 'Kamu menikmati pilihan global tanpa melukai ekonomi lokal' },
                    { icon: '✅', text: 'Ini bentuk nyata Keadilan Sosial — tidak membiarkan yang kecil tersisih' },
                  ],
                  nextChapter: 2,
                },
                {
                  icon: '🍔', label: 'Pindah ke cepat saji saja', detail: 'Lebih sering makan di restoran internasional karena lebih modern dan murah',
                  good: false, pts: 3, level: 'mid',
                  resultTitle: 'Kurang Bijak 🤔',
                  resultBody: 'Pilihan pribadi bukan salah, tapi jika semua berpindah, pedagang lokal akan gulung tikar.',
                  norma: 'Dampak Negatif: Mengancam Ekonomi Lokal',
                  consequences: [
                    { icon: '🟡', text: 'Pedagang lokal kehilangan penghasilan dan mungkin berhenti berjualan' },
                    { icon: '⚠️', text: 'Budaya kuliner Indonesia yang kaya bisa tergantikan' },
                    { icon: '💡', text: 'Setiap pembelian ke pedagang lokal adalah dukungan nyata untuk ekonomi kerakyatan' },
                  ],
                  nextChapter: 2,
                },
                {
                  icon: '🚫', label: 'Boikot semua cepat saji', detail: 'Menolak makan di restoran asing dan mengajak semua teman memboikot',
                  good: false, pts: 5, level: 'mid',
                  resultTitle: 'Terlalu Ekstrem 🤔',
                  resultBody: 'Boikot bukan solusi. Kompetisi sehat justru mendorong pedagang lokal meningkatkan kualitas.',
                  norma: 'Anti-Global Bukan Jawaban',
                  consequences: [
                    { icon: '🟡', text: 'Boikot tidak realistis dan bertentangan dengan ekonomi terbuka' },
                    { icon: '⚠️', text: 'Yang dibutuhkan adalah persaingan sehat, bukan penolakan buta' },
                    { icon: '💡', text: 'Dukung pedagang lokal dengan membeli, bukan dengan memusuhi pesaing' },
                  ],
                  nextChapter: 2,
                },
              ],
            },
            {
              id: 'ch3',
              charEmoji: '💻',
              title: '🤖 Tantangan Data & Identitas',
              setup: [
                { speaker: 'NARRATOR', text: 'Sebuah aplikasi asing menawarkan layanan gratis, tapi meminta akses ke semua datamu: lokasi, kontak, foto, dan bahkan mikrofon.' },
                { speaker: 'NARRATOR', text: 'Semua temanmu sudah menginstalnya karena fiturnya keren dan gratis.' },
                { speaker: 'TEMAN 📱', text: '"Wah aplikasinya asyik banget! Emangnya ada apa datanya dipakai? Yang penting gratis!"' },
              ],
              choicePrompt: 'Apa yang kamu lakukan?',
              choices: [
                {
                  icon: '🔍', label: 'Baca izin dan pertimbangkan', detail: 'Membaca syarat dan ketentuan, menolak izin berlebihan, dan hanya memberikan akses minimal',
                  good: true, pts: 20, level: 'good',
                  resultTitle: 'Pilihan Terbaik! 🌟',
                  resultBody: 'Melindungi data pribadi adalah hak asasi di era digital — kedaulatan data adalah kedaulatan bangsa!',
                  norma: 'Kedaulatan Data: Hak Asasi di Era Digital',
                  consequences: [
                    { icon: '✅', text: 'Datamu aman dari penyalahgunaan oleh pihak asing' },
                    { icon: '✅', text: 'Kamu menunjukkan contoh bijak menggunakan teknologi global' },
                    { icon: '✅', text: 'Pancasila melindungi hak privasi — termasuk di dunia digital' },
                  ],
                  nextChapter: 3,
                },
                {
                  icon: '📱', label: 'Instal langsung, abaikan izin', detail: 'Menginstal dan memberikan semua izin karena semua orang melakukannya',
                  good: false, pts: 0, level: 'bad',
                  resultTitle: 'Bahaya! ⚠️',
                  resultBody: 'Data pribadi yang jatuh ke tangan asing bisa membahayakan keamananmu dan bahkan kedaulatan negara!',
                  norma: 'Ancaman: Kedaulatan Data',
                  consequences: [
                    { icon: '❌', text: 'Datamu bisa disalahgunakan untuk penipuan, manipulasi, atau pengawasan' },
                    { icon: '❌', text: 'Secara masif, ini ancaman bagi kedaulatan data bangsa Indonesia' },
                    { icon: '⚠️', text: 'Gratis bukan berarti tanpa biaya — harganya adalah datamu' },
                  ],
                  nextChapter: 3,
                },
                {
                  icon: '🚫', label: 'Tolak, hapus semua aplikasi asing', detail: 'Menolak semua teknologi asing dan hanya pakai aplikasi lokal',
                  good: false, pts: 5, level: 'mid',
                  resultTitle: 'Terlalu Ekstrem 🤔',
                  resultBody: 'Menolak semua teknologi asing bukan solusi. Yang dibutuhkan adalah literasi digital, bukan penghindaran.',
                  norma: 'Buta Teknologi Bukan Jawaban',
                  consequences: [
                    { icon: '🟡', text: 'Kamu tertinggal dalam kemajuan teknologi' },
                    { icon: '⚠️', text: 'Yang dibutuhkan adalah kemampuan menyaring, bukan menolak semua' },
                    { icon: '💡', text: 'Pancasila mengajarkan selektif, bukan menutup diri — bijak menggunakan teknologi' },
                  ],
                  nextChapter: 3,
                },
              ],
            },
          ],
        },
      ],
      nav: { prev: 's-tp', next: 's-materi1', nextLabel: 'Lanjut: Pengertian Globalisasi' },
    },

    // ──────────────────────── MATERI 1: Pengertian ────────────────────────
    {
      id: 's-materi1',
      templateType: 'materi',
      sectionLabel: '📖 Materi 1 · ±15 Menit',
      sectionColor: 'y',
      blocks: [
        {
          type: 'def-box',
          borderColor: 'y',
          content: '<strong>Globalisasi</strong> adalah proses integrasi internasional yang terjadi karena pertukaran pandangan, produk, gagasan, dan aspek-aspek kebudayaan lainnya. Ditandai dengan <strong>borderless world</strong> (dunia tanpa batas) dimana informasi, barang, dan jasa bergerak bebas lintas negara.',
        },
        {
          type: 'nc-grid',
          cards: [
            { icon: '🌐', title: 'Internet & Sosmed', body: 'Informasi menyebar instan ke seluruh dunia. Satu postingan bisa dilihat miliaran orang dalam hitungan detik.', color: 'y' },
            { icon: '✈️', title: 'Transportasi', body: 'Perjalanan antarnegara makin mudah dan murah. Mobilitas manusia dan barang meningkat drastis.', color: 'c' },
            { icon: '💰', title: 'Perdagangan Bebas', body: 'Barang dan jasa dari seluruh dunia tersedia di mana saja. Investasi asing masuk ke berbagai negara.', color: 'g' },
            { icon: '🎭', title: 'Pertukaran Budaya', body: 'Film, musik, mode, dan makanan dari berbagai negara bercampur dan mempengaruhi satu sama lain.', color: 'p' },
          ],
        },
        {
          type: 'flashcard-set',
          cards: [
            { q: 'Apa yang dimaksud globalisasi?', a: 'Proses integrasi internasional melalui pertukaran pandangan, produk, gagasan, dan aspek kebudayaan — ditandai dunia tanpa batas.' },
            { q: 'Sebutkan 3 ciri globalisasi!', a: 'Internet & media sosial, transportasi murah, dan perdagangan bebas lintas negara.' },
            { q: 'Apa arti "borderless world"?', a: 'Dunia tanpa batas — informasi, barang, dan jasa bergerak bebas lintas negara seolah tidak ada batas geografis.' },
            { q: 'Bagaimana internet mendorong globalisasi?', a: 'Informasi menyebar instan ke seluruh dunia, memungkinkan komunikasi dan kolaborasi lintas negara secara real-time.' },
          ],
        },
        {
          type: 'diskusi',
          title: '✍️ Latihan Mandiri',
          questions: [
            { label: 'Latihan Mandiri', icon: '✍️', teks: 'Sebutkan 3 contoh globalisasi yang kamu rasakan dalam kehidupan sehari-hari! Mana yang positif dan mana yang negatif?', petunjuk: 'Tuliskan di sini… (jawabanmu akan tampil lagi di Refleksi)', color: 'y' },
          ],
        },
      ],
      nav: { prev: 's-apersepsi', next: 's-materi2', nextLabel: 'Lanjut: Dampak Globalisasi' },
    },

    // ──────────────────────── MATERI 2: Dampak ────────────────────────
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
              icon: '✅', label: 'Dampak Positif',
              content: [
                { type: 'def-box', borderColor: 'g', content: 'Globalisasi membawa banyak <strong>manfaat</strong> jika kita mampu memanfaatkannya dengan bijak.' },
                { type: 'nc-grid', cards: [
                  { icon: '💻', title: 'Kemajuan Teknologi', body: 'Akses informasi dan teknologi terbaru yang meningkatkan produktivitas', color: 'g' },
                  { icon: '💰', title: 'Investasi Asing', body: 'Modal asing masuk menciptakan lapangan kerja dan mendorong pertumbuhan ekonomi', color: 'g' },
                  { icon: '🎭', title: 'Pertukaran Budaya', body: 'Belajar dari keunggulan budaya lain dan memperkaya wawasan', color: 'g' },
                  { icon: '📚', title: 'Pendidikan Global', body: 'Akses ke pengetahuan dunia melalui internet dan program beasiswa internasional', color: 'g' },
                ] },
              ],
            },
            {
              icon: '❌', label: 'Dampak Negatif',
              content: [
                { type: 'def-box', borderColor: 'r', content: 'Globalisasi juga membawa <strong>ancaman</strong> jika kita tidak waspada dan tidak memiliki filter yang kuat.' },
                { type: 'nc-grid', cards: [
                  { icon: '🎭', title: 'Erosi Budaya', body: 'Budaya lokal tergantikan oleh budaya asing yang lebih populer dan "modern"', color: 'r' },
                  { icon: '🔒', title: 'Kedaulatan Data', body: 'Data pribadi dan nasional berisiko jatuh ke tangan asing', color: 'r' },
                  { icon: '💭', title: 'Pengaruh Ideologi', body: 'Ideologi asing yang bertentangan dengan Pancasila masuk tanpa filter', color: 'r' },
                  { icon: '🛒', title: 'Ketergantungan Impor', body: 'Produk lokal tersisihkan karena kalah saing dengan produk asing yang murah', color: 'r' },
                ] },
              ],
            },
            {
              icon: '🇮🇩', label: 'Bonus Demografi',
              content: [
                { type: 'def-box', borderColor: 'y', content: 'Indonesia memiliki <strong>bonus demografi</strong> — mayoritas penduduk usia produktif. McKinsey memperkirakan Indonesia bisa menjadi ekonomi ke-7 dunia, TAPI hanya jika SDM-nya siap menghadapi globalisasi.' },
                { type: 'nc-grid', cards: [
                  { icon: '💪', title: 'Kekuatan', body: 'Letak strategis, SDM produktif, SDA melimpah, militer disegani, potensi ekonomi besar', color: 'y' },
                  { icon: '⚠️', title: 'Kelemahan', body: 'HCI rendah, pembangunan tidak merata, korupsi, rawan bencana, kesenjangan sosial', color: 'y' },
                  { icon: '🎯', title: 'Peluang', body: 'Jika SDM siap, bonus demografi bisa mengangkat Indonesia menjadi kekuatan ekonomi dunia', color: 'y' },
                ] },
              ],
            },
          ],
        },
        {
          type: 'def-box',
          borderColor: 'c',
          content: '<strong>💡 Kunci:</strong> Globalisasi tidak bisa dihindari, tapi dampaknya BISA dikendalikan. Pancasila adalah filter yang memastikan Indonesia menyerap yang baik dan menolak yang buruk.',
        },
        {
          type: 'flashcard-set',
          cards: [
            { q: 'Sebutkan 2 dampak positif globalisasi!', a: 'Kemajuan teknologi dan investasi asing yang menciptakan lapangan kerja.' },
            { q: 'Apa yang dimaksud erosi budaya?', a: 'Budaya lokal tergantikan oleh budaya asing yang lebih populer, sehingga identitas bangsa memudar.' },
            { q: 'Apa ancaman kedaulatan data?', a: 'Data pribadi dan nasional berisiko jatuh ke tangan asing melalui aplikasi dan platform digital.' },
            { q: 'Apa itu bonus demografi?', a: 'Kondisi dimana mayoritas penduduk berusia produktif — peluang ekonomi besar jika SDM-nya siap.' },
          ],
        },
        {
          type: 'diskusi',
          title: '💬 Diskusi Kelas (±5 menit)',
          questions: [
            { label: 'Diskusi Kelas', icon: '💬', teks: 'Dampak negatif globalisasi mana yang paling kamu rasakan di lingkunganmu? Apa yang bisa kamu lakukan?', petunjuk: 'Tuliskan pendapatmu di sini… (akan tampil di Refleksi)', color: 'c' },
          ],
        },
      ],
      nav: { prev: 's-materi1', next: 's-materi3', nextLabel: 'Lanjut: Pancasila sebagai Filter' },
    },

    // ──────────────────────── MATERI 3: Pancasila sebagai Filter ────────────────────────
    {
      id: 's-materi3',
      templateType: 'materi',
      sectionLabel: '📖 Materi 3 · ±15 Menit',
      sectionColor: 'g',
      blocks: [
        {
          type: 'def-box',
          borderColor: 'g',
          content: '<strong>Pancasila sebagai filter globalisasi</strong> berarti nilai-nilai Pancasila menjadi penyaring terhadap pengaruh global: menyerap yang sesuai dengan nilai bangsa dan menolak yang bertentangan. Ini bukan menutup diri, tapi bersikap selektif.',
        },
        {
          type: 'tabel-accord',
          rows: [
            { icon: '🙏', title: 'Sila 1: Ketuhanan', color: 'y', details: [
              { label: 'Filter', value: 'Menolak ideologi yang menolak Tuhan (ateisme) dan memaksakan keyakinan' },
              { label: 'Serap', value: 'Kerjasama lintas agama global, toleransi internasional, dialog antaragama' },
              { label: 'Contoh', value: 'Ikut konferensi lintas agama, tapi menolak aliran yang menghina agama' },
            ] },
            { icon: '❤️', title: 'Sila 2: Kemanusiaan', color: 'c', details: [
              { label: 'Filter', value: 'Menolak perdagangan manusia, eksploitasi tenaga kerja, dan kekerasan' },
              { label: 'Serap', value: 'Standar HAM internasional, kerjasama kemanusiaan, bantuan bencana global' },
              { label: 'Contoh', value: 'Menerima standar HAM PBB, tapi menolak intervensi asing yang melanggar kedaulatan' },
            ] },
            { icon: '🤝', title: 'Sila 3: Persatuan', color: 'g', details: [
              { label: 'Filter', value: 'Menolak pengaruh yang memecah NKRI dan mengancam persatuan bangsa' },
              { label: 'Serap', value: 'Kerjasama ASEAN, perdagangan bebas, dan pertukaran pelajar internasional' },
              { label: 'Contoh', value: 'Ikut ASEAN, tapi menolak separatisme yang didanai asing' },
            ] },
            { icon: '🗣️', title: 'Sila 4: Kerakyatan', color: 'p', details: [
              { label: 'Filter', value: 'Menolak model demokrasi yang tidak sesuai karakter bangsa Indonesia' },
              { label: 'Serap', value: 'Praktik good governance, transparansi, dan akuntabilitas global' },
              { label: 'Contoh', value: 'Menerapkan e-government, tapi tetap mengutamakan musyawarah mufakat' },
            ] },
            { icon: '⚖️', title: 'Sila 5: Keadilan', color: 'r', details: [
              { label: 'Filter', value: 'Menolak sistem ekonomi yang hanya menguntungkan segelintir pihak' },
              { label: 'Serap', value: 'Teknologi produktivitas, koperasi modern, dan UMKM berbasis digital' },
              { label: 'Contoh', value: 'Manfaatkan e-commerce untuk UMKM, tapi menolak monopoli platform asing' },
            ] },
          ],
        },
        {
          type: 'nc-grid',
          cards: [
            { icon: '🎭', title: 'Merawat Tradisi', body: 'Ikut festival budaya daerah, belajar bahasa lokal, dan bangga pakai batik — globalisasi bukan alasan meninggalkan akar.', color: 'g' },
            { icon: '🔍', title: 'Literasi Digital', body: 'Cek fakta sebelum share, lindungi data pribadi, dan wasulta hoaks — jadi warga digital yang cerdas.', color: 'c' },
            { icon: '🛒', title: 'Bangga Buatan Indonesia', body: 'Prioritaskan produk lokal, dukung UMKM, dan manfaatkan e-commerce untuk memperluas pasar.', color: 'y' },
            { icon: '🤝', title: 'Kolaborasi Global', body: 'Belajar dari keunggulan negara lain sambil berbagi kebaikan Indonesia — gotong royong global!', color: 'p' },
          ],
        },
        {
          type: 'diskusi',
          title: '✍️ Latihan Mandiri',
          questions: [
            { label: 'Latihan Mandiri', icon: '✍️', teks: 'Pilih satu sila Pancasila dan jelaskan bagaimana nilai sila itu bisa menjadi filter terhadap dampak negatif globalisasi!', petunjuk: 'Tuliskan di sini… (jawabanmu akan tampil lagi di Refleksi)', color: 'g' },
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
          title: 'Kuis Globalisasi & Pancasila!',
          questions: [
            {
              q: 'Apa yang dimaksud dengan "borderless world"?',
              opts: ['Dunia tanpa negara', 'Dunia tanpa batas — informasi dan barang bergerak bebas lintas negara', 'Dunia tanpa internet', 'Dunia tanpa perdagangan'],
              ans: 1,
              ex: 'Borderless world berarti dunia tanpa batas — informasi, barang, dan jasa bergerak bebas seolah tidak ada batas geografis.',
            },
            {
              q: 'Manakah yang BUKAN ciri globalisasi?',
              opts: ['Internet dan media sosial', 'Perdagangan bebas', 'Isolasi dari dunia luar', 'Pertukaran budaya'],
              ans: 2,
              ex: 'Isolasi dari dunia luar justru bertentangan dengan globalisasi yang ditandai keterbukaan dan pertukaran.',
            },
            {
              q: 'Erosi budaya akibat globalisasi berarti...',
              opts: ['Budaya lokal makin kuat', 'Budaya lokal tergantikan oleh budaya asing', 'Budaya asing menghormati budaya lokal', 'Tidak ada perubahan budaya'],
              ans: 1,
              ex: 'Erosi budaya terjadi ketika budaya lokal tergantikan oleh budaya asing yang lebih populer dan dianggap "modern".',
            },
            {
              q: 'Apa peran Pancasila sebagai filter globalisasi?',
              opts: ['Menolak semua pengaruh asing', 'Menyerap yang sesuai nilai bangsa dan menolak yang bertentangan', 'Menerima semua pengaruh asing', 'Mengabaikan globalisasi'],
              ans: 1,
              ex: 'Pancasila sebagai filter berarti menyaring pengaruh global — menyerap yang baik dan menolak yang bertentangan dengan nilai bangsa.',
            },
            {
              q: 'Bonus demografi Indonesia berarti...',
              opts: ['Penduduk Indonesia menurun', 'Mayoritas penduduk usia produktif', 'Semua penduduk sudah sejahtera', 'Indonesia tidak butuh investasi asing'],
              ans: 1,
              ex: 'Bonus demografi = mayoritas penduduk usia produktif. Ini peluang besar jika SDM-nya siap menghadapi globalisasi.',
            },
            {
              q: 'Kedaulatan data terancam ketika...',
              opts: ['Data nasional aman di server lokal', 'Data pribadi dan nasional jatuh ke tangan asing', 'Semua orang pakai internet', 'Pemerintah mengatur data warga'],
              ans: 1,
              ex: 'Kedaulatan data terancam ketika data pribadi dan nasional jatuh ke tangan asing melalui aplikasi dan platform digital.',
            },
            {
              q: 'Contoh Sila 3 sebagai filter globalisasi adalah...',
              opts: ['Menolak semua kerjasama internasional', 'Ikut ASEAN tapi menolak separatisme yang didanai asing', 'Menerima semua keputusan PBB', 'Menutup diri dari dunia'],
              ans: 1,
              ex: 'Sila 3 Persatuan: kerjasama internasional diterima, tapi pengaruh yang memecah NKRI ditolak.',
            },
            {
              q: 'Bagaimana siswa bisa berperan menghadapi globalisasi?',
              opts: ['Menunggu dewasa baru bertindak', 'Belajar literasi digital, bangga produk lokal, dan merawat budaya', 'Menghindari semua teknologi', 'Mengikuti semua tren asing'],
              ans: 1,
              ex: 'Siswa bisa berperan dengan literasi digital, bangga produk lokal, dan merawat budaya — bahkan sekarang!',
            },
            {
              q: 'Apa dampak positif globalisasi bagi pendidikan?',
              opts: ['Sekolah ditutup', 'Akses ke pengetahuan dunia dan program beasiswa internasional', 'Tidak ada perubahan', 'Buku pelajaran dilarang'],
              ans: 1,
              ex: 'Globalisasi membuka akses ke pengetahuan dunia melalui internet dan program beasiswa internasional.',
            },
            {
              q: 'Mengapa "menerima semua pengaruh asing" bukan sikap yang tepat?',
              opts: ['Karena semua budaya asing itu buruk', 'Karena tidak semua pengaruh sesuai dengan nilai Pancasila dan identitas bangsa', 'Karena Indonesia tidak butuh dunia luar', 'Karena globalisasi itu salah'],
              ans: 1,
              ex: 'Tidak semua pengaruh asing sesuai dengan Pancasila. Kita harus selektif — ambil yang baik, tolak yang bertentangan.',
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
        { type: 'hasil', title: 'Globalisasi & Pancasila', subtitle: 'Pertemuan 1 Selesai! 🎉' },
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
            { teks: 'Hal baru apa yang kamu pelajari tentang globalisasi hari ini?', petunjuk: 'Tuliskan 1–2 hal yang benar-benar baru bagimu…', warna: 'y', icon: '🌟' },
            { teks: 'Sebutkan satu dampak negatif globalisasi yang pernah kamu rasakan. Apa yang bisa kamu lakukan untuk mengatasinya?', petunjuk: 'Jelaskan dengan contoh konkret…', warna: 'c', icon: '🔍' },
            { teks: 'Satu komitmen nyata yang akan kamu lakukan untuk jadi warga global yang tetap cinta Indonesia:', petunjuk: 'Contoh: Saya akan rutin beli di UMKM lokal dan belajar bahasa daerah', warna: 'g', icon: '🤝' },
          ],
          penugasan: {
            judul: '📌 Penugasan: Jurnal Globalisasi',
            isi: 'Selama 1 minggu, catat minimal 3 contoh globalisasi yang kamu temui (aplikasi, makanan, film, dll). Untuk setiap contoh, tuliskan: dampak positif, dampak negatif, dan sikap Pancasila yang relevan.',
            contoh: 'Contoh: Selasa — Pakai TikTok (positif: hiburan, negatif: kecanduan, Pancasila: Sila 4 bijak berpendapat).',
          },
        },
        {
          type: 'penutup',
          title: 'Sampai Jumpa!',
          subtitle: 'Pertemuan 2: Hubungan Internasional',
          preview: [
            { icon: '🤝', judul: 'Kerjasama', isi: 'Peran Indonesia di ASEAN, PBB, dan G20', warna: 'g' },
            { icon: '🌊', judul: 'Hukum Laut', isi: 'UNCLOS 1982 dan kedaulatan wilayah', warna: 'c' },
            { icon: '🛡️', judul: 'Bela Negara', isi: 'Peran pelajar menjaga kedaulatan', warna: 'y' },
          ],
          nextPertemuan: {
            judul: 'Pertemuan 2: Hubungan Internasional & Kedaulatan',
            deskripsi: 'Mendalami peran Indonesia dalam hubungan internasional dan pentingnya menjaga kedaulatan di era global.',
            items: [
              { icon: '🤝', judul: 'Kerjasama Internasional', isi: 'ASEAN, PBB, G20, dan Gerakan Non-Blok', warna: 'g' },
              { icon: '🌊', judul: 'Hukum Laut', isi: 'UNCLOS 1982, ZEE, dan laut teritorial', warna: 'c' },
              { icon: '🛡️', judul: 'Bela Negara', isi: 'Peran warga negara menjaga kedaulatan', warna: 'y' },
            ],
          },
        },
      ],
      nav: { prev: 's-hasil' },
    },
  ],
};
