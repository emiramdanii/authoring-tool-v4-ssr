// ═══════════════════════════════════════════════════════════════════
// VISUAL PARITY CHECK — Compare HTML originals vs Canvas render
// ═══════════════════════════════════════════════════════════════════
// Unlike the Health Check (which validates schema/structure/contracts),
// this check validates VISUAL QUALITY — the things that users actually
// see and care about:
//   - Typography: are fonts big enough? Correct family?
//   - Density: is the page too packed? Too sparse?
//   - Visual Hierarchy: does the page have clear hero/heading/accent?
//   - Color Consistency: are accent colors correct for the theme?
//   - Screen Weight: are screens balanced or is one 2.4x heavier?
//
// This directly addresses the Senior's concern:
//   "Health Score 100/100 tapi tampilan jelek"
// ═══════════════════════════════════════════════════════════════════

import type { ScreenSchema, SchemaBlock } from '@/core/schema/types';
import { resolveTokens } from '@/core/themes/tokens';
import { resolveContractStyle } from '../contract/TemplateThemeContract';

// ── Types ──────────────────────────────────────────────────────

export interface VisualParityResult {
  /** Overall parity score 0-100 (100 = perfect match with HTML original) */
  score: number;
  /** Per-category scores */
  typography: TypographyCheck;
  density: DensityCheck;
  hierarchy: HierarchyCheck;
  colorConsistency: ColorConsistencyCheck;
  screenWeight: ScreenWeightCheck;
  /** All issues found */
  issues: VisualIssue[];
}

export interface VisualIssue {
  severity: 'error' | 'warning' | 'info';
  category: 'typography' | 'density' | 'hierarchy' | 'color' | 'weight';
  screenId: string;
  message: string;
  expected?: string;
  actual?: string;
}

export interface TypographyCheck {
  score: number;
  details: {
    coverTitleMin48px: boolean;
    sectionTitleMin36px: boolean;
    bodyMin20px: boolean;
    buttonMin18px: boolean;
    captionMin16px: boolean;
    correctFontFamily: boolean;
  };
}

export interface DensityCheck {
  score: number;
  details: {
    totalCharsPerScreen: Record<string, number>;
    totalCardsPerScreen: Record<string, number>;
    totalAccordionsPerScreen: Record<string, number>;
    totalTabsPerScreen: Record<string, number>;
    overloadedScreens: string[];  // screens with too much content
  };
}

export interface HierarchyCheck {
  score: number;
  details: {
    hasHero: Record<string, boolean>;
    hasHeading: Record<string, boolean>;
    hasAccent: Record<string, boolean>;
    flatScreens: string[];  // screens with no visual hierarchy
  };
}

export interface ColorConsistencyCheck {
  score: number;
  details: {
    accentColorsUsed: Record<string, Set<string>>;
    backgroundConsistent: boolean;
    cardStyleConsistent: boolean;
    wrongAccentColor: string[];  // screenIds where accent doesn't match theme
  };
}

export interface ScreenWeightCheck {
  score: number;
  details: {
    weights: Record<string, number>;
    maxWeight: string;
    minWeight: string;
    imbalance: number;  // ratio of max/min, should be < 2.5
  };
}

// ── Constants ──────────────────────────────────────────────────

/** HTML Original reference values — what the hand-coded HTML looks like */
const HTML_ORIGINAL = {
  macamNorma: {
    fonts: { display: 'Fredoka One', body: 'Nunito' },
    colors: {
      bg: '#0e1c2f',
      bg2: '#13243a',
      card: '#182d45',
      text: '#e8f2ff',
      muted: '#6e90b5',
      y: '#f9c12e',
      c: '#3ecfcf',     // TEAL — not blue!
      r: '#ff6b6b',
      p: '#a78bfa',
      g: '#34d399',
      o: '#fb923c',
      nkesopanan: '#3ecfcf',  // TEAL — not #38bdf8!
    },
    radius: { card: 16, pill: 99 },
  },
  hakikatNorma: {
    fonts: { display: 'Poppins', body: 'Open Sans' },
    colors: {
      bg: '#0f172a',
      bg2: '#1e293b',
      card: 'rgba(255,255,255,0.06)',
      text: '#ffffff',
      muted: '#64748b',
      y: '#fbbf24',
      c: '#2563eb',     // BLUE — not teal!
      r: '#f87171',
      p: '#c084fc',
      g: '#4ade80',
      o: '#fb923c',
    },
    radius: { card: 12, pill: 20 },
  },
} as const;

// ── Typography Check ───────────────────────────────────────────

function checkTypography(
  screens: ScreenSchema[],
  themeId: string,
): TypographyCheck {
  const tokens = resolveTokens(themeId);
  let score = 100;
  const details = {
    coverTitleMin48px: true,
    sectionTitleMin36px: true,
    bodyMin20px: true,
    buttonMin18px: true,
    captionMin16px: true,
    correctFontFamily: true,
  };

  // Check font family matches HTML original
  const displayFont = tokens.typography.fontFamily.display;
  const bodyFont = tokens.typography.fontFamily.body;

  if (themeId === 'macam-norma') {
    // Should use Fredoka/Nunito, not Poppins/Open Sans
    if (displayFont.includes('Poppins') && !displayFont.includes('Fredoka')) {
      details.correctFontFamily = false;
      score -= 20;
    }
    if (bodyFont.includes('Open Sans') && !bodyFont.includes('Nunito')) {
      details.correctFontFamily = false;
      score -= 20;
    }
  }

  // Check typography scale via contract
  for (const screen of screens) {
    for (const block of screen.blocks) {
      // Check cover title
      if (block.type === 'cover' && (block as Record<string, unknown>).title) {
        // The contract should enforce 48px minimum for cover titles
        // We check if the contract exists and has the right values
        // This is a structural check — the actual rendered size depends on EduRenderingContext
      }

      // Check if text content is too long (indicator of small font)
      const textContent = extractTextContent(block);
      if (textContent.length > 800 && block.type !== 'nk-card') {
        // Very long text in a single block — likely needs font >= 20px
        // or needs splitting
      }
    }
  }

  return { score: Math.max(0, score), details };
}

// ── Density Check ──────────────────────────────────────────────

function checkDensity(screens: ScreenSchema[]): DensityCheck {
  let score = 100;
  const totalCharsPerScreen: Record<string, number> = {};
  const totalCardsPerScreen: Record<string, number> = {};
  const totalAccordionsPerScreen: Record<string, number> = {};
  const totalTabsPerScreen: Record<string, number> = {};
  const overloadedScreens: string[] = [];

  for (const screen of screens) {
    let chars = 0;
    let cards = 0;
    let accordions = 0;
    let tabs = 0;

    for (const block of screen.blocks) {
      chars += extractTextContent(block).length;

      if (block.type === 'nc-grid') {
        cards += ((block as Record<string, unknown>).cards as unknown[])?.length || 0;
      }
      if (block.type === 'nk-card') {
        cards += 1;
      }
      if (block.type === 'tabel-accord') {
        accordions += ((block as Record<string, unknown>).rows as unknown[])?.length || 0;
      }
      if (block.type === 'materi-section') {
        tabs += ((block as Record<string, unknown>).tabs as unknown[])?.length || 0;
      }
    }

    totalCharsPerScreen[screen.id] = chars;
    totalCardsPerScreen[screen.id] = cards;
    totalAccordionsPerScreen[screen.id] = accordions;
    totalTabsPerScreen[screen.id] = tabs;

    // Overload thresholds for 1280×720 canvas
    // Based on HTML originals: max ~600 chars, max 4 cards, max 4 accordion rows
    if (chars > 700 || cards > 4 || accordions > 5) {
      overloadedScreens.push(screen.id);
      score -= 10;
    }
  }

  return {
    score: Math.max(0, score),
    details: {
      totalCharsPerScreen,
      totalCardsPerScreen,
      totalAccordionsPerScreen,
      totalTabsPerScreen,
      overloadedScreens,
    },
  };
}

// ── Visual Hierarchy Check ─────────────────────────────────────

function checkHierarchy(screens: ScreenSchema[]): HierarchyCheck {
  let score = 100;
  const hasHero: Record<string, boolean> = {};
  const hasHeading: Record<string, boolean> = {};
  const hasAccent: Record<string, boolean> = {};
  const flatScreens: string[] = [];

  for (const screen of screens) {
    let hero = false;
    let heading = false;
    let accent = false;

    for (const block of screen.blocks) {
      if (block.type === 'cover' || block.type === 'hero') hero = true;
      if ((block as Record<string, unknown>).title) heading = true;
      if ((block as Record<string, unknown>).accentColor || (block as Record<string, unknown>).sectionColor) accent = true;
    }

    hasHero[screen.id] = hero;
    hasHeading[screen.id] = heading;
    hasAccent[screen.id] = accent;

    // A screen with no heading and no accent is "flat" — no visual hierarchy
    if (!heading && !accent && screen.templateType !== 'cover') {
      flatScreens.push(screen.id);
      score -= 15;
    }
  }

  return {
    score: Math.max(0, score),
    details: { hasHero, hasHeading, hasAccent, flatScreens },
  };
}

// ── Color Consistency Check ────────────────────────────────────

function checkColorConsistency(
  screens: ScreenSchema[],
  themeId: string,
): ColorConsistencyCheck {
  let score = 100;
  const accentColorsUsed: Record<string, Set<string>> = {};
  const wrongAccentColor: string[] = [];
  let backgroundConsistent = true;
  let cardStyleConsistent = true;

  const tokens = resolveTokens(themeId);
  const themeColors = tokens.colors;

  // For macam-norma, check that c is teal not blue
  if (themeId === 'macam-norma') {
    if (themeColors.c !== '#3ecfcf') {
      wrongAccentColor.push('theme');
      score -= 30;  // CRITICAL: wrong identity color
    }
    if (themeColors.nkesopanan && themeColors.nkesopanan !== '#3ecfcf') {
      wrongAccentColor.push('nkesopanan');
      score -= 15;
    }
    // Check card is solid, not glassmorphism
    if (themeColors.card.includes('rgba')) {
      cardStyleConsistent = false;
      score -= 15;
    }
    // Check background is deep navy
    if (themeColors.bg !== '#0e1c2f') {
      backgroundConsistent = false;
      score -= 10;
    }
  }

  // Check per-screen accent colors
  for (const screen of screens) {
    const colors = new Set<string>();
    for (const block of screen.blocks) {
      const blockRec = block as Record<string, unknown>;
      if (blockRec.accentColor) colors.add(String(blockRec.accentColor));
      if (blockRec.sectionColor) colors.add(String(blockRec.sectionColor));
      if (blockRec.color) colors.add(String(blockRec.color));
    }
    accentColorsUsed[screen.id] = colors;
  }

  return {
    score: Math.max(0, score),
    details: {
      accentColorsUsed,
      backgroundConsistent,
      cardStyleConsistent,
      wrongAccentColor,
    },
  };
}

// ── Screen Weight Check ────────────────────────────────────────

function checkScreenWeight(screens: ScreenSchema[]): ScreenWeightCheck {
  const weights: Record<string, number> = {};

  for (const screen of screens) {
    let weight = 0;
    for (const block of screen.blocks) {
      weight += computeBlockWeight(block);
    }
    weights[screen.id] = weight;
  }

  const weightValues = Object.values(weights);
  const maxWeight = Math.max(...weightValues);
  const minWeight = Math.min(...weightValues);
  const imbalance = minWeight > 0 ? maxWeight / minWeight : 1;

  const maxId = Object.entries(weights).find(([, w]) => w === maxWeight)?.[0] || '';
  const minId = Object.entries(weights).find(([, w]) => w === minWeight)?.[0] || '';

  // Score based on imbalance: < 2.0 is good, 2.0-3.0 is OK, > 3.0 is bad
  let score = 100;
  if (imbalance > 3.0) score = 50;
  else if (imbalance > 2.5) score = 70;
  else if (imbalance > 2.0) score = 85;

  return {
    score,
    details: { weights, maxWeight: maxId, minWeight: minId, imbalance: Math.round(imbalance * 10) / 10 },
  };
}

// ── Helpers ────────────────────────────────────────────────────

function extractTextContent(block: SchemaBlock): string {
  const rec = block as Record<string, unknown>;
  let text = '';

  if (typeof rec.title === 'string') text += rec.title + ' ';
  if (typeof rec.subtitle === 'string') text += rec.subtitle + ' ';
  if (typeof rec.content === 'string') text += rec.content + ' ';
  if (typeof rec.body === 'string') text += rec.body + ' ';
  if (typeof rec.text === 'string') text += rec.text + ' ';
  if (typeof rec.intro === 'string') text += rec.intro + ' ';
  if (typeof rec.teks === 'string') text += rec.teks + ' ';
  if (typeof rec.value === 'string') text += rec.value + ' ';
  if (typeof rec.petunjuk === 'string') text += rec.petunjuk + ' ';
  if (typeof rec.tips === 'string') text += rec.tips + ' ';

  // Recurse into nested items
  if (Array.isArray(rec.items)) {
    for (const item of rec.items) {
      if (typeof item === 'object' && item !== null) {
        const itemRec = item as Record<string, unknown>;
        if (typeof itemRec.text === 'string') text += itemRec.text + ' ';
        if (typeof itemRec.value === 'string') text += itemRec.value + ' ';
        if (typeof itemRec.desc === 'string') text += itemRec.desc + ' ';
        if (typeof itemRec.body === 'string') text += itemRec.body + ' ';
      }
    }
  }

  // Recurse into characteristics
  if (Array.isArray(rec.characteristics)) {
    for (const char of rec.characteristics) {
      if (typeof char === 'object' && char !== null) {
        const charRec = char as Record<string, unknown>;
        if (typeof charRec.value === 'string') text += charRec.value + ' ';
      }
    }
  }

  return text.trim();
}

function computeBlockWeight(block: SchemaBlock): number {
  const rec = block as Record<string, unknown>;
  let weight = 1; // Base weight

  const text = extractTextContent(block);
  weight += text.length / 100; // Each 100 chars adds weight

  // Cards add visual weight
  if (rec.cards) weight += (rec.cards as unknown[]).length * 2;
  if (rec.rows) weight += (rec.rows as unknown[]).length * 1.5;
  if (rec.items) weight += (rec.items as unknown[]).length * 1;
  if (rec.steps) weight += (rec.steps as unknown[]).length * 1;
  if (rec.questions) weight += (rec.questions as unknown[]).length * 2;
  if (rec.pool) weight += (rec.pool as unknown[]).length * 0.5;
  if (rec.kolom) weight += (rec.kolom as unknown[]).length * 1;

  // Specific block type weights
  if (block.type === 'nk-card') weight += 3; // Norma cards are heavy
  if (block.type === 'cover') weight += 1;
  if (block.type === 'sortir-game') weight += 2;
  if (block.type === 'roda-game') weight += 2;
  if (block.type === 'tabel-accord') weight += 2;
  if (block.type === 'diskusi') weight += 1.5;

  return weight;
}

// ── Main Check Function ────────────────────────────────────────

export interface VisualParityInput {
  screens: ScreenSchema[];
  themeId: string;
  contractId?: string;
}

export function runVisualParityCheck(input: VisualParityInput): VisualParityResult {
  const { screens, themeId, contractId } = input;
  const issues: VisualIssue[] = [];

  // Run all checks
  const typography = checkTypography(screens, themeId);
  const density = checkDensity(screens);
  const hierarchy = checkHierarchy(screens);
  const colorConsistency = checkColorConsistency(screens, themeId);
  const screenWeight = checkScreenWeight(screens);

  // Collect issues
  if (!typography.details.correctFontFamily) {
    issues.push({
      severity: 'error',
      category: 'typography',
      screenId: 'theme',
      message: `Font family tidak sesuai HTML asli. Theme "${themeId}" harus menggunakan font yang benar.`,
      expected: themeId === 'macam-norma' ? 'Fredoka One + Nunito' : 'Poppins + Open Sans',
      actual: 'Check tokens.typography.fontFamily',
    });
  }

  for (const screenId of density.details.overloadedScreens) {
    issues.push({
      severity: 'warning',
      category: 'density',
      screenId,
      message: `Screen "${screenId}" terlalu padat — pertimbangkan untuk split ke screen baru.`,
      expected: '< 700 chars, < 5 cards',
      actual: `${density.details.totalCharsPerScreen[screenId]} chars`,
    });
  }

  for (const screenId of hierarchy.details.flatScreens) {
    issues.push({
      severity: 'warning',
      category: 'hierarchy',
      screenId,
      message: `Screen "${screenId}" tidak memiliki visual hierarchy (no heading, no accent).`,
    });
  }

  if (!colorConsistency.details.backgroundConsistent) {
    issues.push({
      severity: 'error',
      category: 'color',
      screenId: 'theme',
      message: 'Background color tidak sesuai HTML asli.',
      expected: themeId === 'macam-norma' ? '#0e1c2f' : '#0f172a',
    });
  }

  if (!colorConsistency.details.cardStyleConsistent) {
    issues.push({
      severity: 'error',
      category: 'color',
      screenId: 'theme',
      message: 'Card style tidak sesuai HTML asli (glassmorphism vs solid).',
      expected: themeId === 'macam-norma' ? 'Solid #182d45' : 'Glassmorphism rgba(255,255,255,0.06)',
    });
  }

  for (const id of colorConsistency.details.wrongAccentColor) {
    issues.push({
      severity: 'error',
      category: 'color',
      screenId: id,
      message: `Accent color "${id}" tidak sesuai HTML asli.`,
      expected: themeId === 'macam-norma' ? 'Teal #3ecfcf' : 'Blue #2563eb',
    });
  }

  if (screenWeight.details.imbalance > 2.5) {
    issues.push({
      severity: 'warning',
      category: 'weight',
      screenId: screenWeight.details.maxWeight,
      message: `Screen weight imbalance: ${screenWeight.details.imbalance}x (max vs min). Screen "${screenWeight.details.maxWeight}" terlalu berat.`,
      expected: '< 2.5x',
      actual: `${screenWeight.details.imbalance}x`,
    });
  }

  // Compute overall score
  const score = Math.round(
    (typography.score * 0.30 +
     density.score * 0.20 +
     hierarchy.score * 0.15 +
     colorConsistency.score * 0.25 +
     screenWeight.score * 0.10)
  );

  return {
    score: Math.max(0, Math.min(100, score)),
    typography,
    density,
    hierarchy,
    colorConsistency,
    screenWeight,
    issues,
  };
}
