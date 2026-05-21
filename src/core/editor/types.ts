// ═══════════════════════════════════════════════════════════════════
// EDITOR ENGINE — Type definitions for the schema-driven editing system
// ═══════════════════════════════════════════════════════════════════
// This is the foundation of the Visual Editing Engine.
// Every edit flows through: UI → updateSchemaBlock() → schema store → renderer
//
// Key principles:
//   1. Schema is the SINGLE SOURCE OF TRUTH
//   2. Editors modify schema, NEVER the DOM directly
//   3. Deep patch merge (not full block replace) for undo/redo/collab
//   4. Property schema drives dynamic form generation
//   5. Capability-based editing controls what's available per block

// ── Property Field Types ────────────────────────────────────────
// These define what kind of editor UI to render for each property.

export type PropertyFieldType =
  | 'text'          // Single-line text input
  | 'textarea'      // Multi-line text input
  | 'number'        // Numeric input with min/max/step
  | 'color'         // Color token selector (y/c/g/r/p/bg/card)
  | 'select'        // Dropdown with predefined options
  | 'boolean'       // Toggle/checkbox
  | 'array'         // Array of objects with sub-fields
  | 'variant'       // Variant selector (A/B/C)
  | 'icon'          // Emoji/icon picker
  | 'json';         // Raw JSON editor (for advanced use)

// ── Property Field Definition ───────────────────────────────────

export interface PropertyField {
  /** Property key — must match the schema block's key */
  key: string;
  /** Field type — determines editor UI */
  type: PropertyFieldType;
  /** Human-readable label */
  label: string;
  /** Icon for the label (lucide icon name or emoji) */
  icon?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Help text / tooltip */
  helpText?: string;
  /** Whether this field is required */
  required?: boolean;
  /** Default value for new blocks */
  defaultValue?: unknown;
  /** Group name for organizing fields in sections */
  group?: string;
  /** For 'select' type: available options */
  options?: Array<{ label: string; value: string }>;
  /** For 'number' type: min/max/step */
  min?: number;
  max?: number;
  step?: number;
  /** For 'array' type: sub-field definitions */
  fields?: Array<{
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'color' | 'icon' | 'select' | 'json' | 'boolean' | 'array';
    options?: Array<{ label: string; value: string }>;
    placeholder?: string;
    helpText?: string;
    min?: number;
    max?: number;
    step?: number;
    defaultValue?: unknown;
    /** For nested 'array' sub-fields: sub-field definitions */
    fields?: Array<{
      key: string;
      label: string;
      type: 'text' | 'textarea' | 'number' | 'color' | 'icon' | 'select' | 'json' | 'boolean';
      options?: Array<{ label: string; value: string }>;
      placeholder?: string;
      helpText?: string;
      min?: number;
      max?: number;
      step?: number;
      defaultValue?: unknown;
    }>;
    /** For nested 'array' sub-fields: max number of items */
    maxItems?: number;
  }>;
  /** For 'array' type: max number of items */
  maxItems?: number;
  /** For 'textarea' type: number of rows */
  rows?: number;
  /** Whether to show this field in compact mode */
  showInCompact?: boolean;
  /** Custom editor component key (overrides default editor) */
  editorKey?: string;
}

// ── Property Schema ─────────────────────────────────────────────
// A complete property schema for a block type.
// This drives the dynamic property panel.

export interface PropertySchema {
  /** Block type this schema belongs to */
  blockType: string;
  /** Ordered list of editable properties */
  properties: PropertyField[];
  /** Property groups for organizing the panel into sections */
  groups?: Array<{
    key: string;
    label: string;
    icon?: string;
    collapsed?: boolean;
  }>;
  /** Custom editor component key (overrides default BlockTypeEditor) */
  customEditorKey?: string;
  /** Whether to show the "edit via authoring panel" note */
  redirectToAuthoring?: boolean;
  /** Note to display when redirecting */
  redirectNote?: string;
}

// ── Schema Patch ────────────────────────────────────────────────
// Represents a single edit operation on a schema block.
// Used for undo/redo, history, collaboration.

export interface SchemaPatch {
  /** Target block ID */
  blockId: string;
  /** Block type for quick lookup */
  blockType: string;
  /** Page index where the block lives */
  pageIndex: number;
  /** Deep partial update to merge */
  patch: Record<string, unknown>;
  /** Timestamp of the edit */
  timestamp: number;
  /** Optional source (for collaboration tracking) */
  source?: 'user' | 'ai' | 'sync' | 'auto';
  /** Immer-level patches for efficient undo/redo (when available) */
  _immerPatches?: {
    /** Forward patches scoped to the blocks array level */
    forward: import('immer').Patch[];
    /** Inverse patches scoped to the blocks array level */
    inverse: import('immer').Patch[];
    /** Page index the patches apply to */
    pageIndex: number;
  };
}

// ── Selection Context ───────────────────────────────────────────
// Tracks which nodes are in various selection states.
// Essential for: multi-select, inline editing, layer panel.

export interface SelectionContext {
  /** Currently selected block ID */
  selectedBlockId: string | null;
  /** Type of the selected block */
  selectedBlockType: string | null;
  /** Currently hovered block ID (for hover effects) */
  hoveredBlockId: string | null;
  /** Block being inline-edited (double-click → edit mode) */
  editingBlockId: string | null;
  /** Multi-select: array of selected block IDs */
  selectedBlockIds: string[];
}

// ── Edit Pipeline Event ─────────────────────────────────────────
// Events that flow through the edit pipeline.
// Used for: logging, debugging, collaboration sync.

export type EditEvent =
  | { type: 'select'; blockId: string | null; blockType: string | null }
  | { type: 'hover'; blockId: string | null }
  | { type: 'edit-start'; blockId: string; blockType: string }
  | { type: 'edit-end'; blockId: string }
  | { type: 'patch'; patch: SchemaPatch }
  | { type: 'batch-patch'; patches: SchemaPatch[] }
  | { type: 'cross-page'; operation: string; pageIndex: number; blockId?: string; blockType?: string; details?: Record<string, unknown> }
  | { type: 'snapshot-op'; operation: string; pageIndex: number; blockId?: string; blockType?: string; details?: Record<string, unknown> };
