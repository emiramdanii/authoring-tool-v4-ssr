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
// ═══════════════════════════════════════════════════════════════════

'use client';

import React, { useMemo } from 'react';

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
 */
function sanitizeHtml(html: string): string {
  // Allowed tags for basic formatting in schema content
  const allowedTags = ['strong', 'em', 'b', 'i', 'u', 'br', 'span', 'sub', 'sup', 'mark', 'small'];

  // Remove script, iframe, style, and event handlers
  let sanitized = html
    // Remove script tags and content
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    // Remove iframe tags
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    // Remove style tags and content
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    // Remove event handlers (onclick, onerror, etc.)
    .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove javascript: URLs
    .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');

  // Remove any tags not in the allowed list
  // This regex matches opening and closing tags, preserves allowed ones
  const tagPattern = /<\/?([a-z][a-z0-9]*)\b[^>]*\/?>/gi;
  sanitized = sanitized.replace(tagPattern, (match, tagName) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      return match;
    }
    // For disallowed tags, return empty (strip the tag but keep content)
    return '';
  });

  return sanitized;
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
      <Tag
        className={className}
        style={baselineStyle}
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
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
