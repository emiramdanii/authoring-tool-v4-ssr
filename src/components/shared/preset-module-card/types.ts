// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

import type { Module } from '@/store/authoring/types';

export type LayoutVariant = 'A' | 'B' | 'C' | 'D';

export interface PresetModuleCardProps {
  mode: 'edit' | 'canvas' | 'export';
  module: Module;
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
export type M = Module;
