// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Template data population helpers
// ═══════════════════════════════════════════════════════════════
// Extracted from canva-store.ts: addTemplatePage & setTemplateType
// share identical switch logic for populating templateData.

import type { PageTemplateType } from '@/components/canva/types';
import { useAuthoringStore } from '@/store/authoring-store';
import {
  GAME_TYPES,
  MATERI_MODULE_TYPES,
  getHeroData,
  populateTemplateElements,
} from '@/lib/canva-export-helpers';
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
      };

    case 'petunjuk':
      return {
        petunjuk: authStore.petunjuk,
      };

    case 'dokumen':
      return {
        cp: authStore.cp,
        tp: authStore.tp,
        atp: authStore.atp,
      };

    case 'materi':
      return {
        blok: authStore.materi.blok,
        modules: authStore.modules.filter((m: Record<string, unknown>) =>
          (MATERI_MODULE_TYPES as readonly string[]).includes(m.type as string)
        ),
      };

    case 'diskusi':
      return {
        diskusi: authStore.diskusi,
      };

    case 'kuis':
      return {
        kuis: authStore.kuis.filter(k => k.q.trim()),
      };

    case 'game':
      return {
        games: authStore.modules.filter((m: Record<string, unknown>) =>
          (GAME_TYPES as readonly string[]).includes(m.type as string)
        ),
      };

    case 'hasil':
      return {
        totalKuis: authStore.kuis.filter(k => k.q.trim()).length,
        namaBab: meta.namaBab || '',
      };

    case 'refleksi':
      return {
        refleksi: authStore.refleksi,
      };

    case 'penutup':
      return {
        penutup: authStore.penutup,
      };

    case 'skenario':
      return {
        skenario: authStore.skenario,
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
  if (templateType === 'cover' || templateType === 'hero') {
    return { bgColor: '#0f172a' };
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
