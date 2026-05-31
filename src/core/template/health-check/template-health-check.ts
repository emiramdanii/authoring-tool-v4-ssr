// ═══════════════════════════════════════════════════════════════════
// TEMPLATE HEALTH CHECK — validateTemplate(project)
// ═══════════════════════════════════════════════════════════════════
// Template berantakan harus dicek dengan validator, bukan perasaan.
// Mulai dari overlap, overflow, font kecil, placeholder, dan page
// yang terlalu padat.
//
// 10 Cek:
//   1. 1 Page 1 Fokus (max blocks per page type)
//   2. Overlap (bounding box collision)
//   3. Overflow (keluar dari safe area)
//   4. Font Terlalu Kecil (per element type)
//   5. Warna Tidak Konsisten
//   6. Placeholder Text
//   7. Navigasi
//   8. Interaksi
//   9. Score & Completion Sync
//  10. Narrative Coherence
//
// Output: { score, status, issues, breakdown, pageSummaries }
//
// Skor dibobot:
//   noOverlap      = 20
//   noOverflow     = 20
//   fontReadable   = 15
//   oneFocus       = 15
//   colorConsistent= 10
//   navigation     = 10
//   interaction    = 10
// ═══════════════════════════════════════════════════════════════════

import type { CanvaPage } from '@/components/canva/types';
import type { SchemaBlock } from '@/core/schema/types';
import type { ScreenSchema } from '@/core/schema/types/schema';
import { getPageContract, isInteractiveCompletion } from '@/core/edu/page-runtime-contract';
import { validateNarrativeArc, inferSceneType, type SceneType } from '@/core/edu/education-scene-types';
import { isFullPageBlockType } from '@/core/schema/capability-registry';
import {
  type TemplateHealthIssue,
  type TemplateHealthResult,
  type HealthScoreBreakdown,
  type PageHealthSummary,
  type IssueSeverity,
  SAFE_AREA_PERCENT,
  FONT_MINIMUMS,
  MAX_BLOCKS_PER_PAGE,
  PLACEHOLDER_PATTERNS,
  getHealthStatus,
} from './types';

// ═══════════════════════════════════════════════════════════════════
// HELPER: Bounding Box
// ═══════════════════════════════════════════════════════════════════

interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Check if two bounding boxes overlap */
function boxesOverlap(a: BBox, b: BBox): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/** Extract bounding box from an absolute-positioned SchemaBlock */
function getBlockBBox(block: SchemaBlock): BBox | null {
  if (!block.layout || block.layout.position !== 'absolute') return null;

  const x = block.layout.x ?? 0;
  const y = block.layout.y ?? 0;
  const width = typeof block.layout.width === 'number' ? block.layout.width : 100;
  const height = typeof block.layout.height === 'number' ? block.layout.height : 100;

  return { x, y, width, height };
}

/** Extract bounding box from a legacy CanvaElement */
function getElementBBox(el: { x: number; y: number; w: number; h: number }): BBox {
  // CanvaElement uses percentage values (0-100)
  return { x: el.x, y: el.y, width: el.w, height: el.h };
}

/** Check if a bbox extends beyond the safe area */
function isOutsideSafeArea(bbox: BBox): { outside: boolean; overflowPx: { top?: number; bottom?: number; left?: number; right?: number } } {
  const overflow: { top?: number; bottom?: number; left?: number; right?: number } = {};
  let outside = false;

  if (bbox.y < SAFE_AREA_PERCENT.top) {
    overflow.top = SAFE_AREA_PERCENT.top - bbox.y;
    outside = true;
  }
  if (bbox.y + bbox.height > SAFE_AREA_PERCENT.bottom) {
    overflow.bottom = (bbox.y + bbox.height) - SAFE_AREA_PERCENT.bottom;
    outside = true;
  }
  if (bbox.x < SAFE_AREA_PERCENT.left) {
    overflow.left = SAFE_AREA_PERCENT.left - bbox.x;
    outside = true;
  }
  if (bbox.x + bbox.width > SAFE_AREA_PERCENT.right) {
    overflow.right = (bbox.x + bbox.width) - SAFE_AREA_PERCENT.right;
    outside = true;
  }

  return { outside, overflowPx: overflow };
}

// ═══════════════════════════════════════════════════════════════════
// HELPER: Extract text from blocks
// ═══════════════════════════════════════════════════════════════════

/** Extract all text content from a block (recursively) */
function extractBlockTexts(block: SchemaBlock): string[] {
  const texts: string[] = [];
  const b = block as Record<string, unknown>;
  const textKeys = ['title', 'subtitle', 'content', 'body', 'text', 'teks', 'isi',
    'desc', 'description', 'intro', 'hookQuestion', 'transition', 'tips',
    'closingStatement', 'selfCheck', 'petunjuk', 'label', 'question',
    'placeholder', 'hint', 'feedback'];

  for (const key of textKeys) {
    if (key in b && typeof b[key] === 'string' && b[key]) {
      texts.push(b[key] as string);
    }
  }

  // Check items/cards/questions arrays
  for (const arrayKey of ['items', 'cards', 'questions', 'steps', 'options']) {
    if (arrayKey in b && Array.isArray(b[arrayKey])) {
      for (const item of b[arrayKey] as Record<string, unknown>[]) {
        for (const key of textKeys) {
          if (key in item && typeof item[key] === 'string' && item[key]) {
            texts.push(item[key] as string);
          }
        }
      }
    }
  }

  // Check children recursively
  if (block.children) {
    for (const child of block.children) {
      texts.push(...extractBlockTexts(child));
    }
  }

  return texts;
}

/** Extract all colors used in a block */
function extractBlockColors(block: SchemaBlock): string[] {
  const colors: string[] = [];
  const b = block as Record<string, unknown>;

  // Check style object for hex colors
  if (block.style) {
    for (const value of Object.values(block.style)) {
      if (typeof value === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(value)) {
        colors.push(value.toLowerCase());
      }
    }
  }

  // Check color fields
  for (const key of ['accentColor', 'borderColor', 'bgColor', 'color']) {
    if (key in b && typeof b[key] === 'string') {
      const val = b[key] as string;
      if (/^#[0-9a-fA-F]{3,8}$/.test(val)) {
        colors.push(val.toLowerCase());
      }
    }
  }

  // Check children
  if (block.children) {
    for (const child of block.children) {
      colors.push(...extractBlockColors(child));
    }
  }

  return colors;
}

// ═══════════════════════════════════════════════════════════════════
// HELPER: Issue factory
// ═══════════════════════════════════════════════════════════════════

function makeIssue(
  pageIndex: number,
  severity: IssueSeverity,
  type: TemplateHealthIssue['type'],
  message: string,
  options?: {
    blockType?: string;
    blockId?: string;
    detail?: string;
    quickFix?: TemplateHealthIssue['quickFix'];
  },
): TemplateHealthIssue {
  return {
    pageIndex,
    severity,
    type,
    message,
    blockType: options?.blockType,
    blockId: options?.blockId,
    detail: options?.detail,
    quickFix: options?.quickFix,
  };
}

// ═══════════════════════════════════════════════════════════════════
// MAIN: validateTemplate(project)
// ═══════════════════════════════════════════════════════════════════

export interface TemplateProjectInput {
  pages: CanvaPage[];
}

/**
 * Validate a template project and produce a health score.
 *
 * This is the main entry point. It runs all 10 checks and returns
 * a structured result with score, issues, and per-page summaries.
 */
export function validateTemplate(project: TemplateProjectInput): TemplateHealthResult {
  const { pages } = project;
  const issues: TemplateHealthIssue[] = [];

  if (pages.length === 0) {
    return {
      score: 0,
      status: 'unusable',
      issues: [makeIssue(0, 'error', 'too-many-blocks', 'Template tidak punya halaman.')],
      breakdown: emptyBreakdown(),
      pageSummaries: [],
    };
  }

  // ── Per-page checks ────────────────────────────────────────
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]!;
    const schema = page.schema;
    const blocks = schema?.blocks ?? [];
    const isSchemaDriven = !!schema;

    // ── CHECK 1: 1 Page 1 Fokus ──────────────────────────────
    checkOneFocusPerPage(i, page, blocks, issues);

    // ── CHECK 2: Overlap ─────────────────────────────────────
    if (isSchemaDriven) {
      checkOverlapSchema(i, blocks, issues);
    } else {
      checkOverlapElements(i, page, issues);
    }

    // ── CHECK 3: Overflow ────────────────────────────────────
    if (isSchemaDriven) {
      checkOverflowSchema(i, blocks, issues);
    } else {
      checkOverflowElements(i, page, issues);
    }

    // ── CHECK 4: Font Terlalu Kecil ──────────────────────────
    checkFontTooSmall(i, page, blocks, issues);

    // ── CHECK 5: Warna Tidak Konsisten ───────────────────────
    checkColorConsistency(i, page, blocks, issues);

    // ── CHECK 6: Placeholder Text ────────────────────────────
    checkPlaceholderText(i, blocks, issues);

    // ── CHECK 8: Interaksi ───────────────────────────────────
    checkInteraction(i, page, blocks, issues);
  }

  // ── Cross-page checks ──────────────────────────────────────

  // ── CHECK 7: Navigasi ─────────────────────────────────────
  checkNavigation(pages, issues);

  // ── CHECK 9: Score & Completion Sync ───────────────────────
  checkScoreCompletionSync(pages, issues);

  // ── CHECK 10: Narrative Coherence ──────────────────────────
  checkNarrativeCoherence(pages, issues);

  // ── Compute score & breakdown ──────────────────────────────
  const breakdown = computeBreakdown(issues);
  const totalScore = Object.values(breakdown).reduce((sum, area) => sum + area.score, 0);
  const status = getHealthStatus(totalScore);

  // ── Page summaries ─────────────────────────────────────────
  const pageSummaries: PageHealthSummary[] = pages.map((page, i) => {
    const pageIssues = issues.filter(issue => issue.pageIndex === i);
    return {
      pageIndex: i,
      label: page.label || `Halaman ${i + 1}`,
      templateType: page.templateType || 'custom',
      errors: pageIssues.filter(pi => pi.severity === 'error').length,
      warnings: pageIssues.filter(pi => pi.severity === 'warning').length,
      passed: pageIssues.filter(pi => pi.severity === 'error').length === 0,
    };
  });

  return {
    score: totalScore,
    status,
    issues,
    breakdown,
    pageSummaries,
  };
}

// ═══════════════════════════════════════════════════════════════════
// CHECK 1: 1 Page 1 Fokus
// ═══════════════════════════════════════════════════════════════════

function checkOneFocusPerPage(
  pageIndex: number,
  page: CanvaPage,
  blocks: SchemaBlock[],
  issues: TemplateHealthIssue[],
): void {
  const templateType = page.templateType || 'custom';
  const maxBlocks = MAX_BLOCKS_PER_PAGE[templateType] ?? MAX_BLOCKS_PER_PAGE.custom!;

  // Count main blocks (not full-page blocks like cover, hero)
  const mainBlocks = blocks.filter(b => !isFullPageBlockType(b.type));
  const totalBlocks = blocks.length;

  // Check if page has mixed focus types
  const focusTypes = new Set<string>();
  for (const block of blocks) {
    if (block.type === 'kuis' || block.type === 'true-false-game') focusTypes.add('kuis');
    else if (block.type.includes('game') || block.type.includes('sortir') || block.type.includes('memory') ||
             block.type.includes('matching') || block.type.includes('drag-drop') || block.type.includes('crossword') ||
             block.type.includes('word-search') || block.type.includes('fill-blank') || block.type.includes('roda') ||
             block.type.includes('team-buzzer')) focusTypes.add('game');
    else if (block.type === 'refleksi') focusTypes.add('refleksi');
    else if (block.type === 'diskusi') focusTypes.add('diskusi');
    else if (block.type === 'materi-section' || block.type === 'materi-blok' || block.type === 'def-box' || block.type === 'nc-grid') focusTypes.add('materi');
    else if (block.type === 'cover' || block.type === 'hero') focusTypes.add('cover');
    else if (block.type === 'tp' || block.type === 'tujuan-display') focusTypes.add('tujuan');
  }

  // Mixed focus detection: Materi + Kuis + Game + Refleksi = berantakan
  if (focusTypes.size > 2) {
    issues.push(makeIssue(
      pageIndex, 'error', 'too-many-blocks',
      `Halaman punya ${focusTypes.size} fokus berbeda (${[...focusTypes].join(' + ')}). "1 page = 1 fokus" — pecah ke halaman terpisah.`,
      { detail: `Fokus: ${[...focusTypes].join(', ')}`, quickFix: 'split-page' },
    ));
  } else if (totalBlocks > maxBlocks) {
    issues.push(makeIssue(
      pageIndex, 'error', 'too-many-blocks',
      `Halaman punya ${totalBlocks} block, batas aman untuk '${templateType}' = ${maxBlocks}. Pecah ke halaman baru.`,
      { detail: `Blocks: ${totalBlocks}, max: ${maxBlocks}`, quickFix: 'split-page' },
    ));
  } else if (mainBlocks.length > 2 && templateType !== 'materi' && templateType !== 'dokumen') {
    issues.push(makeIssue(
      pageIndex, 'warning', 'too-many-blocks',
      `Halaman punya ${mainBlocks.length} main block. Pertimbangkan untuk memecah ke halaman baru.`,
      { detail: `Main blocks: ${mainBlocks.length}, ideal: 1-2`, quickFix: 'split-page' },
    ));
  }

  // Cover must be single block
  if (templateType === 'cover' && totalBlocks > 1) {
    issues.push(makeIssue(
      pageIndex, 'error', 'too-many-blocks',
      `Cover harus punya tepat 1 block, bukan ${totalBlocks}. Block tambahan akan disembunyikan.`,
      { quickFix: 'split-page' },
    ));
  }

  // Quiz = 1 soal per page
  const kuisBlocks = blocks.filter(b => b.type === 'kuis');
  for (const kuis of kuisBlocks) {
    const k = kuis as { questions?: unknown[] };
    const numQ = k.questions?.length ?? 0;
    if (numQ > 1) {
      issues.push(makeIssue(
        pageIndex, 'error', 'too-many-blocks',
        `Kuis punya ${numQ} soal, standar = 1 soal per halaman. Pecah ke ${numQ} halaman.`,
        { blockType: 'kuis', blockId: kuis.id, detail: `Soal: ${numQ}, max: 1`, quickFix: 'split-page' },
      ));
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// CHECK 2: Overlap (Schema blocks)
// ═══════════════════════════════════════════════════════════════════

function checkOverlapSchema(
  pageIndex: number,
  blocks: SchemaBlock[],
  issues: TemplateHealthIssue[],
): void {
  // Only check absolute-positioned blocks for overlap
  const absoluteBlocks = blocks.filter(b => b.layout?.position === 'absolute');

  for (let i = 0; i < absoluteBlocks.length; i++) {
    const bboxA = getBlockBBox(absoluteBlocks[i]!);
    if (!bboxA) continue;

    for (let j = i + 1; j < absoluteBlocks.length; j++) {
      const bboxB = getBlockBBox(absoluteBlocks[j]!);
      if (!bboxB) continue;

      if (boxesOverlap(bboxA, bboxB)) {
        issues.push(makeIssue(
          pageIndex, 'error', 'overlap',
          `Block '${absoluteBlocks[i]!.type}' menimpa '${absoluteBlocks[j]!.type}'. Elemen saling bertumpuk.`,
          {
            blockType: absoluteBlocks[i]!.type,
            blockId: absoluteBlocks[i]!.id,
            detail: `A(${bboxA.x},${bboxA.y} ${bboxA.width}x${bboxA.height}) B(${bboxB.x},${bboxB.y} ${bboxB.width}x${bboxB.height})`,
            quickFix: 'change-variant',
          },
        ));
      }
    }
  }
}

/** Check overlap for legacy CanvaElement pages */
function checkOverlapElements(
  pageIndex: number,
  page: CanvaPage,
  issues: TemplateHealthIssue[],
): void {
  const elements = page.elements ?? [];
  for (let i = 0; i < elements.length; i++) {
    const bboxA = getElementBBox(elements[i]!);
    for (let j = i + 1; j < elements.length; j++) {
      const bboxB = getElementBBox(elements[j]!);
      if (boxesOverlap(bboxA, bboxB)) {
        issues.push(makeIssue(
          pageIndex, 'error', 'overlap',
          `Elemen '${elements[i]!.type || 'item'}' menimpa '${elements[j]!.type || 'item'}'. Elemen saling bertumpuk.`,
          { quickFix: 'change-variant' },
        ));
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// CHECK 3: Overflow (keluar dari safe area)
// ═══════════════════════════════════════════════════════════════════

function checkOverflowSchema(
  pageIndex: number,
  blocks: SchemaBlock[],
  issues: TemplateHealthIssue[],
): void {
  for (const block of blocks) {
    const bbox = getBlockBBox(block);
    if (!bbox) continue; // Flow blocks don't have fixed positions

    const { outside, overflowPx } = isOutsideSafeArea(bbox);
    if (outside) {
      const overflowDirections = Object.keys(overflowPx).join(', ');
      const maxOverflow = Math.max(...Object.values(overflowPx).map(v => v ?? 0));
      issues.push(makeIssue(
        pageIndex, 'error', 'overflow',
        `Block '${block.type}' keluar ${maxOverflow.toFixed(1)}% dari safe area (${overflowDirections}). Solusi: pecah ke halaman baru.`,
        {
          blockType: block.type,
          blockId: block.id,
          detail: `Overflow: ${JSON.stringify(overflowPx)}`,
          quickFix: 'split-page',
        },
      ));
    }
  }
}

function checkOverflowElements(
  pageIndex: number,
  page: CanvaPage,
  issues: TemplateHealthIssue[],
): void {
  const elements = page.elements ?? [];
  for (const el of elements) {
    const bbox = getElementBBox(el);
    const { outside, overflowPx } = isOutsideSafeArea(bbox);
    if (outside) {
      const maxOverflow = Math.max(...Object.values(overflowPx).map(v => v ?? 0));
      issues.push(makeIssue(
        pageIndex, 'error', 'overflow',
        `Elemen keluar ${maxOverflow.toFixed(1)}% dari safe area. Solusi: pecah ke halaman baru.`,
        { quickFix: 'split-page' },
      ));
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// CHECK 4: Font Terlalu Kecil
// ═══════════════════════════════════════════════════════════════════

function checkFontTooSmall(
  pageIndex: number,
  page: CanvaPage,
  blocks: SchemaBlock[],
  issues: TemplateHealthIssue[],
): void {
  const templateType = page.templateType || 'custom';

  // ── Check schema block styles ──────────────────────────────
  for (const block of blocks) {
    if (!block.style) continue;

    for (const [key, value] of Object.entries(block.style)) {
      if (key.includes('font-size') || key.includes('fontSize')) {
        const pxMatch = value.match(/(\d+(?:\.\d+)?)px/);
        if (pxMatch) {
          const size = parseFloat(pxMatch[1]!);

          // Determine minimum based on block role
          let minSize = FONT_MINIMUMS.body; // default: body text
          if (block.type === 'cover' || block.type === 'hero') minSize = FONT_MINIMUMS.coverTitle;
          else if (key.includes('title') || key.includes('Title')) minSize = FONT_MINIMUMS.pageTitle;
          else if (key.includes('heading') || key.includes('Heading')) minSize = FONT_MINIMUMS.cardTitle;
          else if (key.includes('caption') || key.includes('Caption') || key.includes('small')) minSize = FONT_MINIMUMS.caption;
          else if (key.includes('button') || key.includes('Button')) minSize = FONT_MINIMUMS.button;

          if (size < minSize) {
            issues.push(makeIssue(
              pageIndex, 'error', 'font-too-small',
              `Font ${size}px di block '${block.type}' terlalu kecil (minimal ${minSize}px). Media siswa butuh font besar.`,
              {
                blockType: block.type,
                blockId: block.id,
                detail: `Font: ${size}px, minimal: ${minSize}px, key: ${key}`,
                quickFix: 'enlarge-font',
              },
            ));
          }
        }
      }
    }

    // Check children recursively
    if (block.children) {
      checkFontTooSmall(pageIndex, page, block.children, issues);
    }
  }

  // ── Check legacy element font sizes ────────────────────────
  for (const el of page.elements ?? []) {
    if (el.fontSize && el.fontSize < FONT_MINIMUMS.body) {
      issues.push(makeIssue(
        pageIndex, 'error', 'font-too-small',
        `Font ${el.fontSize}px terlalu kecil (minimal ${FONT_MINIMUMS.body}px).`,
        { quickFix: 'enlarge-font' },
      ));
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// CHECK 5: Warna Tidak Konsisten
// ═══════════════════════════════════════════════════════════════════

function checkColorConsistency(
  pageIndex: number,
  page: CanvaPage,
  blocks: SchemaBlock[],
  issues: TemplateHealthIssue[],
): void {
  // Collect all unique hex colors across all blocks
  const allColors = new Set<string>();
  for (const block of blocks) {
    for (const color of extractBlockColors(block)) {
      allColors.add(color);
    }
  }

  // Also check page-level colors
  if (page.bgColor && /^#[0-9a-fA-F]{3,8}$/.test(page.bgColor)) {
    allColors.add(page.bgColor.toLowerCase());
  }
  if (page.colorPalette?.colors) {
    for (const color of page.colorPalette.colors) {
      if (/^#[0-9a-fA-F]{3,8}$/.test(color)) {
        allColors.add(color.toLowerCase());
      }
    }
  }

  // Reduce to "color families" (normalize to 6-char hex)
  const colorFamilies = new Set<string>();
  for (const color of allColors) {
    // Normalize to first 6 hex chars (ignore alpha)
    const normalized = color.replace(/[^0-9a-f]/g, '').slice(0, 6).toLowerCase();
    if (normalized.length >= 6) {
      colorFamilies.add(normalized);
    }
  }

  // More than 6 distinct color families = "warna liar"
  if (colorFamilies.size > 6) {
    issues.push(makeIssue(
      pageIndex, 'warning', 'too-many-colors',
      `Halaman menggunakan ${colorFamilies.size} warna berbeda. Harus hanya: 1 background, 1 surface, 1 teks, 1 aksen, 1 feedback.`,
      {
        detail: `Distinct colors: ${colorFamilies.size}`,
        quickFix: 'fix-colors',
      },
    ));
  }

  // Check if template has accent color from contract
  if (page.contractId && blocks.length > 0) {
    const accentTokens = new Set<string>();
    for (const block of blocks) {
      const b = block as Record<string, unknown>;
      if ('accentColor' in b && typeof b.accentColor === 'string') {
        accentTokens.add(b.accentColor as string);
      }
      if ('borderColor' in b && typeof b.borderColor === 'string') {
        const bc = b.borderColor as string;
        if (!/^#[0-9a-fA-F]/.test(bc)) {
          accentTokens.add(bc);
        }
      }
    }
    if (accentTokens.size > 1) {
      issues.push(makeIssue(
        pageIndex, 'warning', 'too-many-colors',
        `Halaman menggunakan ${accentTokens.size} token aksen berbeda (${[...accentTokens].join(', ')}). Contract mengharuskan 1 aksen per page.`,
        { quickFix: 'fix-colors' },
      ));
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// CHECK 6: Placeholder Text
// ═══════════════════════════════════════════════════════════════════

function checkPlaceholderText(
  pageIndex: number,
  blocks: SchemaBlock[],
  issues: TemplateHealthIssue[],
): void {
  for (const block of blocks) {
    const texts = extractBlockTexts(block);
    for (const text of texts) {
      for (const pattern of PLACEHOLDER_PATTERNS) {
        if (pattern.test(text)) {
          issues.push(makeIssue(
            pageIndex, 'error', 'placeholder-text',
            `Block '${block.type}' masih punya teks placeholder: "${text.slice(0, 60)}${text.length > 60 ? '...' : ''}". Ganti dengan konten asli.`,
            {
              blockType: block.type,
              blockId: block.id,
              detail: `Pattern: ${pattern.source}`,
              quickFix: 'remove-placeholder',
            },
          ));
          break; // One match per block is enough
        }
      }
    }

    // Check children
    if (block.children) {
      checkPlaceholderText(pageIndex, block.children, issues);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// CHECK 7: Navigasi
// ═══════════════════════════════════════════════════════════════════

function checkNavigation(
  pages: CanvaPage[],
  issues: TemplateHealthIssue[],
): void {
  if (pages.length < 2) return; // Single page = no navigation needed

  // ── First page should be cover/intro ───────────────────────
  const firstPage = pages[0]!;
  const firstType = firstPage.templateType || 'custom';
  if (firstType !== 'cover' && firstType !== 'hero' && firstType !== 'petunjuk' && firstType !== 'custom') {
    issues.push(makeIssue(
      0, 'warning', 'missing-navigation',
      `Halaman pertama sebaiknya cover/petunjuk, bukan '${firstType}'. Pembelajaran butuh pembuka.`,
      { quickFix: 'fix-navigation' },
    ));
  }

  // ── Last page should be penutup/rangkuman/hasil ────────────
  const lastPage = pages[pages.length - 1]!;
  const lastType = lastPage.templateType || 'custom';
  if (lastType !== 'penutup' && lastType !== 'rangkuman' && lastType !== 'hasil' && lastType !== 'custom') {
    issues.push(makeIssue(
      pages.length - 1, 'warning', 'missing-navigation',
      `Halaman terakhir sebaiknya penutup/rangkuman, bukan '${lastType}'. Pembelajaran butuh penutup.`,
      { quickFix: 'fix-navigation' },
    ));
  }

  // ── Quiz/game pages should have navigation lock ────────────
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]!;
    const contract = getPageContract(page.templateType || 'custom');

    if (contract.navigationLock.enabled && contract.requireCompletion) {
      // This page SHOULD lock navigation. Verify it's not the last page
      // (can't lock on last page — there's nowhere to go)
      if (i === pages.length - 1 && contract.navigationLock.enabled) {
        issues.push(makeIssue(
          i, 'warning', 'broken-completion',
          `Halaman terakhir punya navigation lock, tapi tidak ada halaman berikutnya. Lock tidak berguna di halaman akhir.`,
          { quickFix: 'fix-navigation' },
        ));
      }
    }
  }

  // ── Check nav config ───────────────────────────────────────
  const pagesWithoutNav = pages.filter(p => p.templateType !== 'cover' && !p.navConfig?.showNavbar);
  if (pagesWithoutNav.length > pages.length / 2) {
    issues.push(makeIssue(
      0, 'warning', 'missing-navigation',
      `Lebih dari setengah halaman tidak menampilkan navbar. Siswa bisa bingung navigasi.`,
      { quickFix: 'fix-navigation' },
    ));
  }
}

// ═══════════════════════════════════════════════════════════════════
// CHECK 8: Interaksi
// ═══════════════════════════════════════════════════════════════════

function checkInteraction(
  pageIndex: number,
  page: CanvaPage,
  blocks: SchemaBlock[],
  issues: TemplateHealthIssue[],
): void {
  const templateType = page.templateType || 'custom';
  const contract = getPageContract(templateType);

  // Only check interactive pages
  if (!isInteractiveCompletion(contract)) return;

  for (const block of blocks) {
    const b = block as Record<string, unknown>;

    // ── Kuis: harus ada feedback ─────────────────────────────
    if (block.type === 'kuis') {
      const questions = b.questions as Array<Record<string, unknown>> | undefined;
      if (questions && questions.length > 0) {
        for (const q of questions) {
          // Check if question has feedback/explanation
          const hasFeedback = !!(q.feedback || q.explanation || q.explain);
          const options = q.options as Array<Record<string, unknown>> | undefined;
          const hasCorrectAnswer = options?.some(o => o.correct || o.isCorrect);

          if (!hasFeedback && !hasCorrectAnswer) {
            issues.push(makeIssue(
              pageIndex, 'warning', 'missing-feedback',
              `Soal kuis tidak punya feedback atau jawaban benar. Siswa tidak tahu apakah jawabannya benar.`,
              {
                blockType: 'kuis',
                blockId: block.id,
                quickFix: 'add-feedback',
              },
            ));
          }
        }
      }
    }

    // ── Game: harus punya skor/status selesai ────────────────
    if (block.type.includes('game') || block.type.includes('sortir') || block.type.includes('memory') ||
        block.type.includes('matching') || block.type.includes('drag-drop') || block.type.includes('crossword') ||
        block.type.includes('word-search') || block.type.includes('fill-blank') || block.type.includes('roda') ||
        block.type.includes('team-buzzer')) {
      // Game blocks should be interactive
      if (!block.interactive) {
        issues.push(makeIssue(
          pageIndex, 'warning', 'missing-feedback',
          `Game block '${block.type}' tidak ditandai sebagai interaktif. Siswa mungkin tidak bisa bermain.`,
          {
            blockType: block.type,
            blockId: block.id,
            quickFix: 'add-feedback',
          },
        ));
      }
    }

    // ── Refleksi: harus ada tempat jawaban ───────────────────
    if (block.type === 'refleksi') {
      // Refleksi should at least have a question
      const hasQuestion = !!(b.question || b.title || b.hookQuestion);
      if (!hasQuestion) {
        issues.push(makeIssue(
          pageIndex, 'warning', 'missing-feedback',
          `Refleksi tidak punya pertanyaan. Siswa tidak tahu apa yang harus direfleksikan.`,
          {
            blockType: 'refleksi',
            blockId: block.id,
            quickFix: 'add-feedback',
          },
        ));
      }
    }

    // ── Diskusi: harus ada pertanyaan ────────────────────────
    if (block.type === 'diskusi') {
      const hasQuestion = !!(b.question || b.title || b.items);
      if (!hasQuestion) {
        issues.push(makeIssue(
          pageIndex, 'warning', 'missing-feedback',
          `Diskusi tidak punya pertanyaan. Siswa tidak tahu apa yang didiskusikan.`,
          {
            blockType: 'diskusi',
            blockId: block.id,
            quickFix: 'add-feedback',
          },
        ));
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// CHECK 9: Score & Completion Sync
// ═══════════════════════════════════════════════════════════════════

function checkScoreCompletionSync(
  pages: CanvaPage[],
  issues: TemplateHealthIssue[],
): void {
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]!;
    const templateType = page.templateType || 'custom';
    const contract = getPageContract(templateType);
    const blocks = page.schema?.blocks ?? [];

    // ── Scoring enabled but no score-producing block ──────────
    if (contract.scoring.enabled) {
      const hasScoreBlock = blocks.some(b =>
        b.type === 'kuis' ||
        b.type.includes('game') ||
        b.type.includes('sortir') ||
        b.type.includes('memory') ||
        b.type.includes('matching') ||
        b.type.includes('drag-drop') ||
        b.type.includes('crossword') ||
        b.type.includes('word-search') ||
        b.type.includes('fill-blank') ||
        b.type.includes('roda') ||
        b.type.includes('team-buzzer')
      );

      if (!hasScoreBlock && blocks.length > 0) {
        issues.push(makeIssue(
          i, 'warning', 'broken-score',
          `Halaman '${templateType}' seharusnya menghasilkan skor, tapi tidak ada block kuis/game. Score tidak naik.`,
          { quickFix: 'fix-score-sync' },
        ));
      }
    }

    // ── Navigation lock but no interactive block ─────────────
    if (contract.navigationLock.enabled && contract.requireCompletion) {
      const hasInteractiveBlock = blocks.some(b =>
        b.interactive ||
        b.type === 'kuis' ||
        b.type === 'refleksi' ||
        b.type === 'diskusi' ||
        b.type.includes('game')
      );

      if (!hasInteractiveBlock && blocks.length > 0) {
        issues.push(makeIssue(
          i, 'error', 'broken-completion',
          `Halaman '${templateType}' punya navigation lock, tapi tidak ada block interaktif. Lock tidak bisa dibuka.`,
          { quickFix: 'fix-score-sync' },
        ));
      }
    }

    // ── Score-producing block but scoring disabled ────────────
    if (!contract.scoring.enabled) {
      const hasScoreBlock = blocks.some(b =>
        b.type === 'kuis' ||
        b.type.includes('game')
      );
      if (hasScoreBlock) {
        issues.push(makeIssue(
          i, 'warning', 'broken-score',
          `Halaman punya block kuis/game, tapi scoring tidak aktif. Skor tidak tercatat.`,
          { quickFix: 'fix-score-sync' },
        ));
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// CHECK 10: Narrative Coherence
// ═══════════════════════════════════════════════════════════════════

function checkNarrativeCoherence(
  pages: CanvaPage[],
  issues: TemplateHealthIssue[],
): void {
  if (pages.length < 3) return; // Too few pages for narrative check

  // Derive scene types from pages
  const sceneTypes: SceneType[] = pages.map(page => {
    const schema = page.schema;
    if (schema?.sceneType) return schema.sceneType;
    const primaryBlock = schema?.blocks?.[0];
    return inferSceneType(undefined, page.templateType || undefined, primaryBlock?.type);
  });

  // Validate narrative arc
  const narrativeWarnings = validateNarrativeArc(sceneTypes);

  for (const warning of narrativeWarnings) {
    // Assign to first page as a cross-page issue
    issues.push(makeIssue(
      0, 'warning', 'narrative-incoherent',
      `Alur naratif: ${warning}`,
      { detail: `Scenes: ${sceneTypes.join(' → ')}` },
    ));
  }

  // Check for back-to-back same type (3+ same scenes in a row)
  let sameCount = 1;
  for (let i = 1; i < sceneTypes.length; i++) {
    if (sceneTypes[i] === sceneTypes[i - 1]) {
      sameCount++;
    } else {
      if (sameCount >= 3) {
        issues.push(makeIssue(
          i - sameCount, 'info', 'narrative-incoherent',
          `${sameCount} halaman berturut-turut dengan tipe scene sama ('${sceneTypes[i - 1]}'). Pertimbangkan variasi.`,
        ));
      }
      sameCount = 1;
    }
  }
  if (sameCount >= 3) {
    issues.push(makeIssue(
      sceneTypes.length - sameCount, 'info', 'narrative-incoherent',
      `${sameCount} halaman berturut-turut dengan tipe scene sama ('${sceneTypes[sceneTypes.length - 1]}'). Pertimbangkan variasi.`,
    ));
  }
}

// ═══════════════════════════════════════════════════════════════════
// SCORE COMPUTATION
// ═══════════════════════════════════════════════════════════════════

function computeBreakdown(issues: TemplateHealthIssue[]): HealthScoreBreakdown {
  const errorWeight = 1;
  const warningWeight = 0.5;

  function areaScore(max: number, issueTypes: TemplateHealthIssue['type'][]): { score: number; max: number; issues: number } {
    const matching = issues.filter(i => issueTypes.includes(i.type));
    const issueCount = matching.length;
    const errorCount = matching.filter(i => i.severity === 'error').length;
    const warningCount = matching.filter(i => i.severity === 'warning').length;

    const penalty = (errorCount * errorWeight + warningCount * warningWeight);
    const score = Math.max(0, max - (penalty / Math.max(1, issueCount + 1)) * max);

    return {
      score: Math.round(score * 10) / 10,
      max,
      issues: issueCount,
    };
  }

  return {
    noOverlap: areaScore(20, ['overlap']),
    noOverflow: areaScore(20, ['overflow']),
    fontReadable: areaScore(15, ['font-too-small']),
    oneFocusPerPage: areaScore(15, ['too-many-blocks']),
    colorConsistent: areaScore(10, ['too-many-colors', 'hardcoded-color']),
    navigationWorking: areaScore(10, ['missing-navigation', 'narrative-incoherent']),
    interactionWorking: areaScore(10, ['missing-feedback', 'broken-score', 'broken-completion']),
  };
}

function emptyBreakdown(): HealthScoreBreakdown {
  return {
    noOverlap: { score: 0, max: 20, issues: 0 },
    noOverflow: { score: 0, max: 20, issues: 0 },
    fontReadable: { score: 0, max: 15, issues: 0 },
    oneFocusPerPage: { score: 0, max: 15, issues: 0 },
    colorConsistent: { score: 0, max: 10, issues: 0 },
    navigationWorking: { score: 0, max: 10, issues: 0 },
    interactionWorking: { score: 0, max: 10, issues: 0 },
  };
}

// ═══════════════════════════════════════════════════════════════════
// CONVENIENCE: validateCurrentPage()
// ═══════════════════════════════════════════════════════════════════

/**
 * Validate a single page (for quick per-page validation).
 * Returns issues only for that page, with a simplified score.
 */
export function validateSinglePage(page: CanvaPage, pageIndex: number): TemplateHealthIssue[] {
  const issues: TemplateHealthIssue[] = [];
  const blocks = page.schema?.blocks ?? [];
  const isSchemaDriven = !!page.schema;

  checkOneFocusPerPage(pageIndex, page, blocks, issues);
  if (isSchemaDriven) {
    checkOverlapSchema(pageIndex, blocks, issues);
    checkOverflowSchema(pageIndex, blocks, issues);
  } else {
    checkOverlapElements(pageIndex, page, issues);
    checkOverflowElements(pageIndex, page, issues);
  }
  checkFontTooSmall(pageIndex, page, blocks, issues);
  checkColorConsistency(pageIndex, page, blocks, issues);
  checkPlaceholderText(pageIndex, blocks, issues);
  checkInteraction(pageIndex, page, blocks, issues);

  return issues;
}
