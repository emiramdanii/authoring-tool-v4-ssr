// ═══════════════════════════════════════════════════════════════════
// PAGE PRESET REGISTRY — Metadata-driven page starting configurations
// ═══════════════════════════════════════════════════════════════════
// FASE 2: Templates become Presets.
//
// A Preset is a STARTING CONFIGURATION, not a structural constraint.
// After creation, users can freely add/remove/reorder any block.
// templateType = recommendation, not restriction.
//
// Design Principles:
//   1. Metadata-driven — UI renders from registry, not hardcoded arrays
//   2. Schema-native — create() produces ScreenSchema directly
//   3. Composable — any block can be added to any page
//   4. Stable IDs — nanoid(10) for all blocks from creation
//   5. One-way — Authoring → Schema → Canvas, never reverse
//
// FASE 3: Presets create schemas directly via ensurePageSchema().
// derive-schema.ts was removed — no more stub derivation.
// One-way data flow: Preset → Schema → Canvas

import type { ScreenSchema } from '../schema/types';
import type { CanvaPage, PageTemplateType } from '@/components/canva/types';
import { createDefaultSchemaForTemplateType } from '../schema/schema-factory';
import { getTemplateLabel, getTemplateExtraProps } from '@/store/canva/template-data';
import { populateTemplateElements } from '@/lib/canva-constants';
import { createPage, createElId } from '@/store/canva/constants';
import type { SceneType } from '../edu/education-scene-types';
import { TEMPLATE_TO_SCENE } from '../edu/education-scene-types';

// ── Preset Interface ──────────────────────────────────────────

export interface PagePreset {
  /** Unique preset ID — matches PageTemplateType for compat */
  id: PageTemplateType;
  /** Display label */
  label: string;
  /** Category for gallery filtering */
  category: 'utama' | 'konten' | 'interaktif' | 'penutup';
  /** Emoji icon */
  icon: string;
  /** Short description */
  description: string;
  /** Accent color for gallery card */
  color: string;
  /** Search/filter tags */
  tags: string[];
  /** Sort order within category (lower = first) */
  sortOrder: number;
  /**
   * Scene type — maps this preset to the 8 Learning Scene Types.
   * Enables the 6-layer design system (typography, atmosphere,
   * emotional profile, reveal strategy, accent prominence)
   * to adjust automatically when a page of this preset is rendered.
   *
   * If not set, resolved from TEMPLATE_TO_SCENE mapping.
   */
  sceneType: SceneType;
  /**
   * Factory: creates a ScreenSchema for this preset.
   * Reads from the authoring store to populate content.
   * Returns null for custom pages (no schema).
   */
  create: (context: PresetCreateContext) => ScreenSchema | null;
}

/**
 * Context passed to preset create() functions.
 * Provides all the data needed to construct a ScreenSchema.
 */
export interface PresetCreateContext {
  /** Page ID for the new page */
  pageId: string;
  /** Page label */
  label: string;
  /** Template variant */
  variant: 'A' | 'B' | 'C';
}

// ── Preset Definitions ────────────────────────────────────────

const PRESET_DEFINITIONS: Omit<PagePreset, 'create'>[] = [
  {
    id: 'cover',
    label: 'Cover',
    category: 'utama',
    icon: '\u{1F3E0}',
    description: 'Halaman judul & pembuka',
    color: '#f9c82e',
    tags: ['judul', 'pembuka', 'cover', 'awal'],
    sortOrder: 10,
    sceneType: 'intro',
  },
  {
    id: 'petunjuk',
    label: 'Petunjuk',
    category: 'utama',
    icon: '\u{1F4CC}',
    description: 'Cara menggunakan media',
    color: '#3ecfcf',
    tags: ['petunjuk', 'langkah', 'cara', 'panduan'],
    sortOrder: 20,
    sceneType: 'intro',
  },
  {
    id: 'dokumen',
    label: 'Dokumen',
    category: 'utama',
    icon: '\u{1F4CB}',
    description: 'CP, TP, ATP',
    color: '#3ecfcf',
    tags: ['dokumen', 'cp', 'tp', 'atp', 'tujuan'],
    sortOrder: 30,
    sceneType: 'intro',
  },
  {
    id: 'tujuan',
    label: 'Tujuan Pembelajaran',
    category: 'utama',
    icon: '🎯',
    description: 'Tujuan & Profil Pelajar Pancasila',
    color: 'blue',
    tags: ['bsnp', 'tujuan', 'tp', 'profil', 'pancasila'],
    sortOrder: 15,
    sceneType: 'intro',
  },
  {
    id: 'motivasi',
    label: 'Motivasi / Apersepsi',
    category: 'utama',
    icon: '💡',
    description: 'Pertanyaan pemicu & koneksi materi',
    color: 'amber',
    tags: ['bsnp', 'motivasi', 'apersepsi', 'hook'],
    sortOrder: 25,
    sceneType: 'intro',
  },
  {
    id: 'hero',
    label: 'Hero',
    category: 'konten',
    icon: '\u{1F680}',
    description: 'Banner dengan gradient',
    color: '#fb923c',
    tags: ['hero', 'banner', 'gradient', 'header'],
    sortOrder: 40,
    sceneType: 'intro',
  },
  {
    id: 'materi',
    label: 'Materi',
    category: 'konten',
    icon: '\u{1F4DD}',
    description: 'Konten pembelajaran',
    color: '#a78bfa',
    tags: ['materi', 'konten', 'definisi', 'poin', 'flashcard'],
    sortOrder: 50,
    sceneType: 'concept',
  },
  {
    id: 'skenario',
    label: 'Skenario',
    category: 'interaktif',
    icon: '\u{1F3AD}',
    description: 'Cerita interaktif pilihan',
    color: '#f472b6',
    tags: ['skenario', 'cerita', 'pilihan', 'interaktif'],
    sortOrder: 60,
    sceneType: 'example',
  },
  {
    id: 'diskusi',
    label: 'Diskusi',
    category: 'interaktif',
    icon: '\u{1F4AC}',
    description: 'Pertanyaan diskusi & tulis',
    color: '#34d399',
    tags: ['diskusi', 'pertanyaan', 'tulis', 'reflektif'],
    sortOrder: 70,
    sceneType: 'discussion',
  },
  {
    id: 'kuis',
    label: 'Kuis',
    category: 'interaktif',
    icon: '\u{2753}',
    description: 'Soal pilihan ganda',
    color: '#f5c842',
    tags: ['kuis', 'soal', 'pilihan ganda', 'evaluasi'],
    sortOrder: 80,
    sceneType: 'assessment',
  },
  {
    id: 'game',
    label: 'Game',
    category: 'interaktif',
    icon: '\u{1F3AE}',
    description: 'Game interaktif',
    color: '#3ecfcf',
    tags: ['game', 'sortir', 'roda', 'interaktif', 'permainan'],
    sortOrder: 90,
    sceneType: 'practice',
  },
  {
    id: 'hasil',
    label: 'Hasil',
    category: 'penutup',
    icon: '\u{1F3C6}',
    description: 'Skor & apresiasi',
    color: '#34d399',
    tags: ['hasil', 'skor', 'apresiasi', 'nilai'],
    sortOrder: 100,
    sceneType: 'assessment',
  },
  {
    id: 'refleksi',
    label: 'Refleksi',
    category: 'penutup',
    icon: '\u{1F4DD}',
    description: 'Refleksi diri & portofolio',
    color: '#a78bfa',
    tags: ['refleksi', 'diri', 'portofolio', 'penugasan'],
    sortOrder: 110,
    sceneType: 'reflection',
  },
  {
    id: 'rangkuman',
    label: 'Rangkuman',
    category: 'konten',
    icon: '📝',
    description: 'Poin penting & penegasan materi',
    color: 'emerald',
    tags: ['bsnp', 'rangkuman', 'ringkasan', 'kesimpulan'],
    sortOrder: 65,
    sceneType: 'summary',
  },
  {
    id: 'penutup',
    label: 'Penutup',
    category: 'penutup',
    icon: '\u{1F38A}',
    description: 'Penutup & preview berikutnya',
    color: '#fb923c',
    tags: ['penutup', 'preview', 'pertemuan', 'akhir'],
    sortOrder: 120,
    sceneType: 'summary',
  },
  {
    id: 'custom',
    label: 'Kosong',
    category: 'utama',
    icon: '\u{2B1C}',
    description: 'Canvas kosong (bebas)',
    color: '#6366f1',
    tags: ['kosong', 'bebas', 'custom', 'canvas'],
    sortOrder: 130,
    sceneType: 'concept',
  },
];

// ── Build Preset with create() Factory ────────────────────────

function buildPresetWithCreate(def: Omit<PagePreset, 'create'>): PagePreset {
  return {
    ...def,
    create: (ctx: PresetCreateContext): ScreenSchema | null => {
      // Custom pages have no schema
      if (def.id === 'custom') return null;

      // P0 FIX: Use createDefaultSchemaForTemplateType() instead of
      // the broken ensurePageSchema() → TemplateAdapter path.
      //
      // OLD (BROKEN): ensurePageSchema() reads page.templateData which
      // is always {} for preset pages → TemplateAdapter produces hollow
      // blocks with empty arrays (questions:[], items:[], etc.).
      //
      // NEW (FIXED): createDefaultSchemaForTemplateType() uses
      // BLOCK_DEFINITIONS.createDefault() → populated blocks with
      // meaningful default content.
      const schema = createDefaultSchemaForTemplateType(
        def.id,           // templateType (cover, materi, kuis, game, etc.)
        undefined,        // metadata (not available in preset context)
        undefined,        // suggestedBlocks (use TEMPLATE_BLOCK_MAP defaults)
        ctx.variant,      // variant (A/B/C)
      );
      return { ...schema, id: ctx.pageId };
    },
  };
}

// ── Registry Instance ─────────────────────────────────────────

const _registry: Map<string, PagePreset> = new Map();

// Initialize registry from definitions
for (const def of PRESET_DEFINITIONS) {
  const preset = buildPresetWithCreate(def);
  _registry.set(preset.id, preset);
}

// ── Public API ────────────────────────────────────────────────

/**
 * Get a preset by ID. Returns undefined if not found.
 */
export function getPreset(id: string): PagePreset | undefined {
  return _registry.get(id);
}

/**
 * Get all presets, sorted by sortOrder.
 */
export function getAllPresets(): PagePreset[] {
  return Array.from(_registry.values()).sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Get presets filtered by category, sorted by sortOrder.
 */
export function getPresetsByCategory(category: PagePreset['category']): PagePreset[] {
  return getAllPresets().filter(p => p.category === category);
}

/**
 * Get all categories with their presets.
 * Returns entries sorted by the first preset's sortOrder in each category.
 */
export function getPresetsGroupedByCategory(): Array<{ category: PagePreset['category']; presets: PagePreset[] }> {
  const categories: PagePreset['category'][] = ['utama', 'konten', 'interaktif', 'penutup'];
  return categories.map(category => ({
    category,
    presets: getPresetsByCategory(category),
  })).filter(g => g.presets.length > 0);
}

/**
 * Search presets by text query (matches label, description, tags).
 */
export function searchPresets(query: string): PagePreset[] {
  const q = query.toLowerCase().trim();
  if (!q) return getAllPresets();
  return getAllPresets().filter(p =>
    p.label.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q) ||
    p.tags.some(t => t.toLowerCase().includes(q))
  );
}

/**
 * Create a full CanvaPage from a preset.
 * The page is schema-native from creation — page.schema is populated directly.
 * No lazy migration needed at render time.
 */
export function createPageFromPreset(
  presetId: PageTemplateType,
  pageCount: number,
): CanvaPage {
  const preset = getPreset(presetId);
  const label = preset?.label
    ? getTemplateLabel(presetId, pageCount)
    : 'Halaman ' + (pageCount + 1);

  // Create the base page
  const page = createPage(label, presetId);

  // Apply preset-specific extra props (bg color, etc.)
  Object.assign(page, getTemplateExtraProps(presetId));

  // v4: No more lock model — schema is always owned by the user

  // Schema-first: templateData is deprecated.
  // Presets create schemas directly via ensurePageSchema().
  page.templateData = {};

  // Schema-first: create native schema directly via preset.
  // No TemplateAdapter bridge — pure one-way data flow.
  let hasSchema = false;
  if (preset) {
    const schema = preset.create({
      pageId: page.id,
      label: page.label,
      variant: page.templateVariant || 'A',
    });
    if (schema) {
      page.schema = schema;
      hasSchema = true;
    }
  }

  // Schema-native page: elements[] is EMPTY.
  // SchemaScreenRenderer is the single source of truth.
  // Only fall back to populateTemplateElements for pages without schema
  // (i.e., pages where ensurePageSchema returned null).
  if (hasSchema) {
    page.elements = [];
  } else {
    page.elements = populateTemplateElements(page, createElId);
  }

  return page;
}

/**
 * Get the preset label for a template type.
 * Falls back to the template type string if preset not found.
 */
export function getPresetLabel(templateType: string): string {
  return getPreset(templateType)?.label ?? templateType;
}

/**
 * Get the preset category for a template type.
 */
export function getPresetCategory(templateType: string): PagePreset['category'] | undefined {
  return getPreset(templateType)?.category;
}

/**
 * Check if a template type has a valid preset.
 */
export function isPresetRegistered(id: string): boolean {
  return _registry.has(id);
}

/**
 * Get the SceneType for a preset by template type.
 * Returns the explicit sceneType from the preset definition,
 * or falls back to TEMPLATE_TO_SCENE mapping, or 'concept' default.
 */
export function getPresetSceneType(templateType: string): SceneType {
  const preset = getPreset(templateType);
  if (preset?.sceneType) return preset.sceneType;
  const mapped = TEMPLATE_TO_SCENE[templateType];
  if (mapped) return mapped;
  return 'concept';
}

/**
 * Get presets filtered by SceneType.
 * Useful for building scene-type galleries in the editor.
 */
export function getPresetsBySceneType(sceneType: SceneType): PagePreset[] {
  return getAllPresets().filter(p => p.sceneType === sceneType);
}
