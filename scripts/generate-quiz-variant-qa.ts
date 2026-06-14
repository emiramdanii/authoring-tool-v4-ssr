/**
 * Sprint 6.4-D QA: Generate 3 quiz variants (A/B/C) with identical content
 * to verify visual parity between variants in the standalone HTML export.
 * Usage: npx tsx scripts/generate-quiz-variant-qa.ts
 */
import { generateClientExportHtml } from '../src/lib/export/index';
import type { ClientExportPayload } from '../src/lib/export/index';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';

// ── Identical quiz data for all 3 variants ──────────────────────────

const sharedQuestions = [
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
  {
    q: 'Hewan yang bernapas dengan insang adalah?',
    opts: ['Kucing', 'Ikan', 'Burung', 'Kuda'],
    ans: 1,
    ex: 'Ikan bernapas menggunakan insang untuk mengambil oksigen dari air.',
  },
];

// ── Build Export Payload with 3 pages (A, B, C) ────────────────────

const payload: ClientExportPayload = {
  pages: [
    // Page 1: Variant A — Klasik
    {
      id: 'page-variant-a',
      label: 'Variant A — Klasik',
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
        id: 'page-variant-a',
        templateType: 'kuis',
        sectionLabel: 'Variant A',
        sectionColor: 'c',
        background: { type: 'solid', color1: '#0f172a' },
        blocks: [
          {
            type: 'kuis',
            title: 'Kuis Klasik (A)',
            variant: 'A',
            questions: sharedQuestions,
          },
        ],
      },
    },
    // Page 2: Variant B — Kartu
    {
      id: 'page-variant-b',
      label: 'Variant B — Kartu',
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
        id: 'page-variant-b',
        templateType: 'kuis',
        sectionLabel: 'Variant B',
        sectionColor: 'y',
        background: { type: 'solid', color1: '#1a1035' },
        blocks: [
          {
            type: 'kuis',
            title: 'Kuis Kartu (B)',
            variant: 'B',
            questions: sharedQuestions,
          },
        ],
      },
    },
    // Page 3: Variant C — Ringkas
    {
      id: 'page-variant-c',
      label: 'Variant C — Ringkas',
      bgDataUrl: null,
      bgColor: '#0d1a0f',
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
        id: 'page-variant-c',
        templateType: 'kuis',
        sectionLabel: 'Variant C',
        sectionColor: 'g',
        background: { type: 'solid', color1: '#0d1a0f' },
        blocks: [
          {
            type: 'kuis',
            title: 'Kuis Ringkas (C)',
            variant: 'C',
            questions: sharedQuestions,
          },
        ],
      },
    },
    // Page 4: No variant (fallback) — should render as A
    {
      id: 'page-variant-fallback',
      label: 'Fallback (no variant)',
      bgDataUrl: null,
      bgColor: '#1a0f17',
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
        id: 'page-variant-fallback',
        templateType: 'kuis',
        sectionLabel: 'Fallback',
        sectionColor: 'o',
        background: { type: 'solid', color1: '#1a0f17' },
        blocks: [
          {
            type: 'kuis',
            title: 'Kuis Fallback (tanpa variant)',
            // No variant field — should fall back to A
            questions: sharedQuestions,
          },
        ],
      },
    },
  ],
  ratioId: '16:9',
  meta: {
    judulPertemuan: 'Sprint 6.4-D Quiz Variant QA',
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

const outPath = resolve(__dirname, '../download/quiz-variant-qa.html');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, html, 'utf-8');

console.log(`✅ Generated: ${outPath}`);
console.log(`   Size: ${(html.length / 1024).toFixed(1)} KB`);
console.log(`   Pages: ${payload.pages.length}`);
console.log(`   Page 1: Variant A — Klasik (${sharedQuestions.length} questions)`);
console.log(`   Page 2: Variant B — Kartu (${sharedQuestions.length} questions)`);
console.log(`   Page 3: Variant C — Ringkas (${sharedQuestions.length} questions)`);
console.log(`   Page 4: Fallback (no variant) — should render as A`);
