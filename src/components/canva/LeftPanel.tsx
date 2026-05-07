'use client';

import { useState } from 'react';
import {
  Wrench,
  FileText,
  Layers,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  PanelRightOpen,
  PanelRightClose,
  GripVertical,
} from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import type { LeftTab, CanvaElement } from './types';
import { TEMPLATE_TYPES, RATIOS } from './types';
import {
  TEMPLATE_BADGE_MAP,
  ELEMENT_TYPE_COLORS,
  getModuleIcon,
  getGameIcon,
} from '@/lib/canva-icon-maps';
import { GAME_TYPES } from '@/lib/canva-export-helpers';
import { toast } from 'sonner';
import PageTypeCreator from './PageTypeCreator';

// Phase 1: 3 tabs instead of 5
const TABS: { id: LeftTab; label: string; icon: React.ReactNode }[] = [
  { id: 'rakit', label: 'Rakit', icon: <Wrench size={16} /> },
  { id: 'halaman', label: 'Halaman', icon: <FileText size={16} /> },
  { id: 'layer', label: 'Layer', icon: <Layers size={16} /> },
];

export default function LeftPanel() {
  const { leftTab, setLeftTab, rightPanelOpen, toggleRightPanel } = useCanvaStore();

  return (
    <div className="w-60 min-w-[240px] flex flex-col glass-panel overflow-hidden">
      {/* Tab bar — clean underline design */}
      <div className="glass-panel border-b border-slate-700/30">
        <div className="flex">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setLeftTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[9px] font-semibold transition-colors ${
                leftTab === tab.id
                  ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/5'
                  : 'text-slate-500 hover:text-slate-300 border-b-2 border-transparent'
              }`}
              title={tab.label}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar page-transition">
        {leftTab === 'rakit' && <RakitContent />}
        {leftTab === 'halaman' && <HalamanContent />}
        {leftTab === 'layer' && <LayerContent />}
      </div>

      {/* Bottom: Right Panel toggle */}
      <div className="p-2 border-t border-slate-700/30">
        <button
          onClick={toggleRightPanel}
          className="btn-ghost w-full py-1.5 rounded-lg text-[9px] font-bold gap-1.5"
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
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Tab 1: RAKIT — Merged Template + Elemen + Auto Rakit
   Phase 1 fix: Modul selalu visible, tidak diblokir template page
   ══════════════════════════════════════════════════════════════════ */

function RakitContent() {
  const { addTemplatePage, pages, currentPageIndex, addElement, addKuisElement, addGameElement, autoRakit } = useCanvaStore();
  const authStore = useAuthoringStore();
  const page = pages[currentPageIndex];
  const meta = authStore.meta;
  const kuis = authStore.kuis.filter(k => k.q.trim());
  const games = authStore.modules.filter((m: Record<string, unknown>) =>
    (GAME_TYPES as readonly string[]).includes(m.type as string)
  );
  const materiModules = authStore.modules.filter((m: Record<string, unknown>) =>
    !(GAME_TYPES as readonly string[]).includes(m.type as string)
  );

  const isTemplatePage = page?.templateType && page.templateType !== 'custom';

  // Handle adding module element (works on ALL pages including template)
  const handleAddModule = (m: Record<string, unknown>, mIdx: number) => {
    const store = useCanvaStore.getState();
    const pages = store.pages;
    const page = pages[store.currentPageIndex];
    if (!page) return;
    const typeInfo = { icon: getModuleIcon(m.type as string), name: (m.title as string) || (m.type as string) };
    const el: CanvaElement = {
      id: 'el_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      type: 'modul',
      icon: typeInfo.icon,
      label: typeInfo.name,
      x: 5, y: 10, w: 90, h: 60,
      opacity: 100,
      dataIdx: mIdx,
      moduleId: (m._id as string) || undefined,
      layoutVariant: (m.layoutVariant as 'A' | 'B' | 'C' | 'D') || 'A',
    };
    const newPages = [...pages];
    // Add to overlayElements for template pages, regular elements for custom
    if (isTemplatePage) {
      newPages[store.currentPageIndex] = {
        ...page,
        overlayElements: [...(page.overlayElements || []), el],
      };
    } else {
      newPages[store.currentPageIndex] = {
        ...page,
        elements: [...page.elements, el],
      };
    }
    store._pushHistory();
    useCanvaStore.setState({ pages: newPages, selectedElId: el.id, selectedElIds: [el.id] });
    toast.success(`${typeInfo.name} ditambahkan`);
  };

  const categories = [
    { key: 'utama', label: 'Halaman Utama' },
    { key: 'konten', label: 'Konten' },
    { key: 'interaktif', label: 'Interaktif' },
    { key: 'penutup', label: 'Penutup' },
  ] as const;

  return (
    <div className="space-y-3">
      {/* ⚡ Auto Rakit — prominent button at top */}
      <button
        onClick={() => autoRakit()}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30 hover:border-amber-400/50 hover:from-amber-500/30 hover:to-amber-600/20 text-amber-300 font-bold text-sm transition-all active:scale-95"
      >
        <span className="text-lg">⚡</span>
        <span>Auto Rakit</span>
        <span className="text-[8px] text-amber-400/60 font-semibold ml-1">dari data authoring</span>
      </button>

      {/* Auto-Generate via Page Type Creator */}
      <PageTypeCreator />

      {/* Data status pills */}
      <div className="text-[8px] text-slate-500 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/20">
        <div className="font-bold text-slate-400 mb-1.5">Data Tersedia:</div>
        <div className="flex flex-wrap gap-1">
          {kuis.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/10">
              ❓ {kuis.length} soal
            </span>
          )}
          {games.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/10">
              🎮 {games.length} game
            </span>
          )}
          {materiModules.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/10">
              📝 {materiModules.length} materi
            </span>
          )}
          {authStore.skenario.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/10">
              🎭 skenario
            </span>
          )}
          {kuis.length === 0 && games.length === 0 && materiModules.length === 0 && (
            <span className="text-slate-600">Belum ada data — isi di panel lain dulu</span>
          )}
        </div>
      </div>

      <div className="section-divider" />

      {/* Jenis Halaman (was Template Gallery) — now a compact dropdown */}
      <div>
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Jenis Halaman</div>
        <select
          onChange={(e) => {
            const val = e.target.value;
            if (val) addTemplatePage(val as CanvaElement['type'] & 'cover' | 'dokumen' | 'materi' | 'kuis' | 'game' | 'hasil' | 'hero' | 'skenario' | 'custom');
            e.target.value = '';
          }}
          defaultValue=""
          className="w-full h-8 px-2 text-[11px] text-slate-200 bg-slate-800/60 border border-slate-700/30 rounded-lg focus:border-amber-500/50 focus:outline-none"
        >
          <option value="" disabled>+ Tambah dari Template...</option>
          {categories.map(cat => {
            const templates = TEMPLATE_TYPES.filter(t => t.category === cat.key);
            return (
              <optgroup key={cat.key} label={cat.label}>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.icon} {t.name} — {t.desc}</option>
                ))}
              </optgroup>
            );
          })}
        </select>
      </div>

      <div className="section-divider" />

      {/* ═══ Tambah Modul — ALWAYS VISIBLE (Phase 1 fix) ═══ */}
      <div>
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">🧩 Tambah Modul</div>
        {isTemplatePage && (
          <div className="text-[8px] text-amber-400/70 mb-2 px-2 py-1 rounded-lg bg-amber-500/5 border border-amber-500/10">
            Modul akan ditambahkan sebagai overlay di atas template
          </div>
        )}
        {materiModules.length > 0 ? (
          <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
            {materiModules.map((m, i) => {
              const mIdx = authStore.modules.indexOf(m as (typeof authStore.modules)[0]);
              return (
                <button
                  key={i}
                  onClick={() => handleAddModule(m as Record<string, unknown>, mIdx)}
                  className="card-hover w-full flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 active:scale-95 transition-transform"
                >
                  <span className="text-lg">{getModuleIcon(m.type as string)}</span>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-[11px] font-bold text-emerald-300 truncate">{(m.title as string) || (m.type as string)}</div>
                    <div className="text-[9px] text-emerald-400/60">{m.type as string}</div>
                  </div>
                  <Plus size={12} className="text-emerald-400" />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-[9px] text-slate-500 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/20">
            Belum ada modul. <button onClick={() => useAuthoringStore.getState().setActivePanel('konten')} className="text-emerald-400 underline">Tambah di panel Konten → Modul</button>
          </div>
        )}
      </div>

      <div className="section-divider" />

      {/* ═══ Tambah Game ═══ */}
      <div>
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">🎮 Tambah Game</div>
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
          <div className="text-[9px] text-slate-500 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/20">
            Belum ada game. <button onClick={() => useAuthoringStore.getState().setActivePanel('konten')} className="text-teal-400 underline">Tambah di panel Konten → Modul</button>
          </div>
        )}
      </div>

      <div className="section-divider" />

      {/* ═══ Kuis Interaktif ═══ */}
      <div>
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">❓ Kuis ({kuis.length} soal)</div>
        {kuis.length > 0 ? (
          <button
            onClick={() => addElement('kuis')}
            className="card-hover accent-top w-full flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 cursor-grab active:scale-95 transition-transform"
            style={{ '--accent-color': '#f5c842' } as React.CSSProperties}
          >
            <span className="text-xl">❓</span>
            <div className="flex-1 text-left">
              <div className="text-[11px] font-bold text-amber-300">Kuis Interaktif</div>
              <div className="text-[9px] text-amber-400/60">{kuis.length} soal pilihan ganda</div>
            </div>
            <Plus size={14} className="text-amber-400" />
          </button>
        ) : (
          <div className="text-[9px] text-slate-500 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/20">
            Belum ada soal kuis. <button onClick={() => useAuthoringStore.getState().setActivePanel('konten')} className="text-amber-400 underline">Isi di panel Konten → Evaluasi</button>
          </div>
        )}
      </div>

      <div className="section-divider" />

      {/* ═══ Elemen Dasar ═══ */}
      <div>
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Elemen Dasar</div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'teks', icon: '🔤', name: 'Teks', note: 'Teks bebas', color: '#e2e8f0' },
            { id: 'shape', icon: '⬜', name: 'Shape', note: 'Kotak/warna', color: '#6366f1' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => addElement(t.id)}
              className="card-hover accent-top flex flex-col items-center gap-1 p-3 rounded-xl bg-slate-800/40 border border-slate-700/20 cursor-pointer active:scale-95"
              style={{ '--accent-color': t.color } as React.CSSProperties}
            >
              <span className="text-2xl">{t.icon}</span>
              <span className="text-[11px] font-bold text-slate-200">{t.name}</span>
              <span className="text-[9px] text-slate-500">{t.note}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Gradient moved to RightPanel Background section */}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Tab 2: HALAMAN — Page navigator + Rasio (merged from old Ratio tab)
   ══════════════════════════════════════════════════════════════════ */

function HalamanContent() {
  const { pages, currentPageIndex, goPage, addPage, duplicatePage, deletePage, ratioId, reorderPage, setRatio } = useCanvaStore();
  const ratio = useCanvaStore(s => s.currentRatio());
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daftar Halaman</div>

      {/* Page list — 1 column with more info per item */}
      <div className="space-y-1.5">
        {pages.map((p, i) => {
          const isActive = i === currentPageIndex;
          const badge = TEMPLATE_BADGE_MAP[p.templateType || 'custom'] || TEMPLATE_BADGE_MAP.custom;
          const bgStyle = p.bgDataUrl
            ? { backgroundImage: `url('${p.bgDataUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : p.bgColor?.includes('gradient')
              ? { background: p.bgColor }
              : { background: p.bgColor || '#1a1a2e' };
          // Content indicators
          const modulCount = (p.overlayElements || []).length + p.elements.filter(e => e.type === 'modul' || e.type === 'materi').length;
          const kuisCount = (p.overlayElements || []).filter(e => e.type === 'kuis').length + p.elements.filter(e => e.type === 'kuis').length;
          const gameCount = (p.overlayElements || []).filter(e => e.type === 'game').length + p.elements.filter(e => e.type === 'game').length;

          return (
            <button
              key={p.id}
              onClick={() => goPage(i)}
              draggable
              onDragStart={() => setDragIdx(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIdx !== null && dragIdx !== i) {
                  reorderPage(dragIdx, i);
                }
                setDragIdx(null);
              }}
              onDragEnd={() => setDragIdx(null)}
              className={`w-full text-left card-hover relative rounded-xl overflow-hidden transition-all ${
                isActive
                  ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950'
                  : 'hover:ring-1 hover:ring-slate-600'
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
                  <div className="text-[10px] font-bold text-slate-200 truncate">{badge.icon} {p.label}</div>
                  <div className="text-[8px] text-slate-500">
                    {modulCount > 0 && <span className="text-emerald-400/70">{modulCount} modul</span>}
                    {modulCount > 0 && kuisCount > 0 && <span> • </span>}
                    {kuisCount > 0 && <span className="text-amber-400/70">{kuisCount} kuis</span>}
                    {(modulCount > 0 || kuisCount > 0) && gameCount > 0 && <span> • </span>}
                    {gameCount > 0 && <span className="text-teal-400/70">{gameCount} game</span>}
                    {modulCount === 0 && kuisCount === 0 && gameCount === 0 && <span>Kosong</span>}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Add page buttons */}
      <button
        onClick={() => addPage()}
        className="w-full py-2 rounded-xl border border-dashed border-slate-600 hover:border-amber-500/30 text-[11px] text-slate-400 hover:text-amber-400 transition-colors flex items-center justify-center gap-1"
      >
        <Plus size={12} />
        Halaman Kosong
      </button>

      {/* Bottom action buttons */}
      <div className="flex gap-1">
        <button
          onClick={duplicatePage}
          className="btn-ghost flex-1 py-1.5 rounded-lg text-[10px] gap-1"
        >
          <Copy size={10} />
          Duplikat
        </button>
        <button
          onClick={() => {
            if (pages.length <= 1) return;
            if (confirm(`Hapus "${pages[currentPageIndex].label}"?`)) deletePage();
          }}
          className="btn-ghost flex-1 py-1.5 rounded-lg text-[10px] gap-1 text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
        >
          <Trash2 size={10} />
          Hapus
        </button>
      </div>

      <div className="section-divider" />

      {/* Rasio — moved from old separate tab */}
      <div>
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">📐 Rasio: {ratioId}</div>
        <div className="flex flex-wrap gap-1.5">
          {RATIOS.map(r => {
            const isActive = ratioId === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setRatio(r.id)}
                className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-all ${
                  isActive
                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                    : 'bg-slate-800/40 border border-slate-700/20 text-slate-400 hover:border-slate-600'
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
   Tab 3: LAYER — Z-order + visibility (improved)
   ══════════════════════════════════════════════════════════════════ */

function LayerContent() {
  const { pages, currentPageIndex, selectedElId, selectElement, toggleElementVisibility, moveElementZ } = useCanvaStore();
  const page = pages[currentPageIndex];

  if (!page) return null;

  const isTemplatePage = page.templateType && page.templateType !== 'custom';

  // Merge overlay + regular elements for display
  const allElements = isTemplatePage
    ? [...(page.overlayElements || [])]
    : [...page.elements];

  // For template pages, also show overlay elements
  const overlayEls = isTemplatePage ? [] : (page.overlayElements || []);

  return (
    <div className="space-y-2">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        Layer (atas = depan)
      </div>

      {/* Template info */}
      {isTemplatePage && (
        <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/20">
          <div className="text-[10px] font-bold text-amber-400 mb-1">
            {TEMPLATE_BADGE_MAP[page.templateType]?.icon || '🧩'} {TEMPLATE_BADGE_MAP[page.templateType]?.name || page.templateType}
          </div>
          <div className="text-[9px] text-slate-500">
            Template mengisi halaman dari data authoring. Overlay elemen bisa ditambahkan di tab Rakit.
          </div>
        </div>
      )}

      {/* Overlay elements (template mode) */}
      {overlayEls.length > 0 && (
        <div>
          <div className="text-[8px] font-bold text-slate-500 uppercase mb-1">Overlay</div>
          <LayerList
            elements={overlayEls}
            selectedElId={selectedElId}
            selectElement={selectElement}
            toggleElementVisibility={toggleElementVisibility}
            moveElementZ={moveElementZ}
          />
        </div>
      )}

      {/* Regular/overlay elements */}
      <LayerList
        elements={[...allElements].reverse()}
        selectedElId={selectedElId}
        selectElement={selectElement}
        toggleElementVisibility={toggleElementVisibility}
        moveElementZ={moveElementZ}
      />

      {allElements.length === 0 && overlayEls.length === 0 && (
        <div className="text-[10px] text-slate-600 text-center py-4">Belum ada elemen</div>
      )}

      {selectedElId && (
        <>
          <div className="section-divider" />
          <div className="flex gap-1">
            <button
              onClick={() => moveElementZ(selectedElId, 'top')}
              className="btn-ghost flex-1 py-1.5 rounded-lg text-[9px] gap-1"
            >
              <ChevronsUp size={10} />
              Ke paling atas
            </button>
            <button
              onClick={() => moveElementZ(selectedElId, 'bottom')}
              className="btn-ghost flex-1 py-1.5 rounded-lg text-[9px] gap-1"
            >
              <ChevronsDown size={10} />
              Ke paling bawah
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Shared Layer List component ──────────────────────────────── */

function LayerList({
  elements,
  selectedElId,
  selectElement,
  toggleElementVisibility,
  moveElementZ,
}: {
  elements: CanvaElement[];
  selectedElId: string | null;
  selectElement: (id: string) => void;
  toggleElementVisibility: (id: string) => void;
  moveElementZ: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
}) {
  return (
    <div className="space-y-0.5">
      {elements.map(el => {
        const isActive = el.id === selectedElId;
        return (
          <div
            key={el.id}
            onClick={() => selectElement(el.id)}
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 cursor-pointer transition-colors ${
              isActive ? 'nav-active' : 'text-slate-400 hover:bg-slate-800/60'
            }`}
          >
            <GripVertical size={10} className="flex-shrink-0 opacity-30" />
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: ELEMENT_TYPE_COLORS[el.type] || '#888' }}
            />
            <span className="text-[10px] font-medium flex-1 truncate">
              {el.icon} {el.label || el.type}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); moveElementZ(el.id, 'up'); }}
              className="btn-ghost w-6 h-6"
              title="Naik ke atas"
            >
              <ChevronUp size={10} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); moveElementZ(el.id, 'down'); }}
              className="btn-ghost w-6 h-6"
              title="Turun ke bawah"
            >
              <ChevronDown size={10} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); toggleElementVisibility(el.id); }}
              className={`btn-ghost w-6 h-6 ${el.hidden ? 'text-slate-700' : ''}`}
              title={el.hidden ? 'Tampilkan' : 'Sembunyikan'}
            >
              {el.hidden ? <EyeOff size={10} /> : <Eye size={10} />}
            </button>
          </div>
        );
      })}
    </div>
  );
}
