const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  PageBreak, Header, Footer, PageNumber, NumberFormat,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  TableOfContents,
} = require("docx");
const fs = require("fs");

// ─── Palette: Warm Teal (WM-1) for Education ───
const P = {
  primary: "15857A",
  body: "2A3518",
  secondary: "5B7A6A",
  accent: "FF6A3B",
  surface: "F0EDE5",
  cover: {
    titleColor: "15857A",
    subtitleColor: "404040",
    metaColor: "707070",
    footerColor: "909090",
  },
  table: {
    headerBg: "15857A",
    headerText: "FFFFFF",
    accentLine: "15857A",
    innerLine: "D5D0C8",
    surface: "F0EDE5",
  },
};

const c = (hex) => hex.replace("#", "");

// ─── Reusable builders ───
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 200, line: 312 },
    children: [new TextRun({ text, bold: true, size: 32, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 160, line: 312 },
    children: [new TextRun({ text, bold: true, size: 28, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 280, after: 120, line: 312 },
    children: [new TextRun({ text, bold: true, size: 24, color: c(P.body), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
  });
}
function para(text, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.JUSTIFIED,
    indent: opts.noIndent ? undefined : { firstLine: 420 },
    spacing: { line: 312, after: opts.after || 120 },
    children: [new TextRun({ text, size: opts.size || 22, color: opts.color || c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, bold: opts.bold || false, italics: opts.italic || false })],
  });
}
function paraRuns(runs, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.JUSTIFIED,
    indent: opts.noIndent ? undefined : { firstLine: 420 },
    spacing: { line: 312, after: opts.after || 120 },
    children: runs.map(r => new TextRun({
      text: r.text,
      size: r.size || 22,
      color: r.color || c(P.body),
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
      bold: r.bold || false,
      italics: r.italic || false,
    })),
  });
}
function bullet(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { line: 312, after: 60 },
    children: [new TextRun({ text, size: 22, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
  });
}
function bulletBold(label, desc, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { line: 312, after: 60 },
    children: [
      new TextRun({ text: label, size: 22, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, bold: true }),
      new TextRun({ text: desc, size: 22, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
    ],
  });
}

// Table helper — horizontal-only style
function specTable(headers, rows, colWidths) {
  const t = P.table;
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: t.accentLine },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: t.accentLine },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: t.innerLine },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: headers.map((h, i) =>
          new TableCell({
            width: colWidths ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
            shading: { type: ShadingType.CLEAR, fill: t.headerBg },
            margins: { top: 60, bottom: 60, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20, color: t.headerText, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })] })],
          })
        ),
      }),
      ...rows.map(row =>
        new TableRow({
          cantSplit: true,
          children: row.map((cell, i) =>
            new TableCell({
              width: colWidths ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
              shading: { type: ShadingType.CLEAR, fill: "FFFFFF" },
              margins: { top: 50, bottom: 50, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: String(cell), size: 20, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })] })],
            })
          ),
        })
      ),
    ],
  });
}

// Zebra table for large data
function zebraTable(headers, rows, colWidths) {
  const t = P.table;
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: t.accentLine },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: t.accentLine },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: t.innerLine },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: headers.map((h, i) =>
          new TableCell({
            width: colWidths ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
            shading: { type: ShadingType.CLEAR, fill: t.headerBg },
            margins: { top: 60, bottom: 60, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20, color: t.headerText, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })] })],
          })
        ),
      }),
      ...rows.map((row, idx) =>
        new TableRow({
          cantSplit: true,
          children: row.map((cell, i) =>
            new TableCell({
              width: colWidths ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
              shading: { type: ShadingType.CLEAR, fill: idx % 2 === 0 ? t.surface : "FFFFFF" },
              margins: { top: 50, bottom: 50, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: String(cell), size: 20, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })] })],
            })
          ),
        })
      ),
    ],
  });
}

// ─── Cover (R4 Top Color Block variant for Education) ───
function buildCover() {
  const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };
  
  const titleText = "SILSE Educational Visual Philosophy";
  const subtitleText = "Design Specification v2.0";
  const metaLines = [
    "Produk: ROADMAP PEMULIHAN SILSE (RC-9 Beta)",
    "Fase: Phase A \u2014 Define Educational Experience",
    "Tanggal: 25 Mei 2026",
    "Status: Living Document",
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allNoBorders,
    rows: [
      // Color block top
      new TableRow({
        height: { value: 5400, rule: "exact" },
        children: [new TableCell({
          shading: { type: ShadingType.CLEAR, fill: c(P.primary) },
          verticalAlign: "top",
          borders: allNoBorders,
          children: [
            new Paragraph({ spacing: { before: 1600 } }),
            new Paragraph({
              alignment: AlignmentType.LEFT,
              indent: { left: 900 },
              spacing: { line: 1200, lineRule: "atLeast" },
              children: [new TextRun({ text: titleText, size: 52, bold: true, color: "FFFFFF", font: { ascii: "Calibri", eastAsia: "SimHei" } })],
            }),
            new Paragraph({
              alignment: AlignmentType.LEFT,
              indent: { left: 900 },
              spacing: { before: 200, line: 500, lineRule: "atLeast" },
              children: [new TextRun({ text: subtitleText, size: 28, color: "E0F0EE", font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
            }),
          ],
        })],
      }),
      // White block bottom — meta
      new TableRow({
        height: { value: 5400, rule: "exact" },
        children: [new TableCell({
          shading: { type: ShadingType.CLEAR, fill: "FFFFFF" },
          verticalAlign: "top",
          borders: allNoBorders,
          children: [
            new Paragraph({ spacing: { before: 600 } }),
            ...metaLines.map(line => new Paragraph({
              alignment: AlignmentType.LEFT,
              indent: { left: 900 },
              spacing: { after: 100, line: 312 },
              children: [new TextRun({ text: line, size: 22, color: c(P.cover.metaColor), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
            })),
            new Paragraph({ spacing: { before: 1200 } }),
            new Paragraph({
              alignment: AlignmentType.LEFT,
              indent: { left: 900 },
              children: [new TextRun({ text: "Guided Focus Design for Interactive Educational Media", size: 20, italics: true, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
            }),
          ],
        })],
      }),
    ],
  });
}

// ─── CONTENT SECTIONS ───

function section1_IdentitasProduk() {
  return [
    h1("1. Identitas Produk"),

    h2("1.1 Apa Itu SILSE?"),
    para("SILSE adalah platform pembuatan konten edukasi interaktif untuk guru SMP/SMA di Indonesia. Bukan sekadar alat membuat slide, bukan juga landing page builder. SILSE berada di persimpangan unik antara buku teks digital interaktif, perjalanan belajar (learning journey), dan modul digital yang terasa hidup. Produk ini dirancang agar siswa dapat membaca, berinteraksi, dan belajar dari konten yang disajikan guru tanpa merasa seperti sedang melihat dashboard admin atau presentasi PowerPoint yang membosankan."),
    para("Dalam ekosistem SILSE, guru adalah desainer pengalaman belajar. Setiap halaman canvas bukanlah slide statis melainkan sebuah micro-learning environment yang harus mampu menuntun perhatian siswa, menyediakan ruang interaksi yang jelas, dan menghormati kapasitas kognitif mereka. Produk ini harus terasa seperti aplikasi belajar kelas dunia, bukan seperti builder tool yang menyajikan wireframe kepada siswa."),

    h2("1.2 Yang BUKAN SILSE"),
    para("Menetapkan batasan identitas sama pentingnya dengan mendefinisikan visi. Berikut adalah klasifikasi jelas mengenai apa yang BUKAN SILSE, agar setiap keputusan desain dapat diuji terhadap identitas produk ini:"),
    specTable(
      ["Style", "Cocok?", "Alasan"],
      [
        ["Dashboard App", "TIDAK", "Dashboard untuk monitoring data, bukan untuk belajar. Terlalu banyak informasi bersamaan, tidak ada alur."],
        ["PowerPoint Modern", "Kurang", "Masih mindset slide statis. Tidak mendukung interaksi, reveal, dan progression."],
        ["Interactive Textbook", "YA", "Konten dominan, typography kuat, alur belajar jelas, mendukung interaksi."],
        ["Learning Journey", "YA", "Ada sequence, progression, milestone. Siswa merasa bergerak maju."],
        ["Digital Module", "YA", "Struktur pedagogis jelas, section punya atmosfer, konten terfokus."],
        ["Interactive Story", "YA", "Spatial storytelling, reveal, attention steering. Terasa hidup."],
        ["Landing Page", "TIDAK", "Hanya cantik di atas. Tidak dirancang untuk belajar 45 menit."],
        ["Admin Panel", "TIDAK", "Terlalu data-centric, border dimana-mana, cognitive overload."],
      ],
      [25, 12, 63]
    ),

    h2("1.3 Referensi Inspirasi"),
    para("Produk SILSE mengambil inspirasi dari platform-platform yang telah membuktikan bahwa pengalaman belajar digital bisa terasa hidup, fokus, dan menyenangkan tanpa menjadi chaotic. Referensi utama kami mencakup platform-platform berikut yang masing-masing memberikan pelajaran desain berbeda namun saling melengkapi:"),
    bulletBold("Duolingo ", "\u2014 Progressive disclosure, clear feedback, gamified progression. Setiap langkah fokus pada satu tujuan. Motion yang tepat guna, bukan decorative."),
    bulletBold("Khan Academy ", "\u2014 Typography-first, content-dominant, clean whitespace. Membuktikan bahwa konten edukasi tidak perlu flashy untuk engaging."),
    bulletBold("Brilliant.org ", "\u2014 Interactive learning, step-by-step revelation, clean but engaging visual system. Setiap interaksi punya tujuan pedagogis."),
    bulletBold("Apple Education ", "\u2014 Dramatic typography, spatial composition, premium feel. Membuktikan bahwa media edukasi bisa beautiful tanpa mengorbankan readability."),
    bulletBold("Notion Education Templates ", "\u2014 Clean hierarchy, no visual noise, content-first. Membuktikan bahwa minimalis tidak berarti membosankan."),
    para("Yang TIDAK menjadi inspirasi: Canva templates, SaaS dashboards, admin panels, landing page builders, dan Pinterest-worthy graphic design. Semua itu fokus pada kecantikan visual di atas fungsi pembelajaran, yang merupakan prioritas terbalik dari filosofi SILSE."),
  ];
}

function section2_FilosofiVisual() {
  return [
    h1("2. Filosofi Visual \u2014 Guided Focus Design"),
    para("Guided Focus Design adalah filosofi desain yang menempatkan perhatian siswa sebagai aset paling berharga. Setiap piksel di canvas harus memiliki tujuan: menuntun, menjelaskan, atau memungkinkan interaksi. Tidak ada elemen dekoratif yang tidak melayani tujuan pedagogis. Prinsip ini bukan minimalis total; sebaliknya, ini adalah desain yang sengaja mengarahkan fokus melalui kontras, hierarki, dan ritme visual yang dramatis."),

    h2("2.1 Prinsip #1: Satu Slide = Satu Fokus"),
    para("Satu halaman canvas harus menyajikan SATU ide utama. Saat ini, satu canvas mencoba menunjukkan semuanya sekaligus: struktur, metadata, navigasi, konten, interaksi, schema, scene, dan indikator. Hasilnya adalah cognitive overload \u2014 siswa tidak tahu ke mana harus melihat, dan mata mereka tidak punya anchor point. Setiap halaman harus punya satu hero element yang mendominasi visual, dan semua elemen lain mendukungnya."),
    para("Implementasinya adalah setiap halaman harus punya satu elemen yang jelas-jelas paling besar, paling kontras, atau paling menonjol. Jika halaman berisi tujuan pembelajaran, maka tujuan itulah hero-nya. Jika berisi definisi, maka definisi itulah yang mendominasi. Jika berisi aktivitas, maka interaksilah yang menjadi fokus. Elemen pendukung seperti navigasi, metadata, dan progress indicator harus secara visual recessive \u2014 hadir tapi tidak mengganggu."),

    h2("2.2 Prinsip #2: Konten Dominan, Editor Menghilang"),
    para("Saat mode preview atau present, seluruh editor chrome harus menghilang sepenuhnya. Canvas harus terasa seperti aplikasi belajar, bukan builder tool. Saat ini, builder UI (toolbar, panel, selection ring, label badge, grip handle) lebih dominan secara visual daripada materi pelajaran itu sendiri. Itu kebalik dari yang seharusnya. Dalam mode tampilan siswa, yang terlihat hanyalah konten belajar dan interaksi. Tidak ada border edit, tidak ada label tipe blok, tidak ada chip metadata."),
    para("Dalam mode edit pun, editor chrome harus bersifat overlay yang transparan dan non-intrusif. Elemen-elemen seperti schema, scene, variant, dan block type label hanya muncul saat pointer berada di dekat blok tersebut, bukan sebagai elemen permanen yang menambah cognitive noise. Prinsipnya: konten selalu di lapisan paling depan, editor di lapisan belakang yang muncul hanya saat dibutuhkan."),

    h2("2.3 Prinsip #3: Learning Sections dengan Atmosfer"),
    para("Setiap section edukasi harus memiliki atmosfer visualnya sendiri. Bukan hanya beda warna border atau accent stripe, tapi perbedaan mood yang terasa. Section TUJUAN BELAJAR terasa berbeda dari MATERI INTI, yang terasa berbeda dari AKTIVITAS, yang terasa berbeda dari REFLEKSI. Perbedaan ini dicapai melalui kombinasi background tone, spacing rhythm, icon treatment, dan komposisi layout \u2014 bukan hanya warna garis."),
    para("Contohnya: section TUJUAN BELAJAR menggunakan background lembut biru-muda, ikon besar di kiri, dan satu kalimat fokus yang sangat terbaca. Section MATERI INTI memiliki area paling dominan, typography besar, dan whitespace lega. Section AKTIVITAS berubah total visual-nya \u2014 lebih interaktif, ada affordance klik yang jelas, motion yang mengundang partisipasi. Section REFLEKSI memiliki mood lebih tenang, spacing lebih longgar, dan visual yang mengajak berhenti sejenak."),

    h2("2.4 Prinsip #4: Hilangkan 70% Garis"),
    para("UI edukasi modern terbaik hampir tidak menggunakan border. Mereka menggunakan spacing untuk grouping, surface depth ringan untuk memisahkan area, dan kontras background untuk menunjukkan hierarki. Saat ini, project SILSE terlalu bergantung pada outline, stroke, dan separator. Hasilnya, tampilan terasa seperti dashboard admin, bukan pengalaman belajar. Setiap garis yang tidak melayani tujuan pedagogis harus dihapus."),
    para("Garis hanya boleh digunakan untuk: (1) memisahkan section yang berbeda secara dramatis, (2) menandai interactive element yang memerlukan affordance, atau (3) mengindikasikan state aktif/fokus. Garis tipis antar card, garis pemisah antar field, dan border di sekeliling setiap elemen harus diganti dengan spacing, background contrast, atau surface elevation."),

    h2("2.5 Prinsip #5: Typography Harus Dramatis"),
    para("Typography di media interaktif edukasi harus dramatis, bukan flat. Saat ini, semua teks terasa ukuran mirip, weight mirip, dan spacing tanggung. Tidak ada visual breathing, tidak ada typographic rhythm, dan tidak ada content pacing. Typography harus menciptakan hierarchy yang jelas dan dramatis sehingga siswa secara otomatis tahu mana yang penting, mana yang detail, dan mana yang hanya konteks."),
    para("Hierarchy yang direkomendasikan: Hero title 42-56px, Section title 28-36px, Body 18-22px, dan Caption 14-16px. Perbedaan antara level harus terasa dramatis, bukan gradual. Jika hero title 48px dan section title 32px, perbedaannya harus proporsional (1.5x), bukan hanya 4px yang hampir tidak terlihat. Weight juga harus kontras: hero title bold/extrabold, section title semibold, body regular, caption light."),

    h2("2.6 Prinsip #6: Interactive Component Punya State Jelas"),
    para("Setiap komponen interaktif (flashcard, quiz option, drag-drop, klik-reveal) harus memiliki state visual yang jelas dan berbeda. Saat ini, flashcard terlihat seperti card biasa \u2014 tidak ada indikasi bahwa ia bisa diklik, tidak ada hover state, dan tidak ada feedback saat diinteraksi. Komponen interaktif harus punya: hover state yang mengundang klik, tap affordance yang terlihat, motion yang responsif, depth yang menunjukkan clickability, feedback yang jelas, dan reveal sensation yang memuaskan."),
    para("Tanpa state visual yang jelas, interaktifnya tidak terasa. Siswa harus bisa mengenali elemen mana yang bisa diklik hanya dari visual, tanpa perlu hover dulu. Ini berbeda dari elemen informasi yang harus terlihat stabil dan tidak mengundang klik. Prinsipnya: jika bisa diklik, harus terlihat bisa diklik. Jika hanya informasi, harus terlihat seperti informasi."),

    h2("2.7 Prinsip #7: Spatial Storytelling"),
    para("Konten belajar bukan dokumen PDF yang di-scroll vertikal. Media interaktif memungkinkan spatial storytelling yang jauh lebih engaging. Teknik yang harus digunakan meliputi: split layout untuk perbandingan, spotlight untuk fokus pada satu elemen, progressive disclosure untuk mengungkap informasi bertahap, alternating composition untuk mencegah monoton, full-bleed moment untuk momen dramatis, focus card untuk konsep penting, dan concept zoom untuk detail yang perlu diperhatikan."),
    para("Jangan semua section menggunakan card vertikal stack yang monoton. Setiap section boleh, dan seharusnya, menggunakan komposisi spatial yang berbeda sesuai tujuan pedagogisnya. Section tujuan bisa menggunakan centered spotlight, section materi menggunakan two-column dengan ilustrasi, section aktivitas menggunakan interactive zone yang penuh, dan section refleksi menggunakan narrow-focus layout yang intim."),

    h2("2.8 Prinsip #8: Builder Labels Tersembunyi"),
    para("Label-label seperti schema, scene, variant, block type, dan metadata chip adalah informasi untuk editor, bukan untuk siswa. Semua ini harus hanya muncul di edit mode overlay yang transparan dan tidak mengganggu. Saat siswa melihat konten, mereka tidak boleh melihat informasi teknis tentang bagaimana konten itu dibuat. Ini sama seperti siswa tidak perlu melihat kode HTML ketika membaca website."),
    para("Dalam praktiknya, builder labels hanya muncul saat guru meng-hover atau memilih blok. Mereka ditampilkan sebagai tooltip-style overlay yang tidak mengubah layout konten. Saat pointer berpindah, overlay menghilang. Ini berbeda dari pendekatan saat ini yang menampilkan semua label secara permanen, menambah cognitive noise yang tidak perlu."),

    h2("2.9 Prinsip #9: Motion Edukasi, Bukan Startup Demo"),
    para("Motion di SILSE harus melayani tujuan pedagogis, bukan sekadar terlihat keren. Motion yang tepat: focus transition antar section, reveal jawaban quiz, progress indicator, section change animation, quiz feedback (benar/salah), dan attention steering ke elemen penting. Motion yang dilarang: bouncing animation, scaling liar, flashy entrance, holographic aurora gradient, confetti burst, dan semua efek yang lebih cocok untuk startup demo daripada media belajar."),
    para("Setiap motion harus menjawab pertanyaan: Apakah motion ini membantu siswa belajar? Jika jawabannya tidak, motion itu tidak boleh ada. Motion yang baik menciptakan sense of progression, memberikan feedback yang jelas, dan menuntun perhatian. Motion yang buruk mengalihkan perhatian, memperlambat interaksi, dan menciptakan chaos visual."),

    h2("2.10 Prinsip #10: Inspirasi = Duolingo, Bukan Canva"),
    para("Produk SILSE lebih dekat ke Duolingo, Khan Academy, Brilliant, Apple Education, dan Notion education templates. Ini adalah produk yang berorientasi pada pengalaman belajar, bukan pada kecantikan visual semata. Tujuannya adalah agar konten terbaca jelas dari belakang kelas dan terasa hidup di layar laptop siswa, bukan agar terlihat cantik di Behance atau Dribbble."),
    para("Ini bukan berarti visual tidak penting. Visual SANGAT penting, tapi visual yang penting adalah visual yang melayani pembelajaran: typography yang dramatis, spacing yang memberi ruang bernapas, interaksi yang terasa natural, dan motion yang menuntun fokus. Visual yang melayani ego desainer (gradient holographic, particle effects, 3D transforms) justru mengganggu tujuan utama produk."),
  ];
}

function section3_TypographySpec() {
  return [
    h1("3. Educational Typography Spec"),

    h2("3.1 Typography Scale for Interactive Media"),
    para("Typography scale untuk media interaktif edukasi harus dramatis dan konsisten. Setiap level harus terasa berbeda secara visual, bukan hanya berbeda beberapa piksel. Scale ini dirancang untuk layar laptop/tablet sebagai primary medium, bukan untuk cetak atau proyektor. Berikut adalah scale lengkap yang direkomendasikan:"),
    zebraTable(
      ["Token", "Classroom (px)", "Projector (px)", "Student (px)", "Print (pt)", "Weight", "Line Height", "Usage"],
      [
        ["hero", "48-56", "56-64", "42-48", "28-32", "Bold/ExtraBold", "1.1", "Cover title, section openers"],
        ["sectionTitle", "32-36", "40-44", "28-32", "20-24", "Semibold/Bold", "1.2", "Section headings (Tujuan, Materi, dll)"],
        ["subsection", "24-28", "28-32", "22-26", "16-18", "Semibold", "1.3", "Sub-headings within sections"],
        ["bodyLg", "20-22", "24-26", "18-20", "13-14", "Regular/Medium", "1.5", "Primary reading text, definitions"],
        ["body", "18-20", "22-24", "16-18", "12-13", "Regular", "1.6", "Body text, explanations"],
        ["bodySm", "16-18", "18-20", "14-16", "10-11", "Regular", "1.5", "Secondary text, notes"],
        ["caption", "14-16", "16-18", "13-14", "9-10", "Light/Regular", "1.4", "Labels, metadata, timestamps"],
        ["micro", "12-13", "14-15", "11-12", "8", "Medium", "1.3", "Chips, badges (edit only), tiny labels"],
      ],
      [12, 13, 13, 13, 10, 14, 10, 25]
    ),
    para("Catatan penting: Perbedaan antara level harus minimal 1.3x untuk terasa dramatis. Hero ke sectionTitle minimal 1.4x. sectionTitle ke bodyLg minimal 1.5x. bodyLg ke body minimal 1.1x. body ke caption minimal 1.25x. Jika perbedaan kurang dari rasio ini, hierarchy tidak akan terbaca dan mata siswa akan bingung mana yang penting."),

    h2("3.2 Weight Hierarchy"),
    para("Weight hierarchy harus se-dramatis size hierarchy. Semua level tidak boleh menggunakan weight yang sama atau mirip. Berikut adalah weight assignment yang direkomendasikan untuk setiap token typography:"),
    zebraTable(
      ["Token", "Weight", "CSS Value", "Rationale"],
      [
        ["hero", "ExtraBold", "800", "Pernyataan kuat, anchor visual utama"],
        ["sectionTitle", "Bold", "700", "Heading yang jelas terbaca, dominan dalam section"],
        ["subsection", "Semibold", "600", "Cukup kuat untuk sub-heading, tapi tidak se-dominant heading"],
        ["bodyLg", "Medium", "500", "Lebih berat dari body biasa untuk definisi/poin utama"],
        ["body", "Regular", "400", "Reading weight, nyaman untuk paragraf panjang"],
        ["bodySm", "Regular", "400", "Sama dengan body tapi lebih kecil"],
        ["caption", "Light/Regular", "300-400", "Recessive, tidak bersaing dengan konten utama"],
        ["micro", "Medium", "500", "Perlu terbaca di ukuran kecil, jadi perlu weight lebih"],
      ],
      [18, 16, 14, 52]
    ),

    h2("3.3 Line Height & Spacing"),
    para("Line height untuk media interaktif berbeda dari media cetak. Di layar, mata membutuhkan lebih banyak ruang antar baris untuk tracking yang nyaman. Line height yang terlalu rapat menyebabkan mata lelah cepat, sementara yang terlalu longgar memecah kohesi paragraf. Berikut rekomendasi line height per token:"),
    zebraTable(
      ["Token", "Line Height", "Paragraph Spacing After", "Rationale"],
      [
        ["hero", "1.1", "24-32px", "Judul hero biasanya 1-2 baris, rapat tapi tetap terbaca"],
        ["sectionTitle", "1.2", "20-24px", "Section heading, perlu breathing room setelahnya"],
        ["subsection", "1.3", "16-20px", "Sub-heading, spacing lebih ketat dari section"],
        ["bodyLg", "1.5", "12-16px", "Definisi/poin utama, perlu ruang untuk readability"],
        ["body", "1.6", "10-14px", "Body text, optimal untuk reading di layar"],
        ["bodySm", "1.5", "8-12px", "Secondary text, cukup rapat tapi masih terbaca"],
        ["caption", "1.4", "6-8px", "Label, rapat tapi tidak menumpuk"],
        ["micro", "1.3", "4-6px", "Chip/badge, sangat rapat untuk elemen kecil"],
      ],
      [18, 16, 22, 44]
    ),
    para("Satu aturan penting: body text (18-20px) dengan line height 1.6 menghasilkan 28.8-32px per baris. Ini adalah sweet spot untuk reading di layar laptop pada jarak 40-60cm. Untuk projector mode, line height bisa sedikit lebih ketat (1.5) karena jarak baca lebih jauh dan ruang vertikal lebih berharga."),

    h2("3.4 Letter Spacing & Readability"),
    para("Letter spacing (tracking) untuk media interaktif harus dioptimalkan untuk readability di layar. Tidak seperti cetak yang menggunakan tight tracking untuk estetika, layar membutuhkan sedikit lebih banyak ruang antar karakter untuk anti-aliasing yang optimal. Berikut rekomendasinya:"),
    zebraTable(
      ["Token", "Letter Spacing", "Rationale"],
      [
        ["hero", "-0.02em to 0", "Judul besar bisa sedikit tight untuk impact visual"],
        ["sectionTitle", "0 to 0.01em", "Default atau sedikit longgar untuk readability"],
        ["subsection", "0.01em", "Sedikit longgar, heading yang terbaca"],
        ["bodyLg/body", "0.01-0.02em", "Sedikit longgar untuk layar, membantu tracking mata"],
        ["caption", "0.02-0.04em", "Teks kecil perlu lebih longgar untuk tetap terbaca"],
        ["micro", "0.04-0.06em", "Ukuran sangat kecil perlu tracking longgar agar tidak kabur"],
      ],
      [20, 22, 58]
    ),

    h2("3.5 Typography Rhythm Rules"),
    para("Typography rhythm adalah pola pengulangan dan variasi yang menciptakan sense of pacing dalam konten. Tanpa rhythm, semua teks terasa flat dan monoton. Dengan rhythm, konten memiliki momen tensi (heading besar), release (body text yang lega), dan rest (whitespace antar section). Berikut aturan rhythm yang harus diterapkan:"),
    bulletBold("Contrast Rule: ", "Antara dua level typography berturutan, perbedaan size harus minimal 1.25x dan weight minimal 2 step (misal 400 ke 600). Jika kurang dari ini, hierarki tidak terbaca."),
    bulletBold("Breathing Rule: ", "Setelah heading, harus ada spacing yang cukup (minimal 16px) sebelum body text. Ini memberi mata waktu untuk shift dari heading ke reading mode."),
    bulletBold("Pacing Rule: ", "Dalam satu section, hanya boleh ada maksimal 3 level typography. Hero + body + caption. Section title + body + micro. Jangan gunakan semua level sekaligus."),
    bulletBold("Alignment Rule: ", "Heading di-align kiri (flush left), bukan centered. Centered alignment hanya untuk hero title di cover. Body text selalu flush left dengan ragged right."),
    bulletBold("Orphan Rule: ", "Tidak ada heading yang berdiri sendiri di bagian bawah halaman tanpa minimal 2 baris body text. Heading dan kontennya harus selalu bersama."),

    h2("3.6 Per-Section Typography Treatment"),
    para("Setiap Learning Section memiliki treatment typography yang berbeda untuk menciptakan atmosfer yang unik. Berikut adalah mapping lengkap:"),
    zebraTable(
      ["Section", "Heading Style", "Body Style", "Atmosphere Effect"],
      [
        ["TUJUAN BELAJAR", "sectionTitle + icon besar", "bodyLg, 1-2 kalimat", "Focus, clarity, singleness of purpose"],
        ["MATERI INTI", "sectionTitle, bold", "body, paragraf panjang lega", "Dominant, reading-mode, comfortable"],
        ["CONTOH", "subsection, italic accent", "bodySm, indented", "Supplementary, recessive, contextual"],
        ["AKTIVITAS", "sectionTitle, playful", "bodyLg, action-oriented", "Energetic, inviting, participatory"],
        ["DISKUSI", "subsection, question format", "body, open-ended", "Thoughtful, spacious, contemplative"],
        ["REFLEKSI", "subsection, calm", "body, wider line-height", "Intimate, slow-paced, personal"],
        ["KUIS", "sectionTitle, bold accent", "bodyLg, clear options", "Focused, decisive, feedback-ready"],
        ["RANGKUMAN", "subsection, structured", "bodySm, list-friendly", "Compact, organized, scannable"],
      ],
      [16, 22, 22, 40]
    ),

    h2("3.7 Display Mode Adjustments"),
    para("Setiap display mode memerlukan penyesuaian typography untuk konteks penggunaannya. Classroom mode adalah baseline. Projector mode memperbesar semuanya 15-20% dan mengurangi line-height sedikit untuk memaksimalkan ruang vertikal. Print mode menggunakan unit pt bukan px dan menghapus semua efek warna. Student mode sedikit lebih kecil dari classroom untuk layar laptop/HP:"),
    zebraTable(
      ["Adjustment", "Classroom", "Projector", "Print", "Student"],
      [
        ["Base scale", "1.0x", "1.15-1.2x", "0.85x (pt)", "0.9x"],
        ["Line height modifier", "default", "-0.05", "default", "+0.05"],
        ["Min body size", "18px", "22px", "12pt", "16px"],
        ["Hero size", "48-56px", "56-64px", "28-32pt", "42-48px"],
        ["Weight adjustment", "none", "none", "body=min 400", "none"],
        ["Color", "semantic colors", "high contrast", "black only", "semantic colors"],
        ["Background", "white #FFFFFF", "warm #FFFBF0", "white #FFFFFF", "clean white"],
      ],
      [20, 16, 16, 16, 16, 16]
    ),
  ];
}

function section4_SpatialLayout() {
  return [
    h1("4. Spatial Layout System"),

    h2("4.1 8 Learning Sections dengan Atmosfer"),
    para("Sistem layout SILSE dibangun di atas 8 Learning Section types, masing-masing dengan identitas visual, atmosfer, dan aturan komposisi yang berbeda. Ini bukan template yang kaku, melainkan system yang memungkinkan variasi sambil menjaga konsistensi. Setiap section type mendefinisikan: background treatment, spacing rhythm, icon usage, layout grammar, dan interaction affordance."),

    h3("4.1.1 TUJUAN BELAJAR"),
    para("Section ini mendefinisikan apa yang akan dipelajari. Atmosfer: fokus, jelas, singular. Background menggunakan tint biru muda (bukan solid color) yang memberikan zona visual tanpa mengganggu. Ikon besar di sisi kiri memberikan anchor visual. Teks tujuan ditulis dalam 1-2 kalimat menggunakan bodyLg, bukan bullet list yang panjang. Satu halaman tujuan hanya berisi maksimal 3 tujuan, masing-masing mendapat ruang yang lega."),
    bullet("Background: rgba(59, 130, 246, 0.06) \u2014 biru muda subtle"),
    bullet("Spacing: generous (24px gap antar item)"),
    bullet("Layout: icon + text side-by-side, atau centered spotlight"),
    bullet("Icon: target/bullseye, 32-40px, accent color"),

    h3("4.1.2 MATERI INTI"),
    para("Section ini adalah area paling dominan dalam halaman. Atmosfer: reading-mode, nyaman, lega. Area ini mendapatkan proporsi terbesar dari halaman, typography terbesar, dan whitespace terbanyak. Tidak ada card kecil-kecil atau chip yang mengganggu. Materi ditampilkan sebagai continuous prose atau structured explanation, bukan sebagai kumpulan card."),
    bullet("Background: transparent/white (clean, no tint)"),
    bullet("Spacing: very generous (32px between paragraphs, 48px between subsections)"),
    bullet("Layout: single-column, wide margins, flush-left text"),
    bullet("Max width: 680px untuk body text (optimal reading width)"),

    h3("4.1.3 CONTOH"),
    para("Section contoh bersifat supplementary dan harus secara visual recessive terhadap materi inti. Atmosfer: kontekstual, pendukung, tidak bersaing. Contoh menggunakan indent visual, background tint yang sangat subtle, dan typography yang sedikit lebih kecil dari materi. Ini memastikan siswa tahu bahwa contoh adalah pendukung, bukan konten utama."),
    bullet("Background: rgba(0,0,0,0.02) \u2014 hampir tidak terlihat, subtle differentiation"),
    bullet("Spacing: standard (16px gap)"),
    bullet("Layout: indented 24px from left, atau side-panel jika split layout"),
    bullet("Visual treatment: italic accent stripe di kiri, bukan full card"),

    h3("4.1.4 AKTIVITAS"),
    para("Section aktivitas harus terasa berbeda secara dramatis dari section membaca. Atmosfer: energik, mengundang partisipasi, playful. Visual berubah total: mungkin menggunakan background yang sedikit lebih hidup, interactive zone yang jelas, dan affordance yang mengundang klik. Setiap elemen interaktif harus memiliki hover state, active state, dan feedback state yang jelas."),
    bullet("Background: rgba(249, 115, 22, 0.05) \u2014 warm tint untuk energy"),
    bullet("Spacing: compact within activity, generous between activities"),
    bullet("Layout: interactive zone yang penuh, clear affordance borders"),
    bullet("Interactive elements: raised elevation, hover lift, click feedback"),

    h3("4.1.5 DISKUSI"),
    para("Section diskusi mengundang pemikiran dan percakapan. Atmosfer: thoughtful, terbuka, spacious. Pertanyaan diskusi ditampilkan sebagai heading berformat question, diikuti ruang kosong yang mengundang refleksi. Tidak ada jawaban yang langsung terlihat. Section ini harus terasa seperti ruang aman untuk berpikir."),
    bullet("Background: rgba(139, 92, 246, 0.04) \u2014 purple tint untuk contemplation"),
    bullet("Spacing: very generous (32px after question)"),
    bullet("Layout: centered question, wide margins"),
    bullet("Visual: no right answers visible, thought-bubble motif optional"),

    h3("4.1.6 REFLEKSI"),
    para("Section refleksi adalah momen slow-down dalam alur belajar. Atmosfer: tenang, intim, personal. Spacing lebih longgar, typography sedikit lebih kecil, dan mood visual lebih lembut. Ini adalah tempat siswa menghentikan rush dan memikirkan apa yang baru dipelajari."),
    bullet("Background: rgba(16, 185, 129, 0.04) \u2014 green tint untuk calm"),
    bullet("Spacing: very generous (40px between items)"),
    bullet("Layout: narrow-focused, centered, intimate"),
    bullet("Visual: slower rhythm, softer colors, no interactive pressure"),

    h3("4.1.7 KUIS"),
    para("Section kuis adalah momen evaluasi yang memerlukan kejelasan maksimal. Atmosfer: fokus, decisive, feedback-ready. Setiap pertanyaan dan opsi jawaban harus sangat terbaca. Feedback benar/salah harus dramatis dan jelas. Tidak ada elemen yang mengalihkan perhatian dari tugas menjawab."),
    bullet("Background: white atau sangat subtle tint"),
    bullet("Spacing: clear separation between questions, compact within options"),
    bullet("Layout: single question per view, large touch targets for options"),
    bullet("Feedback: green glow untuk benar, red shake untuk salah"),

    h3("4.1.8 RANGKUMAN"),
    para("Section rangkuman menyajikan poin-poin kunci secara compact dan scannable. Atmosfer: organized, compact, clear. Berbeda dari materi inti yang membutuhkan reading-mode, rangkuman harus bisa di-scan dengan cepat. Menggunakan list format yang terstruktur, icon markers, dan visual grouping."),
    bullet("Background: transparent/white"),
    bullet("Spacing: compact (12px between items)"),
    bullet("Layout: two-column jika poin banyak, single-column jika sedikit"),
    bullet("Visual: checkmark icons, bold key terms, minimal decoration"),

    h2("4.2 Section Composition Rules"),
    para("Setiap section tidak berdiri sendiri; mereka adalah bagian dari alur belajar yang harus mengalir secara natural. Berikut adalah aturan komposisi yang mengatur bagaimana section-section ini disusun dalam satu halaman canvas:"),
    bulletBold("Dominance Rule: ", "Satu halaman hanya boleh memiliki SATU dominant section. Jika halaman berisi materi inti, maka materi itulah yang dominan. Section lain (contoh, catatan) harus recessive."),
    bulletBold("Atmosphere Contrast: ", "Section yang berdekatan harus memiliki atmosfer yang berbeda. Jangan menempatkan dua section dengan tint yang sama bersebelahan. Gunakan perbedaan background, spacing, dan composition untuk menciptakan rhythm."),
    bulletBold("Whitespace Budget: ", "Minimal 35% dari halaman harus berupa whitespace. Ini bukan ruang terbuang, melainkan ruang bernapas yang mencegah cognitive overload. Hitung: jika konten memenuhi lebih dari 65% area, konten terlalu padat."),
    bulletBold("Content Density: ", "Maksimal 120 kata per halaman canvas. Jika konten melebihi ini, pecah menjadi beberapa halaman. Lebih baik 3 halaman yang terfokus daripada 1 halaman yang overwhelming."),
    bulletBold("Visual Entry Point: ", "Setiap halaman harus punya satu visual entry point yang jelas \u2014 elemen yang pertama kali menarik mata saat halaman dibuka. Ini biasanya heading terbesar atau elemen interaktif paling menonjol."),

    h2("4.3 Spatial Storytelling Techniques"),
    para("Spatial storytelling menggunakan komposisi ruang untuk menciptakan narasi visual, bukan hanya menyusun informasi secara vertikal. Berikut adalah teknik-teknik yang tersedia dan kapan menggunakannya:"),
    zebraTable(
      ["Technique", "Description", "Best Used For", "Example"],
      [
        ["Split Layout", "Dua kolom: konsep + visual, atau definisi + contoh", "MATERI, CONTOH", "Definisi kiri, ilustrasi kanan"],
        ["Spotlight", "Satu elemen besar di tengah, elemen lain menghilang", "TUJUAN, RANGKUMAN", "Satu tujuan besar di tengah halaman"],
        ["Progressive Disclosure", "Konten terungkap bertahap saat siswa berinteraksi", "MATERI, KUIS", "Klik untuk reveal penjelasan"],
        ["Alternating Composition", "Layout bergantian: kiri-kanan, besar-kecil", "MATERI berurutan", "Paragraf 1 kiri, Paragraf 2 kanan"],
        ["Full-Bleed Moment", "Konten memenuhi seluruh area tanpa margin", "Cover, transition", "Hero image atau quote besar"],
        ["Focus Card", "Satu card besar yang mendominasi, other elements subtle", "CONTOH, DISKUSI", "Satu pertanyaan besar di card"],
        ["Concept Zoom", "Detail yang muncul saat hover/klik pada area tertentu", "MATERI, CONTOH", "Hover pada istilah untuk definisi"],
        ["Step Flow", "Konten disajikan sebagai langkah-langkah berurutan", "AKTIVITAS, KUIS", "Step 1, 2, 3 dengan progress bar"],
      ],
      [18, 30, 18, 34]
    ),

    h2("4.4 Layout Grammar for Educational Content"),
    para("Layout grammar mendefinisikan aturan spatial yang boleh dan tidak boleh digunakan untuk setiap section type. Ini mencegah penggunaan komposisi yang tidak sesuai dengan tujuan pedagogis section tersebut:"),
    zebraTable(
      ["Section", "Recommended Grammar", "Forbidden Grammar", "Rationale"],
      [
        ["TUJUAN", "spotlight, centered, icon+text", "card-flow, grid-2", "Tujuan harus fokus, bukan scannable grid"],
        ["MATERI", "article-flow, split-layout", "card-flow, grid-3", "Materi perlu reading flow, bukan card browsing"],
        ["CONTOH", "side-panel, indented, split-layout", "hero-center, full-bleed", "Contoh supplementary, jangan dominan"],
        ["AKTIVITAS", "step-flow, interactive-zone, split-layout", "article-flow", "Aktivitas perlu interaction, bukan reading"],
        ["DISKUSI", "spotlight, centered, focus-card", "grid-2, card-flow", "Diskusi perlu fokus pada satu pertanyaan"],
        ["REFLEKSI", "narrow-center, spotlight", "full-bleed, grid-3", "Refleksi perlu intimacy, bukan spectacle"],
        ["KUIS", "step-flow, single-question", "article-flow, grid-2", "Kuis perlu decision focus, bukan browsing"],
        ["RANGKUMAN", "two-column, list-flow", "hero-center, full-bleed", "Rangkuman perlu scanning, bukan drama"],
      ],
      [14, 24, 22, 40]
    ),

    h2("4.5 Whitespace Budget"),
    para("Whitespace adalah elemen desain yang paling underused di SILSE saat ini. Dalam media interaktif edukasi, whitespace bukan ruang terbuang melainkan ruang yang memberi mata waktu untuk memproses informasi. Tanpa whitespace yang cukup, cognitive load meningkat dan siswa cepat lelah. Berikut adalah budget whitespace yang direkomendasikan:"),
    zebraTable(
      ["Area", "Minimum", "Recommended", "Notes"],
      [
        ["Between sections", "32px", "48px", "Harus terasa sebagai break, bukan hanya jarak"],
        ["After section heading", "16px", "24px", "Breathing room sebelum konten dimulai"],
        ["Between paragraphs", "12px", "16px", "Cukup untuk memisahkan tanpa memutus flow"],
        ["Between list items", "8px", "12px", "Rapat tapi tidak menumpuk"],
        ["Around interactive elements", "16px", "24px", "Touch target area, tidak boleh terlalu rapat"],
        ["Page margin (sides)", "48px", "64px", "Optimal reading width, jangan terlalu lebar"],
        ["Page margin (top)", "32px", "48px", "Cukup untuk breathing room"],
        ["Page margin (bottom)", "24px", "32px", "Lebih ketat dari atas, konten bisa extend ke bawah"],
      ],
      [26, 14, 16, 44]
    ),

    h2("4.6 Content Density Rules"),
    para("Content density mengatur berapa banyak informasi yang boleh ditampilkan dalam satu viewport. Aturan ini mencegah cognitive overload dan memastikan setiap halaman terasa fokus, bukan overwhelming. Density diukur dalam tiga dimensi: word count, element count, dan visual weight."),
    bulletBold("Word Count: ", "Maksimal 120 kata per halaman canvas. Jika melebihi, pecah ke halaman berikutnya. Lebih baik 3 halaman fokus daripada 1 halaman padat."),
    bulletBold("Element Count: ", "Maksimal 5 distinct visual elements per halaman. Ini termasuk heading, body, interactive element, illustration, dan metadata. Setiap elemen tambahan meningkatkan cognitive load."),
    bulletBold("Visual Weight: ", "Konten tidak boleh memenuhi lebih dari 65% dari area halaman. Sisa 35% harus berupa whitespace. Ini termasuk padding, margin, dan jarak antar elemen."),
    bulletBold("Interactive Density: ", "Maksimal 3 interactive elements per halaman. Terlalu banyak interaksi di satu halaman menciptakan decision paralysis, bukan engagement."),
  ];
}

function section5_InteractionLanguage() {
  return [
    h1("5. Interaction Language"),

    h2("5.1 Hover States"),
    para("Hover state adalah konversi pertama antara user dan interactive element. Hover harus mengkomunikasikan dua hal: bahwa elemen ini interaktif, dan apa yang akan terjadi jika diklik. Hover tidak boleh dramatis (bouncing, scaling besar) tapi harus cukup terasa untuk menandai perubahan. Berikut spesifikasi hover untuk setiap tipe elemen:"),
    zebraTable(
      ["Element Type", "Hover Effect", "Duration", "Easing", "Notes"],
      [
        ["Quiz Option", "Background tint + slight lift (2px translateY)", "150ms", "ease-out", "Menandai bisa dipilih, lift = clickable"],
        ["Flashcard", "Lift 4px + shadow deepen", "200ms", "ease-out", "Terasa seperti card yang bisa di-flip"],
        ["Reveal Button", "Background darken + icon rotate 90deg", "150ms", "ease-out", "Icon rotation menandai reveal action"],
        ["Navigation Link", "Underline fade-in + color shift", "100ms", "ease-out", "Subtle, cukup untuk menandai link"],
        ["Drag Handle", "Shadow appear + cursor change", "100ms", "ease-out", "Shadow menandai elevation, cursor = grab"],
        ["Step Button", "Background tint + slight scale (1.02x)", "120ms", "ease-out", "Minimal feedback, terasa responsive"],
        ["Collapse Header", "Background tint + chevron rotate", "150ms", "ease-out", "Chevron rotation menandai expand/collapse"],
        ["Inline Term", "Tooltip with definition", "200ms", "ease-out", "Tidak mengubah layout, tooltip overlay"],
      ],
      [16, 28, 12, 12, 32]
    ),
    para("Aturan umum hover: durasi MAKSIMAL 200ms. Lebih lama dari ini terasa sluggish. Easing selalu ease-out untuk hover masuk dan ease-in untuk hover keluar. Tidak ada bounce, elastic, atau spring effect pada hover. Hover effect tidak boleh mengubah layout atau memindahkan elemen lain."),

    h2("5.2 Reveal Patterns"),
    para("Reveal adalah interaksi paling penting di media edukasi. Reveal mengungkap informasi yang sebelumnya tersembunyi: jawaban, penjelasan, langkah berikutnya, atau detail tambahan. Reveal harus terasa memuaskan, bukan instant. Ada beberapa pola reveal yang masing-masing cocok untuk konteks berbeda:"),
    bulletBold("Slide-Reveal: ", "Konten muncul dari bawah atau sisi dengan slide motion. Durasi 300-400ms, ease-out. Cocok untuk jawaban quiz, langkah solusi, dan penjelasan tambahan. Memberikan sense of unfolding yang natural."),
    bulletBold("Fade-Reveal: ", "Konten muncul dengan opacity transition. Durasi 250-350ms, ease-out. Cocok untuk detail tambahan yang muncul di tempat, tanpa perpindahan spatial. Lebih subtle dari slide-reveal."),
    bulletBold("Flip-Reveal: ", "Card berputar 180deg untuk menunjukkan sisi lain. Durasi 400-500ms, ease-in-out. Cocok untuk flashcard (pertanyaan/jawaban). Memberikan sense of physical interaction yang kuat."),
    bulletBold("Expand-Reveal: ", "Konten yang tersembunyi expand dari collapsed state. Durasi 300-400ms, ease-out. Cocok untuk accordion, show-more, dan progressive disclosure. Memberikan sense of controlled unveiling."),
    bulletBold("Spotlight-Reveal: ", "Semua elemen lain fade/dim, elemen yang di-reveal spotlight. Durasi 250ms. Cocok untuk concept zoom dan focus mode. Memberikan sense of focus yang dramatis."),
    para("Aturan umum reveal: selalu ada trigger visual yang jelas (button, klik area). Tidak ada reveal yang terjadi tanpa user action. Reveal harus reversible \u2014 bisa di-hide kembali. Reveal duration 250-500ms, tidak lebih."),

    h2("5.3 Quiz Feedback"),
    para("Feedback quiz harus dramatis dan jelas, tapi tidak overwhelming. Siswa harus SEKILAS tahu apakah jawabannya benar atau salah, tanpa efek yang mengganggu konsentrasi. Feedback yang baik memberikan informasi, bukan hiburan."),
    h3("5.3.1 Benar"),
    bullet("Background flash: hijau ringan (rgba(16, 185, 129, 0.15)) selama 400ms"),
    bullet("Icon checkmark muncul dengan scale-in (0 ke 1, 200ms, ease-out)"),
    bullet("Text feedback muncul dengan fade-in (150ms delay, 200ms duration)"),
    bullet("Tidak ada confetti, fireworks, atau celebratory animation yang berlebihan"),

    h3("5.3.2 Salah"),
    bullet("Background flash: merah ringan (rgba(239, 68, 68, 0.1)) selama 400ms"),
    bullet("Shake horizontal: 3 cycle, amplitude 4px, duration 300ms"),
    bullet("Icon X muncul dengan scale-in (0 ke 1, 200ms, ease-out)"),
    bullet("Correct answer highlighted dengan accent color setelah 500ms delay"),

    h3("5.3.3 Kuis Selesai"),
    bullet("Score display dengan counter animation (0 ke score, 800ms, ease-out)"),
    bullet("Grade badge muncul dengan scale-in + subtle shadow"),
    bullet("Tidak ada confetti burst, aurora gradient, atau holographic effect"),
    bullet("CTA untuk review/retry muncul dengan fade-in, 200ms delay"),

    h2("5.4 Section Transitions"),
    para("Transisi antar section harus smooth dan meaningful. Transisi bukan hanya animasi dekoratif; mereka mengkomunikasikan bahwa konteks belajar berubah. Setiap tipe perpindahan section memiliki transisi yang berbeda:"),
    zebraTable(
      ["Transition Type", "Animation", "Duration", "Easing", "When"],
      [
        ["Section Open", "Heading slide-in dari kiri, body fade-in", "300ms heading, 400ms body", "ease-out", "Saat section baru muncul di viewport"],
        ["Section Change", "Current section fade-out, next section slide-up", "250ms out, 350ms in", "ease-in-out", "Navigasi antar section"],
        ["Mode Switch", "Crossfade seluruh canvas", "400ms", "ease-in-out", "Edit to Preview to Present"],
        ["Page Turn", "Slide horizontal", "350ms", "ease-in-out", "Navigasi antar halaman"],
        ["Interactive Reveal", "Element expand/fade-in", "250-400ms", "ease-out", "Saat konten interaktif di-reveal"],
      ],
      [18, 28, 20, 14, 20]
    ),
    para("Aturan transisi: tidak ada transisi yang melebihi 500ms. Transisi yang terlalu lama terasa sluggish dan mengganggu flow belajar. Setiap transisi harus punya easing yang natural (ease-out untuk masuk, ease-in untuk keluar, ease-in-out untuk perpindahan). Tidak ada spring physics, elastic, atau bounce pada transisi section."),

    h2("5.5 Motion Rules (Edu-Specific)"),
    para("Motion system untuk media edukasi berbeda dari motion system aplikasi startup. Tujuannya adalah functional, bukan impressive. Setiap motion harus menjawab: apakah ini membantu siswa belajar? Jika tidak, motion tersebut tidak boleh ada. Berikut adalah aturan motion yang spesifik untuk SILSE:"),

    h3("5.5.1 Motion yang DIPERBOLEHKAN"),
    bullet("Focus transition: smooth perpindahan fokus antar elemen (200-400ms)"),
    bullet("Reveal: konten muncul dengan tujuan (250-500ms)"),
    bullet("Progress: progress bar, step indicator, score counter (300-800ms)"),
    bullet("Feedback: benar/salah indication yang jelas (200-400ms)"),
    bullet("Attention steering: subtle motion untuk menuntun mata (150-300ms)"),
    bullet("Section change: transisi antar konteks belajar (250-400ms)"),
    bullet("State change: visual feedback saat interaksi (100-200ms)"),

    h3("5.5.2 Motion yang DILARANG"),
    bullet("Bouncing/bounce animation: terlalu playful untuk konteks belajar serius"),
    bullet("Elastic/spring physics: unpredictable, mengganggu konsentrasi"),
    bullet("Scaling besar (lebih dari 1.05x): terlalu dramatis, mengalihkan perhatian"),
    bullet("Rotation (kecuali flip-card 180deg): tidak ada tujuan pedagogis"),
    bullet("Flashy entrance (neon glow, aurora, holographic): decorative, bukan functional"),
    bullet("Confetti/particle effects: mengganggu, tidak melayani pembelajaran"),
    bullet("Parallax scrolling: terlalu disorienting untuk konten edukasi"),
    bullet("Auto-playing animation: siswa harus in control, bukan spectator"),

    h3("5.5.3 Duration Scale"),
    zebraTable(
      ["Interaction Type", "Duration Range", "Easing", "Rationale"],
      [
        ["Hover state", "100-200ms", "ease-out", "Responsive feedback, tidak sluggish"],
        ["Click/tap feedback", "100-150ms", "ease-out", "Instant acknowledgment"],
        ["Reveal content", "250-400ms", "ease-out", "Cukup untuk perceive, tidak terlalu lambat"],
        ["Section transition", "250-400ms", "ease-in-out", "Smooth shift, natural feel"],
        ["Page navigation", "300-400ms", "ease-in-out", "Cukup untuk orient spatial change"],
        ["Score/progress", "300-800ms", "ease-out", "Counter animation, celebratory tapi tidak berlebihan"],
        ["Error feedback", "200-300ms", "ease-in", "Quick attention, jangan prolong"],
      ],
      [20, 18, 14, 48]
    ),

    h2("5.6 Interactive Component States"),
    para("Setiap komponen interaktif harus memiliki state visual yang lengkap dan konsisten. State yang tidak terdefinisi menciptakan kebingungan: siswa tidak tahu apakah mereka sudah berinteraksi, apakah interaksi berhasil, atau apa yang harus dilakukan selanjutnya. Berikut adalah state yang wajib untuk setiap komponen interaktif:"),
    zebraTable(
      ["State", "Visual Treatment", "Transition In", "Transition Out", "Applies To"],
      [
        ["Default (rest)", "Clean, no special effect", "\u2014", "\u2014", "All interactive elements"],
        ["Hover", "Background tint + subtle lift", "150ms ease-out", "100ms ease-in", "All clickable elements"],
        ["Active (pressing)", "Slight scale down (0.98x) + shadow reduce", "80ms ease-out", "80ms ease-in", "Buttons, options"],
        ["Focused (keyboard)", "2px outline, accent color", "0ms", "0ms", "All interactive elements"],
        ["Selected/chosen", "Accent border + check icon", "200ms ease-out", "150ms ease-in", "Quiz options, multi-select"],
        ["Correct", "Green background + checkmark", "300ms ease-out", "\u2014", "Quiz options"],
        ["Incorrect", "Red shake + X icon", "300ms", "\u2014", "Quiz options"],
        ["Disabled", "Opacity 0.5, no-interact cursor", "150ms", "150ms", "Used options, locked items"],
        ["Revealed", "Content visible, trigger subtle", "250ms ease-out", "200ms ease-in", "Flashcards, reveal buttons"],
        ["Completed", "Muted + checkmark badge", "300ms ease-out", "\u2014", "Steps, sections, activities"],
      ],
      [14, 22, 14, 14, 36]
    ),

    h2("5.7 Attention Steering"),
    para("Attention steering adalah teknik menuntun perhatian siswa ke elemen yang penting pada saat yang tepat. Ini bukan manipulasi; ini adalah pedagogi visual yang membantu siswa fokus pada apa yang perlu diperhatikan. Teknik ini sangat penting dalam media interaktif di mana siswa bisa kehilangan fokus di antara banyak elemen:"),
    bulletBold("Progressive Highlight: ", "Saat section baru muncul, elemen lain sedikit fade (opacity 0.7) selama 300ms, lalu kembali normal. Ini menuntun mata ke elemen baru tanpa menghilangkan konteks."),
    bulletBold("Pulse Indicator: ", "Satu subtle pulse (scale 1.0 ke 1.02 ke 1.0, 600ms, ease-in-out) pada elemen yang memerlukan interaksi. Gunakan hanya untuk elemen yang WAJIB diinteraksi, bukan dekoratif."),
    bulletBold("Scroll Hint: ", "Jika ada konten di bawah fold, subtle chevron-down muncul setelah 2 detik idle. Tidak mengganggu, tapi mengkomunikasikan bahwa ada lebih."),
    bulletBold("Focus Ring: ", "Saat keyboard navigation aktif, focus ring yang jelas (2px, accent color) mengikuti elemen yang sedang difokuskan. Ini essential untuk accessibility."),
    bulletBold("Spotlight Mode: ", "Dalam mode present, guru bisa klik elemen untuk spotlight-nya. Elemen lain blur/dim, elemen spotlight mendapat border dan shadow. Mode ini membantu guru menuntun perhatian kelas."),
  ];
}

function section6_AntiPatterns() {
  return [
    h1("6. Anti-Patterns & Diagnosis"),

    h2("6.1 Masalah Saat Ini (Screenshot Analysis)"),
    para("Berdasarkan analisis screenshot canvas saat ini, terdapat lima masalah fundamental yang perlu ditangani. Kelima masalah ini saling berkaitan dan berasal dari akar yang sama: ketiadaan filosofi visual edukasi yang konsisten. Berikut adalah diagnosis detail setiap masalah beserta dampaknya terhadap pengalaman belajar siswa:"),

    h3("6.1.1 Tidak Ada Focus Hierarchy"),
    para("Semua elemen terasa sama pentingnya. Mata siswa tidak tahu mana judul utama, mana area belajar, mana interaksi, mana progress, dan mana konten utama. Akibatnya, visual terasa seperti editor, bukan pengalaman belajar. Setiap elemen memiliki visual weight yang mirip: font size yang hampir sama, weight yang hampir sama, dan spacing yang hampir sama. Tidak ada anchor visual yang menuntun mata."),

    h3("6.1.2 Canvas Terlihat Seperti Wireframe"),
    para("Ini adalah masalah terbesar. Canvas saat ini penuh dengan border dimana-mana, garis tipis dimana-mana, chip dimana-mana, badge dimana-mana, dan label dimana-mana. Hasilnya adalah cognitive noise yang tinggi. Siswa yang melihat canvas ini bukan melihat materi pelajaran, melainkan melihat struktur teknis dari bagaimana materi itu disusun. Ini sama seperti membaca buku yang setiap paragrafnya dikelilingi border dan label teknis."),

    h3("6.1.3 Typography Tidak Punya Rhythm"),
    para("Semua teks terasa ukuran mirip, weight mirip, dan spacing tanggung. Teks seperti Dokumen, Ketik teks, Definisi, dan Kartu 1 semuanya bertabrakan tanpa hierarki yang jelas. Tidak ada visual breathing, typographic rhythm, atau content pacing. Mata tidak punya cara untuk membedakan mana yang penting dan mana yang konteks."),

    h3("6.1.4 Layout Tidak Memiliki Learning Flow"),
    para("Block hanya ditumpuk secara vertikal (stacked vertically). Padahal media interaktif perlu sequence, reveal, progression, dan attention steering. Tampilan saat ini adalah kumpulan card, bukan alur pembelajaran. Tidak ada sense of progression, tidak ada narasi visual, dan tidak ada alur yang menuntun siswa dari awal sampai akhir."),

    h3("6.1.5 Terlalu Banyak Ornament Kecil"),
    para("Garis warna atas, garis bawah, chip norma, icon kecil, outline oranye, outline hijau, outline biru, label schema, dan badge scene. Semua ini secara individual kecil, tapi secara total menciptakan visual overload. Setiap ornament menambah sedikit cognitive load, dan ketika digabungkan, total load melebihi kapasitas siswa untuk memproses informasi."),

    h2("6.2 Anti-Pattern Catalog"),
    para("Berikut adalah katalog lengkap anti-pattern yang harus dihindari dalam desain SILSE, beserta solusi penggantinya:"),
    zebraTable(
      ["Anti-Pattern", "Current Implementation", "Problem", "Solution"],
      [
        ["Border Everything", "Setiap blok punya border/outline", "Cognitive noise, wireframe look", "Gunakan spacing + background contrast"],
        ["Label Permanence", "Schema/scene/variant labels selalu visible", "Builder feel, bukan learning feel", "Label hanya di edit overlay, hide di preview"],
        ["Flat Typography", "Semua teks size mirip, weight mirip", "Tidak ada hierarchy, tidak ada rhythm", "Dramatic scale + weight contrast"],
        ["Card Stack", "Semua section = card vertikal", "Monoton, tidak ada spatial storytelling", "Section-specific layout grammar"],
        ["Decorative Motion", "Holographic, aurora, confetti", "Mengalihkan, tidak pedagogis", "Functional motion: reveal, feedback, focus"],
        ["Chip Overload", "Chip/badge di setiap elemen", "Visual clutter, cognitive noise", "Hanya chip essensial, sisanya tooltip"],
        ["Color Border Coding", "Outline berbeda warna per tipe", "Tidak terbaca, rainbow effect", "Background tint + spatial separation"],
        ["Dense Layout", "Konten memenuhi 80%+ area", "Cognitive overload, no breathing", "35% whitespace minimum, 120 word max"],
      ],
      [16, 22, 24, 38]
    ),

    h2("6.3 Yang Harus Dihapus"),
    para("Berdasarkan analisis di atas, berikut adalah elemen-elemen yang harus dihapus sepenuhnya dari canvas dalam mode preview/present. Elemen-elemen ini hanya boleh muncul dalam mode edit sebagai overlay:"),
    bullet("Block type label (contoh: Definisi, Kartu 1, Dokumen) \u2014 hapus dari canvas, tampilkan hanya di edit overlay"),
    bullet("Schema chip \u2014 hapus sepenuhnya dari canvas, hanya di panel properties"),
    bullet("Scene badge \u2014 hapus dari canvas, hanya di scene navigator"),
    bullet("Variant indicator \u2014 hapus dari canvas, hanya di block properties"),
    bullet("Selection ring permanen \u2014 ganti dengan subtle hover indicator"),
    bullet("Outline warna per tipe (oranye, hijau, biru) \u2014 hapus, ganti dengan background tint"),
    bullet("Garis pemisah tipis antar block \u2014 hapus, ganti dengan spacing"),
    bullet("Metadata chip (norma, kompetensi) \u2014 hapus dari canvas, tampilkan di panel"),
    bullet("Grip handle permanen \u2014 hanya muncul saat hover di mode edit"),
    bullet("PremiumBadge holographic \u2014 ganti dengan simple badge yang fungsional"),

    h2("6.4 Yang Harus Diganti"),
    para("Bukan hanya menghapus; banyak elemen perlu diganti dengan alternatif yang lebih sesuai dengan filosofi Guided Focus Design:"),
    zebraTable(
      ["Current", "Replace With", "Rationale"],
      [
        ["Border on every card", "Spacing + background tint", "Spacing menggroup, tint memisahkan, tanpa garis"],
        ["Color outline per type", "Semantic background tint", "Lebih subtle, tidak rainbow, tetap differentiated"],
        ["Card stack layout", "Section-specific layout grammar", "Setiap section punya komposisi sesuai tujuannya"],
        ["Flat typography", "Dramatic scale hierarchy", "Hero 48px, Section 32px, Body 18px \u2014 kontras jelas"],
        ["Holographic/aurora effects", "Functional motion only", "Reveal, feedback, focus \u2014 motion yang melayani tujuan"],
        ["Permanent labels", "Edit overlay labels", "Label hanya saat edit, hilang saat preview/present"],
        ["Dense content", "35% whitespace + 120 word max", "Breathing room untuk cognitive processing"],
        ["Selection ring", "Subtle hover + fade overlay", "Tidak mengganggu konten, hanya saat diperlukan"],
      ],
      [22, 24, 54]
    ),
  ];
}

function section7_Migrasi() {
  return [
    h1("7. Rencana Migrasi"),

    para("Migrasi dari desain saat ini ke Guided Focus Design tidak bisa dilakukan sekaligus. Perubahan yang terlalu drastis akan membreak semua 43 block renderer sekaligus dan membuat kode tidak bisa di-debug. Migrasi harus dilakukan secara bertahap, dimulai dari foundation (filosofi dan token) baru kemudian ke surface (visual dan interaksi). Berikut adalah rencana migrasi lima fase yang memastikan setiap fase menghasilkan produk yang fungsional:"),

    h2("7.1 Phase A: Visual Philosophy Foundation (Minggu 1)"),
    para("Fase ini memastikan seluruh tim (dan kode) mengadopsi filosofi yang sama. Output utama bukan kode, melainkan spesifikasi yang menjadi source of truth untuk semua keputusan desain selanjutnya. Tanpa fase ini, setiap keputusan desain akan menjadi ad-hoc dan tidak konsisten."),
    bullet("Finalisasi Educational Visual Philosophy document (dokumen ini)"),
    bullet("Review dan persetujuan dari stakeholder"),
    bullet("Update SYSTEM_MAP.md dengan filosofi baru"),
    bullet("Definisikan design decision framework: setiap keputusan desain harus menjawab 'Apakah ini membantu siswa belajar?'"),
    bullet("Audit existing codebase: identifikasi semua anti-pattern yang perlu diubah"),

    h2("7.2 Phase B: Typography System Overhaul (Minggu 2-3)"),
    para("Fase ini mengoverhaul typography system dari flat ke dramatic. Ini adalah perubahan yang paling terasa secara visual dan paling berdampak pada readability. Perubahan dilakukan di level token, sehingga semua 43 block renderer otomatis terupdate."),
    bullet("Update education-typography.ts: scale baru (hero 48-56px, section 32-36px, body 18-20px)"),
    bullet("Update EduRenderingContext: weight hierarchy (ExtraBold/Bold/Semibold/Medium/Regular/Light)"),
    bullet("Update line height dan letter spacing per token"),
    bullet("Update display mode adjustments: projector +15-20%, student -10%"),
    bullet("Test semua 43 block renderer dengan typography baru"),
    bullet("Visual regression test: pastikan tidak ada overflow atau text truncation"),

    h2("7.3 Phase C: Spatial Layout Implementation (Minggu 3-5)"),
    para("Fase ini mengimplementasikan Spatial Layout System. Ini adalah perubahan paling besar secara arsitektural karena mengubah cara block disusun di canvas. Bukan lagi vertical stack, tapi section-specific composition."),
    bullet("Definisikan 8 section types dengan atmosfer masing-masing di kode"),
    bullet("Implementasikan background tint system (bukan border system)"),
    bullet("Implementasikan layout grammar per section type"),
    bullet("Hapus border/outline dari semua section containers, ganti dengan spacing + tint"),
    bullet("Implementasikan whitespace budget (35% minimum)"),
    bullet("Implementasikan content density rules (120 word max, 5 element max)"),
    bullet("Update VisualLinter untuk menggunakan rule baru"),

    h2("7.4 Phase D: Interaction Language Integration (Minggu 5-7)"),
    para("Fase ini mengintegrasikan Interaction Language ke dalam semua komponen interaktif. Ini mencakup hover states, reveal patterns, quiz feedback, dan section transitions. Motion yang lama (holographic, aurora, confetti) diganti dengan functional motion."),
    bullet("Implementasikan hover state spec untuk setiap tipe elemen interaktif"),
    bullet("Implementasikan 5 reveal patterns (slide, fade, flip, expand, spotlight)"),
    bullet("Overhaul quiz feedback: ganti confetti dengan functional feedback"),
    bullet("Implementasikan section transition system"),
    bullet("Hapus semua forbidden motion (bounce, elastic, holographic, confetti, parallax)"),
    bullet("Overhaul PremiumStepNavigator: hapus holographic, ganti dengan functional step indicator"),
    bullet("Implementasikan attention steering techniques"),

    h2("7.5 Phase E: Polish & Validation (Minggu 7-8)"),
    para("Fase terakhir memastikan semua perubahan bekerja bersama secara harmonis. Ini mencakup user testing, accessibility audit, dan performance optimization. Output akhir adalah produk yang terasa seperti aplikasi belajar, bukan builder tool."),
    bullet("Full visual regression test: setiap halaman, setiap display mode"),
    bullet("Back-of-Classroom Test: pastikan heading terbaca dari 5 meter"),
    bullet("Accessibility audit: WCAG AAA contrast, keyboard navigation, screen reader"),
    bullet("Performance audit: pastikan motion tidak menyebabkan jank atau layout thrash"),
    bullet("User testing dengan guru SMP/SMA: apakah terasa seperti learning tool?"),
    bullet("Freeze design tokens: setelah validasi, tokens menjadi contract yang tidak diubah"),
    bullet("Update documentation dan SYSTEM_MAP.md"),
    para("Setelah Phase E selesai, SILSE akan memiliki educational visual philosophy yang konsisten, typography yang dramatis, spatial layout yang bercerita, dan interaksi yang fungsional. Produk akan terasa seperti interactive textbook yang hidup, bukan dashboard admin yang membosankan."),
  ];
}

// ─── ASSEMBLE DOCUMENT ───
async function generate() {
  const coverChildren = [buildCover()];

  const bodyChildren = [
    // TOC
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
      children: [new TextRun({ text: "Daftar Isi", size: 32, bold: true, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
    }),
    new TableOfContents("Daftar Isi", {
      hyperlink: true,
      headingStyleRange: "1-3",
    }),
    new Paragraph({ children: [new PageBreak()] }),

    // Sections
    ...section1_IdentitasProduk(),
    ...section2_FilosofiVisual(),
    ...section3_TypographySpec(),
    ...section4_SpatialLayout(),
    ...section5_InteractionLanguage(),
    ...section6_AntiPatterns(),
    ...section7_Migrasi(),
  ];

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, size: 22, color: c(P.body) },
          paragraph: { spacing: { line: 312 } },
        },
        heading1: {
          run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 32, bold: true, color: c(P.primary) },
          paragraph: { spacing: { before: 480, after: 200, line: 312 } },
        },
        heading2: {
          run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 28, bold: true, color: c(P.primary) },
          paragraph: { spacing: { before: 360, after: 160, line: 312 } },
        },
        heading3: {
          run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 24, bold: true, color: c(P.body) },
          paragraph: { spacing: { before: 280, after: 120, line: 312 } },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: "bullet-list",
          levels: [{
            level: 0,
            format: "bullet",
            text: "\u2022",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
      ],
    },
    sections: [
      // Cover section
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 0, bottom: 0, left: 0, right: 0 },
          },
        },
        children: coverChildren,
      },
      // TOC + Body section
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
            pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
          },
        },
        headers: {
          default: new Header({
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: "SILSE Educational Visual Philosophy \u2014 v2.0", size: 16, color: c(P.secondary), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
            })],
          }),
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(P.secondary) })],
            })],
          }),
        },
        children: bodyChildren,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = "/home/z/my-project/download/SILSE-Educational-Visual-Philosophy-v2.0.docx";
  fs.writeFileSync(outputPath, buffer);
  console.log(`Document saved to: ${outputPath}`);
  return outputPath;
}

generate().catch(console.error);
