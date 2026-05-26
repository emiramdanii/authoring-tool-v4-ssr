// ═══════════════════════════════════════════════════════════════════
// STATE TAXONOMY — Formal classification of ALL state in SILSE
// ═══════════════════════════════════════════════════════════════════
// FASE 3 — This document is the SINGLE SOURCE OF TRUTH for:
//   1. Which state fields exist
//   2. Which layer each field belongs to
//   3. Whether each field is persisted or ephemeral
//   4. Whether each field is derived or primary
//
// ARCHITECTURE:
//   ┌─────────────────────────────────────────────────────────┐
//   │  DOCUMENT LAYER (persisted, undoable, shareable)        │
//   │    pages[].schema  ·  ratioId  ·  authoring content     │
//   │    Store: CanvaStore + AuthoringStore                    │
//   ├─────────────────────────────────────────────────────────┤
//   │  SESSION LAYER (ephemeral, per-user, per-tab)           │
//   │    selection  ·  hover  ·  editing                       │
//   │    Store: InteractionStore (FASE 3 — ISOLATED)           │
//   │    scene nav · modes · panels                            │
//   │    Store: CanvaStore (SessionSlice)                      │
//   ├─────────────────────────────────────────────────────────┤
//   │  UI LAYER (ephemeral, layout/chrome)                    │
//   │    panels  ·  tabs  ·  tool  ·  zoom  ·  grid           │
//   │    Store: CanvaStore (UISlice)                           │
//   ├─────────────────────────────────────────────────────────┤
//   │  TRANSIENT LAYER (sub-second, discarded on unmount)     │
//   │    drag  ·  animation  ·  measurement cache             │
//   │    Store: React hooks (NOT Zustand)                      │
//   ├─────────────────────────────────────────────────────────┤
//   │  DERIVED LAYER (computed, never stored, never persisted)│
//   │    layout  ·  projection  ·  scene plan  ·  scores      │
//   └─────────────────────────────────────────────────────────┘
//
// RULES:
//   1. DOCUMENT state → persisted to localStorage AND DB
//   2. SESSION state → persisted to NEITHER (reset on reload)
//   3. UI state → persisted to NEITHER (reset on reload)
//      EXCEPTION: teacherMode (user preference, persisted separately)
//   4. TRANSIENT state → persisted to NEITHER, not even in Zustand
//   5. DERIVED state → computed on demand, NEVER stored or persisted
//
// VIOLATIONS:
//   If a field is in the wrong layer, add a @VIOLATION comment
//   with the issue and the planned fix.
// ═══════════════════════════════════════════════════════════════════

// ── LAYER TYPE ────────────────────────────────────────────────

export type StateLayer =
  | 'document'   // Persisted, undoable, shareable across users
  | 'session'    // Ephemeral, per-user, per-tab (selection, editing)
  | 'ui'         // Ephemeral, layout/chrome (panels, zoom, tool)
  | 'transient'  // Sub-second, discarded on unmount (drag, animation)
  | 'derived';   // Computed, never stored, never persisted

export type PersistenceScope =
  | 'db+localStorage'  // Saved to both database and localStorage
  | 'localStorage'     // Saved to localStorage only
  | 'separate-key'     // Saved to its own localStorage key
  | 'none';            // Never persisted

// ── FIELD CLASSIFICATION ─────────────────────────────────────

export interface StateFieldClassification {
  field: string;
  store: string;
  layer: StateLayer;
  persisted: PersistenceScope;
  derived: boolean;
  notes?: string;
  violation?: string;
}

// ── CANVA STORE CLASSIFICATION ────────────────────────────────

export const CANVA_STORE_FIELDS: StateFieldClassification[] = [
  // ── DOCUMENT LAYER ──
  { field: 'pages', store: 'CanvaStore', layer: 'document', persisted: 'db+localStorage', derived: false,
    notes: 'Primary document state. Contains CanvaPage[] with schema.blocks[]' },
  { field: 'ratioId', store: 'CanvaStore', layer: 'document', persisted: 'db+localStorage', derived: false,
    notes: 'Aspect ratio ID (16:9, 4:3, etc.)' },

  // ── SESSION LAYER (scene nav + modes — kept in CanvaStore) ──
  // NOTE: Selection/hover/editing state MOVED to InteractionStore (FASE 3).
  //   See INTERACTION_STORE_FIELDS below.
  { field: 'currentPageIndex', store: 'CanvaStore', layer: 'session', persisted: 'none', derived: false,
    notes: 'Which page is currently viewed. Kept in CanvaStore for undo/redo Snapshot accuracy.' },
  { field: 'sceneIndex', store: 'CanvaStore', layer: 'session', persisted: 'none', derived: false,
    notes: 'Current scene index for multi-scene pages' },
  { field: 'sceneTotal', store: 'CanvaStore', layer: 'session', persisted: 'none', derived: false,
    notes: 'Total scenes for current page' },
  { field: 'canvasPreview', store: 'CanvaStore', layer: 'session', persisted: 'none', derived: false,
    notes: 'Quick preview toggle' },
  { field: 'appMode', store: 'CanvaStore', layer: 'session', persisted: 'none', derived: false,
    notes: 'edit/preview/present/export mode' },
  { field: 'previewViewport', store: 'CanvaStore', layer: 'session', persisted: 'none', derived: false,
    notes: 'desktop/mobile viewport simulation' },
  { field: '_lastNudgeTime', store: 'CanvaStore', layer: 'session', persisted: 'none', derived: false,
    notes: 'Debounce timestamp for nudge actions' },

  // ── UI LAYER ──
  { field: 'zoom', store: 'CanvaStore', layer: 'ui', persisted: 'none', derived: false,
    notes: 'Canvas zoom level (-1 = auto-fit)' },
  { field: 'fitZoom', store: 'CanvaStore', layer: 'ui', persisted: 'none', derived: true,
    notes: 'Auto-fit zoom from ResizeObserver' },
  { field: 'tool', store: 'CanvaStore', layer: 'ui', persisted: 'none', derived: false,
    notes: 'Active tool (select, text, etc.)' },
  { field: 'leftTab', store: 'CanvaStore', layer: 'ui', persisted: 'none', derived: false,
    notes: 'Active tab in left panel' },
  { field: 'leftPanelOpen', store: 'CanvaStore', layer: 'ui', persisted: 'none', derived: false,
    notes: 'Left panel visibility' },
  { field: 'rightPanelOpen', store: 'CanvaStore', layer: 'ui', persisted: 'none', derived: false,
    notes: 'Right panel visibility' },
  { field: 'showGrid', store: 'CanvaStore', layer: 'ui', persisted: 'none', derived: false,
    notes: 'Grid overlay visibility' },
  { field: 'gridSize', store: 'CanvaStore', layer: 'ui', persisted: 'none', derived: false,
    notes: 'Grid spacing percentage' },
  { field: 'snapEnabled', store: 'CanvaStore', layer: 'ui', persisted: 'none', derived: false,
    notes: 'Snap-to-grid toggle' },
  { field: 'teacherMode', store: 'CanvaStore', layer: 'ui', persisted: 'separate-key', derived: false,
    notes: 'UI preference — persisted to silse_teacher_mode separately' },

  // ── TRANSIENT LAYER (in Zustand but ephemeral) ──
  { field: '_schemaClipboard', store: 'CanvaStore', layer: 'transient', persisted: 'none', derived: false,
    notes: 'Schema block clipboard — never persisted' },
  { field: '_clipboard', store: 'CanvaStore', layer: 'transient', persisted: 'none', derived: false,
    notes: 'Legacy element clipboard — never persisted' },

  // ── META LAYER (save system internals) ──
  { field: '_saveStatus', store: 'CanvaStore', layer: 'ui', persisted: 'none', derived: false,
    notes: 'Save status indicator for UI' },
  { field: '_lastSavedAt', store: 'CanvaStore', layer: 'ui', persisted: 'none', derived: false,
    notes: 'Last save timestamp (UI display only)' },

  // ── HISTORY LAYER (internal, not persisted) ──
  { field: '_history', store: 'CanvaStore', layer: 'transient', persisted: 'none', derived: false,
    notes: 'Undo/redo snapshot stack' },
  { field: '_historyIdx', store: 'CanvaStore', layer: 'transient', persisted: 'none', derived: false,
    notes: 'Current position in history stack' },
  { field: '_skipHistory', store: 'CanvaStore', layer: 'transient', persisted: 'none', derived: false,
    notes: 'Flag to skip history recording' },
];

// ── AUTHORING STORE CLASSIFICATION ────────────────────────────

export const AUTHORING_STORE_FIELDS: StateFieldClassification[] = [
  // ── DOCUMENT LAYER (projection of schema, persisted) ──
  { field: 'meta', store: 'AuthoringStore', layer: 'document', persisted: 'db+localStorage', derived: true,
    notes: 'Project metadata — projected from schema' },
  { field: 'cp', store: 'AuthoringStore', layer: 'document', persisted: 'db+localStorage', derived: true,
    notes: 'Capaian Pembelajaran — projected from schema' },
  { field: 'tp', store: 'AuthoringStore', layer: 'document', persisted: 'db+localStorage', derived: true,
    notes: 'Tujuan Pembelajaran — projected from schema' },
  { field: 'atp', store: 'AuthoringStore', layer: 'document', persisted: 'db+localStorage', derived: false,
    notes: 'Alur Tujuan Pembelajaran — authoring-only (not in schema yet)' },
  { field: 'alur', store: 'AuthoringStore', layer: 'document', persisted: 'db+localStorage', derived: true,
    notes: 'Alur pembelajaran — projected from schema' },
  { field: 'skenario', store: 'AuthoringStore', layer: 'document', persisted: 'db+localStorage', derived: true,
    notes: 'Skenario — projected from schema' },
  { field: 'kuis', store: 'AuthoringStore', layer: 'document', persisted: 'db+localStorage', derived: true,
    notes: 'Kuis items — projected from schema' },
  { field: 'modules', store: 'AuthoringStore', layer: 'document', persisted: 'db+localStorage', derived: true,
    notes: 'Learning modules — projected from schema' },
  { field: 'games', store: 'AuthoringStore', layer: 'derived', persisted: 'none', derived: true,
    notes: 'Derived from modules (filter by GAME_TYPES). FASE 3: Removed from persistence — derived at load time.' },
  { field: 'materi', store: 'AuthoringStore', layer: 'document', persisted: 'db+localStorage', derived: true,
    notes: 'Materi — projected from schema' },
  { field: 'petunjuk', store: 'AuthoringStore', layer: 'document', persisted: 'db+localStorage', derived: true,
    notes: 'Petunjuk — projected from schema' },
  { field: 'diskusi', store: 'AuthoringStore', layer: 'document', persisted: 'db+localStorage', derived: true,
    notes: 'Diskusi — projected from schema' },
  { field: 'refleksi', store: 'AuthoringStore', layer: 'document', persisted: 'db+localStorage', derived: true,
    notes: 'Refleksi — projected from schema' },
  { field: 'motivasi', store: 'AuthoringStore', layer: 'document', persisted: 'db+localStorage', derived: true,
    notes: 'Motivasi — projected from schema' },
  { field: 'rangkuman', store: 'AuthoringStore', layer: 'document', persisted: 'db+localStorage', derived: true,
    notes: 'Rangkuman — projected from schema' },
  { field: 'penutup', store: 'AuthoringStore', layer: 'document', persisted: 'db+localStorage', derived: true,
    notes: 'Penutup — projected from schema' },
  { field: 'suara', store: 'AuthoringStore', layer: 'document', persisted: 'db+localStorage', derived: false,
    notes: 'Sound config — user preference persisted with content' },

  // ── UI/SESSION LAYER (should NOT be persisted with content) ──
  { field: 'activePanel', store: 'AuthoringStore', layer: 'ui', persisted: 'none', derived: false,
    notes: 'Which panel is active in the Konten editor — NOT persisted (only in-memory Zustand state)' },
  { field: 'activePreset', store: 'AuthoringStore', layer: 'ui', persisted: 'none', derived: false,
    notes: 'Current preset selection — NOT persisted (only in-memory Zustand state)' },
  { field: 'dirty', store: 'AuthoringStore', layer: 'session', persisted: 'none', derived: false,
    notes: 'Whether authoring data has unsaved changes — NOT persisted (correctly ephemeral)' },
  { field: 'guruPw', store: 'AuthoringStore', layer: 'document', persisted: 'db+localStorage', derived: false,
    notes: 'Teacher password — project-level config, persisted is correct' },
  { field: 'teacherMode', store: 'AuthoringStore', layer: 'ui', persisted: 'separate-key', derived: false,
    notes: 'sederhana/lengkap — persisted separately in silse_teacher_mode' },
  { field: 'pendingCanvasGenerate', store: 'AuthoringStore', layer: 'transient', persisted: 'none', derived: false,
    notes: 'Queued page type for auto-generation — NOT persisted (correctly ephemeral)' },
];

// ── INTERACTION STORE CLASSIFICATION (FASE 3 — ISOLATED) ──
// Selection, hover, and editing state extracted from CanvaStore
// into a SEPARATE Zustand store to eliminate rerender storms.
// These fields change on every click/hover — keeping them in
// CanvaStore caused document subscribers to re-render needlessly.

export const INTERACTION_STORE_FIELDS: StateFieldClassification[] = [
  // ── SESSION LAYER (selection — the HOT PATH) ──
  { field: 'selectedBlockId', store: 'InteractionStore', layer: 'session', persisted: 'none', derived: false,
    notes: 'Currently selected block ID — extracted from CanvaStore (FASE 3)' },
  { field: 'selectedBlockType', store: 'InteractionStore', layer: 'session', persisted: 'none', derived: false,
    notes: 'Type of the currently selected block — extracted from CanvaStore (FASE 3)' },
  { field: 'selectedBlockIds', store: 'InteractionStore', layer: 'session', persisted: 'none', derived: false,
    notes: 'Multi-selected block IDs (shift+click) — extracted from CanvaStore (FASE 3)' },
  { field: 'selectedElId', store: 'InteractionStore', layer: 'session', persisted: 'none', derived: false,
    notes: 'Legacy element selection (single) — extracted from CanvaStore (FASE 3)' },
  { field: 'selectedElIds', store: 'InteractionStore', layer: 'session', persisted: 'none', derived: false,
    notes: 'Legacy element multi-selection — extracted from CanvaStore (FASE 3)' },
  { field: 'hoveredBlockId', store: 'InteractionStore', layer: 'session', persisted: 'none', derived: false,
    notes: 'Block under cursor — hover effects only — extracted from CanvaStore (FASE 3)' },
  { field: 'editingBlockId', store: 'InteractionStore', layer: 'session', persisted: 'none', derived: false,
    notes: 'Block being inline-edited (double-click) — extracted from CanvaStore (FASE 3)' },
];

// ── INTERACTIVE STORE CLASSIFICATION ──────────────────────────

export const INTERACTIVE_STORE_FIELDS: StateFieldClassification[] = [
  { field: 'mode', store: 'InteractiveStore', layer: 'session', persisted: 'none', derived: false,
    notes: 'design/interactive mode toggle — ephemeral' },
  { field: 'interactivePageIdx', store: 'InteractiveStore', layer: 'session', persisted: 'none', derived: false,
    notes: 'Current page index in interactive mode. FASE 3: Removed from persistence — session state.' },
  { field: 'totalPages', store: 'InteractiveStore', layer: 'derived', persisted: 'none', derived: true,
    notes: 'Derived from canvaStore.pages.length' },
  { field: 'scores', store: 'InteractiveStore', layer: 'session', persisted: 'none', derived: false,
    notes: 'Quiz/game scores. FASE 3: Removed from persistence — session state, cleared on project change.' },
  { field: 'replayGeneration', store: 'InteractiveStore', layer: 'session', persisted: 'separate-key', derived: false,
    notes: 'Counter for replay reset detection. Persisted — monotonic counter not project-specific.' },
];

// ── RUNTIME CACHES (module-level, not in any store) ───────────

export const RUNTIME_CACHES: StateFieldClassification[] = [
  { field: 'compressedHeightCache', store: 'module:session-state', layer: 'transient', persisted: 'none', derived: true,
    notes: 'Block ID → compressed height (px). Per-session, NEVER persisted.' },
  { field: 'measurementCache', store: 'module:BlockMeasurer', layer: 'transient', persisted: 'none', derived: true,
    notes: 'Block ID → measured height (px). Per-session, NEVER persisted.' },
  { field: 'layoutHashCache', store: 'module:render-invariants', layer: 'transient', persisted: 'none', derived: true,
    notes: 'Page ID → layout hash. Per-session, for determinism detection.' },
  { field: 'patchHistory', store: 'module:patch-history', layer: 'transient', persisted: 'none', derived: false,
    notes: 'Immer patch history for fine-grained undo/redo.' },
];

// ── REACT HOOK STATE (local, not in any store) ───────────────

export const HOOK_STATE: StateFieldClassification[] = [
  { field: 'useDragSort.{dragIndex,overIndex,isDragging}', store: 'hook:useDragSort', layer: 'transient', persisted: 'none', derived: false,
    notes: 'Drag state — ephemeral, discarded on unmount. Correctly NOT in Zustand.' },
  { field: 'useCanvasBlockDrag.{dragIndex,dropIndex,...}', store: 'hook:useCanvasBlockDrag', layer: 'transient', persisted: 'none', derived: false,
    notes: 'Block drag state — ephemeral. Correctly NOT in Zustand.' },
];

// ── PERSISTENCE AUDIT ─────────────────────────────────────────
// What gets saved where, and whether it should.

export interface PersistenceAuditEntry {
  storageKey: string;
  persistedFields: string[];
  shouldBePersisted: string[];
  shouldNotBePersisted: string[];
  notes?: string;
}

export const PERSISTENCE_AUDIT: PersistenceAuditEntry[] = [
  {
    storageKey: 'canva_state_v2',
    persistedFields: ['pages', 'ratioId', '_lastSavedAt', '_migrationVersion'],
    shouldBePersisted: ['pages', 'ratioId'],
    shouldNotBePersisted: [], // _lastSavedAt and _migrationVersion are metadata, acceptable
    notes: 'Clean — only document state persisted. Session/UI state excluded by persistence-slice.',
  },
  {
    storageKey: 'at_state_v1',
    persistedFields: ['meta', 'cp', 'tp', 'atp', 'alur', 'skenario', 'kuis', 'modules', 'materi',
                      'guruPw', 'petunjuk', 'diskusi', 'refleksi', 'motivasi', 'rangkuman', 'penutup', 'suara'],
    shouldBePersisted: ['meta', 'cp', 'tp', 'atp', 'alur', 'skenario', 'kuis', 'modules', 'materi',
                        'guruPw', 'petunjuk', 'diskusi', 'refleksi', 'motivasi', 'rangkuman', 'penutup', 'suara'],
    shouldNotBePersisted: [],
    notes: 'FASE 3: Clean — only document state persisted. games removed (derived from modules). dirty/activePanel/activePreset/pendingCanvasGenerate were never persisted.',
  },
  {
    storageKey: 'mpi-interactive-store',
    persistedFields: ['replayGeneration'],
    shouldBePersisted: ['replayGeneration'],
    shouldNotBePersisted: [],
    notes: 'FASE 3: Fixed — only replayGeneration persists. scores and interactivePageIdx removed (session state).',
  },
  {
    storageKey: 'silse_teacher_mode',
    persistedFields: ['teacherMode'],
    shouldBePersisted: ['teacherMode'],
    shouldNotBePersisted: [],
    notes: 'Correct — user preference, persisted separately.',
  },
];

// ── STATE ISOLATION VALIDATOR ─────────────────────────────────

export interface StateIsolationViolation {
  field: string;
  store: string;
  currentLayer: StateLayer;
  expectedLayer: StateLayer;
  currentPersistence: PersistenceScope;
  expectedPersistence: PersistenceScope;
  severity: 'error' | 'warning';
  message: string;
}

/**
 * Validate that state layers are properly isolated.
 * Returns a list of violations found.
 *
 * This is the FASE 3 guard — it catches:
 *   - Session state persisted with document data
 *   - UI state in document store
 *   - Derived state being persisted
 *   - Transient state surviving project changes
 */
export function validateStateIsolation(): StateIsolationViolation[] {
  const violations: StateIsolationViolation[] = [];

  // Check all fields for layer/persistence mismatches
  const allFields = [
    ...CANVA_STORE_FIELDS,
    ...INTERACTION_STORE_FIELDS,
    ...AUTHORING_STORE_FIELDS,
    ...INTERACTIVE_STORE_FIELDS,
    ...RUNTIME_CACHES,
  ];

  for (const field of allFields) {
    if (field.violation) {
      // Determine severity based on the type of violation
      const isSessionPersisted = (field.layer === 'session' || field.layer === 'ui' || field.layer === 'transient')
        && field.persisted !== 'none' && field.persisted !== 'separate-key';
      const isDerivedPersisted = field.derived && field.persisted !== 'none';

      violations.push({
        field: field.field,
        store: field.store,
        currentLayer: field.layer,
        expectedLayer: field.layer,
        currentPersistence: field.persisted,
        expectedPersistence: 'none',
        severity: isSessionPersisted || isDerivedPersisted ? 'error' : 'warning',
        message: field.violation,
      });
    }
  }

  // Check persistence audit for stale data risks
  for (const audit of PERSISTENCE_AUDIT) {
    for (const field of audit.shouldNotBePersisted) {
      violations.push({
        field,
        store: audit.storageKey,
        currentLayer: 'derived',
        expectedLayer: 'derived',
        currentPersistence: 'localStorage',
        expectedPersistence: 'none',
        severity: 'warning',
        message: `Field "${field}" in ${audit.storageKey} is derived and should NOT be persisted — risk of stale data.`,
      });
    }
  }

  return violations;
}
