# STYLE_CONTRACT_AUDIT.md

**Sprint:** 8.2A — Style Consumer Wiring: Canvas + Preview
**Status:** Ready for Senior Review (Sprint 8.2A — Canvas + Preview wiring complete)
**Date:** 2026-06-17
**Sprint 8.2A commit:** (pending push)
**Predecessors:**
  - Sprint 8.1     commit `b79df6b` (returned CHANGES REQUIRED → 4 P0 + 2 P1)
  - Sprint 8.1-Patch commit `e2178e4` (returned CHANGES REQUIRED → 3 P0 + 2 P1)
  - Sprint 8.1-Patch-2 commit `50af012` (returned PASS — closed Sprint 8.1)

## Sprint 8.2A Summary

This sprint wires the actual Canvas and Preview consumers to the
Style Contract system established in Sprint 8.1-Patch-2. All changes
are confined to:

  - `src/core/style/` (new: `page-style-adapter.ts`, `consumer.ts`,
    `consumer-entry-points.ts`; tests for each)
  - `src/components/canva/page-renderer/` (PageRenderer + PageFrame)
  - `src/components/authoring/live-preview/` (no source changes —
    LivePreview already routes through PageRenderer, so it inherits
    the new wiring automatically)
  - test files under `src/core/style/__tests__/`
  - this document + `worklog.md`

No frozen boundary was touched:
  - dirty-store, save-utils, autosave, project manager, persistence-slice
  - database contract, hydration, TemplateAdapter utama
  - export pipeline, Present/PlayOverlay, teacher picker UI — all UNCHANGED.

## Sprint 8.2A — Adapter & Helper Architecture

### New modules

| Module | Role |
|---|---|
| `src/core/style/page-style-adapter.ts` | `createStyleContractFromPage(page)` — pure adapter CanvaPage → StyleContract. Source priority: `page.contractId` → `compatibility.legacyThemeId` → preset bridge → default. |
| `src/core/style/consumer.ts` | `resolvePageStyleTokens(page)` — shared helper Canvas + Preview both call. Returns `ResolvedStyleTokens` + source metadata. |
| `src/core/style/consumer-entry-points.ts` | `resolveCanvasConsumerTokens()` + `resolvePreviewConsumerTokens()` — thin wrappers (zero logic) so the parity test has explicit entry points. |

### Source priority (matches Sprint 8.1-Patch-2 integration guard)

```text
1. page.contractId eksplisit          → source: 'explicit-contract'
2. compatibility.legacyThemeId /       → source: 'legacy-theme'
   schemaThemeId lama
3. preset._legacyContractId sebagai    → source: 'new-preset'
   bridge (preset-driven)
4. default style contract              → source: 'default'
```

`page.contractId` is NEVER overwritten by `preset._legacyContractId`.
The contract id remains a page-level persistent field with its own
authority — see `TemplateThemeContract` for the legacy enforcement
pipeline (Sprint 8.2B will wire Present/Export through the same path).

### Canvas wiring (PageRenderer + PageFrame)

- `PageRenderer` resolves `pageStyleTokens` via the shared helper and
  passes them as a new prop to `PageFrame`.
- `PageFrame` reads:
  - Background color fallback: `page.bgColor || tokens.page.background.color1 || tokens.colors.background || modeBg.bg`
  - Navbar style fallback chain: `navConfig.navbarStyle` (when valid) → `tokens.navigation.style` → `'colorful'`
- The legacy `TokenResolver` continues to drive block-level concerns
  (frozen boundary — 30+ block renderers depend on its API).

### Preview wiring

`LivePreview.tsx` already routes through `PageRenderer mode="preview"`,
so it inherits the new wiring automatically. `SchemaPlayer.tsx` is
untouched in this sprint — it operates on `LessonSchema` (multi-screen)
which is out of scope for 8.2A; Sprint 8.2B may wire it through the
same helper.

### Tests

| File | Tests | Purpose |
|---|---|---|
| `page-style-adapter.test.ts` | 26 | 8 mandatory adapter tests + 6 regression fixtures + edge cases |
| `canvas-preview-parity.test.ts` | 13 | Canvas/Preview token parity (6 fixtures + edge cases + wrapper identity) |

## Verification

```bash
npx vitest run src/core/style       # 277/277 PASS (was 238 + 39 new)
npx vitest run src/core             # 401/401 PASS (was 362 + 39 new)
npx tsc --noEmit                    # 46 pre-existing errors (down from 62 due to dependency upgrade). ZERO new errors in changed files.
npm run build                       # Compiled successfully in 10.6s, 12/12 static pages.
```

## Acceptance Gate

| # | Criterion | Status |
|---|---|---|
| 1 | Adapter page/schema → StyleContract tersedia | ✅ PASS |
| 2 | Adapter pure dan tidak memutasi input | ✅ PASS (test 8) |
| 3 | page.contractId tetap prioritas tertinggi | ✅ PASS (test 6) |
| 4 | Original legacyThemeId tetap tersedia | ✅ PASS (test 4) |
| 5 | Canvas memakai resolved style tokens | ✅ PASS (PageRenderer wired) |
| 6 | Preview memakai helper/token yang sama | ✅ PASS (PageRenderer mode="preview") |
| 7 | Canvas dan Preview menghasilkan token identik | ✅ PASS (parity tests) |
| 8 | Legacy project tidak kehilangan tema/background/overlay/navbar | ✅ PASS (regression fixtures F1–F6) |
| 9 | Persistence boundary tidak berubah | ✅ PASS (zero frozen-boundary files touched) |
| 10 | Present dan Export belum disentuh | ✅ PASS (deferred to 8.2B / 8.2C) |
| 11 | Teacher picker belum ditambahkan | ✅ PASS (deferred to 8.2D) |
| 12 | Seluruh test baru lulus dan failure lama tidak bertambah | ✅ PASS (277 style + 401 core; zero new TS errors in changed files) |

## Deferred items

```text
Sprint 8.2B — Present wiring
Sprint 8.2C — Export HTML wiring
Sprint 8.2D — Teacher style picker
Sprint 8.3  — Base Template Visual
Sprint 8.4  — Browser visual parity & overflow
Sprint 9    — Flow Guru
```

---

## Sprint 8.1-Patch-2 (Historical — closed)

**Patch-2 commit:** `50af012a242c6258a93af018ff65b61b91e3ebbc`
**Predecessors:**
  - Sprint 8.1 commit `b79df6b` (returned CHANGES REQUIRED → 4 P0 + 2 P1)
  - Patch-1   commit `e2178e4` (returned CHANGES REQUIRED → 3 P0 + 2 P1)

| Issue | Severity | Resolution |
|---|---|---|
| P0-1 — Overlay conversion rescales opacity (Patch-1 ×0.8 silently turned Canva 40 → 32) | P0 | Overlay adapters now PRESERVE the opacity percentage. `resolveCanvaOverlay(40)===40`, `resolveDbOverlay(0.4)===40`, `resolveSchemaOverlay(40)===40`. Values above the schema max (80) are clamped, not rescaled. New semantic-equality tests assert `Canva 40 === DB 0.4 === Schema 40 === 40` and `Canva 100 === DB 1.0 === Schema 80 === 80`. |
| P0-2 — `navbarStyle` silently dropped via `void input.navbarStyle` after side-channel removal | P0 | Added formal `PageStyle.navigation.style` field (type `NavigationStyle = 'colorful' \| 'minimal' \| 'glass'`). Legacy adapter carries `navbarStyle` through via the proper contract field — no more silent discard, no side-channel. Tests assert different navbarStyle values produce different `tokens.navigation.style`. |
| P0-3 — Legacy theme identity lost through adapter (macam-norma → academic-clean → 'golden-presentation') | P0 | Added `StyleContract.compatibility.legacyThemeId`. Legacy adapter preserves the ORIGINAL `schemaThemeId` verbatim. Resolver sources `_legacyThemeId` from `compatibility.legacyThemeId` FIRST, falling back to `preset._legacyThemeId`. `PRESET_TO_LEGACY_THEME` made `Partial` — removed fake `mission-adventure → 'glass'` bridge that caused unstable round-trip (`mission-adventure → 'glass' → dark-elegant`). Tests verify `macam-norma` round-trips to `macam-norma` (not `golden-presentation`). |
| P1-1 — Semantic output shares reference with preset registry (mutation poisons future calls) | P1 | Resolver now deep-clones `semantic` tree: `{ ...preset.semantic, accents: { ...preset.semantic.accents }, categories: { ...preset.semantic.categories } }`. Mutation tests verify that mutating `tokens.semantic.categories.X` on one resolved output does NOT affect the next resolver call or the preset registry itself. |
| P1-2 — Two sources of semantic colors can diverge (Canvas reads `colors.success` while Export reads `semantic.success`) | P1 | Single source of truth: `semantic.primary = accent` (the resolved accent, including document override), `semantic.success = preset.colors.success`, `semantic.error = preset.colors.error`. Tests enforce `tokens.semantic.primary === tokens.colors.accent`, `tokens.semantic.success === tokens.colors.success`, `tokens.semantic.error === tokens.colors.error` for every preset. |

**Predecessor:** Sprint 7.2A-Patch-4 (Contract & Boundary FROZEN), cleanup commit `b85c218`

---

## Patch-2 Component Status

| Area | Status |
|---|---|
| Complete page/block resolver output | ✅ PASS (carried from Patch-1) |
| Schema-compatible background shape | ✅ PASS (carried from Patch-1) |
| Token-key → CSS resolution | ✅ PASS (carried from Patch-1) |
| Exhaustive registry enumeration | ✅ PASS (carried from Patch-1) |
| Resolver consistency gate wording | ✅ PASS (carried from Patch-1) |
| Overlay semantic preservation (Patch-2 P0-1) | ✅ PASS |
| Navigation compatibility (Patch-2 P0-2) | ✅ PASS |
| Original legacy theme identity (Patch-2 P0-3) | ✅ PASS |
| Resolver output isolation (Patch-2 P1-1) | ✅ PASS |
| Semantic single source of truth (Patch-2 P1-2) | ✅ PASS |

---

## Patch-2 Test Inventory

| Test File | Tests | Coverage |
|---|---|---|
| `style-contract.test.ts` | 86 | +14 Patch-2 tests (semantic isolation, navigation override, compatibility.legacyThemeId propagation, single-source aliases) |
| `legacy-style-adapter.test.ts` | 88 | +19 Patch-2 tests (overlay percentage preserved, navbarStyle carry-through, original legacy theme identity preservation, PRESET_TO_LEGACY_THEME Partial) |
| `style-parity.test.ts` | 33 | macam-norma test updated to assert `_legacyThemeId === 'macam-norma'` (Patch-2 P0-3) |
| `cross-registry-consistency.test.ts` | 21 | +2 Patch-2 tests (mission-adventure has no bridge; 5 of 6 presets have real bridge) |
| `patch-2-regression.test.ts` (NEW) | 10 | 6 focused regression tests covering each Patch-2 fix + end-to-end realistic-project test |
| **Total** | **238** | **All passing** |

---

## Patch-2 Gate Verification

| Gate | Status | Evidence |
|---|---|---|
| 1. One style contract documented | ✅ | §5 + `src/core/style/types.ts` |
| 2. Document/page/block/runtime style clearly separated | ✅ | §3 + `types.ts` interfaces |
| 3. Preset registry has stable IDs | ✅ | §6 + `preset-registry.ts` (6 IDs) |
| 4. Resolver is pure and testable | ✅ | `resolve-style-contract.ts` + 86 resolver tests |
| 5. Old projects continue to render | ✅ | Legacy adapter is read-only; 88 legacy tests pass |
| 6. Canvas and Export can use identical tokens | ⏳ READY FOR INTEGRATION | 33 resolver-consistency tests pass at resolver level. Real consumer wiring deferred to Sprint 8.2. |
| 7. No UI-only style enters schema | ✅ | "runtime/UI state isolation" test suite enforces |
| 8. No persistence boundary changes | ✅ | `git diff` shows only `src/core/style/` modifications |
| 9. No major redesign of teacher flow | ✅ | No teacher UI touched |
| 10. Old tests remain green | ✅ | 362 core tests pass; 62 pre-existing TypeScript errors unchanged (none in `src/core/style/`) |
| 11. Cross-registry consistency | ✅ | 21 tests verify against actual `THEME_PRESETS`, `DesignTokens`, `BLOCK_STYLE_PRESETS`, `ScreenSchema` |
| 12. Semantic palette covers 6 accents + categories | ✅ | `academic-clean` carries 4 macam-norma categories |
| 13. Background contract matches ScreenSchema | ✅ | `PageBackgroundStyle` aligned with `ScreenSchema.background` |
| 14. Overlay percentage preserved (Patch-2 P0-1) | ✅ | `Canva 40 === DB 0.4 === Schema 40 === 40` asserted in 3 tests |
| 15. Navigation carry-through (Patch-2 P0-2) | ✅ | 10 tests assert navbarStyle → page.navigation.style → tokens.navigation.style |
| 16. Original legacy theme identity (Patch-2 P0-3) | ✅ | macam-norma + 7 PPKn domain themes round-trip to original ID; mission-adventure fake bridge removed |
| 17. Resolver output isolation (Patch-2 P1-1) | ✅ | Mutation tests verify deep-clone of semantic tree |
| 18. Semantic single source of truth (Patch-2 P1-2) | ✅ | Tests enforce `semantic.primary===colors.accent`, `semantic.success===colors.success`, `semantic.error===colors.error` for every preset |

---

## Patch-2 Architectural Changes

### Type System (`src/core/style/types.ts`)

1. **`NavigationStyle` type added** — `'colorful' | 'minimal' | 'glass'`.
   Mirrors `NavConfig.navbarStyle` from legacy `CanvaPage`.
2. **`PageStyle.navigation` field added** — `{ style?: NavigationStyle }`.
   Replaces the removed `_legacyNavbarStyle` side-channel with a proper
   typed contract field.
3. **`StyleCompatibility` interface added** — `{ legacyThemeId?: string }`.
   Carries the ORIGINAL legacy `schemaThemeId` forward so Sprint 8.2
   can still branch on it for exact visual fidelity.
4. **`StyleContract.compatibility` field added**.
5. **`ResolvedStyleTokens._legacyThemeId` made optional** — was `string`,
   now `string | undefined`. Source priority:
   `compatibility.legacyThemeId` → `preset._legacyThemeId` → `undefined`.
6. **`TeacherStyleControl` extended** with `{ kind: 'pageNavigation'; value: NavigationStyle }`.

### Preset Registry (`src/core/style/preset-registry.ts`)

1. **`StylePresetDefinition._legacyThemeId` made optional**.
2. **`mission-adventure._legacyThemeId: 'glass'` REMOVED** — the fake
   bridge caused an unstable round-trip. `mission-adventure` now has
   no `_legacyThemeId`; fresh projects get `undefined`.

### Resolver (`src/core/style/resolve-style-contract.ts`)

1. **`resolveNavigationStyle()` helper added** — accepts override,
   falls back to preset default, then to `DEFAULT_NAVIGATION_STYLE`.
2. **Semantic deep-clone** — `{ ...preset.semantic, accents: {...}, categories: {...} }`
   ensures consumer mutations cannot poison the preset registry.
3. **Single-source aliases** — `semantic.primary = accent` (the resolved
   accent, including document override), `semantic.success = preset.colors.success`,
   `semantic.error = preset.colors.error`.
4. **`_legacyThemeId` source priority** — `compatibility.legacyThemeId`
   takes precedence over `preset._legacyThemeId`.

### Legacy Adapter (`src/core/style/legacy-style-adapter.ts`)

1. **`PRESET_TO_LEGACY_THEME` made `Partial`** — `mission-adventure` removed.
2. **`normalizeNavbarStyle()` helper added** — validates input against
   the three allowed values; returns `undefined` for invalid input.
3. **`PageStyle.navigation.style` carry-through** — replaces the
   Patch-1 `void input.navbarStyle` discard.
4. **`StyleContract.compatibility.legacyThemeId` population** — preserves
   the original `input.schemaThemeId` for downstream consumers.
5. **Overlay resolvers preserve percentage**:
   - `resolveCanvaOverlay(v)`: clamp(round(v), 0, 80)
   - `resolveDbOverlay(v)`: clamp(round(v × 100), 0, 80)
   - `resolveSchemaOverlay(v)`: clamp(round(v), 0, 80)

---

## Patch-2 Compatibility Notes

### Old projects (legacy schemaThemeId)

- Projects with `schemaThemeId = 'macam-norma'` (or any of the 7 PPKn
  domain themes) now resolve to `_legacyThemeId = 'macam-norma'`
  (the original) instead of `'golden-presentation'` (the bridge).
  This means Sprint 8.2's legacy-renderer branch can still select the
  macam-norma pipeline for exact visual fidelity.
- Projects with `navbarStyle: 'minimal'` or `'glass'` now carry that
  choice through to `tokens.navigation.style` instead of silently
  reverting to the preset default.
- Projects with `overlay: 40` (Canva scale) now render at 40% opacity
  instead of being silently darkened to 32%. This is a VISIBLE change
  for projects that had overlay > 0 — the visual will be slightly
  DARKER than under Patch-1 (because 40 > 32). This is correct: 40
  was what the teacher originally intended.

### Fresh projects (new preset IDs)

- Picking `mission-adventure` no longer fabricates a `_legacyThemeId
  = 'glass'` bridge. Fresh projects get `_legacyThemeId: undefined`
  — Sprint 8.2 knows there is no legacy renderer to fall back to and
  should render directly from the new preset.

### Semantic color consistency

- All consumers can now safely read either `colors.success` or
  `semantic.success` — they are guaranteed identical. Same for
  `colors.error` / `semantic.error` and `colors.accent` /
  `semantic.primary`.

---

## Items Still Deferred to Sprint 8.2+

(Unchanged from Patch-1 — see §10 in the predecessor audit for the
full list.)

---

**End of Patch-2 Style Contract Audit.**


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

### 7.2 Legacy field → New contract field (Patch P0-1/P0-4/P1)

| Legacy Field | New Contract Field | Notes |
|---|---|---|
| `schemaThemeId` | `DocumentStyle.presetId` | Via `LEGACY_THEME_TO_PRESET` (17 entries — exhaustive) |
| `colorPalette` | (intentionally NOT mapped) | Legacy extraction — preset owns color |
| `templateVariant` | `BlockStyle.variant` (default) | Page-level variant doubles as block default |
| `bgColor` | `PageStyle.background.color1` | When no image present (P0-4: color → color1) |
| `bgDataUrl` | `PageStyle.background.imageUrl` | Layered on top of solid/gradient (P0-4: not a separate type) |
| `overlay` (Canva 0-100) | `PageStyle.background.overlay` | Via `resolveCanvaOverlay()` — multiplies by 0.8 (P0-4) |
| `overlay` (DB 0-1 float) | `PageStyle.background.overlay` | Via `resolveDbOverlay()` — multiplies by 80 (P0-4) |
| `overlay` (Schema 0-80) | `PageStyle.background.overlay` | Via `resolveSchemaOverlay()` — pass-through (P0-4) |
| `navbarStyle` | (NOT mapped — P1 patch) | Side-channel removed; resolver derives nav style from preset |
| `block.accentColor` | `BlockStyle.accentColor` (P0-1 patch) | Now lifted to block contract; drives `block.accent` output |
| `block.variant` | `BlockStyle.variant` | Direct mapping |
| `block.stylePreset` (applied patch) | `BlockStyle.presetId` | Direct mapping (when known) |

### 7.3 Migration Period Constraints

- **No legacy field is deleted in Sprint 8.1.** The legacy adapter is read-only.
- **No project data is migrated destructively.** Old projects continue to render via the existing pipeline.
- **The new contract is additive.** Consumers continue to read legacy fields directly until Sprint 8.2+ wires them to `resolveStyleContract()`.
- **`_legacyThemeId` / `_legacyContractId`** are metadata on `ResolvedStyleTokens` for the migration period. Sprint 8.4 will remove them.

---

## 8. Deliverables Checklist (Patch)

| # | Deliverable | Status | Location |
|---|---|---|---|
| 1 | STYLE_CONTRACT_AUDIT.md | ✅ | `STYLE_CONTRACT_AUDIT.md` (this file) |
| 2 | Matrix of all current style fields | ✅ | §2 above |
| 3 | Source of truth decisions | ✅ | §4 above |
| 4 | `StyleContract` types | ✅ | `src/core/style/types.ts` (patched: PageBackgroundStyle aligned w/ ScreenSchema) |
| 5 | `ResolvedStyleTokens` types | ✅ | `src/core/style/types.ts` (patched: +page, +block, +semantic) |
| 6 | `StylePresetRegistry` | ✅ | `src/core/style/preset-registry.ts` (patched: +semantic palette per preset) |
| 7 | `resolveStyleContract()` pure function | ✅ | `src/core/style/resolve-style-contract.ts` (patched: resolves token keys, consumes all teacher controls) |
| 8 | Legacy compatibility mapping | ✅ | `src/core/style/legacy-style-adapter.ts` (patched: 17-entry exhaustive map, source-split overlay adapters, no side-channel) |
| 9 | Tests for resolver | ✅ | `src/core/style/__tests__/style-contract.test.ts` (72 tests — incl. P0-1 behavioral) |
| 10 | Tests for fallback old projects | ✅ | `src/core/style/__tests__/legacy-style-adapter.test.ts` (69 tests — incl. P0-2 exhaustive) |
| 11 | Tests that runtime/UI state doesn't enter contract | ✅ | `src/core/style/__tests__/style-contract.test.ts` → "runtime/UI state isolation" suite |
| 12 | Tests that invalid preset ID falls back to default | ✅ | `src/core/style/__tests__/style-contract.test.ts` → "invalid preset id fallback" suite |
| 13 | Resolver consistency test (was "parity") | ✅ READY FOR INTEGRATION | `src/core/style/__tests__/style-parity.test.ts` (33 tests — P1 patch: downgraded gate) |
| 14 | Cross-registry consistency test (NEW) | ✅ | `src/core/style/__tests__/cross-registry-consistency.test.ts` (19 tests — verifies against actual THEME_PRESETS, DesignTokens, BLOCK_STYLE_PRESETS, ScreenSchema) |
| 15 | Worklog Sprint 8.1 + Patch | ✅ | `worklog.md` (appended) |

**Test totals (patched):** 193 tests across 4 files, all passing (up from 132 in Sprint 8.1).

---

## 9. Sprint 8.1 Gate Verification (Patch)

| Gate | Status | Evidence |
|---|---|---|
| 1. One style contract documented | ✅ | §5 above + `src/core/style/types.ts` |
| 2. Document/page/block/runtime style clearly separated | ✅ | §3 above + `types.ts` interfaces |
| 3. Preset registry has stable IDs | ✅ | §6 above + `preset-registry.ts` (6 IDs) |
| 4. Resolver is pure and testable | ✅ | `resolve-style-contract.ts` + 72 resolver tests (P0-1 behavioral coverage) |
| 5. Old projects continue to render | ✅ | Legacy adapter is read-only; no schema changes; 69 legacy tests pass (P0-2 exhaustive coverage) |
| 6. Canvas and Export can use identical tokens | ⏳ READY FOR INTEGRATION | 33 resolver-consistency tests pass at the resolver level (P1 patch: gate downgraded from PASS). Real consumer wiring deferred to Sprint 8.2. |
| 7. No UI-only style enters schema | ✅ | "runtime/UI state isolation" test suite enforces (incl. `_legacyNavbarStyle` absence check) |
| 8. No persistence boundary changes | ✅ | `git diff` shows only `src/core/style/` modifications — zero changes to existing files outside the new module |
| 9. No major redesign of teacher flow | ✅ | No teacher UI touched in Sprint 8.1 |
| 10. Old tests remain green | ✅ | 27 pre-existing failures unchanged; 193 new tests pass; zero new failures |
| 11. Cross-registry consistency (NEW) | ✅ | 19 tests verify against actual `THEME_PRESETS`, `DesignTokens`, `BLOCK_STYLE_PRESETS`, `ScreenSchema` |
| 12. Semantic palette covers 6 accents + categories (NEW) | ✅ | `academic-clean` carries 4 macam-norma categories; cross-registry test verifies accent key coverage |
| 13. Background contract matches ScreenSchema (NEW) | ✅ | `PageBackgroundStyle` aligned with `ScreenSchema.background` (radial, color2, imageFit/Opacity/Blur, overlay 0-80) |

### Patch-specific gate additions

The Senior Review verdict required explicit evidence that each P0 issue is resolved. The patch adds:

- **P0-1 evidence:** `style-contract.test.ts` "page-level overrides produce visible changes" suite + "block-level overrides produce visible changes" suite (24 behavioral tests asserting surface/composition/emphasis/overlay actually change the output, not just `not.toThrow()`).
- **P0-2 evidence:** `cross-registry-consistency.test.ts` imports the real `THEME_PRESETS` array and verifies every ID has a mapping. Also verifies `ceria`/`petualangan` are NOT in the theme mapping (they are block presets).
- **P0-3 evidence:** `style-contract.test.ts` "semantic palette" suite verifies all 6 accents present + macam-norma 4 categories preserved + cross-registry test confirms accent hex values match the legacy `THEME_PRESETS` for direct-mapped presets.
- **P0-4 evidence:** `legacy-style-adapter.test.ts` "source-aware overlay resolution" suite tests `resolveCanvaOverlay`/`resolveDbOverlay`/`resolveSchemaOverlay` separately with explicit scale conversions. `cross-registry-consistency.test.ts` verifies `PageBackgroundStyle` field names match `ScreenSchema.background`.
- **P1 evidence:** `style-contract.test.ts` asserts token keys (`'y'`, `'c'`, `'g'`) resolve to CSS hex (not passed through). `style-parity.test.ts` renamed to "Resolver Consistency Contract" with explicit READY FOR INTEGRATION gate.



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

**End of Patch-2 Style Contract Audit.**
