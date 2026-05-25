/**
 * EDUCATIONAL SPACING — Rhythm tokens for classroom readability
 *
 * Educational content needs MORE whitespace than consumer apps.
 * Students need visual breathing room to process information.
 * The spacing here enforces the 35% whitespace minimum.
 */

// ═══════════════════════════════════════════════════════════════
// EDUCATIONAL SPACING SCALE
// ═══════════════════════════════════════════════════════════════

export const EDU_SPACING = {
  /** Component-level padding — card inner padding */
  component: {
    /** Compact mode */
    compact: { block: 12, inline: 16 },
    /** Standard mode */
    standard: { block: 18, inline: 22 },
    /** Generous — cover, hero */
    generous: { block: 24, inline: 28 },
  },

  /** Section-level padding — between sections in a scene */
  section: {
    compact: { block: 14, inline: 18 },
    standard: { block: 22, inline: 26 },
    generous: { block: 28, inline: 32 },
  },

  /** Gap between list items, objectives, cards */
  gap: {
    tight: 8,     // Same-type items (list of objectives)
    standard: 12,  // Between different items
    generous: 16,  // Between different components
    section: 24,   // Between major sections
  },

  /** Icon container sizes for educational components */
  icon: {
    sm: 28,   // Inline icons
    md: 36,   // Card header icons
    lg: 44,   // Section header icons
    xl: 56,   // Cover/hero icons
  },

  /** Accent stripe widths */
  stripe: {
    thin: 3,
    standard: 4,
    thick: 5,
  },

  /** Border radii — slightly larger for educational clarity */
  radius: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 22,
    full: 99,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// HELPER: Resolve spacing for compact/standard
// ═══════════════════════════════════════════════════════════════

export function eduComponentPadding(isCompact: boolean): Record<string, string> {
  const spec = isCompact ? EDU_SPACING.component.compact : EDU_SPACING.component.standard;
  return { padding: `${spec.block}px ${spec.inline}px` };
}

export function eduSectionPadding(isCompact: boolean): Record<string, string> {
  const spec = isCompact ? EDU_SPACING.section.compact : EDU_SPACING.section.standard;
  return { padding: `${spec.block}px ${spec.inline}px` };
}

export function eduNestedPadding(isCompact: boolean): Record<string, string> {
  const spec = isCompact
    ? { block: 8, inline: 12 }
    : { block: 12, inline: 16 };
  return { padding: `${spec.block}px ${spec.inline}px` };
}
