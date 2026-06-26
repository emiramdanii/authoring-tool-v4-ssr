'use client';

// ═══════════════════════════════════════════════════════════════
// BATCH-09A — ImportJsonPanelV5
// ═══════════════════════════════════════════════════════════════
// Lightweight modal for teachers to paste JSON and validate it.
//
// Scope (per senior audit):
//   ✓ Textarea paste JSON
//   ✓ Tombol Validasi
//   ✓ Tampilkan hasil valid/error reason + path + all errors
//   ✓ Sample JSON copy buttons (valid + invalid examples)
//   ✗ Does NOT apply to store (validation only — no import)
//   ✗ Does NOT mutate store
//   ✗ Does NOT implement full block adapter
//
// Why a modal and not a new ProductShell view?
//   - Adding a new view would require updating the persistence layer
//     (v5-view-persistence.ts) and ProductShell state machine.
//   - A modal is contained — opens from Dashboard, closes back to
//     Dashboard, no navigation state changes.
//   - Matches the pattern of MetadataFormV5 (also a modal).
//
// Why "Validasi" only and not "Import"?
//   - Senior constraint: "Belum apply ke store"
//   - Validator is ready (Batch 08), but adapter (full block content
//     validation + store hydration) is future work.
//   - This panel lets teachers CHECK their JSON now, without risking
//     store corruption from a half-implemented adapter.
// ═══════════════════════════════════════════════════════════════

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  validateSilseImportJsonString,
  type SilseImportValidationResult,
} from '@/lib/silse-import-validator';

export interface ImportJsonPanelV5Props {
  /** Whether the modal is open */
  open: boolean;
  /** Called when user closes the modal */
  onClose: () => void;
}

// ── Sample JSON for copy buttons ────────────────────────────────
// Kept inline (not loaded from fixtures) so the modal is self-contained
// and doesn't need fs access at runtime.

const SAMPLE_VALID_JSON = `{
  "schemaVersion": 1,
  "meta": {
    "judulPertemuan": "Pertemuan 1: Hakikat Norma",
    "mapel": "PPKn",
    "kelas": "7"
  },
  "canva": {
    "ratioId": "16:9",
    "pages": [
      {
        "id": "page-cover-001",
        "templateType": "cover",
        "schema": {
          "blocks": [
            {
              "id": "block-cover-001",
              "type": "cover",
              "title": "Hakikat Norma",
              "subtitle": "PPKn Kelas 7"
            }
          ]
        }
      }
    ]
  }
}`;

const SAMPLE_INVALID_JSON = `{
  "schemaVersion": 99,
  "meta": {
    "judulPertemuan": "Test"
  },
  "canva": {
    "pages": []
  }
}`;

export function ImportJsonPanelV5({ open, onClose }: ImportJsonPanelV5Props) {
  const [jsonInput, setJsonInput] = useState('');
  const [result, setResult] = useState<SilseImportValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Reset state when modal opens ──────────────────────────────
  useEffect(() => {
    if (open) {
      setJsonInput('');
      setResult(null);
      setIsValidating(false);
      setCopyStatus('idle');
    }
  }, [open]);

  // ── Handle Escape key to close ────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  // ── Validate handler ──────────────────────────────────────────
  const handleValidate = useCallback(() => {
    if (!jsonInput.trim()) {
      setResult({
        valid: false,
        reason: 'invalid-json',
        message: 'Tempel JSON terlebih dahulu sebelum memvalidasi.',
        errors: [{ path: '', reason: 'invalid-json', message: 'Empty input' }],
      });
      return;
    }

    setIsValidating(true);
    // Use setTimeout to let UI update (show "Memvalidasi..." state)
    // before the synchronous validation runs. Validation is fast (<10ms
    // for typical JSON) but this gives visual feedback for large inputs.
    setTimeout(() => {
      const validationResult = validateSilseImportJsonString(jsonInput);
      setResult(validationResult);
      setIsValidating(false);
    }, 50);
  }, [jsonInput]);

  // ── Copy sample to clipboard ──────────────────────────────────
  const handleCopySample = useCallback(async (which: 'valid' | 'invalid') => {
    const sample = which === 'valid' ? SAMPLE_VALID_JSON : SAMPLE_INVALID_JSON;
    try {
      await navigator.clipboard.writeText(sample);
      setCopyStatus(which);
      // Auto-clear status after 2s
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch {
      // Fallback: select textarea + set value (user can manually Ctrl+C)
      setJsonInput(sample);
      setCopyStatus(which);
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  }, []);

  // ── Clear handler ─────────────────────────────────────────────
  const handleClear = useCallback(() => {
    setJsonInput('');
    setResult(null);
    setCopyStatus('idle');
    textareaRef.current?.focus();
  }, []);

  // ── Don't render if not open ──────────────────────────────────
  if (!open) return null;

  // ── Derived display values ────────────────────────────────────
  const hasResult = result !== null;
  const isValid = result?.valid === true;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-json-panel-title"
      data-testid="import-json-panel-v5"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-700" aria-hidden="true" style={{ fontSize: '20px' }}>file_json</span>
            </div>
            <div>
              <h2 id="import-json-panel-title" className="text-lg font-semibold text-slate-800">
                Validasi JSON Import
              </h2>
              <p className="text-xs text-slate-500">
                Tempel JSON untuk memeriksa apakah aman diimpor. Tidak mengubah proyek aktif.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400/30"
            aria-label="Tutup panel import JSON"
          >
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Sample buttons */}
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              Contoh JSON (klik untuk salin ke clipboard)
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCopySample('valid')}
                type="button"
                className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30 flex items-center gap-1.5"
                aria-label="Salin contoh JSON valid ke clipboard"
                data-testid="import-json-copy-valid-btn"
              >
                <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '14px' }}>content_copy</span>
                {copyStatus === 'valid' ? 'Disalin!' : 'Salin JSON Valid'}
              </button>
              <button
                onClick={() => handleCopySample('invalid')}
                type="button"
                className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/30 flex items-center gap-1.5"
                aria-label="Salin contoh JSON invalid ke clipboard"
                data-testid="import-json-copy-invalid-btn"
              >
                <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '14px' }}>content_copy</span>
                {copyStatus === 'invalid' ? 'Disalin!' : 'Salin JSON Invalid'}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              Tempel ke textarea di bawah, lalu klik Validasi untuk melihat hasilnya.
            </p>
          </div>

          {/* JSON Textarea */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                className="block text-xs font-medium text-slate-500 uppercase tracking-wider"
                htmlFor="import-json-textarea"
              >
                JSON Input
              </label>
              {jsonInput.length > 0 && (
                <span className="text-xs text-slate-400" data-testid="import-json-char-count">
                  {jsonInput.length.toLocaleString()} karakter
                </span>
              )}
            </div>
            <textarea
              ref={textareaRef}
              id="import-json-textarea"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{"schemaVersion": 1, "meta": {...}, "canva": {"pages": [...]}}'
              rows={10}
              spellCheck={false}
              className="w-full px-3 py-2.5 text-sm font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors resize-y"
              aria-label="Textarea untuk tempel JSON"
              data-testid="import-json-textarea"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleValidate}
              type="button"
              disabled={isValidating}
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/40 flex items-center gap-1.5"
              aria-label="Validasi JSON"
              data-testid="import-json-validate-btn"
            >
              <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '18px' }}>
                {isValidating ? 'hourglass_empty' : 'check_circle'}
              </span>
              {isValidating ? 'Memvalidasi...' : 'Validasi'}
            </button>
            <button
              onClick={handleClear}
              type="button"
              disabled={!jsonInput && !hasResult}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400/30"
              aria-label="Bersihkan input dan hasil"
              data-testid="import-json-clear-btn"
            >
              Bersihkan
            </button>
          </div>

          {/* ── Result Display ────────────────────────────────────── */}
          {hasResult && (
            <div
              className={`rounded-lg border p-4 ${
                isValid
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-red-50 border-red-200'
              }`}
              data-testid="import-json-result"
              data-valid={isValid ? 'true' : 'false'}
            >
              {/* Result header */}
              <div className="flex items-start gap-3 mb-3">
                <span
                  className={`material-symbols-outlined flex-shrink-0 ${
                    isValid ? 'text-emerald-600' : 'text-red-600'
                  }`}
                  aria-hidden="true"
                  style={{ fontSize: '24px' }}
                >
                  {isValid ? 'check_circle' : 'cancel'}
                </span>
                <div className="flex-1 min-w-0">
                  <h3
                    className={`text-sm font-semibold ${
                      isValid ? 'text-emerald-800' : 'text-red-800'
                    }`}
                    data-testid="import-json-result-title"
                  >
                    {isValid ? 'JSON Valid' : 'JSON Tidak Valid'}
                  </h3>
                  <p
                    className={`text-xs mt-0.5 ${
                      isValid ? 'text-emerald-700' : 'text-red-700'
                    }`}
                    data-testid="import-json-result-message"
                  >
                    {result.message}
                  </p>
                </div>
              </div>

              {/* Invalid: show reason + path */}
              {!isValid && (
                <div className="space-y-2 mt-3 pt-3 border-t border-red-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="font-semibold text-red-700">Alasan:</span>{' '}
                      <code
                        className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded font-mono"
                        data-testid="import-json-result-reason"
                      >
                        {result.reason}
                      </code>
                    </div>
                    {result.path && (
                      <div>
                        <span className="font-semibold text-red-700">Path:</span>{' '}
                        <code
                          className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded font-mono break-all"
                          data-testid="import-json-result-path"
                        >
                          {result.path}
                        </code>
                      </div>
                    )}
                  </div>

                  {/* All errors (if more than 1) */}
                  {result.errors && result.errors.length > 1 && (
                    <details className="mt-2" data-testid="import-json-result-all-errors">
                      <summary className="text-xs font-semibold text-red-700 cursor-pointer hover:text-red-800">
                        Semua error ({result.errors.length})
                      </summary>
                      <ul className="mt-2 space-y-1.5">
                        {result.errors.map((err, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-red-700 bg-red-50 border border-red-100 rounded px-2 py-1.5"
                          >
                            <div className="flex items-start gap-2">
                              <span className="font-mono text-red-500 flex-shrink-0">[{idx + 1}]</span>
                              <div className="flex-1 min-w-0">
                                <div>
                                  <span className="font-mono text-red-600">{err.reason}</span>
                                  {err.path && (
                                    <span className="text-red-400"> @ {err.path}</span>
                                  )}
                                </div>
                                <div className="text-red-700 mt-0.5">{err.message}</div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}

              {/* Valid: show summary */}
              {isValid && result.document && (
                <div className="mt-3 pt-3 border-t border-emerald-200 space-y-1.5 text-xs text-emerald-700">
                  <div data-testid="import-json-result-summary-pages">
                    <span className="font-semibold">Halaman:</span>{' '}
                    {result.document.canva?.pages?.length ?? 0} halaman
                  </div>
                  <div data-testid="import-json-result-summary-judul">
                    <span className="font-semibold">Judul:</span>{' '}
                    {result.document.meta?.judulPertemuan ?? '—'}
                  </div>
                  <div>
                    <span className="font-semibold">Mapel:</span>{' '}
                    {result.document.meta?.mapel ?? '—'} ·{' '}
                    <span className="font-semibold">Kelas:</span>{' '}
                    {result.document.meta?.kelas ?? '—'}
                  </div>
                  <p className="text-emerald-600 mt-2 italic">
                    ✓ JSON aman untuk diimpor. (Import ke proyek aktif akan tersedia di batch mendatang.)
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Validator hanya memeriksa — tidak mengubah proyek aktif.
          </p>
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400/30"
            aria-label="Tutup"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
