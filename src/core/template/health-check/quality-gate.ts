// ═══════════════════════════════════════════════════════════════════
// TEMPLATE QUALITY GATE — Gatekeeper for template publishing
// ═══════════════════════════════════════════════════════════════════
// Template dibuat → health check → decide status → baru boleh tampil.
//
// Template dengan score <90 atau error >0 TIDAK BOLEH masuk galeri utama.
// Ini menghentikan masalah lama: template banyak → tidak dicek → masuk
// galeri → user pilih → canvas kacau → app terasa rusak.
//
// Flow:
//   createTemplate()
//   → validateTemplate()
//   → decideTemplateStatus()
//   → canPublishTemplate()
//   → gallery visibility
// ═══════════════════════════════════════════════════════════════════

import type { TemplateHealthResult, HealthStatus, TemplateHealthIssue } from '../health-check/types';
import { getHealthStatus } from '../health-check/types';

// ── Template Gate Status ─────────────────────────────────────────

/**
 * Extended template status that includes gate decision.
 * Maps directly to gallery visibility rules.
 */
export type TemplateGateStatus =
  | 'ready'          // 90-100, 0 errors → boleh tampil di galeri utama
  | 'needs-polish'   // 75-89, 0+ errors → boleh tampil dengan badge peringatan
  | 'broken'         // 60-74, 1+ errors → sembunyikan dari template utama
  | 'blocked';       // <60 → jangan dipakai, hidden dari semua view

export interface TemplateGateResult {
  /** Gate status — determines gallery visibility */
  gateStatus: TemplateGateStatus;
  /** Health score (0-100) */
  score: number;
  /** Whether this template can appear in the main gallery */
  canPublish: boolean;
  /** Whether this template can appear with a warning badge */
  canPublishWithWarning: boolean;
  /** Number of blocking errors */
  errorCount: number;
  /** Number of warnings */
  warningCount: number;
  /** Human-readable summary of main problems */
  summary: string;
  /** Suggested next action */
  suggestedAction: string;
  /** Whether auto-repair is available */
  canAutoRepair: boolean;
  /** List of safe auto-repair actions available */
  availableRepairs: AutoRepairType[];
}

// ── Auto Repair Types ────────────────────────────────────────────

export type AutoRepairType =
  | 'fix-font-size'          // Naikkan font ke minimum
  | 'fix-colors'             // Normalisasi ke theme contract
  | 'add-default-feedback'   // Tambah feedback default
  | 'sync-scoring'           // Sinkronkan scoring config
  | 'mark-placeholder';      // Tandai/fokuskan placeholder

export type PreviewRepairType =
  | 'split-page'             // Pecah halaman (butuh preview)
  | 'change-variant'         // Pilih variasi lain (butuh preview)
  | 'fix-navigation-lock';   // Perbaiki navigasi lock (butuh preview)

/** All repair types, categorized by safety level */
export const SAFE_REPAIRS: AutoRepairType[] = [
  'fix-font-size',
  'fix-colors',
  'add-default-feedback',
  'sync-scoring',
  'mark-placeholder',
];

export const PREVIEW_REPAIRS: PreviewRepairType[] = [
  'split-page',
  'change-variant',
  'fix-navigation-lock',
];

// ── Gate Functions ───────────────────────────────────────────────

/**
 * Decide the gate status of a template based on its health result.
 *
 * Rules:
 *   - score >= 90 AND 0 errors → ready (boleh galeri utama)
 *   - score >= 75 AND 0 errors → needs-polish (galeri dengan badge)
 *   - score >= 60 OR any error → broken (sembunyikan)
 *   - score < 60 → blocked (jangan dipakai)
 *
 * Note: ANY error automatically demotes to broken or blocked,
 * regardless of score. This prevents "high score but broken" templates.
 */
export function decideTemplateStatus(result: TemplateHealthResult): TemplateGateResult {
  const errorCount = result.issues.filter(i => i.severity === 'error').length;
  const warningCount = result.issues.filter(i => i.severity === 'warning').length;
  const { score } = result;

  // Determine available repairs
  const availableRepairs = determineAvailableRepairs(result.issues);

  // Determine gate status
  let gateStatus: TemplateGateStatus;
  if (score >= 90 && errorCount === 0) {
    gateStatus = 'ready';
  } else if (score >= 75 && errorCount === 0) {
    gateStatus = 'needs-polish';
  } else if (score >= 60) {
    gateStatus = 'broken';
  } else {
    gateStatus = 'blocked';
  }

  // If there are ANY errors, minimum status is 'broken'
  if (errorCount > 0 && gateStatus === 'needs-polish') {
    gateStatus = 'broken';
  }

  const canPublish = gateStatus === 'ready';
  const canPublishWithWarning = gateStatus === 'needs-polish';

  return {
    gateStatus,
    score,
    canPublish,
    canPublishWithWarning,
    errorCount,
    warningCount,
    summary: generateHumanSummary(result),
    suggestedAction: generateSuggestedAction(gateStatus, result),
    canAutoRepair: availableRepairs.length > 0,
    availableRepairs,
  };
}

/**
 * Can this template be published to the main gallery?
 * Strict rule: score >= 90 AND 0 errors.
 */
export function canPublishTemplate(result: TemplateHealthResult): boolean {
  const gate = decideTemplateStatus(result);
  return gate.canPublish;
}

/**
 * Can this template appear in the gallery with a warning badge?
 * Rule: score >= 75 AND 0 errors.
 */
export function canPublishWithWarning(result: TemplateHealthResult): boolean {
  const gate = decideTemplateStatus(result);
  return gate.canPublishWithWarning;
}

/**
 * Should this template be hidden from all gallery views?
 * Rule: blocked status (score < 60).
 */
export function isTemplateBlocked(result: TemplateHealthResult): boolean {
  const gate = decideTemplateStatus(result);
  return gate.gateStatus === 'blocked';
}

// ── Gallery Visibility Helper ────────────────────────────────────

export interface GalleryVisibility {
  /** Show in main gallery carousel */
  showInMain: boolean;
  /** Show in "needs polish" section */
  showInPolish: boolean;
  /** Show at all (even in admin/debug) */
  showInAny: boolean;
  /** Badge text to show on card */
  badgeText: string;
  /** Badge color */
  badgeColor: string;
}

/**
 * Determine gallery visibility based on gate status.
 */
export function getGalleryVisibility(gateStatus: TemplateGateStatus): GalleryVisibility {
  switch (gateStatus) {
    case 'ready':
      return {
        showInMain: true,
        showInPolish: false,
        showInAny: true,
        badgeText: '',
        badgeColor: '',
      };
    case 'needs-polish':
      return {
        showInMain: false,
        showInPolish: true,
        showInAny: true,
        badgeText: 'Perlu Polish',
        badgeColor: '#f59e0b',
      };
    case 'broken':
      return {
        showInMain: false,
        showInPolish: false,
        showInAny: true, // visible in admin/debug
        badgeText: 'Bermasalah',
        badgeColor: '#ef4444',
      };
    case 'blocked':
      return {
        showInMain: false,
        showInPolish: false,
        showInAny: false, // hidden from normal views
        badgeText: 'Diblokir',
        badgeColor: '#dc2626',
      };
  }
}

// ── Internal Helpers ─────────────────────────────────────────────

/**
 * Determine which safe auto-repair actions are available
 * based on the issues found.
 */
function determineAvailableRepairs(issues: TemplateHealthIssue[]): AutoRepairType[] {
  const repairs = new Set<AutoRepairType>();

  for (const issue of issues) {
    switch (issue.type) {
      case 'font-too-small':
        repairs.add('fix-font-size');
        break;
      case 'too-many-colors':
      case 'hardcoded-color':
        repairs.add('fix-colors');
        break;
      case 'missing-feedback':
        repairs.add('add-default-feedback');
        break;
      case 'broken-score':
      case 'broken-completion':
        repairs.add('sync-scoring');
        break;
      case 'placeholder-text':
        repairs.add('mark-placeholder');
        break;
    }
  }

  return [...repairs];
}

/**
 * Generate a human-readable summary of the main problems.
 * Instead of raw error lists, give a narrative that teachers understand.
 */
function generateHumanSummary(result: TemplateHealthResult): string {
  if (result.issues.length === 0) {
    return 'Template dalam kondisi baik dan siap dipakai.';
  }

  const errorPages = new Map<number, string[]>();
  for (const issue of result.issues) {
    if (issue.severity !== 'error') continue;
    const existing = errorPages.get(issue.pageIndex) || [];
    existing.push(issue.type);
    errorPages.set(issue.pageIndex, existing);
  }

  if (errorPages.size === 0) {
    // Only warnings
    const topWarnings = result.issues
      .filter(i => i.severity === 'warning')
      .slice(0, 3);
    const types = [...new Set(topWarnings.map(w => w.type))];
    return `Template punya ${result.issues.filter(i => i.severity === 'warning').length} peringatan: ${types.join(', ')}. Masih bisa dipakai tapi sebaiknya diperbaiki.`;
  }

  // Summarize the main problem pages
  const summaryParts: string[] = [];
  for (const [pageIndex, issueTypes] of errorPages) {
    const pageLabel = result.pageSummaries[pageIndex]?.label || `Halaman ${pageIndex + 1}`;
    const pageType = result.pageSummaries[pageIndex]?.templateType || 'custom';

    const typeLabels: Record<string, string> = {
      'too-many-blocks': 'terlalu padat',
      'overlap': 'elemen bertumpuk',
      'overflow': 'konten keluar area',
      'font-too-small': 'font terlalu kecil',
      'placeholder-text': 'masih ada teks placeholder',
      'broken-completion': 'navigasi tidak sinkron',
      'broken-score': 'skor tidak sinkron',
      'missing-feedback': 'interaksi tanpa feedback',
    };

    const descriptions = issueTypes.map(t => typeLabels[t] || t);
    summaryParts.push(`${pageLabel} (${pageType}) ${descriptions.join(', ')}`);
  }

  if (summaryParts.length === 1) {
    return `Masalah utama: ${summaryParts[0]}.`;
  }

  return `Masalah utama di ${summaryParts.length} halaman: ${summaryParts.slice(0, 2).join('; ')}${summaryParts.length > 2 ? `; dan ${summaryParts.length - 2} lainnya` : ''}.`;
}

/**
 * Generate suggested next action based on gate status.
 */
function generateSuggestedAction(gateStatus: TemplateGateStatus, result: TemplateHealthResult): string {
  const repairs = determineAvailableRepairs(result.issues);
  const hasOverflow = result.issues.some(i => i.type === 'overflow');
  const hasTooManyBlocks = result.issues.some(i => i.type === 'too-many-blocks');
  const hasPlaceholder = result.issues.some(i => i.type === 'placeholder-text');

  switch (gateStatus) {
    case 'ready':
      return 'Template siap dipakai. Tidak perlu tindakan.';

    case 'needs-polish': {
      const actions: string[] = [];
      if (repairs.length > 0) {
        actions.push(`Jalankan auto-repair (${repairs.length} perbaikan tersedia)`);
      }
      return actions.length > 0
        ? actions.join('. ') + '.'
        : 'Perbaikan kecil diperlukan sebelum template bisa masuk galeri utama.';
    }

    case 'broken': {
      const actions: string[] = [];
      if (hasPlaceholder) actions.push('Ganti teks placeholder dengan konten asli');
      if (hasTooManyBlocks) actions.push('Pecah halaman yang terlalu padat');
      if (hasOverflow) actions.push('Pecah konten yang keluar area aman');
      if (repairs.length > 0) actions.push(`Jalankan auto-repair untuk ${repairs.length} masalah`);
      return actions.length > 0
        ? actions.join('. ') + '.'
        : 'Perbaiki error terlebih dahulu sebelum template bisa ditampilkan.';
    }

    case 'blocked':
      return 'Template terlalu bermasalah. Pertimbangkan untuk membuat ulang atau hubungi developer.';
  }
}
