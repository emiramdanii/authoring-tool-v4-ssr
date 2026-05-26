// ═══════════════════════════════════════════════════════════════════
// TEMPLATE VALIDATOR — Pre-render validation for Full Pertemuan
// ═══════════════════════════════════════════════════════════════════
// Before a page is rendered, the validator checks it against the
// TemplateThemeContract. Any violations are flagged as warnings
// or errors that surface in the dev console / editor UI.
//
// Checks:
//   1. Content height overflow (> maxContentHeight)
//   2. Font size below minimum
//   3. Hardcoded colors (not from contract)
//   4. Too many active accent colors
//   5. Empty/placeholder content
//   6. Disallowed block types on a page
//   7. Too many blocks on a page
//   8. Absolute blocks outside canvas bounds
//
// Usage:
//   const result = validatePage(contract, pageSchema);
//   if (result.errors.length > 0) { ... handle ... }
// ═══════════════════════════════════════════════════════════════════

import type { TemplateThemeContract, PageLayoutContract } from './TemplateThemeContract';
import { getContractOrGolden } from './TemplateThemeContract';
import type { SchemaBlock } from '@/core/schema/types';
import { isFullPageBlockType } from '@/core/schema/capability-registry';

// Re-export for internal use — same as isFullPageBlockType
const isFullPageBlockTypeCheck = isFullPageBlockType;

// ── Types ──────────────────────────────────────────────────────

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  severity: ValidationSeverity;
  rule: string;
  message: string;
  pageType: string;
  blockType?: string;
  blockId?: string;
  detail?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  infos: ValidationIssue[];
  allIssues: ValidationIssue[];
}

// ── Validation Rules ───────────────────────────────────────────

function issue(
  severity: ValidationSeverity,
  rule: string,
  message: string,
  pageType: string,
  blockType?: string,
  blockId?: string,
  detail?: string,
): ValidationIssue {
  return { severity, rule, message, pageType, blockType, blockId, detail };
}

/**
 * Validate a page against the TemplateThemeContract.
 * Returns all issues found (errors, warnings, infos).
 */
export function validatePage(
  contract: TemplateThemeContract | undefined,
  pageType: string,
  blocks: SchemaBlock[],
  estimatedHeightPx?: number,
): ValidationResult {
  const c = contract || getContractOrGolden(undefined);
  const layout = c.pageLayouts[pageType] || c.pageLayouts['custom'];
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const infos: ValidationIssue[] = [];

  // ── Rule 1: Max blocks ─────────────────────────────────────
  if (layout && blocks.length > layout.maxBlocks) {
    warnings.push(issue(
      'warning',
      'max-blocks',
      `Page has ${blocks.length} blocks, but contract allows max ${layout.maxBlocks}. Consider splitting content.`,
      pageType,
      undefined, undefined,
      `Contract: ${layout.maxBlocks} blocks max for '${pageType}'`,
    ));
  }

  // ── Rule 2: Disallowed block types ─────────────────────────
  if (layout && layout.allowedBlockTypes.length > 0) {
    for (const block of blocks) {
      if (!layout.allowedBlockTypes.includes(block.type)) {
        warnings.push(issue(
          'warning',
          'disallowed-block',
          `Block type '${block.type}' is not recommended for page type '${pageType}'. Allowed: ${layout.allowedBlockTypes.join(', ')}`,
          pageType,
          block.type,
          block.id,
        ));
      }
    }
  }

  // ── Rule 3: Content height overflow ────────────────────────
  if (estimatedHeightPx && estimatedHeightPx > c.maxContentHeight) {
    const overflow = estimatedHeightPx - c.maxContentHeight;
    errors.push(issue(
      'error',
      'overflow',
      `Page content overflows by ${overflow}px. Estimated: ${estimatedHeightPx}px, max: ${c.maxContentHeight}px. Action: split required or enable compression.`,
      pageType,
      undefined, undefined,
      `Overflow: ${overflow}px`,
    ));
  }

  // ── Rule 4: Check blocks for issues ────────────────────────
  const usedAccentColors = new Set<string>();
  for (const block of blocks) {
    // Rule 4a: Check for empty/placeholder content
    checkEmptyContent(block, pageType, warnings);

    // Rule 4b: Check font size in block style
    checkFontSize(block, pageType, c, warnings);

    // Rule 4c: Track accent colors
    const blockAccent = (block as Record<string, unknown>).borderColor as string | undefined;
    if (blockAccent) {
      usedAccentColors.add(blockAccent);
    }
  }

  // ── Rule 5: Too many accent colors ─────────────────────────
  if (usedAccentColors.size > c.colors.maxAccents) {
    warnings.push(issue(
      'warning',
      'too-many-accents',
      `Page uses ${usedAccentColors.size} accent colors, but contract allows max ${c.colors.maxAccents}. Colors: ${[...usedAccentColors].join(', ')}`,
      pageType,
    ));
  }

  // ── Rule 6: Check absolute blocks ──────────────────────────
  for (const block of blocks) {
    if (block.layout?.position === 'absolute') {
      const { x, y, width, height } = block.layout;
      if ((x !== undefined && (x < 0 || x > 100)) ||
          (y !== undefined && (y < 0 || y > 100)) ||
          (typeof width === 'number' && (width < 0 || width > 100)) ||
          (typeof height === 'number' && (height < 0 || height > 100))) {
        errors.push(issue(
          'error',
          'absolute-oob',
          `Block '${block.type}' has absolute layout outside canvas bounds. x=${x}, y=${y}, w=${width}, h=${height}`,
          pageType,
          block.type,
          block.id,
        ));
      }
    }
  }

  // ── Rule 7: Cover page must be single block ────────────────
  // FIX 5: Elevated to ERROR — cover isolation is now enforced by
  // the layout engine. A cover page with multiple blocks will have
  // non-cover blocks hidden (height:0, isOverflowing:true).
  // This is the strongest possible warning — the user WILL see
  // broken output unless they split the page.
  if (pageType === 'cover' && blocks.length > 1) {
    const nonCoverTypes = blocks.filter(b => !isFullPageBlockTypeCheck(b.type));
    errors.push(issue(
      'error',
      'cover-multi-block',
      `Cover page has ${blocks.length} blocks but MUST have exactly 1. ` +
      `Non-cover blocks (${nonCoverTypes.map(b => b.type).join(', ')}) will be HIDDEN by cover isolation. ` +
      `Action: Split the page or remove extra blocks.`,
      pageType,
    ));
  }

  // ── Rule 8: TP block exceeding safe height ─────────────────
  // FIX 5: TP (Tujuan Pembelajaran) blocks with many items often
  // overflow the scene. Detect and warn early.
  const tpBlocks = blocks.filter(b => b.type === 'tp');
  for (const tp of tpBlocks) {
    const t = tp as { items?: unknown[] };
    const numItems = t.items?.length || 0;
    if (numItems > 5) {
      warnings.push(issue(
        'warning',
        'tp-overflow-risk',
        `TP block has ${numItems} items — likely to overflow. ` +
        `Consider splitting into 2 pages (max 4-5 items per TP).`,
        pageType,
        'tp',
        tp.id,
        `Items: ${numItems}, recommended max: 5`,
      ));
    }
  }

  // ── Rule 9: Materi section with empty content ──────────────
  // FIX 5: Empty materi-section is the #1 cause of "hollow output".
  // The schema factory should populate defaults, but if it fails,
  // this catches it before render.
  const materiBlocks = blocks.filter(b => b.type === 'materi-section');
  for (const ms of materiBlocks) {
    const m = ms as { content?: SchemaBlock[] };
    if (!m.content || m.content.length === 0) {
      errors.push(issue(
        'error',
        'empty-materi-section',
        `Materi section has no content blocks — this causes "hollow output". ` +
        `Action: Add content blocks (materi-blok, def-box, nc-grid) to the section.`,
        pageType,
        'materi-section',
        ms.id,
      ));
    }
  }

  // ── Rule 10: Multiple accent colors on same page ───────────
  // FIX 4+5: Contract should enforce ONE accent per page.
  // If blocks have different accentColor values, warn about inconsistency.
  const accentColors = new Set<string>();
  for (const block of blocks) {
    const b = block as Record<string, unknown>;
    if ('accentColor' in b && typeof b.accentColor === 'string') {
      accentColors.add(b.accentColor as string);
    }
    if ('borderColor' in b && typeof b.borderColor === 'string') {
      const bc = b.borderColor as string;
      // Only count token-based borderColors (not hex)
      if (!/^#[0-9a-fA-F]/.test(bc)) {
        accentColors.add(bc);
      }
    }
  }
  if (accentColors.size > 1) {
    warnings.push(issue(
      'warning',
      'multi-accent',
      `Page uses ${accentColors.size} different accent colors: ${[...accentColors].join(', ')}. ` +
      `Contract enforces ONE accent per page type. ` +
      `The tokens.resolveAccent() method will override to the contract's primary accent.`,
      pageType,
    ));
  }

  // ── Info: Density recommendation ────────────────────────────
  if (layout) {
    infos.push(issue(
      'info',
      'density',
      `Recommended density for '${pageType}': ${layout.density}. ${layout.canSplit ? 'Content can be split.' : 'Content must fit in one screen.'}`,
      pageType,
    ));
  }

  const allIssues = [...errors, ...warnings, ...infos];

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    infos,
    allIssues,
  };
}

/**
 * Validate all pages in a project against the contract.
 */
export function validateProject(
  contractId: string | undefined,
  pages: Array<{ templateType: string; blocks: SchemaBlock[]; estimatedHeightPx?: number }>,
): ValidationResult {
  const contract = getContractOrGolden(contractId);
  const allErrors: ValidationIssue[] = [];
  const allWarnings: ValidationIssue[] = [];
  const allInfos: ValidationIssue[] = [];

  for (const page of pages) {
    const result = validatePage(contract, page.templateType, page.blocks, page.estimatedHeightPx);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
    allInfos.push(...result.infos);
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    infos: allInfos,
    allIssues: [...allErrors, ...allWarnings, ...allInfos],
  };
}

// ── Internal helpers ────────────────────────────────────────────

function checkEmptyContent(
  block: SchemaBlock,
  pageType: string,
  warnings: ValidationIssue[],
): void {
  const b = block as Record<string, unknown>;

  // Check for empty title
  if ('title' in b && (!b.title || b.title === '')) {
    warnings.push(issue(
      'warning',
      'empty-content',
      `Block '${block.type}' has an empty title field.`,
      pageType,
      block.type,
      block.id,
    ));
  }

  // Check for empty content
  if ('content' in b && (!b.content || b.content === '')) {
    warnings.push(issue(
      'warning',
      'empty-content',
      `Block '${block.type}' has empty content.`,
      pageType,
      block.type,
      block.id,
    ));
  }

  // Check for empty items array
  if ('items' in b && Array.isArray(b.items) && b.items.length === 0) {
    warnings.push(issue(
      'warning',
      'empty-content',
      `Block '${block.type}' has no items.`,
      pageType,
      block.type,
      block.id,
    ));
  }

  // Check for empty questions
  if ('questions' in b && Array.isArray(b.questions) && b.questions.length === 0) {
    warnings.push(issue(
      'warning',
      'empty-content',
      `Block '${block.type}' has no questions.`,
      pageType,
      block.type,
      block.id,
    ));
  }
}

function checkFontSize(
  block: SchemaBlock,
  pageType: string,
  contract: TemplateThemeContract,
  warnings: ValidationIssue[],
): void {
  // Check block.style for font-size declarations
  if (block.style) {
    for (const [key, value] of Object.entries(block.style)) {
      if (key.includes('font-size') || key.includes('fontSize')) {
        const pxMatch = value.match(/(\d+(?:\.\d+)?)px/);
        if (pxMatch) {
          const size = parseFloat(pxMatch[1]!);
          if (size < contract.typography.minFontSize) {
            warnings.push(issue(
              'warning',
              'min-font-size',
              `Block '${block.type}' has font-size ${size}px which is below contract minimum ${contract.typography.minFontSize}px.`,
              pageType,
              block.type,
              block.id,
            ));
          }
        }
      }
    }
  }

  // ═══ CHECK FOR HARDCODED HEX COLORS ═══════════════════════════
  // Hardcoded hex colors bypass the contract's color system.
  // All colors should come from tokens (e.g., tokens.color('y'))
  // so that the contract can enforce consistency. Hardcoded colors
  // break the contract because they can't be overridden.
  if (block.style) {
    for (const [key, value] of Object.entries(block.style)) {
      if (typeof value === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(value)) {
        // Check if the hardcoded color matches any contract color
        const contractColors = [
          contract.colors.background,
          contract.colors.surface,
          contract.colors.card,
          contract.colors.text,
          contract.colors.muted,
          contract.colors.accent,
          contract.colors.accentBg,
          contract.colors.accentBorder,
        ];
        const isContractColor = contractColors.some(c =>
          c.toLowerCase().replace(/[^0-9a-f]/g, '').includes(
            value.toLowerCase().replace(/[^0-9a-f]/g, '').slice(0, 6),
          ),
        );
        if (!isContractColor) {
          warnings.push(issue(
            'warning',
            'hardcoded-color',
            `Block '${block.type}' has hardcoded color '${value}' in style.${key}. Use tokens.color() instead so contract can enforce consistency.`,
            pageType,
            block.type,
            block.id,
            `Hardcoded: ${value}`,
          ));
        }
      }
    }
  }

  // ═══ CHECK borderColor FIELD ═════════════════════════════════
  // The borderColor field on blocks should use token keys ('y', 'c', etc.)
  // not raw hex colors. Token keys are resolved through the contract.
  const b = block as Record<string, unknown>;
  if ('borderColor' in b && typeof b.borderColor === 'string') {
    const bc = b.borderColor as string;
    if (/^#[0-9a-fA-F]{3,8}$/.test(bc)) {
      warnings.push(issue(
        'warning',
        'hardcoded-border-color',
        `Block '${block.type}' has hardcoded borderColor '${bc}'. Use a token key ('y', 'c', 'g', 'p') instead.`,
        pageType,
        block.type,
        block.id,
        `Hardcoded borderColor: ${bc}`,
      ));
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// DEV CONSOLE HELPER — Format validation results for console.log
// ═══════════════════════════════════════════════════════════════════

export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];
  lines.push(`╔══ Template Validation ══════════════════╗`);
  lines.push(`║ Status: ${result.valid ? '✅ PASS' : '❌ FAIL'} (${result.errors.length} errors, ${result.warnings.length} warnings)`);

  for (const err of result.errors) {
    lines.push(`║ 🔴 [${err.rule}] ${err.message}`);
  }
  for (const warn of result.warnings) {
    lines.push(`║ 🟡 [${warn.rule}] ${warn.message}`);
  }

  lines.push(`╚════════════════════════════════════════╝`);
  return lines.join('\n');
}
