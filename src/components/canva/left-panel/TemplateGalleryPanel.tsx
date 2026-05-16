'use client';

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE GALLERY PANEL — Pre-built lesson template browser
// ═══════════════════════════════════════════════════════════════════
// Shows a grid of template cards for common SMP subjects.
// Teachers can filter by mapel, search by title/tags, and
// apply a template to instantly generate a complete lesson.
//
// TEACHER MODE: In 'sederhana' mode, uses simpler terminology
// ("Pilih Template" instead of "Template Gallery").
// ═══════════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from 'react';
import { Search, BookOpen, Loader2, FileText, Sparkles } from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { toast } from 'sonner';
import {
  getAllLessonTemplates,
  getTemplateMapelList,
  instantiateTemplate,
  type LessonTemplate,
} from '@/core/template/template-gallery';
import { teacherTerm } from '@/core/i18n/teacher-terminology';

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
};

const DEFAULT_COLORS = COLOR_MAP.amber;

// ── Mapel display config ────────────────────────────────────
const MAPEL_CONFIG: Record<string, { label: string; icon: string }> = {
  'PPKn': { label: 'PPKn', icon: '⚖️' },
  'IPA': { label: 'IPA', icon: '🔬' },
  'MTK': { label: 'MTK', icon: '📐' },
  'B.Indonesia': { label: 'B. Indonesia', icon: '📖' },
  'IPS': { label: 'IPS', icon: '🏛️' },
  'Seni': { label: 'Seni', icon: '🎨' },
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function TemplateGalleryPanel() {
  const teacherMode = useAuthoringStore(s => s.teacherMode);
  const isSederhana = teacherMode === 'sederhana';
  const loadCustomSchema = useCanvaStore(s => s.loadCustomSchema);
  const _pushHistory = useCanvaStore(s => s._pushHistory);

  const [search, setSearch] = useState('');
  const [activeMapel, setActiveMapel] = useState<string | null>(null);
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);

  // All templates
  const allTemplates = useMemo(() => getAllLessonTemplates(), []);

  // Unique mapel list
  const mapelList = useMemo(() => getTemplateMapelList(), []);

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    let result = allTemplates;

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
  }, [allTemplates, activeMapel, search]);

  // ── Apply template handler ──────────────────────────────
  const handleApplyTemplate = useCallback(async (template: LessonTemplate) => {
    setLoadingTemplateId(template.id);

    try {
      // Small delay for UI feedback
      await new Promise(resolve => setTimeout(resolve, 150));

      const pages = instantiateTemplate(template);

      // Apply to store — same pattern as loadCustomSchema
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

      toast.success(`Template "${template.title}" diterapkan — ${pages.length} halaman`);
    } catch (err) {
      console.error('TemplateGallery: Failed to apply template', err);
      toast.error(`Gagal menerapkan template "${template.title}"`);
    } finally {
      setLoadingTemplateId(null);
    }
  }, [_pushHistory]);

  // Panel title based on teacher mode
  const panelTitle = isSederhana ? 'Pilih Template' : 'Template Gallery';
  const searchPlaceholder = isSederhana ? 'Cari template...' : 'Cari template...';

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="text-[9px] font-bold text-app-secondary uppercase tracking-wider flex items-center gap-1.5">
        <Sparkles size={10} />
        {panelTitle}
        <span className="text-app-muted">({filteredTemplates.length})</span>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-app-muted" aria-hidden="true" />
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

      {/* Mapel filter chips */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setActiveMapel(null)}
          className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-all ${
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
              className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-all flex items-center gap-1 ${
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
      <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto custom-scrollbar">
        {filteredTemplates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            isLoading={loadingTemplateId === template.id}
            isAnyLoading={loadingTemplateId !== null}
            onApply={handleApplyTemplate}
          />
        ))}

        {/* Empty state */}
        {filteredTemplates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
            <div className="text-2xl mb-2 opacity-40">
              <BookOpen size={24} />
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

      {/* Footer hint */}
      <div className="text-[8px] text-app-muted mt-2 pt-2 border-t border-app-border/20">
        Klik &quot;Gunakan&quot; untuk menerapkan template ke canvas
      </div>
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
  onApply,
}: {
  template: LessonTemplate;
  isLoading: boolean;
  isAnyLoading: boolean;
  onApply: (t: LessonTemplate) => void;
}) {
  const colors = COLOR_MAP[template.color] || DEFAULT_COLORS;

  return (
    <div
      className={`rounded-xl border ${colors.border} ${colors.bg} overflow-hidden transition-all ${colors.hoverBg}`}
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
            <div className={`text-[9px] ${colors.text} font-semibold truncate`}>
              {template.subtitle}
            </div>
          </div>

          {/* Page count */}
          <div className="flex-shrink-0 text-[8px] text-app-muted flex items-center gap-0.5 mt-0.5">
            <FileText size={8} />
            {template.estimatedPages} hal.
          </div>
        </div>

        {/* Description */}
        <div className="text-[9px] text-app-muted mt-2 leading-relaxed line-clamp-2">
          {template.description}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1 mt-2">
          <span className={`text-[7px] px-1.5 py-0 rounded border font-bold ${colors.badge}`}>
            {template.mapel}
          </span>
          <span className="text-[7px] px-1.5 py-0 rounded bg-app-elevated/40 text-app-muted border border-app-border/30 font-bold">
            Kelas {template.kelas}
          </span>
          <span className="text-[7px] px-1.5 py-0 rounded bg-app-elevated/40 text-app-muted border border-app-border/30 font-bold">
            Sem. {template.semester}
          </span>
        </div>

        {/* Page preview (collapsed) */}
        <div className="mt-2 pt-2 border-t border-app-border/15">
          <div className="flex flex-wrap gap-0.5">
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
        </div>

        {/* Apply button */}
        <button
          onClick={() => onApply(template)}
          disabled={isAnyLoading}
          className={`mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${
            isLoading
              ? `${colors.bg} ${colors.text} border ${colors.border}`
              : `bg-app-accent/10 border border-app-accent/20 hover:bg-app-accent/20 text-app-accent`
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 size={10} className="animate-spin" />
              Menerapkan...
            </>
          ) : (
            <>
              <Sparkles size={10} />
              Gunakan
            </>
          )}
        </button>
      </div>
    </div>
  );
}
