# AUDIT KONEKTOR — Pipeline Schema → Engine → Layout → Renderer → Canvas → Export

Tanggal: 2026-05-14
Tujuan: Temukan SEMUA titik putus/salah sambung di jalur logistik data

---

## PIPELINE MAP (Data Flow)

```
Preset Schema (.ts)
    ↓ loadPreset()
LessonSchema
    ↓ schemaToCanvaPages()
CanvaPage[] (with page.schema)
    ↓ loadSchemaPreset() → CanvaStore.pages
CanvaStore
    ↓ Stage reads pages[currentPageIndex]
PageRenderer
    ↓ ensurePageSchema() → ScreenSchema
    ↓ getSceneResolution() → SceneResolution
    ↓ computeSafeArea() → SafeArea
SchemaScreenRenderer
    ↓ resolveSceneLayout(blocks, sceneRes, safeArea) → ResolvedBlockPosition[]
    ↓ getBlockPositionStyle(resolved) → CSS absolute style
SchemaBlockRenderer (dispatched by SceneRegistry)
    ↓ BlockComponent(block, tokens, mode, ...)
Individual Renderer (CoverRenderer, FtabRenderer, etc.)
    ↓ React DOM output
PageFrame (wraps children with navbar + content area offset)
    ↓ CSS offset: top=topNavH, bottom=bottomNavH
Stage (canvas viewport with zoom/pan)
    ↓ transform: scale(zoom) + translate(panX, panY)
PlayOverlay (preview mode)
    ↓ computeSceneScale() → transform: scale()
Export (wraps children with navbar + content area offset)
    ↓ CSS offset: top=topNavH, bottom=bottomNavH
Stage (zoom + pan + transform)
    ↓ transform: scale(effectiveZoom)
VIEWPORT (browser renders)
```

---

## MASALAH KONEKTOR YANG DITEMUKAN

### 🔴 KONEKTOR 1: DOUBLE OFFSET (PageFrame + SchemaScreenRenderer)

**Lokasi:** PageFrame.tsx L496-499 + SchemaRenderer.tsx L147

**Masalah:**
- PageFrame offset content area: `top: showTopNav ? topNavH : 0` (44px)
- SchemaScreenRenderer also positions first block at: `safeArea.top` (44px)
- Result: First flow block starts at 88px from scene top (44 + 44)
- Blocks after cover page are pushed down, causing content to overflow/overlap

**Dampak:** Semua halaman non-cover (petunjuk, tp, materi, dll) punya offset ganda.
Content terlihat "terlalu rendah" atau overflow di bawah.

**Fix:** Schema-driven pages need FULL scene canvas (no CSS offset from PageFrame).
PageFrame navbars should be overlays (z-50). SchemaScreenRenderer handles offset via safeArea.

---

### 🔴 KONEKTOR 2: Cover/Hero Height Mismatch (600px vs 720px)

**Lokasi:** BlockDefinitionRegistry.ts L126 + SceneLayoutEngine.ts L351-354

**Masalah:**
- Scene virtual canvas = 1280×720
- Cover estimatedHeight = { A: 600, B: 550, C: 500 }
- In `estimateBlockHeight()`, cover/hero case: `contentHeight = baseHeight` → 600
- CoverRenderer uses `absolute inset-0` → fills allocated 600px
- Result: 120px gap at bottom of cover page
- Visual: Cover appears "too high up" with empty space below

**Dampak:** Cover dari preset terlihat tidak centered — terlalu ke atas, ruang kosong di bawah.

**Fix:** Cover/hero blocks should ALWAYS use scene height (720) as their height.
In `resolveSceneLayout()`, when a flow block is cover/hero, set height = scene.h.

---

### 🔴 KONEKTOR 3: Ftab Height Underestimated (400px vs ~800px actual)

**Lokasi:** BlockDefinitionRegistry.ts L302 + SceneLayoutEngine.ts (no 'ftab' case)

**Masalah:**
- Ftab estimatedHeight = { A: 400 } (registry)
- `estimateBlockHeight()` has NO case for 'ftab' → falls to default → uses baseHeight = 400
- Real ftab in Materi 2 preset: 5 tabs, each with def-box + nc-grid
- Actual rendered height: ~600-800px
- Overflow rule: 'internalScroll' → gets fixed 400px with overflow-y: auto
- BUT the position calculation for NEXT block uses 400px, so next block starts too early
- Result: Materi 1 and Materi 2 blocks OVERLAP

**Dampak:** Overlap antar blok di halaman materi. Ftab content terpotong atau blok berikutnya menimpa.

**Fix:** Add 'ftab' case in estimateBlockHeight() that calculates height based on:
- Number of tabs
- Nested content per tab (sum of child block estimated heights)
- Tab header height (~40px)
- Progress bar height (~30px if showProgress)

---

### 🟡 KONEKTOR 4: MateriSection Nested Content Not Estimated

**Lokasi:** SceneLayoutEngine.ts L307-312

**Masalah:**
- MateriSection estimatedHeight = { A: 500 }
- `estimateBlockHeight()` case 'materi-section':
  ```
  const numContent = ms.content?.length || 0;
  contentHeight = 60 + numContent * 150 + numTakeaway * 30;
  ```
- But `ms.content` is `SchemaBlock[]` — the estimation uses flat count, not recursive estimation
- Each child block could be 120px (def-box) or 250px (nc-grid) or more
- With 3 content blocks, estimate = 60 + 3*150 = 510, but real = 60 + 120 + 250 + 200 = 630+
- Similar underestimation as ftab, but less severe

**Dampak:** Materi-section content bisa overflow, tetapi lebih jarang karena default autoResize.

---

### 🟡 KONEKTOR 5: Cover + hasCoverBlock Safe Area Logic Inconsistency

**Lokasi:** SchemaRenderer.tsx L124 + L147 + PageFrame.tsx L354-357

**Masalah:**
- SchemaScreenRenderer determines `hasCoverBlock` = `screen.blocks.length === 1 && type is cover/hero`
- If true → uses DEFAULT_SAFE_AREA (all zeros) → cover fills full scene ✓
- PageFrame also has: `isSchemaCover = isSchemaDriven && page.templateType === 'cover'`
- PageFrame: `showTopNav = !isSchemaCover && page.templateType !== 'cover' && showNavbar`
- This means cover pages DON'T show top nav ✓
- BUT: PageFrame also has `isCoverPage = page.templateType === 'cover'`
- And: `showBottomNav = showNavbar && !isCoverPage` → no bottom nav for cover ✓
- The PROBLEM: For schema-driven NON-cover pages, both navbars show AND PageFrame offsets content
- Combined with KONEKTOR 1 (double offset), this creates the layout break

**Dampak:** Kombinasi dengan KONEKTOR 1 membuat halaman non-cover punya double offset.

---

### 🟡 KONEKTOR 6: PlayOverlay Scale Uses computeSceneScale but Stage Uses calcFitZoom

**Lokasi:** PlayOverlay.tsx L206 vs Stage index.tsx L202

**Masalah:**
- PlayOverlay: `computeSceneScale(scene, viewport, 30)` → from SceneLayoutEngine
- Stage: `calcFitZoom(aW, aH, ratio.w, ratio.h)` → from canva-constants
- Two different scale calculation functions!
- `computeSceneScale` caps at 1.0 (never upscale)
- `calcFitZoom` may have different behavior
- Result: Preview scale ≠ Canvas scale

**Dampak:** Tampilan di preview mode bisa beda ukuran dengan canvas mode.

---

### 🟢 KONEKTOR 7: Export Pipeline — Schema Not Directly Used

**Lokasi:** PdfExportButton.tsx L32-53

**Masalah:**
- PDF export sends raw `pages` array + `authoring` data to server
- Server-side rendering would need to use the same SchemaScreenRenderer pipeline
- But the API route may not use scene engine at all — it may use legacy HTML rendering
- If so, export output ≠ preview/canvas output (the original "preview ≠ export" problem)

**Dampak:** Potensi inkonsistensi antara preview dan export. Perlu verifikasi API route.

---

### 🟢 KONEKTOR 8: Schema Block Editing — Nested Blocks Not Addressable

**Lokasi:** ui-slice.ts L142 (updateSchemaBlock)

**Masalah:**
- `updateSchemaBlock(blockId, updates)` does: `blocks.findIndex(b => b.id === blockId)`
- This only searches TOP-LEVEL blocks
- Ftab has nested blocks in `tabs[].content: SchemaBlock[]`
- MateriSection has nested blocks in `content: SchemaBlock[]`
- Editing a nested block via updateSchemaBlock would FAIL (blockId not found at top level)
- The InlineTextEditor in FtabRenderer delegates to SchemaBlockRenderer → which uses the same store
- BUT the block lookup is flat, so editing nested blocks won't persist

**Dampak:** Inline editing di dalam ftab tab atau materi-section mungkin tidak tersimpan.

---

## PRIORITAS PERBAIKAN

| # | Konektor | Severity | Dampak Visual | Fix Complexity |
|---|----------|----------|---------------|----------------|
| 1 | Double Offset | 🔴 Critical | Semua halaman non-cover salah | Low |
| 2 | Cover Height | 🔴 Critical | Cover terlalu ke atas | Low |
| 3 | Ftab Height | 🔴 Critical | Overlap blok materi | Medium |
| 4 | MateriSection Height | 🟡 Medium | Bisa overflow | Medium |
| 5 | Safe Area Logic | 🟡 Medium | Terkait #1 | Low (fixed by #1) |
| 6 | Scale Calculation | 🟡 Medium | Preview ≠ Canvas | Low |
| 7 | Export Pipeline | 🟢 Low | Inkonsistensi export | High |
| 8 | Nested Block Edit | 🟢 Low | Edit tidak persist | High |

## RENCANA EKSEKUSI

Fix 1 + 2 + 3 dulu (3 konektor critical), lalu verifikasi.
Fix 4 + 6 setelah verifikasi.
Fix 7 + 8 nanti (butuh architectural change lebih besar).

---

## CANVAS FIX — Auto-fit Viewport (2026-05-14)

Task ID: canvas-fix-1
Agent: Main Agent
Task: Fix canvas auto-fit to viewport — "canvas too small / fit not working"

### Root Cause Found

**Stage container in CanvaBuilder was NOT a flex container**

```
❌ Before:
<div className="flex-1 min-w-0 relative overflow-hidden ...">
  <Stage />  ← Stage root div has flex-1 but parent is NOT flex → flex-1 has no effect
</div>

✅ After:
<div className="flex flex-col flex-1 min-w-0 relative overflow-hidden ...">
  <Stage />  ← Now flex-1 works, Stage fills the available space
</div>
```

Without the fix:
- `canvasAreaRef.clientHeight` returned content height (720px from stageWrapRef)
- NOT the available viewport height (e.g., 500px)
- `calcFitZoom()` used wrong dimensions → computed incorrect zoom → canvas didn't fit

### Changes Made

1. **CanvaBuilder.tsx** — Added `flex flex-col` to stage container div
   - Now Stage's `flex-1` works correctly
   - `canvasAreaRef.clientWidth/Height` returns correct available space

2. **Stage index.tsx** — Fixed scroll wheel zoom closure bug
   - Changed from closure-based `panX`/`panY`/`fitZoom` to refs (`panXRef`, `panYRef`, `fitZoomRef`)
   - Handler no longer re-registers on every pan change (was causing overhead)
   - Prevents stale state in wheel handler

3. **Stage index.tsx** — Added ResizeObserver retry mechanism
   - If `clientWidth/Height` is 0 (component not yet laid out), retries after 100ms
   - Handles race condition where flex layout hasn't settled on initial mount

4. **Stage index.tsx** — Added `w-full` to canvas area div
   - Belt-and-suspenders approach to ensure the canvas area fills its container

5. **ui-slice.ts** — `setRatio()` now also resets zoom to `ZOOM_FIT`
   - When user changes canvas ratio, zoom auto-resets to fit
   - Previously, changing ratio could leave stale zoom level

### Build Status
- TypeScript: ✅ No errors
- Next.js build: ✅ Compiled successfully

---

## CANVAS FIX 2 — Flex Chain Broken at `<main>` (2026-05-14)

Task ID: canvas-fix-2
Agent: Main Agent
Task: Fix flex chain broken at `<main>` — the ROOT CAUSE of canvas not fitting viewport

### Root Cause Found

**`<main>` in AuthoringTool.tsx has `flex-1` but is NOT a flex container**

```
BROKEN FLEX CHAIN:
✅ <div h-screen w-screen flex>                    ← HEIGHT ORIGIN (100vh)
  └─ ✅ <div flex-1 flex-col min-h-0>              ← flex item + flex container
       └─ 🔴 <main flex-1 overflow-hidden>         ← flex item, BUKAN flex container!
            │                                         display: block (default)
            │                                         missing min-h-0
            └─ ⚠️ <div h-full w-full flex flex-col> ← pakai h-full (fragile!)
                 └─ ✅ <div flex flex-1 min-h-0>    ← OK from here down
                      └─ ✅ canvasAreaRef            ← flex-1 but chain broken above

FIXED FLEX CHAIN:
✅ <div h-screen w-screen flex>                    ← HEIGHT ORIGIN (100vh)
  └─ ✅ <div flex-1 flex-col min-h-0>              ← flex item + flex container
       └─ ✅ <main flex-1 flex flex-col min-h-0>   ← NOW: flex item + flex container
            └─ ✅ <div flex-1 w-full flex flex-col> ← NOW: flex-1 (not h-full)
                 └─ ✅ <div flex flex-1 min-h-0>    ← OK
                      └─ ✅ canvasAreaRef            ← flex-1 works end-to-end!
```

### Why This Broke calcFitZoom()

1. `<main>` is `display: block` (default) → its child can't use `flex-1`
2. CanvaBuilder root uses `h-full` (height: 100%) → depends on parent definite height
3. Without `min-h-0`, `<main>` can't shrink below content size (720px)
4. `canvasAreaRef.clientHeight` returns CONTENT height (720px) NOT available viewport height (~500-600px)
5. `calcFitZoom(960, 720, 1280, 720)` computes wrong zoom → canvas doesn't fit

### Changes Made

1. **AuthoringTool.tsx L440-445** — Added `flex flex-col min-h-0` to `<main>`
   - Before: `className="flex-1 ${overflowClass}"`
   - After: `className="flex-1 flex flex-col min-h-0 ${overflowClass}"`
   - Effect: `<main>` is now a flex container → children can use `flex-1`

2. **CanvaBuilder.tsx L370** — Changed root div from `h-full` to `flex-1`
   - Before: `className="h-full w-full min-w-0 flex flex-col overflow-hidden ..."`
   - After: `className="flex-1 w-full min-w-0 flex flex-col overflow-hidden ..."`
   - Effect: CanvaBuilder fills space via flex (robust) instead of percentage (fragile)

### Why `min-h-0` is Critical

CSS flex items have `min-height: auto` by default, which means they can't shrink
below their content size. Adding `min-h-0` overrides this, allowing the flex item
to shrink to 0 if needed, which is essential for overflow-hidden to work correctly.
Without it, `<main>` would always be at least 720px tall (content height) even if
the available viewport space is less.

### Build Status
- TypeScript: ✅ No errors
- Next.js build: ✅ Compiled successfully

---

## KONEKTOR 1-4 + 7-8 FIXES — Pipeline Connectors Repaired (2026-05-14)

Task ID: connector-fix-batch
Agent: Main Agent
Task: Fix all critical connector chain breaks in the pipeline

### Fixes Applied

#### KONEKTOR 1: Double Offset (PageFrame + SchemaScreenRenderer)
- **File:** PageFrame.tsx L495-508
- **Problem:** PageFrame offsets content by topNavH (44px), SchemaScreenRenderer also starts at safeArea.top (44px) → 88px total
- **Fix:** Schema-driven pages use inset-0 (no CSS offset). Scene engine handles safe area. Navbar = z-50 overlay.

#### KONEKTOR 2: Cover Height (600px vs 720px)
- **File:** SceneLayoutEngine.ts L350-358
- **Problem:** estimateBlockHeight(cover) returned baseHeight=600px, leaving 120px gap at bottom
- **Fix:** Cover/hero now uses options.sceneH ?? 720 — always fills entire scene height

#### KONEKTOR 3: Ftab Height (400px vs ~800px actual)
- **File:** SceneLayoutEngine.ts L352-370
- **Problem:** No case 'ftab' in estimateBlockHeight → fell to default (400px) → overlap
- **Fix:** Added ftab case with recursive child estimation (tab header + progress + tallest tab content)

#### KONEKTOR 4: MateriSection nested content underestimated
- **File:** SceneLayoutEngine.ts L309-321
- **Fix:** Recursive estimation of child blocks + takeaway + selfCheck heights

#### KONEKTOR 7: SchemaEngine drops sceneResolution/safeArea/navConfig
- **File:** SchemaEngine.tsx + SchemaPlayer.tsx
- **Fix:** SchemaEngine now computes and passes sceneResolution, safeArea, ratioId, showTopNav, showBottomNav

#### KONEKTOR 8: updateSchemaBlock can't find nested blocks
- **File:** ui-slice.ts L182-265
- **Fix:** Added findBlockOwner() that searches top-level + ftab.tabs[].content[] + materi-section.content[]

### Files Changed (5 files)
1. PageFrame.tsx — schema-driven content area = inset-0
2. SceneLayoutEngine.ts — cover=sceneH, ftab recursive, materi-section recursive
3. SchemaEngine.tsx — passes scene layout props to SchemaScreenRenderer
4. SchemaPlayer.tsx — passes ratioId + nav flags
5. ui-slice.ts — findBlockOwner + nested block update support

### Build Status
- TypeScript: No errors
- Next.js build: Compiled successfully

---

## DEEP ANALYSIS FINDINGS — Pipeline Fixes from Audit Document (2026-05-14)

Task ID: deep-analysis-fixes
Agent: Main Agent
Task: Fix findings from deep-analysis-pipeline.md audit document

### Findings Status

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| P0-1 | Export ≠ Canvas (re-derive from authoring) | P0 | ✅ VERIFIED SAFE — ExportApp uses PageRenderer which reads page.schema |
| P0-2 | Schema tidak sync otomatis | P0 | ✅ DESIGN DECISION — Opt-in sync protects manual canvas edits |
| P0-3 | Variant A/B/C tidak berfungsi | P0 | ⏳ Pending — needs density system architecture |
| P1-6 | closePlay() tidak reset interactivePageIdx | P1 | ✅ FIXED |
| P1-7 | goPage() dipanggil ganda | P1 | ✅ FIXED — cleaner math-based index |
| P2-8 | ensurePageSchema() mutasi in-place | P2 | ✅ FIXED — immutable, caller sets via Zustand |

### Changes Made

1. **interactive-store.ts** — `closePlay()` now resets `interactivePageIdx: 0`
2. **PlayOverlay.tsx** — `handleNext/handlePrev` use math instead of getState() re-read
3. **ensure-schema.ts** — `ensurePageSchema()` no longer mutates `page.schema` in-place
   - Added `ensurePageSchemaWithMigration()` helper for cases that need to know if migration happened
   - `migrateAllPages()` now does immutable update: `{ ...page, schema }`
4. **ui-slice.ts** — `updateSchemaBlock` handles migrated schema immutably

### Build Status
- TypeScript: No errors
- Next.js build: Compiled successfully
---
Task ID: chain-break-audit-fix-round2
Agent: main
Task: Full pipeline audit and chain break fix — round 2

Work Log:
- Conducted comprehensive audit across 3 pipeline areas via parallel subagents
- SchemaEngine pipeline: 9 breaks found, 5 HIGH
- Canvas/Stage pipeline: 9 breaks found, 1 HIGH (duplicate keyboard shortcuts)
- Preview/Export pipeline: 21 breaks found, 3 HIGH
- Fixed H1: Duplicate keyboard shortcuts (undo/redo/escape double-firing)
- Fixed H2: pagePadding:0 vs 16 inconsistency in SchemaEngine
- Fixed H3: findBlockOwner now searches BaseBlock.children
- Fixed H4: deleteBlock/moveBlockUp/moveBlockDown/duplicateBlock/copySchemaBlock now use findBlockOwner for nested block CRUD
- Fixed H5: estimateBlockHeight now handles generic children field
- Fixed H6: suara added to dataHash for preview rebuild
- Fixed M1: Removed unused storeFitZoom subscription from Stage
- Fixed M2: Removed dead onMouseMove chain (CanvaBuilder → Stage → useStageDrag)
- Fixed M3: Removed effectiveZoom from useStageDrag dependency array
- Fixed M4: Removed dead onEditField prop from PageRenderer and Stage
- TypeScript compilation passes (tsc --noEmit clean)

Stage Summary:
- 6 HIGH priority chain breaks fixed
- 4 MEDIUM priority cleanup fixes applied
- All CRUD operations now work for nested blocks (ftab, materi-section, children)
- No more double-firing undo/redo/escape
- SchemaEngine safeArea now matches PageRenderer (pagePadding: 16 for non-cover)
- Preview rebuilds correctly when suara (sound) config changes
