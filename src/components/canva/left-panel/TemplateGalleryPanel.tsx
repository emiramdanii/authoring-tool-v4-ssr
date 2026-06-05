'use client';

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE GALLERY PANEL — Pre-built lesson template browser
// ═══════════════════════════════════════════════════════════════════
// ⛔ DEPRECATED — This component uses the legacy template-gallery.ts
//    pipeline (LessonTemplate + instantiateTemplate), NOT the official
//    CourseTemplateRegistry + applyTemplateToStore pipeline.
//
//    - Do NOT use this for teacher template flow.
//    - Official template source: CourseTemplateRegistry.ts
//    - Official apply flow: applyTemplateToStore()
//    - This panel is only accessible in advanced/lengkap mode.
//    - Teacher (sederhana) mode cannot reach this panel.
//    - See D-P0D.3 audit for migration plan.
//
// Shows a grid of template cards for common SMP subjects.
// Teachers can filter by mapel, pattern, search by title/tags, and
// apply a template to instantly generate a complete lesson.
//
// ENHANCED (Phase F.1):
//   - Pattern tabs (Standar, Interaktif, Eksperimen, Mini)
//   - Template customization dialog with merge/replace mode
//   - Expanded page preview with step indicators
//   - 16 templates across 8+ subjects
//   - INSERT mode: add template pages to existing project
//
// TEACHER MODE: In 'sederhana' mode, uses simpler terminology
// ("Pilih Template" instead of "Template Gallery").
// ═══════════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from 'react';
// All icons migrated to Material Symbols Outlined
import { useCanvaStore } from '@/store/canva-store';
import { toast } from 'sonner';
import { logger } from '@/core/utils/logger';
import {
  getAllLessonTemplates,
  getTemplateMapelList,
  instantiateTemplate,
  instantiateTemplateWithConfig,
  insertTemplatePages,
  TEMPLATE_PATTERNS,
  type LessonTemplate,
  type TemplatePattern,
  type TemplateCustomization,
} from '@/core/template/template-gallery';
import { getAvailableGoldenPresets } from '@/core/engine/SchemaEngine.utils';
import { teacherTerm } from '@/core/i18n/teacher-terminology';
import dynamic from 'next/dynamic';

// Lazy-loaded: TemplateCustomizeDialog is a modal only shown on demand
const TemplateCustomizeDialog = dynamic(() => import('./TemplateCustomizeDialog'), {
  ssr: false,
  loading: () => null,
});

// Lazy-loaded: AITemplateGenerator is a heavy AI panel only used in 'ai' view
const AITemplateGenerator = dynamic(() => import('./AITemplateGenerator'), {
  ssr: false,
  loading: () => <div className="h-32 animate-pulse bg-app-elevated/20 rounded-lg" />,
});

// Type needed for callback signature (mirrors TemplateCustomizeDialog's export)
type TemplateApplyMode = 'replace' | 'insert';

// ── Color mapping for template cards ─────────────────────────
const COLOR_MAP: Record<string, { bg: string; border: string; text: string; badge: string; hoverBg: string }> = {
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    hoverBg: 'hover:bg-amber-500/15',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    hoverBg: 'hover:bg-emerald-500/15',
  },
  sky: {
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
    text: 'text-sky-400',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    hoverBg: 'hover:bg-sky-500/15',
  },
  orange: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    text: 'text-orange-400',
    badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    hoverBg: 'hover:bg-orange-500/15',
  },
  violet: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    text: 'text-violet-400',
    badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    hoverBg: 'hover:bg-violet-500/15',
  },
  pink: {
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
    text: 'text-pink-400',
    badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    hoverBg: 'hover:bg-pink-500/15',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    text: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    hoverBg: 'hover:bg-purple-500/15',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    text: 'text-cyan-400',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    hoverBg: 'hover:bg-cyan-500/15',
  },
};

const DEFAULT_COLORS = COLOR_MAP.amber;

// ── Mapel display config ────────────────────────────────────
const MAPEL_CONFIG: Record<string, { label: string; icon: string }> = {
  'PPKn': { label: 'PPKn', icon: '⚖️' },
  'IPA': { label: 'IPA', icon: '🔬' },
  'MTK': { label: 'MTK', icon: '📐' },
  'B.Indonesia': { label: 'B. Indonesia', icon: '📖' },
  'B.Inggris': { label: 'B. Inggris', icon: '🌍' },
  'IPS': { label: 'IPS', icon: '🏛️' },
  'Seni': { label: 'Seni', icon: '🎨' },
  'PJOK': { label: 'PJOK', icon: '⚽' },
  'Informatika': { label: 'Informatika', icon: '💻' },
  'Prakarya': { label: 'Prakarya', icon: '🔧' },
};

// ── Page type icon mapping ──
const PAGE_TYPE_ICONS: Record<string, string> = {
  cover: '🏠', petunjuk: '📋', dokumen: '📄', tujuan: '🎯',
  motivasi: '💡', materi: '📖', skenario: '🎭', diskusi: '💬',
  kuis: '📝', game: '🎮', hasil: '🏆', refleksi: '🪞',
  rangkuman: '📌', penutup: '🎬', hero: '🦸', custom: '🔧',
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function TemplateGalleryPanel() {
  const teacherMode = useCanvaStore(s => s.teacherMode);
  const isSederhana = teacherMode;
  const loadCustomSchema = useCanvaStore(s => s.loadCustomSchema);
  const _pushHistory = useCanvaStore(s => s._pushHistory);
  const existingPages = useCanvaStore(s => s.pages);

  const [search, setSearch] = useState('');
  const [activeMapel, setActiveMapel] = useState<string | null>(null);
  const [activePattern, setActivePattern] = useState<TemplatePattern | null>(null);
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);
  const [customizeTemplate, setCustomizeTemplate] = useState<LessonTemplate | null>(null);
  const [activeView, setActiveView] = useState<'prebuilt' | 'ai'>('prebuilt');

  // All templates
  const allTemplates = useMemo(() => getAllLessonTemplates(), []);

  // Unique mapel list
  const mapelList = useMemo(() => getTemplateMapelList(), []);

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    let result = allTemplates;

    // Filter by pattern
    if (activePattern) {
      result = result.filter(t => t.pattern === activePattern);
    }

    // Filter by mapel
    if (activeMapel) {
      result = result.filter(t => t.mapel === activeMapel);
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.subtitle.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q)) ||
        t.mapel.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allTemplates, activePattern, activeMapel, search]);

  // ── Quick apply template (default config, replace mode) ──────
  const handleQuickApply = useCallback(async (template: LessonTemplate) => {
    setLoadingTemplateId(template.id);

    try {
      // ── 3-LEVEL PIPELINE ──────────────────────────────────────────
      // Level 1: If template has a presetId, load the premium handcrafted
      //   preset directly → rich, pedagogically-structured content (⭐⭐⭐⭐⭐)
      // Level 1g: Golden preset — returns CanvaPage[] directly (bypasses LessonSchema)
      // Level 2: Otherwise, use instantiateTemplate() with mock data (⭐⭐⭐)
      // Level 3: Fallback empty shell (handled by instantiateTemplate)
      if (template.presetId) {
        // Level 1g: Golden preset — returns CanvaPage[] directly (bypasses LessonSchema)
        const goldenPresets = getAvailableGoldenPresets();
        if (goldenPresets.includes(template.presetId)) {
          try {
            await useCanvaStore.getState().loadGoldenPreset(template.presetId);
            return;
          } catch (goldenErr) {
            logger.warn('TemplateGallery', `Golden preset "${template.presetId}" failed, falling back: ${String(goldenErr)}`);
            // Fall through to Level 1 (schema preset)
          }
        }

        // Level 1: Premium schema preset pipeline
        try {
          await useCanvaStore.getState().loadSchemaPreset(template.presetId);
          // loadSchemaPreset handles all store updates + toast
          return;
        } catch (presetErr) {
          logger.warn('TemplateGallery', `Preset "${template.presetId}" failed, falling back to Level 2: ${String(presetErr)}`);
          // Fall through to Level 2
        }
      }

      // Level 2: Generated content pipeline
      await new Promise(resolve => setTimeout(resolve, 150));

      // If project is empty → replace (same as before)
      // If project has pages → insert (merge mode — don't destroy existing work)
      const pages = instantiateTemplate(template);

      _pushHistory();

      if (existingPages.length === 0) {
        // Replace mode — no existing pages to preserve
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
        toast.success(`Template "${template.title}" diterapkan — ${pages.length} halaman`);
      } else {
        // Insert mode — append to existing pages
        useCanvaStore.setState(state => ({
          pages: [...state.pages, ...pages],
          currentPageIndex: state.pages.length, // Navigate to first new page
          selectedElId: null,
          selectedElIds: [],
          selectedBlockId: null,
          selectedBlockType: null,
          editingBlockId: null,
          selectedBlockIds: [],
        }));
        toast.success(`${pages.length} halaman dari "${template.title}" ditambahkan ke project`);
      }
    } catch (err) {
      logger.error('TemplateGallery', 'Failed to apply template: ' + String(err));
      toast.error(`Gagal menerapkan template "${template.title}"`);
    } finally {
      setLoadingTemplateId(null);
    }
  }, [_pushHistory, existingPages.length]);

  // ── Apply with customization (supports merge/replace mode) ──
  const handleCustomApply = useCallback(async (
    template: LessonTemplate,
    config: TemplateCustomization,
    mode: TemplateApplyMode,
  ) => {
    setLoadingTemplateId(template.id);

    try {
      // ── 3-LEVEL PIPELINE for custom apply too ──────────────────
      // If template has presetId and mode is 'replace', use premium preset
      if (template.presetId && mode === 'replace') {
        // Level 1g: Golden preset
        const goldenPresets = getAvailableGoldenPresets();
        if (goldenPresets.includes(template.presetId)) {
          try {
            await useCanvaStore.getState().loadGoldenPreset(template.presetId);
            return;
          } catch (goldenErr) {
            logger.warn('TemplateGallery', `Golden preset "${template.presetId}" failed in custom apply, falling back: ${String(goldenErr)}`);
            // Fall through to Level 1 (schema preset)
          }
        }

        // Level 1: Premium schema preset
        try {
          await useCanvaStore.getState().loadSchemaPreset(template.presetId);
          return;
        } catch (presetErr) {
          logger.warn('TemplateGallery', `Preset "${template.presetId}" failed in custom apply, falling back: ${String(presetErr)}`);
          // Fall through to Level 2
        }
      }

      // Level 2: Generated content pipeline
      await new Promise(resolve => setTimeout(resolve, 150));

      _pushHistory();

      if (mode === 'insert' && existingPages.length > 0) {
        // Insert/merge mode — append new pages to existing
        const result = insertTemplatePages(template, existingPages.length, config);

        useCanvaStore.setState(state => ({
          pages: [...state.pages, ...result.newPages],
          currentPageIndex: state.pages.length, // Navigate to first new page
          selectedElId: null,
          selectedElIds: [],
          selectedBlockId: null,
          selectedBlockType: null,
          editingBlockId: null,
          selectedBlockIds: [],
        }));

        toast.success(`${result.newPages.length} halaman dari "${template.title}" ditambahkan (total: ${result.totalAfterInsert})`);
      } else {
        // Replace mode — overwrite all pages
        const pages = instantiateTemplateWithConfig(template, config);

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

        toast.success(`Template "${template.title}" diterapkan — ${pages.length} halaman`);
      }
    } catch (err) {
      logger.error('TemplateGallery', 'Failed to apply template with config: ' + String(err));
      toast.error(`Gagal menerapkan template "${template.title}"`);
    } finally {
      setLoadingTemplateId(null);
      setCustomizeTemplate(null);
    }
  }, [_pushHistory, existingPages.length]);

  // Panel title based on teacher mode
  const panelTitle = isSederhana ? 'Pilih Template' : 'Template Gallery';
  const searchPlaceholder = isSederhana ? 'Cari template...' : 'Cari template...';

  return (
    <div className="space-y-3" data-testid="template-gallery-panel">
      {/* Header */}
      <div className="text-[9px] font-bold text-app-secondary uppercase tracking-wider flex items-center gap-1.5">
        <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>auto_awesome</span>
        {panelTitle}
        {activeView === 'prebuilt' && <span className="text-app-muted">({filteredTemplates.length})</span>}
      </div>

      {/* View toggle: Pre-built vs AI Generate */}
      <div className="flex gap-1">
        <button
          onClick={() => setActiveView('prebuilt')}
          className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold transition-[background-color,border-color,color] flex items-center justify-center gap-1 ${
            activeView === 'prebuilt'
              ? 'bg-app-accent/10 border border-app-accent/30 text-app-accent'
              : 'bg-app-elevated border border-app-border-subtle text-app-secondary hover:border-app-border-strong'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '9px' }}>grid_view</span>
          {isSederhana ? 'Template Siap Pakai' : 'Pre-built'}
        </button>
        <button
          onClick={() => setActiveView('ai')}
          className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold transition-[background-color,border-color,color] flex items-center justify-center gap-1 ${
            activeView === 'ai'
              ? 'bg-violet-500/15 border border-violet-500/30 text-violet-300'
              : 'bg-app-elevated border border-app-border-subtle text-app-secondary hover:border-app-border-strong'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '9px' }}>auto_fix</span>
          {isSederhana ? 'Buat dari AI' : 'AI Generate'}
        </button>
      </div>

      {/* ── Pre-built Template View ──────────────────────────────── */}
      {activeView === 'prebuilt' && (
        <>
          {/* Search input */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-app-muted" style={{ fontSize: '12px' }} aria-hidden="true">search</span>
            <input
              id="template-gallery-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label="Cari template"
              className="w-full h-7 pl-7 pr-2 text-[10px] text-app-primary bg-app-elevated/60 border border-app-border/30 rounded-lg focus:border-app-accent/50 focus:outline-none placeholder:text-app-muted"
            />
          </div>

      {/* Pattern tabs */}
      <div className="flex gap-1 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActivePattern(null)}
          className={`flex-shrink-0 px-2 py-1 rounded-lg text-[8px] font-bold transition-[background-color,border-color,color] flex items-center gap-1 ${
            activePattern === null
              ? 'bg-app-accent/10 border border-app-accent/30 text-app-accent'
              : 'bg-app-elevated border border-app-border-subtle text-app-secondary hover:border-app-border-strong'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '9px' }}>grid_view</span>
          Semua
        </button>
        {(Object.entries(TEMPLATE_PATTERNS) as [TemplatePattern, typeof TEMPLATE_PATTERNS[TemplatePattern]][]).map(([key, pat]) => (
          <button
            key={key}
            onClick={() => setActivePattern(activePattern === key ? null : key)}
            className={`flex-shrink-0 px-2 py-1 rounded-lg text-[8px] font-bold transition-[background-color,border-color,color] flex items-center gap-1 ${
              activePattern === key
                ? 'bg-app-accent/10 border border-app-accent/30 text-app-accent'
                : 'bg-app-elevated border border-app-border-subtle text-app-secondary hover:border-app-border-strong'
            }`}
          >
            <span className="text-[9px]">{pat.icon}</span>
            {pat.label}
          </button>
        ))}
      </div>

      {/* Mapel filter chips */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setActiveMapel(null)}
          className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-[background-color,border-color,color] ${
            activeMapel === null
              ? 'bg-app-accent/10 border border-app-accent/30 text-app-accent'
              : 'bg-app-elevated border border-app-border-subtle text-app-secondary hover:border-app-border-strong'
          }`}
        >
          Semua
        </button>
        {mapelList.map(mapel => {
          const config = MAPEL_CONFIG[mapel] || { label: mapel, icon: '📚' };
          const isActive = activeMapel === mapel;
          return (
            <button
              key={mapel}
              onClick={() => setActiveMapel(isActive ? null : mapel)}
              className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-[background-color,border-color,color] flex items-center gap-1 ${
                isActive
                  ? 'bg-app-accent/10 border border-app-accent/30 text-app-accent'
                  : 'bg-app-elevated border border-app-border-subtle text-app-secondary hover:border-app-border-strong'
              }`}
            >
              <span className="text-[10px]">{config.icon}</span>
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Template cards */}
      <div className="space-y-2 max-h-[calc(100vh-380px)] overflow-y-auto custom-scrollbar">
        {filteredTemplates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            isLoading={loadingTemplateId === template.id}
            isAnyLoading={loadingTemplateId !== null}
            hasExistingPages={existingPages.length > 0}
            onQuickApply={handleQuickApply}
            onCustomize={() => setCustomizeTemplate(template)}
          />
        ))}

        {/* Empty state */}
        {filteredTemplates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
            <div className="text-2xl mb-2 opacity-40">
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>menu_book</span>
            </div>
            <div className="text-[10px] text-app-muted">
              Tidak ada template yang cocok
            </div>
            <div className="text-[8px] text-app-muted mt-1">
              Coba ubah filter atau kata kunci pencarian
            </div>
          </div>
        )}
      </div>
        </>
      )}

      {/* ── AI Generator View ────────────────────────────────────── */}
      {activeView === 'ai' && (
        <AITemplateGenerator />
      )}

      {/* Footer hint */}
      <div className="text-[8px] text-app-muted mt-2 pt-2 border-t border-app-border/20">
        {activeView === 'prebuilt'
          ? (existingPages.length > 0
              ? 'Klik "Gunakan" untuk menambahkan halaman ke project, atau "Sesuaikan" untuk mengatur'
              : 'Klik "Gunakan" untuk langsung menerapkan, atau "Sesuaikan" untuk mengatur halaman')
          : 'AI akan membuat template lengkap berdasarkan topik yang kamu masukkan'}
      </div>

      {/* Customization dialog */}
      {customizeTemplate && (
        <TemplateCustomizeDialog
          template={customizeTemplate}
          onApply={handleCustomApply}
          onClose={() => setCustomizeTemplate(null)}
          isLoading={loadingTemplateId === customizeTemplate.id}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE CARD — Individual template display
// ═══════════════════════════════════════════════════════════════════

function TemplateCard({
  template,
  isLoading,
  isAnyLoading,
  hasExistingPages,
  onQuickApply,
  onCustomize,
}: {
  template: LessonTemplate;
  isLoading: boolean;
  isAnyLoading: boolean;
  hasExistingPages: boolean;
  onQuickApply: (t: LessonTemplate) => void;
  onCustomize: () => void;
}) {
  const colors = COLOR_MAP[template.color] || DEFAULT_COLORS;
  const patternConfig = TEMPLATE_PATTERNS[template.pattern];
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-xl border ${colors!.border} ${colors!.bg} overflow-hidden transition-[background-color,border-color]! ${colors!.hoverBg}`}
    >
      {/* Card header with icon and title */}
      <div className="p-3">
        <div className="flex items-start gap-2.5">
          {/* Icon */}
          <div className="text-2xl flex-shrink-0 leading-none mt-0.5" aria-hidden="true">
            {template.icon}
          </div>

          {/* Title and subtitle */}
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-app-primary truncate">
              {template.title}
            </div>
            <div className={`text-[9px]! ${colors!.text} font-semibold truncate`}>
              {template.subtitle}
            </div>
          </div>

          {/* Page count */}
          <div className="flex-shrink-0 text-[8px] text-app-muted flex items-center gap-0.5 mt-0.5">
            <span className="material-symbols-outlined" style={{ fontSize: '8px' }}>description</span>
            {template.estimatedPages} hal.
          </div>
        </div>

        {/* Description */}
        <div className="text-[9px] text-app-muted mt-2 leading-relaxed line-clamp-2">
          {template.description}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1 mt-2">
          {/* Pattern badge */}
          <span className={`text-[7px] px-1.5 py-0 rounded border font-bold ${colors!.badge}`}>
            {patternConfig.icon} {patternConfig.label}
          </span>
          <span className={`text-[7px] px-1.5 py-0 rounded border font-bold ${colors!.badge}`}>
            {template.mapel}
          </span>
          <span className="text-[7px] px-1.5 py-0 rounded bg-app-elevated/40 text-app-muted border border-app-border/30 font-bold">
            Kelas {template.kelas}
          </span>
          <span className="text-[7px] px-1.5 py-0 rounded bg-app-elevated/40 text-app-muted border border-app-border/30 font-bold">
            Sem. {template.semester}
          </span>
        </div>

        {/* Page preview (expandable) */}
        <div className="mt-2 pt-2 border-t border-app-border/15">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between text-[8px] text-app-muted hover:text-app-secondary transition-colors"
          >
            <span>Alur halaman ({template.pagePreview.length})</span>
            <span className="text-[9px]">{expanded ? '▲' : '▼'}</span>
          </button>

          {expanded ? (
            <div className="mt-1.5 space-y-0.5">
              {template.pagePreview.map((p, i) => {
                const icon = PAGE_TYPE_ICONS[p.type] || '📄';
                return (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 text-[8px] px-1.5 py-1 rounded-md bg-app-elevated/20"
                  >
                    <span className="text-[10px]">{icon}</span>
                    <span className="text-app-primary font-semibold truncate">{p.title}</span>
                    <span className="text-app-muted truncate flex-1">— {p.description}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-0.5 mt-1.5">
              {template.pagePreview.slice(0, 5).map((p, i) => (
                <span
                  key={i}
                  className="text-[7px] px-1 py-0 rounded bg-app-elevated/30 text-app-muted"
                >
                  {p.title}
                </span>
              ))}
              {template.pagePreview.length > 5 && (
                <span className="text-[7px] px-1 py-0 rounded bg-app-elevated/30 text-app-muted">
                  +{template.pagePreview.length - 5}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-1.5 mt-2.5">
          {/* Quick apply */}
          <button
            onClick={() => onQuickApply(template)}
            disabled={isAnyLoading}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold transition-[transform,box-shadow,background-color] active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${
              isLoading
                ? `${colors!.bg} ${colors!.text} border ${colors!.border}`
                : hasExistingPages
                  ? 'bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-300'
                  : 'bg-app-accent/10 border border-app-accent/20 hover:bg-app-accent/20 text-app-accent'
            }`}
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: '10px' }}>progress_activity</span>
                Menerapkan...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>auto_awesome</span>
                {hasExistingPages ? 'Tambahkan' : 'Gunakan'}
              </>
            )}
          </button>

          {/* Customize */}
          <button
            onClick={onCustomize}
            disabled={isAnyLoading}
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-bold border border-app-border/30 bg-app-elevated/40 text-app-secondary hover:text-app-accent hover:border-app-accent/30 transition-[transform,box-shadow,background-color] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>settings</span>
            Sesuaikan
          </button>
        </div>
      </div>
    </div>
  );
}
