// ═══════════════════════════════════════════════════════════════
// CONFETTI HELPER — Enhanced CSS-based celebration effects
// ═══════════════════════════════════════════════════════════════
// Creates DOM-based confetti particles with CSS animations.
// No external dependencies needed. Automatically cleans up after
// the animation completes.
//
// Available functions:
//   fireConfetti()          — Standard center burst
//   fireStarBurst()         — Small burst for correct answers
//   fireConfettiMini()      — Very small burst for single achievements
//   fireConfettiSideCannons() — Fires from left and right sides
//   fireConfettiCelebration() — Multi-stage celebration sequence

const CONFETTI_COLORS = [
  '#f9c12e', '#3ecfcf', '#34d399', '#a78bfa', '#ff6b6b',
  '#fb923c', '#fbbf24', '#22d3ee', '#f472b6', '#818cf8',
];

// Particle shapes rendered as text characters
const SHAPE_CHARS = ['★', '●', '■', '◆', '✦', '♥', '✿', '⬟'];

interface ConfettiOptions {
  /** Number of particles (default: 50) */
  count?: number;
  /** Duration in ms (default: 3000) */
  duration?: number;
  /** Container element (default: document.body) */
  container?: HTMLElement;
  /** Origin point X (0-1, default: 0.5 center) */
  originX?: number;
  /** Origin point Y (0-1, default: 0.3 top area) */
  originY?: number;
}

// ── Keyframe injection (runs once) ────────────────────────────
let keyframesInjected = false;

function injectKeyframes() {
  if (keyframesInjected || typeof document === 'undefined') return;
  keyframesInjected = true;

  const style = document.createElement('style');
  style.id = 'confetti-enhanced-keyframes';
  style.textContent = `
    /* ── Main trajectory with gravity-like deceleration ── */
    @keyframes confettiBurst {
      0% {
        transform: translate(0, 0) rotate(0deg) scale(1);
        opacity: 1;
      }
      15% {
        transform: translate(calc(var(--dx) * 0.4), calc(var(--dy) * 0.5)) rotate(calc(var(--rot) * 0.2)) scale(1.05);
        opacity: 1;
      }
      40% {
        transform: translate(calc(var(--dx) * 0.8), calc(var(--dy) * 0.85)) rotate(calc(var(--rot) * 0.55)) scale(0.85);
        opacity: 0.95;
      }
      70% {
        transform: translate(var(--dx), calc(var(--dy) + 300px)) rotate(calc(var(--rot) * 0.85)) scale(0.5);
        opacity: 0.6;
      }
      100% {
        transform: translate(calc(var(--dx) + var(--drift) * 1.5), calc(var(--dy) + 600px)) rotate(var(--rot)) scale(0.2);
        opacity: 0;
      }
    }

    /* ── Side cannon trajectory — launches from edges inward ── */
    @keyframes confettiSideBurst {
      0% {
        transform: translate(0, 0) rotate(0deg) scale(1);
        opacity: 1;
      }
      20% {
        transform: translate(calc(var(--sx) * 0.6), calc(var(--sy) * 0.5)) rotate(calc(var(--rot) * 0.3)) scale(1.1);
        opacity: 1;
      }
      50% {
        transform: translate(var(--sx), calc(var(--sy) + 200px)) rotate(calc(var(--rot) * 0.7)) scale(0.7);
        opacity: 0.8;
      }
      100% {
        transform: translate(calc(var(--sx) + var(--drift) * 2), calc(var(--sy) + 700px)) rotate(var(--rot)) scale(0.15);
        opacity: 0;
      }
    }

    /* ── Horizontal drift animation ── */
    @keyframes confettiDrift {
      0% { margin-left: 0; }
      25% { margin-left: var(--drift); }
      50% { margin-left: calc(var(--drift) * -0.5); }
      75% { margin-left: calc(var(--drift) * 0.8); }
      100% { margin-left: var(--drift); }
    }

    /* ── Shimmer / sparkle opacity pulse ── */
    @keyframes confettiShimmer {
      0%, 100% { opacity: 1; }
      30% { opacity: 0.5; }
      60% { opacity: 1; }
      80% { opacity: 0.7; }
    }

    /* ── Tumble rotation for shape particles ── */
    @keyframes confettiTumble {
      0% { transform: rotate(0deg) rotateY(0deg); }
      25% { transform: rotate(90deg) rotateY(180deg); }
      50% { transform: rotate(180deg) rotateY(360deg); }
      75% { transform: rotate(270deg) rotateY(540deg); }
      100% { transform: rotate(360deg) rotateY(720deg); }
    }
  `;
  document.head.appendChild(style);
}

// ── Particle type determination ───────────────────────────────
type ParticleShape = 'rect' | 'circle' | 'star' | 'diamond';

function randomShape(): ParticleShape {
  const r = Math.random();
  if (r < 0.35) return 'rect';
  if (r < 0.55) return 'circle';
  if (r < 0.80) return 'star';
  return 'diamond';
}

// ── Create a single confetti particle ─────────────────────────
function createParticle(opts: {
  x: number;
  y: number;
  color: string;
  shape: ParticleShape;
  dx: number;
  dy: number;
  rotation: number;
  drift: number;
  delay: number;
  duration: number;
  shimmer: boolean;
  wrapper: HTMLElement;
  animationType: 'center' | 'side';
  sx?: number;
  sy?: number;
}) {
  const {
    x, y, color, shape, dx, dy, rotation, drift,
    delay, duration, shimmer, wrapper, animationType,
    sx = 0, sy = 0,
  } = opts;

  const particle = document.createElement('div');
  const isText = shape === 'star' || shape === 'diamond';
  const size = 6 + Math.random() * 8;

  if (isText) {
    // Text-based shapes (★, ◆) for visual variety
    const char = shape === 'star'
      ? SHAPE_CHARS[Math.floor(Math.random() * 2)] // ★ or ✦
      : SHAPE_CHARS[3]; // ◆
    const fontSize = size * 1.4;

    particle.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      font-size: ${fontSize}px;
      color: ${color};
      pointer-events: none;
      will-change: transform, opacity;
      line-height: 1;
      animation: ${animationType === 'side' ? 'confettiSideBurst' : 'confettiBurst'} ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}ms forwards;
      --dx: ${dx}px;
      --dy: ${dy}px;
      --rot: ${rotation}deg;
      --drift: ${drift}px;
      --sx: ${sx}px;
      --sy: ${sy}px;
    `;

    // Add tumble for text shapes
    if (Math.random() > 0.3) {
      particle.style.animation += `, confettiTumble ${1200 + Math.random() * 800}ms linear ${delay}ms infinite`;
    }

    particle.textContent = char;
  } else {
    // DOM-based shapes (rectangles, circles)
    const isCircle = shape === 'circle';
    const width = size;
    const height = isCircle ? size : size * 0.5;

    particle.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: ${width}px;
      height: ${height}px;
      background: ${color};
      border-radius: ${isCircle ? '50%' : '2px'};
      pointer-events: none;
      will-change: transform, opacity;
      animation: ${animationType === 'side' ? 'confettiSideBurst' : 'confettiBurst'} ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}ms forwards;
      --dx: ${dx}px;
      --dy: ${dy}px;
      --rot: ${rotation}deg;
      --drift: ${drift}px;
      --sx: ${sx}px;
      --sy: ${sy}px;
    `;
  }

  // Add shimmer effect to ~30% of particles
  if (shimmer && Math.random() < 0.3) {
    particle.style.animation += `, confettiShimmer ${400 + Math.random() * 300}ms ease-in-out ${delay}ms infinite`;
  }

  wrapper.appendChild(particle);
}

// ── Create a wrapper container for particles ──────────────────
function createWrapper(container: HTMLElement): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none; z-index: 9999; overflow: hidden;
  `;
  container.appendChild(wrapper);
  return wrapper;
}

// ══════════════════════════════════════════════════════════════
// PUBLIC API
// ══════════════════════════════════════════════════════════════

/**
 * Fire a confetti burst celebration from a center point.
 * Usage: fireConfetti() or fireConfetti({ count: 80, duration: 4000 })
 */
export function fireConfetti(options: ConfettiOptions = {}) {
  if (typeof window === 'undefined') return;
  injectKeyframes();

  const {
    count = 50,
    duration = 3000,
    container = document.body,
    originX = 0.5,
    originY = 0.3,
  } = options;

  const wrapper = createWrapper(container);
  const centerX = window.innerWidth * originX;
  const centerY = window.innerHeight * originY;

  for (let i = 0; i < count; i++) {
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const angle = Math.random() * Math.PI * 2;
    const velocity = 200 + Math.random() * 400;
    const dx = Math.cos(angle) * velocity;
    const dy = Math.sin(angle) * velocity - 300; // bias upward
    const rotation = Math.random() * 720 - 360;
    const drift = (Math.random() - 0.5) * 120; // horizontal drift
    const delay = Math.random() * 200;

    createParticle({
      x: centerX,
      y: centerY,
      color,
      shape: randomShape(),
      dx,
      dy,
      rotation,
      drift,
      delay,
      duration,
      shimmer: true,
      wrapper,
      animationType: 'center',
    });
  }

  // Clean up after animation
  setTimeout(() => {
    wrapper.remove();
  }, duration + 500);
}

/**
 * Fire a small star burst (for correct answers).
 * Lighter than full confetti — fewer particles, shorter duration.
 */
export function fireStarBurst(options: ConfettiOptions = {}) {
  return fireConfetti({
    count: 15,
    duration: 1500,
    originX: 0.5,
    originY: 0.5,
    ...options,
  });
}

/**
 * Fire a very mini confetti burst (8-10 particles).
 * Perfect for small achievements like answering a single
 * question correctly. Very light and quick.
 */
export function fireConfettiMini(options: ConfettiOptions = {}) {
  if (typeof window === 'undefined') return;
  injectKeyframes();

  const {
    count = 9,
    duration = 1200,
    container = document.body,
    originX = 0.5,
    originY = 0.5,
  } = options;

  const wrapper = createWrapper(container);
  const centerX = window.innerWidth * originX;
  const centerY = window.innerHeight * originY;

  for (let i = 0; i < count; i++) {
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const angle = Math.random() * Math.PI * 2;
    const velocity = 80 + Math.random() * 150;
    const dx = Math.cos(angle) * velocity;
    const dy = Math.sin(angle) * velocity - 100; // slight upward bias
    const rotation = Math.random() * 360 - 180;
    const drift = (Math.random() - 0.5) * 40;
    const delay = Math.random() * 100;

    createParticle({
      x: centerX,
      y: centerY,
      color,
      shape: randomShape(),
      dx,
      dy,
      rotation,
      drift,
      delay,
      duration,
      shimmer: false, // no shimmer for mini — keep it simple
      wrapper,
      animationType: 'center',
    });
  }

  setTimeout(() => {
    wrapper.remove();
  }, duration + 300);
}

/**
 * Fire confetti from both left and right sides simultaneously.
 * Like a celebration with side cannons. Particles launch inward
 * and upward from the edges of the viewport.
 */
export function fireConfettiSideCannons(options: ConfettiOptions = {}) {
  if (typeof window === 'undefined') return;
  injectKeyframes();

  const {
    count = 70,
    duration = 3500,
    container = document.body,
  } = options;

  const wrapper = createWrapper(container);
  const w = window.innerWidth;
  const h = window.innerHeight;
  const perSide = Math.floor(count / 2);

  // ── Left cannon ──
  for (let i = 0; i < perSide; i++) {
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const startX = 0;
    const startY = h * (0.5 + Math.random() * 0.3); // lower half of screen
    const spreadX = w * (0.2 + Math.random() * 0.4); // shoot inward
    const spreadY = -(h * 0.2 + Math.random() * h * 0.3); // shoot upward
    const rotation = Math.random() * 720 - 360;
    const drift = 20 + Math.random() * 60; // drift right
    const delay = Math.random() * 300;

    createParticle({
      x: startX,
      y: startY,
      color,
      shape: randomShape(),
      dx: 0, dy: 0,
      rotation,
      drift,
      delay,
      duration,
      shimmer: true,
      wrapper,
      animationType: 'side',
      sx: spreadX,
      sy: spreadY,
    });
  }

  // ── Right cannon ──
  for (let i = 0; i < perSide; i++) {
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const startX = w;
    const startY = h * (0.5 + Math.random() * 0.3);
    const spreadX = -(w * (0.2 + Math.random() * 0.4)); // shoot inward
    const spreadY = -(h * 0.2 + Math.random() * h * 0.3); // shoot upward
    const rotation = Math.random() * 720 - 360;
    const drift = -(20 + Math.random() * 60); // drift left
    const delay = Math.random() * 300;

    createParticle({
      x: startX,
      y: startY,
      color,
      shape: randomShape(),
      dx: 0, dy: 0,
      rotation,
      drift,
      delay,
      duration,
      shimmer: true,
      wrapper,
      animationType: 'side',
      sx: spreadX,
      sy: spreadY,
    });
  }

  setTimeout(() => {
    wrapper.remove();
  }, duration + 500);
}

/**
 * Multi-stage celebration sequence — the ultimate celebration!
 *   Stage 1 (0ms):    Side cannons fire from both edges
 *   Stage 2 (300ms):  Center burst fires
 *   Stage 3 (600ms):  Another side cannon burst
 *
 * Use this for perfect scores (100%) and major achievements.
 */
export function fireConfettiCelebration(options: ConfettiOptions = {}) {
  if (typeof window === 'undefined') return;

  const {
    count = 60,
    duration = 3500,
    container = document.body,
  } = options;

  // Stage 1: Side cannons
  fireConfettiSideCannons({ count: count + 10, duration, container });

  // Stage 2: Center burst (300ms delay)
  setTimeout(() => {
    fireConfetti({
      count: count,
      duration: duration - 200,
      container,
      originX: 0.5,
      originY: 0.3,
    });
  }, 300);

  // Stage 3: Another side cannon burst (600ms delay)
  setTimeout(() => {
    fireConfettiSideCannons({ count: Math.floor(count * 0.7), duration: duration - 400, container });
  }, 600);
}
