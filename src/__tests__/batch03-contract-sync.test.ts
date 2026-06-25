import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('BATCH-03: Contract sync', () => {
  it('contract block type names use hyphens (not camelCase)', () => {
    const contract = readFileSync(resolve(__dirname, '../../SILSE_IMPORT_JSON_CONTRACT.md'), 'utf-8');
    // Must use hyphenated names
    expect(contract).toContain('fill-blank-game');
    expect(contract).toContain('word-search-game');
    expect(contract).toContain('true-false-game');
    expect(contract).toContain('drag-drop-game');
    expect(contract).toContain('team-buzzer-game');
    // Must NOT use non-hyphenated names
    expect(contract).not.toContain('`fillblank-game`');
    expect(contract).not.toContain('`wordsearch-game`');
    expect(contract).not.toContain('`truefalse-game`');
    expect(contract).not.toContain('`dragdrop-game`');
    expect(contract).not.toContain('`teambuzzer-game`');
  });

  it('contract uses nk-card (not norma-kartu)', () => {
    const contract = readFileSync(resolve(__dirname, '../../SILSE_IMPORT_JSON_CONTRACT.md'), 'utf-8');
    expect(contract).toContain('`nk-card`');
    expect(contract).not.toContain('`norma-kartu`');
  });

  it('contract uses tp (not tp-display)', () => {
    const contract = readFileSync(resolve(__dirname, '../../SILSE_IMPORT_JSON_CONTRACT.md'), 'utf-8');
    expect(contract).toContain('`tp`');
    expect(contract).not.toContain('`tp-display`');
  });

  it('all 3 contracts have Runtime Status section', () => {
    const files = [
      'SILSE_IMPORT_JSON_CONTRACT.md',
      'SILSE_STYLE_CONTRACT.md',
      'SILSE_INTERACTION_REGISTRY.md',
    ];
    for (const f of files) {
      const content = readFileSync(resolve(__dirname, `../../${f}`), 'utf-8');
      expect(content).toContain('Runtime Status (BATCH-03)');
      expect(content).toContain('Validator not yet implemented');
      expect(content).toContain('Global layout/interaction');
      expect(content).toContain('registerInteraction');
    }
  });

  it('all 3 contracts have updated HEAD', () => {
    const files = [
      'SILSE_IMPORT_JSON_CONTRACT.md',
      'SILSE_STYLE_CONTRACT.md',
      'SILSE_INTERACTION_REGISTRY.md',
    ];
    for (const f of files) {
      const content = readFileSync(resolve(__dirname, `../../${f}`), 'utf-8');
      expect(content).toMatch(/HEAD.*25f8602/);
    }
  });
});
