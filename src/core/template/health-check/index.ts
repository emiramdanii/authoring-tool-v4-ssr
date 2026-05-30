// ═══════════════════════════════════════════════════════════════════
// TEMPLATE HEALTH CHECK — Barrel Export
// ═══════════════════════════════════════════════════════════════════

// ── Validation Engine ──
export { validateTemplate, validateSinglePage } from './template-health-check';

// ── Types & Constants ──
export {
  type TemplateHealthIssue,
  type TemplateHealthResult,
  type HealthScoreBreakdown,
  type PageHealthSummary,
  type TemplateIssueType,
  type IssueSeverity,
  type HealthStatus,
  type TemplateQuickFix,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  SAFE_AREA,
  SAFE_AREA_PERCENT,
  FONT_MINIMUMS,
  MAX_BLOCKS_PER_PAGE,
  PLACEHOLDER_PATTERNS,
  getHealthStatus,
  getHealthStatusLabel,
  getHealthStatusColor,
} from './types';

// ── Quality Gate ──
export {
  decideTemplateStatus,
  canPublishTemplate,
  canPublishWithWarning,
  isTemplateBlocked,
  getGalleryVisibility,
  SAFE_REPAIRS,
  PREVIEW_REPAIRS,
} from './quality-gate';
export type {
  TemplateGateStatus,
  TemplateGateResult,
  AutoRepairType,
  PreviewRepairType,
  GalleryVisibility,
} from './quality-gate';

// ── Auto Repair Pipeline ──
export {
  repairFontSize,
  repairColors,
  repairAddFeedback,
  repairSyncScoring,
  repairPlaceholder,
  runRepairPipeline,
  runSingleRepair,
} from './auto-repair';
export type {
  RepairResult,
  PreviewRepairResult,
  RepairPipelineResult,
} from './auto-repair';

// ── Page Variant Registry ──
export {
  getVariantsForPageType,
  getDefaultVariant,
  getVariantById,
  getPageTypesWithVariants,
  checkVariantFit,
  resolvePageVariant,
  getAllVariants,
} from './page-variant-registry';
export type {
  PageVariantId,
  PageVariant,
  VariantInteraction,
  VariantFitResult,
} from './page-variant-registry';
