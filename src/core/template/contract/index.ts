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
  type ValidationSeverity,
  type ValidationIssue,
  type ValidationResult,
  validatePage,
  validateProject,
  formatValidationResult,
} from './TemplateValidator';
