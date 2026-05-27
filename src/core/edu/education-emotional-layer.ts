/**
 * EDUCATIONAL EMOTIONAL LAYER — "Structured Fun"
 *
 * 70% structure, 30% engagement.
 * FUN LEARNING EXPERIENCE, bukan FUN VISUAL.
 *
 * Yang dibuat hidup:
 *   - Reveal bertahap                (Discovery)
 *   - Progress terasa berkembang      (Progress)
 *   - Check/success animation         (Reward)
 *   - Informasi tidak langsung tampil (Discovery)
 *   - Rhythm mudah → sulit → berhasil  (Challenge — FASE 2)
 *
 * Yang tetap stabil:
 *   - Typography → readability
 *   - Hierarchy  → fokus
 *   - Spacing    → cognitive load
 *   - Layout     → orientasi
 *   - Navigation → tidak bingung
 *
 * MVP: 3 Core Emotions
 *   1. Progress  — "Aku maju" (paling penting)
 *   2. Discovery — "Oh, ternyata begitu!" (kedua penting)
 *   3. Reward    — "Aku berhasil!" (bukan gamification, reward kecil)
 *
 * FASE 2 (bukan sekarang):
 *   4. Challenge — "Bisa aku jawab?" (tunggu Progress+Discovery+Reward dulu)
 *   5. Curiosity — "Apa yang terjadi kalau...?"
 *
 * Reference: SILSE Educational Visual Philosophy v2.1
 */

import type { SceneType } from './education-scene-types';
import { SCENE_TYPES } from './education-scene-types';

// ═══════════════════════════════════════════════════════════════
// MVP EMOTIONAL DRIVERS — 3 Core Only
// ═══════════════════════════════════════════════════════════════

export type EmotionalDriver =
  | 'progress'    // "Aku sudah sampai mana?" — step progress, completion
  | 'discovery'   // "Oh, ternyata begitu!"  — reveal, explore
  | 'reward';     // "Aku berhasil!"          — check, success state

// FASE 2 — Uncomment when ready
// | 'challenge'   // "Bisa aku jawab?"
// | 'curiosity'   // "Apa yang terjadi kalau...?"

// ═══════════════════════════════════════════════════════════════
// EMOTIONAL TRIGGERS — What prompts engagement
// ═══════════════════════════════════════════════════════════════

export type EmotionalTrigger =
  | 'reveal'        // Konten muncul bertahap (Discovery)
  | 'click-to-show' // Contoh muncul setelah klik (Discovery)
  | 'accordion'     // Accordion insight (Discovery)
  | 'see-answer'    // "Lihat jawaban" (Discovery)
  | 'step-next'     // Step progress (Progress)
  | 'section-done'  // Section completed (Progress)
  | 'progress-fill' // Progress bar terisi (Progress)
  | 'checklist'     // Checklist item selesai (Progress)
  | 'correct';      // Jawaban benar (Reward)

// ═══════════════════════════════════════════════════════════════
// EMOTIONAL REWARDS — What provides satisfaction
// ═══════════════════════════════════════════════════════════════
// BUKAN gamification.
// Reward kecil, pedagogis, satisfying.

export type EmotionalReward =
  | 'check-draw'       // Check mark tergambar (jawaban benar)
  | 'scale-pop'        // Subtle scale 1→1.05→1 (item selesai)
  | 'pulse-once'       // Subtle pulse sekali (keberhasilan kecil)
  | 'success-state'    // Element berubah ke state "berhasil"
  | 'completed-badge'  // Badge kecil "Selesai" (section done)
  | 'progress-fill'    // Progress bar terisi
  | 'fill-bar';        // Bar terisi penuh (major completion)

// ═══════════════════════════════════════════════════════════════
// EMOTIONAL MOTION — Motion yang MENDUKUNG pembelajaran
// ═══════════════════════════════════════════════════════════════
// BERBEDA dari decorative motion yang DILARANG di education-motion.ts.
//
// Perbedaan kritis:
//   entrance motion   → konten muncul di layar (structural)
//   emotional motion  → merespons tindakan pembelajaran (pedagogical)
//   decorative motion → dekoratif tanpa tujuan pedagogis (DILARANG)
//
// Contoh:
//   pulse-once (check mark berdenyut sekali)  → emotional (BOLEH)
//   pulse (berdenyut terus-menerus)            → forbidden (MENGANGGU)
//   confetti burst                             → gamification layer (FASE 3)
//   holographic shimmer                        → decorative (DILARANG)

export interface EmotionalMotionConfig {
  /** Duration in ms — slightly slower than entrance, biar terasa */
  duration: number;
  /** Easing — not bounce/elastic, but satisfying */
  easing: string;
  /** Optional: delay before start (for staggered reveals) */
  delay?: number;
}

export const EMOTIONAL_MOTION = {
  /** Progress motion — how progress fills animate */
  progress: {
    /** Progress bar fill — smooth, biar terasa bergerak */
    fillBar: {
      duration: 400,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    } satisfies EmotionalMotionConfig,
    /** Step increment — one step forward */
    stepNext: {
      duration: 300,
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
    } satisfies EmotionalMotionConfig,
    /** Section done — completed state transition */
    sectionDone: {
      duration: 350,
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
    } satisfies EmotionalMotionConfig,
    /** Checklist item check */
    checklistCheck: {
      duration: 250,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    } satisfies EmotionalMotionConfig,
  },

  /** Discovery motion — how reveals and discoveries animate */
  discovery: {
    /** Reveal — content appears progressively */
    reveal: {
      duration: 250,
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      delay: 0,
    } satisfies EmotionalMotionConfig,
    /** Reveal stagger — delay between sequential items */
    revealStagger: 80,
    /** Click-to-show — appears after student clicks */
    clickToShow: {
      duration: 200,
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
    } satisfies EmotionalMotionConfig,
    /** Accordion expand */
    accordionExpand: {
      duration: 250,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    } satisfies EmotionalMotionConfig,
    /** See answer — answer revealed */
    seeAnswer: {
      duration: 300,
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
    } satisfies EmotionalMotionConfig,
  },

  /** Reward motion — how successes are celebrated (subtly) */
  reward: {
    /** Check mark draw — SVG stroke animation */
    checkDraw: {
      duration: 350,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    } satisfies EmotionalMotionConfig,
    /** Scale pop — subtle scale 1→1.05→1 (NOT bounce) */
    scalePop: {
      duration: 250,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    } satisfies EmotionalMotionConfig,
    /** Pulse once — subtle opacity/scale pulse sekali saja */
    pulseOnce: {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    } satisfies EmotionalMotionConfig,
    /** Success state — element transitions to "done" state */
    successState: {
      duration: 300,
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
    } satisfies EmotionalMotionConfig,
    /** Completed badge — small badge appears */
    completedBadge: {
      duration: 250,
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
    } satisfies EmotionalMotionConfig,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// SCENE EMOTIONAL PROFILE — Each scene has different emotional needs
// ═══════════════════════════════════════════════════════════════

export interface SceneEmotionalProfile {
  /** Which scene type this profile is for */
  sceneType: SceneType;
  /** Primary emotional driver */
  primary: EmotionalDriver;
  /** Secondary emotional driver */
  secondary: EmotionalDriver;
  /** Available triggers for this scene */
  triggers: EmotionalTrigger[];
  /** Available rewards for this scene */
  rewards: EmotionalReward[];
  /** How content should be revealed by default */
  revealStrategy: 'all-visible' | 'progressive' | 'on-interaction';
  /**
   * Reward intensity (0-1) — how "celebratory" rewards should be.
   * Practice = 0.8 (banyak reward, siswa butuh motivasi)
   * Reflection = 0.3 (reward minimal, ini tentang introspeksi)
   */
  rewardIntensity: number;
  /**
   * Discovery depth (0-1) — how much content is hidden by default.
   * Example = 0.8 (banyak yang tersembunyi, siswa klik untuk lihat)
   * Summary = 0.1 (hampir semua visible, ini untuk review)
   */
  discoveryDepth: number;
}

// ═══════════════════════════════════════════════════════════════
// 8 SCENE EMOTIONAL PROFILES
// ═══════════════════════════════════════════════════════════════

export const SCENE_EMOTIONAL_PROFILES: Record<SceneType, SceneEmotionalProfile> = {
  intro: {
    sceneType: 'intro',
    primary: 'progress',
    secondary: 'discovery',
    triggers: ['step-next', 'progress-fill', 'reveal'],
    rewards: ['progress-fill', 'completed-badge'],
    revealStrategy: 'progressive',
    rewardIntensity: 0.4,
    discoveryDepth: 0.3,
  },
  concept: {
    sceneType: 'concept',
    primary: 'discovery',
    secondary: 'progress',
    triggers: ['reveal', 'click-to-show', 'accordion', 'step-next'],
    rewards: ['progress-fill', 'pulse-once'],
    revealStrategy: 'progressive',
    rewardIntensity: 0.3,
    discoveryDepth: 0.5,
  },
  example: {
    sceneType: 'example',
    primary: 'discovery',
    secondary: 'reward',
    triggers: ['click-to-show', 'see-answer', 'reveal'],
    rewards: ['check-draw', 'success-state'],
    revealStrategy: 'on-interaction',
    rewardIntensity: 0.5,
    discoveryDepth: 0.8,
  },
  practice: {
    sceneType: 'practice',
    primary: 'progress',
    secondary: 'reward',
    triggers: ['correct', 'step-next', 'section-done', 'checklist'],
    rewards: ['check-draw', 'scale-pop', 'pulse-once', 'progress-fill', 'completed-badge'],
    revealStrategy: 'on-interaction',
    rewardIntensity: 0.8,
    discoveryDepth: 0.6,
  },
  discussion: {
    sceneType: 'discussion',
    primary: 'discovery',
    secondary: 'progress',
    triggers: ['reveal', 'click-to-show'],
    rewards: ['pulse-once', 'success-state'],
    revealStrategy: 'progressive',
    rewardIntensity: 0.3,
    discoveryDepth: 0.4,
  },
  reflection: {
    sceneType: 'reflection',
    primary: 'progress',
    secondary: 'discovery',
    triggers: ['step-next', 'reveal'],
    rewards: ['completed-badge', 'pulse-once'],
    revealStrategy: 'progressive',
    rewardIntensity: 0.3,
    discoveryDepth: 0.2,
  },
  assessment: {
    sceneType: 'assessment',
    primary: 'progress',
    secondary: 'reward',
    triggers: ['correct', 'step-next', 'section-done'],
    rewards: ['check-draw', 'success-state', 'fill-bar'],
    revealStrategy: 'on-interaction',
    rewardIntensity: 0.6,
    discoveryDepth: 0.7,
  },
  summary: {
    sceneType: 'summary',
    primary: 'reward',
    secondary: 'progress',
    triggers: ['step-next', 'section-done'],
    rewards: ['fill-bar', 'completed-badge', 'success-state'],
    revealStrategy: 'all-visible',
    rewardIntensity: 0.7,
    discoveryDepth: 0.1,
  },
};

// ═══════════════════════════════════════════════════════════════
// HELPER: Get emotional profile for a scene
// ═══════════════════════════════════════════════════════════════

export function getSceneEmotionalProfile(sceneType: SceneType): SceneEmotionalProfile {
  return SCENE_EMOTIONAL_PROFILES[sceneType];
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Build CSS for emotional motion
// ═══════════════════════════════════════════════════════════════

/**
 * Get CSS transition/animation for an emotional reward.
 * Returns inline style object for React components.
 */
export function emotionalRewardStyle(
  reward: EmotionalReward,
  options?: { delay?: number },
): Record<string, string> {
  const delay = options?.delay ?? 0;

  switch (reward) {
    case 'check-draw': {
      const m = EMOTIONAL_MOTION.reward.checkDraw;
      return {
        transition: `all ${m.duration}ms ${m.easing} ${delay}ms`,
      };
    }
    case 'scale-pop': {
      const m = EMOTIONAL_MOTION.reward.scalePop;
      return {
        transition: `transform ${m.duration}ms ${m.easing} ${delay}ms`,
      };
    }
    case 'pulse-once': {
      const m = EMOTIONAL_MOTION.reward.pulseOnce;
      return {
        animation: `eduPulseOnce ${m.duration}ms ${m.easing} ${delay}ms both`,
      };
    }
    case 'success-state': {
      const m = EMOTIONAL_MOTION.reward.successState;
      return {
        transition: `all ${m.duration}ms ${m.easing} ${delay}ms`,
      };
    }
    case 'completed-badge': {
      const m = EMOTIONAL_MOTION.reward.completedBadge;
      return {
        animation: `eduFadeIn ${m.duration}ms ${m.easing} ${delay}ms both`,
      };
    }
    case 'progress-fill': {
      const m = EMOTIONAL_MOTION.progress.fillBar;
      return {
        transition: `width ${m.duration}ms ${m.easing} ${delay}ms`,
      };
    }
    case 'fill-bar': {
      const m = EMOTIONAL_MOTION.progress.fillBar;
      return {
        transition: `width ${m.duration}ms ${m.easing} ${delay}ms`,
      };
    }
  }
}

/**
 * Get CSS transition for a discovery reveal.
 * Returns inline style object for React components.
 */
export function emotionalDiscoveryStyle(
  trigger: EmotionalTrigger,
  index?: number,
): Record<string, string> {
  const stagger = index ? index * EMOTIONAL_MOTION.discovery.revealStagger : 0;

  switch (trigger) {
    case 'reveal': {
      const m = EMOTIONAL_MOTION.discovery.reveal;
      return {
        animation: `eduSlideUp ${m.duration}ms ${m.easing} ${stagger}ms both`,
      };
    }
    case 'click-to-show': {
      const m = EMOTIONAL_MOTION.discovery.clickToShow;
      return {
        transition: `all ${m.duration}ms ${m.easing}`,
      };
    }
    case 'accordion': {
      const m = EMOTIONAL_MOTION.discovery.accordionExpand;
      return {
        transition: `all ${m.duration}ms ${m.easing}`,
      };
    }
    case 'see-answer': {
      const m = EMOTIONAL_MOTION.discovery.seeAnswer;
      return {
        transition: `all ${m.duration}ms ${m.easing}`,
      };
    }
    default: {
      // Progress triggers use standard edu transition
      return {
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      };
    }
  }
}

/**
 * Get CSS transition for progress animations.
 */
export function emotionalProgressStyle(
  trigger: 'step-next' | 'section-done' | 'checklist' | 'progress-fill',
): Record<string, string> {
  switch (trigger) {
    case 'step-next': {
      const m = EMOTIONAL_MOTION.progress.stepNext;
      return { transition: `all ${m.duration}ms ${m.easing}` };
    }
    case 'section-done': {
      const m = EMOTIONAL_MOTION.progress.sectionDone;
      return { transition: `all ${m.duration}ms ${m.easing}` };
    }
    case 'checklist': {
      const m = EMOTIONAL_MOTION.progress.checklistCheck;
      return { transition: `all ${m.duration}ms ${m.easing}` };
    }
    case 'progress-fill': {
      const m = EMOTIONAL_MOTION.progress.fillBar;
      return { transition: `width ${m.duration}ms ${m.easing}` };
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// CSS KEYFRAMES — Must be injected into the page
// ═══════════════════════════════════════════════════════════════
// These keyframes support emotional motions.
// Add to global CSS or inject via useLayoutEffect.

export const EMOTIONAL_KEYFRAMES = `
@keyframes eduPulseOnce {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.06); opacity: 0.9; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes eduCheckDraw {
  0% { stroke-dashoffset: 24; }
  100% { stroke-dashoffset: 0; }
}

@keyframes eduScalePop {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes eduFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes eduSlideUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
` as const;

// ═══════════════════════════════════════════════════════════════
// DISTINCTION: Emotional Motion vs Forbidden Motion
// ═══════════════════════════════════════════════════════════════
// This table documents WHY certain motions are allowed as "emotional"
// while similar motions are forbidden as "decorative".

export const EMOTIONAL_VS_DECORATIVE = {
  // PULSE
  'pulse-once': {
    verdict: 'ALLOWED' as const,
    reason: 'Check mark berdenyut sekali saat jawaban benar — pedagogis, memberi sinyal keberhasilan',
  },
  'pulse (continuous)': {
    verdict: 'FORBIDDEN' as const,
    reason: 'Berdenyut terus-menerus tanpa henti — mengganggu fokus, tidak pedagogis',
  },

  // SCALE
  'scale-pop': {
    verdict: 'ALLOWED' as const,
    reason: 'Skala 1→1.05→1 sekali saat item selesai — satisfying, tidak distraktif',
  },
  'bounce': {
    verdict: 'FORBIDDEN' as const,
    reason: 'Bouncing berulang — distraktif, mengganggu, seperti game bukan pembelajaran',
  },

  // CONFETTI
  'completed-badge': {
    verdict: 'ALLOWED' as const,
    reason: 'Badge kecil "Selesai" muncul — informative, motivasi halus',
  },
  'confetti': {
    verdict: 'FORBIDDEN' as const,
    reason: 'Confetti explosion — gamification layer (FASE 3), terlalu intense untuk emotional layer',
  },

  // SHIMMER
  'progress-fill': {
    verdict: 'ALLOWED' as const,
    reason: 'Progress bar terisi — memberi rasa kemajuan, pedagogis',
  },
  'holographic-shimmer': {
    verdict: 'FORBIDDEN' as const,
    reason: 'Gradien bergerak holografik — dekoratif murni, tidak pedagogis',
  },
} as const;
