// ═══════════════════════════════════════════════════════════════════
// BLOCK DEFINITION REGISTRY — Types and Constants
// ═══════════════════════════════════════════════════════════════════
// Types, interfaces, and constants for the metadata-only block definitions.
// This module contains NO block definitions or query functions.
//
// Rule: This file MUST NOT import any React components or stores.

import type { PropertySchema } from '../../editor/types';

// ═══════════════════════════════════════════════════════════════════
// BLOCK PERSONALITY — Pedagogical intent grouping
// ═══════════════════════════════════════════════════════════════════
// Instead of grouping blocks by technical category (layout, content, etc.),
// we group them by their pedagogical purpose — what role they play
// in the learning experience.

export type BlockPersonality = 'understanding' | 'discussion' | 'reflection' | 'assessment' | 'activation' | 'structure';

export const PERSONALITY_CONFIG: Record<BlockPersonality, {
  label: string;
  icon: string;
  color: string;
  colorClass: string;
  bgColorClass: string;
  borderColorClass: string;
  order: number;
  description: string;
}> = {
  understanding: {
    label: 'Membangun Pemahaman',
    icon: '📖',
    color: '#3B82F6',
    colorClass: 'text-blue-400',
    bgColorClass: 'bg-blue-500/10',
    borderColorClass: 'border-blue-500/20',
    order: 0,
    description: 'Siswa perlu memahami konsep ini',
  },
  discussion: {
    label: 'Mengembangkan Diskusi',
    icon: '💬',
    color: '#22C55E',
    colorClass: 'text-green-400',
    bgColorClass: 'bg-green-500/10',
    borderColorClass: 'border-green-500/20',
    order: 1,
    description: 'Siswa perlu berdiskusi dan berkolaborasi',
  },
  reflection: {
    label: 'Mendalami Refleksi',
    icon: '🪞',
    color: '#EAB308',
    colorClass: 'text-yellow-400',
    bgColorClass: 'bg-yellow-500/10',
    borderColorClass: 'border-yellow-500/20',
    order: 2,
    description: 'Siswa perlu merenung dan merefleksi',
  },
  assessment: {
    label: 'Mengukur Pemahaman',
    icon: '❓',
    color: '#EF4444',
    colorClass: 'text-red-400',
    bgColorClass: 'bg-red-500/10',
    borderColorClass: 'border-red-500/20',
    order: 3,
    description: 'Siswa perlu diuji pemahamannya',
  },
  activation: {
    label: 'Menghidupkan Kelas',
    icon: '⚡',
    color: '#A855F7',
    colorClass: 'text-purple-400',
    bgColorClass: 'bg-purple-500/10',
    borderColorClass: 'border-purple-500/20',
    order: 4,
    description: 'Siswa perlu aktivitas menyenangkan',
  },
  structure: {
    label: 'Struktur & Navigasi',
    icon: '🏗️',
    color: '#6B7280',
    colorClass: 'text-gray-400',
    bgColorClass: 'bg-gray-500/10',
    borderColorClass: 'border-gray-500/20',
    order: 5,
    description: 'Kerangka presentasi',
  },
};

// ═══════════════════════════════════════════════════════════════════
// TYPES (re-exported for consumers)
// ═══════════════════════════════════════════════════════════════════

export interface BlockCapabilities {
  editable: boolean;
  resizable: boolean;
  movable: boolean;
  backgroundCustom: boolean;
  interactive: boolean;
  autoGeneratable: boolean;
  composite: boolean;
  variants: ('A' | 'B' | 'C')[];
  /** Whether the renderer handles compression natively via useBlockCompression.
   *  If false, CompressionBoundary will wrap the block in CompressedBlockWrapper. */
  handlesCompression: boolean;
  /** Whether this block type supports tab-grouped content.
   *  When true, the block can organize child blocks into named tabs. */
  hasTabs: boolean;
}

export const DEFAULT_CAPABILITIES: BlockCapabilities = {
  editable: true,
  resizable: false,
  movable: false,
  backgroundCustom: false,
  interactive: false,
  autoGeneratable: true,
  composite: false,
  variants: ['A'],
  handlesCompression: false,
  hasTabs: false,
};

export interface SceneBlockLayout {
  position: 'flow' | 'absolute';
  defaultWidth?: number;
  defaultHeight?: number;
  defaultX?: number;
  defaultY?: number;
  zIndex?: number;
}

/**
 * Block definition WITHOUT renderer.
 * This is safe to import from store modules — no React dependency.
 */
export interface BlockDefinitionMeta {
  type: string;
  name: string;
  icon: string;
  category: 'layout' | 'content' | 'interactive' | 'navigation' | 'feedback' | 'decoration';
  /** Pedagogical intent — groups blocks by learning purpose */
  personality: BlockPersonality;
  description: string;
  capabilities: BlockCapabilities;
  defaultLayout: SceneBlockLayout;
  usedInTemplates: string[];
  propertySchema: PropertySchema;
  createDefault: () => Record<string, unknown>;
  /** Estimated rendered height in px (used by overflow detection system) */
  estimatedHeight: Record<'A' | 'B' | 'C', number>;
  /** Whether this block can be added from the Add Block UI panel.
   *  Internal blocks (like materi-blok) should set this to false.
   *  Defaults to true when not specified. */
  addable?: boolean;
}
