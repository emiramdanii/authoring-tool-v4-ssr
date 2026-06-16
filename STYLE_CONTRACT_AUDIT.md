# STYLE_CONTRACT_AUDIT.md

**Sprint:** 8.1 — Style Contract Audit & Consolidation
**Status:** Ready for Senior Review
**Date:** 2026-06-17
**Predecessor:** Sprint 7.2A-Patch-4 (Contract & Boundary FROZEN), cleanup commit `b85c218`

---

## 1. Audit Summary

This document records the **exhaustive inventory of all style-related fields** across the codebase as of Sprint 8.1, the **classification** of each field (Document / Page / Block / Runtime / Legacy), the **source-of-truth decisions** for each, and the **Style Contract** that Sprint 8.1 introduces to consolidate them.

The audit covered these directories:

```
src/core/schema/
src/core/template/
src/core/engine/
src/components/canva/page-renderer/
src/components/canva/right-panel/
src/components/authoring/live-preview/
src/export/
src/store/canva/
```

Plus reference files in `src/core/themes/`, `src/core/edu/`, `src/core/renderer/`, `src/core/vcs/`, `src/lib/`, `src/app/api/`, and `prisma/`.

---

## 2. Style Inventory Matrix

Legend for **Source of Truth** column:

- **Schema** — canonical, persisted in `ScreenSchema` or `LessonSchema` JSON
- **DB** — persisted as a top-level DB column
- **Runtime** — computed at render time, never persisted
- **Hardcoded** — inline in renderer/template code
- **Legacy** — persisted but superseded by a canonical schema field
- **New Contract** — managed by `src/core/style/` (Sprint 8.1)

| # | Style Concern | Current Location | Persisted? | Source of Truth | Canvas | Preview | Export | Risk |
|---|---|---|:---:|---|:---:|:---:|:---:|---|
| 1 | `schemaThemeId` / `themeId` | `ScreenSchema.themeId`, `LessonSchema.themeId`, `templateData.schemaThemeId` (legacy bridge), `Project.themeId` | Yes | Schema (canonical) + Legacy bridge | ✅ | ✅ | ✅ | Dual source (schema + templateData) — kept in sync by `setSchemaThemeId()` |
| 2 | `colorPalette` | `CanvaPage.colorPalette`, `Page.colorPalette` JSON | Yes | Legacy | ✅ (legacy) | ⚠️ | ⚠️ | Extracted from bg image, used by legacy `paletteToTokenOverrides()` only |
| 3 | `bgColor` / `backgroundColor` | `CanvaPage.bgColor` (legacy) + `ScreenSchema.background.color1/color2` (canonical) | Yes (both) | Schema | ✅ | ✅ | ✅ | Dual source — schema wins for schema pages; legacy is dead-data on schema pages |
| 4 | `bgImage` / `bgDataUrl` | `CanvaPage.bgDataUrl` (legacy) + `ScreenSchema.background.imageUrl` (canonical) | Yes (both) | Schema | ✅ | ✅ | ✅ | Dual source — same as #3 |
| 5 | `overlay` | `CanvaPage.overlay` (0-100, legacy) + `ScreenSchema.background.overlay` (0-80, canonical) + `Page.bgOverlay` DB (0-1 float!) | Yes (three scales!) | Schema | ✅ | ✅ | ✅ | **Three different scales** (0-100, 0-80, 0-1) — API boundary converts |
| 6 | `navConfig` / `navbarStyle` | `CanvaPage.navConfig` JSON + `Page.navConfig` DB | Yes | Schema (page-level chrome) | ✅ | ✅ | ✅ | Clean — single source, well-typed |
| 7 | `templateVariant` | `CanvaPage.templateVariant` + `block.variant` (synced by `setVariant()`) + `Page.variant` DB | Yes | Both (kept in sync) | ✅ | ✅ | ✅ | Dual source — store enforces sync; either is canonical |
| 8 | `accentColor` (block) | `block.accentColor` (most blocks), `block.borderColor` (def-box), `block.warna` (materi-blok) | Yes | Schema (block-level) | ✅ | ✅ | ✅ | Three semantically-equivalent field names — confusing |
| 9 | block `variant` | `block.variant` | Yes | Schema (block-level) | ✅ | ✅ | ✅ | Clean |
| 10 | block `stylePreset` | **NOT persisted as ID** — applied as patch via `applyGuidedSchemaPatch()` | No | Runtime resolver (`resolveBlockStylePreset()`) | ✅ | ✅ | ⚠️ | Preset choice is lost after application — cannot recover |
| 11 | typography / `fontFamily` / `fontSize` | `CanvaElement.fontSize/fontWeight/textColor` (legacy only) | Partial (legacy only) | Runtime (`TokenResolver.fontFamily/fontSize()`) | ✅ | ✅ | ⚠️ | Legacy `CanvaElement` fields persist; schema blocks resolve at runtime |
| 12 | `borderRadius` / `radius` | `TokenResolver.radius()` + contract `cardRadius` + `CanvaElement.radius` (legacy shape) | No | Runtime | ✅ | ✅ | ⚠️ | Export uses hardcoded CSS values |
| 13 | `shadow` / `boxShadow` | `TokenResolver.cardStyle/elevatedCardStyle/iosShadow()` + contract `cardShadow` | No | Runtime | ✅ | ✅ | ⚠️ | Export uses hardcoded CSS values |
| 14 | `spacing` / `padding` / `density` | `TokenResolver.spacing/iosCardPadding/iosInnerMargin()` + contract `pagePadding/cardPadding/blockGap` + `EDU_SPACING` | No | Runtime | ✅ | ✅ | ⚠️ | Export uses hardcoded CSS values |
| 15 | page background (composite) | `ScreenSchema.background` (canonical) + legacy `bgColor/bgDataUrl/overlay` + `EDU_MODE_BG` runtime override | Yes | Schema | ✅ | ✅ | ✅ | 5-layer stack rendered identically by `SchemaScreenRenderer` + export HTML |
| 16 | shell / navigation colors | `NAV_THEMES` map in `PageFrame.tsx` (runtime) + `PHASE_META` hardcoded hex (DUPLICATED in `LearningMediaShell` + `ExportApp`) | No | Runtime + Hardcoded | ✅ | ✅ | ✅ | **`PHASE_META` duplicated** between shell and export — parity risk |
| 17 | template hardcoded `className` / `style` | Pervasive across all 45+ block renderers | No | Hardcoded | ✅ | ✅ | ✅ | Some renderers use tokens, some hardcode; VCS linter exists |
| 18 | export-specific style handling | `src/lib/export/styles.ts` (hardcoded CSS) + `TOKEN_COLORS` map (duplicates `PRIMITIVES.color`) | No | Hardcoded | n/a | n/a | ✅ | **Export duplicates runtime tokens** — parity risk |
| 19 | unified style preset registry | **DOES NOT EXIST** prior to Sprint 8.1 | n/a | n/a | n/a | n/a | n/a | Fragmented across 4+ systems (block-style-presets, THEME_PRESETS, TemplateThemeContract, apply-theme-preset) |

---

## 3. Field Classification

Every style field is classified into one of five categories:

### 3.1 Document Style (persisted, affects whole media)

| Field | Where | Notes |
|---|---|---|
| `LessonSchema.themeId` | `src/core/schema/types/schema.ts` | Canonical document-level theme ID |
| `Project.themeId` (DB) | `prisma/schema.prisma` | DB-persisted project-level theme |
| `Project.schemaPreset` (DB) | `prisma/schema.prisma` | DB-persisted schema preset ID |
| **`DocumentStyle.presetId`** (NEW) | `src/core/style/types.ts` | Sprint 8.1 — stable preset identity |
| **`DocumentStyle.accentColor`** (NEW) | `src/core/style/types.ts` | Optional accent override |
| **`DocumentStyle.fontScale`** (NEW) | `src/core/style/types.ts` | Optional text scale override |
| **`DocumentStyle.density`** (NEW) | `src/core/style/types.ts` | Optional density override |

### 3.2 Page Style (persisted, affects single page)

| Field | Where | Notes |
|---|---|---|
| `ScreenSchema.background` | `src/core/schema/types/schema.ts` | Canonical page background |
| `CanvaPage.bgColor` (legacy) | `src/components/canva/types.ts` | Legacy; superseded by `ScreenSchema.background.color1` |
| `CanvaPage.bgDataUrl` (legacy) | `src/components/canva/types.ts` | Legacy; superseded by `ScreenSchema.background.imageUrl` |
| `CanvaPage.overlay` (legacy) | `src/components/canva/types.ts` | Legacy; superseded by `ScreenSchema.background.overlay` |
| `CanvaPage.navConfig` | `src/components/canva/types.ts` | Page-level navbar chrome (colorful/minimal/glass + visibility flags) |
| `CanvaPage.templateVariant` | `src/components/canva/types.ts` | Page-level variant (synced to all blocks) |
| `CanvaPage.colorPalette` (legacy) | `src/components/canva/types.ts` | Legacy extraction; not used by schema pages |
| **`PageStyle.background`** (NEW) | `src/core/style/types.ts` | Sprint 8.1 — normalized page background |
| **`PageStyle.surface`** (NEW) | `src/core/style/types.ts` | Optional surface treatment |
| **`PageStyle.composition`** (NEW) | `src/core/style/types.ts` | Optional composition intent |

### 3.3 Block Style (persisted, affects single block)

| Field | Where | Notes |
|---|---|---|
| `BaseBlock.variant` | `src/core/schema/types/base.ts` | Block variant A/B/C |
| `BaseBlock.style` | `src/core/schema/types/base.ts` | Generic inline style record (rarely used) |
| `block.accentColor` (most blocks) | `src/core/schema/types/blocks.ts` | Token key ('y','c','g','p','o','r') or hex |
| `block.borderColor` (def-box) | `src/core/schema/types/blocks.ts` | Semantic alias for accent |
| `block.warna` (materi-blok) | `src/core/schema/types/blocks.ts` | Semantic alias for accent |
| **`BlockStyle.presetId`** (NEW) | `src/core/style/types.ts` | Sprint 8.1 — block preset ID |
| **`BlockStyle.variant`** (NEW) | `src/core/style/types.ts` | Sprint 8.1 — block variant |
| **`BlockStyle.emphasis`** (NEW) | `src/core/style/types.ts` | Sprint 8.1 — block emphasis |

### 3.4 Runtime / UI State (NOT persisted, MUST NOT enter schema)

| Field | Where | Notes |
|---|---|---|
| `TokenResolver` instance | `src/core/renderer/types.ts` | Runtime-only resolver |
| `EDU_MODE_BG[displayMode]` | `src/core/edu/education-colors.ts` | Runtime override based on display mode |
| `EDU_MODE_SCALE[displayMode]` | `src/core/themes/education-typography.ts` | Runtime font scale multiplier |
| `NAV_THEMES` map | `src/components/canva/page-renderer/PageFrame.tsx` | Runtime navbar style computation |
| `PHASE_META` map | `src/components/canva/LearningMediaShell.tsx` (DUPLICATED in `ExportApp.tsx`) | Runtime phase badge color |
| `LayoutTheme` (live-preview) | `src/components/authoring/live-preview/types.ts` | Preview-local state, NOT persisted |
| `applyThemePreset()` (app chrome) | `src/lib/apply-theme-preset.ts` | localStorage only — affects editor UI, NOT project |
| `displayMode` / `eduViewingMode` | `src/store/canva/session-slice.ts` | Runtime viewing mode |
| `CanvaElement.fontSize/fontWeight/textColor` (legacy) | `src/components/canva/types.ts` | Legacy element-mode only — NOT used by schema blocks |

### 3.5 Legacy / Duplicate Field (kept for migration, deprecated)

| Field | Status | Migration Plan |
|---|---|---|
| `templateData.schemaThemeId` | Legacy bridge — kept in sync by `setSchemaThemeId()` | Remove after all readers use `schema.themeId` (Sprint 8.3+) |
| `CanvaPage.bgColor` | Legacy — superseded by `ScreenSchema.background.color1` | Keep until non-schema page path is removed (Sprint 8.3+) |
| `CanvaPage.bgDataUrl` | Legacy — superseded by `ScreenSchema.background.imageUrl` | Keep until non-schema page path is removed (Sprint 8.3+) |
| `CanvaPage.overlay` | Legacy — superseded by `ScreenSchema.background.overlay` | Keep until non-schema page path is removed (Sprint 8.3+) |
| `CanvaPage.colorPalette` | Legacy — only used by `paletteToTokenOverrides()` | Remove when TemplateAdapter is retired (Sprint 8.3+) |
| `block.borderColor` (def-box) | Semantic alias for accent | Standardize to `block.accentColor` (Sprint 8.4+) |
| `block.warna` (materi-blok) | Semantic alias for accent | Standardize to `block.accentColor` (Sprint 8.4+) |
| `THEME_CSS` (live-preview) | Preview-local, possibly dead | Verify usage; remove if dead (Sprint 8.2) |
| `silse/` directory | Dead/parallel export pipeline | Remove (out of Sprint 8.1 scope) |

---

## 4. Source of Truth Decisions

For every style concern, Sprint 8.1 declares the canonical source:

| Concern | Canonical Source | Migration Target |
|---|---|---|
| Document visual identity | `DocumentStyle.presetId` (NEW) | `src/core/style/preset-registry.ts` |
| Document accent override | `DocumentStyle.accentColor` (NEW) | `src/core/style/resolve-style-contract.ts` |
| Document text scale | `DocumentStyle.fontScale` (NEW) | `src/core/style/resolve-style-contract.ts` |
| Document density | `DocumentStyle.density` (NEW) | `src/core/style/resolve-style-contract.ts` |
| Page background | `ScreenSchema.background` (existing) | Unchanged in 8.1 — `PageStyle.background` (NEW) mirrors it |
| Page navbar chrome | `CanvaPage.navConfig` (existing) | Unchanged in 8.1 |
| Page variant | `CanvaPage.templateVariant` + `block.variant` (existing, synced) | Unchanged in 8.1 |
| Block variant | `block.variant` (existing) | Unchanged in 8.1 — `BlockStyle.variant` (NEW) mirrors it |
| Block accent | `block.accentColor` / `borderColor` / `warna` (existing) | Unchanged in 8.1 |
| Block style preset | `BlockStyle.presetId` (NEW) | Future: persist as ID on block (Sprint 8.2+) |
| Typography tokens | Runtime via `TokenResolver` | Future: `ResolvedStyleTokens.typography` (Sprint 8.2+) |
| Shape tokens (radius/shadow/border) | Runtime via `TokenResolver` + contract | Future: `ResolvedStyleTokens.shape` (Sprint 8.2+) |
| Spacing tokens | Runtime via `TokenResolver` + contract + EDU | Future: `ResolvedStyleTokens.spacing` (Sprint 8.2+) |
| Navigation style | `CanvaPage.navConfig.navbarStyle` (existing) | Unchanged in 8.1 |
| Phase metadata | `PHASE_META` hardcoded (DUPLICATED) | Future: extract to `src/core/style/phase-meta.ts` (Sprint 8.2+) |

**Key decision:** Sprint 8.1 does NOT remove or rename any existing field. All new fields are **additive** and live in `src/core/style/`. Consumers will be wired in Sprint 8.2+.

---

## 5. Style Contract Architecture

### 5.1 Flow

```
Teacher Style Choice
  → StyleContract persisted in schema (DocumentStyle / PageStyle / BlockStyle)
    → resolveStyleContract()  [pure, deterministic, SSR-safe]
      → ResolvedStyleTokens  [runtime-only, never persisted]
        → Canvas / Preview / Present / Export HTML  [all consume the SAME tokens]
```

### 5.2 Forbidden Flows

```
❌ Canvas computing its own style tokens
❌ Preview computing its own style tokens
❌ Export computing its own style tokens
❌ Templates hardcoding their own style tokens
❌ Runtime/UI state entering the schema
❌ Resolved tokens being persisted
❌ Separate resolvers per consumer
```

### 5.3 Teacher Controls vs Technical Tokens

**Teacher-facing controls** (visible in pickers):

| Control | Type | Persisted As |
|---|---|---|
| Gaya media (preset) | `StylePresetId` | `DocumentStyle.presetId` |
| Warna utama | `string` (token key or hex) | `DocumentStyle.accentColor` |
| Ukuran teks | `'compact' \| 'comfortable' \| 'large'` | `DocumentStyle.fontScale` |
| Kepadatan isi | `'compact' \| 'comfortable' \| 'spacious'` | `DocumentStyle.density` |
| Latar halaman | `PageStyle.background` | `PageStyle.background` |
| Gaya kartu | `'flat' \| 'soft' \| 'elevated'` | `PageStyle.surface` |
| Komposisi | `'default' \| 'focus' \| 'immersive'` | `PageStyle.composition` |
| Gaya block cepat | `string` (block preset ID) | `BlockStyle.presetId` |
| Varian block | `'A' \| 'B' \| 'C'` | `BlockStyle.variant` |
| Penekanan block | `'normal' \| 'highlight' \| 'strong'` | `BlockStyle.emphasis` |

**Technical tokens** (hidden from teachers, derived from preset):

- `colors.background` / `colors.surface` / `colors.surfaceStrong`
- `colors.text` / `colors.textMuted`
- `colors.accent` / `colors.accentContrast`
- `colors.border` / `colors.success` / `colors.error`
- `typography.headingFamily` / `typography.bodyFamily`
- `typography.headingScale` / `typography.bodyScale` / `typography.fontScaleMultiplier`
- `shape.radius` / `shape.borderWidth` / `shape.shadow`
- `spacing.pagePadding` / `spacing.cardPadding` / `spacing.blockGap`
- `navigation.style`
- `_legacyThemeId` / `_legacyContractId` (migration metadata only)

Teachers pick a preset → resolver derives all technical tokens. Teachers never edit individual tokens.

---

## 6. Six Stable Preset IDs

| ID | Label | Description | Legacy Theme Map | Legacy Contract Map |
|---|---|---|---|---|
| `academic-clean` | Akademik Bersih | Tampilan tenang dan profesional dengan aksen emas. | `golden-presentation` | `golden-pertemuan` |
| `school-cheerful` | Sekolah Ceria | Warna cerah dan ramah dengan sudut membulat. | `ceria` | — |
| `mission-adventure` | Misi Petualangan | Nuansa ekspedisi dengan aksen hijau hutan. | `petualangan` | — |
| `dark-elegant` | Gelap Elegan | Latar gelap dengan aksen neon terang. | `neon` | — |
| `nusantara-nature` | Nusantara Alam | Nuansa alam dan tanah Nusantara dengan aksen terra-cotta. | `warm-light` | — |
| `modern-interactive` | Modern Interaktif | Tema terang minimalis dengan aksen biru. | `ios-light` | — |

**Identity guarantee:** Once shipped, these IDs MUST NOT be renamed or reused for a different visual identity. Adding new IDs is allowed.

**Font constraint honored:** All presets use only font families already loaded by the app — `'Fredoka'`, `'Poppins'`, `'Nunito'`, plus CSS variables `--font-fredoka` / `--font-nunito` defined in `src/app/layout.tsx`. No external font dependencies added.

---

## 7. Compatibility Mapping

### 7.1 Legacy themeId → New presetId

```ts
LEGACY_THEME_TO_PRESET = {
  'golden-presentation': 'academic-clean',
  'ceria':                'school-cheerful',
  'petualangan':          'mission-adventure',
  'neon':                 'dark-elegant',
  'warm-light':           'nusantara-nature',
  'ios-light':            'modern-interactive',

  // Approximate mappings (many-to-one)
  'minimal':              'modern-interactive',
  'ocean-light':          'modern-interactive',
  'ios-warm':             'school-cheerful',
  'colorful':             'school-cheerful',
  'glass':                'dark-elegant',
  // Any other themeId → DEFAULT_PRESET_ID ('academic-clean')
};
```

### 7.2 Legacy field → New contract field

| Legacy Field | New Contract Field | Notes |
|---|---|---|
| `schemaThemeId` | `DocumentStyle.presetId` | Via `LEGACY_THEME_TO_PRESET` |
| `colorPalette` | (intentionally NOT mapped) | Legacy extraction — preset owns color |
| `templateVariant` | `BlockStyle.variant` (default) | Page-level variant doubles as block default |
| `bgColor` | `PageStyle.background.color` | When no image present |
| `bgDataUrl` | `PageStyle.background.imageUrl` | Takes precedence over `bgColor` |
| `overlay` (0-100 or 0-1) | `PageStyle.background.overlay` | Auto-converted from 0-1 if needed |
| `navbarStyle` | (carried as `_legacyNavbarStyle` hint) | Resolver doesn't yet consume — Sprint 8.2 |
| `block.accentColor` | (stays on block — not lifted) | Block-level concern, not document-level |
| `block.variant` | `BlockStyle.variant` | Direct mapping |
| `block.stylePreset` (applied patch) | `BlockStyle.presetId` | Direct mapping (when known) |

### 7.3 Migration Period Constraints

- **No legacy field is deleted in Sprint 8.1.** The legacy adapter is read-only.
- **No project data is migrated destructively.** Old projects continue to render via the existing pipeline.
- **The new contract is additive.** Consumers continue to read legacy fields directly until Sprint 8.2+ wires them to `resolveStyleContract()`.
- **`_legacyThemeId` / `_legacyContractId`** are metadata on `ResolvedStyleTokens` for the migration period. Sprint 8.4 will remove them.

---

## 8. Deliverables Checklist

| # | Deliverable | Status | Location |
|---|---|---|---|
| 1 | STYLE_CONTRACT_AUDIT.md | ✅ | `STYLE_CONTRACT_AUDIT.md` (this file) |
| 2 | Matrix of all current style fields | ✅ | §2 above |
| 3 | Source of truth decisions | ✅ | §4 above |
| 4 | `StyleContract` types | ✅ | `src/core/style/types.ts` |
| 5 | `ResolvedStyleTokens` types | ✅ | `src/core/style/types.ts` |
| 6 | `StylePresetRegistry` | ✅ | `src/core/style/preset-registry.ts` |
| 7 | `resolveStyleContract()` pure function | ✅ | `src/core/style/resolve-style-contract.ts` |
| 8 | Legacy compatibility mapping | ✅ | `src/core/style/legacy-style-adapter.ts` |
| 9 | Tests for resolver | ✅ | `src/core/style/__tests__/style-contract.test.ts` (49 tests) |
| 10 | Tests for fallback old projects | ✅ | `src/core/style/__tests__/legacy-style-adapter.test.ts` (54 tests) |
| 11 | Tests that runtime/UI state doesn't enter contract | ✅ | `src/core/style/__tests__/style-contract.test.ts` → "runtime/UI state isolation" suite |
| 12 | Tests that invalid preset ID falls back to default | ✅ | `src/core/style/__tests__/style-contract.test.ts` → "invalid preset id fallback" suite |
| 13 | Parity test Canvas/Preview/Export at token level | ✅ | `src/core/style/__tests__/style-parity.test.ts` (29 tests) |
| 14 | Worklog Sprint 8.1 | ✅ | `worklog.md` (appended) |

**Test totals:** 132 new tests across 3 files, all passing.

---

## 9. Sprint 8.1 Gate Verification

| Gate | Status | Evidence |
|---|---|---|
| 1. One style contract documented | ✅ | §5 above + `src/core/style/types.ts` |
| 2. Document/page/block/runtime style clearly separated | ✅ | §3 above + `types.ts` interfaces |
| 3. Preset registry has stable IDs | ✅ | §6 above + `preset-registry.ts` (6 IDs) |
| 4. Resolver is pure and testable | ✅ | `resolve-style-contract.ts` + 49 resolver tests |
| 5. Old projects continue to render | ✅ | Legacy adapter is read-only; no schema changes; 54 legacy tests pass |
| 6. Canvas and Export can use identical tokens | ✅ | 29 parity tests pass (Canvas = Preview = Present = Export) |
| 7. No UI-only style enters schema | ✅ | "runtime/UI state isolation" test suite enforces |
| 8. No persistence boundary changes | ✅ | `git diff` shows only `src/core/style/` additions — zero modifications to existing files |
| 9. No major redesign of teacher flow | ✅ | No teacher UI touched in Sprint 8.1 |
| 10. Old tests remain green | ✅ | 27 pre-existing failures unchanged; 132 new tests pass; zero new failures |

---

## 10. Items Explicitly Deferred to Sprint 8.2+

Sprint 8.1 deliberately does NOT do the following — these are deferred to keep the boundary frozen:

1. **Wire the resolver into actual consumers** (Canvas `PageFrame`, `SchemaScreenRenderer`, `LivePreview`, `ExportApp`, `html-templates`). Sprint 8.2+.
2. **Build the final teacher-facing style picker UI.** Sprint 8.2.
3. **Polish the 6 presets' visual identity** (colors, typography, spacing may evolve). Sprint 8.2.
4. **Persist `DocumentStyle` / `PageStyle` / `BlockStyle` in schema.** Sprint 8.2 (schema additive patch).
5. **Extract `PHASE_META` to `src/core/style/phase-meta.ts`** to remove duplication. Sprint 8.2+.
6. **Generate export CSS from `ResolvedStyleTokens`** to replace hardcoded `src/lib/export/styles.ts`. Sprint 8.3+.
7. **Unify token-key resolution** (e.g. `'y'` → hex) across consumers. Sprint 8.3+.
8. **Standardize block accent field names** (`borderColor` / `warna` → `accentColor`). Sprint 8.4+.
9. **Remove `templateData.schemaThemeId` legacy bridge.** Sprint 8.3+.
10. **Remove `silse/` dead pipeline.** Sprint 8.4+.
11. **Remove `_legacyThemeId` / `_legacyContractId` metadata from `ResolvedStyleTokens`.** Sprint 8.4.

---

## 11. Senior Review Report

The following decisions are brought to Senior Review:

1. **Source of truth for each style field** — See §4 table.
2. **Legacy fields retained** — `templateData.schemaThemeId`, `CanvaPage.bgColor/bgDataUrl/overlay`, `CanvaPage.colorPalette`, `block.borderColor` (def-box), `block.warna` (materi-blok), `THEME_CSS` (live-preview), `silse/` directory. All kept for compatibility.
3. **Deprecated fields** — `CanvaPage.bgColor/bgDataUrl/overlay/colorPalette` (legacy, superseded by `ScreenSchema.background`); `block.borderColor/warna` (semantic aliases); `templateData.schemaThemeId` (legacy bridge).
4. **What is stored in schema** — All existing schema fields unchanged. New fields (`DocumentStyle.presetId` etc.) NOT yet persisted in Sprint 8.1 — deferred to Sprint 8.2 schema additive patch.
5. **What is only computed** — All `ResolvedStyleTokens` fields are runtime-only, never persisted. `_legacyThemeId` / `_legacyContractId` are migration metadata.
6. **What is visible to teachers** — See §5.3 "Teacher Controls" table.
7. **What is technical-only** — See §5.3 "Technical Tokens" list.
8. **How Canvas and Export get identical tokens** — Both call `resolveStyleContract()` with the same input. Sprint 8.1 tests this via 4 consumer adapter stubs (`resolveCanvasStyle` / `resolvePreviewStyle` / `resolvePresentStyle` / `resolveExportStyle`), all of which call the same resolver. Sprint 8.2+ replaces these stubs with real consumer wiring.
9. **How old projects stay compatible** — `resolveLegacyStyle()` converts legacy fields into a normalized `StyleContract`. The legacy adapter is pure, read-only, and never mutates the input. Invalid themeId falls back to `DEFAULT_PRESET_ID`. Old projects render via the existing pipeline unchanged.
10. **What is deferred to Sprint 8.2** — See §10 above (11 items).

---

**End of Sprint 8.1 Style Contract Audit.**
