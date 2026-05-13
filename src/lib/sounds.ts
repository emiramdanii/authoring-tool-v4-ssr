// ═══════════════════════════════════════════════════════════════
// SOUND HELPER — Simple playSound() for interactive feedback
// ═══════════════════════════════════════════════════════════════
// Uses SuaraConfig from authoring store to check if each sound
// category is enabled. Audio files are cached after first load.
// No SoundManager class needed — just a function.

import { useAuthoringStore } from '@/store/authoring-store';

// ── Audio cache ───────────────────────────────────────────────
const cache = new Map<string, HTMLAudioElement>();

// ── Sound ID → file mapping ──────────────────────────────────
const SOUND_FILES: Record<string, string> = {
  correct: '/sounds/correct.mp3',
  incorrect: '/sounds/incorrect.mp3',
  complete: '/sounds/complete.mp3',
  click: '/sounds/click.mp3',
  tap: '/sounds/tap.mp3',
  ding: '/sounds/ding.mp3',
  buzz: '/sounds/buzz.mp3',
  // Phase 5: New sound effects for memory/matching/fill-blank games
  flip: '/sounds/tap.mp3',       // Card flip (memory game) — reuses tap
  match: '/sounds/correct.mp3',  // Pair matched — reuses correct
  typing: '/sounds/tap.mp3',     // Key press feedback — reuses tap
};

// ── Sound ID → SuaraConfig key mapping ───────────────────────
const SOUND_CONFIG: Record<string, keyof import('@/store/authoring/types').SuaraConfig> = {
  correct: 'benar',
  incorrect: 'salah',
  complete: 'selesai',
  click: 'navigasi',
  tap: 'klik',
  ding: 'skor',
  buzz: 'salah',
  // Phase 5: New sound config mappings
  flip: 'klik',
  match: 'benar',
  typing: 'klik',
};

// ── Volume ────────────────────────────────────────────────────
const VOLUME = 0.3;

// ── Play sound ───────────────────────────────────────────────
export function playSound(id: string) {
  // Only run in browser
  if (typeof window === 'undefined') return;

  // Check if this sound category is enabled in SuaraConfig
  const configKey = SOUND_CONFIG[id];
  if (configKey) {
    const suara = useAuthoringStore.getState().suara;
    if (!suara[configKey]) return;
  }

  // Get or create cached Audio element
  const src = SOUND_FILES[id];
  if (!src) return;

  let audio = cache.get(id);
  if (!audio) {
    audio = new Audio(src);
    audio.volume = VOLUME;
    cache.set(id, audio);
  }

  // Reset and play
  audio.currentTime = 0;
  audio.play().catch(() => {
    // Silently fail — autoplay restrictions, etc.
  });
}

// ── Preload all sounds ───────────────────────────────────────
export function preloadSounds() {
  if (typeof window === 'undefined') return;
  for (const [id, src] of Object.entries(SOUND_FILES)) {
    if (!cache.has(id)) {
      const audio = new Audio(src);
      audio.volume = VOLUME;
      cache.set(id, audio);
    }
  }
}
