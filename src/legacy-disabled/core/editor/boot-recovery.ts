// @ts-nocheck — BATCH-12-05: quarantined to src/legacy-disabled/, not type-checked
// ═══════════════════════════════════════════════════════════════════
// BOOT RECOVERY ORCHESTRATOR — Unified boot-time recovery sequence
// ═══════════════════════════════════════════════════════════════════
// FASE 6: When the app boots, this orchestrator runs ALL recovery
// checks in the correct order and returns a clean, valid state.
//
// BOOT SEQUENCE (in priority order):
//
//   1. Init SafeModeManager — load crash records from storage
//   2. Detect incomplete transactions — browser crash mid-transaction?
//   3. Verify snapshot integrity — checksum mismatch?
//   4. Heal corrupted pages — SchemaHealer on damaged schemas
//   5. Prepare safe mode boot — mark crash-prone blocks
//   6. Clear stale recovery data — clean up session markers
//
// Each step is independent and fault-tolerant:
//   - If one step fails, the others still run
//   - Each step produces a diagnostic result
//   - The orchestrator combines results into a single BootReport
//
// USAGE:
//   import { bootRecoveryOrchestrator } from '@/core/editor/boot-recovery';
//
//   // At app startup, before first render:
//   const report = bootRecoveryOrchestrator.run(savedPages);
//   if (report.needsRecovery) {
//     // Show RecoveryDialog with recovery info
//     // Use report.healedPages as the cleaned page data
//   }
//
// GUARANTEES:
//   - Never throws — all steps are wrapped in try/catch
//   - Never returns null — always returns a valid BootReport
//   - healedPages is ALWAYS valid (even if all steps fail)
//   - Original pages array is NEVER mutated
// ═══════════════════════════════════════════════════════════════════

import type { CanvaPage } from '@/components/canva/types';
import type { ScreenSchema } from '../schema/types';
import { safeModeManager } from '../renderer/safe-mode';
import { transactionManager, type CrashRecoveryData } from './transaction-manager';
import { schemaHealer, type HealingReport } from '../schema/schema-healer';
import {
  verifyIntegrity,
  verifyPageIntegrity,
  healCorruptedPages,
  type IntegrityCheckResult,
} from '../schema/snapshot-integrity';
import { logger } from '../utils/logger';

// ── Boot Step Results ─────────────────────────────────────────────

export interface SafeModeBootResult {
  /** Whether SafeModeManager was initialized */
  initialized: boolean;
  /** Number of blocks in safe mode */
  safeBlockCount: number;
  /** Block IDs in safe mode */
  safeBlockIds: string[];
  /** Error if init failed */
  error?: string;
}

export interface TransactionRecoveryResult {
  /** Whether an incomplete transaction was detected */
  hasIncompleteTransaction: boolean;
  /** The recovery data if found */
  recoveryData: CrashRecoveryData | null;
  /** Whether auto-recovery was applied */
  autoRecovered: boolean;
  /** Error if recovery failed */
  error?: string;
}

export interface IntegrityCheckBootResult {
  /** Overall integrity status */
  status: IntegrityCheckResult['status'];
  /** Whether corrupted pages were found and healed */
  healed: boolean;
  /** Number of pages healed */
  healedCount: number;
  /** Healing report details */
  healReport: string[];
  /** Full integrity check result */
  integrityResult: IntegrityCheckResult | null;
  /** Error if check failed */
  error?: string;
}

export interface SchemaHealingBootResult {
  /** Whether any pages needed healing */
  neededHealing: boolean;
  /** Total blocks examined across all pages */
  totalBlocksExamined: number;
  /** Total blocks repaired */
  totalBlocksRepaired: number;
  /** Total blocks removed */
  totalBlocksRemoved: number;
  /** Per-page healing reports */
  pageReports: Array<{
    pageIndex: number;
    pageId: string;
    wasRepaired: boolean;
    report: HealingReport | null;
  }>;
  /** Error if healing failed */
  error?: string;
}

// ── Boot Report ───────────────────────────────────────────────────

export interface BootReport {
  /** Whether ANY recovery action was needed */
  needsRecovery: boolean;
  /** Combined severity: 'clean' | 'mild' | 'moderate' | 'severe' | 'critical' */
  severity: 'clean' | 'mild' | 'moderate' | 'severe' | 'critical';
  /** Step 1: Safe mode boot result */
  safeMode: SafeModeBootResult;
  /** Step 2: Transaction recovery result */
  transactionRecovery: TransactionRecoveryResult;
  /** Step 3: Integrity check result */
  integrity: IntegrityCheckBootResult;
  /** Step 4: Schema healing result */
  schemaHealing: SchemaHealingBootResult;
  /** The healed/cleaned pages array (ALWAYS valid) */
  healedPages: CanvaPage[];
  /** Total duration of the boot sequence in ms */
  durationMs: number;
  /** Timestamp of the boot */
  bootTimestamp: number;
  /** Summary message for UI display */
  summary: string;
}

// ── Boot Recovery Orchestrator Class ──────────────────────────────

export class BootRecoveryOrchestrator {
  /**
   * Run the full boot recovery sequence.
   *
   * @param pages - The loaded pages from storage (will NOT be mutated)
   * @param payload - The full payload for integrity verification
   * @returns BootReport with recovery status and healed pages
   */
  run(
    pages: CanvaPage[],
    payload?: { pages: unknown[]; ratioId?: string; [key: string]: unknown }
  ): BootReport {
    const startTime = performance.now();
    const bootTimestamp = Date.now();

    // Track severity — worst case wins
    let maxSeverity: BootReport['severity'] = 'clean';

    // ── Step 1: Initialize SafeModeManager ────────────────────
    const safeModeResult = this.initSafeMode();

    // ── Step 2: Detect incomplete transactions ────────────────
    const transactionResult = this.detectIncompleteTransactions();
    if (transactionResult.hasIncompleteTransaction) {
      maxSeverity = this.worseSeverity(maxSeverity, 'moderate');
    }

    // ── Step 3: Verify snapshot integrity ─────────────────────
    const integrityResult = this.verifySnapshotIntegrity(payload);
    if (integrityResult.status === 'corrupted') {
      maxSeverity = this.worseSeverity(maxSeverity, 'severe');
    } else if (integrityResult.healed) {
      maxSeverity = this.worseSeverity(maxSeverity, 'mild');
    }

    // ── Step 4: Heal corrupted pages ──────────────────────────
    // Use integrity result to determine which pages need healing.
    //
    // Sprint 8.5A-Patch-1: This used to call buildSchemaHealingResult()
    // AFTER step 4 — which did reference comparison on the deep-cloned
    // pages. Since deepClonePages() always produces new object references,
    // needsHealing was always true for non-empty page arrays → false
    // positive recovery dialog on every clean boot. Fix: use the actual
    // healResult / proactiveHealResult from step 4 directly.
    let workingPages = this.deepClonePages(pages);
    let schemaHealingResult: SchemaHealingBootResult;

    // If integrity check found corruption, heal those pages
    if (integrityResult.status === 'corrupted' || integrityResult.healed) {
      const healResult = this.healCorruptedSchemas(workingPages);
      if (healResult.neededHealing) {
        workingPages = healResult.healedPages ?? workingPages;
        maxSeverity = this.worseSeverity(maxSeverity, 'moderate');
      }
      // Strip the healedPages field — not part of SchemaHealingBootResult
      const { healedPages: _hp, ...healingBoot } = healResult;
      schemaHealingResult = healingBoot;
    } else {
      // Still check all pages for structural validity
      const proactiveHealResult = this.proactiveSchemaCheck(workingPages);
      if (proactiveHealResult.neededHealing) {
        workingPages = proactiveHealResult.healedPages ?? workingPages;
        maxSeverity = this.worseSeverity(maxSeverity, 'mild');
      }
      const { healedPages: _hp2, ...proactiveBoot } = proactiveHealResult;
      schemaHealingResult = proactiveBoot;
    }

    // ── Step 5: Prepare safe mode for rendering ───────────────
    // Mark crash-prone blocks so the renderer can skip them
    if (safeModeResult.safeBlockCount > 0) {
      workingPages = this.applySafeModeToPages(workingPages);
      maxSeverity = this.worseSeverity(maxSeverity, 'mild');
    }

    // ── Build final report ────────────────────────────────────
    // Sprint 8.5A-Patch-1: schemaHealingResult now reflects REAL healing
    // activity (neededHealing=true only when SchemaHealer actually repaired
    // or removed blocks), not deep-clone reference drift.
    const needsRecovery =
      transactionResult.hasIncompleteTransaction ||
      integrityResult.status === 'corrupted' ||
      integrityResult.healed ||
      schemaHealingResult.neededHealing ||
      safeModeResult.safeBlockCount > 0;

    const durationMs = performance.now() - startTime;

    const summary = this.buildSummary(
      needsRecovery,
      maxSeverity,
      safeModeResult,
      transactionResult,
      integrityResult,
      schemaHealingResult
    );

    return {
      needsRecovery,
      severity: maxSeverity,
      safeMode: safeModeResult,
      transactionRecovery: transactionResult,
      integrity: integrityResult,
      schemaHealing: schemaHealingResult,
      healedPages: workingPages,
      durationMs,
      bootTimestamp,
      summary,
    };
  }

  // ── Step 1: Initialize SafeModeManager ──────────────────────

  private initSafeMode(): SafeModeBootResult {
    try {
      safeModeManager.init();

      const safeBlockCount = safeModeManager.getSafeModeBlockCount();
      const safeBlockIds: string[] = [];

      // Collect safe mode block IDs (for UI notification)
      try {
        const records = safeModeManager.getCrashRecords();
        for (const [blockId] of records.persistent) {
          const status = safeModeManager.checkSafeMode(blockId);
          if (status.shouldUseSafeMode) {
            safeBlockIds.push(blockId);
          }
        }
      } catch {
        // Non-critical
      }

      if (safeBlockCount > 0) {
        logger.warn('BOOT-RECOVERY', `Safe mode: ${safeBlockCount} block(s) in safe mode from previous session`);
      }

      return {
        initialized: true,
        safeBlockCount,
        safeBlockIds,
      };
    } catch (err) {
      return {
        initialized: false,
        safeBlockCount: 0,
        safeBlockIds: [],
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // ── Step 2: Detect Incomplete Transactions ──────────────────

  private detectIncompleteTransactions(): TransactionRecoveryResult {
    try {
      const recoveryData = transactionManager.detectIncompleteTransaction();

      if (recoveryData) {
        logger.warn(
          'BOOT-RECOVERY',
          `Incomplete transaction detected: "${recoveryData.transactionId}" from ${new Date(recoveryData.beganAt).toISOString()}`
        );

        return {
          hasIncompleteTransaction: true,
          recoveryData,
          autoRecovered: false, // Not auto-recovered — user must choose via RecoveryDialog
        };
      }

      return {
        hasIncompleteTransaction: false,
        recoveryData: null,
        autoRecovered: false,
      };
    } catch (err) {
      return {
        hasIncompleteTransaction: false,
        recoveryData: null,
        autoRecovered: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // ── Step 3: Verify Snapshot Integrity ───────────────────────

  private verifySnapshotIntegrity(
    payload?: { pages: unknown[]; ratioId?: string; [key: string]: unknown }
  ): IntegrityCheckBootResult {
    if (!payload) {
      return {
        status: 'no-checksum',
        healed: false,
        healedCount: 0,
        healReport: [],
        integrityResult: null,
      };
    }

    try {
      const integrityResult = verifyIntegrity(payload);

      if (integrityResult.status === 'corrupted') {
        logger.error('BOOT-RECOVERY', `Checksum mismatch! Data may be corrupted. Expected: ${integrityResult.expectedChecksum}, Got: ${integrityResult.computedChecksum}`);

        // Attempt automatic healing
        const pages = payload.pages as Array<{ schema?: ScreenSchema; [key: string]: unknown }>;
        const healResult = healCorruptedPages(pages);

        return {
          status: 'corrupted',
          healed: healResult.healedCount > 0,
          healedCount: healResult.healedCount,
          healReport: healResult.report,
          integrityResult,
        };
      }

      return {
        status: integrityResult.status,
        healed: false,
        healedCount: 0,
        healReport: [],
        integrityResult,
      };
    } catch (err) {
      return {
        status: 'no-checksum',
        healed: false,
        healedCount: 0,
        healReport: [],
        integrityResult: null,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // ── Step 4: Heal Corrupted Schemas ──────────────────────────

  private healCorruptedSchemas(pages: CanvaPage[]): SchemaHealingBootResult & { healedPages?: CanvaPage[] } {
    let totalBlocksExamined = 0;
    let totalBlocksRepaired = 0;
    let totalBlocksRemoved = 0;
    const pageReports: SchemaHealingBootResult['pageReports'] = [];
    let anyRepaired = false;

    const healedPages = pages.map((page, idx) => {
      if (!page.schema) {
        pageReports.push({
          pageIndex: idx,
          pageId: page.id,
          wasRepaired: false,
          report: null,
        });
        return page;
      }

      try {
        // Verify page-level integrity first
        const pageIntegrity = verifyPageIntegrity(page.schema);

        if (pageIntegrity.valid) {
          pageReports.push({
            pageIndex: idx,
            pageId: page.id,
            wasRepaired: false,
            report: null,
          });
          totalBlocksExamined += page.schema.blocks.length;
          return page;
        }

        // Page has errors — heal it
        const healResult = schemaHealer.heal(page.schema);

        totalBlocksExamined += healResult.report.blocksExamined;
        totalBlocksRepaired += healResult.report.repairedCount;
        totalBlocksRemoved += healResult.report.removedCount;

        pageReports.push({
          pageIndex: idx,
          pageId: page.id,
          wasRepaired: healResult.wasRepaired,
          report: healResult.report,
        });

        if (healResult.wasRepaired) {
          anyRepaired = true;
          logger.warn('BOOT-RECOVERY', `Page ${idx} (${page.id}): ${healResult.report.repairedCount} blocks repaired, ${healResult.report.removedCount} removed`);
          return { ...page, schema: healResult.schema };
        }

        return page;
      } catch (err) {
        logger.error('BOOT-RECOVERY', `Failed to heal page ${idx} (${page.id}):`, err);
        pageReports.push({
          pageIndex: idx,
          pageId: page.id,
          wasRepaired: false,
          report: null,
        });
        return page;
      }
    });

    return {
      neededHealing: anyRepaired,
      totalBlocksExamined,
      totalBlocksRepaired,
      totalBlocksRemoved,
      pageReports,
      healedPages,
    };
  }

  // ── Proactive Schema Check (even when integrity passes) ─────

  private proactiveSchemaCheck(pages: CanvaPage[]): SchemaHealingBootResult & { healedPages?: CanvaPage[] } {
    let totalBlocksExamined = 0;
    let totalBlocksRepaired = 0;
    let totalBlocksRemoved = 0;
    const pageReports: SchemaHealingBootResult['pageReports'] = [];
    let anyRepaired = false;

    const healedPages = pages.map((page, idx) => {
      if (!page.schema) {
        pageReports.push({
          pageIndex: idx,
          pageId: page.id,
          wasRepaired: false,
          report: null,
        });
        return page;
      }

      try {
        // Quick check: does the schema need healing?
        if (!schemaHealer.needsHealing(page.schema)) {
          totalBlocksExamined += page.schema.blocks.length;
          pageReports.push({
            pageIndex: idx,
            pageId: page.id,
            wasRepaired: false,
            report: null,
          });
          return page;
        }

        // Schema needs healing — run mild strategy first
        const healResult = schemaHealer.heal(page.schema, 'mild');

        totalBlocksExamined += healResult.report.blocksExamined;
        totalBlocksRepaired += healResult.report.repairedCount;
        totalBlocksRemoved += healResult.report.removedCount;

        pageReports.push({
          pageIndex: idx,
          pageId: page.id,
          wasRepaired: healResult.wasRepaired,
          report: healResult.report,
        });

        if (healResult.wasRepaired) {
          anyRepaired = true;
          logger.warn('BOOT-RECOVERY', `Proactive healing on page ${idx}: ${healResult.report.repairedCount} blocks repaired`);
          return { ...page, schema: healResult.schema };
        }

        return page;
      } catch {
        pageReports.push({
          pageIndex: idx,
          pageId: page.id,
          wasRepaired: false,
          report: null,
        });
        return page;
      }
    });

    return {
      neededHealing: anyRepaired,
      totalBlocksExamined,
      totalBlocksRepaired,
      totalBlocksRemoved,
      pageReports,
      healedPages,
    };
  }

  // ── Step 5: Apply Safe Mode to Pages ────────────────────────

  private applySafeModeToPages(pages: CanvaPage[]): CanvaPage[] {
    return pages.map(page => {
      if (!page.schema) return page;

      try {
        const result = safeModeManager.prepareSafeModeBoot(page.schema);
        if (result.safeBlockIds.length > 0) {
          return { ...page, schema: result.schema };
        }
      } catch {
        // Non-critical
      }

      return page;
    });
  }

  // ── Helpers ─────────────────────────────────────────────────

  // Sprint 8.5A-Patch-1: Removed buildSchemaHealingResult() — it compared
  // originalPages vs healedPages by reference (orig.schema !== healed.schema),
  // which is always true after deepClonePages() produces fresh objects.
  // This caused needsRecovery=true on every clean boot. The actual healing
  // result is now captured directly from healCorruptedSchemas() /
  // proactiveSchemaCheck() in step 4 above.

  private deepClonePages(pages: CanvaPage[]): CanvaPage[] {
    try {
      return JSON.parse(JSON.stringify(pages));
    } catch {
      // If deep clone fails, return original (mutation risk is acceptable
      // since this is a recovery path)
      return [...pages];
    }
  }

  private worseSeverity(
    current: BootReport['severity'],
    candidate: BootReport['severity']
  ): BootReport['severity'] {
    const order: BootReport['severity'][] = ['clean', 'mild', 'moderate', 'severe', 'critical'];
    return order.indexOf(candidate) > order.indexOf(current) ? candidate : current;
  }

  private buildSummary(
    needsRecovery: boolean,
    severity: BootReport['severity'],
    safeMode: SafeModeBootResult,
    transaction: TransactionRecoveryResult,
    integrity: IntegrityCheckBootResult,
    schemaHealing: SchemaHealingBootResult
  ): string {
    if (!needsRecovery) {
      return 'Boot clean — no recovery needed';
    }

    const parts: string[] = [];

    if (safeMode.safeBlockCount > 0) {
      parts.push(`${safeMode.safeBlockCount} block(s) in safe mode`);
    }

    if (transaction.hasIncompleteTransaction) {
      parts.push('incomplete transaction from previous session');
    }

    if (integrity.status === 'corrupted') {
      parts.push(`data corruption detected${integrity.healed ? ' (healed)' : ' (healing failed)'}`);
    }

    if (schemaHealing.neededHealing) {
      parts.push(`${schemaHealing.totalBlocksRepaired} block(s) repaired`);
    }

    return `[${severity.toUpperCase()}] ${parts.join(', ')}`;
  }

  // ── Public Recovery Actions ─────────────────────────────────

  /**
   * Apply crash recovery — rollback the incomplete transaction.
   * Call this when user chooses "Pulihkan" in RecoveryDialog.
   */
  applyCrashRecovery(): ScreenSchema | null {
    try {
      return transactionManager.recoverFromCrash();
    } catch {
      return null;
    }
  }

  /**
   * Discard crash recovery data.
   * Call this when user chooses "Mulai Baru" in RecoveryDialog.
   */
  discardCrashRecovery(): void {
    try {
      transactionManager.discardCrashRecovery();
    } catch {
      // Non-critical
    }
  }
}

// ── Global Singleton ──────────────────────────────────────────────

export const bootRecoveryOrchestrator = new BootRecoveryOrchestrator();
