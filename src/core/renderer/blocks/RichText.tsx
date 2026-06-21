// ═══════════════════════════════════════════════════════════════════
// RICH TEXT — HTML-aware text renderer for schema content
// ═══════════════════════════════════════════════════════════════════
// Schema content often contains HTML markup like <strong>, <em>, <br/>
// for basic formatting.
//
// This component auto-detects HTML tags and renders them properly,
// falling back to plain text when no HTML is detected.
//
// Security note: The HTML content comes from our own schema/preset
// files, NOT from user input. This is intentional — we control
// the content source.
//
// IMPORTANT: Only allow basic formatting tags. Block-level tags
// like <script>, <iframe>, <style> are stripped for safety.
//
// Sprint 9.0C: sanitizeHtml now delegates to the single-source
// src/lib/sanitize.ts#sanitizeHtmlForRender. The local implementation
// is kept as a thin re-export for backward compatibility with
// existing imports in DefBoxRenderer.tsx and InlineTextEditor.tsx.
// ═══════════════════════════════════════════════════════════════════

'use client';

import React, { useMemo } from 'react';
// Sprint 9.0C: single-source sanitizer
import { sanitizeHtmlForRender } from '@/lib/sanitize';

// ── Types ──────────────────────────────────────────────────────

export interface RichTextProps {
  /** The text content — may contain HTML tags like <strong>, <em>, <br/> */
  content: string;
  /** CSS class for the rendered element */
  className?: string;
  /** Inline styles for the rendered element */
  style?: React.CSSProperties;
  /** Tag to render — defaults to 'span' */
  tag?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'label';
  /** Placeholder text when content is empty */
  placeholder?: string;
}

// ── HTML Detection ─────────────────────────────────────────────

/**
 * Check if a string contains HTML tags.
 * Only matches opening tags (e.g., <strong>, <em>, <br/>),
 * NOT HTML entities like &amp; or &lt;
 */
export function hasHtmlTags(text: string): boolean {
  return /<[a-z][\s\S]*?>/i.test(text);
}

/**
 * Sanitize HTML content — strip dangerous tags while preserving
 * safe formatting tags. This is a whitelist approach.
 *
 * Sprint 9.0C: delegates to the single-source sanitizeHtmlForRender
 * in src/lib/sanitize.ts. The new implementation closes gaps in the
 * previous version:
 *   - Strips ALL attributes from allowed tags (not just on* and javascript:)
 *   - Properly tokenizes HTML to avoid regex-bypass tricks
 *   - Strips <script>...</script> content (not just the tags)
 *   - Drops comments and malformed <!...> declarations
 *
 * Kept as a re-export to avoid touching every import site. New code
 * should import sanitizeHtmlForRender directly from '@/lib/sanitize'.
 */
export function sanitizeHtml(html: string): string {
  return sanitizeHtmlForRender(html);
}

// ── Component ──────────────────────────────────────────────────

export const RichText = React.memo(function RichText({
  content,
  className,
  style,
  tag: Tag = 'span',
  placeholder = '',
}: RichTextProps) {
  const displayContent = content || placeholder;

  // Both useMemo calls must be unconditional (Rules of Hooks)
  const hasHtml = useMemo(() => hasHtmlTags(content || ''), [content]);
  const sanitizedHtml = useMemo(() => sanitizeHtml(displayContent), [displayContent]);

  // Baseline overflow protection — prevents long words/URLs from
  // breaking layout in all modes (canvas, preview, export).
  // Parent components can override via style prop if needed.
  const baselineStyle: React.CSSProperties = {
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    ...style,
  };

  if (hasHtml) {
    // Content contains HTML — sanitize and render as HTML
    return (
      <span className="material-symbols-outlined" style={ { fontSize: '16px' } }>label</span>
    );
  }

  // Plain text — render as React children (safe, no XSS risk)
  return (
    <Tag className={className} style={baselineStyle}>
      {displayContent}
    </Tag>
  );
});

/**
 * Convenience function: strip all HTML tags from a string.
 * Used when plain text is needed (e.g., for aria-label, title attr).
 */
export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}
