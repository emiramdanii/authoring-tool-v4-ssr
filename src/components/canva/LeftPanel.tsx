'use client';

import { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Copy,
  Trash2,
  Zap,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  FilePlus2,
  Sparkles,
} from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { teacherTerm } from '@/core/i18n/teacher-terminology';
import type { PageTemplateType } from './types';
import { RATIOS } from './types';
import { getPresetsGroupedByCategory, type PagePreset } from '@/core/preset/PagePresetRegistry';
import {
  TEMPLATE_BADGE_MAP,
  getModuleIcon,
  getGameIcon,
} from '@/lib/canva-icon-maps';
import { GAME_TYPES } from '@/lib/canva-constants';
import { COLORS } from '@/lib/color-palette';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import AddBlockPanel from './left-panel/AddBlockPanel';
// Lazy-loaded: TemplateGalleryPanel is heavy (template browsing, filtering, AI generator)
const TemplateGalleryPanel = dynamic(() => import('./left-panel/TemplateGalleryPanel'), {
  ssr: false,
  loading: () => <div className="h-32 animate-pulse bg-app-elevated/20 rounded-lg" />,
});
import { getAvailablePresets } from '@/core/engine/SchemaEngine';
import { ensurePageSchema } from '@/core/schema/ensure-schema';
import { getBlockDefinition } from '@/core/registry/SceneRegistry';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Lazy-loaded: PageTypeCreator and TemplateWizard are modals not always visible
const PageTypeCreator = dynamic(() => import('./PageTypeCreator'), {
  ssr: false,
  loading: () => <div className="h-8 animate-pulse bg-app-elevated/20 rounded-lg" />,
});
const TemplateWizard = dynamic(() => import('./TemplateWizard'), {
  ssr: false,
  loading: () => null,
});

// ═══════════════════════════════════════════════════════════════
// SCENE PANEL — Canva-style left panel (240px fixed)
// ═══════════════════════════════════════════════════════════════
// Structure (no tab bar):
//   1. Scene list (page thumbnails + drag reorder)
//   2. Add scene button (+ Scene) with template dropdown
//   3. Collapsible "Tambah Block" section (AddBlockPanel inline)
//   4. Ratio selector
//
// Layer panel and History panel are accessible via Command Palette (Ctrl+K)
// or toolbar buttons.
// ═══════════════════════════════════════════════════════════════

export default function LeftPanel() {
  const [addBlockOpen, setAddBlockOpen] = useState(true);
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false);
  const [presetDropdownOpen, setPresetDropdownOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <div className="w-full flex flex-col bg-app-surface overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-app-border bg-app-surface/50">
        <div className="text-[10px] font-bold text-app-secondary uppercase tracking-wider">
          Halaman
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar page-transition">
        <div className="p-3 space-y-3">
          {/* Scene list */}
          <SceneList />

          {/* Add scene button + template dropdown */}
          <AddSceneButton onOpenWizard={() => setWizardOpen(true)} />

          {/* Collapsible: Template Gallery */}
          <TemplateGallerySection galleryOpen={templateGalleryOpen} onToggle={() => setTemplateGalleryOpen(!templateGalleryOpen)} />

          {/* Collapsible: Tambah Block / Konten */}
          <TambahBlockSection addBlockOpen={addBlockOpen} onToggle={() => setAddBlockOpen(!addBlockOpen)} />

          <div className="section-divider" />

          {/* Rasio */}
          <RatioSelector />
        </div>
      </div>

      {/* Template Wizard Modal */}
      <TemplateWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SCENE LIST — Page navigator with thumbnails + drag reorder
   ══════════════════════════════════════════════════════════════════ */

function SceneList() {
  const pages = useCanvaStore(s => s.pages);
  const currentPageIndex = useCanvaStore(s => s.currentPageIndex);
  const goPage = useCanvaStore(s => s.goPage);
  const duplicatePage = useCanvaStore(s => s.duplicatePage);
  const deletePage = useCanvaStore(s => s.deletePage);
  const reorderPage = useCanvaStore(s => s.reorderPage);
  const ratio = useCanvaStore(s => s.currentRatio());
  const teacherMode = useAuthoringStore(s => s.teacherMode);
  const isSederhana = teacherMode === 'sederhana';
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  return (
    <div className="space-y-1.5">
      {pages.map((p, i) => {
        const isActive = i === currentPageIndex;
        const badge = TEMPLATE_BADGE_MAP[p.templateType || 'custom'] || TEMPLATE_BADGE_MAP.custom;
        const bgStyle = p.bgDataUrl
          ? { backgroundImage: `url('${p.bgDataUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : p.bgColor?.includes('gradient')
            ? { background: p.bgColor }
            : { background: p.bgColor || COLORS.bgDark };

        const isTemplate = p.templateType && p.templateType !== 'custom';
        const isSchemaDriven = !!p.schema;

        // Determine page type badge color
        const badgeColorMap: Record<string, string> = {
          cover: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          petunjuk: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
          dokumen: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
          hero: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
          materi: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
          skenario: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
          kuis: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
          game: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
          diskusi: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          hasil: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          refleksi: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
          penutup: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
          tujuan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
          custom: 'bg-app-elevated/50 text-app-muted border-app-border/30',
        };
        const badgeColor = badgeColorMap[p.templateType || 'custom'] || badgeColorMap.custom;

        return (
          <button
            key={p.id}
            onClick={() => goPage(i)}
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverIdx(i);
            }}
            onDragLeave={() => setDragOverIdx(null)}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIdx !== null && dragIdx !== i) {
                reorderPage(dragIdx, i);
              }
              setDragIdx(null);
              setDragOverIdx(null);
            }}
            onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
            className={`w-full text-left card-hover relative rounded-xl overflow-hidden transition-all ${
              dragIdx === i
                ? 'opacity-40 scale-95'
                : dragOverIdx === i
                  ? 'ring-2 ring-app-accent/60 ring-offset-1 ring-offset-app-surface translate-y-0.5'
                  : isActive
                    ? 'ring-2 ring-app-accent ring-offset-2 ring-offset-app-surface'
                    : 'hover:ring-1 hover:ring-app-border-strong'
            }`}
          >
            <div className="flex items-center gap-2 p-2">
              {/* Page number */}
              <div className="w-5 text-[9px] font-bold text-app-muted text-center flex-shrink-0">
                {i + 1}
              </div>
              {/* Mini thumbnail */}
              <div
                className="w-12 h-8 rounded-lg flex-shrink-0 overflow-hidden relative"
                style={{ ...bgStyle, aspectRatio: `${ratio.w}/${ratio.h}` }}
              >
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute top-0 right-0 text-[6px] p-0.5">{badge.icon}</div>
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-app-primary truncate flex items-center gap-1">
                  {isSchemaDriven && <Zap size={10} className="text-emerald-400 inline" />}
                  <span className="truncate">{p.label}</span>
                </div>
                <div className="text-[8px] mt-0.5">
                  {/* Page type badge */}
                  <span className={`inline-flex items-center px-1.5 py-0 rounded text-[7px] font-bold uppercase tracking-wider border ${badgeColor}`}>
                    {badge.name}
                  </span>
                </div>
              </div>
            </div>
          </button>
        );
      })}

      {/* Action buttons for current page */}
      {pages.length > 0 && (
        <div className="flex gap-1 pt-1">
          <Button
            variant="ghost"
            onClick={duplicatePage}
            className="flex-1 py-1.5 rounded-lg text-[10px] gap-1"
          >
            <Copy size={10} />
            Duplikat
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (pages.length <= 1) return;
              if (confirm(`Hapus "${pages[currentPageIndex].label}"?`)) deletePage();
            }}
            className="flex-1 py-1.5 rounded-lg text-[10px] gap-1 text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
          >
            <Trash2 size={10} />
            Hapus
          </Button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ADD SCENE BUTTON — + Scene with template dropdown
   ══════════════════════════════════════════════════════════════════ */

function AddSceneButton({ onOpenWizard }: { onOpenWizard: () => void }) {
  const addPage = useCanvaStore(s => s.addPage);
  const addTemplatePage = useCanvaStore(s => s.addTemplatePage);
  const loadSchemaPreset = useCanvaStore(s => s.loadSchemaPreset);
  const resetCanvas = useCanvaStore(s => s.resetCanvas);

  // Preset info
  const availablePresets = getAvailablePresets();
  const presetInfo: Record<string, { label: string; icon: string; desc: string }> = {
    'hakikat-norma': { label: 'Hakikat Norma', icon: '📜', desc: 'Pertemuan 1 — PPKn Kelas VII' },
    'macam-norma': { label: 'Macam-Macam Norma', icon: '⚖️', desc: 'Pertemuan 2 — PPKn Kelas VII' },
    'perilaku-patuh': { label: 'Perilaku Patuh Norma', icon: '🛡️', desc: 'Pertemuan 3 — PPKn Kelas VII' },
  };
  const [loadingPreset, setLoadingPreset] = useState<string | null>(null);

  // Metadata-driven categories from PresetRegistry
  const presetCategories = getPresetsGroupedByCategory();
  const categoryLabels: Record<string, string> = {
    utama: 'Halaman Utama',
    konten: 'Konten',
    interaktif: 'Interaktif',
    penutup: 'Penutup',
  };

  return (
    <div className="space-y-1.5">
      {/* Blank page button */}
      <button
        onClick={() => { useCanvaStore.getState().addPage(); }}
        className="w-full py-2 rounded-xl border border-dashed border-app-border hover:border-app-accent/30 text-[11px] text-app-secondary hover:text-app-accent transition-colors flex items-center justify-center gap-1"
      >
        <Plus size={12} />
        Halaman Kosong
      </button>

      {/* Template dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full py-1.5 rounded-xl text-[10px] gap-1 h-8"
          >
            <FilePlus2 size={12} />
            + Dari Template
            <ChevronDown size={8} className="ml-auto" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-60 border border-app-border shadow-xl rounded-xl p-0 overflow-hidden max-h-80 overflow-y-auto"
        >
          {/* Schema Presets */}
          {availablePresets.length > 0 && (
            <>
              <DropdownMenuLabel className="px-3 py-1.5 bg-sky-500/10 border-b border-sky-500/20 text-[9px] font-bold text-sky-400 uppercase tracking-wider">
                Preset Schema
              </DropdownMenuLabel>
              {availablePresets.map(presetId => {
                const info = presetInfo[presetId] || { label: presetId, icon: '📦', desc: 'Preset' };
                return (
                  <DropdownMenuItem
                    key={presetId}
                    onClick={async () => {
                      setLoadingPreset(presetId);
                      await loadSchemaPreset(presetId);
                      setLoadingPreset(null);
                    }}
                    disabled={loadingPreset === presetId}
                    className="px-3 py-2 gap-2 cursor-pointer"
                  >
                    <span className="text-base">{info.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-sky-300 truncate">{info.label}</div>
                      <div className="text-[8px] text-app-muted">{info.desc}</div>
                    </div>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator className="bg-app-border/30" />
            </>
          )}

          {/* Template types by category */}
          {presetCategories.map(cat => (
            <div key={cat.category}>
              <DropdownMenuLabel className="px-3 py-1 text-[8px] font-bold text-app-muted uppercase tracking-wider">
                {categoryLabels[cat.category] || cat.category}
              </DropdownMenuLabel>
              {cat.presets.map(p => (
                <DropdownMenuItem
                  key={p.id}
                  onClick={() => addTemplatePage(p.id as PageTemplateType)}
                  className="px-3 py-2 gap-2 cursor-pointer"
                >
                  <span className="text-base">{p.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-app-primary truncate">{p.label}</div>
                    <div className="text-[8px] text-app-muted">{p.description}</div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Template Wizard button — opens the guided composition wizard */}
      <button
        onClick={onOpenWizard}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-emerald-600/10 border border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-600/20 text-emerald-400 text-[10px] font-bold transition-all active:scale-95"
      >
        <Sparkles size={10} className="inline" />
        Buat dari Template Wizard
      </button>

      {/* Auto-Generate via Page Type Creator (collapsed) */}
      <PageTypeCreator />

      {/* Reset Canvas */}
      <button
        onClick={() => {
          if (confirm('Reset canvas? Semua halaman akan dibuat ulang dari data authoring. Perubahan manual akan hilang.')) {
            resetCanvas();
          }
        }}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-app-elevated border border-app-border-subtle hover:border-red-500/30 text-app-secondary hover:text-red-400 text-[10px] font-bold transition-all active:scale-95"
      >
        <RefreshCw size={10} className="inline" />
        Reset Canvas
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   RATIO SELECTOR — Compact ratio picker
   ══════════════════════════════════════════════════════════════════ */

function RatioSelector() {
  const ratioId = useCanvaStore(s => s.ratioId);
  const setRatio = useCanvaStore(s => s.setRatio);

  return (
    <div>
      <div className="text-[9px] font-bold text-app-secondary uppercase tracking-wider mb-2">📐 Rasio: {ratioId}</div>
      <div className="flex flex-wrap gap-1.5">
        {RATIOS.map(r => {
          const isActive = ratioId === r.id;
          return (
            <button
              key={r.id}
              onClick={() => setRatio(r.id)}
              className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-all ${
                isActive
                  ? 'bg-app-accent/10 border border-app-accent/30 text-app-accent'
                  : 'bg-app-elevated border border-app-border-subtle text-app-secondary hover:border-app-border-strong'
              }`}
            >
              {r.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   TAMBAH BLOCK SECTION — Collapsible add-block panel header
   ══════════════════════════════════════════════════════════════════ */

function TambahBlockSection({ addBlockOpen, onToggle }: {
  addBlockOpen: boolean;
  onToggle: () => void;
}) {
  const teacherMode = useAuthoringStore(s => s.teacherMode);
  const isSederhana = teacherMode === 'sederhana';
  const sectionLabel = isSederhana ? 'Tambah Konten' : 'Tambah Block';

  return (
    <div className="border border-app-border/30 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold text-teal-400 uppercase tracking-wider bg-teal-500/5 hover:bg-teal-500/10 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Plus size={10} />
          {sectionLabel}
        </span>
        {addBlockOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {addBlockOpen && (
        <div className="p-2 border-t border-app-border/20">
          <AddBlockPanel />
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   TEMPLATE GALLERY SECTION — Collapsible template browser
   ══════════════════════════════════════════════════════════════════ */

function TemplateGallerySection({ galleryOpen, onToggle }: {
  galleryOpen: boolean;
  onToggle: () => void;
}) {
  const teacherMode = useAuthoringStore(s => s.teacherMode);
  const isSederhana = teacherMode === 'sederhana';
  const sectionLabel = isSederhana ? 'Pilih Template' : 'Template Gallery';

  return (
    <div className="border border-app-border/30 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/5 hover:bg-amber-500/10 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Sparkles size={10} />
          {sectionLabel}
        </span>
        {galleryOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {galleryOpen && (
        <div className="p-2 border-t border-app-border/20">
          <TemplateGalleryPanel />
        </div>
      )}
    </div>
  );
}
