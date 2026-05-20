// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Auto Generate engine (page type driven)
// ═══════════════════════════════════════════════════════════════

import { toast } from 'sonner';
import type { StateCreator } from 'zustand';
import type { CanvaPage } from '@/components/canva/types';
import type { CanvaState } from './types';
import type { PageTypeDefinition } from '@/store/page-types';
import { useAuthoringStore } from '@/store/authoring-store';
import type { Module } from '@/store/authoring/types';
import {
  GAME_TYPES,
  MATERI_RAKIT_TYPES,
} from '@/lib/canva-constants';
import { ensureModuleIds } from '@/lib/module-resolver';
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
} from '@/core/schema/generators';
import type { SchemaBlock } from '@/core/schema/types';
import { getStoredText, parseStoredText } from '@/components/authoring/auto-generate/regenerate';
import { saveCrashCheckpoint } from '@/core/recovery';

// ── Auto-generate modules from existing authoring data ────────
export function autoGenerateContent(): {
  modules: Array<Record<string, unknown>>;
  skenario: Array<Record<string, unknown>>;
  materi: { blok: Array<Record<string, unknown>> };
} {
  const authStore = useAuthoringStore.getState();
  const newModules: Array<Record<string, unknown>> = [];
  const newBlok: Array<Record<string, unknown>> = [];

  // 1. From TP → tab-icons module
  if (authStore.tp.length > 0) {
    newModules.push({
      type: 'tab-icons',
      title: `${authStore.tp.length} Tujuan Pembelajaran`,
      intro: `Eksplorasi ${authStore.tp.length} tujuan pembelajaran hari ini`,
      layout: 'horizontal',
      animation: 'fade',
      tabs: authStore.tp.map((tp, i) => ({
        icon: tp.verb === 'Menjelaskan' ? '📖'
          : tp.verb === 'Mengidentifikasi' ? '🔍'
          : tp.verb === 'Menganalisis' ? '🔬'
          : tp.verb === 'Memberikan contoh' ? '💡'
          : tp.verb === 'Menerapkan' ? '🛠️'
          : '📌',
        judul: tp.verb,
        warna: tp.color || ['#f9c82e', '#3ecfcf', '#a78bfa', '#34d399', '#ff6b6b'][i % 5],
        isi: tp.desc,
        poin: [],
        refleksi: '',
      })),
    });
  }

  // 2. From CP → accordion module
  if (authStore.cp.capaianFase) {
    newModules.push({
      type: 'accordion',
      title: 'Capaian Pembelajaran',
      intro: 'Klik setiap bagian untuk membaca detail capaian pembelajaran',
      items: [
        ...(authStore.cp.elemen ? [{ icon: '📌', judul: 'Elemen', isi: authStore.cp.elemen }] : []),
        ...(authStore.cp.capaianFase ? [{ icon: '🎯', judul: 'Capaian Fase', isi: authStore.cp.capaianFase }] : []),
        ...(authStore.cp.profil?.length > 0 ? [{ icon: '⭐', judul: 'Profil Pelajar Pancasila', isi: authStore.cp.profil.join(' · ') }] : []),
      ],
    });
  }

  // 3. From alur → timeline module
  if (authStore.alur.length >= 3) {
    newModules.push({
      type: 'timeline',
      title: 'Alur Kegiatan Pembelajaran',
      intro: `Alur ${authStore.alur.length} langkah kegiatan hari ini`,
      events: authStore.alur.map((a, i) => ({
        icon: a.fase === 'Pendahuluan' ? '🌅' : a.fase === 'Inti' ? '📚' : '🌙',
        judul: a.judul,
        isi: `${a.durasi} — ${a.deskripsi}`,
        color: ['#f9c82e', '#3ecfcf', '#a78bfa', '#34d399', '#ff6b6b', '#fb923c'][i % 6],
      })),
    });
  }

  // 4. From kuis → memory game
  if (authStore.kuis.length >= 3) {
    const pairs = authStore.kuis.slice(0, 6).map(k => ({
      teks: k.q.length > 50 ? k.q.slice(0, 50) + '...' : k.q,
      kategori: k.opts[k.ans] || 'Jawaban',
    }));
    newModules.push({
      type: 'memory',
      title: 'Memory: Soal & Jawaban',
      pasangan: pairs,
    });
  }

  // 5. From CP profil → infografis module
  if (authStore.cp.profil && authStore.cp.profil.length > 0) {
    newModules.push({
      type: 'infografis',
      title: 'Profil Pelajar Pancasila',
      layout: 'grid',
      intro: 'Dimensi Profil Pelajar Pancasila yang dikembangkan dalam pembelajaran ini',
      kartu: authStore.cp.profil.map((p, i) => ({
        icon: ['🛡️', '🌍', '🤝', '🧠', '💪', '🎨'][i % 6],
        judul: p,
        isi: `Dimensi ${p} dikembangkan melalui kegiatan pembelajaran ini`,
        warna: ['#f9c82e', '#3ecfcf', '#a78bfa', '#34d399', '#ff6b6b', '#fb923c'][i % 6],
      })),
    });
  }

  return {
    modules: newModules,
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
    if (blueprint.autoGenerateModules) {
      const generated = autoGenerateContent();
      const generatedModules = generated.modules;
      // Merge generated modules into authoring store if not already there
      const existingTypes = new Set(
        authStore.modules.map((m: Module) => m.type + '_' + m.title)
      );
      const newModules = generatedModules.filter(
        m => !existingTypes.has((m as Record<string, unknown>).type as string + '_' + (m as Record<string, unknown>).title as string)
      );
      if (newModules.length > 0) {
        // Ensure all auto-generated modules have stable _id fields
        // so resolveModule() can find them by moduleId
        const modulesWithIds = ensureModuleIds(newModules) as Module[];
        useAuthoringStore.setState({
          modules: [...authStore.modules, ...modulesWithIds],
          dirty: true,
        });
        toast.success(`🤖 Auto-generate: ${newModules.length} modul dibuat dari data yang ada`);
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
        const perPage = blueprint.soalPerHalaman || 5;

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

    get()._pushHistory();

    // ── FASE 6: Crash checkpoint before AI-generated content is applied ──
    saveCrashCheckpoint(get().pages, get().ratioId, 'ai-generate');

    set({ pages: newPages, currentPageIndex: 0, selectedElId: null, selectedElIds: [], selectedBlockId: null, selectedBlockType: null, editingBlockId: null, selectedBlockIds: [] });
    toast.success(
      `⚡ ${pageType.name}: ${newPages.length} halaman dibuat${perPertemuan ? ` (${jumlahPertemuan} pertemuan)` : ''}${blueprint.autoGenerateModules ? ' + modul auto-generated' : ''}`
    );
  },
});
