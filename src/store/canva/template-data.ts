// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Template data population helpers
// ═══════════════════════════════════════════════════════════════
// ⚠️ FASE 3: DEPRECATED — This file is LEGACY.
//
// The new data flow is: Authoring → deriveSchema() → page.schema
// buildTemplateData() is NO LONGER used by the main code paths:
//   - PagePresetRegistry: uses deriveSchema() directly
//   - sync-slice: uses deriveSchemaForPage() directly
//   - page-slice: uses deriveSchema() directly
//
// This file is kept ONLY for:
//   - getTemplateLabel() — still used for page label generation
//   - getTemplateExtraProps() — still used for background colors
//   - createTemplatePage() — may be used by export pipeline
//
// Do NOT add new code that depends on buildTemplateData().
// Use deriveSchema() from @/core/schema/derive-schema instead.
// ═══════════════════════════════════════════════════════════════

import type { PageTemplateType } from '@/components/canva/types';
import { useAuthoringStore } from '@/store/authoring-store';
import {
  GAME_TYPES,
  MATERI_MODULE_TYPES,
  getHeroData,
  populateTemplateElements,
} from '@/lib/canva-constants';
import { createPage, createElId } from './constants';

// ── Label map for template types ──────────────────────────────

export function getTemplateLabel(templateType: PageTemplateType, pageCount: number): string {
  const authStore = useAuthoringStore.getState();
  const meta = authStore.meta;
  const labelMap: Record<string, string> = {
    cover: 'Cover - ' + (meta.judulPertemuan || 'Halaman Judul'),
    petunjuk: 'Petunjuk Penggunaan',
    dokumen: 'Dokumen CP/TP/ATP',
    materi: 'Materi Pembelajaran',
    diskusi: 'Diskusi & Pertanyaan',
    kuis: 'Kuis Interaktif',
    game: 'Game Interaktif',
    hasil: 'Hasil & Apresiasi',
    refleksi: 'Refleksi Diri',
    penutup: 'Penutup',
    hero: 'Hero Banner',
    skenario: 'Skenario Interaktif',
    custom: 'Halaman ' + (pageCount + 1),
  };
  return labelMap[templateType] || 'Halaman ' + (pageCount + 1);
}

// ── Populate templateData for a given template type ───────────

/**
 * Populate templateData for a given template type.
 * @deprecated FASE 3: Use deriveSchema() from @/core/schema/derive-schema instead.
 * This function is kept for backward compat with export pipeline only.
 * New code should NEVER call this function.
 */
export function buildTemplateData(templateType: PageTemplateType): Record<string, unknown> {
  const authStore = useAuthoringStore.getState();
  const meta = authStore.meta;

  switch (templateType) {
    case 'cover':
      return {
        title: meta.judulPertemuan || 'Judul Pertemuan',
        subtitle: meta.subjudul || 'Subjudul',
        icon: meta.ikon || '📚',
        mapel: meta.mapel || '',
        kelas: meta.kelas || '',
        namaBab: meta.namaBab || '',
        durasi: meta.durasi || '',
      };

    case 'petunjuk':
      // Spread flat so PetunjukTemplate reads td.langkah, td.title, td.intro, td.tips
      return {
        ...authStore.petunjuk,
      };

    case 'dokumen':
      return {
        cp: authStore.cp,
        tp: authStore.tp,
        atp: authStore.atp,
        alur: authStore.alur,
        atpNamaBab: authStore.atp?.namaBab || '',
      };

    case 'materi':
      return {
        blok: authStore.materi.blok,
        modules: authStore.modules.filter((m: Record<string, unknown>) =>
          (MATERI_MODULE_TYPES as readonly string[]).includes(m.type as string)
        ),
      };

    case 'diskusi':
      // Spread flat so DiskusiTemplate reads td.pertanyaan, td.title, td.intro
      return {
        ...authStore.diskusi,
      };

    case 'kuis':
      return {
        kuis: authStore.kuis.filter(k => k.q?.trim()),
      };

    case 'game':
      return {
        games: authStore.modules.filter((m: Record<string, unknown>) =>
          (GAME_TYPES as readonly string[]).includes(m.type as string)
        ),
      };

    case 'hasil':
      return {
        totalKuis: authStore.kuis.filter(k => k.q?.trim()).length,
        namaBab: meta.namaBab || '',
      };

    case 'refleksi':
      // Spread flat so RefleksiTemplate reads td.pertanyaan, td.title, td.intro, td.penugasan
      return {
        ...authStore.refleksi,
      };

    case 'penutup':
      // Spread flat so PenutupTemplate reads td.preview, td.title, td.subjudul, td.nextPertemuan
      return {
        ...authStore.penutup,
      };

    case 'skenario':
      return {
        skenario: authStore.skenario,
        skenarioTitle: authStore.skenario.length > 0 ? 'Skenario Interaktif' : '',
      };

    case 'hero':
      return getHeroData(authStore);

    case 'custom':
    default:
      return {};
  }
}

// ── Get extra page properties for a template type ─────────────

export function getTemplateExtraProps(templateType: PageTemplateType): Partial<Record<string, unknown>> {
  // Dark background for all template types — consistent with the dark-themed template renderers
  // Cover and hero use a slightly different shade
  if (templateType === 'cover' || templateType === 'hero') {
    return { bgColor: '#0f172a' };
  }
  // All other templates use the same dark background so content is visible
  if (templateType !== 'custom') {
    return { bgColor: '#0e1c2f' };
  }
  return {};
}

// ── Full factory: create a new page with template data ────────

export function createTemplatePage(templateType: PageTemplateType, pageCount: number) {
  const label = getTemplateLabel(templateType, pageCount);
  const newPage = createPage(label, templateType);
  newPage.templateData = buildTemplateData(templateType);
  Object.assign(newPage, getTemplateExtraProps(templateType));
  newPage.elements = populateTemplateElements(newPage, createElId);
  return newPage;
}
