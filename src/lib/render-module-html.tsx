// ═══════════════════════════════════════════════════════════════════
// RENDER-MODULE-HTML.TSX — Pure HTML string renderer for export
// Converts PresetModuleCard visuals to standalone HTML (no React/Tailwind)
// Used by export-html.ts and canva-store export
// ═══════════════════════════════════════════════════════════════════

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { LayoutVariant } from '@/components/shared/PresetModuleCard';

// ═══════════════════════════════════════════════════════════════════
// DESIGN TOKENS (same as PresetModuleCard)
// ═══════════════════════════════════════════════════════════════════
const T = {
  bg: '#0e1c2f',
  bg2: '#13243a',
  card: '#182d45',
  y: '#f9c12e',
  c: '#3ecfcf',
  r: '#ff6b6b',
  p: '#a78bfa',
  g: '#34d399',
  o: '#fb923c',
  text: '#e8f2ff',
  muted: '#6e90b5',
} as const;

// ═══════════════════════════════════════════════════════════════════
// MODULE TYPE METADATA (same as PresetModuleCard)
// ═══════════════════════════════════════════════════════════════════
interface ModuleTypeMeta {
  id: string;
  icon: string;
  label: string;
  color: string;
  isGame?: boolean;
}

const MODULE_META: ModuleTypeMeta[] = [
  { id: 'video', icon: '🎥', label: 'Video Embed', color: '#ff6b6b' },
  { id: 'flashcard', icon: '🃏', label: 'Flashcard', color: '#3ecfcf' },
  { id: 'infografis', icon: '📊', label: 'Infografis', color: '#a78bfa' },
  { id: 'studi-kasus', icon: '📰', label: 'Studi Kasus', color: '#fb923c' },
  { id: 'debat', icon: '🗣️', label: 'Debat & Polling', color: '#f87171' },
  { id: 'timeline', icon: '📅', label: 'Timeline', color: '#34d399' },
  { id: 'matching', icon: '🔀', label: 'Game Pasangkan', color: '#60a5fa' },
  { id: 'materi', icon: '📖', label: 'Materi Teks', color: '#a1a1aa' },
  { id: 'hero', icon: '🖼️', label: 'Hero Banner', color: '#ff6b6b' },
  { id: 'kutipan', icon: '💬', label: 'Kutipan Inspiratif', color: '#34d399' },
  { id: 'langkah', icon: '👣', label: 'Langkah-Langkah', color: '#3ecfcf' },
  { id: 'accordion', icon: '🗂️', label: 'Accordion / FAQ', color: '#a78bfa' },
  { id: 'statistik', icon: '📊', label: 'Statistik & Angka', color: '#fb923c' },
  { id: 'polling', icon: '🗳️', label: 'Polling / Voting', color: '#60a5fa' },
  { id: 'embed', icon: '🔗', label: 'Embed / iFrame', color: '#a1a1aa' },
  { id: 'tab-icons', icon: '📑', label: 'Tab Interaktif', color: '#f9c82e' },
  { id: 'icon-explore', icon: '🔍', label: 'Eksplorasi Ikon', color: '#34d399' },
  { id: 'comparison', icon: '⚖️', label: 'Perbandingan', color: '#a78bfa' },
  { id: 'card-showcase', icon: '🃏', label: 'Card Showcase', color: '#fb923c' },
  { id: 'hotspot-image', icon: '🗺️', label: 'Hotspot Image', color: '#ff6b6b' },
  { id: 'truefalse', icon: '✅', label: 'Benar / Salah', color: '#34d399', isGame: true },
  { id: 'memory', icon: '🧠', label: 'Memory Match', color: '#a78bfa', isGame: true },
  { id: 'roda', icon: '🎡', label: 'Roda Putar', color: '#fb923c', isGame: true },
  { id: 'sorting', icon: '🔢', label: 'Urutkan / Klasifikasi', color: '#3ecfcf', isGame: true },
  { id: 'spinwheel', icon: '🎡', label: 'Roda Pertanyaan', color: '#ff6b6b', isGame: true },
  { id: 'teambuzzer', icon: '🏆', label: 'Kuis Tim / Buzzer', color: '#f9c82e', isGame: true },
  { id: 'wordsearch', icon: '🔍', label: 'Teka-Teki Kata', color: '#60a5fa', isGame: true },
  { id: 'skenario', icon: '🎭', label: 'Skenario Interaktif', color: '#f9c82e' },
];

function getModuleMeta(typeId: string): ModuleTypeMeta {
  return MODULE_META.find(m => m.id === typeId) || { id: typeId, icon: '📦', label: typeId, color: '#71717a' };
}

// ═══════════════════════════════════════════════════════════════════
// HERO GRADIENTS MAP
// ═══════════════════════════════════════════════════════════════════
const HERO_GRADIENTS: Record<string, string> = {
  sunset: 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)',
  ocean: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #a78bfa 100%)',
  forest: 'linear-gradient(135deg, #22c55e 0%, #14b8a6 50%, #0ea5e9 100%)',
  royal: 'linear-gradient(135deg, #7c3aed 0%, #c026d3 50%, #f43f5e 100%)',
  fire: 'linear-gradient(135deg, #ef4444 0%, #f97316 50%, #eab308 100%)',
  aurora: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)',
};

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════
type M = Record<string, unknown>;

function arr<T>(val: unknown): T[] {
  return Array.isArray(val) ? val : [];
}

function str(val: unknown, fallback = ''): string {
  return typeof val === 'string' ? val : fallback;
}

function num(val: unknown, fallback = 0): number {
  return typeof val === 'number' ? val : fallback;
}

/** HTML entity escaping — prevents XSS in all user content */
function esc(s: string | number | null | undefined): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Get item count for fallback renderer */
function getItemCount(mod: M): number {
  const t = str(mod.type);
  const keys: Record<string, string> = {
    senario: 'chapters', video: 'pertanyaan', flashcard: 'kartu',
    infografis: 'kartu', 'studi-kasus': 'pertanyaan', timeline: 'events',
    matching: 'pasangan', materi: 'blok', truefalse: 'soal',
    memory: 'pasangan', roda: 'opsi', hero: 'chips',
    kutipan: 'quote', langkah: 'steps', accordion: 'items',
    statistik: 'items', polling: 'opsi', embed: 'url',
    'tab-icons': 'tabs', 'icon-explore': 'items', comparison: 'baris',
    'card-showcase': 'cards', 'hotspot-image': 'hotspots',
    sorting: 'items', spinwheel: 'soal', teambuzzer: 'soal',
    wordsearch: 'kata', skenario: 'chapters', debat: 'pertanyaan',
  };
  const key = keys[t];
  if (!key) return 0;
  const v = mod[key];
  if (Array.isArray(v)) return v.length;
  if (typeof v === 'string' && v.length > 0) return 1;
  return 0;
}

// ═══════════════════════════════════════════════════════════════════
// CARD SHELL — shared wrapper for styled HTML
// ═══════════════════════════════════════════════════════════════════
function cardShell(color: string, body: string): string {
  return `<div style="border-radius:16px;border:1px solid rgba(255,255,255,0.09);background:${T.card};overflow:hidden">` +
    `<div style="height:3px;background:linear-gradient(90deg,${color},${color}66,transparent)"></div>` +
    body +
    `</div>`;
}

// ═══════════════════════════════════════════════════════════════════
// MODULE BODY RENDERERS (Approach B — Pure HTML strings)
// Each returns module-specific HTML with inline styles
// ═══════════════════════════════════════════════════════════════════

// ── INFOGRAFIS ────────────────────────────────────────────────────
function bodyInfografis(mod: M, v: LayoutVariant): string {
  const kartu = arr<Record<string, unknown>>(mod.kartu);
  const max = v === 'C' ? 6 : 4;
  if (v === 'D') {
    return kartu.slice(0, max).map((k, i) =>
      `<div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-left:3px solid ${str(k.color, T.c)};padding-left:8px">` +
        `<span style="font-size:12px">${esc(str(k.icon, '📌'))}</span>` +
        `<div><div style="font-size:12px;font-weight:700;color:${T.text};font-family:'Nunito',sans-serif">${esc(str(k.judul) || `Kartu ${i + 1}`)}</div>` +
        (str(k.isi) ? `<div style="font-size:10px;color:${T.muted};font-family:'Nunito',sans-serif">${esc(str(k.isi).slice(0, 60))}</div>` : '') +
        `</div></div>`
    ).join('') +
    (kartu.length > max ? `<div style="font-size:10px;color:${T.muted};font-family:'Nunito',sans-serif">+${kartu.length - max} lagi</div>` : '');
  }
  if (v === 'B') {
    return kartu.slice(0, max).map(k =>
      `<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:${str(k.color, T.c)}18;border:1px solid ${str(k.color, T.c)}30;border-radius:8px">` +
        `<span style="font-size:14px">${esc(str(k.icon, '📌'))}</span>` +
        `<span style="font-size:12px;font-weight:700;color:${str(k.color, T.c)};font-family:'Nunito',sans-serif">${esc(str(k.judul))}</span>` +
        `</div>`
    ).join('');
  }
  const cols = v === 'C' ? 'repeat(2,1fr)' : 'repeat(2,1fr)';
  const pad = v === 'C' ? '14px' : '10px';
  return `<div style="display:grid;grid-template-columns:${cols};gap:8px">` +
    kartu.slice(0, max).map(k =>
      `<div style="border-radius:10px;padding:${pad};background:${str(k.color, T.c)}18;border:1px solid ${str(k.color, T.c)}30">` +
        `<div style="font-size:${v === 'C' ? '20px' : '16px'};margin-bottom:4px">${esc(str(k.icon, '📌'))}</div>` +
        `<div style="font-weight:700;font-size:12px;color:${str(k.color, T.c)};font-family:'Nunito',sans-serif">${esc(str(k.judul))}</div>` +
        (str(k.isi) ? `<div style="font-size:10px;color:${T.muted};margin-top:2px;font-family:'Nunito',sans-serif">${esc(str(k.isi).slice(0, 50))}</div>` : '') +
        `</div>`
    ).join('') +
    (kartu.length > max ? `<div style="display:flex;align-items:center;justify-content:center;font-size:10px;border-radius:10px;padding:8px;background:${T.bg2};color:${T.muted};font-family:'Nunito',sans-serif">+${kartu.length - max} lagi</div>` : '') +
    `</div>`;
}

// ── STATISTIK ─────────────────────────────────────────────────────
function bodyStatistik(mod: M, v: LayoutVariant): string {
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

// ── TIMELINE ──────────────────────────────────────────────────────
function bodyTimeline(mod: M, v: LayoutVariant): string {
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
function bodyHero(mod: M): string {
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
function bodyKutipan(mod: M, v: LayoutVariant): string {
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
function bodyLangkah(mod: M, v: LayoutVariant): string {
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

// ── ACCORDION ─────────────────────────────────────────────────────
function bodyAccordion(mod: M, v: LayoutVariant): string {
  const items = arr<Record<string, unknown>>(mod.items);
  const max = v === 'C' ? 5 : 3;
  const uid = 'acc_' + Math.random().toString(36).slice(2, 8);
  if (v === 'D') {
    return items.slice(0, max).map((it, i) =>
      `<div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-left:3px solid ${T.p};padding-left:8px">` +
        `<span style="font-size:10px">${esc(str(it.icon, '📌'))}</span>` +
        `<div><div style="font-size:12px;font-weight:600;color:${T.text};font-family:'Nunito',sans-serif">${esc(str(it.judul))}</div>` +
        (str(it.isi) ? `<div style="font-size:10px;color:${T.muted};font-family:'Nunito',sans-serif">${esc(str(it.isi).slice(0, 60))}</div>` : '') +
        `</div></div>`
    ).join('');
  }
  return items.slice(0, max).map((it, i) => {
    const aid = `${uid}_${i}`;
    return `<div style="border-radius:8px;padding:8px;display:flex;align-items:flex-start;gap:8px;background:${T.bg2};border:1px solid ${T.p}18;cursor:pointer" onclick="var d=document.getElementById('${aid}');d.style.display=d.style.display==='none'?'block':'none'">` +
      `<span style="font-size:${v === 'C' ? '14px' : '12px'}">${esc(str(it.icon, '📌'))}</span>` +
      `<div style="flex:1;min-width:0">` +
        `<div style="font-weight:600;font-size:12px;color:${T.text};font-family:'Nunito',sans-serif">${esc(str(it.judul))}</div>` +
        `<div id="${aid}" style="display:none;font-size:10px;margin-top:4px;color:${T.muted};font-family:'Nunito',sans-serif">${esc(str(it.isi))}</div>` +
      `</div>` +
      `<span style="font-size:10px;color:${T.muted}">\u25BC</span>` +
      `</div>`;
  }).join('');
}

// ── VIDEO ─────────────────────────────────────────────────────────
function bodyVideo(mod: M): string {
  const platform = str(mod.platform, 'youtube');
  const duration = str(mod.durasi, '');
  const url = str(mod.url, '');
  return `<div style="border-radius:10px;overflow:hidden;background:${T.bg};border:1px solid ${T.r}25">` +
    `<div style="position:relative;display:flex;align-items:center;justify-content:center;background:#0a0a0a;min-height:56px">` +
      `<div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${T.r}30"><span style="font-size:14px">\u25B6</span></div>` +
      (duration ? `<div style="position:absolute;bottom:4px;right:4px;font-size:9px;padding:2px 6px;border-radius:4px;background:rgba(0,0,0,0.7);color:${T.text};font-family:'Nunito',sans-serif">${esc(duration)}</div>` : '') +
      `<div style="position:absolute;top:4px;left:4px;font-size:9px;padding:2px 8px;border-radius:4px;font-weight:700;text-transform:uppercase;background:${T.r}20;color:${T.r};font-family:'Nunito',sans-serif">${esc(platform)}</div>` +
    `</div>` +
    (url ? `<div style="padding:6px;font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:${T.muted};font-family:'Nunito',sans-serif">${esc(url)}</div>` : '') +
    `</div>`;
}

// ── FLASHCARD ─────────────────────────────────────────────────────
function bodyFlashcard(mod: M, v: LayoutVariant): string {
  const kartu = arr<Record<string, unknown>>(mod.kartu);
  const max = v === 'C' ? 6 : 4;
  const cols = v === 'B' ? 'repeat(auto-fill,minmax(160px,1fr))' : v === 'C' ? 'repeat(2,1fr)' : 'repeat(auto-fill,minmax(180px,1fr))';
  return `<div style="display:grid;grid-template-columns:${cols};gap:10px">` +
    kartu.slice(0, max).map((k, i) => {
      const fid = `fc_${Math.random().toString(36).slice(2, 8)}_${i}`;
      return `<div id="${fid}" onclick="var f=document.getElementById('${fid}');var b=f.querySelector('.fc-b');var fr=f.querySelector('.fc-f');if(b.style.display==='none'){b.style.display='flex';fr.style.display='none';}else{b.style.display='none';fr.style.display='flex';}" style="min-height:100px;border-radius:10px;background:${T.bg2};border:1px solid rgba(255,255,255,0.09);cursor:pointer;overflow:hidden">` +
        `<div class="fc-f" style="padding:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;height:100%">` +
          `<div style="font-size:12px;font-weight:700;color:${T.text};font-family:'Nunito',sans-serif">${esc(str(k.depan) || `Kartu ${i + 1}`)}</div>` +
          (str(k.hint) ? `<div style="font-size:10px;color:${T.muted};margin-top:4px;font-family:'Nunito',sans-serif">${esc(str(k.hint))}</div>` : '') +
          `<div style="font-size:9px;color:${T.muted};margin-top:8px;font-family:'Nunito',sans-serif">Klik untuk membalik</div>` +
        `</div>` +
        `<div class="fc-b" style="display:none;padding:14px;align-items:center;justify-content:center;text-align:center;height:100%;background:rgba(62,207,207,0.08);border:1px solid rgba(62,207,207,0.3)">` +
          `<div style="font-size:12px;font-weight:700;color:${T.c};font-family:'Nunito',sans-serif">${esc(str(k.belakang) || '')}</div>` +
        `</div>` +
      `</div>`;
    }).join('') + `</div>`;
}

// ── MATCHING ──────────────────────────────────────────────────────
function bodyMatching(mod: M, v: LayoutVariant): string {
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
function bodyTrueFalse(mod: M, v: LayoutVariant): string {
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
function bodyMemory(mod: M, v: LayoutVariant): string {
  const pasangan = arr<Record<string, unknown>>(mod.pasangan);
  const cols = v === 'C' ? 'repeat(4,1fr)' : 'repeat(auto-fill,minmax(80px,1fr))';
  const items = pasangan.flatMap(p => [str(p.a), str(p.b)]);
  return `<div style="display:grid;grid-template-columns:${cols};gap:6px">` +
    items.map(text =>
      `<div style="aspect-ratio:1;background:${T.bg2};border:2px solid rgba(255,255,255,0.07);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;padding:6px;text-align:center;color:${T.text};font-family:'Nunito',sans-serif">${esc(text)}</div>`
    ).join('') + `</div>`;
}

// ── RODA ──────────────────────────────────────────────────────────
function bodyRoda(mod: M): string {
  const opsi = arr<Record<string, unknown>>(mod.opsi);
  if (!opsi.length) return `<div style="font-size:12px;color:${T.muted};font-family:'Nunito',sans-serif">Belum ada opsi.</div>`;
  return `<div style="display:flex;flex-wrap:wrap;gap:6px">` +
    opsi.map((o, i) => {
      const colors = ['#f9c12e', '#3ecfcf', '#ff6b6b', '#a78bfa', '#34d399', '#fb923c'];
      return `<span style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border-radius:99px;font-size:11px;font-weight:700;background:${colors[i % colors.length]}20;color:${colors[i % colors.length]};font-family:'Nunito',sans-serif">${esc(String(o))}</span>`;
    }).join('') + `</div>`;
}

// ── TAB-ICONS ─────────────────────────────────────────────────────
function bodyTabIcons(mod: M, v: LayoutVariant): string {
  const tabs = arr<Record<string, unknown>>(mod.tabs);
  if (v === 'D') {
    return tabs.map(t =>
      `<div style="padding:4px 0;border-left:3px solid ${T.y};padding-left:8px"><span style="font-size:10px">${esc(str(t.icon, '📌'))}</span> <span style="font-size:11px;font-weight:600;color:${T.text};font-family:'Nunito',sans-serif">${esc(str(t.judul))}</span></div>`
    ).join('');
  }
  const tid = 'ti_' + Math.random().toString(36).slice(2, 8);
  const tabBtns = tabs.map((t, i) =>
    `<button onclick="var cs=this.parentNode.nextElementSibling.children;for(var j=0;j<cs.length;j++)cs[j].style.display=j===${i}?'block':'none';var bs=this.parentNode.children;for(var j=0;j<bs.length;j++){bs[j].style.borderBottomColor=j===${i}?'${T.y}':'transparent';bs[j].style.color=j===${i}?'${T.y}':'${T.muted}';}" style="padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;color:${i === 0 ? T.y : T.muted};border:none;border-bottom:2px solid ${i === 0 ? T.y : 'transparent'};margin-bottom:-2px;background:none;font-family:'Nunito',sans-serif;white-space:nowrap">${esc(str(t.icon, '📌'))} ${esc(str(t.judul))}</button>`
  ).join('');
  const tabContents = tabs.map((t, i) =>
    `<div style="${i === 0 ? '' : 'display:none;'}padding:12px 0;font-size:12px;color:${T.muted};line-height:1.7;font-family:'Nunito',sans-serif">${esc(str(t.isi))}</div>`
  ).join('');
  return `<div><div style="display:flex;gap:0;border-bottom:2px solid rgba(255,255,255,0.07);margin-bottom:0;overflow-x:auto">${tabBtns}</div><div>${tabContents}</div></div>`;
}

// ── ICON-EXPLORE ──────────────────────────────────────────────────
function bodyIconExplore(mod: M, v: LayoutVariant): string {
  const items = arr<Record<string, unknown>>(mod.items);
  const cols = v === 'C' ? 'repeat(3,1fr)' : v === 'B' ? 'repeat(4,1fr)' : 'repeat(auto-fill,minmax(100px,1fr))';
  return `<div style="display:grid;grid-template-columns:${cols};gap:8px">` +
    items.map(it => {
      const eid = 'ie_' + Math.random().toString(36).slice(2, 8);
      return `<div style="background:${T.bg2};border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:14px;text-align:center;cursor:pointer" onclick="var d=document.getElementById('${eid}');d.style.display=d.style.display==='none'?'block':'none'">` +
        `<div style="font-size:24px;margin-bottom:4px">${esc(str(it.icon, '🔍'))}</div>` +
        `<div style="font-size:11px;font-weight:700;color:${T.text};font-family:'Nunito',sans-serif">${esc(str(it.judul))}</div>` +
        `<div id="${eid}" style="display:none;font-size:10px;color:${T.muted};margin-top:6px;line-height:1.5;font-family:'Nunito',sans-serif">${esc(str(it.isi))}</div>` +
        `</div>`;
    }).join('') + `</div>`;
}

// ── COMPARISON ────────────────────────────────────────────────────
function bodyComparison(mod: M, v: LayoutVariant): string {
  const baris = arr<Record<string, unknown> | string[]>(mod.baris);
  if (!baris.length) return `<div style="font-size:12px;color:${T.muted};font-family:'Nunito',sans-serif">Belum ada data perbandingan.</div>`;
  if (v === 'D') {
    return baris.map(row => {
      const cells = Array.isArray(row) ? row : [str((row as Record<string, unknown>).kiri), str((row as Record<string, unknown>).kanan)];
      return `<div style="padding:4px 0;border-left:3px solid ${T.p};padding-left:8px;font-size:11px;color:${T.text};font-family:'Nunito',sans-serif">${cells.map(c => esc(String(c))).join(' vs ')}</div>`;
    }).join('');
  }
  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">` +
    baris.map(row => {
      const cells = Array.isArray(row) ? row : [str((row as Record<string, unknown>).kiri), str((row as Record<string, unknown>).kanan)];
      return cells.map(cell =>
        `<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:12px;font-size:12px;color:${T.text};font-family:'Nunito',sans-serif">${esc(String(cell))}</div>`
      ).join('');
    }).join('') + `</div>`;
}

// ── CARD-SHOWCASE ─────────────────────────────────────────────────
function bodyCardShowcase(mod: M, v: LayoutVariant): string {
  const cards = arr<Record<string, unknown>>(mod.cards);
  const cols = v === 'C' ? 'repeat(2,1fr)' : 'repeat(auto-fill,minmax(200px,1fr))';
  return `<div style="display:grid;grid-template-columns:${cols};gap:12px">` +
    cards.map(c =>
      `<div style="background:${T.bg2};border:1px solid rgba(255,255,255,0.07);border-radius:14px;overflow:hidden">` +
        `<div style="height:100px;background:${str(c.bgGrad, `linear-gradient(135deg,${T.y},${T.c})`)};display:flex;align-items:center;justify-content:center;font-size:36px">${esc(str(c.icon, '\u{1F0CF}'))}</div>` +
        `<div style="padding:12px"><div style="font-weight:900;font-size:13px;color:${T.text};font-family:'Nunito',sans-serif">${esc(str(c.judul))}</div>` +
        (str(c.isi) ? `<p style="font-size:11px;color:${T.muted};line-height:1.5;margin-top:4px;font-family:'Nunito',sans-serif">${esc(str(c.isi))}</p>` : '') +
        `</div></div>`
    ).join('') + `</div>`;
}

// ── HOTSPOT-IMAGE ─────────────────────────────────────────────────
function bodyHotspotImage(mod: M, v: LayoutVariant): string {
  const hotspots = arr<Record<string, unknown>>(mod.hotspots);
  if (v === 'D') {
    return hotspots.map((h, i) =>
      `<div style="padding:4px 0;border-left:3px solid ${T.r};padding-left:8px;font-size:11px;color:${T.text};font-family:'Nunito',sans-serif">${i + 1}. ${esc(str(h.text || h.judul))}</div>`
    ).join('');
  }
  return `<div style="position:relative;border-radius:10px;overflow:hidden;background:${T.bg2};min-height:160px;display:flex;align-items:center;justify-content:center">` +
    `<div style="color:${T.muted};font-size:12px;font-family:'Nunito',sans-serif">Hotspot Image</div>` +
    hotspots.map((h, i) => {
      const hid = 'hs_' + Math.random().toString(36).slice(2, 8) + '_' + i;
      return `<div style="position:absolute;left:${num(h.x, 50)}%;top:${num(h.y, 50)}%;transform:translate(-50%,-50%);width:28px;height:28px;border-radius:50%;background:${T.y};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3)" onclick="var d=document.getElementById('${hid}');d.style.display=d.style.display==='none'?'block':'none'">${i + 1}</div>` +
        `<div id="${hid}" style="display:none;position:absolute;left:${num(h.x, 50)}%;top:${num(h.y, 50)}%;transform:translate(-50%,20px);background:${T.bg2};border:1px solid rgba(255,255,255,0.09);border-radius:8px;padding:10px;width:180px;font-size:11px;color:${T.muted};z-index:10;box-shadow:0 4px 16px rgba(0,0,0,0.4);font-family:'Nunito',sans-serif">${esc(str(h.text || h.judul))}</div>`;
    }).join('') + `</div>`;
}

// ── POLLING ───────────────────────────────────────────────────────
function bodyPolling(mod: M, v: LayoutVariant): string {
  const opsi = arr<Record<string, unknown>>(mod.opsi);
  if (v === 'D') {
    return opsi.map(o =>
      `<div style="padding:4px 0;border-left:3px solid #60a5fa;padding-left:8px;font-size:11px;color:${T.text};font-family:'Nunito',sans-serif">${esc(str(o.icon, '📊'))} ${esc(str(o.teks))}</div>`
    ).join('');
  }
  return `<div style="display:flex;flex-direction:column;gap:8px">` +
    opsi.map(o =>
      `<div style="background:${str(o.warna, T.c)}0a;border:2px solid ${str(o.warna, T.c)}33;border-radius:10px;padding:12px;display:flex;align-items:center;gap:10px;font-family:'Nunito',sans-serif">` +
        `<span style="font-size:16px">${esc(str(o.icon, '📊'))}</span>` +
        `<span style="font-size:13px;font-weight:700;color:${T.text}">${esc(str(o.teks))}</span>` +
        `</div>`
    ).join('') + `</div>`;
}

// ── EMBED ─────────────────────────────────────────────────────────
function bodyEmbed(mod: M): string {
  const url = str(mod.url);
  if (!url) return `<div style="font-size:12px;color:${T.muted};font-family:'Nunito',sans-serif">URL embed belum diisi.</div>`;
  return `<div style="border-radius:10px;overflow:hidden;background:#f0f0f0;min-height:60px;display:flex;align-items:center;justify-content:center;border:1px dashed rgba(255,255,255,0.2)">` +
    `<div style="text-align:center;padding:16px"><div style="font-size:24px;margin-bottom:4px">\u{1F517}</div><div style="font-size:11px;color:${T.muted};font-family:'Nunito',sans-serif">${esc(url)}</div></div>` +
    `</div>`;
}

// ── STUDI-KASUS ───────────────────────────────────────────────────
function bodyStudiKasus(mod: M, v: LayoutVariant): string {
  const pertanyaan = arr<Record<string, unknown>>(mod.pertanyaan);
  if (v === 'D') {
    return `<div style="padding:4px 0;border-left:3px solid ${T.o};padding-left:8px;font-size:11px;color:${T.muted};line-height:1.5;font-family:'Nunito',sans-serif">${esc(str(mod.teks).slice(0, 100))}</div>` +
      pertanyaan.map(p => `<div style="padding:2px 0;font-size:10px;color:${T.text};font-family:'Nunito',sans-serif">\u{1F4CC} ${esc(str(p.teks || p.label))}</div>`).join('');
  }
  return `<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:14px;margin-bottom:10px">` +
    `<p style="font-size:13px;line-height:1.7;color:${T.text};font-family:'Nunito',sans-serif">${esc(str(mod.teks))}</p>` +
    (str(mod.sumber) ? `<p style="font-size:10px;color:${T.muted};margin-top:6px;font-family:'Nunito',sans-serif">Sumber: ${esc(str(mod.sumber))}</p>` : '') +
    `</div>` +
    (pertanyaan.length ? `<div style="font-weight:700;font-size:13px;margin-bottom:8px;color:${T.text};font-family:'Nunito',sans-serif">\u{1F4DD} Pertanyaan Analisis</div>` +
      pertanyaan.map(p =>
        `<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:10px;margin-bottom:6px">` +
          `<span style="font-size:10px;font-weight:700;color:${T.p};background:${T.p}18;padding:2px 8px;border-radius:99px;font-family:'Nunito',sans-serif">${esc(str(p.level, 'C2'))}</span>` +
          `<p style="font-size:12px;margin-top:4px;font-weight:600;color:${T.text};font-family:'Nunito',sans-serif">${esc(str(p.teks || p.label))}</p>` +
        `</div>`
      ).join('') : '');
}

// ── DEBAT ─────────────────────────────────────────────────────────
function bodyDebat(mod: M, v: LayoutVariant): string {
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

// ── SORTING ───────────────────────────────────────────────────────
function bodySorting(mod: M, v: LayoutVariant): string {
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
function bodySpinwheel(mod: M): string {
  const soal = arr<Record<string, unknown>>(mod.soal);
  if (!soal.length) return `<div style="font-size:12px;color:${T.muted};font-family:'Nunito',sans-serif">Belum ada soal.</div>`;
  return `<div style="text-align:center">` +
    `<div style="font-size:36px;margin-bottom:6px">\u{1F3B0}</div>` +
    `<div style="font-size:11px;color:${T.muted};font-family:'Nunito',sans-serif">${soal.length} soal roda pertanyaan</div>` +
    `</div>`;
}

// ── TEAMBUZZER ────────────────────────────────────────────────────
function bodyTeambuzzer(mod: M): string {
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
function bodyWordsearch(mod: M): string {
  const kata = arr<string>(mod.kata);
  if (!kata.length) return `<div style="font-size:12px;color:${T.muted};font-family:'Nunito',sans-serif">Belum ada kata.</div>`;
  return `<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">` +
    kata.map(k =>
      `<span style="display:inline-flex;padding:4px 12px;border-radius:99px;font-size:11px;font-weight:700;background:rgba(249,193,46,0.12);color:${T.y};font-family:'Nunito',sans-serif">${esc(k)}</span>`
    ).join('') + `</div>`;
}

// ── SKENARIO ──────────────────────────────────────────────────────
function bodySkenario(mod: M, v: LayoutVariant): string {
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

// ── MATERI ────────────────────────────────────────────────────────
function bodyMateri(mod: M, v: LayoutVariant): string {
  const blok = arr<Record<string, unknown>>(mod.blok);
  if (!blok.length) return `<div style="font-size:12px;color:${T.muted};font-family:'Nunito',sans-serif">Materi blok ditampilkan di tab Materi.</div>`;
  if (v === 'D') {
    return blok.map(b =>
      `<div style="padding:4px 0;border-left:3px solid ${T.muted};padding-left:8px;font-size:11px;color:${T.text};font-family:'Nunito',sans-serif">${esc(str(b.judul || b.isi)).slice(0, 80)}</div>`
    ).join('');
  }
  return `<div style="display:flex;flex-direction:column;gap:8px">` +
    blok.map(b =>
      `<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:12px">` +
        (str(b.judul) ? `<div style="font-weight:700;font-size:12px;color:${T.text};margin-bottom:4px;font-family:'Nunito',sans-serif">${esc(str(b.judul))}</div>` : '') +
        (str(b.isi) ? `<div style="font-size:11px;color:${T.muted};line-height:1.6;font-family:'Nunito',sans-serif">${esc(str(b.isi)).slice(0, 120)}</div>` : '') +
        `</div>`
    ).join('') + `</div>`;
}

// ═══════════════════════════════════════════════════════════════════
// FALLBACK RENDERER
// ═══════════════════════════════════════════════════════════════════
function bodyFallback(mod: M, meta: ModuleTypeMeta, v: LayoutVariant): string {
  const count = getItemCount(mod);
  if (v === 'D') {
    return `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-left:3px solid ${meta.color};padding-left:8px">` +
      `<span style="font-size:14px">${meta.icon}</span>` +
      `<span style="font-size:11px;font-weight:600;color:${meta.color};font-family:'Nunito',sans-serif">${esc(meta.label)}</span>` +
      (count > 0 ? `<span style="font-size:10px;color:${T.muted};font-family:'Nunito',sans-serif">${count} item</span>` : '') +
      `</div>`;
  }
  return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px;gap:8px;background:${meta.color}08;border-radius:8px">` +
    `<div style="display:flex;align-items:center;gap:6px">` +
      `<span style="font-size:18px">${meta.icon}</span>` +
      `<span style="font-weight:600;font-size:12px;color:${meta.color};font-family:'Nunito',sans-serif">${esc(meta.label)}</span>` +
    `</div>` +
    (count > 0 ? `<div style="font-size:10px;padding:2px 10px;border-radius:99px;background:${meta.color}15;color:${meta.color};font-family:'Nunito',sans-serif">${count} item</div>` : '') +
    (count > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;max-width:160px">` +
      Array.from({ length: Math.min(count, 8) }).map(() =>
        `<div style="width:14px;height:14px;border-radius:3px;background:${meta.color}25"></div>`
      ).join('') + `</div>` : '') +
    `</div>`;
}

// ═══════════════════════════════════════════════════════════════════
// BODY ROUTER — dispatches to the right renderer
// ═══════════════════════════════════════════════════════════════════
function renderBody(mod: M, v: LayoutVariant): string {
  const t = str(mod.type);
  const meta = getModuleMeta(t);
  switch (t) {
    case 'infografis': return bodyInfografis(mod, v);
    case 'statistik': return bodyStatistik(mod, v);
    case 'timeline': return bodyTimeline(mod, v);
    case 'hero': return bodyHero(mod);
    case 'kutipan': return bodyKutipan(mod, v);
    case 'langkah': return bodyLangkah(mod, v);
    case 'accordion': return bodyAccordion(mod, v);
    case 'video': return bodyVideo(mod);
    case 'flashcard': return bodyFlashcard(mod, v);
    case 'matching': return bodyMatching(mod, v);
    case 'truefalse': return bodyTrueFalse(mod, v);
    case 'memory': return bodyMemory(mod, v);
    case 'roda': return bodyRoda(mod);
    case 'tab-icons': return bodyTabIcons(mod, v);
    case 'icon-explore': return bodyIconExplore(mod, v);
    case 'comparison': return bodyComparison(mod, v);
    case 'card-showcase': return bodyCardShowcase(mod, v);
    case 'hotspot-image': return bodyHotspotImage(mod, v);
    case 'polling': return bodyPolling(mod, v);
    case 'embed': return bodyEmbed(mod);
    case 'studi-kasus': return bodyStudiKasus(mod, v);
    case 'debat': return bodyDebat(mod, v);
    case 'sorting': return bodySorting(mod, v);
    case 'spinwheel': return bodySpinwheel(mod);
    case 'teambuzzer': return bodyTeambuzzer(mod);
    case 'wordsearch': return bodyWordsearch(mod);
    case 'skenario': return bodySkenario(mod, v);
    case 'materi': return bodyMateri(mod, v);
    default: return bodyFallback(mod, meta, v);
  }
}

// ═══════════════════════════════════════════════════════════════════
// APPROACH B: Pure HTML string (for export, no Tailwind)
// ═══════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════
// APPROACH A: React-based (for canvas preview with Tailwind)
// ═══════════════════════════════════════════════════════════════════

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
