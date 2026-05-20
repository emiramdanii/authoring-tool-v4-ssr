// ═══════════════════════════════════════════════════════════════════
// ENGINE PRINCIPLES — SILSE Visual Editor Architecture
// ═══════════════════════════════════════════════════════════════════
// This document codifies the foundational principles that govern
// the SILSE Visual Editor Engine. Every contribution MUST comply.
//
// STATUS: ENFORCED — FASE 1-6 of ROADMAP PEMULIHAN SILSE
// LAST UPDATED: 2026-05-20
// ═══════════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────────
// PRINCIPLE 1: SINGLE SOURCE OF TRUTH
// ───────────────────────────────────────────────────────────────────
//
// page.schema.blocks[] is the ONE canonical data source for all
// rendering, export, and editing. Nothing else.
//
// WHAT THIS MEANS:
//   - page.elements[] is LEGACY — cleared when schema is present
//   - templateData.schemaScreen is LEGACY — migrated on first edit
//   - ensurePageSchema() is the migration gateway (pure, no writeback)
//   - No system may derive a "parallel truth" that diverges from schema
//
// ENFORCEMENT:
//   - assertDocumentPurity() catches runtime state leaking into schema
//   - commitSchemaUpdate() wraps every schema write with version bump
//   - loadFromStorage strips runtime fields before hydration
//   - Duplicate rendering (elements + schema) is forbidden
//
// VIOLATION EXAMPLES:
//   - Writing hover/editing state into schema blocks
//   - Maintaining a separate "preview" block array
//   - Reading from templateData when page.schema exists
//   - Skipping ensurePageSchema() when accessing page data

// ───────────────────────────────────────────────────────────────────
// PRINCIPLE 2: PURE RENDER
// ───────────────────────────────────────────────────────────────────
//
// The render pipeline is a pure function:
//   schema → layout resolve → measurement → render commit → visible blocks
//
// Same schema in = same render out. ALWAYS. No exceptions.
//
// WHAT THIS MEANS:
//   - Render must not depend on time, random values, or global state
//   - Date.now(), Math.random() in data = instant violation
//   - Hover/selection/editing must NOT affect what gets rendered
//   - Only WHAT is rendered (visible/invisible) may change, not HOW
//
// ENFORCEMENT:
//   - layoutHash detects when render diverges from schema
//   - validateRenderInvariant() is the runtime guard rail
//   - Render Determinism Checker (FASE 5) verifies same schema = same render
//   - Non-deterministic values are stripped at the normalization boundary
//
// COROLLARY: "UI dumb, Engine smart"
//   - UI components receive data and display it — they don't compute it
//   - Layout decisions happen in engines, not in React components
//   - If a component needs to "figure out" layout, the engine missed a step

// ───────────────────────────────────────────────────────────────────
// PRINCIPLE 3: NORMALIZED SCHEMA
// ───────────────────────────────────────────────────────────────────
//
// Anything entering the schema must be normalized.
// The normalization boundary is the gateway between the wild world
// and the pristine schema.
//
// WHAT THIS MEANS:
//   - AI output → normalize → validate → write
//   - User input → normalize → validate → write
//   - Loaded data → normalize → validate → write
//   - No raw data ever touches the schema directly
//
// ENFORCEMENT:
//   - assertValidSchema() + assertValidBlocks() at every write point
//   - commitSchemaUpdate() includes version bump + purity guard
//   - Template adapter normalizes on migration
//   - Schema repair (FASE 6) normalizes corrupt data before re-entry
//
// NORMALIZATION INCLUDES:
//   - Stable nanoid IDs (never Date.now(), never sequential)
//   - Valid block types (registered in BlockDefinitionRegistry)
//   - Pure serializable (no functions, DOM refs, class instances)
//   - Deduplicated IDs across the schema
//   - Correct compression/semantic/layout hints
//   - Version tracking (bumpVersion on every mutation)

// ───────────────────────────────────────────────────────────────────
// PRINCIPLE 4: COMMAND-ONLY MUTATIONS
// ───────────────────────────────────────────────────────────────────
//
// The ONLY way to mutate the schema is through the command pipeline:
//   intent → command → validation → normalization → execution → journal → commit
//
// WHAT THIS MEANS:
//   - Direct property assignment on schema blocks is FORBIDDEN
//   - deepFreeze (dev mode) catches accidental mutations
//   - All mutations go through produceWithPatches for audit trail
//   - The editBus records every mutation for patch-based undo
//
// ENFORCEMENT:
//   - Immer produceWithPatches wraps every schema write
//   - PatchHistory receives forward+inverse patches
//   - editBus.emit() is mandatory for all schema changes
//   - _pushHistory() is called BEFORE every mutation
//   - No mutation may skip the history system
//
// COMMAND TYPES:
//   - User commands: add, delete, move, duplicate, update, reorder
//   - System commands: rebalance, split, merge, auto-generate
//   - AI commands: regenerate, refine (via async boundary)
//
// ASYNC BOUNDARY:
//   AI must go through: staging → validation → normalization →
//   command pipeline → commit. Never write directly.

// ───────────────────────────────────────────────────────────────────
// PRINCIPLE 5: RUNTIME STATE ISOLATION
// ───────────────────────────────────────────────────────────────────
//
// State is classified into 5 categories with strict boundaries:
//
// 1. DOCUMENT STATE (stable, persisted, the source of truth)
//    - page.schema.blocks[]
//    - page.schema.nav, background, sectionLabel
//    - Survives page reload and browser restart
//
// 2. INTERACTION STATE (ephemeral, per-session, NOT persisted)
//    - selectedBlockId, selectedBlockIds, hoveredBlockId, editingBlockId
//    - Managed by InteractionStore / SessionSlice
//    - NEVER written to schema or localStorage
//    - selection ≠ document mutation
//
// 3. UI CHROME STATE (mixed persistence)
//    - leftTab, leftPanelOpen, rightPanelOpen, zoom, tool
//    - Persisted in localStorage but NOT in schema
//    - Reset when loading a different project
//
// 4. TRANSIENT STATE (React component state, NOT Zustand)
//    - Hover animations, drag positions, scroll offsets
//    - Lives in React.useState/useRef only
//    - Never in any Zustand store
//
// 5. DERIVED STATE (computed, NEVER stored)
//    - Scene plans, layout hashes, compressed heights
//    - Computed on-the-fly from document state
//    - If you need to persist it, recompute instead
//
// THE STRIP RULE:
//   - Runtime state (hover, selection, editing, compressed heights)
//     MUST be stripped before persistence
//   - assertDocumentPurity() enforces this in dev mode
//   - saveToStorage() runs a belt-and-suspenders strip
//   - clearCompressedHeightCache() on project load
//
// ENFORCEMENT:
//   - session-state.ts defines the boundary
//   - removeCompressedHeight() on block deletion
//   - Interaction state is reset on every page navigation
//   - No React hook state in Zustand stores

// ───────────────────────────────────────────────────────────────────
// PRINCIPLE 6: DETERMINISTIC LAYOUT
// ───────────────────────────────────────────────────────────────────
//
// Layout is a derived computation, not stored state.
// Same schema + same viewport = same layout. Always.
//
// WHAT THIS MEANS:
//   - Layout engines are pure functions (no side effects)
//   - Measurement results are cached but never persisted
//   - Scene plans are computed, not stored
//   - Compression hints in schema are INPUTS, not outputs
//
// THE MEASUREMENT CONTRACT:
//   1. Schema describes what content exists
//   2. Measurement observes how tall each block is
//   3. Layout engine computes positioning from schema + measurements
//   4. Render displays the computed layout
//   5. No step may feed back into an earlier step
//
// SCENE OVERFLOW:
//   - When blocks overflow available height, the engine computes
//     a ScenePlan (derived, disposable)
//   - The plan is PROMOTED to a page split only via transaction
//   - Promotion = converting derived layout → persistent document change
//   - This must go through: checkpoint → transaction → validate → commit
//
// ENFORCEMENT:
//   - computeScenePlan() is pure (no store access)
//   - getMeasuredHeight() reads from measurement cache
//   - Rebalance uses transactions for atomicity
//   - Crash checkpoints protect before dangerous layout operations

// ───────────────────────────────────────────────────────────────────
// PRINCIPLE 7: RECOVERY IS NON-DESTRUCTIVE
// ───────────────────────────────────────────────────────────────────
//
// Recovery operations may only PRESERVE or RESTORE data, never lose it.
// When in doubt, keep more data, not less.
//
// WHAT THIS MEANS:
//   - Crash checkpoints are saved BEFORE dangerous operations
//   - Transaction rollback restores to pre-transaction state
//   - Schema repair strips only what's truly unrecoverable
//   - Safe mode boot preserves all repairable pages
//   - Undo history is never cleared by recovery operations
//
// ENFORCEMENT:
//   - saveCrashCheckpoint() is called before split/merge/rebalance
//   - TransactionRollbackManager stores full page snapshots
//   - repairSchema() removes blocks only if they have no valid type
//   - Safe mode preserves pages with partial repairs
//   - All recovery operations log what they did (repairs, warnings)
//
// PRIORITY ORDER (when conflict arises):
//   1. Preserve user data (content, text, choices)
//   2. Preserve document structure (pages, block order)
//   3. Preserve visual layout (positions, sizes)
//   4. Recover metadata (IDs, versions, hints)
//   5. Re-derive everything else (caches, projections, hashes)

// ═══════════════════════════════════════════════════════════════════
// QUICK REFERENCE — What to check before submitting code
// ═══════════════════════════════════════════════════════════════════
//
// [ ] Does my change read from page.schema (not templateData)?
// [ ] Does my render path depend only on schema (no global state)?
// [ ] Does my data pass through normalization before entering schema?
// [ ] Does my mutation use produceWithPatches + editBus.emit?
// [ ] Am I storing interaction state in schema? (DON'T)
// [ ] Am I computing derived state instead of storing it?
// [ ] Does my layout change go through transaction + checkpoint?
// [ ] If this operation is dangerous, is a crash checkpoint saved first?
// [ ] Does my recovery code preserve more data than it removes?
// [ ] Would this code pass assertDocumentPurity() in dev mode?
//
// ═══════════════════════════════════════════════════════════════════
