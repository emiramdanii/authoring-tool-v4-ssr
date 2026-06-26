// ═══════════════════════════════════════════════════════════════
// BATCH-10C-Patch-3 — STYLE-CONTRACT-CI-SYNC-01
// ═══════════════════════════════════════════════════════════════
// Proves:
// 1. Direct TTC import resolves modern-educator (no circular dep)
// 2. Barrel import resolves modern-educator
// 3. Modern educator default light
// 4. Golden explicit dark
// 5. Golden materi accent (per-page, not identity override)
// 6. Modern educator page accents (cover/petunjuk/penutup)
// 7. Unknown/empty contract fallback → modern-educator
// 8. MEC.ts is compatibility re-export (no registerContract call)
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const readSrc = (rel: string) =>
  readFileSync(resolve(__dirname, '..', rel), 'utf-8');

// ───────────────────────────────────────────────────────────────
// A. Direct TTC import resolves modern-educator
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10C-Patch-3: Direct TTC import resolves modern-educator', () => {
  it('getContract("modern-educator") is defined when importing from TTC directly', async () => {
    const { getContract } = await import('@/core/template/contract/TemplateThemeContract');
    const contract = getContract('modern-educator');
    expect(contract).toBeDefined();
    expect(contract?.id).toBe('modern-educator');
  });

  it('getContractOrGolden(undefined).id === "modern-educator" (direct TTC import)', async () => {
    const { getContractOrGolden } = await import('@/core/template/contract/TemplateThemeContract');
    expect(getContractOrGolden(undefined).id).toBe('modern-educator');
  });
});

// ───────────────────────────────────────────────────────────────
// B. Barrel import resolves modern-educator
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10C-Patch-3: Barrel import resolves modern-educator', () => {
  it('getContract("modern-educator") is defined via barrel', async () => {
    const { getContract } = await import('@/core/template/contract');
    const contract = getContract('modern-educator');
    expect(contract).toBeDefined();
    expect(contract?.id).toBe('modern-educator');
  });

  it('MODERN_EDUCATOR_CONTRACT is exported from barrel', async () => {
    const mod = await import('@/core/template/contract');
    expect(mod.MODERN_EDUCATOR_CONTRACT).toBeDefined();
    expect(mod.MODERN_EDUCATOR_CONTRACT.id).toBe('modern-educator');
  });
});

// ───────────────────────────────────────────────────────────────
// C. Modern educator default light
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10C-Patch-3: Modern educator default light', () => {
  it('background is #f7f9fb (light)', async () => {
    const { getContract } = await import('@/core/template/contract');
    expect(getContract('modern-educator')?.colors.background).toBe('#f7f9fb');
  });

  it('text is #191c1e (dark, contrasting)', async () => {
    const { getContract } = await import('@/core/template/contract');
    expect(getContract('modern-educator')?.colors.text).toBe('#191c1e');
  });

  it('accent is #006c49 (emerald)', async () => {
    const { getContract } = await import('@/core/template/contract');
    expect(getContract('modern-educator')?.colors.accent).toBe('#006c49');
  });
});

// ───────────────────────────────────────────────────────────────
// D. Golden explicit dark
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10C-Patch-3: Golden explicit dark', () => {
  it('background is #0f172a (dark navy)', async () => {
    const { getContract } = await import('@/core/template/contract');
    expect(getContract('golden-pertemuan')?.colors.background).toBe('#0f172a');
  });

  it('text is #ffffff (white on dark)', async () => {
    const { getContract } = await import('@/core/template/contract');
    expect(getContract('golden-pertemuan')?.colors.text).toBe('#ffffff');
  });

  it('accent is #fbbf24 (gold)', async () => {
    const { getContract } = await import('@/core/template/contract');
    expect(getContract('golden-pertemuan')?.colors.accent).toBe('#fbbf24');
  });
});

// ───────────────────────────────────────────────────────────────
// E. Golden materi accent (per-page, not identity override)
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10C-Patch-3: Golden materi accent', () => {
  it('resolveContractStyle("golden-pertemuan", "materi").accent === palette per-page accent', async () => {
    const { resolveContractStyle } = await import('@/core/template/contract');
    const style = resolveContractStyle('golden-pertemuan', 'materi', 'A');
    // Golden materi pageAccent token is 'p' (purple)
    // resolvedAccent should be palette['p'] = #c084fc (NOT contract.colors.accent #fbbf24)
    expect(style.accent).toBe('#c084fc');
  });

  it('accentTokenMap.p === #c084fc', async () => {
    const { resolveContractStyle } = await import('@/core/template/contract');
    const style = resolveContractStyle('golden-pertemuan', 'materi', 'A');
    expect(style.accentTokenMap.p).toBe('#c084fc');
  });

  it('accentTokenMap.y === #fbbf24 (identity gold preserved)', async () => {
    const { resolveContractStyle } = await import('@/core/template/contract');
    const style = resolveContractStyle('golden-pertemuan', 'materi', 'A');
    expect(style.accentTokenMap.y).toBe('#fbbf24');
  });

  it('golden cover accent === #fbbf24 (identity gold, not purple)', async () => {
    const { resolveContractStyle } = await import('@/core/template/contract');
    const style = resolveContractStyle('golden-pertemuan', 'cover', 'A');
    expect(style.accent).toBe('#fbbf24');
  });
});

// ───────────────────────────────────────────────────────────────
// F. Modern educator page accents
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10C-Patch-3: Modern educator page accents', () => {
  it('cover accent === #006c49 (emerald)', async () => {
    const { resolveContractStyle } = await import('@/core/template/contract');
    const style = resolveContractStyle('modern-educator', 'cover', 'A');
    expect(style.accent).toBe('#006c49');
  });

  it('petunjuk accent === #0058be (blue)', async () => {
    const { resolveContractStyle } = await import('@/core/template/contract');
    const style = resolveContractStyle('modern-educator', 'petunjuk', 'A');
    expect(style.accent).toBe('#0058be');
  });

  it('penutup accent === #e29100 (amber)', async () => {
    const { resolveContractStyle } = await import('@/core/template/contract');
    const style = resolveContractStyle('modern-educator', 'penutup', 'A');
    expect(style.accent).toBe('#e29100');
  });

  it('materi accent === #006c49 (emerald, not identity override)', async () => {
    const { resolveContractStyle } = await import('@/core/template/contract');
    const style = resolveContractStyle('modern-educator', 'materi', 'A');
    expect(style.accent).toBe('#006c49');
  });

  it('accentTokenMap.p === #7c3aed (modern purple, not golden #c084fc)', async () => {
    const { resolveContractStyle } = await import('@/core/template/contract');
    const style = resolveContractStyle('modern-educator', 'cover', 'A');
    expect(style.accentTokenMap.p).toBe('#7c3aed');
  });
});

// ───────────────────────────────────────────────────────────────
// G. Unknown/empty contract fallback
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10C-Patch-3: Unknown/empty contract fallback', () => {
  it('getContractOrGolden(undefined).id === "modern-educator"', async () => {
    const { getContractOrGolden } = await import('@/core/template/contract');
    expect(getContractOrGolden(undefined).id).toBe('modern-educator');
  });

  it('getContractOrGolden("").id === "modern-educator"', async () => {
    const { getContractOrGolden } = await import('@/core/template/contract');
    expect(getContractOrGolden('').id).toBe('modern-educator');
  });

  it('getContractOrGolden("not-exist").id === "modern-educator"', async () => {
    const { getContractOrGolden } = await import('@/core/template/contract');
    expect(getContractOrGolden('not-exist').id).toBe('modern-educator');
  });
});

// ───────────────────────────────────────────────────────────────
// H. MEC.ts is compatibility re-export (no registerContract call)
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10C-Patch-3: MEC.ts is compatibility re-export', () => {
  const src = readSrc('core/template/contract/ModernEducatorContract.ts');

  it('does NOT call registerContract (no side-effect)', () => {
    const stripped = src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(stripped).not.toContain('registerContract');
  });

  it('does NOT define MODERN_EDUCATOR_CONTRACT (only re-exports)', () => {
    const stripped = src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(stripped).not.toContain('export const MODERN_EDUCATOR_CONTRACT');
  });

  it('re-exports from TemplateThemeContract', () => {
    expect(src).toContain("from './TemplateThemeContract'");
  });
});

// ───────────────────────────────────────────────────────────────
// I. TTC source audit — owns MODERN_EDUCATOR_CONTRACT
// ═══════════════════════════════════════════════════════════════

describe('BATCH-10C-Patch-3: TTC owns MODERN_EDUCATOR_CONTRACT', () => {
  const src = readSrc('core/template/contract/TemplateThemeContract.ts');

  it('defines MODERN_EDUCATOR_CONTRACT', () => {
    expect(src).toContain('export const MODERN_EDUCATOR_CONTRACT');
  });

  it('registers MODERN_EDUCATOR_CONTRACT via registerContract', () => {
    expect(src).toContain('registerContract(MODERN_EDUCATOR_CONTRACT)');
  });

  it('does NOT import from ModernEducatorContract', () => {
    const stripped = src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(stripped).not.toContain("from './ModernEducatorContract'");
  });
});
