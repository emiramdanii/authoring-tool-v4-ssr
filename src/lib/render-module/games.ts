// ═══════════════════════════════════════════════════════════════════
// GAMES — Matching, TrueFalse, Memory, Roda, Sorting, Spinwheel,
//         Teambuzzer, Wordsearch
// ═══════════════════════════════════════════════════════════════════

import type { LayoutVariant, M } from './types';
import { T } from './tokens';
import { arr, str, num, esc } from './helpers';

// ── MATCHING ──────────────────────────────────────────────────────
export function bodyMatching(mod: M, v: LayoutVariant): string {
  const pasangan = arr<Record<string, unknown>>(mod.pasangan);
  if (v === 'D') {
    return pasangan.map(p =>
      `<div style="padding:4px 0;border-left:3px solid #60a5fa;padding-left:8px;font-size:11px;color:${T.text};font-family:'Nunito',sans-serif">${esc(str(p.kiri))} \u2194 ${esc(str(p.kanan))}</div>`
    ).join('');
  }
  return `<div style="display:grid;grid-template-columns:1fr 40px 1fr;gap:8px;align-items:start">` +
    pasangan.map(p =>
      `<div style="background:rgba(255,255,255,0.04);border:2px solid rgba(255,255,255,0.07);border-radius:8px;padding:10px;font-size:12px;font-weight:700;color:${T.text};font-family:'Nunito',sans-serif">${esc(str(p.kiri))}</div>`
    ).join('') +
    `<div></div>` +
    pasangan.map(p =>
      `<div style="background:rgba(255,255,255,0.04);border:2px solid rgba(255,255,255,0.07);border-radius:8px;padding:10px;font-size:12px;font-weight:700;color:${T.text};font-family:'Nunito',sans-serif">${esc(str(p.kanan))}</div>`
    ).join('') +
    `</div>`;
}

// ── TRUEFALSE ─────────────────────────────────────────────────────
export function bodyTrueFalse(mod: M, v: LayoutVariant): string {
  const soal = arr<Record<string, unknown>>(mod.soal);
  const max = v === 'C' ? 6 : 4;
  if (v === 'D') {
    return soal.slice(0, max).map(s =>
      `<div style="padding:4px 0;border-left:3px solid ${T.g};padding-left:8px;font-size:11px;color:${T.text};font-family:'Nunito',sans-serif">${esc(str(s.teks))}</div>`
    ).join('');
  }
  return soal.slice(0, max).map((s, i) => {
    const tfid = `tf_${i}_${Math.random().toString(36).slice(2, 6)}`;
    return `<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:12px;margin-bottom:8px">` +
      `<p style="font-size:13px;font-weight:700;margin-bottom:8px;color:${T.text};font-family:'Nunito',sans-serif">${i + 1}. ${esc(str(s.teks))}</p>` +
      `<div style="display:flex;gap:8px">` +
        `<button onclick="this.style.borderColor='${T.g}';this.style.color='${T.g}';this.nextElementSibling.style.borderColor='rgba(255,255,255,0.07)';this.nextElementSibling.style.color=''" style="flex:1;padding:8px;border-radius:8px;border:2px solid rgba(255,255,255,0.07);background:rgba(52,211,153,0.05);cursor:pointer;font-size:12px;font-weight:700;color:${T.text};font-family:'Nunito',sans-serif">\u2705 Benar</button>` +
        `<button onclick="this.style.borderColor='${T.r}';this.style.color='${T.r}';this.previousElementSibling.style.borderColor='rgba(255,255,255,0.07)';this.previousElementSibling.style.color=''" style="flex:1;padding:8px;border-radius:8px;border:2px solid rgba(255,255,255,0.07);background:rgba(255,107,107,0.05);cursor:pointer;font-size:12px;font-weight:700;color:${T.text};font-family:'Nunito',sans-serif">\u274C Salah</button>` +
      `</div></div>`;
  }).join('');
}

// ── MEMORY ────────────────────────────────────────────────────────
export function bodyMemory(mod: M, v: LayoutVariant): string {
  const pasangan = arr<Record<string, unknown>>(mod.pasangan);
  const cols = v === 'C' ? 'repeat(4,1fr)' : 'repeat(auto-fill,minmax(80px,1fr))';
  const items = pasangan.flatMap(p => [str(p.a), str(p.b)]);
  return `<div style="display:grid;grid-template-columns:${cols};gap:6px">` +
    items.map(text =>
      `<div style="aspect-ratio:1;background:${T.bg2};border:2px solid rgba(255,255,255,0.07);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;padding:6px;text-align:center;color:${T.text};font-family:'Nunito',sans-serif">${esc(text)}</div>`
    ).join('') + `</div>`;
}

// ── RODA ──────────────────────────────────────────────────────────
export function bodyRoda(mod: M): string {
  const opsi = arr<Record<string, unknown>>(mod.opsi);
  if (!opsi.length) return `<div style="font-size:12px;color:${T.muted};font-family:'Nunito',sans-serif">Belum ada opsi.</div>`;
  return `<div style="display:flex;flex-wrap:wrap;gap:6px">` +
    opsi.map((o, i) => {
      const colors = ['#f9c12e', '#3ecfcf', '#ff6b6b', '#a78bfa', '#34d399', '#fb923c'];
      return `<span style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border-radius:99px;font-size:11px;font-weight:700;background:${colors[i % colors.length]}20;color:${colors[i % colors.length]};font-family:'Nunito',sans-serif">${esc(String(o))}</span>`;
    }).join('') + `</div>`;
}

// ── SORTING ───────────────────────────────────────────────────────
export function bodySorting(mod: M, v: LayoutVariant): string {
  const items = arr<Record<string, unknown>>(mod.items);
  const kategori = arr<Record<string, unknown>>(mod.kategori);
  if (v === 'D') {
    return kategori.map(k =>
      `<div style="padding:4px 0;border-left:3px solid ${str(k.color, T.c)};padding-left:8px;font-size:11px;font-weight:700;color:${str(k.color, T.c)};font-family:'Nunito',sans-serif">${esc(str(k.judul))}</div>`
    ).join('');
  }
  return (kategori.length ? `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:10px">` +
    kategori.map(k =>
      `<div style="background:${str(k.color, T.c)}0a;border:2px dashed ${str(k.color, T.c)}33;border-radius:10px;padding:12px;min-height:60px">` +
        `<div style="font-weight:900;font-size:12px;color:${str(k.color, T.c)};margin-bottom:6px;font-family:'Nunito',sans-serif">${esc(str(k.judul))}</div>` +
        `</div>`
    ).join('') + `</div>` : '') +
    (items.length ? `<div style="display:flex;flex-wrap:wrap;gap:6px">` +
      items.map(it =>
        `<span style="background:${T.bg2};border:1px solid rgba(255,255,255,0.07);border-radius:99px;padding:5px 12px;font-size:11px;font-weight:700;color:${T.text};font-family:'Nunito',sans-serif">${esc(str(it.text || it))}</span>`
      ).join('') + `</div>` : '');
}

// ── SPINWHEEL ─────────────────────────────────────────────────────
export function bodySpinwheel(mod: M): string {
  const soal = arr<Record<string, unknown>>(mod.soal);
  if (!soal.length) return `<div style="font-size:12px;color:${T.muted};font-family:'Nunito',sans-serif">Belum ada soal.</div>`;
  return `<div style="text-align:center">` +
    `<div style="font-size:36px;margin-bottom:6px">\u{1F3B0}</div>` +
    `<div style="font-size:11px;color:${T.muted};font-family:'Nunito',sans-serif">${soal.length} soal roda pertanyaan</div>` +
    `</div>`;
}

// ── TEAMBUZZER ────────────────────────────────────────────────────
export function bodyTeambuzzer(mod: M): string {
  const teams = arr<Record<string, unknown>>(mod.teams);
  if (!teams.length) return `<div style="font-size:12px;color:${T.muted};font-family:'Nunito',sans-serif">Belum ada tim.</div>`;
  return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px">` +
    teams.map((t, i) =>
      `<div style="background:${str(t.color, T.c)}12;border:2px solid ${str(t.color, T.c)}33;border-radius:12px;padding:16px;text-align:center">` +
        `<div style="font-size:22px">${esc(str(t.icon, '\u{1F3C6}'))}</div>` +
        `<div style="font-weight:900;font-size:12px;margin-top:4px;color:${T.text};font-family:'Nunito',sans-serif">${esc(str(t.name, `Tim ${i + 1}`))}</div>` +
        `<div style="font-family:'Fredoka One',cursive;font-size:22px;color:${str(t.color, T.c)};margin-top:4px">${num(t.score, 0)}</div>` +
        `</div>`
    ).join('') + `</div>`;
}

// ── WORDSEARCH ────────────────────────────────────────────────────
export function bodyWordsearch(mod: M): string {
  const kata = arr<string>(mod.kata);
  if (!kata.length) return `<div style="font-size:12px;color:${T.muted};font-family:'Nunito',sans-serif">Belum ada kata.</div>`;
  return `<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">` +
    kata.map(k =>
      `<span style="display:inline-flex;padding:4px 12px;border-radius:99px;font-size:11px;font-weight:700;background:rgba(249,193,46,0.12);color:${T.y};font-family:'Nunito',sans-serif">${esc(k)}</span>`
    ).join('') + `</div>`;
}
