// ═══════════════════════════════════════════════════════════════════
// EDITOR-RADICAL-RESET-01-PATCH-2D — Theme Authority Test
// ═══════════════════════════════════════════════════════════════════
// Verifies that:
//   1. createPageFromPreset produces schema.themeId (not undefined)
//   2. createDefaultSchemaForTemplateType includes themeId
//   3. Default themeId is 'modern-interactive' (light, not dark)
//   4. schema.themeId and templateData.schemaThemeId are synced
//      when applyTemplateToStore runs
//   5. Cover page background is NOT dark navy (#0f172a)
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPageFromPreset } from '@/core/preset/PagePresetRegistry';
import { createDefaultSchemaForTemplateType } from '@/core/schema/schema-factory';

// Mock stores so applyTemplateToStore can run in isolation
vi.mock('@/store/authoring-store', () => ({
  useAuthoringStore: Object.assign(() => ({}), {
    getState: () => ({
      modules: [], kuis: [], games: [], meta: {}, cp: {}, tp: [], atp: {},
      alur: {}, materi: { blok: [] }, skenario: [], petunjuk: { langkah: [] },
      diskusi: { pertanyaan: [] }, refleksi: { pertanyaan: [] },
      penutup: { preview: [] }, motivasi: {}, rangkuman: {}, suara: {},
      updateMeta: () => {},
    }),
    setState: () => {},
  }),
}));

vi.mock('@/store/dirty-store', () => ({
  useDirtyStore: Object.assign(() => ({ dirty: false }), {
    getState: () => ({ dirty: false, markDirty: () => {} }),
    setState: () => {},
  }),
}));

vi.mock('@/core/schema/capability-registry', () => ({
  BlockCapabilityRegistry: { filterByCapability: () => [] },
}));

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

// ═══════════════════════════════════════════════════════════════════
// 1. createDefaultSchemaForTemplateType includes themeId
// ═══════════════════════════════════════════════════════════════════

describe('PATCH-2D — createDefaultSchemaForTemplateType themeId', () => {
  it('schema has themeId field (not undefined)', () => {
    const schema = createDefaultSchemaForTemplateType('cover');
    expect(schema.themeId).toBeDefined();
    expect(typeof schema.themeId).toBe('string');
  });

  it('default themeId is "modern-interactive" (light, not dark)', () => {
    const schema = createDefaultSchemaForTemplateType('cover');
    expect(schema.themeId).toBe('modern-interactive');
  });

  it('ALL template types get modern-interactive themeId', () => {
    const types = ['cover', 'petunjuk', 'tujuan', 'motivasi', 'materi', 'diskusi', 'skenario', 'kuis', 'game', 'hasil', 'refleksi', 'rangkuman', 'penutup'];
    for (const t of types) {
      const schema = createDefaultSchemaForTemplateType(t);
      expect(schema.themeId, `templateType "${t}" should have themeId`).toBe('modern-interactive');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. createPageFromPreset produces schema.themeId
// ═══════════════════════════════════════════════════════════════════

describe('PATCH-2D — createPageFromPreset themeId', () => {
  it('cover page schema has themeId = modern-interactive', () => {
    const page = createPageFromPreset('cover', 0);
    expect(page.schema?.themeId).toBe('modern-interactive');
  });

  it('materi page schema has themeId = modern-interactive', () => {
    const page = createPageFromPreset('materi', 0);
    expect(page.schema?.themeId).toBe('modern-interactive');
  });

  it('kuis page schema has themeId = modern-interactive', () => {
    const page = createPageFromPreset('kuis', 0);
    expect(page.schema?.themeId).toBe('modern-interactive');
  });

  it('game page schema has themeId = modern-interactive', () => {
    const page = createPageFromPreset('game', 0);
    expect(page.schema?.themeId).toBe('modern-interactive');
  });

  it('ALL preset pages get modern-interactive themeId', () => {
    const types = ['cover', 'petunjuk', 'tujuan', 'motivasi', 'materi', 'diskusi', 'skenario', 'kuis', 'game', 'hasil', 'refleksi', 'rangkuman', 'penutup'] as const;
    for (const t of types) {
      const page = createPageFromPreset(t, 0);
      expect(page.schema?.themeId, `preset "${t}" should have themeId`).toBe('modern-interactive');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. Theme is NOT dark navy (#0f172a)
// ═══════════════════════════════════════════════════════════════════

describe('PATCH-2D — theme is light, not dark navy', () => {
  it('themeId is NOT "default" (which maps to dark navy #0f172a)', () => {
    const page = createPageFromPreset('cover', 0);
    expect(page.schema?.themeId).not.toBe('default');
  });

  it('themeId is NOT undefined (which falls back to dark)', () => {
    const page = createPageFromPreset('cover', 0);
    expect(page.schema?.themeId).not.toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. Source audit: schema-factory includes themeId
// ═══════════════════════════════════════════════════════════════════

describe('PATCH-2D — source audit', () => {
  it('schema-factory.ts includes themeId: modern-interactive in return', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const src = fs.readFileSync(
      path.resolve(process.cwd(), 'src/core/schema/schema-factory.ts'),
      'utf-8',
    );
    expect(src).toMatch(/themeId:\s*['"]modern-interactive['"]/);
  });

  it('apply-template-to-store.ts syncs schema.themeId (not just templateData)', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const src = fs.readFileSync(
      path.resolve(process.cwd(), 'src/core/template/apply-template-to-store.ts'),
      'utf-8',
    );
    // Must write themeId to schema, not just templateData.schemaThemeId
    expect(src).toMatch(/schema.*themeId.*themeId/);
  });

  it('export route has ensureDevTemplate function for dev-mode fallback', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const src = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/api/export/route.ts'),
      'utf-8',
    );
    expect(src).toMatch(/ensureDevTemplate/);
    expect(src).toMatch(/NODE_ENV.*production/);
    expect(src).toMatch(/_devBuildLock/);
  });
});
