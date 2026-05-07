// ═══════════════════════════════════════════════════════════════
// CANVA EXPORT SLIDESHOW — Multi-page interactive HTML generator
// Extracted from canva-store.ts for maintainability
// ═══════════════════════════════════════════════════════════════

import type { CanvaPage, Ratio } from '@/components/canva/types';
import { RATIOS } from '@/components/canva/types';
import { useAuthoringStore } from '@/store/authoring-store';
import type { LayoutVariant } from '@/components/shared/PresetModuleCard';
import { GAME_ENGINE_CSS, buildGameEngineJS } from '@/lib/export-game-engines';
import {
  GAME_TYPES,
  renderTemplateExportHTML,
  renderElementsHTML,
  buildGameData,
  getGameEngineId,
} from '@/lib/canva-export-helpers';
import { buildScoreJS } from '@/lib/export-html/score-script';

// ── Slideshow HTML generator ──────────────────────────────────

export function exportSlideshowHTML(pages: CanvaPage[], ratioId: string): string {
  const ratio = RATIOS.find(r => r.id === ratioId) || RATIOS[0];
  const authStore = useAuthoringStore.getState();
  const allKuis = authStore.kuis.filter(k => k.q.trim());
  const allGameModules = authStore.modules.filter((m: Record<string, unknown>) => (GAME_TYPES as readonly string[]).includes(m.type as string));
  const allModules = authStore.modules;

  // ── Build slide HTML directly ──────────────────────────────
  const slidesHtml = pages.map((p, i) => {
    const pageBg = p.bgDataUrl
      ? `background-image:url('${p.bgDataUrl}');background-size:cover;background-position:center`
      : `background:${p.bgColor || '#1a1a2e'}`;
    const pageOverlay = p.bgDataUrl ? `<div style="position:absolute;inset:0;background:rgba(0,0,0,${(p.overlay ?? 20) / 100});pointer-events:none;z-index:0"></div>` : '';
    const paletteCSS = p.colorPalette?.mapping
      ? Object.entries(p.colorPalette.mapping).map(([k, v]) => `${k}:${v}`).join(';')
      : '';

    // Template-specific body (reuse renderTemplateExportHTML)
    const templateBody = renderTemplateExportHTML(p, i);

    // Element-based body for custom pages
    const elementsHTML = templateBody || renderElementsHTML(p, i, allModules, allGameModules);

    return `<div class="slide" data-slide="${i}" data-template="${p.templateType || 'custom'}" style="display:${i === 0 ? 'block' : 'none'};${pageBg};position:relative;overflow:hidden;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.5)">${pageOverlay}${paletteCSS ? `<style>:root{${paletteCSS}}</style>` : ''}${elementsHTML}</div>`;
  }).join('\n');

  // ── Build GAMEDATA for interactive game engines ────────────
  const gameData = buildGameData(pages, allKuis as unknown as Array<Record<string, unknown>>, allGameModules as unknown as Array<Record<string, unknown>>);
  const gamedataJSON = JSON.stringify(gameData).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
  const gameEngineJS = buildGameEngineJS(gamedataJSON);

  return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Interactive Slideshow</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0e1c2f;font-family:'Nunito',sans-serif;flex-direction:column;padding:0 0 64px 0;overflow:hidden}
#slide-wrap{position:relative;display:flex;align-items:center;justify-content:center;flex:1;min-height:0;width:100%}
.slide{position:relative;overflow:hidden;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.5);transform-origin:center center;transition:transform .1s ease}
#progress-wrap{position:fixed;top:0;left:0;right:0;height:4px;background:rgba(255,255,255,.06);z-index:1001}
#progress-fill{height:100%;background:linear-gradient(90deg,#f9c12e,#3ecfcf);transition:width .3s ease;border-radius:0 2px 2px 0}
#nav-bar{position:fixed;bottom:0;left:0;right:0;display:flex;align-items:center;justify-content:center;gap:10px;padding:10px 20px;background:rgba(14,28,47,.96);backdrop-filter:blur(14px);border-top:1px solid rgba(255,255,255,.06);z-index:1001}
.nav-btn{width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:#fff;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0}
.nav-btn:hover{background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.22)}
.nav-btn:disabled{opacity:.25;cursor:default}
#dots{display:flex;gap:6px;align-items:center;justify-content:center;flex-wrap:nowrap}
.dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.18);cursor:pointer;transition:all .3s;border:none;padding:0}
.dot.active{background:#f9c12e;transform:scale(1.4);box-shadow:0 0 8px rgba(249,193,46,.4)}
.dot.scored{box-shadow:0 0 0 2px rgba(52,211,153,.5);background:rgba(52,211,153,.35)}
.dot.scored.active{background:#34d399;box-shadow:0 0 8px rgba(52,211,153,.5)}
#score-badge{display:flex;align-items:center;gap:5px;padding:4px 12px;border-radius:20px;background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.25);color:#34d399;font-size:12px;font-weight:800;white-space:nowrap;flex-shrink:0}
#page-label{position:fixed;top:12px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,.35);font-size:11px;z-index:1001;font-weight:600;letter-spacing:.5px;text-transform:uppercase}
${GAME_ENGINE_CSS}
</style></head>
<body>
<div id="progress-wrap"><div id="progress-fill" style="width:0%"></div></div>
<div id="page-label"></div>
<div id="slide-wrap">
${slidesHtml}
</div>
<div id="nav-bar">
<button class="nav-btn" id="btn-prev" onclick="prevSlide()">&#9664;</button>
<div id="dots"></div>
<button class="nav-btn" id="btn-next" onclick="nextSlide()">&#9654;</button>
<div id="score-badge">&#11088; <span id="score-val">&mdash;</span></div>
</div>
<script>
var cur=0;
var total=${pages.length};
var SW=${ratio.w},SH=${ratio.h};
var slides=document.querySelectorAll('.slide');

function scaleSlide(){
  var wrap=document.getElementById('slide-wrap');
  if(!wrap)return;
  var aW=wrap.clientWidth-40;
  var aH=wrap.clientHeight-40;
  var sW=aW/SW;
  var sH=aH/SH;
  var scale=Math.min(sW,sH,1);
  slides.forEach(function(s){s.style.width=SW+'px';s.style.height=SH+'px';s.style.transform='scale('+scale+')'});
}

function showSlide(n){
  cur=n;
  slides.forEach(function(s,i){s.style.display=i===n?'block':'none'});
  updateDots();
  updateProgress();
  updateNavButtons();
  updatePageLabel();
  scaleSlide();
}
function nextSlide(){if(cur<total-1)showSlide(cur+1)}
function prevSlide(){if(cur>0)showSlide(cur-1)}

${buildScoreJS('multi')}

function updateScoreBadge(){
  var ts=0,tm=0;
  Object.keys(SCORE).forEach(function(k){ts+=SCORE[k].score;tm+=SCORE[k].max});
  var el=document.getElementById('score-val');
  if(el)el.textContent=tm>0?Math.round(ts/tm*100)+'%':'\\u2014';
}

function updateDots(){
  var dotsContainer=document.getElementById('dots');
  if(!dotsContainer)return;
  var dots=dotsContainer.querySelectorAll('.dot');
  dots.forEach(function(d,i){
    d.className='dot';
    if(i===cur)d.classList.add('active');
    if(SCORE[i])d.classList.add('scored');
  });
}

function updateProgress(){
  var fill=document.getElementById('progress-fill');
  if(fill)fill.style.width=((cur+1)/total*100)+'%';
}

function updateNavButtons(){
  var prev=document.getElementById('btn-prev');
  var next=document.getElementById('btn-next');
  if(prev)prev.disabled=cur===0;
  if(next)next.disabled=cur===total-1;
}

function updatePageLabel(){
  var el=document.getElementById('page-label');
  if(!el)return;
  var tmpl=slides[cur]?slides[cur].getAttribute('data-template'):'';
  var labels={cover:'Cover',materi:'Materi',kuis:'Kuis',game:'Game',hasil:'Hasil',dokumen:'Dokumen',hero:'Hero',skenario:'Skenario',custom:'Custom'};
  el.textContent=(labels[tmpl]||tmpl||'Slide')+' \\u2022 '+(cur+1)+'/'+total;
}

function buildDots(){
  var c=document.getElementById('dots');
  if(!c)return;
  c.innerHTML='';
  for(var i=0;i<total;i++){
    var d=document.createElement('button');
    d.className='dot'+(i===0?' active':'');
    d.setAttribute('aria-label','Slide '+(i+1));
    d.addEventListener('click',(function(idx){return function(){showSlide(idx)}})(i));
    c.appendChild(d);
  }
}

buildDots();
showSlide(0);
scaleSlide();

window.addEventListener('resize',scaleSlide);

document.addEventListener('keydown',function(e){
  if(e.key==='ArrowRight')nextSlide();
  if(e.key==='ArrowLeft')prevSlide();
});

var touchStartX=0,touchStartY=0,touchEndX=0,touchEndY=0;
document.addEventListener('touchstart',function(e){touchStartX=e.changedTouches[0].screenX;touchStartY=e.changedTouches[0].screenY},{passive:true});
document.addEventListener('touchend',function(e){
  touchEndX=e.changedTouches[0].screenX;touchEndY=e.changedTouches[0].screenY;
  var dx=touchEndX-touchStartX;
  var dy=touchEndY-touchStartY;
  if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>50){
    if(dx<0)nextSlide();else prevSlide();
  }
},{passive:true});

${gameEngineJS}

initAllGames();
<\/script></body></html>`;
}
