// ═══════════════════════════════════════════════════════════════════
// PERIODIC INTEGRITY CHECK — Validates all page schemas periodically
// ═══════════════════════════════════════════════════════════════════
// FASE 6 of the ROADMAP PEMULIHAN SILSE
//
// Provides a function that validates all page schemas periodically.
// Safe to call every 5 minutes. Repairs are applied in-place.
// ═══════════════════════════════════════════════════════════════════

import type { ScreenSchema } from '@/core/schema/types';
import { computeSchemaHash, repairSchema } from './index';
import { validateSchema } from '@/core/schema/validation';

export interface IntegrityReport {
  checkedAt: number;
  totalPages: number;
  corruptedPages: number;
  repairedPages: number;
  unrecoverablePages: number;
  details: Array<{
    pageId: string;
    pageIndex: number;
    status: 'healthy' | 'repaired' | 'corrupted';
    repairs?: string[];
    unrecoverable?: string[];
  }>;
}

/**
 * Run an integrity check on all page schemas.
 * Returns a report of what was found and repaired.
 * This is safe to call periodically (e.g., every 5 minutes).
 * Repairs are applied in-place to the provided pages array.
 */
export function runIntegrityCheck(
  pages: Array<{ id: string; schema?: ScreenSchema }>,
  options?: { autoRepair?: boolean }
): IntegrityReport {
  const report: IntegrityReport = {
    checkedAt: Date.now(),
    totalPages: pages.length,
    corruptedPages: 0,
    repairedPages: 0,
    unrecoverablePages: 0,
    details: [],
  };

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (!page.schema) continue;

    const validation = validateSchema(page.schema);
    if (validation.valid) {
      report.details.push({ pageId: page.id, pageIndex: i, status: 'healthy' });
      continue;
    }

    report.corruptedPages++;

    if (options?.autoRepair !== false) {
      const repairResult = repairSchema(page.schema);
      if (repairResult.repaired) {
        // Apply repair
        (page as Record<string, unknown>).schema = repairResult.schema;
        report.repairedPages++;
        report.details.push({
          pageId: page.id,
          pageIndex: i,
          status: 'repaired',
          repairs: repairResult.repairs,
          unrecoverable: repairResult.unrecoverable,
        });
      } else {
        report.unrecoverablePages++;
        report.details.push({
          pageId: page.id,
          pageIndex: i,
          status: 'corrupted',
          unrecoverable: repairResult.unrecoverable,
        });
      }
    } else {
      report.details.push({ pageId: page.id, pageIndex: i, status: 'corrupted' });
    }
  }

  return report;
}
