// ═══════════════════════════════════════════════════════════════════
// TEMPLATE HEALTH CHECK — Barrel Export
// ═══════════════════════════════════════════════════════════════════

export { validateTemplate, validateSinglePage } from './template-health-check';
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
