'use client';

// ═══════════════════════════════════════════════════════════════════════
// AI GENERATE LESSON PANEL — One-click lesson generation from topic
// ═══════════════════════════════════════════════════════════════════════
// The FAST path for "guru SMP yang capek pulang sekolah":
//   1. Teacher types a topic (e.g., "Fotosintesis")
//   2. AI generates complete lesson structure
//   3. System instantiates pages with AI content
//   4. Teacher edits and customizes
//
// This combines AI structure generation with the existing
// schema generators for production-quality output.
// ═══════════════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from 'react';
import { isEnabled } from '@/config/feature-flags';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import {
  useAILessonGeneration,
  type AIGeneratedLesson,
  type AIGeneratedPage,
} from './use-ai-lesson';
import { createPageFromPreset } from '@/core/preset/PagePresetRegistry';
import {
  genCoverSchema,
  genMateriSchema,
  genKuisSchema,
  genDiskusiSchema,
  genRefleksiSchema,
  genSkenarioSchema,
  genMotivasiSchema,
  genRangkumanSchema,
  genTujuanDisplaySchema,
  genPenutupSchema,
} from '@/core/schema/generators';
import { assertDocumentPurity } from '@/core/schema/session-state';
import type { ParseResult } from '@/components/authoring/auto-generate/types';
import type { PageTemplateType } from '@/components/canva/types';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Wand2,
  ChevronDown,
  BookOpen,
  Zap,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Page type icons ──
const PAGE_ICONS: Record<string, string> = {
  cover: '🏠', tujuan: '🎯', motivasi: '💡', materi: '📖',
  skenario: '🎭', diskusi: '💬', kuis: '📝', refleksi: '🪞',
  rangkuman: '📌', penutup: '🎬',
};

// ── Convert AI lesson to CanvaPage[] ─────────────────────────────
function aiLessonToPages(lesson: AIGeneratedLesson): import('@/components/canva/types').CanvaPage[] {
  const parsed: ParseResult = {
    sentences: lesson.keyConcepts.map(k => `${k} merupakan konsep penting dalam pembelajaran ini.`),
    words: lesson.keyConcepts,
    topWords: lesson.keyConcepts.slice(0, 5),
    wordCount: lesson.keyConcepts.join(' ').split(/\s+/).length,
    definitions: lesson.definitions,
    enumerations: [],
    functions: [],
    causes: [],
  };

  const meta = {
    namaBab: lesson.title,
    kelas: '',
    mapel: '',
    durasi: '2 x 40 menit',
    ikon: '📚',
    judulPertemuan: lesson.title,
  };

  const opts = { pertemuan: 1, bloomMax: 6, jumlahKuis: 5 };
  const pages: import('@/components/canva/types').CanvaPage[] = [];

  for (let i = 0; i < lesson.pages.length; i++) {
    const aiPage = lesson.pages[i];
    const pageType = aiPage.type as PageTemplateType;
    const page = createPageFromPreset(pageType, i);

    // Override label with AI title
    page.label = aiPage.title;

    if (page.schema) {
      const blocks = generateBlocksForAIPage(pageType, parsed, meta, opts, aiPage);
      if (blocks.length > 0) {
        page.schema.blocks = blocks;
      }
    }

    pages.push(page);
  }

  // Dev-mode purity guard
  if (process.env.NODE_ENV !== 'production') {
    for (const p of pages) {
      if (p.schema) {
        try {
          assertDocumentPurity(p.schema, `ai-lesson page=${p.id}`);
        } catch {
          // Non-fatal — AI content may have extra fields
        }
      }
    }
  }

  return pages;
}

function generateBlocksForAIPage(
  pageType: PageTemplateType,
  parsed: ParseResult,
  meta: { namaBab: string; kelas: string; mapel: string; durasi: string; ikon: string; judulPertemuan: string },
  opts: { pertemuan: number; bloomMax: number; jumlahKuis: number },
  aiPage: AIGeneratedPage,
): import('@/core/schema/types').SchemaBlock[] {
  // Inject AI content hints into parsed data for richer generation
  const enrichedParsed: ParseResult = {
    ...parsed,
    sentences: [
      ...parsed.sentences,
      ...aiPage.contentHints.slice(0, 3),
    ],
  };

  switch (pageType) {
    case 'cover':
      return [genCoverSchema(meta)];
    case 'tujuan':
      return [genTujuanDisplaySchema(enrichedParsed, opts)];
    case 'motivasi':
      return [genMotivasiSchema(enrichedParsed, meta)];
    case 'materi':
      return genMateriSchema(enrichedParsed, { judulPertemuan: meta.judulPertemuan, namaBab: meta.namaBab });
    case 'skenario':
      return [genSkenarioSchema(enrichedParsed, meta)];
    case 'diskusi':
      return [genDiskusiSchema(enrichedParsed, [], { judulPertemuan: meta.judulPertemuan, namaBab: meta.namaBab })];
    case 'kuis':
      return [genKuisSchema(enrichedParsed, opts.jumlahKuis, opts.pertemuan)];
    case 'refleksi':
      return [genRefleksiSchema(enrichedParsed, { judulPertemuan: meta.judulPertemuan, namaBab: meta.namaBab })];
    case 'rangkuman':
      return [genRangkumanSchema(enrichedParsed, meta)];
    case 'penutup':
      return [genPenutupSchema(meta)];
    default:
      return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export default function AIGenerateLessonPanel() {
  const { loading, result, error, generateLesson, clear } = useAILessonGeneration();
  const meta = useAuthoringStore(s => s.meta);
  const _pushHistory = useCanvaStore(s => s._pushHistory);

  const [topik, setTopik] = useState('');
  const [mapel, setMapel] = useState(meta.mapel || 'PPKn');
  const [kelas, setKelas] = useState(meta.kelas || '8');
  const [pattern, setPattern] = useState<'standar' | 'interaktif' | 'eksperimen' | 'mini'>('standar');
  const [patternOpen, setPatternOpen] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!topik.trim()) {
      toast.warning('Masukkan topik pembelajaran');
      return;
    }
    setApplied(false);
    await generateLesson({
      topik: topik.trim(),
      mapel,
      kelas,
      pattern,
    });
  }, [topik, mapel, kelas, pattern, generateLesson]);

  const handleApply = useCallback(() => {
    if (!result?.success || !result.data) {
      toast.warning('Tidak ada struktur pembelajaran untuk diterapkan');
      return;
    }

    try {
      const pages = aiLessonToPages(result.data);

      _pushHistory();
      useCanvaStore.setState({
        pages,
        currentPageIndex: 0,
        selectedElId: null,
        selectedElIds: [],
        selectedBlockId: null,
        selectedBlockType: null,
        editingBlockId: null,
        selectedBlockIds: [],
      });

      setApplied(true);
      toast.success(`Materi "${result.data.title}" berhasil dibuat — ${pages.length} halaman`);
    } catch (err) {
      console.error('AIGenerateLesson: Failed to apply', err);
      toast.error('Gagal menerapkan struktur pembelajaran');
    }
  }, [result, _pushHistory]);

  const patternLabels: Record<string, string> = {
    standar: '📋 Standar',
    interaktif: '🎮 Interaktif',
    eksperimen: '🔬 Eksperimen',
    mini: '⚡ Mini',
  };

  // Feature flag guard — after all hooks, before JSX
  if (!isEnabled('aiGeneration')) return null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <Wand2 size={14} className="text-amber-400" />
          <Zap size={8} className="absolute -top-1 -right-1 text-yellow-300" />
        </div>
        <div className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">Buat Materi AI</div>
        <span className="text-[7px] text-app-muted bg-amber-500/10 px-1.5 py-0.5 rounded-full font-bold">NEW</span>
      </div>

      {/* Description */}
      <div className="text-[8px] text-app-muted leading-relaxed">
        Ketik topik, pilih pola, AI buatkan materi lengkap dalam hitungan detik.
      </div>

      {/* Topic input */}
      <div>
        <label className="text-[8px] text-app-muted font-bold uppercase tracking-wider flex items-center gap-1">
          <BookOpen size={8} /> Topik / Judul Materi
        </label>
        <input
          type="text"
          value={topik}
          onChange={e => setTopik(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && topik.trim()) handleGenerate(); }}
          placeholder="Contoh: Fotosintesis, Norma, SPLDV..."
          className="w-full h-8 px-2.5 text-[10px] mt-0.5 bg-app-elevated/60 border border-app-border/30 rounded-lg focus:border-amber-500/50 focus:outline-none placeholder:text-app-muted"
          autoFocus
        />
      </div>

      {/* Mapel + Kelas row */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[8px] text-app-muted font-bold uppercase tracking-wider">Mapel</label>
          <select
            value={mapel}
            onChange={e => setMapel(e.target.value)}
            className="w-full h-7 px-2 text-[9px] mt-0.5 bg-app-elevated/60 border border-app-border/30 rounded-lg focus:border-amber-500/50 focus:outline-none text-app-primary"
          >
            <option value="PPKn">PPKn</option>
            <option value="IPA">IPA</option>
            <option value="MTK">Matematika</option>
            <option value="B.Indonesia">B. Indonesia</option>
            <option value="B.Inggris">B. Inggris</option>
            <option value="IPS">IPS</option>
            <option value="Seni">Seni Budaya</option>
            <option value="PJOK">PJOK</option>
          </select>
        </div>
        <div className="w-20">
          <label className="text-[8px] text-app-muted font-bold uppercase tracking-wider">Kelas</label>
          <select
            value={kelas}
            onChange={e => setKelas(e.target.value)}
            className="w-full h-7 px-2 text-[9px] mt-0.5 bg-app-elevated/60 border border-app-border/30 rounded-lg focus:border-amber-500/50 focus:outline-none text-app-primary"
          >
            <option value="7">Kelas 7</option>
            <option value="8">Kelas 8</option>
            <option value="9">Kelas 9</option>
          </select>
        </div>
      </div>

      {/* Pattern selector */}
      <div>
        <label className="text-[8px] text-app-muted font-bold uppercase tracking-wider">Pola Pembelajaran</label>
        <div className="relative mt-0.5">
          <button
            onClick={() => setPatternOpen(!patternOpen)}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-app-elevated/60 border border-app-border/30 text-left hover:border-amber-500/30 transition-colors"
          >
            <span className="text-[10px] text-app-primary font-semibold">{patternLabels[pattern]}</span>
            <ChevronDown size={12} className={`text-app-muted transition-transform ${patternOpen ? 'rotate-180' : ''}`} />
          </button>
          {patternOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-app-surface border border-app-border shadow-xl z-50 overflow-hidden">
              {(['standar', 'interaktif', 'eksperimen', 'mini'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => { setPattern(p); setPatternOpen(false); }}
                  className={`w-full px-3 py-2.5 flex items-center gap-2 hover:bg-amber-500/10 transition-colors text-left ${pattern === p ? 'bg-amber-500/10' : ''}`}
                >
                  <span className="text-sm">{patternLabels[p].split(' ')[0]}</span>
                  <div>
                    <div className="text-[10px] font-semibold text-app-primary">{patternLabels[p].split(' ').slice(1).join(' ')}</div>
                    <div className="text-[8px] text-app-muted">
                      {p === 'standar' ? 'Alur lengkap BSNP' : p === 'interaktif' ? 'Skenario + game' : p === 'eksperimen' ? 'Praktikum + ilmiah' : '4-5 halaman cepat'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={loading || !topik.trim()}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-bold transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none ${
          loading
            ? 'bg-amber-500/20 text-amber-400/60 border border-amber-500/20'
            : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30'
        }`}
      >
        {loading ? (
          <>
            <Loader2 size={12} className="animate-spin" />
            AI sedang merancang materi...
          </>
        ) : (
          <>
            <Wand2 size={12} />
            Buat Materi dengan AI
          </>
        )}
      </button>

      {/* Error display */}
      {error && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle size={12} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-[9px] text-red-300">{error}</div>
        </div>
      )}

      {/* Result preview */}
      {result?.success && result.data && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={10} className="text-emerald-400" />
              <span className="text-[9px] font-bold text-emerald-300">Struktur Materi Siap</span>
            </div>
            <button
              onClick={handleGenerate}
              className="text-[8px] text-app-muted hover:text-amber-300 transition-colors"
            >
              Ulangi
            </button>
          </div>

          {/* Lesson title */}
          <div className="p-2 rounded-lg bg-app-elevated/40 border border-app-border/20">
            <div className="text-[10px] font-bold text-app-primary">{result.data.title}</div>
            <div className="text-[8px] text-app-muted">{result.data.subtitle}</div>
          </div>

          {/* Page flow */}
          <div className="max-h-40 overflow-y-auto rounded-lg bg-app-elevated/40 border border-app-border/20 p-2 space-y-1">
            {result.data.pages.map((page, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[8px]">
                <span className="text-[10px]">{PAGE_ICONS[page.type] || '📄'}</span>
                <span className="text-app-primary font-semibold truncate flex-1">{page.title}</span>
                <span className="text-app-muted truncate max-w-[120px]">{page.description}</span>
              </div>
            ))}
          </div>

          {/* Key concepts */}
          <div className="flex flex-wrap gap-1">
            {result.data.keyConcepts.slice(0, 5).map((concept, i) => (
              <span key={i} className="text-[7px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
                {concept}
              </span>
            ))}
          </div>

          {/* Apply button */}
          <button
            onClick={handleApply}
            disabled={applied}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold transition-all active:scale-[0.97] disabled:opacity-50 ${
              applied
                ? 'bg-emerald-500/20 text-emerald-400/60 border border-emerald-500/20'
                : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
            }`}
          >
            {applied ? (
              <>
                <CheckCircle2 size={12} />
                Sudah Diterapkan
              </>
            ) : (
              <>
                <Zap size={12} />
                Terapkan ke Canvas ({result.data.pages.length} hal.)
              </>
            )}
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="text-[7px] text-app-muted pt-1 border-t border-app-border/10 leading-relaxed">
        AI merancang alur pembelajaran sesuai Kurikulum Merdeka dan standar BSNP.
        Selalu tinjau dan sesuaikan konten sebelum digunakan.
      </div>
    </div>
  );
}
