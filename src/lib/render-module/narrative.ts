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

// ── PETUNJUK ──────────────────────────────────────────────────────
export function bodyPetunjuk(mod: M, v: LayoutVariant): string {
  const langkah = arr<Record<string, unknown>>(mod.langkah);
  if (!langkah.length) return `<div style="font-size:12px;color:${T.muted};font-family:'Nunito',sans-serif">Belum ada langkah petunjuk.</div>`;
  const accent = T.c;
  if (v === 'D') {
    return langkah.map((l, i) =>
      `<div style="display:flex;align-items:flex-start;gap:8px;padding:5px 0;border-left:3px solid ${accent};padding-left:10px">` +
        `<div style="min-width:20px;height:20px;border-radius:50%;background:${accent}25;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:${accent};font-family:'Nunito',sans-serif;flex-shrink:0">${i + 1}</div>` +
        `<div><span style="font-size:11px;font-weight:700;color:${T.text};font-family:'Nunito',sans-serif">${esc(str(l.icon, '📌'))} ${esc(str(l.judul))}</span>` +
        (str(l.isi) ? `<div style="font-size:10px;color:${T.muted};margin-top:1px;font-family:'Nunito',sans-serif">${esc(str(l.isi).slice(0, 60))}</div>` : '') +
        `</div></div>`
    ).join('');
  }
  const intro = str(mod.intro);
  const introHtml = intro ? `<div style="font-size:.82rem;color:${T.muted};margin-bottom:12px;line-height:1.6;font-family:'Nunito',sans-serif;padding:0 2px">${esc(intro)}</div>` : '';
  // Match PresetModuleCard: 2-col default, 3-col for variant C
  const cols = v === 'C' ? 'repeat(3,1fr)' : 'repeat(2,1fr)';
  return introHtml + `<div style="display:grid;grid-template-columns:${cols};gap:10px">` +
    langkah.map((l, i) => {
      const stepColor = str(l.color, accent);
      return `<div style="position:relative;background:linear-gradient(135deg,${stepColor}0a,${stepColor}04);border:1px solid ${stepColor}22;border-left:3px solid ${stepColor};border-radius:12px;padding:14px 12px 12px;overflow:hidden">` +
        `<div style="position:absolute;top:8px;right:8px;min-width:22px;height:22px;border-radius:50%;background:${stepColor};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff;font-family:'Nunito',sans-serif;box-shadow:0 2px 6px ${stepColor}40">${i + 1}</div>` +
        `<div style="font-size:1.6rem;margin-bottom:6px">${esc(str(l.icon, '📌'))}</div>` +
        `<div style="font-weight:800;font-size:.84rem;margin-bottom:3px;color:${T.text};font-family:'Nunito',sans-serif;padding-right:26px">${esc(str(l.judul))}</div>` +
        (str(l.isi) ? `<div style="font-size:.75rem;color:${T.muted};line-height:1.55;font-family:'Nunito',sans-serif">${esc(str(l.isi))}</div>` : '') +
        `</div>`;
    }).join('') + `</div>`;
}

// ── DISKUSI ───────────────────────────────────────────────────────
export function bodyDiskusi(mod: M, v: LayoutVariant): string {
  const pertanyaan = arr<Record<string, unknown>>(mod.pertanyaan);
  if (!pertanyaan.length) return `<div style="font-size:12px;color:${T.muted};font-family:'Nunito',sans-serif">Belum ada pertanyaan diskusi.</div>`;
  const accent = T.g;
  if (v === 'D') {
    return pertanyaan.map((p, i) =>
      `<div style="display:flex;align-items:flex-start;gap:8px;padding:5px 0;border-left:3px solid ${accent};padding-left:10px">` +
        `<div style="min-width:20px;height:20px;border-radius:50%;background:${accent}25;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:${accent};font-family:'Nunito',sans-serif;flex-shrink:0">${i + 1}</div>` +
        `<span style="font-size:11px;color:${T.text};font-family:'Nunito',sans-serif">${esc(str(p.teks)).slice(0, 80)}</span>` +
        `</div>`
    ).join('');
  }
  const max = v === 'C' ? 5 : 3;
  return pertanyaan.slice(0, max).map((p, i) => {
    return `<div style="background:linear-gradient(135deg,${accent}08,${accent}03);border:1px solid ${accent}22;border-left:4px solid ${accent};border-radius:13px;padding:14px;margin-bottom:10px;overflow:hidden;position:relative">` +
      `<div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,${accent},${accent}50,transparent)"></div>` +
      `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">` +
        `<div style="min-width:26px;height:26px;border-radius:8px;background:${accent}20;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;color:${accent};font-family:'Nunito',sans-serif;border:1px solid ${accent}30">${i + 1}</div>` +
        (str(p.label) ? `<div style="font-size:.78rem;font-weight:800;color:${accent};font-family:'Nunito',sans-serif;letter-spacing:.3px">${esc(str(p.icon || '💬'))} ${esc(str(p.label))}</div>` : `<div style="font-size:.78rem;font-weight:800;color:${accent};font-family:'Nunito',sans-serif;letter-spacing:.3px">${esc(str(p.icon || '💬'))} Pertanyaan ${i + 1}</div>`) +
      `</div>` +
      `<p style="font-size:.86rem;line-height:1.65;font-weight:700;color:${T.text};font-family:'Nunito',sans-serif">${esc(str(p.teks))}</p>` +
      (str(p.petunjuk) ? `<div style="font-size:.78rem;color:${T.muted};margin-top:6px;font-style:italic;font-family:'Nunito',sans-serif">${esc(str(p.petunjuk))}</div>` : '') +
      `<textarea placeholder="Tuliskan jawabanmu di sini…" style="width:100%;background:linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02));border:1px solid rgba(255,255,255,0.09);border-radius:9px;padding:10px;color:${T.text};font-family:'Nunito',sans-serif;font-size:.84rem;resize:vertical;min-height:72px;margin-top:10px;box-sizing:border-box"></textarea>` +
      `</div>`;
  }).join('');
}

// ── REVIEW ────────────────────────────────────────────────────────
export function bodyReview(mod: M, v: LayoutVariant): string {
  const kartu = arr<Record<string, unknown>>(mod.kartu);
  if (!kartu.length) return `<div style="font-size:12px;color:${T.muted};font-family:'Nunito',sans-serif">Belum ada konten review.</div>`;
  const accent = T.y;
  if (v === 'D') {
    return kartu.map((k, i) =>
      `<div style="display:flex;align-items:flex-start;gap:8px;padding:5px 0;border-left:3px solid ${accent};padding-left:10px">` +
        `<span style="font-size:12px">${esc(str(k.icon, '🔄'))}</span>` +
        `<div><span style="font-size:11px;font-weight:700;color:${T.text};font-family:'Nunito',sans-serif">${esc(str(k.judul))}</span>` +
        (str(k.isi) ? `<div style="font-size:10px;color:${T.muted};margin-top:1px;font-family:'Nunito',sans-serif">${esc(str(k.isi).slice(0, 60))}</div>` : '') +
        `</div></div>`
    ).join('');
  }
  // Match PresetModuleCard: always 2-col grid (same as canva)
  const max = 4;
  return `<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">` +
    kartu.slice(0, max).map(k => {
      const color = str(k.warna, accent);
      return `<div style="background:linear-gradient(160deg,${color}10,${color}05);border:1px solid ${color}22;border-radius:13px;padding:14px;position:relative;overflow:hidden">` +
        `<div style="position:absolute;top:-10px;right:-10px;width:48px;height:48px;border-radius:50%;background:${color}0a"></div>` +
        `<div style="width:44px;height:44px;border-radius:12px;background:${color}18;display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin-bottom:10px;border:1px solid ${color}20">${esc(str(k.icon, '✅'))}</div>` +
        `<div style="font-weight:800;font-size:.88rem;margin-bottom:5px;color:${T.text};font-family:'Nunito',sans-serif">${esc(str(k.judul))}</div>` +
        (str(k.isi) ? `<div style="font-size:.8rem;color:${T.muted};line-height:1.65;font-family:'Nunito',sans-serif">${esc(str(k.isi))}</div>` : '') +
        `</div>`;
    }).join('') + `</div>`;
}

// ── REFLEKSI ──────────────────────────────────────────────────────
export function bodyRefleksi(mod: M, v: LayoutVariant): string {
  const pertanyaan = arr<Record<string, unknown>>(mod.pertanyaan);
  if (!pertanyaan.length) return `<div style="font-size:12px;color:${T.muted};font-family:'Nunito',sans-serif">Belum ada pertanyaan refleksi.</div>`;
  const accent = T.p;
  if (v === 'D') {
    return pertanyaan.map((p, i) =>
      `<div style="display:flex;align-items:flex-start;gap:8px;padding:5px 0;border-left:3px solid ${accent};padding-left:10px">` +
        `<div style="min-width:20px;height:20px;border-radius:50%;background:${accent}25;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:${accent};font-family:'Nunito',sans-serif;flex-shrink:0">${i + 1}</div>` +
        `<span style="font-size:11px;color:${T.text};font-family:'Nunito',sans-serif">${esc(str(p.teks)).slice(0, 80)}</span>` +
        `</div>`
    ).join('');
  }
  const max = v === 'C' ? 5 : 3;
  return pertanyaan.slice(0, max).map((p, i) =>
    `<div style="border-radius:13px;padding:0;overflow:hidden;margin-bottom:10px;border:1px solid ${accent}20;background:linear-gradient(160deg,${accent}08,transparent)">` +
      `<div style="background:linear-gradient(135deg,${accent}20,${accent}08);padding:10px 14px;display:flex;align-items:center;gap:8px;border-bottom:1px solid ${accent}15">` +
        `<div style="min-width:24px;height:24px;border-radius:7px;background:${accent}30;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;color:${accent};font-family:'Nunito',sans-serif;border:1px solid ${accent}35">${i + 1}</div>` +
        `<span style="font-size:.84rem;font-weight:800;color:${T.text};font-family:'Nunito',sans-serif">${esc(str(p.icon || '💭'))} ${esc(str(p.teks))}</span>` +
      `</div>` +
      `<div style="padding:12px 14px">` +
        (str(p.petunjuk) ? `<div style="font-size:.78rem;color:${T.muted};margin-bottom:8px;font-style:italic;font-family:'Nunito',sans-serif">${esc(str(p.petunjuk))}</div>` : '') +
        `<textarea placeholder="Tuliskan refleksimu…" style="width:100%;background:linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02));border:1px solid rgba(255,255,255,0.09);border-radius:9px;padding:10px;color:${T.text};font-family:'Nunito',sans-serif;font-size:.84rem;resize:vertical;min-height:68px;box-sizing:border-box"></textarea>` +
      `</div>` +
    `</div>`
  ).join('');
}
