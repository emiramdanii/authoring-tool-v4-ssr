/**
 * data.js — Semua konten pembelajaran
 * Misi Penjelajah Pancasila | PPKn Kelas VII | Kurikulum Merdeka
 */

const DATA = {

  /* ══════════════════════════════════════
     META INFORMASI
  ══════════════════════════════════════ */
  meta: {
    mapel: "Pendidikan Pancasila",
    kelas: "VII",
    fase: "D",
    bab: "Bab 1",
    pertemuan: 2,
    topik: "Makna dan Nilai yang Terkandung dalam Pancasila",
    durasi: "80 menit",
    kurikulum: "Kurikulum Merdeka",
    ppl: ["Beriman & Bertakwa", "Berkebhinekaan Global", "Gotong Royong", "Bernalar Kritis"],
  },

  /* ══════════════════════════════════════
     CP · TP · ATP
  ══════════════════════════════════════ */
  cp: `Peserta didik mampu menganalisis kronologis lahirnya Pancasila; mengkaji fungsi dan 
kedudukan Pancasila sebagai dasar negara dan pandangan hidup bangsa, serta mengenal Pancasila 
sebagai ideologi negara; memahami implementasi Pancasila dalam kehidupan bernegara dari masa ke masa; 
mengidentifikasi hubungan Pancasila dengan Undang-Undang Dasar Negara Republik Indonesia Tahun 1945, 
Bhinneka Tunggal Ika, dan Negara Kesatuan Republik Indonesia; serta melaksanakan nilai-nilai Pancasila 
dalam kehidupan sehari-hari.`,

  tp: [
    { id:"TP-1", level:"C2", kata:"Menjelaskan", desc:"Menjelaskan fungsi dan kedudukan Pancasila sebagai dasar negara dan pandangan hidup bangsa.", pertemuan:[1], fokus:false },
    { id:"TP-2", level:"C2", kata:"Menguraikan", desc:"Menguraikan makna dan nilai yang terkandung dalam setiap sila Pancasila secara mendalam.", pertemuan:[2], fokus:true },
    { id:"TP-3", level:"C4", kata:"Mengidentifikasi", desc:"Mengidentifikasi penerapan nilai-nilai Pancasila dalam kehidupan sehari-hari di lingkungan sekolah dan masyarakat.", pertemuan:[2], fokus:true },
    { id:"TP-4", level:"C4", kata:"Membedakan", desc:"Membedakan perilaku yang sesuai dan tidak sesuai dengan nilai-nilai Pancasila dengan memberikan alasan.", pertemuan:[2], fokus:true },
    { id:"TP-5", level:"C5", kata:"Mengevaluasi", desc:"Mengevaluasi studi kasus nyata terkait pengamalan atau pelanggaran nilai Pancasila.", pertemuan:[3], fokus:false },
    { id:"TP-6", level:"C6", kata:"Merancang", desc:"Merancang komitmen tindakan nyata pengamalan Pancasila dalam kehidupan sehari-hari.", pertemuan:[3], fokus:false },
  ],

  atp: [
    { no:1, judul:"Sejarah & Kedudukan Pancasila", tp:["TP-1"], status:"done", waktu:"2 JP" },
    { no:2, judul:"Makna & Implementasi Nilai Pancasila", tp:["TP-2","TP-3","TP-4"], status:"active", waktu:"2 JP" },
    { no:3, judul:"Studi Kasus & Komitmen Pancasila", tp:["TP-5","TP-6"], status:"upcoming", waktu:"2 JP" },
  ],

  pengantar: {
    judul: "Dari Kedudukan ke Nilai: Apa Itu Nilai Pancasila?",
    recap: "Pertemuan lalu kita belajar bahwa Pancasila adalah <strong>dasar negara</strong> dan <strong>pandangan hidup bangsa</strong>. Kita sudah memahami <em>kedudukan</em> Pancasila — tapi apa <em>isi</em> dari Pancasila? Apa <em>nilai</em> yang dikandungnya?",
    jembatan: "Jika Pancasila adalah fondasi rumah, maka <strong>nilai Pancasila</strong> adalah bahan bangunan yang menyusunnya. Tanpa memahami nilainya, kita hanya menghafal simbol — bukan memaknai isi.",
    definisi: "<strong>Nilai Pancasila</strong> adalah prinsip-prinsip moral dan etika yang menjadi pedoman sikap, perilaku, dan tindakan bangsa Indonesia dalam kehidupan berbangsa dan bernegara. Nilai-nilai ini bersifat universal, tetapi dihayati sesuai kepribadian bangsa Indonesia.",
    tigaDimensi: [
      { zona: "Mengamalkan", emoji: "✅", desc: "Perilaku yang sesuai dengan nilai Pancasila — dilakukan dengan kesadaran", warna: "var(--g)" },
      { zona: "Belum Mengamalkan", emoji: "⚠️", desc: "Mengetahui nilai tapi belum menerapkannya dalam tindakan nyata", warna: "var(--y)" },
      { zona: "Melanggar", emoji: "❌", desc: "Perilaku yang bertentangan dengan nilai Pancasila", warna: "var(--r)" },
    ],
    jembatanSila: [
      { dari:1, ke:2, teks:"Ketuhanan mendasari Kemanusiaan — manusia beradab karena bertuhan" },
      { dari:2, ke:3, teks:"Kemanusiaan mendasari Persatuan — kita bersatu karena saling menghargai" },
      { dari:3, ke:4, teks:"Persatuan mendasari Demokrasi — musyawarah hanya bisa jika kita bersatu" },
      { dari:4, ke:5, teks:"Demokrasi mendasari Keadilan — keputusan bersama harus berpihak pada keadilan" },
    ]
  },

  alurKegiatan: [
    { waktu:"5'",  emoji:"📖", label:"Pengantar", desc:"Pengantar: Apa Itu Nilai Pancasila?" },
    { waktu:"10'", emoji:"🔥", label:"Pemantik", desc:"Pertanyaan pemantik + persiapan bekal misi" },
    { waktu:"5'",  emoji:"🎯", label:"Tujuan",   desc:"Orientasi tujuan & alur misi penjelajahan" },
    { waktu:"35'", emoji:"🗺️", label:"Eksplorasi",desc:"Jelajahi 5 misi materi & tantangan interaktif" },
    { waktu:"15'", emoji:"📊", label:"Evaluasi", desc:"Evaluasi akhir 5 soal pilihan ganda" },
    { waktu:"10'", emoji:"💬", label:"Refleksi",  desc:"Diskusi kelompok + refleksi individu" },
  ],

  /* ══════════════════════════════════════
     PERTANYAAN PEMANTIK
  ══════════════════════════════════════ */
  pemantik: [
    {
      q: "Bayangkan kamu tinggal di sebuah kampung yang warganya berbeda-beda agama, suku, dan bahasa. Suatu hari muncul konflik kecil karena kesalahpahaman. Menurut kamu, nilai apa dari Pancasila yang paling dibutuhkan untuk menyelesaikannya?",
      petunjuk: "Diskusikan dengan 2-3 temanmu. Masing-masing berikan 1 nilai Pancasila beserta alasannya!"
    },
    {
      q: "Di media sosial kamu melihat sebuah video yang menampilkan seorang pelajar menolak berdoa bersama karena berbeda keyakinan. Apakah tindakan itu melanggar Pancasila? Sila mana yang dilanggar dan mengapa?",
      petunjuk: "Tulis pendapatmu sebelum mendiskusikannya bersama teman kelompok!"
    }
  ],

  /* ══════════════════════════════════════
     MATERI 5 SILA
  ══════════════════════════════════════ */
  sila: [
    {
      no: 1,
      nama: "Ketuhanan Yang Maha Esa",
      emoji: "⭐",
      lambang: "Bintang Emas",
      warna: "#1a5276",
      warnaLight: "#d6eaf8",
      nilai: "Nilai Ketuhanan",
      tabs: [
        {
          id:"penjabaran", label:"📌 Penjabaran",
          judul:"Nilai Ketuhanan",
          isi:`Sila pertama mengandung <strong>Nilai Ketuhanan</strong> yang berarti bangsa Indonesia adalah bangsa yang beragama dan mempercayai adanya Tuhan Yang Maha Esa. <strong>Ketuhanan adalah fondasi moral tertinggi</strong> bangsa Indonesia — semua nilai Pancasila bersumber dari pengakuan terhadap Tuhan YME.<br><br>Toleransi beragama adalah <em>konsekuensi</em> dari nilai Ketuhanan, bukan intinya. Intinya adalah: karena kita bertuhan, kita wajib menghormati sesama ciptaan-Nya tanpa diskriminasi. Negara menjamin setiap warga untuk bebas memeluk agamanya masing-masing.`
        },
        {
          id:"makna", label:"💡 Makna",
          judul:"Makna & Nilai Utama",
          isi:`Bangsa Indonesia adalah bangsa yang religius. Sila pertama menegaskan bahwa kita 
mengakui kebesaran Tuhan YME, menjalankan perintah-Nya, dan menjauhi larangan-Nya dalam 
kehidupan sehari-hari. <br><br>
<strong>Nilai Inti:</strong><br>
• <em>Kebebasan Beragama</em> — hak memeluk agama sesuai keyakinan<br>
• <em>Toleransi Beragama</em> — saling menghargai perbedaan keyakinan<br>
• <em>Kerukunan Antarumat</em> — hidup damai berdampingan tanpa diskriminasi`
        },
        {
          id:"penerapan", label:"✅ Penerapan",
          judul:"Penerapan dalam Kehidupan Nyata",
          isi:`<strong>✅ Perilaku Sesuai Sila 1:</strong><br>
• Beribadah dengan khusyuk dan tepat waktu<br>
• Menghormati teman yang sedang beribadah<br>
• Tidak memaksakan agama kepada orang lain<br>
• Mengucapkan selamat hari raya kepada umat agama lain<br>
• Menjaga fasilitas ibadah bersama<br><br>
<strong>❌ Perilaku Melanggar Sila 1:</strong><br>
• Mengejek atau merendahkan agama lain<br>
• Mengganggu orang yang sedang beribadah<br>
• Bersikap diskriminatif berdasarkan agama
<br><br><div style="background:rgba(26,82,118,.06);border-radius:12px;padding:10px;border:1.5px dashed rgba(26,82,118,.2);margin-top:8px;"><div class="bold" style="color:var(--s1);font-size:clamp(.62rem,1.1vw,.76rem);">🔍 Identifikasi dari Kehidupanmu (TP-3)</div><div class="body-text" style="margin-top:4px;">Ceritakan 1 contoh penerapan nilai Ketuhanan YME yang <strong>kamu temui sendiri</strong> di lingkungan sekolah atau masyarakat tempat tinggalmu!</div><textarea id="identifikasi-1" rows="2" placeholder="Contoh: Di sekolahku, ketika teman saya sedang beribadah..." style="width:100%;border-radius:10px;padding:8px;border:1.5px solid var(--border);font-family:var(--font-body);font-size:clamp(.6rem,1vw,.74rem);resize:none;margin-top:6px;"></textarea><div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;margin-top:4px;"><span class="saved-badge" id="badge-identifikasi-1">✅ Tersimpan</span><button class="btn btn-primary" style="font-size:.55rem;padding:3px 10px;" onclick="saveIdentifikasi(1)">Simpan</button></div></div>`
        },
        {
          id:"definisi", label:"📖 Definisi",
          judul:"Kamus Istilah Sila 1",
          isi:`<strong>Toleransi Beragama:</strong> Sikap saling menghargai dan menghormati perbedaan 
agama atau kepercayaan antar individu tanpa diskriminasi atau pemaksaan.<br><br>
<strong>Kerukunan Umat Beragama:</strong> Kondisi hidup berdampingan secara damai dan saling 
membantu antar umat penganut agama yang berbeda-beda.<br><br>
<strong>Kebebasan Beragama:</strong> Hak asasi setiap warga negara untuk memilih dan memeluk 
agama sesuai hati nurani tanpa paksaan dari pihak manapun.<br><br>
<strong>Sekularisme:</strong> Paham yang memisahkan agama dari kehidupan berbangsa — 
<em>bertentangan</em> dengan Sila 1 karena Indonesia bukan negara sekuler.`
        },
        { id:"uraikan", label:"✏️ Uraikan", judul:"Uraikan dengan Kata-katamu Sendiri", isi:`<div style="padding:8px 0;">Setelah membaca materi di atas, uraikan dengan kata-katamu sendiri:<br><br><strong>Pertanyaan:</strong> Apa makna nilai Ketuhanan Yang Maha Esa dan mengapa nilai ini menjadi fondasi bagi sila-sila lainnya?<br><br><em>Petunjuk: Gunakan minimal 30 kata. Jawabanmu akan tersimpan di portofolio.</em></div><textarea id="uraian-1" rows="4" placeholder="Tuliskan uraianmu di sini (minimal 30 kata)..." style="width:100%;border-radius:12px;padding:10px;border:1.5px solid var(--border);font-family:var(--font-body);font-size:clamp(.62rem,1.1vw,.78rem);resize:none;background:rgba(255,255,255,.9);"></textarea><div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;margin-top:6px;"><span class="saved-badge" id="badge-uraian-1">✅ Tersimpan</span><button class="btn btn-primary" style="font-size:.6rem;padding:4px 12px;" onclick="saveUraian(1)">Simpan Uraian</button></div>` }
      ],
      tantangan: {
        tipe: "hotspot",
        alasan: "Pilih 1 perilaku yang kamu pilih tadi. Mengapa perilaku itu mencerminkan pengamalan Sila ke-1? Jelaskan alasanmu!",
        instruksi: "Pilih 3 gambar perilaku yang mencerminkan pengamalan Sila ke-1!",
        target: 3,
        pilihan: [
          { teks:"Beribadah sesuai keyakinan masing-masing", benar:true, emoji:"🕌⛪", feedback:"Tepat! Beribadah sesuai keyakinan adalah pengamalan utama Sila ke-1." },
          { teks:"Mengucapkan selamat Hari Raya kepada semua teman", benar:true, emoji:"🎉🤝", feedback:"Hebat! Memberikan ucapan selamat hari raya mencerminkan toleransi beragama (Sila 1)." },
          { teks:"Menghormati teman yang sedang berdoa sebelum makan", benar:true, emoji:"🙏✨", feedback:"Benar! Menghormati orang yang sedang beribadah adalah wujud nyata Sila ke-1." },
          { teks:"Mengejek cara ibadah agama lain", benar:false, emoji:"🗣️❌", feedback:"Salah! Mengejek cara ibadah orang lain melanggar nilai toleransi beragama Sila ke-1." },
          { teks:"Menolak berteman karena beda agama", benar:false, emoji:"🙅❌", feedback:"Salah! Diskriminasi berdasarkan agama sangat bertentangan dengan Sila ke-1." },
          { teks:"Merusak tempat ibadah agama lain", benar:false, emoji:"💥❌", feedback:"Jelas salah! Merusak tempat ibadah adalah pelanggaran berat terhadap Sila ke-1 dan hukum." },
        ]
      }
    },

    {
      no: 2,
      nama: "Kemanusiaan yang Adil dan Beradab",
      emoji: "⛓️",
      lambang: "Rantai Emas",
      warna: "#922b21",
      warnaLight: "#fadbd8",
      nilai: "Nilai Kemanusiaan",
      tabs: [
        {
          id:"penjabaran", label:"📌 Penjabaran",
          judul:"Nilai Kemanusiaan",
          isi:`Sila kedua mengandung <strong>Nilai Kemanusiaan</strong> yang mengakui persamaan 
derajat, hak, dan kewajiban asasi setiap manusia tanpa membeda-bedakan suku, ras, agama, 
maupun gender. Nilai ini mengajarkan kita untuk saling mencintai sesama manusia, menjunjung 
tinggi nilai kemanusiaan, berani membela kebenaran dan keadilan, serta menolak segala bentuk 
penindasan dan eksploitasi manusia.`
        },
        {
          id:"makna", label:"💡 Makna",
          judul:"Makna & Nilai Utama",
          isi:`Sila ini mengajak kita memperlakukan setiap manusia secara adil sesuai harkat 
dan martabatnya sebagai makhluk ciptaan Tuhan YME.<br><br>
<strong>Nilai Inti:</strong><br>
• <em>Kesetaraan Derajat</em> — semua manusia setara di hadapan Tuhan dan hukum<br>
• <em>Hak Asasi Manusia</em> — hak dasar yang melekat pada setiap manusia<br>
• <em>Tenggang Rasa</em> — empati dan kepedulian terhadap perasaan orang lain<br>
• <em>Keberanian Membela Kebenaran</em> — berani bersuara melawan ketidakadilan`
        },
        {
          id:"penerapan", label:"✅ Penerapan",
          judul:"Penerapan dalam Kehidupan Nyata",
          isi:`<strong>✅ Perilaku Sesuai Sila 2:</strong><br>
• Menjenguk teman yang sakit tanpa pandang bulu<br>
• Membantu korban bencana alam<br>
• Membela teman yang dibully<br>
• Tidak membeda-bedakan teman berdasarkan status sosial<br>
• Berdonasi untuk yang membutuhkan<br><br>
<strong>❌ Perilaku Melanggar Sila 2:</strong><br>
• Melakukan perundungan (bullying)<br>
• Bersikap diskriminatif terhadap penyandang disabilitas<br>
• Mengejek orang berdasarkan penampilan fisik
<br><br><div style="background:rgba(146,43,33,.06);border-radius:12px;padding:10px;border:1.5px dashed rgba(146,43,33,.2);margin-top:8px;"><div class="bold" style="color:var(--s2);font-size:clamp(.62rem,1.1vw,.76rem);">🔍 Identifikasi dari Kehidupanmu (TP-3)</div><div class="body-text" style="margin-top:4px;">Ceritakan 1 contoh penerapan nilai Kemanusiaan yang <strong>kamu temui sendiri</strong> di lingkungan sekolah atau masyarakat tempat tinggalmu!</div><textarea id="identifikasi-2" rows="2" placeholder="Contoh: Di lingkungan rumahku, ada warga yang..." style="width:100%;border-radius:10px;padding:8px;border:1.5px solid var(--border);font-family:var(--font-body);font-size:clamp(.6rem,1vw,.74rem);resize:none;margin-top:6px;"></textarea><div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;margin-top:4px;"><span class="saved-badge" id="badge-identifikasi-2">✅ Tersimpan</span><button class="btn btn-primary" style="font-size:.55rem;padding:3px 10px;" onclick="saveIdentifikasi(2)">Simpan</button></div></div>`
        },
        {
          id:"definisi", label:"📖 Definisi",
          judul:"Kamus Istilah Sila 2",
          isi:`<strong>Kesetaraan Derajat:</strong> Pengakuan bahwa setiap orang memiliki kedudukan, 
hak, dan kewajiban yang sama sebagai manusia.<br><br>
<strong>Hak Asasi Manusia (HAM):</strong> Hak dasar yang dimiliki oleh setiap manusia sejak 
lahir, bersifat universal dan tidak dapat dicabut.<br><br>
<strong>Tenggang Rasa (Tepo Seliro):</strong> Kemampuan menempatkan diri pada posisi orang 
lain dan memahami perasaannya sebelum bertindak.<br><br>
<strong>Diskriminasi:</strong> Perlakuan yang tidak adil terhadap seseorang berdasarkan 
ras, agama, gender, atau status sosial — bertentangan dengan Sila 2.`
        },
        { id:"uraikan", label:"✏️ Uraikan", judul:"Uraikan dengan Kata-katamu Sendiri", isi:`<div style="padding:8px 0;">Setelah membaca materi di atas, uraikan dengan kata-katamu sendiri:<br><br><strong>Pertanyaan:</strong> Apa makna nilai Kemanusiaan yang Adil dan Beradab dan mengapa nilai ini penting bagi kehidupan bersama?<br><br><em>Petunjuk: Gunakan minimal 30 kata. Jawabanmu akan tersimpan di portofolio.</em></div><textarea id="uraian-2" rows="4" placeholder="Tuliskan uraianmu di sini (minimal 30 kata)..." style="width:100%;border-radius:12px;padding:10px;border:1.5px solid var(--border);font-family:var(--font-body);font-size:clamp(.62rem,1.1vw,.78rem);resize:none;background:rgba(255,255,255,.9);"></textarea><div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;margin-top:6px;"><span class="saved-badge" id="badge-uraian-2">✅ Tersimpan</span><button class="btn btn-primary" style="font-size:.6rem;padding:4px 12px;" onclick="saveUraian(2)">Simpan Uraian</button></div>` }
      ],
      tantangan: {
        tipe: "dragdrop",
        alasan: "Pilih 1 kartu yang kamu sortir ke 'Sesuai Pancasila'. Mengapa perilaku itu sesuai dengan Sila ke-2? Jelaskan alasanmu!",
        instruksi: "Sortir 6 kartu perilaku ke kotak yang tepat: 'Sesuai Sila 2' atau 'Melanggar Sila 2'!",
        target: 6,
        kartu: [
          { teks:"Menjenguk teman yang sakit", benar:true, emoji:"🏥💛", hint:"Peduli terhadap teman yang sakit = kemanusiaan sejati." },
          { teks:"Membantu korban banjir", benar:true, emoji:"🌊🤝", hint:"Aksi kemanusiaan lintas batas adalah wujud Sila ke-2." },
          { teks:"Membela teman yang di-bully", benar:true, emoji:"🦸💪", hint:"Berani membela kebenaran dan keadilan = Sila ke-2!" },
          { teks:"Mengejek penampilan fisik orang", benar:false, hint:"Mengejek penampilan melanggar nilai kesetaraan dan beradab (Sila 2).", emoji:"🤣❌" },
          { teks:"Menolak duduk dengan penyandang disabilitas", benar:false, hint:"Diskriminasi terhadap disabilitas bertentangan dengan nilai kemanusiaan.", emoji:"🦽❌" },
          { teks:"Menyebarkan gosip untuk menjatuhkan orang", benar:false, hint:"Gosip menyakiti orang lain dan melanggar nilai kemanusiaan beradab.", emoji:"📢❌" },
        ]
      }
    },

    {
      no: 3,
      nama: "Persatuan Indonesia",
      emoji: "🌳",
      lambang: "Pohon Beringin",
      warna: "#1e8449",
      warnaLight: "#d5f5e3",
      nilai: "Nilai Persatuan",
      tabs: [
        {
          id:"penjabaran", label:"📌 Penjabaran",
          judul:"Nilai Persatuan",
          isi:`Sila ketiga bermakna <strong>Nilai Persatuan</strong>, yaitu wujud kebulatan utuh bangsa yang tetap bersatu meskipun memiliki keragaman suku, budaya, bahasa, dan agama. <strong>Persatuan ≠ Keseragaman</strong> — persatuan justru menghargai perbedaan sebagai kekayaan, bukan menyeragamkan perbedaan tersebut.<br><br>Kita diharapkan sanggup menempatkan kepentingan bersama di atas kepentingan pribadi atau golongan, serta mengembangkan rasa bangga dan cinta terhadap tanah air Indonesia. Bhinneka Tunggal Ika bukan berarti kita harus sama, melainkan kita berbeda-beda tetapi tetap satu.`
        },
        {
          id:"makna", label:"💡 Makna",
          judul:"Makna & Nilai Utama",
          isi:`Sila ketiga menuntut setiap warga negara menempatkan persatuan, kesatuan, 
keselamatan bangsa, dan negara di atas kepentingan pribadi atau golongan.<br><br>
<strong>Nilai Inti:</strong><br>
• <em>Nasionalisme</em> — cinta dan bangga terhadap bangsa Indonesia<br>
• <em>Patriotisme</em> — rela berkorban untuk mempertahankan bangsa<br>
• <em>Inklusivitas</em> — menerima perbedaan sebagai kekayaan bangsa<br>
• <em>Bhinneka Tunggal Ika</em> — berbeda-beda tetapi tetap satu`
        },
        {
          id:"penerapan", label:"✅ Penerapan",
          judul:"Penerapan dalam Kehidupan Nyata",
          isi:`<strong>✅ Perilaku Sesuai Sila 3:</strong><br>
• Mengikuti upacara bendera dengan hikmat<br>
• Bangga menggunakan produk dalam negeri<br>
• Berteman dengan semua suku tanpa pilih-pilih<br>
• Mempromosikan budaya Indonesia di media sosial<br>
• Bergotong royong dalam kerja bakti<br><br>
<strong>❌ Perilaku Melanggar Sila 3:</strong><br>
• Mengejek atau meremehkan budaya daerah lain<br>
• Memilih teman hanya yang satu suku/daerah<br>
• Menyebarkan konten yang memecah belah persatuan
<br><br><div style="background:rgba(30,132,73,.06);border-radius:12px;padding:10px;border:1.5px dashed rgba(30,132,73,.2);margin-top:8px;"><div class="bold" style="color:var(--s3);font-size:clamp(.62rem,1.1vw,.76rem);">🔍 Identifikasi dari Kehidupanmu (TP-3)</div><div class="body-text" style="margin-top:4px;">Ceritakan 1 contoh penerapan nilai Persatuan yang <strong>kamu temui sendiri</strong> di lingkungan sekolah atau masyarakat tempat tinggalmu!</div><textarea id="identifikasi-3" rows="2" placeholder="Contoh: Di sekolahku, saat hari kemerdekaan..." style="width:100%;border-radius:10px;padding:8px;border:1.5px solid var(--border);font-family:var(--font-body);font-size:clamp(.6rem,1vw,.74rem);resize:none;margin-top:6px;"></textarea><div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;margin-top:4px;"><span class="saved-badge" id="badge-identifikasi-3">✅ Tersimpan</span><button class="btn btn-primary" style="font-size:.55rem;padding:3px 10px;" onclick="saveIdentifikasi(3)">Simpan</button></div></div>`
        },
        {
          id:"definisi", label:"📖 Definisi",
          judul:"Kamus Istilah Sila 3",
          isi:`<strong>Nasionalisme:</strong> Kesadaran dan semangat cinta tanah air yang diwujudkan 
dalam sikap mempertahankan identitas dan kedaulatan negara.<br><br>
<strong>Patriotisme:</strong> Sikap gagah berani, pantang menyerah, dan rela berkorban 
demi mempertahankan dan memajukan bangsa dan negara.<br><br>
<strong>Bhinneka Tunggal Ika:</strong> Semboyan bangsa Indonesia yang berarti "Berbeda-beda 
tetapi tetap satu jua", menjunjung persatuan dalam keberagaman.<br><br>
<strong>Separatisme:</strong> Gerakan pemisahan diri dari NKRI — jelas bertentangan dengan Sila 3.`
        },
        { id:"uraikan", label:"✏️ Uraikan", judul:"Uraikan dengan Kata-katamu Sendiri", isi:`<div style="padding:8px 0;">Setelah membaca materi di atas, uraikan dengan kata-katamu sendiri:<br><br><strong>Pertanyaan:</strong> Mengapa Persatuan Indonesia justru menghargai perbedaan, bukan menyeragamkan? Jelaskan!<br><br><em>Petunjuk: Gunakan minimal 30 kata. Jawabanmu akan tersimpan di portofolio.</em></div><textarea id="uraian-3" rows="4" placeholder="Tuliskan uraianmu di sini (minimal 30 kata)..." style="width:100%;border-radius:12px;padding:10px;border:1.5px solid var(--border);font-family:var(--font-body);font-size:clamp(.62rem,1.1vw,.78rem);resize:none;background:rgba(255,255,255,.9);"></textarea><div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;margin-top:6px;"><span class="saved-badge" id="badge-uraian-3">✅ Tersimpan</span><button class="btn btn-primary" style="font-size:.6rem;padding:4px 12px;" onclick="saveUraian(3)">Simpan Uraian</button></div>` }
      ],
      tantangan: {
        tipe: "hotspot",
        alasan: "Pilih 1 tindakan yang kamu pilih tadi. Mengapa tindakan itu mencerminkan nilai Persatuan? Jelaskan alasanmu!",
        instruksi: "Pilih 3 tindakan yang paling mencerminkan nilai Persatuan Indonesia!",
        target: 3,
        pilihan: [
          { teks:"Mengikuti upacara bendera dengan khidmat", benar:true, emoji:"🇮🇩🫡", feedback:"Benar! Upacara bendera adalah bentuk penghormatan terhadap perjuangan para pahlawan." },
          { teks:"Bangga memakai batik dan produk lokal", benar:true, emoji:"👕🌟", feedback:"Tepat! Mencintai produk dalam negeri memperkuat ekonomi dan persatuan bangsa." },
          { teks:"Bergotong royong membersihkan lingkungan", benar:true, emoji:"🧹🤝", feedback:"Keren! Gotong royong adalah budaya asli Indonesia yang mencerminkan persatuan." },
          { teks:"Mengejek logat bicara orang dari daerah lain", benar:false, emoji:"🗣️👎", feedback:"Salah! Mengejek logat/dialek orang lain merendahkan keberagaman dan merusak persatuan." },
          { teks:"Membuat grup hanya untuk satu suku di sekolah", benar:false, emoji:"🚫👥", feedback:"Salah! Sikap eksklusif berdasarkan suku/daerah memecah belah persatuan bangsa." },
          { teks:"Menyebarkan meme yang menghina suku tertentu", benar:false, emoji:"📱❌", feedback:"Berbahaya! Konten yang menghina suku tertentu adalah pelanggaran hukum sekaligus Sila ke-3." },
        ]
      }
    },

    {
      no: 4,
      nama: "Kerakyatan yang Dipimpin oleh Hikmat Kebijaksanaan dalam Permusyawaratan/Perwakilan",
      emoji: "🐂",
      lambang: "Kepala Banteng",
      warna: "#784212",
      warnaLight: "#fdebd0",
      nilai: "Nilai Kerakyatan",
      tabs: [
        {
          id:"penjabaran", label:"📌 Penjabaran",
          judul:"Nilai Kerakyatan",
          isi:`Sila keempat mengusung <strong>Nilai Kerakyatan (Demokrasi Pancasila)</strong>. Ini berarti warga negara Indonesia tidak boleh memaksakan kehendak kepada orang lain dan mengutamakan <strong>musyawarah mufakat</strong> dalam mengambil keputusan untuk kepentingan bersama.<br><br><strong>Hikmat Kebijaksanaan</strong> berarti keputusan harus didasarkan pada kebijaksanaan moral — bukan sekadar akal sehat atau kepentingan sesaat. Contohnya: keputusan MPR bukan hanya voting, tapi melalui proses mendengar semua pihak dan mencari jalan terbaik yang berpihak pada keadilan.`
        },
        {
          id:"makna", label:"💡 Makna",
          judul:"Makna & Nilai Utama",
          isi:`Setiap keputusan yang menyangkut hajat hidup orang banyak wajib dibicarakan 
bersama secara bijak demi tercapainya mufakat yang mewadahi kepentingan kolektif.<br><br>
<strong>Nilai Inti:</strong><br>
• <em>Demokrasi Pancasila</em> — demokrasi berdasarkan asas kekeluargaan<br>
• <em>Musyawarah</em> — proses diskusi bersama untuk mencari solusi terbaik<br>
• <em>Mufakat</em> — kesepakatan yang dihasilkan dari musyawarah<br>
• <em>Kebijaksanaan</em> — keputusan yang didasarkan pada akal sehat dan nurani`
        },
        {
          id:"penerapan", label:"✅ Penerapan",
          judul:"Penerapan dalam Kehidupan Nyata",
          isi:`<strong>✅ Perilaku Sesuai Sila 4:</strong><br>
• Bermusyawarah saat memilih ketua kelas<br>
• Menerima hasil voting dengan lapang dada<br>
• Mengemukakan pendapat dengan cara santun<br>
• Mendengarkan pendapat orang lain tanpa memotong<br>
• Menggunakan hak pilih dalam pemilu dengan bijak<br><br>
<strong>❌ Perilaku Melanggar Sila 4:</strong><br>
• Memaksakan kehendak tanpa musyawarah<br>
• Menolak hasil keputusan bersama<br>
• Golput tanpa alasan yang jelas dalam pemilu
<br><br><div style="background:rgba(120,66,18,.06);border-radius:12px;padding:10px;border:1.5px dashed rgba(120,66,18,.2);margin-top:8px;"><div class="bold" style="color:var(--s4);font-size:clamp(.62rem,1.1vw,.76rem);">🔍 Identifikasi dari Kehidupanmu (TP-3)</div><div class="body-text" style="margin-top:4px;">Ceritakan 1 contoh penerapan nilai Kerakyatan/Musyawarah yang <strong>kamu temui sendiri</strong> di lingkungan sekolah atau masyarakat tempat tinggalmu!</div><textarea id="identifikasi-4" rows="2" placeholder="Contoh: Di kelasku, saat memilih ketua kelompok..." style="width:100%;border-radius:10px;padding:8px;border:1.5px solid var(--border);font-family:var(--font-body);font-size:clamp(.6rem,1vw,.74rem);resize:none;margin-top:6px;"></textarea><div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;margin-top:4px;"><span class="saved-badge" id="badge-identifikasi-4">✅ Tersimpan</span><button class="btn btn-primary" style="font-size:.55rem;padding:3px 10px;" onclick="saveIdentifikasi(4)">Simpan</button></div></div>`
        },
        {
          id:"definisi", label:"📖 Definisi",
          judul:"Kamus Istilah Sila 4",
          isi:`<strong>Demokrasi Pancasila:</strong> Demokrasi yang bersumber dari kepribadian 
dan falsafah hidup bangsa Indonesia berlandaskan prinsip kekeluargaan dan gotong royong.<br><br>
<strong>Musyawarah:</strong> Pembahasan bersama dengan maksud mencapai keputusan terbaik 
atas penyelesaian suatu masalah secara kolektif.<br><br>
<strong>Mufakat:</strong> Kesepakatan atau kebulatan suara yang dihasilkan dari proses 
musyawarah dan diterima oleh semua pihak.<br><br>
<strong>Voting:</strong> Pengambilan keputusan berdasarkan suara terbanyak — digunakan 
ketika musyawarah tidak menghasilkan mufakat.`
        },
        { id:"uraikan", label:"✏️ Uraikan", judul:"Uraikan dengan Kata-katamu Sendiri", isi:`<div style="padding:8px 0;">Setelah membaca materi di atas, uraikan dengan kata-katamu sendiri:<br><br><strong>Pertanyaan:</strong> Apa makna "Hikmat Kebijaksanaan" dalam Sila ke-4 dan mengapa musyawarah tidak cukup hanya dengan voting?<br><br><em>Petunjuk: Gunakan minimal 30 kata. Jawabanmu akan tersimpan di portofolio.</em></div><textarea id="uraian-4" rows="4" placeholder="Tuliskan uraianmu di sini (minimal 30 kata)..." style="width:100%;border-radius:12px;padding:10px;border:1.5px solid var(--border);font-family:var(--font-body);font-size:clamp(.62rem,1.1vw,.78rem);resize:none;background:rgba(255,255,255,.9);"></textarea><div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;margin-top:6px;"><span class="saved-badge" id="badge-uraian-4">✅ Tersimpan</span><button class="btn btn-primary" style="font-size:.6rem;padding:4px 12px;" onclick="saveUraian(4)">Simpan Uraian</button></div>` }
      ],
      tantangan: {
        tipe: "pilgan",
        alasan: "Pilih 1 studi kasus yang paling berkesan. Mengapa jawaban itu paling sesuai dengan Sila ke-4? Jelaskan alasanmu!",
        instruksi: "Jawab 4 studi kasus berikut dengan memilih tindakan yang paling sesuai Sila ke-4!",
        target: 4,
        soal: [
          {
            situasi:"Kelas 7B memilih ketua OSIS. Ada 3 kandidat. Apa cara pengambilan keputusan yang paling sesuai Sila ke-4?",
            pilihan:["Guru wali kelas menunjuk siswa yang nilai rata-ratanya tertinggi","Voting terbuka dan jujur setelah semua kandidat mempresentasikan visinya","Kakak kelas menentukan pilihan karena lebih tahu kondisi sekolah","Ketua kelas lama otomatis melanjutkan karena sudah berpengalaman"],
            jawaban:1,
            penjelasan:"Voting yang adil setelah semua kandidat menyampaikan visi adalah wujud musyawarah demokratis (Sila ke-4)."
          },
          {
            situasi:"Dalam diskusi kelompok, pendapat Andi tidak disetujui oleh 4 dari 5 anggota. Sikap Andi yang sesuai Sila ke-4 adalah...",
            pilihan:["Mengajukan keberatan secara tertulis dan meminta voting ulang","Menerima keputusan kelompok dengan lapang dada sambil menyampaikan catatan","Mengalah demi menjaga keharmonisan, tapi tetap menyimpan kekecewaan","Meminta pendapat kelompok lain sebagai penengah untuk memutuskan"],
            jawaban:1,
            penjelasan:"Menerima hasil musyawarah dengan lapang dada sambil tetap menyampaikan catatan adalah sikap dewasa yang sesuai Sila ke-4."
          },
          {
            situasi:"RW ingin membangun taman bermain. Dana terbatas. Keputusan terbaik menurut Sila ke-4 adalah...",
            pilihan:["Ketua RT memutuskan sendiri agar lebih cepat dan efisien","Musyawarah seluruh warga untuk mencapai mufakat bersama","Hanya mengundang perwakilan tiap RT untuk mempercepat keputusan","Menunggu bantuan dan keputusan dari pemerintah kecamatan"],
            jawaban:1,
            penjelasan:"Musyawarah yang melibatkan seluruh warga tanpa terkecuali adalah inti dari Sila ke-4 tentang permusyawaratan."
          },
          {
            situasi:"Saat pemilu, Budi merasa pilihannya tidak ada yang bagus. Tindakan yang sesuai Sila ke-4 adalah...",
            pilihan:["Tidak memilih sebagai bentuk protes terhadap kualitas kandidat","Memilih dengan cermat kandidat terbaik yang tersedia","Memberikan suara kosong agar tercatat sebagai peserta pemilu","Mencalonkan diri sendiri sebagai alternatif pilihan"],
            jawaban:1,
            penjelasan:"Menggunakan hak pilih secara bijak dengan memilih kandidat terbaik yang tersedia adalah kewajiban warga negara sesuai Sila ke-4."
          }
        ]
      }
    },

    {
      no: 5,
      nama: "Keadilan Sosial bagi Seluruh Rakyat Indonesia",
      emoji: "🌾",
      lambang: "Padi dan Kapas",
      warna: "#b7950b",
      warnaLight: "#fef9e7",
      nilai: "Nilai Keadilan",
      tabs: [
        {
          id:"penjabaran", label:"📌 Penjabaran",
          judul:"Nilai Keadilan Sosial",
          isi:`Sila ini menekankan tegaknya <strong>Nilai Keadilan Sosial</strong>. Keadilan sosial bukan sekadar berbagi atau bersedekah — tetapi menuntut <strong>struktur sosial yang adil</strong> di mana setiap warga negara memiliki kesempatan yang sama di bidang pendidikan, hukum, ekonomi, dan politik.<br><br>Setiap warga negara berhak atas perlakuan yang adil tanpa dibeda-bedakan berdasarkan status atau kekayaan. Ini menuntut kita untuk tidak hanya menuntut hak, tetapi juga bersedia melaksanakan kewajiban secara seimbang.`
        },
        {
          id:"makna", label:"💡 Makna",
          judul:"Makna & Nilai Utama",
          isi:`Sila ini mencita-citakan masyarakat yang setara, tiada eksploitasi, dengan 
suasana kekeluargaan dan kegotongroyongan yang kuat.<br><br>
<strong>Nilai Inti:</strong><br>
• <em>Keadilan Sosial</em> — perlakuan adil bagi semua tanpa kecuali<br>
• <em>Keseimbangan Hak & Kewajiban</em> — tidak hanya menuntut, tapi juga memberi<br>
• <em>Etos Kerja</em> — semangat bekerja keras dan mandiri<br>
• <em>Anti-Eksploitasi</em> — menolak segala bentuk penindasan ekonomi`
        },
        {
          id:"penerapan", label:"✅ Penerapan",
          judul:"Penerapan dalam Kehidupan Nyata",
          isi:`<strong>✅ Perilaku Sesuai Sila 5:</strong><br>
• Menabung dan hidup hemat sesuai kemampuan<br>
• Berbagi dengan sesama yang kekurangan<br>
• Membayar pajak tepat waktu saat sudah bekerja<br>
• Tidak membuang makanan dengan sembarangan<br>
• Menggunakan fasilitas umum dengan bertanggung jawab<br><br>
<strong>❌ Perilaku Melanggar Sila 5:</strong><br>
• Pamer kekayaan secara berlebihan (flexing)<br>
• Korupsi dan menyalahgunakan jabatan<br>
• Menghambur-hamburkan uang untuk hal tidak berguna
<br><br><div style="background:rgba(183,149,11,.06);border-radius:12px;padding:10px;border:1.5px dashed rgba(183,149,11,.2);margin-top:8px;"><div class="bold" style="color:var(--s5);font-size:clamp(.62rem,1.1vw,.76rem);">🔍 Identifikasi dari Kehidupanmu (TP-3)</div><div class="body-text" style="margin-top:4px;">Ceritakan 1 contoh penerapan nilai Keadilan Sosial yang <strong>kamu temui sendiri</strong> di lingkungan sekolah atau masyarakat tempat tinggalmu!</div><textarea id="identifikasi-5" rows="2" placeholder="Contoh: Di sekolahku, ada program beasiswa untuk..." style="width:100%;border-radius:10px;padding:8px;border:1.5px solid var(--border);font-family:var(--font-body);font-size:clamp(.6rem,1vw,.74rem);resize:none;margin-top:6px;"></textarea><div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;margin-top:4px;"><span class="saved-badge" id="badge-identifikasi-5">✅ Tersimpan</span><button class="btn btn-primary" style="font-size:.55rem;padding:3px 10px;" onclick="saveIdentifikasi(5)">Simpan</button></div></div>`
        },
        {
          id:"definisi", label:"📖 Definisi",
          judul:"Kamus Istilah Sila 5",
          isi:`<strong>Keadilan Sosial:</strong> Perlakuan yang adil di segala bidang kehidupan 
bagi seluruh rakyat Indonesia tanpa terkecuali.<br><br>
<strong>Keseimbangan Hak & Kewajiban:</strong> Prinsip bahwa setiap warga tidak hanya 
menuntut hak secara berlebihan, melainkan juga melaksanakan kewajiban dengan penuh tanggung jawab.<br><br>
<strong>Etos Kerja:</strong> Semangat bekerja keras, jujur, dan mandiri untuk meningkatkan 
kesejahteraan diri dan masyarakat sekitar.<br><br>
<strong>Gotong Royong:</strong> Semangat bekerja bersama-sama untuk kepentingan bersama 
tanpa mengharapkan imbalan — nilai asli budaya Indonesia.`
        },
        { id:"uraikan", label:"✏️ Uraikan", judul:"Uraikan dengan Kata-katamu Sendiri", isi:`<div style="padding:8px 0;">Setelah membaca materi di atas, uraikan dengan kata-katamu sendiri:<br><br><strong>Pertanyaan:</strong> Apa makna Keadilan Sosial dan mengapa keadilan sosial bukan sekadar berbagi, tetapi juga tentang struktur sosial yang adil?<br><br><em>Petunjuk: Gunakan minimal 30 kata. Jawabanmu akan tersimpan di portofolio.</em></div><textarea id="uraian-5" rows="4" placeholder="Tuliskan uraianmu di sini (minimal 30 kata)..." style="width:100%;border-radius:12px;padding:10px;border:1.5px solid var(--border);font-family:var(--font-body);font-size:clamp(.62rem,1.1vw,.78rem);resize:none;background:rgba(255,255,255,.9);"></textarea><div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;margin-top:6px;"><span class="saved-badge" id="badge-uraian-5">✅ Tersimpan</span><button class="btn btn-primary" style="font-size:.6rem;padding:4px 12px;" onclick="saveUraian(5)">Simpan Uraian</button></div>` }
      ],
      tantangan: {
        tipe: "dragdrop",
        alasan: "Pilih 1 kartu yang kamu sortir ke 'Sesuai Pancasila'. Mengapa perilaku itu sesuai dengan Sila ke-5? Jelaskan alasanmu!",
        instruksi: "Sortir 6 kartu perilaku ke kotak yang tepat: 'Sesuai Sila 5' atau 'Melanggar Sila 5'!",
        target: 6,
        kartu: [
          { teks:"Rajin menabung uang saku", benar:true, emoji:"🏦💰", hint:"Hidup hemat dan menabung mencerminkan tanggung jawab dan keadilan sosial." },
          { teks:"Berbagi bekal makanan dengan teman yang tidak membawa", benar:true, emoji:"🍱🤝", hint:"Berbagi adalah wujud nyata kepedulian sosial sesuai Sila ke-5." },
          { teks:"Menggunakan fasilitas sekolah dengan bertanggung jawab", benar:true, emoji:"🏫✅", hint:"Menggunakan fasilitas publik dengan baik adalah wujud keadilan sosial." },
          { teks:"Pamer barang mahal di media sosial terus-menerus", benar:false, hint:"Flexing berlebihan menciptakan kecemburuan sosial dan bertentangan dengan Sila ke-5.", emoji:"📸💎❌" },
          { teks:"Membuang makanan masih baik karena bosan", benar:false, hint:"Membuang-buang makanan adalah pemborosan yang bertentangan dengan keadilan sosial.", emoji:"🗑️❌" },
          { teks:"Mencontek saat ujian untuk dapat nilai bagus", benar:false, hint:"Mencontek tidak adil bagi teman yang belajar keras — melanggar nilai keadilan (Sila 5).", emoji:"👀📝❌" },
        ]
      }
    }
  ],

  /* ══════════════════════════════════════
     EVALUASI AKHIR (10 soal, diambil 5 acak)
  ══════════════════════════════════════ */
  evaluasi: [
    {
      soal:"Tindakan berikut yang PALING mencerminkan pengamalan Sila ke-1 Pancasila adalah...",
      pilihan:["Membantu teman yang kesulitan mengerjakan PR","Menghormati teman yang sedang berdoa sebelum makan","Mengikuti upacara bendera dengan tertib","Menabung sebagian uang saku setiap hari"],
      jawaban:1,
      sila:1,
      penjelasan:"Menghormati teman yang sedang berdoa adalah wujud nyata toleransi beragama yang merupakan inti dari Sila ke-1 (Ketuhanan Yang Maha Esa)."
    },
    {
      soal:"Rina melihat temannya Dinda sedang di-bully oleh beberapa anak. Tindakan Rina yang paling sesuai Sila ke-2 adalah...",
      pilihan:["Pura-pura tidak melihat agar tidak ikut masalah","Ikut menonton dan merekam videonya","Segera membela Dinda dan melaporkan ke guru","Menunggu kejadian selesai baru bertindak"],
      jawaban:2,
      sila:2,
      penjelasan:"Membela teman yang di-bully dan melaporkan ke guru adalah wujud keberanian membela kemanusiaan sesuai Sila ke-2 (Kemanusiaan yang Adil dan Beradab)."
    },
    {
      soal:"Bangga menggunakan produk buatan Indonesia dan mempromosikannya kepada teman-teman adalah cerminan dari Sila...",
      pilihan:["Sila ke-2, karena mendukung pengrajin lokal","Sila ke-3, karena mencintai produk dalam negeri memperkuat persatuan","Sila ke-4, karena merupakan keputusan bersama","Sila ke-5, karena mendukung ekonomi rakyat"],
      jawaban:1,
      sila:3,
      penjelasan:"Mencintai produk dalam negeri mencerminkan rasa cinta tanah air dan nasionalisme yang merupakan inti dari Sila ke-3 (Persatuan Indonesia)."
    },
    {
      soal:"Dalam rapat pemilihan ketua kelas, hasil musyawarah tidak sesuai dengan keinginan Bagas. Sikap Bagas yang paling mencerminkan Sila ke-4 adalah...",
      pilihan:["Tidak mau bersekolah selama ketua kelas baru menjabat","Menerima hasil dengan lapang dada dan mendukung ketua baru","Memengaruhi teman-teman untuk menolak hasil musyawarah","Mengajukan protes keras kepada wali kelas"],
      jawaban:1,
      sila:4,
      penjelasan:"Menerima hasil musyawarah dengan lapang dada dan mendukung keputusan bersama adalah inti dari Sila ke-4 tentang kebijaksanaan dalam permusyawaratan."
    },
    {
      soal:"Perilaku yang PALING mencerminkan Sila ke-5 (Keadilan Sosial) di lingkungan sekolah adalah...",
      pilihan:["Meminjamkan alat tulis kepada teman yang tidak punya","Selalu mendapat nilai ujian terbaik di kelas","Memiliki banyak teman dari berbagai daerah","Rajin mengikuti kegiatan ekstrakurikuler"],
      jawaban:0,
      sila:5,
      penjelasan:"Meminjamkan alat tulis kepada yang membutuhkan adalah bentuk berbagi dan kepedulian sosial yang mencerminkan nilai keadilan sosial Sila ke-5."
    },
    {
      soal:"Kelompok belajar tidak bisa sepakat soal tempat belajar bersama. Solusi yang sesuai nilai Pancasila adalah...",
      pilihan:["Anggota yang paling senior langsung memutuskan","Berdiskusi dan memilih berdasarkan suara terbanyak secara adil","Membubarkan kelompok karena tidak ada kesepakatan","Bertengkar hingga salah satu pihak mengalah"],
      jawaban:1,
      sila:4,
      penjelasan:"Diskusi dan voting adil adalah cara demokratis yang mencerminkan nilai musyawarah mufakat sesuai Sila ke-4."
    },
    {
      soal:"Manakah perilaku yang mencerminkan PELANGGARAN nilai Sila ke-3?",
      pilihan:["Bergotong royong membersihkan kelas","Berteman akrab dengan semua suku dan daerah","Menyebarkan konten hoax yang memecah belah suku","Mengikuti pawai budaya nusantara"],
      jawaban:2,
      sila:3,
      penjelasan:"Menyebarkan konten hoax yang memecah belah bangsa sangat bertentangan dengan nilai persatuan dan kesatuan Sila ke-3."
    },
    {
      soal:"Nilai yang TIDAK terkandung dalam Sila ke-2 (Kemanusiaan yang Adil dan Beradab) adalah...",
      pilihan:["Menghargai hak asasi manusia","Mengutamakan kepentingan pribadi di atas kepentingan bersama","Bersikap tenggang rasa terhadap sesama","Membela orang yang tertindas"],
      jawaban:1,
      sila:2,
      penjelasan:"Mengutamakan kepentingan pribadi adalah nilai yang bertentangan dengan Sila ke-2. Sila 2 justru mengajarkan kepedulian dan tenggang rasa terhadap sesama."
    },
    {
      soal:"Seorang siswa kaya selalu memakai barang mahal dan sering mempermalukan teman yang berpakaian sederhana. Sila Pancasila manakah yang PALING dilanggar?",
      pilihan:["Sila ke-1 dan Sila ke-3","Sila ke-2 dan Sila ke-5","Sila ke-3 dan Sila ke-4","Sila ke-4 dan Sila ke-1"],
      jawaban:1,
      sila:5,
      penjelasan:"Merendahkan orang lain berdasarkan status ekonomi melanggar Sila ke-2 (kemanusiaan yang beradab) dan Sila ke-5 (keadilan sosial)."
    },
    {
      soal:"Urutan yang BENAR dalam proses pengambilan keputusan yang mencerminkan Sila ke-4 adalah...",
      pilihan:["Mufakat → Musyawarah → Voting → Keputusan","Musyawarah → Cari Mufakat → Jika tidak mufakat → Voting demokratis","Voting → Musyawarah → Mufakat → Keputusan","Keputusan → Musyawarah → Voting → Mufakat"],
      jawaban:1,
      sila:4,
      penjelasan:"Proses yang benar: Musyawarah dahulu → Cari mufakat bersama → Jika tidak tercapai mufakat, baru dilakukan voting yang demokratis dan adil."
    }
  ],

  /* ══════════════════════════════════════
     DISKUSI PASCA-JELAJAH (5 topik)
  ══════════════════════════════════════ */
  diskusi: [
    {
      sila:1, warna:"#1a5276",
      judul:"Toleransi Beragama di Era Digital",
      pertanyaan:"Di media sosial, kamu menemukan komentar yang menghina agama tertentu. Langkah apa yang kamu ambil sebagai pelajar Pancasila? Apakah melaporkan saja cukup?",
      petunjuk:"Diskusikan 3 langkah konkret yang bisa dilakukan. Masing-masing anggota berikan 1 langkah!",
      placeholder:"Tuliskan 3 langkah konkret yang akan kelompokmu lakukan...",
      poin:10
    },
    {
      sila:2, warna:"#922b21",
      judul:"Kemanusiaan vs Viral",
      pertanyaan:"Kamu melihat seseorang jatuh dan terluka di jalan. Di sekitarmu banyak orang yang malah langsung mengeluarkan HP untuk merekam. Apa yang akan kamu lakukan dan mengapa tindakanmu lebih mencerminkan Sila ke-2?",
      petunjuk:"Satu anggota ceritakan pengalamannya, anggota lain tambahkan perspektif berbeda!",
      placeholder:"Tuliskan pendapat kelompokmu...",
      poin:10
    },
    {
      sila:3, warna:"#1e8449",
      judul:"Persatuan di Ruang Digital",
      pertanyaan:"Bagaimana cara kita menjaga persatuan bangsa Indonesia di era media sosial yang penuh dengan konten provokatif dan berita hoax?",
      petunjuk:"Buat 5 tips nyata sebagai pelajar untuk menjaga persatuan di dunia digital!",
      placeholder:"Tuliskan 5 tips konkret kelompokmu...",
      poin:10
    },
    {
      sila:4, warna:"#784212",
      judul:"Musyawarah dalam Kehidupan Nyata",
      pertanyaan:"Berikan contoh situasi di sekolah atau keluarga di mana musyawarah mufakat GAGAL diterapkan. Apa yang terjadi? Bagaimana seharusnya?",
      petunjuk:"Setiap anggota ceritakan 1 pengalaman, lalu kelompok pilih yang paling relevan!",
      placeholder:"Tuliskan contoh kasus dan analisis kelompokmu...",
      poin:10
    },
    {
      sila:5, warna:"#b7950b",
      judul:"Keadilan Sosial di Lingkungan Sekolah",
      pertanyaan:"Apakah semua siswa di sekolahmu mendapat perlakuan yang sama adilnya? Jika ada ketidakadilan, contoh apa yang pernah kamu lihat dan bagaimana mengatasinya?",
      petunjuk:"Diskusikan dengan jujur — tidak ada yang boleh menyebut nama individu secara spesifik!",
      placeholder:"Tuliskan analisis dan solusi kelompokmu...",
      poin:10
    }
  ],

  /* ══════════════════════════════════════
     FLASHCARD REVIEW (9 kartu)
  ══════════════════════════════════════ */
  flashcard: [
    { sila:1, depan:"Apa nilai utama yang terkandung dalam Sila ke-1?", belakang:"Nilai Ketuhanan: Toleransi beragama, kebebasan beribadah, dan menghormati perbedaan keyakinan tanpa diskriminasi.", emoji:"⭐" },
    { sila:2, depan:"Apa perbedaan HAM dan Kewajiban Asasi?", belakang:"HAM = Hak dasar yang dimiliki sejak lahir. Kewajiban Asasi = Kewajiban dasar yang harus dipenuhi setiap manusia kepada Tuhan, sesama, dan negara.", emoji:"⛓️" },
    { sila:3, depan:"Apa arti semboyan 'Bhinneka Tunggal Ika'?", belakang:"'Berbeda-beda tetapi tetap satu jua' — menjunjung tinggi persatuan dalam keberagaman suku, budaya, bahasa, dan agama Indonesia.", emoji:"🌳" },
    { sila:4, depan:"Apa perbedaan Musyawarah dan Voting?", belakang:"Musyawarah = Diskusi bersama mencari mufakat terbaik. Voting = Pengambilan suara terbanyak sebagai alternatif TERAKHIR jika mufakat tidak tercapai.", emoji:"🐂" },
    { sila:5, depan:"Berikan 3 contoh pelanggaran Sila ke-5 di kehidupan nyata!", belakang:"1) Korupsi uang publik, 2) Pamer kekayaan berlebihan (flexing), 3) Membuang-buang makanan dan sumber daya tanpa kepedulian.", emoji:"🌾" },
    { sila:1, depan:"Apa yang dimaksud 'Kerukunan Umat Beragama'?", belakang:"Kondisi hidup berdampingan secara damai dan saling membantu antar umat penganut agama yang berbeda-beda dalam satu wilayah.", emoji:"🕊️" },
    { sila:2, depan:"Mengapa bullying bertentangan dengan Sila ke-2?", belakang:"Karena Sila ke-2 mengajarkan kemanusiaan yang beradab, kesetaraan derajat, dan tenggang rasa. Bullying merendahkan martabat manusia lain.", emoji:"🦸" },
    { sila:3, depan:"Apa contoh nasionalisme di era digital?", belakang:"Tidak menyebarkan hoax yang memecah belah, mempromosikan produk lokal, menggunakan Bahasa Indonesia dengan baik di platform digital.", emoji:"📱🇮🇩" },
    { sila:4, depan:"Mengapa golput bisa bertentangan dengan Sila ke-4?", belakang:"Karena Sila ke-4 mengajarkan keikutsertaan aktif dalam permusyawaratan/perwakilan. Golput tanpa alasan berarti tidak menjalankan kewajiban demokratis sebagai warga negara.", emoji:"🗳️" },
  ],

  /* ══════════════════════════════════════
     REFLEKSI INDIVIDU
  ══════════════════════════════════════ */
  refleksi: [
    { id:"r1", label:"💡 Penemuan Terpenting", pertanyaan:"Nilai Pancasila apa yang paling berkesan bagimu hari ini? Mengapa nilai itu terasa relevan dengan kehidupanmu?", placeholder:"Contoh: Nilai toleransi (Sila 1) paling berkesan karena di kelasku ada 4 agama berbeda..." },
    { id:"r2", label:"🎯 Rencana Aksi", pertanyaan:"Tuliskan 2 tindakan konkret yang AKAN kamu mulai lakukan besok untuk mengamalkan nilai Pancasila dalam kehidupan sehari-hari!", placeholder:"1) Mulai besok saya akan...\n2) Minggu ini saya akan mencoba..." },
    { id:"r3", label:"❓ Pertanyaan Lanjutan", pertanyaan:"Apa hal tentang Pancasila yang masih membuatmu penasaran atau ingin kamu pelajari lebih lanjut?", placeholder:"Saya masih penasaran tentang..." },
  ],

  /* ══════════════════════════════════════
     KREDIT
  ══════════════════════════════════════ */
  kredit: {
    sumber: ["Buku Teks Pendidikan Pancasila SMP Kelas VII (Kemdikbudristek, 2022)", "Undang-Undang Dasar Negara RI Tahun 1945", "Ketetapan MPR RI tentang Pancasila sebagai Dasar Negara"],
    visual: ["Peta SVG Indonesia custom (data publik BPS)", "Lambang sila dari sumber domain publik", "Google Fonts: Fredoka One & Nunito"],
    pengembang: "MPI Interaktif — Standar MPI Universal | Kurikulum Merdeka 2022",
  }
};

// Export untuk digunakan file lain
if (typeof module !== 'undefined') module.exports = DATA;
