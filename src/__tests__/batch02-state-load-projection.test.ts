// ═══════════════════════════════════════════════════════════════
// BATCH-02: STATE-LOAD-PROJECTION — Tests
// ═══════════════════════════════════════════════════════════════
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('BATCH-02: Initial projection after loadFromStorage', () => {
  it('StoreInit runs deriveProjectionFromPages synchronously after loadFromStorage', () => {
    const source = readFileSync(
      resolve(__dirname, '../components/providers/StoreInit.tsx'),
      'utf-8',
    );
    // Must call deriveProjectionFromPages BEFORE initCanvaStoreSubscriptions
    // Find the CALL (not the import), which is the require() line
    const projectionCallIdx = source.indexOf("require('@/core/schema/schema-projection')");
    const subscriptionsCallIdx = source.indexOf('initCanvaStoreSubscriptions()');
    // The call to initCanvaStoreSubscriptions appears in the import at top of file
    // AND as a call later. Find the call (after the import line).
    const subscriptionsIdx = source.indexOf('initCanvaStoreSubscriptions();', subscriptionsCallIdx + 1);
    expect(projectionCallIdx).toBeGreaterThan(-1);
    expect(subscriptionsIdx).toBeGreaterThan(-1);
    expect(projectionCallIdx).toBeLessThan(subscriptionsIdx);
  });

  it('StoreInit merges projection meta with existing meta (not overwrite)', () => {
    const source = readFileSync(
      resolve(__dirname, '../components/providers/StoreInit.tsx'),
      'utf-8',
    );
    expect(source).toContain('...existingMeta');
    expect(source).toContain('...projection.meta');
  });

  it('StoreInit guards against empty pages (no crash if no project)', () => {
    const source = readFileSync(
      resolve(__dirname, '../components/providers/StoreInit.tsx'),
      'utf-8',
    );
    expect(source).toContain('pages.length > 0');
  });
});

describe('BATCH-02: loadFromStorage empty string handling', () => {
  it('uses hasOwnProperty pick (not ||) for metadata-only fields', () => {
    const source = readFileSync(
      resolve(__dirname, '../store/authoring/system-slice.ts'),
      'utf-8',
    );
    expect(source).toContain('hasOwnProperty');
    expect(source).toContain('pick(');
    // Must NOT use || for metadata-only fields
    expect(source).not.toMatch(/namaGuru: storedMeta\.namaGuru \|\|/);
    expect(source).not.toMatch(/semester: storedMeta\.semester \|\|/);
  });

  it('projection uses !== undefined (not truthy) for cover fields', () => {
    const source = readFileSync(
      resolve(__dirname, '../core/schema/schema-projection.ts'),
      'utf-8',
    );
    expect(source).toContain('cover.title !== undefined');
    expect(source).toContain('cover.subtitle !== undefined');
    expect(source).toContain('cover.meta?.kelas !== undefined');
    // Must NOT use truthy check
    expect(source).not.toMatch(/^\s*if \(cover\.title\)/m);
    expect(source).not.toMatch(/^\s*if \(cover\.subtitle\)/m);
  });
});

describe('BATCH-02: DB metadata parity', () => {
  it('buildSyncPayload includes semester, teacherName, schoolName', () => {
    const source = readFileSync(
      resolve(__dirname, '../lib/save-utils.ts'),
      'utf-8',
    );
    expect(source).toContain('semester:');
    expect(source).toContain('teacherName:');
    expect(source).toContain('schoolName:');
  });

  it('saveProjectSchema accepts semester as string (coerced to number)', () => {
    const source = readFileSync(
      resolve(__dirname, '../lib/api-validation.ts'),
      'utf-8',
    );
    // Must have union + transform for semester
    expect(source).toMatch(/semester.*z\.union/);
    expect(source).toContain('parseInt');
  });
});
