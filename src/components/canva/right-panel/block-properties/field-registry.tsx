'use client';

import React, { useState } from 'react';
import {
  Type, AlignLeft, List, Palette, LayoutGrid, HelpCircle, Hash, ToggleLeft, ChevronDown,
  Plus, Trash2, GripVertical, X, RotateCcw,
} from 'lucide-react';
import type { PropertyField } from '@/core/editor/types';
import { getNestedValue, buildNestedUpdate } from './dot-notation';

// ═══════════════════════════════════════════════════════════════
// FIELD RENDERER — Routes property type to the right editor UI
// ═══════════════════════════════════════════════════════════════

export function renderField(
  field: PropertyField,
  blockData: Record<string, unknown>,
  onUpdate: (updates: Record<string, unknown>) => void,
): React.ReactNode {
  // Support dot-notation keys (e.g., 'cta.label', 'meta.durasi')
  const value = getNestedValue(blockData, field.key);

  // Wrap onUpdate to handle dot-notation paths via deep merge
  const handleUpdate = (v: unknown) => onUpdate(buildNestedUpdate(field.key, v));

  // Get default value for reset
  const defaultValue = field.defaultValue;

  // Generate unique ids for label-input association and help text
  const fieldId = `prop-${field.key.replace(/\./g, '-')}`;
  const helpId = field.helpText ? `${fieldId}-help` : undefined;

  switch (field.type) {
    case 'text':
      return (
        <FieldWithReset key={field.key} defaultValue={defaultValue} value={value} onReset={v => handleUpdate(v)}>
          <TextField
            fieldId={fieldId}
            helpId={helpId}
            helpText={field.helpText}
            label={field.label}
            value={String(value || '')}
            icon={field.icon ? <span className="text-[9px]">{field.icon}</span> : <Type size={9} />}
            placeholder={field.placeholder}
            onChange={v => handleUpdate(v)}
          />
        </FieldWithReset>
      );

    case 'textarea':
      return (
        <FieldWithReset key={field.key} defaultValue={defaultValue} value={value} onReset={v => handleUpdate(v)}>
          <TextField
            fieldId={fieldId}
            helpId={helpId}
            helpText={field.helpText}
            label={field.label}
            value={String(value || '')}
            icon={field.icon ? <span className="text-[9px]">{field.icon}</span> : <AlignLeft size={9} />}
            placeholder={field.placeholder}
            multiline
            rows={field.rows || 3}
            onChange={v => handleUpdate(v)}
          />
        </FieldWithReset>
      );

    case 'number':
      return (
        <FieldWithReset key={field.key} defaultValue={defaultValue} value={value} onReset={v => handleUpdate(v)}>
          <NumberField
            fieldId={fieldId}
            helpId={helpId}
            helpText={field.helpText}
            label={field.label}
            value={Number(value || 0)}
            min={field.min}
            max={field.max}
            step={field.step}
            onChange={v => handleUpdate(v)}
          />
        </FieldWithReset>
      );

    case 'color':
      return (
        <FieldWithReset key={field.key} defaultValue={defaultValue} value={value} onReset={v => handleUpdate(v)}>
          <ColorTokenField
            fieldId={fieldId}
            label={field.label}
            value={String(value || field.defaultValue || 'y')}
            onChange={v => handleUpdate(v)}
          />
        </FieldWithReset>
      );

    case 'select':
      return (
        <FieldWithReset key={field.key} defaultValue={defaultValue} value={value} onReset={v => handleUpdate(v)}>
          <SelectField
            fieldId={fieldId}
            helpId={helpId}
            helpText={field.helpText}
            label={field.label}
            value={String(value || '')}
            options={field.options || []}
            onChange={v => handleUpdate(v)}
          />
        </FieldWithReset>
      );

    case 'boolean':
      return (
        <FieldWithReset key={field.key} defaultValue={defaultValue} value={value} onReset={v => handleUpdate(v)}>
          <BooleanField
            fieldId={fieldId}
            helpId={helpId}
            helpText={field.helpText}
            label={field.label}
            value={Boolean(value)}
            onChange={v => handleUpdate(v)}
          />
        </FieldWithReset>
      );

    case 'array':
      return (
        <ArrayField
          key={field.key}
          fieldId={fieldId}
          label={field.label}
          items={(value as Array<Record<string, unknown>>) || []}
          fieldDefs={field.fields || []}
          maxItems={field.maxItems}
          onUpdate={items => handleUpdate(items)}
        />
      );

    case 'variant':
      return (
        <FieldWithReset key={field.key} defaultValue={defaultValue} value={value} onReset={v => handleUpdate(v)}>
          <VariantField
            fieldId={fieldId}
            label={field.label}
            value={String(value || 'A')}
            onChange={v => handleUpdate(v)}
          />
        </FieldWithReset>
      );

    case 'icon':
      return (
        <FieldWithReset key={field.key} defaultValue={defaultValue} value={value} onReset={v => handleUpdate(v)}>
          <TextField
            fieldId={fieldId}
            helpId={helpId}
            helpText={field.helpText}
            label={field.label}
            value={String(value || '')}
            icon={<Palette size={9} />}
            placeholder={field.placeholder || '🏠'}
            onChange={v => handleUpdate(v)}
          />
        </FieldWithReset>
      );

    case 'json':
      return (
        <JsonFieldEditor
          key={field.key}
          fieldId={fieldId}
          helpId={helpId}
          helpText={field.helpText}
          label={field.label}
          value={value}
          defaultValue={defaultValue}
          onChange={v => handleUpdate(v)}
        />
      );

    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// FIELD WITH RESET — Wraps a field with a "Reset to Default" button
// ═══════════════════════════════════════════════════════════════

function FieldWithReset({ defaultValue, value, onReset, children }: {
  defaultValue: unknown;
  value: unknown;
  onReset: (value: unknown) => void;
  children: React.ReactNode;
}) {
  // Only show reset if there's a default and the value differs
  const hasDefault = defaultValue !== undefined && defaultValue !== null;
  const isModified = hasDefault && JSON.stringify(value) !== JSON.stringify(defaultValue);

  if (!hasDefault) return <>{children}</>;

  return (
    <div className="group relative">
      {children}
      {isModified && (
        <button
          onClick={() => onReset(defaultValue)}
          className="absolute top-0 right-0 h-5 w-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity text-app-muted hover:text-app-accent"
          title="Reset ke default"
        >
          <RotateCcw size={10} />
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// REUSABLE FIELD COMPONENTS
// ═══════════════════════════════════════════════════════════════

/** Single-line or multiline text input */
function TextField({ label, value, icon, onChange, multiline = false, rows = 3, placeholder, fieldId, helpId, helpText }: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  fieldId?: string;
  helpId?: string;
  helpText?: string;
}) {
  const describedBy = helpId ? helpId : undefined;
  return (
    <div className="space-y-0.5">
      <label htmlFor={fieldId} className="text-[9px] font-bold text-app-muted uppercase tracking-wider flex items-center gap-1">
        {icon} {label}
      </label>
      {multiline ? (
        <textarea
          id={fieldId}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          aria-describedby={describedBy}
          className="w-full bg-app-surface/60 border border-app-border/30 rounded px-2 py-1 text-[10px] text-app-primary resize-y focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-[background-color,border-color]"
        />
      ) : (
        <input
          id={fieldId}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          aria-describedby={describedBy}
          className="w-full bg-app-surface/60 border border-app-border/30 rounded px-2 py-1 text-[10px] text-app-primary focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-[background-color,border-color]"
        />
      )}
      {helpText && (
        <span id={helpId} className="text-[8px] text-app-muted sr-only">{helpText}</span>
      )}
    </div>
  );
}

/** Numeric input with optional min/max/step */
function NumberField({ label, value, min, max, step, onChange, fieldId, helpId, helpText }: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  fieldId?: string;
  helpId?: string;
  helpText?: string;
}) {
  return (
    <div className="space-y-0.5">
      <label htmlFor={fieldId} className="text-[9px] font-bold text-app-muted uppercase tracking-wider flex items-center gap-1">
        <Hash size={9} /> {label}
      </label>
      <input
        id={fieldId}
        type="number"
        value={value}
        min={min}
        max={max}
        step={step || 1}
        onChange={e => onChange(Number(e.target.value))}
        aria-describedby={helpId}
        className="w-full bg-app-surface/60 border border-app-border/30 rounded px-2 py-1 text-[10px] text-app-primary focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-[background-color,border-color]"
      />
      {helpText && (
        <span id={helpId} className="text-[8px] text-app-muted sr-only">{helpText}</span>
      )}
    </div>
  );
}

/** Color token selector with inline swatch preview */
function ColorTokenField({ label, value, onChange, fieldId }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  fieldId?: string;
}) {
  const TOKEN_COLORS: Record<string, { label: string; bg: string; text: string; swatch: string }> = {
    'y': { label: 'Kuning', bg: 'bg-yellow-500/20', text: 'text-yellow-300', swatch: 'bg-yellow-500' },
    'c': { label: 'Cyan', bg: 'bg-cyan-500/20', text: 'text-cyan-300', swatch: 'bg-cyan-500' },
    'g': { label: 'Hijau', bg: 'bg-emerald-500/20', text: 'text-emerald-300', swatch: 'bg-emerald-500' },
    'r': { label: 'Merah', bg: 'bg-red-500/20', text: 'text-red-300', swatch: 'bg-red-500' },
    'p': { label: 'Ungu', bg: 'bg-purple-500/20', text: 'text-purple-300', swatch: 'bg-purple-500' },
    'bg': { label: 'Background', bg: 'bg-app-elevated/20', text: 'text-app-secondary', swatch: 'bg-app-elevated' },
    'card': { label: 'Card', bg: 'bg-app-elevated/20', text: 'text-app-secondary', swatch: 'bg-app-elevated' },
  };

  const currentToken = TOKEN_COLORS[value];

  return (
    <div className="space-y-0.5">
      <label className="text-[9px] font-bold text-app-muted uppercase tracking-wider flex items-center gap-1">
        <Palette size={9} /> {label}
        {/* Inline color swatch preview */}
        {currentToken && (
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${currentToken.swatch} ml-1 ring-1 ring-app-border/30`} />
        )}
      </label>
      <div className="flex flex-wrap gap-1">
        {Object.entries(TOKEN_COLORS).map(([key, { label: colorLabel, bg, text }]) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`px-1.5 py-0.5 rounded text-[8px] font-bold transition-[background-color,border-color,color] border ${
              value === key
                ? `${bg} ${text} border-current/30`
                : 'bg-app-elevated/40 text-app-muted border-app-border/20 hover:bg-app-elevated/60'
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
function SelectField({ label, value, options, onChange, fieldId, helpId, helpText }: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
  fieldId?: string;
  helpId?: string;
  helpText?: string;
}) {
  return (
    <div className="space-y-0.5">
      <label htmlFor={fieldId} className="text-[9px] font-bold text-app-muted uppercase tracking-wider flex items-center gap-1">
        <ChevronDown size={9} /> {label}
      </label>
      <select
        id={fieldId}
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-describedby={helpId}
        className="w-full bg-app-surface/60 border border-app-border/30 rounded px-2 py-1 text-[10px] text-app-primary focus:outline-none focus:border-blue-500/40 transition-[background-color,border-color]"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {helpText && (
        <span id={helpId} className="text-[8px] text-app-muted sr-only">{helpText}</span>
      )}
    </div>
  );
}

/** Boolean toggle */
function BooleanField({ label, value, onChange, fieldId, helpId, helpText }: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  fieldId?: string;
  helpId?: string;
  helpText?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-[9px] font-bold text-app-muted uppercase tracking-wider flex items-center gap-1">
        <ToggleLeft size={9} /> {label}
      </label>
      <button
        id={fieldId}
        onClick={() => onChange(!value)}
        role="switch"
        aria-checked={value}
        aria-label={label}
        aria-describedby={helpId}
        className={`w-8 h-4 rounded-full transition-[background-color,transform] relative ${value ? 'bg-blue-500/40' : 'bg-app-elevated/40'}`}
      >
        <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-[background-color,transform] ${value ? 'left-4.5 bg-blue-400' : 'left-0.5 bg-app-elevated'}`} />
      </button>
      {helpText && (
        <span id={helpId} className="text-[8px] text-app-muted sr-only">{helpText}</span>
      )}
    </div>
  );
}

/** Variant selector (A/B/C) */
function VariantField({ label, value, onChange, fieldId }: {
  label: string;
  value: string;
  onChange: (value: 'A' | 'B' | 'C') => void;
  fieldId?: string;
}) {
  return (
    <div className="space-y-1" role="radiogroup" aria-label={label}>
      <div className="text-[9px] font-bold text-app-muted uppercase tracking-wider flex items-center gap-1" id={fieldId}>
        <LayoutGrid size={9} /> {label}
      </div>
      <div className="flex gap-1" role="group" aria-labelledby={fieldId}>
        {(['A', 'B', 'C'] as const).map(v => (
          <button
            key={v}
            onClick={() => onChange(v)}
            role="radio"
            aria-checked={value === v}
            aria-label={`Varian ${v}`}
            className={`px-2 py-0.5 rounded text-[9px] font-bold transition-[background-color,border-color,color] ${
              value === v
                ? 'bg-blue-500/30 text-blue-300 border border-blue-500/40'
                : 'bg-app-elevated/40 text-app-muted border border-app-border/20 hover:bg-app-elevated/60'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// IMPROVED ARRAY EDITOR — Larger max-h, drag handles, icons
// ═══════════════════════════════════════════════════════════════

/** Array of objects editor — shows items with editable sub-fields */
function ArrayField({ label, items, fieldDefs, maxItems, onUpdate, fieldId: _fieldId }: {
  label: string;
  items: Array<Record<string, unknown>>;
  fieldDefs: Array<{
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
    maxItems?: number;
  }>;
  maxItems?: number;
  onUpdate: (items: Array<Record<string, unknown>>) => void;
  fieldId?: string;
}) {
  const updateItem = (idx: number, field: string, value: unknown) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    onUpdate(newItems);
  };

  const addItem = () => {
    if (maxItems && items.length >= maxItems) return;
    const newItem: Record<string, unknown> = {};
    fieldDefs.forEach(f => {
      if (f.type === 'array') newItem[f.key] = [];
      else if (f.type === 'boolean') newItem[f.key] = false;
      else if (f.type === 'number') newItem[f.key] = f.defaultValue ?? 0;
      else newItem[f.key] = f.defaultValue ?? '';
    });
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
        <label className="text-[9px] font-bold text-app-muted uppercase tracking-wider flex items-center gap-1">
          <List size={9} /> {label} ({items.length})
        </label>
        <button
          onClick={addItem}
          disabled={maxItems ? items.length >= maxItems : false}
          className="flex items-center gap-0.5 text-[8px] font-bold text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-40"
        >
          <Plus size={9} /> Tambah Item
        </button>
      </div>
      <div className="space-y-1.5 max-h-80 overflow-y-auto custom-scrollbar pr-1">
        {items.map((item, idx) => (
          <div key={idx} className="bg-app-surface/40 rounded border border-app-border/20 p-1.5 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {/* Drag handle for visual reordering */}
                <GripVertical size={10} className="text-app-muted/40 cursor-grab" />
                <span className="text-[8px] font-bold text-app-muted">#{idx + 1}</span>
                {idx > 0 && (
                  <button onClick={() => moveItem(idx, 'up')} className="text-[8px] text-app-muted hover:text-app-secondary transition-colors" title="Pindah ke atas">↑</button>
                )}
                {idx < items.length - 1 && (
                  <button onClick={() => moveItem(idx, 'down')} className="text-[8px] text-app-muted hover:text-app-secondary transition-colors" title="Pindah ke bawah">↓</button>
                )}
              </div>
              <button
                onClick={() => removeItem(idx)}
                className="flex items-center gap-0.5 text-[8px] text-red-400/60 hover:text-red-400 transition-colors"
                title="Hapus item"
              >
                <Trash2 size={9} /> Hapus
              </button>
            </div>
            {fieldDefs.map((fieldDef) => (
              <div key={fieldDef.key}>
                {fieldDef.type === 'boolean' ? (
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] text-app-muted">{fieldDef.label}</span>
                    <button
                      onClick={() => updateItem(idx, fieldDef.key, !item[fieldDef.key])}
                      className={`w-7 h-3.5 rounded-full transition-[background-color,transform] relative ${item[fieldDef.key] ? 'bg-blue-500/40' : 'bg-app-elevated/40'}`}
                    >
                      <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full transition-[background-color,transform] ${item[fieldDef.key] ? 'left-3.5 bg-blue-400' : 'left-0.5 bg-app-elevated'}`} />
                    </button>
                  </div>
                ) : fieldDef.type === 'array' && fieldDef.fields ? (
                  <InlineNestedArrayField
                    label={fieldDef.label}
                    items={(item[fieldDef.key] as Array<Record<string, unknown>>) || []}
                    fieldDefs={fieldDef.fields}
                    maxItems={fieldDef.maxItems}
                    onUpdate={v => updateItem(idx, fieldDef.key, v)}
                  />
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] text-app-muted w-16 shrink-0">{fieldDef.label}</span>
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
                        className="flex-1 bg-app-surface/60 border border-app-border/30 rounded px-1.5 py-0.5 text-[9px] text-app-primary focus:outline-none focus:border-blue-500/40 transition-[background-color,border-color] min-w-0 resize-y"
                      />
                    ) : fieldDef.type === 'select' && fieldDef.options ? (
                      <select
                        value={String(item[fieldDef.key] || '')}
                        onChange={e => updateItem(idx, fieldDef.key, e.target.value)}
                        className="flex-1 bg-app-surface/60 border border-app-border/30 rounded px-1.5 py-0.5 text-[9px] text-app-primary focus:outline-none focus:border-blue-500/40 transition-[background-color,border-color] min-w-0"
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
                        className="flex-1 bg-app-surface/60 border border-app-border/30 rounded px-1.5 py-0.5 text-[9px] text-app-primary focus:outline-none focus:border-blue-500/40 transition-[background-color,border-color] min-w-0"
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-[9px] text-app-muted italic">Belum ada item</div>
        )}
      </div>
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
    'r': 'bg-red-500', 'p': 'bg-purple-500', 'bg': 'bg-app-elevated', 'card': 'bg-app-elevated',
  };
  return (
    <div className="flex gap-0.5 flex-1 flex-wrap items-center">
      {/* Inline color swatch preview */}
      {TOKEN_COLORS[value] && (
        <span className={`inline-block w-3 h-3 rounded-full ${TOKEN_COLORS[value]} mr-1 ring-1 ring-app-border/30 flex-shrink-0`} />
      )}
      {TOKENS.map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`w-4 h-4 rounded-full transition-[background-color,border-color,transform] border ${
            value === t ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-app-surface' : 'border-app-border/30 hover:scale-[1.05]'
          } ${TOKEN_COLORS[t] || 'bg-app-elevated'}`}
          title={t}
        />
      ))}
    </div>
  );
}

/** Inline nested array editor for array sub-fields (compact, no label) */
function InlineNestedArrayField({ label, items, fieldDefs, maxItems, onUpdate }: {
  label: string;
  items: Array<Record<string, unknown>>;
  fieldDefs: Array<{
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
  maxItems?: number;
  onUpdate: (items: Array<Record<string, unknown>>) => void;
}) {
  const updateNestedItem = (idx: number, field: string, value: unknown) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    onUpdate(newItems);
  };

  const addNestedItem = () => {
    if (maxItems && items.length >= maxItems) return;
    const newItem: Record<string, unknown> = {};
    fieldDefs.forEach(f => {
      if (f.type === 'boolean') newItem[f.key] = false;
      else if (f.type === 'number') newItem[f.key] = f.defaultValue ?? 0;
      else newItem[f.key] = f.defaultValue ?? '';
    });
    onUpdate([...items, newItem]);
  };

  const removeNestedItem = (idx: number) => {
    const newItems = items.filter((_, i) => i !== idx);
    onUpdate(newItems);
  };

  const moveNestedItem = (idx: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newItems.length) return;
    [newItems[idx], newItems[targetIdx]] = [newItems[targetIdx], newItems[idx]];
    onUpdate(newItems);
  };

  return (
    <div className="mt-0.5">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[8px] font-bold text-app-muted flex items-center gap-0.5">
          <GripVertical size={7} className="text-app-muted/40" />
          {label} ({items.length})
        </span>
        <button
          onClick={addNestedItem}
          disabled={maxItems ? items.length >= maxItems : false}
          className="flex items-center gap-0.5 text-[7px] font-bold text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-40"
        >
          <Plus size={7} /> Tambah
        </button>
      </div>
      <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar pr-0.5">
        {items.map((item, idx) => (
          <div key={idx} className="bg-app-surface/30 rounded border border-app-border/15 p-1 space-y-0.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-0.5">
                <span className="text-[7px] font-bold text-app-muted">#{idx + 1}</span>
                {idx > 0 && (
                  <button onClick={() => moveNestedItem(idx, 'up')} className="text-[7px] text-app-muted hover:text-app-secondary" title="Atas">↑</button>
                )}
                {idx < items.length - 1 && (
                  <button onClick={() => moveNestedItem(idx, 'down')} className="text-[7px] text-app-muted hover:text-app-secondary" title="Bawah">↓</button>
                )}
              </div>
              <button
                onClick={() => removeNestedItem(idx)}
                className="flex items-center gap-0.5 text-[7px] text-red-400/60 hover:text-red-400 transition-colors"
                title="Hapus item"
              >
                <Trash2 size={7} /> Hapus
              </button>
            </div>
            {fieldDefs.map((fieldDef) => (
              <div key={fieldDef.key}>
                {fieldDef.type === 'boolean' ? (
                  <div className="flex items-center justify-between">
                    <span className="text-[7px] text-app-muted">{fieldDef.label}</span>
                    <button
                      onClick={() => updateNestedItem(idx, fieldDef.key, !item[fieldDef.key])}
                      className={`w-6 h-3 rounded-full transition-[background-color,transform] relative ${item[fieldDef.key] ? 'bg-blue-500/40' : 'bg-app-elevated/40'}`}
                    >
                      <div className={`absolute top-0.5 w-2 h-2 rounded-full transition-[background-color,transform] ${item[fieldDef.key] ? 'left-3 bg-blue-400' : 'left-0.5 bg-app-elevated'}`} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-[7px] text-app-muted w-14 shrink-0">{fieldDef.label}</span>
                    {fieldDef.type === 'color' ? (
                      <InlineColorTokenField
                        value={String(item[fieldDef.key] || 'y')}
                        onChange={v => updateNestedItem(idx, fieldDef.key, v)}
                      />
                    ) : fieldDef.type === 'textarea' ? (
                      <textarea
                        value={String(item[fieldDef.key] || '')}
                        onChange={e => updateNestedItem(idx, fieldDef.key, e.target.value)}
                        rows={1}
                        className="flex-1 bg-app-surface/60 border border-app-border/30 rounded px-1 py-0.5 text-[8px] text-app-primary focus:outline-none focus:border-blue-500/40 transition-[background-color,border-color] min-w-0 resize-y"
                      />
                    ) : (
                      <input
                        type={fieldDef.type === 'number' ? 'number' : 'text'}
                        value={String(item[fieldDef.key] || '')}
                        onChange={e => updateNestedItem(idx, fieldDef.key, e.target.value)}
                        placeholder={fieldDef.placeholder}
                        className="flex-1 bg-app-surface/60 border border-app-border/30 rounded px-1 py-0.5 text-[8px] text-app-primary focus:outline-none focus:border-blue-500/40 transition-[background-color,border-color] min-w-0"
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-[7px] text-app-muted italic">Belum ada item</div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// JSON FIELD EDITOR — Smart structured editor replacing raw JSON
// ═══════════════════════════════════════════════════════════════

/** Smart JSON editor that detects value type and renders appropriate UI */
function JsonFieldEditor({ label, value, defaultValue, onChange, fieldId, helpId, helpText }: {
  label: string;
  value: unknown;
  defaultValue: unknown;
  onChange: (value: unknown) => void;
  fieldId?: string;
  helpId?: string;
  helpText?: string;
}) {
  // Detect value type
  if (Array.isArray(value) && value.length > 0 && value.every(v => typeof v === 'string')) {
    return (
      <div className="group relative">
        <StringArrayEditor items={value as string[]} onChange={onChange} label={label} />
        {helpText && <span id={helpId} className="sr-only">{helpText}</span>}
        {defaultValue !== undefined && JSON.stringify(value) !== JSON.stringify(defaultValue) && (
          <button
            onClick={() => onChange(defaultValue)}
            className="absolute top-0 right-0 h-5 w-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity text-app-muted hover:text-app-accent"
            title="Reset ke default"
            aria-label="Reset ke default"
          >
            <RotateCcw size={10} />
          </button>
        )}
      </div>
    );
  }

  if (Array.isArray(value) && value.length > 0 && value.every(v => typeof v === 'object' && v !== null)) {
    return (
      <div className="group relative">
        <ObjectArrayEditor items={value as Array<Record<string, unknown>>} onChange={onChange} label={label} />
        {helpText && <span id={helpId} className="sr-only">{helpText}</span>}
        {defaultValue !== undefined && JSON.stringify(value) !== JSON.stringify(defaultValue) && (
          <button
            onClick={() => onChange(defaultValue)}
            className="absolute top-0 right-0 h-5 w-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity text-app-muted hover:text-app-accent"
            title="Reset ke default"
            aria-label="Reset ke default"
          >
            <RotateCcw size={10} />
          </button>
        )}
      </div>
    );
  }

  // Fallback: raw JSON textarea with validation
  return (
    <div className="group relative">
      <JsonTextarea label={label} value={value} onChange={onChange} fieldId={fieldId} helpId={helpId} helpText={helpText} />
      {defaultValue !== undefined && JSON.stringify(value) !== JSON.stringify(defaultValue) && (
        <button
          onClick={() => onChange(defaultValue)}
          className="absolute top-0 right-0 h-5 w-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity text-app-muted hover:text-app-accent"
          title="Reset ke default"
          aria-label="Reset ke default"
        >
          <RotateCcw size={10} />
        </button>
      )}
    </div>
  );
}

/** Tag-style editor for arrays of strings */
function StringArrayEditor({ label, items, onChange }: {
  label: string;
  items: string[];
  onChange: (value: unknown) => void;
}) {
  const [inputValue, setInputValue] = useState('');

  const addItem = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onChange([...items, trimmed]);
    setInputValue('');
  };

  const removeItem = (idx: number) => {
    const newItems = items.filter((_, i) => i !== idx);
    onChange(newItems);
  };

  const moveItem = (idx: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newItems.length) return;
    [newItems[idx], newItems[targetIdx]] = [newItems[targetIdx], newItems[idx]];
    onChange(newItems);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addItem();
    }
  };

  return (
    <div className="space-y-1">
      <label className="text-[9px] font-bold text-app-muted uppercase tracking-wider flex items-center gap-1">
        <List size={9} /> {label} ({items.length})
      </label>
      {/* Tags/chips */}
      <div className="flex flex-wrap gap-1 min-h-[20px]">
        {items.map((item, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-app-accent/10 border border-app-accent/20 rounded text-[9px] text-app-accent group/tag"
          >
            {/* Move up/down buttons */}
            <span className="flex items-center gap-px mr-0.5">
              {idx > 0 && (
                <button
                  onClick={() => moveItem(idx, 'up')}
                  className="text-[7px] text-app-muted/50 hover:text-app-accent transition-colors"
                  title="Pindah ke atas"
                >
                  ↑
                </button>
              )}
              {idx < items.length - 1 && (
                <button
                  onClick={() => moveItem(idx, 'down')}
                  className="text-[7px] text-app-muted/50 hover:text-app-accent transition-colors"
                  title="Pindah ke bawah"
                >
                  ↓
                </button>
              )}
            </span>
            {item}
            <button
              onClick={() => removeItem(idx)}
              className="text-app-muted/50 hover:text-red-400 transition-colors ml-0.5"
              title="Hapus"
            >
              <X size={8} />
            </button>
          </span>
        ))}
      </div>
      {/* Input to add new items */}
      <div className="flex gap-1">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ketik lalu Enter untuk menambah..."
          className="flex-1 bg-app-surface/60 border border-app-border/30 rounded px-2 py-1 text-[9px] text-app-primary focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-[background-color,border-color]"
        />
        <button
          onClick={addItem}
          disabled={!inputValue.trim()}
          className="flex items-center gap-0.5 px-2 py-1 text-[8px] font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded transition-colors disabled:opacity-40"
        >
          <Plus size={9} /> Tambah
        </button>
      </div>
    </div>
  );
}

/** Structured row editor for arrays of objects */
function ObjectArrayEditor({ label, items, onChange }: {
  label: string;
  items: Array<Record<string, unknown>>;
  onChange: (value: unknown) => void;
}) {
  const updateItem = (idx: number, key: string, value: unknown) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [key]: value };
    onChange(newItems);
  };

  const removeItem = (idx: number) => {
    const newItems = items.filter((_, i) => i !== idx);
    onChange(newItems);
  };

  const moveItem = (idx: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newItems.length) return;
    [newItems[idx], newItems[targetIdx]] = [newItems[targetIdx], newItems[idx]];
    onChange(newItems);
  };

  const addItem = () => {
    // Create a new item with empty string values for all keys
    const template: Record<string, unknown> = {};
    if (items.length > 0) {
      for (const key of Object.keys(items[0])) {
        template[key] = typeof items[0][key] === 'number' ? 0 : '';
      }
    }
    onChange([...items, template]);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-[9px] font-bold text-app-muted uppercase tracking-wider flex items-center gap-1">
          <List size={9} /> {label} ({items.length})
        </label>
        <button
          onClick={addItem}
          className="flex items-center gap-0.5 text-[8px] font-bold text-blue-400 hover:text-blue-300 transition-colors"
        >
          <Plus size={9} /> Tambah Item
        </button>
      </div>
      <div className="space-y-1.5 max-h-80 overflow-y-auto custom-scrollbar pr-1">
        {items.map((item, idx) => (
          <div key={idx} className="bg-app-surface/40 rounded border border-app-border/20 p-1.5 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <GripVertical size={10} className="text-app-muted/40 cursor-grab" />
                <span className="text-[8px] font-bold text-app-muted">#{idx + 1}</span>
                {idx > 0 && (
                  <button onClick={() => moveItem(idx, 'up')} className="text-[8px] text-app-muted hover:text-app-secondary transition-colors">↑</button>
                )}
                {idx < items.length - 1 && (
                  <button onClick={() => moveItem(idx, 'down')} className="text-[8px] text-app-muted hover:text-app-secondary transition-colors">↓</button>
                )}
              </div>
              <button
                onClick={() => removeItem(idx)}
                className="flex items-center gap-0.5 text-[8px] text-red-400/60 hover:text-red-400 transition-colors"
              >
                <Trash2 size={9} /> Hapus
              </button>
            </div>
            {Object.entries(item).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1">
                <span className="text-[8px] text-app-muted w-16 shrink-0">{key}</span>
                <input
                  type={typeof val === 'number' ? 'number' : 'text'}
                  value={String(val || '')}
                  onChange={e => {
                    const newVal = typeof val === 'number' ? Number(e.target.value) : e.target.value;
                    updateItem(idx, key, newVal);
                  }}
                  className="flex-1 bg-app-surface/60 border border-app-border/30 rounded px-1.5 py-0.5 text-[9px] text-app-primary focus:outline-none focus:border-blue-500/40 transition-[background-color,border-color] min-w-0"
                />
              </div>
            ))}
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-[9px] text-app-muted italic">Belum ada item</div>
        )}
      </div>
    </div>
  );
}

/** Raw JSON textarea with validation — fallback for complex JSON */
function JsonTextarea({ label, value, onChange, fieldId, helpId, helpText }: {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
  fieldId?: string;
  helpId?: string;
  helpText?: string;
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
    } catch {
      setError('JSON tidak valid');
    }
  };

  return (
    <div className="space-y-0.5">
      <label htmlFor={fieldId} className="text-[9px] font-bold text-app-muted uppercase tracking-wider flex items-center gap-1">
        <HelpCircle size={9} /> {label}
      </label>
      <textarea
        id={fieldId}
        value={text}
        onChange={e => handleChange(e.target.value)}
        rows={4}
        aria-describedby={helpId}
        className={`w-full bg-app-surface/60 border rounded px-2 py-1 text-[9px] text-app-primary font-mono resize-y focus:outline-none focus:ring-1 transition-[background-color,border-color] ${
          error ? 'border-red-500/40 focus:ring-red-500/20' : 'border-app-border/30 focus:border-blue-500/40 focus:ring-blue-500/20'
        }`}
      />
      {error && <div className="text-[8px] text-red-400" role="alert">{error}</div>}
      {helpText && (
        <span id={helpId} className="text-[8px] text-app-muted sr-only">{helpText}</span>
      )}
    </div>
  );
}
