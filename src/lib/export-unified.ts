// ═══════════════════════════════════════════════════════════════════════
// UNIFIED EXPORT ENGINE — Single pipeline combining:
//   ✅ Smart named-screen navigation (from Template Export)
//   ✅ Canvas layout freedom (from Canvas Export)
//   ✅ 11+ Interactive game engines (from Canvas Export)
//   ✅ Score tracking + hasil page
//   ✅ Conditional screen flow (petunjuk, review, refleksi)
// ═══════════════════════════════════════════════════════════════════════

import type { CanvaPage } from '@/components/canva/types';
import { RATIOS } from '@/components/canva/types';
import { useAuthoringStore } from '@/store/authoring-store';
import { renderModuleToStyledHTML } from '@/lib/render-module-html';
import type { LayoutVariant } from '@/components/shared/PresetModuleCard';
import { GAME_ENGINE_CSS, buildGameEngineJS } from '@/lib/export-game-engines';
import {
  GAME_TYPES,
  renderTemplateExportHTML,
  renderElementsHTML,
  buildGameData,
  getGameEngineId,
  renderMateriBlokInline,
  getHeroData,
} from '@/lib/canva-export-helpers';
import { resolveModule } from '@/lib/module-resolver';
import type { ExportState } from '@/lib/export-html/types';
import { EXPORT_CSS } from '@/lib/export-html/styles';
import { FUNGSI_NORMA } from '@/lib/export-html/constants';
import { esc } from '@/lib/export-html/utils';

// ── Screen ID assignment for canva pages ──────────────────────────
// Maps each canva page to a named screen ID for smart navigation

const TEMPLATE_TO_SCREEN: Record<string, string> = {
  cover: 's-cover',
  dokumen: 's-cp',
  materi: 's-materi',
  kuis: 's-kuis',
  game: 's-games',
  hasil: 's-hasil',
  hero: 's-hero',
  skenario: 's-sk',
  petunjuk: 's-petunjuk',
  diskusi: 's-diskusi',
  refleksi: 's-refleksi',
  penutup: 's-penutup',
  custom: 's-custom',
};

function getScreenId(page: CanvaPage, pageIdx: number): string {
  if (page.templateType && page.templateType !== 'custom') {
    return TEMPLATE_TO_SCREEN[page.templateType] || `s-page-${pageIdx}`;
  }
  return `s-page-${pageIdx}`;
}

// ── Build smart navigation flow ──────────────────────────────────

interface NavNode {
  screenId: string;
  pageIdx: number;
  templateType: string;
  label: string;
}

function buildNavigationFlow(pages: CanvaPage[]): {
  nodes: NavNode[];
  nextMap: Record<string, string>;
  prevMap: Record<string, string>;
} {
  const nodes: NavNode[] = pages.map((p, i) => ({
    screenId: getScreenId(p, i),
    pageIdx: i,
    templateType: p.templateType || 'custom',
    label: p.label || `Halaman ${i + 1}`,
  }));

  const nextMap: Record<string, string> = {};
  const prevMap: Record<string, string> = {};

  for (let i = 0; i < nodes.length; i++) {
    if (i < nodes.length - 1) {
      nextMap[nodes[i].screenId] = nodes[i + 1].screenId;
    }
    if (i > 0) {
      prevMap[nodes[i].screenId] = nodes[i - 1].screenId;
    }
  }

  return { nodes, nextMap, prevMap };
}

// ── Main export function ─────────────────────────────────────────

export function exportUnifiedHTML(
  pages: CanvaPage[],
  ratioId: string,
  mode: 'canva' | 'template' = 'canva',
): string {
  const ratio = RATIOS.find(r => r.id === ratioId) || RATIOS[0];
  const authStore = useAuthoringStore.getState();
  const allKuis = authStore.kuis.filter(k => k.q.trim());
  const allModules = authStore.modules;
  const allGameModules = authStore.modules.filter(
    (m: Record<string, unknown>) => (GAME_TYPES as readonly string[]).includes(m.type as string)
  );

  // ── Build navigation flow ──────────────────────────────────────
  const { nodes, nextMap, prevMap } = buildNavigationFlow(pages);

  // ── Build GAMEDATA for interactive game engines ────────────────
  const gameData = buildGameData(
    pages,
    allKuis as unknown as Array<Record<string, unknown>>,
    allGameModules as unknown as Array<Record<string, unknown>>
  );
  const gamedataJSON = JSON.stringify(gameData).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
  const gameEngineJS = buildGameEngineJS(gamedataJSON);

  // ── Build screen HTML ──────────────────────────────────────────
  const screensHtml = pages.map((p, i) => {
    const screenId = getScreenId(p, i);
    const isActive = i === 0 ? ' active' : '';
    const pageBg = p.bgDataUrl
      ? `background-image:url('${p.bgDataUrl}');background-size:cover;background-position:center`
      : `background:${p.bgColor || 'var(--bg)'}`;

    const pageOverlay = p.bgDataUrl
      ? `<div style="position:absolute;inset:0;background:rgba(0,0,0,${(p.overlay ?? 20) / 100});pointer-events:none;z-index:0"></div>`
      : '';

    const nav = nodes[i];
    const nextScreen = nextMap[screenId];
    const prevScreen = prevMap[screenId];
    const progressPct = Math.round(((i + 1) / pages.length) * 100);
    const meta = authStore.meta;

    // Template-specific body
    const templateBody = renderTemplateExportHTML(p, i);
    // Element-based body for custom pages (includes overlay fix)
    const customElementsHTML = renderElementsHTML(p, i, allModules, allGameModules);

    // For template pages with overlay elements, render template body + overlay on top
    let elementsHTML: string;
    if (templateBody) {
      // Template page: render template content + overlay elements on top
      const overlayEls = (p.overlayElements || []).filter(el => !el.hidden);
      const overlayHTML = overlayEls.length > 0
        ? overlayEls.map(el => {
            // Import renderSingleElement from helpers — inline here for overlay
            const style = `position:absolute;left:${el.x}%;top:${el.y}%;width:${el.w}%;height:${el.h}%;opacity:${(el.opacity || 100) / 100};pointer-events:auto`;
            if (el.type === 'teks') {
              return `<div style="${style};z-index:20"><div style="font-size:${el.fontSize || 20}px;font-weight:700;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.5);padding:8px;line-height:1.4">${el.text || ''}</div></div>`;
            }
            if (el.type === 'shape') {
              return `<div style="${style};z-index:20"><div style="width:100%;height:100%;background:${el.color || 'rgba(255,255,255,.15)'};border-radius:${el.radius || 8}px"></div></div>`;
            }
            if (el.type === 'kuis') {
              return `<div id="quiz-engine-${i}" style="${style};z-index:20;background:rgba(245,200,66,.08);border:1px solid rgba(245,200,66,.2);border-radius:8px;padding:10px;overflow:hidden;display:flex;flex-direction:column"></div>`;
            }
            if (el.type === 'game') {
              const gMod = resolveModule(el, allGameModules);
              const gType = (gMod?.type as string) || 'game';
              const engineId = getGameEngineId(gType, i, 0);
              return `<div id="${engineId}" style="${style};z-index:20;background:rgba(56,217,217,.08);border:1px solid rgba(56,217,217,.2);border-radius:8px;overflow:hidden;display:flex;flex-direction:column"></div>`;
            }
            if (el.type === 'modul' || el.type === 'materi') {
              const mod = resolveModule(el, allModules);
              const variant = (el.layoutVariant as LayoutVariant) || 'A';
              if (mod) return `<div style="${style};z-index:20;overflow-y:auto;padding:8px">${renderModuleToStyledHTML(mod, variant)}</div>`;
              return `<div style="${style};z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(167,139,250,.08);border:1px solid rgba(167,139,250,.2);border-radius:8px"><div style="font-size:1.5rem">🧩</div><div style="font-size:10px;color:rgba(167,139,250,.6);margin-top:4px">Modul</div></div>`;
            }
            return `<div style="${style};z-index:20;display:flex;align-items:center;justify-content:center"><div style="font-size:1.5rem">${el.icon || ''}</div></div>`;
          }).join('\n    ')
        : '';
      elementsHTML = templateBody + (overlayHTML ? `<div style="position:absolute;inset:0;z-index:20;pointer-events:none">${overlayHTML}</div>` : '');
    } else {
      elementsHTML = customElementsHTML;
    }

    // Build nav bar
    const navbarHtml = `
      <nav class="navbar">
        <span class="nav-logo">${esc(meta.namaBab || meta.judulPertemuan || 'Media')}</span>
        <div class="nav-prog"><div class="nav-prog-fill" style="width:${progressPct}%"></div></div>
        <span class="nav-score" id="nav-score-${i}">0 ⭐</span>
      </nav>`;

    // Build navigation buttons
    const nextBtn = nextScreen
      ? `<button class="btn btn-y" onclick="goScreen('${nextScreen}')">Lanjut →</button>`
      : `<button class="btn btn-g" onclick="launchConfetti()">🎉 Selesai!</button>`;
    const prevBtn = prevScreen
      ? `<button class="btn btn-ghost" onclick="goScreen('${prevScreen}')">← Kembali</button>`
      : '';

    // For template pages with specific content, use a cleaner layout
    const isFullPageTemplate = ['cover', 'hasil', 'hero'].includes(p.templateType);
    const contentWrapperStyle = isFullPageTemplate
      ? 'flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:36px 18px'
      : 'flex:1;padding:22px 16px;max-width:860px;width:100%;margin:0 auto';

    return `<div class="screen${isActive}" id="${screenId}" style="${pageBg};position:relative">
      ${pageOverlay}
      ${p.templateType !== 'cover' ? navbarHtml : ''}
      <div class="main" style="${contentWrapperStyle};position:relative">
        ${elementsHTML}
        ${p.templateType !== 'cover' && p.templateType !== 'hasil' ? `
          <div class="btn-row btn-center" style="margin-top:20px">
            ${nextBtn}
            ${prevBtn}
          </div>` : ''}
      </div>
    </div>`;
  }).join('\n');

  // ── Build navigation JS ────────────────────────────────────────
  const nextMapJS = JSON.stringify(nextMap);
  const prevMapJS = JSON.stringify(prevMap);
  const nodesJS = JSON.stringify(nodes.map(n => ({ id: n.screenId, label: n.label, template: n.templateType })));

  const navScript = `
<script>
// ── Screen Navigation System ──────────────────────────────────
var NEXT_MAP = ${nextMapJS};
var PREV_MAP = ${prevMapJS};
var NODES = ${nodesJS};
var currentScreen = '${nodes[0]?.screenId || 's-cover'}';
var SCORE = {};

function goScreen(id) {
  // Hide all screens
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
  // Show target
  var el = document.getElementById(id);
  if (el) {
    el.classList.add('active');
    currentScreen = id;
    window.scrollTo(0, 0);
  }
  updateNavScore();
}

function nextScreen() {
  var next = NEXT_MAP[currentScreen];
  if (next) goScreen(next);
}

function prevScreen() {
  var prev = PREV_MAP[currentScreen];
  if (prev) goScreen(prev);
}

function reportScore(pageIdx, score, max) {
  SCORE[pageIdx] = { score: score, max: max, pct: max > 0 ? Math.round(score / max * 100) : 0 };
  updateNavScore();
  updateHasilCircle();
}

function updateNavScore() {
  var ts = 0, tm = 0;
  Object.keys(SCORE).forEach(function(k) { ts += SCORE[k].score; tm += SCORE[k].max; });
  var pct = tm > 0 ? Math.round(ts / tm * 100) : 0;
  document.querySelectorAll('[id^="nav-score-"]').forEach(function(el) {
    el.textContent = (tm > 0 ? pct + '%' : '0') + ' ⭐';
  });
}

function updateHasilCircle() {
  var ts = 0, tm = 0;
  Object.keys(SCORE).forEach(function(k) { ts += SCORE[k].score; tm += SCORE[k].max; });
  var pct = tm > 0 ? Math.round(ts / tm * 100) : 0;
  var col = pct >= 85 ? '#34d399' : pct >= 70 ? '#f9c12e' : '#f87171';
  var lvl = pct >= 85 ? 'Sangat Baik' : pct >= 70 ? 'Baik' : pct > 0 ? 'Perlu Latihan' : '';
  // Update hasil circle if present
  var circle = document.getElementById('hasil-circle-wrap');
  if (circle) {
    var deg = tm > 0 ? (ts / tm * 360) : 0;
    circle.style.background = 'conic-gradient(' + col + ' ' + deg + 'deg, rgba(255,255,255,.08) ' + deg + 'deg)';
  }
  var pctEl = document.getElementById('hasil-score-pct');
  if (pctEl) { pctEl.textContent = pct + '%'; pctEl.style.color = col; }
  var lvlEl = document.getElementById('hasil-level-label');
  if (lvlEl) { lvlEl.textContent = lvl; lvlEl.style.color = col; }
  var detailEl = document.getElementById('hasil-score-detail');
  if (detailEl) { detailEl.textContent = tm > 0 ? ts + ' dari ' + tm + ' jawaban benar' : 'Kerjakan kuis untuk melihat skor'; }
}

// ── Keyboard navigation ───────────────────────────────────────
document.addEventListener('keydown', function(e) {
  if (e.key === 'ArrowRight') nextScreen();
  if (e.key === 'ArrowLeft') prevScreen();
  if (e.key === 'Escape') goScreen('${nodes[0]?.screenId || 's-cover'}');
});

// ── Touch/swipe support ───────────────────────────────────────
var touchStartX = 0;
document.addEventListener('touchstart', function(e) { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
document.addEventListener('touchend', function(e) {
  var dx = e.changedTouches[0].screenX - touchStartX;
  if (Math.abs(dx) > 50) { if (dx < 0) nextScreen(); else prevScreen(); }
}, { passive: true });

// ── Confetti ──────────────────────────────────────────────────
function launchConfetti() {
  var wrap = document.getElementById('confWrap');
  if (!wrap) return;
  var colors = ['#f9c12e','#3ecfcf','#34d399','#a78bfa','#ff6b6b','#fb923c'];
  for (var i = 0; i < 60; i++) {
    var c = document.createElement('div');
    c.className = 'conf';
    c.style.cssText = 'left:' + (Math.random() * 100) + '%;top:-10px;width:' + (4 + Math.random() * 6) + 'px;height:' + (4 + Math.random() * 6) + 'px;background:' + colors[Math.floor(Math.random() * colors.length)] + ';animation-duration:' + (1.5 + Math.random() * 2) + 's;animation-delay:' + (Math.random() * .5) + 's';
    wrap.appendChild(c);
    setTimeout(function(el) { el.remove(); }, 4000, c);
  }
}

// ── Initialize game engines ───────────────────────────────────
${gameEngineJS}

initAllGames();
<\/script>`;

  // ── Assemble final HTML ────────────────────────────────────────
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(authStore.meta.judulPertemuan || 'Media Pembelajaran Interaktif')} | ${esc(authStore.meta.mapel || '')} ${esc(authStore.meta.kelas || '')}</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&display=swap" rel="stylesheet">
<style>
${EXPORT_CSS}
${GAME_ENGINE_CSS}
</style>
</head>
<body>
<div id="confWrap"></div>
${screensHtml}
${navScript}
</body>
</html>`;
}
