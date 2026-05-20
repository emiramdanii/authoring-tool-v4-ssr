// ═══════════════════════════════════════════════════════════════════
// PROPERTY SCHEMAS — Layout block schemas
// ═══════════════════════════════════════════════════════════════════

import type { PropertySchema } from '../types';

export const COVER_PROPERTY_SCHEMA: PropertySchema = {
  blockType: 'cover',
  groups: [
    { key: 'content', label: 'Konten', icon: 'Type' },
    { key: 'badges', label: 'Badge', icon: 'Award' },
    { key: 'cta', label: 'CTA', icon: 'MousePointerClick', collapsed: true },
    { key: 'style', label: 'Gaya', icon: 'Palette', collapsed: true },
  ],
  properties: [
    { key: 'variant', type: 'variant', label: 'Varian', group: 'style' },
    { key: 'icon', type: 'icon', label: 'Icon', group: 'content', placeholder: '🏠' },
    { key: 'title', type: 'text', label: 'Judul', group: 'content', required: true },
    { key: 'subtitle', type: 'textarea', label: 'Subjudul', group: 'content', rows: 3 },
    {
      key: 'badges', type: 'array', label: 'Badge', group: 'badges',
      fields: [
        { key: 'icon', label: 'Icon', type: 'icon', placeholder: '🏫' },
        { key: 'text', label: 'Teks', type: 'text' },
        { key: 'color', label: 'Warna', type: 'color' },
      ],
    },
    { key: 'accentColor', type: 'color', label: 'Warna Aksen', group: 'style', defaultValue: 'y' },
    { key: 'cta.label', type: 'text', label: 'CTA Label', group: 'cta', placeholder: 'Mulai →' },
    { key: 'meta.durasi', type: 'text', label: 'Durasi', group: 'content', placeholder: '2 x 45 menit' },
  ],
};

/** Hero uses the same data model as Cover but with its own blockType discriminator */
export const HERO_PROPERTY_SCHEMA: PropertySchema = {
  ...COVER_PROPERTY_SCHEMA,
  blockType: 'hero',
};
