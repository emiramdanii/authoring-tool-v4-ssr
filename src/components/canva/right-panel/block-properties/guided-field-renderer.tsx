'use client';

// ═══════════════════════════════════════════════════════════════
// GUIDED FIELD RENDERER — Maps GuidedFieldDef → SILSE v4 styled components
// ═══════════════════════════════════════════════════════════════
// Reuses the same stitch-styled components from field-registry.tsx
// but adapted for GuidedFieldDef (teacher-focused, content-first).
//
// Key differences from field-registry:
//   - helpText shown inline (not just on hover)
//   - placeholder always visible
//   - required indicator on labels
//   - maxItems enforced with visual feedback
//   - No layout/style fields — content only
//
// SILSE v4 spec:
//   - Input fields: rounded-xl border-silse-outline-variant bg-silse-surface-bright
//     focus:border-silse-secondary focus:ring-2 focus:ring-silse-secondary/20
//   - Labels: text-sm font-bold text-silse-on-surface-variant
//   - Color picker: rounded color swatch + name
// ═══════════════════════════════════════════════════════════════

import React from 'react';
// All icons migrated to Material Symbols Outlined
import type { GuidedFieldDef } from '@/core/schema/guided-patch';
import { nanoid } from 'nanoid';

// ── Shared SILSE v4 Styles ──────────────────────────────────────

const INPUT_BASE = 'w-full px-3 py-2.5 rounded-xl border border-silse-outline-variant/40 bg-silse-surface-container-low text-silse-on-surface text-sm focus:border-silse-secondary focus:ring-2 focus:ring-silse-secondary/20 focus:outline-none transition-all duration-200 placeholder:text-silse-on-surface-variant/40';
const LABEL_BASE = 'text-[12px] font-bold text-silse-on-surface mb-1.5 block tracking-wide';

// ── Resolve select options (static + dynamic optionsFrom) ───

function resolveSelectOptions(
  fieldDef: GuidedFieldDef,
  blockData: Record<string, unknown>,
): Array<{ label: string; value: string }> {
  // If optionsFrom is defined, try to resolve dynamic options from block data
  if (fieldDef.optionsFrom) {
    const { field, labelKey, valueKey } = fieldDef.optionsFrom;
    const sourceArray = blockData[field] as Array<Record<string, unknown>> | undefined;
    if (sourceArray && Array.isArray(sourceArray) && sourceArray.length > 0) {
      return sourceArray
        .filter(item => item[labelKey] != null && item[valueKey] != null)
        .map(item => ({
          label: String(item[labelKey]),
          value: String(item[valueKey]),
        }));
    }
    // Fallback to static options if dynamic source is empty
    return fieldDef.options || [];
  }
  return fieldDef.options || [];
}

// ── Main Render Dispatch ──────────────────────────────────────

export function renderGuidedField(
  field: GuidedFieldDef,
  blockData: Record<string, unknown>,
  onUpdate: (updates: Record<string, unknown>) => void,
): React.ReactNode {
  const value = blockData[field.key];
  const handleUpdate = (v: unknown) => onUpdate({ [field.key]: v });
  const fieldId = `guided-${field.key}`;

  switch (field.type) {
    case 'text':
      return (
        <GuidedTextField
          key={field.key}
          fieldId={fieldId}
          fieldDef={field}
          value={String(value || '')}
          onChange={v => handleUpdate(v)}
        />
      );

    case 'textarea':
      return (
        <GuidedTextareaField
          key={field.key}
          fieldId={fieldId}
          fieldDef={field}
          value={String(value || '')}
          onChange={v => handleUpdate(v)}
        />
      );

    case 'richtext':
      return (
        <GuidedRichtextField
          key={field.key}
          fieldId={fieldId}
          fieldDef={field}
          value={String(value || '')}
          onChange={v => handleUpdate(v)}
        />
      );

    case 'number':
      return (
        <GuidedNumberField
          key={field.key}
          fieldId={fieldId}
          fieldDef={field}
          value={Number(value ?? 0)}
          onChange={v => handleUpdate(v)}
        />
      );

    case 'color':
      return (
        <GuidedColorField
          key={field.key}
          fieldId={fieldId}
          fieldDef={field}
          value={String(value || 'y')}
          onChange={v => handleUpdate(v)}
        />
      );

    case 'select': {
      const resolvedOptions = resolveSelectOptions(field, blockData);
      return (
        <GuidedSelectField
          key={field.key}
          fieldId={fieldId}
          fieldDef={field}
          value={String(value || '')}
          onChange={v => handleUpdate(v)}
          resolvedOptions={resolvedOptions}
        />
      );
    }

    case 'boolean':
      return (
        <GuidedBooleanField
          key={field.key}
          fieldId={fieldId}
          fieldDef={field}
          value={Boolean(value)}
          onChange={v => handleUpdate(v)}
        />
      );

    case 'icon':
      return (
        <GuidedIconField
          key={field.key}
          fieldId={fieldId}
          fieldDef={field}
          value={String(value || '')}
          onChange={v => handleUpdate(v)}
        />
      );

    case 'array': {
      // Support flat string arrays: when sub-field key is '', the array is string[]
      // not Array<Record<string, unknown>>. Convert at the boundary.
      const isFlatStringArray = field.fields?.length === 1 && field.fields[0]!.key === '';
      const rawItems = (value as Array<unknown>) || [];
      const items = isFlatStringArray
        ? rawItems.map(item => ({ '': item }))
        : (rawItems as Array<Record<string, unknown>>);
      const handleArrayUpdate = isFlatStringArray
        ? (updatedItems: Array<Record<string, unknown>>) => handleUpdate(updatedItems.map(item => item[''] ?? ''))
        : (updatedItems: Array<Record<string, unknown>>) => handleUpdate(updatedItems);
      return (
        <GuidedArrayField
          key={field.key}
          fieldId={fieldId}
          fieldDef={field}
          items={items}
          onUpdate={handleArrayUpdate}
          blockData={blockData}
        />
      );
    }

    default:
      return null;
  }
}

// ── Label with required indicator ─────────────────────────────

function GuidedLabel({ fieldDef, fieldId, icon }: {
  fieldDef: GuidedFieldDef;
  fieldId: string;
  icon?: React.ReactNode;
}) {
  return (
    <label htmlFor={fieldId} className={LABEL_BASE}>
      <span className="flex items-center gap-1.5">
        {icon} {fieldDef.label}
        {fieldDef.required && (
          <span className="material-symbols-outlined text-silse-error" style={ { fontSize: '10px' } }>star</span>
        )}
      </span>
    </label>
  );
}

// ── Help text ─────────────────────────────────────────────────

function HelpText({ text, id }: { text?: string; id?: string }) {
  if (!text) return null;
  return <span id={id} className="text-[10px] text-silse-on-surface-variant mt-1.5 block leading-relaxed">{text}</span>;
}

// ═══════════════════════════════════════════════════════════════
// FIELD COMPONENTS — SILSE v4 + Guided (teacher-friendly)
// ═══════════════════════════════════════════════════════════════

function GuidedTextField({ fieldDef, value, onChange, fieldId }: {
  fieldDef: GuidedFieldDef;
  value: string;
  onChange: (v: string) => void;
  fieldId: string;
}) {
  const helpId = fieldDef.helpText ? `${fieldId}-help` : undefined;
  return (
    <div>
      <GuidedLabel fieldDef={fieldDef} fieldId={fieldId} icon={<span className="material-symbols-outlined text-silse-on-surface-variant" style={ { fontSize: '14px' } }>text_fields</span>} />
      <input
        id={fieldId}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={fieldDef.placeholder}
        aria-describedby={helpId}
        className={INPUT_BASE}
      />
      <HelpText text={fieldDef.helpText} id={helpId} />
    </div>
  );
}

function GuidedTextareaField({ fieldDef, value, onChange, fieldId }: {
  fieldDef: GuidedFieldDef;
  value: string;
  onChange: (v: string) => void;
  fieldId: string;
}) {
  const helpId = fieldDef.helpText ? `${fieldId}-help` : undefined;
  return (
    <div>
      <GuidedLabel fieldDef={fieldDef} fieldId={fieldId} icon={<span className="material-symbols-outlined text-silse-on-surface-variant" style={ { fontSize: '14px' } }>format_align_left</span>} />
      <textarea
        id={fieldId}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={fieldDef.placeholder}
        rows={4}
        aria-describedby={helpId}
        className="w-full px-4 py-3 rounded-xl border border-silse-outline-variant/40 bg-silse-surface-container-low text-silse-on-surface text-sm leading-relaxed focus:border-silse-secondary focus:ring-2 focus:ring-silse-secondary/20 focus:outline-none transition-all duration-200 resize-y"
      />
      <HelpText text={fieldDef.helpText} id={helpId} />
    </div>
  );
}

function GuidedRichtextField({ fieldDef, value, onChange, fieldId }: {
  fieldDef: GuidedFieldDef;
  value: string;
  onChange: (v: string) => void;
  fieldId: string;
}) {
  const helpId = fieldDef.helpText ? `${fieldId}-help` : undefined;

  const insertMarkup = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById(fieldId) as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const newValue = value.substring(0, start) + prefix + selected + suffix + value.substring(end);
    onChange(newValue);
  };

  return (
    <div>
      <GuidedLabel fieldDef={fieldDef} fieldId={fieldId} icon={<span className="material-symbols-outlined text-silse-on-surface-variant" style={ { fontSize: '14px' } }>format_align_left</span>} />
      <div className="border border-silse-outline-variant rounded-xl overflow-hidden bg-silse-surface-bright focus-within:border-silse-secondary focus-within:ring-2 focus-within:ring-silse-secondary/20 transition-all duration-200">
        {/* Mini toolbar */}
        <div className="flex gap-1 p-2 border-b border-silse-outline-variant bg-silse-surface-container-low">
          <button
            onClick={() => insertMarkup('<strong>', '</strong>')}
            className="p-1.5 hover:bg-silse-surface-bright rounded-lg transition-colors text-silse-on-surface-variant hover:text-silse-on-surface"
            title="Tebal"
            type="button"
          >
            <span className="material-symbols-outlined" style={ { fontSize: '14px' } }>format_bold</span>
          </button>
          <button
            onClick={() => insertMarkup('<em>', '</em>')}
            className="p-1.5 hover:bg-silse-surface-bright rounded-lg transition-colors text-silse-on-surface-variant hover:text-silse-on-surface"
            title="Miring"
            type="button"
          >
            <span className="material-symbols-outlined" style={ { fontSize: '14px' } }>format_italic</span>
          </button>
          <button
            onClick={() => insertMarkup('<ul>\n<li>', '</li>\n</ul>')}
            className="p-1.5 hover:bg-silse-surface-bright rounded-lg transition-colors text-silse-on-surface-variant hover:text-silse-on-surface"
            title="Daftar"
            type="button"
          >
            <span className="material-symbols-outlined" style={ { fontSize: '14px' } }>checklist</span>
          </button>
        </div>
        <textarea
          id={fieldId}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={fieldDef.placeholder}
          rows={5}
          aria-describedby={helpId}
          className="w-full px-4 py-3 border-none bg-transparent focus:ring-0 focus:outline-none text-sm leading-relaxed text-silse-on-surface resize-y"
        />
      </div>
      <HelpText text={fieldDef.helpText} id={helpId} />
    </div>
  );
}

function GuidedNumberField({ fieldDef, value, onChange, fieldId }: {
  fieldDef: GuidedFieldDef;
  value: number;
  onChange: (v: number) => void;
  fieldId: string;
}) {
  const helpId = fieldDef.helpText ? `${fieldId}-help` : undefined;
  return (
    <div>
      <GuidedLabel fieldDef={fieldDef} fieldId={fieldId} icon={<span className="material-symbols-outlined text-silse-on-surface-variant" style={ { fontSize: '14px' } }>tag</span>} />
      <input
        id={fieldId}
        type="number"
        value={value}
        min={fieldDef.min}
        max={fieldDef.max}
        step={1}
        onChange={e => onChange(Number(e.target.value))}
        aria-describedby={helpId}
        className={INPUT_BASE}
      />
      <HelpText text={fieldDef.helpText} id={helpId} />
    </div>
  );
}

// ── Color Token Field ─────────────────────────────────────────
// Same visual as field-registry.tsx ColorTokenField but using GuidedFieldDef
// SILSE v4: rounded color swatch + name label

const TOKEN_COLORS: Record<string, { label: string; swatch: string; bg: string; activeBg: string; activeText: string; ring: string }> = {
  'y': { label: 'Kuning', swatch: 'bg-amber-500', bg: 'bg-amber-500/10', activeBg: 'bg-amber-500/20', activeText: 'text-amber-700', ring: 'ring-amber-500/40' },
  'c': { label: 'Cyan', swatch: 'bg-cyan-500', bg: 'bg-cyan-500/10', activeBg: 'bg-cyan-500/20', activeText: 'text-cyan-700', ring: 'ring-cyan-500/40' },
  'g': { label: 'Hijau', swatch: 'bg-emerald-500', bg: 'bg-emerald-500/10', activeBg: 'bg-emerald-500/20', activeText: 'text-emerald-700', ring: 'ring-emerald-500/40' },
  'r': { label: 'Merah', swatch: 'bg-red-500', bg: 'bg-red-500/10', activeBg: 'bg-red-500/20', activeText: 'text-red-700', ring: 'ring-red-500/40' },
  'p': { label: 'Ungu', swatch: 'bg-purple-500', bg: 'bg-purple-500/10', activeBg: 'bg-purple-500/20', activeText: 'text-purple-700', ring: 'ring-purple-500/40' },
  'o': { label: 'Oranye', swatch: 'bg-orange-500', bg: 'bg-orange-500/10', activeBg: 'bg-orange-500/20', activeText: 'text-orange-700', ring: 'ring-orange-500/40' },
  'bg': { label: 'Background', swatch: 'bg-gray-400', bg: 'bg-gray-500/10', activeBg: 'bg-gray-500/20', activeText: 'text-gray-700', ring: 'ring-gray-500/40' },
  'card': { label: 'Card', swatch: 'bg-gray-300', bg: 'bg-gray-400/10', activeBg: 'bg-gray-400/20', activeText: 'text-gray-700', ring: 'ring-gray-400/40' },
};

function GuidedColorField({ fieldDef, value, onChange, fieldId }: {
  fieldDef: GuidedFieldDef;
  value: string;
  onChange: (v: string) => void;
  fieldId: string;
}) {
  const availableTokens = fieldDef.options
    ? fieldDef.options.map(o => o.value)
    : Object.keys(TOKEN_COLORS);

  const currentToken = TOKEN_COLORS[value];

  return (
    <div>
      <label className={LABEL_BASE} id={fieldId}>
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-silse-on-surface-variant" style={ { fontSize: '14px' } }>palette</span> {fieldDef.label}
          {fieldDef.required && <span className="material-symbols-outlined text-silse-error" style={ { fontSize: '10px' } }>star</span>}
        </span>
        {/* Current color indicator: rounded swatch + name */}
        {currentToken && (
          <span className={`inline-flex items-center gap-1.5 ml-3 px-2.5 py-1 rounded-xl ${currentToken.activeBg} ${currentToken.activeText} text-[11px] font-bold ring-1 ${currentToken.ring}`}>
            <span className={`w-3.5 h-3.5 rounded-full ${currentToken.swatch} ring-1 ring-white/50`} />
            {currentToken.label}
          </span>
        )}
      </label>
      <div className="grid grid-cols-4 gap-2 mt-1">
        {availableTokens.map(key => {
          const tokenInfo = TOKEN_COLORS[key];
          if (!tokenInfo) return null;
          const isActive = value === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all duration-200 ${
                isActive
                  ? `${tokenInfo.activeBg} ${tokenInfo.activeText} border-current/30 ring-2 ring-current/20`
                  : 'bg-silse-surface-bright border-silse-outline-variant text-silse-on-surface-variant hover:bg-silse-surface-container-high hover:border-silse-on-surface-variant/30'
              }`}
              title={tokenInfo.label}
              type="button"
            >
              {/* Rounded color swatch */}
              <span className={`w-6 h-6 rounded-full ${tokenInfo.swatch} ring-1 ring-black/10 shadow-sm`} />
              {/* Color name */}
              <span className="text-[10px] font-bold">{tokenInfo.label}</span>
            </button>
          );
        })}
      </div>
      <HelpText text={fieldDef.helpText} />
    </div>
  );
}

// ── Select Field ──────────────────────────────────────────────

function GuidedSelectField({ fieldDef, value, onChange, fieldId, resolvedOptions }: {
  fieldDef: GuidedFieldDef;
  value: string;
  onChange: (v: string) => void;
  fieldId: string;
  /** Pre-resolved options (from static options + optionsFrom) */
  resolvedOptions?: Array<{ label: string; value: string }>;
}) {
  const helpId = fieldDef.helpText ? `${fieldId}-help` : undefined;
  const options = resolvedOptions || fieldDef.options || [];

  return (
    <div>
      <GuidedLabel fieldDef={fieldDef} fieldId={fieldId} icon={<span className="material-symbols-outlined text-silse-on-surface-variant" style={ { fontSize: '14px' } }>expand_more</span>} />
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
        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-silse-on-surface-variant pointer-events-none" style={ { fontSize: '16px' } }>expand_more</span>
      </div>
      <HelpText text={fieldDef.helpText} id={helpId} />
    </div>
  );
}

// ── Boolean Toggle ────────────────────────────────────────────

function GuidedBooleanField({ fieldDef, value, onChange, fieldId }: {
  fieldDef: GuidedFieldDef;
  value: boolean;
  onChange: (v: boolean) => void;
  fieldId: string;
}) {
  const helpId = fieldDef.helpText ? `${fieldId}-help` : undefined;
  return (
    <div>
      <div className="flex items-center justify-between p-3 rounded-xl bg-silse-surface-container-low border border-silse-outline-variant/30">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-silse-on-surface-variant" style={ { fontSize: '16px' } }>toggle_on</span>
          <span className="text-sm font-bold text-silse-on-surface">{fieldDef.label}</span>
        </div>
        <button
          id={fieldId}
          onClick={() => onChange(!value)}
          role="switch"
          aria-checked={value}
          aria-label={fieldDef.label}
          aria-describedby={helpId}
          className={`relative w-11 h-6 rounded-full transition-all duration-200 ${value ? 'bg-silse-primary' : 'bg-silse-surface-container-high'}`}
          type="button"
        >
          <div className={`absolute top-0.5 w-5 h-5 rounded-full shadow-sm transition-all duration-200 ${value ? 'left-5.5 bg-silse-on-primary' : 'left-0.5 bg-silse-surface-container-lowest'}`} />
        </button>
      </div>
      <HelpText text={fieldDef.helpText} id={helpId} />
    </div>
  );
}

// ── Icon Field (emoji input) ──────────────────────────────────

function GuidedIconField({ fieldDef, value, onChange, fieldId }: {
  fieldDef: GuidedFieldDef;
  value: string;
  onChange: (v: string) => void;
  fieldId: string;
}) {
  const helpId = fieldDef.helpText ? `${fieldId}-help` : undefined;
  return (
    <div>
      <GuidedLabel fieldDef={fieldDef} fieldId={fieldId} icon={<span className="material-symbols-outlined text-silse-on-surface-variant" style={ { fontSize: '14px' } }>palette</span>} />
      <div className="flex items-center gap-2">
        <span className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl bg-silse-surface-container-low border border-silse-outline-variant/50">
          {value || '🏠'}
        </span>
        <input
          id={fieldId}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={fieldDef.placeholder || '🏠'}
          aria-describedby={helpId}
          className={`flex-1 ${INPUT_BASE}`}
        />
      </div>
      <HelpText text={fieldDef.helpText} id={helpId} />
    </div>
  );
}

// ── Array Field — card-based item editor ──────────────────────

function GuidedArrayField({ fieldDef, items, onUpdate, fieldId: _fieldId, blockData }: {
  fieldDef: GuidedFieldDef;
  items: Array<Record<string, unknown>>;
  onUpdate: (items: Array<Record<string, unknown>>) => void;
  fieldId: string;
  /** Block data for resolving dynamic options (optionsFrom) in sub-fields */
  blockData?: Record<string, unknown>;
}) {
  const subFields = fieldDef.fields || [];
  const maxItems = fieldDef.maxItems;
  const isAtLimit = maxItems ? items.length >= maxItems : false;

  const updateItem = (idx: number, field: string, value: unknown) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    onUpdate(newItems);
  };

  const addItem = () => {
    if (isAtLimit) return;
    const newItem: Record<string, unknown> = {};
    subFields.forEach(f => {
      if (f.type === 'array') newItem[f.key] = [];
      else if (f.type === 'boolean') newItem[f.key] = false;
      else if (f.type === 'number') newItem[f.key] = f.min ?? 0;
      else newItem[f.key] = '';
    });
    // Auto-generate id if existing items have an 'id' field (e.g. sortir-game kolom/pool).
    // This ensures new items have a valid id without exposing the field to teachers.
    // Check both existing items and the fieldDef's autoId flag.
    const needsId = fieldDef.autoId || (items.length > 0 && items.some(it => it.id != null && it.id !== ''));
    if (needsId) newItem.id = nanoid(6);
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
    [newItems[idx]!, newItems[targetIdx]!] = [newItems[targetIdx]!, newItems[idx]!];
    onUpdate(newItems);
  };

  return (
    <div className="space-y-3">
      {/* Header with count + add button */}
      <div className="flex items-center justify-between">
        <label className={LABEL_BASE.replace('mb-2', 'mb-0')}>
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-silse-on-surface-variant" style={ { fontSize: '14px' } }>list</span> {fieldDef.label}
            <span className="text-silse-on-surface-variant font-normal">
              ({items.length}{maxItems ? `/${maxItems}` : ''})
            </span>
          </span>
        </label>
        <button
          onClick={addItem}
          disabled={isAtLimit}
          className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-silse-secondary hover:bg-silse-secondary/10 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          type="button"
        >
          <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>add</span> Tambah
        </button>
      </div>

      {/* Max items warning */}
      {isAtLimit && (
        <div className="px-3 py-2 rounded-xl bg-silse-tertiary-container/10 border border-silse-tertiary-container/20 text-[11px] text-silse-on-surface-variant flex items-center gap-2">
          <span className="text-silse-tertiary-container font-bold">STANDAR:</span> {fieldDef.helpText || `Maksimal ${maxItems} item per halaman`}
        </div>
      )}

      {/* Items */}
      <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
        {items.map((item, idx) => (
          <div key={idx} className="bg-silse-surface-container-low rounded-xl border border-silse-outline-variant/50 p-3 space-y-2.5">
            {/* Item header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-silse-on-surface-variant/40 cursor-grab" style={ { fontSize: '14px' } }>drag_indicator</span>
                <span className="text-sm font-bold text-silse-on-surface-variant">#{idx + 1}</span>
                <div className="flex gap-0.5">
                  {idx > 0 && (
                    <button onClick={() => moveItem(idx, 'up')} className="p-1 rounded-lg hover:bg-silse-surface-container-high text-silse-on-surface-variant transition-colors" title="Pindah ke atas" type="button">
                      <span className="text-[10px]">↑</span>
                    </button>
                  )}
                  {idx < items.length - 1 && (
                    <button onClick={() => moveItem(idx, 'down')} className="p-1 rounded-lg hover:bg-silse-surface-container-high text-silse-on-surface-variant transition-colors" title="Pindah ke bawah" type="button">
                      <span className="text-[10px]">↓</span>
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeItem(idx)}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-red-400/70 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Hapus item"
                type="button"
              >
                <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>delete</span> Hapus
              </button>
            </div>

            {/* Sub-fields */}
            {subFields.map(subField => (
              <div key={subField.key}>
                {subField.type === 'boolean' ? (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm font-bold text-silse-on-surface-variant">{subField.label}</span>
                    <button
                      onClick={() => updateItem(idx, subField.key, !item[subField.key])}
                      className={`relative w-9 h-5 rounded-full transition-all duration-200 ${item[subField.key] ? 'bg-silse-primary' : 'bg-silse-surface-container-high'}`}
                      type="button"
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full shadow-sm transition-all duration-200 ${item[subField.key] ? 'left-4 bg-silse-on-primary' : 'left-0.5 bg-silse-surface-container-lowest'}`} />
                    </button>
                  </div>
                ) : subField.type === 'array' && subField.fields ? (
                  <InlineGuidedNestedArray
                    fieldDef={subField}
                    items={(item[subField.key] as Array<Record<string, unknown>>) || []}
                    onUpdate={v => updateItem(idx, subField.key, v)}
                  />
                ) : subField.type === 'color' ? (
                  <div>
                    <label className="text-sm font-bold text-silse-on-surface-variant block mb-1">
                      {subField.label}
                    </label>
                    <InlineColorPicker
                      value={String(item[subField.key] || 'y')}
                      options={subField.options}
                      onChange={v => updateItem(idx, subField.key, v)}
                    />
                  </div>
                ) : subField.type === 'textarea' ? (
                  <div>
                    <label className="text-sm font-bold text-silse-on-surface-variant block mb-1">
                      {subField.label}
                      {subField.required && <span className="material-symbols-outlined inline ml-0.5 text-silse-error" style={ { fontSize: '8px' } }>star</span>}
                    </label>
                    <textarea
                      value={String(item[subField.key] || '')}
                      onChange={e => updateItem(idx, subField.key, e.target.value)}
                      placeholder={subField.placeholder}
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl border border-silse-outline-variant/40 bg-silse-surface-container-low text-sm text-silse-on-surface focus:border-silse-secondary focus:ring-2 focus:ring-silse-secondary/20 focus:outline-none transition-all resize-y"
                    />
                  </div>
                ) : subField.type === 'select' && (subField.options || subField.optionsFrom) ? (
                  <div>
                    <label className="text-sm font-bold text-silse-on-surface-variant block mb-1">{subField.label}</label>
                    <select
                      value={item[subField.key] != null ? String(item[subField.key]) : ''}
                      onChange={e => {
                        const raw = e.target.value;
                        // Auto-convert numeric strings to numbers (e.g. "0"→0 for ans index)
                        const parsed = raw !== '' && !isNaN(Number(raw)) ? Number(raw) : raw;
                        updateItem(idx, subField.key, parsed);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-silse-outline-variant/40 bg-silse-surface-container-low text-sm text-silse-on-surface focus:border-silse-secondary focus:outline-none transition-all"
                    >
                      <option value="">— pilih —</option>
                      {resolveSelectOptions(subField, blockData || {}).map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-bold text-silse-on-surface-variant block mb-1">
                      {subField.label}
                      {subField.required && <span className="material-symbols-outlined inline ml-0.5 text-silse-error" style={ { fontSize: '8px' } }>star</span>}
                    </label>
                    <input
                      type={subField.type === 'number' ? 'number' : 'text'}
                      value={String(item[subField.key] || '')}
                      onChange={e => updateItem(idx, subField.key, subField.type === 'number' ? Number(e.target.value) : e.target.value)}
                      placeholder={subField.placeholder}
                      min={subField.min}
                      max={subField.max}
                      className="w-full px-3 py-2 rounded-xl border border-silse-outline-variant/40 bg-silse-surface-container-low text-sm text-silse-on-surface focus:border-silse-secondary focus:ring-2 focus:ring-silse-secondary/20 focus:outline-none transition-all"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        {/* Empty state */}
        {items.length === 0 && (
          <div className="text-sm text-silse-on-surface-variant italic text-center py-4 bg-silse-surface-container-low rounded-xl border border-dashed border-silse-outline-variant">
            Belum ada item. Klik &ldquo;Tambah&rdquo; untuk menambah.
          </div>
        )}
      </div>

      {/* Help text */}
      <HelpText text={fieldDef.helpText} />
    </div>
  );
}

// ── Inline Color Picker (for array sub-fields) ───────────────
// SILSE v4: rounded color swatch + name

function InlineColorPicker({ value, options, onChange }: {
  value: string;
  options?: Array<{ label: string; value: string }>;
  onChange: (v: string) => void;
}) {
  const availableKeys = options ? options.map(o => o.value) : Object.keys(TOKEN_COLORS);
  const TOKEN_SWATCHES: Record<string, string> = {
    'y': 'bg-amber-500', 'c': 'bg-cyan-500', 'g': 'bg-emerald-500',
    'r': 'bg-red-500', 'p': 'bg-purple-500', 'o': 'bg-orange-500',
    'bg': 'bg-gray-400', 'card': 'bg-gray-300',
  };
  return (
    <div className="flex gap-1.5 flex-wrap items-center">
      {availableKeys.map(t => {
        const tokenInfo = TOKEN_COLORS[t];
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            className={`w-7 h-7 rounded-full transition-all duration-200 border-2 ${
              value === t
                ? 'ring-2 ring-silse-secondary ring-offset-2 ring-offset-silse-surface-bright border-silse-secondary/50 scale-110'
                : 'border-silse-outline-variant/30 hover:scale-105'
            } ${TOKEN_SWATCHES[t] || 'bg-gray-400'}`}
            title={tokenInfo?.label || t}
            type="button"
          />
        );
      })}
    </div>
  );
}

// ── Inline Nested Array (for array-of-arrays) ────────────────

function InlineGuidedNestedArray({ fieldDef, items, onUpdate }: {
  fieldDef: GuidedFieldDef;
  items: Array<Record<string, unknown>>;
  onUpdate: (items: Array<Record<string, unknown>>) => void;
}) {
  const subFields = fieldDef.fields || [];
  const maxItems = fieldDef.maxItems;

  const updateNested = (idx: number, field: string, value: unknown) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    onUpdate(newItems);
  };

  const addNested = () => {
    if (maxItems && items.length >= maxItems) return;
    const newItem: Record<string, unknown> = {};
    subFields.forEach(f => {
      if (f.type === 'boolean') newItem[f.key] = false;
      else if (f.type === 'number') newItem[f.key] = f.min ?? 0;
      else newItem[f.key] = '';
    });
    onUpdate([...items, newItem]);
  };

  const removeNested = (idx: number) => {
    const newItems = items.filter((_, i) => i !== idx);
    onUpdate(newItems);
  };

  const moveNested = (idx: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newItems.length) return;
    [newItems[idx]!, newItems[targetIdx]!] = [newItems[targetIdx]!, newItems[idx]!];
    onUpdate(newItems);
  };

  return (
    <div className="mt-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-silse-on-surface-variant flex items-center gap-1">
          <span className="material-symbols-outlined text-silse-on-surface-variant/40" style={ { fontSize: '10px' } }>drag_indicator</span>
          {fieldDef.label} ({items.length})
        </span>
        <button
          onClick={addNested}
          disabled={maxItems ? items.length >= maxItems : false}
          className="flex items-center gap-0.5 text-[10px] font-bold text-silse-secondary hover:bg-silse-secondary/10 px-2 py-1 rounded-lg transition-colors disabled:opacity-40"
          type="button"
        >
          <span className="material-symbols-outlined" style={ { fontSize: '10px' } }>add</span> Tambah
        </button>
      </div>
      <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
        {items.map((item, idx) => (
          <div key={idx} className="bg-silse-surface-bright rounded-xl border border-silse-outline-variant/30 p-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-silse-on-surface-variant">#{idx + 1}</span>
                {idx > 0 && (
                  <button onClick={() => moveNested(idx, 'up')} className="text-[9px] text-silse-on-surface-variant hover:text-silse-secondary transition-colors" title="Atas" type="button">↑</button>
                )}
                {idx < items.length - 1 && (
                  <button onClick={() => moveNested(idx, 'down')} className="text-[9px] text-silse-on-surface-variant hover:text-silse-secondary transition-colors" title="Bawah" type="button">↓</button>
                )}
              </div>
              <button
                onClick={() => removeNested(idx)}
                className="flex items-center gap-0.5 text-[9px] text-red-400/60 hover:text-red-500 transition-colors"
                title="Hapus item"
                type="button"
              >
                <span className="material-symbols-outlined" style={ { fontSize: '9px' } }>delete</span> Hapus
              </button>
            </div>
            {subFields.map(subField => (
              <div key={subField.key}>
                {subField.type === 'boolean' ? (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-silse-on-surface-variant">{subField.label}</span>
                    <button
                      onClick={() => updateNested(idx, subField.key, !item[subField.key])}
                      className={`relative w-7 h-4 rounded-full transition-all duration-200 ${item[subField.key] ? 'bg-silse-primary' : 'bg-silse-surface-container-high'}`}
                      type="button"
                    >
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full shadow-sm transition-all duration-200 ${item[subField.key] ? 'left-3.5 bg-silse-on-primary' : 'left-0.5 bg-silse-surface-container-lowest'}`} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-silse-on-surface-variant w-16 shrink-0">{subField.label}</span>
                    {subField.type === 'color' ? (
                      <InlineColorPicker
                        value={String(item[subField.key] || 'y')}
                        options={subField.options}
                        onChange={v => updateNested(idx, subField.key, v)}
                      />
                    ) : subField.type === 'textarea' ? (
                      <textarea
                        value={String(item[subField.key] || '')}
                        onChange={e => updateNested(idx, subField.key, e.target.value)}
                        rows={1}
                        className="flex-1 px-2 py-1 rounded-xl border border-silse-outline-variant/30 bg-silse-surface-container-low text-[11px] text-silse-on-surface focus:border-silse-secondary focus:outline-none transition-all resize-y min-w-0"
                      />
                    ) : (
                      <input
                        type={subField.type === 'number' ? 'number' : 'text'}
                        value={String(item[subField.key] || '')}
                        onChange={e => updateNested(idx, subField.key, subField.type === 'number' ? Number(e.target.value) : e.target.value)}
                        placeholder={subField.placeholder}
                        className="flex-1 px-2 py-1 rounded-xl border border-silse-outline-variant/30 bg-silse-surface-container-low text-[11px] text-silse-on-surface focus:border-silse-secondary focus:outline-none transition-all min-w-0"
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-[10px] text-silse-on-surface-variant italic text-center py-2">Belum ada item</div>
        )}
      </div>
    </div>
  );
}
