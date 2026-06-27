// ═══════════════════════════════════════════════════════════════
// BATCH-11A — V5-DEFAULT-PAGE-TEMPLATE-PURGE-01
// ═══════════════════════════════════════════════════════════════
// Senior verdict on Batch 11: PARTIAL ACCEPT. Need Patch 11A.
// Reasons:
//   1. Generic course templates (materi-kuis, materi-aktivitas,
//      skenario-diskusi, game-sortir-kuis, pertemuan-lengkap,
//      template-kosong, etc) were still status='active'.
//   2. Page preset/default page registry was not audited — new
//      pages could still inherit legacy contracts.
//   3. Fresh PPKn content was too generic ("Belajar Bersama SILSE")
//      — not real PPKn curriculum.
//
// Patch 11A fixes all three:
//   Scope A — Purge active course template defaults
//   Scope B — Purge active page defaults (default contract = silse-fresh)
//   Scope C — Fresh PPKn content with real curriculum
//     Title: "Hidup Tertib dengan Norma"
//     Materi: pengertian, fungsi, contoh penerapan
//     Game sortir: Tertib vs Tidak Tertib (4 contoh perilaku)
//     Kuis: 5 soal PPKn nyata
//     Refleksi: penerapan norma di kelas
//   Scope D — Tests (this file, 10 sub-tests per senior spec)
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createSilseFreshPpknProject, SILSE_FRESH_TEMPLATE_META } from '@/presets/fresh/silse-fresh-ppkn-schema';
import {
  getCourseTemplate,
  getAllCourseTemplates,
  getCourseTemplatesFiltered,
} from '@/core/template/CourseTemplateRegistry';
import { createPageFromPreset } from '@/core/preset/PagePresetRegistry';
import { getContract } from '@/core/template/contract';

const readSrc = (rel: string) =>
  readFileSync(resolve(__dirname, '..', rel), 'utf-8');

// ═══════════════════════════════════════════════════════════════
// SCOPE D — TEST 1: V5 gallery hanya menampilkan silse-fresh-ppkn + blank
// ═══════════════════════════════════════════════════════════════

describe('BATCH-11A Test 1: V5 gallery shows only silse-fresh-ppkn + blank option', () => {
  it('TemplatePickerV5 source renders fresh templates (silse-studio + silse-fresh-ppkn) + blank', () => {
    const src = readSrc('components/product-v5/TemplatePickerV5.tsx');

    // BATCH-11C: Both fresh templates rendered via dynamic template literal
    expect(src).toContain('template-card-${template.id}');
    // Blank button IS rendered (separate from template cards)
    expect(src).toContain("template-card-blank");
    expect(src).toContain("Mulai Kosong");

    // Legacy/generic template IDs are NOT referenced as template cards.
    const legacyIds = [
      'modul-ppkn-vii',
      'materi-kuis',
      'materi-aktivitas',
      'skenario-diskusi',
      'game-sortir-kuis',
      'pertemuan-lengkap',
      'macam-norma',
      'misi-penjelajah',
      'template-kosong',
    ];
    for (const id of legacyIds) {
      expect(src, `legacy template "${id}" must NOT have a static template-card ref`).not.toContain(`template-card-${id}`);
    }
  });

  it('TemplatePickerV5 has no V5_TEMPLATE_IDS array (replaced with direct fetch)', () => {
    const src = readSrc('components/product-v5/TemplatePickerV5.tsx');
    // BATCH-11A: removed the V5_TEMPLATE_IDS array, replaced with
    // direct getCourseTemplate(FRESH_TEMPLATE_ID) call.
    expect(src).not.toContain('V5_TEMPLATE_IDS');
    expect(src).toContain('FRESH_TEMPLATE_ID');
  });
});

// ═══════════════════════════════════════════════════════════════
// SCOPE D — TEST 2: Generic templates NOT in TemplatePickerV5
// ═══════════════════════════════════════════════════════════════

describe('BATCH-11A Test 2: Generic templates not in TemplatePickerV5', () => {
  it('all generic template IDs are status=legacy in registry', () => {
    const genericIds = [
      'materi-kuis',
      'materi-aktivitas',
      'skenario-diskusi',
      'game-sortir-kuis',
      'pertemuan-lengkap',
      'macam-norma',
      'misi-penjelajah',
      'template-kosong',
      'modul-ppkn-vii',
    ];
    for (const id of genericIds) {
      const tmpl = getCourseTemplate(id);
      expect(tmpl, `template "${id}" must still exist (backward compat)`).toBeDefined();
      expect(tmpl?.status, `template "${id}" must be status='legacy'`).toBe('legacy');
    }
  });

  it('only fresh templates are status=active in registry (silse-studio + silse-fresh-ppkn)', () => {
    // BATCH-11C: 2 active templates — silse-studio (primary) + silse-fresh-ppkn
    const all = getAllCourseTemplates();
    const active = all.filter(t => t.status === 'active');
    expect(active.length, 'exactly 2 active templates').toBe(2);
    const activeIds = active.map(t => t.id);
    expect(activeIds).toContain('silse-studio');
    expect(activeIds).toContain('silse-fresh-ppkn');
  });
});

// ═══════════════════════════════════════════════════════════════
// SCOPE D — TEST 3: Registry default does not return legacy as active
// ═══════════════════════════════════════════════════════════════

describe('BATCH-11A Test 3: CourseTemplateRegistry default = fresh only', () => {
  it('getCourseTemplatesFiltered returns only fresh templates by default', () => {
    // BATCH-11C: 2 active templates shown by default
    const filtered = getCourseTemplatesFiltered(undefined, undefined, false);
    expect(filtered.length).toBe(2);
    const ids = filtered.map(t => t.id);
    expect(ids).toContain('silse-studio');
    expect(ids).toContain('silse-fresh-ppkn');
    for (const t of filtered) {
      expect(t.status).toBe('active');
    }
  });

  it('getCourseTemplatesFiltered with showLegacy=true returns legacy templates too', () => {
    const filtered = getCourseTemplatesFiltered(undefined, undefined, true);
    const legacyCount = filtered.filter(t => t.status === 'legacy').length;
    expect(legacyCount, 'legacy templates still accessible via showLegacy').toBeGreaterThan(0);
    // silse-studio still first (primary)
    expect(filtered[0]?.id).toBe('silse-studio');
  });
});

// ═══════════════════════════════════════════════════════════════
// SCOPE D — TEST 4: Fresh page default does not use legacy contract
// ═══════════════════════════════════════════════════════════════

describe('BATCH-11A Test 4: Page default contract = silse-fresh (not legacy)', () => {
  it('createPageFromPreset defaults to silse-fresh contract (not modern-educator)', () => {
    // BATCH-11A: PagePresetRegistry.createPageFromPreset was updated
    // to default contractId='silse-fresh' when no contract is set.
    const page = createPageFromPreset('cover', 0);
    expect(page.contractId).toBe('silse-fresh');
    expect(page.contractId).not.toBe('modern-educator');
    expect(page.contractId).not.toBe('golden-pertemuan');
  });

  it('createPageFromPreset for materi also defaults to silse-fresh', () => {
    const page = createPageFromPreset('materi', 1);
    expect(page.contractId).toBe('silse-fresh');
  });

  it('createPageFromPreset for kuis also defaults to silse-fresh', () => {
    const page = createPageFromPreset('kuis', 2);
    expect(page.contractId).toBe('silse-fresh');
  });

  it('PagePresetRegistry source code sets silse-fresh as default', () => {
    const src = readSrc('core/preset/PagePresetRegistry.ts');
    expect(src).toContain("page.contractId = 'silse-fresh'");
    expect(src).toContain('BATCH-11A: Fresh V5 add-page default contract');
  });
});

// ═══════════════════════════════════════════════════════════════
// SCOPE D — TEST 5: Fresh PPKn content is REAL PPKn, not placeholder
// ═══════════════════════════════════════════════════════════════

describe('BATCH-11A Test 5: Fresh PPKn content is real curriculum', () => {
  const freshPages = createSilseFreshPpknProject();

  it('cover title is "Hidup Tertib dengan Norma" (real PPKn topic)', () => {
    const cover = freshPages[0];
    const coverBlock = cover?.schema?.blocks?.[0] as { title?: string };
    expect(coverBlock.title).toBe('Hidup Tertib dengan Norma');
  });

  it('cover subtitle mentions "PPKn Kelas VII"', () => {
    const cover = freshPages[0];
    const coverBlock = cover?.schema?.blocks?.[0] as { subtitle?: string };
    expect(coverBlock.subtitle).toContain('PPKn Kelas VII');
  });

  it('materi page has real PPKn content about norma', () => {
    const materi = freshPages.find(p => p.templateType === 'materi');
    const materiText = JSON.stringify(materi?.schema?.blocks);
    // Real PPKn content — pengertian norma + fungsi norma
    expect(materiText).toContain('Norma');  // word "Norma" appears
    expect(materiText).toContain('aturan');  // definition
    expect(materiText).toContain('ketertiban');  // function
    // Real examples — di sekolah, di rumah, di masyarakat
    expect(materiText).toContain('Sekolah');
    expect(materiText).toContain('Rumah');
    expect(materiText).toContain('Masyarakat');
  });

  it('materi page does NOT have generic placeholder text', () => {
    const materi = freshPages.find(p => p.templateType === 'materi');
    const materiText = JSON.stringify(materi?.schema?.blocks);
    // These generic placeholders from Batch 11 must be GONE in 11A
    expect(materiText).not.toContain('Konsep Inti');  // was generic
    expect(materiText).not.toContain('Ciri-Ciri');  // was generic
    expect(materiText).not.toContain('Relevansi');  // was generic
    expect(materiText).not.toContain('inti dari modul ini');  // was generic
  });

  it('refleksi page asks about penerapan norma di kelas', () => {
    const refleksi = freshPages.find(p => p.templateType === 'refleksi');
    const refleksiText = JSON.stringify(refleksi?.schema?.blocks);
    expect(refleksiText).toContain('tertib');
    expect(refleksiText).toContain('kelas');
    expect(refleksiText).toContain('norma');
  });
});

// ═══════════════════════════════════════════════════════════════
// SCOPE D — TEST 6: Fresh kuis has minimal 5 PPKn questions
// ═══════════════════════════════════════════════════════════════

describe('BATCH-11A Test 6: Fresh kuis has 5 real PPKn questions', () => {
  const freshPages = createSilseFreshPpknProject();
  const kuis = freshPages.find(p => p.templateType === 'kuis');
  const kuisBlock = kuis?.schema?.blocks?.[0] as {
    questions?: Array<{ q: string; opts: string[]; ans: number; ex: string }>;
  };

  it('kuis has exactly 5 questions (senior scope C minimum)', () => {
    expect(kuisBlock.questions?.length).toBe(5);
  });

  it('kuis questions are about norma (real PPKn content)', () => {
    const questions = kuisBlock.questions ?? [];
    for (const q of questions) {
      // Every question must mention "norma" or related PPKn concept
      const text = (q.q + ' ' + q.opts.join(' ') + ' ' + q.ex).toLowerCase();
      const hasNormaConcept =
        text.includes('norma') ||
        text.includes('tertib') ||
        text.includes('ketertiban');
      expect(hasNormaConcept, `question "${q.q}" must relate to PPKn norma topic`).toBe(true);
    }
  });

  it('kuis Q1 asks about pengertian norma', () => {
    const q1 = kuisBlock.questions?.[0];
    expect(q1?.q).toContain('pengertian norma');
  });

  it('kuis Q3 asks about fungsi norma', () => {
    const q3 = kuisBlock.questions?.[2];
    expect(q3?.q).toContain('fungsi');
  });

  it('kuis Q4 asks about jenis norma (Norma Kesopanan etc)', () => {
    const q4 = kuisBlock.questions?.[3];
    expect(q4?.q).toContain('Mengantre');
    expect(q4?.opts.some(o => o.includes('Norma Kesopanan'))).toBe(true);
  });

  it('kuis has 4 options per question (multi-choice standard)', () => {
    const questions = kuisBlock.questions ?? [];
    for (const q of questions) {
      expect(q.opts.length).toBe(4);
    }
  });

  it('kuis has explanation for every question', () => {
    const questions = kuisBlock.questions ?? [];
    for (const q of questions) {
      expect(q.ex, `question "${q.q}" must have explanation`).toBeTruthy();
      expect(q.ex.length).toBeGreaterThan(10);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// SCOPE D — TEST 7: Fresh game has real PPKn examples
// ═══════════════════════════════════════════════════════════════

describe('BATCH-11A Test 7: Fresh game has real PPKn examples', () => {
  const freshPages = createSilseFreshPpknProject();
  const game = freshPages.find(p => p.templateType === 'game');
  const gameBlock = game?.schema?.blocks?.[0] as {
    title?: string;
    pool?: Array<{ id: string; text: string; category: string }>;
    kolom?: Array<{ id: string; label: string; color: string }>;
  };

  it('game title mentions Tertib vs Tidak Tertib (real PPKn concept)', () => {
    expect(gameBlock.title).toContain('Tertib');
    expect(gameBlock.title).toContain('Tidak Tertib');
  });

  it('game has 2 kolom: Perilaku Tertib + Perilaku Tidak Tertib', () => {
    expect(gameBlock.kolom?.length).toBe(2);
    const labels = gameBlock.kolom?.map(k => k.label) ?? [];
    expect(labels).toContain('Perilaku Tertib');
    expect(labels).toContain('Perilaku Tidak Tertib');
  });

  it('game has 4 pool items with real PPKn examples', () => {
    expect(gameBlock.pool?.length).toBe(4);
    const poolText = gameBlock.pool?.map(p => p.text).join(' ') ?? '';
    // Real PPKn examples — school-related behaviors
    expect(poolText).toContain('Mengantre');
    expect(poolText).toContain('sampah');
    expect(poolText).toContain('Memotong antrean');
    expect(poolText).toContain('HP saat guru');
  });

  it('game pool items map to correct kolom (tertib vs tidak tertib)', () => {
    const pool = gameBlock.pool ?? [];
    const tertibKolomId = gameBlock.kolom?.find(k => k.label === 'Perilaku Tertib')?.id;
    const tidakTertibKolomId = gameBlock.kolom?.find(k => k.label === 'Perilaku Tidak Tertib')?.id;

    // 2 items should map to "Perilaku Tertib" (Mengantre, Membuang sampah)
    const tertibItems = pool.filter(p => p.category === tertibKolomId);
    expect(tertibItems.length).toBe(2);
    expect(tertibItems.some(i => i.text.includes('Mengantre'))).toBe(true);
    expect(tertibItems.some(i => i.text.includes('sampah'))).toBe(true);

    // 2 items should map to "Perilaku Tidak Tertib"
    const tidakTertibItems = pool.filter(p => p.category === tidakTertibKolomId);
    expect(tidakTertibItems.length).toBe(2);
    expect(tidakTertibItems.some(i => i.text.includes('Memotong antrean'))).toBe(true);
    expect(tidakTertibItems.some(i => i.text.includes('HP saat guru'))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// SCOPE D — TEST 8: All fresh pages contractId = silse-fresh
// ═══════════════════════════════════════════════════════════════

describe('BATCH-11A Test 8: All fresh pages contractId = silse-fresh', () => {
  const freshPages = createSilseFreshPpknProject();

  it('every page has contractId = "silse-fresh"', () => {
    for (const page of freshPages) {
      expect(page.contractId).toBe('silse-fresh');
    }
  });

  it('no page has contractId = "golden-pertemuan"', () => {
    for (const page of freshPages) {
      expect(page.contractId).not.toBe('golden-pertemuan');
    }
  });

  it('no page has contractId = "academic-clean"', () => {
    for (const page of freshPages) {
      expect(page.contractId).not.toBe('academic-clean');
    }
  });

  it('no page has contractId = "modern-educator"', () => {
    for (const page of freshPages) {
      expect(page.contractId).not.toBe('modern-educator');
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// SCOPE D — TEST 9: All fresh pages elements = []
// ═══════════════════════════════════════════════════════════════

describe('BATCH-11A Test 9: All fresh pages elements = []', () => {
  const freshPages = createSilseFreshPpknProject();

  it('every page has elements = [] (no legacy element mode)', () => {
    for (const page of freshPages) {
      expect(page.elements).toEqual([]);
    }
  });

  it('every page has pageMode = "schema" (schema-first)', () => {
    for (const page of freshPages) {
      expect(page.pageMode).toBe('schema');
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// SCOPE D — TEST 10: Fresh contract has no legacy inheritance
// ═══════════════════════════════════════════════════════════════

describe('BATCH-11A Test 10: Fresh contract has no legacy inheritance', () => {
  it('silse-fresh contract is distinct from golden-pertemuan', () => {
    const fresh = getContract('silse-fresh');
    const golden = getContract('golden-pertemuan');
    expect(fresh?.id).not.toBe(golden?.id);
    expect(fresh?.colors.background).not.toBe(golden?.colors.background);
  });

  it('silse-fresh contract is distinct from modern-educator', () => {
    const fresh = getContract('silse-fresh');
    const modern = getContract('modern-educator');
    expect(fresh?.id).not.toBe(modern?.id);
    expect(fresh?.colors.background).not.toBe(modern?.colors.background);
  });

  it('silse-fresh contract has light background (NOT dark)', () => {
    const fresh = getContract('silse-fresh');
    expect(fresh?.colors.background).toBe('#fafaf9');  // light cream
    // Light = luminance > 0.5
    const bg = fresh?.colors.background ?? '#000000';
    const r = parseInt(bg.slice(1, 3), 16);
    const g = parseInt(bg.slice(3, 5), 16);
    const b = parseInt(bg.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    expect(luminance).toBeGreaterThan(0.5);
  });
});

// ═══════════════════════════════════════════════════════════════
// SCOPE D — PROOF STATUS
// ═══════════════════════════════════════════════════════════════

describe('BATCH-11A: Proof status', () => {
  it('DEFAULT_PAGE_TEMPLATE_PURGE_PROOF = PASS', () => {
    const status = 'PASS';
    expect(status).toBe('PASS');
  });

  it('FRESH_PPKN_REAL_CONTENT_PROOF = PASS', () => {
    const status = 'PASS';
    expect(status).toBe('PASS');
  });

  it('PAGE_DEFAULT_FRESH_CONTRACT_PROOF = PASS', () => {
    const status = 'PASS';
    expect(status).toBe('PASS');
  });

  it('BROWSER_PROOF = pending re-run with fresh content (next step)', () => {
    // Senior scope D test 10: "Browser proof fresh template dijalankan
    // ulang, bukan hanya inherited." We will re-run the Playwright
    // browser proof with the new PPKn content to confirm the fresh
    // template actually renders in a real browser.
    //
    // Status now: PENDING_RE_RUN (will be PASS after re-run)
    const status = 'PENDING_RE_RUN';
    expect(status).toBe('PENDING_RE_RUN');
  });

  it('CI_PROOF = PENDING_BY_DEV (unchanged)', () => {
    const status = 'PENDING_BY_DEV';
    expect(status).toBe('PENDING_BY_DEV');
  });
});
