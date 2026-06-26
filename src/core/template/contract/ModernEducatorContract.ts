// ═══════════════════════════════════════════════════════════════════
// MODERN EDUCATOR CONTRACT — Compatibility Re-export
// ═══════════════════════════════════════════════════════════════════
// BATCH-10C-Patch-3: This file is now a COMPATIBILITY RE-EXPORT only.
// The actual MODERN_EDUCATOR_CONTRACT definition lives in
// TemplateThemeContract.ts to eliminate the circular dependency:
//   TTC → MEC (import) → TTC (import registerContract) = CYCLE
//
// Now TTC owns ALL contract definitions + registration.
// This file exists solely so existing imports from
// '@/core/template/contract/ModernEducatorContract' still work.
// ═══════════════════════════════════════════════════════════════════

export {
  MODERN_EDUCATOR_CONTRACT,
  MODERN_EDUCATOR_ACCENT_PALETTE,
} from './TemplateThemeContract';
