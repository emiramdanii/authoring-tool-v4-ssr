// ═══════════════════════════════════════════════════════════════════
// COURSE TEMPLATE REGISTRY — 3-Level Template System
// ═══════════════════════════════════════════════════════════════════
// Level 1: CourseTemplate — complete learning flow blueprint
// Level 2: SceneTemplateSpec — per-scene specification
// Level 3: Block Preset — per-block styling (handled by BlockDefinitionRegistry)
//
// This registry provides:
//   - CourseTemplate definitions with scene flow
//   - createProjectFromTemplate() to generate CanvaPage[] from a template
//   - Filtering by subject
//
// Design Principles:
//   1. Metadata-driven — UI renders from registry data
//   2. Uses existing PagePresetRegistry for page creation
//   3. Adds suggested blocks via store's addSchemaBlock
//   4. Links to existing theme presets

import type { PageTemplateType } from '@/components/canva/types';
import type { CanvaPage } from '@/components/canva/types';
import { createPageFromPreset } from '@/core/preset/PagePresetRegistry';

// ── Level 2: Scene Template Spec ───────────────────────────────

export interface SceneTemplateSpec {
  /** Page template type (cover, materi, kuis, etc.) */
  templateType: PageTemplateType;
  /** Display label for the scene (e.g., "Pembuka", "Materi 1") */
  label: string;
  /** Block types to auto-add to this scene */
  suggestedBlocks: string[];
  /** Layout variant */
  variant?: 'A' | 'B' | 'C';
}

// ── Level 1: Course Template ───────────────────────────────────

export interface CourseTemplate {
  /** Unique template ID */
  id: string;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Subject (e.g., 'PPKn', 'IPA', 'MTK') */
  subject: string;
  /** Grade level (e.g., '7', '8', '9') */
  grade: string;
  /** Semester ('1' or '2') */
  semester: string;
  /** Theme preset ID (links to existing DesignTokens theme) */
  theme: string;
  /** Ordered scene specifications */
  scenes: SceneTemplateSpec[];
  /** Metadata */
  metadata: {
    icon: string;
    author: string;
    version: string;
  };
}

// ── Metadata for createProjectFromTemplate ─────────────────────

export interface ProjectMetadata {
  /** Presentation title */
  title: string;
  /** Teacher name */
  guru?: string;
  /** School name */
  sekolah?: string;
}

// ── Subject Configuration ──────────────────────────────────────

export interface SubjectConfig {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export const SUBJECTS: SubjectConfig[] = [
  { id: 'PPKn', label: 'PPKn', icon: '⚖️', color: '#ef4444' },
  { id: 'IPA', label: 'IPA', icon: '🔬', color: '#22c55e' },
  { id: 'MTK', label: 'MTK', icon: '📐', color: '#3b82f6' },
  { id: 'B.Indonesia', label: 'B. Indonesia', icon: '📖', color: '#f59e0b' },
  { id: 'B.Inggris', label: 'B. Inggris', icon: '🌍', color: '#8b5cf6' },
  { id: 'Seni', label: 'Seni', icon: '🎨', color: '#ec4899' },
  { id: 'PJOK', label: 'PJOK', icon: '⚽', color: '#06b6d4' },
  { id: 'Lainnya', label: 'Lainnya', icon: '📚', color: '#6b7280' },
];

// ── Grade Options ──────────────────────────────────────────────

export const GRADE_OPTIONS = [
  { value: '1', label: 'Kelas 1 SD' },
  { value: '2', label: 'Kelas 2 SD' },
  { value: '3', label: 'Kelas 3 SD' },
  { value: '4', label: 'Kelas 4 SD' },
  { value: '5', label: 'Kelas 5 SD' },
  { value: '6', label: 'Kelas 6 SD' },
  { value: '7', label: 'Kelas 7 SMP' },
  { value: '8', label: 'Kelas 8 SMP' },
  { value: '9', label: 'Kelas 9 SMP' },
  { value: '10', label: 'Kelas 10 SMA' },
  { value: '11', label: 'Kelas 11 SMA' },
  { value: '12', label: 'Kelas 12 SMA' },
];

export const SEMESTER_OPTIONS = [
  { value: '1', label: 'Semester 1 (Ganjil)' },
  { value: '2', label: 'Semester 2 (Genap)' },
];

// ═══════════════════════════════════════════════════════════════════
// STARTER COURSE TEMPLATES
// ═══════════════════════════════════════════════════════════════════

const COURSE_TEMPLATES: CourseTemplate[] = [
  // ── Template 1: Modul PPKn VII ─────────────────────────────
  {
    id: 'modul-ppkn-vii',
    name: 'Modul PPKn Kelas VII',
    description: 'Alur pembelajaran lengkap PPKn SMP kelas VII: Pembuka → Tujuan → Motivasi → Materi ×3 → Diskusi → Kuis → Refleksi → Penutup',
    subject: 'PPKn',
    grade: '7',
    semester: '1',
    theme: 'nilai-pancasila',
    scenes: [
      { templateType: 'cover', label: 'Pembuka', suggestedBlocks: ['cover'], variant: 'A' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A' },
      { templateType: 'materi', label: 'Apersepsi / Motivasi', suggestedBlocks: ['motivasi'], variant: 'A' },
      { templateType: 'materi', label: 'Materi 1', suggestedBlocks: ['materi-section'], variant: 'A' },
      { templateType: 'materi', label: 'Materi 2', suggestedBlocks: ['materi-section'], variant: 'A' },
      { templateType: 'materi', label: 'Materi 3', suggestedBlocks: ['def-box', 'nc-grid'], variant: 'A' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A' },
    ],
    metadata: {
      icon: '⚖️',
      author: 'SILSE',
      version: '1.0.0',
    },
  },

  // ── Template 2: Modul IPA VIII ─────────────────────────────
  {
    id: 'modul-ipa-viii',
    name: 'Modul IPA Kelas VIII',
    description: 'Alur pembelajaran IPA SMP kelas VIII: Cover → Tujuan → Skenario → Materi ×2 → Eksperimen → Kuis → Rangkuman',
    subject: 'IPA',
    grade: '8',
    semester: '1',
    theme: 'globalisasi',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A' },
      { templateType: 'skenario', label: 'Skenario Ilmiah', suggestedBlocks: ['skenario'], variant: 'A' },
      { templateType: 'materi', label: 'Materi 1 — Konsep Dasar', suggestedBlocks: ['materi-section'], variant: 'A' },
      { templateType: 'materi', label: 'Materi 2 — Penerapan', suggestedBlocks: ['materi-section'], variant: 'A' },
      { templateType: 'diskusi', label: 'Eksperimen / Praktikum', suggestedBlocks: ['diskusi'], variant: 'A' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A' },
      { templateType: 'materi', label: 'Rangkuman', suggestedBlocks: ['rangkuman'], variant: 'A' },
    ],
    metadata: {
      icon: '🔬',
      author: 'SILSE',
      version: '1.0.0',
    },
  },

  // ── Template 3: Template Kosong ────────────────────────────
  {
    id: 'template-kosong',
    name: 'Template Kosong',
    description: 'Mulai dari nol dengan Cover dan Penutup saja. Tambahkan halaman sesuai kebutuhan.',
    subject: 'Lainnya',
    grade: '7',
    semester: '1',
    theme: 'default',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A' },
    ],
    metadata: {
      icon: '📋',
      author: 'SILSE',
      version: '1.0.0',
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// REGISTRY — Map-based lookup
// ═══════════════════════════════════════════════════════════════════

const _registry: Map<string, CourseTemplate> = new Map();
for (const tmpl of COURSE_TEMPLATES) {
  _registry.set(tmpl.id, tmpl);
}

// ═══════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════

/**
 * Get a course template by ID.
 */
export function getCourseTemplate(id: string): CourseTemplate | undefined {
  return _registry.get(id);
}

/**
 * Get all course templates.
 */
export function getAllCourseTemplates(): CourseTemplate[] {
  return Array.from(_registry.values());
}

/**
 * Get course templates filtered by subject.
 */
export function getCourseTemplatesBySubject(subject: string): CourseTemplate[] {
  return getAllCourseTemplates().filter(t => t.subject === subject);
}

/**
 * Get course templates filtered by subject and/or grade.
 * If subject is 'Lainnya', returns templates with subject 'Lainnya'
 * (the generic empty template).
 */
export function getCourseTemplatesFiltered(subject?: string, grade?: string): CourseTemplate[] {
  let results = getAllCourseTemplates();
  if (subject && subject !== 'Lainnya') {
    results = results.filter(t => t.subject === subject);
  }
  if (grade) {
    // Include templates with matching grade OR generic templates (Lainnya)
    results = results.filter(t => t.grade === grade || t.subject === 'Lainnya');
  }
  // Always include the "empty" template at the end
  const empty = results.find(t => t.id === 'template-kosong');
  const nonEmpty = results.filter(t => t.id !== 'template-kosong');
  return [...nonEmpty, ...(empty ? [empty] : [])];
}

/**
 * Create a full CanvaPage[] array from a Course Template.
 *
 * For each scene in the template:
 *   1. Creates a page using createPageFromPreset (existing preset system)
 *   2. The preset's create() factory populates page.schema with default blocks
 *   3. The suggested blocks in the template are hints — the preset already
 *      creates appropriate default blocks for the template type.
 *   4. Sets page label from the scene spec
 *
 * Note: The existing createPageFromPreset already creates schema-native pages
 * with appropriate default blocks. The suggestedBlocks field serves as
 * documentation and potential future "add more blocks" functionality.
 */
export function createProjectFromTemplate(
  templateId: string,
  metadata: ProjectMetadata,
): CanvaPage[] {
  const template = _registry.get(templateId);
  if (!template) {
    throw new Error(`Course template "${templateId}" not found`);
  }

  const pages: CanvaPage[] = [];

  for (let i = 0; i < template.scenes.length; i++) {
    const scene = template.scenes[i];

    // Use existing PagePresetRegistry to create schema-native pages
    const page = createPageFromPreset(scene.templateType, i);

    // Override label with the scene's label
    page.label = scene.label;

    // Set variant if specified
    if (scene.variant) {
      page.templateVariant = scene.variant;
    }

    // For the cover page, inject the metadata (title, guru, sekolah)
    if (scene.templateType === 'cover' && page.schema?.blocks) {
      for (const block of page.schema.blocks) {
        if (block.type === 'cover') {
          const cover = block as unknown as Record<string, unknown>;
          if (metadata.title) {
            cover.title = metadata.title;
          }
          if (metadata.guru || metadata.sekolah) {
            const meta = (cover.meta as Record<string, string>) || {};
            if (metadata.guru) meta.elemen = metadata.guru;
            if (metadata.sekolah) meta.fase = metadata.sekolah;
            cover.meta = meta;
          }
        }
      }
    }

    // For the penutup page, inject closing info
    if (scene.templateType === 'penutup' && page.schema?.blocks) {
      for (const block of page.schema.blocks) {
        if (block.type === 'penutup') {
          const penutup = block as unknown as Record<string, unknown>;
          if (metadata.title) {
            penutup.subtitle = `Terima kasih — ${metadata.title}`;
          }
        }
      }
    }

    pages.push(page);
  }

  return pages;
}

/**
 * Get the theme preset ID for a course template.
 */
export function getTemplateThemeId(templateId: string): string {
  const template = _registry.get(templateId);
  return template?.theme ?? 'default';
}

/**
 * Get a quick preview summary of a course template.
 * Returns scene labels as a flow string (e.g., "Cover → TP → Materi → Kuis → Penutup")
 */
export function getTemplateFlowPreview(templateId: string): string {
  const template = _registry.get(templateId);
  if (!template) return '';
  return template.scenes.map(s => s.label).join(' → ');
}
