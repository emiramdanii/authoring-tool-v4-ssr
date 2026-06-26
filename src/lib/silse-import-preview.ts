// ═══════════════════════════════════════════════════════════════
// BATCH-09B — SILSE Import Preview Generator
// ═══════════════════════════════════════════════════════════════
// Derives a preview structure from a VALIDATED SilseImportJson.
//
// Scope (per senior audit):
//   1. After JSON validates, show preview summary:
//      - judul, mapel/kelas, page count
//      - per-page detail: index, label, templateType, block types
//   2. Does NOT apply to store (preview only)
//   3. Does NOT mutate active project
//   4. Warn if a block type is valid (registered) but has no dedicated
//      inspector editor — teacher should know some blocks can't be
//      edited inline post-import
//   5. Tested via unit + E2E
//
// Why a separate module?
//   - Keeps ImportJsonPanelV5 focused on UI (state, rendering)
//   - Preview derivation is pure logic (input → output, no side effects)
//   - Easy to unit test independently
//   - Reusable by future "full import adapter" batch
// ═══════════════════════════════════════════════════════════════

import type { SilseImportJson, SilseImportPage } from './silse-import-validator';
import { getBlockFields } from '@/components/canva/mpi-workspace-v2/inspector-field-registry';

// ───────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────

export interface PreviewPageInfo {
  /** 0-based page index */
  index: number;
  /** Page ID from schema */
  id: string;
  /** Display label (page.label or fallback "Halaman {index+1}") */
  label: string;
  /** templateType (e.g., 'cover', 'kuis', 'refleksi') */
  templateType: string;
  /** Number of blocks on this page */
  blockCount: number;
  /** Distinct block types on this page (sorted alphabetically) */
  blockTypes: string[];
}

export interface PreviewBlockTypeSummary {
  /** Block type name */
  type: string;
  /** Total count across all pages */
  count: number;
  /** Whether this block type has a dedicated inspector editor */
  hasEditor: boolean;
}

export type PreviewWarningCode =
  | 'no-editor'        // block type is valid but has no dedicated inspector editor
  | 'empty-page'       // page has 0 blocks
  | 'missing-label';   // page has no label field

export interface PreviewWarning {
  code: PreviewWarningCode;
  /** Indonesian, user-facing message */
  message: string;
  /** Path to the affected field (e.g., "canva.pages[2]") */
  path?: string;
  /** Block type the warning is about (for 'no-editor' code) */
  blockType?: string;
}

export interface SilseImportPreview {
  /** Project metadata (from meta) */
  meta: {
    judulPertemuan: string;
    mapel: string;
    kelas: string;
    namaGuru?: string;
    namaSekolah?: string;
  };
  /** Total page count */
  totalPages: number;
  /** Total block count across all pages */
  totalBlocks: number;
  /** Per-page detail */
  pages: PreviewPageInfo[];
  /** Block type usage summary (sorted by count desc, then name asc) */
  blockTypeSummary: PreviewBlockTypeSummary[];
  /** Warnings (non-blocking — preview still shows) */
  warnings: PreviewWarning[];
}

// ───────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────

function isNonEmptyString(val: unknown): val is string {
  return typeof val === 'string' && val.trim().length > 0;
}

/**
 * Check if a block type has a dedicated inspector editor.
 *
 * Uses the same registry that WorkspaceInspector uses to render fields.
 * If getBlockFields returns null (or FALLBACK_FIELDS is used), the
 * block type has no dedicated editor.
 */
export function blockTypeHasEditor(blockType: string): boolean {
  const config = getBlockFields(blockType);
  if (!config) return false;
  // FALLBACK_FIELDS has blockType='_fallback' — if registry returns
  // that, it means no dedicated config was registered for this type.
  return config.blockType !== '_fallback';
}

/**
 * Get the list of block types that DO have dedicated inspector editors.
 * Useful for showing teachers which block types are fully editable.
 */
export function getBlockTypesWithEditors(): string[] {
  // The registry doesn't expose a "list all" function, so we check
  // the known set of registered types. This list mirrors the
  // registerBlockFields calls in inspector-field-registry.ts.
  // If that file adds new registrations, this list should be updated.
  return [
    'cover', 'hero', 'petunjuk', 'tujuan-display', 'motivasi',
    'materi-section', 'def-box', 'materi-blok', 'diskusi', 'kuis',
    'sortir-game', 'refleksi', 'rangkuman', 'penutup', 'tabel-accord',
    'hasil',
  ];
}

// ───────────────────────────────────────────────────────────────
// Main: deriveSilseImportPreview
// ───────────────────────────────────────────────────────────────

/**
 * Derive a preview structure from a validated SilseImportJson.
 *
 * This is PURE logic — no side effects, no store mutations.
 * Caller must ensure the document has already passed validation
 * (validateSilseImport returned valid=true). Behavior on invalid
 * documents is undefined (may throw or return garbage).
 *
 * @param doc The validated SilseImportJson document
 * @returns SilseImportPreview with meta, pages, block summary, warnings
 */
export function deriveSilseImportPreview(doc: SilseImportJson): SilseImportPreview {
  // ── Extract meta ─────────────────────────────────────────────
  const meta = doc.meta ?? { judulPertemuan: '', mapel: '', kelas: '' };
  const metaPreview = {
    judulPertemuan: String(meta.judulPertemuan ?? ''),
    mapel: String(meta.mapel ?? ''),
    kelas: String(meta.kelas ?? ''),
    ...(isNonEmptyString(meta.namaGuru) ? { namaGuru: String(meta.namaGuru) } : {}),
    ...(isNonEmptyString(meta.namaSekolah) ? { namaSekolah: String(meta.namaSekolah) } : {}),
  };

  // ── Extract pages ────────────────────────────────────────────
  const pages: PreviewPageInfo[] = [];
  const warnings: PreviewWarning[] = [];
  const blockTypeCounts = new Map<string, number>();
  let totalBlocks = 0;

  const rawPages = doc.canva?.pages ?? [];
  for (let i = 0; i < rawPages.length; i++) {
    const page = rawPages[i] as SilseImportPage | undefined;
    const pagePath = `canva.pages[${i}]`;

    // Page label
    const rawLabel = page?.label;
    const label = isNonEmptyString(rawLabel)
      ? String(rawLabel)
      : `Halaman ${i + 1}`;
    if (!isNonEmptyString(rawLabel)) {
      warnings.push({
        code: 'missing-label',
        message: `Halaman ${i + 1} tidak memiliki label (menggunakan "${label}").`,
        path: `${pagePath}.label`,
      });
    }

    // Page templateType
    const templateType = String(page?.templateType ?? 'custom');

    // Blocks
    const blocks = page?.schema?.blocks ?? [];
    const blockCount = blocks.length;
    if (blockCount === 0) {
      warnings.push({
        code: 'empty-page',
        message: `Halaman ${i + 1} (${label}) tidak memiliki blok.`,
        path: `${pagePath}.schema.blocks`,
      });
    }

    // Distinct block types on this page
    const pageBlockTypes = new Set<string>();
    for (const block of blocks) {
      const blockType = String(block?.type ?? '');
      if (!blockType) continue;
      pageBlockTypes.add(blockType);
      blockTypeCounts.set(blockType, (blockTypeCounts.get(blockType) ?? 0) + 1);
      totalBlocks++;

      // Check if this block type has a dedicated editor
      if (!blockTypeHasEditor(blockType)) {
        warnings.push({
          code: 'no-editor',
          message: `Block type "${blockType}" terdaftar tapi belum punya editor khusus di inspector. Block akan dirender tapi tidak bisa diedit inline.`,
          path: `${pagePath}.schema.blocks`,
          blockType,
        });
      }
    }

    pages.push({
      index: i,
      id: String(page?.id ?? `page-${i}`),
      label,
      templateType,
      blockCount,
      blockTypes: Array.from(pageBlockTypes).sort(),
    });
  }

  // ── Block type summary ───────────────────────────────────────
  const blockTypeSummary: PreviewBlockTypeSummary[] = Array.from(blockTypeCounts.entries())
    .map(([type, count]) => ({
      type,
      count,
      hasEditor: blockTypeHasEditor(type),
    }))
    .sort((a, b) => {
      // Sort by count desc, then by type name asc
      if (b.count !== a.count) return b.count - a.count;
      return a.type.localeCompare(b.type);
    });

  return {
    meta: metaPreview,
    totalPages: pages.length,
    totalBlocks,
    pages,
    blockTypeSummary,
    warnings,
  };
}

// ───────────────────────────────────────────────────────────────
// Test-only exports
// ───────────────────────────────────────────────────────────────

export const __TEST__ = {
  isNonEmptyString,
  blockTypeHasEditor,
};
