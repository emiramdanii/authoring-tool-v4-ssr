// ═══════════════════════════════════════════════════════════════════
// BLOCK STYLE PRESETS — Data layer for "Gaya Cepat" per-block presets
// ═══════════════════════════════════════════════════════════════════
// Sprint 2K.1 — Block Style Preset Data Layer
//
// PURPOSE:
//   Provides pre-defined style combinations that teachers can apply
//   to a block in one click via the "Gaya Cepat" (Quick Style) grid
//   in the guided editor's "Tampilan" section.
//
// DESIGN PRINCIPLES:
//   1. Presets are BLOCK-level — not page, not global.
//   2. Global theming is handled by ThemePreset (tokens.ts).
//   3. The resolver ONLY returns fields the renderer actually reads.
//   4. No fake/dead fields — if a renderer ignores accentColor,
//      the resolver won't include it.
//   5. materi-blok uses `warna` (not `accentColor`) — this is a
//      special case NOT handled in 2K.1. TODO for future sprint.
//
// USAGE:
//   const patch = resolveBlockStylePreset('ceria', 'materi-section');
//   // → { accentColor: 'y', variant: 'B' }
//
//   applyGuidedSchemaPatch({ pageId, blockId, patch, source: 'guided-form' });
//
// SCOPE DECISION (Sprint 2K audit):
//   Block-level was chosen because:
//   - Global: already handled by ThemePreset + TemplateThemeContract
//   - Page: too ambiguous — each page has different block combinations
//   - Block: most natural — teacher selects block, opens Tampilan, picks preset
// ═══════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────

/**
 * A block style preset — a named combination of style field values.
 *
 * Each preset has a `values` object containing only style-related fields
 * (accentColor, variant, layoutVariant, borderColor, animation).
 * Content fields (title, text, questions) are NEVER in a preset.
 *
 * When a preset is applied, the resolver filters `values` to only
 * include fields that the target block type's renderer actually reads.
 * This prevents dead/fake fields from polluting the schema.
 */
export interface BlockStylePreset {
  /** Unique preset identifier (e.g., 'ceria', 'formal') */
  id: string;
  /** Teacher-friendly display name */
  label: string;
  /** Short description of the visual feel */
  description: string;
  /** Emoji icon for the preset grid swatch */
  icon: string;
  /** Style field values to apply when this preset is selected */
  values: {
    /** Accent color token: y=Kuning, c=Cyan, g=Hijau, p=Ungu, o=Oranye, r=Merah */
    accentColor?: string;
    /** Layout variant: A/B/C (meaning varies per block type) */
    variant?: string;
    /** Layout variant for tab-icons/infografis: horizontal/vertical/pills, grid/list/timeline */
    layoutVariant?: string;
    /** Border color token for def-box only */
    borderColor?: string;
    /** Animation style for tab-icons only: fade/slide-up/zoom/bounce */
    animation?: string;
  };
}

// ── Block Style Capabilities ───────────────────────────────────
// Maps block type → list of style fields the renderer ACTUALLY reads.
// Based on Sprint 2K audit of all 14 renderers + export renderer.
//
// RULE: Only include a field if the renderer CONSUMES it with
// visual impact. If a renderer hardcodes a token and ignores
// block.accentColor, do NOT list 'accentColor' here.
//
// Key audit findings:
//   - NcGrid, Diskusi, Tp, TujuanDisplay, Kuis hardcode accentColor
//     → accentColor NOT listed for these block types
//   - DefBox reads borderColor (not accentColor)
//     → only borderColor listed for def-box
//     → resolver maps preset.accentColor → borderColor (FIELD_MAPPINGS)
//   - MateriBlok reads warna (not accentColor)
//     → only warna listed for materi-blok
//     → resolver maps preset.accentColor → warna (FIELD_MAPPINGS)
//   - MateriSection variant is read by internal VariantSelector
//     but not persisted — we still include it because the guided
//     editor exposes it and it has visual impact while active
//   - Rangkuman reads both accentColor and variant from schema
//     but guided editor doesn't expose them yet — preset will
//     still work because renderer reads from schema directly

const BLOCK_STYLE_CAPABILITIES: Record<string, string[]> = {
  // ── Blocks that read accentColor ──
  'materi-section':   ['accentColor', 'variant'],
  'rangkuman':        ['accentColor', 'variant'],
  'tab-icons':        ['accentColor', 'layoutVariant', 'animation'],
  'infografis':       ['accentColor', 'layoutVariant'],
  'accordion':        ['accentColor'],
  'gambar':           ['accentColor'],
  'timeline':         ['accentColor'],
  'sortir-game':      ['accentColor'],
  'roda-game':        ['accentColor'],
  'cover':            ['accentColor'],

  // ── Blocks that only read variant (accentColor is dead) ──
  'kuis':             ['variant'],
  'diskusi':          ['variant'],
  'nc-grid':          ['variant'],
  'tujuan-display':   ['variant'],

  // ── Def-box reads borderColor (not accentColor) ──
  // Resolver maps preset.accentColor → borderColor
  'def-box':          ['borderColor'],

  // ── Materi-blok reads warna (not accentColor) ──
  // Resolver maps preset.accentColor → warna
  'materi-blok':      ['warna'],

  // ── Blocks with no style fields read by renderer ──
  // These return [] from getSupportedStyleFields()
  // and {} from resolveBlockStylePreset()
  // (tp, refleksi, motivasi, petunjuk, penutup, cp, alur, atp,
  //  true-false-game, fill-blank-game)
};

// ── Field Mappings ──────────────────────────────────────────────
// Some blocks use different field names for what is semantically
// the same concept as accentColor. For example:
//   def-box uses `borderColor` for its left accent stripe
//   materi-blok uses `warna` for its tint/border color
//
// When a preset defines `accentColor` but the block only supports
// a mapped field (e.g., borderColor), the resolver will rename
// accentColor → the mapped field name automatically.
//
// This keeps presets simple (they always use accentColor) while
// respecting each renderer's actual schema field names.

const FIELD_MAPPINGS: Record<string, Record<string, string>> = {
  // preset field → block field
  'def-box':    { accentColor: 'borderColor' },
  'materi-blok': { accentColor: 'warna' },
};

// ── Preset Definitions ─────────────────────────────────────────
// 7 presets covering the most common visual intents for Indonesian
// classroom media. Each preset sets accentColor + variant.
// layoutVariant, borderColor, and animation are left undefined
// in the preset values — they can be fine-tuned individually
// after applying a preset.

export const BLOCK_STYLE_PRESETS: BlockStylePreset[] = [
  {
    id: 'ceria',
    label: 'Ceria',
    description: 'Kuning cerah dan tampilan kartu — cocok untuk SD dan pembelajaran santai',
    icon: '🌞',
    values: {
      accentColor: 'y',
      variant: 'B',
    },
  },
  {
    id: 'formal',
    label: 'Formal',
    description: 'Cyan rapi dan tampilan klasik — cocok untuk SMA dan materi serius',
    icon: '🏛️',
    values: {
      accentColor: 'c',
      variant: 'A',
    },
  },
  {
    id: 'modern',
    label: 'Modern',
    description: 'Ungu khas dan tampilan ringkas — cocok untuk SMP dan kontemporer',
    icon: '✨',
    values: {
      accentColor: 'p',
      variant: 'C',
    },
  },
  {
    id: 'petualangan',
    label: 'Petualangan',
    description: 'Hijau alami dan tampilan kartu — cocok untuk eksplorasi dan outdoor',
    icon: '🌿',
    values: {
      accentColor: 'g',
      variant: 'B',
    },
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Cyan bersih dan tampilan ringkas — cocok untuk ringkasan profesional',
    icon: '◻️',
    values: {
      accentColor: 'c',
      variant: 'C',
    },
  },
  {
    id: 'hangat',
    label: 'Hangat',
    description: 'Oranye hangat dan tampilan klasik — cocok untuk storytelling dan studi kasus',
    icon: '🔥',
    values: {
      accentColor: 'o',
      variant: 'A',
    },
  },
  {
    id: 'berani',
    label: 'Berani',
    description: 'Merah mencolok dan tampilan kartu — cocok untuk game dan evaluasi',
    icon: '❤️',
    values: {
      accentColor: 'r',
      variant: 'B',
    },
  },
];

// ── Lookup Index ───────────────────────────────────────────────
// Pre-built for O(1) preset lookup by ID.

const PRESET_BY_ID: Map<string, BlockStylePreset> = new Map(
  BLOCK_STYLE_PRESETS.map(p => [p.id, p]),
);

// ── Public API ─────────────────────────────────────────────────

/**
 * Resolve a block style preset for a specific block type.
 *
 * Returns a patch object containing only the style fields that:
 *   1. The preset defines (e.g., accentColor: 'y', variant: 'B')
 *   2. The block type's renderer actually reads
 *
 * This ensures no dead/fake fields pollute the schema.
 *
 * @param presetId  - Preset identifier (e.g., 'ceria', 'formal')
 * @param blockType - Block type (e.g., 'materi-section', 'kuis')
 * @returns Patch object safe to pass to applyGuidedSchemaPatch(), or {} if N/A
 *
 * @example
 *   resolveBlockStylePreset('ceria', 'materi-section')
 *   // → { accentColor: 'y', variant: 'B' }
 *
 *   resolveBlockStylePreset('ceria', 'kuis')
 *   // → { variant: 'B' }  (kuis renderer ignores accentColor)
 *
 *   resolveBlockStylePreset('ceria', 'sortir-game')
 *   // → { accentColor: 'y' }  (sortir-game has no variant)
 *
 *   resolveBlockStylePreset('ceria', 'def-box')
 *   // → { borderColor: 'y' }  (accentColor mapped → borderColor)
 *
 *   resolveBlockStylePreset('unknown', 'materi-section')
 *   // → {}  (unknown preset)
 *
 *   resolveBlockStylePreset('ceria', 'tp')
 *   // → {}  (tp renderer reads no block-level style fields)
 */
export function resolveBlockStylePreset(
  presetId: string,
  blockType: string,
): Record<string, unknown> {
  const preset = PRESET_BY_ID.get(presetId);
  if (!preset) return {};

  const capabilities = BLOCK_STYLE_CAPABILITIES[blockType];
  if (!capabilities || capabilities.length === 0) return {};

  // Get field mappings for this block type (e.g., accentColor → borderColor)
  const fieldMap = FIELD_MAPPINGS[blockType] ?? {};

  // Filter preset values to only include fields the block type supports.
  // Also apply field mappings: if the block supports 'borderColor' and
  // the preset has 'accentColor', map accentColor value → borderColor.
  const patch: Record<string, unknown> = {};
  for (const field of capabilities) {
    // Direct lookup: preset.values[field]
    const directValue = preset.values[field as keyof BlockStylePreset['values']];
    if (directValue !== undefined) {
      patch[field] = directValue;
      continue;
    }
    // Mapped lookup: find which preset field maps to this block field
    const mappedFrom = Object.entries(fieldMap).find(([, to]) => to === field);
    if (mappedFrom) {
      const sourceValue = preset.values[mappedFrom[0] as keyof BlockStylePreset['values']];
      if (sourceValue !== undefined) {
        patch[field] = sourceValue;
      }
    }
  }

  return patch;
}

/**
 * Get the list of style fields a block type's renderer actually reads.
 *
 * Returns an empty array if the block type has no style capabilities
 * (e.g., 'tp', 'refleksi', 'motivasi').
 *
 * @param blockType - Block type identifier
 * @returns Array of supported style field names
 *
 * @example
 *   getSupportedStyleFields('materi-section')  // → ['accentColor', 'variant']
 *   getSupportedStyleFields('kuis')            // → ['variant']
 *   getSupportedStyleFields('tp')              // → []
 */
export function getSupportedStyleFields(blockType: string): string[] {
  return BLOCK_STYLE_CAPABILITIES[blockType] ?? [];
}

/**
 * Get a specific preset by ID.
 *
 * @param presetId - Preset identifier
 * @returns The preset, or undefined if not found
 */
export function getBlockStylePreset(presetId: string): BlockStylePreset | undefined {
  return PRESET_BY_ID.get(presetId);
}

/**
 * Get all available block style presets.
 *
 * Useful for rendering the "Gaya Cepat" grid in the guided editor.
 *
 * @returns Array of all presets
 */
export function getAllBlockStylePresets(): BlockStylePreset[] {
  return BLOCK_STYLE_PRESETS;
}

/**
 * Check if a block type supports any style presets.
 *
 * Returns true if the block type has at least one style field
 * that the renderer reads (accentColor, variant, etc.).
 *
 * @param blockType - Block type identifier
 * @returns Whether the block type can benefit from style presets
 *
 * @example
 *   blockTypeSupportsPresets('materi-section')  // → true
 *   blockTypeSupportsPresets('tp')              // → false
 */
export function blockTypeSupportsPresets(blockType: string): boolean {
  const caps = BLOCK_STYLE_CAPABILITIES[blockType];
  return !!caps && caps.length > 0;
}

/**
 * Get all applicable (non-empty, deduplicated) presets for a block type.
 *
 * Resolves each preset for the block type, filters out empty patches,
 * then deduplicates presets that produce identical resolved patches.
 *
 * This is important for variant-only blocks (kuis, diskusi, nc-grid,
 * tujuan-display) where multiple presets resolve to the same patch
 * (e.g., Ceria→{variant:'B'} and Petualangan→{variant:'B'} are identical).
 * Without deduplication, the grid would show 7 presets where only 3
 * are actually different, which is confusing for teachers.
 *
 * @param blockType - Block type identifier
 * @returns Array of { preset, patch } objects, deduplicated by patch content
 *
 * @example
 *   getApplicableBlockStylePresets('kuis')
 *   // → [
 *   //     { preset: ceria,    patch: { variant: 'B' } },
 *   //     { preset: formal,   patch: { variant: 'A' } },
 *   //     { preset: modern,   patch: { variant: 'C' } },
 *   //   ]
 *   // (Petualangan/Minimal/Hangat/Berani skipped — identical to above)
 *
 *   getApplicableBlockStylePresets('materi-section')
 *   // → all 7 presets (each produces a unique accentColor+variant combo)
 */
export function getApplicableBlockStylePresets(blockType: string): Array<{
  preset: BlockStylePreset;
  patch: Record<string, unknown>;
}> {
  const seen = new Map<string, { preset: BlockStylePreset; patch: Record<string, unknown> }>();

  for (const preset of BLOCK_STYLE_PRESETS) {
    const patch = resolveBlockStylePreset(preset.id, blockType);
    if (Object.keys(patch).length === 0) continue;

    // Create a stable key from the sorted patch entries
    const key = JSON.stringify(
      Object.entries(patch).sort(([a], [b]) => a.localeCompare(b)),
    );

    if (!seen.has(key)) {
      seen.set(key, { preset, patch });
    }
  }

  return Array.from(seen.values());
}
