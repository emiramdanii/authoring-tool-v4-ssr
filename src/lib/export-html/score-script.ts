// ═══════════════════════════════════════════════════════════════
// SHARED SCORE JS — Single source of truth for score tracking JS
// Used by export-unified, export-page, and export-slideshow
// ═══════════════════════════════════════════════════════════════

/**
 * Generates the shared score tracking JavaScript used by all 3 export pipelines.
 * Includes: reportScore(), updateHasil() circle, and updateNavScore() logic.
 *
 * @param mode - 'multi' for multi-page (with nav score), 'single' for single-page
 * @returns JS string to embed in the export HTML
 */
export function buildScoreJS(mode: 'multi' | 'single' = 'multi'): string {
  if (mode === 'single') {
    return `
var SCORE = {};

function reportScore(pageIdx, score, max) {
  SCORE[pageIdx] = { score: score, max: max, pct: max > 0 ? Math.round(score / max * 100) : 0 };
  if (typeof updateHasil === 'function') updateHasil();
}

function updateHasil() {
  var ts = 0, tm = 0;
  Object.keys(SCORE).forEach(function(k) { ts += SCORE[k].score; tm += SCORE[k].max; });
  var pct = tm > 0 ? Math.round(ts / tm * 100) : 0;
  var col = pct >= 85 ? '#34d399' : pct >= 70 ? '#f9c12e' : '#f87171';
  var lvl = pct >= 85 ? 'Sangat Baik' : pct >= 70 ? 'Baik' : pct > 0 ? 'Perlu Latihan' : '';
  var pctEl = document.getElementById('hasil-score-pct');
  var detailEl = document.getElementById('hasil-score-detail');
  var circleWrap = document.getElementById('hasil-circle-wrap');
  var levelLabel = document.getElementById('hasil-level-label');
  if (pctEl) { pctEl.textContent = pct + '%'; pctEl.style.color = col; }
  if (circleWrap) { var deg = tm > 0 ? (ts / tm * 360) : 0; circleWrap.style.background = 'conic-gradient(' + col + ' ' + deg + 'deg, rgba(255,255,255,.08) ' + deg + 'deg)'; }
  if (levelLabel) { levelLabel.textContent = lvl; levelLabel.style.color = col; }
  if (detailEl) { detailEl.textContent = tm > 0 ? ts + ' dari ' + tm + ' jawaban benar' : 'Kerjakan kuis untuk melihat skor'; }
}`;
  }

  // Multi-page mode (used by export-unified and export-slideshow)
  return `
var SCORE = {};

function reportScore(pageIdx, score, max) {
  SCORE[pageIdx] = { score: score, max: max, pct: max > 0 ? Math.round(score / max * 100) : 0 };
  if (typeof updateHasil === 'function') updateHasil();
  if (typeof updateNavScore === 'function') updateNavScore();
  if (typeof updateDots === 'function') updateDots();
}

function updateHasil() {
  var ts = 0, tm = 0;
  Object.keys(SCORE).forEach(function(k) { ts += SCORE[k].score; tm += SCORE[k].max; });
  var pct = tm > 0 ? Math.round(ts / tm * 100) : 0;
  var col = pct >= 85 ? '#34d399' : pct >= 70 ? '#f9c12e' : '#f87171';
  var lvl = pct >= 85 ? 'Sangat Baik' : pct >= 70 ? 'Baik' : pct > 0 ? 'Perlu Latihan' : '';
  var pctEl = document.getElementById('hasil-score-pct');
  var detailEl = document.getElementById('hasil-score-detail');
  var circleWrap = document.getElementById('hasil-circle-wrap');
  var levelLabel = document.getElementById('hasil-level-label');
  if (pctEl) { pctEl.textContent = pct + '%'; pctEl.style.color = col; }
  if (circleWrap) { var deg = tm > 0 ? (ts / tm * 360) : 0; circleWrap.style.background = 'conic-gradient(' + col + ' ' + deg + 'deg, rgba(255,255,255,.08) ' + deg + 'deg)'; }
  if (levelLabel) { levelLabel.textContent = lvl; levelLabel.style.color = col; }
  if (detailEl) { detailEl.textContent = tm > 0 ? ts + ' dari ' + tm + ' jawaban benar' : 'Kerjakan kuis untuk melihat skor'; }
}

function updateNavScore() {
  var ts = 0, tm = 0;
  Object.keys(SCORE).forEach(function(k) { ts += SCORE[k].score; tm += SCORE[k].max; });
  var pct = tm > 0 ? Math.round(ts / tm * 100) : 0;
  document.querySelectorAll('[id^="nav-score-"]').forEach(function(el) {
    el.textContent = (tm > 0 ? pct + '%' : '0') + ' ⭐';
  });
}`;
}
