// ═══════════════════════════════════════════════════════════════════
// COMPONENT REGISTRY — Block type definitions extracted from HTML presets
// ═══════════════════════════════════════════════════════════════════
// Each CSS class pattern from the HTML files maps to a block type.
// The renderer uses this registry to resolve how to render each block.

export type BlockType =
  // ── Layout blocks ──
  | 'navbar'
  | 'screen'
  | 'main-content'
  // ── Cover blocks ──
  | 'cover-wrap'
  | 'cover-icon'
  | 'cover-title'
  | 'cover-chips'
  // ── Petunjuk blocks ──
  | 'pj-grid'
  | 'pj-item'
  // ── TP (Tujuan Pembelajaran) blocks ──
  | 'tp-list'
  | 'tp-item'
  | 'tp-num'
  // ── Alur blocks ──
  | 'alur-steps'
  | 'alur-step'
  | 'alur-dot'
  // ── Skenario blocks ──
  | 'sk-shell'
  | 'sk-hud'
  | 'sk-scene'
  | 'sk-dialogue'
  | 'sk-choices'
  | 'sk-choice'
  | 'sk-result'
  | 'sk-progress'
  | 'sk-end'
  // ── Materi blocks ──
  | 'nc-grid'
  | 'nc'           // NormaCard
  | 'def-box'      // Definition box
  | 'flash-card'
  | 'flash-nav'
  // ── Fungsi Tab blocks ──
  | 'ftab-row'
  | 'ftab'
  | 'ftab-content'
  // ── Diskusi blocks ──
  | 'diskusi-box'
  | 'diskusi-kelompok'
  // ── Game blocks ──
  | 'puzzle-q'
  | 'puzzle-opts'
  | 'puzzle-opt'
  | 'sortir-pool'
  | 'sortir-kartu'
  | 'sortir-kolom'
  | 'roda-shell'
  | 'roda-opts'
  | 'roda-opt'
  // ── Norma Kartu blocks (macam-norma) ──
  | 'nk-card'
  | 'nk-header'
  | 'nk-row'
  | 'nk-box'
  | 'nk-sanksi'
  | 'nk-contoh'
  | 'nk-pelanggaran'
  | 'ntab-row'
  | 'ntab'
  // ── Tabel Accordion blocks ──
  | 'tabel-accord'
  | 'tabel-row'
  // ── Hasil blocks ──
  | 'hasil-circle'
  | 'level-badge'
  // ── Refleksi blocks ──
  | 'refl-item'
  | 'porto-card'
  // ── Penutup blocks ──
  | 'p2-preview'
  | 'p2-norma-grid'
  | 'p2-norma'
  // ── Common UI ──
  | 'btn'
  | 'btn-y'
  | 'btn-c'
  | 'btn-g'
  | 'btn-p'
  | 'btn-r'
  | 'btn-ghost'
  | 'chip'
  | 'chip-sc'
  | 'score-popup'
  | 'saved-badge';

// ═══════════════════════════════════════════════════════════════════
// BLOCK METADATA — Maps CSS class patterns to component info
// ═══════════════════════════════════════════════════════════════════

export interface BlockMeta {
  id: BlockType;
  category: 'layout' | 'content' | 'interactive' | 'navigation' | 'feedback' | 'decoration';
  description: string;
  /** CSS class name that this block was extracted from */
  sourceClass: string;
  /** Which template types use this block */
  usedIn: string[];
}

export const BLOCK_REGISTRY: BlockMeta[] = [
  // ── Layout ──
  { id: 'navbar', category: 'navigation', description: 'Sticky top navigation bar', sourceClass: '.navbar', usedIn: ['all'] },
  { id: 'screen', category: 'layout', description: 'Full-screen page container', sourceClass: '.screen', usedIn: ['all'] },
  { id: 'main-content', category: 'layout', description: 'Centered content wrapper', sourceClass: '.main', usedIn: ['all'] },

  // ── Cover ──
  { id: 'cover-wrap', category: 'layout', description: 'Centered cover layout', sourceClass: '.cover-wrap', usedIn: ['cover'] },
  { id: 'cover-icon', category: 'decoration', description: 'Large animated icon', sourceClass: '.cover-icon', usedIn: ['cover'] },
  { id: 'cover-title', category: 'content', description: 'Display title with highlight', sourceClass: '.cover-title', usedIn: ['cover'] },
  { id: 'cover-chips', category: 'content', description: 'Row of badge chips', sourceClass: '.cover-chips', usedIn: ['cover'] },

  // ── Petunjuk ──
  { id: 'pj-grid', category: 'layout', description: '2-column instruction grid', sourceClass: '.pj-grid', usedIn: ['petunjuk'] },
  { id: 'pj-item', category: 'content', description: 'Instruction card with icon', sourceClass: '.pj-item', usedIn: ['petunjuk'] },

  // ── TP ──
  { id: 'tp-list', category: 'layout', description: 'Vertical list of learning objectives', sourceClass: '.tp-list', usedIn: ['dokumen'] },
  { id: 'tp-item', category: 'content', description: 'Single learning objective card', sourceClass: '.tp-item', usedIn: ['dokumen'] },
  { id: 'tp-num', category: 'decoration', description: 'Numbered circle for TP', sourceClass: '.tp-num', usedIn: ['dokumen'] },

  // ── Alur ──
  { id: 'alur-steps', category: 'layout', description: 'Vertical timeline steps', sourceClass: '.alur-steps', usedIn: ['dokumen'] },
  { id: 'alur-step', category: 'content', description: 'Single timeline step row', sourceClass: '.alur-step', usedIn: ['dokumen'] },
  { id: 'alur-dot', category: 'decoration', description: 'Colored dot for timeline', sourceClass: '.alur-dot', usedIn: ['dokumen'] },

  // ── Skenario ──
  { id: 'sk-shell', category: 'layout', description: 'Scenario game container', sourceClass: '.sk-shell', usedIn: ['skenario'] },
  { id: 'sk-hud', category: 'navigation', description: 'Scenario header HUD', sourceClass: '.sk-hud', usedIn: ['skenario'] },
  { id: 'sk-scene', category: 'decoration', description: 'Visual scene background', sourceClass: '.sk-scene', usedIn: ['skenario'] },
  { id: 'sk-dialogue', category: 'content', description: 'Character dialogue overlay', sourceClass: '.sk-dialogue', usedIn: ['skenario'] },
  { id: 'sk-choices', category: 'interactive', description: 'Choice buttons container', sourceClass: '.sk-choices', usedIn: ['skenario'] },
  { id: 'sk-choice', category: 'interactive', description: 'Single choice button', sourceClass: '.sk-choice', usedIn: ['skenario'] },
  { id: 'sk-result', category: 'feedback', description: 'Choice result display', sourceClass: '.sk-result', usedIn: ['skenario'] },
  { id: 'sk-progress', category: 'navigation', description: 'Progress dots bar', sourceClass: '.sk-progress', usedIn: ['skenario'] },
  { id: 'sk-end', category: 'feedback', description: 'Scenario end screen', sourceClass: '.sk-end', usedIn: ['skenario'] },

  // ── Materi ──
  { id: 'nc-grid', category: 'layout', description: '2-column card grid', sourceClass: '.nc-grid', usedIn: ['materi', 'diskusi'] },
  { id: 'nc', category: 'content', description: 'NormaCard with icon/title/body', sourceClass: '.nc', usedIn: ['materi', 'diskusi'] },
  { id: 'def-box', category: 'content', description: 'Highlighted definition box', sourceClass: '.def-box', usedIn: ['materi'] },
  { id: 'flash-card', category: 'interactive', description: 'Flip flashcard', sourceClass: '.flash-card', usedIn: ['materi'] },
  { id: 'flash-nav', category: 'navigation', description: 'Flashcard navigation', sourceClass: '.flash-nav', usedIn: ['materi'] },

  // ── Fungsi Tabs ──
  { id: 'ftab-row', category: 'navigation', description: 'Tab button row', sourceClass: '.ftab-row', usedIn: ['materi'] },
  { id: 'ftab', category: 'interactive', description: 'Tab button with read marker', sourceClass: '.ftab', usedIn: ['materi'] },
  { id: 'ftab-content', category: 'content', description: 'Tab content area', sourceClass: '.ftab-content', usedIn: ['materi'] },

  // ── Diskusi ──
  { id: 'diskusi-box', category: 'interactive', description: 'Discussion question + textarea', sourceClass: '.diskusi-box', usedIn: ['diskusi'] },
  { id: 'diskusi-kelompok', category: 'interactive', description: 'Group discussion banner', sourceClass: '.diskusi-kelompok', usedIn: ['diskusi'] },

  // ── Game ──
  { id: 'puzzle-q', category: 'interactive', description: 'Quiz question container', sourceClass: '.puzzle-q', usedIn: ['kuis'] },
  { id: 'puzzle-opts', category: 'interactive', description: '2x2 option grid', sourceClass: '.puzzle-opts', usedIn: ['kuis'] },
  { id: 'puzzle-opt', category: 'interactive', description: 'Single quiz option', sourceClass: '.puzzle-opt', usedIn: ['kuis'] },
  { id: 'sortir-pool', category: 'interactive', description: 'Drag source card pool', sourceClass: '.sortir-kartu-pool', usedIn: ['game'] },
  { id: 'sortir-kartu', category: 'interactive', description: 'Draggable card chip', sourceClass: '.sortir-kartu', usedIn: ['game'] },
  { id: 'sortir-kolom', category: 'interactive', description: 'Drop target column', sourceClass: '.sortir-kolom', usedIn: ['game'] },
  { id: 'roda-shell', category: 'interactive', description: 'Roda question container', sourceClass: '.roda-shell', usedIn: ['game'] },
  { id: 'roda-opts', category: 'interactive', description: 'Roda option list', sourceClass: '.roda-opts', usedIn: ['game'] },
  { id: 'roda-opt', category: 'interactive', description: 'Single roda option', sourceClass: '.roda-opt', usedIn: ['game'] },

  // ── Norma Kartu ──
  { id: 'nk-card', category: 'content', description: 'Full norma type card', sourceClass: '.nk-card', usedIn: ['materi'] },
  { id: 'nk-header', category: 'content', description: 'Norma card header with icon', sourceClass: '.nk-header', usedIn: ['materi'] },
  { id: 'nk-row', category: 'layout', description: '2-column info row in norma card', sourceClass: '.nk-row', usedIn: ['materi'] },
  { id: 'nk-box', category: 'content', description: 'Info box in norma card', sourceClass: '.nk-box', usedIn: ['materi'] },
  { id: 'nk-sanksi', category: 'content', description: 'Sanctions list in norma card', sourceClass: '.nk-sanksi', usedIn: ['materi'] },
  { id: 'nk-contoh', category: 'content', description: 'Example box in norma card', sourceClass: '.nk-contoh', usedIn: ['materi'] },
  { id: 'nk-pelanggaran', category: 'content', description: 'Violation examples box', sourceClass: '.nk-pelanggaran', usedIn: ['materi'] },
  { id: 'ntab-row', category: 'navigation', description: 'Norma type tab row', sourceClass: '.norma-tabs', usedIn: ['materi'] },
  { id: 'ntab', category: 'interactive', description: 'Norma type tab button', sourceClass: '.ntab', usedIn: ['materi'] },

  // ── Tabel Accordion ──
  { id: 'tabel-accord', category: 'content', description: 'Accordion comparison table', sourceClass: '.tabel-accord', usedIn: ['materi'] },
  { id: 'tabel-row', category: 'interactive', description: 'Expandable table row', sourceClass: '.tabel-row', usedIn: ['materi'] },

  // ── Hasil ──
  { id: 'hasil-circle', category: 'feedback', description: 'Conic gradient score circle', sourceClass: '.hasil-circle', usedIn: ['hasil'] },
  { id: 'level-badge', category: 'feedback', description: 'Level achievement badge', sourceClass: '.level-badge', usedIn: ['hasil'] },

  // ── Refleksi ──
  { id: 'refl-item', category: 'interactive', description: 'Reflection question + textarea', sourceClass: '.refl-item', usedIn: ['refleksi'] },
  { id: 'porto-card', category: 'content', description: 'Portfolio answer card', sourceClass: '.porto-card', usedIn: ['refleksi'] },

  // ── Penutup ──
  { id: 'p2-preview', category: 'content', description: 'Next meeting preview card', sourceClass: '.p2-preview', usedIn: ['penutup'] },
  { id: 'p2-norma-grid', category: 'layout', description: 'Norma summary grid', sourceClass: '.p2-norma-grid', usedIn: ['penutup'] },
  { id: 'p2-norma', category: 'content', description: 'Single norma summary card', sourceClass: '.p2-norma', usedIn: ['penutup'] },

  // ── Common UI ──
  { id: 'btn', category: 'navigation', description: 'Base button style', sourceClass: '.btn', usedIn: ['all'] },
  { id: 'btn-y', category: 'navigation', description: 'Yellow accent button', sourceClass: '.btn-y', usedIn: ['all'] },
  { id: 'btn-c', category: 'navigation', description: 'Cyan accent button', sourceClass: '.btn-c', usedIn: ['all'] },
  { id: 'btn-g', category: 'navigation', description: 'Green accent button', sourceClass: '.btn-g', usedIn: ['all'] },
  { id: 'btn-p', category: 'navigation', description: 'Purple accent button', sourceClass: '.btn-p', usedIn: ['all'] },
  { id: 'btn-r', category: 'navigation', description: 'Red accent button', sourceClass: '.btn-r', usedIn: ['all'] },
  { id: 'btn-ghost', category: 'navigation', description: 'Ghost/outline button', sourceClass: '.btn-ghost', usedIn: ['all'] },
  { id: 'chip', category: 'decoration', description: 'Badge/chip label', sourceClass: '.chip', usedIn: ['cover', 'materi'] },
  { id: 'chip-sc', category: 'decoration', description: 'Section label chip', sourceClass: '.chip-sc', usedIn: ['all'] },
  { id: 'score-popup', category: 'feedback', description: 'Animated score popup', sourceClass: '.score-popup', usedIn: ['kuis', 'game'] },
  { id: 'saved-badge', category: 'feedback', description: 'Saved confirmation badge', sourceClass: '.saved-badge', usedIn: ['diskusi'] },
];

/** Lookup block meta by id */
export function getBlockMeta(id: BlockType): BlockMeta | undefined {
  return BLOCK_REGISTRY.find(b => b.id === id);
}

/** Get all blocks used by a template type */
export function getBlocksForTemplate(templateType: string): BlockMeta[] {
  return BLOCK_REGISTRY.filter(b =>
    b.usedIn.includes('all') || b.usedIn.includes(templateType)
  );
}
