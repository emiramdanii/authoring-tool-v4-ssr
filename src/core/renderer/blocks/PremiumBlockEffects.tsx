'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { TokenResolver } from '../types';

// ═══════════════════════════════════════════════════════════════════
// PREMIUM BLOCK EFFECTS — Collection of Visual Effect Wrappers
// ═══════════════════════════════════════════════════════════════════
// Components:
//   PremiumBlockWrapper  — Stagger entrance, hover lift, neon glow, glassmorphism, gradient border
//   ReadingProgressIndicator — Aurora shimmer progress bar
//   StepCompletionOverlay — Celebration overlay with sparkle, trophy, "SELESAI!"
//   PremiumBadge — Badge component with glass/solid/outline/gradient variants
//   MicroInteraction — Click/tap feedback effects (ripple, squish, bounce, glow)
// ═══════════════════════════════════════════════════════════════════

// ─── PremiumBlockWrapper ───────────────────────────────────────

export interface PremiumBlockWrapperProps {
  children: React.ReactNode;
  tokens?: TokenResolver;
  /** Accent color token key for glow effects */
  accent?: string;
  /** Stagger index for entrance animation delay */
  staggerIndex?: number;
  /** Enable hover lift effect */
  hoverLift?: boolean;
  /** Enable neon glow selection ring */
  glowRing?: boolean;
  /** Enable glassmorphism background */
  glass?: boolean;
  /** Enable gradient border animation */
  gradientBorder?: boolean;
  /** Additional className */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
}

export function PremiumBlockWrapper({
  children,
  tokens,
  accent = 'y',
  staggerIndex = 0,
  hoverLift = true,
  glowRing = false,
  glass = false,
  gradientBorder = false,
  className = '',
  style = {},
}: PremiumBlockWrapperProps) {
  const accentColor = tokens ? tokens.color(accent) : '#fbbf24';
  const accentAlpha = (a: number) => tokens ? tokens.colorAlpha(accent, a) : `rgba(251,191,36,${a})`;

  const combinedClassName = [
    className,
    hoverLift ? 'premium-card-glow' : '',
    glowRing ? 'premium-focus-glow' : '',
    glass ? 'glass-panel' : '',
    gradientBorder ? 'premium-border-gradient' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={combinedClassName}
      style={{
        position: 'relative',
        overflow: 'hidden',
        animation: `blockStaggerIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${staggerIndex * 0.08}s both`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── ReadingProgressIndicator ──────────────────────────────────

export interface ReadingProgressIndicatorProps {
  /** Progress value from 0 to 1 */
  progress: number;
  tokens?: TokenResolver;
  accent?: string;
  /** Height in pixels */
  height?: number;
  /** Position: 'top' or 'bottom' */
  position?: 'top' | 'bottom';
}

export function ReadingProgressIndicator({
  progress,
  tokens,
  accent = 'y',
  height = 3,
  position = 'top',
}: ReadingProgressIndicatorProps) {
  const accentColor = tokens ? tokens.color(accent) : '#fbbf24';
  const accentSecondary = tokens ? tokens.color('c') : '#3ecfcf';
  const accentAlpha = (a: number) => tokens ? tokens.colorAlpha(accent, a) : `rgba(251,191,36,${a})`;

  return (
    <div
      style={{
        position: 'sticky',
        [position]: 0,
        zIndex: 40,
        height: `${height}px`,
        background: tokens?.subtleBg(0.06) || 'rgba(0,0,0,0.06)',
        overflow: 'hidden',
        borderRadius: position === 'top' ? '0 0 4px 4px' : '4px 4px 0 0',
      }}
      role="progressbar"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Kemajuan membaca"
    >
      <div
        style={{
          height: '100%',
          width: `${Math.min(progress, 1) * 100}%`,
          background: `linear-gradient(90deg, ${accentColor}, ${accentSecondary}, ${accentColor})`,
          backgroundSize: '200% 100%',
          borderRadius: 'inherit',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: `0 0 6px ${accentAlpha(0.4)}`,
          animation: 'shimmer 2s linear infinite',
        }}
      />
      {/* Aurora shimmer overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(90deg, transparent, ${accentAlpha(0.2)}, transparent)`,
          backgroundSize: '200% 100%',
          animation: 'shimmer 3s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

// ─── StepCompletionOverlay ─────────────────────────────────────

export interface StepCompletionOverlayProps {
  /** Whether to show the overlay */
  show: boolean;
  tokens?: TokenResolver;
  accent?: string;
  /** Custom completion text */
  completionText?: string;
  isCompact?: boolean;
}

export function StepCompletionOverlay({
  show,
  tokens,
  accent = 'y',
  completionText = 'SELESAI!',
  isCompact = false,
}: StepCompletionOverlayProps) {
  if (!show) return null;

  const accentColor = tokens ? tokens.color(accent) : '#fbbf24';
  const accentSecondary = tokens ? tokens.color('c') : '#3ecfcf';

  // Generate sparkle particles
  const sparkles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    delay: i * 0.15,
    x: `${15 + (i % 4) * 25}%`,
    y: `${10 + Math.floor(i / 4) * 40}%`,
    size: isCompact ? '6px' : '8px',
    color: i % 2 === 0 ? accentColor : accentSecondary,
  }));

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isCompact ? '8px' : '12px',
        background: tokens
          ? `linear-gradient(135deg, ${tokens.colorAlpha(accent, 0.08)}, ${tokens.colorAlpha(accent, 0.03)})`
          : 'rgba(251,191,36,0.06)',
        backdropFilter: 'blur(4px)',
        borderRadius: 'inherit',
        zIndex: 30,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Sparkle particles */}
      {sparkles.map((s) => (
        <div
          key={`sparkle-${s.id}`}
          style={{
            position: 'absolute',
            left: s.x,
            top: s.y,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: s.color,
            animation: `sparkle 1.5s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}

      {/* Trophy icon with bounce */}
      <div
        style={{
          fontSize: isCompact ? '28px' : '40px',
          animation: 'trophyBounce 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        }}
      >
        &#127942;
      </div>

      {/* Gradient text */}
      <div
        className="premium-text-gradient"
        style={{
          fontSize: isCompact ? '16px' : '22px',
          fontWeight: 900,
          letterSpacing: '0.08em',
          fontFamily: tokens?.fontFamily('display'),
        }}
      >
        {completionText}
      </div>
    </div>
  );
}

// ─── PremiumBadge ──────────────────────────────────────────────

export type PremiumBadgeVariant = 'glass' | 'solid' | 'outline' | 'gradient';

export interface PremiumBadgeProps {
  children: React.ReactNode;
  tokens?: TokenResolver;
  accent?: string;
  variant?: PremiumBadgeVariant;
  isCompact?: boolean;
  className?: string;
}

export function PremiumBadge({
  children,
  tokens,
  accent = 'y',
  variant = 'glass',
  isCompact = false,
  className,
}: PremiumBadgeProps) {
  const accentColor = tokens ? tokens.color(accent) : '#fbbf24';
  const accentAlpha = (a: number) => tokens ? tokens.colorAlpha(accent, a) : `rgba(251,191,36,${a})`;
  const textColor = tokens ? tokens.color('text') : '#0f172a';

  const variantStyles: Record<PremiumBadgeVariant, React.CSSProperties> = {
    glass: {
      background: tokens ? tokens.colorAlpha(accent, 0.1) : 'rgba(251,191,36,0.1)',
      backdropFilter: 'blur(8px)',
      border: `1px solid ${accentAlpha(0.25)}`,
      color: accentColor,
    },
    solid: {
      background: `linear-gradient(135deg, ${accentColor}, ${accentAlpha(0.8)})`,
      border: '1px solid transparent',
      color: tokens ? tokens.color('bg') : '#ffffff',
      boxShadow: `0 2px 8px ${accentAlpha(0.35)}`,
    },
    outline: {
      background: 'transparent',
      border: `1px solid ${accentColor}`,
      color: accentColor,
    },
    gradient: {
      background: `linear-gradient(135deg, ${accentColor}, ${tokens?.color('c') || '#3ecfcf'})`,
      border: '1px solid transparent',
      color: tokens ? tokens.color('bg') : '#ffffff',
      boxShadow: `0 2px 10px ${accentAlpha(0.3)}`,
    },
  };

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: isCompact ? '2px 8px' : '3px 12px',
        borderRadius: '9999px',
        fontSize: isCompact ? '9px' : '10px',
        fontWeight: 800,
        letterSpacing: '0.05em',
        whiteSpace: 'nowrap',
        transition: 'all 0.2s ease',
        ...variantStyles[variant],
      }}
    >
      {children}
    </span>
  );
}

// ─── MicroInteraction ──────────────────────────────────────────

export type MicroInteractionType = 'ripple' | 'squish' | 'bounce' | 'glow';

export interface MicroInteractionProps {
  children: React.ReactNode;
  tokens?: TokenResolver;
  accent?: string;
  /** Type of micro-interaction effect */
  effect?: MicroInteractionType;
  /** Additional className */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
}

export function MicroInteraction({
  children,
  tokens,
  accent = 'y',
  effect = 'ripple',
  className = '',
  style = {},
}: MicroInteractionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [isPressed, setIsPressed] = useState(false);

  const accentColor = tokens ? tokens.color(accent) : '#fbbf24';
  const accentAlpha = (a: number) => tokens ? tokens.colorAlpha(accent, a) : `rgba(251,191,36,${a})`;

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (effect === 'ripple' && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      setRipples((prev) => [...prev, { id, x, y }]);
      // Clean up ripple after animation
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    }
  }, [effect]);

  const handlePointerDown = useCallback(() => {
    setIsPressed(true);
  }, []);

  const handlePointerUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  const effectStyles: Record<MicroInteractionType, React.CSSProperties> = {
    ripple: {
      position: 'relative',
      overflow: 'hidden',
    },
    squish: {
      animation: isPressed ? 'pressDown 0.2s ease' : 'none',
      transform: isPressed ? 'scale(0.96)' : 'scale(1)',
      transition: 'transform 0.15s ease',
    },
    bounce: {
      animation: isPressed ? 'springBounce 0.4s ease' : 'none',
      transition: 'transform 0.15s ease',
    },
    glow: {
      boxShadow: isPressed
        ? `0 0 16px ${accentAlpha(0.4)}, 0 0 32px ${accentAlpha(0.2)}`
        : 'none',
      transition: 'box-shadow 0.2s ease',
    },
  };

  return (
    <div
      ref={containerRef}
      className={className}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{
        ...effectStyles[effect],
        ...style,
      }}
    >
      {children}
      {/* Ripple elements */}
      {effect === 'ripple' && ripples.map((ripple) => (
        <span
          key={`ripple-${ripple.id}`}
          style={{
            position: 'absolute',
            left: ripple.x - 4,
            top: ripple.y - 4,
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: accentAlpha(0.3),
            animation: 'ripple 0.6s ease-out forwards',
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
}
