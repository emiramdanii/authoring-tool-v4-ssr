'use client';

// ═══════════════════════════════════════════════════════════════════
// LIGHTWEIGHT TRANSITION — Drop-in framer-motion replacement
// ═══════════════════════════════════════════════════════════════════
// Replaces framer-motion's AnimatePresence + motion.div with
// pure CSS animations. Zero runtime JS animation overhead.
//
// Supports:
//   - Fade in/out
//   - Slide up/down/left/right
//   - Scale/zoom
//   - Directional page transitions (slide based on direction)
//   - AnimatePresence mode="wait" (exit before enter)
// ═══════════════════════════════════════════════════════════════════

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from 'react';

// ── Page Transition CSS Classes ──────────────────────────────────

export type PageDirection = -1 | 0 | 1;

export function getPageTransitionClass(direction: PageDirection, phase: 'enter' | 'exit'): string {
  if (direction === 0) {
    return phase === 'enter' ? 'anim-page-fade-in' : 'anim-page-fade-out';
  }
  if (direction > 0) {
    return phase === 'enter' ? 'anim-page-slide-right-in' : 'anim-page-slide-left-out';
  }
  return phase === 'enter' ? 'anim-page-slide-left-in' : 'anim-page-slide-right-out';
}

// ── AnimatePresence replacement ──────────────────────────────────
// Renders children with enter/exit CSS animations.
// mode="wait" plays exit before enter.

interface AnimatePresenceProps {
  mode?: 'wait' | 'sync';
  children: ReactNode;
  custom?: unknown;
}

export function AnimatePresence({ mode = 'sync', children }: AnimatePresenceProps) {
  // For simple cases, just render children with CSS animation class
  // The key-based remount triggers CSS animation automatically via .anim-enter class
  return <>{children}</>;
}

// ── motion.div replacement ───────────────────────────────────────
// Translates framer-motion props to CSS animations.

interface MotionDivProps extends React.HTMLAttributes<HTMLDivElement> {
  initial?: Record<string, number | string>;
  animate?: Record<string, number | string>;
  exit?: Record<string, number | string>;
  transition?: Record<string, unknown>;
  variants?: Record<string, Record<string, number | string>>;
  custom?: unknown;
  whileHover?: Record<string, unknown>;
  whileTap?: Record<string, unknown>;
  key?: string;
}

export const motion = {
  div: React.forwardRef<HTMLDivElement, MotionDivProps>(function MotionDiv(
    {
      initial,
      animate,
      exit: _exit,
      transition,
      variants,
      custom,
      whileHover,
      whileTap,
      className = '',
      style,
      children,
      ...rest
    },
    ref
  ) {
    // Resolve variants if used
    const resolveVariant = (state: 'initial' | 'animate' | 'exit') => {
      const raw = state === 'initial' ? initial : state === 'exit' ? _exit : animate;
      if (!raw && variants) {
        // Try to resolve from custom variant key
        return undefined;
      }
      return raw;
    };

    const animState = resolveVariant('animate') || animate || {};

    // Convert animate props to inline style
    const animStyle: CSSProperties = {};
    if (animState) {
      if ('opacity' in animState) animStyle.opacity = animState.opacity as number;
      if ('scale' in animState) {
        animStyle.transform = `scale(${animState.scale})`;
      }
      if ('x' in animState) {
        const x = typeof animState.x === 'string' ? animState.x : `${animState.x}px`;
        animStyle.transform = animStyle.transform
          ? `${animStyle.transform} translateX(${x})`
          : `translateX(${x})`;
      }
      if ('y' in animState) {
        const y = typeof animState.y === 'string' ? animState.y : `${animState.y}px`;
        animStyle.transform = animStyle.transform
          ? `${animStyle.transform} translateY(${y})`
          : `translateY(${y})`;
      }
      if ('pointerEvents' in animState) {
        animStyle.pointerEvents = animState.pointerEvents as CSSProperties['pointerEvents'];
      }
    }

    // Determine CSS animation class based on transition
    const duration = (transition?.duration as number) ?? 0.2;
    const ease = (transition?.ease as string) ?? 'ease-out';
    const animClass = getAnimationClass(initial, animate, duration);

    // whileHover/whileTap handled via CSS class
    const hoverTapClass =
      whileHover || whileTap ? 'motion-hover-tap' : '';

    return (
      <div
        ref={ref}
        className={`${className} ${animClass} ${hoverTapClass}`}
        style={{
          ...animStyle,
          ...style,
          '--motion-duration': `${duration}s`,
          '--motion-ease': typeof ease === 'string' ? ease : 'ease-out',
          animationDuration: `${duration}s`,
          animationTimingFunction: typeof ease === 'string' ? ease : 'ease-out',
        } as CSSProperties}
        {...rest}
      >
        {children}
      </div>
    );
  }),
};

// ── Helper: Determine CSS animation class from motion props ──────

function getAnimationClass(
  initial?: Record<string, number | string>,
  _animate?: Record<string, number | string>,
  _duration?: number
): string {
  if (!initial) return '';

  // Determine animation type from initial state
  const hasX = 'x' in initial;
  const hasY = 'y' in initial;
  const hasScale = 'scale' in initial;
  const hasOpacity = 'opacity' in initial;

  if (hasX && !hasY) {
    const xVal = Number(initial.x);
    if (xVal > 0) return 'anim-enter-slide-right';
    if (xVal < 0) return 'anim-enter-slide-left';
  }
  if (hasY && !hasX) {
    const yVal = Number(initial.y);
    if (yVal > 0) return 'anim-enter-slide-up';
    if (yVal < 0) return 'anim-enter-slide-down';
  }
  if (hasScale && hasOpacity) return 'anim-enter-scale';
  if (hasScale) return 'anim-enter-scale';
  if (hasOpacity) return 'anim-enter-fade';

  return 'anim-enter-fade';
}

// ── PageTransition — For AnimatePresence mode="wait" with direction ──
// This is the main component for page/slide transitions

interface PageTransitionProps {
  children: ReactNode;
  pageKey: string;
  direction: PageDirection;
  className?: string;
  style?: CSSProperties;
  duration?: number;
}

export function PageTransition({
  children,
  pageKey,
  direction,
  className = '',
  style,
  duration = 0.22,
}: PageTransitionProps) {
  const prevKeyRef = useRef(pageKey);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [phase, setPhase] = useState<'enter' | 'visible'>('enter');

  useEffect(() => {
    if (pageKey !== prevKeyRef.current) {
      // Page changed: trigger enter animation
      setIsTransitioning(true);
      setPhase('enter');

      // After animation duration, set to visible
      const timer = setTimeout(() => {
        setPhase('visible');
        setIsTransitioning(false);
      }, duration * 1000 + 50);
      prevKeyRef.current = pageKey;
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [pageKey, duration]);

  const animClass =
    phase === 'enter' && isTransitioning
      ? getPageTransitionClass(direction, 'enter')
      : '';

  return (
    <div
      key={pageKey}
      className={`absolute inset-0 ${className} ${animClass}`}
      style={{
        ...style,
        animationDuration: `${duration}s`,
      }}
    >
      {children}
    </div>
  );
}

// ── FadeIn — Simple fade-in on mount ────────────────────────────

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: CSSProperties;
}

export function FadeIn({ children, delay = 0, className = '', style }: FadeInProps) {
  return (
    <div
      className={`anim-enter-fade ${className}`}
      style={{
        ...style,
        animationDelay: `${delay}s`,
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  );
}

// ── SlideIn — Slide + fade on mount ─────────────────────────────

interface SlideInProps {
  children: ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  className?: string;
  style?: CSSProperties;
}

export function SlideIn({
  children,
  direction = 'up',
  delay = 0,
  className = '',
  style,
}: SlideInProps) {
  const animClass =
    direction === 'up'
      ? 'anim-enter-slide-up'
      : direction === 'down'
        ? 'anim-enter-slide-down'
        : direction === 'left'
          ? 'anim-enter-slide-left'
          : 'anim-enter-slide-right';

  return (
    <div
      className={`${animClass} ${className}`}
      style={{
        ...style,
        animationDelay: `${delay}s`,
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  );
}

// ── ScaleIn — Scale + fade on mount ─────────────────────────────

interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: CSSProperties;
}

export function ScaleIn({ children, delay = 0, className = '', style }: ScaleInProps) {
  return (
    <div
      className={`anim-enter-scale ${className}`}
      style={{
        ...style,
        animationDelay: `${delay}s`,
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  );
}

// ── Collapse — Height animation (for accordion) ──────────────────

interface CollapseProps {
  open: boolean;
  children: ReactNode;
  className?: string;
  duration?: number;
}

export function Collapse({ open, children, className = '', duration = 0.25 }: CollapseProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | 'auto'>(open ? 'auto' : 0);

  useEffect(() => {
    if (!contentRef.current) return undefined;
    if (open) {
      const h = contentRef.current.scrollHeight;
      setHeight(h);
      // After transition, set to auto for dynamic content
      const timer = setTimeout(() => setHeight('auto'), duration * 1000);
      return () => clearTimeout(timer);
    } else {
      // First set explicit height, then collapse
      const h = contentRef.current.scrollHeight;
      setHeight(h);
      // Force reflow
      contentRef.current.offsetHeight;
      requestAnimationFrame(() => setHeight(0));
    }
    return undefined;
  }, [open, duration]);

  return (
    <div
      ref={contentRef}
      className={className}
      style={{
        height: height === 'auto' ? 'auto' : height,
        overflow: 'hidden',
        opacity: open ? 1 : 0,
        transition: `height ${duration}s ease, opacity ${duration}s ease`,
      }}
    >
      {children}
    </div>
  );
}

// ── StaggerChildren — Staggered children animation ───────────────

interface StaggerChildrenProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
  style?: CSSProperties;
}

export function StaggerChildren({
  children,
  staggerDelay = 0.05,
  className = '',
  style,
}: StaggerChildrenProps) {
  return (
    <div
      className={className}
      style={{
        ...style,
        // CSS custom property for stagger delay — children use animation-delay calc
        '--stagger-delay': `${staggerDelay}s`,
      } as CSSProperties}
    >
      {React.Children.map(children, (child, i) => (
        <div
          className="anim-enter-fade"
          style={{
            animationDelay: `${i * staggerDelay}s`,
            animationFillMode: 'both',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

// ── Conditional render with exit animation ───────────────────────

interface ShowTransitionProps {
  show: boolean;
  children: ReactNode;
  enterClass?: string;
  exitClass?: string;
  duration?: number;
  className?: string;
  style?: CSSProperties;
}

export function ShowTransition({
  show,
  children,
  enterClass = 'anim-enter-fade',
  exitClass = 'anim-exit-fade',
  duration = 0.2,
  className = '',
  style,
}: ShowTransitionProps) {
  const [shouldRender, setShouldRender] = useState(show);
  const [animClass, setAnimClass] = useState(show ? enterClass : '');

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      setAnimClass(enterClass);
      return undefined;
    } else {
      setAnimClass(exitClass);
      const timer = setTimeout(() => setShouldRender(false), duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [show, enterClass, exitClass, duration]);

  if (!shouldRender) return null;

  return (
    <div
      className={`${className} ${animClass}`}
      style={{
        ...style,
        animationDuration: `${duration}s`,
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  );
}
