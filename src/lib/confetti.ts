// ═══════════════════════════════════════════════════════════════
// CONFETTI HELPER — Lightweight CSS-based celebration effects
// ═══════════════════════════════════════════════════════════════
// Creates DOM-based confetti particles with CSS animations.
// No external dependencies needed. Automatically cleans up after
// the animation completes.

const CONFETTI_COLORS = [
  '#f9c12e', '#3ecfcf', '#34d399', '#a78bfa', '#ff6b6b',
  '#fb923c', '#fbbf24', '#22d3ee', '#f472b6', '#818cf8',
];

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

/**
 * Fire a confetti burst celebration.
 * Usage: fireConfetti() or fireConfetti({ count: 80, duration: 4000 })
 */
export function fireConfetti(options: ConfettiOptions = {}) {
  if (typeof window === 'undefined') return;

  const {
    count = 50,
    duration = 3000,
    container = document.body,
    originX = 0.5,
    originY = 0.3,
  } = options;

  // Create a container for the particles
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none; z-index: 9999; overflow: hidden;
  `;
  container.appendChild(wrapper);

  const centerX = window.innerWidth * originX;
  const centerY = window.innerHeight * originY;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const size = 6 + Math.random() * 8;
    const isCircle = Math.random() > 0.5;
    const angle = Math.random() * Math.PI * 2;
    const velocity = 200 + Math.random() * 400;
    const dx = Math.cos(angle) * velocity;
    const dy = Math.sin(angle) * velocity - 300; // bias upward
    const rotation = Math.random() * 720 - 360;
    const delay = Math.random() * 200;

    particle.style.cssText = `
      position: absolute;
      left: ${centerX}px;
      top: ${centerY}px;
      width: ${size}px;
      height: ${isCircle ? size : size * 0.6}px;
      background: ${color};
      border-radius: ${isCircle ? '50%' : '2px'};
      pointer-events: none;
      animation: confettiBurst ${duration}ms ease-out ${delay}ms forwards;
      --dx: ${dx}px;
      --dy: ${dy}px;
      --rot: ${rotation}deg;
    `;

    wrapper.appendChild(particle);
  }

  // Inject keyframes if not already present
  if (!document.getElementById('confetti-burst-keyframes')) {
    const style = document.createElement('style');
    style.id = 'confetti-burst-keyframes';
    style.textContent = `
      @keyframes confettiBurst {
        0% {
          transform: translate(0, 0) rotate(0deg) scale(1);
          opacity: 1;
        }
        30% {
          opacity: 1;
        }
        100% {
          transform: translate(var(--dx), calc(var(--dy) + 600px)) rotate(var(--rot)) scale(0.3);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Clean up after animation
  setTimeout(() => {
    wrapper.remove();
  }, duration + 300);
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
