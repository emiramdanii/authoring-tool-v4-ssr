// ═══════════════════════════════════════════════════════════════
// BATCH-10C-Patch-1 — CONTRACT-CIRCULAR-IMPORT-FIX-01
// ═══════════════════════════════════════════════════════════════
// Proves no circular import between TemplateThemeContract.ts and
// ModernEducatorContract.ts, and default fallback works correctly.
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const readSrc = (rel: string) =>
  readFileSync(resolve(__dirname, '..', rel), 'utf-8');

// ───────────────────────────────────────────────────────────────
// A. No circular import — source audit
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10C-Patch-1: No circular import', () => {
  it('TemplateThemeContract.ts does NOT import from ModernEducatorContract.ts', () => {
    const src = readSrc('core/template/contract/TemplateThemeContract.ts');
    // Strip comments before checking
    const stripped = src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(stripped, 'TemplateThemeContract must not import ModernEducatorContract').not.toContain("from './ModernEducatorContract'");
  });

  it('ModernEducatorContract.ts imports from TemplateThemeContract.ts (one direction only)', () => {
    const src = readSrc('core/template/contract/ModernEducatorContract.ts');
    expect(src).toContain("from './TemplateThemeContract'");
  });

  it('TemplateThemeContract.ts uses lazy registry lookup (not direct import)', () => {
    const src = readSrc('core/template/contract/TemplateThemeContract.ts');
    expect(src).toContain("CONTRACT_REGISTRY.get('modern-educator')");
  });
});

// ───────────────────────────────────────────────────────────────
// B. Runtime import — no crash
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10C-Patch-1: Runtime import — no crash', () => {
  it('can import TemplateThemeContract without error', async () => {
    // Import via barrel (index.ts) which loads both TTC + MEC
    const mod = await import('@/core/template/contract');
    expect(mod).toBeDefined();
    expect(mod.getContractOrGolden).toBeDefined();
    expect(mod.getContract).toBeDefined();
    expect(mod.GOLDEN_PERTEMUAN_CONTRACT).toBeDefined();
  });

  it('can import ModernEducatorContract without error', async () => {
    const mod = await import('@/core/template/contract');
    expect(mod).toBeDefined();
    expect(mod.MODERN_EDUCATOR_CONTRACT).toBeDefined();
  });
});

// ───────────────────────────────────────────────────────────────
// C. Contract registry — correct lookups
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10C-Patch-1: Contract registry lookups', () => {
  it('getContractOrGolden(undefined) returns modern-educator (light default)', async () => {
    const { getContractOrGolden } = await import('@/core/template/contract');
    const contract = getContractOrGolden(undefined);
    expect(contract.id).toBe('modern-educator');
  });

  it('getContractOrGolden("") returns modern-educator', async () => {
    const { getContractOrGolden } = await import('@/core/template/contract');
    const contract = getContractOrGolden('');
    expect(contract.id).toBe('modern-educator');
  });

  it('getContract("golden-pertemuan") still exists (legacy)', async () => {
    const { getContract } = await import('@/core/template/contract');
    const contract = getContract('golden-pertemuan');
    expect(contract).toBeDefined();
    expect(contract?.id).toBe('golden-pertemuan');
  });

  it('getContract("modern-educator") exists', async () => {
    const { getContract } = await import('@/core/template/contract');
    const contract = getContract('modern-educator');
    expect(contract).toBeDefined();
    expect(contract?.id).toBe('modern-educator');
  });

  it('getContractOrGolden("golden-pertemuan") returns golden (explicit lookup)', async () => {
    const { getContractOrGolden } = await import('@/core/template/contract');
    const contract = getContractOrGolden('golden-pertemuan');
    expect(contract.id).toBe('golden-pertemuan');
  });

  it('getContractOrGolden("modern-educator") returns modern-educator', async () => {
    const { getContractOrGolden } = await import('@/core/template/contract');
    const contract = getContractOrGolden('modern-educator');
    expect(contract.id).toBe('modern-educator');
  });

  it('modern-educator is a LIGHT theme (background is light)', async () => {
    const { getContract } = await import('@/core/template/contract');
    const contract = getContract('modern-educator');
    expect(contract?.colors.background).toBe('#f7f9fb');
    expect(contract?.colors.text).toBe('#191c1e');
  });

  it('golden-pertemuan is still DARK (legacy preserved)', async () => {
    const { getContract } = await import('@/core/template/contract');
    const contract = getContract('golden-pertemuan');
    expect(contract?.colors.background).toBe('#0f172a');
    expect(contract?.colors.text).toBe('#ffffff');
  });
});
