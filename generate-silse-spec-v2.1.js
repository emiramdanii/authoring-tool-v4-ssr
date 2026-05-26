const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  PageBreak, Header, Footer, PageNumber, NumberFormat,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  TableOfContents,
} = require("docx");
const fs = require("fs");

// ─── Palette: Warm Teal (WM-1) ───
const P = {
  primary: "15857A", body: "2A3518", secondary: "5B7A6A",
  accent: "FF6A3B", surface: "F0EDE5",
  cover: { titleColor: "15857A", subtitleColor: "404040", metaColor: "707070", footerColor: "909090" },
  table: { headerBg: "15857A", headerText: "FFFFFF", accentLine: "15857A", innerLine: "D5D0C8", surface: "F0EDE5" },
};
const c = (hex) => hex.replace("#","");

// ─── Builders ───
const h1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing:{before:480,after:200,line:312}, children:[new TextRun({text:t,bold:true,size:32,color:c(P.primary),font:{ascii:"Calibri",eastAsia:"SimHei"}})] });
const h2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing:{before:360,after:160,line:312}, children:[new TextRun({text:t,bold:true,size:28,color:c(P.primary),font:{ascii:"Calibri",eastAsia:"SimHei"}})] });
const h3 = t => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing:{before:280,after:120,line:312}, children:[new TextRun({text:t,bold:true,size:24,color:c(P.body),font:{ascii:"Calibri",eastAsia:"SimHei"}})] });
const para = (t,o={}) => new Paragraph({ alignment:o.align||AlignmentType.JUSTIFIED, indent:o.noIndent?undefined:{firstLine:420}, spacing:{line:312,after:o.after||120}, children:[new TextRun({text:t,size:o.size||22,color:o.color||c(P.body),font:{ascii:"Calibri",eastAsia:"Microsoft YaHei"},bold:o.bold||false,italics:o.italic||false})] });
const bullet = (t,lvl=0) => new Paragraph({ bullet:{level:lvl}, spacing:{line:312,after:60}, children:[new TextRun({text:t,size:22,color:c(P.body),font:{ascii:"Calibri",eastAsia:"Microsoft YaHei"}})] });
const bb = (l,d,lvl=0) => new Paragraph({ bullet:{level:lvl}, spacing:{line:312,after:60}, children:[new TextRun({text:l,size:22,color:c(P.body),font:{ascii:"Calibri",eastAsia:"Microsoft YaHei"},bold:true}),new TextRun({text:d,size:22,color:c(P.body),font:{ascii:"Calibri",eastAsia:"Microsoft YaHei"}})] });
const empty = () => new Paragraph({ spacing:{after:60}, children:[] });

function zt(headers,rows,cw) {
  const t=P.table;
  return new Table({
    width:{size:100,type:WidthType.PERCENTAGE},
    borders:{top:{style:BorderStyle.SINGLE,size:2,color:t.accentLine},bottom:{style:BorderStyle.SINGLE,size:2,color:t.accentLine},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE},insideHorizontal:{style:BorderStyle.SINGLE,size:1,color:t.innerLine},insideVertical:{style:BorderStyle.NONE}},
    rows:[
      new TableRow({tableHeader:true,cantSplit:true,children:headers.map((h,i)=>new TableCell({width:cw?{size:cw[i],type:WidthType.PERCENTAGE}:undefined,shading:{type:ShadingType.CLEAR,fill:t.headerBg},margins:{top:60,bottom:60,left:120,right:120},children:[new Paragraph({children:[new TextRun({text:h,bold:true,size:20,color:t.headerText,font:{ascii:"Calibri",eastAsia:"Microsoft YaHei"}})]})]}))}),
      ...rows.map((row,idx)=>new TableRow({cantSplit:true,children:row.map((cell,i)=>new TableCell({width:cw?{size:cw[i],type:WidthType.PERCENTAGE}:undefined,shading:{type:ShadingType.CLEAR,fill:idx%2===0?t.surface:"FFFFFF"},margins:{top:50,bottom:50,left:120,right:120},children:[new Paragraph({children:[new TextRun({text:String(cell),size:20,color:c(P.body),font:{ascii:"Calibri",eastAsia:"Microsoft YaHei"}})]})]}))}))
    ]
  });
}

// ─── Cover ───
function buildCover() {
  const NB={style:BorderStyle.NONE,size:0,color:"FFFFFF"};
  const aNB={top:NB,bottom:NB,left:NB,right:NB,insideHorizontal:NB,insideVertical:NB};
  return new Table({
    width:{size:100,type:WidthType.PERCENTAGE},borders:aNB,
    rows:[
      new TableRow({height:{value:5400,rule:"exact"},children:[new TableCell({shading:{type:ShadingType.CLEAR,fill:c(P.primary)},verticalAlign:"top",borders:aNB,children:[
        new Paragraph({spacing:{before:1600}}),
        new Paragraph({alignment:AlignmentType.LEFT,indent:{left:900},spacing:{line:1200,lineRule:"atLeast"},children:[new TextRun({text:"SILSE Educational Visual Philosophy",size:52,bold:true,color:"FFFFFF",font:{ascii:"Calibri",eastAsia:"SimHei"}})]}),
        new Paragraph({alignment:AlignmentType.LEFT,indent:{left:900},spacing:{before:200,line:500,lineRule:"atLeast"},children:[new TextRun({text:"Design Specification v2.1 \u2014 Learning Scene Model",size:28,color:"E0F0EE",font:{ascii:"Calibri",eastAsia:"Microsoft YaHei"}})]}),
      ]})]}),
      new TableRow({height:{value:5400,rule:"exact"},children:[new TableCell({shading:{type:ShadingType.CLEAR,fill:"FFFFFF"},verticalAlign:"top",borders:aNB,children:[
        new Paragraph({spacing:{before:600}}),
        ...["Produk: ROADMAP PEMULIHAN SILSE (RC-9 Beta)","Fase: Phase A \u2014 Define Educational Experience","Tanggal: 25 Mei 2026","Status: Living Document"].map(l=>new Paragraph({alignment:AlignmentType.LEFT,indent:{left:900},spacing:{after:100,line:312},children:[new TextRun({text:l,size:22,color:c(P.cover.metaColor),font:{ascii:"Calibri",eastAsia:"Microsoft YaHei"}})]})),
        new Paragraph({spacing:{before:1200}}),
        new Paragraph({alignment:AlignmentType.LEFT,indent:{left:900},children:[new TextRun({text:"Native Platform untuk Membuat Pengalaman Belajar Digital",size:20,italics:true,color:c(P.primary),font:{ascii:"Calibri",eastAsia:"Microsoft YaHei"}})]}),
      ]})]}),
    ]
  });
}

// ─── CONTENT ───

function ch1() {
  return [
    h1("1. Identitas Produk"),
    h2("1.1 Apa Itu SILSE?"),
    para("SILSE adalah native platform untuk membuat pengalaman belajar digital. Bukan slide maker, bukan Canva clone, bukan PowerPoint clone, bukan dashboard builder. SILSE berada di persimpangan unik antara buku teks digital interaktif, perjalanan belajar (learning journey), dan modul digital yang terasa hidup. Produk ini dirancang agar siswa SMP/SMA dapat membaca, berinteraksi, dan belajar dari konten yang disajikan guru tanpa merasa seperti sedang melihat dashboard admin atau presentasi PowerPoint yang membosankan."),
    para("Dalam ekosistem SILSE, guru adalah desainer pengalaman belajar. Setiap canvas bukanlah slide statis melainkan sebuah Learning Scene \u2014 micro-learning environment yang harus mampu menuntun perhatian siswa, menyediakan ruang interaksi yang jelas, dan menghormati kapasitas kognitif mereka. Produk ini harus terasa seperti aplikasi belajar kelas dunia, bukan seperti builder tool yang menyajikan wireframe kepada siswa."),
    para("Fondasi teknis SILSE sudah cukup kuat: renderer berfungsi, export berfungsi, block system berfungsi. Yang belum ada adalah educational visual language, interaction philosophy, learning flow grammar, dan cognitive hierarchy. Dokumen ini mendefinisikan semua itu dari akar."),

    h2("1.2 Yang BUKAN SILSE"),
    zt(["Style","Cocok?","Alasan"],[
      ["Dashboard App","TIDAK","Dashboard untuk monitoring data, bukan untuk belajar. Terlalu banyak informasi bersamaan."],
      ["PowerPoint Modern","Kurang","Masih mindset slide statis. Tidak mendukung interaksi, reveal, dan progression."],
      ["Interactive Textbook","YA","Konten dominan, typography kuat, alur belajar jelas, mendukung interaksi."],
      ["Learning Journey","YA","Ada sequence, progression, milestone. Siswa merasa bergerak maju."],
      ["Digital Module","YA","Struktur pedagogis jelas, section punya atmosfer, konten terfokus."],
      ["Interactive Story","YA","Spatial storytelling, reveal, attention steering. Terasa hidup."],
      ["Landing Page","TIDAK","Hanya cantik di atas. Tidak dirancang untuk belajar 45 menit."],
      ["Admin Panel / SaaS","TIDAK","Terlalu data-centric, border dimana-mana, cognitive overload."],
    ],[25,12,63]),

    h2("1.3 Unit Pengalaman Belajar"),
    para("Setiap platform punya unit dasar yang mendefinisikan cara orang berpikir tentang konten di dalamnya. PowerPoint punya slide. Canva punya page. Duolingo punya lesson step. Khan Academy punya concept section. Ruang Murid punya learning module. Unit ini bukan sekadar istilah \u2014 ia menentukan arsitektur mental seluruh produk."),
    para("SILSE harus memakai Learning Scene sebagai unit dasar, bukan slide. Kenapa? Karena scene bisa berisi penjelasan, interaksi, latihan, reveal, simulasi, diskusi, dan refleksi. Scene punya state, progression, dan interaction. Sedangkan slide terlalu presentasi-oriented \u2014 statis, linear, satu arah."),
    zt(["Platform","Unit Dasar","Orientasi"],[
      ["PowerPoint","Slide","Presentasi statis"],
      ["Canva","Page","Desain visual"],
      ["Duolingo","Lesson Step","Langkah belajar interaktif"],
      ["Khan Academy","Concept Section","Penjelasan konsep"],
      ["Ruang Murid","Learning Module","Modul pembelajaran"],
      ["SILSE","Learning Scene","Pengalaman belajar interaktif"],
    ],[25,25,50]),

    h2("1.4 Referensi Inspirasi"),
    bb("Duolingo ","— Progressive disclosure, clear feedback, gamified progression. Setiap langkah fokus pada satu tujuan."),
    bb("Khan Academy ","— Typography-first, content-dominant, clean whitespace. Konten edukasi tidak perlu flashy untuk engaging."),
    bb("Brilliant.org ","— Interactive learning, step-by-step revelation, clean but engaging visual system."),
    bb("Apple Education ","— Dramatic typography, spatial composition, premium feel. Media edukasi bisa beautiful tanpa mengorbankan readability."),
    bb("Notion Education ","— Clean hierarchy, no visual noise, content-first. Minimalis tidak berarti membosankan."),
    para("Yang TIDAK menjadi inspirasi: Canva templates, SaaS dashboards, admin panels, landing page builders, dan Pinterest-worthy graphic design. Semua itu fokus pada kecantikan visual di atas fungsi pembelajaran."),
  ];
}

function ch2() {
  return [
    h1("2. Learning Scene Model"),

    h2("2.1 Engine vs Learning Experience"),
    para("Titik balik besar dalam arsitektur SILSE adalah pemisahan yang jelas antara engine dan learning experience. Engine adalah fondasi teknis: renderer, export, block system, store, token resolver. Engine sudah kuat dan tidak perlu di-redesign. Learning experience adalah lapisan visual pedagogy yang belum terbentuk: educational visual language, interaction philosophy, learning flow grammar, dan cognitive hierarchy."),
    para("Masalah SILSE saat ini bukan engine yang rusak, melainkan visual pedagogy layer yang belum ada. Akibatnya, identitas visual produk pecah: sedikit iOS UI, sedikit dashboard, sedikit slide, sedikit Canva, sedikit LMS, sedikit game UI. Tidak ada satu filosofi yang konsisten. Dokumen ini mendefinisikan filosofi itu dari akar."),

    h2("2.2 Apa Itu Learning Scene?"),
    para("Learning Scene adalah unit dasar pengalaman belajar di SILSE. Satu scene adalah satu momen belajar yang utuh: punya tujuan, punya atmosfer, punya interaksi, dan punya transisi ke scene berikutnya. Scene bukan slide yang statis \u2014 scene bisa punya state (belum dimulai, sedang berjalan, selesai), progression (langkah 1, 2, 3), dan interaction (klik, reveal, drag, type)."),
    para("Satu scene berisi SATU fokus utama. Jika scene berisi tujuan pembelajaran, maka tujuan itulah hero-nya. Jika berisi konsep, maka konsep itulah yang mendominasi. Jika berisi latihan, maka interaksilah yang menjadi fokus. Elemen pendukung seperti navigasi, metadata, dan progress indicator harus secara visual recessive \u2014 hadir tapi tidak mengganggu."),

    h2("2.3 8 Learning Scene Types"),
    para("Design system SILSE dibangun di atas 8 Learning Scene Types. Setiap scene type punya DNA visual yang berbeda karena fungsinya berbeda. Ini bukan template A/B/C yang visual berbeda tapi fungsi sama \u2014 ini adalah scene types yang visual berbeda KARENA fungsi berbeda. Setiap scene type mendefinisikan: fungsi pedagogis, atmosfer visual, layout grammar, interaction affordance, typography treatment, color semantics, density rules, dan motion behavior."),

    h3("2.3.1 Intro Scene"),
    para("Fungsi: Membuka topik, membangun konteks, dan menarik perhatian. Ini adalah first impression \u2014 momen di mana siswa memutuskan apakah mereka akan engage atau tidak. Intro Scene harus dramatis, fokus, dan singkat. Maksimal 1-2 kalimat tujuan, satu visual yang kuat, dan clear entry point ke scene berikutnya."),
    bb("Atmosfer: ","Dramatic, inviting, focused"),
    bb("Layout Grammar: ","hero-center, spotlight, full-bleed"),
    bb("Typography: ","hero (48-56px) untuk judul, bodyLg untuk tujuan, caption untuk konteks"),
    bb("Color: ","accent-dominant, satu warna kuat sebagai anchor"),
    bb("Density: ","minimal \u2014 maksimal 60 kata, 2-3 visual elements, 50%+ whitespace"),
    bb("Motion: ","entrance fade-in (300ms), subtle background shift"),
    bb("State: ","idle \u2192 viewed \u2192 completed (auto-setelah siswa scroll/navigasi)"),

    h3("2.3.2 Concept Scene"),
    para("Fungsi: Menjelaskan inti konsep. Ini adalah meat of the learning experience \u2014 area paling dominan, paling lega, paling fokus pada reading. Concept Scene harus terasa seperti reading mode: nyaman, tidak terburu-buru, dan typography-dominan. Konten disajikan sebagai continuous prose atau structured explanation, bukan kumpulan card kecil."),
    bb("Atmosfer: ","Reading-mode, calm, spacious"),
    bb("Layout Grammar: ","article-flow, split-layout (concept + visual)"),
    bb("Typography: ","sectionTitle (32-36px) untuk heading, body (18-20px) untuk penjelasan, bodyLg untuk definisi"),
    bb("Color: ","netral dominan, accent hanya untuk key terms dan highlights"),
    bb("Density: ","moderate \u2014 80-120 kata, 2-3 visual elements, 35%+ whitespace"),
    bb("Motion: ","progressive reveal untuk penjelasan bertahap, subtle fade-in"),
    bb("State: ","idle \u2192 reading \u2192 completed (setelah siswa selesai baca / scroll ke bawah)"),

    h3("2.3.3 Example Scene"),
    para("Fungsi: Memberi contoh konkret dari konsep. Example Scene bersifat supplementary \u2014 harus secara visual recessive terhadap Concept Scene. Siswa harus tahu bahwa ini adalah pendukung, bukan konten utama. Contoh menggunakan indent visual, background tint yang sangat subtle, dan typography yang sedikit lebih kecil."),
    bb("Atmosfer: ","Contextual, supplementary, recessive"),
    bb("Layout Grammar: ","side-panel, indented, split-layout (concept kiri + contoh kanan)"),
    bb("Typography: ","subsection (24-28px) untuk label contoh, bodySm (16-18px) untuk isi contoh"),
    bb("Color: ","subtle tint background, accent stripe tipis di kiri (bukan full border)"),
    bb("Density: ","compact \u2014 60-80 kata, fokus pada satu contoh yang jelas"),
    bb("Motion: ","slide-in dari kanan atau bawah saat di-reveal (300ms)"),
    bb("State: ","hidden \u2192 revealed \u2192 understood"),

    h3("2.3.4 Practice Scene"),
    para("Fungsi: Latihan interaktif. Practice Scene harus terasa berbeda secara dramatis dari scene membaca. Visual berubah total: background lebih hidup, interactive zone yang jelas, affordance yang mengundang klik. Setiap elemen interaktif punya hover state, active state, dan feedback state. Ini adalah participation zone, bukan reading zone."),
    bb("Atmosfer: ","Energetic, participatory, action-oriented"),
    bb("Layout Grammar: ","interactive-zone, step-flow, split-layout (instruksi + area kerja)"),
    bb("Typography: ","sectionTitle (32-36px) untuk instruksi, bodyLg (20-22px) untuk opsi/area kerja"),
    bb("Color: ","warm tint background rgba(249,115,22,0.05), interactive elements dengan accent color dan elevation"),
    bb("Density: ","moderate \u2014 fokus pada satu aktivitas, clear touch targets, 3-5 interactive elements max"),
    bb("Motion: ","hover lift (2px), click feedback (scale 0.98x), reveal jawaban (slide 300ms)"),
    bb("State: ","idle \u2192 attempting \u2192 answered \u2192 feedback \u2192 completed"),

    h3("2.3.5 Discussion Scene"),
    para("Fungsi: Eksplorasi ide, berpikir kritis, dan percakapan. Discussion Scene mengundang pemikiran, bukan jawaban. Pertanyaan ditampilkan sebagai heading berformat question, diikuti ruang kosong yang mengundang refleksi. Tidak ada jawaban yang langsung terlihat. Scene ini harus terasa seperti ruang aman untuk berpikir."),
    bb("Atmosfer: ","Thoughtful, spacious, contemplative"),
    bb("Layout Grammar: ","spotlight, centered, focus-card"),
    bb("Typography: ","subsection (24-28px) untuk pertanyaan, body (18-20px) untuk konteks, bodyLg untuk thought prompts"),
    bb("Color: ","purple tint rgba(139,92,246,0.04) untuk contemplation"),
    bb("Density: ","low \u2014 1-2 pertanyaan, generous whitespace (40%+), tidak ada visual clutter"),
    bb("Motion: ","subtle pulse pada pertanyaan setelah 3 detik idle (attention steering)"),
    bb("State: ","idle \u2192 thinking \u2192 discussing \u2192 reflected"),

    h3("2.3.6 Reflection Scene"),
    para("Fungsi: Metakognisi \u2014 siswa memikirkan apa yang baru dipelajari. Reflection Scene adalah momen slow-down dalam alur belajar. Spacing lebih longgar, typography sedikit lebih kecil, mood visual lebih lembut. Ini adalah tempat siswa menghentikan rush dan menginternalisasi pembelajaran."),
    bb("Atmosfer: ","Calm, intimate, slow-paced, personal"),
    bb("Layout Grammar: ","narrow-center, spotlight, minimal composition"),
    bb("Typography: ","subsection (24-28px) untuk prompt, body (18-20px) dengan wider line-height (1.8)"),
    bb("Color: ","green tint rgba(16,185,129,0.04) untuk calm, soft tones"),
    bb("Density: ","very low \u2014 1 prompt, sangat lega (45%+ whitespace), tidak ada interactive pressure"),
    bb("Motion: ","minimal \u2014 hanya fade-in, tidak ada motion yang mengundang aksi"),
    bb("State: ","idle \u2192 reflecting \u2192 completed"),

    h3("2.3.7 Assessment Scene"),
    para("Fungsi: Evaluasi pemahaman. Assessment Scene memerlukan kejelasan maksimal. Setiap pertanyaan dan opsi jawaban harus sangat terbaca. Feedback benar/salah harus dramatis dan jelas. Tidak ada elemen yang mengalihkan perhatian dari tugas menjawab. Ini adalah evaluation moment, bukan browsing experience."),
    bb("Atmosfer: ","Focused, decisive, feedback-ready"),
    bb("Layout Grammar: ","step-flow (satu pertanyaan per view), single-question focus"),
    bb("Typography: ","sectionTitle (32-36px) untuk pertanyaan, bodyLg (20-22px) untuk opsi, caption untuk nomor soal"),
    bb("Color: ","neutral, accent hanya untuk feedback state (hijau benar, merah salah)"),
    bb("Density: ","moderate \u2014 satu pertanyaan per view, large touch targets, minimal distraction"),
    bb("Motion: ","feedback: green flash + checkmark (benar) atau red shake + X (salah), 300ms. Score counter (800ms)"),
    bb("State: ","idle \u2192 answering \u2192 submitted \u2192 feedback \u2192 next/complete"),

    h3("2.3.8 Summary Scene"),
    para("Fungsi: Penutup dan konsolidasi pengetahuan. Summary Scene menyajikan poin-poin kunci secara compact dan scannable. Berbeda dari Concept Scene yang membutuhkan reading-mode, Summary Scene harus bisa di-scan dengan cepat. Menggunakan list format yang terstruktur, icon markers, dan visual grouping."),
    bb("Atmosfer: ","Organized, compact, clear, conclusive"),
    bb("Layout Grammar: ","two-column (jika poin banyak), list-flow, structured layout"),
    bb("Typography: ","subsection (24-28px) untuk heading, bodySm (16-18px) untuk poin, caption untuk sumber"),
    bb("Color: ","neutral, checkmark icons dalam accent color untuk key points"),
    bb("Density: ","compact \u2014 5-8 poin kunci, 12px gap antar items, scannable"),
    bb("Motion: ","stagger fade-in untuk poin-poin (50ms delay antar items)"),
    bb("State: ","idle \u2192 reviewing \u2192 completed"),

    h2("2.4 Scene Transition Grammar"),
    para("Scene tidak berdiri sendiri; mereka adalah bagian dari alur belajar yang mengalir. Transisi antar scene harus meaningful \u2014 bukan hanya animasi dekoratif, tapi komunikasi bahwa konteks belajar berubah. Berikut adalah grammar transisi yang mengatur bagaimana scene-scene ini dihubungkan:"),
    zt(["Transition","From \u2192 To","Animation","Rationale"],[
      ["Opening","Intro \u2192 Concept","Fade-in + slide-up (350ms)","Dari dramatic opening ke reading mode, gradual calm-down"],
      ["Deepening","Concept \u2192 Example","Slide-in dari kanan (300ms)","Contoh muncul sebagai supplementary, tidak mengganggu materi"],
      ["Applying","Concept/Example \u2192 Practice","Background shift + interactive elements reveal (400ms)","Visual mood berubah total: dari reading ke action"],
      ["Exploring","Practice \u2192 Discussion","Fade + spacious expand (350ms)","Dari action ke thought, ruang terbuka"],
      ["Pausing","Discussion \u2192 Reflection","Gentle dim + center focus (300ms)","Dari dialog ke internalisasi, makin intimate"],
      ["Evaluating","Reflection \u2192 Assessment","Clear shift + focus ring (250ms)","Dari contemplation ke decision, sharp focus"],
      ["Consolidating","Assessment \u2192 Summary","Organized unfold (350ms)","Dari evaluasi ke konsolidasi, structured reveal"],
      ["Closing","Summary \u2192 next Intro","Cross-fade (400ms)","Penutup bersih, persiapan topik baru"],
    ],[16,22,26,36]),

    h2("2.5 Scene Composition Rules"),
    para("Setiap scene harus mengikuti aturan komposisi yang menjaga konsistensi dan mencegah chaos:"),
    bb("One Focus Rule: ","Satu scene = satu fokus utama. Jika ada lebih dari satu ide utama, pecah menjadi beberapa scene."),
    bb("Atmosphere Integrity: ","Setiap scene harus konsisten dengan atmosfernya. Jangan mencampur Practice Scene yang energik dengan Reflection tone."),
    bb("Progressive Density: ","Scenes yang memerlukan reading (Concept, Summary) boleh lebih dense. Scenes yang memerlukan action (Practice, Assessment) harus lebih sparse."),
    bb("State Visibility: ","Siswa harus selalu tahu di scene mana mereka dan statusnya (idle, in-progress, completed). Progress indicator yang subtle di bagian atas."),
    bb("Exit Clarity: ","Setiap scene harus punya clear exit point \u2014 cara yang jelas untuk melanjutkan ke scene berikutnya. Jangan siswa stuck tanpa tahu apa yang harus dilakukan."),
    bb("Reversibility: ","Siswa harus bisa kembali ke scene sebelumnya tanpa kehilangan progress. Navigasi backward harus selalu tersedia."),
  ];
}

function ch3() {
  return [
    h1("3. Filosofi Visual \u2014 Guided Focus Design"),

    para("Guided Focus Design menempatkan perhatian siswa sebagai aset paling berharga. Setiap piksel di canvas harus punya tujuan: menuntun, menjelaskan, atau memungkinkan interaksi. Ini bukan minimalis total; ini adalah desain yang sengaja mengarahkan fokus melalui kontras, hierarki, dan ritme visual yang dramatis."),

    h2("3.1 Satu Scene = Satu Fokus"),
    para("Satu Learning Scene menyajikan SATU ide utama. Saat ini canvas mencoba menunjukkan semuanya sekaligus: struktur, metadata, navigasi, konten, interaksi, schema, scene, dan indikator. Hasilnya: cognitive overload. Setiap scene harus punya satu hero element yang mendominasi visual, dan semua elemen lain mendukungnya."),

    h2("3.2 Konten Dominan, Editor Menghilang"),
    para("Saat mode preview/present, seluruh editor chrome harus menghilang. Canvas harus terasa seperti aplikasi belajar, bukan builder tool. Builder UI (toolbar, panel, selection ring, label badge) saat ini lebih dominan dari materi pelajaran \u2014 itu kebalik. Dalam mode edit, editor chrome adalah overlay transparan yang muncul hanya saat dibutuhkan. Konten selalu di lapisan paling depan."),

    h2("3.3 Scene Atmosfer, Bukan Border Color"),
    para("Setiap scene type punya atmosfer visualnya sendiri melalui kombinasi background tone, spacing rhythm, icon treatment, dan komposisi layout. Bukan cuma beda warna border atau accent stripe. Intro Scene terasa dramatis, Concept Scene terasa tenang, Practice Scene terasa energik, Reflection Scene terasa intim. Perbedaan mood harus terasa, bukan hanya terlihat."),

    h2("3.4 Hilangkan 70% Garis"),
    para("UI edukasi modern terbaik hampir tidak pakai border. Mereka pakai spacing untuk grouping, surface depth ringan untuk memisahkan area, dan kontras background untuk hierarki. Garis hanya untuk: (1) memisahkan scene berbeda secara dramatis, (2) menandai interactive element, atau (3) mengindikasikan state aktif/fokus. Semua garis dekoratif harus dihapus."),

    h2("3.5 Typography Harus Dramatis"),
    para("Hierarchy: Hero 42-56px, Section title 28-36px, Body 18-22px, Caption 14-16px. Perbedaan antara level harus terasa dramatis (minimal 1.3x), bukan gradual. Weight juga kontras: hero bold/extrabold, section title semibold, body regular, caption light."),

    h2("3.6 Interactive Component Punya State Jelas"),
    para("Komponen interaktif harus punya: hover state yang mengundang klik, tap affordance yang terlihat, motion yang responsif, depth yang menunjukkan clickability, feedback yang jelas, dan reveal sensation yang memuaskan. Jika bisa diklik, harus terlihat bisa diklik. Jika hanya informasi, harus terlihat seperti informasi."),

    h2("3.7 Spatial Storytelling"),
    para("Konten belajar bukan PDF yang di-scroll vertikal. Gunakan: split layout untuk perbandingan, spotlight untuk fokus, progressive disclosure untuk mengungkap informasi, alternating composition untuk mencegah monoton, full-bleed moment untuk momen dramatis, focus card untuk konsep penting, dan concept zoom untuk detail. Setiap scene type boleh menggunakan komposisi spatial yang berbeda sesuai tujuan pedagogisnya."),

    h2("3.8 Builder Labels Tersembunyi"),
    para("Label schema, scene, variant, block type, dan metadata chip hanya muncul di edit mode overlay. Saat siswa melihat konten, mereka tidak boleh melihat informasi teknis. Builder labels hanya muncul saat guru hover atau pilih blok, sebagai tooltip-style overlay yang tidak mengubah layout."),

    h2("3.9 Motion Edukasi, Bukan Startup Demo"),
    para("Motion yang diperbolehkan: focus transition, reveal jawaban, progress indicator, quiz feedback, attention steering. Motion yang dilarang: bouncing, elastic/spring, scaling besar, rotation (kecuali flip-card), flashy entrance, holographic aurora, confetti, parallax, auto-playing animation. Setiap motion harus menjawab: apakah ini membantu siswa belajar?"),

    h2("3.10 Inspirasi = Duolingo, Bukan Canva"),
    para("SILSE lebih dekat ke Duolingo, Khan Academy, Brilliant, Apple Education, Notion education templates. Tujuannya: konten terbaca jelas dari belakang kelas dan terasa hidup di layar laptop siswa. Bukan agar terlihat cantik di Behance. Visual yang melayani ego desainer justru mengganggu tujuan utama produk."),
  ];
}

function ch4() {
  return [
    h1("4. Educational Typography Spec"),

    h2("4.1 Typography Scale"),
    para("Scale untuk media interaktif edukasi, dirancang untuk layar laptop/tablet sebagai primary medium:"),
    zt(["Token","Classroom","Projector","Student","Print","Weight","LH","Usage"],[
      ["hero","48-56px","56-64px","42-48px","28-32pt","ExtraBold 800","1.1","Cover title, scene openers"],
      ["sectionTitle","32-36px","40-44px","28-32px","20-24pt","Bold 700","1.2","Scene headings"],
      ["subsection","24-28px","28-32px","22-26px","16-18pt","Semibold 600","1.3","Sub-headings, example labels"],
      ["bodyLg","20-22px","24-26px","18-20px","13-14pt","Medium 500","1.5","Definitions, primary reading"],
      ["body","18-20px","22-24px","16-18px","12-13pt","Regular 400","1.6","Body text, explanations"],
      ["bodySm","16-18px","18-20px","14-16px","10-11pt","Regular 400","1.5","Secondary text, notes"],
      ["caption","14-16px","16-18px","13-14px","9-10pt","Light 300","1.4","Labels, metadata"],
      ["micro","12-13px","14-15px","11-12px","8pt","Medium 500","1.3","Chips (edit only), tiny labels"],
    ],[12,11,11,11,9,14,7,25]),
    para("Rasio minimum antar level: hero ke sectionTitle 1.4x, sectionTitle ke bodyLg 1.5x, body ke caption 1.25x. Jika kurang dari ini, hierarchy tidak terbaca."),

    h2("4.2 Typography Rhythm Rules"),
    bb("Contrast: ","Size minimal 1.25x dan weight minimal 2 step antara level berturutan."),
    bb("Breathing: ","Setelah heading, minimal 16px spacing sebelum body text."),
    bb("Pacing: ","Maksimal 3 level typography per scene. Jangan gunakan semua level sekaligus."),
    bb("Alignment: ","Heading flush-left. Centered hanya untuk hero di Intro Scene. Body selalu flush-left."),
    bb("Orphan: ","Tidak ada heading di bawah halaman tanpa minimal 2 baris body text."),

    h2("4.3 Per-Scene Typography Treatment"),
    zt(["Scene Type","Heading Style","Body Style","Atmosphere Effect"],[
      ["Intro Scene","hero, dramatic","bodyLg, 1-2 kalimat","Dramatic, inviting, focused"],
      ["Concept Scene","sectionTitle, bold","body, paragraf lega","Reading-mode, calm, spacious"],
      ["Example Scene","subsection, italic accent","bodySm, indented","Supplementary, recessive"],
      ["Practice Scene","sectionTitle, action-oriented","bodyLg, clear affordance","Energetic, participatory"],
      ["Discussion Scene","subsection, question format","body, open-ended","Thoughtful, spacious"],
      ["Reflection Scene","subsection, calm","body, wider LH (1.8)","Intimate, slow-paced"],
      ["Assessment Scene","sectionTitle, bold accent","bodyLg, clear options","Focused, decisive"],
      ["Summary Scene","subsection, structured","bodySm, list-friendly","Compact, scannable"],
    ],[16,22,22,40]),

    h2("4.4 Display Mode Adjustments"),
    zt(["Adjustment","Classroom","Projector","Print","Student"],[
      ["Base scale","1.0x","1.15-1.2x","0.85x (pt)","0.9x"],
      ["Line height modifier","default","-0.05","default","+0.05"],
      ["Min body size","18px","22px","12pt","16px"],
      ["Hero size","48-56px","56-64px","28-32pt","42-48px"],
      ["Weight adjustment","none","none","body=min 400","none"],
      ["Color","semantic colors","high contrast","black only","semantic colors"],
      ["Background","white #FFFFFF","warm #FFFBF0","white #FFFFFF","clean white"],
    ],[20,16,16,16,16,16,16]),
  ];
}

function ch5() {
  return [
    h1("5. Spatial Layout System"),

    h2("5.1 Layout Grammar per Scene Type"),
    para("Layout grammar mendefinisikan aturan spatial yang boleh dan tidak boleh digunakan untuk setiap scene type. Ini mencegah penggunaan komposisi yang tidak sesuai dengan tujuan pedagogis:"),
    zt(["Scene Type","Recommended Grammar","Forbidden Grammar","Rationale"],[
      ["Intro","hero-center, spotlight, full-bleed","card-flow, grid-2, grid-3","Intro harus dramatic dan focused, bukan browsable"],
      ["Concept","article-flow, split-layout","card-flow, grid-3","Concept perlu reading flow, bukan card browsing"],
      ["Example","side-panel, indented, split-layout","hero-center, full-bleed","Example supplementary, jangan dominan"],
      ["Practice","interactive-zone, step-flow, split-layout","article-flow","Practice perlu interaction, bukan reading"],
      ["Discussion","spotlight, centered, focus-card","grid-2, card-flow","Discussion perlu fokus pada satu pertanyaan"],
      ["Reflection","narrow-center, spotlight, minimal","full-bleed, grid-3","Reflection perlu intimacy, bukan spectacle"],
      ["Assessment","step-flow, single-question","article-flow, grid-2","Assessment perlu decision focus"],
      ["Summary","two-column, list-flow, structured","hero-center, full-bleed","Summary perlu scanning, bukan drama"],
    ],[14,24,22,40]),

    h2("5.2 Spatial Storytelling Techniques"),
    zt(["Technique","Description","Best For","Example"],[
      ["Split Layout","Dua kolom: konsep + visual","Concept, Example","Definisi kiri, ilustrasi kanan"],
      ["Spotlight","Satu elemen besar di tengah","Intro, Discussion, Reflection","Satu pertanyaan besar di tengah"],
      ["Progressive Disclosure","Konten terungkap bertahap","Concept, Assessment","Klik untuk reveal penjelasan"],
      ["Alternating Composition","Layout bergantian","Concept berurutan","Paragraf 1 kiri, Paragraf 2 kanan"],
      ["Full-Bleed Moment","Konten memenuhi area tanpa margin","Intro, transition","Hero image atau quote besar"],
      ["Focus Card","Satu card dominan, lain subtle","Example, Discussion","Satu pertanyaan di card besar"],
      ["Concept Zoom","Detail muncul saat hover/klik","Concept, Example","Hover istilah untuk definisi"],
      ["Step Flow","Langkah-langkah berurutan","Practice, Assessment","Step 1, 2, 3 dengan progress bar"],
    ],[16,28,20,36]),

    h2("5.3 Whitespace Budget"),
    zt(["Area","Minimum","Recommended","Notes"],[
      ["Between scenes","40px","56px","Harus terasa sebagai scene break yang jelas"],
      ["After scene heading","16px","24px","Breathing room sebelum konten"],
      ["Between paragraphs","12px","16px","Cukup memisahkan tanpa memutus flow"],
      ["Between list items","8px","12px","Rapat tapi tidak menumpuk"],
      ["Around interactive elements","16px","24px","Touch target area, tidak boleh rapat"],
      ["Scene margin (sides)","48px","64px","Optimal reading width"],
      ["Scene margin (top)","32px","48px","Breathing room"],
      ["Scene margin (bottom)","24px","32px","Lebih ketat, konten bisa extend ke bawah"],
    ],[26,14,16,44]),

    h2("5.4 Content Density Rules"),
    bb("Word Count: ","Maksimal 120 kata per scene. Jika melebihi, pecah ke scene berikutnya."),
    bb("Element Count: ","Maksimal 5 distinct visual elements per scene."),
    bb("Visual Weight: ","Konten maksimal 65% area. Sisa 35% harus whitespace."),
    bb("Interactive Density: ","Maksimal 3 interactive elements per scene. Lebih banyak = decision paralysis."),
    bb("Scene-Specific Override: ","Intro Scene: maks 60 kata, 50%+ whitespace. Reflection Scene: maks 40 kata, 45%+ whitespace. Summary Scene: boleh 8-10 poin, tapi compact spacing."),
  ];
}

function ch6() {
  return [
    h1("6. Interaction Language"),

    h2("6.1 Hover States"),
    zt(["Element","Hover Effect","Duration","Easing"],[
      ["Quiz Option","Background tint + lift 2px","150ms","ease-out"],
      ["Flashcard","Lift 4px + shadow deepen","200ms","ease-out"],
      ["Reveal Button","Background darken + icon rotate 90deg","150ms","ease-out"],
      ["Navigation Link","Underline fade-in + color shift","100ms","ease-out"],
      ["Drag Handle","Shadow appear + cursor change","100ms","ease-out"],
      ["Step Button","Background tint + scale 1.02x","120ms","ease-out"],
      ["Collapse Header","Background tint + chevron rotate","150ms","ease-out"],
      ["Inline Term","Tooltip with definition","200ms","ease-out"],
    ],[18,32,14,14]),
    para("Durasi MAKSIMAL 200ms. Easing selalu ease-out untuk masuk, ease-in untuk keluar. Tidak ada bounce/elastic."),

    h2("6.2 Reveal Patterns"),
    bb("Slide-Reveal: ","Konten muncul dari bawah/sisi. 300-400ms, ease-out. Cocok untuk jawaban, langkah solusi."),
    bb("Fade-Reveal: ","Opacity transition. 250-350ms, ease-out. Cocok untuk detail tambahan di tempat."),
    bb("Flip-Reveal: ","Card 180deg. 400-500ms, ease-in-out. Cocok untuk flashcard."),
    bb("Expand-Reveal: ","Collapsed ke expanded. 300-400ms, ease-out. Cocok untuk accordion, show-more."),
    bb("Spotlight-Reveal: ","Elemen lain fade/dim, target spotlight. 250ms. Cocok untuk concept zoom."),

    h2("6.3 Quiz Feedback"),
    h3("Benar"),
    bullet("Background flash hijau ringan rgba(16,185,129,0.15), 400ms"),
    bullet("Checkmark scale-in (0 ke 1, 200ms, ease-out)"),
    bullet("Text feedback fade-in (150ms delay, 200ms duration)"),
    bullet("TIDAK ada confetti, fireworks, atau celebratory animation berlebihan"),
    h3("Salah"),
    bullet("Background flash merah ringan rgba(239,68,68,0.1), 400ms"),
    bullet("Shake horizontal: 3 cycle, amplitude 4px, 300ms"),
    bullet("X icon scale-in (0 ke 1, 200ms, ease-out)"),
    bullet("Correct answer highlighted setelah 500ms delay"),

    h2("6.4 Motion Rules"),
    h3("Diperbolehkan"),
    bullet("Focus transition (200-400ms), reveal (250-500ms), progress (300-800ms)"),
    bullet("Feedback benar/salah (200-400ms), attention steering (150-300ms)"),
    bullet("Section change (250-400ms), state change (100-200ms)"),
    h3("Dilarang"),
    bullet("Bouncing, elastic/spring physics, scaling > 1.05x, rotation (kecuali flip-card 180deg)"),
    bullet("Flashy entrance, holographic aurora, confetti, parallax, auto-playing animation"),

    h2("6.5 Interactive Component States"),
    zt(["State","Visual","Transition","Applies To"],[
      ["Default","Clean, no special effect","\u2014","All interactive"],
      ["Hover","Background tint + subtle lift","150ms ease-out","All clickable"],
      ["Active (pressing)","Scale down 0.98x + shadow reduce","80ms ease-out","Buttons, options"],
      ["Focused (keyboard)","2px outline, accent color","0ms","All interactive"],
      ["Selected","Accent border + check icon","200ms ease-out","Quiz options, multi-select"],
      ["Correct","Green background + checkmark","300ms ease-out","Quiz options"],
      ["Incorrect","Red shake + X icon","300ms","Quiz options"],
      ["Disabled","Opacity 0.5, no-interact cursor","150ms","Used/locked items"],
      ["Revealed","Content visible, trigger subtle","250ms ease-out","Flashcards, reveal buttons"],
      ["Completed","Muted + checkmark badge","300ms ease-out","Steps, scenes, activities"],
    ],[14,24,16,36]),

    h2("6.6 Attention Steering"),
    bb("Progressive Highlight: ","Elemen lain fade (opacity 0.7) selama 300ms saat scene baru muncul, lalu kembali normal."),
    bb("Pulse Indicator: ","Subtle pulse (scale 1.0 ke 1.02 ke 1.0, 600ms) hanya untuk elemen WAJIB diinteraksi."),
    bb("Scroll Hint: ","Chevron-down muncul setelah 2 detik idle jika ada konten di bawah fold."),
    bb("Focus Ring: ","2px accent color outline saat keyboard navigation aktif."),
    bb("Spotlight Mode: ","Guru klik elemen untuk spotlight. Elemen lain blur/dim. Mode present only."),
  ];
}

function ch7() {
  return [
    h1("7. Color Semantics"),

    h2("7.1 Semantic Color by Scene Type"),
    para("Setiap scene type punya palette warna yang konsisten dan meaningful. Warna bukan dekorasi \u2014 warna adalah komunikasi. Ketika siswa melihat tint biru, mereka tahu ini tujuan. Tint hijau, ini refleksi. Tint oranye, ini latihan. Konsistensi ini membangun visual vocabulary yang tidak perlu dipelajari secara eksplisit."),
    zt(["Scene Type","Primary Tint","Accent","Background","Purpose"],[
      ["Intro","rgba(59,130,246,0.08)","accent-dominant","#FAFCFF","Opening, invitation, drama"],
      ["Concept","none/transparent","key-terms only","#FFFFFF","Reading, focus, clarity"],
      ["Example","rgba(0,0,0,0.02)","italic stripe left","#FEFEFE","Supplementary, contextual"],
      ["Practice","rgba(249,115,22,0.05)","interactive accent","#FFFCFA","Action, energy, participation"],
      ["Discussion","rgba(139,92,246,0.04)","question accent","#FBFAFF","Contemplation, openness"],
      ["Reflection","rgba(16,185,129,0.04)","soft green accent","#FAFFFE","Calm, intimate, slow"],
      ["Assessment","none/very subtle","feedback accent","#FFFFFF","Focus, decision, clarity"],
      ["Summary","none/transparent","checkmark accent","#FFFFFF","Organization, consolidation"],
    ],[14,20,16,14,36]),

    h2("7.2 Anti-Pattern: Rainbow Outline"),
    para("Yang TIDAK boleh: outline berbeda warna per tipe blok (oranye, hijau, biru, ungu) yang menghasilkan rainbow effect. Ini adalah pendekatan dashboard admin, bukan educational design. Gunakan background tint untuk differentiation, bukan border color. Border hanya untuk interactive affordance dan state indication."),

    h2("7.3 Print Mode Color Rules"),
    para("Print mode menghapus semua warna dan efek. Semua teks menjadi hitam (#000000). Semua background menjadi putih (#FFFFFF). Semua accent menjadi grayscale. Tidak ada shadow. Tidak ada gradient. Border menjadi thick black lines. Ini memastikan fotokopi tetap terbaca."),
  ];
}

function ch8() {
  return [
    h1("8. Component Grammar"),

    h2("8.1 Educational Components vs UI Components"),
    para("SILSE membedakan dua jenis komponen: Educational Components dan UI Components. Educational Components menyajikan konten belajar (definisi, pertanyaan, opsi quiz, flashcard). UI Components melayani navigasi dan kontrol (button, tab, dropdown). Educational Components mengikuti scene type grammar; UI Components mengikuti iOS Visual Contract untuk app chrome."),

    h2("8.2 Educational Component Identity"),
    zt(["Component","Role","Scene Types","Visual DNA"],[
      ["Concept Card","Menjelaskan konsep utama","Concept","Dominant, spacious, no border"],
      ["Example Block","Memberi contoh konkret","Example","Recessive, indented, subtle tint"],
      ["Question Card","Mengajukan pertanyaan","Discussion, Assessment","Centered, focused, clear affordance"],
      ["Option Button","Pilihan jawaban","Practice, Assessment","Clickable, hover state, feedback"],
      ["Flashcard","Konsep dua sisi","Concept, Practice","Flippable, depth, reveal sensation"],
      ["Step Indicator","Progress dalam langkah","Practice, Assessment","Linear, clear state, progression"],
      ["Reflection Prompt","Ajakan metakognisi","Reflection","Intimate, slow, no pressure"],
      ["Key Point Item","Poin kunci ringkas","Summary","Compact, scannable, checkmark"],
    ],[16,18,18,38]),

    h2("8.3 Density Rules per Component"),
    zt(["Component","Max Words","Max Interactive Elements","Whitespace Requirement"],[
      ["Concept Card","120","0 (reading only)","35%+"],
      ["Example Block","60","0-1 (optional reveal)","30%+"],
      ["Question Card","30","1 (answer area)","40%+"],
      ["Option Button","15 each","1 (select)","padding 16px minimum"],
      ["Flashcard","40 per side","1 (flip)","40%+"],
      ["Step Indicator","5 per step","1 (next/submit)","progress bar only"],
      ["Reflection Prompt","25","0 (thinking only)","50%+"],
      ["Key Point Item","20 per item","0","12px gap between items"],
    ],[18,14,22,36]),
  ];
}

function ch9() {
  return [
    h1("9. Anti-Patterns & Diagnosis"),

    h2("9.1 Masalah Saat Ini"),
    para("Berdasarkan analisis screenshot canvas, ada lima masalah fundamental yang semuanya berasal dari akar yang sama: belum ada educational visual philosophy yang konsisten. Identitas visual SILSE masih campuran: sedikit iOS UI, sedikit dashboard, sedikit slide, sedikit Canva, sedikit LMS, sedikit game UI. Akibatnya, identitasnya pecah."),

    h3("9.1.1 Tidak Ada Focus Hierarchy"),
    para("Semua elemen terasa sama penting. Mata siswa tidak tahu mana judul utama, mana area belajar, mana interaksi, mana progress. Visual terasa seperti editor, bukan pengalaman belajar."),

    h3("9.1.2 Canvas Terlihat Seperti Wireframe"),
    para("Border dimana-mana, garis tipis dimana-mana, chip dimana-mana, badge dimana-mana, label dimana-mana. Cognitive noise tinggi. Siswa melihat struktur teknis, bukan materi pelajaran."),

    h3("9.1.3 Typography Tidak Punya Rhythm"),
    para("Semua teks ukuran mirip, weight mirip, spacing tanggung. Tidak ada visual breathing, typographic rhythm, atau content pacing."),

    h3("9.1.4 Layout Tidak Memiliki Learning Flow"),
    para("Block hanya stacked vertically. Tidak ada sequence, reveal, progression, atau attention steering. Tampilan: kumpulan card. Bukan: alur pembelajaran."),

    h3("9.1.5 Terlalu Banyak Ornament Kecil"),
    para("Garis warna atas, garis bawah, chip norma, icon kecil, outline berwarna-warni, label schema, badge scene. Secara individual kecil, secara total: visual overload."),

    h2("9.2 Anti-Pattern Catalog"),
    zt(["Anti-Pattern","Current","Problem","Solution"],[
      ["Border Everything","Setiap blok punya border","Cognitive noise, wireframe look","Spacing + background tint"],
      ["Label Permanence","Schema/scene labels selalu visible","Builder feel, bukan learning","Edit overlay only, hide di preview"],
      ["Flat Typography","Semua teks size & weight mirip","No hierarchy, no rhythm","Dramatic scale + weight contrast"],
      ["Card Stack","Semua scene = card vertikal","Monoton, no spatial storytelling","Scene-specific layout grammar"],
      ["Decorative Motion","Holographic, aurora, confetti","Mengalihkan, tidak pedagogis","Functional motion only"],
      ["Chip Overload","Chip/badge di setiap elemen","Visual clutter","Only essential chips, rest tooltip"],
      ["Color Border Coding","Outline berbeda warna per tipe","Rainbow effect","Background tint + spatial separation"],
      ["Dense Layout","Konten memenuhi 80%+ area","Cognitive overload","35% whitespace minimum, 120 word max"],
    ],[16,22,24,38]),

    h2("9.3 Yang Harus Dihapus dari Canvas (Preview Mode)"),
    bullet("Block type label (Definisi, Kartu 1, Dokumen) \u2014 edit overlay only"),
    bullet("Schema chip \u2014 panel properties only"),
    bullet("Scene badge \u2014 scene navigator only"),
    bullet("Variant indicator \u2014 block properties only"),
    bullet("Selection ring permanen \u2014 subtle hover indicator only"),
    bullet("Outline warna per tipe \u2014 background tint replacement"),
    bullet("Garis pemisah tipis antar block \u2014 spacing replacement"),
    bullet("Metadata chip (norma, kompetensi) \u2014 panel only"),
    bullet("Grip handle permanen \u2014 hover in edit mode only"),
    bullet("PremiumBadge holographic \u2014 simple functional badge replacement"),
  ];
}

function ch10() {
  return [
    h1("10. Development Roadmap \u2014 10 Step Sequence"),

    para("Urutan ini bukan suggestion \u2014 ini adalah dependency chain. Setiap tahap tergantung pada output tahap sebelumnya. Skip satu tahap, dan tahap berikutnya akan dibangun di atas fondasi yang ambigu. Inilah yang terjadi saat ini: kita langsung coding tanpa definisikan philosophy dan scene model dulu."),

    zt(["Step","Output","Depends On","Estimated Duration"],[
      ["1","Educational Philosophy","Nothing (foundational)","1 minggu"],
      ["2","Learning Scene Model","Philosophy","1 minggu"],
      ["3","Typography System","Scene Model (know what each scene needs)","1-2 minggu"],
      ["4","Spatial Rhythm","Typography (know the scale)","1 minggu"],
      ["5","Color Semantics","Scene Model (know the moods)","3-5 hari"],
      ["6","Interaction Language","Scene Model (know the interactions)","1-2 minggu"],
      ["7","Component Grammar","Typography + Spatial + Color + Interaction","1 minggu"],
      ["8","Density Rules","All above (test with real content)","3-5 hari"],
      ["9","Template Composition","All above (compose scenes into flows)","1-2 minggu"],
      ["10","Implementation","All above (code the system)","3-4 minggu"],
    ],[8,22,32,22]),

    para("Total estimasi: 10-14 minggu untuk menyelesaikan seluruh design system dan implementasi. Tapi setelah selesai, SILSE tidak lagi terasa seperti editor dengan template pendidikan \u2014 SILSE akan terasa seperti native platform untuk membuat pengalaman belajar digital. Dan itu market positioning yang jauh lebih kuat."),

    h2("10.1 Kenapa Urutan Ini Tidak Bisa Di-skip"),
    para("Kalau langsung coding typography tanpa definisikan Scene Model dulu, kita akan bikin typography untuk... apa? Slide? Page? Card? Tanpa unit yang jelas, semua keputusan desain jadi floating. Kalau langsung bikin template tanpa component grammar, template akan hancur saat isi berubah. Kalau langsung implementasi tanpa density rules, hasilnya akan padat dan melelahkan seperti sekarang."),
    para("Urutan ini memastikan setiap keputusan desain punya fondasi yang jelas. Philosophy menjawab mengapa. Scene Model menjawab apa. Typography/Rhythm/Color/Interaction menjawab bagaimana. Component/Density/Template menjawab komposisi. Implementation menjawab eksekusi. Tanpa salah satu, bangunan tidak utuh."),

    h2("10.2 Step 1-2: Philosophy + Scene Model (MINGGU INI)"),
    para("Dokumen ini adalah output Step 1 dan 2. Setelah disetujui, kita lanjut ke Step 3 (Typography System) yang akan mengoverhaul education-typography.ts berdasarkan scene-based scale yang sudah didefinisikan di Bab 4. Tidak ada coding sebelum Step 1-2 disetujui, karena setiap baris kode harus bisa diuji terhadap philosophy dan scene model."),
  ];
}

// ─── ASSEMBLE ───
async function generate() {
  const doc = new Document({
    styles: {
      default: {
        document: { run:{font:{ascii:"Calibri",eastAsia:"Microsoft YaHei"},size:22,color:c(P.body)}, paragraph:{spacing:{line:312}} },
        heading1: { run:{font:{ascii:"Calibri",eastAsia:"SimHei"},size:32,bold:true,color:c(P.primary)}, paragraph:{spacing:{before:480,after:200,line:312}} },
        heading2: { run:{font:{ascii:"Calibri",eastAsia:"SimHei"},size:28,bold:true,color:c(P.primary)}, paragraph:{spacing:{before:360,after:160,line:312}} },
        heading3: { run:{font:{ascii:"Calibri",eastAsia:"SimHei"},size:24,bold:true,color:c(P.body)}, paragraph:{spacing:{before:280,after:120,line:312}} },
      },
    },
    sections: [
      // Cover
      { properties:{page:{size:{width:11906,height:16838},margin:{top:0,bottom:0,left:0,right:0}}}, children:[buildCover()] },
      // TOC + Body
      {
        properties:{page:{size:{width:11906,height:16838},margin:{top:1440,bottom:1440,left:1701,right:1417},pageNumbers:{start:1,formatType:NumberFormat.DECIMAL}}},
        headers:{default:new Header({children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:"SILSE Educational Visual Philosophy \u2014 v2.1",size:16,color:c(P.secondary),font:{ascii:"Calibri",eastAsia:"Microsoft YaHei"}})]})]})},
        footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({children:[PageNumber.CURRENT],size:18,color:c(P.secondary)})]})]})},
        children:[
          new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:200,after:200},children:[new TextRun({text:"Daftar Isi",size:32,bold:true,color:c(P.primary),font:{ascii:"Calibri",eastAsia:"SimHei"}})]}),
          new TableOfContents("Daftar Isi",{hyperlink:true,headingStyleRange:"1-3"}),
          new Paragraph({children:[new PageBreak()]}),
          ...ch1(),
          ...ch2(),
          ...ch3(),
          ...ch4(),
          ...ch5(),
          ...ch6(),
          ...ch7(),
          ...ch8(),
          ...ch9(),
          ...ch10(),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const out = "/home/z/my-project/download/SILSE-Educational-Visual-Philosophy-v2.1.docx";
  fs.writeFileSync(out, buffer);
  console.log("Saved:", out);
  return out;
}

generate().catch(console.error);
