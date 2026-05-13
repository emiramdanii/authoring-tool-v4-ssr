'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { TokenResolver } from '../types';

// ═══════════════════════════════════════════════════════════════════
// PREMIUM STEP NAVIGATOR — Enhanced Step Navigation with Visual FX
// ═══════════════════════════════════════════════════════════════════
// Premium visual effects:
//   - Holographic/aurora gradient progress bar
//   - 3D flip step chips with perspective
//   - Confetti burst when advancing steps
//   - Spring-physics nav buttons (overshoot animation)
//   - "SELESAI" badge with glow pulse when all steps completed
//   - Keyboard shortcut hints (← →) shown on hover
//   - Smooth content morph (crossfade + scale transition)
// ═══════════════════════════════════════════════════════════════════

export interface PremiumStepNavigatorProps {
  /** Labels for each step (e.g., ["Norma 1-2", "Norma 3-4"]) */
  labels: string[];
  /** Currently active step index (0-based) */
  activeStep: number;
  /** Callback when step changes */
  onStepChange: (step: number) => void;
  /** The content for the current step */
  children: React.ReactNode;
  /** Token resolver for styling */
  tokens?: TokenResolver;
  /** Accent color token key */
  accent?: string;
  /** Compact mode */
  isCompact?: boolean;
  /** Fired once when user reaches the last step (all steps completed) */
  onComplete?: () => void;
}

/** Hook for managing premium step navigation state with additional features */
export function usePremiumStepNavigator(totalSteps: number, initialStep: number = 0) {
  const [activeStep, setActiveStep] = useState(initialStep);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [confettiKey, setConfettiKey] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const goTo = useCallback((step: number) => {
    if (step < 0 || step >= totalSteps) return;
    setDirection(step > activeStep ? 'right' : 'left');
    setActiveStep(step);
    if (step > activeStep) {
      setShowConfetti(true);
      setConfettiKey((k) => k + 1);
    }
  }, [activeStep, totalSteps]);

  const next = useCallback(() => {
    if (activeStep < totalSteps - 1) {
      setDirection('right');
      setActiveStep((s) => s + 1);
      setShowConfetti(true);
      setConfettiKey((k) => k + 1);
    }
  }, [activeStep, totalSteps]);

  const prev = useCallback(() => {
    if (activeStep > 0) {
      setDirection('left');
      setActiveStep((s) => s - 1);
    }
  }, [activeStep]);

  const isFirst = activeStep === 0;
  const isLast = activeStep === totalSteps - 1;
  const isAllComplete = activeStep === totalSteps - 1;
  const progress = totalSteps <= 1 ? 1 : (activeStep + 1) / totalSteps;

  return {
    activeStep,
    direction,
    goTo,
    next,
    prev,
    isFirst,
    isLast,
    isAllComplete,
    progress,
    totalSteps,
    confettiKey,
    showConfetti,
    dismissConfetti: useCallback(() => setShowConfetti(false), []),
  };
}

/** Confetti burst particle component */
function ConfettiBurst({ accent, tokens }: { accent: string; tokens?: TokenResolver }) {
  const colors = tokens
    ? [tokens.color(accent), tokens.color('c'), tokens.color('y'), tokens.color('g'), tokens.color('r')]
    : ['#fbbf24', '#3ecfcf', '#a78bfa', '#34d399', '#f87171'];

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      {colors.map((color, i) => (
        <div
          key={`confetti-${i}`}
          style={{
            position: 'absolute',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: color,
            animation: 'confettiBurst 0.6s ease-out forwards',
            transform: `rotate(${i * 72}deg)`,
            transformOrigin: '0 0',
          }}
        />
      ))}
    </div>
  );
}

/** "SELESAI" badge with glow pulse */
function SelesaiBadge({ tokens, isCompact }: { tokens?: TokenResolver; isCompact?: boolean }) {
  const accentColor = tokens ? tokens.color('y') : '#fbbf24';
  const accentBg = tokens ? tokens.colorAlpha('y', 0.15) : 'rgba(251,191,36,0.15)';
  const accentBgStrong = tokens ? tokens.colorAlpha('y', 0.25) : 'rgba(251,191,36,0.25)';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: isCompact ? '4px 14px' : '6px 18px',
        borderRadius: '9999px',
        background: `linear-gradient(135deg, ${accentBg}, ${accentBgStrong})`,
        border: `1px solid ${accentColor}`,
        color: accentColor,
        fontSize: isCompact ? '10px' : '12px',
        fontWeight: 900,
        letterSpacing: '0.08em',
        animation: 'glowPulse 2s ease-in-out infinite',
        '--glow-color': tokens?.colorAlpha('y', 0.3) || 'rgba(251,191,36,0.3)',
        '--glow-color-strong': tokens?.colorAlpha('y', 0.6) || 'rgba(251,191,36,0.6)',
      } as React.CSSProperties}
    >
      <span style={{ fontSize: isCompact ? '12px' : '14px' }}>&#127942;</span>
      <span>SELESAI</span>
    </div>
  );
}

export function PremiumStepNavigator({
  labels,
  activeStep,
  onStepChange,
  children,
  tokens,
  accent = 'y',
  isCompact = false,
  onComplete,
}: PremiumStepNavigatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredBtn, setHoveredBtn] = useState<'prev' | 'next' | null>(null);
  const [springKey, setSpringKey] = useState(0);
  const totalSteps = labels.length;
  const hasCompletedRef = useRef(false);

  // Fire onComplete once when user reaches the last step
  useEffect(() => {
    const isAllComplete = activeStep === totalSteps - 1 && totalSteps > 1;
    if (isAllComplete && !hasCompletedRef.current && onComplete) {
      hasCompletedRef.current = true;
      onComplete();
    }
    // Reset completion flag if user goes back
    if (activeStep < totalSteps - 1) {
      hasCompletedRef.current = false;
    }
  }, [activeStep, totalSteps, onComplete]);

  // Keyboard navigation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (activeStep < totalSteps - 1) {
          onStepChange(activeStep + 1);
          setSpringKey((k) => k + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (activeStep > 0) {
          onStepChange(activeStep - 1);
          setSpringKey((k) => k + 1);
        }
      }
    };

    el.addEventListener('keydown', handleKeyDown);
    return () => el.removeEventListener('keydown', handleKeyDown);
  }, [activeStep, totalSteps, onStepChange]);

  const accentColor = tokens ? tokens.color(accent) : '#fbbf24';
  const accentAlpha = (a: number) => tokens ? tokens.colorAlpha(accent, a) : `rgba(251,191,36,${a})`;
  const accentSecondary = tokens ? tokens.color('c') : '#3ecfcf';
  const mutedColor = tokens ? tokens.muted(0.6) : 'rgba(148,163,184,0.6)';
  const cardBg = tokens ? tokens.color('card') : '#ffffff';
  const progress = totalSteps <= 1 ? 1 : (activeStep + 1) / totalSteps;
  const isAllComplete = activeStep === totalSteps - 1 && totalSteps > 1;

  const handleStepClick = (step: number) => {
    onStepChange(step);
    if (step !== activeStep) {
      setSpringKey((k) => k + 1);
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="tablist"
      aria-label="Navigasi langkah premium"
      className="premium-card-glow"
      style={{
        outline: 'none',
        borderRadius: tokens ? tokens.radius('xl') + 'px' : '12px',
        overflow: 'hidden',
        background: cardBg,
        border: `1px solid ${accentAlpha(0.15)}`,
        position: 'relative',
      }}
    >
      {/* ── Holographic/Aurora Progress Bar ──────────────────────── */}
      <div
        style={{
          height: isCompact ? '3px' : '4px',
          background: tokens?.subtleBg(0.06) || 'rgba(0,0,0,0.06)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress * 100}%`,
            borderRadius: '0 9999px 9999px 0',
            background: `linear-gradient(90deg, ${accentColor}, ${accentSecondary}, ${accentColor}, ${accentSecondary})`,
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s linear infinite',
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: `0 0 8px ${accentAlpha(0.4)}`,
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
            background: `linear-gradient(90deg, transparent, ${accentAlpha(0.3)}, transparent)`,
            backgroundSize: '200% 100%',
            animation: 'shimmer 3s ease-in-out infinite',
          }}
        />
      </div>

      {/* ── 3D Flip Step Chips ───────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: isCompact ? '4px' : '6px',
          padding: isCompact ? '8px 10px 0' : '10px 14px 0',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          perspective: '600px',
        }}
      >
        {labels.map((label, i) => {
          const isActive = i === activeStep;
          const isPast = i < activeStep;

          return (
            <button
              key={`premium-step-${i}`}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleStepClick(i)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: isCompact ? '4px 12px' : '5px 16px',
                borderRadius: '9999px',
                fontSize: isCompact ? '10px' : '11px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                border: `1px solid ${isActive ? accentColor : 'transparent'}`,
                background: isActive
                  ? `linear-gradient(135deg, ${accentAlpha(0.2)}, ${accentAlpha(0.1)})`
                  : isPast
                    ? accentAlpha(0.06)
                    : 'transparent',
                color: isActive ? accentColor : isPast ? accentAlpha(0.7) : mutedColor,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transform: isActive ? 'perspective(600px) rotateY(0deg) scale(1.05)' : 'perspective(600px) rotateY(0deg) scale(1)',
                boxShadow: isActive ? `0 2px 12px ${accentAlpha(0.25)}` : 'none',
                animation: isActive ? 'stepChipFlip 0.4s ease-out' : 'none',
              } as React.CSSProperties}
            >
              {isPast && (
                <span
                  style={{
                    fontSize: isCompact ? '9px' : '10px',
                    color: accentColor,
                  }}
                >
                  &#10003;
                </span>
              )}
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Step Content with Crossfade + Scale ──────────────────── */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          key={`step-content-${activeStep}`}
          style={{
            animation: activeStep > 0 ? 'pageSlideInRight 0.35s cubic-bezier(0.4, 0, 0.2, 1)' : 'blockStaggerIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {children}
        </div>
      </div>

      {/* ── Navigation Footer ────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: isCompact ? '6px 10px 8px' : '8px 14px 10px',
          borderTop: `1px solid ${tokens?.subtleBorder(0.08) || 'rgba(0,0,0,0.06)'}`,
          position: 'relative',
        }}
      >
        {/* Prev button */}
        <button
          onClick={() => {
            if (activeStep > 0) {
              onStepChange(activeStep - 1);
              setSpringKey((k) => k + 1);
            }
          }}
          disabled={activeStep === 0}
          onMouseEnter={() => setHoveredBtn('prev')}
          onMouseLeave={() => setHoveredBtn(null)}
          aria-label="Langkah sebelumnya"
          className="premium-tooltip"
          data-premium-tip="&#8592; Panah Kiri"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: isCompact ? '5px 12px' : '7px 16px',
            borderRadius: '10px',
            fontSize: isCompact ? '10px' : '11px',
            fontWeight: 700,
            border: `1px solid ${activeStep === 0 ? 'transparent' : accentAlpha(0.3)}`,
            background: activeStep === 0 ? 'transparent' : `linear-gradient(135deg, ${accentAlpha(0.12)}, ${accentAlpha(0.06)})`,
            color: activeStep === 0 ? mutedColor : accentColor,
            cursor: activeStep === 0 ? 'default' : 'pointer',
            opacity: activeStep === 0 ? 0.35 : 1,
            transition: 'all 0.2s ease',
            animation: hoveredBtn === 'prev' && activeStep > 0 ? 'springBounce 0.4s ease' : 'none',
          } as React.CSSProperties}
        >
          <span style={{ fontSize: isCompact ? '11px' : '13px' }}>&#8592;</span>
          <span>Sebelumnya</span>
          {hoveredBtn === 'prev' && activeStep > 0 && (
            <span style={{ fontSize: '9px', opacity: 0.5, marginLeft: '2px' }}>(&#8592;)</span>
          )}
        </button>

        {/* Center: step counter or SELESAI badge */}
        {isAllComplete ? (
          <SelesaiBadge tokens={tokens} isCompact={isCompact} />
        ) : (
          <span
            style={{
              fontSize: isCompact ? '9px' : '10px',
              fontWeight: 700,
              color: mutedColor,
              letterSpacing: '0.05em',
            }}
          >
            {activeStep + 1} / {totalSteps}
          </span>
        )}

        {/* Next button */}
        <button
          onClick={() => {
            if (activeStep < totalSteps - 1) {
              onStepChange(activeStep + 1);
              setSpringKey((k) => k + 1);
            }
          }}
          disabled={activeStep === totalSteps - 1}
          onMouseEnter={() => setHoveredBtn('next')}
          onMouseLeave={() => setHoveredBtn(null)}
          aria-label="Langkah berikutnya"
          className="premium-tooltip"
          data-premium-tip="&#8594; Panah Kanan"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: isCompact ? '5px 12px' : '7px 16px',
            borderRadius: '10px',
            fontSize: isCompact ? '10px' : '11px',
            fontWeight: 700,
            border: `1px solid ${activeStep === totalSteps - 1 ? 'transparent' : accentAlpha(0.3)}`,
            background: activeStep === totalSteps - 1 ? 'transparent' : `linear-gradient(135deg, ${accentAlpha(0.12)}, ${accentAlpha(0.06)})`,
            color: activeStep === totalSteps - 1 ? mutedColor : accentColor,
            cursor: activeStep === totalSteps - 1 ? 'default' : 'pointer',
            opacity: activeStep === totalSteps - 1 ? 0.35 : 1,
            transition: 'all 0.2s ease',
            animation: hoveredBtn === 'next' && activeStep < totalSteps - 1 ? 'springBounce 0.4s ease' : 'none',
          } as React.CSSProperties}
        >
          <span>Berikutnya</span>
          <span style={{ fontSize: isCompact ? '11px' : '13px' }}>&#8594;</span>
          {hoveredBtn === 'next' && activeStep < totalSteps - 1 && (
            <span style={{ fontSize: '9px', opacity: 0.5, marginLeft: '2px' }}>(&#8594;)</span>
          )}
        </button>
      </div>

      {/* ── Confetti overlay on step advance ─────────────────────── */}
      <ConfettiBurst accent={accent} tokens={tokens} />
    </div>
  );
}
