// ═══════════════════════════════════════════════════════════════════
// GOLDEN FLOW — Interactive Lesson Template (SILSE v2.1)
// ═══════════════════════════════════════════════════════════════════
// Filosofi: experience → template → system
// 
// Ini adalah SATU-SATUNYA alur template aktif di SILSE v2.1.
// Semua template lain dibekukan di legacy/.
//
// Golden Flow: Hook → Konsep → Contoh → Aktivitas → Quiz → Refleksi
// Implementasi: Hakikat Norma (PPKn VII) — preset terbaik yang ada.
//
// Prinsip:
//   1. Output-first: desain 1 pengalaman sempurna dulu, baru generalisasi
//   2. Schema-driven: konten dari LessonSchema, bukan generator
//   3. Scene-aware: setiap scene punya emotional profile & reveal strategy
//   4. Interactive-first: bukan slide, tapi pengalaman belajar interaktif
//   5. Content-rich: konten nyata, bukan placeholder
//
// Referensi Visual DNA: src/core/visual-dna/visual-dna.ts
// Referensi Konten: src/presets/ppkn/hakikat-norma-schema.ts
// ═══════════════════════════════════════════════════════════════════

import type { SceneType } from '@/core/edu/education-scene-types';
import type { PageTemplateType } from '@/components/canva/types';

// ── Golden Flow Scene Definition ───────────────────────────────

export interface GoldenFlowScene {
  /** Scene position (0-based) */
  index: number;
  /** Scene type from the 8 Learning Scene Types */
  sceneType: SceneType;
  /** Page template type for PagePresetRegistry */
  templateType: PageTemplateType;
  /** Display label */
  label: string;
  /** Section color accent */
  sectionColor: string;
  /** Estimated duration */
  durasi: string;
  /** Narrative position in the learning arc */
  narrativePosition: 'opening' | 'rising' | 'climax' | 'falling' | 'closing';
  /** Scene intensity (0.0-1.0) */
  intensity: number;
  /** Reveal strategy for this scene */
  revealStrategy: 'all-visible' | 'progressive' | 'on-interaction';
  /** Primary block types in this scene */
  primaryBlocks: string[];
  /** Max blocks recommended */
  maxBlocks: number;
  /** Word budget range */
  wordRange: [number, number];
}

// ── THE GOLDEN FLOW — 11 Scenes for Interactive Lesson ─────────

export const GOLDEN_FLOW: GoldenFlowScene[] = [
  // ══ PHASE 1: ORIENTATION (intro) ════════════════════════════
  {
    index: 0,
    sceneType: 'intro',
    templateType: 'cover',
    label: 'Cover',
    sectionColor: 'y',
    durasi: '±2\'',
    narrativePosition: 'opening',
    intensity: 0.7,
    revealStrategy: 'all-visible',
    primaryBlocks: ['cover'],
    maxBlocks: 1,
    wordRange: [10, 30],
  },
  {
    index: 1,
    sceneType: 'intro',
    templateType: 'petunjuk',
    label: 'Petunjuk',
    sectionColor: 'c',
    durasi: '±2\'',
    narrativePosition: 'opening',
    intensity: 0.5,
    revealStrategy: 'progressive',
    primaryBlocks: ['petunjuk'],
    maxBlocks: 1,
    wordRange: [30, 60],
  },
  {
    index: 2,
    sceneType: 'intro',
    templateType: 'tujuan',
    label: 'Tujuan Pembelajaran',
    sectionColor: 'p',
    durasi: '±5\'',
    narrativePosition: 'opening',
    intensity: 0.5,
    revealStrategy: 'progressive',
    primaryBlocks: ['tp', 'alur'],
    maxBlocks: 2,
    wordRange: [30, 60],
  },

  // ══ PHASE 2: HOOK (apersepsi via skenario) ══════════════════
  {
    index: 3,
    sceneType: 'example',
    templateType: 'skenario',
    label: 'Apersepsi — Skenario Interaktif',
    sectionColor: 'p',
    durasi: '±10\'',
    narrativePosition: 'rising',
    intensity: 0.8,
    revealStrategy: 'on-interaction',
    primaryBlocks: ['skenario'],
    maxBlocks: 1,
    wordRange: [40, 80],
  },

  // ══ PHASE 3: EXPLORATION (diskusi + materi) ══════════════════
  {
    index: 4,
    sceneType: 'discussion',
    templateType: 'diskusi',
    label: 'Diskusi — Manusia Makhluk Sosial',
    sectionColor: 'c',
    durasi: '±15\'',
    narrativePosition: 'rising',
    intensity: 0.3,
    revealStrategy: 'progressive',
    primaryBlocks: ['def-box', 'nc-grid', 'diskusi'],
    maxBlocks: 3,
    wordRange: [60, 100],
  },
  {
    index: 5,
    sceneType: 'concept',
    templateType: 'materi',
    label: 'Materi 1 — Pengertian Norma',
    sectionColor: 'y',
    durasi: '±15\'',
    narrativePosition: 'rising',
    intensity: 0.4,
    revealStrategy: 'progressive',
    primaryBlocks: ['def-box', 'nc-grid', 'flashcard-set', 'diskusi'],
    maxBlocks: 4,
    wordRange: [80, 120],
  },
  {
    index: 6,
    sceneType: 'concept',
    templateType: 'materi',
    label: 'Materi 2 — Fungsi Norma',
    sectionColor: 'o',
    durasi: '±20\'',
    narrativePosition: 'rising',
    intensity: 0.4,
    revealStrategy: 'progressive',
    primaryBlocks: ['ftab', 'def-box', 'flashcard-set', 'diskusi'],
    maxBlocks: 4,
    wordRange: [80, 120],
  },

  // ══ PHASE 4: PRACTICE (game + quiz) ═════════════════════════
  {
    index: 7,
    sceneType: 'practice',
    templateType: 'game',
    label: 'Game Fungsi Norma',
    sectionColor: 'g',
    durasi: '±12\'',
    narrativePosition: 'climax',
    intensity: 0.8,
    revealStrategy: 'on-interaction',
    primaryBlocks: ['kuis'],
    maxBlocks: 1,
    wordRange: [20, 60],
  },
  {
    index: 8,
    sceneType: 'assessment',
    templateType: 'hasil',
    label: 'Hasil',
    sectionColor: 'g',
    durasi: '±2\'',
    narrativePosition: 'climax',
    intensity: 0.5,
    revealStrategy: 'all-visible',
    primaryBlocks: ['hasil'],
    maxBlocks: 1,
    wordRange: [10, 20],
  },

  // ══ PHASE 5: CLOSURE (refleksi + penutup) ═══════════════════
  {
    index: 9,
    sceneType: 'reflection',
    templateType: 'refleksi',
    label: 'Refleksi Diri',
    sectionColor: 'p',
    durasi: '±8\'',
    narrativePosition: 'falling',
    intensity: 0.2,
    revealStrategy: 'progressive',
    primaryBlocks: ['refleksi'],
    maxBlocks: 2,
    wordRange: [15, 40],
  },
  {
    index: 10,
    sceneType: 'summary',
    templateType: 'penutup',
    label: 'Penutup',
    sectionColor: 'o',
    durasi: '±3\'',
    narrativePosition: 'closing',
    intensity: 0.6,
    revealStrategy: 'all-visible',
    primaryBlocks: ['penutup'],
    maxBlocks: 1,
    wordRange: [10, 30],
  },
];

// ── Golden Flow Metadata ───────────────────────────────────────

export const GOLDEN_FLOW_META = {
  id: 'golden-interactive-lesson',
  name: 'Interactive Lesson (Golden Flow)',
  description: 'Alur pembelajaran interaktif terbaik: Hook → Konsep → Contoh → Aktivitas → Quiz → Refleksi',
  totalScenes: GOLDEN_FLOW.length,
  totalDuration: '±80 menit',
  subject: 'PPKn',
  grade: '7',
  semester: '1',
  presetId: 'hakikat-norma',      // Links to the premium preset
  themeId: 'golden-presentation', // Links to Visual DNA theme
  version: '2.1.0',
} as const;

// ── Intensity Curve Helper ─────────────────────────────────────

export function getGoldenFlowIntensityCurve(): Array<{
  scene: GoldenFlowScene;
  normalizedIntensity: number;
}> {
  const maxIntensity = Math.max(...GOLDEN_FLOW.map(s => s.intensity));
  return GOLDEN_FLOW.map(scene => ({
    scene,
    normalizedIntensity: scene.intensity / maxIntensity,
  }));
}

// ── Scene Lookup Helpers ───────────────────────────────────────

export function getGoldenFlowScene(index: number): GoldenFlowScene | undefined {
  return GOLDEN_FLOW[index];
}

export function getGoldenFlowSceneByType(sceneType: SceneType): GoldenFlowScene[] {
  return GOLDEN_FLOW.filter(s => s.sceneType === sceneType);
}

export function getGoldenFlowPhase(index: number): string {
  if (index <= 2) return 'ORIENTATION';
  if (index === 3) return 'HOOK';
  if (index <= 6) return 'EXPLORATION';
  if (index <= 8) return 'PRACTICE';
  return 'CLOSURE';
}

// ── Validation ─────────────────────────────────────────────────

export function validateGoldenFlow(): string[] {
  const warnings: string[] = [];

  // Must start with intro
  if (GOLDEN_FLOW[0]?.sceneType !== 'intro') {
    warnings.push('Golden flow harus dimulai dengan scene intro');
  }

  // Must end with summary
  if (GOLDEN_FLOW[GOLDEN_FLOW.length - 1]?.sceneType !== 'summary') {
    warnings.push('Golden flow harus diakhiri dengan scene summary');
  }

  // Check intensity monotony
  let sameIntensity = 1;
  for (let i = 1; i < GOLDEN_FLOW.length; i++) {
    if (GOLDEN_FLOW[i]!.intensity === GOLDEN_FLOW[i - 1]!.intensity) {
      sameIntensity++;
    } else {
      sameIntensity = 1;
    }
    if (sameIntensity >= 3) {
      warnings.push(`3+ scene berturut-turut di intensity ${GOLDEN_FLOW[i]!.intensity}`);
    }
  }

  // Check block density
  for (const scene of GOLDEN_FLOW) {
    if (scene.primaryBlocks.length > scene.maxBlocks) {
      warnings.push(`Scene "${scene.label}" punya ${scene.primaryBlocks.length} blocks > max ${scene.maxBlocks}`);
    }
  }

  return warnings;
}
