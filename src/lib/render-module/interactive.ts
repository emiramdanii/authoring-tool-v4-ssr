// ═══════════════════════════════════════════════════════════════════
// INTERACTIVE — Accordion, Tab-Icons, Icon-Explore, Comparison,
//               Card-Showcase, Hotspot-Image, Polling
// ═══════════════════════════════════════════════════════════════════

import type { LayoutVariant, M } from './types';
import { T } from './tokens';
import { arr, str, num, esc } from './helpers';

// ── ACCORDION ─────────────────────────────────────────────────────
export function bodyAccordion(mod: M, v: LayoutVariant): string {
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

// ── TAB-ICONS ─────────────────────────────────────────────────────
export function bodyTabIcons(mod: M, v: LayoutVariant): string {
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
export function bodyIconExplore(mod: M, v: LayoutVariant): string {
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
export function bodyComparison(mod: M, v: LayoutVariant): string {
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
export function bodyCardShowcase(mod: M, v: LayoutVariant): string {
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
export function bodyHotspotImage(mod: M, v: LayoutVariant): string {
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
export function bodyPolling(mod: M, v: LayoutVariant): string {
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
