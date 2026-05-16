'use client';

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE MARKETPLACE — Browse, preview, and apply pre-built templates
// ═══════════════════════════════════════════════════════════════════
// Full-screen overlay marketplace for Indonesian SMP teachers to
// browse, preview, and apply pre-built MPI templates with one click.
// Uses design tokens, shadcn/ui, CSS animations, and real Indonesian content.
//
// v2: Visual thumbnail previews + improved preview modal with
//     wireframe visual + block list combined view.

import { useState, useCallback, useEffect, useMemo } from 'react';
import { ShowTransition } from '@/lib/transition';
import { X, Search, ChevronLeft, ChevronRight, CheckCircle2, Layers, BookOpen, Eye, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCanvaStore } from '@/store/canva-store';
import {
  MARKETPLACE_TEMPLATES,
  getSubjectList,
  getBlockIcon,
  type MarketplaceTemplate,
  type MapelCategory,
  type PreviewScreenInfo,
} from '@/core/templates/marketplace-templates';
import { resolveTokens } from '@/core/themes/tokens';
import TemplatePreviewThumbnail from '@/components/shared/TemplatePreviewThumbnail';

// ── Grade filter options ──────────────────────────────────────

const GRADE_OPTIONS: Array<{ value: 7 | 8 | 9; label: string }> = [
  { value: 7, label: 'Kelas 7' },
  { value: 8, label: 'Kelas 8' },
  { value: 9, label: 'Kelas 9' },
];

// ── Subject color map ────────────────────────────────────────

const SUBJECT_COLORS: Record<string, string> = {
  'Matematika': 'from-amber-500 to-orange-500',
  'IPA': 'from-emerald-500 to-teal-500',
  'IPS': 'from-red-500 to-rose-500',
  'Bahasa Indonesia': 'from-violet-500 to-purple-500',
  'PPKn': 'from-yellow-500 to-amber-500',
  'Seni Budaya': 'from-pink-500 to-fuchsia-500',
  'PJOK': 'from-green-500 to-lime-500',
  'Informatika': 'from-cyan-500 to-sky-500',
};

const SUBJECT_BADGE_COLORS: Record<string, string> = {
  'Matematika': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'IPA': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'IPS': 'bg-red-500/20 text-red-300 border-red-500/30',
  'Bahasa Indonesia': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'PPKn': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'Seni Budaya': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'PJOK': 'bg-green-500/20 text-green-300 border-green-500/30',
  'Informatika': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
};

// ── Gradient renderer from token keys ────────────────────────

function resolveGradient(colors: [string, string]): string {
  const tokens = resolveTokens('default');
  const colorMap: Record<string, string> = {
    'y': tokens.colors.y,
    'c': tokens.colors.c,
    'r': tokens.colors.r,
    'p': tokens.colors.p,
    'g': tokens.colors.g,
    'o': tokens.colors.o,
  };
  const c1 = colorMap[colors[0]] || colors[0];
  const c2 = colorMap[colors[1]] || colors[1];
  return `linear-gradient(135deg, ${c1}, ${c2})`;
}


// ═══════════════════════════════════════════════════════════════════
// PREVIEW MODE — Screen-by-screen walkthrough with visual preview
// ═══════════════════════════════════════════════════════════════════

function TemplatePreview({
  template,
  onClose,
  onApply,
}: {
  template: MarketplaceTemplate;
  onClose: () => void;
  onApply: (t: MarketplaceTemplate) => void;
}) {
  const [screenIdx, setScreenIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'visual' | 'list'>('visual');
  const screens = template.previewBlocks;
  const currentScreen = screens[screenIdx];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm anim-enter-fade"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl mx-4 rounded-2xl border border-app-border glass-panel-strong overflow-hidden anim-enter-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-app-border">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ background: resolveGradient(template.coverGradient) }}
          >
            {template.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-app-primary font-bold text-lg truncate">{template.name}</h3>
            <p className="text-app-muted text-xs">{template.subject} • Kelas {template.grade}</p>
          </div>
          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-app-surface/50 rounded-lg p-0.5 border border-app-border/50">
            <button
              onClick={() => setViewMode('visual')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                viewMode === 'visual'
                  ? 'bg-app-accent/20 text-app-accent'
                  : 'text-app-muted hover:text-app-secondary'
              }`}
            >
              <Eye size={11} />
              Visual
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                viewMode === 'list'
                  ? 'bg-app-accent/20 text-app-accent'
                  : 'text-app-muted hover:text-app-secondary'
              }`}
            >
              <List size={11} />
              Daftar
            </button>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-app-muted hover:text-app-primary shrink-0">
            <X size={16} />
          </Button>
        </div>

        {/* Preview content */}
        <div className="p-6 min-h-[280px]">
          {/* Screen indicator */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-app-accent" />
              <span className="text-app-accent text-xs font-semibold">
                Layar {screenIdx + 1} / {screens.length}
              </span>
            </div>
            <span className="text-app-muted text-xs">
              {currentScreen?.label || ''}
            </span>
          </div>

          <div
            key={`screen-${template.id}-${screenIdx}-${viewMode}`}
            className="anim-enter-slide-left"
          >
              {viewMode === 'visual' ? (
                /* ── Visual preview mode ── */
                <div className="flex gap-4">
                  {/* Large thumbnail */}
                  <div className="flex-1">
                    <TemplatePreviewThumbnail
                      template={template}
                      width={320}
                      height={180}
                      activeScreen={screenIdx}
                      showName={true}
                      showDots={true}
                    />
                  </div>
                  {/* Block list sidebar */}
                  <div className="w-52 space-y-1.5">
                    <div className="text-[9px] font-bold text-app-muted uppercase tracking-wider mb-1">
                      Block di layar ini
                    </div>
                    {currentScreen?.blocks.map((block, bIdx) => (
                      <div
                        key={`block-${template.id}-${screenIdx}-${bIdx}`}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-app-surface/50 border border-app-border/50"
                      >
                        <span className="text-sm">{block.icon}</span>
                        <span className="text-app-primary text-xs font-medium">{block.label}</span>
                        <span className="text-app-muted text-[9px] ml-auto font-mono">{block.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* ── List-only mode ── */
                <div className="space-y-2">
                  {currentScreen?.blocks.map((block, bIdx) => (
                    <div
                      key={`block-${template.id}-${screenIdx}-${bIdx}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-app-surface/50 border border-app-border/50"
                    >
                      <span className="text-lg">{block.icon}</span>
                      <div className="flex-1">
                        <span className="text-app-primary text-sm font-medium">{block.label}</span>
                      </div>
                      <span className="text-app-muted text-[10px] font-mono">{block.type}</span>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* Screen dots */}
          <div className="flex items-center justify-center gap-1.5 mt-6">
            {screens.map((_, idx) => (
              <button
                key={`dot-${template.id}-${idx}`}
                onClick={() => setScreenIdx(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === screenIdx
                    ? 'bg-app-accent w-6'
                    : 'bg-app-muted/30 hover:bg-app-muted/50'
                }`}
                aria-label={`Layar ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer with navigation */}
        <div className="flex items-center justify-between p-4 border-t border-app-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setScreenIdx(Math.max(0, screenIdx - 1))}
            disabled={screenIdx === 0}
            className="text-app-secondary"
          >
            <ChevronLeft size={14} />
            <span className="text-xs">Sebelumnya</span>
          </Button>

          <Button
            onClick={() => onApply(template)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            <CheckCircle2 size={14} />
            Gunakan Template
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setScreenIdx(Math.min(screens.length - 1, screenIdx + 1))}
            disabled={screenIdx === screens.length - 1}
            className="text-app-secondary"
          >
            <span className="text-xs">Selanjutnya</span>
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE CARD — With visual thumbnail
// ═══════════════════════════════════════════════════════════════════

function TemplateCard({
  template,
  index,
  onPreview,
  onApply,
}: {
  template: MarketplaceTemplate;
  index: number;
  onPreview: (t: MarketplaceTemplate) => void;
  onApply: (t: MarketplaceTemplate) => void;
}) {
  // Track which screen to show in thumbnail on hover
  const [thumbScreen, setThumbScreen] = useState(0);

  // Cycle through screens on hover
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const startCycling = () => {
      if (template.previewBlocks.length <= 1) return;
      interval = setInterval(() => {
        setThumbScreen(prev => (prev + 1) % template.previewBlocks.length);
      }, 1500);
    };
    const stopCycling = () => {
      if (interval) clearInterval(interval);
      setThumbScreen(0);
    };

    const card = document.getElementById(`tpl-card-${template.id}`);
    if (card) {
      card.addEventListener('mouseenter', startCycling);
      card.addEventListener('mouseleave', stopCycling);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (card) {
        card.removeEventListener('mouseenter', startCycling);
        card.removeEventListener('mouseleave', stopCycling);
      }
    };
  }, [template]);

  return (
    <div
      id={`tpl-card-${template.id}`}
      className="group relative flex flex-col rounded-xl border border-app-border/60 bg-app-surface/40 overflow-hidden cursor-pointer hover:border-app-accent/40 transition-colors anim-enter-slide-up"
      style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}
      onClick={() => onPreview(template)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onPreview(template); }}
      aria-label={`Preview template ${template.name}`}
    >
      {/* Visual thumbnail — replaces gradient cover */}
      <div className="relative flex items-center justify-center p-3" style={{ background: 'rgba(0,0,0,0.2)' }}>
        <TemplatePreviewThumbnail
          template={template}
          width={220}
          height={124}
          activeScreen={thumbScreen}
          showName={true}
          showDots={true}
        />
        {/* BSNP badge */}
        {template.bsnpCompliant && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[9px] font-bold flex items-center gap-1 shadow-md">
            <CheckCircle2 size={10} />
            BSNP
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-3 flex flex-col gap-2">
        {/* Title */}
        <h4 className="text-app-primary font-bold text-sm leading-tight truncate">
          {template.name}
        </h4>

        {/* Description */}
        <p className="text-app-muted text-[10px] leading-relaxed line-clamp-2">
          {template.description}
        </p>

        {/* Badges row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge
            variant="outline"
            className={`text-[9px] px-1.5 py-0 h-5 border ${SUBJECT_BADGE_COLORS[template.subject] || 'bg-app-surface text-app-secondary border-app-border'}`}
          >
            {template.subject}
          </Badge>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-5 border border-app-border text-app-muted">
            Kelas {template.grade}
          </Badge>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-5 border border-app-border text-app-muted">
            <Layers size={9} className="mr-0.5" />
            {template.screens} layar
          </Badge>
        </div>

        {/* Block type icons */}
        <div className="flex items-center gap-1 flex-wrap">
          {template.blockTypes.slice(0, 5).map((bt) => (
            <span
              key={`bt-${template.id}-${bt}`}
              className="text-xs"
              title={bt}
            >
              {getBlockIcon(bt)}
            </span>
          ))}
          {template.blockTypes.length > 5 && (
            <span className="text-[9px] text-app-muted">+{template.blockTypes.length - 5}</span>
          )}
        </div>

        {/* Apply button */}
        <Button
          size="sm"
          className="mt-auto w-full bg-app-accent/90 hover:bg-app-accent text-app-bg font-semibold text-xs h-7 gap-1"
          onClick={(e) => {
            e.stopPropagation();
            onApply(template);
          }}
        >
          Gunakan Template
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN MARKETPLACE COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function TemplateMarketplace({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const loadCustomSchema = useCanvaStore((s) => s.loadCustomSchema);
  const subjects = useMemo(() => getSubjectList(), []);

  // ── Filter state ──
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<MapelCategory | 'all'>('all');
  const [gradeFilter, setGradeFilter] = useState<7 | 8 | 9 | null>(null);

  // ── Preview state ──
  const [previewTemplate, setPreviewTemplate] = useState<MarketplaceTemplate | null>(null);

  // ── Keyboard: Escape to close ──
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewTemplate) {
          setPreviewTemplate(null);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, previewTemplate, onClose]);

  // ── Filters persist between opens (intentional UX — no reset needed) ──

  // ── Filtered templates ──
  const filteredTemplates = useMemo(() => {
    return MARKETPLACE_TEMPLATES.filter((t) => {
      // Search filter
      if (search) {
        const q = search.toLowerCase();
        const matchSearch =
          t.name.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.blockTypes.some((bt) => bt.toLowerCase().includes(q));
        if (!matchSearch) return false;
      }
      // Subject filter
      if (subjectFilter !== 'all' && t.subject !== subjectFilter) return false;
      // Grade filter
      if (gradeFilter !== null && t.grade !== gradeFilter) return false;
      return true;
    });
  }, [search, subjectFilter, gradeFilter]);

  // ── Apply template ──
  const handleApply = useCallback((template: MarketplaceTemplate) => {
    const schema = template.schemaFactory();
    loadCustomSchema(schema);
    setPreviewTemplate(null);
    onClose();
  }, [loadCustomSchema, onClose]);

  if (!open) return null;

  return (
    <>
      {/* ── Main overlay ── */}
      <ShowTransition show={open} enterClass="anim-enter-fade" exitClass="anim-exit-fade" duration={0.25}>
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <div
            className="relative w-full max-w-5xl mx-4 mt-6 mb-6 rounded-2xl border border-app-border glass-panel-strong overflow-hidden flex flex-col anim-enter-scale"
            style={{ maxHeight: 'calc(100vh - 48px)', animationDuration: '0.3s' }}
            onClick={(e) => e.stopPropagation()}
          >
              {/* ── Header ── */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-app-border shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏪</span>
                  <div>
                    <h2 className="text-app-primary font-bold text-base">Template Marketplace</h2>
                    <p className="text-app-muted text-[10px]">Pilih template siap pakai untuk mulai membuat MPI</p>
                  </div>
                </div>
                <div className="flex-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-app-muted hover:text-app-primary shrink-0"
                  title="Tutup (Esc)"
                >
                  <X size={16} />
                </Button>
              </div>

              {/* ── Search + Filters ── */}
              <div className="px-5 py-3 border-b border-app-border/50 space-y-3 shrink-0">
                {/* Search bar */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari template, mata pelajaran, atau tipe blok..."
                    className="pl-9 h-8 text-sm bg-app-surface/50 border-app-border text-app-primary placeholder:text-app-muted/50"
                  />
                </div>

                {/* Subject chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  <button
                    onClick={() => setSubjectFilter('all')}
                    className={`px-3 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-colors shrink-0 ${
                      subjectFilter === 'all'
                        ? 'bg-app-accent text-app-bg'
                        : 'bg-app-surface/60 text-app-muted hover:bg-app-surface border border-app-border/50'
                    }`}
                  >
                    Semua
                  </button>
                  {subjects.map((subj) => (
                    <button
                      key={`subj-${subj}`}
                      onClick={() => setSubjectFilter(subj)}
                      className={`px-3 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-colors shrink-0 ${
                        subjectFilter === subj
                          ? 'bg-app-accent text-app-bg'
                          : 'bg-app-surface/60 text-app-muted hover:bg-app-surface border border-app-border/50'
                      }`}
                    >
                      {subj}
                    </button>
                  ))}
                </div>

                {/* Grade chips */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-app-muted mr-1">Kelas:</span>
                  <button
                    onClick={() => setGradeFilter(null)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                      gradeFilter === null
                        ? 'bg-app-accent text-app-bg'
                        : 'bg-app-surface/60 text-app-muted hover:bg-app-surface border border-app-border/50'
                    }`}
                  >
                    Semua
                  </button>
                  {GRADE_OPTIONS.map((g) => (
                    <button
                      key={`grade-${g.value}`}
                      onClick={() => setGradeFilter(g.value === gradeFilter ? null : g.value)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                        gradeFilter === g.value
                          ? 'bg-app-accent text-app-bg'
                          : 'bg-app-surface/60 text-app-muted hover:bg-app-surface border border-app-border/50'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Template grid ── */}
              <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
                {filteredTemplates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <span className="text-4xl mb-3">🔍</span>
                    <p className="text-app-muted text-sm">Template tidak ditemukan</p>
                    <p className="text-app-muted/60 text-xs mt-1">Coba ubah filter atau kata kunci pencarian</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map((template, idx) => (
                      <TemplateCard
                        key={`tpl-${template.id}`}
                        template={template}
                        index={idx}
                        onPreview={setPreviewTemplate}
                        onApply={handleApply}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* ── Footer info ── */}
              <div className="px-5 py-2.5 border-t border-app-border/50 flex items-center justify-between shrink-0">
                <span className="text-[10px] text-app-muted">
                  {filteredTemplates.length} template tersedia • Semua template memenuhi standar BSNP
                </span>
                <span className="text-[10px] text-app-muted/50 flex items-center gap-1">
                  <BookOpen size={10} />
                  SMP Kurikulum Merdeka
                </span>
              </div>
          </div>
        </div>
      </ShowTransition>

      {/* ── Preview overlay ── */}
      <ShowTransition show={!!previewTemplate} enterClass="anim-enter-fade" exitClass="anim-exit-fade" duration={0.2}>
        <TemplatePreview
          template={previewTemplate!}
          onClose={() => setPreviewTemplate(null)}
          onApply={handleApply}
        />
      </ShowTransition>
    </>
  );
}
