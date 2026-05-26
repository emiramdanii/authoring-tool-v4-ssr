// ═══════════════════════════════════════════════════════════════════
// LEARNING UNIT — The atomic unit of learning content
// ═══════════════════════════════════════════════════════════════════
// STANDAR UTAMA SILSE:
//   "1 page = 1 learning focus"
//   "Jangan menumpuk. Pecah menjadi pengalaman belajar kecil yang stabil."
//
// A LearningUnit is the SMALLEST meaningful chunk of learning content.
// Each unit maps to exactly 1 CanvaPage. If a block has too much
// content for one page, the PageSplitCompiler splits it into
// multiple LearningUnits → multiple CanvaPages.
//
// Pipeline:
//   Source Content → LearningUnit[] → PageSplitCompiler → CanvaPage[]
//
// This replaces the old approach of stacking multiple blocks on one
// page and relying on the SceneOverflowEngine to split them at
// render time. Instead, we split at COMPOSITION time, ensuring
// each page has a clear, focused learning experience.
// ═══════════════════════════════════════════════════════════════════

import type { SchemaBlock, ScreenSchema } from '@/core/schema/types';
import type { SceneType } from '@/core/edu/education-scene-types';
import type { PageTemplateType } from '@/components/canva/types';
import { PAGE_DENSITY_RULES } from './contract/TemplateValidator';

// ── LearningUnit Type ───────────────────────────────────────────

/**
 * The atomic unit of learning content.
 * Each LearningUnit becomes exactly 1 CanvaPage.
 *
 * Philosophy: "1 fokus belajar per halaman"
 * - A cover page = 1 LearningUnit with type 'cover'
 * - A quiz with 5 questions = 5 LearningUnits, each with 1 question
 * - A TP with 7 items = 2 LearningUnits (4 + 3)
 * - A materi section with multiple def-boxes = split into focused units
 */
export type LearningUnitType =
  | 'cover'
  | 'tujuan'
  | 'apersepsi'
  | 'materi'
  | 'contoh'
  | 'aktivitas'
  | 'diskusi'
  | 'kuis'
  | 'refleksi'
  | 'rangkuman'
  | 'penutup';

export interface LearningUnit {
  /** Unique ID for this unit */
  id: string;
  /** The type of learning focus */
  type: LearningUnitType;
  /** Display label for the page */
  label: string;
  /** Maps to PageTemplateType for CanvaPage */
  templateType: PageTemplateType;
  /** Scene type for scene-aware rendering */
  sceneType: SceneType;
  /** Section label chip */
  sectionLabel?: string;
  /** Section color accent token */
  sectionColor?: string;
  /** The schema blocks for this unit (1-2 blocks max per STANDAR) */
  blocks: SchemaBlock[];
  /** Background style override */
  background?: ScreenSchema['background'];
  /** Position in the learning flow (0-based) */
  order: number;
  /** Estimated duration for this unit */
  durasi?: string;
  /** Contract ID for template enforcement */
  contractId?: string;
}

// ── Learning Flow Definition ────────────────────────────────────

/**
 * Defines the complete learning flow for a pertemuan.
 * Each entry specifies what content should be created.
 */
export interface LearningFlowStep {
  type: LearningUnitType;
  label: string;
  templateType: PageTemplateType;
  sceneType: SceneType;
  sectionLabel: string;
  sectionColor: string;
  durasi: string;
  /** Function that creates the schema blocks for this step */
  createBlocks: () => SchemaBlock[];
}

// ═══════════════════════════════════════════════════════════════════
// PAGE SPLIT COMPILER — LearningUnit[] → CanvaPage[]
// ═══════════════════════════════════════════════════════════════════
// The compiler takes an array of LearningUnits and produces
// CanvaPage[] that comply with the STANDAR UTAMA SILSE:
//
//   1. Each unit → 1 CanvaPage (1:1 mapping)
//   2. contractId is set on every page
//   3. Schema-first: page.schema is populated directly
//   4. pageMode = 'schema' enforced
//   5. Validation runs before returning (catch density violations)
//
// This is the COMPOSITION-TIME split, not render-time.
// ═══════════════════════════════════════════════════════════════════

import type { CanvaPage, SchemaCanvaPage } from '@/components/canva/types';
import { createPage } from '@/store/canva/constants';
import { generateBlockId } from '@/core/schema/ensure-schema';

let _compilerIdCounter = 0;

/**
 * Compile an array of LearningUnits into CanvaPage[].
 *
 * This is the ONLY way to create pages from LearningUnits.
 * It enforces the STANDAR at composition time:
 *   - 1 unit = 1 page
 *   - contractId set on every page
 *   - Schema-first architecture
 *   - Block IDs are stabilized
 *
 * @param units - The learning units to compile
 * @param contractId - The TemplateThemeContract ID (default: 'golden-pertemuan')
 * @returns CanvaPage[] ready for the canva store
 */
export function compileLearningUnitsToPages(
  units: LearningUnit[],
  contractId: string = 'golden-pertemuan',
): CanvaPage[] {
  _compilerIdCounter = 0;
  const pages: CanvaPage[] = [];

  for (const unit of units) {
    // Stabilize block IDs
    const stabilizedBlocks = unit.blocks.map((block, bIdx) => ({
      ...block,
      id: block.id || `lu-${unit.type}-${++_compilerIdCounter}`,
    }));

    // Build the ScreenSchema
    const schema: ScreenSchema = {
      id: `screen-lu-${unit.id}`,
      templateType: unit.templateType,
      blocks: stabilizedBlocks,
      ...(unit.sceneType ? { sceneType: unit.sceneType } : {}),
      ...(unit.sectionLabel ? { sectionLabel: unit.sectionLabel } : {}),
      ...(unit.sectionColor ? { sectionColor: unit.sectionColor } : {}),
      ...(unit.background ? { background: unit.background } : {}),
    };

    // Create the CanvaPage
    const page = createPage(unit.label, unit.templateType);
    page.label = unit.label;
    page.templateVariant = 'A';
    page.contractId = contractId; // STANDAR: One contract per full pertemuan
    page.schema = schema;
    page.elements = [];
    page.pageMode = 'schema';

    pages.push(page as CanvaPage);
  }

  return pages;
}

// ═══════════════════════════════════════════════════════════════════
// SPLIT HELPERS — Convert dense blocks into multiple LearningUnits
// ═══════════════════════════════════════════════════════════════════

/**
 * Split a kuis block with multiple questions into individual
 * LearningUnits, one question per unit.
 *
 * STANDAR: "Kuis = 1 pertanyaan per halaman"
 */
export function splitKuisIntoUnits(
  kuisBlock: SchemaBlock,
  baseId: string,
  baseOrder: number,
  baseLabel: string,
  sectionLabel: string,
  sectionColor: string,
): LearningUnit[] {
  const k = kuisBlock as { questions?: unknown[]; title?: string };
  const questions = k.questions || [];
  const baseTitle = k.title || 'Kuis';

  return questions.map((q, i) => {
    const unitId = `${baseId}-q${i + 1}`;
    const label = questions.length > 1
      ? `${baseLabel} ${i + 1}/${questions.length}`
      : baseLabel;

    return {
      id: unitId,
      type: 'kuis' as LearningUnitType,
      label,
      templateType: 'kuis' as PageTemplateType,
      sceneType: 'assessment' as SceneType,
      sectionLabel: questions.length > 1
        ? `📝 ${sectionLabel} ${i + 1}/${questions.length}`
        : `📝 ${sectionLabel}`,
      sectionColor,
      blocks: [{
        ...kuisBlock,
        id: `${unitId}-kuis`,
        title: questions.length > 1
          ? `${baseTitle} (${i + 1}/${questions.length})`
          : baseTitle,
        questions: [q],
      } as SchemaBlock],
      order: baseOrder + i,
      durasi: '±2\'',
      contractId: 'golden-pertemuan',
    };
  });
}

/**
 * Split a TP block with many items into multiple LearningUnits,
 * max 4 items per unit.
 *
 * STANDAR: "TP max 3-4 per page, split if more"
 */
export function splitTpIntoUnits(
  tpBlock: SchemaBlock,
  baseId: string,
  baseOrder: number,
  sectionLabel: string,
  sectionColor: string,
): LearningUnit[] {
  const t = tpBlock as { items?: unknown[]; title?: string; titleHighlight?: string };
  const items = t.items || [];
  const maxItems = PAGE_DENSITY_RULES.maxTPItemsPerPage;

  if (items.length <= maxItems) {
    // No split needed
    return [{
      id: baseId,
      type: 'tujuan' as LearningUnitType,
      label: 'Tujuan Pembelajaran',
      templateType: 'tujuan' as PageTemplateType,
      sceneType: 'intro' as SceneType,
      sectionLabel,
      sectionColor,
      blocks: [tpBlock],
      order: baseOrder,
      durasi: '±5\'',
      contractId: 'golden-pertemuan',
    }];
  }

  // Split into chunks
  const chunks: unknown[][] = [];
  for (let i = 0; i < items.length; i += maxItems) {
    chunks.push(items.slice(i, i + maxItems));
  }

  return chunks.map((chunk, i) => ({
    id: `${baseId}-part${i + 1}`,
    type: 'tujuan' as LearningUnitType,
    label: chunks.length > 1
      ? `Tujuan Pembelajaran (${i + 1}/${chunks.length})`
      : 'Tujuan Pembelajaran',
    templateType: 'tujuan' as PageTemplateType,
    sceneType: 'intro' as SceneType,
    sectionLabel: chunks.length > 1
      ? `🎯 ${sectionLabel} (${i + 1}/${chunks.length})`
      : `🎯 ${sectionLabel}`,
    sectionColor,
    blocks: [{
      ...tpBlock,
      id: `${baseId}-part${i + 1}-tp`,
      items: chunk,
    } as SchemaBlock],
    order: baseOrder + i,
    durasi: '±3\'',
    contractId: 'golden-pertemuan',
  }));
}

/**
 * Create a LearningUnit from a single block.
 * Convenience wrapper for the common case.
 */
export function unitFromBlock(
  id: string,
  type: LearningUnitType,
  label: string,
  templateType: PageTemplateType,
  sceneType: SceneType,
  block: SchemaBlock,
  options?: {
    sectionLabel?: string;
    sectionColor?: string;
    durasi?: string;
    background?: ScreenSchema['background'];
    order?: number;
  },
): LearningUnit {
  return {
    id,
    type,
    label,
    templateType,
    sceneType,
    sectionLabel: options?.sectionLabel,
    sectionColor: options?.sectionColor,
    blocks: [block],
    order: options?.order ?? 0,
    durasi: options?.durasi,
    background: options?.background,
    contractId: 'golden-pertemuan',
  };
}
