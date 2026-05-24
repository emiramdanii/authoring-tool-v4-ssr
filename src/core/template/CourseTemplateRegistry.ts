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
  /** Subject (e.g., 'PPKn', 'IPA', 'MTK') — '*' for universal */
  subject: string;
  /** Grade level (e.g., '7', '8', '9') — '*' for any grade */
  grade: string;
  /** Semester ('1' or '2') — '*' for any semester */
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
// STARTER COURSE TEMPLATES — expanded for all 8 subjects
// ═══════════════════════════════════════════════════════════════════
// Every subject gets at least one template. The "template-kosong"
// uses subject='*' and grade='*' so it always appears in filters.

const COURSE_TEMPLATES: CourseTemplate[] = [
  // ── PPKn VII — Full learning module ──────────────────────────
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
    metadata: { icon: '⚖️', author: 'SILSE', version: '1.0.0' },
  },

  // ── PPKn VIII — Interaktif ──────────────────────────────────
  {
    id: 'modul-ppkn-viii',
    name: 'Modul PPKn Kelas VIII',
    description: 'Alur pembelajaran PPKn SMP kelas VIII dengan skenario interaktif: Cover → Tujuan → Skenario → Materi → Diskusi → Kuis → Refleksi → Penutup',
    subject: 'PPKn',
    grade: '8',
    semester: '1',
    theme: 'bhinneka-tunggal-ika',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A' },
      { templateType: 'skenario', label: 'Skenario Interaktif', suggestedBlocks: ['skenario'], variant: 'A' },
      { templateType: 'materi', label: 'Materi Pembelajaran', suggestedBlocks: ['materi-section'], variant: 'A' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A' },
    ],
    metadata: { icon: '⚖️', author: 'SILSE', version: '1.0.0' },
  },

  // ── IPA VIII — Eksperimen ───────────────────────────────────
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
    metadata: { icon: '🔬', author: 'SILSE', version: '1.0.0' },
  },

  // ── IPA VII — Standar ───────────────────────────────────────
  {
    id: 'modul-ipa-vii',
    name: 'Modul IPA Kelas VII',
    description: 'Alur pembelajaran IPA SMP kelas VII: Cover → Tujuan → Motivasi → Materi ×2 → Diskusi → Kuis → Refleksi → Penutup',
    subject: 'IPA',
    grade: '7',
    semester: '1',
    theme: 'ham-hak-kewajiban',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A' },
      { templateType: 'motivasi', label: 'Motivasi / Apersepsi', suggestedBlocks: ['motivasi'], variant: 'A' },
      { templateType: 'materi', label: 'Materi 1', suggestedBlocks: ['materi-section'], variant: 'A' },
      { templateType: 'materi', label: 'Materi 2', suggestedBlocks: ['materi-section'], variant: 'A' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A' },
    ],
    metadata: { icon: '🔬', author: 'SILSE', version: '1.0.0' },
  },

  // ── MTK VII — Standar ───────────────────────────────────────
  {
    id: 'modul-mtk-vii',
    name: 'Modul Matematika Kelas VII',
    description: 'Alur pembelajaran MTK SMP kelas VII: Cover → Tujuan → Motivasi → Materi → Contoh Soal → Latihan → Kuis → Rangkuman → Penutup',
    subject: 'MTK',
    grade: '7',
    semester: '1',
    theme: 'nilai-pancasila',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A' },
      { templateType: 'motivasi', label: 'Apersepsi', suggestedBlocks: ['motivasi'], variant: 'A' },
      { templateType: 'materi', label: 'Materi — Konsep Dasar', suggestedBlocks: ['materi-section'], variant: 'A' },
      { templateType: 'materi', label: 'Contoh Soal & Pembahasan', suggestedBlocks: ['materi-section'], variant: 'A' },
      { templateType: 'kuis', label: 'Latihan Soal', suggestedBlocks: ['kuis'], variant: 'A' },
      { templateType: 'materi', label: 'Rangkuman', suggestedBlocks: ['rangkuman'], variant: 'A' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A' },
    ],
    metadata: { icon: '📐', author: 'SILSE', version: '1.0.0' },
  },

  // ── MTK VIII — Interaktif ───────────────────────────────────
  {
    id: 'modul-mtk-viii',
    name: 'Modul Matematika Kelas VIII',
    description: 'Alur pembelajaran MTK SMP kelas VIII: Cover → Tujuan → Materi ×2 → Diskusi → Kuis → Refleksi → Penutup',
    subject: 'MTK',
    grade: '8',
    semester: '1',
    theme: 'globalisasi',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A' },
      { templateType: 'materi', label: 'Materi 1 — Konsep', suggestedBlocks: ['materi-section'], variant: 'A' },
      { templateType: 'materi', label: 'Materi 2 — Penerapan', suggestedBlocks: ['materi-section'], variant: 'A' },
      { templateType: 'diskusi', label: 'Diskusi Soal', suggestedBlocks: ['diskusi'], variant: 'A' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A' },
    ],
    metadata: { icon: '📐', author: 'SILSE', version: '1.0.0' },
  },

  // ── B. Indonesia VII — Standar ──────────────────────────────
  {
    id: 'modul-bin-vii',
    name: 'Modul B. Indonesia Kelas VII',
    description: 'Alur pembelajaran Bahasa Indonesia SMP kelas VII: Cover → Tujuan → Motivasi → Materi → Diskusi → Kuis → Refleksi → Penutup',
    subject: 'B.Indonesia',
    grade: '7',
    semester: '1',
    theme: 'perilaku-patuh',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A' },
      { templateType: 'motivasi', label: 'Motivasi', suggestedBlocks: ['motivasi'], variant: 'A' },
      { templateType: 'materi', label: 'Materi Pembelajaran', suggestedBlocks: ['materi-section'], variant: 'A' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A' },
    ],
    metadata: { icon: '📖', author: 'SILSE', version: '1.0.0' },
  },

  // ── B. Indonesia VIII — Interaktif ──────────────────────────
  {
    id: 'modul-bin-viii',
    name: 'Modul B. Indonesia Kelas VIII',
    description: 'Alur pembelajaran Bahasa Indonesia SMP kelas VIII: Cover → Tujuan → Skenario → Materi ×2 → Diskusi → Kuis → Rangkuman → Penutup',
    subject: 'B.Indonesia',
    grade: '8',
    semester: '1',
    theme: 'bhinneka-tunggal-ika',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A' },
      { templateType: 'skenario', label: 'Skenario Interaktif', suggestedBlocks: ['skenario'], variant: 'A' },
      { templateType: 'materi', label: 'Materi 1', suggestedBlocks: ['materi-section'], variant: 'A' },
      { templateType: 'materi', label: 'Materi 2', suggestedBlocks: ['materi-section'], variant: 'A' },
      { templateType: 'diskusi', label: 'Diskusi Kelompok', suggestedBlocks: ['diskusi'], variant: 'A' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A' },
      { templateType: 'rangkuman', label: 'Rangkuman', suggestedBlocks: ['rangkuman'], variant: 'A' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A' },
    ],
    metadata: { icon: '📖', author: 'SILSE', version: '1.0.0' },
  },

  // ── B. Inggris VIII — Interaktif ────────────────────────────
  {
    id: 'modul-bing-viii',
    name: 'Modul B. Inggris Kelas VIII',
    description: 'Alur pembelajaran Bahasa Inggris SMP kelas VIII: Cover → Tujuan → Skenario → Materi → Diskusi → Kuis → Refleksi → Penutup',
    subject: 'B.Inggris',
    grade: '8',
    semester: '1',
    theme: 'globalisasi',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A' },
      { templateType: 'dokumen', label: 'Learning Objectives', suggestedBlocks: ['tujuan-display'], variant: 'A' },
      { templateType: 'skenario', label: 'Interactive Scenario', suggestedBlocks: ['skenario'], variant: 'A' },
      { templateType: 'materi', label: 'Material', suggestedBlocks: ['materi-section'], variant: 'A' },
      { templateType: 'diskusi', label: 'Discussion', suggestedBlocks: ['diskusi'], variant: 'A' },
      { templateType: 'kuis', label: 'Quiz', suggestedBlocks: ['kuis'], variant: 'A' },
      { templateType: 'refleksi', label: 'Reflection', suggestedBlocks: ['refleksi'], variant: 'A' },
      { templateType: 'penutup', label: 'Closing', suggestedBlocks: ['penutup'], variant: 'A' },
    ],
    metadata: { icon: '🌍', author: 'SILSE', version: '1.0.0' },
  },

  // ── B. Inggris VII — Standar ────────────────────────────────
  {
    id: 'modul-bing-vii',
    name: 'Modul B. Inggris Kelas VII',
    description: 'Alur pembelajaran Bahasa Inggris SMP kelas VII: Cover → Tujuan → Materi → Diskusi → Kuis → Rangkuman → Penutup',
    subject: 'B.Inggris',
    grade: '7',
    semester: '1',
    theme: 'ham-hak-kewajiban',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A' },
      { templateType: 'dokumen', label: 'Learning Objectives', suggestedBlocks: ['tujuan-display'], variant: 'A' },
      { templateType: 'materi', label: 'Material', suggestedBlocks: ['materi-section'], variant: 'A' },
      { templateType: 'diskusi', label: 'Discussion', suggestedBlocks: ['diskusi'], variant: 'A' },
      { templateType: 'kuis', label: 'Quiz', suggestedBlocks: ['kuis'], variant: 'A' },
      { templateType: 'rangkuman', label: 'Summary', suggestedBlocks: ['rangkuman'], variant: 'A' },
      { templateType: 'penutup', label: 'Closing', suggestedBlocks: ['penutup'], variant: 'A' },
    ],
    metadata: { icon: '🌍', author: 'SILSE', version: '1.0.0' },
  },

  // ── Seni VII — Standar ──────────────────────────────────────
  {
    id: 'modul-seni-vii',
    name: 'Modul Seni Budaya Kelas VII',
    description: 'Alur pembelajaran Seni Budaya SMP kelas VII: Cover → Tujuan → Motivasi → Materi → Praktik → Diskusi → Refleksi → Penutup',
    subject: 'Seni',
    grade: '7',
    semester: '1',
    theme: 'perilaku-patuh',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A' },
      { templateType: 'motivasi', label: 'Motivasi / Apersepsi', suggestedBlocks: ['motivasi'], variant: 'A' },
      { templateType: 'materi', label: 'Materi Seni', suggestedBlocks: ['materi-section'], variant: 'A' },
      { templateType: 'diskusi', label: 'Praktik & Diskusi', suggestedBlocks: ['diskusi'], variant: 'A' },
      { templateType: 'refleksi', label: 'Refleksi Karya', suggestedBlocks: ['refleksi'], variant: 'A' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A' },
    ],
    metadata: { icon: '🎨', author: 'SILSE', version: '1.0.0' },
  },

  // ── Seni VIII — Interaktif ──────────────────────────────────
  {
    id: 'modul-seni-viii',
    name: 'Modul Seni Budaya Kelas VIII',
    description: 'Alur pembelajaran Seni Budaya SMP kelas VIII: Cover → Tujuan → Materi → Skenario Kreatif → Diskusi → Refleksi → Penutup',
    subject: 'Seni',
    grade: '8',
    semester: '1',
    theme: 'bhinneka-tunggal-ika',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A' },
      { templateType: 'materi', label: 'Materi Seni', suggestedBlocks: ['materi-section'], variant: 'A' },
      { templateType: 'skenario', label: 'Skenario Kreatif', suggestedBlocks: ['skenario'], variant: 'A' },
      { templateType: 'diskusi', label: 'Diskusi Karya', suggestedBlocks: ['diskusi'], variant: 'A' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A' },
    ],
    metadata: { icon: '🎨', author: 'SILSE', version: '1.0.0' },
  },

  // ── PJOK VII — Standar ──────────────────────────────────────
  {
    id: 'modul-pjok-vii',
    name: 'Modul PJOK Kelas VII',
    description: 'Alur pembelajaran PJOK SMP kelas VII: Cover → Tujuan → Motivasi → Materi → Praktik → Kuis → Refleksi → Penutup',
    subject: 'PJOK',
    grade: '7',
    semester: '1',
    theme: 'nilai-pancasila',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A' },
      { templateType: 'motivasi', label: 'Pemanasan / Motivasi', suggestedBlocks: ['motivasi'], variant: 'A' },
      { templateType: 'materi', label: 'Materi Kebugaran', suggestedBlocks: ['materi-section'], variant: 'A' },
      { templateType: 'diskusi', label: 'Praktik & Diskusi', suggestedBlocks: ['diskusi'], variant: 'A' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A' },
      { templateType: 'refleksi', label: 'Refleksi Aktivitas', suggestedBlocks: ['refleksi'], variant: 'A' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A' },
    ],
    metadata: { icon: '⚽', author: 'SILSE', version: '1.0.0' },
  },

  // ── PJOK VIII — Interaktif ──────────────────────────────────
  {
    id: 'modul-pjok-viii',
    name: 'Modul PJOK Kelas VIII',
    description: 'Alur pembelajaran PJOK SMP kelas VIII: Cover → Tujuan → Materi → Skenario Olahraga → Diskusi → Kuis → Penutup',
    subject: 'PJOK',
    grade: '8',
    semester: '1',
    theme: 'globalisasi',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A' },
      { templateType: 'materi', label: 'Materi Kebugaran', suggestedBlocks: ['materi-section'], variant: 'A' },
      { templateType: 'skenario', label: 'Skenario Olahraga', suggestedBlocks: ['skenario'], variant: 'A' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A' },
    ],
    metadata: { icon: '⚽', author: 'SILSE', version: '1.0.0' },
  },

  // ── PJOK IV (SD) — Gerak Dasar ──────────────────────────────
  {
    id: 'modul-pjok-iv',
    name: 'Modul PJOK Kelas IV SD',
    description: 'Alur pembelajaran PJOK SD kelas IV: Cover → Petunjuk → Tujuan → Materi ×3 → Kuis → Refleksi → Penutup',
    subject: 'PJOK',
    grade: '4',
    semester: '1',
    theme: 'nilai-pancasila',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A' },
      { templateType: 'petunjuk', label: 'Petunjuk', suggestedBlocks: ['petunjuk'], variant: 'A' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A' },
      { templateType: 'materi', label: 'Materi 1', suggestedBlocks: ['materi-section'], variant: 'A' },
      { templateType: 'materi', label: 'Materi 2', suggestedBlocks: ['materi-section'], variant: 'A' },
      { templateType: 'materi', label: 'Materi 3', suggestedBlocks: ['materi-section'], variant: 'A' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A' },
    ],
    metadata: { icon: '🏃', author: 'SILSE', version: '1.0.0' },
  },

  // ── PJOK X (SMA) — Kebugaran ────────────────────────────────
  {
    id: 'modul-pjok-x',
    name: 'Modul PJOK Kelas X SMA',
    description: 'Alur pembelajaran PJOK SMA kelas X: Cover → Tujuan → Materi ×2 → Studi Kasus → Kuis → Refleksi → Rangkuman → Penutup',
    subject: 'PJOK',
    grade: '10',
    semester: '1',
    theme: 'globalisasi',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A' },
      { templateType: 'materi', label: 'Materi 1 — Konsep Kebugaran', suggestedBlocks: ['materi-section'], variant: 'A' },
      { templateType: 'materi', label: 'Materi 2 — Prinsip Latihan', suggestedBlocks: ['materi-section'], variant: 'A' },
      { templateType: 'diskusi', label: 'Studi Kasus', suggestedBlocks: ['diskusi'], variant: 'A' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A' },
      { templateType: 'materi', label: 'Rangkuman', suggestedBlocks: ['rangkuman'], variant: 'A' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A' },
    ],
    metadata: { icon: '💪', author: 'SILSE', version: '1.0.0' },
  },

  // ── Template Kosong — Universal (subject='*', grade='*') ────
  {
    id: 'template-kosong',
    name: 'Template Kosong',
    description: 'Mulai dari nol dengan Cover dan Penutup saja. Tambahkan halaman sesuai kebutuhan.',
    subject: '*',
    grade: '*',
    semester: '*',
    theme: 'default',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A' },
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
 */
export function getCourseTemplatesBySubject(subject: string): CourseTemplate[] {
  return getAllCourseTemplates().filter(t => t.subject === subject || t.subject === '*');
}

/**
 * Get course templates filtered by subject and/or grade.
 *
 * Filtering logic:
 *   - subject filter: match t.subject === subject OR t.subject === '*'
 *   - grade filter: match t.grade === grade OR t.grade === '*'
 *   - The "template-kosong" (subject='*', grade='*') always passes both filters
 *   - Always puts template-kosong at the end of the list
 */
export function getCourseTemplatesFiltered(subject?: string, grade?: string): CourseTemplate[] {
  let results = getAllCourseTemplates();

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
    const page = createPageFromPreset(scene!.templateType, i);

    // Override label with the scene's label (immutable — page is fresh, not frozen yet)
    page.label = scene!.label;

    // Set variant if specified
    if (scene!.variant) {
      page.templateVariant = scene!.variant;
    }

    // For the cover page, inject the metadata (title, guru, sekolah)
    // IMPORTANT: Schema may be deepFrozen in dev mode from ensurePageSchema().
    // We must create new objects immutably instead of mutating in place.
    if (scene!.templateType === 'cover' && page.schema?.blocks) {
      page.schema = {
        ...page.schema,
        blocks: page.schema.blocks.map(block => {
          if (block.type !== 'cover') return block;
          const cover = block as unknown as Record<string, unknown>;
          const newMeta = { ...((cover.meta as Record<string, string>) || {}) };
          if (metadata.guru) newMeta.elemen = metadata.guru;
          if (metadata.sekolah) newMeta.fase = metadata.sekolah;
          return {
            ...block,
            ...(metadata.title ? { title: metadata.title } : {}),
            ...(metadata.guru || metadata.sekolah ? { meta: newMeta } : {}),
          };
        }),
      };
    }

    // For the penutup page, inject closing info (immutable)
    if (scene!.templateType === 'penutup' && page.schema?.blocks) {
      page.schema = {
        ...page.schema,
        blocks: page.schema.blocks.map(block => {
          if (block.type !== 'penutup') return block;
          return {
            ...block,
            ...(metadata.title ? { subtitle: `Terima kasih — ${metadata.title}` } : {}),
          };
        }),
      };
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
