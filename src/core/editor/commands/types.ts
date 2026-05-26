// ═══════════════════════════════════════════════════════════════════
// COMMAND ENGINE — Type definitions
// ═══════════════════════════════════════════════════════════════════
// FASE 5: Every edit flows through a unified command pipeline:
//
//   intent → command → validate → execute (immutable update) → commit → journal
//
// ARCHITECTURE:
//   ┌─────────────┐     ┌──────────────┐     ┌──────────────┐
//   │  UI / AI /  │────→│  Command     │────→│  Execution   │
//   │  Sync / API │     │  Engine      │     │  Pipeline    │
//   └─────────────┘     └──────────────┘     └──────────────┘
//        │                    │                      │
//        │              ┌─────┴─────┐          ┌─────┴──────┐
//        │              │ Validate  │          │ Journal    │
//        │              │ Normalize │          │ PatchHistory│
//        │              │ Authorize │          │ EditBus    │
//        │              └───────────┘          └────────────┘
//
// KEY PRINCIPLES:
//   1. UI DUMB, ENGINE SMART — UI only sends intents
//   2. ALL mutations go through CommandEngine.execute()
//   3. Commands are auditable, replayable, reversible
//   4. No direct store.set() for schema mutations
//   5. Async boundaries write to staging, not directly to store
// ═══════════════════════════════════════════════════════════════════

import type { SchemaBlock, ScreenSchema, ContainerRef, BlockVariant } from '../../schema/types';
import type { Patch } from 'immer';

// ── Command Types ────────────────────────────────────────────────
// Every possible mutation intent in the editor.

export type CommandType =
  // ── Block CRUD ──
  | 'insert-block'
  | 'update-block'
  | 'delete-block'
  | 'duplicate-block'
  | 'move-block'
  | 'reorder-blocks'
  // ── Block Positioning ──
  | 'nudge-blocks'
  | 'align-blocks'
  | 'distribute-blocks'
  // ── Block Properties ──
  | 'change-variant'
  | 'toggle-compression'
  // ── Page Operations ──
  | 'split-scene'
  | 'merge-scene'
  | 'rebalance-page'
  // ── Clipboard ──
  | 'copy-block'
  | 'paste-block'
  // ── Batch Operations ──
  | 'batch-update'
  | 'batch-delete'
  | 'batch-move'
  | 'batch-duplicate'
  | 'batch-variant'
  | 'batch-compression'
  // ── Page-level ──
  | 'add-page'
  | 'delete-page'
  | 'duplicate-page'
  | 'reorder-page'
  | 'update-page-background'
  | 'update-page-theme'
  // ── Special ──
  | 'custom-mutation';

// ── Command Source ───────────────────────────────────────────────

export type CommandSource =
  | 'user'        // Direct user interaction (click, type, drag)
  | 'ai'          // AI assistant generated content
  | 'sync'        // Cross-store sync (authoring → canvas)
  | 'auto'        // Auto-generated content
  | 'import'      // Import from external source
  | 'api'         // External API call
  | 'undo'        // Undo operation
  | 'redo';       // Redo operation

// ── Command Payloads ─────────────────────────────────────────────
// Each command type has a specific payload shape.

export interface InsertBlockPayload {
  blockType: string;
  afterId?: string;
  atIndex?: number;
  container?: ContainerRef;
  initialData?: Partial<SchemaBlock>;
}

export interface UpdateBlockPayload {
  blockId: string;
  updates: Record<string, unknown>;
}

export interface DeleteBlockPayload {
  blockId: string;
}

export interface DuplicateBlockPayload {
  blockId: string;
  newId?: string;
}

export interface MoveBlockPayload {
  blockId: string;
  fromIndex: number;
  toIndex: number;
  container?: ContainerRef;
  targetContainer?: ContainerRef;
}

export interface ReorderBlocksPayload {
  fromIndex: number;
  toIndex: number;
}

export interface NudgeBlocksPayload {
  blockIds: string[];
  dx: number;
  dy: number;
}

export interface AlignBlocksPayload {
  blockIds: string[];
  direction: 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom';
}

export interface DistributeBlocksPayload {
  blockIds: string[];
  axis: 'horizontal' | 'vertical';
}

export interface ChangeVariantPayload {
  blockIds: string[];
  variant: BlockVariant;
}

export interface ToggleCompressionPayload {
  blockIds: string[];
  enabled: boolean;
}

export interface SplitScenePayload {
  blockId: string;
}

export interface MergeScenePayload {
  withNext: boolean;
}

export interface RebalancePagePayload {
  availableHeight?: number;
  compressionFirst?: boolean;
}

export interface CopyBlockPayload {
  blockId: string;
}

export interface PasteBlockPayload {
  afterId?: string;
  atIndex?: number;
}

export interface BatchUpdatePayload {
  updates: Array<{ blockId: string; changes: Record<string, unknown> }>;
}

export interface BatchDeletePayload {
  blockIds: string[];
}

export interface BatchMovePayload {
  moves: Array<{ blockId: string; toIndex: number }>;
}

export interface BatchDuplicatePayload {
  blockIds: string[];
}

export interface BatchVariantPayload {
  blockIds: string[];
  variant: BlockVariant;
}

export interface BatchCompressionPayload {
  blockIds: string[];
  enabled: boolean;
}

export interface AddPagePayload {
  templateType: string;
  label?: string;
  schemaBlocks?: SchemaBlock[];
  index?: number;
}

export interface DeletePagePayload {
  pageIndex: number;
}

export interface DuplicatePagePayload {
  pageIndex: number;
}

export interface ReorderPagePayload {
  fromIndex: number;
  toIndex: number;
}

export interface UpdatePageBackgroundPayload {
  pageIndex: number;
  background: ScreenSchema['background'];
}

export interface UpdatePageThemePayload {
  pageIndex: number;
  themeId: string;
}

export interface CustomMutationPayload {
  name: string;
  fn: (schema: ScreenSchema) => ScreenSchema;
}

// ── Command Union ────────────────────────────────────────────────

export interface Command<T = unknown> {
  /** Unique command ID (nanoid) */
  id: string;
  /** Type of command */
  type: CommandType;
  /** Payload specific to the command type */
  payload: T;
  /** Source of the command */
  source: CommandSource;
  /** Timestamp when the command was created */
  timestamp: number;
  /** Page index this command targets (if applicable) */
  pageIndex?: number;
  /** Description for journal/debugging */
  description?: string;
  /** Whether to skip undo recording */
  skipHistory?: boolean;
  /** Whether to skip journal recording */
  skipJournal?: boolean;
  /** Whether to skip editBus emission */
  skipEditBus?: boolean;
  /** Whether to skip normalization */
  skipNormalize?: boolean;
  /** Parent command ID (for batch operations) */
  parentCommandId?: string;
}

// ── Command Result ───────────────────────────────────────────────

export interface CommandResult {
  /** Whether the command executed successfully */
  success: boolean;
  /** The command that was executed */
  command: Command;
  /** New schema after execution (null if failed) */
  schema: ScreenSchema | null;
  /** Immer forward patches */
  forwardPatches: Patch[];
  /** Immer inverse patches */
  inversePatches: Patch[];
  /** Journal entry ID */
  journalEntryId?: string;
  /** Error message if failed */
  error?: string;
  /** Warnings during execution */
  warnings: string[];
  /** Duration of execution in ms */
  durationMs: number;
}

// ── Command Middleware ────────────────────────────────────────────
// Middleware functions that can intercept commands.

export type CommandMiddleware = {
  /** Name for debugging */
  name: string;
  /** Called before execution. Return false to veto. */
  beforeExecute?: (command: Command) => Command | false;
  /** Called after successful execution */
  afterExecute?: (command: Command, result: CommandResult) => void;
  /** Called after failed execution */
  onError?: (command: Command, error: Error) => void;
};
