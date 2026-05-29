// ═══════════════════════════════════════════════════════════════════
// MODERN EDUCATOR CONTRACT — Light Theme for Stitch Design System
// ═══════════════════════════════════════════════════════════════════
// Visual DNA: Emerald Green (#006c49) + Royal Blue (#0058be) + Amber (#e29100)
// Based on the Stitch "Modern Educator" design system for Indonesian educators.
//
// Design philosophy:
//   - LIGHT theme — off-white bg (#f7f9fb), white cards, tonal layering
//   - Three accent colors: Emerald (e), Blue (b), Amber (a)
//   - Per-page accent token assignment — each page type gets one accent
//   - Plus Jakarta Sans for headings, Nunito Sans for body
//   - 24px card radius, pill badges, no heavy shadows
//   - Glassmorphism: backdrop-blur:20px + 90% opacity white
// ═══════════════════════════════════════════════════════════════════

import type { TemplateThemeContract } from './TemplateThemeContract';
import { registerContract, MODERN_EDUCATOR_ACCENT_PALETTE } from './TemplateThemeContract';

export const MODERN_EDUCATOR_CONTRACT: TemplateThemeContract = {
  id: 'modern-educator',
  name: '🌿 Modern Educator',
  description: 'Light theme — Emerald Green + Royal Blue + Amber. Based on the Stitch design system for Indonesian educators.',

  colors: {
    background: '#f7f9fb',
    surface: '#ffffff',
    card: '#ffffff',
    text: '#191c1e',
    muted: '#6c7a71',
    accent: '#006c49',
    accentBg: 'rgba(0,108,73,0.08)',
    accentBorder: 'rgba(0,108,73,0.20)',
    maxAccents: 3,
    accentTokens: ['e', 'b', 'a'],  // emerald, blue, amber
  },

  typography: {
    heroSize: 48,
    titleSize: 36,
    headingSize: 26,
    bodyLgSize: 22,
    bodySize: 20,
    captionSize: 16,
    microSize: 14,
    displayFont: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
    bodyFont: "var(--font-nunito), 'Nunito Sans', sans-serif",
    minFontSize: 16,
  },

  spacing: {
    pagePadding: 32,
    cardPadding: 24,
    blockGap: 24,
    itemGap: 16,
    nestedPadding: 20,
  },

  borders: {
    cardRadius: 24,
    pillRadius: 9999,
    cardBorder: '1px solid rgba(224, 227, 229, 1)',
  },

  shadows: {
    card: '0 1px 2px rgba(0,0,0,0.04)',
    elevated: '0 4px 12px rgba(0,0,0,0.06)',
  },

  maxContentHeight: 640,
  cardTreatment: 'flat',
  headerTreatment: 'accented',

  pageAccents: {
    cover:       { accentToken: 'e', bgTint: 'rgba(0,108,73,0.04)' },
    petunjuk:    { accentToken: 'b', bgTint: 'rgba(0,88,190,0.04)' },
    tujuan:      { accentToken: 'b', bgTint: 'rgba(0,88,190,0.04)' },
    motivasi:    { accentToken: 'a', bgTint: 'rgba(226,145,0,0.04)' },
    materi:      { accentToken: 'e', bgTint: 'rgba(0,108,73,0.04)' },
    skenario:    { accentToken: 'a', bgTint: 'rgba(226,145,0,0.04)' },
    kuis:        { accentToken: 'b', bgTint: 'rgba(0,88,190,0.04)' },
    diskusi:     { accentToken: 'b', bgTint: 'rgba(0,88,190,0.04)' },
    refleksi:    { accentToken: 'e', bgTint: 'rgba(0,108,73,0.04)' },
    rangkuman:   { accentToken: 'e', bgTint: 'rgba(0,108,73,0.04)' },
    hasil:       { accentToken: 'e', bgTint: 'rgba(0,108,73,0.04)' },
    penutup:     { accentToken: 'a', bgTint: 'rgba(226,145,0,0.04)' },
    dokumen:     { accentToken: 'b', bgTint: 'rgba(0,88,190,0.04)' },
    custom:      { accentToken: 'e', bgTint: 'rgba(0,108,73,0.04)' },
  },

  // Per-page layout grammar — matches GOLDEN_PERTEMUAN_CONTRACT structure
  pageLayouts: {
    cover: {
      maxBlocks: 1,
      density: 'sparse',
      canSplit: false,
      allowedBlockTypes: ['cover'],
      pattern: 'Judul besar + Subjudul + Identitas + Tombol mulai',
    },
    petunjuk: {
      maxBlocks: 2,
      density: 'comfortable',
      canSplit: true,
      allowedBlockTypes: ['petunjuk'],
      pattern: 'Judul + 3 langkah instruksi',
    },
    tujuan: {
      maxBlocks: 2,
      density: 'comfortable',
      canSplit: true,
      allowedBlockTypes: ['tujuan-display', 'tp'],
      pattern: 'Judul + 3-4 tujuan dalam kartu',
    },
    motivasi: {
      maxBlocks: 2,
      density: 'comfortable',
      canSplit: true,
      allowedBlockTypes: ['motivasi'],
      pattern: 'Pertanyaan pemantik + Koneksi konsep',
    },
    materi: {
      maxBlocks: 3,
      density: 'dense',
      canSplit: true,
      allowedBlockTypes: ['materi-section', 'def-box', 'nc-grid'],
      pattern: 'Judul + Konsep inti + Contoh',
    },
    skenario: {
      maxBlocks: 2,
      density: 'comfortable',
      canSplit: true,
      allowedBlockTypes: ['skenario'],
      pattern: 'Instruksi + Langkah 1-3 + Aksi siswa',
    },
    kuis: {
      maxBlocks: 2,
      density: 'comfortable',
      canSplit: true,
      allowedBlockTypes: ['kuis'],
      pattern: '1 pertanyaan per layar + 4 opsi + feedback',
    },
    diskusi: {
      maxBlocks: 2,
      density: 'comfortable',
      canSplit: true,
      allowedBlockTypes: ['diskusi'],
      pattern: 'Pertanyaan diskusi + Petunjuk',
    },
    refleksi: {
      maxBlocks: 2,
      density: 'sparse',
      canSplit: true,
      allowedBlockTypes: ['refleksi'],
      pattern: 'Pertanyaan besar + Isian singkat + Penutup emosional',
    },
    rangkuman: {
      maxBlocks: 2,
      density: 'comfortable',
      canSplit: true,
      allowedBlockTypes: ['rangkuman'],
      pattern: 'Ringkasan konsep + Penutup',
    },
    hasil: {
      maxBlocks: 1,
      density: 'sparse',
      canSplit: false,
      allowedBlockTypes: ['hasil'],
      pattern: 'Skor + Capaian',
    },
    penutup: {
      maxBlocks: 1,
      density: 'sparse',
      canSplit: false,
      allowedBlockTypes: ['penutup'],
      pattern: 'Ringkasan + Pesan akhir + Lanjutkan',
    },
    dokumen: {
      maxBlocks: 3,
      density: 'dense',
      canSplit: true,
      allowedBlockTypes: ['tp', 'alur'],
      pattern: 'Tujuan + Alur kegiatan',
    },
    custom: {
      maxBlocks: 5,
      density: 'dense',
      canSplit: true,
      allowedBlockTypes: [],
      pattern: 'Bebas — tapi tetap taat aturan contract',
    },
  },

  // Variant overrides — different accent combinations
  variantOverrides: {
    A: {}, // Default — emerald green accent
    B: {
      accent: '#0058be',
      accentBg: 'rgba(0,88,190,0.12)',
      accentBorder: 'rgba(0,88,190,0.25)',
    },
    C: {
      accent: '#e29100',
      accentBg: 'rgba(226,145,0,0.12)',
      accentBorder: 'rgba(226,145,0,0.25)',
    },
  },
};

// Auto-register the Modern Educator contract
registerContract(MODERN_EDUCATOR_CONTRACT);

/**
 * The Modern Educator accent color palette.
 * Three primary accent colors: Emerald, Blue, Amber.
 * These replace the GOLDEN_CONTRACT's y/c/g/p/o/r tokens.
 * 
 * This is now imported from TemplateThemeContract to avoid circular dependency.
 * Re-exported here for backward compatibility.
 */
export { MODERN_EDUCATOR_ACCENT_PALETTE };
