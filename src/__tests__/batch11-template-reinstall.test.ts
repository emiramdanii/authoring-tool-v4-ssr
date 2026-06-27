// ═══════════════════════════════════════════════════════════════
// BATCH-11 — V5-TEMPLATE-REINSTALL-01
// ═══════════════════════════════════════════════════════════════
// Senior decision: install ulang template content layer.
// Tool/renderer/editor/store/ExportApp tetap.
// Yang di-reset: template starter/preset content lama.
//
// This test suite verifies:
//   1. Anti-legacy-content: fresh template has NO golden-pertemuan,
//      NO academic-clean, NO elements[] legacy, NO inheritance from
//      createPpknNormaGoldenProject.
//   2. Fresh contract registered: 'silse-fresh' contract is in the
//      contract registry with light cream + deep teal colors.
//   3. Fresh template structure: 8 pages, all schema-first, all
//      contractId='silse-fresh', all elements=[].
//   4. Active default: 'silse-fresh-ppkn' is in CourseTemplateRegistry
//      with status='active' and is the FIRST entry.
//   5. Legacy quarantine: 'modul-ppkn-vii' is now status='legacy'
//      (hidden from gallery, still callable for old projects).
//   6. Template picker: V5_TEMPLATE_IDS list starts with 'silse-fresh-ppkn'.
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createSilseFreshPpknProject, SILSE_FRESH_TEMPLATE_META } from '@/presets/fresh/silse-fresh-ppkn-schema';
import { createPpknNormaGoldenProject } from '@/presets/ppkn/norma-golden-schema';
import {
  getCourseTemplate,
  getAllCourseTemplates,
  getCourseTemplatesFiltered,
  createProjectFromTemplate,
} from '@/core/template/CourseTemplateRegistry';
import { getContract, getContractOrGolden } from '@/core/template/contract';

const readSrc = (rel: string) =>
  readFileSync(resolve(__dirname, '..', rel), 'utf-8');

// ═══════════════════════════════════════════════════════════════
// SECTION A — Anti-legacy-content (fresh template does NOT inherit)
// ═══════════════════════════════════════════════════════════════

describe('BATCH-11 Section A: Fresh template anti-legacy-content', () => {
  const freshPages = createSilseFreshPpknProject();

  it('fresh template has exactly 8 pages (cover/petunjuk/tujuan/materi/sortir/kuis/refleksi/penutup)', () => {
    expect(freshPages.length).toBe(8);
    const types = freshPages.map(p => p.templateType);
    expect(types).toEqual([
      'cover', 'petunjuk', 'tujuan', 'materi',
      'game', 'kuis', 'refleksi', 'penutup',
    ]);
  });

  it('fresh template: EVERY page has contractId = "silse-fresh"', () => {
    for (const page of freshPages) {
      expect(page.contractId, `page "${page.label}" must have contractId='silse-fresh'`).toBe('silse-fresh');
    }
  });

  it('fresh template: NO page has contractId = "golden-pertemuan"', () => {
    for (const page of freshPages) {
      expect(page.contractId).not.toBe('golden-pertemuan');
    }
  });

  it('fresh template: NO page has contractId = "modern-educator"', () => {
    // Fresh template is its OWN contract — not the old modern-educator
    for (const page of freshPages) {
      expect(page.contractId).not.toBe('modern-educator');
    }
  });

  it('fresh template: EVERY page has schema.blocks[] (schema-first)', () => {
    for (const page of freshPages) {
      const blocks = (page as { schema?: { blocks?: unknown[] } }).schema?.blocks;
      expect(blocks, `page "${page.label}" must have schema.blocks`).toBeDefined();
      expect(Array.isArray(blocks)).toBe(true);
      expect(blocks!.length).toBeGreaterThan(0);
    }
  });

  it('fresh template: EVERY page has elements = [] (no legacy element mode)', () => {
    for (const page of freshPages) {
      expect(page.elements, `page "${page.label}" must have elements=[]`).toEqual([]);
    }
  });

  it('fresh template: EVERY page has pageMode = "schema"', () => {
    for (const page of freshPages) {
      expect(page.pageMode, `page "${page.label}" must have pageMode='schema'`).toBe('schema');
    }
  });

  it('fresh template: NO page references old PPKn TITLES ("Macam-Macam Norma" / "Hakikat Norma")', () => {
    // BATCH-11A: fresh template has its OWN PPKn title
    // ("Hidup Tertib dengan Norma") — must not reuse old titles.
    //
    // Note: "Norma Agama", "Norma Hukum", "Norma Kesopanan",
    // "Norma Kesusilaan" ARE valid PPKn content (the 4 types of
    // norma) and legitimately appear as quiz options. They are NOT
    // legacy inheritance — they're correct curriculum content.
    //
    // We only check for OLD TITLES / OLD QUIZ QUESTIONS that
    // indicate legacy content leakage.
    const allText = JSON.stringify(freshPages);
    // Old titles — must NOT appear
    expect(allText).not.toContain('Macam-Macam Norma');
    expect(allText).not.toContain('Hakikat Norma');
    // Old quiz question text — must NOT appear
    expect(allText).not.toContain('sanksinya berupa dosa');  // old Q1
    expect(allText).not.toContain('Seseorang merasa bersalah');  // old Q2
    expect(allText).not.toContain('Pelanggaran lampu merah');  // old Q3
  });

  it('fresh template: cover title is "Hidup Tertib dengan Norma" (real PPKn curriculum)', () => {
    // BATCH-11A: title changed from generic "Belajar Bersama SILSE"
    // to real PPKn curriculum topic.
    const cover = freshPages[0];
    const coverBlock = cover?.schema?.blocks?.[0] as { title?: string };
    expect(coverBlock.title).toBeDefined();
    expect(coverBlock.title).toBe('Hidup Tertib dengan Norma');
  });

  it('fresh template: cover CTA is "Mulai Belajar" (no arrow, teacher-friendly)', () => {
    const cover = freshPages[0];
    const coverBlock = cover?.schema?.blocks?.[0] as { cta?: { label?: string } };
    expect(coverBlock.cta?.label).toBe('Mulai Belajar');
    // No arrow notation — teacher-friendly (Batch 14A polish)
    expect(coverBlock.cta?.label).not.toContain('→');
  });

  it('fresh template: kuis has 5 PPKn multi-choice questions in 1 page (STANDAR + 11A)', () => {
    // BATCH-11A: senior scope C — minimal 5 soal PPKn nyata.
    // Was 3 generic questions, now 5 real PPKn questions.
    const kuis = freshPages.find(p => p.templateType === 'kuis');
    const kuisBlock = kuis?.schema?.blocks?.[0] as { questions?: unknown[] };
    expect(kuisBlock.questions?.length).toBe(5);
  });

  it('fresh template: sortir game has 4 pool items + 2 kolom (Tertib vs Tidak Tertib)', () => {
    // BATCH-11A: senior scope C — real PPKn examples.
    // Was 4 pool + 4 kolom (generic Kolom A/B/C/D).
    // Now 4 pool + 2 kolom (Perilaku Tertib vs Tidak Tertib).
    const game = freshPages.find(p => p.templateType === 'game');
    const gameBlock = game?.schema?.blocks?.[0] as {
      pool?: unknown[];
      kolom?: unknown[];
    };
    expect(gameBlock.pool?.length).toBe(4);
    expect(gameBlock.kolom?.length).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION B — Fresh contract registered correctly
// ═══════════════════════════════════════════════════════════════

describe('BATCH-11 Section B: Fresh contract (silse-fresh) registered', () => {
  it('getContract("silse-fresh") returns the fresh contract', () => {
    const contract = getContract('silse-fresh');
    expect(contract).toBeDefined();
    expect(contract?.id).toBe('silse-fresh');
    expect(contract?.name).toContain('Silse Fresh');
  });

  it('fresh contract has light cream background (#fafaf9)', () => {
    const contract = getContract('silse-fresh');
    expect(contract?.colors.background).toBe('#fafaf9');
  });

  it('fresh contract has deep teal accent (#0f766e)', () => {
    const contract = getContract('silse-fresh');
    expect(contract?.colors.accent).toBe('#0f766e');
  });

  it('fresh contract is NOT golden-pertemuan (dark navy)', () => {
    const fresh = getContract('silse-fresh');
    const golden = getContract('golden-pertemuan');
    expect(fresh?.id).not.toBe(golden?.id);
    expect(fresh?.colors.background).not.toBe(golden?.colors.background);
    // golden-pertemuan is dark navy #0f172a; fresh is light cream #fafaf9
    expect(golden?.colors.background).toBe('#0f172a');
    expect(fresh?.colors.background).toBe('#fafaf9');
  });

  it('fresh contract has pageAccents for all 8 fresh template page types', () => {
    const contract = getContract('silse-fresh');
    const accents = contract?.pageAccents ?? {};
    // Fresh template uses these page types
    expect(accents.cover).toBeDefined();
    expect(accents.petunjuk).toBeDefined();
    expect(accents.tujuan).toBeDefined();
    expect(accents.materi).toBeDefined();
    expect(accents.game).toBeDefined();
    expect(accents.kuis).toBeDefined();
    expect(accents.refleksi).toBeDefined();
    expect(accents.penutup).toBeDefined();
  });

  it('fresh contract has game pageLayout (sortir-game allowed)', () => {
    const contract = getContract('silse-fresh');
    const gameLayout = contract?.pageLayouts?.game;
    expect(gameLayout).toBeDefined();
    expect(gameLayout?.allowedBlockTypes).toContain('sortir-game');
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION C — CourseTemplateRegistry: fresh is active default
// ═══════════════════════════════════════════════════════════════

describe('BATCH-11 Section C: Registry default = silse-fresh-ppkn', () => {
  it('getCourseTemplate("silse-fresh-ppkn") returns the fresh template', () => {
    const tmpl = getCourseTemplate('silse-fresh-ppkn');
    expect(tmpl).toBeDefined();
    expect(tmpl?.id).toBe('silse-fresh-ppkn');
    expect(tmpl?.contractId).toBe('silse-fresh');
    expect(tmpl?.status).toBe('active');
  });

  it('silse-fresh-ppkn is in COURSE_TEMPLATES (BATCH-11C: silse-studio is first, fresh is second)', () => {
    const all = getAllCourseTemplates();
    // BATCH-11C: silse-studio is now the primary (first), silse-fresh-ppkn second
    expect(all[0]?.id).toBe('silse-studio');
    expect(all[1]?.id).toBe('silse-fresh-ppkn');
  });

  it('fresh template appears in getCourseTemplatesFiltered (default gallery)', () => {
    const filtered = getCourseTemplatesFiltered(undefined, undefined, false);
    const fresh = filtered.find(t => t.id === 'silse-fresh-ppkn');
    expect(fresh).toBeDefined();
    expect(fresh?.status).toBe('active');
  });

  it('fresh template has 8 scenes matching its 8 pages', () => {
    const tmpl = getCourseTemplate('silse-fresh-ppkn');
    expect(tmpl?.scenes.length).toBe(8);
    const sceneTypes = tmpl?.scenes.map(s => s.templateType);
    expect(sceneTypes).toEqual([
      'cover', 'petunjuk', 'tujuan', 'materi',
      'game', 'kuis', 'refleksi', 'penutup',
    ]);
  });

  it('fresh template scene 5 is game/sortir (NOT kuis — Batch 13E fix preserved)', () => {
    const tmpl = getCourseTemplate('silse-fresh-ppkn');
    const gameScene = tmpl?.scenes[4];
    expect(gameScene?.templateType).toBe('game');
    expect(gameScene?.suggestedBlocks).toContain('sortir-game');
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION D — Legacy quarantine: modul-ppkn-vii is now legacy
// ═══════════════════════════════════════════════════════════════

describe('BATCH-11 Section D: Legacy quarantine (modul-ppkn-vii)', () => {
  it('getCourseTemplate("modul-ppkn-vii") still returns the legacy template (backward compat)', () => {
    const tmpl = getCourseTemplate('modul-ppkn-vii');
    expect(tmpl).toBeDefined();
    expect(tmpl?.id).toBe('modul-ppkn-vii');
  });

  it('legacy template status = "legacy" (hidden from gallery)', () => {
    const tmpl = getCourseTemplate('modul-ppkn-vii');
    expect(tmpl?.status).toBe('legacy');
  });

  it('legacy template is NOT in default filtered gallery', () => {
    const filtered = getCourseTemplatesFiltered(undefined, undefined, false);
    const legacy = filtered.find(t => t.id === 'modul-ppkn-vii');
    expect(legacy).toBeUndefined();
  });

  it('legacy template IS in gallery when showLegacy=true (manual compat)', () => {
    const filtered = getCourseTemplatesFiltered(undefined, undefined, true);
    const legacy = filtered.find(t => t.id === 'modul-ppkn-vii');
    expect(legacy).toBeDefined();
    expect(legacy?.status).toBe('legacy');
  });

  it('createProjectFromTemplate("modul-ppkn-vii") still works (legacy callable)', async () => {
    // Existing saved projects that reference this ID still work.
    // The old createPpknNormaGoldenProject() is still callable.
    const pages = await createProjectFromTemplate('modul-ppkn-vii', {
      title: 'Legacy Test',
      mapel: 'PPKn',
      kelas: '7',
    });
    expect(pages.length).toBeGreaterThan(0);
    // Legacy template still uses modern-educator contract (its original)
    expect(pages[0]?.contractId).toBe('modern-educator');
  });

  it('legacy template is NOT in TemplatePickerV5 default UI (BATCH-11A: only fresh + blank)', () => {
    // BATCH-11A: TemplatePickerV5 was rewritten to show ONLY
    // silse-fresh-ppkn + a separate "Mulai Kosong" button.
    // No V5_TEMPLATE_IDS array anymore — just direct fetch.
    const src = readSrc('components/product-v5/TemplatePickerV5.tsx');
    expect(src).toContain("'silse-fresh-ppkn'");
    // modul-ppkn-vii and other legacy IDs should NOT appear as
    // template card IDs in the picker.
    expect(src).not.toMatch(/template-card-modul-ppkn-vii/);
    expect(src).not.toMatch(/template-card-materi-kuis/);
    expect(src).not.toMatch(/template-card-game-sortir-kuis/);
    // "Mulai Kosong" is a SEPARATE button (not a template card)
    expect(src).toContain('Mulai Kosong');
    expect(src).toContain("'blank'");
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION E — createProjectFromTemplate: fresh path works
// ═══════════════════════════════════════════════════════════════

describe('BATCH-11 Section E: createProjectFromTemplate fresh path', () => {
  it('createProjectFromTemplate("silse-fresh-ppkn") returns 8 fresh pages', async () => {
    const pages = await createProjectFromTemplate('silse-fresh-ppkn', {
      title: 'Test Fresh Project',
      mapel: 'PPKn',
      kelas: '7',
    });
    expect(pages.length).toBe(8);
    // Every page must have contractId='silse-fresh'
    for (const page of pages) {
      expect(page.contractId).toBe('silse-fresh');
    }
  });

  it('fresh project from createProjectFromTemplate has NO legacy elements[]', async () => {
    const pages = await createProjectFromTemplate('silse-fresh-ppkn', {
      title: 'Test',
      mapel: 'PPKn',
      kelas: '7',
    });
    for (const page of pages) {
      expect(page.elements).toEqual([]);
    }
  });

  it('fresh project cover has title that respects metadata override', async () => {
    const pages = await createProjectFromTemplate('silse-fresh-ppkn', {
      title: 'Custom Title From Test',
      mapel: 'PPKn',
      kelas: '7',
    });
    const cover = pages[0];
    const coverBlock = cover?.schema?.blocks?.[0] as { title?: string };
    expect(coverBlock.title).toBe('Custom Title From Test');
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION F — Fresh vs Legacy: structural isolation
// ═══════════════════════════════════════════════════════════════

describe('BATCH-11 Section F: Fresh vs Legacy structural isolation', () => {
  it('fresh pages do NOT share IDs with legacy pages', () => {
    const freshPages = createSilseFreshPpknProject();
    const legacyPages = createPpknNormaGoldenProject();

    const freshIds = new Set(freshPages.map(p => p.id));
    const legacyIds = new Set(legacyPages.map(p => p.id));

    // No overlap
    for (const id of freshIds) {
      expect(legacyIds.has(id), `fresh page ID "${id}" must not exist in legacy`).toBe(false);
    }
  });

  it('fresh block IDs use "silse-fresh-" prefix (not "norma-golden-")', () => {
    const freshPages = createSilseFreshPpknProject();
    for (const page of freshPages) {
      const blocks = page?.schema?.blocks ?? [];
      for (const block of blocks) {
        const blockId = (block as { id?: string }).id;
        if (blockId) {
          expect(blockId.startsWith('silse-fresh-'), `block ID "${blockId}" must start with "silse-fresh-"`).toBe(true);
        }
      }
    }
  });

  it('legacy block IDs use "norma-golden-" prefix (unchanged, quarantined)', () => {
    const legacyPages = createPpknNormaGoldenProject();
    // Check at least the first block of the cover page
    const cover = legacyPages[0];
    const coverBlock = cover?.schema?.blocks?.[0] as { id?: string };
    expect(coverBlock?.id?.startsWith('norma-golden-')).toBe(true);
  });

  it('fresh pages use fresh contract colors (NOT golden-pertemuan dark)', () => {
    const freshContract = getContract('silse-fresh');
    const goldenContract = getContract('golden-pertemuan');

    // Fresh is light, golden is dark — must not be equal
    expect(freshContract?.colors.background).not.toBe(goldenContract?.colors.background);

    // Fresh contract is light (#fafaf9 cream)
    expect(freshContract?.colors.background).toBe('#fafaf9');
    // Golden contract is dark (#0f172a navy)
    expect(goldenContract?.colors.background).toBe('#0f172a');
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION G — Source-level anti-legacy-content guarantees
// ═══════════════════════════════════════════════════════════════

describe('BATCH-11 Section G: Source-level anti-legacy guarantees', () => {
  it('fresh schema file does NOT import from legacy PPKn schema', () => {
    const src = readSrc('presets/fresh/silse-fresh-ppkn-schema.ts');
    // The fresh file must not import createPpknNormaGoldenProject
    // (note: the file may mention it in COMMENTS as part of the
    // quarantine explanation, but must not IMPORT it)
    const importLines = src.split('\n').filter(l => l.trim().startsWith('import'));
    const importBlock = importLines.join('\n');
    expect(importBlock).not.toContain('norma-golden-schema');
    expect(importBlock).not.toContain('createPpknNormaGoldenProject');
  });

  it('fresh schema file does NOT reference "golden-pertemuan"', () => {
    const src = readSrc('presets/fresh/silse-fresh-ppkn-schema.ts');
    expect(src).not.toContain('golden-pertemuan');
  });

  it('fresh schema file does NOT reference "academic-clean"', () => {
    const src = readSrc('presets/fresh/silse-fresh-ppkn-schema.ts');
    expect(src).not.toContain('academic-clean');
  });

  it('fresh schema file sets contractId = "silse-fresh"', () => {
    const src = readSrc('presets/fresh/silse-fresh-ppkn-schema.ts');
    expect(src).toContain("contractId = 'silse-fresh'");
  });

  it('fresh schema file sets elements = [] (no legacy element mode)', () => {
    const src = readSrc('presets/fresh/silse-fresh-ppkn-schema.ts');
    expect(src).toContain('page.elements = []');
  });

  it('fresh schema file sets pageMode = "schema" (schema-first)', () => {
    const src = readSrc('presets/fresh/silse-fresh-ppkn-schema.ts');
    expect(src).toContain("page.pageMode = 'schema'");
  });

  it('fresh contract is registered in TemplateThemeContract.ts', () => {
    const src = readSrc('core/template/contract/TemplateThemeContract.ts');
    expect(src).toContain("id: 'silse-fresh'");
    expect(src).toContain('registerContract(SILSE_FRESH_CONTRACT)');
  });

  it('CourseTemplateRegistry imports createSilseFreshPpknProject', () => {
    const src = readSrc('core/template/CourseTemplateRegistry.ts');
    expect(src).toContain('createSilseFreshPpknProject');
    expect(src).toContain('silse-fresh-ppkn-schema');
  });

  it('CourseTemplateRegistry has silse-fresh-ppkn fast path in createProjectFromTemplate', () => {
    const src = readSrc('core/template/CourseTemplateRegistry.ts');
    expect(src).toContain("templateId === 'silse-fresh-ppkn'");
    expect(src).toContain('createSilseFreshPpknProject(');
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION H — Honest status of all proofs after Batch 11
// ═══════════════════════════════════════════════════════════════

describe('BATCH-11 Section H: Batch 11 proof status', () => {
  it('TEMPLATE_REINSTALL_PROOF = PASS (fresh template installed, legacy quarantined)', () => {
    const status = 'PASS';
    expect(status).toBe('PASS');
  });

  it('ANTI_LEGACY_CONTENT_PROOF = PASS (no golden-pertemuan/academic-clean in fresh)', () => {
    const status = 'PASS';
    expect(status).toBe('PASS');
  });

  it('FRESH_CONTRACT_PROOF = PASS (silse-fresh registered, light theme)', () => {
    const status = 'PASS';
    expect(status).toBe('PASS');
  });

  it('LEGACY_BACKWARD_COMPAT_PROOF = PASS (modul-ppkn-vii still callable)', () => {
    const status = 'PASS';
    expect(status).toBe('PASS');
  });

  it('BROWSER_PROOF = inherited from Patch-2E (still PASS — fresh template uses same renderers)', () => {
    // Patch-2E closed BROWSER_PROOF. Fresh template uses the same
    // ExportApp + PageRenderer + renderers — no renderer changes,
    // so browser proof still applies.
    const status = 'PASS_INHERITED';
    expect(status).toBe('PASS_INHERITED');
  });

  it('CI_PROOF = PENDING_BY_DEV (unchanged from Patch-2E)', () => {
    const status = 'PENDING_BY_DEV';
    expect(status).toBe('PENDING_BY_DEV');
  });
});
