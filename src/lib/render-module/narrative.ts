// ═══════════════════════════════════════════════════════════════════
// NARRATIVE — Timeline, Hero, Kutipan, Langkah, Skenario, Debat
// ═══════════════════════════════════════════════════════════════════

import type { LayoutVariant, M } from './types';
import { T } from './tokens';
import { HERO_GRADIENTS } from './tokens';
import { arr, str, esc } from './helpers';

// ── TIMELINE ──────────────────────────────────────────────────────
export function bodyTimeline(mod: M, v: LayoutVariant): string {
  const events = arr<Record<string, unknown>>(mod.events);
  const max = v === 'C' ? 5 : 4;
  if (v === 'D') {
    return events.slice(0, max).map(ev =>
      `<div style="display:flex;align-items:flex-start;gap:8px;padding:4px 0;border-left:2px solid ${T.g};padding-left:8px">` +
        `<span style="font-size:10px">${esc(str(ev.icon, '📌'))}</span>` +
        `<div><span style="font-size:10px;font-weight:700;color:${T.g};font-family:'Nunito',sans-serif">${esc(str(ev.tahun))}</span>` +
        `<span style="font-size:12px;margin-left:4px;color:${T.text};font-family:'Nunito',sans-serif">${esc(str(ev.judul))}</span></div></div>`
    ).join('') +
    (events.length > max ? `<div style="font-size:10px;color:${T.muted};font-family:'Nunito',sans-serif">+${events.length - max} lagi</div>` : '');
  }
  return events.slice(0, max).map((ev, i) => {
    const isLast = i === Math.min(events.length, max) - 1;
    return `<div style="display:flex;align-items:flex-start;gap:10px;padding-left:18px;position:relative;margin-bottom:8px">` +
      `<div style="position:absolute;left:0;top:3px;width:10px;height:10px;border-radius:50%;background:${T.g};border:2px solid ${T.card};z-index:1"></div>` +
      (!isLast ? `<div style="position:absolute;left:4px;top:13px;bottom:0;width:1px;background:${T.g}40"></div>` : '') +
      `<div style="padding-bottom:4px;flex:1;min-width:0">` +
        `<div style="display:flex;align-items:center;gap:6px">` +
          `<span style="font-size:${v === 'C' ? '12px' : '10px'}">${esc(str(ev.icon, '📌'))}</span>` +
          (str(ev.tahun) ? `<span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;background:${T.g}20;color:${T.g};font-family:'Nunito',sans-serif">${esc(str(ev.tahun))}</span>` : '') +
          `<span style="font-weight:600;font-size:${v === 'C' ? '13px' : '12px'};color:${T.text};font-family:'Nunito',sans-serif">${esc(str(ev.judul))}</span>` +
        `</div>` +
        (str(ev.isi) ? `<div style="font-size:10px;color:${T.muted};margin-top:2px;font-family:'Nunito',sans-serif">${esc(str(ev.isi).slice(0, 60))}</div>` : '') +
      `</div></div>`;
  }).join('') +
  (events.length > max ? `<div style="font-size:10px;padding-left:18px;color:${T.muted};font-family:'Nunito',sans-serif">+${events.length - max} lagi</div>` : '');
}

// ── HERO ──────────────────────────────────────────────────────────
export function bodyHero(mod: M): string {
  const gradient = str(mod.gradient, 'sunset');
  const bg = HERO_GRADIENTS[gradient] || HERO_GRADIENTS.sunset;
  const chipsStr = str(mod.chips, '');
  const chips = chipsStr ? chipsStr.split(',').map(c => c.trim()).filter(Boolean) : [];
  return `<div style="border-radius:14px;padding:24px;position:relative;overflow:hidden;background:${bg};min-height:80px;color:#fff">` +
    `<div style="position:relative;z-index:1">` +
      `<div style="font-size:28px;margin-bottom:4px">${esc(str(mod.icon, '🚀'))}</div>` +
      `<div style="font-weight:700;font-size:14px;font-family:'Nunito',sans-serif">${esc(str(mod.title) || 'Hero Banner')}</div>` +
      (str(mod.subjudul) ? `<div style="font-size:10px;opacity:0.8;margin-top:2px;font-family:'Nunito',sans-serif">${esc(str(mod.subjudul))}</div>` : '') +
      (chips.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px">${chips.slice(0, 3).map(c => `<span style="font-size:9px;padding:2px 8px;border-radius:99px;background:rgba(255,255,255,0.2);color:rgba(255,255,255,0.9)">${esc(c)}</span>`).join('')}${chips.length > 3 ? `<span style="font-size:9px;padding:2px 8px;border-radius:99px;background:rgba(255,255,255,0.2);color:rgba(255,255,255,0.9)">+${chips.length - 3}</span>` : ''}</div>` : '') +
    `</div>` +
    `<div style="position:absolute;right:-16px;top:-16px;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.1)"></div>` +
    `<div style="position:absolute;right:-8px;bottom:-24px;width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,0.05)"></div>` +
    `</div>`;
}

// ── KUTIPAN ───────────────────────────────────────────────────────
export function bodyKutipan(mod: M, v: LayoutVariant): string {
  const accent = str(mod.accent, T.y);
  const quote = str(mod.quote, '');
  const source = str(mod.source, '');
  const display = str(mod.display, 'card');
  if (v === 'D' || display === 'minimal') {
    return `<div style="padding-left:12px;border-left:3px solid ${accent}">` +
      `<div style="font-style:italic;font-size:12px;color:${T.text};font-family:'Nunito',sans-serif">\u201C${esc(quote || 'Belum ada kutipan')}\u201D</div>` +
      (source ? `<div style="font-size:10px;margin-top:4px;color:${accent};font-family:'Nunito',sans-serif">\u2014 ${esc(source)}</div>` : '') +
      `</div>`;
  }
  return `<div style="border-radius:10px;padding:14px;position:relative;background:${accent}10;border:1px solid ${accent}30">` +
    `<div style="position:absolute;top:-4px;left:8px;font-size:20px;line-height:1;color:${accent}">\u201C</div>` +
    `<div style="font-style:italic;font-size:${v === 'C' ? '14px' : '12px'};margin-top:8px;color:${T.text};font-family:'Nunito',sans-serif">${esc(quote || 'Belum ada kutipan')}</div>` +
    (source ? `<div style="font-size:10px;margin-top:6px;font-weight:600;color:${accent};font-family:'Nunito',sans-serif">\u2014 ${esc(source)}</div>` : '') +
    (str(mod.title) ? `<div style="font-size:10px;margin-top:2px;color:${T.muted};font-family:'Nunito',sans-serif">${esc(str(mod.title))}</div>` : '') +
    `</div>`;
}

// ── LANGKAH ───────────────────────────────────────────────────────
export function bodyLangkah(mod: M, v: LayoutVariant): string {
  const steps = arr<Record<string, unknown>>(mod.steps);
  const max = v === 'C' ? 5 : 4;
  if (v === 'D') {
    return steps.slice(0, max).map((s, i) =>
      `<div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-left:3px solid ${str(s.color, T.c)};padding-left:8px">` +
        `<span style="font-size:10px;font-weight:700;color:${str(s.color, T.c)};font-family:'Nunito',sans-serif">${i + 1}.</span>` +
        `<div><span style="font-size:12px;font-weight:600;color:${T.text};font-family:'Nunito',sans-serif">${esc(str(s.icon, '📌'))} ${esc(str(s.judul))}</span>` +
        (str(s.isi) ? `<div style="font-size:10px;color:${T.muted};font-family:'Nunito',sans-serif">${esc(str(s.isi).slice(0, 50))}</div>` : '') +
        `</div></div>`
    ).join('') +
    (steps.length > max ? `<div style="font-size:10px;color:${T.muted};font-family:'Nunito',sans-serif">+${steps.length - max} lagi</div>` : '');
  }
  return steps.slice(0, max).map((s, i) =>
    `<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px">` +
      `<div style="min-width:24px;height:24px;border-radius:50%;background:${str(s.color, T.c)};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;font-family:'Nunito',sans-serif">${i + 1}</div>` +
      `<div style="flex:1;min-width:0">` +
        `<div style="display:flex;align-items:center;gap:4px"><span style="font-size:10px">${esc(str(s.icon, '📌'))}</span><span style="font-weight:600;font-size:12px;color:${T.text};font-family:'Nunito',sans-serif">${esc(str(s.judul))}</span></div>` +
        (str(s.isi) ? `<div style="font-size:10px;color:${T.muted};margin-top:2px;font-family:'Nunito',sans-serif">${esc(str(s.isi).slice(0, 60))}</div>` : '') +
      `</div></div>`
  ).join('') +
  (steps.length > max ? `<div style="font-size:10px;padding-left:32px;color:${T.muted};font-family:'Nunito',sans-serif">+${steps.length - max} lagi</div>` : '');
}

// ── SKENARIO ──────────────────────────────────────────────────────
export function bodySkenario(mod: M, v: LayoutVariant): string {
  const chapters = arr<Record<string, unknown>>(mod.chapters);
  if (!chapters.length) return `<div style="font-size:12px;color:${T.muted};font-family:'Nunito',sans-serif">Belum ada bab skenario.</div>`;
  if (v === 'D') {
    return chapters.map(ch =>
      `<div style="padding:4px 0;border-left:3px solid #f9c82e;padding-left:8px;font-size:11px;color:${T.text};font-family:'Nunito',sans-serif">\u{1F3AD} ${esc(str(ch.title))}</div>`
    ).join('');
  }
  return `<div style="display:flex;flex-direction:column;gap:6px">` +
    chapters.map(ch =>
      `<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(249,193,46,0.06);border:1px solid rgba(249,193,46,0.2);border-radius:8px">` +
        `<span style="font-size:16px">\u{1F3AD}</span>` +
        `<span style="font-size:12px;font-weight:700;color:${T.text};font-family:'Nunito',sans-serif">${esc(str(ch.title))}</span>` +
        `</div>`
    ).join('') + `</div>`;
}

// ── DEBAT ─────────────────────────────────────────────────────────
export function bodyDebat(mod: M, v: LayoutVariant): string {
  const pA = (mod.pihakA || {}) as Record<string, unknown>;
  const pB = (mod.pihakB || {}) as Record<string, unknown>;
  if (v === 'D') {
    return `<div style="padding:4px 0;border-left:3px solid #f87171;padding-left:8px;font-size:11px;color:${T.text};font-family:'Nunito',sans-serif">${esc(str(mod.pertanyaan))}</div>`;
  }
  return `<div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:14px">` +
    `<div style="font-weight:900;font-size:13px;margin-bottom:6px;color:${T.text};font-family:'Nunito',sans-serif">\u{1F5E3}\uFE0F Mosi:</div>` +
    `<p style="font-size:12px;line-height:1.7;color:${T.text};font-family:'Nunito',sans-serif">${esc(str(mod.pertanyaan))}</p>` +
    `</div>` +
    `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">` +
      `<div style="background:rgba(52,211,153,0.06);border:1px solid rgba(52,211,153,0.2);border-radius:10px;padding:12px"><div style="font-weight:900;font-size:12px;color:${T.g};font-family:'Nunito',sans-serif">\u2705 ${esc(str(pA.label, 'Pro'))}</div></div>` +
      `<div style="background:rgba(255,107,107,0.06);border:1px solid rgba(255,107,107,0.2);border-radius:10px;padding:12px"><div style="font-weight:900;font-size:12px;color:${T.r};font-family:'Nunito',sans-serif">\u274C ${esc(str(pB.label, 'Kontra'))}</div></div>` +
    `</div>`;
}
