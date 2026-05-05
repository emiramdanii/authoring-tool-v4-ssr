// ═══════════════════════════════════════════════════════════════
// GENERATE-PRINT-ADMIN-HTML — Print-friendly admin export
// Generates a simple HTML table document for printing
// ═══════════════════════════════════════════════════════════════

import type { ExportState } from './types';
import { esc } from './utils';

export function generatePrintAdminHtml(state: ExportState): string {
  const M = state.meta;
  const cp = state.cp;
  const tp = state.tp;
  const atp = state.atp;
  const alur = state.alur;

  return `<!DOCTYPE html><html><head>
    <meta charset="UTF-8"><title>Dokumen Admin – ${esc(M.judulPertemuan || '')}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:30px;max-width:800px;margin:0 auto;font-size:13px;line-height:1.6;}
      h1{font-size:1.3rem;margin-bottom:4px;} h2{font-size:1rem;margin:20px 0 8px;border-bottom:2px solid #333;padding-bottom:4px;}
      table{width:100%;border-collapse:collapse;margin-bottom:16px;}
      th,td{border:1px solid #ccc;padding:7px 10px;text-align:left;}
      th{background:#f5f5f5;font-weight:700;font-size:.85rem;}
      .chip{display:inline-block;padding:2px 8px;border-radius:99px;font-size:.75rem;font-weight:700;background:#eee;}
      @media print{body{padding:0;}}
    </style>
  </head><body>
    <h1>${esc(M.judulPertemuan || 'Media Pembelajaran')}</h1>
    <p>${esc(M.mapel || '')} · ${esc(M.kelas || '')} · ${esc(M.kurikulum || '')} · ${esc(M.durasi || '')}</p>

    <h2>📋 Capaian Pembelajaran</h2>
    <table><tr><th>Elemen</th><td>${esc(cp.elemen || '-')}</td></tr>
    <tr><th>Sub-Elemen</th><td>${esc(cp.subElemen || '-')}</td></tr>
    <tr><th>Capaian Fase</th><td>${esc(cp.capaianFase || '-')}</td></tr>
    <tr><th>Profil Pelajar Pancasila</th><td>${(cp.profil || []).map(esc).join(' · ') || '-'}</td></tr></table>

    <h2>🎯 Tujuan Pembelajaran</h2>
    <table><tr><th>No</th><th>Kata Kerja</th><th>Deskripsi</th><th>Pertemuan</th></tr>
    ${tp.map((t, i) => `<tr><td>${i + 1}</td><td>${esc(t.verb)}</td><td>${esc(t.desc)}</td><td>${t.pertemuan}</td></tr>`).join('')}
    </table>

    <h2>📅 Alur Tujuan Pembelajaran</h2>
    <table><tr><th>No</th><th>Judul</th><th>TP Dicapai</th><th>Durasi</th><th>Kegiatan</th><th>Penilaian</th></tr>
    ${atp.pertemuan.map((p, i) => `<tr><td>${i + 1}</td><td>${esc(p.judul)}</td><td>${esc(p.tp)}</td><td>${esc(p.durasi)}</td><td>${esc(p.kegiatan)}</td><td>${esc(p.penilaian)}</td></tr>`).join('')}
    </table>

    <h2>📋 Alur Pembelajaran</h2>
    <table><tr><th>No</th><th>Fase</th><th>Durasi</th><th>Kegiatan</th><th>Deskripsi</th></tr>
    ${alur.map((a, i) => `<tr><td>${i + 1}</td><td>${esc(a.fase)}</td><td>${esc(a.durasi)}</td><td>${esc(a.judul)}</td><td>${esc(a.deskripsi)}</td></tr>`).join('')}
    </table>

    <p style="margin-top:30px;color:#888;font-size:.75rem">Digenerate oleh Authoring Tool v3.0 · ${new Date().toLocaleDateString('id-ID')}</p>
  </body></html>`;
}
