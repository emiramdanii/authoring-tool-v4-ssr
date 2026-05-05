// ═══════════════════════════════════════════════════════════════════
// REACT RENDERER — React-based rendering (for canvas preview)
// ═══════════════════════════════════════════════════════════════════

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { LayoutVariant } from './types';
import { T } from './tokens';
import { str, getModuleMeta, cardShell, esc } from './helpers';
import { renderBody } from './router';

/** React component for a single module card (Tailwind + inline styles) */
function ReactModuleCard({ module: mod, layoutVariant }: { module: Record<string, unknown>; layoutVariant?: LayoutVariant }) {
  const v = layoutVariant || 'A';
  const meta = getModuleMeta(str(mod.type));
  const title = str(mod.title) || meta.label;
  const bodyHtml = renderBody(mod, v);

  return React.createElement('div', {
    style: {
      borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.09)',
      background: T.card,
      overflow: 'hidden',
    },
  },
    // Accent bar
    React.createElement('div', {
      style: {
        height: 3,
        background: `linear-gradient(90deg,${meta.color},${meta.color}66,transparent)`,
      },
    }),
    // Content
    React.createElement('div', { style: { padding: 16 } },
      // Header
      React.createElement('div', {
        style: { display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
      },
        // Icon box
        React.createElement('div', {
          style: {
            flexShrink: 0,
            width: 40,
            height: 40,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            background: meta.color + '20',
            border: `1px solid ${meta.color}30`,
          },
        }, meta.icon),
        // Title + type
        React.createElement('div', { style: { flex: 1, minWidth: 0 } },
          React.createElement('div', {
            style: {
              fontWeight: 700,
              fontSize: 14,
              color: T.text,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            },
          }, title),
          React.createElement('div', {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 4,
              flexWrap: 'wrap' as const,
            },
          },
            React.createElement('span', {
              style: {
                fontSize: 10,
                fontWeight: 500,
                padding: '2px 8px',
                borderRadius: 4,
                background: meta.color + '15',
                color: meta.color,
              },
            }, meta.label),
            meta.isGame && React.createElement('span', {
              style: {
                fontSize: 9,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 4,
                background: T.g + '18',
                color: T.g,
                border: `1px solid ${T.g}30`,
              },
            }, '\u{1F3AE} Game'),
          ),
        ),
      ),
      // Body
      React.createElement('div', {
        style: { minHeight: 40 },
        dangerouslySetInnerHTML: { __html: bodyHtml },
      }),
    ),
  );
}

/** Render a single module to HTML via React (for canvas preview) */
export function renderModuleToHTML(module: Record<string, unknown>, layoutVariant?: LayoutVariant): string {
  const element = React.createElement(ReactModuleCard, { module, layoutVariant });
  return renderToStaticMarkup(element);
}

/** Render multiple modules to HTML via React */
export function renderModulesToHTML(modules: Array<Record<string, unknown>>): string {
  return modules.map(m => renderModuleToHTML(m)).join('');
}
