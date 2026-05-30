'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { TokenResolver } from '../types';
import type { SceneType } from '../../edu/education-scene-types';
import type { EmotionalMotionType } from '../../edu/education-motion';

// ═══════════════════════════════════════════════════════════════════
// EDU STEP NAVIGATOR — Emotional step navigation for learning
// ═══════════════════════════════════════════════════════════════════
// Replaces PremiumStepNavigator's decorative effects with emotional
// interactions that support learning (Layer 5: Emotional Interaction).
//
// REMOVED (decorative — forbidden in educational content):
//   ❌ Holographic/aurora gradient progress bar
//   ❌ 3D flip step chips with perspective
//   ❌ Confetti burst when advancing steps
//   ❌ Spring-physics bounce on nav buttons
//   ❌ "SELESAI" badge with continuous glow pulse
//
// REPLACED WITH (emotional — supports learning):
//   ✅ Solid accent progress bar with smooth fill (Progress feeling)
//   ✅ Numbered step circles with check-draw on completion (Reward)
//   ✅ Subtle scale-pop on step advance (Reward — NOT bounce)
//   ✅ Completed badge with pulse-once (Reward — NOT continuous)
//   ✅ Keyboard navigation (← →)
//
// Philosophy: "Structured Fun" — 70% structure, 30% engagement.
// Progress + Discovery + Reward. No decorative visual noise.
// ═══════════════════════════════════════════════════════════════════

export interface EduStepNavigatorProps {
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
  /** Scene type for scene-aware rendering */
  sceneType?: SceneType;
  /**
   * Accent color token key (legacy — now ignored, accent comes from edu tokens).
   * Kept for backward compatibility with existing callers.
   * @deprecated Use sceneType instead
   */
  accent?: string;
  /** Compact mode */
  isCompact?: boolean;
  /** Fired once when user reaches the last step (all steps completed) */
  onComplete?: () => void;
}

/** Hook for managing step navigation state — clean, no confetti */
export function useEduStepNavigator(totalSteps: number, initialStep: number = 0) {
  const [activeStep, setActiveStep] = useState(initialStep);

  const goTo = useCallback((step: number) => {
    if (step < 0 || step >= totalSteps) return;
    setActiveStep(step);
  }, [totalSteps]);

  const next = useCallback(() => {
    if (activeStep < totalSteps - 1) {
      setActiveStep((s) => s + 1);
    }
  }, [activeStep, totalSteps]);

  const prev = useCallback(() => {
    if (activeStep > 0) {
      setActiveStep((s) => s - 1);
    }
  }, [activeStep]);

  const isFirst = activeStep === 0;
  const isLast = activeStep === totalSteps - 1;
  const isAllComplete = activeStep === totalSteps - 1;
  const progress = totalSteps <= 1 ? 1 : (activeStep + 1) / totalSteps;

  return {
    activeStep,
    goTo,
    next,
    prev,
    isFirst,
    isLast,
    isAllComplete,
    progress,
    totalSteps,
  };
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function EduStepNavigator({
  labels,
  activeStep,
  onStepChange,
  children,
  tokens,
  sceneType,
  isCompact = false,
  onComplete,
}: EduStepNavigatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const totalSteps = labels.length;
  const hasCompletedRef = useRef(false);
  const [lastStepChange, setLastStepChange] = useState(0); // for reward animation trigger

  // Create edu context for scene-aware styling
  const edu = tokens?.edu('quiz', isCompact, sceneType);
  const emotional = edu?.emotional();

  // Fire onComplete once when user reaches the last step
  useEffect(() => {
    const isAllComplete = activeStep === totalSteps - 1 && totalSteps > 1;
    if (isAllComplete && !hasCompletedRef.current && onComplete) {
      hasCompletedRef.current = true;
      onComplete();
    }
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
          setLastStepChange(Date.now());
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (activeStep > 0) {
          onStepChange(activeStep - 1);
          setLastStepChange(Date.now());
        }
      }
    };

    el.addEventListener('keydown', handleKeyDown);
    return () => el.removeEventListener('keydown', handleKeyDown);
  }, [activeStep, totalSteps, onStepChange]);

  const progress = totalSteps <= 1 ? 1 : (activeStep + 1) / totalSteps;
  const isAllComplete = activeStep === totalSteps - 1 && totalSteps > 1;

  // Typography from edu tokens
  const microStyle = edu ? edu.micro() : { fontSize: '14px', fontWeight: 700, lineHeight: 1.3, letterSpacing: '0.03em' };
  const captionStyle = edu ? edu.caption() : { fontSize: '16px', fontWeight: 500, lineHeight: 1.4 };

  // Colors from edu tokens (scene-aware)
  const accentColor = edu ? edu.accent() : '#fbbf24';
  const accentBgColor = edu ? edu.accentBg() : 'rgba(251,191,36,0.1)';
  const accentBorderColor = edu ? edu.accentBorder() : 'rgba(251,191,36,0.25)';
  const textColor = edu ? edu.textColor() : '#1e293b';
  const mutedColor = edu ? edu.mutedText(0.6) : 'rgba(71,85,105,0.6)';
  const cardBg = edu ? edu.cardBg() : '#ffffff';

  // Emotional motion styles
  const progressFillStyle = edu ? edu.emotionalMotion('fillBar') : { transition: 'width 400ms cubic-bezier(0.4, 0, 0.2, 1)' };
  const stepNextStyle = edu ? edu.emotionalMotion('stepNext') : { transition: 'all 300ms cubic-bezier(0, 0, 0.2, 1)' };
  const checkDrawStyle = edu ? edu.emotionalMotion('checkDraw') : {};
  const scalePopStyle = edu ? edu.emotionalMotion('scalePop') : {};
  const pulseOnceStyle = edu ? edu.emotionalMotion('pulseOnce') : {};

  const handleStepClick = useCallback((step: number) => {
    if (step !== activeStep) {
      onStepChange(step);
      setLastStepChange(Date.now());
    }
  }, [onStepChange, activeStep]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="tablist"
      aria-label="Navigasi langkah"
      style={{
        outline: 'none',
        borderRadius: edu ? edu.radius('xl') : '22px',
        overflow: 'hidden',
        background: cardBg,
        border: `1px solid ${accentBorderColor}`,
        // Scene-aware card treatment
        ...(edu ? edu.cardStyle() : {}),
      }}
    >
      {/* ── Progress Bar — Solid accent fill, NO holographic shimmer ── */}
      <div
        style={{
          height: isCompact ? '3px' : '4px',
          background: accentBgColor,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress * 100}%`,
            borderRadius: '0 9999px 9999px 0',
            background: accentColor,        // Solid accent — NO gradient, NO shimmer
            ...progressFillStyle,            // Emotional: progress fill (400ms smooth)
          }}
        />
      </div>

      {/* ── Step Indicators — Numbered circles, NOT 3D flip chips ── */}
      <div
        style={{
          display: 'flex',
          gap: isCompact ? '4px' : '6px',
          padding: isCompact ? '8px 10px 0' : '12px 14px 0',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          // NO perspective — 3D flip is decorative
        }}
      >
        {labels.map((label, i) => {
          const isActive = i === activeStep;
          const isPast = i < activeStep;

          return (
            <button
              key={`edu-step-${i}`}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleStepClick(i)}
              className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: isCompact ? '3px 8px' : '5px 10px',
                borderRadius: '9999px',
                ...microStyle,
                border: `1px solid ${isActive ? accentColor : 'transparent'}`,
                background: isActive
                  ? accentBgColor
                  : isPast
                    ? accentBgColor
                    : 'transparent',
                color: isActive ? accentColor : isPast ? accentColor : mutedColor,
                cursor: 'pointer',
                ...stepNextStyle,     // Emotional: step transition (300ms)
                whiteSpace: 'nowrap',
                flexShrink: 0,
                // NO perspective, NO 3D transform, NO shadow
                // Subtle scale on active — NOT scale(1.05), just a visual hint
                transform: isActive ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              {/* Step number — or check mark for completed steps */}
              {isPast ? (
                <span
                  style={{
                    fontSize: isCompact ? '10px' : '11px',
                    color: accentColor,
                    ...checkDrawStyle,   // Emotional: check-draw animation
                  }}
                >
                  &#10003;
                </span>
              ) : (
                <span style={{ fontSize: isCompact ? '10px' : '11px', opacity: 0.7 }}>
                  {i + 1}
                </span>
              )}
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Step Content — Smooth crossfade, NO dramatic animation ── */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div
          key={`step-content-${activeStep}`}
          style={{
            // Simple fade entrance — structural, not decorative
            ...(edu ? edu.entrance(0, 'fadeIn') : { animation: 'eduFadeIn 200ms ease both' }),
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
          padding: isCompact ? '8px 12px' : '10px 16px',
          borderTop: `1px solid ${accentBorderColor}`,
        }}
      >
        {/* Prev button — clean, no spring/bounce */}
        <button
          onClick={() => {
            if (activeStep > 0) {
              onStepChange(activeStep - 1);
              setLastStepChange(Date.now());
            }
          }}
          disabled={activeStep === 0}
          aria-label="Langkah sebelumnya"
          className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: isCompact ? '4px 10px' : '6px 12px',
            borderRadius: edu ? edu.radius('sm') : '10px',
            ...microStyle,
            border: `1px solid ${activeStep === 0 ? 'transparent' : accentBorderColor}`,
            background: activeStep === 0 ? 'transparent' : accentBgColor,
            color: activeStep === 0 ? mutedColor : accentColor,
            cursor: activeStep === 0 ? 'default' : 'pointer',
            opacity: activeStep === 0 ? 0.35 : 1,
            ...stepNextStyle,     // Emotional: step transition
            // NO springBounce animation
          }}
        >
          <span style={{ fontSize: isCompact ? '12px' : '14px' }}>&#8592;</span>
          <span>Sebelumnya</span>
        </button>

        {/* Center: step counter or completion indicator */}
        {isAllComplete ? (
          // Completed state — emotional reward, NOT continuous glow
          <div
            key={`completed-${lastStepChange}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: `${isCompact ? 4 : 6}px ${isCompact ? 10 : 14}px`,
              borderRadius: '9999px',
              background: accentBgColor,
              border: `1px solid ${accentColor}`,
              color: accentColor,
              ...microStyle,
              letterSpacing: '0.06em',
              ...pulseOnceStyle,   // Emotional: pulse-once (NOT continuous glow)
            }}
          >
            <span style={{ fontSize: isCompact ? '12px' : '14px' }}>&#10003;</span>
            <span>Selesai</span>
          </div>
        ) : (
          <span style={{ ...captionStyle, color: mutedColor }}>
            {activeStep + 1} / {totalSteps}
          </span>
        )}

        {/* Next button — clean, no spring/bounce */}
        <button
          onClick={() => {
            if (activeStep < totalSteps - 1) {
              onStepChange(activeStep + 1);
              setLastStepChange(Date.now());
            }
          }}
          disabled={activeStep === totalSteps - 1}
          aria-label="Langkah berikutnya"
          className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: isCompact ? '4px 10px' : '6px 12px',
            borderRadius: edu ? edu.radius('sm') : '10px',
            ...microStyle,
            border: `1px solid ${activeStep === totalSteps - 1 ? 'transparent' : accentBorderColor}`,
            background: activeStep === totalSteps - 1 ? 'transparent' : accentBgColor,
            color: activeStep === totalSteps - 1 ? mutedColor : accentColor,
            cursor: activeStep === totalSteps - 1 ? 'default' : 'pointer',
            opacity: activeStep === totalSteps - 1 ? 0.35 : 1,
            ...stepNextStyle,     // Emotional: step transition
            // NO springBounce animation
          }}
        >
          <span>Berikutnya</span>
          <span style={{ fontSize: isCompact ? '12px' : '14px' }}>&#8594;</span>
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// BACKWARD COMPATIBILITY — Re-export with old name
// ═══════════════════════════════════════════════════════════════════
// PremiumStepNavigator is now EduStepNavigator internally.
// The old import still works but uses the new emotional design.

export const PremiumStepNavigator = EduStepNavigator;
export type PremiumStepNavigatorProps = EduStepNavigatorProps;
export { useEduStepNavigator as usePremiumStepNavigator };
