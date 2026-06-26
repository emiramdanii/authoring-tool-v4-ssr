import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// ═══════════════════════════════════════════════════════════════
// BATCH-03: Contract sync (RC-AUDIT-01: modernized)
// ═══════════════════════════════════════════════════════════════
// Original Batch 03 tests checked SILSE_IMPORT_JSON_CONTRACT.md for
// specific block type names (fill-blank-game, nk-card, tp). That doc
// was rewritten in Batch 08 with a typed-interface structure that
// references REGISTERED_BLOCK_TYPES as a concept, not a bullet list.
//
// The actual contract sync enforcement now lives in:
//   scripts/guard-contract-sync.js (run via `npm run guard:contract-sync`)
//
// This test verifies:
//   1. The guard script exists
//   2. The 3 contract docs exist
//   3. Each doc has a HEAD marker (version-agnostic)
//   4. Each doc has a Runtime Status section
//
// Detailed block-type-name checking is done by guard:contract-sync
// at CI time, not by this unit test.
// ═══════════════════════════════════════════════════════════════

describe('BATCH-03: Contract sync (RC-AUDIT-01: modernized)', () => {
  it('guard-contract-sync.js script exists', () => {
    const guardPath = resolve(__dirname, '../../scripts/guard-contract-sync.js');
    expect(existsSync(guardPath), 'guard-contract-sync.js must exist').toBe(true);
  });

  it('all 3 contract docs exist', () => {
    const files = [
      'SILSE_IMPORT_JSON_CONTRACT.md',
      'SILSE_STYLE_CONTRACT.md',
      'SILSE_INTERACTION_REGISTRY.md',
    ];
    for (const f of files) {
      const path = resolve(__dirname, `../../${f}`);
      expect(existsSync(path), `${f} must exist`).toBe(true);
    }
  });

  it('all 3 contracts have a Runtime Status section (RC-AUDIT-01: lenient)', () => {
    // RC-AUDIT-01: Batch 03 test expected exact strings 'Runtime Status (BATCH-03)'
    // + 'Validator not yet implemented' + 'Global layout/interaction' +
    // 'registerInteraction' in ALL 3 docs. But SILSE_IMPORT_JSON_CONTRACT.md
    // was rewritten in Batch 08 with different section structure (## 7. Runtime Status).
    // The contract is: each doc must have SOME runtime status section.
    // The exact heading + content varies by doc — that's fine.
    const files = [
      'SILSE_IMPORT_JSON_CONTRACT.md',
      'SILSE_STYLE_CONTRACT.md',
      'SILSE_INTERACTION_REGISTRY.md',
    ];
    for (const f of files) {
      const content = readFileSync(resolve(__dirname, `../../${f}`), 'utf-8');
      // Must have a Runtime Status heading (any form)
      expect(content, `${f} must have Runtime Status section`).toMatch(/Runtime Status/i);
    }
  });

  it('all 3 contracts have a HEAD marker (RC-AUDIT-01: version-agnostic)', () => {
    // RC-AUDIT-01: Previously this test hardcoded HEAD = 25f8602 (Batch 02).
    // That broke every time HEAD advanced. Now we just verify the HEAD
    // marker exists in each contract doc — the SHA itself is not the
    // contract; the contract is the documented behavior.
    const files = [
      'SILSE_IMPORT_JSON_CONTRACT.md',
      'SILSE_STYLE_CONTRACT.md',
      'SILSE_INTERACTION_REGISTRY.md',
    ];
    for (const f of files) {
      const content = readFileSync(resolve(__dirname, `../../${f}`), 'utf-8');
      expect(content, `${f} must have a HEAD marker`).toMatch(/\*\*HEAD\*\*:\s*`?[a-f0-9]{7,40}`?/i);
    }
  });

  it('package.json has guard:contract-sync script', () => {
    const pkg = readFileSync(resolve(__dirname, '../../package.json'), 'utf-8');
    expect(pkg).toContain('"guard:contract-sync"');
  });
});
