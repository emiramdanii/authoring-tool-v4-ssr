'use client';

import { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Copy,
  Trash2,
  PanelRightOpen,
  PanelRightClose,
  Layers,
  Zap,
  Puzzle,
  Gamepad2,
  HelpCircle,
  Type,
  Square,
  Image as ImageIcon,
  RefreshCw,
  ArrowDownToLine,
  FilePlus2,
  History,
} from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import type { LeftTab, PageTemplateType } from './types';
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
import LayerPanel from './left-panel/LayerPanel';
import AddBlockPanel from './left-panel/AddBlockPanel';
import HistoryPanel from './left-panel/HistoryPanel';
import { getAvailablePresets } from '@/core/engine/SchemaEngine';
import { ensurePageSchema } from '@/core/schema/ensure-schema';
import { getBlockDefinition } from '@/core/registry/SceneRegistry';

// Lazy-loaded: PageTypeCreator is a modal/overlay not always visible
const PageTypeCreator = dynamic(() => import('./PageTypeCreator'), { ssr: false });

// ═══════════════════════════════════════════════════════════════
// Left Panel — 4 tabs: Halaman + Layer + Sisipkan + Halaman Baru
// ═══════════════════════════════════════════════════════════════

const TABS: { id: LeftTab; label: string; icon: React.ReactNode; accent?: string }[] = [
  { id: 'halaman', label: 'Halaman', icon: <FileText size={16} /> },
  { id: 'layer', label: 'Layer', icon: <Layers size={16} /> },
  { id: 'sisipkan', label: 'Sisipkan', icon: <Plus size={16} />, accent: 'teal' },
  { id: 'halamanBaru', label: '+ Halaman', icon: <FilePlus2 size={16} />, accent: 'sky' },
  { id: 'riwayat', label: 'Riwayat', icon: <History size={16} />, accent: 'violet' },
];

export default function LeftPanel() {
  const leftTab = useCanvaStore(s => s.leftTab);
  const setLeftTab = useCanvaStore(s => s.setLeftTab);
  const rightPanelOpen = useCanvaStore(s => s.rightPanelOpen);
  const toggleRightPanel = useCanvaStore(s => s.toggleRightPanel);

  return (
    <div className="w-full flex flex-col glass-panel overflow-hidden">
      {/* Tab bar — 4 tabs */}
      <div className="glass-panel border-b border-app-border">
        <div className="flex">
          {TABS.map(tab => {
            const isActive = leftTab === tab.id;
            let activeClass: string;
            if (tab.accent === 'teal' && isActive) {
              activeClass = 'text-teal-400 border-b-2 border-teal-400 bg-teal-500/5';
            } else if (tab.accent === 'sky' && isActive) {
              activeClass = 'text-sky-400 border-b-2 border-sky-400 bg-sky-500/5';
            } else if (tab.accent === 'violet' && isActive) {
              activeClass = 'text-violet-400 border-b-2 border-violet-400 bg-violet-500/5';
            } else if (isActive) {
              activeClass = 'text-app-accent border-b-2 border-app-accent bg-app-accent/5';
            } else {
              activeClass = 'text-app-muted hover:text-app-secondary border-b-2 border-transparent';
            }
            return (
              <button
                key={tab.id}
                onClick={() => setLeftTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[9px] font-semibold transition-colors ${activeClass}`}
                title={tab.label}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar page-transition">
        {leftTab === 'halaman' && <HalamanContent />}
        {leftTab === 'layer' && <LayerPanel />}
        {leftTab === 'sisipkan' && <SisipkanContent />}
        {leftTab === 'halamanBaru' && <HalamanBaruContent />}
        {leftTab === 'riwayat' && <HistoryPanel />}
      </div>

      {/* Bottom: Right Panel toggle */}
      <div className="p-2 border-t border-app-border">
        <Button
          variant="ghost"
          onClick={toggleRightPanel}
          className="w-full py-1.5 rounded-lg text-[9px] font-bold gap-1.5"
        >
          {rightPanelOpen ? (
            <>
              <PanelRightClose size={12} />
              <span>Sembunyikan Panel Kanan</span>
            </>
          ) : (
            <>
              <PanelRightOpen size={12} />
              <span>Tampilkan Panel Kanan</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Tab 1: HALAMAN — Page navigator + Rasio
   ══════════════════════════════════════════════════════════════════ */

function HalamanContent() {
  const pages = useCanvaStore(s => s.pages);
  const currentPageIndex = useCanvaStore(s => s.currentPageIndex);
  const goPage = useCanvaStore(s => s.goPage);
  const duplicatePage = useCanvaStore(s => s.duplicatePage);
  const deletePage = useCanvaStore(s => s.deletePage);
  const ratioId = useCanvaStore(s => s.ratioId);
  const reorderPage = useCanvaStore(s => s.reorderPage);
  const setRatio = useCanvaStore(s => s.setRatio);
  const ratio = useCanvaStore(s => s.currentRatio());
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      <div className="text-[10px] font-bold text-app-secondary uppercase tracking-wider">Daftar Halaman</div>

      {/* Page list */}
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
          const modulCount = p.elements.filter(e => e.type === 'modul' || e.type === 'materi').length;
          const kuisCount = p.elements.filter(e => e.type === 'kuis').length;
          const gameCount = p.elements.filter(e => e.type === 'game').length;

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
                    <span className="truncate">{badge.icon} {p.label}</span>
                  </div>
                  <div className="text-[8px] text-app-muted">
                    {isSchemaDriven ? (
                      <span className="text-emerald-400/70">Schema</span>
                    ) : isTemplate ? (
                      <span className="text-app-accent/60">Template</span>
                    ) : (
                      <span className="text-emerald-400/60">Bebas edit</span>
                    )}
                    {modulCount > 0 && <span className="ml-1 text-emerald-400/70">{modulCount} modul</span>}
                    {kuisCount > 0 && <span className="ml-1 text-app-accent/70">{kuisCount} kuis</span>}
                    {gameCount > 0 && <span className="ml-1 text-teal-400/70">{gameCount} game</span>}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Add page button */}
      <button
        onClick={() => { useCanvaStore.getState().addPage(); }}
        className="w-full py-2 rounded-xl border border-dashed border-app-border hover:border-app-accent/30 text-[11px] text-app-secondary hover:text-app-accent transition-colors flex items-center justify-center gap-1"
      >
        <Plus size={12} />
        Halaman Kosong
      </button>

      {/* Action buttons */}
      <div className="flex gap-1">
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

      <div className="section-divider" />

      {/* Rasio */}
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
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Tab 3: SISIPKAN — Insert content into current page
   ══════════════════════════════════════════════════════════════════ */

function SisipkanContent() {
  const addElement = useCanvaStore(s => s.addElement);
  const addModuleElement = useCanvaStore(s => s.addModuleElement);
  const addGameElement = useCanvaStore(s => s.addGameElement);
  const authStore = useAuthoringStore();
  const kuis = authStore.kuis.filter(k => k.q.trim());
  const games = authStore.modules.filter((m: Record<string, unknown>) =>
    (GAME_TYPES as readonly string[]).includes(m.type as string)
  );
  const materiModules = authStore.modules.filter((m: Record<string, unknown>) =>
    !(GAME_TYPES as readonly string[]).includes(m.type as string)
  );

  const page = useCanvaStore(s => s.pages[s.currentPageIndex]);
  const isTemplatePage = page?.templateType && page.templateType !== 'custom';

  // ═══ MIGRATION: Schema-first for template pages ══════════════════
  // Template pages use schema as single source of truth.
  // The AddBlockPanel (schema-based) is the ONLY way to add content
  // to template pages. Legacy element buttons are hidden to prevent
  // dual-render and data inconsistency.
  //
  // Custom pages still use the legacy element path since they have
  // no schema — elements[] is their only data model.
  const isSchemaDriven = !!page?.schema?.blocks && page.schema.blocks.length > 0;

  // Show insertion point indicator from selected block
  const selectedBlockId = useCanvaStore(s => s.selectedBlockId);

  return (
    <div className="space-y-3">
      {/* ── Insertion point indicator ── */}
      <InsertionPointIndicator selectedBlockId={selectedBlockId} page={page} />

      {/* ── Schema Block Palette (always shown — primary content addition) ── */}
      <AddBlockPanel />

      {isSchemaDriven ? (
        <div className="text-[9px] text-teal-400/70 px-2 py-1.5 rounded-lg bg-teal-500/5 border border-teal-500/10">
          Gunakan panel di atas untuk menambahkan konten ke halaman template
        </div>
      ) : (
        <>
          <div className="section-divider" />

          {/* ── Tambah Modul ── */}
          <div>
            <div className="text-[9px] font-bold text-teal-400/80 uppercase tracking-wider mb-2"><Puzzle size={12} className="inline" /> Tambah Modul</div>
            {materiModules.length > 0 ? (
              <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                {materiModules.map((m, i) => {
                  const mIdx = authStore.modules.indexOf(m as (typeof authStore.modules)[0]);
                  return (
                    <button
                      key={i}
                      onClick={() => addModuleElement(mIdx, (m._id as string) || undefined, (m.layoutVariant as 'A' | 'B' | 'C' | 'D') || 'A')}
                      className="card-hover w-full flex items-center gap-2 p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 active:scale-95 transition-transform"
                    >
                      <span className="text-lg">{getModuleIcon(m.type as string)}</span>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-[11px] font-bold text-teal-300 truncate">{(m.title as string) || (m.type as string)}</div>
                        <div className="text-[9px] text-teal-400/60">{m.type as string}</div>
                      </div>
                      <Plus size={12} className="text-teal-400" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-[9px] text-app-muted p-2.5 rounded-xl bg-app-elevated border border-app-border-subtle">
                Belum ada modul. <button onClick={() => useAuthoringStore.getState().setActivePanel('konten')} className="text-teal-400 underline">Tambah di panel Konten → Modul</button>
              </div>
            )}
          </div>

          <div className="section-divider" />

          {/* ── Tambah Game ── */}
          <div>
            <div className="text-[9px] font-bold text-teal-400/80 uppercase tracking-wider mb-2"><Gamepad2 size={12} className="inline" /> Tambah Game</div>
            {games.length > 0 ? (
              <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                {games.map((g, i) => {
                  const gIdx = authStore.modules.indexOf(g as (typeof authStore.modules)[0]);
                  return (
                    <button
                      key={i}
                      onClick={() => addGameElement(gIdx)}
                      className="card-hover w-full flex items-center gap-2 p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 active:scale-95 transition-transform"
                    >
                      <span className="text-lg">{getGameIcon(g.type as string)}</span>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-[11px] font-bold text-teal-300 truncate">{(g.title as string) || (g.type as string)}</div>
                        <div className="text-[9px] text-teal-400/60">{g.type as string}</div>
                      </div>
                      <Plus size={12} className="text-teal-400" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-[9px] text-app-muted p-2.5 rounded-xl bg-app-elevated border border-app-border-subtle">
                Belum ada game. <button onClick={() => useAuthoringStore.getState().setActivePanel('konten')} className="text-teal-400 underline">Tambah di panel Konten → Modul</button>
              </div>
            )}
          </div>

          <div className="section-divider" />

          {/* ── Kuis Interaktif ── */}
          <div>
            <div className="text-[9px] font-bold text-teal-400/80 uppercase tracking-wider mb-2"><HelpCircle size={12} className="inline" /> Kuis ({kuis.length} soal)</div>
            {kuis.length > 0 ? (
              <button
                onClick={() => addElement('kuis')}
                className="card-hover accent-top w-full flex items-center gap-2 p-2.5 rounded-xl bg-app-accent/10 border border-app-accent/20 cursor-grab active:scale-95 transition-transform"
                style={{ '--accent-color': COLORS.kuis } as React.CSSProperties}
              >
                <HelpCircle size={20} />
                <div className="flex-1 text-left">
                  <div className="text-[11px] font-bold text-app-accent">Kuis Interaktif</div>
                  <div className="text-[9px] text-app-accent/60">{kuis.length} soal pilihan ganda</div>
                </div>
                <Plus size={14} className="text-app-accent" />
              </button>
            ) : (
              <div className="text-[9px] text-app-muted p-2.5 rounded-xl bg-app-elevated border border-app-border-subtle">
                Belum ada soal kuis. <button onClick={() => useAuthoringStore.getState().setActivePanel('konten')} className="text-app-accent underline">Isi di panel Konten → Evaluasi</button>
              </div>
            )}
          </div>

          <div className="section-divider" />

          {/* ── Elemen Dasar ── */}
          <div>
            <div className="text-[9px] font-bold text-teal-400/80 uppercase tracking-wider mb-2">Elemen Dasar</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'teks', icon: <Type size={20} />, name: 'Teks', note: 'Teks bebas', color: COLORS.textDefault },
                { id: 'shape', icon: <Square size={20} />, name: 'Shape', note: 'Kotak/warna', color: COLORS.shape },
                { id: 'image', icon: <ImageIcon size={20} />, name: 'Gambar', note: 'URL / upload', color: COLORS.image },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => addElement(t.id)}
                  className="card-hover accent-top flex flex-col items-center gap-1 p-3 rounded-xl bg-app-elevated border border-app-border-subtle cursor-pointer active:scale-95"
                  style={{ '--accent-color': t.color } as React.CSSProperties}
                >
                  <span className="text-2xl">{t.icon}</span>
                  <span className="text-[11px] font-bold text-app-primary">{t.name}</span>
                  <span className="text-[9px] text-app-muted">{t.note}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Insertion Point Indicator — shows where blocks will be inserted
   ══════════════════════════════════════════════════════════════════ */

function InsertionPointIndicator({ selectedBlockId, page }: { selectedBlockId: string | null; page: import('@/components/canva/types').CanvaPage | undefined }) {
  const selectedBlockName = useMemo(() => {
    if (!selectedBlockId || !page) return null;
    const schema = ensurePageSchema(page);
    if (!schema) return null;
    const idx = schema.blocks.findIndex(b => b.id === selectedBlockId);
    if (idx === -1) return null;
    const blockDef = getBlockDefinition(schema.blocks[idx].type);
    return blockDef?.name || schema.blocks[idx].type;
  }, [selectedBlockId, page]);

  if (selectedBlockName) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-teal-500/10 border border-teal-500/20 text-[10px] text-teal-400 font-semibold">
        <ArrowDownToLine size={12} />
        <span>Sisipkan setelah:</span>
        <span className="font-bold truncate">{selectedBlockName}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-teal-500/5 border border-teal-500/10 text-[9px] text-teal-400/60 font-medium">
      <ArrowDownToLine size={10} />
      <span>Tambahkan di akhir halaman</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Tab 4: HALAMAN BARU — Add new pages / presets / auto-generate
   ══════════════════════════════════════════════════════════════════ */

function HalamanBaruContent() {
  const addTemplatePage = useCanvaStore(s => s.addTemplatePage);
  const resetCanvas = useCanvaStore(s => s.resetCanvas);
  const loadSchemaPreset = useCanvaStore(s => s.loadSchemaPreset);

  // Schema preset info
  const availablePresets = getAvailablePresets();
  const presetInfo: Record<string, { label: string; icon: string; desc: string }> = {
    'hakikat-norma': { label: 'Hakikat Norma', icon: '📜', desc: 'Pertemuan 1 — PPKn Kelas VII' },
    'macam-norma': { label: 'Macam-Macam Norma', icon: '⚖️', desc: 'Pertemuan 2 — PPKn Kelas VII' },
    'perilaku-patuh': { label: 'Perilaku Patuh Norma', icon: '🛡️', desc: 'Pertemuan 3 — PPKn Kelas VII' },
  };
  const [loadingPreset, setLoadingPreset] = useState<string | null>(null);

  // FASE 2: Metadata-driven categories from PresetRegistry
  const presetCategories = getPresetsGroupedByCategory();
  const categoryLabels: Record<string, string> = {
    utama: 'Halaman Utama',
    konten: 'Konten',
    interaktif: 'Interaktif',
    penutup: 'Penutup',
  };

  return (
    <div className="space-y-3">
      {/* ── 📦 Preset Schema (schema-driven!) ── */}
      <div>
        <div className="text-[9px] font-bold text-sky-400 uppercase tracking-wider mb-2 flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 text-[7px] font-black">SCHEMA</span>
          Preset PPKn
        </div>
        <div className="space-y-1.5">
          {availablePresets.map(presetId => {
            const info = presetInfo[presetId] || { label: presetId, icon: '📦', desc: 'Preset' };
            const isLoading = loadingPreset === presetId;
            return (
              <button
                key={presetId}
                onClick={async () => {
                  setLoadingPreset(presetId);
                  await loadSchemaPreset(presetId);
                  setLoadingPreset(null);
                }}
                disabled={isLoading}
                className="card-hover w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 active:scale-95 transition-transform disabled:opacity-50"
              >
                <span className="text-xl">{info.icon}</span>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-[11px] font-bold text-sky-300 truncate">{info.label}</div>
                  <div className="text-[8px] text-sky-400/60">{info.desc}</div>
                </div>
                {isLoading ? (
                  <span className="text-[10px] text-sky-400 animate-pulse">⏳</span>
                ) : (
                  <Plus size={12} className="text-sky-400" />
                )}
              </button>
            );
          })}
        </div>
        <div className="text-[8px] text-white/30 mt-1.5 px-1">
          Preset dimuat via schema renderer — tampilan sesuai preset asli
        </div>
      </div>

      <div className="section-divider" />

      {/* ── Jenis Halaman ── */}
      <div>
        <div className="text-[9px] font-bold text-sky-400/80 uppercase tracking-wider mb-2">Jenis Halaman</div>
        <select
          onChange={(e) => {
            const val = e.target.value;
            if (val) addTemplatePage(val as PageTemplateType);
            e.target.value = '';
          }}
          defaultValue=""
          className="w-full h-8 px-2 text-[11px] text-app-primary bg-app-elevated border border-app-border rounded-lg focus:border-sky-400/50 focus:outline-none"
        >
          <option value="" disabled>+ Tambah dari Template...</option>
          {presetCategories.map(cat => (
              <optgroup key={cat.category} label={categoryLabels[cat.category] || cat.category}>
                {cat.presets.map(p => (
                  <option key={p.id} value={p.id}>{p.icon} {p.label} — {p.description}</option>
                ))}
              </optgroup>
            ))}
        </select>
      </div>

      {/* Auto-Generate via Page Type Creator */}
      <PageTypeCreator />

      <div className="section-divider" />

      {/* ── Reset Canvas ── */}
      <button
        onClick={() => {
          if (confirm('Reset canvas? Semua halaman akan dibuat ulang dari data authoring. Perubahan manual akan hilang.')) {
            resetCanvas();
          }
        }}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-app-elevated border border-app-border-subtle hover:border-red-500/30 text-app-secondary hover:text-red-400 text-[11px] font-bold transition-all active:scale-95"
      >
        <RefreshCw size={14} className="inline" />
        <span>Reset Canvas</span>
      </button>
    </div>
  );
}
