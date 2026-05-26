// ═══════════════════════════════════════════════════════════════════
// TEMPLATE MUTATION ISOLATION TESTS
// ═══════════════════════════════════════════════════════════════════
// Verifies that editing a block on one page does NOT mutate the
// same block on another page. This was the root cause of the
// "edit di canvas menyebabkan layout halaman lain ikut kacau" bug.
//
// The fix: deep-clone generated schema blocks per page so each
// page owns its own independent data. Without deep-clone, pages
// sharing the same templateType (e.g. 2x materi) could share
// object references — mutations leak across pages.

import { describe, it, expect } from 'vitest';
import { createProjectFromTemplate } from '@/core/template/CourseTemplateRegistry';
import { instantiateTemplate, instantiateTemplateWithConfig } from '@/core/template/template-gallery';
import type { LessonTemplate, TemplateCustomization } from '@/core/template/template-gallery';

// ═══════════════════════════════════════════════════════════════════
// HELPER: Create a synthetic template with duplicate pageTypes
// ═══════════════════════════════════════════════════════════════════

function makeDoubleMateriTemplate(): LessonTemplate {
  return {
    id: 'test-double-materi',
    title: 'Test Double Materi',
    subtitle: '',
    description: '',
    mapel: 'PPKn',
    kelas: '7',
    semester: '1',
    icon: '📜',
    color: 'amber',
    tags: [],
    pattern: 'standar',
    pageTypes: ['cover', 'materi', 'materi', 'kuis', 'penutup'],
    estimatedPages: 5,
    pagePreview: [
      { type: 'cover', title: 'Cover', description: '' },
      { type: 'materi', title: 'Materi 1', description: '' },
      { type: 'materi', title: 'Materi 2', description: '' },
      { type: 'kuis', title: 'Kuis', description: '' },
      { type: 'penutup', title: 'Penutup', description: '' },
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════
// 1. COURSE TEMPLATE REGISTRY PIPELINE
// ═══════════════════════════════════════════════════════════════════

describe('Template Mutation Isolation — CourseTemplateRegistry', () => {
  it('blocks on different pages should not share references', () => {
    const pages = createProjectFromTemplate('modul-ppkn-vii', {
      title: 'Hakikat Norma',
      guru: 'Pak Budi',
      sekolah: 'SMP N 1 Jakarta',
    });

    // Find all pages with blocks
    const pagesWithBlocks = pages.filter(p => p.schema?.blocks?.length);
    expect(pagesWithBlocks.length).toBeGreaterThan(1);

    // Verify no two pages share the same blocks array reference
    for (let i = 0; i < pagesWithBlocks.length; i++) {
      for (let j = i + 1; j < pagesWithBlocks.length; j++) {
        expect(
          pagesWithBlocks[i]!.schema!.blocks,
          `Page ${i} and ${j} should not share blocks array`
        ).not.toBe(pagesWithBlocks[j]!.schema!.blocks);
      }
    }
  });

  it('mutating a block on one page should not affect another page', () => {
    const pages = createProjectFromTemplate('modul-ppkn-vii', {
      title: 'Hakikat Norma',
      guru: 'Pak Budi',
      sekolah: 'SMP N 1 Jakarta',
    });

    // Find pages with materi-section (composite blocks with children)
    const materiPages = pages.filter(p =>
      p.schema?.blocks?.some(b => b.type === 'materi-section')
    );
    expect(materiPages.length).toBeGreaterThan(0);

    if (materiPages.length >= 2) {
      const ms1 = materiPages[0]!.schema!.blocks.find(b => b.type === 'materi-section') as Record<string, unknown>;
      const ms2 = materiPages[1]!.schema!.blocks.find(b => b.type === 'materi-section') as Record<string, unknown>;

      const content1 = ms1.content as Array<Record<string, unknown>> | undefined;
      const content2 = ms2.content as Array<Record<string, unknown>> | undefined;

      if (content1?.length && content2?.length) {
        // Mutate child on page 1
        const origJudul = content1[0]!.judul as string;
        content1[0]!.judul = '__MUTATED__';

        // Page 2 should NOT be affected
        expect(content2[0]!.judul, 'Mutating page 1 should NOT affect page 2').not.toBe('__MUTATED__');
      }
    }
  });

  it('deep-nested children should not share references across pages', () => {
    const pages = createProjectFromTemplate('modul-ppkn-vii', {
      title: 'Hakikat Norma',
      guru: 'Pak Budi',
      sekolah: 'SMP N 1 Jakarta',
    });

    // Collect ALL block references from all pages, tracking source
    const refMap = new Map<unknown, string[]>();

    for (let pi = 0; pi < pages.length; pi++) {
      const page = pages[pi]!;
      if (!page.schema?.blocks) continue;
      for (let bi = 0; bi < page.schema.blocks.length; bi++) {
        const block = page.schema.blocks[bi]!;
        const path = `page[${pi}:"${page.label}"].blocks[${bi}:"${block.type}"]`;
        const existing = refMap.get(block) ?? [];
        existing.push(path);
        refMap.set(block, existing);

        // Check composite block children too (only if content is an array)
        const content = (block as Record<string, unknown>).content;
        if (Array.isArray(content)) {
          for (let ci = 0; ci < content.length; ci++) {
            const child = content[ci]!;
            const childPath = `${path}.content[${ci}:"${(child as Record<string, unknown>).type ?? '?'}"]`;
            const childExisting = refMap.get(child) ?? [];
            childExisting.push(childPath);
            refMap.set(child, childExisting);
          }
        }
      }
    }

    // Report shared references
    const sharedRefs = [...refMap.entries()].filter(([, paths]) => paths.length > 1);
    if (sharedRefs.length > 0) {
      console.error('Shared references found:');
      for (const [ref, paths] of sharedRefs) {
        console.error(`  ${(ref as Record<string, unknown>).type ?? 'unknown'}: ${paths.join(' <-> ')}`);
      }
    }

    expect(sharedRefs.length, 'No block or child should appear in more than one page').toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. TEMPLATE GALLERY PIPELINE (instantiateTemplate)
// ═══════════════════════════════════════════════════════════════════

describe('Template Mutation Isolation — instantiateTemplate', () => {
  it('should produce independent blocks for duplicate pageTypes', () => {
    const template = makeDoubleMateriTemplate();
    const pages = instantiateTemplate(template);

    // Find the two materi pages
    const materiPages = pages.filter(p =>
      p.schema?.blocks?.some(b => b.type === 'materi-section')
    );

    if (materiPages.length >= 2) {
      const blocks1 = materiPages[0]!.schema!.blocks;
      const blocks2 = materiPages[1]!.schema!.blocks;

      // Should not share array reference
      expect(blocks1).not.toBe(blocks2);

      // Should not share individual block references
      if (blocks1.length > 0 && blocks2.length > 0) {
        expect(blocks1[0]).not.toBe(blocks2[0]);
      }
    }
  });

  it('mutating one materi page should not affect the other', () => {
    const template = makeDoubleMateriTemplate();
    const pages = instantiateTemplate(template);

    const materiPages = pages.filter(p =>
      p.schema?.blocks?.some(b => b.type === 'materi-section')
    );

    if (materiPages.length >= 2) {
      const ms1 = materiPages[0]!.schema!.blocks.find(b => b.type === 'materi-section') as Record<string, unknown>;
      const ms2 = materiPages[1]!.schema!.blocks.find(b => b.type === 'materi-section') as Record<string, unknown>;

      const content1 = ms1.content as Array<Record<string, unknown>> | undefined;
      const content2 = ms2.content as Array<Record<string, unknown>> | undefined;

      if (content1?.length && content2?.length) {
        content1[0]!.isi = '__MUTATED__';
        expect(content2[0]!.isi, 'Page 2 content should NOT be mutated').not.toBe('__MUTATED__');
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. TEMPLATE GALLERY PIPELINE (instantiateTemplateWithConfig)
// ═══════════════════════════════════════════════════════════════════

describe('Template Mutation Isolation — instantiateTemplateWithConfig', () => {
  it('should produce independent blocks with config customization', () => {
    const template = makeDoubleMateriTemplate();
    const config: TemplateCustomization = {
      enabledPages: [true, true, true, true, true],
      jumlahKuis: 5,
      variant: 'A',
    };
    const pages = instantiateTemplateWithConfig(template, config);

    const materiPages = pages.filter(p =>
      p.schema?.blocks?.some(b => b.type === 'materi-section')
    );

    if (materiPages.length >= 2) {
      const blocks1 = materiPages[0]!.schema!.blocks;
      const blocks2 = materiPages[1]!.schema!.blocks;

      expect(blocks1).not.toBe(blocks2);

      if (blocks1.length > 0 && blocks2.length > 0) {
        expect(blocks1[0]).not.toBe(blocks2[0]);
      }
    }
  });

  it('mutating one page with config should not affect another', () => {
    const template = makeDoubleMateriTemplate();
    const config: TemplateCustomization = {
      enabledPages: [true, true, true, true, true],
      jumlahKuis: 5,
      variant: 'A',
    };
    const pages = instantiateTemplateWithConfig(template, config);

    const materiPages = pages.filter(p =>
      p.schema?.blocks?.some(b => b.type === 'materi-section')
    );

    if (materiPages.length >= 2) {
      const ms1 = materiPages[0]!.schema!.blocks.find(b => b.type === 'materi-section') as Record<string, unknown>;
      const ms2 = materiPages[1]!.schema!.blocks.find(b => b.type === 'materi-section') as Record<string, unknown>;

      const content1 = ms1.content as Array<Record<string, unknown>> | undefined;
      const content2 = ms2.content as Array<Record<string, unknown>> | undefined;

      if (content1?.length && content2?.length) {
        content1[0]!.isi = '__MUTATED__';
        expect(content2[0]!.isi, 'Page 2 content should NOT be mutated').not.toBe('__MUTATED__');
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. SCHEMA FACTORY PIPELINE
// ═══════════════════════════════════════════════════════════════════

describe('Template Mutation Isolation — Schema Factory', () => {
  it('createDefaultSchemaForTemplateType should not share references across calls', async () => {
    const { createDefaultSchemaForTemplateType } = await import('@/core/schema/schema-factory');

    const schema1 = createDefaultSchemaForTemplateType('materi');
    const schema2 = createDefaultSchemaForTemplateType('materi');

    // Blocks arrays should be different
    expect(schema1.blocks).not.toBe(schema2.blocks);

    // Individual blocks should be different
    if (schema1.blocks.length > 0 && schema2.blocks.length > 0) {
      expect(schema1.blocks[0]).not.toBe(schema2.blocks[0]);
    }

    // Mutation test
    if (schema1.blocks.length > 0) {
      (schema1.blocks[0] as Record<string, unknown>).__test = '__MUTATED__';
      if (schema2.blocks.length > 0) {
        expect(
          (schema2.blocks[0] as Record<string, unknown>).__test,
          'Schema 2 block should NOT be mutated'
        ).toBeUndefined();
      }
    }
  });

  it('materi-section children should be independent across calls', async () => {
    const { createDefaultSchemaForTemplateType } = await import('@/core/schema/schema-factory');

    const schema1 = createDefaultSchemaForTemplateType('materi');
    const schema2 = createDefaultSchemaForTemplateType('materi');

    const ms1 = schema1.blocks.find(b => b.type === 'materi-section') as Record<string, unknown> | undefined;
    const ms2 = schema2.blocks.find(b => b.type === 'materi-section') as Record<string, unknown> | undefined;

    if (ms1 && ms2) {
      const content1 = ms1.content as Array<Record<string, unknown>> | undefined;
      const content2 = ms2.content as Array<Record<string, unknown>> | undefined;

      if (content1?.length && content2?.length) {
        expect(content1).not.toBe(content2);
        expect(content1[0]).not.toBe(content2[0]);

        // Mutation test
        content1[0]!.judul = '__MUTATED__';
        expect(content2[0]!.judul, 'Content 2 should NOT be mutated').not.toBe('__MUTATED__');
      }
    }
  });
});
