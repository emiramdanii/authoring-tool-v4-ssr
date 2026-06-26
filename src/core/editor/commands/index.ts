// ═══════════════════════════════════════════════════════════════════
// COMMAND ENGINE — Public API
// ═══════════════════════════════════════════════════════════════════
// FASE 5: Deterministic Editing Engine
//
// Every edit flows through: intent → command → validate → execute → commit
//
// USAGE:
//   import { commandEngine, cmdUpdateBlock, cmdInsertBlock } from '@/core/editor/commands';
//
//   // Create and execute a command
//   const command = cmdUpdateBlock('block-123', { title: 'New Title' });
//   const result = commandEngine.execute(currentSchema, command);
//
//   if (result.success) {
//     // Write to store
//     const newPages = [...pages];
//     newPages[pageIndex] = { ...page, schema: result.schema };
//     set({ pages: newPages });
//   }
//
// ASYNC OPERATIONS:
//   import { asyncBoundary } from '@/core/editor/commands';
//
//   // Stage AI-generated content
//   const operationId = asyncBoundary.stageSchemaReplacement('ai', newSchema);
//
//   // Commit when ready
//   asyncBoundary.commitOperation(operationId);
//
// NORMALIZATION:
//   import { normalizeBlock } from '@/core/editor/commands';
//
//   const result = normalizeBlock(rawBlock);
//   // result.block is now safe to insert
//   // result.warnings contains any normalization notes
//
// JOURNAL:
//   import { operationJournal } from '@/core/editor/commands';
//
//   // Query recent operations
//   const recent = operationJournal.getRecent(20);
//
//   // Filter by source
//   const aiOps = operationJournal.query({ source: 'ai' });
//
// DETERMINISM:
//   import { renderDeterminismChecker } from '@/core/editor/commands';
//
//   // Check render consistency
//   const result = renderDeterminismChecker.check(schema, renderHash);
//   if (!result.consistent) {
//     console.error('Non-deterministic render!', result);
//   }
// ═══════════════════════════════════════════════════════════════════

// ── Types ──
export type {
  CommandType,
  CommandSource,
  Command,
  CommandResult,
  CommandMiddleware,
  // Payload types
  InsertBlockPayload,
  UpdateBlockPayload,
  DeleteBlockPayload,
  DuplicateBlockPayload,
  MoveBlockPayload,
  ReorderBlocksPayload,
  NudgeBlocksPayload,
  AlignBlocksPayload,
  DistributeBlocksPayload,
  ChangeVariantPayload,
  ToggleCompressionPayload,
  SplitScenePayload,
  MergeScenePayload,
  RebalancePagePayload,
  CopyBlockPayload,
  PasteBlockPayload,
  BatchUpdatePayload,
  BatchDeletePayload,
  BatchMovePayload,
  BatchDuplicatePayload,
  BatchVariantPayload,
  BatchCompressionPayload,
  AddPagePayload,
  DeletePagePayload,
  DuplicatePagePayload,
  ReorderPagePayload,
  UpdatePageBackgroundPayload,
  UpdatePageThemePayload,
  CustomMutationPayload,
} from './types';

// ── Command Engine ──
export { CommandEngine, commandEngine, cmdInsertBlock, cmdUpdateBlock, cmdDeleteBlock, cmdDuplicateBlock, cmdMoveBlock } from './command-engine';

// ── Operation Journal ──
export { OperationJournal, operationJournal } from './operation-journal';
export type { JournalEntry, JournalQuery, JournalStats } from './operation-journal';

// ── Schema Normalization ──
export { normalizeBlock, normalizeBlocks, normalizeSchema, isBlockInsertSafe } from './normalize';
export type { NormalizeOptions, NormalizeResult } from './normalize';

// ── Async Boundary ──
export { AsyncBoundary, asyncBoundary } from './async-boundary';
export type { StagedOperation, AsyncBoundaryOptions, AsyncBoundaryEvent } from './async-boundary';

// ── Render Determinism ──
export { RenderDeterminismChecker, renderDeterminismChecker, computeSchemaFingerprint, schemasAreStructurallyEqual } from './render-determinism';
export type { DeterminismViolation, DeterminismAuditResult } from './render-determinism';

// ═══════════════════════════════════════════════════════════════════
// FASE 6: Reliability + Recovery Layer
// ═══════════════════════════════════════════════════════════════════

// ── Transaction Manager (FASE 6.1: Crash Recovery + Rollback) ──
export { TransactionManager, transactionManager } from '../transaction-manager';
export type { TransactionRecord, CrashRecoveryData, TransactionEvent } from '../transaction-manager';

// ── Schema Healer (FASE 6.2: Corruption Repair) ──
export { SchemaHealer, schemaHealer } from '../../schema/schema-healer';
export type { HealingStrategy, HealingAction, HealingReport, HealResult } from '../../schema/schema-healer';

// ── Snapshot Integrity (FASE 6.3: Checksum Verification) ──
export {
  computeChecksum,
  computeSchemaChecksum,
  computePayloadChecksum,
  saveChecksum,
  verifyIntegrity,
  clearChecksum,
  verifyPageIntegrity,
  healCorruptedPages,
} from '../../schema/snapshot-integrity';
export type { IntegrityStatus, IntegrityCheckResult } from '../../schema/snapshot-integrity';

// ── Safe Mode (FASE 6.4: Crash-Causing Block Isolation) ──
export { SafeModeManager, safeModeManager } from '../../renderer/safe-mode';
export type { BlockCrashRecord, SafeModeLevel, SafeModeStatus } from '../../renderer/safe-mode';

// ── Block Error Boundary (FASE 6) ──
export { BlockErrorBoundary } from '../../renderer/BlockErrorBoundary';

// ── Boot Recovery Orchestrator (FASE 6: Unified Boot Sequence) ──
// BATCH-12-05: boot-recovery.ts moved to src/legacy-disabled/. The re-exports
// are commented out because the module is no longer in the active codebase.
// V5 does not use the legacy boot recovery orchestrator — AppErrorBoundary
// in layout.tsx handles runtime errors, and DashboardV5 handles resume.
// export { BootRecoveryOrchestrator, bootRecoveryOrchestrator } from '../boot-recovery';
// export type {
//   BootReport,
//   SafeModeBootResult,
//   TransactionRecoveryResult,
//   IntegrityCheckBootResult,
//   SchemaHealingBootResult,
// } from '../boot-recovery';
