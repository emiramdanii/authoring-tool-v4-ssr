// ═══════════════════════════════════════════════════════════════════
// CONTENT — Materi, Infografis, Video, Flashcard, Embed, Studi-Kasus
// ═══════════════════════════════════════════════════════════════════

import type { LayoutVariant, M } from './types';
import { T } from './tokens';
import { arr, str, esc } from './helpers';

// ── INFOGRAFIS ────────────────────────────────────────────────────
export function bodyInfografis(mod: M, v: LayoutVariant): string {
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

// ── VIDEO ─────────────────────────────────────────────────────────
export function bodyVideo(mod: M): string {
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
export function bodyFlashcard(mod: M, v: LayoutVariant): string {
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

// ── EMBED ─────────────────────────────────────────────────────────
export function bodyEmbed(mod: M): string {
  const url = str(mod.url);
  if (!url) return `<div style="font-size:12px;color:${T.muted};font-family:'Nunito',sans-serif">URL embed belum diisi.</div>`;
  return `<div style="border-radius:10px;overflow:hidden;background:#f0f0f0;min-height:60px;display:flex;align-items:center;justify-content:center;border:1px dashed rgba(255,255,255,0.2)">` +
    `<div style="text-align:center;padding:16px"><div style="font-size:24px;margin-bottom:4px">\u{1F517}</div><div style="font-size:11px;color:${T.muted};font-family:'Nunito',sans-serif">${esc(url)}</div></div>` +
    `</div>`;
}

// ── STUDI-KASUS ───────────────────────────────────────────────────
export function bodyStudiKasus(mod: M, v: LayoutVariant): string {
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

// ── MATERI ────────────────────────────────────────────────────────
export function bodyMateri(mod: M, v: LayoutVariant): string {
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
