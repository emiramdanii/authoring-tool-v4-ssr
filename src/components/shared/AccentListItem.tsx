'use client';

import type { ReactNode } from 'react';

// ═══════════════════════════════════════════════════════════════
// ACCENT LIST ITEM — Standardized left-accent + content pattern
//
// Replaces 20+ inconsistent inline `borderLeft`/`paddingLeft` patterns
// across Preview components with a single, consistent implementation.
//
// Usage:
//   <AccentListItem accentColor="#f59e0b">
//     <div>Content here</div>
//   </AccentListItem>
// ═══════════════════════════════════════════════════════════════

interface AccentListItemProps {
  /** Color for the left accent border. Defaults to amber-500. */
  accentColor?: string;
  /** Content to render inside the item */
  children: ReactNode;
  /** Additional CSS classes for the outer container */
  className?: string;
}

export function AccentListItem({
  accentColor = '#f59e0b',
  children,
  className = '',
}: AccentListItemProps) {
  return (
    <div
      className={`pl-2 ${className}`}
      style={{
        borderLeft: `3px solid ${accentColor}`,
      }}
    >
      {children}
    </div>
  );
}
