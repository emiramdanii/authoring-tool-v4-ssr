// ═══════════════════════════════════════════════════════════════
// RENDER-MATERI-BLOK — Converts MateriBlok[] to HTML strings
// ═══════════════════════════════════════════════════════════════

import type { MateriBlok } from '@/store/authoring-store';
import { esc } from './utils';

export function renderMateriBlok(blok: MateriBlok[]): string {
  return blok.map((b) => {
    switch (b.tipe) {
      case 'teks':
        return `<div class="card mt14"><div class="h2">${esc(b.judul || '')}</div><p class="sub mt8" style="line-height:1.8;font-size:.88rem">${esc(b.isi || '')}</p></div>`;
      case 'definisi':
        return `<div class="card mt14"><div class="h2">📖 ${esc(b.judul || '')}</div><div class="def-box mt8">${esc(b.isi || '')}</div></div>`;
      case 'poin':
        return `<div class="card mt14"><div class="h2">📌 ${esc(b.judul || '')}</div><ul style="margin-top:10px;list-style:none;padding:0">${(b.butir || []).map(i => `<li style="padding:6px 0;font-size:.84rem;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px"><span style="color:var(--y);font-weight:900">→</span> ${esc(i)}</li>`).join('')}</ul></div>`;
      case 'highlight':
        return `<div class="card mt14" style="border-left:4px solid ${esc(b.warna || '#f9c82e')};background:${esc(b.warna || '#f9c82e')}0a"><div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><span style="font-size:1.8rem">${esc(b.icon || '⚡')}</span><div class="h2" style="font-size:1.1rem">${esc(b.judul || '')}</div></div><p style="font-size:.86rem;line-height:1.7">${esc(b.isi || '')}</p></div>`;
      case 'compare':
        return `<div class="card mt14"><div class="h2">⚖️ ${esc(b.judul || '')}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px"><div style="background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:12px;padding:14px"><div style="font-weight:900;font-size:.9rem;margin-bottom:6px">${esc(b.kiri?.icon || '')} ${esc(b.kiri?.judul || '')}</div><p style="font-size:.82rem;color:var(--muted);line-height:1.6">${esc(b.kiri?.isi || '')}</p></div><div style="background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:12px;padding:14px"><div style="font-weight:900;font-size:.9rem;margin-bottom:6px">${esc(b.kanan?.icon || '')} ${esc(b.kanan?.judul || '')}</div><p style="font-size:.82rem;color:var(--muted);line-height:1.6">${esc(b.kanan?.isi || '')}</p></div></div></div>`;
      case 'kutipan':
        return `<div class="card mt14" style="border-left:4px solid var(--c);background:rgba(62,207,207,.05)"><div style="font-size:1.5rem;margin-bottom:6px">💬</div><p style="font-size:.9rem;font-style:italic;line-height:1.7">"${esc(b.isi || '')}"</p>${b.judul ? `<div style="font-size:.78rem;color:var(--muted);margin-top:6px">— ${esc(b.judul)}</div>` : ''}</div>`;
      case 'tabel':
        return `<div class="card mt14"><div class="h2">📊 ${esc(b.judul || '')}</div><table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:.82rem"><thead>${(b.baris?.[0] || ['', '']).map((h, i) => `<th style="padding:8px 12px;background:rgba(249,193,46,.1);border:1px solid var(--border);text-align:left;font-weight:800">${esc(h)}</th>`).join('')}</thead><tbody>${(b.baris || []).slice(1).map(row => `<tr>${row.map(cell => `<td style="padding:8px 12px;border:1px solid var(--border)">${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      case 'timeline':
        return `<div class="card mt14"><div class="h2">🗓️ ${esc(b.judul || '')}</div><div style="margin-top:12px">${(b.langkah || []).map((s, i) => `<div style="display:flex;gap:14px;margin-bottom:14px;align-items:flex-start"><div style="width:36px;height:36px;border-radius:50%;background:var(--c)22;color:var(--c);display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0">${esc(s.icon)}</div><div><div style="font-weight:900;font-size:.88rem">${esc(s.judul)}</div><p style="font-size:.8rem;color:var(--muted);line-height:1.5;margin-top:3px">${esc(s.isi)}</p></div></div>`).join('')}</div></div>`;
      case 'studi':
        return `<div class="card mt14" style="border-left:4px solid var(--g);background:rgba(52,211,153,.05)"><div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><span style="font-size:2rem">${esc(b.karakter || '🧑')}</span><div><div class="h2" style="font-size:1.1rem">🧠 ${esc(b.judul || 'Studi Kasus')}</div><div style="font-size:.78rem;color:var(--muted)">Situasi: ${esc(b.situasi || '')}</div></div></div><div class="def-box">${esc(b.pertanyaan || '')}</div><div style="background:rgba(255,255,255,.05);border-radius:10px;padding:12px;margin-top:10px"><span style="font-weight:800;color:var(--g);font-size:.84rem">💬 Pesan:</span><p style="font-size:.82rem;color:var(--muted);margin-top:4px;line-height:1.6">${esc(b.pesan || '')}</p></div></div>`;
      case 'infobox':
        return `<div class="card mt14" style="border-left:4px solid ${b.style === 'warning' ? 'var(--r)' : 'var(--c)'}"><div style="font-weight:900;font-size:.88rem;margin-bottom:6px">${esc(b.judul || '')}</div><p style="font-size:.84rem;line-height:1.7;color:var(--muted)">${esc(b.isi || '')}</p></div>`;
      case 'checklist':
        return `<div class="card mt14"><div class="h2">✅ ${esc(b.judul || '')}</div><ul style="margin-top:10px;list-style:none;padding:0">${(b.butir || []).map(i => `<li style="padding:8px 0;font-size:.84rem;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px"><span style="width:22px;height:22px;border-radius:6px;border:2px solid var(--c);display:flex;align-items:center;justify-content:center;flex-shrink:0">✓</span> ${esc(i)}</li>`).join('')}</ul></div>`;
      case 'statistik':
        return `<div class="card mt14"><div class="h2">📈 ${esc(b.judul || '')}</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-top:12px">${(b.items || []).map(it => `<div style="background:${esc(it.warna || '#3ecfcf')}0a;border:1px solid ${esc(it.warna || '#3ecfcf')}22;border-radius:12px;padding:16px;text-align:center"><div style="font-size:2rem">${esc(it.icon || '📊')}</div><div style="font-family:'Fredoka One',cursive;font-size:1.6rem;color:${esc(it.warna || '#3ecfcf')}">${esc(it.angka || '')}${it.satuan ? `<span style="font-size:.8rem;font-weight:600">${esc(it.satuan)}</span>` : ''}</div><div style="font-size:.78rem;color:var(--muted);margin-top:4px">${esc(it.label || '')}</div></div>`).join('')}</div></div>`;
      case 'gambar':
        return b.isi ? `<div class="card mt14">${b.judul ? `<div class="h2">🖼️ ${esc(b.judul)}</div>` : ''}<img src="${esc(b.isi)}" alt="${esc(b.judul || 'Gambar')}" style="width:100%;border-radius:12px;margin-top:10px" onerror="this.style.display='none'" /></div>` : '';
      default:
        if (b.judul || b.isi) {
          return `<div class="card mt14">${b.judul ? `<div class="h2">${esc(b.judul)}</div>` : ''}${b.isi ? `<p class="sub mt8" style="line-height:1.7">${esc(b.isi)}</p>` : ''}</div>`;
        }
        return '';
    }
  }).join('');
}
