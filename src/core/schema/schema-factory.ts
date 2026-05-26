// ═══════════════════════════════════════════════════════════════════
// SCHEMA FACTORY — Create populated ScreenSchema from template types
// ═══════════════════════════════════════════════════════════════════
// This is the CORRECT bridge between template selection and schema
// creation. It bypasses the TemplateAdapter (deprecated) and creates
// schemas directly using BLOCK_DEFINITIONS.createDefault().
//
// OLD (BROKEN) PIPELINE:
//   createProjectFromTemplate()
//     → createPageFromPreset()
//       → ensurePageSchema()
//         → TemplateAdapter.convertToSchema(page)
//           → reads page.templateData (EMPTY!) → hollow output
//
// NEW (FIXED) PIPELINE:
//   createProjectFromTemplate()
//     → createDefaultSchemaForTemplateType()
//       → BLOCK_DEFINITIONS[type].createDefault() → populated blocks
//       → inject metadata → rich output
//
// DESIGN PRINCIPLES:
//   1. ONE system — uses BlockDefinitionRegistry as single source of truth
//   2. No TemplateAdapter — direct schema creation
//   3. Default content is MEANINGFUL — not empty placeholders
//   4. Metadata injection — cover/penutup get project metadata
// ═══════════════════════════════════════════════════════════════════

import type { ScreenSchema, SchemaBlock, CoverBlock, PenutupBlock } from './types';
import { BLOCK_DEFINITIONS } from '../registry/BlockDefinitionRegistry';
import { generateBlockId, generatePageId } from './ensure-schema';
import { TEMPLATE_TO_SCENE } from '../edu/education-scene-types';
import type { SceneType } from '../edu/education-scene-types';

// ── Section Labels & Colors (mirrors TemplateAdapter) ─────────────

const SECTION_LABELS: Record<string, string> = {
  cover: 'Cover',
  petunjuk: 'Petunjuk',
  dokumen: 'Dokumen',
  tujuan: 'Tujuan',
  motivasi: 'Motivasi',
  skenario: 'Skenario',
  materi: 'Materi',
  diskusi: 'Diskusi',
  kuis: 'Kuis',
  game: 'Game',
  hasil: 'Hasil',
  refleksi: 'Refleksi',
  rangkuman: 'Rangkuman',
  penutup: 'Penutup',
  hero: 'Hero',
};

const SECTION_COLORS: Record<string, string> = {
  cover: 'y',
  petunjuk: 'c',
  dokumen: 'c',
  tujuan: 'c',
  motivasi: 'y',
  skenario: 'p',
  materi: 'p',
  diskusi: 'c',
  kuis: 'y',
  game: 'c',
  hasil: 'g',
  refleksi: 'p',
  rangkuman: 'g',
  penutup: 'o',
  hero: 'o',
};

// ── Block Type Mapping: templateType → suggested block types ──────
// This replaces the per-type converters in TemplateAdapter.
// Each template type maps to 1-N block types that should be created.

const TEMPLATE_BLOCK_MAP: Record<string, string[]> = {
  cover: ['cover'],
  petunjuk: ['petunjuk'],
  dokumen: ['tujuan-display'],
  tujuan: ['tujuan-display'],
  motivasi: ['motivasi'],
  hero: ['hero'],
  materi: ['materi-section'],
  skenario: ['skenario'],
  diskusi: ['diskusi'],
  kuis: ['kuis'],
  game: ['sortir-game'],
  hasil: ['hasil'],
  refleksi: ['refleksi'],
  rangkuman: ['rangkuman'],
  penutup: ['penutup'],
};

// ═══════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════

/**
 * Metadata for project creation (title, teacher, school).
 * Injected into cover and penutup blocks.
 */
export interface ProjectCreationMetadata {
  title: string;
  guru?: string;
  sekolah?: string;
  mapel?: string;
  kelas?: string;
}

/**
 * Create a populated ScreenSchema for a template type.
 *
 * This is the Schema Factory Bridge — it creates schemas with DEFAULT
 * content using BLOCK_DEFINITIONS.createDefault(), bypassing the
 * deprecated TemplateAdapter entirely.
 *
 * @param templateType - The page template type (cover, materi, kuis, etc.)
 * @param metadata - Project metadata for cover/penutup injection
 * @param suggestedBlocks - Override block types (from CourseTemplate scenes)
 * @param variant - Layout variant (A/B/C)
 * @returns ScreenSchema with populated blocks
 */
export function createDefaultSchemaForTemplateType(
  templateType: string,
  metadata?: ProjectCreationMetadata,
  suggestedBlocks?: string[],
  variant: 'A' | 'B' | 'C' = 'A',
): ScreenSchema {
  const pageId = generatePageId();

  // Determine which block types to create
  const blockTypes = suggestedBlocks?.length
    ? suggestedBlocks
    : (TEMPLATE_BLOCK_MAP[templateType] ?? ['def-box']);

  // Create each block using registry's createDefault()
  const blocks: SchemaBlock[] = blockTypes
    .map(blockType => createBlockFromRegistry(blockType, variant))
    .filter((b): b is SchemaBlock => b !== null);

  // Inject metadata into cover block
  if (templateType === 'cover' && metadata) {
    const coverIdx = blocks.findIndex(b => b.type === 'cover');
    if (coverIdx >= 0) {
      blocks[coverIdx] = injectCoverMetadata(blocks[coverIdx] as CoverBlock, metadata);
    }
  }

  // Inject metadata into penutup block
  if (templateType === 'penutup' && metadata) {
    const penutupIdx = blocks.findIndex(b => b.type === 'penutup');
    if (penutupIdx >= 0) {
      blocks[penutupIdx] = injectPenutupMetadata(blocks[penutupIdx] as PenutupBlock, metadata);
    }
  }

  // Resolve scene type
  const sceneType: SceneType = TEMPLATE_TO_SCENE[templateType] ?? 'concept';

  return {
    id: pageId,
    version: 1,
    templateType,
    sectionLabel: SECTION_LABELS[templateType],
    sectionColor: SECTION_COLORS[templateType],
    sceneType,
    blocks,
    background: (templateType === 'cover' || templateType === 'hero') ? {
      type: 'radial' as const,
      color1: 'y',
      color2: 'bg',
    } : undefined,
    nav: {},
  };
}

// ═══════════════════════════════════════════════════════════════════
// INTERNAL HELPERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Create a single block using the registry's createDefault().
 * Returns null if the block type is not registered.
 */
function createBlockFromRegistry(blockType: string, variant: 'A' | 'B' | 'C'): SchemaBlock | null {
  const definition = BLOCK_DEFINITIONS[blockType];
  if (!definition) {
    console.warn(`[SchemaFactory] Block type "${blockType}" not found in registry — skipping`);
    return null;
  }

  // Build the block with registry defaults
  const block: Record<string, unknown> = {
    id: generateBlockId(),
    type: blockType,
    variant,
    layout: {
      position: definition.defaultLayout.position,
      ...(definition.defaultLayout.defaultX != null ? { x: definition.defaultLayout.defaultX } : {}),
      ...(definition.defaultLayout.defaultY != null ? { y: definition.defaultLayout.defaultY } : {}),
      ...(definition.defaultLayout.defaultWidth != null ? { width: definition.defaultLayout.defaultWidth } : {}),
      ...(definition.defaultLayout.defaultHeight != null ? { height: definition.defaultLayout.defaultHeight } : {}),
    },
  };

  // Merge createDefault() content
  const defaultContent = definition.createDefault?.() ?? { title: definition.name };
  Object.assign(block, defaultContent);

  return block as unknown as SchemaBlock;
}

/**
 * Inject project metadata into a CoverBlock.
 * Sets title, badges (mapel/kelas), meta (guru/sekolah).
 */
function injectCoverMetadata(block: CoverBlock, meta: ProjectCreationMetadata): CoverBlock {
  return {
    ...block,
    title: meta.title || block.title,
    subtitle: meta.mapel || block.subtitle,
    badges: [
      ...(meta.mapel || meta.kelas ? [{
        icon: '📚' as const,
        text: `${meta.mapel || ''}${meta.kelas ? ` \u2022 Kelas ${meta.kelas}` : ''}`,
        color: 'y' as const,
      }] : []),
      ...(block.badges?.filter(b => !b.text.includes('Kelas')) || []),
    ],
    meta: {
      durasi: block.meta?.durasi || '',
      fase: meta.kelas ? `Kelas ${meta.kelas}` : (block.meta?.fase || ''),
      elemen: meta.guru || block.meta?.elemen || '',
    },
  };
}

/**
 * Inject project metadata into a PenutupBlock.
 * Sets subtitle with project title.
 */
function injectPenutupMetadata(block: PenutupBlock, meta: ProjectCreationMetadata): PenutupBlock {
  return {
    ...block,
    subtitle: meta.title ? `Terima kasih \u2014 ${meta.title}` : block.subtitle,
  };
}
