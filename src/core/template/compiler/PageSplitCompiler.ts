// PageSplitCompiler — Converts LearningUnit[] → CanvaPage[]
// Enforces STANDAR UTAMA SILSE density rules
// Key principle: "1 page = 1 learning focus"
// When a LearningUnit has too much content, it gets SPLIT into multiple pages

import type { CanvaPage, SchemaCanvaPage } from '@/components/canva/types';
import type { ScreenSchema, SchemaBlock } from '@/core/schema/types';
import type { SceneType } from '@/core/edu/education-scene-types';
import { createPage } from '@/store/canva/constants';
import type { LearningUnit, DensityCheckResult } from './LearningUnit';
import { PAGE_DENSITY_RULES } from './LearningUnit';

let _compilerIdCounter = 0;
function bid(): string {
  return `psc-${++_compilerIdCounter}`;
}

/**
 * Compile an array of LearningUnits into CanvaPages.
 * Each LearningUnit becomes at least 1 page.
 * If content exceeds density rules, the unit is split into multiple pages.
 */
export function compileLearningUnits(units: LearningUnit[]): CanvaPage[] {
  const pages: CanvaPage[] = [];

  for (const unit of units) {
    const compiledPages = compileUnit(unit);
    pages.push(...compiledPages);
  }

  return pages;
}

/**
 * Compile a single LearningUnit into one or more CanvaPages.
 * Enforces density rules by splitting when needed.
 */
function compileUnit(unit: LearningUnit): CanvaPage[] {
  // Check if this unit needs splitting
  const density = checkDensity(unit);

  if (density.passes) {
    // Fits in one page — compile directly
    return [makeSchemaPage(unit.label, unit.type, unit.blocks, unit.sceneType, unit.sectionLabel, unit.sectionColor, unit.contractId, unit.variant)];
  }

  // Needs splitting — apply type-specific split strategies
  return splitUnit(unit, density);
}

/**
 * Check if a LearningUnit's content fits within density rules.
 */
export function checkDensity(unit: LearningUnit): DensityCheckResult {
  const warnings: string[] = [];
  let wordCount = 0;
  let blockCount = unit.blocks.length;
  let accentColorCount = 0;
  let quizQuestionCount = 0;
  let tpItemCount = 0;

  // Count words, accent colors, quiz questions, TP items
  const accentColors = new Set<string>();

  for (const block of unit.blocks) {
    const b = block as Record<string, unknown>;

    // Track accent colors
    if ('accentColor' in b && typeof b.accentColor === 'string') accentColors.add(b.accentColor);
    if ('borderColor' in b && typeof b.borderColor === 'string') accentColors.add(b.borderColor);

    // Count quiz questions
    if (block.type === 'kuis') {
      const k = block as { questions?: unknown[] };
      quizQuestionCount += k.questions?.length || 0;
    }

    // Count TP items
    if (block.type === 'tp' || block.type === 'tujuan-display') {
      const t = block as { items?: unknown[]; objectives?: unknown[] };
      tpItemCount += (t.items?.length || 0) + (t.objectives?.length || 0);
    }

    // Count words (rough estimate)
    const textFields = ['title', 'subtitle', 'content', 'body', 'text', 'isi', 'intro'];
    for (const field of textFields) {
      if (field in b && typeof b[field] === 'string') {
        wordCount += (b[field] as string).replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length;
      }
    }
  }

  accentColorCount = accentColors.size;

  // Check rules
  if (wordCount > PAGE_DENSITY_RULES.maxWords) {
    warnings.push(`Word count ${wordCount} exceeds max ${PAGE_DENSITY_RULES.maxWords}`);
  }
  if (blockCount > PAGE_DENSITY_RULES.maxMainBlocks && unit.type !== 'materi') {
    warnings.push(`Block count ${blockCount} exceeds max ${PAGE_DENSITY_RULES.maxMainBlocks}`);
  }
  if (accentColorCount > PAGE_DENSITY_RULES.maxActiveColors) {
    warnings.push(`Accent colors ${accentColorCount} exceeds max ${PAGE_DENSITY_RULES.maxActiveColors}`);
  }
  if (quizQuestionCount > PAGE_DENSITY_RULES.maxQuizQuestionsPerPage) {
    warnings.push(`Quiz questions ${quizQuestionCount} exceeds max ${PAGE_DENSITY_RULES.maxQuizQuestionsPerPage}`);
  }
  if (tpItemCount > PAGE_DENSITY_RULES.maxTPItemsPerPage) {
    warnings.push(`TP items ${tpItemCount} exceeds max ${PAGE_DENSITY_RULES.maxTPItemsPerPage}`);
  }

  return {
    passes: warnings.length === 0,
    wordCount,
    blockCount,
    accentColorCount,
    quizQuestionCount,
    tpItemCount,
    warnings,
  };
}

/**
 * Split a LearningUnit that exceeds density rules.
 * Type-specific strategies ensure pedagogically sound splits.
 */
function splitUnit(unit: LearningUnit, density: DensityCheckResult): CanvaPage[] {
  const pages: CanvaPage[] = [];

  // Strategy 1: Quiz — 1 question per page
  if (unit.type === 'kuis' && density.quizQuestionCount > 1) {
    return splitQuizUnit(unit);
  }

  // Strategy 2: TP/Tujuan — max 4 items per page
  if ((unit.type === 'tujuan') && density.tpItemCount > PAGE_DENSITY_RULES.maxTPItemsPerPage) {
    return splitTujuanUnit(unit);
  }

  // Strategy 3: Cover — always exactly 1 page (never split)
  if (unit.type === 'cover') {
    return [makeSchemaPage(unit.label, unit.type, unit.blocks, unit.sceneType, unit.sectionLabel, unit.sectionColor, unit.contractId, unit.variant)];
  }

  // Default strategy: split blocks across pages, max 2 blocks per page
  const maxBlocks = PAGE_DENSITY_RULES.maxMainBlocks;
  for (let i = 0; i < unit.blocks.length; i += maxBlocks) {
    const chunk = unit.blocks.slice(i, i + maxBlocks);
    const pageLabel = unit.blocks.length > maxBlocks
      ? `${unit.label} (${Math.floor(i / maxBlocks) + 1})`
      : unit.label;
    pages.push(makeSchemaPage(pageLabel, unit.type, chunk, unit.sceneType, unit.sectionLabel, unit.sectionColor, unit.contractId, unit.variant));
  }

  return pages.length > 0 ? pages : [makeSchemaPage(unit.label, unit.type, unit.blocks, unit.sceneType, unit.sectionLabel, unit.sectionColor, unit.contractId, unit.variant)];
}

/** Split quiz: 1 question per page */
function splitQuizUnit(unit: LearningUnit): CanvaPage[] {
  const kuisBlock = unit.blocks.find(b => b.type === 'kuis');
  if (!kuisBlock) return [makeSchemaPage(unit.label, unit.type, unit.blocks, unit.sceneType, unit.sectionLabel, unit.sectionColor, unit.contractId, unit.variant)];

  const k = kuisBlock as { questions: unknown[]; title?: string; variant?: string };
  const questions = k.questions || [];
  const totalPages = questions.length;

  return questions.map((q, i) => {
    const splitKuis: SchemaBlock = {
      ...kuisBlock,
      id: `${kuisBlock.id || bid()}-q${i}`,
      type: 'kuis',
      title: k.title || 'Kuis',
      questions: [q],
    } as SchemaBlock;

    return makeSchemaPage(
      `Kuis ${i + 1}/${totalPages}`,
      unit.type,
      [splitKuis],
      unit.sceneType,
      `\uD83D\uDCDD Kuis ${i + 1}/${totalPages}`,
      unit.sectionColor || 'g',
      unit.contractId,
      unit.variant,
    );
  });
}

/** Split tujuan/TP: max 4 items per page */
function splitTujuanUnit(unit: LearningUnit): CanvaPage[] {
  const tpBlock = unit.blocks.find(b => b.type === 'tp' || b.type === 'tujuan-display');
  if (!tpBlock) return [makeSchemaPage(unit.label, unit.type, unit.blocks, unit.sceneType, unit.sectionLabel, unit.sectionColor, unit.contractId, unit.variant)];

  const t = tpBlock as { items?: unknown[]; objectives?: unknown[] };
  const items = t.items || t.objectives || [];
  const maxItems = PAGE_DENSITY_RULES.maxTPItemsPerPage;

  const pages: CanvaPage[] = [];
  for (let i = 0; i < items.length; i += maxItems) {
    const chunk = items.slice(i, i + maxItems);
    const splitTP: SchemaBlock = {
      ...tpBlock,
      id: `${tpBlock.id || bid()}-part${Math.floor(i / maxItems) + 1}`,
      ...(tpBlock.type === 'tp' ? { items: chunk } : { objectives: chunk }),
    } as SchemaBlock;

    pages.push(makeSchemaPage(
      `${unit.label} (${Math.floor(i / maxItems) + 1})`,
      unit.type,
      [splitTP],
      unit.sceneType,
      unit.sectionLabel,
      unit.sectionColor,
      unit.contractId,
      unit.variant,
    ));
  }

  return pages;
}

/** Create a schema-driven CanvaPage from LearningUnit data */
function makeSchemaPage(
  label: string,
  templateType: string,
  blocks: SchemaBlock[],
  sceneType?: SceneType,
  sectionLabel?: string,
  sectionColor?: string,
  contractId?: string,
  variant?: 'A' | 'B' | 'C',
): SchemaCanvaPage {
  const page = createPage(label, templateType as CanvaPage['templateType']);
  page.label = label;
  page.templateVariant = variant || 'A';
  page.contractId = contractId || 'golden-pertemuan';

  const schema: ScreenSchema = {
    id: `screen-${bid()}`,
    templateType,
    blocks,
    ...(sceneType ? { sceneType } : {}),
    ...(sectionLabel ? { sectionLabel } : {}),
    ...(sectionColor ? { sectionColor } : {}),
  };

  page.schema = schema;
  page.elements = [];
  page.pageMode = 'schema';
  return page as SchemaCanvaPage;
}
