// ═══════════════════════════════════════════════════════════════════
// TEMPLATE CONTRACT — Public API
// ═══════════════════════════════════════════════════════════════════

export {
  type TemplateThemeContract,
  type TemplateColorContract,
  type TemplateTypographyContract,
  type TemplateSpacingContract,
  type TemplateBorderContract,
  type TemplateShadowContract,
  type PageAccentContract,
  type PageLayoutContract,
  type ContractResolvedStyle,
  GOLDEN_PERTEMUAN_CONTRACT,
  registerContract,
  getContract,
  getContractOrGolden,
  resolveContractStyle,
} from './TemplateThemeContract';

export {
  MODERN_EDUCATOR_CONTRACT,
  MODERN_EDUCATOR_ACCENT_PALETTE,
} from './ModernEducatorContract';

export {
  type ValidationSeverity,
  type ValidationIssue,
  type ValidationResult,
  validatePage,
  validateProject,
  formatValidationResult,
  PAGE_DENSITY_RULES,
} from './TemplateValidator';
