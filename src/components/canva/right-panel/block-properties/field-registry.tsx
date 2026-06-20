'use client';

import React, { useState, useRef, useCallback } from 'react';
// All icons migrated to Material Symbols Outlined
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
            icon={<span className="material-symbols-outlined text-on-surface-variant" style={ { fontSize: '14px' } }>palette</span>}
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

const INPUT_BASE = 'w-full px-4 py-3 rounded-xl border border-silse-outline-variant/40 bg-silse-surface-container-low text-silse-on-surface font-body-md text-sm focus:border-silse-secondary focus:ring-2 focus:ring-silse-secondary/20 focus:outline-none transition-all duration-200';
const LABEL_BASE = 'text-[12px] font-bold text-silse-on-surface mb-2 block';

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
          <span className="material-symbols-outlined" style={ { fontSize: '14px' } }>refresh</span>
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
          <span className="material-symbols-outlined text-on-surface-variant" style={ { fontSize: '14px' } }>format_align_left</span> {label}
        </span>
      </label>
      <div className="border border-silse-outline-variant/40 rounded-xl overflow-hidden bg-silse-surface-container-low focus-within:border-silse-secondary focus-within:ring-2 focus-within:ring-silse-secondary/20 transition-all duration-200">
        {/* Mini toolbar — stitch spec */}
        <div className="flex gap-1 p-2 border-b border-silse-outline-variant/30 bg-silse-surface-container">
          <button className="p-1.5 hover:bg-white rounded-lg transition-colors text-on-surface-variant hover:text-on-surface" title="Tebal">
            <span className="material-symbols-outlined" style={ { fontSize: '14px' } }>format_bold</span>
          </button>
          <button className="p-1.5 hover:bg-white rounded-lg transition-colors text-on-surface-variant hover:text-on-surface" title="Miring">
            <span className="material-symbols-outlined" style={ { fontSize: '14px' } }>format_italic</span>
          </button>
          <button className="p-1.5 hover:bg-white rounded-lg transition-colors text-on-surface-variant hover:text-on-surface" title="Daftar">
            <span className="material-symbols-outlined" style={ { fontSize: '14px' } }>checklist</span>
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
          <span className="material-symbols-outlined text-on-surface-variant" style={ { fontSize: '14px' } }>tag</span> {label}
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
          <span className="material-symbols-outlined text-on-surface-variant" style={ { fontSize: '14px' } }>palette</span> {label}
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
          <span className="material-symbols-outlined text-on-surface-variant" style={ { fontSize: '14px' } }>expand_more</span> {label}
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
        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" style={ { fontSize: '16px' } }>expand_more</span>
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
      <div className="flex items-center justify-between p-3 rounded-xl bg-silse-surface-container-low border border-silse-outline-variant/30">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-silse-on-surface-variant" style={ { fontSize: '16px' } }>toggle_on</span>
          <span className="text-[12px] font-bold text-silse-on-surface">{label}</span>
        </div>
        <button
          id={fieldId}
          onClick={() => onChange(!value)}
          role="switch"
          aria-checked={value}
          aria-label={label}
          aria-describedby={helpId}
          className={`relative w-11 h-6 rounded-full transition-all duration-200 ${value ? 'bg-silse-primary' : 'bg-silse-surface-container-high'}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 rounded-full shadow-sm transition-all duration-200 ${value ? 'left-5.5 bg-silse-on-primary' : 'left-0.5 bg-silse-surface-container-lowest'}`} />
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
          <span className="material-symbols-outlined text-on-surface-variant" style={ { fontSize: '14px' } }>grid_view</span> {label}
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
      // Sprint 8.7B: exclusiveToggle for radio-style boolean in nested arrays
      exclusiveToggle?: boolean;
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
            <span className="material-symbols-outlined text-on-surface-variant" style={ { fontSize: '14px' } }>list</span> {label}
            <span className="text-on-surface-variant font-normal">({items.length})</span>
          </span>
        </label>
        <button
          onClick={addItem}
          disabled={maxItems ? items.length >= maxItems : false}
          className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-secondary hover:bg-secondary/10 rounded-lg transition-colors disabled:opacity-40"
        >
          <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>add</span> Tambah
        </button>
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
        {items.map((item, idx) => (
          <div key={idx} className="bg-surface-container-low rounded-xl border border-outline-variant/50 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant/40 cursor-grab" style={ { fontSize: '14px' } }>drag_indicator</span>
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
                <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>delete</span> Hapus
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
    // Sprint 8.7B: exclusiveToggle for radio-style boolean in arrays
    exclusiveToggle?: boolean;
  }>;
  maxItems?: number;
  onUpdate: (items: Array<Record<string, unknown>>) => void;
}) {
  // Sprint 8.8B-Patch-2 + Patch-3: when field is 'posisi' (hotspot-image
  // preset position), parse "x,y" string into x + y numbers and write BOTH
  // to the item. Also strip any stale 'posisi' field from legacy items.
  // The 'posisi' field is NEVER stored on the block — it's a UI-only
  // abstraction that maps to HotspotImageBlock.hotspots[].x and .y.
  const updateNestedItem = (idx: number, field: string, value: unknown) => {
    if (field === 'posisi') {
      const { parseHotspotPosition } = require('@/core/schema/hotspot-position');
      const { x, y } = parseHotspotPosition(value);
      const newItems = [...items];
      // Strip stale 'posisi' field if it exists (from legacy add or pre-Patch-3)
      const { posisi: _stripped, ...rest } = newItems[idx] as Record<string, unknown>;
      newItems[idx] = { ...rest, x, y };
      onUpdate(newItems);
      return;
    }
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    onUpdate(newItems);
  };

  const addNestedItem = () => {
    if (maxItems && items.length >= maxItems) return;
    const newItem: Record<string, unknown> = {};
    fieldDefs.forEach(f => {
      // Sprint 8.8B-Patch-3: 'posisi' is a UI-only field for hotspot-image.
      // Don't store 'posisi' on the item — store x=50, y=50 (center) instead.
      if (f.key === 'posisi') {
        newItem['x'] = 50;
        newItem['y'] = 50;
        return;
      }
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
          <span className="material-symbols-outlined text-on-surface-variant/40" style={ { fontSize: '10px' } }>drag_indicator</span>
          {label} ({items.length})
        </span>
        <button
          onClick={addNestedItem}
          disabled={maxItems ? items.length >= maxItems : false}
          className="flex items-center gap-0.5 text-[10px] font-bold text-secondary hover:bg-secondary/10 px-2 py-1 rounded-md transition-colors disabled:opacity-40"
        >
          <span className="material-symbols-outlined" style={ { fontSize: '10px' } }>add</span> Tambah
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
                <span className="material-symbols-outlined" style={ { fontSize: '9px' } }>delete</span> Hapus
              </button>
            </div>
            {fieldDefs.map((fieldDef) => (
              <div key={fieldDef.key}>
                {fieldDef.type === 'boolean' && fieldDef.exclusiveToggle ? (
                  // Sprint 8.7B: exclusiveToggle renders as radio button (A/B/C/D style).
                  // When clicked, sets this item's field=true AND all siblings' same field=false.
                  // Schema unchanged — still writes boolean to opts[].correct.
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-on-surface-variant">{fieldDef.label}</span>
                    <button
                      onClick={() => {
                        // Set ALL items' field to false, then this one to true
                        const newItems = items.map((it, i) => ({
                          ...it,
                          [fieldDef.key]: i === idx,
                        }));
                        onUpdate(newItems);
                      }}
                      className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                        item[fieldDef.key]
                          ? 'bg-secondary border-secondary'
                          : 'bg-transparent border-outline-variant hover:border-secondary/50'
                      }`}
                      role="radio"
                      aria-checked={!!item[fieldDef.key]}
                      aria-label={`${fieldDef.label} ${String.fromCharCode(65 + idx)}`}
                    >
                      {Boolean(item[fieldDef.key]) && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white mx-auto mt-[3px]" />
                      )}
                    </button>
                  </div>
                ) : fieldDef.type === 'boolean' ? (
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
                    ) : fieldDef.type === 'select' && fieldDef.options ? (
                      // Sprint 8.8B-Patch-2: for 'posisi' field, derive value from x,y
                      <select
                        value={fieldDef.key === 'posisi'
                          ? `${item['x'] ?? 50},${item['y'] ?? 50}`
                          : String(item[fieldDef.key] || '')
                        }
                        onChange={e => updateNestedItem(idx, fieldDef.key, e.target.value)}
                        className="flex-1 px-2 py-1 rounded-md border border-outline-variant/30 bg-surface-bright text-[11px] text-on-surface focus:border-secondary focus:outline-none transition-all min-w-0"
                      >
                        {fieldDef.options.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
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
            <span className="material-symbols-outlined" style={ { fontSize: '14px' } }>refresh</span>
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
            <span className="material-symbols-outlined" style={ { fontSize: '14px' } }>refresh</span>
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
          <span className="material-symbols-outlined" style={ { fontSize: '14px' } }>refresh</span>
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
          <span className="material-symbols-outlined text-on-surface-variant" style={ { fontSize: '14px' } }>list</span> {label}
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
              <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>close</span>
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
          <span className="material-symbols-outlined" style={ { fontSize: '14px' } }>add</span> Tambah
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
            <span className="material-symbols-outlined text-on-surface-variant" style={ { fontSize: '14px' } }>list</span> {label}
            <span className="text-on-surface-variant font-normal">({items.length})</span>
          </span>
        </label>
        <button onClick={addItem} className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-secondary hover:bg-secondary/10 rounded-lg transition-colors">
          <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>add</span> Tambah
        </button>
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
        {items.map((item, idx) => (
          <div key={idx} className="bg-surface-container-low rounded-xl border border-outline-variant/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-on-surface-variant/40 cursor-grab" style={ { fontSize: '12px' } }>drag_indicator</span>
                <span className="text-[11px] font-bold text-on-surface-variant">#{idx + 1}</span>
                <div className="flex gap-0.5">
                  {idx > 0 && <button onClick={() => moveItem(idx, 'up')} className="text-[10px] text-on-surface-variant hover:text-secondary transition-colors">↑</button>}
                  {idx < items.length - 1 && <button onClick={() => moveItem(idx, 'down')} className="text-[10px] text-on-surface-variant hover:text-secondary transition-colors">↓</button>}
                </div>
              </div>
              <button onClick={() => removeItem(idx)} className="flex items-center gap-0.5 text-[10px] text-error/60 hover:text-error transition-colors">
                <span className="material-symbols-outlined" style={ { fontSize: '10px' } }>delete</span> Hapus
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
          <span className="material-symbols-outlined text-on-surface-variant" style={ { fontSize: '14px' } }>text_fields</span> {label}
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
