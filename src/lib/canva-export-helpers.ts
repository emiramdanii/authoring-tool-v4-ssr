// ═══════════════════════════════════════════════════════════════
// CANVA EXPORT HELPERS — Shared utilities for export HTML generation
// Extracted from canva-store.ts for maintainability
// ═══════════════════════════════════════════════════════════════

import { renderModuleToStyledHTML } from '@/lib/render-module-html';
import type { LayoutVariant } from '@/components/shared/PresetModuleCard';
import type { CanvaPage, PageTemplateType } from '@/components/canva/types';

// ── Shared constants (used by canva-store + export modules) ────
export const GAME_TYPES = ['truefalse','memory','matching','roda','sorting','spinwheel','teambuzzer','wordsearch','flashcard','crossword','fillblank','dragdrop'] as const;
export const MATERI_MODULE_TYPES = ['materi','infografis','accordion','tab-icons','icon-explore','timeline'] as const;
export const MATERI_RAKIT_TYPES = ['materi','infografis','accordion','tab-icons','icon-explore','timeline','hero','kutipan','langkah','statistik'] as const;

// ── Helper: Get hero data from authoring store ─────────────────

export function getHeroData(authStore: { modules: Array<Record<string, unknown>>; meta: { judulPertemuan?: string; subjudul?: string; ikon?: string } }) {
  const heroModules = authStore.modules.filter((m: Record<string, unknown>) => m.type === 'hero');
  const heroData = heroModules[0] as Record<string, unknown> | undefined;
  return {
    title: (heroData?.title as string) || authStore.meta.judulPertemuan || 'Hero Banner',
    subtitle: (heroData?.subjudul as string) || authStore.meta.subjudul || '',
    icon: (heroData?.icon as string) || authStore.meta.ikon || '🚀',
    gradient: (heroData?.gradient as string) || 'sunset',
    cta: (heroData?.cta as string) || '',
  };
}

// ── Helper: Populate template elements for backward compat ────

export function populateTemplateElements(page: CanvaPage, createElId: () => string) {
  // For template pages, we don't add individual elements —
  // the template rendering in Stage.tsx handles it.
  // But we keep elements empty for custom pages or add
  // placeholder elements for backward export compatibility.
  if (page.templateType === 'custom') return;

  // Add a single large placeholder element for export compat
  page.elements = [{
    id: createElId(),
    type: page.templateType === 'kuis' ? 'kuis' : page.templateType === 'game' ? 'game' : 'modul',
    icon: page.templateType === 'kuis' ? '❓' : page.templateType === 'game' ? '🎮' : '🧩',
    label: page.label,
    x: 0, y: 0, w: 100, h: 100,
    opacity: 100,
    dataIdx: -1,
  }];
}

// ── Helper: Get engine container ID for a game type ────────────

export function getGameEngineId(gameType: string, pageIdx: number, gameIdx: number): string {
  const prefixMap: Record<string, string> = {
    truefalse: 'tf',
    memory: 'mem',
    matching: 'match',
    sorting: 'sort',
    roda: 'roda',
    spinwheel: 'sw',
    teambuzzer: 'tb',
    wordsearch: 'ws',
    flashcard: 'fc',
    crossword: 'cw',
    fillblank: 'fb',
    dragdrop: 'dd',
  };
  const prefix = prefixMap[gameType] || 'game';
  return prefix + '-engine-' + pageIdx + '-' + gameIdx;
}

// ── Helper: Build GAMEDATA object from pages ──────────────────

export function buildGameData(
  pages: CanvaPage[],
  allKuis: Array<Record<string, unknown>>,
  allGameModules: Array<Record<string, unknown>>,
): Record<string, unknown> {
  const gameData: Record<string, unknown> = {
    quizzes: {}, truefalse: {}, memory: {}, matching: {},
    sorting: {}, roda: {}, spinwheel: {}, teambuzzer: {},
    wordsearch: {}, flashcard: {}, crossword: {}, fillblank: {}, dragdrop: {},
  };

  pages.forEach((p, i) => {
    // Quiz data for kuis pages
    if (p.templateType === 'kuis') {
      const kuisData = (p.templateData.kuis as Array<Record<string, unknown>>) || allKuis;
      if (kuisData.length > 0) {
        (gameData.quizzes as Record<string, unknown>)[String(i)] = kuisData.map(k => ({
          q: (k as Record<string, unknown>).q || '',
          opts: (k as Record<string, unknown>).opts || [],
          ans: (k as Record<string, unknown>).ans ?? 0,
          ex: (k as Record<string, unknown>).ex || '',
        }));
      }
    }
    // Game data for game pages
    if (p.templateType === 'game') {
      const games = (p.templateData.games as Array<Record<string, unknown>>) || allGameModules;
      games.forEach((g, gi) => {
        const gType = g.type as string;
        const dataKey = gType === 'roda' ? 'roda' : gType === 'spinwheel' ? 'spinwheel' : gType;
        const compositeKey = i + '-' + gi; // pageIdx-gameIdx
        (gameData[dataKey] as Record<string, unknown>)[compositeKey] = g;
      });
    }
    // Custom pages: scan elements for quiz/game
    if (!p.templateType || p.templateType === 'custom') {
      let gameIdx = 0;
      p.elements.forEach(el => {
        if (el.type === 'kuis') {
          const dataIdx = el.dataIdx ?? -1;
          const kuisSource = dataIdx >= 0 && dataIdx < allKuis.length
            ? [allKuis[dataIdx]]
            : allKuis;
          if (kuisSource.length > 0) {
            (gameData.quizzes as Record<string, unknown>)[String(i)] = kuisSource.map(k => ({
              q: (k as Record<string, unknown>).q || '',
              opts: (k as Record<string, unknown>).opts || [],
              ans: (k as Record<string, unknown>).ans ?? 0,
              ex: (k as Record<string, unknown>).ex || '',
            }));
          }
        }
        if (el.type === 'game') {
          const dataIdx = el.dataIdx ?? -1;
          const gameSource = dataIdx >= 0 && dataIdx < allGameModules.length
            ? [allGameModules[dataIdx]]
            : allGameModules;
          gameSource.forEach(g => {
            const gType = g.type as string;
            const dataKey = gType === 'roda' ? 'roda' : gType === 'spinwheel' ? 'spinwheel' : gType;
            const compositeKey = i + '-' + gameIdx;
            (gameData[dataKey] as Record<string, unknown>)[compositeKey] = g;
            gameIdx++;
          });
        }
      });
    }
  });

  // Remove empty categories
  Object.keys(gameData).forEach(k => {
    if (Object.keys(gameData[k] as Record<string, unknown>).length === 0) delete gameData[k];
  });

  return gameData;
}

// ── Helper: Render template-specific HTML for export ──────────

export function renderTemplateExportHTML(page: CanvaPage, pageIdx: number = 0): string | null {
  const td = page.templateData;
  const esc = (s: unknown) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  switch (page.templateType) {
    case 'cover': {
      const title = esc(td.title);
      const subtitle = esc(td.subtitle);
      const icon = td.icon || '📚';
      const mapel = esc(td.mapel);
      const kelas = esc(td.kelas);
      return `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px">
        <div style="font-size:64px;margin-bottom:16px">${icon}</div>
        <div style="font-size:32px;font-weight:900;color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.5);margin-bottom:8px">${title}</div>
        <div style="font-size:16px;color:rgba(255,255,255,.7);margin-bottom:20px">${subtitle}</div>
        ${mapel ? `<div style="display:inline-block;padding:6px 16px;border-radius:20px;background:rgba(249,200,46,.2);border:1px solid rgba(249,200,46,.3);color:#f9c82e;font-size:13px;font-weight:700">${mapel} ${kelas ? '• Kelas ' + kelas : ''}</div>` : ''}
      </div>`;
    }

    case 'kuis': {
      // Interactive quiz engine — container will be populated by JS
      return `<div style="position:absolute;inset:0;padding:20px;overflow-y:auto">
        <div style="font-size:18px;font-weight:900;color:#f5c842;margin-bottom:16px">❓ Kuis Interaktif</div>
        <div id="quiz-engine-${pageIdx}" style="min-height:200px"></div>
      </div>`;
    }

    case 'materi': {
      const modules = (td.modules as Array<Record<string, unknown>>) || [];
      const modulesHTML = modules.map(mod =>
        renderModuleToStyledHTML(mod, (mod.layoutVariant as LayoutVariant) || 'A')
      ).join('');
      return `<div style="position:absolute;inset:0;padding:20px;overflow-y:auto">
        <div style="font-size:18px;font-weight:900;color:#e8f2ff;margin-bottom:16px">📝 Materi Pembelajaran</div>
        ${modulesHTML || '<div style="text-align:center;padding:40px;color:#6e90b5">Belum ada modul materi.</div>'}
      </div>`;
    }

    case 'game': {
      const games = (td.games as Array<Record<string, unknown>>) || [];
      if (games.length === 0) {
        return `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#6e90b5">Belum ada game.</div>`;
      }
      // Build tab bar + game panels for each game
      const tabBtns = games.map((g, i) => {
        const icon = g.type === 'truefalse' ? '✅' : g.type === 'memory' ? '🧠' : g.type === 'matching' ? '🔀' : g.type === 'roda' ? '🎡' : g.type === 'sorting' ? '🔢' : g.type === 'spinwheel' ? '🎡' : g.type === 'teambuzzer' ? '🏆' : g.type === 'wordsearch' ? '🔍' : g.type === 'flashcard' ? '🃏' : g.type === 'crossword' ? '🔤' : g.type === 'fillblank' ? '✏️' : g.type === 'dragdrop' ? '🖐️' : '🎮';
        const name = (g.title as string) || (g.type as string);
        return `<button class="game-tab-btn${i === 0 ? ' active' : ''}" data-tab="g${i}" style="padding:4px 10px;border-radius:6px;border:1px solid rgba(62,207,207,.2);background:${i === 0 ? 'rgba(62,207,207,.2)' : 'rgba(255,255,255,.04)'};color:${i === 0 ? '#3ecfcf' : 'rgba(255,255,255,.5)'};font-size:10px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s">${icon} ${esc(name)}</button>`;
      }).join('');
      const panels = games.map((g, i) => {
        const engineId = getGameEngineId(g.type as string, pageIdx, i);
        return `<div class="game-panel" data-panel="g${i}" style="display:${i === 0 ? 'block' : 'none'};height:calc(100% - 44px);overflow-y:auto"><div id="${engineId}" style="min-height:200px"></div></div>`;
      }).join('');
      return `<div style="position:absolute;inset:0;padding:16px;display:flex;flex-direction:column">
        <div style="font-size:18px;font-weight:900;color:#3ecfcf;margin-bottom:10px">🎮 Game Interaktif</div>
        <div class="game-tabs" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">${tabBtns}</div>
        ${panels}
      </div>`;
    }

    case 'hasil': {
      const totalKuis = (td.totalKuis as number) || 0;
      return `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px">
        <div style="font-size:56px;margin-bottom:12px">🏆</div>
        <div style="font-size:28px;font-weight:900;color:#34d399;margin-bottom:6px">Hasil Belajar</div>
        <div style="font-size:13px;color:rgba(255,255,255,.5);margin-bottom:24px" id="hasil-score-detail">${totalKuis > 0 ? totalKuis + ' soal kuis tersedia' : 'Kerjakan kuis untuk melihat skor'}</div>
        <div style="width:150px;height:150px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:20px;position:relative;background:conic-gradient(#34d399 0%,rgba(255,255,255,.08) 0%)" id="hasil-circle-wrap">
          <div style="width:120px;height:120px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0f172a;position:relative;z-index:1">
            <div style="font-size:42px;font-weight:900;color:#34d399" id="hasil-score-pct">0%</div>
            <div style="font-size:10px;font-weight:700;margin-top:2px" id="hasil-level-label"></div>
          </div>
        </div>
        <div style="display:flex;gap:16px;margin-bottom:16px" id="hasil-legend">
          <div style="display:flex;align-items:center;gap:4px"><div style="width:8px;height:8px;border-radius:50%;background:#34d399"></div><span style="font-size:9px;color:rgba(255,255,255,.4)">Sangat Baik</span></div>
          <div style="display:flex;align-items:center;gap:4px"><div style="width:8px;height:8px;border-radius:50%;background:#f9c12e"></div><span style="font-size:9px;color:rgba(255,255,255,.4)">Baik</span></div>
          <div style="display:flex;align-items:center;gap:4px"><div style="width:8px;height:8px;border-radius:50%;background:#f87171"></div><span style="font-size:9px;color:rgba(255,255,255,.4)">Perlu Latihan</span></div>
        </div>
        <div style="font-size:11px;color:rgba(255,255,255,.35)">Skor diperbarui secara langsung</div>
      </div>`;
    }

    case 'dokumen': {
      const cp = td.cp as Record<string, unknown> | undefined;
      const tpItems = (td.tp as Array<Record<string, unknown>>) || [];
      const cpHTML = cp?.capaianFase
        ? `<div style="padding:12px;border-radius:8px;background:rgba(249,200,46,.06);border:1px solid rgba(249,200,46,.15);margin-bottom:12px">
            <div style="font-size:11px;font-weight:700;color:#f9c82e;margin-bottom:4px">Capaian Pembelajaran</div>
            <div style="font-size:10px;color:rgba(255,255,255,.7);line-height:1.5">${esc(cp.capaianFase)}</div>
          </div>`
        : '';
      const tpHTML = tpItems.length > 0
        ? `<div style="font-size:11px;font-weight:700;color:#3ecfcf;margin-bottom:6px">Tujuan Pembelajaran</div>
            ${tpItems.map((tp, i) => `<div style="display:flex;align-items:flex-start;gap:6px;padding:4px 8px;border-radius:4px;background:rgba(255,255,255,.03);margin-bottom:4px">
              <div style="width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;background:${String(tp.color || '#3ecfcf')}30;color:${String(tp.color || '#3ecfcf')};flex-shrink:0">${i + 1}</div>
              <div><span style="font-size:9px;font-weight:700;color:${String(tp.color || '#3ecfcf')}">${esc(tp.verb)}</span><span style="font-size:9px;color:rgba(255,255,255,.6);margin-left:4px">${esc(tp.desc)}</span></div>
            </div>`).join('')}`
        : '';
      return `<div style="position:absolute;inset:0;padding:20px;overflow-y:auto">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
          <div style="width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;background:rgba(249,200,46,.12)">📋</div>
          <div><div style="font-size:14px;font-weight:900;color:#fff">Dokumen Kurikulum</div><div style="font-size:9px;color:rgba(255,255,255,.4)">Capaian Pembelajaran • Tujuan Pembelajaran</div></div>
        </div>
        ${cpHTML}${tpHTML}
        ${!cp?.capaianFase && tpItems.length === 0 ? '<div style="text-align:center;padding:40px;color:#6e90b5">Isi data CP & TP di panel Dokumen</div>' : ''}
      </div>`;
    }

    case 'hero': {
      const heroTitle = esc(td.title);
      const heroSub = esc(td.subtitle);
      const heroIcon = td.icon || '🚀';
      const heroCta = esc(td.cta);
      return `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px;background:linear-gradient(135deg,#0f172a,#1e293b,#0f172a)">
        <div style="font-size:48px;margin-bottom:12px">${heroIcon}</div>
        <div style="font-size:28px;font-weight:900;color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.5);margin-bottom:8px">${heroTitle}</div>
        <div style="font-size:14px;color:rgba(255,255,255,.6);margin-bottom:20px">${heroSub}</div>
        ${heroCta ? `<div style="padding:10px 24px;border-radius:12px;font-weight:700;font-size:14px;background:#f9c82e;color:#000">${heroCta}</div>` : ''}
      </div>`;
    }

    case 'skenario': {
      const skenario = (td.skenario as Array<Record<string, unknown>>) || [];
      const chaptersHTML = skenario.map((ch, i) => {
        const choices = (ch.choices as Array<Record<string, unknown>>) || [];
        const choicesHTML = choices.map((c, j) =>
          `<div style="display:inline-block;padding:2px 6px;border-radius:4px;font-size:8px;background:${c.good ? 'rgba(52,211,153,.1)' : 'rgba(248,113,113,.1)'};color:${c.good ? '#34d399' : '#f87171'}">${String(c.icon || '🤔')} ${esc(c.label || 'Pilihan ' + (j + 1))}</div>`
        ).join(' ');
        return `<div style="padding:8px;border-radius:8px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);margin-bottom:8px">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
            <span style="font-size:14px">${String(ch.charEmoji || '🧑')}</span>
            <span style="font-size:10px;font-weight:700;color:#fff">Babak ${i + 1}</span>
            ${ch.title ? `<span style="font-size:8px;color:rgba(255,255,255,.4)">${esc(ch.title)}</span>` : ''}
          </div>
          ${ch.choicePrompt ? `<div style="font-size:8px;color:rgba(255,255,255,.5);font-style:italic;margin-bottom:4px">${esc(ch.choicePrompt)}</div>` : ''}
          ${choicesHTML ? `<div style="display:flex;gap:4px;flex-wrap:wrap">${choicesHTML}</div>` : ''}
        </div>`;
      }).join('');
      return `<div style="position:absolute;inset:0;padding:20px;overflow-y:auto">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
          <div style="width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;background:rgba(244,114,182,.12)">🎭</div>
          <div><div style="font-size:14px;font-weight:900;color:#f472b6">Skenario Interaktif</div><div style="font-size:9px;color:rgba(255,255,255,.4)">${skenario.length} babak</div></div>
        </div>
        ${chaptersHTML || '<div style="text-align:center;padding:40px;color:#6e90b5">Tambah skenario di panel Konten</div>'}
      </div>`;
    }

    default:
      return null; // Fall back to element-based rendering
  }
}

// ── Helper: Render element-based HTML for custom pages ────────

export function renderElementsHTML(
  page: CanvaPage,
  pageIdx: number,
  allModules: Array<Record<string, unknown>>,
  allGameModules: Array<Record<string, unknown>>,
  quizPrefix: string = 'quiz-engine-',
): string {
  return (page.elements || [])
    .filter(el => !el.hidden)
    .map((el, ei) => {
      const style = `position:absolute;left:${el.x}%;top:${el.y}%;width:${el.w}%;height:${el.h}%;opacity:${(el.opacity || 100) / 100}`;
      if (el.type === 'teks') {
        return `<div style="${style}"><div style="font-size:${el.fontSize || 20}px;font-weight:700;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.5);padding:8px;line-height:1.4">${el.text || ''}</div></div>`;
      }
      if (el.type === 'shape') {
        return `<div style="${style}"><div style="width:100%;height:100%;background:${el.color || 'rgba(255,255,255,.15)'};border-radius:${el.radius || 8}px"></div></div>`;
      }
      if (el.type === 'kuis') {
        return `<div id="${quizPrefix}${pageIdx}" style="${style};background:rgba(245,200,66,.08);border:1px solid rgba(245,200,66,.2);border-radius:8px;padding:10px;overflow:hidden;display:flex;flex-direction:column"></div>`;
      }
      if (el.type === 'game') {
        const gameIdx = el.dataIdx ?? 0;
        const gMod = (gameIdx >= 0 && gameIdx < allGameModules.length) ? allGameModules[gameIdx] : null;
        const gType = (gMod?.type as string) || 'game';
        const engineId = getGameEngineId(gType, pageIdx, 0);
        return `<div id="${engineId}" style="${style};background:rgba(56,217,217,.08);border:1px solid rgba(56,217,217,.2);border-radius:8px;overflow:hidden;display:flex;flex-direction:column"></div>`;
      }
      if (el.type === 'modul' || el.type === 'materi') {
        const modIdx = el.dataIdx;
        const mod = (modIdx != null && modIdx >= 0 && modIdx < allModules.length) ? allModules[modIdx] : null;
        const variant = (el.layoutVariant as LayoutVariant) || 'A';
        if (mod) return `<div style="${style};overflow-y:auto;padding:8px">${renderModuleToStyledHTML(mod, variant)}</div>`;
        return `<div style="${style};display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(167,139,250,.08);border:1px solid rgba(167,139,250,.2);border-radius:8px"><div style="font-size:1.5rem">🧩</div><div style="font-size:10px;color:rgba(167,139,250,.6);margin-top:4px">Modul</div></div>`;
      }
      return `<div style="${style};display:flex;align-items:center;justify-content:center"><div style="font-size:1.5rem">${el.icon || ''}</div></div>`;
    })
    .join('\n    ');
}

// ── Helper: Build page-level GAMEDATA (for single-page export) ─

export function buildPageGameData(
  page: CanvaPage,
  pageIdx: number,
  allKuis: Array<Record<string, unknown>>,
  allGameModules: Array<Record<string, unknown>>,
): Record<string, unknown> {
  const gameData: Record<string, unknown> = {
    quizzes: {}, truefalse: {}, memory: {}, matching: {},
    sorting: {}, roda: {}, spinwheel: {}, teambuzzer: {},
    wordsearch: {}, flashcard: {}, crossword: {}, fillblank: {}, dragdrop: {},
  };

  // Quiz data for kuis pages
  if (page.templateType === 'kuis') {
    const kuisData = (page.templateData.kuis as Array<Record<string, unknown>>) || allKuis;
    if (kuisData.length > 0) {
      (gameData.quizzes as Record<string, unknown>)[String(pageIdx)] = kuisData.map(k => ({
        q: (k as Record<string, unknown>).q || '',
        opts: (k as Record<string, unknown>).opts || [],
        ans: (k as Record<string, unknown>).ans ?? 0,
        ex: (k as Record<string, unknown>).ex || '',
      }));
    }
  }
  // Game data for game pages
  if (page.templateType === 'game') {
    const games = (page.templateData.games as Array<Record<string, unknown>>) || allGameModules;
    games.forEach((g, gi) => {
      const gType = g.type as string;
      const dataKey = gType === 'roda' ? 'roda' : gType === 'spinwheel' ? 'spinwheel' : gType;
      const compositeKey = pageIdx + '-' + gi;
      (gameData[dataKey] as Record<string, unknown>)[compositeKey] = g;
    });
  }
  // Also support game/kuis elements on custom pages
  if (!page.templateType || page.templateType === 'custom') {
    (page.elements || []).forEach((el) => {
      if (el.type === 'game') {
        const gameIdx = el.dataIdx;
        const mod = (gameIdx != null && gameIdx >= 0 && gameIdx < allGameModules.length) ? allGameModules[gameIdx] : null;
        if (mod) {
          const gType = mod.type as string;
          const dataKey = gType === 'roda' ? 'roda' : gType === 'spinwheel' ? 'spinwheel' : gType;
          const compositeKey = pageIdx + '-0';
          (gameData[dataKey] as Record<string, unknown>)[compositeKey] = mod;
        }
      }
      if (el.type === 'kuis') {
        const dataIdx = el.dataIdx ?? -1;
        const kuisSource = dataIdx >= 0 && dataIdx < allKuis.length
          ? [allKuis[dataIdx]]
          : allKuis;
        if (kuisSource.length > 0) {
          (gameData.quizzes as Record<string, unknown>)[String(pageIdx)] = kuisSource.map(k => ({
            q: k.q || '', opts: k.opts || [], ans: k.ans ?? 0, ex: k.ex || '',
          }));
        }
      }
    });
  }

  // Remove empty categories
  Object.keys(gameData).forEach(k => {
    if (Object.keys(gameData[k] as Record<string, unknown>).length === 0) delete gameData[k];
  });

  return gameData;
}
