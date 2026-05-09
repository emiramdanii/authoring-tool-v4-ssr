'use client';

import { useState } from 'react';
import {
  FileText,
  Plus,
  Copy,
  Trash2,
  GripVertical,
  PanelRightOpen,
  PanelRightClose,
  Lock,
  Unlock,
} from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import type { CanvaElement, LeftTab } from './types';
import { TEMPLATE_TYPES, RATIOS } from './types';
import {
  TEMPLATE_BADGE_MAP,
  ELEMENT_TYPE_COLORS,
  getModuleIcon,
  getGameIcon,
} from '@/lib/canva-icon-maps';
import { GAME_TYPES } from '@/lib/canva-constants';
import { toast } from 'sonner';
import PageTypeCreator from './PageTypeCreator';

// ═══════════════════════════════════════════════════════════════
// Left Panel — 2 tabs only: Halaman (view & arrange) + Tambah (add)
// ═══════════════════════════════════════════════════════════════

const TABS: { id: LeftTab; label: string; icon: React.ReactNode }[] = [
  { id: 'halaman', label: 'Halaman', icon: <FileText size={16} /> },
  { id: 'tambah', label: 'Tambah', icon: <Plus size={16} /> },
];

export default function LeftPanel() {
  const { leftTab, setLeftTab, rightPanelOpen, toggleRightPanel } = useCanvaStore();

  return (
    <div className="w-60 min-w-[240px] flex flex-col glass-panel overflow-hidden">
      {/* Tab bar — 2 tabs */}
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
        {leftTab === 'halaman' && <HalamanContent />}
        {leftTab === 'tambah' && <TambahContent />}
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
   Tab 1: HALAMAN — Page navigator + Rasio
   ══════════════════════════════════════════════════════════════════ */

function HalamanContent() {
  const { pages, currentPageIndex, goPage, duplicatePage, deletePage, ratioId, reorderPage, setRatio } = useCanvaStore();
  const ratio = useCanvaStore(s => s.currentRatio());
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daftar Halaman</div>

      {/* Page list */}
      <div className="space-y-1.5">
        {pages.map((p, i) => {
          const isActive = i === currentPageIndex;
          const badge = TEMPLATE_BADGE_MAP[p.templateType || 'custom'] || TEMPLATE_BADGE_MAP.custom;
          const bgStyle = p.bgDataUrl
            ? { backgroundImage: `url('${p.bgDataUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : p.bgColor?.includes('gradient')
              ? { background: p.bgColor }
              : { background: p.bgColor || '#1a1a2e' };

          const isTemplate = p.templateType && p.templateType !== 'custom';
          const isPageLocked = p.locked !== false; // true or undefined = locked
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
                  <div className="text-[10px] font-bold text-slate-200 truncate flex items-center gap-1">
                    {isTemplate && isPageLocked && <Lock size={8} className="text-amber-400 flex-shrink-0" />}
                    {isTemplate && !isPageLocked && <Unlock size={8} className="text-emerald-400 flex-shrink-0" />}
                    <span className="truncate">{badge.icon} {p.label}</span>
                  </div>
                  <div className="text-[8px] text-slate-500">
                    {isTemplate && isPageLocked && (
                      <span className="text-amber-400/60">Terkunci</span>
                    )}
                    {isTemplate && !isPageLocked && (
                      <span className="text-emerald-400/60">Terbuka</span>
                    )}
                    {!isTemplate && (
                      <span className="text-emerald-400/60">Bebas edit</span>
                    )}
                    {modulCount > 0 && <span className="ml-1 text-emerald-400/70">{modulCount} modul</span>}
                    {kuisCount > 0 && <span className="ml-1 text-amber-400/70">{kuisCount} kuis</span>}
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
        className="w-full py-2 rounded-xl border border-dashed border-slate-600 hover:border-amber-500/30 text-[11px] text-slate-400 hover:text-amber-400 transition-colors flex items-center justify-center gap-1"
      >
        <Plus size={12} />
        Halaman Kosong
      </button>

      {/* Action buttons */}
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

      {/* Rasio */}
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
   Tab 2: TAMBAH — Add pages + elements + modules + Reset Canvas
   ══════════════════════════════════════════════════════════════════ */

function TambahContent() {
  const { addTemplatePage, addElement, addKuisElement, addGameElement, resetCanvas } = useCanvaStore();
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
  const isPageLocked = page?.locked !== false; // true or undefined = locked

  // Handle adding module element (works on ALL pages including template)
  const handleAddModule = (m: Record<string, unknown>, mIdx: number) => {
    const store = useCanvaStore.getState();
    const pages = store.pages;
    const page = pages[store.currentPageIndex];
    if (!page) return;
    const isTmpl = page.templateType && page.templateType !== 'custom';
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
    // Locked template pages: add to overlayElements
    // Unlocked template pages + custom: add to elements
    if (isTmpl && page.locked !== false) {
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
      {/* ── Jenis Halaman ── */}
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

      {/* Auto-Generate via Page Type Creator */}
      <PageTypeCreator />

      <div className="section-divider" />

      {/* ── Tambah Modul ── */}
      <div>
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">🧩 Tambah Modul</div>
        {isTemplatePage && isPageLocked && (
          <div className="text-[8px] text-amber-400/70 mb-2 px-2 py-1 rounded-lg bg-amber-500/5 border border-amber-500/10">
            Modul ditambahkan sebagai overlay di atas template
          </div>
        )}
        {isTemplatePage && !isPageLocked && (
          <div className="text-[8px] text-emerald-400/70 mb-2 px-2 py-1 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
            Template beku — modul ditambahkan sebagai elemen bebas
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

      {/* ── Tambah Game ── */}
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

      {/* ── Kuis Interaktif ── */}
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

      {/* ── Elemen Dasar ── */}
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

      <div className="section-divider" />

      {/* ── Reset Canvas ── */}
      <button
        onClick={() => {
          if (confirm('Reset canvas? Semua halaman akan dibuat ulang dari data authoring. Perubahan manual akan hilang.')) {
            resetCanvas();
          }
        }}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800/40 border border-slate-700/20 hover:border-red-500/30 text-slate-400 hover:text-red-400 text-[11px] font-bold transition-all active:scale-95"
      >
        <span>🔄</span>
        <span>Reset Canvas</span>
      </button>
    </div>
  );
}
