// ═══════════════════════════════════════════════════════════════════
// TYPES — Shared type definitions for render-module
// ═══════════════════════════════════════════════════════════════════

import type { LayoutVariant } from '@/components/shared/PresetModuleCard';

export type { LayoutVariant };

/** Module data shape — loosely typed Record */
export type M = Record<string, unknown>;

/** Module type metadata (same as PresetModuleCard) */
export interface ModuleTypeMeta {
  id: string;
  icon: string;
  label: string;
  color: string;
  isGame?: boolean;
}
