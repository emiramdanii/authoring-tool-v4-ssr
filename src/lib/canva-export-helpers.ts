// ═══════════════════════════════════════════════════════════════
// CANVA EXPORT HELPERS — Shared utilities for export HTML generation
// Extracted from canva-store.ts for maintainability
// ═══════════════════════════════════════════════════════════════

import { renderModuleToStyledHTML } from '@/lib/render-module';
import type { LayoutVariant } from '@/components/shared/PresetModuleCard';
import type { CanvaPage, PageTemplateType, CanvaElement } from '@/components/canva/types';
import type { MateriBlok } from '@/store/authoring-store';
import { resolveModule, resolveKuis } from '@/lib/module-resolver';

// ── Shared constants (used by canva-store + export modules) ────
export const GAME_TYPES = ['truefalse','memory','matching','roda','sorting','spinwheel','teambuzzer','wordsearch','flashcard','crossword','fillblank','dragdrop'] as const;
export const MATERI_MODULE_TYPES = ['materi','infografis','accordion','tab-icons','icon-explore','timeline'] as const;
export const MATERI_RAKIT_TYPES = ['materi','infografis','accordion','tab-icons','icon-explore','timeline','hero','kutipan','langkah','statistik','petunjuk','diskusi','review','refleksi','skenario','debat','studi-kasus','comparison','card-showcase','hotspot-image','polling','embed','video','flashcard'] as const;

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

// ── Helper: Render materi blok as inline-styled HTML for slideshow export ──

export function renderMateriBlokInline(blok: MateriBlok[]): string {
  const esc = (s: string | undefined) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const cardStyle = 'padding:12px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);margin-bottom:10px';
  const h2Style = 'font-size:12px;font-weight:800;color:#e8f2ff;margin-bottom:6px';

  return blok.map((b) => {
    switch (b.tipe) {
      case 'teks':
        return `<div style="${cardStyle}"><div style="${h2Style}">${esc(b.judul)}</div><p style="font-size:10px;color:rgba(255,255,255,.65);line-height:1.6">${esc(b.isi)}</p></div>`;
      case 'definisi':
        return `<div style="${cardStyle};border-left:3px solid #3ecfcf"><div style="${h2Style}">📖 ${esc(b.judul)}</div><div style="padding:8px;border-radius:6px;background:rgba(62,207,207,.08);border:1px solid rgba(62,207,207,.15);font-size:10px;color:rgba(255,255,255,.7);line-height:1.6">${esc(b.isi)}</div></div>`;
      case 'poin':
        return `<div style="${cardStyle}"><div style="${h2Style}">📌 ${esc(b.judul)}</div><ul style="list-style:none;padding:0;margin:0">${(b.butir || []).map(i => `<li style="padding:4px 0;font-size:10px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;gap:6px"><span style="color:#f9c82e;font-weight:900">→</span> ${esc(i)}</li>`).join('')}</ul></div>`;
      case 'highlight':
        return `<div style="${cardStyle};border-left:3px solid ${esc(b.warna || '#f9c82e')};background:${esc(b.warna || '#f9c82e')}0a"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="font-size:1.5rem">${esc(b.icon || '⚡')}</span><div style="${h2Style};font-size:11px">${esc(b.judul)}</div></div><p style="font-size:10px;color:rgba(255,255,255,.65);line-height:1.6">${esc(b.isi)}</p></div>`;
      case 'compare':
        return `<div style="${cardStyle}"><div style="${h2Style}">⚖️ ${esc(b.judul)}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:10px"><div style="font-weight:800;font-size:10px;margin-bottom:4px">${esc(b.kiri?.icon || '')} ${esc(b.kiri?.judul || '')}</div><p style="font-size:9px;color:rgba(255,255,255,.55);line-height:1.5">${esc(b.kiri?.isi || '')}</p></div><div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:10px"><div style="font-weight:800;font-size:10px;margin-bottom:4px">${esc(b.kanan?.icon || '')} ${esc(b.kanan?.judul || '')}</div><p style="font-size:9px;color:rgba(255,255,255,.55);line-height:1.5">${esc(b.kanan?.isi || '')}</p></div></div></div>`;
      case 'kutipan':
        return `<div style="${cardStyle};border-left:3px solid #3ecfcf;background:rgba(62,207,207,.04)"><div style="font-size:1.2rem;margin-bottom:4px">💬</div><p style="font-size:10px;font-style:italic;color:rgba(255,255,255,.7);line-height:1.6">"${esc(b.isi)}"</p>${b.judul ? `<div style="font-size:9px;color:rgba(255,255,255,.4);margin-top:4px">— ${esc(b.judul)}</div>` : ''}</div>`;
      case 'tabel':
        return `<div style="${cardStyle}"><div style="${h2Style}">📊 ${esc(b.judul)}</div><table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:9px"><thead>${(b.baris?.[0] || []).map((h) => `<th style="padding:6px 8px;background:rgba(249,193,46,.1);border:1px solid rgba(255,255,255,.1);text-align:left;font-weight:800">${esc(h)}</th>`).join('')}</thead><tbody>${(b.baris || []).slice(1).map(row => `<tr>${row.map(cell => `<td style="padding:6px 8px;border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.6)">${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      case 'timeline':
        return `<div style="${cardStyle}"><div style="${h2Style}">🗓️ ${esc(b.judul)}</div><div style="margin-top:8px">${(b.langkah || []).map((s) => `<div style="display:flex;gap:10px;margin-bottom:10px;align-items:flex-start"><div style="width:28px;height:28px;border-radius:50%;background:rgba(62,207,207,.15);color:#3ecfcf;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0">${esc(s.icon)}</div><div><div style="font-weight:800;font-size:10px">${esc(s.judul)}</div><p style="font-size:9px;color:rgba(255,255,255,.5);line-height:1.4;margin-top:2px">${esc(s.isi)}</p></div></div>`).join('')}</div></div>`;
      case 'studi':
        return `<div style="${cardStyle};border-left:3px solid #34d399;background:rgba(52,211,153,.04)"><div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><span style="font-size:1.5rem">${esc(b.karakter || '🧑')}</span><div><div style="${h2Style};font-size:11px">🧠 ${esc(b.judul || 'Studi Kasus')}</div><div style="font-size:8px;color:rgba(255,255,255,.4)">Situasi: ${esc(b.situasi)}</div></div></div><div style="padding:8px;border-radius:6px;background:rgba(62,207,207,.06);border:1px solid rgba(62,207,207,.12);font-size:10px;color:rgba(255,255,255,.6)">${esc(b.pertanyaan)}</div>${b.pesan ? `<div style="background:rgba(255,255,255,.04);border-radius:8px;padding:8px;margin-top:8px"><span style="font-weight:800;color:#34d399;font-size:9px">💬 Pesan:</span><p style="font-size:9px;color:rgba(255,255,255,.5);margin-top:3px;line-height:1.5">${esc(b.pesan)}</p></div>` : ''}</div>`;
      case 'infobox':
        return `<div style="${cardStyle};border-left:3px solid ${b.style === 'warning' ? '#f87171' : '#3ecfcf'}"><div style="font-weight:800;font-size:10px;margin-bottom:4px">${esc(b.judul)}</div><p style="font-size:9px;color:rgba(255,255,255,.55);line-height:1.6">${esc(b.isi)}</p></div>`;
      case 'checklist':
        return `<div style="${cardStyle}"><div style="${h2Style}">✅ ${esc(b.judul)}</div><ul style="list-style:none;padding:0;margin:0">${(b.butir || []).map(i => `<li style="padding:4px 0;font-size:10px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;gap:6px"><span style="width:16px;height:16px;border-radius:4px;border:1.5px solid #3ecfcf;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:8px">✓</span> ${esc(i)}</li>`).join('')}</ul></div>`;
      case 'statistik':
        return `<div style="${cardStyle}"><div style="${h2Style}">📈 ${esc(b.judul)}</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;margin-top:8px">${(b.items || []).map(it => `<div style="background:${esc(it.warna || '#3ecfcf')}0a;border:1px solid ${esc(it.warna || '#3ecfcf')}22;border-radius:8px;padding:10px;text-align:center"><div style="font-size:1.3rem">${esc(it.icon || '📊')}</div><div style="font-size:1.3rem;font-weight:900;color:${esc(it.warna || '#3ecfcf')}">${esc(it.angka || '')}${it.satuan ? `<span style="font-size:.7rem;font-weight:600">${esc(it.satuan)}</span>` : ''}</div><div style="font-size:8px;color:rgba(255,255,255,.4);margin-top:2px">${esc(it.label || '')}</div></div>`).join('')}</div></div>`;
      case 'gambar':
        return b.isi ? `<div style="${cardStyle}">${b.judul ? `<div style="${h2Style}">🖼️ ${esc(b.judul)}</div>` : ''}<img src="${esc(b.isi)}" alt="${esc(b.judul || 'Gambar')}" style="width:100%;border-radius:8px;margin-top:6px" onerror="this.style.display='none'" /></div>` : '';
      default:
        if (b.judul || b.isi) {
          return `<div style="${cardStyle}">${b.judul ? `<div style="${h2Style}">${esc(b.judul)}</div>` : ''}${b.isi ? `<p style="font-size:10px;color:rgba(255,255,255,.6);line-height:1.5">${esc(b.isi)}</p>` : ''}</div>`;
        }
        return '';
    }
  }).join('');
}

// ── Helper: Populate template elements for backward compat ────

export function populateTemplateElements(page: CanvaPage, createElId: () => string): CanvaElement[] {
  // For template pages, we don't add individual elements —
  // the template rendering in Stage.tsx handles it.
  // But we keep elements empty for custom pages or add
  // placeholder elements for backward export compatibility.
  if (page.templateType === 'custom') return [];

  // Resolve stable IDs from templateData so export engines can find the data
  const td = page.templateData || {};
  let moduleId: string | undefined;
  let kuisId: string | undefined;
  let kuisIds: string[] | undefined;

  // For kuis pages: collect all kuis IDs (kuisIds) for proper scoping
  // Also set kuisId from first item for backward compatibility
  if (page.templateType === 'kuis') {
    const kuisArr = td.kuis as Array<Record<string, unknown>> | undefined;
    if (kuisArr && kuisArr.length > 0) {
      kuisId = (kuisArr[0]._id as string) || undefined;
      kuisIds = kuisArr.map(k => k._id as string).filter(Boolean);
    }
  }

  // For game pages: try to get moduleId from the first game module
  if (page.templateType === 'game') {
    const gamesArr = td.games as Array<Record<string, unknown>> | undefined;
    if (gamesArr && gamesArr.length > 0 && gamesArr[0]._id) {
      moduleId = gamesArr[0]._id as string;
    }
  }

  // For materi pages: try to get moduleId from the first materi module
  if (page.templateType === 'materi') {
    const modulesArr = td.modules as Array<Record<string, unknown>> | undefined;
    if (modulesArr && modulesArr.length > 0 && modulesArr[0]._id) {
      moduleId = modulesArr[0]._id as string;
    }
  }

  // Add a single large placeholder element for export compat
  return [{
    id: createElId(),
    type: page.templateType === 'kuis' ? 'kuis' : page.templateType === 'game' ? 'game' : 'modul',
    icon: page.templateType === 'kuis' ? '❓' : page.templateType === 'game' ? '🎮' : '🧩',
    label: page.label,
    x: 0, y: 0, w: 100, h: 100,
    opacity: 100,
    dataIdx: -1,
    ...(moduleId ? { moduleId } : {}),
    ...(kuisId ? { kuisId } : {}),
    ...(kuisIds && kuisIds.length > 0 ? { kuisIds } : {}),
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
    skenario: {},
  };

  pages.forEach((p, i) => {
    // Quiz data for kuis pages
    if (p.templateType === 'kuis') {
      const kuisData = (p.templateData.kuis as Array<Record<string, unknown>> | undefined) ?? [];
      // Also try resolving via element kuisId/kuisIds for scoped questions
      let scopedKuisData = kuisData;
      if (kuisData.length === 0) {
        const kuisEl = [...(p.elements || []), ...(p.overlayElements || [])].find(e => e.type === 'kuis');
        if (kuisEl) {
          scopedKuisData = resolveKuis(kuisEl, allKuis);
        }
      }
      if (scopedKuisData.length > 0) {
        (gameData.quizzes as Record<string, unknown>)[String(i)] = scopedKuisData.map(k => ({
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
    // Skenario data for skenario pages
    if (p.templateType === 'skenario') {
      const skenarioData = (p.templateData.skenario as Array<Record<string, unknown>>) || [];
      if (skenarioData.length > 0) {
        (gameData.skenario as Record<string, unknown>)[String(i)] = skenarioData;
      }
    }
    // Custom pages: scan elements for quiz/game
    if (!p.templateType || p.templateType === 'custom') {
      let gameIdx = 0;
      const allElements = [...(p.elements || []), ...(p.overlayElements || [])];
      allElements.forEach(el => {
        if (el.type === 'kuis') {
          const kuisSource = resolveKuis(el, allKuis);
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
          const gMod = resolveModule(el, allGameModules);
          if (gMod) {
            const gType = gMod.type as string;
            const dataKey = gType === 'roda' ? 'roda' : gType === 'spinwheel' ? 'spinwheel' : gType;
            const compositeKey = i + '-' + gameIdx;
            (gameData[dataKey] as Record<string, unknown>)[compositeKey] = gMod;
            gameIdx++;
          } else {
            // Fallback to dataIdx for legacy elements
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
      const durasi = esc(td.durasi);
      const kurikulum = esc(td.kurikulum);
      // Render as non-absolute so the "Mulai Belajar" button sits below naturally
      // Matches the preset cover layout exactly (icon → chips → title → subtitle → chips → button)
      return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
        <div class="cover-icon">${icon}</div>
        <div class="cover-chips">
          ${mapel ? `<span class="chip" style="background:rgba(249,193,46,.15);color:var(--y)">${mapel} ${kelas ? 'Kelas ' + kelas : ''}</span>` : ''}
          ${durasi ? `<span class="chip" style="background:rgba(62,207,207,.15);color:var(--c)">${durasi}</span>` : ''}
          ${kurikulum ? `<span class="chip" style="background:rgba(52,211,153,.15);color:var(--g)">${kurikulum}</span>` : ''}
        </div>
        <div class="cover-title">${title}</div>
        ${subtitle ? `<p class="sub" style="max-width:480px;margin:0 auto">${subtitle}</p>` : ''}
      </div>`;
    }

    case 'kuis': {
      // Interactive quiz engine — container will be populated by JS
      // Non-absolute so navigation buttons sit below naturally
      return `<div class="card" style="margin-bottom:14px">
        <div class="h2">❓ <span class="hl">Kuis</span> Pengetahuan</div>
        <p class="sub mt8">Jawab dan lihat penjelasannya langsung.</p>
      </div>
      <div id="quiz-engine-${pageIdx}" style="min-height:200px"></div>`;
    }

    case 'materi': {
      const modules = (td.modules as Array<Record<string, unknown>>) || [];
      const blok = (td.blok as MateriBlok[]) || [];
      const modulesHTML = modules.map(mod =>
        renderModuleToStyledHTML(mod, (mod.layoutVariant as LayoutVariant) || 'A')
      ).join('');
      const blokHTML = blok.length > 0 ? renderMateriBlokInline(blok) : '';
      const allContent = modulesHTML + blokHTML;
      // Non-absolute so navigation buttons sit below naturally
      return `<div class="card" style="margin-bottom:14px">
        <div class="h2">📝 <span class="hl">Materi</span> Pembelajaran</div>
      </div>
      ${allContent || '<div class="card" style="text-align:center;padding:40px;color:var(--muted)">Belum ada modul materi.</div>'}`;
    }

    case 'game': {
      const games = (td.games as Array<Record<string, unknown>>) || [];
      if (games.length === 0) {
        return `<div class="card" style="text-align:center;padding:40px;color:var(--muted)">Belum ada game.</div>`;
      }
      // Build tab bar + game panels for each game
      const tabBtns = games.map((g, i) => {
        const icon = g.type === 'truefalse' ? '✅' : g.type === 'memory' ? '🧠' : g.type === 'matching' ? '🔀' : g.type === 'roda' ? '🎡' : g.type === 'sorting' ? '🔢' : g.type === 'spinwheel' ? '🎰' : g.type === 'teambuzzer' ? '🏆' : g.type === 'wordsearch' ? '🔍' : g.type === 'flashcard' ? '🃏' : g.type === 'crossword' ? '🔤' : g.type === 'fillblank' ? '✏️' : g.type === 'dragdrop' ? '🖐️' : '🎮';
        const name = (g.title as string) || (g.type as string);
        return `<button class="game-tab-btn${i === 0 ? ' active' : ''}" data-tab="g${i}" style="padding:4px 10px;border-radius:6px;border:1px solid rgba(62,207,207,.2);background:${i === 0 ? 'rgba(62,207,207,.2)' : 'rgba(255,255,255,.04)'};color:${i === 0 ? '#3ecfcf' : 'rgba(255,255,255,.5)'};font-size:10px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s">${icon} ${esc(name)}</button>`;
      }).join('');
      const panels = games.map((g, i) => {
        const engineId = getGameEngineId(g.type as string, pageIdx, i);
        return `<div class="game-panel" data-panel="g${i}" style="display:${i === 0 ? 'block' : 'none'};min-height:300px;overflow-y:auto"><div id="${engineId}" style="min-height:200px"></div></div>`;
      }).join('');
      // Non-absolute so navigation buttons sit below naturally
      return `<div class="card" style="margin-bottom:14px">
        <div class="h2">🎮 <span class="hl">Game</span> Interaktif</div>
      </div>
      <div class="game-tabs" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">${tabBtns}</div>
      ${panels}`;
    }

    case 'hasil': {
      const totalKuis = (td.totalKuis as number) || 0;
      // Non-absolute so the "Selesai" / "Ulangi" buttons sit below naturally
      // Matches the preset hasil layout exactly
      return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
        <div class="hasil-circle" id="hasilCircle">
          <div class="hasil-score">
            <div style="font-family:'Fredoka One',cursive;font-size:2rem;color:var(--g)" id="hasilNum">0</div>
            <div style="font-size:.7rem;color:var(--muted)">SKOR</div>
          </div>
        </div>
        <div id="hasilLevel" style="padding:10px 20px;border-radius:12px;font-weight:800;font-size:.92rem;margin:12px 0;display:inline-block"></div>
        <div style="font-size:13px;color:rgba(255,255,255,.5);margin-bottom:12px" id="hasil-score-detail">${totalKuis > 0 ? totalKuis + ' soal kuis tersedia' : 'Kerjakan kuis untuk melihat skor'}</div>
        <div class="card" style="text-align:left;margin-top:8px">
          <div class="refl-item"><label>💭 Apa yang paling kamu pelajari hari ini?</label>
            <textarea placeholder="Tuliskan refleksimu…"></textarea></div>
          <div class="refl-item"><label>🌟 Bagaimana kamu akan menerapkannya?</label>
            <textarea placeholder="Rencana aksi nyata…"></textarea></div>
        </div>
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
      // Non-absolute so navigation buttons sit below naturally
      return `<div class="card" style="margin-bottom:14px">
        <div class="h2">📋 <span class="hl">Dokumen</span> Pembelajaran</div>
      </div>
      ${cpHTML ? `<div class="card mt14">${cpHTML}</div>` : ''}
      ${tpHTML ? `<div class="card mt14">${tpHTML}</div>` : ''}
      ${!cp?.capaianFase && tpItems.length === 0 ? '<div class="card" style="text-align:center;padding:40px;color:var(--muted)">Isi data CP & TP di panel Dokumen</div>' : ''}`;
    }

    case 'hero': {
      const heroTitle = esc(td.title);
      const heroSub = esc(td.subtitle);
      const heroIcon = td.icon || '🚀';
      const heroCta = esc(td.cta);
      // Non-absolute so navigation buttons sit below naturally
      return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
        <div class="cover-icon">${heroIcon}</div>
        <div class="cover-title">${heroTitle}</div>
        ${heroSub ? `<p class="sub" style="max-width:480px;margin:0 auto">${heroSub}</p>` : ''}
        ${heroCta ? `<div style="padding:10px 24px;border-radius:12px;font-weight:700;font-size:14px;background:#f9c82e;color:#000;margin-top:16px">${heroCta}</div>` : ''}
      </div>`;
    }

    case 'skenario': {
      const skenario = (td.skenario as Array<Record<string, unknown>>) || [];
      // Interactive skenario engine — container will be populated by JS
      // Non-absolute so navigation buttons sit below naturally
      return `<div class="sk-shell">
        <div class="sk-hud">
          <div class="sk-hud-title">🎭 Skenario Interaktif</div>
          <span id="skTitle" style="font-size:.78rem;color:var(--muted)"></span>
          <span class="sk-badge" id="skScoreBadge" style="background:rgba(249,193,46,.15);color:var(--y)">0 poin</span>
        </div>
        <div id="skBody"></div>
        <div id="skProgress" style="display:flex;gap:4px;padding:8px 14px;background:#060d18;border-top:1px solid #1e3a5a;"></div>
      </div>`;
    }

    case 'petunjuk': {
      const langkah = (td.langkah as Array<Record<string, unknown>>) || [];
      const tips = esc(td.tips);
      const introP = esc(td.intro);
      const stepsHTML = langkah.map((l, i) =>
        `<div style="display:flex;align-items:flex-start;gap:8px;padding:8px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);margin-bottom:8px">
          <div style="width:24px;height:24px;border-radius:50%;background:rgba(249,200,46,.2);color:#f9c82e;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;flex-shrink:0">${i + 1}</div>
          <div><div style="display:flex;align-items:center;gap:4px;margin-bottom:2px"><span style="font-size:14px">${esc(l.icon) || '📌'}</span><span style="font-size:10px;font-weight:800;color:#fff">${esc(l.judul)}</span></div><p style="font-size:9px;color:rgba(255,255,255,.6);line-height:1.5;margin:0">${esc(l.isi)}</p></div>
        </div>`
      ).join('');
      const tipsHTML = tips
        ? `<div style="padding:10px;border-radius:8px;background:rgba(249,200,46,.06);border:1px solid rgba(249,200,46,.15);margin-top:8px"><div style="font-size:10px;font-weight:700;color:#f9c82e;margin-bottom:4px">💡 Tips</div><p style="font-size:9px;color:rgba(255,255,255,.6);line-height:1.5;margin:0">${tips}</p></div>`
        : '';
      // Non-absolute so navigation buttons sit below naturally
      return `<div class="card" style="margin-bottom:14px">
        <div class="h2">📋 <span class="hl">Petunjuk</span> Penggunaan</div>
        ${introP ? `<p class="sub mt8">${introP}</p>` : ''}
      </div>
      ${stepsHTML || '<div class="card" style="text-align:center;padding:40px;color:var(--muted)">Tambah langkah di panel Petunjuk</div>'}
      ${tipsHTML}`;
    }

    case 'diskusi': {
      const pertanyaan = (td.pertanyaan as Array<Record<string, unknown>>) || [];
      const introD = esc(td.intro);
      const questionsHTML = pertanyaan.map((p, i) =>
        `<div style="padding:10px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);margin-bottom:8px">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
            <span style="padding:2px 6px;border-radius:4px;font-size:8px;font-weight:700;background:rgba(62,207,207,.15);color:#3ecfcf">${esc(p.label) || 'Pertanyaan ' + (i + 1)}</span>
            <span style="font-size:14px">${esc(p.icon) || '💬'}</span>
          </div>
          <div style="font-size:10px;color:rgba(255,255,255,.75);line-height:1.5;margin-bottom:4px">${esc(p.teks)}</div>
          ${p.petunjuk ? `<div style="font-size:9px;color:rgba(255,255,255,.4);font-style:italic">💡 ${esc(p.petunjuk)}</div>` : ''}
        </div>`
      ).join('');
      // Non-absolute so navigation buttons sit below naturally
      return `<div class="card" style="margin-bottom:14px">
        <div class="h2">💬 <span class="hl">Diskusi</span> & Pertanyaan</div>
        ${introD ? `<p class="sub mt8">${introD}</p>` : ''}
      </div>
      ${questionsHTML || '<div class="card" style="text-align:center;padding:40px;color:var(--muted)">Tambah pertanyaan di panel Diskusi</div>'}`;
    }

    case 'refleksi': {
      const pertanyaan = (td.pertanyaan as Array<Record<string, unknown>>) || [];
      const penugasan = td.penugasan as Record<string, unknown> | undefined;
      const introR = esc(td.intro);
      const questionsHTML = pertanyaan.map((p, i) => {
        const warna = String(p.warna || '#a78bfa');
        return `<div style="padding:10px;border-radius:8px;background:${warna}08;border:1px solid ${warna}25;margin-bottom:8px">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
            ${p.icon ? `<span style="font-size:14px">${esc(p.icon)}</span>` : ''}
            <div style="width:8px;height:8px;border-radius:50%;background:${warna}"></div>
          </div>
          <div style="font-size:10px;color:rgba(255,255,255,.75);line-height:1.5;margin-bottom:4px">${esc(p.teks)}</div>
          ${p.petunjuk ? `<div style="font-size:9px;color:rgba(255,255,255,.4);font-style:italic">💡 ${esc(p.petunjuk)}</div>` : ''}
        </div>`;
      }).join('');
      const penugasanHTML = penugasan
        ? `<div style="padding:10px;border-radius:8px;background:rgba(167,139,250,.06);border:1px solid rgba(167,139,250,.15);margin-top:8px">
            <div style="font-size:10px;font-weight:700;color:#a78bfa;margin-bottom:4px">📝 ${esc(penugasan.judul) || 'Penugasan'}</div>
            <p style="font-size:9px;color:rgba(255,255,255,.6);line-height:1.5;margin:0">${esc(penugasan.isi)}</p>
            ${penugasan.contoh ? `<div style="font-size:8px;color:rgba(255,255,255,.35);font-style:italic;margin-top:4px">Contoh: ${esc(penugasan.contoh)}</div>` : ''}
          </div>`
        : '';
      // Non-absolute so navigation buttons sit below naturally
      return `<div class="card" style="margin-bottom:14px">
        <div class="h2">🪞 <span class="hl">Refleksi</span> Diri</div>
        ${introR ? `<p class="sub mt8">${introR}</p>` : ''}
      </div>
      ${questionsHTML || '<div class="card" style="text-align:center;padding:40px;color:var(--muted)">Tambah pertanyaan di panel Refleksi</div>'}
      ${penugasanHTML}`;
    }

    case 'penutup': {
      const preview = (td.preview as Array<Record<string, unknown>>) || [];
      const nextPertemuan = td.nextPertemuan as Record<string, unknown> | undefined;
      const subjudul = esc(td.subjudul);
      const previewHTML = preview.map((item) => {
        const warna = String(item.warna || '#34d399');
        return `<div style="padding:10px;border-radius:8px;background:${warna}0a;border:1px solid ${warna}25;margin-bottom:8px">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
            <span style="font-size:14px">${esc(item.icon) || '📌'}</span>
            <span style="font-size:10px;font-weight:800;color:${warna}">${esc(item.judul)}</span>
          </div>
          <p style="font-size:9px;color:rgba(255,255,255,.6);line-height:1.5;margin:0">${esc(item.isi)}</p>
        </div>`;
      }).join('');
      let nextHTML = '';
      if (nextPertemuan) {
        const items = (nextPertemuan.items as Array<Record<string, unknown>>) || [];
        const itemsHTML = items.map(it => {
          const itWarna = String(it.warna || '#34d399');
          return `<span style="padding:2px 6px;border-radius:4px;font-size:8px;font-weight:700;background:${itWarna}15;color:${itWarna}">${esc(it.icon) || ''} ${esc(it.judul)}</span>`;
        }).join(' ');
        nextHTML = `<div style="padding:10px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);margin-top:8px">
          <div style="font-size:10px;font-weight:700;color:#34d399;margin-bottom:4px">📅 ${esc(nextPertemuan.judul) || 'Pertemuan Berikutnya'}</div>
          ${nextPertemuan.deskripsi ? `<p style="font-size:9px;color:rgba(255,255,255,.5);line-height:1.5;margin:0 0 6px">${esc(nextPertemuan.deskripsi)}</p>` : ''}
          ${itemsHTML ? `<div style="display:flex;flex-wrap:wrap;gap:4px">${itemsHTML}</div>` : ''}
        </div>`;
      }
      // Non-absolute so navigation buttons sit below naturally
      return `<div class="card" style="margin-bottom:14px">
        <div class="h2">🎓 <span class="hl">Penutup</span></div>
        ${subjudul ? `<p class="sub mt8">${subjudul}</p>` : ''}
      </div>
      ${previewHTML || '<div class="card" style="text-align:center;padding:40px;color:var(--muted)">Tambah item di panel Penutup</div>'}
      ${nextHTML}`;
    }

    default:
      return null; // Fall back to element-based rendering
  }
}

// ── Helper: Render element-based HTML for custom pages ────────

// ── Render a single element to HTML ────────────────────────────

export function renderSingleElement(
  el: CanvaElement,
  pageIdx: number,
  allModules: Array<Record<string, unknown>>,
  allGameModules: Array<Record<string, unknown>>,
  quizPrefix: string,
): string {
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
    // Use module resolver for stable reference
    const gMod = resolveModule(el, allGameModules);
    const gType = (gMod?.type as string) || 'game';
    const engineId = getGameEngineId(gType, pageIdx, 0);
    return `<div id="${engineId}" style="${style};background:rgba(56,217,217,.08);border:1px solid rgba(56,217,217,.2);border-radius:8px;overflow:hidden;display:flex;flex-direction:column"></div>`;
  }
  if (el.type === 'modul' || el.type === 'materi') {
    // Use module resolver for stable reference
    const mod = resolveModule(el, allModules);
    const variant = (el.layoutVariant as LayoutVariant) || 'A';
    if (mod) return `<div style="${style};overflow-y:auto;padding:8px">${renderModuleToStyledHTML(mod, variant)}</div>`;
    return `<div style="${style};display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(167,139,250,.08);border:1px solid rgba(167,139,250,.2);border-radius:8px"><div style="font-size:1.5rem">🧩</div><div style="font-size:10px;color:rgba(167,139,250,.6);margin-top:4px">Modul</div></div>`;
  }
  return `<div style="${style};display:flex;align-items:center;justify-content:center"><div style="font-size:1.5rem">${el.icon || ''}</div></div>`;
}

export function renderElementsHTML(
  page: CanvaPage,
  pageIdx: number,
  allModules: Array<Record<string, unknown>>,
  allGameModules: Array<Record<string, unknown>>,
  quizPrefix: string = 'quiz-engine-',
): string {
  // ✅ FIX: Render BOTH page.elements AND page.overlayElements
  const regularHtml = (page.elements || [])
    .filter(el => !el.hidden)
    .map(el => renderSingleElement(el, pageIdx, allModules, allGameModules, quizPrefix))
    .join('\n    ');
  
  const overlayHtml = (page.overlayElements || [])
    .filter(el => !el.hidden)
    .map(el => renderSingleElement(el, pageIdx, allModules, allGameModules, quizPrefix))
    .join('\n    ');
  
  // Overlay elements render on top (higher z-index)
  if (overlayHtml && regularHtml) {
    return regularHtml + '\n    <div style="position:absolute;inset:0;z-index:10;pointer-events:none">' + overlayHtml.replace(/position:absolute;/g, 'position:absolute;pointer-events:auto;') + '</div>';
  }
  return regularHtml + overlayHtml;
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
    skenario: {},
  };

  // Quiz data for kuis pages
  if (page.templateType === 'kuis') {
    const kuisData = (page.templateData.kuis as Array<Record<string, unknown>> | undefined) ?? [];
    // Also try resolving via element kuisId/kuisIds for scoped questions
    let scopedKuisData = kuisData;
    if (kuisData.length === 0) {
      const kuisEl = [...(page.elements || []), ...(page.overlayElements || [])].find(e => e.type === 'kuis');
      if (kuisEl) {
        scopedKuisData = resolveKuis(kuisEl, allKuis);
      }
    }
    if (scopedKuisData.length > 0) {
      (gameData.quizzes as Record<string, unknown>)[String(pageIdx)] = scopedKuisData.map(k => ({
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
  // Also support game/kuis elements on custom pages (use resolveModule/resolveKuis for stable references)
  if (!page.templateType || page.templateType === 'custom') {
    let gameIdx = 0;
    const allElements = [...(page.elements || []), ...(page.overlayElements || [])];
    allElements.forEach(el => {
      if (el.type === 'kuis') {
        const kuisSource = resolveKuis(el, allKuis);
        if (kuisSource.length > 0) {
          (gameData.quizzes as Record<string, unknown>)[String(pageIdx)] = kuisSource.map(k => ({
            q: (k as Record<string, unknown>).q || '',
            opts: (k as Record<string, unknown>).opts || [],
            ans: (k as Record<string, unknown>).ans ?? 0,
            ex: (k as Record<string, unknown>).ex || '',
          }));
        }
      }
      if (el.type === 'game') {
        const gMod = resolveModule(el, allGameModules);
        if (gMod) {
          const gType = gMod.type as string;
          const dataKey = gType === 'roda' ? 'roda' : gType === 'spinwheel' ? 'spinwheel' : gType;
          const compositeKey = pageIdx + '-' + gameIdx;
          (gameData[dataKey] as Record<string, unknown>)[compositeKey] = gMod;
          gameIdx++;
        } else {
          // Fallback to dataIdx for legacy elements
          const dataIdx = el.dataIdx ?? -1;
          const gameSource = dataIdx >= 0 && dataIdx < allGameModules.length
            ? [allGameModules[dataIdx]]
            : allGameModules;
          gameSource.forEach(g => {
            const gType = g.type as string;
            const dataKey = gType === 'roda' ? 'roda' : gType === 'spinwheel' ? 'spinwheel' : gType;
            const compositeKey = pageIdx + '-' + gameIdx;
            (gameData[dataKey] as Record<string, unknown>)[compositeKey] = g;
            gameIdx++;
          });
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
