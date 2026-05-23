'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { TokenResolver } from '../types';
import { resolveColor, resolveColorAlpha, resolveMuted, resolveSubtleBg, resolveSubtleBorder } from '../types';
import { IOS_INTERACTION } from '../../themes/ios-visual-contract';

// ═══════════════════════════════════════════════════════════════════
// STEP NAVIGATOR — Reusable Step/Tab Navigation Component
// ═══════════════════════════════════════════════════════════════════
// Splits content into steps with prev/next navigation when content
// is too long. Provides slide animation, keyboard navigation,
// progress bar, and step labels as chips/tabs.
//
// Usage:
//   const { activeStep, ... } = useStepNavigator(4);
//   <StepNavigator labels={...} activeStep={activeStep} onStepChange={...}>
//     {stepContent}
//   </StepNavigator>
// ═══════════════════════════════════════════════════════════════════

export interface StepNavigatorProps {
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
}

/** Hook for managing step navigation state */
export function useStepNavigator(totalSteps: number, initialStep: number = 0) {
  const [activeStep, setActiveStep] = useState(initialStep);
  const [direction, setDirection] = useState<'left' | 'right'>('right');

  const goTo = useCallback((step: number) => {
    if (step < 0 || step >= totalSteps) return;
    setDirection(step > activeStep ? 'right' : 'left');
    setActiveStep(step);
  }, [activeStep, totalSteps]);

  const next = useCallback(() => {
    if (activeStep < totalSteps - 1) {
      setDirection('right');
      setActiveStep((s) => s + 1);
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
  const isComplete = activeStep === totalSteps - 1;
  const progress = totalSteps <= 1 ? 1 : (activeStep + 1) / totalSteps;

  return {
    activeStep,
    direction,
    goTo,
    next,
    prev,
    isFirst,
    isLast,
    isComplete,
    progress,
    totalSteps,
  };
}

export function StepNavigator({
  labels,
  activeStep,
  onStepChange,
  children,
  tokens,
  accent = 'y',
  isCompact = false,
}: StepNavigatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const totalSteps = labels.length;

  // Keyboard navigation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (activeStep < totalSteps - 1) onStepChange(activeStep + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (activeStep > 0) onStepChange(activeStep - 1);
      }
    };

    el.addEventListener('keydown', handleKeyDown);
    return () => el.removeEventListener('keydown', handleKeyDown);
  }, [activeStep, totalSteps, onStepChange]);

  const accentColor = resolveColor(tokens, accent, '#fbbf24', '#fbbf24');
  const accentBg = resolveColorAlpha(tokens, accent, 0.12, 'rgba(251,191,36,0.12)', 'rgba(251,191,36,0.12)');
  const accentBorder = resolveColorAlpha(tokens, accent, 0.3, 'rgba(251,191,36,0.3)', 'rgba(251,191,36,0.3)');
  const mutedColor = resolveMuted(tokens, 0.6, 'rgba(71,85,105,0.6)', 'rgba(110,144,181,0.6)');
  const textColor = resolveColor(tokens, 'text', '#0f172a', '#e8f2ff');
  const bgColor = resolveColor(tokens, 'card', '#ffffff', '#182d45');
  const progress = totalSteps <= 1 ? 1 : (activeStep + 1) / totalSteps;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="tablist"
      aria-label="Navigasi langkah"
      style={{
        outline: 'none',
        borderRadius: tokens ? tokens.radius('xl') + 'px' : '12px',
        overflow: 'hidden',
      }}
    >
      {/* ── Step Chips / Tabs ───────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: isCompact ? '4px' : '6px',
          padding: isCompact ? '8px 8px 0' : '10px 12px 0',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {labels.map((label, i) => {
          const isActive = i === activeStep;
          const isPast = i < activeStep;
          return (
            <button
              key={`step-chip-${i}`}
              role="tab"
              aria-selected={isActive}
              onClick={() => onStepChange(i)}
              className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: isCompact ? '3px 10px' : '5px 14px',
                borderRadius: '9999px',
                fontSize: isCompact ? '10px' : '11px',
                fontWeight: 700,
                letterSpacing: '0.03em',
                border: `1px solid ${isActive ? accentBorder : 'transparent'}`,
                background: isActive ? accentBg : isPast ? resolveColorAlpha(tokens, accent, 0.05, 'rgba(251,191,36,0.05)', 'rgba(251,191,36,0.05)') : 'transparent',
                color: isActive ? accentColor : isPast ? resolveColorAlpha(tokens, accent, 0.6, 'rgba(251,191,36,0.6)', 'rgba(251,191,36,0.6)') : mutedColor,
                cursor: 'pointer',
                outline: 'none',
                transition: 'background-color, border-color, color 150ms ease',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {isPast && (
                <span style={{ fontSize: isCompact ? '9px' : '10px' }}>&#10003;</span>
              )}
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Progress Bar ────────────────────────────────────────── */}
      <div
        style={{
          margin: isCompact ? '6px 8px' : '8px 12px',
          height: isCompact ? '2px' : '3px',
          borderRadius: '9999px',
          background: resolveSubtleBg(tokens, 0.06),
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress * 100}%`,
            borderRadius: '9999px',
            background: `linear-gradient(90deg, ${accentColor}, ${resolveColorAlpha(tokens, accent, 0.6, 'rgba(251,191,36,0.6)', 'rgba(251,191,36,0.6)')})`,
            transition: `width ${IOS_INTERACTION.duration.slow}ms ${IOS_INTERACTION.easing.ios}`,
          }}
        />
      </div>

      {/* ── Step Content ────────────────────────────────────────── */}
      <div
        style={{
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            animation: activeStep > 0 ? 'pageSlideInRight 0.3s ease' : 'pageSlideInLeft 0s ease',
            transition: `transform ${IOS_INTERACTION.duration.slow}ms ease, opacity ${IOS_INTERACTION.duration.slow}ms ease`,
          }}
        >
          {children}
        </div>
      </div>

      {/* ── Navigation Buttons ──────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: isCompact ? '6px 8px 8px' : '8px 12px 10px',
          borderTop: `1px solid ${resolveSubtleBorder(tokens, 0.08)}`,
        }}
      >
        <button
          onClick={() => onStepChange(activeStep - 1)}
          disabled={activeStep === 0}
          aria-label="Langkah sebelumnya"
          className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: isCompact ? '4px 10px' : '6px 14px',
            borderRadius: '8px',
            fontSize: isCompact ? '10px' : '11px',
            fontWeight: 700,
            border: `1px solid ${activeStep === 0 ? 'transparent' : accentBorder}`,
            background: activeStep === 0 ? 'transparent' : accentBg,
            color: activeStep === 0 ? mutedColor : accentColor,
            cursor: activeStep === 0 ? 'default' : 'pointer',
            opacity: activeStep === 0 ? 0.4 : 1,
            outline: 'none',
            transition: 'background-color, border-color, color, opacity 150ms ease',
          }}
        >
          <span style={{ fontSize: isCompact ? '10px' : '12px' }}>&#8592;</span>
          <span>Sebelumnya</span>
        </button>

        {/* Step counter */}
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

        <button
          onClick={() => onStepChange(activeStep + 1)}
          disabled={activeStep === totalSteps - 1}
          aria-label="Langkah berikutnya"
          className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: isCompact ? '4px 10px' : '6px 14px',
            borderRadius: '8px',
            fontSize: isCompact ? '10px' : '11px',
            fontWeight: 700,
            border: `1px solid ${activeStep === totalSteps - 1 ? 'transparent' : accentBorder}`,
            background: activeStep === totalSteps - 1 ? 'transparent' : accentBg,
            color: activeStep === totalSteps - 1 ? mutedColor : accentColor,
            cursor: activeStep === totalSteps - 1 ? 'default' : 'pointer',
            opacity: activeStep === totalSteps - 1 ? 0.4 : 1,
            outline: 'none',
            transition: 'background-color, border-color, color, opacity 150ms ease',
          }}
        >
          <span>Berikutnya</span>
          <span style={{ fontSize: isCompact ? '10px' : '12px' }}>&#8594;</span>
        </button>
      </div>
    </div>
  );
}
