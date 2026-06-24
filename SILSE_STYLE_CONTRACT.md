# SILSE_STYLE_CONTRACT

**Status**: CONTRACT v1.0
**Date**: 2026-06-25
**HEAD**: `402f385`

---

## 1. Principle

Style in SILSE is **separate from content**. Content (schema blocks) is style-neutral. Style (presets, tokens, contracts) controls how content looks. Changing style MUST NOT change content. Changing content MUST NOT require style changes.

**Three layers of style**:

```
Layer 1: Style Preset (themeId)
  → Colors, typography, shape, spacing, navigation style
  → Applied globally to all pages

Layer 2: Template Theme Contract (contractId) [optional]
  → Overrides specific token values for visual enforcement
  → e.g., "golden-pertemuan" enforces gold accent + specific padding

Layer 3: Block-level hints (variant, compression, semantic)
  → Block-specific visual adjustments within the preset framework
  → e.g., variant 'B' = compact layout, variant 'C' = wide layout
```

**Priority**: Contract > Preset > Block defaults

---

## 2. Style Preset Structure

Each preset defines a complete visual identity:

```typescript
interface StylePresetDefinition {
  id: string;                    // e.g., 'modern-interactive'
  label: string;                 // 'Modern Interaktif'
  description: string;           // Teacher-facing description

  colors: {
    background: string;          // Page background color
    surface: string;             // Card/surface color
    surfaceStrong: string;       // Elevated surface
    text: string;                // Primary text color
    textMuted: string;           // Secondary text color
    accent: string;              // Primary accent (buttons, highlights)
    accentContrast: string;      // Text color on accent background
    border: string;              // Border color
    success: string;             // Success/correct color
    error: string;               // Error/incorrect color
  };

  typography: {
    headingFamily: string;       // Font family for headings
    bodyFamily: string;          // Font family for body text
    headingScale: string;        // Base heading font-size
    bodyScale: string;           // Base body font-size
    fontScaleMultiplier: number; // Density multiplier
  };

  shape: {
    radius: string;              // Border radius
    borderWidth: string;         // Border width
    shadow: string;              // Box shadow
  };

  spacing: {
    density: 'compact' | 'normal' | 'spacious';
    pagePadding: string;         // Page-level padding
    cardPadding: string;         // Card-level padding
    blockGap: string;            // Gap between blocks
  };

  navigation: {
    style: 'colorful' | 'minimal' | 'glass';
  };

  page: {
    background: ResolvedBackground;
  };

  block: {
    presetId: string;
    variant: string;
    emphasis: string;
    accent: string;
  };
}
```

---

## 3. Registered Style Presets

| ID | Label | Theme | Background | Accent |
|---|---|---|---|---|
| `modern-interactive` | Modern Interaktif | Light, friendly | #F5F7FB | Emerald |
| `school-cheerful` | Sekolah Ceria | Bright, playful | Warm yellow | Orange |
| `mission-adventure` | Misi Petualangan | Earth tones | Brown/cream | Terra cotta |
| `nusantara-nature` | Nusantara Alam | Natural green | Sage | Forest green |
| `academic-clean` | Akademik Bersih | Dark navy | #0f172a | Gold |
| `dark-elegant` | Gelap Elegan | Dark slate | #1a1a2e | Purple |

**Default**: `modern-interactive` (light, teacher-friendly)

---

## 4. Token Resolution Pipeline

```
page.schema.themeId
  → resolvePresetTokens(themeId) → DesignTokens (concrete values)
  → resolvePageStyleTokens(page) → ResolvedStyleTokens (full resolution)
       ├─ Colors (from preset)
       ├─ Typography (from preset)
       ├─ Shape (from preset)
       ├─ Spacing (from preset, density-adjusted)
       ├─ Navigation (from preset)
       ├─ Page background (from schema or preset default)
       └─ Block defaults (from preset)

If page.contractId is set:
  → resolveContractStyle(contractId, templateType, variant) → ContractResolvedStyle
  → Overrides: accent token map, page padding, card padding, typography scale, card shadow
  → Applied AFTER ResolvedStyleTokens (wins for fields it patches)

Final step:
  → applyResolvedStyleTokensToTokenResolver(tokenResolver, resolvedTokens)
  → Block renderers read via TokenResolver API (tokens.color('y'), tokens.fontFamily('body'), etc.)
```

---

## 5. Layout Contract

Style controls **layout density**, not content structure:

| Density | Page Padding | Card Padding | Block Gap | Font Scale |
|---|---|---|---|---|
| `compact` (canvas mode) | 16px | 8px | 8px | 0.85x |
| `normal` (preview/export) | 24px | 12px | 16px | 1.0x |
| `spacious` | 32px | 16px | 24px | 1.15x |

**Canvas mode** always uses compact density (teacher editing). **Preview/Export** uses the preset's defined density.

**Rule**: Scene canvas is always 1280×720 (16:9). Content MUST fit within this. Style controls padding/gap/font to ensure fit. If content overflows, the SceneLayoutEngine compresses (accordion, reveal-set) — NOT scroll.

---

## 6. Block Variant System

Variants control renderer layout within a style:

| Variant | Name | Description |
|---|---|---|
| `A` | Bawaan (Default) | Standard layout, balanced spacing |
| `B` | Ringkas (Compact) | Tighter padding, smaller fonts, more content per screen |
| `C` | Lebar (Wide) | Larger padding, bigger fonts, emphasis on readability |

**Rule**: Variants are block-type-specific. Not all blocks support all variants. The renderer checks `definition.capabilities.variants` before offering variant switch.

---

## 7. Interaction Skins

Style controls how interactive elements look:

### Quiz Skin
- Question card: surface color + left accent stripe (token color key)
- Answer buttons: pill-shaped, accent border, hover/active states
- Feedback: success/error colors from preset
- Score display: pill badge, tier-colored (gold/green/cyan/orange)

### Game Skin
- Game container: surface color, rounded card
- Drag items: accent-colored chips
- Drop zones: dashed border, accent-tinted background
- Completion: success color animation + sound

### Reflection Skin
- Question card: surface + left stripe (question color)
- Textarea: muted background, accent focus ring
- Submit button: accent background, disabled state
- Completion: checkmark + success color

### Navigation Skin
| Style | Top Nav | Bottom Nav | Page Dots |
|---|---|---|---|
| `colorful` | Gradient progress bar, vibrant buttons | Emoji score, icon dots | Colored, glowing |
| `minimal` | Thin progress line, ghost buttons | Text score, numbered dots | Simple, muted |
| `glass` | Glassmorphism, gradient borders | Glowing accents | Subtle, elegant |

---

## 8. Style Isolation Rules

1. **Content MUST NOT reference style**: Block data contains token keys ('y', 'c'), not hex colors. Block data contains variant identifiers ('A', 'B'), not CSS classes.

2. **Style MUST NOT reference content**: Presets define colors and typography, not block types or page types. Contracts may reference template types (for contract selection) but not individual block content.

3. **Preview = Export**: Both use the same PageRenderer + resolvePageStyleTokens. No separate export styling. If preview looks different from export, it's a bug.

4. **Canvas ≠ Preview**: Canvas uses compact density (isCompact=true). Preview/export uses preset density. This is the ONLY intentional difference.

5. **Style swap is safe**: Changing `schema.themeId` changes visual appearance without touching block content. No content fields need to change.

---

## 9. Future: Global Style Contract (Target)

Current state: `themeId` controls colors/typography/shape. `contractId` overrides specific fields.

Target state: A **Global Style Contract** that also controls:
- Page layout pattern (sidebar vs full-width vs split)
- Block arrangement rules (which blocks go first, max per page)
- Interaction pattern defaults (quiz skin, game skin, reflection skin)
- Scoreboard skin (where scores appear, how they animate)
- Navigation chrome (which nav elements are visible)

This is a **future batch** — not implemented yet. The current contract defines the foundation.
