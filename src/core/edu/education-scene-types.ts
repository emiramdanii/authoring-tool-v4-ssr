/**
 * EDUCATIONAL SCENE TYPES — The fundamental unit is "Learning Scene", not "Slide"
 *
 * A Learning Scene is a pedagogical moment with:
 *   - State      (belum dimulai / sedang berlangsung / selesai)
 *   - Progression (scene sebelumnya → scene ini → scene berikutnya)
 *   - Interaction (reveal, click, answer, reflect)
 *   - Atmosphere  (visual mood yang berbeda per scene type)
 *   - Narrative arc (position in the learning journey)
 *
 * 8 Scene Types:
 *   1. Intro      — Membuka topik, bangun curiosity
 *   2. Concept    — Menjelaskan inti materi
 *   3. Example    — Memberi contoh konkret
 *   4. Practice   — Latihan, aktivitas siswa
 *   5. Discussion — Eksplorasi bersama
 *   6. Reflection — Metakognisi, berpikir tentang berpikir
 *   7. Assessment — Evaluasi formal
 *   8. Summary    — Penutup, rangkuman, closure
 *
 * Design Philosophy: "Guided Focus Design"
 *   - One focus per scene
 *   - Content-dominant, atmosphere-supportive
 *   - Duolingo/Khan Academy/Brilliant inspiration, NOT Canva/SaaS
 *
 * Reference: SILSE Educational Visual Philosophy v2.1
 */

// ═══════════════════════════════════════════════════════════════
// SCENE TYPE — Union type with full config
// ═══════════════════════════════════════════════════════════════

export type SceneType =
  | 'intro'       // Membuka topik
  | 'concept'     // Menjelaskan inti
  | 'example'     // Memberi contoh
  | 'practice'    // Latihan siswa
  | 'discussion'  // Eksplorasi bersama
  | 'reflection'  // Metakognisi
  | 'assessment'  // Evaluasi formal
  | 'summary';    // Penutup, closure

// ═══════════════════════════════════════════════════════════════
// NARRATIVE POSITION — Where this scene sits in the learning arc
// ═══════════════════════════════════════════════════════════════
// Pembelajaran yang enak punya rhythm:
//   Curiosity → Explanation → Discovery → Small Success →
//   Challenge → Reward → Reflection → Closure
//
// Narrative position determines:
//   - How dramatic the entrance should be
//   - How much visual weight to give
//   - What emotional state to target

export type NarrativePosition =
  | 'opening'   // Awal — curiosity, dramatic
  | 'rising'    // Naik — structured, progressive
  | 'climax'    // Puncak — focused, challenging
  | 'falling'   // Turun — contemplative, open
  | 'closing';  // Akhir — distillation, achievement

// ═══════════════════════════════════════════════════════════════
// REVEAL STRATEGY — How content appears in this scene
// ═══════════════════════════════════════════════════════════════
// Ini yang langsung mengubah ritme, pacing, dan rasa belajar.
//
// Summary scene → all-visible   (siswa sedang mereview)
// Concept scene → progressive   (memahami langkah demi langkah)
// Practice scene → on-interaction (siswa harus aktif dulu)

export type RevealStrategy =
  | 'all-visible'     // Semua konten langsung terlihat
  | 'progressive'     // Muncul bertahap (step by step)
  | 'on-interaction'; // Hanya muncul setelah siswa berinteraksi

// ═══════════════════════════════════════════════════════════════
// SCENE TYPE DEFINITION
// ═══════════════════════════════════════════════════════════════

export interface SceneTypeDefinition {
  /** Scene type identifier */
  id: SceneType;
  /** Indonesian label — "Pembuka", "Konsep", dll */
  labelId: string;
  /** English label — for internationalization */
  labelEn: string;
  /** Short description of pedagogical purpose */
  description: string;
  /** Position in the learning narrative arc */
  narrativePosition: NarrativePosition;
  /**
   * Scene intensity (0.0 - 1.0) — how "dramatic" this scene feels.
   * This creates the Narrative Rhythm Layer — intensity curve.
   *
   * Intro 0.7  — dramatic opening, build curiosity
   * Concept 0.4 — calm, focused absorption
   * Example 0.5 — mild engagement, "aha" moments
   * Practice 0.8 — high energy, active challenge
   * Discussion 0.3 — relaxed exploration
   * Reflection 0.2 — very calm, introspective
   * Assessment 0.5 — focused, not dramatic
   * Summary 0.6 — sense of achievement, closure
   */
  intensity: number;
  /** Default reveal strategy for this scene type */
  defaultRevealStrategy: RevealStrategy;
  /** What this scene achieves pedagogically */
  learningObjective: string;
  /** Primary semantic colors associated with this scene */
  primaryColors: string[];
  /** Recommended maximum blocks per scene (density budget) */
  maxBlocks: number;
  /** Recommended word budget per scene */
  optimalWordRange: [number, number];
  /** Minimum whitespace ratio for this scene type */
  minWhitespaceRatio: number;
}

// ═══════════════════════════════════════════════════════════════
// 8 SCENE TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export const SCENE_TYPES: Record<SceneType, SceneTypeDefinition> = {
  intro: {
    id: 'intro',
    labelId: 'Pembuka',
    labelEn: 'Introduction',
    description: 'Membuka topik, membangun curiosity, menampilkan tujuan pembelajaran',
    narrativePosition: 'opening',
    intensity: 0.7,
    defaultRevealStrategy: 'progressive',
    learningObjective: 'Membangun curiosity dan orientasi — siswa tahu akan belajar apa dan mengapa',
    primaryColors: ['tujuan', 'aktivitas'],
    maxBlocks: 3,
    optimalWordRange: [20, 60],
    minWhitespaceRatio: 0.45,
  },
  concept: {
    id: 'concept',
    labelId: 'Konsep',
    labelEn: 'Concept',
    description: 'Menjelaskan inti materi, definisi, teori utama',
    narrativePosition: 'rising',
    intensity: 0.4,
    defaultRevealStrategy: 'progressive',
    learningObjective: 'Pemahaman konsep inti — siswa memahami ide fundamental',
    primaryColors: ['materi'],
    maxBlocks: 4,
    optimalWordRange: [60, 120],
    minWhitespaceRatio: 0.30,
  },
  example: {
    id: 'example',
    labelId: 'Contoh',
    labelEn: 'Example',
    description: 'Memberi contoh konkret, studi kasus, penerapan konsep',
    narrativePosition: 'rising',
    intensity: 0.5,
    defaultRevealStrategy: 'on-interaction',
    learningObjective: 'Pemahaman melalui contoh — siswa melihat peneraban konsep',
    primaryColors: ['contoh'],
    maxBlocks: 3,
    optimalWordRange: [40, 80],
    minWhitespaceRatio: 0.35,
  },
  practice: {
    id: 'practice',
    labelId: 'Latihan',
    labelEn: 'Practice',
    description: 'Latihan, aktivitas siswa, game interaktif, eksperimen',
    narrativePosition: 'climax',
    intensity: 0.8,
    defaultRevealStrategy: 'on-interaction',
    learningObjective: 'Penerapan aktif — siswa menggunakan apa yang dipelajari',
    primaryColors: ['aktivitas', 'quiz'],
    maxBlocks: 3,
    optimalWordRange: [20, 60],
    minWhitespaceRatio: 0.40,
  },
  discussion: {
    id: 'discussion',
    labelId: 'Diskusi',
    labelEn: 'Discussion',
    description: 'Eksplorasi bersama, pertanyaan terbuka, berbagi perspektif',
    narrativePosition: 'falling',
    intensity: 0.3,
    defaultRevealStrategy: 'progressive',
    learningObjective: 'Eksplorasi kolaboratif — siswa memperdalam pemahaman melalui dialog',
    primaryColors: ['diskusi'],
    maxBlocks: 2,
    optimalWordRange: [30, 60],
    minWhitespaceRatio: 0.40,
  },
  reflection: {
    id: 'reflection',
    labelId: 'Refleksi',
    labelEn: 'Reflection',
    description: 'Metakognisi, berpikir tentang berpikir, self-assessment',
    narrativePosition: 'falling',
    intensity: 0.2,
    defaultRevealStrategy: 'progressive',
    learningObjective: 'Metakognisi — siswa merefleksikan apa yang dipahami',
    primaryColors: ['refleksi'],
    maxBlocks: 2,
    optimalWordRange: [15, 40],
    minWhitespaceRatio: 0.50,
  },
  assessment: {
    id: 'assessment',
    labelId: 'Evaluasi',
    labelEn: 'Assessment',
    description: 'Evaluasi formal, kuis, soal, penilaian kompetensi',
    narrativePosition: 'climax',
    intensity: 0.5,
    defaultRevealStrategy: 'on-interaction',
    learningObjective: 'Evaluasi kompetensi — siswa menunjukkan penguasaan materi',
    primaryColors: ['quiz'],
    maxBlocks: 2,
    optimalWordRange: [10, 40],
    minWhitespaceRatio: 0.40,
  },
  summary: {
    id: 'summary',
    labelId: 'Rangkuman',
    labelEn: 'Summary',
    description: 'Penutup, rangkuman poin kunci, closure, preview berikutnya',
    narrativePosition: 'closing',
    intensity: 0.6,
    defaultRevealStrategy: 'all-visible',
    learningObjective: 'Konsolidasi dan closure — siswa mengonsolidasikan pembelajaran',
    primaryColors: ['rangkuman'],
    maxBlocks: 3,
    optimalWordRange: [30, 70],
    minWhitespaceRatio: 0.40,
  },
};

// ═══════════════════════════════════════════════════════════════
// TEMPLATE → SCENE TYPE MAPPING
// ═══════════════════════════════════════════════════════════════
// PageTemplateType (16 presets) → SceneType (8 types)
// NOT 1:1 — multiple presets can map to the same scene type.

export type PageTemplateType = string;

export const TEMPLATE_TO_SCENE: Record<PageTemplateType, SceneType> = {
  cover: 'intro',
  petunjuk: 'intro',
  tujuan: 'intro',
  motivasi: 'intro',
  hero: 'intro',
  dokumen: 'intro',
  materi: 'concept',
  rangkuman: 'summary',
  skenario: 'example',
  diskusi: 'discussion',
  kuis: 'assessment',
  game: 'practice',
  hasil: 'assessment',
  refleksi: 'reflection',
  penutup: 'summary',
  custom: 'concept',    // default — treat custom as concept
};

// ═══════════════════════════════════════════════════════════════
// BLOCK TYPE → SCENE TYPE HINT
// ═══════════════════════════════════════════════════════════════
// When a block appears alone or dominates a scene,
// it hints at what scene type this should be.
// Used as fallback when no template/scene type is specified.

export const BLOCK_SCENE_HINT: Record<string, SceneType> = {
  cover: 'intro',
  hero: 'intro',
  petunjuk: 'intro',
  'tujuan-display': 'intro',
  tp: 'intro',
  motivasi: 'intro',
  'materi-section': 'concept',
  'materi-blok': 'concept',
  'def-box': 'concept',
  'nc-grid': 'concept',
  ftabel: 'concept',
  gambar: 'concept',
  tabel: 'concept',
  timeline: 'concept',
  compare: 'concept',
  statistik: 'concept',
  flashcard: 'example',
  'flashcard-set': 'example',
  reveal: 'example',
  studi: 'example',
  checklist: 'example',
  skenario: 'example',
  alur: 'practice',
  aktivitas: 'practice',
  'sortir-game': 'practice',
  'roda-game': 'practice',
  'memory-game': 'practice',
  'matching-game': 'practice',
  'fill-blank-game': 'practice',
  'word-search-game': 'practice',
  'true-false-game': 'practice',
  'drag-drop-game': 'practice',
  'crossword-game': 'practice',
  'team-buzzer-game': 'practice',
  diskusi: 'discussion',
  refleksi: 'reflection',
  kuis: 'assessment',
  hasil: 'assessment',
  rangkuman: 'summary',
  penutup: 'summary',
  'nk-card': 'concept',
};

// ═══════════════════════════════════════════════════════════════
// SCENE INTENSITY CURVE — Narrative Rhythm Layer
// ═══════════════════════════════════════════════════════════════
// The intensity curve ensures learning FLOWS:
//   Intro (0.7) → Concept (0.4) → Example (0.5) → Practice (0.8)
//   → Discussion (0.3) → Reflection (0.2) → Assessment (0.5)
//   → Summary (0.6)
//
// This creates the "mengalir" feeling.
// Without it, all scenes at same intensity = boring even with good UI.

export function getSceneIntensityCurve(scenes: SceneType[]): Array<{ scene: SceneType; intensity: number; position: NarrativePosition }> {
  return scenes.map(scene => ({
    scene,
    intensity: SCENE_TYPES[scene].intensity,
    position: SCENE_TYPES[scene].narrativePosition,
  }));
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Infer scene type from context
// ═══════════════════════════════════════════════════════════════

/**
 * Determine the SceneType for a given page/block context.
 * Priority:
 *   1. Explicit sceneType (if provided)
 *   2. Template type mapping
 *   3. Block type hint (first block in scene)
 *   4. Default: 'concept'
 */
export function inferSceneType(
  explicitSceneType?: SceneType,
  templateType?: string,
  primaryBlockType?: string,
): SceneType {
  if (explicitSceneType) return explicitSceneType;
  if (templateType && templateType in TEMPLATE_TO_SCENE) {
    return TEMPLATE_TO_SCENE[templateType];
  }
  if (primaryBlockType && primaryBlockType in BLOCK_SCENE_HINT) {
    return BLOCK_SCENE_HINT[primaryBlockType];
  }
  return 'concept';
}

/**
 * Get the SceneTypeDefinition for a scene type.
 */
export function getSceneDefinition(sceneType: SceneType): SceneTypeDefinition {
  return SCENE_TYPES[sceneType];
}

/**
 * Validate a sequence of scene types for narrative coherence.
 * Returns warnings if the narrative arc seems broken.
 */
export function validateNarrativeArc(scenes: SceneType[]): string[] {
  const warnings: string[] = [];

  if (scenes.length === 0) return warnings;

  // Should start with 'opening' position
  if (SCENE_TYPES[scenes[0]!].narrativePosition !== 'opening') {
    warnings.push('Pembelajaran sebaiknya dimulai dengan scene "intro" (opening)');
  }

  // Should end with 'closing' position
  if (SCENE_TYPES[scenes[scenes.length - 1]!].narrativePosition !== 'closing') {
    warnings.push('Pembelajaran sebaiknya diakhiri dengan scene "summary" (closing)');
  }

  // Check for intensity monotony — 3+ scenes at same intensity
  let sameIntensityCount = 1;
  for (let i = 1; i < scenes.length; i++) {
    if (SCENE_TYPES[scenes[i]!].intensity === SCENE_TYPES[scenes[i - 1]!].intensity) {
      sameIntensityCount++;
    } else {
      sameIntensityCount = 1;
    }
    if (sameIntensityCount >= 3) {
      warnings.push(`3+ scene berturut-turut dengan intensitas sama (${SCENE_TYPES[scenes[i]!].intensity}) — bisa terasa monoton`);
      break;
    }
  }

  return warnings;
}
