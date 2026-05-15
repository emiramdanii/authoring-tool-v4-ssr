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
    const jumlahPertemuan = authStore.atp.jumlahPertemuan || 1;
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
    // All pages now get page.schema from creation via deriveSchema().
    // One-way data flow: Authoring → deriveSchema() → page.schema → Renderer
    const newPages: CanvaPage[] = [];

    if (blueprint.includeCover) {
      newPages.push(createPageFromPreset('cover', newPages.length));
    }

    if (blueprint.includeDokumen && (authStore.cp.capaianFase || authStore.tp.length > 0)) {
      newPages.push(createPageFromPreset('dokumen', newPages.length));
    }

    if (blueprint.includeSkenario && authStore.skenario.length > 0) {
      newPages.push(createPageFromPreset('skenario', newPages.length));
    }

    if (blueprint.includeMateri && (materiModules.length > 0 || authStore.materi.blok.length > 0)) {
      newPages.push(createPageFromPreset('materi', newPages.length));
    }

    // Kuis pages — split by soalPerHalaman, with optional pertemuan filtering
    if (blueprint.includeKuis && kuis.length > 0) {
      const perPage = blueprint.soalPerHalaman || 5;
      if (jumlahPertemuan <= 1) {
        // Single pertemuan — original behavior
        if (kuis.length <= perPage) {
          newPages.push(createPageFromPreset('kuis', newPages.length));
        } else {
          const totalPages = Math.ceil(kuis.length / perPage);
          for (let p = 0; p < totalPages; p++) {
            newPages.push(createPageFromPreset('kuis', newPages.length));
          }
        }
      } else {
        // Per-pertemuan kuis pages
        for (let pert = 1; pert <= jumlahPertemuan; pert++) {
          // Include items tagged for this pertemuan, plus untagged items (pertemuan === undefined)
          const kuisForPert = kuis.filter((k: { q: string; pertemuan?: number }) =>
            k.pertemuan === pert || k.pertemuan === undefined
          );
          if (kuisForPert.length === 0) continue;
          if (kuisForPert.length <= perPage) {
            newPages.push(createPageFromPreset('kuis', newPages.length));
          } else {
            const totalPages = Math.ceil(kuisForPert.length / perPage);
            for (let p = 0; p < totalPages; p++) {
              newPages.push(createPageFromPreset('kuis', newPages.length));
            }
          }
        }
      }
    }

    if (blueprint.includeGame && games.length > 0) {
      newPages.push(createPageFromPreset('game', newPages.length));
    }

    if (blueprint.includeHasil) {
      newPages.push(createPageFromPreset('hasil', newPages.length));
    }

    if (blueprint.includePetunjuk && authStore.petunjuk.langkah.length > 0) {
      newPages.push(createPageFromPreset('petunjuk', newPages.length));
    }

    if (blueprint.includeDiskusi && authStore.diskusi.pertanyaan.length > 0) {
      newPages.push(createPageFromPreset('diskusi', newPages.length));
    }

    if (blueprint.includeRefleksi && authStore.refleksi.pertanyaan.length > 0) {
      newPages.push(createPageFromPreset('refleksi', newPages.length));
    }

    if (blueprint.includePenutup && authStore.penutup.preview.length > 0) {
      newPages.push(createPageFromPreset('penutup', newPages.length));
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

    get()._pushHistory();
    set({ pages: newPages, currentPageIndex: 0, selectedElId: null, selectedElIds: [], selectedBlockId: null, selectedBlockType: null, editingBlockId: null, selectedBlockIds: [] });
    toast.success(
      `⚡ ${pageType.name}: ${newPages.length} halaman dibuat${blueprint.autoGenerateModules ? ' + modul auto-generated' : ''}`
    );
  },
});
