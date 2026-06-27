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
//   5. Every subject has at least one template + the generic empty template

import type { PageTemplateType } from '@/components/canva/types';
import type { CanvaPage } from '@/components/canva/types';
import { createPage } from '@/store/canva/constants';
import { createDefaultSchemaForTemplateType, type ProjectCreationMetadata } from '@/core/schema/schema-factory';
import type { SceneType } from '@/core/edu/education-scene-types';
import { TEMPLATE_TO_SCENE, SCENE_TYPES } from '@/core/edu/education-scene-types';
// BATCH-11: legacy PPKn template still imported for backward-compat
// lookup, but is NO LONGER the active default. New default is
// createSilseFreshPpknProject from '@/presets/fresh/silse-fresh-ppkn-schema'.
import { createPpknNormaGoldenProject } from '@/presets/ppkn/norma-golden-schema';
import { createSilseFreshPpknProject, SILSE_FRESH_TEMPLATE_META } from '@/presets/fresh/silse-fresh-ppkn-schema';
import { loadPreset, schemaToCanvaPages } from '@/core/engine/SchemaEngine.utils';
import { generatePageId } from '@/core/schema/ensure-schema';
import { DEFAULT_NAV_CONFIG } from '@/components/canva/types';
import { logger } from '@/core/utils/logger';

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
  /**
   * Scene type for scene-aware rendering.
   * If not specified, inferred from templateType via TEMPLATE_TO_SCENE mapping.
   * This enables the 6-layer emotional design system to adjust:
   *   - Typography hierarchy (hero/title/body per scene)
   *   - Accent prominence (which colors are muted/vocal)
   *   - Emotional profile (progress/discovery/reward triggers)
   *   - Reveal strategy (all-visible/progressive/on-interaction)
   */
  sceneType?: SceneType;
}

// ── Level 1: Course Template ───────────────────────────────────

export type TemplateStatus = 'active' | 'legacy' | 'hidden' | 'experimental';

export interface CourseTemplate {
  /** Unique template ID */
  id: string;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Subject (e.g., 'PPKn', 'IPA', 'MTK') — '*' for universal */
  subject: string;
  /** Grade level (e.g., '7', '8', '9') — '*' for any grade */
  grade: string;
  /** Semester ('1' or '2') — '*' for any semester */
  semester: string;
  /** Theme preset ID (links to existing DesignTokens theme) */
  theme: string;
  /** Legacy preset key — links to the AuthoringStore preset system.
   *  When applying a template, this key triggers applyFullPreset()
   *  to populate the authoring data alongside the canvas pages. */
  presetId?: string;
  /** Contract ID — links to TemplateThemeContract for visual enforcement.
   *  When set, the contract OVERRIDES scene/block default styles.
   *  Priority: TemplateThemeContract > Scene Style > Block Default */
  contractId?: string;
  /** Template status — controls visibility in the template gallery.
   *  'active' = shown in gallery, fully supported
   *  'legacy' = hidden from gallery, still functional
   *  'hidden' = completely hidden, not selectable
   *  'experimental' = shown with warning badge */
  status?: TemplateStatus;
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
// Re-export from schema-factory for backward compatibility.
// New code should import directly from schema-factory.
export type { ProjectCreationMetadata as ProjectMetadata } from '@/core/schema/schema-factory';

// Local type alias for use within this module
type LocalProjectMetadata = import('@/core/schema/schema-factory').ProjectCreationMetadata;

// ── Template Pattern ───────────────────────────────────────────

export type TemplatePattern = 'standar' | 'interaktif' | 'eksperimen' | 'mini';

export const TEMPLATE_PATTERNS: Record<TemplatePattern, { icon: string; label: string; description: string; color: string }> = {
  standar: { icon: '📖', label: 'Standar', description: 'Alur pembelajaran klasik', color: 'amber' },
  interaktif: { icon: '🎮', label: 'Interaktif', description: 'Alur dengan skenario pilihan', color: 'emerald' },
  eksperimen: { icon: '🔬', label: 'Eksperimen', description: 'Alur dengan praktikum/diskusi', color: 'sky' },
  mini: { icon: '⚡', label: 'Mini', description: 'Alur singkat 3-5 halaman', color: 'violet' },
};

// ── Template Customization ─────────────────────────────────────

export interface TemplateCustomization {
  enabledPages: boolean[];
  jumlahKuis: number;
  variant: 'A' | 'B' | 'C';
  guru?: string;
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
// STARTER COURSE TEMPLATES — expanded for all 8 subjects
// ═══════════════════════════════════════════════════════════════════
// Every subject gets at least one template. The "template-kosong"
// uses subject='*' and grade='*' so it always appears in filters.

const COURSE_TEMPLATES: CourseTemplate[] = [
  // ═══════════════════════════════════════════════════════════════
  // BATCH-11: SILSE FRESH PPKn — NEW ACTIVE DEFAULT
  // ═══════════════════════════════════════════════════════════════
  // Senior decision: old PPKn template (modul-ppkn-vii / norma-golden)
  // is "OS rusak" — content + style + contract + cover-hitam all mixed.
  // We do NOT repair it. We install a FRESH template from scratch.
  //
  // Fresh template principles:
  //   - contractId = 'silse-fresh' (light cream + deep teal)
  //   - NO golden-pertemuan, NO academic-clean inheritance
  //   - Schema-first, 8 pages: cover/petunjuk/tujuan/materi/sortir/kuis/refleksi/penutup
  //   - NO elements[] legacy
  //   - Generated by createSilseFreshPpknProject() in
  //     src/presets/fresh/silse-fresh-ppkn-schema.ts
  // ═══════════════════════════════════════════════════════════════
  {
    id: SILSE_FRESH_TEMPLATE_META.id,  // 'silse-fresh-ppkn'
    name: SILSE_FRESH_TEMPLATE_META.name,
    description: SILSE_FRESH_TEMPLATE_META.description,
    subject: SILSE_FRESH_TEMPLATE_META.subject,
    grade: SILSE_FRESH_TEMPLATE_META.grade,
    semester: SILSE_FRESH_TEMPLATE_META.semester,
    theme: SILSE_FRESH_TEMPLATE_META.theme,
    contractId: SILSE_FRESH_TEMPLATE_META.contractId,  // 'silse-fresh'
    status: 'active',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'petunjuk', label: 'Petunjuk', suggestedBlocks: ['petunjuk'], variant: 'A', sceneType: 'intro' },
      { templateType: 'tujuan', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi Pembelajaran', suggestedBlocks: ['def-box', 'nc-grid'], variant: 'A', sceneType: 'concept' },
      { templateType: 'game', label: 'Aktivitas Sortir', suggestedBlocks: ['sortir-game'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: {
      icon: SILSE_FRESH_TEMPLATE_META.icon,
      author: SILSE_FRESH_TEMPLATE_META.author,
      version: SILSE_FRESH_TEMPLATE_META.version,
    },
  },

  // ── PPKn VII — LEGACY (BATCH-11: quarantined) ───────────────
  // Old "golden template" — mixed content + style + contract.
  // Kept for backward-compat lookup (existing projects that reference
  // this ID), but NO LONGER shown in the template gallery.
  // createProjectFromTemplate() still works for legacy projects.
  {
    id: 'modul-ppkn-vii',
    name: 'Modul PPKn Kelas VII — Hakikat Norma (Legacy)',
    description: 'Template lama — dikarantina di Batch 11. Gunakan template SILSE Fresh sebagai gantinya.',
    subject: 'PPKn',
    grade: '7',
    semester: '1',
    theme: 'modern-interactive',
    contractId: 'modern-educator',
    status: 'legacy',  // BATCH-11: was 'active' → now 'legacy'
    scenes: [
      { templateType: 'cover', label: 'Pembuka', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Apersepsi / Motivasi', suggestedBlocks: ['motivasi'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Materi 1', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Materi 2', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Materi 3', suggestedBlocks: ['def-box', 'nc-grid'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '⚖️', author: 'SILSE', version: '2.1.0' },
  },

  // ── PPKn VIII — Interaktif (LEGACY) ──────────────────────────
  {
    id: 'modul-ppkn-viii',
    name: 'Modul PPKn Kelas VIII',
    description: 'Pembelajaran PPKn kelas 8 dengan skenario interaktif. Materi, diskusi, kuis, dan refleksi.',
    subject: 'PPKn',
    grade: '8',
    semester: '1',
    theme: 'bhinneka-tunggal-ika',
    status: 'legacy',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'skenario', label: 'Skenario Interaktif', suggestedBlocks: ['skenario'], variant: 'A', sceneType: 'example' },
      { templateType: 'materi', label: 'Materi Pembelajaran', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '⚖️', author: 'SILSE', version: '1.0.0' },
  },

  // ── IPA VIII — Eksperimen (LEGACY) ──────────────────────────
  {
    id: 'modul-ipa-viii',
    name: 'Modul IPA Kelas VIII',
    description: 'Pembelajaran IPA kelas 8 dengan eksperimen. Materi, kuis, dan rangkuman.',
    subject: 'IPA',
    grade: '8',
    semester: '1',
    theme: 'globalisasi',
    status: 'legacy',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'skenario', label: 'Skenario Ilmiah', suggestedBlocks: ['skenario'], variant: 'A', sceneType: 'example' },
      { templateType: 'materi', label: 'Materi 1 — Konsep Dasar', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Materi 2 — Penerapan', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Eksperimen / Praktikum', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'materi', label: 'Rangkuman', suggestedBlocks: ['rangkuman'], variant: 'A', sceneType: 'concept' },
    ],
    metadata: { icon: '🔬', author: 'SILSE', version: '1.0.0' },
  },

  // ── IPA VII — Standar (LEGACY) ──────────────────────────────
  {
    id: 'modul-ipa-vii',
    name: 'Modul IPA Kelas VII',
    description: 'Pembelajaran IPA kelas 7. Materi, diskusi, kuis, dan refleksi.',
    subject: 'IPA',
    grade: '7',
    semester: '1',
    theme: 'ham-hak-kewajiban',
    status: 'legacy',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'motivasi', label: 'Motivasi / Apersepsi', suggestedBlocks: ['motivasi'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi 1', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Materi 2', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🔬', author: 'SILSE', version: '1.0.0' },
  },

  // ── MTK VII — Standar (LEGACY) ──────────────────────────────
  {
    id: 'modul-mtk-vii',
    name: 'Modul Matematika Kelas VII',
    description: 'Pembelajaran Matematika kelas 7. Materi, contoh soal, latihan, kuis, dan rangkuman.',
    subject: 'MTK',
    grade: '7',
    semester: '1',
    theme: 'nilai-pancasila',
    status: 'legacy',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'motivasi', label: 'Apersepsi', suggestedBlocks: ['motivasi'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi — Konsep Dasar', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Contoh Soal & Pembahasan', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'kuis', label: 'Latihan Soal', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'materi', label: 'Rangkuman', suggestedBlocks: ['rangkuman'], variant: 'A', sceneType: 'concept' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '📐', author: 'SILSE', version: '1.0.0' },
  },

  // ── MTK VIII — Interaktif (LEGACY) ──────────────────────────
  {
    id: 'modul-mtk-viii',
    name: 'Modul Matematika Kelas VIII',
    description: 'Pembelajaran Matematika kelas 8. Materi, diskusi, kuis, dan refleksi.',
    subject: 'MTK',
    grade: '8',
    semester: '1',
    theme: 'globalisasi',
    status: 'legacy',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi 1 — Konsep', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Materi 2 — Penerapan', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi Soal', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '📐', author: 'SILSE', version: '1.0.0' },
  },

  // ── B. Indonesia VII — Standar (LEGACY) ────────────────────
  {
    id: 'modul-bin-vii',
    name: 'Modul B. Indonesia Kelas VII',
    description: 'Pembelajaran Bahasa Indonesia kelas 7. Materi, diskusi, kuis, dan refleksi.',
    subject: 'B.Indonesia',
    grade: '7',
    semester: '1',
    theme: 'perilaku-patuh',
    status: 'legacy',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'motivasi', label: 'Motivasi', suggestedBlocks: ['motivasi'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi Pembelajaran', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '📖', author: 'SILSE', version: '1.0.0' },
  },

  // ── B. Indonesia VIII — Interaktif (LEGACY) ────────────────
  {
    id: 'modul-bin-viii',
    name: 'Modul B. Indonesia Kelas VIII',
    description: 'Pembelajaran Bahasa Indonesia kelas 8. Skenario, materi, diskusi, kuis, dan rangkuman.',
    subject: 'B.Indonesia',
    grade: '8',
    semester: '1',
    theme: 'bhinneka-tunggal-ika',
    status: 'legacy',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'skenario', label: 'Skenario Interaktif', suggestedBlocks: ['skenario'], variant: 'A', sceneType: 'example' },
      { templateType: 'materi', label: 'Materi 1', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Materi 2', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi Kelompok', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'rangkuman', label: 'Rangkuman', suggestedBlocks: ['rangkuman'], variant: 'A', sceneType: 'summary' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '📖', author: 'SILSE', version: '1.0.0' },
  },

  // ── B. Inggris VIII — Interaktif (LEGACY) ──────────────────
  {
    id: 'modul-bing-viii',
    name: 'Modul B. Inggris Kelas VIII',
    description: 'Pembelajaran Bahasa Inggris kelas 8. Skenario, materi, diskusi, kuis, dan refleksi.',
    subject: 'B.Inggris',
    grade: '8',
    semester: '1',
    theme: 'globalisasi',
    contractId: 'modern-educator',
    status: 'legacy',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Learning Objectives', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'skenario', label: 'Interactive Scenario', suggestedBlocks: ['skenario'], variant: 'A', sceneType: 'example' },
      { templateType: 'materi', label: 'Material', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Discussion', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Quiz', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Reflection', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Closing', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🌍', author: 'SILSE', version: '1.0.0' },
  },

  // ── B. Inggris VII — Standar (LEGACY) ──────────────────────
  {
    id: 'modul-bing-vii',
    name: 'Modul B. Inggris Kelas VII',
    description: 'Pembelajaran Bahasa Inggris kelas 7. Materi, diskusi, kuis, dan rangkuman.',
    subject: 'B.Inggris',
    grade: '7',
    semester: '1',
    theme: 'ham-hak-kewajiban',
    contractId: 'modern-educator',
    status: 'legacy',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Learning Objectives', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Material', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Discussion', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Quiz', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'rangkuman', label: 'Summary', suggestedBlocks: ['rangkuman'], variant: 'A', sceneType: 'summary' },
      { templateType: 'penutup', label: 'Closing', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🌍', author: 'SILSE', version: '1.0.0' },
  },

  // ── Seni VII — Standar (LEGACY) ─────────────────────────────
  {
    id: 'modul-seni-vii',
    name: 'Modul Seni Budaya Kelas VII',
    description: 'Pembelajaran Seni Budaya kelas 7. Materi, praktik, diskusi, dan refleksi.',
    subject: 'Seni',
    grade: '7',
    semester: '1',
    theme: 'perilaku-patuh',
    contractId: 'modern-educator',
    status: 'legacy',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'motivasi', label: 'Motivasi / Apersepsi', suggestedBlocks: ['motivasi'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi Seni', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Praktik & Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'refleksi', label: 'Refleksi Karya', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🎨', author: 'SILSE', version: '1.0.0' },
  },

  // ── Seni VIII — Interaktif (LEGACY) ────────────────────────
  {
    id: 'modul-seni-viii',
    name: 'Modul Seni Budaya Kelas VIII',
    description: 'Pembelajaran Seni Budaya kelas 8. Skenario kreatif, materi, diskusi, dan refleksi.',
    subject: 'Seni',
    grade: '8',
    semester: '1',
    theme: 'bhinneka-tunggal-ika',
    contractId: 'modern-educator',
    status: 'legacy',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi Seni', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'skenario', label: 'Skenario Kreatif', suggestedBlocks: ['skenario'], variant: 'A', sceneType: 'example' },
      { templateType: 'diskusi', label: 'Diskusi Karya', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🎨', author: 'SILSE', version: '1.0.0' },
  },

  // ── PJOK VII — Standar (LEGACY) ─────────────────────────────
  {
    id: 'modul-pjok-vii',
    name: 'Modul PJOK Kelas VII',
    description: 'Pembelajaran PJOK kelas 7. Materi, praktik, kuis, dan refleksi.',
    subject: 'PJOK',
    grade: '7',
    semester: '1',
    theme: 'nilai-pancasila',
    contractId: 'modern-educator',
    status: 'legacy',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'motivasi', label: 'Pemanasan / Motivasi', suggestedBlocks: ['motivasi'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi Kebugaran', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Praktik & Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi Aktivitas', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '⚽', author: 'SILSE', version: '1.0.0' },
  },

  // ── PJOK VIII — Interaktif (LEGACY) ────────────────────────
  {
    id: 'modul-pjok-viii',
    name: 'Modul PJOK Kelas VIII',
    description: 'Pembelajaran PJOK kelas 8. Skenario olahraga, materi, diskusi, dan kuis.',
    subject: 'PJOK',
    grade: '8',
    semester: '1',
    theme: 'globalisasi',
    contractId: 'modern-educator',
    status: 'legacy',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi Kebugaran', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'skenario', label: 'Skenario Olahraga', suggestedBlocks: ['skenario'], variant: 'A', sceneType: 'example' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '⚽', author: 'SILSE', version: '1.0.0' },
  },

  // ── PJOK IV (SD) — Gerak Dasar (LEGACY) ────────────────────
  {
    id: 'modul-pjok-iv',
    name: 'Modul PJOK Kelas IV SD',
    description: 'Pembelajaran PJOK kelas 4 SD. Materi, kuis, dan refleksi.',
    subject: 'PJOK',
    grade: '4',
    semester: '1',
    theme: 'nilai-pancasila',
    contractId: 'modern-educator',
    status: 'legacy',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'petunjuk', label: 'Petunjuk', suggestedBlocks: ['petunjuk'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi 1', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Materi 2', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Materi 3', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🏃', author: 'SILSE', version: '1.0.0' },
  },

  // ── PJOK X (SMA) — Kebugaran (LEGACY) ──────────────────────
  {
    id: 'modul-pjok-x',
    name: 'Modul PJOK Kelas X SMA',
    description: 'Pembelajaran PJOK kelas 10 SMA. Materi, studi kasus, kuis, dan rangkuman.',
    subject: 'PJOK',
    grade: '10',
    semester: '1',
    theme: 'globalisasi',
    contractId: 'modern-educator',
    status: 'legacy',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi 1 — Konsep Kebugaran', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Materi 2 — Prinsip Latihan', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Studi Kasus', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'materi', label: 'Rangkuman', suggestedBlocks: ['rangkuman'], variant: 'A', sceneType: 'concept' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '💪', author: 'SILSE', version: '1.0.0' },
  },

  // ═══════════════════════════════════════════════════════════════════
  // CURATED GENERAL TEMPLATES — Universal, subject='*'
  // ═══════════════════════════════════════════════════════════════════
  // These 5 templates cover the most common learning flows for teachers.
  // They are always visible (subject='*', grade='*') and serve as the
  // primary entry point for "Mulai dari Template" on the Dashboard.

  // ── Materi + Kuis (5 scenes) ──────────────────────────────
  {
    id: 'materi-kuis',
    name: 'Materi + Kuis',
    description: 'Media singkat: materi dan kuis. Cocok untuk asesmen cepat.',
    subject: '*',
    grade: '*',
    semester: '*',
    theme: 'default',
    status: 'active',
    contractId: 'modern-educator',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi Pembelajaran', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '📝', author: 'SILSE', version: '1.0.0' },
  },

  // ── Materi + Aktivitas (6 scenes) ─────────────────────────
  {
    id: 'materi-aktivitas',
    name: 'Materi + Aktivitas',
    description: 'Materi dengan diskusi dan refleksi. Cocok untuk pembelajaran kolaboratif.',
    subject: '*',
    grade: '*',
    semester: '*',
    theme: 'default',
    status: 'active',
    contractId: 'modern-educator',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi Pembelajaran', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🎯', author: 'SILSE', version: '1.0.0' },
  },

  // ── Skenario + Diskusi (6 scenes) ─────────────────────────
  {
    id: 'skenario-diskusi',
    name: 'Skenario + Diskusi',
    description: 'Skenario interaktif dengan materi dan diskusi. Cocok untuk studi kasus.',
    subject: '*',
    grade: '*',
    semester: '*',
    theme: 'default',
    status: 'active',
    contractId: 'modern-educator',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'skenario', label: 'Skenario Interaktif', suggestedBlocks: ['skenario'], variant: 'A', sceneType: 'example' },
      { templateType: 'materi', label: 'Materi Pembelajaran', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🎭', author: 'SILSE', version: '1.0.0' },
  },

  // ── Game Sortir + Kuis (6 scenes) ─────────────────────────
  {
    id: 'game-sortir-kuis',
    name: 'Game Sortir + Kuis',
    description: 'Game sortir dan kuis dalam satu media. Cocok untuk materi yang butuh klasifikasi.',
    subject: '*',
    grade: '*',
    semester: '*',
    theme: 'default',
    status: 'active',
    contractId: 'modern-educator',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi Pembelajaran', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'game', label: 'Aktivitas Sortir', suggestedBlocks: ['sortir-game'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🧩', author: 'SILSE', version: '1.0.0' },
  },

  // ── Pertemuan Lengkap (8 scenes) ──────────────────────────
  {
    id: 'pertemuan-lengkap',
    name: 'Pertemuan Lengkap',
    description: 'Pertemuan lengkap sesuai standar BSNP. Materi, diskusi, kuis, dan refleksi.',
    subject: '*',
    grade: '*',
    semester: '*',
    theme: 'default',
    status: 'active',
    contractId: 'modern-educator',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'motivasi', label: 'Motivasi / Apersepsi', suggestedBlocks: ['motivasi'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi Pembelajaran', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '📚', author: 'SILSE', version: '1.0.0' },
  },

  // ═══════════════════════════════════════════════════════════════════
  // CURATED PPKn TEMPLATES — Stable golden-quality content
  // ═══════════════════════════════════════════════════════════════════

  // ── Macam-Macam Norma (PPKn VII, active) ──────────────────
  {
    id: 'macam-norma',
    name: 'Macam-Macam Norma',
    description: 'Pembelajaran PPKn kelas 7. Materi lengkap, diskusi, kuis, dan refleksi. Konten stabil dan teruji.',
    subject: 'PPKn',
    grade: '7',
    semester: '1',
    theme: 'modern-interactive',
    status: 'active',
    contractId: 'modern-educator',
    presetId: 'macam-norma',
    scenes: [
      { templateType: 'cover', label: 'Pembuka', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'motivasi', label: 'Apersepsi / Motivasi', suggestedBlocks: ['motivasi'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi 1', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Materi 2', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Materi 3', suggestedBlocks: ['def-box', 'nc-grid'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '⚖️', author: 'SILSE', version: '1.0.0' },
  },

  // ── Misi Penjelajah Pancasila (PPKn VII, active) ──────────
  {
    id: 'misi-penjelajah',
    name: 'Misi Penjelajah Pancasila',
    description: 'Pembelajaran PPKn kelas 7 dengan skenario interaktif. Materi, kuis, dan refleksi.',
    subject: 'PPKn',
    grade: '7',
    semester: '1',
    theme: 'modern-interactive',
    status: 'active',
    contractId: 'modern-educator',
    presetId: 'misi-penjelajah-pancasila',
    scenes: [
      { templateType: 'cover', label: 'Pembuka', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'skenario', label: 'Skenario Interaktif', suggestedBlocks: ['skenario'], variant: 'A', sceneType: 'example' },
      { templateType: 'materi', label: 'Materi 1', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Materi 2', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🚀', author: 'SILSE', version: '1.0.0' },
  },

  // ── Template Kosong — Universal (subject='*', grade='*') ────
  {
    id: 'template-kosong',
    name: 'Template Kosong',
    description: 'Mulai dari kosong. Tambahkan halaman sendiri sesuai kebutuhan.',
    subject: '*',
    grade: '*',
    semester: '*',
    theme: 'default',
    status: 'active',
    contractId: 'modern-educator',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '📋', author: 'SILSE', version: '1.0.0' },
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
 * Hides 'hidden' and 'legacy' status templates from the gallery.
 */
export function getCourseTemplatesBySubject(subject: string): CourseTemplate[] {
  return getAllCourseTemplates()
    .filter(t => (t.subject === subject || t.subject === '*') && t.status !== 'hidden' && t.status !== 'legacy');
}

/**
 * Get course templates filtered by subject and/or grade.
 *
 * Filtering logic:
 *   - subject filter: match t.subject === subject OR t.subject === '*'
 *   - grade filter: match t.grade === grade OR t.grade === '*'
 *   - The "template-kosong" (subject='*', grade='*') always passes both filters
 *   - Always puts template-kosong at the end of the list
 *   - Hides 'hidden' templates completely, shows only 'active' + 'experimental'
 *   - 'legacy' templates are hidden by default but can be shown with showLegacy=true
 */
export function getCourseTemplatesFiltered(subject?: string, grade?: string, showLegacy: boolean = false): CourseTemplate[] {
  let results = getAllCourseTemplates();

  // Filter by status: hide 'hidden' always, hide 'legacy' unless explicitly requested
  results = results.filter(t => {
    if (t.status === 'hidden') return false;
    if (t.status === 'legacy' && !showLegacy) return false;
    return true;
  });

  if (subject && subject !== 'Lainnya') {
    results = results.filter(t => t.subject === subject || t.subject === '*');
  }

  if (grade) {
    results = results.filter(t => t.grade === grade || t.grade === '*');
  }

  // Always put template-kosong at the end
  const empty = results.find(t => t.id === 'template-kosong');
  const nonEmpty = results.filter(t => t.id !== 'template-kosong');
  return [...nonEmpty, ...(empty ? [empty] : [])];
}

/**
 * Create a full CanvaPage[] array from a Course Template.
 *
 * ARCHITECTURE (FIXED — Schema Factory Bridge):
 *   OLD (BROKEN): createPageFromPreset() → ensurePageSchema() → TemplateAdapter
 *     → reads empty templateData → HOLLOW OUTPUT
 *
 *   NEW (FIXED): createPage() → createDefaultSchemaForTemplateType()
 *     → BLOCK_DEFINITIONS.createDefault() → POPULATED OUTPUT
 *
 * For each scene in the template:
 *   1. Creates a CanvaPage via createPage() (basic page with empty schema)
 *   2. Creates a populated ScreenSchema using createDefaultSchemaForTemplateType()
 *      which uses BLOCK_DEFINITIONS.createDefault() for each suggested block
 *   3. Injects project metadata (title, guru, sekolah) into cover/penutup
 *   4. Sets page label and variant from the scene spec
 *
 * This ensures templates produce RICH, populated output from the start.
 * The suggestedBlocks field in each scene is now ACTIVELY used — each
 * block type gets a createDefault() instance with meaningful default data.
 */
export async function createProjectFromTemplate(
  templateId: string,
  metadata: LocalProjectMetadata,
): Promise<CanvaPage[]> {
  const template = _registry.get(templateId);
  if (!template) {
    throw new Error(`Course template "${templateId}" not found`);
  }

  // ═══════════════════════════════════════════════════════════════════
  // BATCH-11: FRESH TEMPLATE FAST PATH (silse-fresh-ppkn)
  // ═══════════════════════════════════════════════════════════════════
  // The new active default. Uses createSilseFreshPpknProject() which
  // generates 8 fresh pages with:
  //   - contractId = 'silse-fresh' (light cream + deep teal)
  //   - Schema-first, no legacy elements[]
  //   - No golden-pertemuan, no academic-clean inheritance
  //   - Real, teacher-friendly content
  // ═══════════════════════════════════════════════════════════════════

  if (templateId === 'silse-fresh-ppkn') {
    return createSilseFreshPpknProject({
      title: metadata.title,
      guru: metadata.guru,
      sekolah: metadata.sekolah,
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // LEGACY GOLDEN TEMPLATE FAST PATH (modul-ppkn-vii)
  // ═══════════════════════════════════════════════════════════════════
  // BATCH-11: This template is now 'legacy' status — hidden from gallery
  // but still callable for existing projects that reference this ID.
  // Uses the OLD createPpknNormaGoldenProject() generator (quarantined
  // but not deleted — backward compatibility for old saved projects).
  // ═══════════════════════════════════════════════════════════════════

  if (templateId === 'modul-ppkn-vii') {
    return createPpknNormaGoldenProject({
      title: metadata.title,
      guru: metadata.guru,
      sekolah: metadata.sekolah,
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // PRESET-BACKED TEMPLATES — Rich curriculum content
  // ═══════════════════════════════════════════════════════════════════
  // Templates that have a `presetId` link to a real LessonSchema preset
  // with handcrafted curriculum content. We load the preset and convert
  // it to CanvaPages instead of using the generic schema factory.
  // This ensures templates like "Macam-Macam Norma" produce real PPKn
  // curriculum content, not placeholder text.
  // ═══════════════════════════════════════════════════════════════════

  if (template.presetId) {
    try {
      const schema = await loadPreset(template.presetId);
      if (schema) {
        const rawPages = schemaToCanvaPages(schema);

        // Wrap into full CanvaPage objects (schemaToCanvaPages returns partial)
        const pages: CanvaPage[] = rawPages.map((raw) => ({
          id: raw.id || generatePageId(),
          label: raw.label,
          bgDataUrl: null,
          bgColor: raw.bgColor || '#ffffff',
          overlay: 20,
          elements: [],
          templateType: (raw.templateType || 'custom') as CanvaPage['templateType'],
          colorPalette: null,
          navConfig: { ...DEFAULT_NAV_CONFIG },
          templateData: raw.templateData,
          pageMode: 'schema' as const,
          schema: raw.schema,
          contractId: (raw as { contractId?: string }).contractId || template.contractId || 'modern-educator',
        }));

        // Cover pages should show navbar + progress
        if (pages.length > 0 && pages[0]!.templateType === 'cover') {
          pages[0]!.navConfig = {
            ...pages[0]!.navConfig,
            showNavbar: true,
            showProgress: true,
          };
        }

        logger.info('CourseTemplateRegistry', `Loaded preset "${template.presetId}" for template "${templateId}" — ${pages.length} pages`);
        return pages;
      }
      // If preset not found, fall through to schema factory
      logger.warn('CourseTemplateRegistry', `Preset "${template.presetId}" not found for template "${templateId}", falling back to schema factory`);
    } catch (err) {
      // If preset loading fails, fall through to schema factory rather than crash
      logger.error('CourseTemplateRegistry', `Failed to load preset "${template.presetId}" for template "${templateId}": ${String(err)}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // FALLBACK: Schema Factory Bridge (for non-golden, non-preset templates)
  // ═══════════════════════════════════════════════════════════════════
  // Non-golden templates still use the schema factory. This generates
  // block defaults via BlockDefinitionRegistry.createDefault() which
  // produces reasonable placeholder content for each block type.
  // ═══════════════════════════════════════════════════════════════════

  const pages: CanvaPage[] = [];

  // Build ProjectCreationMetadata for the schema factory
  const creationMeta: ProjectCreationMetadata = {
    title: metadata.title,
    guru: metadata.guru,
    sekolah: metadata.sekolah,
  };

  for (let i = 0; i < template.scenes.length; i++) {
    const scene = template.scenes[i]!;

    // Create a base page
    const page = createPage(scene.label, scene.templateType);

    // Override label with the scene's label
    page.label = scene.label;

    // Set variant if specified
    if (scene.variant) {
      page.templateVariant = scene.variant;
    }

    // ═══ CONTRACT ID PERSISTENCE ═════════════════════════════════
    // Store the contractId on each page so it persists through save/load.
    // Without this, the contract would be lost after saving the project.
    if (template.contractId) {
      page.contractId = template.contractId;
    }

    // ═══ SCHEMA FACTORY BRIDGE ═══════════════════════════════════
    // Create populated schema DIRECTLY using BlockDefinitionRegistry
    // createDefault(). Bypasses the deprecated TemplateAdapter entirely.
    const schema = createDefaultSchemaForTemplateType(
      scene.templateType,
      creationMeta,
      scene.suggestedBlocks,
      scene.variant || 'A',
    );

    // Deep-clone schema blocks to prevent shared references between pages.
    // Without this, editing a block on one page could mutate the same
    // object on another page (e.g. when 2+ scenes share a templateType).
    schema.blocks = structuredClone(schema.blocks);

    // Set scene type from the spec (for scene-aware rendering)
    if (scene.sceneType) {
      schema.sceneType = scene.sceneType;
    }

    // Assign the populated schema to the page
    page.schema = schema;
    page.elements = []; // Schema-driven: no legacy elements
    page.pageMode = 'schema';

    pages.push(page);
  }

  return pages;
}

/**
 * Get the theme preset ID for a course template.
 */
export function getTemplateThemeId(templateId: string): string {
  const template = _registry.get(templateId);
  // PHASE-2: Changed fallback from 'default' (dark navy) to
  // 'modern-interactive' (light) so all templates produce light
  // pages by default. apply-template-to-store.ts uses this as
  // finalThemeId when schema.themeId is not already set.
  return template?.theme ?? 'modern-interactive';
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

/**
 * Resolve the SceneType for a SceneTemplateSpec.
 * Priority: explicit sceneType > TEMPLATE_TO_SCENE mapping > 'concept' default.
 */
export function resolveSceneType(spec: SceneTemplateSpec): SceneType {
  if (spec.sceneType) return spec.sceneType;
  const mapped = TEMPLATE_TO_SCENE[spec.templateType];
  if (mapped) return mapped;
  return 'concept'; // default fallback
}

/**
 * Get the narrative intensity curve for a course template.
 * Returns array of { sceneType, intensity, label } for each scene.
 * Useful for visualizing the learning flow rhythm.
 */
export function getTemplateIntensityCurve(templateId: string): Array<{ sceneType: SceneType; intensity: number; label: string }> {
  const template = _registry.get(templateId);
  if (!template) return [];
  return template.scenes.map(spec => {
    const st = resolveSceneType(spec);
    return {
      sceneType: st,
      intensity: SCENE_TYPES[st].intensity,
      label: spec.label,
    };
  });
}
