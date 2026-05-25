# SYSTEM_MAP — SILSE Authoring Tool v4

> Dibuat: 2026-05-25 | Metode: trace-by-function dari entrypoint

---

# Project Summary

**Tujuan Aplikasi**
Aplikasi authoring tool untuk membuat Media Pembelajaran Interaktif (MPI) bagi guru SMP Indonesia. Mengikuti standar BSNP dan Kurikulum Merdeka. Guru dapat membuat konten (materi, kuis, game edukasi, skenario) melalui editor visual berbasis schema-driven rendering, lalu mengekspor ke HTML standalone atau SCORM 1.2 untuk Moodle.

**Tech Stack Utama**
- Runtime: Node.js (Next.js 16, React 19)
- Bahasa: TypeScript
- DB: SQLite via Prisma ORM
- State: Zustand (canva-store 16 slice, authoring-store/editor-projection-store)
- Styling: Tailwind CSS 4, shadcn/ui
- AI: z-ai-web-dev-sdk (LLM content generation)
- Export: Vite (single-file HTML), archiver (SCORM ZIP)
- Testing: Vitest (unit), Playwright (e2e)
- PWA: @ducanh2912/next-pwa

**Pola Arsitektur**
- **Schema-driven rendering**: JSON Schema (LessonSchema → ScreenSchema → SchemaBlock) adalah single source of truth. Browser hanya menggambar, engine mengontrol layout.
- **Scene Layout Engine**: Seluruh posisi blok dihitung di JS (resolveSceneLayout), BUKAN browser CSS. Absolute positioning untuk semua blok, scale transform untuk viewport adaptation.
- **Plugin Registry**: Block type → renderer mapping via SceneRegistry. Tidak ada switch/case.
- **Dual Store**: CanvaStore (visual/canvas state) + EditorProjectionStore (derived editor state dari schema tree). Alur satu arah: SchemaBlock → ProjectionStore.
- **Offline-first**: localStorage persistence + sync queue untuk DB saves saat offline, auto-flush saat online.

---

# Core Logic Flow (Function-Level Flowchart)

## Flow 1: Render Canvas (Read Path)
```
User membuka app
  → page.tsx → <AuthoringTool> (dynamic import, ssr:false)
    → <AuthoringToolInner> (lazy panels)
      → activePanel === 'canva'
        → <CanvaBuilder> (dynamic import, ssr:false)
          → <PageRenderer>
            → useCanvaStore → pages[currentPageIndex].schema
            → <SchemaScreenRenderer> (React.memo)
              → resolveSceneLayout(blocks, sceneRes, safeArea) → ResolvedBlockPosition[]
              → computeScenePlan → ScenePlan (auto-pagination)
              → Tab filtering → tabFilteredSchema
              → Per-block: <MeasuredBlock> → <SchemaBlockRenderer>
                → SCENE_REGISTRY[block.type].renderer → <BlockComponent>
                  (misal: TujuanDisplayRenderer, KuisRenderer, CoverRenderer, dll.)
                → <BlockSelectionOverlay> (canvas mode editing)
                → <CompressionBoundary> (overflow handling)
```

## Flow 2: Edit Konten (Write Path)
```
User klik/edit blok di canvas
  → BlockSelectionOverlay.onSelect/onEdit
    → useCanvaStore.setSelectedBlock / setEditingBlock
      → RightPanel → BlockPropertiesPanel → SchemaDrivenEditor
        → Field changes → useCanvaStore.updateBlockContent (schema-crud-slice)
          → produceWithPatches (Immer) → patches → history-slice
            → Re-render → SchemaScreenRenderer (reactive via Zustand selector)
```

## Flow 3: Auto-Generate AI
```
User pilih topik + mapel + kelas
  → AutoGenerate component → use-auto-generate hook
    → POST /api/ai/lesson → ZAI.chat.completions.create → lesson structure JSON
      → generators.ts → buildSchemaFromLesson() → LessonSchema
        → useCanvaStore.loadSchemaPreset → populate pages/blocks
    → POST /api/ai (per-block) → ZAI.chat.completions.create → konten blok JSON
      → Store update per block → re-render
```

## Flow 4: Save ke DB
```
User klik "Simpan" / auto-save trigger
  → useProjectManager.saveProject()
    → Jika offline → offline-sync.enqueueSave() → localStorage queue
    → Jika online → PUT /api/projects/[id]/save
      → Zod validation → prisma.$transaction
        → Delete all existing pages (cascade blocks)
        → Update project metadata
        → Re-create pages + blocks dari canva state
      → Return saved project
  → Auto-flush: window 'online' event → flushQueue() → replay all pending saves
```

## Flow 5: Export HTML
```
User klik Export
  → use-export-actions → POST /api/export
    → Zod validation → getTemplateBuffer() (Vite-built export-output/index.html)
      → Inject window.__EXPORT_DATA__ = JSON(canva state)
      → XSS-safe encoding (< > /)
      → Return HTML file (Content-Disposition: attachment)
  → Client: export/entry-client.tsx reads window.__EXPORT_DATA__
    → Pre-populate Zustand stores → React renders same components
```

## Flow 6: Export SCORM
```
User klik Export SCORM
  → POST /api/export/scorm
    → Same data as HTML export
    → Generate imsmanifest.xml (SCORM 1.2)
    → Inject SCORM API wrapper script (LMSInitialize, LMSSetValue, LMSFinish)
    → archiver('zip') → {imsmanifest.xml, index.html}
    → Return ZIP file
```

---

# Clean Tree

```
src/
├── app/
│   ├── layout.tsx              # Root layout, providers, fonts
│   ├── page.tsx                # Entry → <AuthoringTool>
│   ├── globals.css
│   ├── error.tsx / not-found.tsx / global-error.tsx
│   ├── print.css
│   └── api/
│       ├── route.ts            # Health check
│       ├── ai/
│       │   ├── route.ts        # AI content generation (kuis, matching, dll.)
│       │   ├── lesson/route.ts # AI lesson structure generation
│       │   └── refine/route.ts # AI content refinement
│       ├── export/
│       │   ├── route.ts        # HTML export (Vite template injection)
│       │   └── scorm/route.ts  # SCORM 1.2 ZIP export
│       └── projects/
│           ├── route.ts        # List & Create projects
│           └── [id]/
│               ├── route.ts    # Get, Update, Delete project
│               ├── save/route.ts # Full-state save (PUT)
│               └── export/route.ts # Project-specific export
├── middleware.ts               # Rate limiting (AI 10/min, export 10/min, save 20/min, general 120/min)
├── components/
│   ├── authoring/              # Panel editor utama
│   │   ├── AuthoringTool.tsx   # Main shell (sidebar + panel switcher)
│   │   ├── Dashboard.tsx       # Beranda + kelengkapan
│   │   ├── Dokumen.tsx         # RPP & dokumen BSNP
│   │   ├── Konten.tsx          # Tab editor (Materi, Kuis, Diskusi, dll.)
│   │   ├── auto-generate/      # AI auto-generate panel
│   │   ├── live-preview/       # Live preview player
│   │   ├── import-export/      # Excel import + export actions
│   │   ├── module-editors/     # Per-block content editors
│   │   └── konten/             # Tab-specific editors (MateriTab, KuisTab, dll.)
│   ├── canva/                  # Canvas editor
│   │   ├── CanvaBuilder.tsx    # Canvas shell (left-panel + stage + right-panel)
│   │   ├── LeftPanel.tsx       # Icon rail + panels
│   │   ├── Toolbar.tsx         # Top toolbar
│   │   ├── StatusBar.tsx       # Bottom status bar
│   │   ├── PreviewMode.tsx     # Preview mode wrapper
│   │   ├── PresentMode.tsx     # Full-screen presentation
│   │   ├── games/              # 10 interactive game widgets
│   │   ├── left-panel/         # Scene list, add block, template gallery, dll.
│   │   ├── right-panel/        # Properties panel, navigation, AI assistant
│   │   ├── page-renderer/      # PageRenderer, PageFrame, BlockRenderer
│   │   ├── stage/              # Canvas stage (drag, keyboard, batch ops)
│   │   └── ai-assistant/       # AI panels (generate, refine, lesson)
│   ├── shared/                 # Shared UI components
│   ├── providers/              # ThemeProvider, A11yProvider, StoreInit
│   └── ui/                     # shadcn/ui primitives (button, dialog, dll.)
├── core/
│   ├── ENGINE_PRINCIPLES.ts    # Engine design principles
│   ├── edu/                    # Educational Design System (new layer)
│   │   ├── education-colors.ts     # Semantic colors: tujuan, materi, contoh, dll.
│   │   ├── education-typography.ts # Min 18px body, 40px heading, 4 display modes
│   │   ├── education-spacing.ts    # Educational rhythm tokens
│   │   ├── education-layout-rules.ts # Density budgets, component grammar, print-safe
│   │   ├── education-components.ts # 8 component identity definitions
│   │   ├── education-motion.ts     # Educational motion rules (no bounce/elastic)
│   │   ├── EduRenderingContext.ts  # Context bridging edu tokens → renderers
│   │   └── index.ts                # Public API
│   ├── editor/                 # Editor infrastructure
│   │   ├── overlay/            # BlockSelectionOverlay, BlockContextMenu
│   │   ├── inline-editor/      # InlineTextEditor
│   │   ├── property-schemas/   # Per-block property schemas (content, layout, interactive, games, bsnp)
│   │   ├── transform-controls/ # TransformHandles
│   │   ├── edit-bus.ts         # Edit event bus
│   │   ├── deep-merge.ts       # Deep merge utility
│   │   └── patch-history.ts    # Patch history manager
│   ├── engine/                 # Schema engine
│   │   ├── SchemaEngine.tsx    # Orchestrator: LessonSchema → screen rendering
│   │   ├── SchemaEngine.utils.ts # loadPreset, schemaToCanvaPages (renderer-free)
│   │   └── TemplateAdapter.ts  # Template → schema adapter
│   ├── layout/                 # Layout engine
│   │   ├── SceneOverflowEngine.ts  # computeScenePlan, createDerivedSchema
│   │   ├── CompressionEngine.ts    # Compression decisions (accordion, reveal, dll.)
│   │   ├── BlockMeasurer.tsx       # DOM height measurement + MeasuredBlock wrapper
│   │   ├── MeasurementCommitQueue.ts # Batched measurement commits
│   │   ├── CompressedBlockWrapper.tsx # Compression UI wrapper
│   │   ├── CompressionBoundary.tsx  # Compression boundary component
│   │   ├── ShowMoreButton.tsx       # "Tampilkan lagi" button
│   │   ├── SchemaTraversal.ts       # Schema tree traversal utilities
│   │   ├── SceneNavigator.tsx       # Multi-scene navigation (prev/next/dots)
│   │   └── useBlockCompression.ts   # Hook for compression state
│   ├── preset/                 # Page preset registry
│   │   └── PagePresetRegistry.ts
│   ├── recovery/               # Crash recovery
│   │   ├── periodic-check.ts   # Periodic integrity check
│   │   └── index.ts
│   ├── registry/               # Block type registry
│   │   ├── SceneRegistry.tsx   # Block type → renderer mapping (ALL lazy)
│   │   └── BlockDefinitionRegistry/ # Renderer-free metadata (types, capabilities, schemas)
│   ├── renderer/               # Schema → React rendering
│   │   ├── SchemaRenderer.tsx  # Core: SchemaScreenRenderer + SchemaBlockRenderer
│   │   ├── BlockErrorBoundary.tsx # Per-block crash isolation
│   │   ├── types.ts            # TokenResolver, SchemaRenderMode
│   │   └── blocks/             # 40+ per-block renderers (CoverRenderer, KuisRenderer, dll.)
│   ├── scene/                  # Scene layout engine
│   │   ├── SceneLayoutEngine.ts # resolveSceneLayout — SINGLE LAYOUT AUTHORITY
│   │   └── index.ts
│   ├── schema/                 # Schema type system & operations
│   │   ├── types/              # SchemaBlock, ScreenSchema, LessonSchema
│   │   ├── schema-apply/       # Immutable schema write ops (transaction, nested-ops, scene-bridge)
│   │   ├── immutable/          # Core immutable ops (scene-ops, block-ops, container-helpers)
│   │   ├── generators/         # Schema generators (pendahuluan, inti, penutup, full-lesson)
│   │   ├── capability-registry.ts # Block capabilities (measurable, interactive, full-page, dll.)
│   │   ├── schema-gc.ts        # Schema garbage collection
│   │   ├── schema-projection.ts # Schema projection utilities
│   │   ├── schema-migration.ts  # Schema version migration
│   │   ├── ensure-schema.ts     # Schema validation + defaults
│   │   ├── validation.ts        # Schema validation rules
│   │   ├── history.ts           # Schema undo/redo history
│   │   ├── sync-projection.ts   # Schema → canva store sync
│   │   ├── session-state.ts     # Session state management
│   │   ├── scene-transaction.ts # Scene transaction system
│   │   ├── transaction.ts       # Generic transaction
│   │   ├── schema-recovery.ts   # Schema recovery utilities
│   │   ├── derive-schema.ts     # Schema derivation
│   │   └── DevPurityGuard.tsx   # Dev purity guard
│   ├── shortcuts/              # Keyboard shortcuts
│   │   ├── ShortcutRegistry.ts  # Shortcut registration
│   │   ├── keyboard-manager.ts  # Keyboard event manager
│   │   └── canvas-shortcuts/    # Canvas-specific shortcuts
│   ├── themes/                 # Design token system
│   │   ├── ios-visual-contract.ts # iOS-style visual contract (app chrome)
│   │   ├── tokens.ts            # Token resolver
│   │   ├── semantic-tokens.ts   # Semantic color tokens
│   │   └── primitive-tokens.ts  # Primitive design tokens
│   ├── vcs/                    # Visual Composition Standard
│   │   ├── CompositionAnalyzer.ts # Visual composition analysis
│   │   ├── BlockStyleContract.ts  # Block style contracts
│   │   ├── resolver.ts           # VCS resolver
│   │   ├── VisualLinter.ts       # Visual linting
│   │   ├── token-compliance.ts   # Token compliance checking
│   │   ├── LayoutGrammar.ts      # Layout grammar rules
│   │   ├── SectionPreset.ts      # Section presets
│   │   └── TransitionRhythmEngine.ts # Per-block gap rhythm engine
│   ├── i18n/
│   │   └── teacher-terminology.ts # Teacher-friendly terminology mapping
│   ├── utils/
│   │   └── logger.ts            # Structured logger
│   └── index.ts
├── store/
│   ├── canva-store.ts          # Re-export of useCanvaStore
│   ├── canva/
│   │   ├── store.ts            # Main store: 16 composed slices + devtools
│   │   ├── types.ts            # CanvaState, Snapshot, DB types
│   │   ├── constants.ts        # createPage, MAX_HISTORY, CANVA_STORAGE_KEY
│   │   ├── init.ts             # Store initialization + edit-bus connection
│   │   ├── schema-crud-slice.ts # Block CRUD: add, delete, duplicate, update
│   │   ├── schema-ops-slice.ts # Schema operations: reorder, move, split
│   │   ├── page-slice.ts       # Page management
│   │   ├── page-ops-slice.ts   # Page operations: add, delete, reorder
│   │   ├── element-slice.ts    # Element management (legacy)
│   │   ├── viewport-slice.ts   # Viewport zoom/pan
│   │   ├── session-slice.ts    # Session state (selection, scenes, mode)
│   │   ├── history-slice.ts    # Undo/redo with Immer patches
│   │   ├── background-slice.ts # Page background management
│   │   ├── ui-slice.ts         # UI state (panels, tabs)
│   │   ├── tab-slice.ts        # Tab filtering
│   │   ├── sync-slice.ts       # Online/offline sync
│   │   ├── persistence-slice.ts # localStorage persistence
│   │   ├── schema-preset-slice.ts # Schema preset loading
│   │   ├── teacher-mode-slice.ts # Sederhana/Lengkap mode
│   │   ├── recovery-slice.ts    # Crash recovery state
│   │   ├── auto-generate.ts     # AI auto-generate state
│   │   ├── subscription-manager.ts # Store subscription manager
│   │   ├── performance-middleware.ts # Dev performance tracking
│   │   ├── reset-canvas.ts      # Canvas reset
│   │   ├── schema-helpers.ts    # Schema utility functions
│   │   └── template-data.ts     # Template data
│   ├── authoring-store.ts      # Re-export (DEPRECATED, use editor-projection-store)
│   ├── editor-projection-store.ts # Same store, renamed for clarity
│   ├── authoring/              # Authoring/editor projection store
│   │   ├── index.ts            # Main store composition
│   │   ├── types.ts            # All type definitions
│   │   ├── initial-state.ts    # Default state
│   │   ├── meta-slice.ts       # Project metadata
│   │   ├── cp-slice.ts         # Capaian Pembelajaran
│   │   ├── tp-slice.ts         # Tujuan Pembelajaran
│   │   ├── atp-slice.ts        # Alur Tujuan Pembelajaran
│   │   ├── alur-slice.ts       # Alur Pembelajaran
│   │   ├── materi-slice.ts     # Materi
│   │   ├── kuis-slice.ts       # Kuis
│   │   ├── skenario-slice.ts   # Skenario
│   │   ├── diskusi-refleksi-slice.ts # Diskusi & Refleksi
│   │   ├── motivasi-rangkuman-slice.ts # Motivasi & Rangkuman
│   │   ├── module-slice.ts     # Module management
│   │   ├── navigation-slice.ts # Navigation state
│   │   ├── system-slice.ts     # System state
│   │   ├── preset-slice.ts     # Preset management
│   │   └── presets/            # Default presets (cp, tp, atp, alur, kuis, materi, dll.)
│   ├── interactive-store.ts    # Interactive game state
│   └── page-types.ts           # Page type definitions
├── hooks/                      # React hooks
│   ├── use-canvas-block-drag.ts # Block drag-reorder
│   ├── use-auto-save.ts        # Auto-save (2s debounce)
│   ├── use-undo-redo.ts        # Undo/redo keyboard shortcuts
│   ├── use-project-manager.tsx  # Project CRUD + save/load
│   ├── use-teacher-mode.ts     # Sederhana/Lengkap toggle
│   ├── use-keyboard-shortcuts.ts # Global keyboard shortcuts
│   ├── use-drag-sort.ts        # Drag sort utility
│   ├── use-mobile.ts           # Mobile detection
│   ├── use-app-theme.ts        # Theme management
│   ├── use-nav-sync.ts         # Navigation sync
│   ├── use-service-worker.ts   # Service worker registration
│   ├── use-score-animation.ts  # Score animation
│   ├── use-health-monitor.ts   # Health monitoring
│   ├── use-cleanup.ts          # Cleanup utilities
│   ├── use-safe-mode.ts        # Safe mode toggle
│   ├── use-unsaved-guard.ts    # Unsaved changes guard
│   ├── use-vite-export.ts      # Vite export hook
│   └── use-periodic-integrity-check.ts # Periodic integrity check
├── lib/                        # Utility libraries
│   ├── db.ts                   # Prisma singleton
│   ├── offline-sync.ts         # Offline sync queue (localStorage → DB)
│   ├── save-utils.ts           # Save utility functions
│   ├── rate-limit.ts           # Rate limiting (in-memory, per IP)
│   ├── api-validation.ts       # Zod schemas for API validation
│   ├── utils.ts                # cn() utility
│   ├── a11y.ts                 # Accessibility utilities
│   ├── sounds.ts               # Sound effect management
│   ├── confetti.ts             # Confetti animations
│   ├── canva-constants.ts      # Canvas constants
│   ├── canva-icon-maps.ts      # Icon mapping
│   ├── color-palette.ts        # Color palette utilities
│   ├── virtual-canvas.ts       # Virtual canvas system
│   ├── apply-theme-preset.ts   # Theme preset application
│   ├── module-resolver.ts      # Module resolution
│   ├── memory-leak-detector.ts # Memory leak detection
│   ├── performance.ts          # Performance utilities
│   ├── use-game-a11y.ts        # Game accessibility
│   └── export/                 # Export pipeline (HTML, SCORM, scripts, styles)
│       ├── index.ts            # Export entry
│       ├── html-templates.ts   # HTML template builders
│       ├── styles.ts           # Export CSS
│       ├── scripts.ts          # Export JS
│       ├── block-renderers.ts  # Export block renderers
│       ├── quiz-renderers.ts   # Export quiz renderers
│       ├── game-renderers.ts   # Export game renderers
│       ├── navigation-renderers.ts # Export nav renderers
│       └── utils.ts            # Export utilities
├── presets/                    # Content presets per mapel
│   ├── ipa/                    # IPA (Sistem Pernapasan)
│   ├── ppkn/                   # PPKn (10 topik)
│   ├── mtk/                    # Matematika (Persamaan Linear)
│   └── pjok/                   # PJOK (3 topik)
├── config/
│   └── feature-flags.ts        # Feature flags
├── export/                     # Standalone export app
│   ├── index.html              # Vite entry HTML
│   ├── entry-client.tsx        # Export client entry
│   ├── ExportApp.tsx           # Export React app
│   └── export.css              # Export-specific CSS
└── __tests__/                  # Unit tests (17 test files)
prisma/
├── schema.prisma               # DB schema (Project → Page → Block, Template)
├── seed.ts                     # DB seeder
└── migrations/
e2e/                            # E2E tests (9 spec files)
scripts/                        # DevOps scripts
```

---

# Module Map (The Chapters)

## Entrypoint & Layout
| File | Fungsi/Class Utama | Peran |
|------|-------------------|-------|
| `src/app/page.tsx` | `Home()` | Entry point — dynamic import AuthoringTool |
| `src/app/layout.tsx` | `RootLayout()` | Root layout — providers, fonts (Fredoka, Nunito), error boundary |
| `src/middleware.ts` | `middleware()` | Rate limiting untuk semua API routes |

## Shell & Navigation
| File | Fungsi/Class Utama | Peran |
|------|-------------------|-------|
| `src/components/authoring/AuthoringTool.tsx` | `AuthoringTool`, `AuthoringToolInner` | Shell utama — sidebar + panel switcher + save + keyboard shortcuts |
| `src/components/canva/CanvaBuilder.tsx` | `CanvaBuilder` | Canvas shell — left-panel + stage + right-panel |

## Schema Engine (Core)
| File | Fungsi/Class Utama | Peran |
|------|-------------------|-------|
| `src/core/engine/SchemaEngine.tsx` | `SchemaEngine()` | Orkestrator: LessonSchema → TokenResolver → SchemaScreenRenderer |
| `src/core/engine/SchemaEngine.utils.ts` | `loadPreset()`, `schemaToCanvaPages()` | Fungsi utilitas renderer-free (aman dari circular deps) |
| `src/core/engine/TemplateAdapter.ts` | `TemplateAdapter` | Template → schema adapter |

## Schema Type System
| File | Fungsi/Class Utama | Peran |
|------|-------------------|-------|
| `src/core/schema/types/base.ts` | `SchemaBlock`, `BlockLayout` | Tipe dasar schema block |
| `src/core/schema/types/schema.ts` | `LessonSchema`, `ScreenSchema` | Tipe lesson & screen schema |
| `src/core/schema/types/blocks.ts` | Block-specific types | Tipe per-block (KuisBlock, DiskusiBlock, dll.) |
| `src/core/schema/capability-registry.ts` | `isFullPageBlockType()`, `isBlockInteractive()`, `deriveOverflowRule()` | Kapabilitas per-block type (measurable, interactive, overflow) |

## Scene Layout Engine (Single Layout Authority)
| File | Fungsi/Class Utama | Peran |
|------|-------------------|-------|
| `src/core/scene/SceneLayoutEngine.ts` | `resolveSceneLayout()`, `estimateBlockHeight()`, `computeSafeArea()`, `computeSceneScale()` | **OTORITAS LAYOUT TUNGGAL** — semua posisi blok dihitung di JS |
| `src/core/layout/SceneOverflowEngine.ts` | `computeScenePlan()`, `createDerivedSchema()` | Auto-pagination — distribusi blok ke scenes saat overflow |
| `src/core/layout/CompressionEngine.ts` | `computeCompressionDecision()` | Kompresi blok (accordion, reveal, collapsible, step-reveal) |
| `src/core/layout/BlockMeasurer.tsx` | `MeasuredBlock`, `getMeasuredHeight()` | DOM height measurement + measurement cache |
| `src/core/layout/MeasurementCommitQueue.ts` | `createMeasurementQueue()` | Batched measurement commits (N measurements → 1 re-render) |
| `src/core/layout/SceneNavigator.tsx` | `SceneNavigator` | Multi-scene navigation UI (prev/next/dots) |

## Renderer
| File | Fungsi/Class Utama | Peran |
|------|-------------------|-------|
| `src/core/renderer/SchemaRenderer.tsx` | `SchemaScreenRenderer`, `SchemaBlockRenderer` | Core renderer — scene layout → block dispatch via registry |
| `src/core/renderer/types.ts` | `TokenResolver`, `SchemaRenderMode` | Token resolver + render mode type |
| `src/core/renderer/BlockErrorBoundary.tsx` | `BlockErrorBoundary`, `SafeModeBlockGate` | Per-block crash isolation + safe mode gate |
| `src/core/renderer/blocks/` | 40+ renderers | Per-block renderer (Cover, Kuis, Materi, Diskusi, 10 games, dll.) |

## Block Registry
| File | Fungsi/Class Utama | Peran |
|------|-------------------|-------|
| `src/core/registry/SceneRegistry.tsx` | `SCENE_REGISTRY`, `getBlockDefinition()` | Block type → renderer mapping (semua lazy-loaded) |
| `src/core/registry/BlockDefinitionRegistry/` | `BLOCK_DEFINITIONS`, `getBlockMeta()`, `getBlockCapabilitiesMeta()` | Metadata per-block (renderer-free, aman dari store) |

## Store (State Management)
| File | Fungsi/Class Utama | Peran |
|------|-------------------|-------|
| `src/store/canva/store.ts` | `useCanvaStore` | Store utama — 16 composed slices + devtools + performance tracking |
| `src/store/canva/schema-crud-slice.ts` | `createSchemaCRDSlice()` | Block CRUD: add, delete, duplicate, updateContent |
| `src/store/canva/schema-ops-slice.ts` | `createSchemaOpsSlice()` | Schema operations: reorder, move, split page |
| `src/store/canva/history-slice.ts` | `createHistorySlice()` | Undo/redo dengan Immer patches |
| `src/store/canva/persistence-slice.ts` | `createPersistenceSlice()` | localStorage persistence |
| `src/store/canva/sync-slice.ts` | `createSyncSlice()` | Online/offline sync state |
| `src/store/canva/session-slice.ts` | `createSessionSlice()` | Session state (selection, scenes, mode) |
| `src/store/authoring/index.ts` | `useAuthoringStore()` | Editor projection store (derived dari schema tree) |

## Educational Design System (New Layer)
| File | Fungsi/Class Utama | Peran |
|------|-------------------|-------|
| `src/core/edu/education-typography.ts` | `resolveEduTypography()`, `EDU_TYPOGRAPHY` | Min 18px body, 40px heading, 4 display modes |
| `src/core/edu/education-colors.ts` | `EDU_COLOR_IDENTITY`, `blockTypeToSemanticColor()` | Semantic colors per pedagogical role |
| `src/core/edu/education-spacing.ts` | `EDU_SPACING`, `eduComponentPadding()` | Educational rhythm tokens |
| `src/core/edu/education-layout-rules.ts` | `EDU_DENSITY`, `EDU_GRAMMAR`, `EDU_PRINT_SAFE` | Density budgets + component grammar |
| `src/core/edu/education-components.ts` | `EDU_COMPONENTS`, `getEduComponentForBlock()` | 8 component identity definitions |
| `src/core/edu/education-motion.ts` | `EDU_MOTION`, `eduTransitionStyle()` | Motion rules (no bounce/elastic) |
| `src/core/edu/EduRenderingContext.ts` | `EduRenderingContext`, `createEduContext()` | Context bridging edu tokens → block renderers |

## VCS (Visual Composition Standard)
| File | Fungsi/Class Utama | Peran |
|------|-------------------|-------|
| `src/core/vcs/TransitionRhythmEngine.ts` | `computePerBlockGaps()` | Per-block gap rhythm (section-open → big, repetition → small) |
| `src/core/vcs/CompositionAnalyzer.ts` | `CompositionAnalyzer` | Analisis komposisi visual |
| `src/core/vcs/VisualLinter.ts` | `VisualLinter` | Visual linting |
| `src/core/vcs/token-compliance.ts` | `checkTokenCompliance()` | Pemeriksaan kepatuhan token |

## API Routes
| File | Fungsi/Class Utama | Peran |
|------|-------------------|-------|
| `src/app/api/ai/route.ts` | `POST()` | AI content generation (14 actions: kuis, matching, fill-blank, dll.) |
| `src/app/api/ai/lesson/route.ts` | `POST()` | AI lesson structure generation |
| `src/app/api/ai/refine/route.ts` | `POST()` | AI content refinement |
| `src/app/api/export/route.ts` | `POST()` | HTML export (Vite template injection) |
| `src/app/api/export/scorm/route.ts` | `POST()` | SCORM 1.2 ZIP export |
| `src/app/api/projects/route.ts` | `GET()`, `POST()` | List & create projects |
| `src/app/api/projects/[id]/route.ts` | `GET()`, `PUT()`, `DELETE()` | CRUD single project |
| `src/app/api/projects/[id]/save/route.ts` | `PUT()` | Full-state save (transactional) |
| `src/app/api/projects/[id]/export/route.ts` | `POST()` | Project-specific export |

## Infrastructure
| File | Fungsi/Class Utama | Peran |
|------|-------------------|-------|
| `src/lib/db.ts` | `prisma` | Prisma singleton (HMR-safe) |
| `src/lib/offline-sync.ts` | `enqueueSave()`, `flushQueue()`, `initAutoFlush()` | Offline sync queue → auto-flush saat online |
| `src/lib/rate-limit.ts` | `checkRateLimit()`, `getClientIp()` | Rate limiting in-memory per IP |
| `src/lib/api-validation.ts` | `aiRequestSchema`, `saveProjectSchema`, `exportRequestSchema` | Zod schemas untuk API input validation |
| `src/lib/save-utils.ts` | `canvaPagesToSavePages()` | Konversi canva pages → save payload |

---

# Data & Config

## Konfigurasi Utama
| Lokasi | Isi |
|--------|-----|
| `prisma/schema.prisma` | DB schema definition |
| `.env` / `.env.local` | Database URL, API keys (Not found — kemungkinan via system env) |
| `src/config/feature-flags.ts` | Feature flags |
| `next.config.js` | Next.js configuration |
| `vite.export.config.ts` | Vite export build config |
| `docker-compose.yml` | Docker compose |
| `Dockerfile` | Docker image |
| `Caddyfile` | Caddy reverse proxy config |

## Skema Data (Prisma/SQLite)

**Relasi**: Project → Page → Block (cascade delete)

| Entity | Field Kunci | Catatan |
|--------|-------------|---------|
| `Project` | id, title, subject, grade, semester, teacherName, schoolName, templateId, themeId, ratioId, authoringData(JSON), isPublished | Top-level entity |
| `Page` | id, projectId, pageIndex, templateType, variant, bgColor, schemaData(JSON), navConfig(JSON) | Satu layar dalam project |
| `Block` | id, pageId, blockType, blockIndex, content(JSON), layout(JSON) | Satu blok konten dalam page |
| `Template` | id, name, subject, category, schemaData(JSON), downloads, rating | Template reusable |

## Migration & Seed
| Lokasi | Peran |
|--------|-------|
| `prisma/migrations/20260524020724_init/migration.sql` | Initial migration |
| `prisma/seed.ts` | DB seeder |

## Folder Output / Runtime Artifacts
| Lokasi | Peran |
|--------|-------|
| `export-output/` | Vite-built standalone HTML template (dipakai oleh export API) |
| `public/` | Static assets (logo, sounds, icons, sw.js, manifest.json) |

---

# External Integrations

| Service | Modul Pemanggil | Fungsi |
|---------|----------------|--------|
| **z-ai-web-dev-sdk (LLM)** | `src/app/api/ai/route.ts`, `src/app/api/ai/lesson/route.ts`, `src/app/api/ai/refine/route.ts` | AI content generation (kuis, materi, lesson structure, refinement) |
| **Prisma / SQLite** | `src/lib/db.ts` → semua API routes | Database persistence |
| **archiver (ZIP)** | `src/app/api/export/scorm/route.ts` | SCORM 1.2 ZIP creation |
| **PWA Service Worker** | `src/hooks/use-service-worker.ts`, `public/sw.js` | Offline support + caching |
| **Web Audio** | `src/lib/sounds.ts`, `public/sounds/` | Sound effects (benar, salah, klik, dll.) |

---

# Risks / Blind Spots

1. **4 block renderers masih pakai iosTypography()** — Dari 43 renderers, 39 sudah pakai `tokens.edu()`. Yang masih pakai iOS VC: **HeroRenderer** (11 calls, fontSize 9-26px), **CoverRenderer** (4 calls, hero/title1), **MateriSectionRenderer** (2 calls, title3), **KuisRenderer** (1 call, caption1). Hardcoded fontSize juga masih ada di 7 file (PremiumStepNavigator 11/13px, HeroRenderer 9px, CoverRenderer 10/160px, dll).

2. **Dynamic imports** — Beberapa block editor menggunakan dynamic import (module-editors/) yang tidak bisa dipetakan statik. Asumsi: semua tipe blok terdaftar di SceneRegistry.

3. **Export pipeline** — `export-output/index.html` harus di-build terlebih dahulu (`vite build --config vite.export.config.ts`). Jika belum ada, export API mengembalikan error 500.

4. **Rate limiting in-memory** — `src/lib/rate-limit.ts` menggunakan Map in-memory. Tidak persisten across restart, tidak bekerja di multi-instance deployment.

5. **localStorage persistence** — CanvaStore dan AuthoringStore menyimpan state ke localStorage sebagai fallback. Potensi data loss jika localStorage penuh (quota exceeded).

6. **Schema migration** — `src/core/schema/schema-migration.ts` ada tapi belum ada versioning scheme yang jelas. Perubahan schema di masa depan mungkin perlu migration path.

7. **EduRenderingContext gap** — `tokens.edu(blockType, isCompact)` factory sudah ada di TokenResolver dan dipakai 39/43 renderers. Tapi HeroRenderer dan CoverRenderer (block terbesar & paling terlihat) masih 90% pakai iOS VC. Ini prioritas migrasi tertinggi.

8. **AI response parsing** — Parsing JSON dari LLM response menggunakan regex cleaning. Jika LLM menghasilkan format yang tidak terduga, bisa gagal (ditangani dengan error 422).

9. **SCORM export** — Membutuhkan `archiver` package yang di-require() secara dinamis. Jika tidak terinstall, SCORM export mengembalikan error 501.

10. **Game state** — `src/store/interactive-store.ts` mengelola state game interaktif tapi tidak terpersisten ke DB. Score hilang saat refresh.
