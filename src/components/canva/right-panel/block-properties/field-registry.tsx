'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Type, AlignLeft, List, Palette, LayoutGrid, Hash, ToggleLeft, ChevronDown,
  Plus, Trash2, GripVertical, X, RotateCcw, Bold, Italic, ListChecks,
} from 'lucide-react';
import type { PropertyField } from '@/core/editor/types';
import { getNestedValue, buildNestedUpdate } from './dot-notation';

// ═══════════════════════════════════════════════════════════════
// FIELD RENDERER — Stitch v4 Style
// ═══════════════════════════════════════════════════════════════
// Stitch design tokens:
//   - Input: px-4 py-3 rounded-xl border border-outline-variant bg-surface-bright
//   - Label: font-label-lg text-[12px] font-bold text-on-surface-variant mb-2
//   - Focus: focus:border-secondary focus:ring-2 focus:ring-secondary/20
//   - Section header: text-[11px] uppercase tracking-widest font-bold text-outline
// ═══════════════════════════════════════════════════════════════

export function renderField(
  field: PropertyField,
  blockData: Record<string, unknown>,
  onUpdate: (updates: Record<string, unknown>) => void,
): React.ReactNode {
  const value = getNestedValue(blockData, field.key);
  const handleUpdate = (v: unknown) => onUpdate(buildNestedUpdate(field.key, v));
  const defaultValue = field.defaultValue;
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
            icon={field.icon ? <span className="text-sm">{field.icon}</span> : undefined}
            placeholder={field.placeholder}
            onChange={v => handleUpdate(v)}
          />
        </FieldWithReset>
      );

    case 'textarea':
      return (
        <FieldWithReset key={field.key} defaultValue={defaultValue} value={value} onReset={v => handleUpdate(v)}>
          <RichTextareaField
            fieldId={fieldId}
            helpId={helpId}
            helpText={field.helpText}
            label={field.label}
            value={String(value || '')}
            placeholder={field.placeholder}
            rows={field.rows || 4}
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
            icon={<Palette size={14} className="text-on-surface-variant" />}
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
// SHARED STITCH STYLES
// ═══════════════════════════════════════════════════════════════

const INPUT_BASE = 'w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-bright text-on-surface font-body-md text-sm focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-none transition-all duration-200';
const LABEL_BASE = 'text-[12px] font-bold text-on-surface-variant mb-2 block';

// ═══════════════════════════════════════════════════════════════
// FIELD WITH RESET
// ═══════════════════════════════════════════════════════════════

function FieldWithReset({ defaultValue, value, onReset, children }: {
  defaultValue: unknown;
  value: unknown;
  onReset: (value: unknown) => void;
  children: React.ReactNode;
}) {
  const hasDefault = defaultValue !== undefined && defaultValue !== null;
  const isModified = hasDefault && JSON.stringify(value) !== JSON.stringify(defaultValue);

  if (!hasDefault) return <>{children}</>;

  return (
    <div className="group relative">
      {children}
      {isModified && (
        <button
          onClick={() => onReset(defaultValue)}
          className="absolute top-8 right-2 h-7 w-7 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 text-on-surface-variant hover:text-secondary hover:bg-secondary/10"
          title="Reset ke default"
        >
          <RotateCcw size={14} />
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TEXT FIELD — Stitch style: large rounded input
// ═══════════════════════════════════════════════════════════════

function TextField({ label, value, icon, onChange, placeholder, fieldId, helpId, helpText }: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  onChange: (value: string) => void;
  placeholder?: string;
  fieldId?: string;
  helpId?: string;
  helpText?: string;
}) {
  return (
    <div>
      <label htmlFor={fieldId} className={LABEL_BASE}>
        <span className="flex items-center gap-1.5">
          {icon} {label}
        </span>
      </label>
      <input
        id={fieldId}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-describedby={helpId}
        className={INPUT_BASE}
      />
      {helpText && <span id={helpId} className="text-[10px] text-on-surface-variant mt-1 block">{helpText}</span>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// RICH TEXTAREA — Stitch style: mini toolbar + textarea
// ═══════════════════════════════════════════════════════════════

function RichTextareaField({ label, value, onChange, placeholder, rows = 4, fieldId, helpId, helpText }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  fieldId?: string;
  helpId?: string;
  helpText?: string;
}) {
  return (
    <div>
      <label htmlFor={fieldId} className={LABEL_BASE}>
        <span className="flex items-center gap-1.5">
          <AlignLeft size={14} className="text-on-surface-variant" /> {label}
        </span>
      </label>
      <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface-bright focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20 transition-all duration-200">
        {/* Mini toolbar — stitch spec */}
        <div className="flex gap-1 p-2 border-b border-outline-variant bg-surface-container-low">
          <button className="p-1.5 hover:bg-white rounded-lg transition-colors text-on-surface-variant hover:text-on-surface" title="Tebal">
            <Bold size={14} />
          </button>
          <button className="p-1.5 hover:bg-white rounded-lg transition-colors text-on-surface-variant hover:text-on-surface" title="Miring">
            <Italic size={14} />
          </button>
          <button className="p-1.5 hover:bg-white rounded-lg transition-colors text-on-surface-variant hover:text-on-surface" title="Daftar">
            <ListChecks size={14} />
          </button>
        </div>
        <textarea
          id={fieldId}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          aria-describedby={helpId}
          className="w-full px-4 py-3 border-none bg-transparent focus:ring-0 focus:outline-none text-sm font-body-md leading-relaxed text-on-surface resize-y"
        />
      </div>
      {helpText && <span id={helpId} className="text-[10px] text-on-surface-variant mt-1 block">{helpText}</span>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// NUMBER FIELD — Stitch style
// ═══════════════════════════════════════════════════════════════

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
    <div>
      <label htmlFor={fieldId} className={LABEL_BASE}>
        <span className="flex items-center gap-1.5">
          <Hash size={14} className="text-on-surface-variant" /> {label}
        </span>
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
        className={INPUT_BASE}
      />
      {helpText && <span id={helpId} className="text-[10px] text-on-surface-variant mt-1 block">{helpText}</span>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COLOR TOKEN FIELD — Stitch style: visual swatch + color name
// ═══════════════════════════════════════════════════════════════

const TOKEN_COLORS: Record<string, { label: string; swatch: string; bg: string; activeBg: string; activeText: string; ring: string }> = {
  'y': { label: 'Kuning', swatch: 'bg-amber-500', bg: 'bg-amber-500/10', activeBg: 'bg-amber-500/20', activeText: 'text-amber-700', ring: 'ring-amber-500/40' },
  'c': { label: 'Cyan', swatch: 'bg-cyan-500', bg: 'bg-cyan-500/10', activeBg: 'bg-cyan-500/20', activeText: 'text-cyan-700', ring: 'ring-cyan-500/40' },
  'g': { label: 'Hijau', swatch: 'bg-emerald-500', bg: 'bg-emerald-500/10', activeBg: 'bg-emerald-500/20', activeText: 'text-emerald-700', ring: 'ring-emerald-500/40' },
  'r': { label: 'Merah', swatch: 'bg-red-500', bg: 'bg-red-500/10', activeBg: 'bg-red-500/20', activeText: 'text-red-700', ring: 'ring-red-500/40' },
  'p': { label: 'Ungu', swatch: 'bg-purple-500', bg: 'bg-purple-500/10', activeBg: 'bg-purple-500/20', activeText: 'text-purple-700', ring: 'ring-purple-500/40' },
  'bg': { label: 'Background', swatch: 'bg-gray-400', bg: 'bg-gray-500/10', activeBg: 'bg-gray-500/20', activeText: 'text-gray-700', ring: 'ring-gray-500/40' },
  'card': { label: 'Card', swatch: 'bg-gray-300', bg: 'bg-gray-400/10', activeBg: 'bg-gray-400/20', activeText: 'text-gray-700', ring: 'ring-gray-400/40' },
};

function ColorTokenField({ label, value, onChange, fieldId }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  fieldId?: string;
}) {
  const currentToken = TOKEN_COLORS[value];

  return (
    <div>
      <label className={LABEL_BASE} id={fieldId}>
        <span className="flex items-center gap-1.5">
          <Palette size={14} className="text-on-surface-variant" /> {label}
        </span>
        {/* Inline color swatch preview */}
        {currentToken && (
          <span className={`inline-flex items-center gap-1.5 ml-3 px-2.5 py-1 rounded-lg ${currentToken.activeBg} ${currentToken.activeText} text-[11px] font-bold ring-1 ${currentToken.ring}`}>
            <span className={`w-3.5 h-3.5 rounded-full ${currentToken.swatch} ring-1 ring-white/50`} />
            {currentToken.label}
          </span>
        )}
      </label>
      <div className="grid grid-cols-4 gap-2 mt-1">
        {Object.entries(TOKEN_COLORS).map(([key, { label: colorLabel, swatch, bg, activeBg, activeText }]) => {
          const isActive = value === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all duration-200 ${
                isActive
                  ? `${activeBg} ${activeText} border-current/30 ring-2 ring-current/20`
                  : 'bg-surface-bright border-outline-variant text-on-surface-variant hover:bg-surface-container-high hover:border-on-surface-variant/30'
              }`}
              title={colorLabel}
            >
              <span className={`w-6 h-6 rounded-full ${swatch} ring-1 ring-black/10 shadow-sm`} />
              <span className="text-[10px] font-bold">{colorLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SELECT FIELD — Stitch style: custom styled dropdown
// ═══════════════════════════════════════════════════════════════

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
    <div>
      <label htmlFor={fieldId} className={LABEL_BASE}>
        <span className="flex items-center gap-1.5">
          <ChevronDown size={14} className="text-on-surface-variant" /> {label}
        </span>
      </label>
      <div className="relative">
        <select
          id={fieldId}
          value={value}
          onChange={e => onChange(e.target.value)}
          aria-describedby={helpId}
          className={`${INPUT_BASE} appearance-none pr-10`}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
      </div>
      {helpText && <span id={helpId} className="text-[10px] text-on-surface-variant mt-1 block">{helpText}</span>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BOOLEAN FIELD — Stitch style: toggle switch with accent
// ═══════════════════════════════════════════════════════════════

function BooleanField({ label, value, onChange, fieldId, helpId, helpText }: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  fieldId?: string;
  helpId?: string;
  helpText?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between p-3 rounded-xl bg-secondary-container/10 border border-secondary/20">
        <div className="flex items-center gap-2">
          <ToggleLeft size={16} className="text-secondary" />
          <span className="text-[12px] font-bold text-on-secondary-fixed-variant">{label}</span>
        </div>
        <button
          id={fieldId}
          onClick={() => onChange(!value)}
          role="switch"
          aria-checked={value}
          aria-label={label}
          aria-describedby={helpId}
          className={`relative w-11 h-6 rounded-full transition-all duration-200 ${value ? 'bg-secondary' : 'bg-outline-variant'}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200 ${value ? 'left-5.5' : 'left-0.5'}`} />
        </button>
      </div>
      {helpText && <span id={helpId} className="text-[10px] text-on-surface-variant mt-1 block">{helpText}</span>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// VARIANT FIELD — Stitch style: three option pills
// ═══════════════════════════════════════════════════════════════

const VARIANT_LABELS: Record<string, string> = { A: 'Standar', B: 'Ringkas', C: 'Lebar' };

function VariantField({ label, value, onChange, fieldId }: {
  label: string;
  value: string;
  onChange: (value: 'A' | 'B' | 'C') => void;
  fieldId?: string;
}) {
  return (
    <div>
      <div className={LABEL_BASE} id={fieldId}>
        <span className="flex items-center gap-1.5">
          <LayoutGrid size={14} className="text-on-surface-variant" /> {label}
        </span>
      </div>
      <div className="flex gap-2" role="group" aria-labelledby={fieldId}>
        {(['A', 'B', 'C'] as const).map(v => {
          const isActive = value === v;
          return (
            <button
              key={v}
              onClick={() => onChange(v)}
              role="radio"
              aria-checked={isActive}
              aria-label={`Varian ${v}`}
              className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold border transition-all duration-200 ${
                isActive
                  ? 'bg-secondary/15 text-secondary border-secondary/30 ring-2 ring-secondary/10'
                  : 'bg-surface-bright text-on-surface-variant border-outline-variant hover:bg-surface-container-high'
              }`}
            >
              {VARIANT_LABELS[v]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ARRAY FIELD — Stitch style: card-based item editor
// ═══════════════════════════════════════════════════════════════

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
    [newItems[idx]!, newItems[targetIdx]!] = [newItems[targetIdx]!, newItems[idx]];
    onUpdate(newItems);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className={LABEL_BASE.replace('mb-2', 'mb-0')}>
          <span className="flex items-center gap-1.5">
            <List size={14} className="text-on-surface-variant" /> {label}
            <span className="text-on-surface-variant font-normal">({items.length})</span>
          </span>
        </label>
        <button
          onClick={addItem}
          disabled={maxItems ? items.length >= maxItems : false}
          className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-secondary hover:bg-secondary/10 rounded-lg transition-colors disabled:opacity-40"
        >
          <Plus size={12} /> Tambah
        </button>
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
        {items.map((item, idx) => (
          <div key={idx} className="bg-surface-container-low rounded-xl border border-outline-variant/50 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical size={14} className="text-on-surface-variant/40 cursor-grab" />
                <span className="text-[12px] font-bold text-on-surface-variant">#{idx + 1}</span>
                <div className="flex gap-0.5">
                  {idx > 0 && (
                    <button onClick={() => moveItem(idx, 'up')} className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant transition-colors" title="Pindah ke atas">
                      <span className="text-[10px]">↑</span>
                    </button>
                  )}
                  {idx < items.length - 1 && (
                    <button onClick={() => moveItem(idx, 'down')} className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant transition-colors" title="Pindah ke bawah">
                      <span className="text-[10px]">↓</span>
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeItem(idx)}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-error/70 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                title="Hapus item"
              >
                <Trash2 size={12} /> Hapus
              </button>
            </div>
            {fieldDefs.map((fieldDef) => (
              <div key={fieldDef.key}>
                {fieldDef.type === 'boolean' ? (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[12px] text-on-surface-variant">{fieldDef.label}</span>
                    <button
                      onClick={() => updateItem(idx, fieldDef.key, !item[fieldDef.key])}
                      className={`relative w-9 h-5 rounded-full transition-all duration-200 ${item[fieldDef.key] ? 'bg-secondary' : 'bg-outline-variant'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${item[fieldDef.key] ? 'left-4' : 'left-0.5'}`} />
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
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-on-surface-variant">{fieldDef.label}</label>
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
                        className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-bright text-sm text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary/20 focus:outline-none transition-all resize-y"
                      />
                    ) : fieldDef.type === 'select' && fieldDef.options ? (
                      <select
                        value={String(item[fieldDef.key] || '')}
                        onChange={e => updateItem(idx, fieldDef.key, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-bright text-sm text-on-surface focus:border-secondary focus:outline-none transition-all"
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
                        className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-bright text-sm text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary/20 focus:outline-none transition-all"
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-[12px] text-on-surface-variant italic text-center py-4 bg-surface-container-low rounded-xl border border-dashed border-outline-variant">
            Belum ada item. Klik &ldquo;Tambah&rdquo; untuk menambah.
          </div>
        )}
      </div>
    </div>
  );
}

/** Inline color token selector for array sub-fields */
function InlineColorTokenField({ value, onChange }: {
  value: string;
  onChange: (value: string) => void;
}) {
  const TOKENS = ['y', 'c', 'g', 'r', 'p', 'bg', 'card'] as const;
  const TOKEN_SWATCHES: Record<string, string> = {
    'y': 'bg-amber-500', 'c': 'bg-cyan-500', 'g': 'bg-emerald-500',
    'r': 'bg-red-500', 'p': 'bg-purple-500', 'bg': 'bg-gray-400', 'card': 'bg-gray-300',
  };
  return (
    <div className="flex gap-1.5 flex-wrap items-center">
      {TOKENS.map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`w-7 h-7 rounded-full transition-all duration-200 border-2 ${
            value === t
              ? 'ring-2 ring-secondary ring-offset-2 ring-offset-surface-bright border-secondary/50 scale-110'
              : 'border-outline-variant/30 hover:scale-105'
          } ${TOKEN_SWATCHES[t] || 'bg-gray-400'}`}
          title={t}
        />
      ))}
    </div>
  );
}

/** Inline nested array editor for array sub-fields */
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
    [newItems[idx]!, newItems[targetIdx]!] = [newItems[targetIdx]!, newItems[idx]];
    onUpdate(newItems);
  };

  return (
    <div className="mt-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1">
          <GripVertical size={10} className="text-on-surface-variant/40" />
          {label} ({items.length})
        </span>
        <button
          onClick={addNestedItem}
          disabled={maxItems ? items.length >= maxItems : false}
          className="flex items-center gap-0.5 text-[10px] font-bold text-secondary hover:bg-secondary/10 px-2 py-1 rounded-md transition-colors disabled:opacity-40"
        >
          <Plus size={10} /> Tambah
        </button>
      </div>
      <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
        {items.map((item, idx) => (
          <div key={idx} className="bg-surface-bright rounded-lg border border-outline-variant/30 p-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-on-surface-variant">#{idx + 1}</span>
                {idx > 0 && (
                  <button onClick={() => moveNestedItem(idx, 'up')} className="text-[9px] text-on-surface-variant hover:text-secondary transition-colors" title="Atas">↑</button>
                )}
                {idx < items.length - 1 && (
                  <button onClick={() => moveNestedItem(idx, 'down')} className="text-[9px] text-on-surface-variant hover:text-secondary transition-colors" title="Bawah">↓</button>
                )}
              </div>
              <button
                onClick={() => removeNestedItem(idx)}
                className="flex items-center gap-0.5 text-[9px] text-error/60 hover:text-error transition-colors"
                title="Hapus item"
              >
                <Trash2 size={9} /> Hapus
              </button>
            </div>
            {fieldDefs.map((fieldDef) => (
              <div key={fieldDef.key}>
                {fieldDef.type === 'boolean' ? (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-on-surface-variant">{fieldDef.label}</span>
                    <button
                      onClick={() => updateNestedItem(idx, fieldDef.key, !item[fieldDef.key])}
                      className={`relative w-7 h-4 rounded-full transition-all duration-200 ${item[fieldDef.key] ? 'bg-secondary' : 'bg-outline-variant'}`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-200 ${item[fieldDef.key] ? 'left-3.5' : 'left-0.5'}`} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-on-surface-variant w-16 shrink-0">{fieldDef.label}</span>
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
                        className="flex-1 px-2 py-1 rounded-md border border-outline-variant/30 bg-surface-bright text-[11px] text-on-surface focus:border-secondary focus:outline-none transition-all resize-y min-w-0"
                      />
                    ) : (
                      <input
                        type={fieldDef.type === 'number' ? 'number' : 'text'}
                        value={String(item[fieldDef.key] || '')}
                        onChange={e => updateNestedItem(idx, fieldDef.key, e.target.value)}
                        placeholder={fieldDef.placeholder}
                        className="flex-1 px-2 py-1 rounded-md border border-outline-variant/30 bg-surface-bright text-[11px] text-on-surface focus:border-secondary focus:outline-none transition-all min-w-0"
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-[10px] text-on-surface-variant italic text-center py-2">Belum ada item</div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// JSON FIELD EDITOR — Smart structured editor
// ═══════════════════════════════════════════════════════════════

function JsonFieldEditor({ label, value, defaultValue, onChange, fieldId, helpId, helpText }: {
  label: string;
  value: unknown;
  defaultValue: unknown;
  onChange: (value: unknown) => void;
  fieldId?: string;
  helpId?: string;
  helpText?: string;
}) {
  if (Array.isArray(value) && value.length > 0 && value.every(v => typeof v === 'string')) {
    return (
      <div className="group relative">
        <StringArrayEditor items={value as string[]} onChange={onChange} label={label} />
        {helpText && <span id={helpId} className="sr-only">{helpText}</span>}
        {defaultValue !== undefined && JSON.stringify(value) !== JSON.stringify(defaultValue) && (
          <button
            onClick={() => onChange(defaultValue)}
            className="absolute top-8 right-2 h-7 w-7 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-all text-on-surface-variant hover:text-secondary hover:bg-secondary/10"
            title="Reset ke default"
          >
            <RotateCcw size={14} />
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
            className="absolute top-8 right-2 h-7 w-7 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-all text-on-surface-variant hover:text-secondary hover:bg-secondary/10"
            title="Reset ke default"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="group relative">
      <JsonTextarea label={label} value={value} onChange={onChange} fieldId={fieldId} helpId={helpId} helpText={helpText} />
      {defaultValue !== undefined && JSON.stringify(value) !== JSON.stringify(defaultValue) && (
        <button
          onClick={() => onChange(defaultValue)}
          className="absolute top-8 right-2 h-7 w-7 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-all text-on-surface-variant hover:text-secondary hover:bg-secondary/10"
          title="Reset ke default"
        >
          <RotateCcw size={14} />
        </button>
      )}
    </div>
  );
}

/** Tag-style editor for arrays of strings — stitch style chips */
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
    [newItems[idx]!, newItems[targetIdx]!] = [newItems[targetIdx], newItems[idx]];
    onChange(newItems);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addItem();
    }
  };

  return (
    <div className="space-y-2">
      <label className={LABEL_BASE}>
        <span className="flex items-center gap-1.5">
          <List size={14} className="text-on-surface-variant" /> {label}
          <span className="text-on-surface-variant font-normal">({items.length})</span>
        </span>
      </label>
      {/* Chips */}
      <div className="flex flex-wrap gap-1.5 min-h-[24px]">
        {items.map((item, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-container/20 border border-primary/20 rounded-lg text-[12px] text-primary font-medium group/tag"
          >
            <span className="flex items-center gap-0.5 mr-0.5">
              {idx > 0 && (
                <button onClick={() => moveItem(idx, 'up')} className="text-on-surface-variant/50 hover:text-primary transition-colors" title="Pindah ke atas">↑</button>
              )}
              {idx < items.length - 1 && (
                <button onClick={() => moveItem(idx, 'down')} className="text-on-surface-variant/50 hover:text-primary transition-colors" title="Pindah ke bawah">↓</button>
              )}
            </span>
            {item}
            <button onClick={() => removeItem(idx)} className="text-on-surface-variant/50 hover:text-error transition-colors ml-0.5" title="Hapus">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ketik lalu Enter..."
          className={`flex-1 ${INPUT_BASE}`}
        />
        <button
          onClick={addItem}
          disabled={!inputValue.trim()}
          className="flex items-center gap-1 px-4 py-3 text-[12px] font-bold text-secondary bg-secondary/10 hover:bg-secondary/20 rounded-xl transition-colors disabled:opacity-40"
        >
          <Plus size={14} /> Tambah
        </button>
      </div>
    </div>
  );
}

/** Structured row editor for arrays of objects — stitch style */
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
    [newItems[idx]!, newItems[targetIdx]!] = [newItems[targetIdx]!, newItems[idx]];
    onChange(newItems);
  };

  const addItem = () => {
    const template: Record<string, unknown> = {};
    if (items.length > 0) {
      for (const key of Object.keys(items[0])) {
        template[key] = typeof items[0]![key] === 'number' ? 0 : '';
      }
    }
    onChange([...items, template]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className={LABEL_BASE.replace('mb-2', 'mb-0')}>
          <span className="flex items-center gap-1.5">
            <List size={14} className="text-on-surface-variant" /> {label}
            <span className="text-on-surface-variant font-normal">({items.length})</span>
          </span>
        </label>
        <button onClick={addItem} className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-secondary hover:bg-secondary/10 rounded-lg transition-colors">
          <Plus size={12} /> Tambah
        </button>
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
        {items.map((item, idx) => (
          <div key={idx} className="bg-surface-container-low rounded-xl border border-outline-variant/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <GripVertical size={12} className="text-on-surface-variant/40 cursor-grab" />
                <span className="text-[11px] font-bold text-on-surface-variant">#{idx + 1}</span>
                <div className="flex gap-0.5">
                  {idx > 0 && <button onClick={() => moveItem(idx, 'up')} className="text-[10px] text-on-surface-variant hover:text-secondary transition-colors">↑</button>}
                  {idx < items.length - 1 && <button onClick={() => moveItem(idx, 'down')} className="text-[10px] text-on-surface-variant hover:text-secondary transition-colors">↓</button>}
                </div>
              </div>
              <button onClick={() => removeItem(idx)} className="flex items-center gap-0.5 text-[10px] text-error/60 hover:text-error transition-colors">
                <Trash2 size={10} /> Hapus
              </button>
            </div>
            {Object.entries(item).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[11px] text-on-surface-variant w-20 shrink-0">{key}</span>
                <input
                  type={typeof val === 'number' ? 'number' : 'text'}
                  value={String(val ?? '')}
                  onChange={e => updateItem(idx, key, typeof val === 'number' ? Number(e.target.value) : e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-bright text-[12px] text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary/20 focus:outline-none transition-all min-w-0"
                />
              </div>
            ))}
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-[12px] text-on-surface-variant italic text-center py-3">Belum ada item</div>
        )}
      </div>
    </div>
  );
}

/** Raw JSON textarea — fallback */
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
    catch { return String(value); }
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
    <div>
      <label htmlFor={fieldId} className={LABEL_BASE}>
        <span className="flex items-center gap-1.5">
          <Type size={14} className="text-on-surface-variant" /> {label}
        </span>
      </label>
      <textarea
        id={fieldId}
        value={text}
        onChange={e => handleChange(e.target.value)}
        rows={4}
        aria-describedby={helpId}
        className={`w-full px-4 py-3 rounded-xl border bg-surface-bright text-sm font-mono text-on-surface focus:outline-none focus:ring-2 transition-all resize-y ${
          error ? 'border-error/50 focus:ring-error/20' : 'border-outline-variant focus:border-secondary focus:ring-secondary/20'
        }`}
      />
      {error && <div className="text-[10px] text-error mt-1">{error}</div>}
      {helpText && <span id={helpId} className="text-[10px] text-on-surface-variant mt-1 block">{helpText}</span>}
    </div>
  );
}
