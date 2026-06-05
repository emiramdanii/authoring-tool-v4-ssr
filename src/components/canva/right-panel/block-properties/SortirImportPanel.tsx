'use client';

// ═══════════════════════════════════════════════════════════════════
// SORTIR IMPORT PANEL — JSON import UI for sorting game blocks
// ═══════════════════════════════════════════════════════════════════
// Sprint 2F — Allows teachers to paste JSON from AI tools
// to populate a sorting game with columns and items at once.
//
// UX Flow:
//   1. Click "Import JSON" to expand the panel
//   2. Paste JSON or click "Salin Contoh Format" to get a template
//   3. Click "Validasi" to check the JSON
//   4. Review any errors/warnings
//   5. Click "Terapkan" to apply the validated data
//
// KEY: pool[].category in JSON = kolom label (human-readable)
//      mapper converts to kolom.id (internal nanoid)
// ═══════════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import {
  parseSortirImportJSON,
  validateSortirImportPayload,
  mapSortirImportToPatch,
  SORTIR_IMPORT_SAMPLE,
  type SortirImportValidation,
} from '@/core/schema/sortir-import';
import { applyGuidedSchemaPatch } from '@/core/schema/guided-patch';

interface SortirImportPanelProps {
  /** Page ID of the active block */
  pageId: string;
  /** Block ID of the active sortir-game block */
  blockId: string;
}

export function SortirImportPanel({ pageId, blockId }: SortirImportPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [validation, setValidation] = useState<SortirImportValidation | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  // ── Validate handler ──
  const handleValidate = useCallback(() => {
    setApplied(false);
    setParseError(null);

    const { data, error } = parseSortirImportJSON(jsonText);
    if (error) {
      setParseError(error);
      setValidation(null);
      return;
    }

    const result = validateSortirImportPayload(data);
    setValidation(result);
  }, [jsonText]);

  // ── Apply handler ──
  const handleApply = useCallback(() => {
    if (!validation || !validation.valid) return;

    const { data, error } = parseSortirImportJSON(jsonText);
    if (error || !data) return;

    const patch = mapSortirImportToPatch(data);
    applyGuidedSchemaPatch({
      pageId,
      blockId,
      patch,
      source: 'guided-form',
      overflowPolicy: 'warn',
    });

    setApplied(true);
    // Auto-collapse after 2 seconds
    setTimeout(() => {
      setApplied(false);
      setIsOpen(false);
      setJsonText('');
      setValidation(null);
    }, 2000);
  }, [validation, jsonText, pageId, blockId]);

  // ── Copy sample format ──
  const handleCopySample = useCallback(() => {
    navigator.clipboard.writeText(SORTIR_IMPORT_SAMPLE).then(() => {
      // Brief visual feedback
    }).catch(() => {
      // Fallback: no clipboard access
    });
  }, []);

  return (
    <div className="border border-silse-outline-variant/30 rounded-xl overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-silse-surface-container-low hover:bg-silse-surface-container-high transition-colors text-left"
        type="button"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-silse-on-surface-variant">
          <span className="material-symbols-outlined text-silse-primary" style={{ fontSize: '16px' }}>download</span>
          Import JSON
        </span>
        <span className="material-symbols-outlined text-silse-on-surface-variant transition-transform duration-200" style={{ fontSize: '18px', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          expand_more
        </span>
      </button>

      {/* Collapsible content */}
      {isOpen && (
        <div className="p-3 space-y-3 bg-silse-surface-container-lowest">
          {/* Copy sample button */}
          <button
            onClick={handleCopySample}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-silse-secondary hover:bg-silse-secondary/10 rounded-lg transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>content_copy</span>
            Salin Contoh Format
          </button>

          {/* JSON textarea */}
          <textarea
            value={jsonText}
            onChange={e => { setJsonText(e.target.value); setValidation(null); setParseError(null); setApplied(false); }}
            placeholder={'Paste JSON sortir di sini...\n\nContoh:\n{\n  "title": "Sortir ...",\n  "kolom": [\n    { "label": "Agama", "color": "y" }\n  ],\n  "pool": [\n    { "text": "Berdoa", "category": "Agama" }\n  ]\n}'}
            rows={6}
            className="w-full px-3 py-2 rounded-xl border border-silse-outline-variant/40 bg-silse-surface-container-low text-xs text-silse-on-surface focus:border-silse-secondary focus:ring-2 focus:ring-silse-secondary/20 focus:outline-none transition-all resize-y font-mono"
          />

          {/* Parse error */}
          {parseError && (
            <div className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 flex items-start gap-2">
              <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: '14px' }}>error</span>
              {parseError}
            </div>
          )}

          {/* Validation errors */}
          {validation && validation.errors.length > 0 && (
            <div className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
                {validation.errors.length} error ditemukan:
              </div>
              {validation.errors.map((err, i) => (
                <div key={i} className="pl-5">{err}</div>
              ))}
            </div>
          )}

          {/* Validation warnings */}
          {validation && validation.warnings.length > 0 && (
            <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 space-y-1">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>warning</span>
                {validation.warnings.length} peringatan:
              </div>
              {validation.warnings.map((warn, i) => (
                <div key={i} className="pl-5">{warn}</div>
              ))}
            </div>
          )}

          {/* Success message */}
          {validation && validation.valid && validation.errors.length === 0 && !applied && (
            <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
              JSON valid! {validation.kolomCount} kolom, {validation.poolCount} kartu siap diterapkan.
            </div>
          )}

          {/* Applied success */}
          {applied && (
            <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
              {validation?.kolomCount ?? 0} kolom dan {validation?.poolCount ?? 0} kartu berhasil diterapkan!
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleValidate}
              disabled={jsonText.trim() === ''}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-silse-secondary bg-silse-surface-container-low hover:bg-silse-surface-container-high border border-silse-outline-variant/40 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              type="button"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>fact_check</span>
              Validasi
            </button>
            <button
              onClick={handleApply}
              disabled={!validation || !validation.valid}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-silse-on-primary bg-silse-primary hover:bg-silse-primary/90 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              type="button"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check</span>
              Terapkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
