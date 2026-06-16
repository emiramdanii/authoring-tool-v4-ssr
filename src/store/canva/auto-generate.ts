// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Auto Generate engine (page type driven)
// ═══════════════════════════════════════════════════════════════

import { toast } from 'sonner';
import type { StateCreator } from 'zustand';
import type { CanvaPage } from '@/components/canva/types';
import type { CanvaState } from './types';
import type { PageTypeDefinition } from '@/store/page-types';
import { useAuthoringStore } from '@/store/authoring-store';
import { useDirtyStore } from '@/store/dirty-store';
import type { Module } from '@/store/authoring/types';
import {
  GAME_TYPES,
  MATERI_RAKIT_TYPES,
} from '@/lib/canva-constants';
import { ensureModuleIds } from '@/lib/module-resolver';
import { PAGE_DENSITY_RULES } from '@/core/template/compiler/LearningUnit';
// FASE 3: Schema-native page creation — no more buildTemplateData()
import { createPageFromPreset } from '@/core/preset/PagePresetRegistry';
import { assertDocumentPurity } from '@/core/schema/session-state';
// FASE 5: Schema-first generation — genXxxSchema() writes content directly to page.schema
import {
  genCoverSchema,
  genMateriSchema,
  genKuisSchema,
  genDiskusiSchema,
  genRefleksiSchema,
  genSkenarioSchema,
  genFlashcardSchema,
  genTpSchema,
  genAlurSchema,
  genMotivasiSchema,
  genRangkumanSchema,
  genTujuanDisplaySchema,
  genHasilSchema,
  genPenutupSchema,
  genPetunjukSchema,
  genMatchingSchema,
  genTrueFalseSchema,
  genTabIconsSchema,
  genAccordionSchema,
  genTimelineModuleSchema,
  genInfografisSchema,
} from '@/core/schema/generators';
import type { SchemaBlock } from '@/core/schema/types';
import { getStoredText, parseStoredText } from '@/components/authoring/auto-generate/regenerate';
import { saveCrashCheckpoint, transactionRollback } from '@/core/recovery';

// ── Auto-generate modules from existing authoring data ────────
// Phase 5-G: ALL presentation module types (tab-icons, accordion,
// timeline, infografis) are now schema blocks — they write directly
// to page.schema instead of AuthoringStore.modules. Only truly
// non-schema modules (none remaining as of Phase 5-G) go to
// AuthoringStore.
export function autoGenerateContent(): {
  modules: Array<Record<string, unknown>>;
  gameBlocks: SchemaBlock[];
  skenario: Array<Record<string, unknown>>;
  materi: { blok: Array<Record<string, unknown>> };
} {
  const authStore = useAuthoringStore.getState();
  const newModules: Array<Record<string, unknown>> = [];
  const newBlok: Array<Record<string, unknown>> = [];
  const gameBlocks: SchemaBlock[] = [];

  // 1. From TP → tab-icons (Phase 5-G: now writes as tab-icons schema block)
  if (authStore.tp.length > 0) {
    gameBlocks.push(genTabIconsSchema(authStore.tp) as SchemaBlock);
  }

  // 2. From CP → accordion (Phase 5-G: now writes as accordion schema block)
  if (authStore.cp.capaianFase) {
    gameBlocks.push(genAccordionSchema(authStore.cp) as SchemaBlock);
  }

  // 3. From alur → timeline (Phase 5-G: now writes as timeline schema block)
  if (authStore.alur.length >= 3) {
    gameBlocks.push(genTimelineModuleSchema(authStore.alur) as SchemaBlock);
  }

  // 4. From kuis → memory game (Phase 5-C: now writes as memory-game schema block)
  if (authStore.kuis.length >= 3) {
    const pairs = authStore.kuis.slice(0, 6).map(k => ({
      left: k.q.length > 50 ? k.q.slice(0, 50) + '...' : k.q,
      right: k.opts[k.ans] || 'Jawaban',
    }));
    // Write as memory-game schema block instead of projection module
    gameBlocks.push({
      type: 'memory-game',
      id: `auto-gen-memory-${Date.now()}`,
      title: 'Memory: Soal & Jawaban',
      pairs,
    } as SchemaBlock);
  }

  // 5. From CP profil → infografis (Phase 5-G: now writes as infografis schema block)
  if (authStore.cp.profil && authStore.cp.profil.length > 0) {
    gameBlocks.push(genInfografisSchema(authStore.cp.profil) as SchemaBlock);
  }

  return {
    modules: newModules,
    gameBlocks,
    skenario: [],
    materi: { blok: newBlok },
  };
}

// ── Slice type ────────────────────────────────────────────────
export type AutoGenerateSlice = Pick<CanvaState, 'generateFromPageType'>;

// ── Slice implementation ──────────────────────────────────────
export const createAutoGenerateSlice: StateCreator<CanvaState, [], [], AutoGenerateSlice> = (set, get) => ({
  generateFromPageType: (pageType: PageTypeDefinition, config: Record<string, number | string | boolean>) => {
    const blueprint = pageType.generate(config);
    const authStore = useAuthoringStore.getState();
    const kuis = authStore.kuis.filter((k: { q: string }) => k.q.trim());
    const jumlahPertemuan = (typeof config.jumlahPertemuan === 'number' ? config.jumlahPertemuan : authStore.atp.jumlahPertemuan) || 1;
    const perPertemuan = blueprint.perPertemuan && jumlahPertemuan > 1;
    let games = authStore.modules.filter((m: Module) =>
      (GAME_TYPES as readonly string[]).includes(m.type)
    );
    let materiModules = authStore.modules.filter((m: Module) =>
      (MATERI_RAKIT_TYPES as readonly string[]).includes(m.type)
    );

    // Step 1: Auto-generate content if enabled
    // Phase 5-G: ALL auto-generated presentation types are now schema blocks.
    // No more AuthoringStore module writes for tab-icons, accordion, timeline, infografis.
    // They all go directly to page.schema via applyBlockToPages.
    let autoGenGameBlocks: SchemaBlock[] = [];
    if (blueprint.autoGenerateModules) {
      const generated = autoGenerateContent();
      autoGenGameBlocks = generated.gameBlocks;

      // Phase 5-G: generated.modules is now always empty — all presentation
      // types are schema blocks. But keep the check for backward compat.
      const generatedModules = generated.modules;
      if (generatedModules.length > 0) {
        const existingTypes = new Set(
          authStore.modules.map((m: Module) => m.type + '_' + m.title)
        );
        const newModules = generatedModules.filter(
          m => !existingTypes.has((m as Record<string, unknown>).type as string + '_' + (m as Record<string, unknown>).title as string)
        );
        if (newModules.length > 0) {
          const modulesWithIds = ensureModuleIds(newModules) as Module[];
          useAuthoringStore.setState({
            modules: [...authStore.modules, ...modulesWithIds],
          });
          useDirtyStore.getState().markDirty();
          toast.success(`🤖 Auto-generate: ${newModules.length} modul dibuat dari data yang ada`);
        }
      }
      // Re-read after merge
      const updatedModules = useAuthoringStore.getState().modules;
      games = updatedModules.filter((m: Module) =>
        (GAME_TYPES as readonly string[]).includes(m.type)
      );
      materiModules = updatedModules.filter((m: Module) =>
        (MATERI_RAKIT_TYPES as readonly string[]).includes(m.type)
      );
    }

    // Step 2: Build pages using createPageFromPreset (FASE 3 — schema-native)
    const newPages: CanvaPage[] = [];
    const storedParsed = parseStoredText();

    // ═══════════════════════════════════════════════════════════════
    // HELPER: Create a page with schema content + optional label override
    // ═══════════════════════════════════════════════════════════════
    const addPage = (presetId: import('@/components/canva/types').PageTemplateType, label?: string, schemaBlocks?: SchemaBlock[]) => {
      const page = createPageFromPreset(presetId, newPages.length);
      if (label) page.label = label;
      if (page.schema && schemaBlocks && schemaBlocks.length > 0) {
        page.schema.blocks = schemaBlocks;
      }
      newPages.push(page);
    };

    // ═══════════════════════════════════════════════════════════════
    // GLOBAL PAGES (before per-pertemuan loop)
    // ═══════════════════════════════════════════════════════════════

    // Phase 5-C: Add auto-generated game blocks as schema pages
    // These are game types (memory, etc.) that now go to schema instead
    // of AuthoringStore.modules. They are added as game pages with
    // their schema blocks pre-populated.
    if (autoGenGameBlocks.length > 0) {
      for (const gameBlock of autoGenGameBlocks) {
        addPage('game', `Game: ${gameBlock.type.replace('-game', '').replace('-set', '')}`, [gameBlock]);
      }
    }

    if (blueprint.includeCover) {
      addPage('cover', undefined, storedParsed ? [genCoverSchema(authStore.meta)] : undefined);
    }

    if (blueprint.includePetunjuk && authStore.petunjuk.langkah.length > 0) {
      addPage('petunjuk', undefined, [genPetunjukSchema(authStore.petunjuk.langkah, authStore.petunjuk.tips)]);
    }

    if (blueprint.includeDokumen && (authStore.cp.capaianFase || authStore.tp.length > 0)) {
      if (storedParsed) {
        const blocks: SchemaBlock[] = [];
        blocks.push(genTpSchema(storedParsed, { pertemuan: jumlahPertemuan, bloomMax: 6 }));
        blocks.push(genAlurSchema(storedParsed, { pertemuan: jumlahPertemuan, bloomMax: 6 }, authStore.meta));
        addPage('dokumen', undefined, blocks);
      } else {
        addPage('dokumen');
      }
    }

    if (blueprint.includeTujuan && authStore.tp.length > 0) {
      addPage('tujuan', undefined, storedParsed ? [genTujuanDisplaySchema(storedParsed, { pertemuan: jumlahPertemuan, bloomMax: 6 })] : undefined);
    }

    // ═══════════════════════════════════════════════════════════════
    // PER-PERTEMUAN PAGES (or single pass if not per-pertemuan)
    // ═══════════════════════════════════════════════════════════════
    //
    // When perPertemuan is enabled, content sections (Materi, Kuis,
    // Diskusi, Refleksi, Rangkuman) are generated once per pertemuan
    // with filtered content. Page labels include pertemuan number.
    //
    // When perPertemuan is disabled, single pass (original behavior).

    const pertemuanRange = perPertemuan ? jumlahPertemuan : 1;

    for (let pert = 1; pert <= pertemuanRange; pert++) {
      const pLabel = perPertemuan ? ` — P${pert}` : '';

      if (blueprint.includeMotivasi) {
        addPage('motivasi', `Motivasi${pLabel}`, storedParsed ? [genMotivasiSchema(storedParsed, authStore.meta)] : undefined);
      }

      if (blueprint.includeSkenario && authStore.skenario.length > 0) {
        addPage('skenario', `Skenario${pLabel}`, storedParsed ? [genSkenarioSchema(storedParsed, authStore.meta)] : undefined);
      }

      if (blueprint.includeMateri && (materiModules.length > 0 || authStore.materi.blok.length > 0)) {
        if (storedParsed) {
          const materiBlocks = genMateriSchema(
            storedParsed,
            { judulPertemuan: authStore.meta.judulPertemuan, namaBab: authStore.meta.namaBab },
          );
          addPage('materi', `Materi${pLabel}`, materiBlocks);
        } else {
          addPage('materi', `Materi${pLabel}`);
        }
      }

      // Kuis pages — split by soalPerHalaman, with pertemuan filtering
      if (blueprint.includeKuis && kuis.length > 0) {
        // Phase 4: Use density rules as default, allow blueprint override
        const perPage = blueprint.soalPerHalaman || PAGE_DENSITY_RULES.defaultQuizQuestionsPerPage;

        // Filter kuis by pertemuan when perPertemuan is enabled
        const kuisForPert = perPertemuan
          ? kuis.filter((k: { q: string; pertemuan?: number }) =>
              k.pertemuan === pert || k.pertemuan === undefined
            )
          : (jumlahPertemuan > 1
              ? kuis // old behavior: don't filter in non-perPertemuan mode
              : kuis);

        if (kuisForPert.length > 0) {
          if (kuisForPert.length <= perPage) {
            addPage('kuis', `Kuis${pLabel}`, storedParsed ? [genKuisSchema(storedParsed, kuisForPert.length, jumlahPertemuan)] : undefined);
          } else {
            const totalPages = Math.ceil(kuisForPert.length / perPage);
            for (let p = 0; p < totalPages; p++) {
              const pageLabel = totalPages > 1 ? `Kuis${pLabel} (${p + 1}/${totalPages})` : `Kuis${pLabel}`;
              addPage('kuis', pageLabel, storedParsed ? [genKuisSchema(storedParsed, perPage, jumlahPertemuan)] : undefined);
            }
          }
        }
      }

      if (blueprint.includeGame && games.length > 0) {
        addPage('game', `Game${pLabel}`);
      }

      if (blueprint.includeDiskusi && authStore.diskusi.pertanyaan.length > 0) {
        addPage('diskusi', `Diskusi${pLabel}`, storedParsed ? [genDiskusiSchema(storedParsed, authStore.tp, { judulPertemuan: authStore.meta.judulPertemuan, namaBab: authStore.meta.namaBab })] : undefined);
      }

      if (blueprint.includeRefleksi && authStore.refleksi.pertanyaan.length > 0) {
        addPage('refleksi', `Refleksi${pLabel}`, storedParsed ? [genRefleksiSchema(storedParsed, { judulPertemuan: authStore.meta.judulPertemuan, namaBab: authStore.meta.namaBab })] : undefined);
      }

      if (blueprint.includeRangkuman && authStore.materi.blok.length > 0) {
        addPage('rangkuman', `Rangkuman${pLabel}`, storedParsed ? [genRangkumanSchema(storedParsed, authStore.meta)] : undefined);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // GLOBAL CLOSING PAGES (after per-pertemuan loop)
    // ═══════════════════════════════════════════════════════════════

    if (blueprint.includeHasil) {
      addPage('hasil', undefined, [genHasilSchema()]);
    }

    if (blueprint.includePenutup && authStore.penutup.preview.length > 0) {
      addPage('penutup', undefined, [genPenutupSchema(authStore.meta)]);
    }

    // FASE 3: Store navbar/timer config in page.schema.nav instead of templateData
    // This ensures the schema is the single source of truth for all page content.
    // templateData is deprecated — new code writes to schema directly.
    newPages.forEach(p => {
      if (p.schema) {
        const navUpdates: Record<string, unknown> = {};
        if (blueprint.navbar) {
          // blueprint.navbar can be boolean or object — schema stores only objects
          navUpdates.navbar = typeof blueprint.navbar === 'object' ? blueprint.navbar : {};
        }
        if (blueprint.timer) {
          navUpdates.timer = typeof blueprint.timer === 'object' ? blueprint.timer : {};
        }
        p.schema.nav = {
          ...p.schema.nav,
          ...navUpdates,
        };
      } else {
        // Custom pages without schema — store in templateData as legacy fallback
        if (!p.templateData) p.templateData = {};
        p.templateData.navbar = blueprint.navbar;
        p.templateData.timer = blueprint.timer;
      }
    });

    if (newPages.length === 0) {
      newPages.push(createPageFromPreset('custom', 0));
    }

    // Dev-mode purity guard: ensure generated schemas have no runtime state leakage.
    // This catches bugs in schema generators early — before data reaches the store.
    if (process.env.NODE_ENV !== 'production') {
      for (const p of newPages) {
        if (p.schema) {
          assertDocumentPurity(p.schema, `auto-generate page=${p.id}`);
        }
      }
    }

    // ── FASE 6: Crash checkpoint + transaction before AI-generated content is applied ──
    const { pages: currentPages, ratioId } = get();
    saveCrashCheckpoint(currentPages, ratioId, 'ai-generate');
    const txId = transactionRollback.checkpoint(currentPages, ratioId, 'ai-generate');

    get()._pushHistory();

    set({ pages: newPages, currentPageIndex: 0, selectedElId: null, selectedElIds: [], selectedBlockId: null, selectedBlockType: null, editingBlockId: null, selectedBlockIds: [] });

    // Sprint 7.2A: Page generation replaces ALL pages — must notify dirty store
    useDirtyStore.getState().markDirty();

    // FASE 6: Commit transaction — generation succeeded
    transactionRollback.commit(txId);
    toast.success(
      `⚡ ${pageType.name}: ${newPages.length} halaman dibuat${perPertemuan ? ` (${jumlahPertemuan} pertemuan)` : ''}${blueprint.autoGenerateModules ? ' + modul auto-generated' : ''}`
    );
  },
});
