// ═══════════════════════════════════════════════════════════════════════
// UNIFIED EXPORT ENGINE — Single pipeline:
//   ✅ Smart named-screen navigation
//   ✅ Canvas layout freedom
//   ✅ 11+ Interactive game engines
//   ✅ Score tracking + hasil page
//   ✅ Top navbar (logo + progress + score) — matches preset
//   ✅ Bottom nav bar (prev/next + dots + score) — matches preview
//   ✅ Context-aware button labels
// ═══════════════════════════════════════════════════════════════════════

import type { CanvaPage } from '@/components/canva/types';
import { RATIOS } from '@/components/canva/types';
import { useAuthoringStore } from '@/store/authoring-store';

import { GAME_ENGINE_CSS, buildGameEngineJS } from '@/lib/export-game-engines';
import {
  GAME_TYPES,
  renderTemplateExportHTML,
  renderElementsHTML,
  buildGameData,
  getGameEngineId,
  renderSingleElement,
} from '@/lib/canva-export-helpers';
import { EXPORT_CSS } from '@/lib/export-html/styles';
import { esc } from '@/lib/export-html/utils';
import { buildScoreJS } from '@/lib/export-html/score-script';

// ── Screen ID assignment ────────────────────────────────────────

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

const TEMPLATE_ICON: Record<string, string> = {
  cover: '🏠', dokumen: '📋', materi: '📝', kuis: '❓',
  game: '🎮', hasil: '🏆', hero: '🚀', skenario: '🎭',
  petunjuk: '📌', diskusi: '💬', refleksi: '🪞', penutup: '🎓',
  custom: '⬜',
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

// ── Context-aware button labels ──────────────────────────────────

function getNextButtonLabel(templateType: string, nextTemplateType: string): string {
  switch (templateType) {
    case 'cover': return 'Mulai Belajar →';
    case 'petunjuk': return 'Tujuan Pembelajaran →';
    case 'dokumen': return 'Mulai Pembelajaran →';
    case 'skenario':
      if (nextTemplateType === 'materi') return 'Lanjut ke Materi →';
      if (nextTemplateType === 'kuis') return 'Lanjut ke Kuis →';
      return 'Lanjut →';
    case 'materi':
      if (nextTemplateType === 'kuis') return 'Mulai Kuis ❓';
      return 'Lanjut →';
    case 'refleksi': return 'Lihat Hasil →';
    case 'penutup': return 'Lihat Hasil →';
    default: return 'Lanjut →';
  }
}

function findNextTemplateType(nodes: NavNode[], currentIndex: number): string {
  if (currentIndex < nodes.length - 1) {
    return nodes[currentIndex + 1].templateType;
  }
  return '';
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

  // ── Build GAMEDATA ─────────────────────────────────────────────
  const gameData = buildGameData(
    pages,
    allKuis as unknown as Array<Record<string, unknown>>,
    allGameModules as unknown as Array<Record<string, unknown>>
  );
  const gamedataJSON = JSON.stringify(gameData).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
  const gameEngineJS = buildGameEngineJS(gamedataJSON);

  const meta = authStore.meta;

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

    const nextScreen = nextMap[screenId];
    const prevScreen = prevMap[screenId];
    const progressPct = Math.round(((i + 1) / pages.length) * 100);
    const templateType = p.templateType || 'custom';
    const nextTemplateType = findNextTemplateType(nodes, i);

    // Template-specific body
    const templateBody = renderTemplateExportHTML(p, i);
    const customElementsHTML = renderElementsHTML(p, i, allModules, allGameModules);

    // For template pages with overlay elements
    let elementsHTML: string;
    if (templateBody) {
      const overlayEls = (p.overlayElements || []).filter(el => !el.hidden);
      const overlayHTML = overlayEls.length > 0
        ? overlayEls.map(el => {
            const baseHtml = renderSingleElement(el, i, allModules, allGameModules, 'quiz-engine-');
            return baseHtml.replace(/style="position:/, 'style="z-index:20;pointer-events:auto;position:');
          }).join('\n    ')
        : '';
      elementsHTML = templateBody + (overlayHTML ? `<div style="position:absolute;inset:0;z-index:20;pointer-events:none">${overlayHTML}</div>` : '');
    } else {
      elementsHTML = customElementsHTML;
    }

    // ── Top navbar (logo + progress + score) ────────────────────
    const navbarHtml = templateType === 'cover' ? '' : `
      <nav class="navbar">
        <span class="nav-logo">${esc(meta.namaBab || meta.judulPertemuan || 'Media')}</span>
        <div class="nav-prog"><div class="nav-prog-fill" style="width:${progressPct}%"></div></div>
        <span class="nav-score" id="nav-score-${i}">0 ⭐</span>
      </nav>`;

    // ── Content button (context-aware, inside content area) ─────
    // Only for cover and hasil pages — other pages rely on bottom nav
    let contentBtnHtml = '';

    if (templateType === 'cover') {
      // Cover: "Mulai Belajar →" button inside content
      if (nextScreen) {
        contentBtnHtml = `
        <div class="btn-row btn-center" style="margin-top:24px">
          <button class="btn btn-y" onclick="goScreen('${nextScreen}')">${getNextButtonLabel(templateType, nextTemplateType)}</button>
        </div>`;
      } else {
        contentBtnHtml = `
        <div class="btn-row btn-center" style="margin-top:24px">
          <button class="btn btn-g" onclick="launchConfetti()">🎉 Selesai!</button>
        </div>`;
      }
    } else if (templateType === 'hasil') {
      // Hasil: "Selesai" + "Ulangi" buttons
      contentBtnHtml = `
        <div class="btn-row btn-center" style="margin-top:20px">
          <button class="btn btn-y" onclick="launchConfetti()">🎉 Selesai!</button>
          <button class="btn btn-ghost" onclick="goScreen('${nodes[0]?.screenId || 's-cover'}')">↩ Ulangi</button>
        </div>`;
    } else if (templateType === 'kuis') {
      // Kuis: show "Lanjut" button after quiz completion
      contentBtnHtml = `
        <div class="btn-row btn-center" style="margin-top:14px">
          ${nextScreen ? `<button class="btn btn-y" id="btnKuisNext-${i}" onclick="goScreen('${nextScreen}')" style="display:none">${getNextButtonLabel(templateType, nextTemplateType)}</button>` : ''}
          ${prevScreen ? `<button class="btn btn-ghost" onclick="goScreen('${prevScreen}')">← Kembali</button>` : ''}
        </div>`;
    } else if (templateType === 'skenario') {
      // Skenario: "Lanjut" button
      contentBtnHtml = `
        <div class="btn-row btn-center" style="margin-top:14px">
          ${nextScreen ? `<button class="btn btn-y" id="btnSkNext-${i}" onclick="goScreen('${nextScreen}')">${getNextButtonLabel(templateType, nextTemplateType)}</button>` : ''}
          ${prevScreen ? `<button class="btn btn-ghost" onclick="goScreen('${prevScreen}')">← Kembali</button>` : ''}
        </div>`;
    }

    // ── Content wrapper style ───────────────────────────────────
    const isFullPageTemplate = ['cover', 'hasil', 'hero'].includes(templateType);
    const contentWrapperStyle = isFullPageTemplate
      ? 'flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:36px 18px'
      : 'flex:1;padding:22px 16px;max-width:860px;width:100%;margin:0 auto';

    // ── Assemble screen ─────────────────────────────────────────
    if (templateType === 'cover') {
      return `<div class="screen${isActive}" id="${screenId}" style="${pageBg};position:relative">
      ${pageOverlay}
      <div class="main" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:36px 18px;position:relative">
        ${elementsHTML}
        ${contentBtnHtml}
      </div>
    </div>`;
    }

    // All other pages: navbar + content
    return `<div class="screen${isActive}" id="${screenId}" style="${pageBg};position:relative">
      ${pageOverlay}
      ${navbarHtml}
      <div class="main" style="${contentWrapperStyle};position:relative">
        ${elementsHTML}
        ${contentBtnHtml}
      </div>
    </div>`;
  }).join('\n');

  // ── Build bottom navigation bar (matches InteractiveNav preview) ──
  const bottomNavDots = nodes.map((n, i) => {
    const icon = TEMPLATE_ICON[n.templateType] || '📄';
    return `<button class="bottom-nav-dot${i === 0 ? ' active' : ''}" data-idx="${i}" data-screen="${n.screenId}" onclick="goScreen('${n.screenId}')" title="${n.label} (${i + 1}/${nodes.length})">${icon}</button>`;
  }).join('');

  const bottomNavHtml = `
  <div class="bottom-nav" id="bottomNav">
    <div class="bottom-nav-progress"><div class="bottom-nav-progress-fill" id="bottomNavProgress" style="width:${nodes.length > 0 ? Math.round(100 / nodes.length) : 0}%"></div></div>
    <div class="bottom-nav-bar">
      <button class="bottom-nav-btn prev" id="btnPrev" onclick="prevScreen()" disabled>← Prev</button>
      <div class="bottom-nav-dots" id="bottomNavDots">
        ${bottomNavDots}
      </div>
      <div class="bottom-nav-info">
        <div class="bottom-nav-score" id="bottomNavScore">⭐ 0</div>
        <span class="bottom-nav-counter" id="bottomNavCounter">1/${nodes.length}</span>
        <button class="bottom-nav-btn next" id="btnNext" onclick="nextScreen()">Next →</button>
      </div>
    </div>
    <button class="bottom-nav-reset" id="btnReset" onclick="resetAll()" style="display:none">↩ Ulangi Semua</button>
  </div>`;

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
var currentIdx = 0;
var totalScore = 0;
var totalMax = 0;

function findIdx(screenId) {
  for (var i = 0; i < NODES.length; i++) {
    if (NODES[i].id === screenId) return i;
  }
  return 0;
}

function goScreen(id) {
  // Hide all screens
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
  // Show target
  var el = document.getElementById(id);
  if (el) {
    el.classList.add('active');
    currentScreen = id;
    currentIdx = findIdx(id);
    window.scrollTo(0, 0);
  }
  updateBottomNav();
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

function updateBottomNav() {
  var total = NODES.length;
  var idx = currentIdx;
  var pct = total > 0 ? Math.round(((idx + 1) / total) * 100) : 0;

  // Progress bar
  var prog = document.getElementById('bottomNavProgress');
  if (prog) prog.style.width = pct + '%';

  // Counter
  var counter = document.getElementById('bottomNavCounter');
  if (counter) counter.textContent = (idx + 1) + '/' + total;

  // Prev/Next buttons
  var btnPrev = document.getElementById('btnPrev');
  var btnNext = document.getElementById('btnNext');
  if (btnPrev) btnPrev.disabled = (idx <= 0);

  // Context-aware next label
  var currentTemplate = NODES[idx] ? NODES[idx].template : 'custom';
  var nextTemplate = NODES[idx + 1] ? NODES[idx + 1].template : '';
  if (btnNext) {
    btnNext.disabled = (idx >= total - 1);
    if (idx >= total - 1) {
      btnNext.textContent = '🎉 Selesai';
      btnNext.className = 'bottom-nav-btn next';
      btnNext.style.background = 'var(--g)';
      btnNext.onclick = function() { launchConfetti(); };
    } else {
      btnNext.textContent = getNextLabel(currentTemplate, nextTemplate);
      btnNext.className = 'bottom-nav-btn next';
      btnNext.style.background = '';
      btnNext.onclick = function() { nextScreen(); };
    }
  }

  // Dots: update active state
  document.querySelectorAll('.bottom-nav-dot').forEach(function(dot, i) {
    if (i === idx) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });

  // Score display
  updateScoreDisplay();
}

function getNextLabel(templateType, nextTemplateType) {
  switch (templateType) {
    case 'cover': return 'Mulai →';
    case 'petunjuk': return 'Tujuan →';
    case 'dokumen': return 'Mulai →';
    case 'skenario':
      if (nextTemplateType === 'materi') return 'Materi →';
      if (nextTemplateType === 'kuis') return 'Kuis →';
      return 'Lanjut →';
    case 'materi':
      if (nextTemplateType === 'kuis') return 'Kuis ❓';
      return 'Lanjut →';
    case 'refleksi': return 'Hasil →';
    case 'penutup': return 'Hasil →';
    default: return 'Lanjut →';
  }
}

function updateNavScore() {
  // Update top navbar score for current page
  var scoreEl = document.getElementById('nav-score-' + currentIdx);
  if (scoreEl) scoreEl.textContent = totalScore + ' ⭐';
}

function updateScoreDisplay() {
  // Bottom nav score
  var scoreEl = document.getElementById('bottomNavScore');
  if (scoreEl) {
    if (totalMax > 0) {
      var pct = Math.round((totalScore / totalMax) * 100);
      scoreEl.textContent = '⭐ ' + totalScore + '/' + totalMax + ' (' + pct + '%)';
    } else {
      scoreEl.textContent = '⭐ 0';
    }
  }
  // Show reset button when there's score
  var resetBtn = document.getElementById('btnReset');
  if (resetBtn) resetBtn.style.display = totalMax > 0 ? 'flex' : 'none';
}

function reportScore(score, max) {
  totalScore += score;
  totalMax += max;
  updateScoreDisplay();
  updateNavScore();
}

function resetAll() {
  totalScore = 0;
  totalMax = 0;
  updateScoreDisplay();
  goScreen('${nodes[0]?.screenId || 's-cover'}');
}

${buildScoreJS('multi')}

// ── Show quiz next button after quiz completes ────────────────
function showKuisNextButton(pageIdx) {
  var btn = document.getElementById('btnKuisNext-' + pageIdx);
  if (btn) btn.style.display = '';
}

// ── Keyboard navigation ───────────────────────────────────────
document.addEventListener('keydown', function(e) {
  var tag = (e.target || {}).tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  if (e.key === 'ArrowRight') { e.preventDefault(); nextScreen(); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); prevScreen(); }
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

// ── Initialize ────────────────────────────────────────────────
updateBottomNav();

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
${bottomNavHtml}
${navScript}
</body>
</html>`;
}
