// ═══════════════════════════════════════════════════════════════════
// STATISTICS — Statistik & Angka renderer
// ═══════════════════════════════════════════════════════════════════

import type { LayoutVariant, M } from './types';
import { T } from './tokens';
import { arr, str, esc } from './helpers';

// ── STATISTIK ─────────────────────────────────────────────────────
export function bodyStatistik(mod: M, v: LayoutVariant): string {
  const items = arr<Record<string, unknown>>(mod.items);
  const max = 4;
  if (v === 'D') {
    return items.slice(0, max).map(it =>
      `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-left:3px solid ${str(it.color, T.o)};padding-left:8px">` +
        `<span style="font-size:12px">${esc(str(it.icon, '📊'))}</span>` +
        `<span style="font-weight:700;font-size:14px;color:${str(it.color, T.o)};font-family:'Fredoka One',cursive">${esc(str(it.angka, '-'))}${esc(str(it.satuan))}</span>` +
        `<span style="font-size:10px;color:${T.muted};font-family:'Nunito',sans-serif">${esc(str(it.label))}</span>` +
        `</div>`
    ).join('');
  }
  const cols = v === 'B' ? 'repeat(4,1fr)' : v === 'C' ? 'repeat(2,1fr)' : 'repeat(2,1fr)';
  // A & C share 2-col but differ in icon/number size (C is bigger)
  return `<div style="display:grid;grid-template-columns:${cols};gap:8px">` +
    items.slice(0, max).map(it =>
      `<div style="border-radius:10px;padding:10px;text-align:center;background:${str(it.color, T.o)}12;border:1px solid ${str(it.color, T.o)}25">` +
        `<div style="font-size:${v === 'C' ? '24px' : '18px'}">${esc(str(it.icon, '📊'))}</div>` +
        `<div style="font-weight:700;font-size:${v === 'C' ? '24px' : '20px'};color:${str(it.color, T.o)};font-family:'Fredoka One',cursive">${esc(str(it.angka, '-'))}</div>` +
        (str(it.satuan) ? `<div style="font-size:10px;color:${T.muted};font-family:'Nunito',sans-serif">${esc(str(it.satuan))}</div>` : '') +
        `<div style="font-size:10px;color:${T.muted};font-family:'Nunito',sans-serif">${esc(str(it.label))}</div>` +
        `</div>`
    ).join('') + `</div>`;
}
