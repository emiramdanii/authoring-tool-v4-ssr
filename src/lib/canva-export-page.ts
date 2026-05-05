// ═══════════════════════════════════════════════════════════════
// CANVA EXPORT PAGE — Single-page HTML generator
// Extracted from canva-store.ts for maintainability
// ═══════════════════════════════════════════════════════════════

import type { CanvaPage } from '@/components/canva/types';
import { RATIOS } from '@/components/canva/types';
import { useAuthoringStore } from '@/store/authoring-store';
import { GAME_ENGINE_CSS, buildGameEngineJS } from '@/lib/export-game-engines';
import {
  GAME_TYPES,
  renderTemplateExportHTML,
  renderElementsHTML,
  buildPageGameData,
} from '@/lib/canva-export-helpers';

// ── Single-page HTML generator ────────────────────────────────

export function exportPageHTML(page: CanvaPage, pageIdx: number, ratioId: string): string {
  const ratio = RATIOS.find(r => r.id === ratioId) || RATIOS[0];
  const authStore = useAuthoringStore.getState();
  const allModules = authStore.modules;
  const allKuis = authStore.kuis.filter(k => k.q.trim()) as unknown as Array<Record<string, unknown>>;
  const allGameModules = authStore.modules.filter((m: Record<string, unknown>) => (GAME_TYPES as readonly string[]).includes(m.type as string)) as Array<Record<string, unknown>>;

  const bgStyle = page.bgDataUrl
    ? `background-image:url('${page.bgDataUrl}');background-size:cover;background-position:center`
    : `background:${page.bgColor || '#1a1a2e'}`;

  // Overlay for background images
  const overlayPct = page.bgDataUrl ? (page.overlay ?? 20) : 0;
  const overlayDiv = overlayPct > 0 ? `<div style="position:absolute;inset:0;background:rgba(0,0,0,${overlayPct / 100});pointer-events:none;z-index:0"></div>` : '';

  // CSS variables from color palette
  const paletteCSS = page.colorPalette?.mapping
    ? Object.entries(page.colorPalette.mapping).map(([k, v]) => `${k}:${v}`).join(';')
    : '';

  // Template-specific HTML
  const templateBody = renderTemplateExportHTML(page, pageIdx);

  // Element-based HTML for custom pages
  const elementsHTML = templateBody || renderElementsHTML(page, pageIdx, allModules, allGameModules);

  // ── Build GAMEDATA for interactive game engines ────────────
  const gameData = buildPageGameData(page, pageIdx, allKuis, allGameModules);
  const gamedataJSON = JSON.stringify(gameData).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
  const gameEngineJS = buildGameEngineJS(gamedataJSON);

  // Hasil page score update function
  const hasilJS = page.templateType === 'hasil' ? `
function updateHasil(){
  var ts=0,tm=0;
  Object.keys(SCORE).forEach(function(k){ts+=SCORE[k].score;tm+=SCORE[k].max});
  var pct=tm>0?Math.round(ts/tm*100):0;
  var col=pct>=85?'#34d399':pct>=70?'#f9c12e':'#f87171';
  var lvl=pct>=85?'Sangat Baik':pct>=70?'Baik':pct>0?'Perlu Latihan':'';
  var pctEl=document.getElementById('hasil-score-pct');
  var detailEl=document.getElementById('hasil-score-detail');
  var circleWrap=document.getElementById('hasil-circle-wrap');
  var levelLabel=document.getElementById('hasil-level-label');
  if(pctEl){pctEl.textContent=pct+'%';pctEl.style.color=col}
  if(circleWrap){var deg=tm>0?(ts/tm*360):0;circleWrap.style.background='conic-gradient('+col+' '+deg+'deg,rgba(255,255,255,.08) '+deg+'deg)'}
  if(levelLabel){levelLabel.textContent=lvl;levelLabel.style.color=col}
  if(detailEl){detailEl.textContent=tm>0?ts+' dari '+tm+' jawaban benar':'Kerjakan kuis untuk melihat skor'}
}
function reportScore(pageIdx,score,max){
  SCORE[pageIdx]={score:score,max:max,pct:max>0?Math.round(score/max*100):0};
  if(typeof updateHasil==='function')updateHasil();
}
var SCORE={};` : 'var SCORE={};function reportScore(){}';

  return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${page.label}</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0e0c15;font-family:'Nunito',sans-serif}
.slide{position:relative;width:${ratio.w}px;height:${ratio.h}px;overflow:hidden;${bgStyle}${paletteCSS ? ';' + paletteCSS : ''}}
${GAME_ENGINE_CSS}
</style></head>
<body><div class="slide" data-slide="${pageIdx}">${overlayDiv}${elementsHTML}</div>
<script>
${hasilJS}

${gameEngineJS}

initAllGames();
<\/script></body></html>`;
}
