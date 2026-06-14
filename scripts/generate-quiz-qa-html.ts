/**
 * Generate quiz QA patch HTML using the actual export pipeline functions.
 * Usage: npx tsx scripts/generate-quiz-qa-html.ts
 */
import { generateClientExportHtml } from '../src/lib/export/index';
import type { ClientExportPayload } from '../src/lib/export/index';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';

// ── Quiz Data ──────────────────────────────────────────────────────

const kuisSainsQuestions = [
  {
    q: 'Apa ibu kota Indonesia?',
    opts: ['Jakarta', 'Bandung', 'Surabaya', 'Medan'],
    ans: 0,
    ex: 'Jakarta adalah ibu kota negara Republik Indonesia sejak kemerdekaan.',
  },
  {
    q: 'Berapakah hasil 7 × 8?',
    opts: ['54', '56', '58', '64'],
    ans: 1,
    ex: '7 × 8 = 56. Cara mudah: 7 × 8 = (7 × 4) × 2 = 28 × 2 = 56.',
  },
  {
    q: 'Planet terbesar di tata surya adalah?',
    opts: ['Saturnus', 'Neptunus', 'Jupiter', 'Uranus'],
    ans: 2,
    ex: 'Jupiter adalah planet terbesar dengan diameter sekitar 142.984 km.',
  },
];

const kuisBahasaQuestions = [
  {
    q: "Kata baku dari 'aktifitas' adalah?",
    opts: ['Aktifitas', 'Aktivitas', 'Aktifftas', 'Aktivutas'],
    ans: 1,
    ex: "Kata baku yang benar adalah 'aktivitas' sesuai KBBI.",
  },
  {
    q: "Sinonim dari kata 'pandai' adalah?",
    opts: ['Bodoh', 'Cerdas', 'Malas', 'Lambat'],
    ans: 1,
    ex: 'Cerdas adalah sinonim dari pandai, keduanya berarti memiliki kecerdasan.',
  },
  {
    q: 'Huruf kapital digunakan pada...',
    opts: ['Nama benda', 'Nama orang dan tempat', 'Kata sifat', 'Kata kerja'],
    ans: 1,
    ex: 'Huruf kapital digunakan untuk nama orang, tempat, dan awal kalimat.',
  },
];

// ── Build Export Payload ───────────────────────────────────────────

const payload: ClientExportPayload = {
  pages: [
    // Page 1: Kuis Sains
    {
      id: 'page-sains',
      label: 'Kuis Sains',
      bgDataUrl: null,
      bgColor: '#0f172a',
      overlay: 0,
      elements: [],
      templateType: 'kuis',
      colorPalette: null,
      navConfig: {
        showNavbar: true,
        showPrevNext: true,
        showScore: true,
        showProgress: true,
        navbarStyle: 'colorful',
      },
      templateData: {},
      schema: {
        sectionLabel: 'Evaluasi Sains',
        sectionColor: 'c',
        background: { type: 'solid', color1: '#0f172a' },
        blocks: [
          {
            type: 'kuis',
            title: 'Kuis Sains',
            questions: kuisSainsQuestions,
          },
        ],
      },
    },
    // Page 2: Kuis Bahasa
    {
      id: 'page-bahasa',
      label: 'Kuis Bahasa',
      bgDataUrl: null,
      bgColor: '#1a1035',
      overlay: 0,
      elements: [],
      templateType: 'kuis',
      colorPalette: null,
      navConfig: {
        showNavbar: true,
        showPrevNext: true,
        showScore: true,
        showProgress: true,
        navbarStyle: 'colorful',
      },
      templateData: {},
      schema: {
        sectionLabel: 'Evaluasi Bahasa',
        sectionColor: 'y',
        background: { type: 'solid', color1: '#1a1035' },
        blocks: [
          {
            type: 'kuis',
            title: 'Kuis Bahasa',
            questions: kuisBahasaQuestions,
          },
        ],
      },
    },
  ],
  ratioId: '16:9',
  meta: {
    judulPertemuan: 'QA Quiz Patch Test',
    mapel: 'Multi-subject',
    kelas: '7',
  },
  allKuis: [],
  allModules: [],
  games: [],
  cp: {},
  tp: [],
  atp: {},
  alur: [],
  materi: {},
  skenario: [],
  petunjuk: {},
  diskusi: {},
  refleksi: {},
  penutup: {},
  suara: {},
};

// ── Generate HTML ──────────────────────────────────────────────────

const html = generateClientExportHtml(payload);

const outPath = resolve(__dirname, '../download/quiz-qa-patch.html');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, html, 'utf-8');

console.log(`✅ Generated: ${outPath}`);
console.log(`   Size: ${(html.length / 1024).toFixed(1)} KB`);
console.log(`   Pages: ${payload.pages.length}`);
console.log(`   Block 1: Kuis Sains (${kuisSainsQuestions.length} questions)`);
console.log(`   Block 2: Kuis Bahasa (${kuisBahasaQuestions.length} questions)`);
