// ═══════════════════════════════════════════════════════════════════
// TEMPLATE UTILS — Page label & extra props helpers
// ═══════════════════════════════════════════════════════════════════
// FASE 4: This file was stripped down from the legacy template-data.ts.
// The dead functions (buildTemplateData, createTemplatePage) have been
// removed. Only the two live utility functions remain.
//
// New code should use:
//   - PagePresetRegistry for page creation
//   - deriveSchema() for schema generation
//   - getTemplateLabel() / getTemplateExtraProps() for metadata
// ═══════════════════════════════════════════════════════════════════

import type { PageTemplateType } from '@/components/canva/types';
import { useAuthoringStore } from '@/store/authoring-store';

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

// ── Get extra page properties for a template type ─────────────

export function getTemplateExtraProps(templateType: PageTemplateType): Partial<Record<string, unknown>> {
  // Dark background for all template types — consistent with the dark-themed renderers
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
