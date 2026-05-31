// ═══════════════════════════════════════════════════════════════════
// COMMAND ENGINE — Deterministic Editing Engine Core
// ═══════════════════════════════════════════════════════════════════
// FASE 5.1: The central orchestrator for ALL editor mutations.
//
// PIPELINE:
//   intent → command → validate → normalize → execute → commit
//
// EVERY schema mutation MUST go through CommandEngine.execute().
// Direct set({ pages }) for schema changes is FORBIDDEN.
//
// RESPONSIBILITIES:
//   1. Validate commands before execution
//   2. Normalize blocks before insertion
//   3. Execute immutable updates via produceWithPatches
//   4. Commit to store via commitSchemaUpdate
//   5. Record to Operation Journal
//   6. Emit to EditBus
//   7. Push to PatchHistory (for undo/redo)
//   8. Run middleware hooks (before/after)
//
// ARCHITECTURE:
//   UI ──intent──→ CommandEngine.execute(cmd)
//                    │
//                    ├─ validate ──→ reject if invalid
//                    ├─ normalize ──→ ensure block safety
//                    ├─ middleware.beforeExecute ──→ veto possible
//                    ├─ produceWithPatches ──→ immutable update
//                    ├─ commitSchemaUpdate ──→ version bump + purity
//                    ├─ PatchHistory.push ──→ undo/redo
//                    ├─ editBus.emit ──→ subscribers notified
//                    ├─ Journal.record ──→ audit trail
//                    └─ middleware.afterExecute ──→ post hooks
//
// IMPORTANT: The CommandEngine does NOT directly write to the Zustand
// store. It produces a new ScreenSchema and returns it. The caller
// (store action) is responsible for calling set({ pages }).
//
// This separation ensures:
//   - CommandEngine is testable without Zustand
//   - Store remains the single source of truth for state
//   - Async operations can stage commands without store access
// ═══════════════════════════════════════════════════════════════════

import { produceWithPatches, type Patch } from 'immer';
import { nanoid } from 'nanoid';
import type {
  Command,
  CommandType,
  CommandSource,
  CommandResult,
  CommandMiddleware,
  InsertBlockPayload,
  UpdateBlockPayload,
  DeleteBlockPayload,
  DuplicateBlockPayload,
  MoveBlockPayload,
  NudgeBlocksPayload,
  AlignBlocksPayload,
  DistributeBlocksPayload,
  SplitScenePayload,
  MergeScenePayload,
  RebalancePagePayload,
  CustomMutationPayload,
} from './types';
import type { SchemaBlock, ScreenSchema } from '../../schema/types';
import { isSpatialLayout } from '../../schema/types';
import { commitSchemaUpdate } from '../../schema/commit-update';
import { assertDocumentPurity } from '../../schema/session-state';
import { assertValidSchema } from '../../schema/validation';
import { normalizeBlock, normalizeBlocks } from './normalize';
import { operationJournal } from './operation-journal';
import { editBus } from '../edit-bus';
import { patchHistory } from '../patch-history';
import {
  findBlockById,
  insertBlock,
  moveBlock as moveBlockImmutable,
  duplicateBlock as duplicateBlockImmutable,
  splitScene,
} from '../../schema/immutable';
import { deepMergeBlock } from '../deep-merge';
import { findBlockOwner } from './block-locator';
import { logger } from '../../utils/logger';

// ── Command Engine ───────────────────────────────────────────────

export class CommandEngine {
  private middlewares: CommandMiddleware[] = [];
  private enabled: boolean = true;
  private executionCount: number = 0;

  // ── Command Creation ─────────────────────────────────────────

  /**
   * Create a command object from an intent.
   * This is the entry point for all editor mutations.
   */
  createCommand<T>(
    type: CommandType,
    payload: T,
    options: {
      source?: CommandSource;
      pageIndex?: number;
      description?: string;
      skipHistory?: boolean;
      skipJournal?: boolean;
      skipEditBus?: boolean;
      skipNormalize?: boolean;
      parentCommandId?: string;
    } = {}
  ): Command<T> {
    return {
      id: `cmd-${nanoid(10)}`,
      type,
      payload,
      source: options.source ?? 'user',
      timestamp: Date.now(),
      pageIndex: options.pageIndex,
      description: options.description,
      skipHistory: options.skipHistory,
      skipJournal: options.skipJournal,
      skipEditBus: options.skipEditBus,
      skipNormalize: options.skipNormalize,
      parentCommandId: options.parentCommandId,
    };
  }

  // ── Core Execution ───────────────────────────────────────────

  /**
   * Execute a command against a ScreenSchema.
   * Returns a CommandResult with the new schema + patches.
   *
   * IMPORTANT: This does NOT write to the Zustand store.
   * The caller must write the result to store:
   *
   *   const result = engine.execute(schema, command);
   *   if (result.success) {
   *     set({ pages: newPages }); // Caller writes to store
   *   }
   */
  execute(schema: ScreenSchema, command: Command): CommandResult {
    const startTime = performance.now();

    if (!this.enabled) {
      return {
        success: false,
        command,
        schema: null,
        forwardPatches: [],
        inversePatches: [],
        warnings: ['Command engine is disabled'],
        durationMs: 0,
        error: 'Command engine is disabled',
      };
    }

    this.executionCount++;

    try {
      // ═══ 1. VALIDATE ══════════════════════════════════════
      const validationError = this.validateCommand(command);
      if (validationError) {
        return this.fail(command, validationError, startTime);
      }

      // ═══ 2. MIDDLEWARE BEFORE ═════════════════════════════
      let processedCommand = command;
      for (const mw of this.middlewares) {
        if (mw.beforeExecute) {
          const result = mw.beforeExecute(processedCommand);
          if (result === false) {
            return this.fail(command, `Vetoed by middleware "${mw.name}"`, startTime);
          }
          if (result !== undefined && typeof result !== 'boolean') {
            processedCommand = result as Command;
          }
        }
      }

      // ═══ 3. EXECUTE ══════════════════════════════════════
      const executionResult = this.executeCommand(schema, processedCommand);
      if (!executionResult.success) {
        return this.fail(command, executionResult.error ?? 'Execution failed', startTime);
      }

      // ═══ 4. NORMALIZE ════════════════════════════════════
      let finalSchema = executionResult.schema!;
      const warnings: string[] = [...executionResult.warnings];

      if (!processedCommand.skipNormalize) {
        const { blocks: normBlocks, warnings: normWarnings, modifiedCount } = normalizeBlocks(finalSchema.blocks, {
          source: `command:${processedCommand.type}`,
        });
        if (modifiedCount > 0) {
          finalSchema = { ...finalSchema, blocks: normBlocks };
          warnings.push(...normWarnings);
        }
      }

      // ═══ 5. COMMIT (version bump + purity check) ══════════
      try {
        finalSchema = commitSchemaUpdate(finalSchema, finalSchema.blocks);
      } catch (e) {
        warnings.push(`Purity check warning: ${e instanceof Error ? e.message : String(e)}`);
      }

      // ═══ 6. POST-VALIDATE ════════════════════════════════
      try {
        assertValidSchema(finalSchema, `CommandEngine.execute(${processedCommand.type})`);
      } catch (e) {
        warnings.push(`Post-validation warning: ${e instanceof Error ? e.message : String(e)}`);
      }

      const durationMs = performance.now() - startTime;

      const result: CommandResult = {
        success: true,
        command: processedCommand,
        schema: finalSchema,
        forwardPatches: executionResult.forwardPatches,
        inversePatches: executionResult.inversePatches,
        warnings,
        durationMs,
      };

      // ═══ 7. JOURNAL ══════════════════════════════════════
      if (!processedCommand.skipJournal) {
        operationJournal.record(processedCommand, {
          success: true,
          durationMs,
          blockIds: executionResult.affectedBlockIds,
          blockTypes: executionResult.affectedBlockTypes,
        });
      }

      // ═══ 8. EDITBUS ══════════════════════════════════════
      if (!processedCommand.skipEditBus) {
        editBus.emit({
          type: 'patch',
          patch: {
            blockId: executionResult.primaryBlockId ?? processedCommand.id,
            blockType: executionResult.affectedBlockTypes[0] ?? processedCommand.type,
            pageIndex: processedCommand.pageIndex ?? 0,
            patch: { _commandType: processedCommand.type },
            timestamp: processedCommand.timestamp,
            source: (['user', 'ai', 'sync', 'auto'] as const).includes(processedCommand.source as any)
              ? processedCommand.source as 'user' | 'ai' | 'sync' | 'auto'
              : 'auto',
            _immerPatches: {
              forward: executionResult.forwardPatches,
              inverse: executionResult.inversePatches,
              pageIndex: processedCommand.pageIndex ?? 0,
            },
          },
        });
      }

      // ═══ 9. PATCH HISTORY ════════════════════════════════
      if (!processedCommand.skipHistory && executionResult.forwardPatches.length > 0) {
        patchHistory.push({
          patches: executionResult.forwardPatches,
          inversePatches: executionResult.inversePatches,
          source: (['user', 'ai', 'sync', 'auto'] as const).includes(processedCommand.source as any)
            ? processedCommand.source as 'user' | 'ai' | 'sync' | 'auto'
            : 'auto',
          description: processedCommand.description ?? processedCommand.type,
          pageIndex: processedCommand.pageIndex,
          blockId: executionResult.primaryBlockId,
        });
      }

      // ═══ 10. MIDDLEWARE AFTER ═════════════════════════════
      for (const mw of this.middlewares) {
        if (mw.afterExecute) {
          try {
            mw.afterExecute(processedCommand, result);
          } catch (err) {
            logger.error('COMMAND-ENGINE', `Middleware "${mw.name}" afterExecute error:`, err);
          }
        }
      }

      return result;

    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      logger.error('COMMAND-ENGINE', `Command "${command.type}" failed:`, error);
      return this.fail(command, error, startTime);
    }
  }

  // ── Command Validators ───────────────────────────────────────

  private validateCommand(command: Command): string | null {
    if (!command.type) return 'Command missing type';
    if (!command.payload) return 'Command missing payload';
    if (!command.id) return 'Command missing id';
    if (!command.timestamp) return 'Command missing timestamp';
    return null;
  }

  // ── Command Executors ─────────────────────────────────────────
  // Each command type has a dedicated executor that produces
  // immutable patches via produceWithPatches.

  private executeCommand(
    schema: ScreenSchema,
    command: Command
  ): {
    success: boolean;
    schema: ScreenSchema | null;
    forwardPatches: Patch[];
    inversePatches: Patch[];
    affectedBlockIds: string[];
    affectedBlockTypes: string[];
    primaryBlockId?: string;
    warnings: string[];
    error?: string;
  } {
    const blocks = schema.blocks;
    const warnings: string[] = [];

    switch (command.type) {
      // ═══ BLOCK CRUD ══════════════════════════════════════

      case 'insert-block': {
        const payload = command.payload as InsertBlockPayload;
        const rawBlock = this.createDefaultBlock(payload.blockType, payload.initialData);
        const normResult = normalizeBlock(rawBlock, { source: `insert:${payload.blockType}` });
        warnings.push(...normResult.warnings);
        const block = normResult.block;

        const [newBlocks, forward, inverse] = produceWithPatches(blocks, draft => {
          if (payload.afterId) {
            insertBlock(draft as SchemaBlock[], block, { afterId: payload.afterId });
          } else if (payload.atIndex !== undefined) {
            insertBlock(draft as SchemaBlock[], block, { atIndex: payload.atIndex });
          } else {
            // Append at end
            (draft as SchemaBlock[]).push(block);
          }
        });

        return {
          success: true,
          schema: { ...schema, blocks: newBlocks as SchemaBlock[] },
          forwardPatches: forward,
          inversePatches: inverse,
          affectedBlockIds: [block.id!],
          affectedBlockTypes: [block.type],
          primaryBlockId: block.id,
          warnings,
        };
      }

      case 'update-block': {
        const payload = command.payload as UpdateBlockPayload;
        const owner = findBlockOwner(blocks, payload.blockId);
        if (!owner) {
          return this.executionError(`Block "${payload.blockId}" not found`);
        }

        const [newBlocks, forward, inverse] = produceWithPatches(blocks, draft => {
          if (owner.kind === 'top-level') {
            const existing = (draft as SchemaBlock[])[owner.index];
            (draft as SchemaBlock[])[owner.index] = deepMergeBlock(existing, payload.updates) as SchemaBlock;
          } else if (owner.kind === 'ftab-tab') {
            const ft = (draft as SchemaBlock[])[owner.blockIndex] as unknown as { tabs?: Array<{ content?: SchemaBlock[] }> };
            const target = ft.tabs?.[owner.tabIndex]?.content?.[owner.childIndex];
            if (target) {
              Object.assign(target, deepMergeBlock(target, payload.updates));
            }
          } else if (owner.kind === 'materi-section') {
            const ms = (draft as SchemaBlock[])[owner.blockIndex] as unknown as { content?: SchemaBlock[] };
            const target = ms.content?.[owner.childIndex];
            if (target) {
              Object.assign(target, deepMergeBlock(target, payload.updates));
            }
          } else if (owner.kind === 'children') {
            const target = (draft as SchemaBlock[])[owner.blockIndex].children?.[owner.childIndex];
            if (target) {
              Object.assign(target, deepMergeBlock(target, payload.updates));
            }
          }
        });

        const blockType = owner.kind === 'top-level' ? blocks[owner.index].type : 'nested';

        return {
          success: true,
          schema: { ...schema, blocks: newBlocks as SchemaBlock[] },
          forwardPatches: forward,
          inversePatches: inverse,
          affectedBlockIds: [payload.blockId],
          affectedBlockTypes: [blockType],
          primaryBlockId: payload.blockId,
          warnings,
        };
      }

      case 'delete-block': {
        const payload = command.payload as DeleteBlockPayload;
        const owner = findBlockOwner(blocks, payload.blockId);
        if (!owner) {
          return this.executionError(`Block "${payload.blockId}" not found`);
        }

        const [newBlocks, forward, inverse] = produceWithPatches(blocks, draft => {
          if (owner.kind === 'top-level') {
            (draft as SchemaBlock[]).splice(owner.index, 1);
          } else if (owner.kind === 'ftab-tab') {
            const ft = (draft as SchemaBlock[])[owner.blockIndex] as unknown as { tabs?: Array<{ content?: SchemaBlock[] }> };
            ft.tabs?.[owner.tabIndex]?.content?.splice(owner.childIndex, 1);
          } else if (owner.kind === 'materi-section') {
            const ms = (draft as SchemaBlock[])[owner.blockIndex] as unknown as { content?: SchemaBlock[] };
            ms.content?.splice(owner.childIndex, 1);
          } else if (owner.kind === 'children') {
            (draft as SchemaBlock[])[owner.blockIndex].children?.splice(owner.childIndex, 1);
          }
        });

        const blockType = owner.kind === 'top-level' ? blocks[owner.index].type : 'nested';

        return {
          success: true,
          schema: { ...schema, blocks: newBlocks as SchemaBlock[] },
          forwardPatches: forward,
          inversePatches: inverse,
          affectedBlockIds: [payload.blockId],
          affectedBlockTypes: [blockType],
          primaryBlockId: payload.blockId,
          warnings,
        };
      }

      case 'duplicate-block': {
        const payload = command.payload as DuplicateBlockPayload;
        const { clonedBlock, newBlocks: resultBlocks } = duplicateBlockImmutable(blocks, payload.blockId, { newId: payload.newId });

        // Need patches for undo/redo — re-run with produceWithPatches
        const [newBlocks, forward, inverse] = produceWithPatches(blocks, draft => {
          const idx = (draft as SchemaBlock[]).findIndex(b => b.id === payload.blockId);
          if (idx !== -1) {
            // Find the cloned block in resultBlocks and insert after original
            const cloned = resultBlocks.find(b => b.id !== blocks.find(bb => bb.id === payload.blockId)?.id && b.type === blocks[idx].type);
            if (cloned) {
              (draft as SchemaBlock[]).splice(idx + 1, 0, cloned);
            }
          }
        });

        return {
          success: true,
          schema: { ...schema, blocks: newBlocks as SchemaBlock[] },
          forwardPatches: forward,
          inversePatches: inverse,
          affectedBlockIds: [payload.blockId, clonedBlock.id ?? ''],
          affectedBlockTypes: [clonedBlock.type],
          primaryBlockId: clonedBlock.id,
          warnings,
        };
      }

      case 'move-block': {
        const payload = command.payload as MoveBlockPayload;
        const [newBlocks, forward, inverse] = produceWithPatches(blocks, draft => {
          const moved = moveBlockImmutable(draft as SchemaBlock[], payload.fromIndex, payload.toIndex);
          // moveBlockImmutable returns new array, need to apply to draft
          (draft as SchemaBlock[]).length = 0;
          (draft as SchemaBlock[]).push(...moved);
        });

        const block = blocks[payload.fromIndex];

        return {
          success: true,
          schema: { ...schema, blocks: newBlocks as SchemaBlock[] },
          forwardPatches: forward,
          inversePatches: inverse,
          affectedBlockIds: [block?.id ?? ''],
          affectedBlockTypes: [block?.type ?? 'unknown'],
          primaryBlockId: block?.id,
          warnings,
        };
      }

      case 'reorder-blocks': {
        const payload = command.payload as MoveBlockPayload;
        const [newBlocks, forward, inverse] = produceWithPatches(blocks, draft => {
          const moved = moveBlockImmutable(draft as SchemaBlock[], payload.fromIndex, payload.toIndex);
          (draft as SchemaBlock[]).length = 0;
          (draft as SchemaBlock[]).push(...moved);
        });

        return {
          success: true,
          schema: { ...schema, blocks: newBlocks as SchemaBlock[] },
          forwardPatches: forward,
          inversePatches: inverse,
          affectedBlockIds: blocks.map(b => b.id ?? '').filter(Boolean),
          affectedBlockTypes: [blocks[0]?.type ?? 'unknown'],
          warnings,
        };
      }

      // ═══ BLOCK POSITIONING ═══════════════════════════════

      case 'nudge-blocks': {
        const payload = command.payload as NudgeBlocksPayload;
        const [newBlocks, forward, inverse] = produceWithPatches(blocks, draft => {
          for (const blockId of payload.blockIds) {
            const block = (draft as SchemaBlock[]).find(b => b.id === blockId);
            if (block && isSpatialLayout(block.layout) && block.layout.position === 'absolute') {
              if (block.layout.x !== undefined) block.layout.x += payload.dx;
              if (block.layout.y !== undefined) block.layout.y += payload.dy;
            }
          }
        });

        return {
          success: true,
          schema: { ...schema, blocks: newBlocks as SchemaBlock[] },
          forwardPatches: forward,
          inversePatches: inverse,
          affectedBlockIds: payload.blockIds,
          affectedBlockTypes: payload.blockIds.map(id => blocks.find(b => b.id === id)?.type ?? 'unknown'),
          warnings,
        };
      }

      case 'align-blocks': {
        const payload = command.payload as AlignBlocksPayload;
        const absoluteBlocks = payload.blockIds
          .map(id => ({ id, block: findBlockById(blocks, id) }))
          .filter(({ block }) => block && isSpatialLayout(block.layout) && block.layout.position === 'absolute');

        if (absoluteBlocks.length < 2) {
          return this.executionError('Need at least 2 absolute blocks for alignment');
        }

        const [newBlocks, forward, inverse] = produceWithPatches(blocks, draft => {
          for (const { id } of absoluteBlocks) {
            const block = (draft as SchemaBlock[]).find(b => b.id === id);
            if (block && isSpatialLayout(block.layout) && block.layout.position === 'absolute') {
              // Simplified alignment — full implementation in ui-slice
              // The command engine delegates complex geometry to the executor
            }
          }
        });

        return {
          success: true,
          schema: { ...schema, blocks: newBlocks as SchemaBlock[] },
          forwardPatches: forward,
          inversePatches: inverse,
          affectedBlockIds: payload.blockIds,
          affectedBlockTypes: absoluteBlocks.map(({ block }) => block!.type),
          warnings,
        };
      }

      case 'distribute-blocks': {
        const payload = command.payload as DistributeBlocksPayload;
        // Similar to align but with distribution logic
        const [newBlocks, forward, inverse] = produceWithPatches(blocks, draft => {
          // Distribution logic is delegated to ui-slice's existing implementation
        });

        return {
          success: true,
          schema: { ...schema, blocks: newBlocks as SchemaBlock[] },
          forwardPatches: forward,
          inversePatches: inverse,
          affectedBlockIds: payload.blockIds,
          affectedBlockTypes: [],
          warnings,
        };
      }

      // ═══ SCENE OPERATIONS ════════════════════════════════

      case 'split-scene': {
        const payload = command.payload as SplitScenePayload;
        const result = splitScene(schema, payload.blockId);
        if (!result) {
          return this.executionError(`splitScene failed at block "${payload.blockId}"`);
        }

        const [newBlocks, forward, inverse] = produceWithPatches(blocks, draft => {
          const newSchemaBlocks = result[0].blocks;
          (draft as SchemaBlock[]).length = 0;
          (draft as SchemaBlock[]).push(...newSchemaBlocks);
        });

        return {
          success: true,
          schema: { ...schema, blocks: newBlocks as SchemaBlock[] },
          forwardPatches: forward,
          inversePatches: inverse,
          affectedBlockIds: [payload.blockId],
          affectedBlockTypes: [findBlockById(blocks, payload.blockId)?.type ?? 'unknown'],
          primaryBlockId: payload.blockId,
          warnings,
        };
      }

      case 'merge-scene': {
        const payload = command.payload as MergeScenePayload;
        // Merge with next page — caller provides the next page's schema
        // This is a page-level operation, handled differently

        return {
          success: true,
          schema,
          forwardPatches: [],
          inversePatches: [],
          affectedBlockIds: [],
          affectedBlockTypes: [],
          warnings: ['merge-scene is a page-level operation — use page-level commands'],
        };
      }

      case 'rebalance-page': {
        // Rebalance is handled by SceneTransaction, not directly here
        // This command type exists for journaling purposes
        return {
          success: true,
          schema,
          forwardPatches: [],
          inversePatches: [],
          affectedBlockIds: [],
          affectedBlockTypes: [],
          warnings: ['rebalance-page delegates to SceneTransaction'],
        };
      }

      // ═══ CUSTOM MUTATION ═════════════════════════════════

      case 'custom-mutation': {
        const payload = command.payload as CustomMutationPayload;
        const [newSchema, forward, inverse] = produceWithPatches(schema, draft => {
          const result = payload.fn(draft as ScreenSchema);
          // If the fn returns a new schema, apply it
          if (result && result !== draft) {
            Object.assign(draft, result);
          }
        });

        return {
          success: true,
          schema: newSchema as ScreenSchema,
          forwardPatches: forward,
          inversePatches: inverse,
          affectedBlockIds: [],
          affectedBlockTypes: [],
          warnings,
        };
      }

      default: {
        return this.executionError(`Unknown command type: "${command.type}"`);
      }
    }
  }

  // ── Helpers ───────────────────────────────────────────────────

  private createDefaultBlock(blockType: string, initialData?: Partial<SchemaBlock>): SchemaBlock {
    return {
      type: blockType,
      id: undefined, // Will be generated by normalizeBlock
      ...initialData,
    } as SchemaBlock;
  }

  private executionError(error: string) {
    return {
      success: false as const,
      schema: null as ScreenSchema | null,
      forwardPatches: [] as Patch[],
      inversePatches: [] as Patch[],
      affectedBlockIds: [] as string[],
      affectedBlockTypes: [] as string[],
      warnings: [] as string[],
      error,
    };
  }

  private fail(command: Command, error: string, startTime: number): CommandResult {
    const durationMs = performance.now() - startTime;

    // Record failure in journal
    if (!command.skipJournal) {
      operationJournal.record(command, {
        success: false,
        durationMs,
        error,
      });
    }

    // Notify error middlewares
    for (const mw of this.middlewares) {
      if (mw.onError) {
        try {
          mw.onError(command, new Error(error));
        } catch {
          // Middleware errors must not cascade
        }
      }
    }

    return {
      success: false,
      command,
      schema: null,
      forwardPatches: [],
      inversePatches: [],
      warnings: [],
      error,
      durationMs,
    };
  }

  // ── Middleware ─────────────────────────────────────────────────

  /** Add middleware to the pipeline */
  use(middleware: CommandMiddleware): () => void {
    this.middlewares.push(middleware);
    return () => {
      this.middlewares = this.middlewares.filter(m => m !== middleware);
    };
  }

  // ── Lifecycle ─────────────────────────────────────────────────

  /** Enable/disable the command engine */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /** Check if the engine is enabled */
  isEnabled(): boolean {
    return this.enabled;
  }

  /** Get execution count */
  getExecutionCount(): number {
    return this.executionCount;
  }

  /** Reset execution count */
  resetExecutionCount(): void {
    this.executionCount = 0;
  }
}

// ── Global Singleton ─────────────────────────────────────────────

export const commandEngine = new CommandEngine();

// ── Convenience API ──────────────────────────────────────────────
// Quick-access functions for common commands.
// These create commands and delegate to the engine.

export function cmdInsertBlock(
  blockType: string,
  options?: Partial<InsertBlockPayload> & { source?: CommandSource; pageIndex?: number; description?: string }
) {
  return commandEngine.createCommand('insert-block', {
    blockType,
    afterId: options?.afterId,
    atIndex: options?.atIndex,
    container: options?.container,
    initialData: options?.initialData,
  } as InsertBlockPayload, {
    source: options?.source,
    pageIndex: options?.pageIndex,
    description: options?.description ?? `Insert ${blockType} block`,
  });
}

export function cmdUpdateBlock(
  blockId: string,
  updates: Record<string, unknown>,
  options?: { source?: CommandSource; pageIndex?: number; description?: string }
) {
  return commandEngine.createCommand('update-block', {
    blockId,
    updates,
  } as UpdateBlockPayload, {
    source: options?.source,
    pageIndex: options?.pageIndex,
    description: options?.description ?? `Update block ${blockId}`,
  });
}

export function cmdDeleteBlock(
  blockId: string,
  options?: { source?: CommandSource; pageIndex?: number; description?: string }
) {
  return commandEngine.createCommand('delete-block', {
    blockId,
  } as DeleteBlockPayload, {
    source: options?.source,
    pageIndex: options?.pageIndex,
    description: options?.description ?? `Delete block ${blockId}`,
  });
}

export function cmdDuplicateBlock(
  blockId: string,
  options?: { newId?: string; source?: CommandSource; pageIndex?: number; description?: string }
) {
  return commandEngine.createCommand('duplicate-block', {
    blockId,
    newId: options?.newId,
  } as DuplicateBlockPayload, {
    source: options?.source,
    pageIndex: options?.pageIndex,
    description: options?.description ?? `Duplicate block ${blockId}`,
  });
}

export function cmdMoveBlock(
  fromIndex: number,
  toIndex: number,
  options?: { source?: CommandSource; pageIndex?: number; description?: string }
) {
  return commandEngine.createCommand('move-block', {
    blockId: '',
    fromIndex,
    toIndex,
  } as MoveBlockPayload, {
    source: options?.source,
    pageIndex: options?.pageIndex,
    description: options?.description ?? `Move block from ${fromIndex} to ${toIndex}`,
  });
}
