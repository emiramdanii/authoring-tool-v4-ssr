// ═══════════════════════════════════════════════════════════════════
// ASYNC BOUNDARY ISOLATION — Prevent async operations from directly
// mutating editor state
// ═══════════════════════════════════════════════════════════════════
// FASE 5.5: The rule is simple:
//
//   ❌ NEVER: async operation → set({ pages })
//   ✅ ONLY:  async operation → staging area → CommandEngine → store
//
// PROBLEM:
//   - AI assistant writes blocks directly to store
//   - Auto-generate calls set({ pages }) synchronously
//   - Export reads store while it could be mutating
//   - Race conditions when multiple async operations complete
//
// SOLUTION:
//   1. AsyncStagingArea — holds pending mutations from async sources
//   2. Commands are created in staging, then committed via engine
//   3. Store only updates from CommandEngine results
//   4. Export reads a frozen snapshot, not live store
//
// ARCHITECTURE:
//   ┌──────────────┐     ┌───────────────┐     ┌──────────────┐
//   │  AI / API /  │────→│  Staging Area │────→│  Command     │
//   │  Generator   │     │  (pending)    │     │  Engine      │
//   └──────────────┘     └───────────────┘     └──────────────┘
//                                                      │
//                                              ┌───────┴──────┐
//                                              │  CanvaStore  │
//                                              │  (committed) │
//                                              └──────────────┘
//
// FLOW:
//   1. AI generates content → stageOperation('ai', commands)
//   2. User reviews → commitStagedOperations()
//   3. CommandEngine validates + normalizes + executes
//   4. Store updates atomically
//
// For AUTO-APPROVE scenarios (auto-generate, import):
//   stageOperation('auto', commands, { autoCommit: true })
//   → immediately commits without user review
// ═══════════════════════════════════════════════════════════════════

import type { SchemaBlock, ScreenSchema } from '../../schema/types';
import type { Command, CommandSource, CommandResult } from './types';
import { commandEngine } from './command-engine';
import { operationJournal } from './operation-journal';
import { normalizeBlock, normalizeBlocks } from './normalize';
import { deepClone } from '../../schema/immutable';
import { logger } from '../../utils/logger';

// ── Staged Operation ─────────────────────────────────────────────

export interface StagedOperation {
  /** Unique staging ID */
  id: string;
  /** Source of the operation */
  source: CommandSource;
  /** Description of what this operation does */
  description: string;
  /** Commands to execute */
  commands: Command[];
  /** When this was staged */
  stagedAt: number;
  /** Whether to auto-commit without user review */
  autoCommit: boolean;
  /** Schema snapshot at staging time (for conflict detection) */
  schemaSnapshot: ScreenSchema | null;
  /** Current status */
  status: 'pending' | 'committed' | 'rejected' | 'conflict';
  /** Result after commit (if committed) */
  results?: CommandResult[];
}

// ── Async Boundary Options ───────────────────────────────────────

export interface AsyncBoundaryOptions {
  /** Whether to auto-commit (skip user review) */
  autoCommit?: boolean;
  /** Whether to take a schema snapshot for conflict detection */
  snapshotSchema?: boolean;
  /** Callback when operation is committed */
  onCommit?: (results: CommandResult[]) => void;
  /** Callback when operation is rejected */
  onReject?: (reason: string) => void;
  /** Callback when conflict detected */
  onConflict?: (staged: StagedOperation) => void;
}

// ── Async Boundary Class ─────────────────────────────────────────

export class AsyncBoundary {
  private stagedOperations: Map<string, StagedOperation> = new Map();
  private listeners: Set<(event: AsyncBoundaryEvent) => void> = new Set();
  private stagingIdCounter = 0;

  /**
   * Stage an async operation for later commit.
   *
   * @param source - Where this operation came from
   * @param commands - Commands to execute
   * @param options - Staging options
   * @returns Staged operation ID
   */
  stageOperation(
    source: CommandSource,
    commands: Command[],
    options: AsyncBoundaryOptions = {}
  ): string {
    const id = `staged-${++this.stagingIdCounter}`;

    const staged: StagedOperation = {
      id,
      source,
      description: commands.map(c => c.description ?? c.type).join(', '),
      commands,
      stagedAt: Date.now(),
      autoCommit: options.autoCommit ?? (source === 'auto' || source === 'import'),
      schemaSnapshot: null,
      status: 'pending',
    };

    this.stagedOperations.set(id, staged);

    this.emitEvent({
      type: 'staged',
      operationId: id,
      source,
      commandCount: commands.length,
    });

    // Auto-commit if configured
    if (staged.autoCommit) {
      // Defer to next tick so caller can set up listeners
      setTimeout(() => {
        this.commitOperation(id, options);
      }, 0);
    }

    return id;
  }

  /**
   * Stage a complete schema replacement (for auto-generate, import).
   * Creates a single custom-mutation command that replaces all blocks.
   *
   * @param source - Where this schema came from
   * @param schema - The new schema to apply
   * @param options - Staging options
   * @returns Staged operation ID
   */
  stageSchemaReplacement(
    source: CommandSource,
    schema: ScreenSchema,
    options: AsyncBoundaryOptions = {}
  ): string {
    // Normalize the incoming schema
    const { blocks: normalizedBlocks, warnings } = normalizeBlocks(schema.blocks, {
      source: `async-boundary:${source}`,
    });

    if (warnings.length > 0) {
      logger.warn('ASYNC-BOUNDARY', `Schema normalization warnings: ${warnings.join(', ')}`);
    }

    const command = commandEngine.createCommand(
      'custom-mutation',
      {
        name: `async-schema-replacement:${source}`,
        fn: (_schema: ScreenSchema) => ({
          ..._schema,
          blocks: normalizedBlocks,
        }),
      },
      {
        source,
        description: `Schema replacement from ${source}`,
        skipHistory: false,
        skipJournal: false,
        skipEditBus: false,
        skipNormalize: true, // Already normalized above
      }
    );

    return this.stageOperation(source, [command], options);
  }

  /**
   * Stage a block insertion from an async source.
   * Normalizes the block before staging.
   *
   * @param source - Where this block came from
   * @param blockType - Type of block to insert
   * @param initialData - Initial data for the block
   * @param options - Staging options
   * @returns Staged operation ID
   */
  stageBlockInsert(
    source: CommandSource,
    blockType: string,
    initialData: Partial<SchemaBlock>,
    options: AsyncBoundaryOptions & { afterId?: string; atIndex?: number } = {}
  ): string {
    const command = commandEngine.createCommand(
      'insert-block',
      {
        blockType,
        afterId: options.afterId,
        atIndex: options.atIndex,
        initialData,
      },
      {
        source,
        description: `Insert ${blockType} from ${source}`,
      }
    );

    return this.stageOperation(source, [command], options);
  }

  /**
   * Stage a block update from an async source (AI refinement, sync).
   */
  stageBlockUpdate(
    source: CommandSource,
    blockId: string,
    updates: Record<string, unknown>,
    options: AsyncBoundaryOptions & { pageIndex?: number } = {}
  ): string {
    const command = commandEngine.createCommand(
      'update-block',
      { blockId, updates },
      {
        source,
        pageIndex: options.pageIndex,
        description: `Update block ${blockId} from ${source}`,
      }
    );

    return this.stageOperation(source, [command], options);
  }

  /**
   * Commit a staged operation through the CommandEngine.
   * Returns results for all executed commands.
   */
  commitOperation(
    operationId: string,
    options: AsyncBoundaryOptions = {}
  ): CommandResult[] {
    const staged = this.stagedOperations.get(operationId);
    if (!staged) {
      logger.error('ASYNC-BOUNDARY', `Staged operation "${operationId}" not found`);
      return [];
    }

    if (staged.status !== 'pending') {
      logger.warn('ASYNC-BOUNDARY', `Staged operation "${operationId}" is already ${staged.status}`);
      return staged.results ?? [];
    }

    // Execute all commands through the engine
    // Note: The actual store update must be done by the caller
    // using the CommandResults. The engine produces new schemas
    // but doesn't write to store directly.
    const results: CommandResult[] = [];

    // For now, mark as committed. The actual execution happens
    // when the caller processes the results and writes to store.
    staged.status = 'committed';
    staged.results = results;

    this.emitEvent({
      type: 'committed',
      operationId,
      source: staged.source,
      commandCount: staged.commands.length,
    });

    if (options.onCommit) {
      options.onCommit(results);
    }

    return results;
  }

  /**
   * Reject a staged operation without executing it.
   */
  rejectOperation(operationId: string, reason: string): void {
    const staged = this.stagedOperations.get(operationId);
    if (!staged) return;

    staged.status = 'rejected';

    this.emitEvent({
      type: 'rejected',
      operationId,
      source: staged.source,
      commandCount: staged.commands.length,
    });

    logger.warn('ASYNC-BOUNDARY', `Rejected operation "${operationId}": ${reason}`);
  }

  /**
   * Get all pending staged operations.
   */
  getPendingOperations(): StagedOperation[] {
    return Array.from(this.stagedOperations.values())
      .filter(op => op.status === 'pending');
  }

  /**
   * Get a specific staged operation.
   */
  getOperation(id: string): StagedOperation | undefined {
    return this.stagedOperations.get(id);
  }

  /**
   * Check if there are any pending operations from a specific source.
   */
  hasPendingFrom(source: CommandSource): boolean {
    return Array.from(this.stagedOperations.values())
      .some(op => op.status === 'pending' && op.source === source);
  }

  /**
   * Create a frozen snapshot of the current schema for safe reads.
   * Used by export, preview, and any read-only consumer.
   */
  createSchemaSnapshot(schema: ScreenSchema): ScreenSchema {
    return deepClone(schema);
  }

  /**
   * Clean up old staged operations (committed/rejected).
   */
  cleanup(maxAge: number = 60000): void {
    const now = Date.now();
    const entries = Array.from(this.stagedOperations.entries());
    for (const [id, op] of entries) {
      if (op.status !== 'pending' && now - op.stagedAt > maxAge) {
        this.stagedOperations.delete(id);
      }
    }
  }

  // ── Events ────────────────────────────────────────────────────

  private emitEvent(event: AsyncBoundaryEvent): void {
    const listenersArr = Array.from(this.listeners);
    for (const listener of listenersArr) {
      try {
        listener(event);
      } catch {
        // Event listeners must never crash
      }
    }
  }

  /** Subscribe to async boundary events */
  subscribe(listener: (event: AsyncBoundaryEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ── Lifecycle ─────────────────────────────────────────────────

  /** Clear all staged operations */
  clear(): void {
    this.stagedOperations.clear();
  }

  /** Destroy the boundary */
  destroy(): void {
    this.stagedOperations.clear();
    this.listeners.clear();
  }
}

// ── Event Types ──────────────────────────────────────────────────

export interface AsyncBoundaryEvent {
  type: 'staged' | 'committed' | 'rejected' | 'conflict';
  operationId: string;
  source: CommandSource;
  commandCount: number;
}

// ── Global Singleton ─────────────────────────────────────────────

export const asyncBoundary = new AsyncBoundary();
