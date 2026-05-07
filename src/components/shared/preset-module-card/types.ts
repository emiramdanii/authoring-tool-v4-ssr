// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export type LayoutVariant = 'A' | 'B' | 'C' | 'D';

export interface PresetModuleCardProps {
  mode: 'edit' | 'canvas' | 'export';
  module: Record<string, unknown>;
  onEdit?: () => void;
  compact?: boolean;
  layoutVariant?: LayoutVariant;
}

export interface ModuleTypeMeta {
  id: string;
  icon: string;
  label: string;
  color: string;
  isGame?: boolean;
}

/** Module data record type used by preview components */
export type M = Record<string, unknown>;
