// ═══════════════════════════════════════════════════════════════
// EXPORT-HTML.TS — HTML generator for student export
// Generates a complete standalone HTML file from Zustand store state
// ═══════════════════════════════════════════════════════════════

import type {
  MetaState, CpState, TpItem, AtpState, AlurItem,
  KuisItem, MateriState, MateriBlok,
} from '@/store/authoring-store';
import { renderModuleToStyledHTML } from './render-module-html';
import type { LayoutVariant } from '@/components/shared/PresetModuleCard';

// ── Fungsi Norma Preset Data (hardcoded, matches data.js PRESETS.fungsi) ──
const FUNGSI_NORMA = [
  {
    icon: '🗺️', label: 'Pedoman Tingkah Laku', color: 'var(--y)',
    bg: 'rgba(249,193,46,.06)', bc: 'rgba(249,193,46,.25)',
    desc: 'Norma memberi petunjuk kepada setiap individu tentang cara bertindak yang baik dan benar dalam pergaulan sehari-hari.',
    contoh: [
      'Norma sopan santun mengajarkan kita untuk mengucapkan salam saat bertemu',
      'Norma hukum lalu lintas memberi tahu kita harus berhenti saat lampu merah',
      'Norma agama memandu kita untuk berdoa sebelum makan dan bekerja',
    ],
    tanya: 'Sebutkan 1 norma yang selama ini menjadi panduan perilakumu di sekolah!',
  },
  {
    icon: '🤝', label: 'Menciptakan Ketertiban', color: 'var(--c)',
    bg: 'rgba(62,207,207,.06)', bc: 'rgba(62,207,207,.25)',
    desc: 'Norma mencegah kekacauan dan konflik. Dengan norma, setiap orang tahu apa yang boleh dan tidak boleh dilakukan sehingga kehidupan berjalan teratur.',
    contoh: [
      'Norma antrian di kasir mencegah keributan dan memastikan semua dilayani adil',
      'Peraturan sekolah membuat proses belajar-mengajar berlangsung kondusif',
      'Aturan lalu lintas mencegah kecelakaan dan kemacetan di jalan raya',
    ],
    tanya: 'Bayangkan jika tidak ada aturan di kelasmu — apa yang akan terjadi dalam 1 jam pelajaran?',
  },
  {
    icon: '🛡️', label: 'Melindungi Hak Warga', color: 'var(--r)',
    bg: 'rgba(255,107,107,.06)', bc: 'rgba(255,107,107,.25)',
    desc: 'Norma menjamin setiap anggota masyarakat mendapatkan hak-haknya dan diperlakukan secara adil tanpa diskriminasi.',
    contoh: [
      'Hukum melindungi hak milik — orang tidak boleh mencuri barang orang lain',
      'Norma agama melindungi hak beribadah setiap pemeluknya dari gangguan',
      'Aturan sekolah melindungi setiap siswa dari perundungan (bullying)',
    ],
    tanya: 'Hak apa yang kamu rasakan paling terlindungi oleh norma di lingkunganmu?',
  },
  {
    icon: '💚', label: 'Memperkuat Solidaritas', color: 'var(--g)',
    bg: 'rgba(52,211,153,.06)', bc: 'rgba(52,211,153,.25)',
    desc: 'Norma mempererat rasa kebersamaan, persatuan, dan kepedulian antaranggota masyarakat. Norma mengajarkan bahwa kita saling membutuhkan satu sama lain.',
    contoh: [
      'Norma gotong royong mendorong warga saling membantu saat ada musibah',
      'Norma saling menghormati memperkuat persatuan di tengah keberagaman',
      'Tradisi saling mengunjungi saat Lebaran/Natal mempererat tali silaturahmi',
    ],
    tanya: 'Contoh kegiatan gotong royong apa yang masih ada di lingkunganmu saat ini?',
  },
  {
    icon: '⚖️', label: 'Mewujudkan Keadilan', color: 'var(--p)',
    bg: 'rgba(167,139,250,.06)', bc: 'rgba(167,139,250,.25)',
    desc: 'Norma memastikan setiap orang diperlakukan setara dan adil. Tidak ada yang boleh mendapat perlakuan berbeda hanya karena kekayaan, jabatan, atau kekuasaan.',
    contoh: [
      'Hukum berlaku sama untuk semua orang — kaya atau miskin, pejabat atau rakyat biasa',
      'Norma antrian memastikan semua orang mendapat giliran yang sama tanpa pengecualian',
      'Penilaian di sekolah menggunakan kriteria yang sama untuk semua siswa',
    ],
    tanya: 'Pernahkah kamu melihat ketidakadilan di sekitarmu? Norma apa yang seharusnya ditegakkan?',
  },
];

// ── Export State Interface ─────────────────────────────────────────
export interface ExportState {
  meta: MetaState;
  cp: CpState;
  tp: TpItem[];
  atp: AtpState;
  alur: AlurItem[];
  skenario: Array<Record<string, unknown>>;
  kuis: KuisItem[];
  materi: MateriState;
  modules: Array<Record<string, unknown>>;
  games: Array<Record<string, unknown>>;
}

// ── HTML Entity Escaping ──────────────────────────────────────────
function esc(str: string | number | null | undefined): string {
  if (str == null) return '';
  const s = String(str);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Generate HTML ────────────────────────────────────────────────
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
  const modulesPreRendered = allModules.length
    ? allModules.map(mod => renderModuleToStyledHTML(mod, (mod.layoutVariant as LayoutVariant) || 'A')).join('\n')
    : '';

  // ── Determine next screen logic ──────────────────────────────────
  const hasModules = state.modules && state.modules.length > 0;
  const hasGames = state.games && state.games.length > 0;
  const hasSkenario = skData.length > 0;
  const hasMateri = materiBlok.length > 0;
  const hasKuis = kuisData.length > 0;

  // ── Inline JSON data ─────────────────────────────────────────────
  const skJS = JSON.stringify(skData);
  const kuisJS = JSON.stringify(kuisData.map(s => ({ q: s.q, opts: s.opts || ['', '', '', ''], ans: s.ans, ex: s.ex })));
  const fungsiJS = JSON.stringify(FUNGSI_NORMA);

  // ── CP Button ────────────────────────────────────────────────────
  let cpNextScreen = 's-sk';
  if (hasModules) cpNextScreen = 's-modules';
  else if (hasSkenario) cpNextScreen = 's-sk';
  else if (hasMateri) cpNextScreen = 's-materi';
  else if (hasKuis) cpNextScreen = 's-kuis';

  // ── Materi next button ───────────────────────────────────────────
  const materiNextScreen = hasKuis ? 's-kuis' : 's-hasil';

  // ── Build the complete HTML ──────────────────────────────────────
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(M.judulPertemuan || 'Media Pembelajaran')} | ${esc(M.mapel || '')} ${esc(M.kelas || '')}</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&display=swap" rel="stylesheet">
<style>
:root{--bg:#0e1c2f;--bg2:#13243a;--card:#182d45;--border:rgba(255,255,255,.09);
  --y:#f9c12e;--c:#3ecfcf;--r:#ff6b6b;--p:#a78bfa;--g:#34d399;--o:#fb923c;
  --text:#e8f2ff;--muted:#6e90b5;--rad:16px;}
*{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{font-family:'Nunito',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;overflow-x:hidden;}
.screen{display:none;min-height:100vh;animation:fadeIn .4s ease;}
.screen.active{display:flex;flex-direction:column;}
@keyframes fadeIn{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:none;}}
.navbar{background:rgba(14,28,47,.96);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);
  padding:10px 18px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:200;}
.nav-logo{font-family:'Fredoka One',cursive;font-size:.95rem;color:var(--y);white-space:nowrap;}
.nav-prog{flex:1;height:6px;background:rgba(255,255,255,.08);border-radius:99px;overflow:hidden;margin:0 8px;}
.nav-prog-fill{height:100%;background:linear-gradient(90deg,var(--y),var(--c));border-radius:99px;transition:width .5s;}
.nav-score{font-size:.8rem;font-weight:800;color:var(--y);white-space:nowrap;}
.main{flex:1;padding:22px 16px;max-width:860px;width:100%;margin:0 auto;}
.btn{display:inline-flex;align-items:center;gap:6px;padding:10px 24px;border-radius:99px;
  font-family:'Nunito',sans-serif;font-weight:800;font-size:.9rem;border:none;cursor:pointer;transition:all .18s;}
.btn:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(0,0,0,.3);}
.btn-y{background:var(--y);color:#0e1c2f;}.btn-c{background:var(--c);color:#0e1c2f;}
.btn-g{background:var(--g);color:#0e1c2f;}.btn-ghost{background:rgba(255,255,255,.08);color:var(--text);border:1px solid var(--border);}
.btn-sm{padding:7px 15px;font-size:.78rem;}
.btn-row{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px;}
.btn-center{justify-content:center;}
.card{background:var(--card);border:1px solid var(--border);border-radius:var(--rad);padding:20px;}
.h2{font-family:'Fredoka One',cursive;font-size:1.6rem;line-height:1.2;}
.sub{color:var(--muted);font-size:.86rem;line-height:1.6;}
.chip{display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:99px;font-size:.74rem;font-weight:800;}
.hl{color:var(--y);}
.mt8{margin-top:8px;}.mt14{margin-top:14px;}.mt20{margin-top:20px;}
.def-box{border-left:4px solid var(--y);background:rgba(249,193,46,.07);border-radius:0 11px 11px 0;padding:13px 15px;margin:13px 0;font-size:.91rem;line-height:1.7;}
#s-cover{background:radial-gradient(ellipse 90% 60% at 50% 0%,rgba(249,193,46,.18),transparent 60%),linear-gradient(180deg,#0e1c2f,#09121f);}
.cover-wrap{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:36px 18px;}
.cover-icon{font-size:4.5rem;animation:float 3s ease-in-out infinite;}
@keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-12px);}}
.cover-title{font-family:'Fredoka One',cursive;font-size:clamp(1.7rem,5.5vw,2.8rem);line-height:1.1;margin:10px 0 6px;}
.cover-chips{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:14px 0 26px;}
.tp-list{display:flex;flex-direction:column;gap:9px;margin-top:10px;}
.tp-item{display:flex;align-items:flex-start;gap:12px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:12px;padding:12px 14px;}
.tp-num{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:900;flex-shrink:0;}
.tp-verb{font-weight:900;font-size:.86rem;margin-bottom:2px;}
.tp-desc{color:var(--muted);font-size:.79rem;line-height:1.5;}
.atp-pertemuan-grid{display:flex;flex-direction:column;gap:10px;margin:12px 0;}
.atp-p-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px;}
.atp-p-card.active-p{border-color:rgba(249,193,46,.3);background:rgba(249,193,46,.04);}
.atp-p-head{display:flex;align-items:center;gap:8px;margin-bottom:7px;flex-wrap:wrap;}
.atp-p-badge{padding:3px 10px;border-radius:99px;font-size:.7rem;font-weight:900;}
.atp-p-title{font-weight:900;font-size:.95rem;margin-bottom:4px;}
.atp-p-tp{font-size:.78rem;color:var(--c);margin-bottom:5px;font-weight:700;}
.atp-p-kegiatan{font-size:.76rem;color:var(--muted);line-height:1.5;margin-bottom:7px;}
.atp-p-penilaian{font-size:.7rem;font-weight:800;color:var(--g);}
.alur-steps{display:flex;flex-direction:column;gap:8px;margin:14px 0;}
.alur-step{display:flex;gap:12px;align-items:flex-start;padding:11px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.03);}
.alur-jp{font-size:.68rem;font-weight:900;padding:3px 9px;border-radius:99px;white-space:nowrap;flex-shrink:0;margin-top:2px;}
.alur-dur{font-size:.75rem;font-weight:900;color:var(--y);min-width:52px;flex-shrink:0;margin-top:2px;}
.alur-txt{font-size:.82rem;line-height:1.5;}
.alur-txt strong{color:var(--text);}
.ktab-row{display:flex;gap:0;border-bottom:2px solid var(--border);margin-bottom:16px;}
.ktab{padding:9px 16px;font-size:.78rem;font-weight:800;cursor:pointer;color:var(--muted);border-bottom:2px solid transparent;margin-bottom:-2px;transition:all .2s;}
.ktab.active{color:var(--y);border-bottom-color:var(--y);}
.ktab-content{display:none;animation:fadeIn .3s ease;}
.ktab-content.active{display:block;}
.tp-full-item{display:flex;gap:12px;padding:11px 13px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:12px;margin-bottom:8px;}
.tp-full-num{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:900;flex-shrink:0;margin-top:2px;}
.tp-full-verb{font-weight:900;font-size:.84rem;margin-bottom:2px;}
.tp-full-desc{font-size:.78rem;color:var(--muted);line-height:1.5;}
.sk-shell{background:#0a0f1a;border:3px solid #1e3a5a;border-radius:16px;overflow:hidden;margin:12px 0;}
.sk-hud{background:linear-gradient(90deg,#0d1b2f,#0f2340);padding:10px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #1e3a5a;gap:12px;}
.sk-hud-title{font-family:'Fredoka One',cursive;font-size:.9rem;color:var(--y);}
.sk-badge{padding:3px 10px;border-radius:99px;font-size:.7rem;font-weight:800;}
.sk-scene{position:relative;width:100%;height:180px;overflow:hidden;}
.sbg-pasar{background:linear-gradient(180deg,#87CEEB 0%,#b0d4f0 45%,#999 60%,#a08050 100%);}
.sbg-masjid{background:linear-gradient(180deg,#fce4ec 0%,#f8d7e3 45%,#81c784 100%);}
.sbg-kelas{background:linear-gradient(180deg,#e8f4fd,#d0eaf8 100%);}
.sbg-kampung{background:linear-gradient(180deg,#c8e6c9 0%,#81c784 48%,#b09060 100%);}
.sbg-hutan{background:linear-gradient(180deg,#a8d5ba 0%,#2d6a4f 48%,#1a3a2a 100%);}
.sbg-pantai{background:linear-gradient(180deg,#87ceeb 0%,#4ea8de 40%,#f2cc8f 75%,#deb887 100%);}
.sk-char{position:absolute;bottom:28%;display:flex;flex-direction:column;align-items:center;}
.sk-head{width:32px;height:32px;border-radius:50%;border:2px solid rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;font-size:1.1rem;}
.sk-body{width:24px;height:26px;border-radius:5px 5px 3px 3px;border:2px solid rgba(0,0,0,.1);margin-top:-2px;}
.sk-legs{display:flex;gap:3px;margin-top:1px;}
.sk-leg{width:8px;height:16px;border-radius:0 0 4px 4px;border:1px solid rgba(0,0,0,.1);}
.sk-dialogue{position:absolute;bottom:0;left:0;right:0;background:rgba(8,16,30,.92);border-top:2px solid #1e3a5a;padding:12px 14px;min-height:76px;}
.sk-speaker{font-size:.7rem;font-weight:800;color:var(--c);margin-bottom:4px;text-transform:uppercase;letter-spacing:.06em;}
.sk-text{font-size:.85rem;font-weight:700;line-height:1.5;color:#e8f2ff;}
.sk-tap{font-size:.68rem;color:var(--muted);margin-top:5px;animation:tapP 1.4s ease-in-out infinite;}
@keyframes tapP{0%,100%{opacity:1;}50%{opacity:.3;}}
.sk-choices{padding:14px;}
.sk-choice-prompt{font-size:.83rem;font-weight:800;color:var(--y);margin-bottom:10px;text-align:center;}
.sk-choice{background:rgba(255,255,255,.05);border:2px solid rgba(255,255,255,.1);border-radius:12px;padding:11px 14px;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:10px;font-size:.83rem;font-weight:700;margin-bottom:8px;}
.sk-choice:hover{background:rgba(255,255,255,.1);border-color:var(--c);}
.sk-result{padding:14px;}
.sk-result-banner{border-radius:12px;padding:12px 14px;display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;}
.sk-result-banner.good{background:rgba(52,211,153,.1);border:2px solid rgba(52,211,153,.3);}
.sk-result-banner.bad{background:rgba(255,107,107,.1);border:2px solid rgba(255,107,107,.3);}
.sk-result-banner.mid{background:rgba(249,193,46,.1);border:2px solid rgba(249,193,46,.3);}
.sk-result-title{font-weight:900;font-size:.92rem;margin-bottom:3px;}
.sk-result-body{font-size:.8rem;line-height:1.5;color:var(--muted);}
.sk-result-banner.good .sk-result-title{color:var(--g);}
.sk-result-banner.bad .sk-result-title{color:var(--r);}
.sk-result-banner.mid .sk-result-title{color:var(--y);}
.q-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:12px;}
.q-text{font-weight:700;font-size:.9rem;line-height:1.5;margin-bottom:12px;}
.q-opts{display:flex;flex-direction:column;gap:7px;}
.q-opt{display:flex;align-items:flex-start;gap:10px;padding:10px 13px;border-radius:10px;background:rgba(255,255,255,.04);border:2px solid rgba(255,255,255,.07);cursor:pointer;font-size:.83rem;font-weight:700;transition:all .18s;line-height:1.4;}
.q-opt:hover:not(.dis){border-color:var(--c);background:rgba(62,207,207,.06);}
.q-opt.ok{border-color:var(--g);background:rgba(52,211,153,.1);color:var(--g);}
.q-opt.no{border-color:var(--r);background:rgba(255,107,107,.1);color:var(--r);}
.q-opt.shok{border-color:var(--g);background:rgba(52,211,153,.05);}
.q-opt.dis{cursor:default;pointer-events:none;}
.q-fb{padding:9px 12px;border-radius:9px;margin-top:8px;font-size:.79rem;font-weight:700;line-height:1.5;}
.q-fb.ok{background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.3);color:var(--g);}
.q-fb.no{background:rgba(255,107,107,.1);border:1px solid rgba(255,107,107,.3);color:var(--r);}
.ftab-row{display:flex;gap:6px;margin:12px 0;flex-wrap:wrap;}
.ftab{padding:6px 12px;border-radius:99px;font-size:.76rem;font-weight:800;cursor:pointer;border:1px solid var(--border);background:rgba(255,255,255,.04);color:var(--muted);transition:all .2s;}
.hasil-circle{width:140px;height:140px;border-radius:50%;background:conic-gradient(var(--g) 0%,var(--g) var(--prog,0%),rgba(255,255,255,.06) var(--prog,0%) 100%);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;position:relative;}
.hasil-circle::before{content:'';position:absolute;inset:10px;border-radius:50%;background:var(--bg2);}
.hasil-score{position:relative;z-index:1;text-align:center;}
.refl-item{border-radius:12px;padding:12px;border:1px solid rgba(255,255,255,.08);margin-bottom:10px;}
.refl-item label{font-size:.78rem;font-weight:800;display:block;margin-bottom:5px;}
.refl-item textarea{width:100%;background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:8px;padding:8px;color:var(--text);font-family:'Nunito',sans-serif;font-size:.8rem;resize:vertical;min-height:58px;}
.conf{position:fixed;border-radius:2px;animation:confFall linear both;pointer-events:none;z-index:9999;}
@keyframes confFall{to{transform:translateY(110vh) rotate(720deg);opacity:0;}}
#confWrap{position:fixed;inset:0;pointer-events:none;z-index:9998;}
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
    <button class="btn btn-y" onclick="goScreen('s-cp')">Mulai Belajar →</button>
  </div>
</div>

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
      <button class="btn btn-ghost" onclick="goScreen('s-cover')">← Kembali</button>
    </div>
  </div>
</div>

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
    <div class="btn-row btn-center mt20"><button class="btn btn-y" onclick="goScreen('${hasSkenario ? 's-sk' : hasMateri ? 's-materi' : hasKuis ? 's-kuis' : 's-hasil'}')">Lanjut →</button><button class="btn btn-ghost" onclick="goScreen('s-cp')">← Kembali</button></div>
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
      <button class="btn btn-y" onclick="goScreen('${materiNextScreen}')">Mulai Kuis ❓</button>
      <button class="btn btn-ghost" onclick="goScreen('${hasSkenario ? 's-sk' : 's-cp'}')">← ${hasSkenario ? 'Skenario' : 'Kembali'}</button>
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

<script>
// ── DATA ──────────────────────────────────────────
const CHAPTERS = ${skJS};
const KUIS_SOAL = ${kuisJS};
const FUNGSI = ${fungsiJS};
const HAS_SKENARIO = ${hasSkenario};
const HAS_MATERI = ${hasMateri};
const HAS_KUIS = ${hasKuis};
let S = { score:0, skScore:0 };
let kuisAnswers = {};

// ── SCREEN NAV ─────────────────────────────────────
function goScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const el = document.getElementById(id);
  if(el){ el.classList.add('active'); window.scrollTo(0,0); }
  if(id==='s-sk')  initSk();
  if(id==='s-materi') initFtab();
  if(id==='s-kuis')   renderKuis();
}

// ── CP TABS ─────────────────────────────────────────
function switchKtab(id, el){
  document.querySelectorAll('.ktab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.ktab-content').forEach(t=>t.classList.remove('active'));
  if(el) el.classList.add('active');
  const cont = document.getElementById(id);
  if(cont) cont.classList.add('active');
}

// ── SKENARIO ────────────────────────────────────────
let skCh=0, skStep=0;
function initSk(){
  if(!CHAPTERS.length){
    document.getElementById('skBody').innerHTML='<div style="padding:30px;text-align:center;color:var(--muted)">Skenario belum diisi.</div>';
    document.getElementById('btnNextAfterSk').style.display='inline-flex';
    return;
  }
  skCh=0; renderSkProg(); startChapter();
}
function renderSkProg(){
  const el=document.getElementById('skProgress');
  if(!el) return;
  el.innerHTML=CHAPTERS.map((_,i)=>
    '<div style="flex:1;height:4px;border-radius:99px;background:'+(i<skCh?'#34d399':i===skCh?'#f9c12e':'#1e3a5a')+';transition:all .3s'+(i===skCh?';box-shadow:0 0 6px #f9c12e':'')+'">'+'</div>'
  ).join('');
}
function startChapter(){
  const ch=CHAPTERS[skCh];
  if(!ch) return;
  document.getElementById('skTitle').textContent=ch.title||'';
  skStep=0; showSetup();
}
function showSetup(){
  const ch=CHAPTERS[skCh]; const step=ch.setup[skStep];
  if(!step) return showChoices();
  document.getElementById('skBody').innerHTML=
    '<div class="sk-scene '+(ch.bg||'sbg-kampung')+'">'+
      '<div class="sk-char" style="left:50%;transform:translateX(-50%)">'+
        '<div class="sk-head" style="background:#fff2d9">'+(ch.charEmoji||'😊')+'</div>'+
        '<div class="sk-body" style="background:'+(ch.charColor||'#3a7a9a')+'"></div>'+
        '<div class="sk-legs"><div class="sk-leg" style="background:'+(ch.charPants||'#3a5a7a')+'"></div><div class="sk-leg" style="background:'+(ch.charPants||'#3a5a7a')+'"></div></div>'+
      '</div>'+
    '</div>'+
    '<div class="sk-dialogue">'+
      '<div class="sk-speaker">'+step.speaker+'</div>'+
      '<div class="sk-text" id="skTypedText"></div>'+
      '<div class="sk-tap">Ketuk untuk lanjut ▶</div>'+
    '</div>';
  document.getElementById('skBody').onclick = advanceSetup;
  typeText('skTypedText', step.text||'');
}
function typeText(id, text){
  const el=document.getElementById(id); if(!el) return;
  el.textContent=''; let i=0;
  const t=setInterval(()=>{ if(i>=text.length){clearInterval(t);return;} el.textContent+=text[i++]; },22);
}
function advanceSetup(){
  document.getElementById('skBody').onclick=null;
  skStep++;
  if(skStep<CHAPTERS[skCh].setup.length) showSetup();
  else showChoices();
}
function showChoices(){
  const ch=CHAPTERS[skCh];
  document.getElementById('skBody').innerHTML=
    '<div class="sk-choices">'+
      '<div class="sk-choice-prompt">'+(ch.choicePrompt||'Apa yang kamu lakukan?')+'</div>'+
      ch.choices.map((c,i)=>
        '<div class="sk-choice" onclick="pickChoice('+i+')">'+
          '<span style="font-size:1.3rem">'+(c.icon||'')+'</span>'+
          '<div><div>'+(c.label||'')+'</div>'+
          '<div style="font-size:.72rem;color:var(--muted);font-weight:600">'+(c.detail||'')+'</div></div>'+
        '</div>'
      ).join('')+
    '</div>';
}
function pickChoice(i){
  const ch=CHAPTERS[skCh]; const c=ch.choices[i];
  S.skScore+=(c.pts||0);
  const icons={good:'🌟',mid:'🤔',bad:'⚠️'};
  document.getElementById('skBody').innerHTML=
    '<div class="sk-result">'+
      '<div class="sk-result-banner '+(c.level||'mid')+'">'+
        '<div style="font-size:2rem">'+(icons[c.level]||'💡')+'</div>'+
        '<div>'+
          '<div class="sk-result-title">'+(c.resultTitle||'')+'</div>'+
          '<div class="sk-result-body">'+(c.resultBody||'')+'</div>'+
        '</div>'+
      '</div>'+
      '<div style="background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:11px;padding:11px 13px;margin-bottom:10px">'+
        '<div style="font-size:.72rem;font-weight:800;color:var(--muted);text-transform:uppercase;margin-bottom:5px">🔍 Kaitannya dengan Norma</div>'+
        '<div style="font-size:.8rem;font-weight:700;color:var(--c);margin-bottom:6px">'+(c.norma||'')+'</div>'+
        (c.consequences||[]).map(k=>'<div style="display:flex;gap:8px;font-size:.8rem;margin-bottom:4px">'+k.icon+' '+k.text+'</div>').join('')+
      '</div>'+
      '<div style="text-align:center">'+
        (skCh<CHAPTERS.length-1
          ? '<button class="btn btn-y btn-sm" onclick="skCh++;renderSkProg();startChapter()">Skenario Berikutnya →</button>'
          : '<button class="btn btn-g btn-sm" onclick="endSk()">Selesai! 🎉</button>')+
      '</div>'+
    '</div>';
  document.getElementById('skScoreBadge').textContent=S.skScore+' poin';
}
function endSk(){
  document.getElementById('skBody').innerHTML=
    '<div style="padding:20px;text-align:center;background:#060d18;border-top:2px solid #1e3a5a">'+
      '<div style="font-size:3rem;margin-bottom:10px">🎭</div>'+
      '<div style="font-family:Fredoka One,cursive;font-size:1.2rem;margin-bottom:6px">Skenario Selesai!</div>'+
      '<div style="font-family:Fredoka One,cursive;font-size:1.8rem;color:var(--g)">'+S.skScore+' poin</div>'+
    '</div>';
  document.getElementById('btnNextAfterSk').style.display='inline-flex';
}

// ── FUNGSI TABS ──────────────────────────────────────
let curFtab=0;
function initFtab(){ curFtab=0; renderFtabUI(); }
function renderFtabUI(){
  document.getElementById('ftabRow').innerHTML=FUNGSI.map((f,i)=>
    '<div class="ftab'+(i===curFtab?' active':'')+'" onclick="switchFtabF('+i+')" style="'+(i===curFtab?'background:'+f.color+';color:#0e1c2f;border-color:transparent;':'')+'">'
      +f.icon+' '+f.label+'</div>'
  ).join('');
  const f=FUNGSI[curFtab];
  document.getElementById('ftabContent').innerHTML=
    '<div style="background:'+f.bg+';border:1px solid '+f.bc+';border-radius:14px;padding:16px;animation:fadeIn .3s ease">'+
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">'+
        '<span style="font-size:2rem">'+f.icon+'</span>'+
        '<div style="font-weight:900;font-size:1rem;color:'+f.color+'">'+f.label+'</div>'+
      '</div>'+
      '<p style="font-size:.84rem;line-height:1.7;margin-bottom:12px">'+f.desc+'</p>'+
      f.contoh.map(c=>'<div style="display:flex;gap:8px;font-size:.8rem;margin-bottom:5px;line-height:1.5"><span style="color:'+f.color+';font-weight:900">→</span><span>'+c+'</span></div>').join('')+
      '<div style="background:rgba(255,255,255,.05);border-radius:9px;padding:10px;margin-top:10px;font-size:.8rem">'+
        '<span style="font-weight:800;color:'+f.color+'">💬 Diskusi:</span> '+f.tanya+
      '</div>'+
    '</div>';
}
function switchFtabF(i){ curFtab=i; renderFtabUI(); }

// ── KUIS ─────────────────────────────────────────────
function renderKuis(){
  kuisAnswers={};
  if(!KUIS_SOAL.length){
    document.getElementById('kuisContainer').innerHTML='<div class="card" style="text-align:center;padding:30px;color:var(--muted)">Kuis belum diisi.</div>';
    return;
  }
  document.getElementById('kuisContainer').innerHTML=KUIS_SOAL.map((s,i)=>
    '<div class="q-card">'+
      '<div class="q-text">'+(i+1)+'. '+s.q+'</div>'+
      '<div class="q-opts">'+
        (s.opts||[]).map((o,j)=>
          '<div class="q-opt" id="qo_'+i+'_'+j+'" onclick="answerQ('+i+','+j+','+s.ans+')">'+
            '<span style="font-weight:900;color:var(--c)">'+'ABCD'[j]+'.</span> '+o+
          '</div>'
        ).join('')+
      '</div>'+
      '<div id="qfb_'+i+'" style="display:none" class="q-fb"></div>'+
    '</div>'
  ).join('');
}
function answerQ(qi,choice,correct){
  if(kuisAnswers[qi]!==undefined) return;
  kuisAnswers[qi]=choice;
  document.querySelectorAll('[id^="qo_'+qi+'_"]').forEach(o=>o.classList.add('dis'));
  document.getElementById('qo_'+qi+'_'+choice).classList.add(choice===correct?'ok':'no');
  if(choice!==correct) document.getElementById('qo_'+qi+'_'+correct).classList.add('shok');
  const fb=document.getElementById('qfb_'+qi);
  fb.style.display='block';
  fb.className='q-fb '+(choice===correct?'ok':'no');
  fb.textContent=(choice===correct?'✅ Benar! ':'❌ Salah. ')+(KUIS_SOAL[qi].ex||'');
  if(Object.keys(kuisAnswers).length===KUIS_SOAL.length)
    document.getElementById('btnKuisSubmit').style.display='inline-flex';
}
function submitKuis(){
  const correct=KUIS_SOAL.filter((_,i)=>kuisAnswers[i]===KUIS_SOAL[i].ans).length;
  const skor=Math.round((correct/KUIS_SOAL.length)*100);
  goScreen('s-hasil');
  const hc=document.getElementById('hasilCircle');
  hc.style.setProperty('--prog',skor+'%');
  document.getElementById('hasilNum').textContent=skor;
  const lv=document.getElementById('hasilLevel');
  if(skor>=85){lv.textContent='🌟 Sangat Baik!';lv.style.cssText='background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.3);color:var(--g);padding:10px 20px;border-radius:12px;display:inline-block';}
  else if(skor>=70){lv.textContent='👍 Baik';lv.style.cssText='background:rgba(249,193,46,.1);border:1px solid rgba(249,193,46,.3);color:var(--y);padding:10px 20px;border-radius:12px;display:inline-block';}
  else{lv.textContent='💪 Perlu Latihan';lv.style.cssText='background:rgba(255,107,107,.1);border:1px solid rgba(255,107,107,.3);color:var(--r);padding:10px 20px;border-radius:12px;display:inline-block';}
  if(skor>=70) launchConfetti();
}

// ── CONFETTI ─────────────────────────────────────────
function launchConfetti(){
  const w=document.getElementById('confWrap');
  const cols=['#f9c12e','#3ecfcf','#ff6b6b','#a78bfa','#34d399'];
  for(let i=0;i<80;i++){
    const c=document.createElement('div'); c.className='conf';
    const sz=4+Math.random()*9;
    c.style.cssText='left:'+Math.random()*100+'%;top:'+(-20-Math.random()*30)+'px;width:'+sz+'px;height:'+sz+'px;background:'+cols[Math.floor(Math.random()*cols.length)]+';border-radius:'+(Math.random()>.5?'50%':'2px')+';animation-duration:'+(2+Math.random()*2)+'s;animation-delay:'+(Math.random()*.6)+'s;';
    w.appendChild(c);
  }
  setTimeout(()=>w.innerHTML='',5000);
}

// ── Modules are now pre-rendered server-side via renderModuleToStyledHTML ──
// No client-side renderModules() needed — HTML is already in the DOM.

// Init
document.addEventListener('DOMContentLoaded', function(){});
<\/script>
</body>
</html>`;
}

// ── Render Materi Blok to HTML ──────────────────────────────────
function renderMateriBlok(blok: MateriBlok[]): string {
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

// ── Generate Print Admin HTML ──────────────────────────────────
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
