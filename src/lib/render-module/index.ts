// ═══════════════════════════════════════════════════════════════════
// INDEX — Re-exports for the render-module package
// ═══════════════════════════════════════════════════════════════════

import type { LayoutVariant } from './types';
import { T } from './tokens';
import { str, esc, getModuleMeta, cardShell } from './helpers';
import { renderBody } from './router';

// ── APPROACH B: Pure HTML string (for export, no Tailwind) ────────

/** Render a single module card to styled HTML (pure inline styles, no CSS classes) */
export function renderModuleToStyledHTML(module: Record<string, unknown>, layoutVariant?: LayoutVariant): string {
  const v: LayoutVariant = layoutVariant || 'A';
  const meta = getModuleMeta(str(module.type));
  const title = str(module.title) || meta.label;
  const body = renderBody(module, v);

  const headerHtml = `<div style="padding:16px">` +
    `<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px">` +
      `<div style="flex-shrink:0;width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;background:${meta.color}20;border:1px solid ${meta.color}30">${meta.icon}</div>` +
      `<div style="flex:1;min-width:0">` +
        `<div style="font-weight:700;font-size:14px;color:${T.text};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:'Nunito',sans-serif">${esc(title)}</div>` +
        `<div style="display:flex;align-items:center;gap:6px;margin-top:4px;flex-wrap:wrap">` +
          `<span style="font-size:10px;font-weight:500;padding:2px 8px;border-radius:4px;background:${meta.color}15;color:${meta.color};font-family:'Nunito',sans-serif">${esc(meta.label)}</span>` +
          (v !== 'A' ? `<span style="font-size:9px;font-weight:600;padding:2px 8px;border-radius:4px;background:${T.y}18;color:${T.y};border:1px solid ${T.y}30;font-family:'Nunito',sans-serif">${v === 'B' ? '\u{1F4CB}' : v === 'C' ? '\u{1F3A8}' : '\u{1F4DD}'} ${v === 'B' ? 'Compact' : v === 'C' ? 'Visual' : 'Minimal'}</span>` : '') +
          (meta.isGame ? `<span style="font-size:9px;font-weight:700;padding:2px 8px;border-radius:4px;background:${T.g}18;color:${T.g};border:1px solid ${T.g}30;font-family:'Nunito',sans-serif">\u{1F3AE} Game</span>` : '') +
        `</div>` +
      `</div>` +
    `</div>` +
    `<div style="min-height:40px">${body}</div>` +
    `</div>`;

  return cardShell(meta.color, headerHtml);
}

/** Render multiple modules to styled HTML */
export function renderModulesToStyledHTML(modules: Array<Record<string, unknown>>): string {
  return modules.map(m => renderModuleToStyledHTML(m)).join('');
}

// ── APPROACH A: React-based (for canvas preview with Tailwind) ────
export { renderModuleToHTML, renderModulesToHTML } from './react-renderer';

// ── Re-export types for convenience ───────────────────────────────
export type { LayoutVariant, M, ModuleTypeMeta } from './types';
