'use client';

import { useState } from 'react';
import {
  Puzzle,
  FileText,
  Box,
  Ratio,
  Layers,
  Zap,
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
  Palette,
  GripVertical,
} from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import type { LeftTab, PageTemplateType, CanvaElement } from './types';
import { TEMPLATE_TYPES, GRADIENT_PRESETS } from './types';
import { toast } from 'sonner';

const TABS: { id: LeftTab; label: string; icon: React.ReactNode }[] = [
  { id: 'templates', label: 'Template', icon: <Puzzle size={16} /> },
  { id: 'pages', label: 'Halaman', icon: <FileText size={16} /> },
  { id: 'elems', label: 'Elemen', icon: <Box size={16} /> },
  { id: 'ratio', label: 'Rasio', icon: <Ratio size={16} /> },
  { id: 'layers', label: 'Layer', icon: <Layers size={16} /> },
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
        {leftTab === 'templates' && <TemplatesContent />}
        {leftTab === 'pages' && <PagesContent />}
        {leftTab === 'elems' && <ElementsContent />}
        {leftTab === 'ratio' && <RatioContent />}
        {leftTab === 'layers' && <LayersContent />}
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

/* ── Templates Tab (Puzzle-like page assembler) ──────────────── */

function TemplatesContent() {
  const { addTemplatePage, autoRakit } = useCanvaStore();
  const authStore = useAuthoringStore();
  const meta = authStore.meta;
  const kuis = authStore.kuis.filter(k => k.q.trim());
  const GAME_TYPES = ['truefalse','memory','matching','roda','sorting','spinwheel','teambuzzer','wordsearch','flashcard'];
  const games = authStore.modules.filter((m: Record<string, unknown>) => GAME_TYPES.includes(m.type as string));
  const materiModules = authStore.modules.filter((m: Record<string, unknown>) =>
    ['materi', 'infografis', 'accordion', 'tab-icons', 'icon-explore', 'timeline', 'hero'].includes(m.type as string)
  );

  const categories = [
    { key: 'utama', label: 'Halaman Utama' },
    { key: 'konten', label: 'Konten' },
    { key: 'interaktif', label: 'Interaktif' },
    { key: 'penutup', label: 'Penutup' },
  ] as const;

  return (
    <div className="space-y-3">
      {/* Auto Rakit Button — btn-primary gold gradient */}
      <button
        onClick={autoRakit}
        className="btn-primary w-full py-2.5 justify-center text-[11px]"
      >
        <Zap size={14} />
        Auto Rakit Halaman
      </button>

      {/* Data status — cleaner rounded-full pills */}
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

      {/* Section divider */}
      <div className="section-divider" />

      {/* Template categories */}
      {categories.map(cat => {
        const templates = TEMPLATE_TYPES.filter(t => t.category === cat.key);
        if (templates.length === 0) return null;
        return (
          <div key={cat.key}>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">{cat.label}</div>
            <div className="grid grid-cols-2 gap-2">
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => addTemplatePage(t.id)}
                  className="card-hover accent-top relative flex flex-col items-center gap-1 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/20 cursor-pointer active:scale-95"
                  style={{ '--accent-color': t.color } as React.CSSProperties}
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{t.icon}</span>
                  <span className="text-[11px] font-bold text-slate-200">{t.name}</span>
                  <span className="text-[9px] text-slate-500 text-center leading-tight">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {/* Section divider */}
      <div className="section-divider" />

      {/* Gradient Presets */}
      <div>
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
          <Palette size={10} />
          Gradient Background
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {GRADIENT_PRESETS.map(g => (
            <button
              key={g.id}
              onClick={() => {
                useCanvaStore.getState().setBgColor(g.css);
                toastGradient(g.name);
              }}
              className="w-8 h-8 rounded-xl border border-slate-700/20 hover:ring-2 hover:ring-amber-400/30 transition-all hover:scale-110"
              style={{ background: g.css }}
              title={g.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function toastGradient(name: string) {
  toast.success(`Gradient "${name}" diterapkan`);
}

/* ── Pages Tab ──────────────────────────────────────────────── */

function PagesContent() {
  const { pages, currentPageIndex, goPage, addPage, duplicatePage, deletePage, ratioId, reorderPage, setTemplateType } = useCanvaStore();
  const ratio = useCanvaStore(s => s.currentRatio());
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const templateBadge: Record<string, { icon: string; color: string }> = {
    cover: { icon: '🏠', color: '#f9c82e' },
    dokumen: { icon: '📋', color: '#3ecfcf' },
    materi: { icon: '📝', color: '#a78bfa' },
    kuis: { icon: '❓', color: '#f5c842' },
    game: { icon: '🎮', color: '#3ecfcf' },
    hasil: { icon: '🏆', color: '#34d399' },
    hero: { icon: '🚀', color: '#fb923c' },
    skenario: { icon: '🎭', color: '#f472b6' },
    custom: { icon: '⬜', color: '#6366f1' },
  };

  return (
    <div className="space-y-3">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Halaman</div>
      <div className="grid grid-cols-2 gap-2">
        {pages.map((p, i) => {
          const isActive = i === currentPageIndex;
          const badge = templateBadge[p.templateType || 'custom'] || templateBadge.custom;
          const bgStyle = p.bgDataUrl
            ? { backgroundImage: `url('${p.bgDataUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : p.bgColor?.includes('gradient')
              ? { background: p.bgColor }
              : { background: p.bgColor || '#1a1a2e' };
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
              className={`card-hover relative rounded-xl overflow-hidden transition-all ${
                isActive
                  ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950'
                  : 'hover:ring-1 hover:ring-slate-600'
              }`}
              style={{ ...bgStyle, aspectRatio: `${ratio.w}/${ratio.h}` }}
            >
              <div className="absolute inset-0 bg-black/30 flex flex-col justify-end p-1">
                {/* Template badge */}
                <div className="absolute top-0.5 right-0.5 text-[8px]">{badge.icon}</div>
                <div className="text-[8px] font-bold text-white truncate">{p.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Add page button */}
      <button
        onClick={() => addPage()}
        className="w-full py-2 rounded-xl border border-dashed border-slate-600 hover:border-amber-500/30 text-[11px] text-slate-400 hover:text-amber-400 transition-colors flex items-center justify-center gap-1"
      >
        <Plus size={12} />
        Halaman Kosong
      </button>

      {/* Bottom action buttons — btn-ghost style */}
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
    </div>
  );
}

/* ── Elements Tab ───────────────────────────────────────────── */

function ElementsContent() {
  const { addElement, addKuisElement, addGameElement, pages, currentPageIndex } = useCanvaStore();
  const page = pages[currentPageIndex];
  const authStore = useAuthoringStore();
  const kuis = authStore.kuis.filter(k => k.q.trim());
  const GAME_TYPES_LIST = ['truefalse','memory','matching','roda','sorting','spinwheel','teambuzzer','wordsearch','flashcard','crossword','fillblank','dragdrop'];
  const games = authStore.modules.filter((m: Record<string, unknown>) => GAME_TYPES_LIST.includes(m.type as string));
  const materiModules = authStore.modules.filter((m: Record<string, unknown>) => !GAME_TYPES_LIST.includes(m.type as string));

  // If template mode, suggest switching to custom
  if (page?.templateType && page.templateType !== 'custom') {
    return (
      <div className="space-y-3">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Elemen</div>
        <div className="text-[9px] text-slate-500 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/20">
          Halaman ini menggunakan template. Elemen bebas hanya tersedia untuk halaman <b className="text-slate-300">Kosong</b>.
        </div>
        <button
          onClick={() => useCanvaStore.getState().setTemplateType('custom')}
          className="btn-accent w-full justify-center py-2"
        >
          Ubah ke Mode Kosong
        </button>
      </div>
    );
  }

  const handleDragStart = (e: React.DragEvent, typeId: string) => {
    e.dataTransfer.setData('elemType', typeId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Basic elements always available
  const basicElems = [
    { id: 'teks', icon: '🔤', name: 'Teks', note: 'Teks bebas', color: '#e2e8f0' },
    { id: 'shape', icon: '⬜', name: 'Shape', note: 'Kotak/warna', color: '#6366f1' },
  ];

  return (
    <div className="space-y-3">
      {/* ── Data-driven elements: Kuis ─────── */}
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">❓ Kuis ({kuis.length} soal)</div>
      {kuis.length > 0 ? (
        <button
          draggable
          onClick={() => addElement('kuis')}
          onDragStart={e => handleDragStart(e, 'kuis')}
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

      {/* ── Data-driven elements: Games ─────── */}
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">🎮 Game ({games.length})</div>
      {games.length > 0 ? (
        <div className="space-y-1.5">
          {games.map((g, i) => {
            const gIdx = authStore.modules.indexOf(g as (typeof authStore.modules)[0]);
            const iconMap: Record<string, string> = {
              truefalse: '✅', memory: '🧠', matching: '🔀', roda: '🎡',
              sorting: '🔢', spinwheel: '🎡', teambuzzer: '🏆', wordsearch: '🔍',
              flashcard: '🃏', crossword: '🔤', fillblank: '✏️', dragdrop: '🖐️',
            };
            return (
              <button
                key={i}
                draggable
                onClick={() => addGameElement(gIdx)}
                onDragStart={e => handleDragStart(e, 'game')}
                className="card-hover w-full flex items-center gap-2 p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 cursor-grab active:scale-95 transition-transform"
              >
                <span className="text-lg">{iconMap[g.type as string] || '🎮'}</span>
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

      {/* ── Data-driven elements: Materi/Modul ─────── */}
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">🧩 Modul ({materiModules.length})</div>
      {materiModules.length > 0 ? (
        <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
          {materiModules.map((m, i) => {
            const mIdx = authStore.modules.indexOf(m as (typeof authStore.modules)[0]);
            const moduleIconMap: Record<string, string> = {
              materi: '📖', infografis: '📊', accordion: '🗂️', 'tab-icons': '📑',
              'icon-explore': '🔍', timeline: '📅', hero: '🚀', kutipan: '💬',
              langkah: '👣', statistik: '📈', polling: '🗳️', embed: '🔗',
              comparison: '⚖️', 'card-showcase': '🎴', 'hotspot-image': '🗺️',
              video: '🎥', 'studi-kasus': '🔬', debat: '🗣️',
            };
            return (
              <button
                key={i}
                onClick={() => {
                  const store = useCanvaStore.getState();
                  const pages = store.pages;
                  const page = pages[store.currentPageIndex];
                  if (!page) return;
                  const typeInfo = { icon: moduleIconMap[m.type as string] || '🧩', name: (m.title as string) || (m.type as string) };
                  const el: CanvaElement = {
                    id: 'el_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                    type: 'modul',
                    icon: typeInfo.icon,
                    label: typeInfo.name,
                    x: 5, y: 10, w: 90, h: 60,
                    opacity: 100,
                    dataIdx: mIdx,
                    layoutVariant: (m.layoutVariant as 'A' | 'B' | 'C' | 'D') || 'A',
                  };
                  const newPages = [...pages];
                  newPages[store.currentPageIndex] = {
                    ...page,
                    elements: [...page.elements, el],
                  };
                  store._pushHistory();
                  useCanvaStore.setState({ pages: newPages, selectedElId: el.id });
                }}
                className="card-hover w-full flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 active:scale-95 transition-transform"
              >
                <span className="text-lg">{moduleIconMap[m.type as string] || '🧩'}</span>
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

      <div className="section-divider" />

      {/* ── Basic elements ─────── */}
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Elemen Dasar</div>
      <div className="text-[9px] text-slate-500">Klik untuk tambah, atau seret ke canvas</div>
      <div className="grid grid-cols-2 gap-2">
        {basicElems.map(t => (
          <button
            key={t.id}
            draggable
            onClick={() => addElement(t.id)}
            onDragStart={e => handleDragStart(e, t.id)}
            className="card-hover accent-top flex flex-col items-center gap-1 p-3 rounded-xl bg-slate-800/40 border border-slate-700/20 cursor-grab active:cursor-grabbing"
            style={{ '--accent-color': t.color } as React.CSSProperties}
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">{t.icon}</span>
            <span className="text-[11px] font-bold text-slate-200">{t.name}</span>
            <span className="text-[9px] text-slate-500">{t.note}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Ratio Tab ──────────────────────────────────────────────── */

function RatioContent() {
  const { ratioId, setRatio } = useCanvaStore();

  return (
    <div className="space-y-3">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rasio Halaman</div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { id: '16:9', name: '16:9', desc: 'Landscape PPT', w: 1280, h: 720 },
          { id: '9:16', name: '9:16', desc: 'Portrait HP', w: 720, h: 1280 },
          { id: '1:1', name: '1:1', desc: 'Square Post', w: 800, h: 800 },
          { id: 'A4', name: 'A4', desc: 'Dokumen LKS', w: 794, h: 1123 },
          { id: '4:3', name: '4:3', desc: 'Presentasi Lama', w: 1024, h: 768 },
        ].map(r => {
          const isActive = ratioId === r.id;
          const aspect = r.w / r.h;
          const tw = aspect >= 1 ? 56 : Math.round(56 * aspect);
          const th = aspect <= 1 ? 36 : Math.round(36 / aspect);
          return (
            <button
              key={r.id}
              onClick={() => setRatio(r.id)}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all ${
                isActive
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-slate-800/40 border-slate-700/20 text-slate-400 hover:border-slate-600'
              }`}
            >
              <div
                className={`rounded-md border ${isActive ? 'border-amber-400/30' : 'border-current/20'}`}
                style={{ width: tw, height: th }}
              />
              <div className="text-[10px] font-bold">{r.name}</div>
              <div className="text-[8px] opacity-60">{r.desc}</div>
              <div className="text-[8px] opacity-40">{r.w}×{r.h}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Layers Tab ─────────────────────────────────────────────── */

function LayersContent() {
  const { pages, currentPageIndex, selectedElId, selectElement, toggleElementVisibility, moveElementZ } = useCanvaStore();
  const page = pages[currentPageIndex];

  if (!page) return null;

  // For template pages, show template info instead
  if (page.templateType && page.templateType !== 'custom') {
    return (
      <div className="space-y-3">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Info Template</div>
        <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/20">
          <div className="text-[10px] font-bold text-amber-400 mb-1">
            {page.templateType === 'cover' ? '🏠 Cover' :
             page.templateType === 'dokumen' ? '📋 Dokumen' :
             page.templateType === 'materi' ? '📝 Materi' :
             page.templateType === 'kuis' ? '❓ Kuis' :
             page.templateType === 'game' ? '🎮 Game' :
             page.templateType === 'hasil' ? '🏆 Hasil' :
             page.templateType === 'hero' ? '🚀 Hero' :
             page.templateType === 'skenario' ? '🎭 Skenario' :
             '🧩 Template'}
          </div>
          <div className="text-[9px] text-slate-500">
            Template mengisi halaman secara otomatis dari data authoring. Edit teks langsung di canvas.
          </div>
        </div>
      </div>
    );
  }

  const elements = [...page.elements].reverse();
  const colors: Record<string, string> = {
    kuis: '#f5c842', game: '#3ecfcf', materi: '#a78bfa',
    modul: '#34d399', teks: '#fff', shape: '#6366f1',
  };

  return (
    <div className="space-y-2">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        Layer (atas = depan)
      </div>
      <div className="space-y-0.5">
        {elements.length === 0 && (
          <div className="text-[10px] text-slate-600 text-center py-4">Belum ada elemen</div>
        )}
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
                style={{ background: colors[el.type] || '#888' }}
              />
              <span className="text-[10px] font-medium flex-1 truncate">
                {el.icon} {el.label || el.type}
              </span>
              {/* Z-order up */}
              <button
                onClick={(e) => { e.stopPropagation(); moveElementZ(el.id, 'up'); }}
                className="btn-ghost w-6 h-6"
                title="Naik ke atas"
              >
                <ChevronUp size={10} />
              </button>
              {/* Z-order down */}
              <button
                onClick={(e) => { e.stopPropagation(); moveElementZ(el.id, 'down'); }}
                className="btn-ghost w-6 h-6"
                title="Turun ke bawah"
              >
                <ChevronDown size={10} />
              </button>
              {/* Visibility toggle */}
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
      {selectedElId && (
        <div className="section-divider" />
      )}
      {selectedElId && (
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
      )}
    </div>
  );
}
