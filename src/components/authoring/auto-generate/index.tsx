'use client';

import { GEN_BUTTONS } from './constants';
import { Spinner } from './Spinner';
import { Zap, Search, Trash2, CheckCircle2, FileEdit } from 'lucide-react';
import { renderPreviewContent } from './previews';
import { useAutoGenerate } from './use-auto-generate';

// ═══════════════════════════════════════════════════════════════════
// Main Component — UI only, logic in useAutoGenerate hook
// ═══════════════════════════════════════════════════════════════════

export default function AutoGenerate() {
  const {
    text,
    setText,
    parsed,
    settings,
    setSettings,
    loading,
    previews,
    activePreview,
    setActivePreview,
    handleParse,
    handleGenerate,
    handleApply,
    handleGenerateAll,
    handleApplyAll,
    parsedStats,
  } = useAutoGenerate();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold text-app-primary flex items-center gap-2">
          <Zap size={16} className="inline" /> Auto-Generate
        </h2>
        <p className="text-sm text-app-secondary mt-1">
          Paste teks materi sekali → generate bertahap per section.
        </p>
      </div>

      {/* ── Step 1: Text Input ──────────────────────────────── */}
      <div className="bg-app-surface border border-app-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-app-primary flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-app-accent/20 text-app-accent text-xs flex items-center justify-center font-bold">1</span>
            Paste Materi
          </h3>
          <span className="text-xs text-app-muted">
            {text.length > 0 ? `${text.split(/\s+/).filter(Boolean).length} kata` : 'Belum ada teks'}
          </span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Paste teks materi PPKn di sini...\n\nContoh:\nNorma adalah aturan atau pedoman tingkah laku dalam kehidupan bermasyarakat. Norma berfungsi untuk menciptakan ketertiban dan ketenteraman dalam masyarakat. Norma terdiri dari empat jenis, yaitu norma agama, norma kesusilaan, norma kesopanan, dan norma hukum. Norma agama bersumber dari keyakinan tentang perintah dan larangan Tuhan. Norma hukum memiliki sanksi yang paling tegas karena diberlakukan oleh negara.`}
          rows={8}
          className="w-full bg-app-elevated border border-app-border rounded-lg px-4 py-3 text-sm text-app-primary placeholder:text-app-muted focus:outline-none focus:ring-2 focus:ring-app-accent/50 focus:border-app-accent/50 resize-y min-h-[160px]"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={handleParse}
            disabled={text.trim().length < 50}
            className="px-4 py-2 bg-app-accent hover:bg-app-accent/90 disabled:bg-app-elevated disabled:text-app-muted text-app-inverse font-semibold text-sm rounded-lg transition-colors flex items-center gap-2"
          >
            <Search size={14} className="inline" /> Parse Teks
          </button>
          <button
            onClick={() => {
              setText('');
            }}
            className="px-3 py-2 bg-app-elevated hover:bg-app-elevated text-app-secondary text-xs rounded-lg transition-colors"
          >
            <Trash2 size={14} className="inline" /> Bersihkan
          </button>
          <div className="ml-auto flex items-center gap-2 text-xs text-app-muted">
            {text.trim().length < 50 && text.length > 0 && (
              <span>Minimal 50 karakter (saat ini: {text.trim().length})</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Step 2: Settings ────────────────────────────────── */}
      <div className="bg-app-surface border border-app-border rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-app-primary flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-app-accent/20 text-app-accent text-xs flex items-center justify-center font-bold">2</span>
          Pengaturan Generate
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Jumlah Kuis */}
          <div className="space-y-1.5">
            <label className="text-xs text-app-secondary font-medium">Jumlah Soal Kuis</label>
            <select
              value={settings.jumlahKuis}
              onChange={(e) => setSettings((s) => ({ ...s, jumlahKuis: parseInt(e.target.value) }))}
              className="w-full bg-app-elevated border border-app-border rounded-lg px-3 py-2 text-sm text-app-primary focus:outline-none focus:ring-2 focus:ring-app-accent/50 focus:border-app-accent/50"
            >
              {[5, 10, 15, 20, 25, 30].map((n) => (
                <option key={n} value={n}>{n} soal</option>
              ))}
            </select>
          </div>
          {/* Pertemuan */}
          <div className="space-y-1.5">
            <label className="text-xs text-app-secondary font-medium">Jumlah Pertemuan</label>
            <select
              value={settings.pertemuan}
              onChange={(e) => setSettings((s) => ({ ...s, pertemuan: parseInt(e.target.value) }))}
              className="w-full bg-app-elevated border border-app-border rounded-lg px-3 py-2 text-sm text-app-primary focus:outline-none focus:ring-2 focus:ring-app-accent/50 focus:border-app-accent/50"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>{n} pertemuan</option>
              ))}
            </select>
          </div>
          {/* Bloom Level */}
          <div className="space-y-1.5">
            <label className="text-xs text-app-secondary font-medium">Level Bloom Maksimal</label>
            <select
              value={settings.bloomMax}
              onChange={(e) => setSettings((s) => ({ ...s, bloomMax: parseInt(e.target.value) }))}
              className="w-full bg-app-elevated border border-app-border rounded-lg px-3 py-2 text-sm text-app-primary focus:outline-none focus:ring-2 focus:ring-app-accent/50 focus:border-app-accent/50"
            >
              <option value={1}>C1 – Mengingat</option>
              <option value={2}>C2 – Memahami</option>
              <option value={3}>C3 – Menerapkan</option>
              <option value={4}>C4 – Menganalisis</option>
              <option value={5}>C5 – Mengevaluasi</option>
              <option value={6}>C6 – Menciptakan</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Parsed Stats ────────────────────────────────────── */}
      {parsedStats && parsed && (
        <div className="bg-app-surface border border-app-border rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-app-primary flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 text-xs flex items-center justify-center font-bold">✓</span>
            Hasil Parse
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {parsedStats.map((stat) => (
              <div
                key={stat.label}
                className="bg-app-elevated/50 border border-app-border/50 rounded-lg p-3 text-center"
              >
                <div className="text-lg mb-1">{stat.icon}</div>
                <div className="text-lg font-bold text-app-primary">{stat.value}</div>
                <div className="text-[0.65rem] text-app-muted mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
          {/* Top words */}
          {parsed.topWords.length > 0 && (
            <div>
              <p className="text-xs text-app-muted mb-2">Kata kunci terdeteksi:</p>
              <div className="flex flex-wrap gap-1.5">
                {parsed.topWords.slice(0, 15).map((w, i) => (
                  <span
                    key={w + i}
                    className="px-2 py-0.5 bg-app-elevated border border-app-border rounded-md text-xs text-app-secondary"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* Definitions preview */}
          {parsed.definitions.length > 0 && (
            <div>
              <p className="text-xs text-app-muted mb-2">Definisi terdeteksi:</p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {parsed.definitions.map((d, i) => (
                  <div key={i} className="text-xs text-app-secondary bg-app-elevated/50 rounded-lg px-3 py-2">
                    <span className="font-semibold text-app-accent">{d.term}</span>
                    {' → '}
                    <span className="text-app-secondary">{d.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Generate Buttons ────────────────────────── */}
      {parsed && (
        <div className="bg-app-surface border border-app-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-app-primary flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-app-accent/20 text-app-accent text-xs flex items-center justify-center font-bold">3</span>
              Generate Konten
            </h3>
            <button
              onClick={handleGenerateAll}
              disabled={loading.size > 0}
              className="px-4 py-2 bg-app-accent hover:bg-app-accent/90 disabled:bg-app-elevated disabled:text-app-muted text-app-inverse font-semibold text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              {loading.size > 0 ? <Spinner /> : <Zap size={14} className="inline" />}
              {loading.size > 0 ? `Generating ${loading.size}...` : 'Generate Semua'}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {GEN_BUTTONS.map((btn) => {
              const isLoading = loading.has(btn.type);
              const preview = previews.find((p) => p.type === btn.type);
              const isActive = activePreview?.type === btn.type;

              return (
                <button
                  key={btn.type}
                  onClick={() => {
                    if (!preview) {
                      handleGenerate(btn.type);
                    } else {
                      setActivePreview(preview);
                    }
                  }}
                  disabled={isLoading}
                  className={`relative bg-app-elevated border rounded-xl p-4 text-left transition-all hover:border-app-border hover:bg-app-elevated/80 disabled:opacity-50 ${
                    isActive
                      ? 'border-app-accent/50 ring-1 ring-app-accent/30'
                      : 'border-app-border/50'
                  } ${preview ? 'ring-1 ring-green-500/20 border-green-500/30' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xl">{btn.icon}</span>
                    {preview && (
                      <span className="text-[0.6rem] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-semibold">
                        ✓ {preview.count}
                      </span>
                    )}
                    {isLoading && <Spinner />}
                  </div>
                  <p className="text-xs font-medium text-app-primary mt-2.5 leading-tight">
                    {btn.label}
                  </p>
                  {!preview && !isLoading && (
                    <p className="text-[0.6rem] text-app-muted mt-1">Klik untuk generate</p>
                  )}
                  {preview && !isLoading && (
                    <p className="text-[0.6rem] text-green-400 mt-1">Klik untuk lihat preview</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Preview Panel ───────────────────────────────────── */}
      {activePreview && (
        <div className="bg-app-surface border border-app-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-app-primary flex items-center gap-2">
              <span>{activePreview.icon}</span>
              Preview: {activePreview.label}
              <span className="text-xs text-app-muted font-normal">({activePreview.count} item)</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleApply(activePreview)}
                className="px-4 py-2 bg-app-accent hover:bg-app-accent/90 text-app-inverse font-semibold text-sm rounded-lg transition-colors flex items-center gap-2"
              >
                <CheckCircle2 size={14} className="inline" /> Terapkan ke Proyek
              </button>
              {previews.length > 1 && (
                <button
                  onClick={handleApplyAll}
                  className="px-3 py-2 bg-app-elevated hover:bg-app-elevated text-app-primary text-xs rounded-lg transition-colors"
                >
                  <Zap size={14} className="inline" /> Terapkan Semua ({previews.length})
                </button>
              )}
            </div>
          </div>

          {/* Preview tabs */}
          {previews.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {previews.map((p) => (
                <button
                  key={p.type}
                  onClick={() => setActivePreview(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                    activePreview.type === p.type
                      ? 'bg-app-accent/15 text-app-accent font-semibold'
                      : 'bg-app-elevated text-app-secondary hover:bg-app-elevated hover:text-app-primary'
                  }`}
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Preview content */}
          <div className="max-h-[480px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {renderPreviewContent(activePreview)}
          </div>
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────── */}
      {!parsed && (
        <div className="bg-app-surface border border-app-border rounded-xl p-10 text-center">
          <div className="text-5xl mb-4"><FileEdit size={40} className="text-app-muted" /></div>
          <h3 className="text-lg font-semibold text-app-primary mb-2">Paste materi untuk memulai</h3>
          <p className="text-sm text-app-secondary max-w-lg mx-auto">
            Salin teks materi PPKn dari buku atau sumber lain, lalu paste di kolom di atas.
            Sistem akan otomatis mem-parsing dan meng-generate berbagai jenis konten pembelajaran.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-app-muted">
            <span className="inline-flex items-center gap-1 bg-app-elevated px-2 py-1 rounded"><FileEdit size={12} className="inline" /> Paste</span>
            <span className="text-app-muted">→</span>
            <span className="inline-flex items-center gap-1 bg-app-elevated px-2 py-1 rounded"><Search size={12} className="inline" /> Parse</span>
            <span className="text-app-muted">→</span>
            <span className="inline-flex items-center gap-1 bg-app-elevated px-2 py-1 rounded"><Zap size={12} className="inline" /> Generate</span>
            <span className="text-app-muted">→</span>
            <span className="inline-flex items-center gap-1 bg-app-elevated px-2 py-1 rounded"><CheckCircle2 size={12} className="inline" /> Terapkan</span>
          </div>
        </div>
      )}
    </div>
  );
}
