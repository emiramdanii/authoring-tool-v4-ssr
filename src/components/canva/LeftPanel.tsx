'use client';

import { useState } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import type { LeftTab, PageTemplateType } from './types';
import { TEMPLATE_TYPES, GRADIENT_PRESETS } from './types';
import { toast } from 'sonner';

const TABS: { id: LeftTab; label: string; icon: string }[] = [
  { id: 'templates', label: 'Template', icon: '🧩' },
  { id: 'pages', label: 'Halaman', icon: '📄' },
  { id: 'elems', label: 'Elemen', icon: '📦' },
  { id: 'ratio', label: 'Rasio', icon: '📐' },
  { id: 'layers', label: 'Layer', icon: '🔲' },
];

export default function LeftPanel() {
  const { leftTab, setLeftTab, rightPanelOpen, toggleRightPanel } = useCanvaStore();

  return (
    <div className="w-56 min-w-[220px] flex flex-col bg-zinc-900/60 border-r border-zinc-700/50 overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-zinc-700/50 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setLeftTab(tab.id)}
            className={`flex-1 px-1 py-1.5 text-[9px] font-semibold transition-colors whitespace-nowrap ${
              leftTab === tab.id
                ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/5'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title={tab.label}
          >
            {tab.icon}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {leftTab === 'templates' && <TemplatesContent />}
        {leftTab === 'pages' && <PagesContent />}
        {leftTab === 'elems' && <ElementsContent />}
        {leftTab === 'ratio' && <RatioContent />}
        {leftTab === 'layers' && <LayersContent />}
      </div>

      {/* Bottom: Right Panel toggle */}
      <div className="p-2 border-t border-zinc-700/30">
        <button
          onClick={toggleRightPanel}
          className={`w-full py-1.5 rounded-lg text-[9px] font-bold transition-colors flex items-center justify-center gap-1.5 ${
            rightPanelOpen
              ? 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
          }`}
        >
          {rightPanelOpen ? '◂ Sembunyikan Panel Kanan' : '▸ Tampilkan Panel Kanan'}
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
    { key: 'utama', label: '🏠 Halaman Utama' },
    { key: 'konten', label: '📝 Konten' },
    { key: 'interaktif', label: '🎮 Interaktif' },
    { key: 'penutup', label: '🏆 Penutup' },
  ] as const;

  return (
    <div>
      {/* Auto Rakit Button */}
      <button
        onClick={autoRakit}
        className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-teal-500/20 border border-amber-500/30 text-[11px] font-bold text-amber-300 hover:from-amber-500/30 hover:to-teal-500/30 transition-all mb-3 flex items-center justify-center gap-1.5"
      >
        <span className="text-sm">⚡</span> Auto Rakit Halaman
      </button>

      {/* Data status */}
      <div className="text-[8px] text-zinc-500 mb-3 p-2 rounded-lg bg-zinc-800/40">
        <div className="font-bold text-zinc-400 mb-1">📦 Data Tersedia:</div>
        <div className="flex flex-wrap gap-1">
          {kuis.length > 0 && <span className="px-1 py-0.5 rounded bg-amber-500/10 text-amber-400">❓ {kuis.length} soal</span>}
          {games.length > 0 && <span className="px-1 py-0.5 rounded bg-teal-500/10 text-teal-400">🎮 {games.length} game</span>}
          {materiModules.length > 0 && <span className="px-1 py-0.5 rounded bg-purple-500/10 text-purple-400">📝 {materiModules.length} materi</span>}
          {authStore.skenario.length > 0 && <span className="px-1 py-0.5 rounded bg-pink-500/10 text-pink-400">🎭 skenario</span>}
          {kuis.length === 0 && games.length === 0 && materiModules.length === 0 && (
            <span className="text-zinc-600">Belum ada data — isi di panel lain dulu</span>
          )}
        </div>
      </div>

      {/* Template categories */}
      {categories.map(cat => {
        const templates = TEMPLATE_TYPES.filter(t => t.category === cat.key);
        if (templates.length === 0) return null;
        return (
          <div key={cat.key} className="mb-3">
            <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">{cat.label}</div>
            <div className="grid grid-cols-2 gap-1.5">
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => addTemplatePage(t.id)}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/30 hover:border-amber-500/20 transition-all group cursor-pointer active:scale-95"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">{t.icon}</span>
                  <span className="text-[10px] font-bold text-zinc-300">{t.name}</span>
                  <span className="text-[7px] text-zinc-500 text-center leading-tight">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {/* Gradient Presets */}
      <div className="mb-3">
        <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">🎨 Gradient Background</div>
        <div className="grid grid-cols-5 gap-1">
          {GRADIENT_PRESETS.map(g => (
            <button
              key={g.id}
              onClick={() => {
                useCanvaStore.getState().setBgColor(g.css);
                toastGradient(g.name);
              }}
              className="w-8 h-8 rounded-lg border border-zinc-700/30 hover:border-white/30 transition-all hover:scale-110"
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
  toast.success(`🎨 Gradient "${name}" diterapkan`);
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
    <div>
      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Halaman</div>
      <div className="grid grid-cols-2 gap-1.5">
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
              className={`relative rounded-lg overflow-hidden transition-all ${
                isActive
                  ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-zinc-900'
                  : 'hover:ring-1 hover:ring-zinc-600'
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
      <button
        onClick={() => addPage()}
        className="w-full mt-2 py-1.5 rounded-lg border border-dashed border-zinc-700 text-[11px] text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 transition-colors"
      >
        + Halaman Kosong
      </button>
      <div className="flex gap-1 mt-1.5">
        <button
          onClick={duplicatePage}
          className="flex-1 py-1 rounded text-[10px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          Duplikat
        </button>
        <button
          onClick={() => {
            if (pages.length <= 1) return;
            if (confirm(`Hapus "${pages[currentPageIndex].label}"?`)) deletePage();
          }}
          className="flex-1 py-1 rounded text-[10px] text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
        >
          Hapus
        </button>
      </div>
    </div>
  );
}

/* ── Elements Tab ───────────────────────────────────────────── */

function ElementsContent() {
  const { addElement, pages, currentPageIndex } = useCanvaStore();
  const page = pages[currentPageIndex];

  // If template mode, suggest switching to custom
  if (page?.templateType && page.templateType !== 'custom') {
    return (
      <div>
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Elemen</div>
        <div className="text-[9px] text-zinc-600 mb-2 p-2 rounded-lg bg-zinc-800/40">
          Halaman ini menggunakan template. Elemen bebas hanya tersedia untuk halaman <b className="text-zinc-400">Kosong</b>.
        </div>
        <button
          onClick={() => useCanvaStore.getState().setTemplateType('custom')}
          className="w-full py-1.5 rounded-lg border border-amber-500/30 text-[10px] font-bold text-amber-400 hover:bg-amber-500/10 transition-colors"
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

  return (
    <div>
      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Elemen Dasar</div>
      <div className="text-[9px] text-zinc-600 mb-2">Klik untuk tambah, atau seret ke canvas</div>
      <div className="grid grid-cols-2 gap-1.5">
        {[
          { id: 'kuis', icon: '❓', name: 'Kuis', note: 'Soal pilihan ganda' },
          { id: 'game', icon: '🎮', name: 'Game', note: 'Game interaktif' },
          { id: 'materi', icon: '📝', name: 'Materi', note: 'Konten materi' },
          { id: 'modul', icon: '🧩', name: 'Modul', note: 'Modul aktivitas' },
          { id: 'teks', icon: '🔤', name: 'Teks', note: 'Teks bebas' },
          { id: 'shape', icon: '⬜', name: 'Shape', note: 'Kotak/warna' },
        ].map(t => (
          <button
            key={t.id}
            draggable
            onClick={() => addElement(t.id)}
            onDragStart={e => handleDragStart(e, t.id)}
            className="flex flex-col items-center gap-1 p-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/30 hover:border-amber-500/20 transition-all group cursor-grab active:cursor-grabbing"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">{t.icon}</span>
            <span className="text-[10px] font-bold text-zinc-300">{t.name}</span>
            <span className="text-[8px] text-zinc-500">{t.note}</span>
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
    <div>
      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Rasio Halaman</div>
      <div className="grid grid-cols-2 gap-1.5">
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
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                isActive
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-zinc-800/40 border-zinc-700/30 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              <div
                className="rounded-sm border border-current/30"
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
      <div>
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Info Template</div>
        <div className="p-2 rounded-lg bg-zinc-800/40 border border-zinc-700/30">
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
          <div className="text-[8px] text-zinc-500">
            Template mengisi halaman secara otomatis dari data authoring. Edit teks langsung di canvas.
          </div>
        </div>
      </div>
    );
  }

  const elements = [...page.elements].reverse();

  return (
    <div>
      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
        Layer (atas = depan)
      </div>
      <div className="space-y-0.5">
        {elements.length === 0 && (
          <div className="text-[10px] text-zinc-600 text-center py-4">Belum ada elemen</div>
        )}
        {elements.map(el => {
          const colors: Record<string, string> = {
            kuis: '#f5c842', game: '#3ecfcf', materi: '#a78bfa',
            modul: '#34d399', teks: '#fff', shape: '#6366f1',
          };
          const isActive = el.id === selectedElId;
          return (
            <div
              key={el.id}
              onClick={() => selectElement(el.id)}
              className={`flex items-center gap-1.5 px-1.5 py-1 rounded-md cursor-pointer transition-colors ${
                isActive ? 'bg-amber-500/15 text-amber-300' : 'text-zinc-400 hover:bg-zinc-800/60'
              }`}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: colors[el.type] || '#888' }}
              />
              <span className="text-[10px] font-medium flex-1 truncate">
                {el.icon} {el.label || el.type}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); moveElementZ(el.id, 'up'); }}
                className="text-[9px] text-zinc-500 hover:text-zinc-200 px-0.5"
                title="Naik ke atas"
              >
                ↑
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); moveElementZ(el.id, 'down'); }}
                className="text-[9px] text-zinc-500 hover:text-zinc-200 px-0.5"
                title="Turun ke bawah"
              >
                ↓
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); toggleElementVisibility(el.id); }}
                className={`text-[9px] ${el.hidden ? 'text-zinc-700' : 'text-zinc-500 hover:text-zinc-200'}`}
                title={el.hidden ? 'Tampilkan' : 'Sembunyikan'}
              >
                👁
              </button>
            </div>
          );
        })}
      </div>
      {selectedElId && (
        <div className="flex gap-1 mt-2 pt-2 border-t border-zinc-700/30">
          <button
            onClick={() => moveElementZ(selectedElId, 'top')}
            className="flex-1 py-1 rounded text-[9px] text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            ↑ Ke paling atas
          </button>
          <button
            onClick={() => moveElementZ(selectedElId, 'bottom')}
            className="flex-1 py-1 rounded text-[9px] text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            ↓ Ke paling bawah
          </button>
        </div>
      )}
    </div>
  );
}
