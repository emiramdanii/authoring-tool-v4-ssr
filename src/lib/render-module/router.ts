// ═══════════════════════════════════════════════════════════════════
// ROUTER — Body fallback renderer + main dispatch switch
// ═══════════════════════════════════════════════════════════════════

import type { LayoutVariant, M, ModuleTypeMeta } from './types';
import { T } from './tokens';
import { str, esc, getItemCount, getModuleMeta } from './helpers';
import { bodyInfografis, bodyVideo, bodyFlashcard, bodyEmbed, bodyStudiKasus, bodyMateri } from './content';
import { bodyAccordion, bodyTabIcons, bodyIconExplore, bodyComparison, bodyCardShowcase, bodyHotspotImage, bodyPolling } from './interactive';
import { bodyTimeline, bodyHero, bodyKutipan, bodyLangkah, bodySkenario, bodyDebat, bodyPetunjuk, bodyDiskusi, bodyReview, bodyRefleksi } from './narrative';
import { bodyStatistik } from './statistics';
import { bodyMatching, bodyTrueFalse, bodyMemory, bodyRoda, bodySorting, bodySpinwheel, bodyTeambuzzer, bodyWordsearch, bodyCrossword, bodyFillblank, bodyDragdrop } from './games';

// ═══════════════════════════════════════════════════════════════════
// FALLBACK RENDERER
// ═══════════════════════════════════════════════════════════════════
export function bodyFallback(mod: M, meta: ModuleTypeMeta, v: LayoutVariant): string {
  const count = getItemCount(mod);
  if (v === 'D') {
    return `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-left:3px solid ${meta.color};padding-left:8px">` +
      `<span style="font-size:14px">${meta.icon}</span>` +
      `<span style="font-size:11px;font-weight:600;color:${meta.color};font-family:'Nunito',sans-serif">${esc(meta.label)}</span>` +
      (count > 0 ? `<span style="font-size:10px;color:${T.muted};font-family:'Nunito',sans-serif">${count} item</span>` : '') +
      `</div>`;
  }
  return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px;gap:8px;background:${meta.color}08;border-radius:8px">` +
    `<div style="display:flex;align-items:center;gap:6px">` +
      `<span style="font-size:18px">${meta.icon}</span>` +
      `<span style="font-weight:600;font-size:12px;color:${meta.color};font-family:'Nunito',sans-serif">${esc(meta.label)}</span>` +
    `</div>` +
    (count > 0 ? `<div style="font-size:10px;padding:2px 10px;border-radius:99px;background:${meta.color}15;color:${meta.color};font-family:'Nunito',sans-serif">${count} item</div>` : '') +
    (count > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;max-width:160px">` +
      Array.from({ length: Math.min(count, 8) }).map(() =>
        `<div style="width:14px;height:14px;border-radius:3px;background:${meta.color}25"></div>`
      ).join('') + `</div>` : '') +
    `</div>`;
}

// ═══════════════════════════════════════════════════════════════════
// BODY ROUTER — dispatches to the right renderer
// ═══════════════════════════════════════════════════════════════════
export function renderBody(mod: M, v: LayoutVariant): string {
  const t = str(mod.type);
  const meta = getModuleMeta(t);
  switch (t) {
    case 'infografis': return bodyInfografis(mod, v);
    case 'statistik': return bodyStatistik(mod, v);
    case 'timeline': return bodyTimeline(mod, v);
    case 'hero': return bodyHero(mod);
    case 'kutipan': return bodyKutipan(mod, v);
    case 'langkah': return bodyLangkah(mod, v);
    case 'accordion': return bodyAccordion(mod, v);
    case 'video': return bodyVideo(mod);
    case 'flashcard': return bodyFlashcard(mod, v);
    case 'matching': return bodyMatching(mod, v);
    case 'truefalse': return bodyTrueFalse(mod, v);
    case 'memory': return bodyMemory(mod, v);
    case 'roda': return bodyRoda(mod);
    case 'tab-icons': return bodyTabIcons(mod, v);
    case 'icon-explore': return bodyIconExplore(mod, v);
    case 'comparison': return bodyComparison(mod, v);
    case 'card-showcase': return bodyCardShowcase(mod, v);
    case 'hotspot-image': return bodyHotspotImage(mod, v);
    case 'polling': return bodyPolling(mod, v);
    case 'embed': return bodyEmbed(mod);
    case 'studi-kasus': return bodyStudiKasus(mod, v);
    case 'debat': return bodyDebat(mod, v);
    case 'sorting': return bodySorting(mod, v);
    case 'spinwheel': return bodySpinwheel(mod, v);
    case 'teambuzzer': return bodyTeambuzzer(mod);
    case 'wordsearch': return bodyWordsearch(mod);
    case 'crossword': return bodyCrossword(mod, v);
    case 'fillblank': return bodyFillblank(mod, v);
    case 'dragdrop': return bodyDragdrop(mod, v);
    case 'skenario': return bodySkenario(mod, v);
    case 'senario': return bodySkenario(mod, v); // legacy alias
    case 'petunjuk': return bodyPetunjuk(mod, v);
    case 'diskusi': return bodyDiskusi(mod, v);
    case 'review': return bodyReview(mod, v);
    case 'refleksi': return bodyRefleksi(mod, v);
    case 'materi': return bodyMateri(mod, v);
    default: return bodyFallback(mod, meta, v);
  }
}


