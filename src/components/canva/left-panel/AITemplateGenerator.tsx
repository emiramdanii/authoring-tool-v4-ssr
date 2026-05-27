'use client';

// ═══════════════════════════════════════════════════════════════════
// AI TEMPLATE GENERATOR — Generate a complete lesson from a topic
// ═══════════════════════════════════════════════════════════════════
// Teacher enters: topic, mapel, kelas, pattern → AI generates
// a complete LessonTemplate with contextual content.
//
// Flow:
//   1. Teacher fills form (topic, mapel, kelas, pattern)
//   2. AI generates ParseResult-like content from topic
//   3. instantiateTemplate() creates CanvaPage[] via schema generators
//   4. Pages are loaded into canvas via loadCustomSchema / setState
//
// TEACHER MODE: In 'sederhana' mode, simplified form with fewer options.
// ═══════════════════════════════════════════════════════════════════

import { useState, useCallback, useMemo } from 'react';
import { isEnabled } from '@/config/feature-flags';
import {
  Sparkles,
  Loader2,
  Wand2,
  ChevronRight,
  BookOpen,
  GraduationCap,
  LayoutTemplate,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { toast } from 'sonner';
import {
  TEMPLATE_PATTERNS,
  type TemplatePattern,
  type LessonTemplate,
  type TemplateCustomization,
  getDefaultCustomization,
} from '@/core/template/template-gallery';
import { teacherTerm } from '@/core/i18n/teacher-terminology';
import { useAIAssistant, type AIAction, type AIGenerateParams } from '../ai-assistant/use-ai-assistant';
import { logger } from '@/core/utils/logger';

// ── Mapel options ──
const MAPEL_OPTIONS = [
  { value: 'PPKn', label: 'PPKn', icon: '⚖️' },
  { value: 'IPA', label: 'IPA', icon: '🔬' },
  { value: 'MTK', label: 'Matematika', icon: '📐' },
  { value: 'B.Indonesia', label: 'B. Indonesia', icon: '📖' },
  { value: 'B.Inggris', label: 'B. Inggris', icon: '🌍' },
  { value: 'IPS', label: 'IPS', icon: '🏛️' },
  { value: 'Seni', label: 'Seni Budaya', icon: '🎨' },
  { value: 'PJOK', label: 'PJOK', icon: '⚽' },
  { value: 'Informatika', label: 'Informatika', icon: '💻' },
  { value: 'Prakarya', label: 'Prakarya', icon: '🔧' },
];

const KELAS_OPTIONS = ['7', '8', '9'];
const SEMESTER_OPTIONS = ['1', '2'];

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

interface AITemplateGeneratorProps {
  onTemplateGenerated?: (template: LessonTemplate) => void;
  onClose?: () => void;
}

export default function AITemplateGenerator({ onTemplateGenerated, onClose }: AITemplateGeneratorProps) {
  const teacherMode = useCanvaStore(s => s.teacherMode);
  const isSederhana = teacherMode;
  const meta = useAuthoringStore(s => s.meta);
  const loadCustomSchema = useCanvaStore(s => s.loadCustomSchema);
  const _pushHistory = useCanvaStore(s => s._pushHistory);

  const { loading, result, error, generate, clear } = useAIAssistant();

  // Form state
  const [topik, setTopik] = useState(meta.judulPertemuan || '');
  const [mapel, setMapel] = useState(meta.mapel || 'PPKn');
  const [kelas, setKelas] = useState(meta.kelas?.replace('Kelas ', '') || '7');
  const [semester, setSemester] = useState('1');
  const [pattern, setPattern] = useState<TemplatePattern>('standar');
  const [jumlahKuis, setJumlahKuis] = useState(5);
  const [step, setStep] = useState<'form' | 'preview' | 'apply'>('form');
  const [generatedTemplate, setGeneratedTemplate] = useState<LessonTemplate | null>(null);

  // ── Generate template via AI ──────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!topik.trim()) {
      toast.warning('Masukkan topik/materi terlebih dahulu');
      return;
    }

    // Build the AI prompt for template generation
    const params: AIGenerateParams = {
      action: 'materi-summary' as AIAction,
      mapel,
      kelas: `Kelas ${kelas}`,
      topik: topik.trim(),
      konteks: `Buatkan konten untuk template pembelajaran dengan pola "${TEMPLATE_PATTERNS[pattern].label}". 
Include definitions, enumerations, functions, causes, and key terms for the topic "${topik}".
Mapel: ${mapel}, Kelas: ${kelas}, Semester: ${semester}.`,
      jumlah: 10,
      instruksi: `Generate a complete lesson template content with:
1. At least 3 key definitions (term + meaning)
2. At least 2 enumerations (subject + items array)
3. At least 2 functions (subject + description)
4. At least 1 cause-effect pair
5. 5-8 key vocabulary words
6. 2-3 introductory sentences

Format as JSON: { "definitions": [...], "enumerations": [...], "functions": [...], "causes": [...], "words": [...], "sentences": [...] }`,
    };

    const res = await generate(params);

    if (res?.success && res.data) {
      // Create a dynamic LessonTemplate from the AI result
      const template = createTemplateFromAIResult({
        topik: topik.trim(),
        mapel,
        kelas,
        semester,
        pattern,
        aiData: res.data as Record<string, unknown>,
      });

      setGeneratedTemplate(template);
      setStep('preview');
    }
  }, [topik, mapel, kelas, semester, pattern, generate]);

  // ── Apply generated template ──────────────────────────────────
  const handleApply = useCallback(async () => {
    if (!generatedTemplate) return;

    const { instantiateTemplateWithConfig } = await import('@/core/template/template-gallery');
    const config: TemplateCustomization = {
      enabledPages: generatedTemplate.pageTypes.map(() => true),
      jumlahKuis,
      variant: 'A',
      guru: '',
      sekolah: '',
    };

    try {
      const pages = instantiateTemplateWithConfig(generatedTemplate, config);

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

      toast.success(`Template "${generatedTemplate.title}" berhasil dibuat — ${pages.length} halaman`);
      onTemplateGenerated?.(generatedTemplate);
    } catch (err) {
      logger.error('AITemplateGenerator', 'Failed to apply template: ' + String(err));
      toast.error('Gagal menerapkan template');
    }
  }, [generatedTemplate, jumlahKuis, _pushHistory, onTemplateGenerated]);

  const patternConfig = TEMPLATE_PATTERNS[pattern];

  // Feature flag guard — after all hooks, before JSX
  if (!isEnabled('aiTemplateGenerator')) return null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <Wand2 size={14} className="text-violet-400" />
          <Sparkles size={8} className="absolute -top-1 -right-1 text-amber-300" />
        </div>
        <div className="text-[9px] font-bold text-violet-400 uppercase tracking-wider">
          {isSederhana ? 'Buat Template AI' : 'AI Template Generator'}
        </div>
        <span className="text-[7px] text-app-muted bg-violet-500/10 px-1.5 py-0.5 rounded-full font-bold">NEW</span>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {(['form', 'preview', 'apply'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold transition-[background-color,border-color] ${
              step === s
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                : i < ['form', 'preview', 'apply'].indexOf(step)
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-app-elevated/40 text-app-muted border border-app-border/20'
            }`}>
              {i < ['form', 'preview', 'apply'].indexOf(step) ? '✓' : i + 1}
            </div>
            {i < 2 && (
              <div className={`w-6 h-px ${i < ['form', 'preview', 'apply'].indexOf(step) ? 'bg-emerald-500/30' : 'bg-app-border/20'}`} />
            )}
          </div>
        ))}
        <div className="flex-1" />
        <div className="text-[7px] text-app-muted">
          {step === 'form' ? 'Isi Form' : step === 'preview' ? 'Preview' : 'Terapkan'}
        </div>
      </div>

      {/* ── STEP 1: Form ──────────────────────────────────────────── */}
      {step === 'form' && (
        <div className="space-y-3">
          {/* Topic input */}
          <div>
            <label className="text-[8px] text-app-muted font-bold uppercase tracking-wider flex items-center gap-1">
              <BookOpen size={8} /> Topik / Judul Materi
            </label>
            <input
              type="text"
              value={topik}
              onChange={(e) => setTopik(e.target.value)}
              placeholder="Contoh: Norma dalam Kehidupan"
              className="w-full h-8 px-2.5 text-[10px] mt-1 bg-app-elevated/60 border border-app-border/30 rounded-lg focus:border-violet-500/50 focus:outline-none placeholder:text-app-muted"
              autoFocus
            />
          </div>

          {/* Mapel + Kelas row */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[8px] text-app-muted font-bold uppercase tracking-wider flex items-center gap-1">
                📚 Mapel
              </label>
              <select
                value={mapel}
                onChange={(e) => setMapel(e.target.value)}
                className="w-full h-7 px-2 text-[10px] mt-1 bg-app-elevated/60 border border-app-border/30 rounded-lg focus:border-violet-500/50 focus:outline-none text-app-primary"
              >
                {MAPEL_OPTIONS.map(m => (
                  <option key={m.value} value={m.value}>{m.icon} {m.label}</option>
                ))}
              </select>
            </div>
            <div className="w-20">
              <label className="text-[8px] text-app-muted font-bold uppercase tracking-wider flex items-center gap-1">
                <GraduationCap size={8} /> Kelas
              </label>
              <select
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                className="w-full h-7 px-2 text-[10px] mt-1 bg-app-elevated/60 border border-app-border/30 rounded-lg focus:border-violet-500/50 focus:outline-none text-app-primary"
              >
                {KELAS_OPTIONS.map(k => (
                  <option key={k} value={k}>Kelas {k}</option>
                ))}
              </select>
            </div>
            <div className="w-20">
              <label className="text-[8px] text-app-muted font-bold uppercase tracking-wider">
                Semester
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full h-7 px-2 text-[10px] mt-1 bg-app-elevated/60 border border-app-border/30 rounded-lg focus:border-violet-500/50 focus:outline-none text-app-primary"
              >
                {SEMESTER_OPTIONS.map(s => (
                  <option key={s} value={s}>Sem. {s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pattern selection */}
          {!isSederhana && (
            <div>
              <label className="text-[8px] text-app-muted font-bold uppercase tracking-wider flex items-center gap-1">
                <LayoutTemplate size={8} /> Pola Pembelajaran
              </label>
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                {(Object.entries(TEMPLATE_PATTERNS) as [TemplatePattern, typeof TEMPLATE_PATTERNS[TemplatePattern]][]).map(([key, pat]) => (
                  <button
                    key={key}
                    onClick={() => setPattern(key)}
                    className={`px-2.5 py-2 rounded-lg border text-left transition-[background-color,border-color] ${
                      pattern === key
                        ? 'bg-violet-500/15 border-violet-500/30 text-violet-300'
                        : 'bg-app-elevated/40 border-app-border/20 text-app-secondary hover:border-app-border-strong'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{pat.icon}</span>
                      <div>
                        <div className="text-[9px] font-bold">{pat.label}</div>
                        <div className="text-[7px] text-app-muted leading-tight">{pat.description.slice(0, 40)}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sederhana: Simple pattern toggle */}
          {isSederhana && (
            <div>
              <label className="text-[8px] text-app-muted font-bold uppercase tracking-wider">Pola</label>
              <div className="flex gap-1.5 mt-1">
                {(Object.entries(TEMPLATE_PATTERNS) as [TemplatePattern, typeof TEMPLATE_PATTERNS[TemplatePattern]][]).map(([key, pat]) => (
                  <button
                    key={key}
                    onClick={() => setPattern(key)}
                    className={`flex-1 py-1.5 rounded-lg border text-[9px] font-bold transition-[background-color,border-color,color] ${
                      pattern === key
                        ? 'bg-violet-500/15 border-violet-500/30 text-violet-300'
                        : 'bg-app-elevated/40 border-app-border/20 text-app-muted hover:border-app-border-strong'
                    }`}
                  >
                    {pat.icon} {pat.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quiz count */}
          <div>
            <label className="text-[8px] text-app-muted font-bold uppercase tracking-wider">
              📝 Jumlah Soal Kuis
            </label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="range"
                min={3}
                max={15}
                value={jumlahKuis}
                onChange={(e) => setJumlahKuis(parseInt(e.target.value))}
                className="flex-1 h-1 bg-app-border/30 rounded-full appearance-none cursor-pointer accent-violet-500"
              />
              <span className="text-[12px] font-bold text-app-primary w-6 text-center">{jumlahKuis}</span>
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !topik.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-bold transition-[transform,box-shadow,background-color] active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none bg-violet-500/15 border border-violet-500/30 text-violet-300 hover:bg-violet-500/25"
          >
            {loading ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Membuat Template AI...
              </>
            ) : (
              <>
                <Wand2 size={12} />
                Buat Template dari AI
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

          {/* Info hint */}
          <div className="flex items-start gap-1.5 px-2 py-1.5 rounded-lg bg-app-elevated/20 border border-app-border/10">
            <Info size={10} className="text-app-muted flex-shrink-0 mt-0.5" />
            <div className="text-[8px] text-app-muted leading-relaxed">
              AI akan membuat template lengkap berdasarkan topik yang kamu masukkan. Kamu bisa mengatur halaman mana yang ingin dimasukkan sebelum menerapkan.
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: Preview ────────────────────────────────────────── */}
      {step === 'preview' && generatedTemplate && (
        <div className="space-y-3">
          {/* Template preview card */}
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
            <div className="flex items-center gap-2.5">
              <div className="text-2xl flex-shrink-0">🤖</div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-app-primary truncate">
                  {generatedTemplate.title}
                </div>
                <div className="text-[9px] text-violet-300 font-semibold">
                  {generatedTemplate.subtitle}
                </div>
              </div>
              <div className="flex-shrink-0 text-[8px] text-app-muted flex items-center gap-0.5">
                <BookOpen size={8} />
                {generatedTemplate.estimatedPages} hal.
              </div>
            </div>

            <div className="text-[9px] text-app-muted mt-2 leading-relaxed line-clamp-3">
              {generatedTemplate.description}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="text-[7px] px-1.5 py-0 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold">
                {patternConfig.icon} {patternConfig.label}
              </span>
              <span className="text-[7px] px-1.5 py-0 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold">
                {mapel}
              </span>
              <span className="text-[7px] px-1.5 py-0 rounded bg-app-elevated/40 text-app-muted border border-app-border/30 font-bold">
                Kelas {kelas}
              </span>
            </div>
          </div>

          {/* Page preview list */}
          <div>
            <div className="text-[8px] font-bold text-app-secondary uppercase tracking-wider mb-1.5">
              Alur Halaman ({generatedTemplate.pagePreview.length})
            </div>
            <div className="space-y-0.5 max-h-40 overflow-y-auto custom-scrollbar">
              {generatedTemplate.pagePreview.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 text-[8px] px-2 py-1.5 rounded-md bg-app-elevated/20"
                >
                  <span className="text-[10px]">{PAGE_TYPE_ICONS[p.type] || '📄'}</span>
                  <span className="text-app-primary font-semibold truncate">{p.title}</span>
                  <span className="text-app-muted truncate flex-1">— {p.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Success indicator */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 size={12} className="text-emerald-400" />
            <span className="text-[9px] font-bold text-emerald-300">Template berhasil dibuat oleh AI</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-1.5">
            <button
              onClick={() => { setStep('form'); setGeneratedTemplate(null); clear(); }}
              className="flex-1 py-2 rounded-lg text-[10px] font-bold bg-app-elevated/40 border border-app-border/30 text-app-secondary hover:text-app-primary hover:border-app-border-strong transition-[background-color,border-color,color]"
            >
              ← Ubah
            </button>
            <button
              onClick={() => setStep('apply')}
              className="flex-1 py-2 rounded-lg text-[10px] font-bold bg-violet-500/15 border border-violet-500/30 text-violet-300 hover:bg-violet-500/25 transition-[transform,box-shadow,background-color] flex items-center justify-center gap-1"
            >
              Lanjut
              <ChevronRight size={10} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Apply ──────────────────────────────────────────── */}
      {step === 'apply' && generatedTemplate && (
        <div className="space-y-3">
          {/* Quick summary */}
          <div className="text-[9px] text-app-secondary">
            Template <span className="font-bold text-violet-300">"{generatedTemplate.title}"</span> akan diterapkan ke canvas.
            {generatedTemplate.estimatedPages} halaman akan dibuat.
          </div>

          {/* Actions */}
          <div className="flex gap-1.5">
            <button
              onClick={() => setStep('preview')}
              className="flex-1 py-2 rounded-lg text-[10px] font-bold bg-app-elevated/40 border border-app-border/30 text-app-secondary hover:text-app-primary hover:border-app-border-strong transition-[background-color,border-color,color]"
            >
              ← Preview
            </button>
            <button
              onClick={handleApply}
              className="flex-1 py-2.5 rounded-xl text-[11px] font-bold bg-violet-500/15 border border-violet-500/30 text-violet-300 hover:bg-violet-500/25 transition-[transform,box-shadow,background-color] active:scale-[0.97] flex items-center justify-center gap-1.5"
            >
              <Sparkles size={12} />
              Terapkan Template
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HELPER: Create a LessonTemplate from AI generation result
// ═══════════════════════════════════════════════════════════════════

const PAGE_TYPE_ICONS: Record<string, string> = {
  cover: '🏠', petunjuk: '📋', dokumen: '📄', tujuan: '🎯',
  motivasi: '💡', materi: '📖', skenario: '🎭', diskusi: '💬',
  kuis: '📝', game: '🎮', hasil: '🏆', refleksi: '🪞',
  rangkuman: '📌', penutup: '🎬', hero: '🦸', custom: '🔧',
};

const PATTERN_PAGE_TYPES: Record<TemplatePattern, { types: string[]; preview: Array<{ title: string; desc: string }> }> = {
  standar: {
    types: ['cover', 'tujuan', 'motivasi', 'materi', 'diskusi', 'kuis', 'refleksi', 'rangkuman', 'penutup'],
    preview: [
      { title: 'Sampul', desc: 'Judul dan informasi materi' },
      { title: 'Tujuan Pembelajaran', desc: 'TP dengan KKO tingkat tinggi' },
      { title: 'Motivasi', desc: 'Pertanyaan pemantik' },
      { title: 'Materi Pembelajaran', desc: 'Definisi, contoh, dan penjelasan' },
      { title: 'Diskusi', desc: 'Pertanyaan diskusi kelompok' },
      { title: 'Kuis', desc: 'Soal pilihan ganda' },
      { title: 'Refleksi', desc: 'Refleksi dan komitmen' },
      { title: 'Rangkuman', desc: 'Konsep kunci' },
      { title: 'Penutup', desc: 'Ringkasan dan tindak lanjut' },
    ],
  },
  interaktif: {
    types: ['cover', 'tujuan', 'skenario', 'materi', 'diskusi', 'kuis', 'refleksi', 'penutup'],
    preview: [
      { title: 'Sampul', desc: 'Judul dan informasi materi' },
      { title: 'Tujuan Pembelajaran', desc: 'TP dengan KKO tingkat tinggi' },
      { title: 'Skenario Interaktif', desc: 'Cerita dengan pilihan' },
      { title: 'Materi Pembelajaran', desc: 'Definisi, contoh, dan penjelasan' },
      { title: 'Diskusi', desc: 'Diskusi berbasis skenario' },
      { title: 'Kuis', desc: 'Soal pilihan ganda' },
      { title: 'Refleksi', desc: 'Refleksi dan komitmen' },
      { title: 'Penutup', desc: 'Ringkasan dan tindak lanjut' },
    ],
  },
  eksperimen: {
    types: ['cover', 'tujuan', 'skenario', 'materi', 'diskusi', 'kuis', 'rangkuman', 'penutup'],
    preview: [
      { title: 'Sampul', desc: 'Judul dan informasi materi' },
      { title: 'Tujuan Pembelajaran', desc: 'TP dengan KKO tingkat tinggi' },
      { title: 'Skenario Ilmiah', desc: 'Penyelidikan interaktif' },
      { title: 'Materi Pembelajaran', desc: 'Konsep dan proses ilmiah' },
      { title: 'Praktikum/Diskusi', desc: 'Aktivitas hands-on' },
      { title: 'Kuis', desc: 'Soal pilihan ganda' },
      { title: 'Rangkuman', desc: 'Konsep kunci' },
      { title: 'Penutup', desc: 'Ringkasan dan tugas observasi' },
    ],
  },
  mini: {
    types: ['cover', 'materi', 'kuis', 'penutup'],
    preview: [
      { title: 'Sampul', desc: 'Judul materi' },
      { title: 'Materi Inti', desc: 'Poin-poin penting' },
      { title: 'Kuis Cepat', desc: 'Soal evaluasi singkat' },
      { title: 'Penutup', desc: 'Ringkasan dan tugas' },
    ],
  },
};

const MAPEL_ICONS: Record<string, string> = {
  'PPKn': '⚖️', 'IPA': '🔬', 'MTK': '📐', 'B.Indonesia': '📖',
  'B.Inggris': '🌍', 'IPS': '🏛️', 'Seni': '🎨', 'PJOK': '⚽',
  'Informatika': '💻', 'Prakarya': '🔧',
};

const MAPEL_COLORS: Record<string, string> = {
  'PPKn': 'amber', 'IPA': 'emerald', 'MTK': 'sky', 'B.Indonesia': 'orange',
  'B.Inggris': 'purple', 'IPS': 'violet', 'Seni': 'pink', 'PJOK': 'cyan',
  'Informatika': 'sky', 'Prakarya': 'amber',
};

function createTemplateFromAIResult(opts: {
  topik: string;
  mapel: string;
  kelas: string;
  semester: string;
  pattern: TemplatePattern;
  aiData: Record<string, unknown>;
}): LessonTemplate {
  const { topik, mapel, kelas, semester, pattern, aiData } = opts;
  const patternDef = PATTERN_PAGE_TYPES[pattern];

  // Extract AI-generated content for tags
  const words = Array.isArray(aiData.words) ? aiData.words as string[] : [];
  const definitions = Array.isArray(aiData.definitions) ? aiData.definitions as Array<{ term: string; meaning: string }> : [];
  const tags = [
    ...words.slice(0, 3).map(w => w.toLowerCase()),
    ...definitions.slice(0, 2).map(d => d.term.toLowerCase()),
  ].slice(0, 5);

  const id = `ai-${mapel.toLowerCase()}-${topik.toLowerCase().replace(/\s+/g, '-').slice(0, 30)}-${Date.now()}`;

  return {
    id,
    title: topik,
    subtitle: `${mapel} Kelas ${kelas} - Semester ${semester}`,
    description: `Template AI-generated untuk ${topik} — ${TEMPLATE_PATTERNS[pattern].label.toLowerCase()}. Konten dibuat otomatis berdasarkan topik dan dapat disesuaikan.`,
    mapel,
    kelas,
    semester,
    icon: MAPEL_ICONS[mapel] || '📚',
    color: MAPEL_COLORS[mapel] || 'violet',
    tags,
    pattern,
    pageTypes: patternDef.types as LessonTemplate['pageTypes'],
    estimatedPages: patternDef.types.length,
    pagePreview: patternDef.types.map((type, i) => ({
      type: type as LessonTemplate['pageTypes'][number],
      title: patternDef.preview[i]?.title || type,
      description: patternDef.preview[i]?.desc || `Halaman ${type}`,
    })),
  };
}
