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
import { buildScoreJS } from '@/lib/export-html/score-script';

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

  // Shared score JS (reportScore + updateHasil)
  const scoreJS = buildScoreJS('single');

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
${scoreJS}

${gameEngineJS}

initAllGames();
<\/script></body></html>`;
}
