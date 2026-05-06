// ═══════════════════════════════════════════════════════════════
// GENERATE-EXPORT-HTML — Main HTML generator for student export
// Assembles CSS, screens, and client script into a standalone HTML
// ═══════════════════════════════════════════════════════════════

import type { ExportState } from './types';
import { esc } from './utils';
import { FUNGSI_NORMA } from './constants';
import { EXPORT_CSS } from './styles';
import { renderMateriBlok } from './render-materi-blok';
import { buildClientScript } from './client-script';
import { renderModuleToStyledHTML } from '../render-module-html';
import type { LayoutVariant } from '@/components/shared/PresetModuleCard';

export function generateExportHtml(state: ExportState): string {
  const M = state.meta;
  const cp = state.cp;
  const tp = state.tp;
  const atp = state.atp;
  const alur = state.alur;
  const skData = state.skenario;
  const kuisData = state.kuis.length ? state.kuis : [];
  const materiBlok = state.materi?.blok || [];

  // ── TP Lists ─────────────────────────────────────────────────────
  const tpCoverHTML = tp
    .filter((t) => (t.pertemuan || 1) === 1)
    .map((t, i) => `
      <div class="tp-item">
        <div class="tp-num" style="background:${esc(t.color || 'var(--y)')}22;color:${esc(t.color || 'var(--y)')}">${i + 1}</div>
        <div><div class="tp-verb">${esc(t.verb)}</div><div class="tp-desc">${esc(t.desc)}</div></div>
      </div>`).join('') || '<p style="color:var(--muted);font-size:.82rem">TP pertemuan 1 belum diisi.</p>';

  const tpFullHTML = tp
    .map((t, i) => `
      <div class="tp-full-item" style="border-color:${esc(t.color || 'var(--y)')}44;background:${esc(t.color || 'var(--y)')}0a">
        <div class="tp-full-num" style="background:${esc(t.color || 'var(--y)')}22;color:${esc(t.color || 'var(--y)')}">${i + 1}</div>
        <div>
          <div class="tp-full-verb" style="color:${esc(t.color || 'var(--y)')}">${esc(t.verb)}</div>
          <div class="tp-full-desc">${esc(t.desc)}</div>
          <span style="font-size:.68rem;font-weight:900;color:${esc(t.color || 'var(--y)')};background:${esc(t.color || 'var(--y)')}18;padding:1px 8px;border-radius:99px;display:inline-block;margin-top:4px">&rarr; Pertemuan ${t.pertemuan || 1}</span>
        </div>
      </div>`).join('') || '<p style="color:var(--muted);font-size:.82rem">Tujuan Pembelajaran belum diisi.</p>';

  // ── ATP HTML ─────────────────────────────────────────────────────
  const atpHTML = (atp.pertemuan || [])
    .map((p, i) => `
    <div class="atp-p-card${i === 0 ? ' active-p' : ''}">
      <div class="atp-p-head">
        <span class="atp-p-badge" style="background:rgba(245,200,66,.2);color:#f5c842">${i === 0 ? '📍 ' : '→ '}Pertemuan ${i + 1}</span>
        <span style="font-size:.72rem;color:#5a7499">${esc(p.durasi || '')}</span>
        ${i === 0 ? '<span style="margin-left:auto;font-size:.72rem;font-weight:800;color:#34d399">✅ Sekarang</span>' : ''}
      </div>
      <div class="atp-p-title">${esc(p.judul || '')}</div>
      <div class="atp-p-tp">📚 ${esc(p.tp || '')}</div>
      <div class="atp-p-kegiatan">${esc(p.kegiatan || '')}</div>
      <span class="atp-p-penilaian">📋 ${esc(p.penilaian || '')}</span>
    </div>`).join('') || '<p style="color:var(--muted);font-size:.82rem">ATP belum diisi.</p>';

  // ── Alur HTML ────────────────────────────────────────────────────
  const alurHTML = alur.map(s => {
    const fc: Record<string, string> = { Pendahuluan: '#f5c842', Inti: '#38d9d9', Penutup: '#34d399' };
    const col = fc[s.fase] || '#a78bfa';
    return `<div class="alur-step">
        <span class="alur-jp" style="background:${col}22;color:${col}">${esc(s.fase)}</span>
        <span class="alur-dur">${esc(s.durasi || '')}</span>
        <div class="alur-txt"><strong>${esc(s.judul || '')}</strong>${s.deskripsi ? ' — ' + esc(s.deskripsi) : ''}</div>
      </div>`;
  }).join('') || '<p style="color:var(--muted);font-size:.82rem">Alur pembelajaran belum diisi.</p>';

  // ── Materi Blok HTML ────────────────────────────────────────────
  const materiHtml = materiBlok.length ? renderMateriBlok(materiBlok) : '';

  // ── Modules HTML (pre-rendered via renderModuleToStyledHTML) ────
  const allModules = [...(state.modules || []), ...(state.games || [])];

  // Separate petunjuk modules from content modules for better navigation
  const petunjukModules = allModules.filter((m: Record<string, unknown>) => m.type === 'petunjuk');
  const reviewModules = allModules.filter((m: Record<string, unknown>) => m.type === 'review');
  const refleksiModules = allModules.filter((m: Record<string, unknown>) => m.type === 'refleksi');
  const contentModules = allModules.filter((m: Record<string, unknown>) => !['petunjuk', 'review', 'refleksi'].includes(m.type as string));

  const petunjukHtml = petunjukModules.length
    ? petunjukModules.map(mod => renderModuleToStyledHTML(mod, (mod.layoutVariant as LayoutVariant) || 'A')).join('\n')
    : '';
  const reviewHtml = reviewModules.length
    ? reviewModules.map(mod => renderModuleToStyledHTML(mod, (mod.layoutVariant as LayoutVariant) || 'A')).join('\n')
    : '';
  const modulesPreRendered = contentModules.length
    ? contentModules.map(mod => renderModuleToStyledHTML(mod, (mod.layoutVariant as LayoutVariant) || 'A')).join('\n')
    : '';
  const refleksiHtml = refleksiModules.length
    ? refleksiModules.map(mod => renderModuleToStyledHTML(mod, (mod.layoutVariant as LayoutVariant) || 'A')).join('\n')
    : '';

  // ── Determine next screen logic ──────────────────────────────────
  const hasPetunjuk = petunjukModules.length > 0;
  const hasReview = reviewModules.length > 0;
  const hasModules = contentModules.length > 0;
  const hasGames = state.games && state.games.length > 0;
  const hasSkenario = skData.length > 0;
  const hasMateri = materiBlok.length > 0;
  const hasKuis = kuisData.length > 0;
  const hasRefleksi = refleksiModules.length > 0;

  // ── Inline JSON data ─────────────────────────────────────────────
  const skJS = JSON.stringify(skData);
  const kuisJS = JSON.stringify(kuisData.map(s => ({ q: s.q, opts: s.opts || ['', '', '', ''], ans: s.ans, ex: s.ex })));
  const fungsiJS = JSON.stringify(FUNGSI_NORMA);

  // ── Cover next button → Petunjuk first, then CP ──────────────────
  const coverNextScreen = hasPetunjuk ? 's-petunjuk' : 's-cp';

  // ── Petunjuk next button → CP ────────────────────────────────────
  const petunjukNextScreen = 's-cp';

  // ── CP Button ────────────────────────────────────────────────────
  let cpNextScreen = 's-sk';
  if (hasReview) cpNextScreen = 's-review';
  else if (hasSkenario) cpNextScreen = 's-sk';
  else if (hasModules) cpNextScreen = 's-modules';
  else if (hasMateri) cpNextScreen = 's-materi';
  else if (hasKuis) cpNextScreen = 's-kuis';

  // ── Review next button ───────────────────────────────────────────
  let reviewNextScreen = 's-sk';
  if (hasSkenario) reviewNextScreen = 's-sk';
  else if (hasModules) reviewNextScreen = 's-modules';
  else if (hasMateri) reviewNextScreen = 's-materi';
  else if (hasKuis) reviewNextScreen = 's-kuis';

  // ── Modules next button ──────────────────────────────────────────
  let modulesNextScreen = 's-hasil';
  if (hasMateri) modulesNextScreen = 's-materi';
  else if (hasKuis) modulesNextScreen = 's-kuis';
  else if (hasRefleksi) modulesNextScreen = 's-refleksi';

  // ── Materi next button ───────────────────────────────────────────
  const materiNextScreen = hasKuis ? 's-kuis' : hasRefleksi ? 's-refleksi' : 's-hasil';

  // ── Kuis next button ─────────────────────────────────────────────
  const kuisNextScreen = hasRefleksi ? 's-refleksi' : 's-hasil';

  // ── Refleksi next button ─────────────────────────────────────────
  const refleksiNextScreen = 's-hasil';

  // ── Build the complete HTML ──────────────────────────────────────
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(M.judulPertemuan || 'Media Pembelajaran')} | ${esc(M.mapel || '')} ${esc(M.kelas || '')}</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&display=swap" rel="stylesheet">
<style>
${EXPORT_CSS}
</style>
</head>
<body>
<div id="confWrap"></div>

<!-- ═══ COVER ═══ -->
<div class="screen active" id="s-cover">
  <div style="background:radial-gradient(ellipse 90% 60% at 50% 0%,rgba(249,193,46,.18),transparent 60%),linear-gradient(180deg,#0e1c2f,#09121f);flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:36px 18px;">
    <div class="cover-icon">${esc(M.ikon || '📚')}</div>
    <div class="cover-chips">
      <span class="chip" style="background:rgba(249,193,46,.15);color:var(--y)">${esc(M.mapel || 'PPKn')} ${esc(M.kelas || 'VII')}</span>
      <span class="chip" style="background:rgba(62,207,207,.15);color:var(--c)">${esc(M.durasi || '2 × 40 menit')}</span>
      <span class="chip" style="background:rgba(52,211,153,.15);color:var(--g)">${esc(M.kurikulum || 'Kurikulum Merdeka')}</span>
    </div>
    <div class="cover-title" style="font-family:'Fredoka One',cursive;font-size:clamp(1.7rem,5.5vw,2.8rem);line-height:1.1;margin:10px 0 6px;">${esc(M.judulPertemuan || 'Media Pembelajaran')}</div>
    <p class="sub" style="max-width:480px;margin:0 auto 24px">${esc(M.subjudul || '')}</p>
    <button class="btn btn-y" onclick="goScreen('${coverNextScreen}')">Mulai Belajar →</button>
  </div>
</div>

<!-- ═══ PETUNJUK ═══ -->
${hasPetunjuk ? `
<div class="screen" id="s-petunjuk">
  <nav class="navbar">
    <span class="nav-logo">${esc(M.namaBab || M.judulPertemuan || 'Media')}</span>
    <div class="nav-prog"><div class="nav-prog-fill" style="width:8%"></div></div>
    <span class="nav-score">0 ⭐</span>
  </nav>
  <div class="main">
    ${petunjukHtml}
    <div class="btn-row btn-center mt20">
      <button class="btn btn-y" onclick="goScreen('${petunjukNextScreen}')">Lihat Tujuan Pembelajaran →</button>
      <button class="btn btn-ghost" onclick="goScreen('s-cover')">← Kembali</button>
    </div>
  </div>
</div>` : ''}

<!-- ═══ CP / TP / ATP ═══ -->
<div class="screen" id="s-cp">
  <nav class="navbar">
    <span class="nav-logo">${esc(M.namaBab || M.judulPertemuan || 'Media')}</span>
    <div class="nav-prog"><div class="nav-prog-fill" style="width:16%"></div></div>
    <span class="nav-score">0 ⭐</span>
  </nav>
  <div class="main">
    <div class="card">
      <div class="h2">📋 <span class="hl">Dokumen</span> Pembelajaran</div>
      <div class="ktab-row">
        <div class="ktab active" onclick="switchKtab('kcp',this)">Capaian</div>
        <div class="ktab" onclick="switchKtab('ktp',this)">Tujuan Pembelajaran</div>
        <div class="ktab" onclick="switchKtab('katp',this)">ATP</div>
      </div>
      <div class="ktab-content active" id="kcp">
        <div style="font-size:.8rem;color:var(--muted);line-height:1.7;margin-bottom:10px">
          <strong style="color:var(--text)">Elemen:</strong> ${esc(cp.elemen || '-')} &middot;
          <strong style="color:var(--text)">Sub-Elemen:</strong> ${esc(cp.subElemen || '-')}
        </div>
        <div class="def-box">${esc(cp.capaianFase || 'Capaian pembelajaran belum diisi.')}</div>
        <div style="background:rgba(52,211,153,.07);border:1px solid rgba(52,211,153,.2);border-radius:12px;padding:12px;font-size:.82rem;line-height:1.6">
          <strong style="color:var(--g)">🔗 Profil Pelajar Pancasila:</strong><br>
          <span style="color:var(--muted)">${(cp.profil || ['Beriman & Bertakwa', 'Bernalar Kritis', 'Bergotong Royong']).map(esc).join(' &middot; ')}</span>
        </div>
      </div>
      <div class="ktab-content" id="ktp">${tpFullHTML}</div>
      <div class="ktab-content" id="katp">
        <div class="atp-pertemuan-grid">${atpHTML}</div>
      </div>
    </div>
    <div class="card mt14">
      <div style="font-size:.78rem;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">🗓️ Alur Pembelajaran Hari Ini</div>
      <div class="alur-steps">${alurHTML}</div>
    </div>
    <div class="card mt14">
      <div style="font-size:.78rem;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">🎯 Tujuan Pertemuan Ini</div>
      <div class="tp-list">${tpCoverHTML}</div>
    </div>
    <div class="btn-row btn-center">
      <button class="btn btn-y" onclick="goScreen('${cpNextScreen}')">Mulai Pembelajaran →</button>
      <button class="btn btn-ghost" onclick="goScreen('${hasPetunjuk ? 's-petunjuk' : 's-cover'}')">← Kembali</button>
    </div>
  </div>
</div>

<!-- ═══ REVIEW ═══ -->
${hasReview ? `
<div class="screen" id="s-review">
  <nav class="navbar">
    <span class="nav-logo">${esc(M.namaBab || 'Media')}</span>
    <div class="nav-prog"><div class="nav-prog-fill" style="width:25%"></div></div>
    <span class="nav-score">0 ⭐</span>
  </nav>
  <div class="main">
    ${reviewHtml}
    <div class="btn-row btn-center mt20">
      <button class="btn btn-y" onclick="goScreen('${reviewNextScreen}')">Lanjut →</button>
      <button class="btn btn-ghost" onclick="goScreen('s-cp')">← Kembali</button>
    </div>
  </div>
</div>` : ''}

<!-- ═══ SKENARIO ═══ -->
<div class="screen" id="s-sk">
  <nav class="navbar">
    <span class="nav-logo">${esc(M.namaBab || 'Media')}</span>
    <div class="nav-prog"><div class="nav-prog-fill" style="width:33%"></div></div>
    <span class="nav-score" id="navScore2">0 ⭐</span>
  </nav>
  <div class="main">
    <div class="sk-shell">
      <div class="sk-hud">
        <div class="sk-hud-title">🎭 Skenario Interaktif</div>
        <span id="skTitle" style="font-size:.78rem;color:var(--muted)"></span>
        <span class="sk-badge" id="skScoreBadge" style="background:rgba(249,193,46,.15);color:var(--y)">0 poin</span>
      </div>
      <div id="skBody"></div>
      <div id="skProgress" style="display:flex;gap:4px;padding:8px 14px;background:#060d18;border-top:1px solid #1e3a5a;"></div>
    </div>
    <button id="btnNextAfterSk" style="display:none" class="btn btn-y mt14" onclick="goScreen('${hasMateri ? 's-materi' : hasKuis ? 's-kuis' : 's-hasil'}')">Lanjut${hasMateri ? ' ke Materi' : hasKuis ? ' ke Kuis' : ''} →</button>
  </div>
</div>

<!-- ═══ MODULES ═══ -->
<div class="screen" id="s-modules">
  <nav class="navbar">
    <span class="nav-logo">${esc(M.namaBab || 'Media')}</span>
    <div class="nav-prog"><div class="nav-prog-fill" style="width:45%"></div></div>
    <span class="nav-score">0 ⭐</span>
  </nav>
  <div class="main">${modulesPreRendered || '<div class="card" style="text-align:center;padding:30px;color:var(--muted)">Belum ada modul.</div>'}
    <div class="btn-row btn-center mt20"><button class="btn btn-y" onclick="goScreen('${modulesNextScreen}')">Lanjut →</button><button class="btn btn-ghost" onclick="goScreen('${hasReview ? 's-review' : 's-cp'}')">← Kembali</button></div>
  </div>
</div>

<!-- ═══ MATERI & FUNGSI ═══ -->
<div class="screen" id="s-materi">
  <nav class="navbar">
    <span class="nav-logo">${esc(M.namaBab || 'Media')}</span>
    <div class="nav-prog"><div class="nav-prog-fill" style="width:55%"></div></div>
    <span class="nav-score">0 ⭐</span>
  </nav>
  <div class="main">
    ${materiHtml}
    <div class="card mt14">
      <div class="h2">⚖️ Fungsi <span class="hl">Norma</span></div>
      <p class="sub mt8">Klik setiap tab untuk menjelajahi fungsi norma dalam kehidupan.</p>
      <div class="ftab-row" id="ftabRow"></div>
      <div id="ftabContent"></div>
    </div>
    <div class="btn-row btn-center mt20">
      <button class="btn btn-y" onclick="goScreen('${materiNextScreen}')">${hasKuis ? 'Mulai Kuis ❓' : 'Lanjut →'}</button>
      <button class="btn btn-ghost" onclick="goScreen('${hasModules ? 's-modules' : hasSkenario ? 's-sk' : hasReview ? 's-review' : 's-cp'}')">← Kembali</button>
    </div>
  </div>
</div>

<!-- ═══ KUIS ═══ -->
<div class="screen" id="s-kuis">
  <nav class="navbar">
    <span class="nav-logo">${esc(M.namaBab || 'Media')}</span>
    <div class="nav-prog"><div class="nav-prog-fill" style="width:75%"></div></div>
    <span class="nav-score">0 ⭐</span>
  </nav>
  <div class="main">
    <div class="card" style="margin-bottom:14px">
      <div class="h2">❓ <span class="hl">Kuis</span> Pengetahuan</div>
      <p class="sub mt8">${kuisData.length} soal · Jawab dan lihat penjelasannya langsung.</p>
    </div>
    <div id="kuisContainer"></div>
    <div class="btn-row btn-center">
      <button class="btn btn-y" id="btnKuisSubmit" onclick="submitKuis()" style="display:none">Lihat Hasil 📊</button>
    </div>
  </div>
</div>

<!-- ═══ REFLEKSI ═══ -->
${hasRefleksi ? `
<div class="screen" id="s-refleksi">
  <nav class="navbar">
    <span class="nav-logo">${esc(M.namaBab || 'Media')}</span>
    <div class="nav-prog"><div class="nav-prog-fill" style="width:90%"></div></div>
    <span class="nav-score">⭐</span>
  </nav>
  <div class="main">
    ${refleksiHtml}
    <div class="btn-row btn-center mt14">
      <button class="btn btn-y" onclick="goScreen('${refleksiNextScreen}')">Lihat Hasil →</button>
      <button class="btn btn-ghost" onclick="goScreen('${hasKuis ? 's-kuis' : hasMateri ? 's-materi' : 's-modules'}')">← Kembali</button>
    </div>
  </div>
</div>` : ''}

<!-- ═══ HASIL ═══ -->
<div class="screen" id="s-hasil">
  <nav class="navbar">
    <span class="nav-logo">${esc(M.namaBab || 'Media')}</span>
    <div class="nav-prog"><div class="nav-prog-fill" style="width:100%"></div></div>
    <span class="nav-score">⭐</span>
  </nav>
  <div class="main" style="text-align:center">
    <div class="hasil-circle" id="hasilCircle">
      <div class="hasil-score">
        <div style="font-family:'Fredoka One',cursive;font-size:2rem;color:var(--g)" id="hasilNum">0</div>
        <div style="font-size:.7rem;color:var(--muted)">SKOR</div>
      </div>
    </div>
    <div id="hasilLevel" style="padding:10px 20px;border-radius:12px;font-weight:800;font-size:.92rem;margin:12px 0;display:inline-block"></div>
    <div class="card mt14" style="text-align:left">
      <div class="refl-item"><label>💭 Apa yang paling kamu pelajari hari ini?</label>
        <textarea placeholder="Tuliskan refleksimu…"></textarea></div>
      <div class="refl-item"><label>🌟 Bagaimana kamu akan menerapkannya?</label>
        <textarea placeholder="Rencana aksi nyata…"></textarea></div>
    </div>
    <div class="btn-row btn-center mt14">
      <button class="btn btn-y" onclick="launchConfetti()">🎉 Selesai!</button>
      <button class="btn btn-ghost" onclick="goScreen('s-cover')">↩ Ulangi</button>
    </div>
  </div>
</div>

${buildClientScript({ skJS, kuisJS, fungsiJS, hasSkenario, hasMateri, hasKuis })}
</body>
</html>`;
}
