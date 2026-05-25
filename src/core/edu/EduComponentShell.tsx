'use client';

/**
 * EDU COMPONENT SHELL — Reusable wrapper with automatic component identity
 *
 * This component enforces the educational component grammar:
 *   1. Card container (radius, border, shadow, background)
 *   2. Header with icon + heading prefix + stripe
 *   3. Body area with correct padding
 *
 * Display Mode is automatically supported — the shell reads
 * the current display mode from the EduRenderingContext and
 * applies mode-aware styles (print B&W, projector warm, etc.)
 *
 * Usage:
 *   const edu = tokens.edu('tujuan-display', isCompact);
 *   <EduComponentShell edu={edu} isCompact={isCompact}>
 *     {content}
 *   </EduComponentShell>
 *
 * This replaces the manual pattern:
 *   <div style={edu.cardStyle()}>
 *     <div style={edu.headerStyle()}>
 *       <Icon /> {edu.headingPrefix()}
 *     </div>
 *     <div style={edu.componentPadding()}>
 *       {content}
 *     </div>
 *   </div>
 */

import React from 'react';
import type { EduRenderingContext } from './EduRenderingContext';

// ═══════════════════════════════════════════════════════════════
// COMPONENT SHELL PROPS
// ═══════════════════════════════════════════════════════════════

export interface EduComponentShellProps {
  /** The edu rendering context — provides component identity + display mode */
  edu: EduRenderingContext;
  /** Whether the canvas is in compact mode */
  isCompact?: boolean;
  /** Override the heading text (default: edu.headingPrefix()) */
  title?: string;
  /** Hide the header entirely */
  hideHeader?: boolean;
  /** Additional class names for the card container */
  className?: string;
  /** Additional inline styles for the card container */
  style?: React.CSSProperties;
  /** Header slot — if provided, replaces the default header entirely */
  headerSlot?: React.ReactNode;
  /** Footer slot — optional area below body (for actions, metadata) */
  footerSlot?: React.ReactNode;
  /** Whether to show the component icon in the header */
  showIcon?: boolean;
  /** Children — the body content */
  children: React.ReactNode;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT SHELL
// ═══════════════════════════════════════════════════════════════

export function EduComponentShell({
  edu,
  isCompact = false,
  title,
  hideHeader = false,
  className,
  style,
  headerSlot,
  footerSlot,
  showIcon = true,
  children,
}: EduComponentShellProps) {
  const identity = edu.identity();
  const displayMode = edu.displayMode;

  // Resolve icon component
  const IconComponent = identity.icon;

  // Header text — use explicit title or fall back to component's heading prefix
  const headingText = title ?? identity.headingPrefix;

  // Mode-aware typography
  const headingTypo = edu.heading();

  return (
    <div
      className={className}
      style={{
        ...edu.cardStyle(),
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* ══ Header ══════════════════════════════════════════════ */}
      {!hideHeader && !headerSlot && (
        <div
          style={{
            ...edu.headerStyle(),
            display: 'flex',
            alignItems: 'center',
            gap: edu.gap('tight'),
          }}
        >
          {/* Accent stripe is handled by headerStyle() via identity.hasStripe */}

          {/* Icon */}
          {showIcon && IconComponent && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: edu.iconSize('md'),
                height: edu.iconSize('md'),
                borderRadius: edu.radius('sm'),
                background: edu.accentAlpha(0.12),
                flexShrink: 0,
              }}
            >
              <IconComponent
                size={isCompact ? 14 : 18}
                style={{ color: edu.accent() }}
              />
            </div>
          )}

          {/* Heading text */}
          <span
            style={{
              ...headingTypo,
              color: displayMode === 'print' ? '#000000' : edu.accent(),
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {headingText}
          </span>
        </div>
      )}

      {/* Custom header slot */}
      {!hideHeader && headerSlot}

      {/* ══ Body ════════════════════════════════════════════════ */}
      <div style={edu.componentPadding()}>
        {children}
      </div>

      {/* ══ Footer ══════════════════════════════════════════════ */}
      {footerSlot && (
        <div
          style={{
            ...edu.componentPadding(),
            paddingTop: 0,
            borderTop: `1px solid ${edu.accentBorder()}`,
            opacity: 0.8,
          }}
        >
          {footerSlot}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// INLINE SECTION — Sub-component for sections within a shell
// ═══════════════════════════════════════════════════════════════
// Use for: definition boxes, example boxes, nested sections
// within a larger component.

export interface EduInlineSectionProps {
  edu: EduRenderingContext;
  /** Section label */
  label: string;
  /** Additional styles */
  style?: React.CSSProperties;
  /** Children content */
  children: React.ReactNode;
}

export function EduInlineSection({
  edu,
  label,
  style,
  children,
}: EduInlineSectionProps) {
  return (
    <div
      style={{
        ...edu.nestedPadding(),
        background: edu.accentBg(),
        borderRadius: edu.radius('md'),
        border: `1px solid ${edu.accentBorder()}`,
        ...style,
      }}
    >
      {/* Label */}
      <div
        style={{
          ...edu.caption(),
          color: edu.accent(),
          fontWeight: 700,
          marginBottom: edu.gap('tight'),
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>
      {/* Content */}
      {children}
    </div>
  );
}
