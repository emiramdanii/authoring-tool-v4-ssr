'use client';

// ═══════════════════════════════════════════════════════════════════════
// AI ASSISTANT PANEL — Context-aware AI content generation panel
// ═══════════════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from 'react';
import { isEnabled } from '@/config/feature-flags';
import { useCanvaStore } from '@/store/canva-store';
import { useSchemaContext } from '@/hooks/use-schema-navigator';
import { useAIAssistant, type AIAction, type AIGenerateParams } from './use-ai-assistant';
import { ensurePageSchema } from '@/core/schema/ensure-schema';
// All icons migrated to Material Symbols Outlined
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// ── Action Config ────────────────────────────────────────────────────

interface ActionConfig {
  id: AIAction;
  label: string;
  icon: string;
  description: string;
  defaultCount: number;
  relevantBlockTypes: string[];
}

const ACTION_CONFIGS: ActionConfig[] = [
  { id: 'kuis', label: 'Kuis Pilihan Ganda', icon: '📝', description: 'Soal pilihan ganda dengan 4 opsi dan penjelasan', defaultCount: 5, relevantBlockTypes: ['kuis'] },
  { id: 'matching', label: 'Cocokkan (Matching)', icon: '🔗', description: 'Pasangkan istilah dengan definisi', defaultCount: 6, relevantBlockTypes: ['matching-game'] },
  { id: 'fill-blank', label: 'Isian Singkat', icon: '✏️', description: 'Soal isian dengan petunjuk opsional', defaultCount: 5, relevantBlockTypes: ['fill-blank-game'] },
  { id: 'word-search', label: 'Cari Kata', icon: '🔍', description: 'Daftar kata tersembunyi dalam grid', defaultCount: 8, relevantBlockTypes: ['word-search-game'] },
  { id: 'crossword', label: 'Teka Silang', icon: '🔡', description: 'Kata dan petunjuk untuk crossword', defaultCount: 6, relevantBlockTypes: ['crossword-game'] },
  { id: 'true-false', label: 'Benar/Salah', icon: '✅', description: 'Pernyataan benar atau salah dengan penjelasan', defaultCount: 5, relevantBlockTypes: ['true-false-game'] },
  { id: 'drag-drop', label: 'Kelompokkan (Drag & Drop)', icon: '📦', description: 'Item dan kategori untuk sorting game', defaultCount: 8, relevantBlockTypes: ['drag-drop-game'] },
  { id: 'memory', label: 'Memory Game', icon: '🃏', description: 'Pasangan kartu memory', defaultCount: 6, relevantBlockTypes: ['memory-game'] },
  { id: 'roda', label: 'Roda Putar', icon: '🎡', description: 'Pertanyaan untuk spin wheel quiz', defaultCount: 5, relevantBlockTypes: ['roda-game'] },
  { id: 'sortir', label: 'Sortir', icon: '📊', description: 'Item untuk sortir ke kolom', defaultCount: 8, relevantBlockTypes: ['sortir-game'] },
  { id: 'diskusi', label: 'Diskusi', icon: '💬', description: 'Pertanyaan diskusi kolaboratif', defaultCount: 4, relevantBlockTypes: ['diskusi'] },
  { id: 'refleksi', label: 'Refleksi', icon: '🤔', description: 'Pertanyaan refleksi pembelajaran', defaultCount: 3, relevantBlockTypes: ['refleksi'] },
  { id: 'materi-summary', label: 'Rangkuman Materi', icon: '📚', description: 'Konsep-konsep kunci materi', defaultCount: 4, relevantBlockTypes: ['materi-section', 'rangkuman'] },
  { id: 'tp', label: 'Tujuan Pembelajaran', icon: '🎯', description: 'TP dengan KKO tingkat tinggi', defaultCount: 3, relevantBlockTypes: ['tp', 'tujuan-display'] },
  { id: 'petunjuk', label: 'Petunjuk Penggunaan', icon: '📋', description: 'Langkah-langkah menggunakan MPI', defaultCount: 4, relevantBlockTypes: ['petunjuk'] },
  { id: 'motivasi', label: 'Apersepsi / Motivasi', icon: '💡', description: 'Hook pertanyaan dan koneksi ke materi sebelumnya', defaultCount: 3, relevantBlockTypes: ['motivasi'] },
];

// ── Helper: safely render unknown values as ReactNode ────────────────
function str(val: unknown): string {
  return typeof val === 'string' ? val : val != null ? String(val) : '';
}

// ── Component ────────────────────────────────────────────────────────

export default function AIAssistantPanel() {
  const { loading, result, error, generate, clear } = useAIAssistant();
  const pages = useCanvaStore((s) => s.pages);
  const currentPageIndex = useCanvaStore((s) => s.currentPageIndex);
  const selectedBlockId = useCanvaStore((s) => s.selectedBlockId);
  const selectedBlockType = useCanvaStore((s) => s.selectedBlockType);
  const updateSchemaBlock = useCanvaStore((s) => s.updateSchemaBlock);

  const { meta } = useSchemaContext();
  const mapel = meta.mapel || 'PPKn';
  const kelas = meta.kelas || 'Kelas VII';

  const [selectedAction, setSelectedAction] = useState<AIAction | null>(null);
  const [topik, setTopik] = useState(meta.judulPertemuan || '');
  const [konteks, setKonteks] = useState('');
  const [jumlah, setJumlah] = useState(5);
  const [instruksi, setInstruksi] = useState('');
  const [actionDropdownOpen, setActionDropdownOpen] = useState(false);
  const [applied, setApplied] = useState(false);

  const page = pages[currentPageIndex];

  const suggestedAction = useMemo(() => {
    if (!selectedBlockType) return null;
    return ACTION_CONFIGS.find((a) => a.relevantBlockTypes.includes(selectedBlockType)) || null;
  }, [selectedBlockType]);

  const autoContext = useMemo(() => {
    if (!page) return '';
    const schema = ensurePageSchema(page);
    if (!schema) return '';
    const texts: string[] = [];
    for (const block of schema.blocks) {
      const b = block as unknown as Record<string, unknown>;
      if (typeof b.content === 'string') texts.push(b.content);
      if (typeof b.title === 'string') texts.push(b.title);
      if (typeof b.subtitle === 'string') texts.push(b.subtitle);
      if (typeof b.text === 'string') texts.push(b.text);
      if (typeof b.hookQuestion === 'string') texts.push(b.hookQuestion);
      if (Array.isArray(b.questions)) {
        for (const q of b.questions as Array<Record<string, unknown>>) {
          if (typeof q.q === 'string') texts.push(q.q);
          if (typeof q.teks === 'string') texts.push(q.teks);
          if (typeof q.text === 'string') texts.push(q.text);
        }
      }
      if (Array.isArray(b.pairs)) {
        for (const p of b.pairs as Array<Record<string, unknown>>) {
          if (typeof p.left === 'string') texts.push(p.left);
          if (typeof p.right === 'string') texts.push(p.right);
        }
      }
    }
    return texts.join(' ').substring(0, 2000);
  }, [page]);

  const [actionSearch, setActionSearch] = useState('');

  const filteredActions = useMemo(() => {
    if (!actionSearch.trim()) return ACTION_CONFIGS;
    const q = actionSearch.toLowerCase();
    return ACTION_CONFIGS.filter(
      (a) => a.label.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.id.toLowerCase().includes(q)
    );
  }, [actionSearch]);

  const handleGenerate = useCallback(async () => {
    if (!selectedAction) { toast.warning('Pilih jenis konten terlebih dahulu'); return; }
    if (!topik.trim()) { toast.warning('Masukkan topik/materi'); return; }
    setApplied(false);
    const params: AIGenerateParams = { action: selectedAction, mapel, kelas, topik: topik.trim(), konteks: konteks.trim() || autoContext || undefined, jumlah, instruksi: instruksi.trim() || undefined };
    const res = await generate(params);
    if (res?.success) toast.success('Konten AI berhasil dibuat!');
  }, [selectedAction, mapel, kelas, topik, konteks, autoContext, jumlah, instruksi, generate]);

  const handleApply = useCallback(() => {
    if (!result?.success || !result.data || !selectedBlockId) { toast.warning('Tidak ada konten untuk diterapkan atau tidak ada block yang dipilih'); return; }
    updateSchemaBlock(selectedBlockId, result.data as Record<string, unknown>);
    setApplied(true);
    toast.success('Konten AI diterapkan ke block!');
  }, [result, selectedBlockId, updateSchemaBlock]);

  const handleSelectAction = useCallback((action: AIAction) => {
    setSelectedAction(action);
    const config = ACTION_CONFIGS.find((a) => a.id === action);
    if (config) setJumlah(config.defaultCount);
    setActionDropdownOpen(false);
    setApplied(false);
    clear();
  }, [clear]);

  const selectedConfig = ACTION_CONFIGS.find((a) => a.id === selectedAction);

  // Feature flag guard — after all hooks, before JSX
  if (!isEnabled('aiAssistant')) return null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <span className="material-symbols-outlined text-amber-400" style={ { fontSize: '14px' } }>auto_awesome</span>
          <span className="material-symbols-outlined absolute -top-1 -right-1 text-yellow-300" style={ { fontSize: '8px' } }>bolt</span>
        </div>
        <div className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">AI Content Assistant</div>
        <span className="text-[7px] text-app-muted bg-app-accent/10 px-1.5 py-0.5 rounded-full font-bold">BETA</span>
      </div>

      {/* Suggested action badge */}
      {suggestedAction && !selectedAction && (
        <button onClick={() => handleSelectAction(suggestedAction.id)} className="w-full p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-left hover:bg-amber-500/15 transition-colors">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-amber-400" style={ { fontSize: '10px' } }>auto_fix</span>
            <span className="text-[9px] font-bold text-amber-300">Saran: {suggestedAction.label}</span>
          </div>
          <div className="text-[8px] text-amber-400/60 mt-0.5">Berdasarkan block &quot;{selectedBlockType}&quot; yang dipilih</div>
        </button>
      )}

      {/* Action selector dropdown */}
      <div className="relative">
        <button onClick={() => setActionDropdownOpen(!actionDropdownOpen)} className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-app-elevated/60 border border-app-border/30 text-left hover:border-amber-500/30 transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-sm">{selectedConfig?.icon || '🤖'}</span>
            <span className="text-[10px] text-app-primary font-semibold">{selectedConfig?.label || 'Pilih Jenis Konten...'}</span>
          </div>
          <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>expand_more</span>
        </button>
        {actionDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-app-surface border border-app-border shadow-md z-50 max-h-64 overflow-hidden flex flex-col">
            <div className="p-2 border-b border-app-border/20">
              <input type="text" value={actionSearch} onChange={(e) => setActionSearch(e.target.value)} placeholder="Cari jenis konten..." className="w-full h-6 px-2 text-[9px] bg-app-elevated/60 border border-app-border/30 rounded-md focus:border-amber-500/50 focus:outline-none placeholder:text-app-muted" autoFocus />
            </div>
            <div className="overflow-y-auto">
              {filteredActions.map((action) => (
                <button key={action.id} onClick={() => handleSelectAction(action.id)} className={`w-full px-3 py-2 flex items-center gap-2 hover:bg-amber-500/10 transition-colors text-left ${selectedAction === action.id ? 'bg-amber-500/10' : ''}`}>
                  <span className="text-sm">{action.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold text-app-primary">{action.label}</div>
                    <div className="text-[8px] text-app-muted">{action.description}</div>
                  </div>
                </button>
              ))}
              {filteredActions.length === 0 && <div className="px-3 py-4 text-center text-[9px] text-app-muted">Tidak ditemukan</div>}
            </div>
          </div>
        )}
      </div>

      {/* Context inputs */}
      <div className="space-y-2">
        <div>
          <label className="text-[8px] text-app-muted font-bold uppercase tracking-wider flex items-center gap-1"><span className="material-symbols-outlined" style={ { fontSize: '8px' } }>menu_book</span> Topik / Materi</label>
          <input type="text" value={topik} onChange={(e) => setTopik(e.target.value)} placeholder="Contoh: Norma dalam Kehidupan" className="w-full h-7 px-2 text-[10px] mt-0.5 bg-app-elevated/60 border border-app-border/30 rounded-lg focus:border-amber-500/50 focus:outline-none placeholder:text-app-muted" />
        </div>
        <div>
          <label className="text-[8px] text-app-muted font-bold uppercase tracking-wider flex items-center gap-1"><span className="material-symbols-outlined" style={ { fontSize: '8px' } }>help</span> Konteks Tambahan {autoContext && <span className="text-[7px] text-emerald-400 ml-1">(Auto-terdeteksi)</span>}</label>
          <textarea value={konteks} onChange={(e) => setKonteks(e.target.value)} placeholder={autoContext ? 'Kosongkan untuk gunakan konteks otomatis' : 'Teks materi yang sudah ada (opsional)'} rows={3} className="w-full px-2 py-1.5 text-[10px] mt-0.5 bg-app-elevated/60 border border-app-border/30 rounded-lg focus:border-amber-500/50 focus:outline-none placeholder:text-app-muted resize-none" />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[8px] text-app-muted font-bold uppercase tracking-wider">Jumlah</label>
            <input type="number" value={jumlah} onChange={(e) => setJumlah(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))} min={1} max={20} className="w-full h-7 px-2 text-[10px] mt-0.5 bg-app-elevated/60 border border-app-border/30 rounded-lg focus:border-amber-500/50 focus:outline-none" />
          </div>
          <div className="flex-[2]">
            <label className="text-[8px] text-app-muted font-bold uppercase tracking-wider">Instruksi</label>
            <input type="text" value={instruksi} onChange={(e) => setInstruksi(e.target.value)} placeholder="Contoh: Fokus pada norma agama" className="w-full h-7 px-2 text-[10px] mt-0.5 bg-app-elevated/60 border border-app-border/30 rounded-lg focus:border-amber-500/50 focus:outline-none placeholder:text-app-muted" />
          </div>
        </div>
      </div>

      {/* Generate button */}
      <Button onClick={handleGenerate} disabled={loading || !selectedAction || !topik.trim()} className={`w-full gap-2 font-bold text-[10px] ${loading ? 'bg-amber-500/20 text-amber-400/60' : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30'}`} variant="outline">
        {loading ? <><span className="material-symbols-outlined animate-spin" style={ { fontSize: '12px' } }>progress_activity</span> Membuat konten AI...</> : <><span className="material-symbols-outlined" style={ { fontSize: '12px' } }>auto_awesome</span> Buat Konten AI</>}
      </Button>

      {/* Error display */}
      {error && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <span className="material-symbols-outlined text-red-400 flex-shrink-0 mt-0.5" style={ { fontSize: '12px' } }>error</span>
          <div className="text-[9px] text-red-300">{error}</div>
        </div>
      )}

      {/* Result preview */}
      {result?.success && result.data ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-emerald-400" style={ { fontSize: '10px' } }>check_circle</span><span className="text-[9px] font-bold text-emerald-300">Konten Berhasil Dibuat</span></div>
            <div className="flex items-center gap-1">
              <button onClick={handleGenerate} className="p-1 rounded hover:bg-app-elevated/50 text-app-muted hover:text-app-secondary transition-colors" title="Regenerate"><span className="material-symbols-outlined" style={ { fontSize: '10px' } }>refresh</span></button>
              <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(result.data, null, 2)); toast.success('JSON disalin ke clipboard'); }} className="p-1 rounded hover:bg-app-elevated/50 text-app-muted hover:text-app-secondary transition-colors" title="Salin JSON"><span className="material-symbols-outlined" style={ { fontSize: '10px' } }>content_copy</span></button>
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto rounded-lg bg-app-elevated/40 border border-app-border/20 p-2">
            <ResultPreview data={result.data} action={selectedAction!} />
          </div>
          <Button onClick={handleApply} disabled={applied || !selectedBlockId} className={`w-full gap-2 font-bold text-[10px] ${applied ? 'bg-emerald-500/20 text-emerald-400/60 border border-emerald-500/20' : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'}`} variant="outline">
            {applied ? <><span className="material-symbols-outlined" style={ { fontSize: '12px' } }>check_circle</span> Sudah Diterapkan</> : <><span className="material-symbols-outlined" style={ { fontSize: '12px' } }>bolt</span> {selectedBlockId ? 'Terapkan ke Block' : 'Pilih Block Dulu'}</>}
          </Button>
        </div>
      ) : null}

      <div className="text-[7px] text-app-muted pt-1 border-t border-app-border/10 leading-relaxed">
        AI Content Assistant menggunakan kecerdasan buatan untuk membuat konten pembelajaran.
        Konten yang dibuat perlu ditinjau oleh guru sebelum digunakan.
        Pastikan konten sesuai dengan kurikulum dan kebutuhan siswa.
      </div>
    </div>
  );
}

// ── Result Preview Sub-Component ─────────────────────────────────────

function ResultPreview({ data, action }: { data: unknown; action: AIAction }) {
  const d = data as Record<string, unknown>;
  const title = typeof d.title === 'string' ? d.title : 'Konten AI';

  switch (action) {
    case 'kuis': {
      const questions = Array.isArray(d.questions) ? d.questions : [];
      return (
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-amber-300">{title}</div>
          {questions.map((q, i) => {
            const item = q as Record<string, unknown>;
            const opts = Array.isArray(item.opts) ? item.opts : [];
            const ans = typeof item.ans === 'number' ? item.ans : 0;
            return (
              <div key={i} className="pl-2 border-l-2 border-amber-500/20">
                <div className="text-[9px] text-app-primary font-semibold">{i + 1}. {str(item.q)}</div>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {opts.map((opt: unknown, j: number) => (
                    <span key={j} className={`text-[8px] px-1.5 py-0.5 rounded ${j === ans ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'bg-app-elevated/60 text-app-muted'}`}>
                      {String.fromCharCode(65 + j)}. {str(opt)}
                    </span>
                  ))}
                </div>
                {Boolean(item.ex) && <div className="text-[8px] text-app-muted mt-0.5 italic">{str(item.ex)}</div>}
              </div>
            );
          })}
        </div>
      );
    }

    case 'matching':
    case 'memory': {
      const pairs = Array.isArray(d.pairs) ? d.pairs : [];
      return (
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-amber-300">{title}</div>
          {pairs.map((p, i) => {
            const pair = p as Record<string, unknown>;
            return (
              <div key={i} className="flex items-center gap-2 text-[9px]">
                <span className="px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-300 font-semibold min-w-0 truncate">{str(pair.left)}</span>
                <span className="text-app-muted">↔</span>
                <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 font-semibold min-w-0 truncate">{str(pair.right)}</span>
              </div>
            );
          })}
        </div>
      );
    }

    case 'fill-blank': {
      const questions = Array.isArray(d.questions) ? d.questions : [];
      return (
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-amber-300">{title}</div>
          {questions.map((q, i) => {
            const item = q as Record<string, unknown>;
            return (
              <div key={i} className="pl-2 border-l-2 border-amber-500/20">
                <div className="text-[9px] text-app-primary">{i + 1}. {str(item.text)}</div>
                <div className="text-[8px] text-emerald-400 font-bold mt-0.5">Jawaban: {str(item.answer)}</div>
                {Boolean(item.hint) && <div className="text-[8px] text-app-muted italic">Hint: {str(item.hint)}</div>}
              </div>
            );
          })}
        </div>
      );
    }

    case 'word-search': {
      const words = Array.isArray(d.words) ? d.words : [];
      return (
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-amber-300">{title}</div>
          <div className="flex flex-wrap gap-1">
            {words.map((w, i) => (
              <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-mono font-bold">{str(w)}</span>
            ))}
          </div>
        </div>
      );
    }

    case 'crossword': {
      const words = Array.isArray(d.words) ? d.words : [];
      return (
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-amber-300">{title}</div>
          {words.map((w, i) => {
            const item = w as Record<string, unknown>;
            return (
              <div key={i} className="flex items-center gap-2 text-[9px]">
                <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-mono font-bold">{str(item.teks)}</span>
                <span className="text-app-muted text-[8px] truncate">{str(item.hint)}</span>
              </div>
            );
          })}
        </div>
      );
    }

    case 'true-false': {
      const questions = Array.isArray(d.questions) ? d.questions : [];
      return (
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-amber-300">{title}</div>
          {questions.map((q, i) => {
            const item = q as Record<string, unknown>;
            return (
              <div key={i} className="pl-2 border-l-2 border-amber-500/20">
                <div className="text-[9px] text-app-primary">{i + 1}. {str(item.text)}</div>
                <span className={`text-[8px] font-bold ${item.correct ? 'text-emerald-400' : 'text-red-400'}`}>
                  {item.correct ? '✅ Benar' : '❌ Salah'}
                </span>
                {Boolean(item.explanation) && <div className="text-[8px] text-app-muted italic ml-2">{str(item.explanation)}</div>}
              </div>
            );
          })}
        </div>
      );
    }

    default: {
      return (
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-amber-300">{title}</div>
          <pre className="text-[8px] text-app-muted whitespace-pre-wrap overflow-x-auto">
            {JSON.stringify(data, null, 2).substring(0, 500)}
          </pre>
        </div>
      );
    }
  }
}
