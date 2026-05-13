// ═══════════════════════════════════════════════════════════════════════
// DATABASE SEED — Sample data for development
// ═══════════════════════════════════════════════════════════════════════
// Creates:
//   - 2 sample projects with pages and blocks
//   - 5 templates
// ═══════════════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Clean existing data ───────────────────────────────────────
  await prisma.block.deleteMany();
  await prisma.page.deleteMany();
  await prisma.project.deleteMany();
  await prisma.template.deleteMany();
  console.log('  ✓ Cleaned existing data');

  // ── Sample Project 1: PPKn Norma ─────────────────────────────
  const project1 = await prisma.project.create({
    data: {
      title: 'Norma dan Kehidupan',
      description: 'Media Pembelajaran Interaktif untuk memahami macam-macam norma dalam kehidupan bermasyarakat',
      subject: 'PPKn',
      grade: 'VII',
      semester: 1,
      teacherName: 'Ibu Sari Dewi',
      schoolName: 'SMP Negeri 1 Jakarta',
      templateId: 'ppkn-norma',
      themeId: 'ocean',
      ratioId: '9:16',
    },
  });

  // Cover page
  const page1 = await prisma.page.create({
    data: {
      projectId: project1.id,
      pageIndex: 0,
      label: 'Cover',
      templateType: 'cover',
      variant: 'A',
      bgColor: '#0f172a',
      bgOverlay: 0.2,
      schemaData: JSON.stringify({
        id: 'cover-1',
        version: 1,
        templateType: 'cover',
        blocks: [
          {
            type: 'cover',
            icon: '⚖️',
            title: 'Norma dan Kehidupan',
            subtitle: 'PPKn Kelas VII - Semester 1',
            badges: [
              { icon: '📚', text: 'PPKn', color: 'y' },
              { icon: '🏫', text: 'Kelas VII', color: 'c' },
            ],
            background: { type: 'gradient', color1: 'c', color2: 'p' },
          },
        ],
      }),
    },
  });

  await prisma.block.create({
    data: {
      pageId: page1.id,
      blockType: 'cover',
      blockIndex: 0,
      content: JSON.stringify({
        icon: '⚖️',
        title: 'Norma dan Kehidupan',
        subtitle: 'PPKn Kelas VII - Semester 1',
        badges: [
          { icon: '📚', text: 'PPKn', color: 'y' },
          { icon: '🏫', text: 'Kelas VII', color: 'c' },
        ],
      }),
    },
  });

  // Petunjuk page
  const page2 = await prisma.page.create({
    data: {
      projectId: project1.id,
      pageIndex: 1,
      label: 'Petunjuk',
      templateType: 'petunjuk',
      bgColor: '#0f172a',
      schemaData: JSON.stringify({
        id: 'petunjuk-1',
        version: 1,
        templateType: 'petunjuk',
        blocks: [
          {
            type: 'petunjuk',
            title: 'Petunjuk Penggunaan',
            titleHighlight: 'Cara Menggunakan',
            items: [
              { icon: '👆', title: 'Navigasi', body: 'Gunakan tombol panah untuk berpindah halaman' },
              { icon: '🎮', title: 'Interaksi', body: 'Klik atau sentuh elemen interaktif untuk bermain' },
              { icon: '✅', title: 'Jawaban', body: 'Pilih jawaban yang menurutmu benar' },
            ],
          },
        ],
      }),
    },
  });

  await prisma.block.create({
    data: {
      pageId: page2.id,
      blockType: 'petunjuk',
      blockIndex: 0,
      content: JSON.stringify({
        title: 'Petunjuk Penggunaan',
        titleHighlight: 'Cara Menggunakan',
        items: [
          { icon: '👆', title: 'Navigasi', body: 'Gunakan tombol panah untuk berpindah halaman' },
          { icon: '🎮', title: 'Interaksi', body: 'Klik atau sentuh elemen interaktif untuk bermain' },
          { icon: '✅', title: 'Jawaban', body: 'Pilih jawaban yang menurutmu benar' },
        ],
      }),
    },
  });

  // Kuis page
  const page3 = await prisma.page.create({
    data: {
      projectId: project1.id,
      pageIndex: 2,
      label: 'Kuis Norma',
      templateType: 'kuis',
      bgColor: '#0f172a',
      schemaData: JSON.stringify({
        id: 'kuis-1',
        version: 1,
        templateType: 'kuis',
        blocks: [
          {
            type: 'kuis',
            title: 'Kuis: Norma dalam Kehidupan',
            questions: [
              {
                q: 'Norma yang bersumber dari agama disebut...',
                opts: ['Norma kesopanan', 'Norma agama', 'Norma hukum', 'Norma kesusilaan'],
                ans: 1,
                ex: 'Norma agama bersumber dari kitab suci dan ajaran agama.',
              },
              {
                q: 'Sanksi pelanggaran norma kesusilaan berupa...',
                opts: ['Denda', 'Penjara', 'Rasa malu', 'Dicela masyarakat'],
                ans: 2,
                ex: 'Pelanggaran norma kesusilaan menimbulkan rasa malu dalam diri sendiri.',
              },
            ],
          },
        ],
      }),
    },
  });

  await prisma.block.create({
    data: {
      pageId: page3.id,
      blockType: 'kuis',
      blockIndex: 0,
      content: JSON.stringify({
        title: 'Kuis: Norma dalam Kehidupan',
        questions: [
          {
            q: 'Norma yang bersumber dari agama disebut...',
            opts: ['Norma kesopanan', 'Norma agama', 'Norma hukum', 'Norma kesusilaan'],
            ans: 1,
            ex: 'Norma agama bersumber dari kitab suci dan ajaran agama.',
          },
        ],
      }),
    },
  });

  console.log('  ✓ Created project 1: Norma dan Kehidupan');

  // ── Sample Project 2: Matematika ──────────────────────────────
  const project2 = await prisma.project.create({
    data: {
      title: 'Bilangan Bulat',
      description: 'MPI untuk memahami operasi bilangan bulat',
      subject: 'Matematika',
      grade: 'VII',
      semester: 1,
      teacherName: 'Bapak Ahmad Rizki',
      schoolName: 'SMP Negeri 2 Bandung',
      themeId: 'sunset',
      ratioId: '16:9',
    },
  });

  // Cover page
  const p2page1 = await prisma.page.create({
    data: {
      projectId: project2.id,
      pageIndex: 0,
      label: 'Cover',
      templateType: 'cover',
      bgColor: '#1e1b4b',
      schemaData: JSON.stringify({
        id: 'cover-math',
        version: 1,
        templateType: 'cover',
        blocks: [
          {
            type: 'cover',
            icon: '🔢',
            title: 'Bilangan Bulat',
            subtitle: 'Matematika Kelas VII',
            badges: [
              { icon: '📐', text: 'Matematika', color: 'c' },
              { icon: '🏫', text: 'Kelas VII', color: 'y' },
            ],
            background: { type: 'gradient', color1: 'p', color2: 'c' },
          },
        ],
      }),
    },
  });

  await prisma.block.create({
    data: {
      pageId: p2page1.id,
      blockType: 'cover',
      blockIndex: 0,
      content: JSON.stringify({
        icon: '🔢',
        title: 'Bilangan Bulat',
        subtitle: 'Matematika Kelas VII',
      }),
    },
  });

  // Materi page
  const p2page2 = await prisma.page.create({
    data: {
      projectId: project2.id,
      pageIndex: 1,
      label: 'Materi',
      templateType: 'materi',
      bgColor: '#0f172a',
      schemaData: JSON.stringify({
        id: 'materi-math',
        version: 1,
        templateType: 'materi',
        blocks: [
          {
            type: 'def-box',
            borderColor: 'y',
            content: 'Bilangan bulat adalah himpunan bilangan yang terdiri dari bilangan bulat positif, nol, dan bilangan bulat negatif.',
          },
        ],
      }),
    },
  });

  await prisma.block.create({
    data: {
      pageId: p2page2.id,
      blockType: 'def-box',
      blockIndex: 0,
      content: JSON.stringify({
        borderColor: 'y',
        content: 'Bilangan bulat adalah himpunan bilangan yang terdiri dari bilangan bulat positif, nol, dan bilangan bulat negatif.',
      }),
    },
  });

  // Game page
  const p2page3 = await prisma.page.create({
    data: {
      projectId: project2.id,
      pageIndex: 2,
      label: 'Game Sortir',
      templateType: 'game',
      bgColor: '#0f172a',
      schemaData: JSON.stringify({
        id: 'game-math',
        version: 1,
        templateType: 'game',
        blocks: [
          {
            type: 'sortir-game',
            title: 'Sortir: Positif atau Negatif?',
            pool: [
              { id: 'i1', text: '5', category: 'positif' },
              { id: 'i2', text: '-3', category: 'negatif' },
              { id: 'i3', text: '12', category: 'positif' },
              { id: 'i4', text: '-7', category: 'negatif' },
            ],
            kolom: [
              { id: 'positif', label: 'Positif', color: 'g' },
              { id: 'negatif', label: 'Negatif', color: 'r' },
            ],
          },
        ],
      }),
    },
  });

  await prisma.block.create({
    data: {
      pageId: p2page3.id,
      blockType: 'sortir-game',
      blockIndex: 0,
      content: JSON.stringify({
        title: 'Sortir: Positif atau Negatif?',
        pool: [
          { id: 'i1', text: '5', category: 'positif' },
          { id: 'i2', text: '-3', category: 'negatif' },
        ],
        kolom: [
          { id: 'positif', label: 'Positif', color: 'g' },
          { id: 'negatif', label: 'Negatif', color: 'r' },
        ],
      }),
    },
  });

  console.log('  ✓ Created project 2: Bilangan Bulat');

  // ── Templates ──────────────────────────────────────────────────

  const templates = [
    {
      name: 'PPKn - Norma & Kehidupan',
      description: 'Template lengkap untuk materi norma dalam kehidupan bermasyarakat. Termasuk cover, petunjuk, materi, kuis, dan refleksi.',
      subject: 'PPKn',
      category: 'official',
      icon: '⚖️',
      schemaData: JSON.stringify({
        id: 'tpl-norma',
        version: 1,
        title: 'Norma & Kehidupan',
        mapel: 'PPKn',
        kelas: 'VII',
        themeId: 'ocean',
        screens: [
          { id: 's1', templateType: 'cover', blocks: [{ type: 'cover', icon: '⚖️', title: '[Judul]', subtitle: '[Subtitle]', badges: [] }] },
          { id: 's2', templateType: 'petunjuk', blocks: [{ type: 'petunjuk', title: 'Petunjuk', titleHighlight: 'Cara Menggunakan', items: [] }] },
          { id: 's3', templateType: 'materi', blocks: [{ type: 'def-box', content: '[Definisi]' }] },
          { id: 's4', templateType: 'kuis', blocks: [{ type: 'kuis', title: 'Kuis', questions: [] }] },
        ],
      }),
      downloads: 150,
      rating: 4.5,
    },
    {
      name: 'Matematika - Operasi Bilangan',
      description: 'Template untuk materi operasi hitung bilangan bulat dan pecahan. Termasuk game interaktif sortir dan kuis.',
      subject: 'Matematika',
      category: 'official',
      icon: '🔢',
      schemaData: JSON.stringify({
        id: 'tpl-math',
        version: 1,
        title: 'Operasi Bilangan',
        mapel: 'Matematika',
        kelas: 'VII',
        themeId: 'sunset',
        screens: [
          { id: 's1', templateType: 'cover', blocks: [{ type: 'cover', icon: '🔢', title: '[Judul]', subtitle: '[Subtitle]', badges: [] }] },
          { id: 's2', templateType: 'materi', blocks: [{ type: 'def-box', content: '[Definisi]' }] },
          { id: 's3', templateType: 'game', blocks: [{ type: 'sortir-game', title: 'Game Sortir', pool: [], kolom: [] }] },
          { id: 's4', templateType: 'kuis', blocks: [{ type: 'kuis', title: 'Kuis', questions: [] }] },
        ],
      }),
      downloads: 120,
      rating: 4.3,
    },
    {
      name: 'IPA - Sistem Tata Surya',
      description: 'Template untuk materi tata surya dan planet. Termasuk crossword game dan flashcard.',
      subject: 'IPA',
      category: 'official',
      icon: '🌍',
      schemaData: JSON.stringify({
        id: 'tpl-ipa',
        version: 1,
        title: 'Tata Surya',
        mapel: 'IPA',
        kelas: 'IX',
        themeId: 'midnight',
        screens: [
          { id: 's1', templateType: 'cover', blocks: [{ type: 'cover', icon: '🌍', title: '[Judul]', subtitle: '[Subtitle]', badges: [] }] },
          { id: 's2', templateType: 'materi', blocks: [{ type: 'nc-grid', cards: [] }] },
          { id: 's3', templateType: 'game', blocks: [{ type: 'crossword-game', title: 'Teka Silang', words: [] }] },
        ],
      }),
      downloads: 85,
      rating: 4.0,
    },
    {
      name: 'Bahasa Indonesia - Teks Narasi',
      description: 'Template untuk materi teks narasi dan struktur teks. Termasuk diskusi dan refleksi.',
      subject: 'Bahasa Indonesia',
      category: 'community',
      icon: '📖',
      schemaData: JSON.stringify({
        id: 'tpl-bindo',
        version: 1,
        title: 'Teks Narasi',
        mapel: 'Bahasa Indonesia',
        kelas: 'VIII',
        themeId: 'forest',
        screens: [
          { id: 's1', templateType: 'cover', blocks: [{ type: 'cover', icon: '📖', title: '[Judul]', subtitle: '[Subtitle]', badges: [] }] },
          { id: 's2', templateType: 'materi', blocks: [{ type: 'materi-section', title: 'Struktur Teks', content: [] }] },
          { id: 's3', templateType: 'diskusi', blocks: [{ type: 'diskusi', title: 'Diskusi', questions: [] }] },
        ],
      }),
      downloads: 45,
      rating: 3.8,
    },
    {
      name: 'Template Kosong - Mulai dari Nol',
      description: 'Template kosong untuk guru yang ingin membuat MPI dari awal. Hanya berisi cover dan satu halaman kosong.',
      subject: null,
      category: 'official',
      icon: '✨',
      schemaData: JSON.stringify({
        id: 'tpl-blank',
        version: 1,
        title: 'Proyek Baru',
        mapel: '',
        kelas: '',
        themeId: 'slate',
        screens: [
          { id: 's1', templateType: 'cover', blocks: [{ type: 'cover', icon: '✨', title: 'Judul Proyek', subtitle: 'Mata Pelajaran - Kelas', badges: [] }] },
          { id: 's2', templateType: 'custom', blocks: [] },
        ],
      }),
      downloads: 300,
      rating: 4.8,
    },
  ];

  for (const tpl of templates) {
    await prisma.template.create({ data: tpl });
  }
  console.log('  ✓ Created 5 templates');

  console.log('✅ Seeding complete!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
