'use client';

// ═══════════════════════════════════════════════════════════════
// BLOCK PROPERTIES PANEL — Schema-driven dynamic property editor
// ═══════════════════════════════════════════════════════════════
// ARCHITECTURE (v2 — Schema-Driven Visual Editing Engine):
//
//   1. Block is selected → store.selectedBlockId/Type set
//   2. getPropertySchema(blockType) → list of editable PropertyFields
//   3. Dynamic editor auto-generates form from PropertyField[]
//   4. Changes call updateSchemaBlock() → deep patch merge → rerender
//
// NO MORE SWITCH STATEMENT. Adding a new block type = add its
// propertySchema in core/editor/property-schemas.ts. No UI code change.
//
// Key principles:
//   - Schema is SINGLE SOURCE OF TRUTH (editor reads from schema store)
//   - Deep patch merge (not full block replace)
//   - Type-aware editing (each block shows only relevant fields)
//   - Capability-based (capabilities control what's editable)

import { useCanvaStore } from '@/store/canva-store';
import { getBlockDefinition, getBlockCapabilities } from '@/core/registry/SceneRegistry';
import { getPropertySchema } from '@/core/editor/property-schemas';
import type { PropertyField, PropertySchema } from '@/core/editor/types';
import { Settings2, X, Type, AlignLeft, List, Palette, LayoutGrid, HelpCircle, BookOpen, Hash, ToggleLeft, ChevronDown } from 'lucide-react';
import type { SchemaBlock, ScreenSchema } from '@/core/schema/types';
import { ensurePageSchema } from '@/core/schema/ensure-schema';
import { useMemo, useState } from 'react';

// ═══════════════════════════════════════════════════════════════
// HELPER: Find the selected block in the page's schema
// ═══════════════════════════════════════════════════════════════
// Works with both:
//   - Schema preset pages (schemaScreen in templateData)
//   - Legacy adapted pages (converted via TemplateAdapter on-the-fly)

function useSelectedBlock(): { block: SchemaBlock | null; schema: ScreenSchema | null } {
  const selectedBlockId = useCanvaStore(s => s.selectedBlockId);
  const pages = useCanvaStore(s => s.pages);
  const currentPageIndex = useCanvaStore(s => s.currentPageIndex);

  const page = pages[currentPageIndex];

  const schema = useMemo<ScreenSchema | null>(() => {
    if (!page || !selectedBlockId) return null;

    // ═══ SCHEMA-FIRST: Use ensurePageSchema() ═════════════════
    // This lazily migrates legacy pages on first access.
    return ensurePageSchema(page);
  }, [page, selectedBlockId]);

  if (!selectedBlockId || !schema) return { block: null, schema: null };

  // Find block by ID
  const block = schema.blocks.find(b => b.id === selectedBlockId)
    ?? schema.blocks.find(b => (b.id || b.type) === selectedBlockId)
    ?? null;
  return { block, schema };
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function BlockPropertiesPanel() {
  const selectedBlockId = useCanvaStore(s => s.selectedBlockId);
  const selectedBlockType = useCanvaStore(s => s.selectedBlockType);
  const selectBlock = useCanvaStore(s => s.selectBlock);
  const updateSchemaBlock = useCanvaStore(s => s.updateSchemaBlock);
  const editingBlockId = useCanvaStore(s => s.editingBlockId);
  const stopEditing = useCanvaStore(s => s.stopEditing);
  const { block } = useSelectedBlock();

  if (!selectedBlockId || !selectedBlockType) return null;

  const definition = getBlockDefinition(selectedBlockType);
  const capabilities = getBlockCapabilities(selectedBlockType);
  const propertySchema = getPropertySchema(selectedBlockType);

  // If this block type is not editable, show minimal info
  if (!capabilities.editable) {
    return (
      <div className="border-b border-blue-500/10">
        <div className="px-3 py-2 flex items-center gap-1.5 bg-blue-500/5">
          <Settings2 size={12} className="text-blue-400" />
          <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Block</span>
          <button
            onClick={() => selectBlock(null)}
            className="ml-auto btn-ghost w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-300"
          >
            <X size={10} />
          </button>
        </div>
        <div className="px-3 pb-3 pt-2">
          <div className="text-[9px] text-slate-500 italic">Block ini tidak dapat diedit</div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-blue-500/10">
      {/* Header */}
      <div className="px-3 py-2 flex items-center gap-1.5 bg-blue-500/5">
        <Settings2 size={12} className="text-blue-400" />
        <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Block Properti</span>
        <button
          onClick={() => { selectBlock(null); stopEditing(); }}
          className="ml-auto btn-ghost w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-300"
        >
          <X size={10} />
        </button>
      </div>

      <div className="px-3 pb-3 pt-2 space-y-2">
        {/* Block type badge */}
        <div className="flex items-center gap-2">
          <span className="text-lg">{definition?.icon || '📦'}</span>
          <div>
            <div className="text-[11px] font-bold text-slate-200">{definition?.name || selectedBlockType}</div>
            <div className="text-[9px] text-slate-500">{definition?.category || 'unknown'} &middot; {selectedBlockType}</div>
          </div>
          {editingBlockId === selectedBlockId && (
            <span className="ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              EDITING
            </span>
          )}
        </div>

        {/* Block ID */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 w-14">ID</span>
          <span className="text-[10px] text-slate-300 font-mono truncate flex-1">{selectedBlockId}</span>
        </div>

        {/* ═══ SCHEMA-DRIVEN DYNAMIC EDITOR ═════════════════ */}
        {block && (
          <SchemaDrivenEditor
            block={block}
            schema={propertySchema}
            onUpdate={(updates) => updateSchemaBlock(selectedBlockId, updates)}
          />
        )}

        {/* Capabilities (collapsed) */}
        {definition && (
          <details className="mt-2">
            <summary className="text-[9px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-400">
              Kemampuan
            </summary>
            <div className="grid grid-cols-2 gap-1 mt-1">
              <CapabilityBadge label="Editable" value={definition.capabilities.editable} />
              <CapabilityBadge label="Resizable" value={definition.capabilities.resizable} />
              <CapabilityBadge label="Movable" value={definition.capabilities.movable} />
              <CapabilityBadge label="Interaktif" value={definition.capabilities.interactive} />
              <CapabilityBadge label="Auto-gen" value={definition.capabilities.autoGeneratable} />
              <CapabilityBadge label="Komposit" value={definition.capabilities.composite} />
            </div>
          </details>
        )}

        {/* Layout info (collapsed) */}
        {definition && (
          <details className="mt-1">
            <summary className="text-[9px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-400">
              Layout
            </summary>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-slate-500">Posisi</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                definition.defaultLayout.position === 'flow'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}>
                {definition.defaultLayout.position}
              </span>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCHEMA-DRIVEN DYNAMIC EDITOR
// ═══════════════════════════════════════════════════════════════
// Replaces the giant switch statement in BlockTypeEditor.
// Reads PropertySchema and auto-generates the appropriate form fields.
// Adding a new block type = add its propertySchema. No code change here.

function SchemaDrivenEditor({ block, schema, onUpdate }: {
  block: SchemaBlock;
  schema: PropertySchema;
  onUpdate: (updates: Record<string, unknown>) => void;
}) {
  const b = block as unknown as Record<string, unknown>;

  // If this block type should redirect to authoring panel, show note
  if (schema.redirectToAuthoring) {
    return (
      <div className="mt-2 space-y-2">
        {schema.properties
          .filter(p => p.type === 'variant')
          .map(field => renderField(field, b, onUpdate))}
        <div className="text-[9px] text-slate-500 italic px-1">
          {schema.redirectNote}
        </div>
      </div>
    );
  }

  // Group fields by their group key
  const groupedFields = useMemo(() => {
    const groups: Map<string, PropertyField[]> = new Map();
    const ungrouped: PropertyField[] = [];

    for (const field of schema.properties) {
      if (field.group) {
        const existing = groups.get(field.group) || [];
        existing.push(field);
        groups.set(field.group, existing);
      } else {
        ungrouped.push(field);
      }
    }

    return { groups, ungrouped };
  }, [schema]);

  return (
    <div className="mt-2 space-y-2">
      {/* Ungrouped fields first */}
      {groupedFields.ungrouped.map(field => renderField(field, b, onUpdate))}

      {/* Grouped fields in collapsible sections */}
      {Array.from(groupedFields.groups.entries()).map(([groupKey, fields]) => {
        const groupDef = schema.groups?.find(g => g.key === groupKey);
        const isCollapsed = groupDef?.collapsed ?? false;
        return (
          <PropertyGroup key={groupKey} label={groupDef?.label || groupKey} defaultCollapsed={isCollapsed}>
            {fields.map(field => renderField(field, b, onUpdate))}
          </PropertyGroup>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FIELD RENDERER — Routes property type to the right editor UI
// ═══════════════════════════════════════════════════════════════

function renderField(
  field: PropertyField,
  blockData: Record<string, unknown>,
  onUpdate: (updates: Record<string, unknown>) => void
): React.ReactNode {
  const value = blockData[field.key];

  switch (field.type) {
    case 'text':
      return (
        <TextField
          key={field.key}
          label={field.label}
          value={String(value || '')}
          icon={field.icon ? <span className="text-[9px]">{field.icon}</span> : <Type size={9} />}
          placeholder={field.placeholder}
          onChange={v => onUpdate({ [field.key]: v })}
        />
      );

    case 'textarea':
      return (
        <TextField
          key={field.key}
          label={field.label}
          value={String(value || '')}
          icon={field.icon ? <span className="text-[9px]">{field.icon}</span> : <AlignLeft size={9} />}
          placeholder={field.placeholder}
          multiline
          rows={field.rows || 3}
          onChange={v => onUpdate({ [field.key]: v })}
        />
      );

    case 'number':
      return (
        <NumberField
          key={field.key}
          label={field.label}
          value={Number(value || 0)}
          min={field.min}
          max={field.max}
          step={field.step}
          onChange={v => onUpdate({ [field.key]: v })}
        />
      );

    case 'color':
      return (
        <ColorTokenField
          key={field.key}
          label={field.label}
          value={String(value || field.defaultValue || 'y')}
          onChange={v => onUpdate({ [field.key]: v })}
        />
      );

    case 'select':
      return (
        <SelectField
          key={field.key}
          label={field.label}
          value={String(value || '')}
          options={field.options || []}
          onChange={v => onUpdate({ [field.key]: v })}
        />
      );

    case 'boolean':
      return (
        <BooleanField
          key={field.key}
          label={field.label}
          value={Boolean(value)}
          onChange={v => onUpdate({ [field.key]: v })}
        />
      );

    case 'array':
      return (
        <ArrayField
          key={field.key}
          label={field.label}
          items={(value as Array<Record<string, unknown>>) || []}
          fieldDefs={field.fields || []}
          maxItems={field.maxItems}
          onUpdate={items => onUpdate({ [field.key]: items })}
        />
      );

    case 'variant':
      return (
        <VariantField
          key={field.key}
          label={field.label}
          value={String(value || 'A')}
          onChange={v => onUpdate({ [field.key]: v })}
        />
      );

    case 'icon':
      return (
        <TextField
          key={field.key}
          label={field.label}
          value={String(value || '')}
          icon={<span className="text-[9px]">🎨</span>}
          placeholder={field.placeholder || '🏠'}
          onChange={v => onUpdate({ [field.key]: v })}
        />
      );

    case 'json':
      return (
        <JsonField
          key={field.key}
          label={field.label}
          value={value}
          onChange={v => onUpdate({ [field.key]: v })}
        />
      );

    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// REUSABLE FIELD COMPONENTS
// ═══════════════════════════════════════════════════════════════

/** Single-line or multiline text input */
function TextField({ label, value, icon, onChange, multiline = false, rows = 3, placeholder }: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div className="space-y-0.5">
      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
        {icon} {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full bg-slate-900/60 border border-slate-700/30 rounded px-2 py-1 text-[10px] text-slate-200 resize-y focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-900/60 border border-slate-700/30 rounded px-2 py-1 text-[10px] text-slate-200 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
        />
      )}
    </div>
  );
}

/** Numeric input with optional min/max/step */
function NumberField({ label, value, min, max, step, onChange }: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-0.5">
      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
        <Hash size={9} /> {label}
      </label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step || 1}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full bg-slate-900/60 border border-slate-700/30 rounded px-2 py-1 text-[10px] text-slate-200 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
      />
    </div>
  );
}

/** Color token selector (y/c/g/r/p/bg/card) */
function ColorTokenField({ label, value, onChange }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const TOKEN_COLORS: Record<string, { label: string; bg: string; text: string }> = {
    'y': { label: 'Kuning', bg: 'bg-yellow-500/20', text: 'text-yellow-300' },
    'c': { label: 'Cyan', bg: 'bg-cyan-500/20', text: 'text-cyan-300' },
    'g': { label: 'Hijau', bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
    'r': { label: 'Merah', bg: 'bg-red-500/20', text: 'text-red-300' },
    'p': { label: 'Ungu', bg: 'bg-purple-500/20', text: 'text-purple-300' },
    'bg': { label: 'Background', bg: 'bg-slate-500/20', text: 'text-slate-300' },
    'card': { label: 'Card', bg: 'bg-slate-400/20', text: 'text-slate-300' },
  };

  return (
    <div className="space-y-0.5">
      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
        <Palette size={9} /> {label}
      </label>
      <div className="flex flex-wrap gap-1">
        {Object.entries(TOKEN_COLORS).map(([key, { label: colorLabel, bg, text }]) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`px-1.5 py-0.5 rounded text-[8px] font-bold transition-all border ${
              value === key
                ? `${bg} ${text} border-current/30`
                : 'bg-slate-800/40 text-slate-600 border-slate-700/20 hover:bg-slate-800/60'
            }`}
          >
            {colorLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Select dropdown */
function SelectField({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-0.5">
      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
        <ChevronDown size={9} /> {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-slate-900/60 border border-slate-700/30 rounded px-2 py-1 text-[10px] text-slate-200 focus:outline-none focus:border-blue-500/40 transition-all"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

/** Boolean toggle */
function BooleanField({ label, value, onChange }: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
        <ToggleLeft size={9} /> {label}
      </label>
      <button
        onClick={() => onChange(!value)}
        className={`w-8 h-4 rounded-full transition-all relative ${value ? 'bg-blue-500/40' : 'bg-slate-700/40'}`}
      >
        <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${value ? 'left-4.5 bg-blue-400' : 'left-0.5 bg-slate-500'}`} />
      </button>
    </div>
  );
}

/** Variant selector (A/B/C) */
function VariantField({ label, value, onChange }: {
  label: string;
  value: string;
  onChange: (value: 'A' | 'B' | 'C') => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
        <LayoutGrid size={9} /> {label}
      </label>
      <div className="flex gap-1">
        {(['A', 'B', 'C'] as const).map(v => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${
              value === v
                ? 'bg-blue-500/30 text-blue-300 border border-blue-500/40'
                : 'bg-slate-800/40 text-slate-500 border border-slate-700/20 hover:bg-slate-800/60'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Array of objects editor — shows items with editable sub-fields */
function ArrayField({ label, items, fieldDefs, maxItems, onUpdate }: {
  label: string;
  items: Array<Record<string, unknown>>;
  fieldDefs: Array<{
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'color' | 'icon' | 'select';
    options?: Array<{ label: string; value: string }>;
    placeholder?: string;
  }>;
  maxItems?: number;
  onUpdate: (items: Array<Record<string, unknown>>) => void;
}) {
  const updateItem = (idx: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    onUpdate(newItems);
  };

  const addItem = () => {
    if (maxItems && items.length >= maxItems) return;
    const newItem: Record<string, unknown> = {};
    fieldDefs.forEach(f => { newItem[f.key] = ''; });
    onUpdate([...items, newItem]);
  };

  const removeItem = (idx: number) => {
    const newItems = items.filter((_, i) => i !== idx);
    onUpdate(newItems);
  };

  const moveItem = (idx: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newItems.length) return;
    [newItems[idx], newItems[targetIdx]] = [newItems[targetIdx], newItems[idx]];
    onUpdate(newItems);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <List size={9} /> {label} ({items.length})
        </label>
        <button
          onClick={addItem}
          disabled={maxItems ? items.length >= maxItems : false}
          className="text-[8px] font-bold text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-40"
        >
          + Tambah
        </button>
      </div>
      <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
        {items.map((item, idx) => (
          <div key={idx} className="bg-slate-900/40 rounded border border-slate-700/20 p-1.5 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-[8px] font-bold text-slate-500">#{idx + 1}</span>
                {idx > 0 && (
                  <button onClick={() => moveItem(idx, 'up')} className="text-[8px] text-slate-600 hover:text-slate-400">↑</button>
                )}
                {idx < items.length - 1 && (
                  <button onClick={() => moveItem(idx, 'down')} className="text-[8px] text-slate-600 hover:text-slate-400">↓</button>
                )}
              </div>
              <button
                onClick={() => removeItem(idx)}
                className="text-[8px] text-red-400/60 hover:text-red-400 transition-colors"
              >
                Hapus
              </button>
            </div>
            {fieldDefs.map((fieldDef) => (
              <div key={fieldDef.key} className="flex items-center gap-1">
                <span className="text-[8px] text-slate-600 w-16 shrink-0">{fieldDef.label}</span>
                {fieldDef.type === 'color' ? (
                  <InlineColorTokenField
                    value={String(item[fieldDef.key] || 'y')}
                    onChange={v => updateItem(idx, fieldDef.key, v)}
                  />
                ) : fieldDef.type === 'textarea' ? (
                  <textarea
                    value={String(item[fieldDef.key] || '')}
                    onChange={e => updateItem(idx, fieldDef.key, e.target.value)}
                    rows={2}
                    className="flex-1 bg-slate-900/60 border border-slate-700/30 rounded px-1.5 py-0.5 text-[9px] text-slate-200 focus:outline-none focus:border-blue-500/40 transition-all min-w-0 resize-y"
                  />
                ) : fieldDef.type === 'select' && fieldDef.options ? (
                  <select
                    value={String(item[fieldDef.key] || '')}
                    onChange={e => updateItem(idx, fieldDef.key, e.target.value)}
                    className="flex-1 bg-slate-900/60 border border-slate-700/30 rounded px-1.5 py-0.5 text-[9px] text-slate-200 focus:outline-none focus:border-blue-500/40 transition-all min-w-0"
                  >
                    {fieldDef.options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={fieldDef.type === 'number' ? 'number' : 'text'}
                    value={String(item[fieldDef.key] || '')}
                    onChange={e => updateItem(idx, fieldDef.key, e.target.value)}
                    placeholder={fieldDef.placeholder}
                    className="flex-1 bg-slate-900/60 border border-slate-700/30 rounded px-1.5 py-0.5 text-[9px] text-slate-200 focus:outline-none focus:border-blue-500/40 transition-all min-w-0"
                  />
                )}
              </div>
            ))}
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-[9px] text-slate-600 italic">Belum ada item</div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PROPERTY GROUP — Collapsible section for grouped fields
// ═══════════════════════════════════════════════════════════════

function PropertyGroup({ label, defaultCollapsed = false, children }: {
  label: string;
  defaultCollapsed?: boolean;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className="border-t border-slate-700/20 pt-1">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-1 w-full text-left hover:text-slate-300 transition-colors"
      >
        <ChevronDown size={8} className={`transition-transform ${collapsed ? '-rotate-90' : ''}`} />
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      </button>
      {!collapsed && <div className="space-y-2 mt-1">{children}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════

function CapabilityBadge({ label, value }: { label: string; value: boolean }) {
  return (
    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] ${
      value
        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
        : 'bg-slate-800/40 text-slate-600 border border-slate-700/10'
    }`}>
      <span>{value ? '✓' : '✕'}</span>
      <span>{label}</span>
    </div>
  );
}

/** Inline color token selector for array sub-fields (compact, no label) */
function InlineColorTokenField({ value, onChange }: {
  value: string;
  onChange: (value: string) => void;
}) {
  const TOKENS = ['y', 'c', 'g', 'r', 'p', 'bg', 'card'] as const;
  const TOKEN_COLORS: Record<string, string> = {
    'y': 'bg-yellow-500', 'c': 'bg-cyan-500', 'g': 'bg-emerald-500',
    'r': 'bg-red-500', 'p': 'bg-purple-500', 'bg': 'bg-slate-500', 'card': 'bg-slate-400',
  };
  return (
    <div className="flex gap-0.5 flex-1 flex-wrap">
      {TOKENS.map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`w-4 h-4 rounded-full transition-all border ${
            value === t ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-slate-900' : 'border-slate-700/30 hover:scale-110'
          } ${TOKEN_COLORS[t] || 'bg-slate-600'}`}
          title={t}
        />
      ))}
    </div>
  );
}

/** JSON editor — raw JSON textarea for advanced use */
function JsonField({ label, value, onChange }: {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const [text, setText] = useState(() => {
    try { return JSON.stringify(value, null, 2); }
    catch { return String(value || ''); }
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (newText: string) => {
    setText(newText);
    try {
      const parsed = JSON.parse(newText);
      setError(null);
      onChange(parsed);
    } catch (e) {
      setError('JSON tidak valid');
    }
  };

  return (
    <div className="space-y-0.5">
      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
        <HelpCircle size={9} /> {label}
      </label>
      <textarea
        value={text}
        onChange={e => handleChange(e.target.value)}
        rows={4}
        className={`w-full bg-slate-900/60 border rounded px-2 py-1 text-[9px] text-slate-200 font-mono resize-y focus:outline-none focus:ring-1 transition-all ${
          error ? 'border-red-500/40 focus:ring-red-500/20' : 'border-slate-700/30 focus:border-blue-500/40 focus:ring-blue-500/20'
        }`}
      />
      {error && <div className="text-[8px] text-red-400">{error}</div>}
    </div>
  );
}
