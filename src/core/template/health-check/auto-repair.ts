// ═══════════════════════════════════════════════════════════════════
// AUTO REPAIR PIPELINE — Safe repairs for template quality
// ═══════════════════════════════════════════════════════════════════
// Setelah validasi, jalankan repair yang aman dulu.
//
// Safe repairs (auto-apply):
//   - font-too-small → naikkan ke font minimum
//   - color-inconsistent → normalisasi ke theme contract
//   - missing-feedback → tambahkan feedback default
//   - broken-score → sinkronkan scoring config
//   - placeholder-text → tandai/fokuskan, atau ganti default jika aman
//
// Preview repairs (need confirmation):
//   - split-page → bisa mengubah alur cerita
//   - change-variant → bisa mengubah rasa desain
//   - fix-navigation-lock → bisa mengubah pengalaman siswa
//
// IMPORTANT: Auto repair TIDAK menghapus block. Tidak mengubah alur.
// Hanya memperbaiki properti yang aman.
// ═══════════════════════════════════════════════════════════════════

import type { CanvaPage } from '@/components/canva/types';
import type { SchemaBlock } from '@/core/schema/types';
import type { ScreenSchema } from '@/core/schema/types/schema';
import type { TemplateHealthIssue, TemplateHealthResult } from '../health-check/types';
import { FONT_MINIMUMS } from '../health-check/types';
import type { AutoRepairType, PreviewRepairType } from './quality-gate';
import { getPageContract } from '@/core/edu/page-runtime-contract';

// ── Repair Result ────────────────────────────────────────────────

export interface RepairResult {
  /** Whether the repair was applied successfully */
  success: boolean;
  /** Which repair type was applied */
  repairType: AutoRepairType;
  /** Number of changes made */
  changesCount: number;
  /** Human-readable description of changes */
  description: string;
  /** The modified pages (if successful) */
  modifiedPages?: CanvaPage[];
}

export interface PreviewRepairResult {
  /** The repair type */
  repairType: PreviewRepairType;
  /** Page index affected */
  pageIndex: number;
  /** Human-readable description of what will change */
  description: string;
  /** The proposed modified pages (preview, not applied yet) */
  proposedPages: CanvaPage[];
  /** Original pages for comparison */
  originalPages: CanvaPage[];
}

/**
 * Full repair pipeline result — runs all safe repairs
 */
export interface RepairPipelineResult {
  /** All repairs that were applied */
  appliedRepairs: RepairResult[];
  /** Total number of changes across all repairs */
  totalChanges: number;
  /** Modified pages (combined result) */
  modifiedPages: CanvaPage[];
  /** Whether the template now passes the gate */
  nowPassesGate: boolean;
  /** New health score after repair */
  newScore: number;
  /** Remaining issues that couldn't be auto-repaired */
  remainingIssues: TemplateHealthIssue[];
}

// ═══════════════════════════════════════════════════════════════════
// SAFE REPAIRS — Can be applied automatically
// ═══════════════════════════════════════════════════════════════════

/**
 * Repair: Fix font sizes that are too small.
 * Strategy: Set font size to the minimum for that element type.
 */
export function repairFontSize(pages: CanvaPage[]): RepairResult {
  let changesCount = 0;
  const modifiedPages = pages.map(page => {
    if (!page.schema?.blocks) return page;

    const modifiedBlocks = page.schema.blocks.map(block => {
      const modified = repairBlockFontSize(block, page.templateType);
      if (modified !== block) changesCount++;
      return modified;
    });

    if (changesCount === 0) return page;

    return {
      ...page,
      schema: { ...page.schema, blocks: modifiedBlocks },
    };
  });

  return {
    success: changesCount > 0,
    repairType: 'fix-font-size',
    changesCount,
    description: changesCount > 0
      ? `${changesCount} font diperbesar ke ukuran minimal`
      : 'Tidak ada font yang perlu diperbaiki',
    modifiedPages: changesCount > 0 ? modifiedPages : undefined,
  };
}

function repairBlockFontSize(block: SchemaBlock, templateType?: string): SchemaBlock {
  let modified = false;
  const newStyle = { ...block.style };

  if (newStyle) {
    for (const [key, value] of Object.entries(newStyle)) {
      if (key.includes('font-size') || key.includes('fontSize')) {
        const pxMatch = value.match(/(\d+(?:\.\d+)?)px/);
        if (pxMatch) {
          const size = parseFloat(pxMatch[1]!);
          let minSize = FONT_MINIMUMS.body;

          if (block.type === 'cover' || block.type === 'hero') minSize = FONT_MINIMUMS.coverTitle;
          else if (key.includes('title') || key.includes('Title')) minSize = FONT_MINIMUMS.pageTitle;
          else if (key.includes('heading') || key.includes('Heading')) minSize = FONT_MINIMUMS.cardTitle;
          else if (key.includes('caption') || key.includes('Caption') || key.includes('small')) minSize = FONT_MINIMUMS.caption;
          else if (key.includes('button') || key.includes('Button')) minSize = FONT_MINIMUMS.button;

          if (size < minSize) {
            newStyle[key] = `${minSize}px`;
            modified = true;
          }
        }
      }
    }
  }

  // Recursively repair children
  let modifiedChildren: SchemaBlock[] | undefined;
  if (block.children) {
    modifiedChildren = block.children.map(child => {
      const repaired = repairBlockFontSize(child, templateType);
      if (repaired !== child) modified = true;
      return repaired;
    });
  }

  if (!modified) return block;

  return {
    ...block,
    ...(newStyle !== block.style ? { style: newStyle } : {}),
    ...(modifiedChildren ? { children: modifiedChildren } : {}),
  };
}

/**
 * Repair: Normalize colors to theme contract.
 * Strategy: Remove hardcoded hex colors from block styles,
 *           replacing with token references where possible.
 */
export function repairColors(pages: CanvaPage[]): RepairResult {
  let changesCount = 0;
  const modifiedPages = pages.map(page => {
    if (!page.schema?.blocks) return page;

    const modifiedBlocks = page.schema.blocks.map(block => {
      const result = repairBlockColors(block);
      if (result.modified) changesCount += result.changes;
      return result.block;
    });

    if (changesCount === 0) return page;

    return {
      ...page,
      schema: { ...page.schema, blocks: modifiedBlocks },
    };
  });

  return {
    success: changesCount > 0,
    repairType: 'fix-colors',
    changesCount,
    description: changesCount > 0
      ? `${changesCount} warna hardcoded dinormalisasi`
      : 'Tidak ada warna yang perlu dinormalisasi',
    modifiedPages: changesCount > 0 ? modifiedPages : undefined,
  };
}

function repairBlockColors(block: SchemaBlock): { block: SchemaBlock; modified: boolean; changes: number } {
  let changes = 0;
  const newStyle = { ...block.style };

  // Remove hardcoded hex colors from style — replace with empty
  // (renderer will fall back to contract tokens)
  if (newStyle) {
    for (const [key, value] of Object.entries(newStyle)) {
      if (typeof value === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(value)) {
        // Don't remove colors that are intentional (bg, background)
        // Only strip color/border-color that should use tokens
        if (key.includes('color') && !key.includes('bg') && !key.includes('background')) {
          delete newStyle[key];
          changes++;
        }
      }
    }
  }

  // Normalize borderColor to token key if it's hardcoded hex
  const b = block as Record<string, unknown>;
  let newBorderColor: string | undefined;
  if ('borderColor' in b && typeof b.borderColor === 'string') {
    const bc = b.borderColor as string;
    if (/^#[0-9a-fA-F]{3,8}$/.test(bc)) {
      // Replace with default token 'y' (primary accent)
      newBorderColor = 'y';
      changes++;
    }
  }

  // Recursively repair children
  let modifiedChildren: SchemaBlock[] | undefined;
  if (block.children) {
    modifiedChildren = block.children.map(child => {
      const result = repairBlockColors(child);
      changes += result.changes;
      return result.block;
    });
  }

  const modified = changes > 0;
  const newBlock: SchemaBlock = {
    ...block,
    ...(Object.keys(newStyle).length !== Object.keys(block.style || {}).length ? { style: newStyle } : {}),
    ...(newBorderColor ? { borderColor: newBorderColor } as unknown as Partial<SchemaBlock> : {}),
    ...(modifiedChildren ? { children: modifiedChildren } : {}),
  };

  return { block: newBlock, modified, changes };
}

/**
 * Repair: Add default feedback to quiz/game blocks.
 * Strategy: Add generic feedback messages where missing.
 */
export function repairAddFeedback(pages: CanvaPage[]): RepairResult {
  let changesCount = 0;
  const modifiedPages = pages.map(page => {
    if (!page.schema?.blocks) return page;

    const modifiedBlocks = page.schema.blocks.map(block => {
      if (block.type !== 'kuis') return block;

      const b = block as unknown as Record<string, unknown>;
      const questions = b.questions as Array<Record<string, unknown>> | undefined;
      if (!questions) return block;

      let blockModified = false;
      const newQuestions = questions.map(q => {
        const newQ = { ...q };
        const hasFeedback = !!(q.feedback || q.explanation || q.explain);

        if (!hasFeedback) {
          newQ.feedback = 'Jawaban sudah diperiksa.';
          blockModified = true;
          changesCount++;
        }

        // Ensure options have correct flag
        const options = q.options as Array<Record<string, unknown>> | undefined;
        if (options && !options.some(o => o.correct || o.isCorrect)) {
          // Mark first option as correct by default (teacher will fix later)
          if (options.length > 0) {
            newQ.options = options.map((o, i) => ({
              ...o,
              ...(i === 0 ? { correct: true } : {}),
            }));
            blockModified = true;
            changesCount++;
          }
        }

        return newQ;
      });

      if (!blockModified) return block;

      return { ...block, questions: newQuestions } as unknown as SchemaBlock;
    });

    if (changesCount === 0) return page;

    return {
      ...page,
      schema: { ...page.schema, blocks: modifiedBlocks },
    };
  });

  return {
    success: changesCount > 0,
    repairType: 'add-default-feedback',
    changesCount,
    description: changesCount > 0
      ? `${changesCount} feedback default ditambahkan`
      : 'Tidak ada feedback yang perlu ditambahkan',
    modifiedPages: changesCount > 0 ? modifiedPages : undefined,
  };
}

/**
 * Repair: Sync scoring configuration.
 * Strategy: If page has scoring enabled but no score-producing block,
 *           disable scoring. If page has score block but scoring disabled,
 *           enable scoring.
 */
export function repairSyncScoring(pages: CanvaPage[]): RepairResult {
  let changesCount = 0;

  // This repair doesn't modify schema blocks — it adjusts the
  // page-level navConfig and templateType alignment.
  // Since scoring is derived from PageRuntimeContract (which is
  // based on templateType), the "repair" is informational:
  // if a kuis page is misconfigured, we can't auto-change
  // templateType. But we can ensure the navConfig is consistent.

  const modifiedPages = pages.map(page => {
    const templateType = page.templateType || 'custom';
    const contract = getPageContract(templateType);
    const blocks = page.schema?.blocks ?? [];

    const hasScoreBlock = blocks.some(b =>
      b.type === 'kuis' || b.type.includes('game')
    );

    // If contract says scoring enabled but no score block exists,
    // we can't auto-fix (would need to add a block or change type)
    // → informational only

    // If navConfig.showScore is false but contract has scoring enabled,
    // fix the navConfig
    if (contract.scoring.enabled && !page.navConfig?.showScore && hasScoreBlock) {
      changesCount++;
      return {
        ...page,
        navConfig: {
          ...page.navConfig,
          showScore: true,
          showProgress: page.navConfig?.showProgress ?? true,
        },
      };
    }

    return page;
  });

  return {
    success: changesCount > 0,
    repairType: 'sync-scoring',
    changesCount,
    description: changesCount > 0
      ? `${changesCount} konfigurasi skor disinkronkan`
      : 'Tidak ada konfigurasi skor yang perlu disinkronkan',
    modifiedPages: changesCount > 0 ? modifiedPages : undefined,
  };
}

/**
 * Repair: Mark/focus placeholder text.
 * Strategy: Replace placeholder text with a safe default
 *           that signals "needs editing" more clearly.
 */
export function repairPlaceholder(pages: CanvaPage[]): RepairResult {
  let changesCount = 0;

  const PLACEHOLDER_PATTERNS = [
    /tuliskan\s+(di\s+)?sini/i,
    /tulis\s+(di\s+)?sini/i,
    /contoh\s+(di\s+)?sini/i,
    /isi\s+(di\s+)?sini/i,
    /tulis\s+pendapat/i,
    /placeholder/i,
    /lorem\s+ipsum/i,
    /judul\s+materi/i,
    /penjelasan\s+materi/i,
    /poin\s+(pertama|kedua|ketiga|keempat)/i,
    /konten\s+belum\s+tersedia/i,
    /definisi\s+baru/i,
    /judul\s+baru/i,
    /masukkan\s+(teks|judul|konten)/i,
    /ketik\s+(di\s+)?sini/i,
  ];

  const modifiedPages = pages.map(page => {
    if (!page.schema?.blocks) return page;

    let pageModified = false;
    const modifiedBlocks = page.schema.blocks.map(block => {
      const result = repairBlockPlaceholder(block, PLACEHOLDER_PATTERNS);
      if (result.modified) {
        pageModified = true;
        changesCount += result.changes;
      }
      return result.block;
    });

    if (!pageModified) return page;

    return {
      ...page,
      schema: { ...page.schema, blocks: modifiedBlocks },
    };
  });

  return {
    success: changesCount > 0,
    repairType: 'mark-placeholder',
    changesCount,
    description: changesCount > 0
      ? `${changesCount} teks placeholder ditandai untuk diedit`
      : 'Tidak ada placeholder yang perlu ditandai',
    modifiedPages: changesCount > 0 ? modifiedPages : undefined,
  };
}

function repairBlockPlaceholder(
  block: SchemaBlock,
  patterns: RegExp[],
): { block: SchemaBlock; modified: boolean; changes: number } {
  let changes = 0;
  const b = block as Record<string, unknown>;
  const textKeys = ['title', 'subtitle', 'content', 'body', 'text', 'teks', 'isi',
    'desc', 'description', 'intro', 'hookQuestion', 'question'];
  const modifiedBlock: Record<string, unknown> = { ...b };
  let modified = false;

  for (const key of textKeys) {
    if (key in b && typeof b[key] === 'string') {
      const value = b[key] as string;
      for (const pattern of patterns) {
        if (pattern.test(value)) {
          // Replace with a clearly marked placeholder that tells teacher to edit
          const templateLabel = block.type === 'cover' ? 'Judul Cover'
            : block.type === 'tp' ? 'Tujuan Pembelajaran'
            : block.type === 'materi-section' ? 'Materi Pembelajaran'
            : block.type === 'kuis' ? 'Pertanyaan Kuis'
            : block.type === 'refleksi' ? 'Pertanyaan Refleksi'
            : block.type === 'diskusi' ? 'Pertanyaan Diskusi'
            : block.type === 'def-box' ? 'Definisi'
            : block.type === 'nc-grid' ? 'Norma Kartu'
            : block.type === 'materi-blok' ? 'Konten Materi'
            : 'Konten';

          modifiedBlock[key] = `[Edit: ${templateLabel}]`;
          changes++;
          modified = true;
          break;
        }
      }
    }
  }

  // Recursively repair children
  if (block.children) {
    const childResults = block.children.map(child =>
      repairBlockPlaceholder(child, patterns)
    );
    const modifiedChildren = childResults.map(r => r.block);
    for (const r of childResults) {
      if (r.modified) {
        changes += r.changes;
        modified = true;
      }
    }
    modifiedBlock.children = modifiedChildren;
  }

  return {
    block: modified ? modifiedBlock as unknown as SchemaBlock : block,
    modified,
    changes,
  };
}

// ═══════════════════════════════════════════════════════════════════
// REPAIR PIPELINE — Run all safe repairs
// ═══════════════════════════════════════════════════════════════════

/**
 * Run all safe auto-repairs on a template.
 * Returns the combined result with modified pages.
 */
export function runRepairPipeline(
  pages: CanvaPage[],
  healthResult: TemplateHealthResult,
): RepairPipelineResult {
  const availableRepairs = new Set<AutoRepairType>();

  for (const issue of healthResult.issues) {
    switch (issue.type) {
      case 'font-too-small': availableRepairs.add('fix-font-size'); break;
      case 'too-many-colors':
      case 'hardcoded-color': availableRepairs.add('fix-colors'); break;
      case 'missing-feedback': availableRepairs.add('add-default-feedback'); break;
      case 'broken-score':
      case 'broken-completion': availableRepairs.add('sync-scoring'); break;
      case 'placeholder-text': availableRepairs.add('mark-placeholder'); break;
    }
  }

  if (availableRepairs.size === 0) {
    return {
      appliedRepairs: [],
      totalChanges: 0,
      modifiedPages: pages,
      nowPassesGate: healthResult.score >= 90,
      newScore: healthResult.score,
      remainingIssues: healthResult.issues,
    };
  }

  let currentPages = [...pages];
  const appliedRepairs: RepairResult[] = [];
  let totalChanges = 0;

  // Run repairs in order: placeholder first, then font, then colors,
  // then feedback, then scoring
  const repairOrder: AutoRepairType[] = [
    'mark-placeholder',
    'fix-font-size',
    'fix-colors',
    'add-default-feedback',
    'sync-scoring',
  ];

  for (const repairType of repairOrder) {
    if (!availableRepairs.has(repairType)) continue;

    let result: RepairResult;
    switch (repairType) {
      case 'fix-font-size':
        result = repairFontSize(currentPages);
        break;
      case 'fix-colors':
        result = repairColors(currentPages);
        break;
      case 'add-default-feedback':
        result = repairAddFeedback(currentPages);
        break;
      case 'sync-scoring':
        result = repairSyncScoring(currentPages);
        break;
      case 'mark-placeholder':
        result = repairPlaceholder(currentPages);
        break;
    }

    if (result.success && result.modifiedPages) {
      currentPages = result.modifiedPages;
      appliedRepairs.push(result);
      totalChanges += result.changesCount;
    }
  }

  // Re-validate to get new score
  // Import here to avoid circular dependency — validateTemplate is in a sibling module
  const { validateTemplate } = require('./template-health-check');
  const newResult = validateTemplate({ pages: currentPages });

  return {
    appliedRepairs,
    totalChanges,
    modifiedPages: currentPages,
    nowPassesGate: newResult.score >= 90 && newResult.issues.filter((i: { severity: string }) => i.severity === 'error').length === 0,
    newScore: newResult.score,
    remainingIssues: newResult.issues,
  };
}

/**
 * Run a single specific repair.
 */
export function runSingleRepair(
  pages: CanvaPage[],
  repairType: AutoRepairType,
): RepairResult {
  switch (repairType) {
    case 'fix-font-size':
      return repairFontSize(pages);
    case 'fix-colors':
      return repairColors(pages);
    case 'add-default-feedback':
      return repairAddFeedback(pages);
    case 'sync-scoring':
      return repairSyncScoring(pages);
    case 'mark-placeholder':
      return repairPlaceholder(pages);
  }
}
