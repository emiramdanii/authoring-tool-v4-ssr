'use client';

import { useRef, useState } from 'react';
import {
  LayoutTemplate,
  LayoutGrid,
  Grid3X3,
  Image as ImageIcon,
  Upload,
  Palette,
  Compass,
  Settings2,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Zap,
  Copy,
  Layers,
} from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import type { NavConfig, PageTemplateType } from './types';

import { TEMPLATE_TYPES, LAYOUT_PRESETS, GRADIENT_PRESETS } from './types';
import { LAYOUT_VARIANTS, type LayoutVariant } from '@/components/shared/PresetModuleCard';
import { GAME_TYPES } from '@/lib/canva-export-helpers';
import { GAME_TYPE_ICON_MAP, MODULE_TYPE_ICON_MAP, ELEMENT_TYPE_COLORS, TEMPLATE_BADGE_MAP } from '@/lib/canva-icon-maps';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════
// Phase 2: RightPanel redesign — 5 sections instead of 9
// Structure:
//   1. 📋 Properti Elemen — ALWAYS visible when element selected (not collapsible)
//   2. 🖼️ Background — BG + Gradient merged from LeftPanel
//   3. 🎨 Palet Warna — only if palette exists
//   4. 🧭 Navigasi — navbar config
//   5. ⚙️ Pengaturan Halaman — Tipe Halaman + Layout + Grid/Snap + Template Edit
// Removed: Layer mini (already in LeftPanel Layer tab)
// ═══════════════════════════════════════════════════════════════

export default function RightPanel() {
  const {
    pages,
    currentPageIndex,
    selectedElId,
    setBgColor,
    setBgImage,
    setOverlay,
    updateElement,
    deleteSelected,
    updateNavConfig,
    setPaletteMapping,
    setTemplateType,
    updateTemplateData,
    rightPanelOpen,
    showGrid,
    gridSize,
    snapEnabled,
    toggleGrid,
    setGridSize,
    toggleSnap,
    applyLayoutPreset,
    currentLayoutPreset,
  } = useCanvaStore();

  const page = pages[currentPageIndex];
  // Also search overlayElements for the selected element
  const selectedEl = page?.elements.find(e => e.id === selectedElId)
    || page?.overlayElements?.find(e => e.id === selectedElId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isTemplateMode = page?.templateType && page.templateType !== 'custom';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) setBgImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // ── Collapsible section state ────────────────────────────────
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    bg: false,
    palette: false,
    nav: true,
    settings: true,
  });
  const toggleCollapse = (key: string) => setCollapsed(p => ({ ...p, [key]: !p[key] }));

  if (!rightPanelOpen) return null;

  return (
    <div className="w-60 min-w-[240px] flex flex-col glass-panel overflow-y-auto custom-scrollbar">

      {/* ═══ Section 1: Properti Elemen — ALWAYS VISIBLE (not collapsible) ═══ */}
      {selectedEl && (
        <div className="border-b border-amber-500/10">
          <div className="px-3 py-2 flex items-center gap-1.5 bg-amber-500/5">
            <Settings2 size={12} className="text-amber-400" />
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest">Properti Elemen</span>
          </div>
          <div className="px-3 pb-3 pt-2 space-y-1">
            {/* Element badge */}
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: ELEMENT_TYPE_COLORS[selectedEl.type] || '#888' }}
              />
              <span className="text-[11px] font-bold text-slate-200 truncate">
                {selectedEl.icon} {selectedEl.label || selectedEl.type}
              </span>
              {/* Quick duplicate */}
              <button
                onClick={() => {
                  const store = useCanvaStore.getState();
                  const pages = store.pages;
                  const page = pages[store.currentPageIndex];
                  if (!page) return;
                  const newEl: typeof selectedEl = {
                    ...selectedEl,
                    id: 'el_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                    x: selectedEl.x + 2,
                    y: selectedEl.y + 2,
                  };
                  store._pushHistory();
                  const isOverlay = (page.overlayElements || []).some(oe => oe.id === selectedEl.id);
                  const newPages = [...pages];
                  if (isOverlay) {
                    newPages[store.currentPageIndex] = {
                      ...page,
                      overlayElements: [...(page.overlayElements || []), newEl],
                    };
                  } else {
                    newPages[store.currentPageIndex] = {
                      ...page,
                      elements: [...page.elements, newEl],
                    };
                  }
                  useCanvaStore.setState({ pages: newPages, selectedElId: newEl.id });
                  toast.success('Elemen diduplikasi');
                }}
                className="btn-ghost w-6 h-6 ml-auto"
                title="Duplikat elemen"
              >
                <Copy size={10} />
              </button>
            </div>

            {/* Position & size */}
            <PropInput label="X" value={Math.round(selectedEl.x)} onChange={v => updateElement(selectedEl.id, { x: v })} />
            <PropInput label="Y" value={Math.round(selectedEl.y)} onChange={v => updateElement(selectedEl.id, { y: v })} />
            <PropInput label="Lebar" value={Math.round(selectedEl.w)} onChange={v => updateElement(selectedEl.id, { w: v })} />
            <PropInput label="Tinggi" value={Math.round(selectedEl.h)} onChange={v => updateElement(selectedEl.id, { h: v })} />
            <PropInput label="Opacity" value={selectedEl.opacity || 100} min={0} max={100} onChange={v => updateElement(selectedEl.id, { opacity: v })} />

            {/* Teks-specific props */}
            {selectedEl.type === 'teks' && (
              <>
                <PropInput label="Font" value={selectedEl.fontSize || 20} min={8} max={72} onChange={v => updateElement(selectedEl.id, { fontSize: v })} />
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-slate-500 w-14">Warna</span>
                  <input
                    type="color"
                    value={selectedEl.textColor?.startsWith('#') ? selectedEl.textColor : '#ffffff'}
                    onChange={e => updateElement(selectedEl.id, { textColor: e.target.value })}
                    className="flex-1 h-7 rounded-lg border border-slate-700/30 cursor-pointer bg-slate-800/60"
                  />
                </div>
              </>
            )}

            {/* Shape-specific props */}
            {selectedEl.type === 'shape' && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-slate-500 w-14">Warna</span>
                  <input
                    type="color"
                    value={selectedEl.color?.startsWith('#') ? selectedEl.color : '#ffffff'}
                    onChange={e => updateElement(selectedEl.id, { color: e.target.value })}
                    className="flex-1 h-7 rounded-lg border border-slate-700/30 cursor-pointer bg-slate-800/60"
                  />
                </div>
                <PropInput label="Radius" value={selectedEl.radius || 8} min={0} max={50} onChange={v => updateElement(selectedEl.id, { radius: v })} />
              </>
            )}

            {/* Data reference — dropdown with module names */}
            {(selectedEl.type === 'kuis' || selectedEl.type === 'game' || selectedEl.type === 'modul') && (
              <DataIdxSelector
                elementType={selectedEl.type}
                currentIdx={selectedEl.dataIdx ?? -1}
                onChange={v => updateElement(selectedEl.id, { dataIdx: v })}
              />
            )}

            {/* Layout Variant Picker for modul/materi elements */}
            {(selectedEl.type === 'modul' || selectedEl.type === 'materi') && (
              <div className="mt-2 mb-1">
                <label className="text-[10px] text-slate-500 block mb-1">Layout Variant</label>
                <div className="flex gap-1">
                  {LAYOUT_VARIANTS.map(v => {
                    const current = (selectedEl.layoutVariant as LayoutVariant) || 'A';
                    return (
                      <button
                        key={v.id}
                        onClick={() => updateElement(selectedEl.id, { layoutVariant: v.id })}
                        className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-colors ${
                          current === v.id ? 'bg-amber-500 text-slate-900' : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60'
                        }`}
                        title={v.desc}
                      >
                        {v.icon} {v.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={deleteSelected}
              className="btn-danger w-full mt-3"
            >
              <Trash2 size={12} />
              Hapus Elemen
            </button>
          </div>
        </div>
      )}

      {/* ═══ Section 2: Background + Gradient (merged) ═══ */}
      <Section
        icon={<ImageIcon size={12} />}
        title="Background"
        collapsed={collapsed.bg}
        onToggle={() => toggleCollapse('bg')}
      >
        {/* Upload area */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-2.5 rounded-xl border border-dashed border-slate-600 hover:border-amber-500/30 bg-slate-800/30 hover:bg-slate-800/50 transition-colors flex flex-col items-center gap-1"
        >
          <Upload size={16} className="text-slate-400" />
          <span className="text-[9px] font-bold text-slate-400">Upload PNG Canva</span>
          <span className="text-[7px] text-slate-500">Warna otomatis dari gambar</span>
        </button>

        {/* Preview thumbnail */}
        {page?.bgDataUrl && (
          <div className="mt-2 rounded-xl overflow-hidden border border-slate-700/30">
            <img src={page.bgDataUrl} alt="BG Preview" className="w-full h-14 object-cover" />
          </div>
        )}

        {/* Overlay slider */}
        <div className="mt-2">
          <label className="text-[10px] text-slate-500 block mb-1">Overlay gelap: {page?.overlay || 20}%</label>
          <input
            type="range"
            min={0}
            max={60}
            value={page?.overlay || 20}
            onChange={e => setOverlay(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* BG Color */}
        <div className="mt-2">
          <label className="text-[10px] text-slate-500 block mb-1">Warna BG</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={page?.bgColor?.startsWith('#') ? page.bgColor : '#1a1a2e'}
              onChange={e => setBgColor(e.target.value)}
              className="w-full h-7 rounded-lg border border-slate-700/30 cursor-pointer bg-slate-800/60 flex-1"
            />
            {page?.bgColor && !page.bgColor.startsWith('#') && (
              <div className="w-7 h-7 rounded-lg border border-slate-700/30 flex-shrink-0"
                style={{ background: page.bgColor }}
                title="Gradient aktif — klik warna untuk override"
              />
            )}
          </div>
        </div>

        {/* Gradient Presets — moved from LeftPanel Tab Template */}
        <div className="mt-3">
          <label className="text-[10px] text-slate-500 block mb-1.5">Gradient Presets</label>
          <div className="grid grid-cols-5 gap-1">
            {GRADIENT_PRESETS.map(g => (
              <button
                key={g.id}
                onClick={() => setBgColor(g.css)}
                className={`w-full aspect-square rounded-lg border transition-all hover:scale-110 ${
                  page?.bgColor === g.css
                    ? 'border-amber-400 ring-1 ring-amber-400/50'
                    : 'border-slate-700/30 hover:border-slate-600'
                }`}
                style={{ background: g.css }}
                title={g.name}
              />
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ Section 3: Color Palette ═══ */}
      {page?.colorPalette && page.colorPalette.colors.length > 0 && (
        <Section
          icon={<Palette size={12} />}
          title="Palet Warna"
          collapsed={collapsed.palette}
          onToggle={() => toggleCollapse('palette')}
        >
          {/* Color swatches */}
          <div className="flex gap-1 mb-2">
            {page.colorPalette.colors.map((color, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-lg border border-white/20 cursor-pointer hover:scale-110 transition-transform"
                style={{ background: color }}
                title={color}
              />
            ))}
          </div>

          {/* CSS variable mapping */}
          <div className="space-y-1">
            {Object.entries(page.colorPalette.mapping).map(([key, value]) => (
              <div key={key} className="flex items-center gap-1.5 rounded-md bg-slate-800/30 px-1.5 py-1">
                <div className="w-4 h-4 rounded border border-white/20 flex-shrink-0" style={{ background: value }} />
                <span className="text-[8px] text-slate-500 flex-1">{key}</span>
                <span className="text-[7px] text-slate-600">{value}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ═══ Section 4: Navigation Config ═══ */}
      <Section
        icon={<Compass size={12} />}
        title="Navigasi"
        collapsed={collapsed.nav}
        onToggle={() => toggleCollapse('nav')}
      >
        <label className="flex items-center gap-1.5 mb-1 cursor-pointer">
          <input
            type="checkbox"
            checked={page?.navConfig?.showNavbar ?? true}
            onChange={e => updateNavConfig({ showNavbar: e.target.checked })}
            className="accent-amber-500 w-3 h-3"
          />
          <span className="text-[9px] text-slate-400">Navbar</span>
        </label>

        <label className="flex items-center gap-1.5 mb-1 cursor-pointer">
          <input
            type="checkbox"
            checked={page?.navConfig?.showPrevNext ?? true}
            onChange={e => updateNavConfig({ showPrevNext: e.target.checked })}
            className="accent-amber-500 w-3 h-3"
          />
          <span className="text-[9px] text-slate-400">Tombol Prev/Next</span>
        </label>

        <label className="flex items-center gap-1.5 mb-1 cursor-pointer">
          <input
            type="checkbox"
            checked={page?.navConfig?.showScore ?? true}
            onChange={e => updateNavConfig({ showScore: e.target.checked })}
            className="accent-amber-500 w-3 h-3"
          />
          <span className="text-[9px] text-slate-400">Tampilkan Skor</span>
        </label>

        <label className="flex items-center gap-1.5 mb-1 cursor-pointer">
          <input
            type="checkbox"
            checked={page?.navConfig?.showProgress ?? true}
            onChange={e => updateNavConfig({ showProgress: e.target.checked })}
            className="accent-amber-500 w-3 h-3"
          />
          <span className="text-[9px] text-slate-400">Progress Bar</span>
        </label>

        {/* Navbar style */}
        <div className="mt-1.5">
          <label className="text-[9px] text-slate-500 block mb-1">Style Navbar</label>
          <select
            value={page?.navConfig?.navbarStyle || 'colorful'}
            onChange={e => updateNavConfig({ navbarStyle: e.target.value as NavConfig['navbarStyle'] })}
            className="w-full h-7 px-2 text-[10px] text-slate-200 bg-slate-800/60 border border-slate-700/30 rounded-lg focus:border-amber-500/50 focus:outline-none focus-ring"
          >
            <option value="colorful">Colorful</option>
            <option value="minimal">Minimal</option>
            <option value="glass">Glass</option>
          </select>
        </div>
      </Section>

      {/* ═══ Section 5: Pengaturan Halaman (merged: Tipe + Layout + Grid + Template Edit) ═══ */}
      <Section
        icon={<LayoutTemplate size={12} />}
        title="Pengaturan Halaman"
        collapsed={collapsed.settings}
        onToggle={() => toggleCollapse('settings')}
      >
        {/* Jenis Halaman */}
        <div className="mb-3">
          <label className="text-[10px] text-slate-500 block mb-1">Jenis Halaman</label>
          <select
            value={page?.templateType || 'custom'}
            onChange={(e) => setTemplateType(e.target.value as PageTemplateType)}
            className="w-full h-8 px-2 text-[11px] text-slate-200 bg-slate-800/60 border border-slate-700/30 rounded-lg focus:border-amber-500/50 focus:outline-none focus-ring"
          >
            {TEMPLATE_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.icon} {t.name} — {t.desc}</option>
            ))}
          </select>
        </div>

        {/* Layout Presets (custom mode only) */}
        {!isTemplateMode && (
          <div className="mb-3">
            <label className="text-[10px] text-slate-500 block mb-1">Layout Preset</label>
            <div className="grid grid-cols-3 gap-1.5">
              {LAYOUT_PRESETS.map(p => {
                const isActive = currentLayoutPreset()?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => applyLayoutPreset(p.id)}
                    className={`card-hover flex flex-col items-center gap-0.5 rounded-xl p-2 border text-center transition-all ${
                      isActive
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                        : 'border-slate-700/20 text-slate-400'
                    }`}
                    title={p.desc}
                  >
                    <span className="text-sm">{p.icon}</span>
                    <span className="text-[7px] font-bold leading-tight">{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Grid & Snap (custom mode only) */}
        {!isTemplateMode && (
          <div className="mb-3">
            <label className="text-[10px] text-slate-500 block mb-1.5">Grid & Snap</label>
            <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={toggleGrid}
                className="accent-amber-500 w-3 h-3"
              />
              <span className="text-[9px] text-slate-400">Tampilkan Grid</span>
            </label>
            <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={snapEnabled}
                onChange={toggleSnap}
                className="accent-amber-500 w-3 h-3"
              />
              <span className="text-[9px] text-slate-400">Snap ke Grid</span>
            </label>
            <div className="mt-1">
              <label className="text-[9px] text-slate-500 block mb-1">Ukuran Grid: {gridSize}%</label>
              <input
                type="range"
                min={2}
                max={20}
                step={1}
                value={gridSize}
                onChange={e => setGridSize(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[7px] text-slate-600 mt-0.5">
                <span>Halus (2%)</span>
                <span>Kasar (20%)</span>
              </div>
            </div>
          </div>
        )}

        {/* Template Edit (template mode only) */}
        {isTemplateMode && (
          <div className="mb-2">
            <div className="text-[10px] font-bold text-amber-400 mb-1.5">
              {TEMPLATE_BADGE_MAP[page.templateType]?.icon || ''} {TEMPLATE_BADGE_MAP[page.templateType]?.name || page.templateType} Template
            </div>
            <div className="rounded-xl bg-slate-800/40 border border-slate-700/20 p-2 mb-2">
              <span className="text-[8px] text-slate-500">
                Klik langsung teks di canvas untuk mengedit. Data otomatis diambil dari panel authoring.
              </span>
            </div>

            {/* Refresh Data button */}
            <button
              onClick={() => {
                const store = useCanvaStore.getState();
                store.setTemplateType(page.templateType);
                toast.success('Data template diperbarui dari panel authoring');
              }}
              className="btn-accent w-full justify-center py-2 mb-2"
            >
              <Zap size={12} />
              Refresh Data dari Authoring
            </button>

            {/* Quick edit for common template fields */}
            {page.templateData && (
              <div className="space-y-1">
                {Object.entries(page.templateData)
                  .filter(([_, v]) => typeof v === 'string' && v.length < 100)
                  .slice(0, 5)
                  .map(([key, value]) => (
                    <div key={key}>
                      <label className="text-[8px] text-slate-500 block mb-0.5">{key}</label>
                      <input
                        type="text"
                        value={String(value)}
                        onChange={e => updateTemplateData(key, e.target.value)}
                        className="w-full h-7 px-2 text-[10px] text-slate-200 bg-slate-800/60 border border-slate-700/30 rounded-lg focus:border-amber-500/50 focus:outline-none focus-ring"
                      />
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </Section>

      {/* ── Page Info (always visible at bottom) ───────────────── */}
      {page && (
        <div className="mt-auto">
          <div className="section-divider" />
          <div className="p-2">
            <div className="text-[9px] text-slate-600">
              Halaman {currentPageIndex + 1}/{pages.length} &middot; {TEMPLATE_BADGE_MAP[page.templateType]?.name || page.templateType}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Data Index Selector (dropdown with module names) ──────── */

function DataIdxSelector({ elementType, currentIdx, onChange }: {
  elementType: string;
  currentIdx: number;
  onChange: (idx: number) => void;
}) {
  const modules = useAuthoringStore((s) => s.modules);
  const kuis = useAuthoringStore((s) => s.kuis.filter(k => k.q.trim()));

  // Build options based on element type
  let options: { idx: number; label: string; icon: string }[] = [];

  if (elementType === 'kuis') {
    options = [{ idx: -1, label: `Semua soal (${kuis.length})`, icon: '?' }];
  } else if (elementType === 'game') {
    const gameModules = modules.filter(m => (GAME_TYPES as readonly string[]).includes(m.type as string));
    options = gameModules.map((m, i) => {
      const mIdx = modules.indexOf(m);
      return { idx: mIdx, label: String(m.title || m.type), icon: GAME_TYPE_ICON_MAP[m.type as string] || '🎮' };
    });
    if (options.length === 0) {
      options = [{ idx: -1, label: 'Belum ada game', icon: '🎮' }];
    }
  } else {
    // modul / materi — show non-game modules
    const materiModules = modules.filter(m => !(GAME_TYPES as readonly string[]).includes(m.type as string));
    options = materiModules.map((m) => {
      const mIdx = modules.indexOf(m);
      return { idx: mIdx, label: String(m.title || m.type), icon: MODULE_TYPE_ICON_MAP[m.type as string] || '🧩' };
    });
    if (options.length === 0) {
      options = [{ idx: -1, label: 'Belum ada modul', icon: '🧩' }];
    }
  }

  return (
    <div className="mb-2">
      <label className="text-[10px] text-slate-500 block mb-1">Pilih Data</label>
      <select
        value={currentIdx}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full h-8 px-2 text-[11px] text-slate-200 bg-slate-800/60 border border-slate-700/30 rounded-lg focus:border-amber-500/50 focus:outline-none focus-ring"
      >
        {options.map(opt => (
          <option key={opt.idx} value={opt.idx}>
            {opt.icon} {opt.label}
          </option>
        ))}
      </select>
      {currentIdx === -1 && elementType !== 'kuis' && (
        <div className="text-[8px] text-amber-400/60 mt-1">
          Pilih modul spesifik atau tambah data di panel Konten
        </div>
      )}
    </div>
  );
}

/* ── Collapsible Section ──────────────────────────────────────── */

function Section({
  icon,
  title,
  collapsed: isCollapsed,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="section-divider" />
      <button
        onClick={onToggle}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-800/30 transition-colors duration-150"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">{icon}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</span>
        </div>
        {isCollapsed ? (
          <ChevronRight size={12} className="text-slate-600" />
        ) : (
          <ChevronDown size={12} className="text-slate-600" />
        )}
      </button>
      {!isCollapsed && (
        <div className="px-3 pb-3 page-transition">
          {children}
        </div>
      )}
    </div>
  );
}

/* ── PropInput ─────────────────────────────────────────────────── */

function PropInput({ label, value, min, max, onChange }: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[10px] text-slate-500 w-14">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="flex-1 h-7 px-2 text-[10px] text-slate-200 bg-slate-800/60 border border-slate-700/30 rounded-lg focus:border-amber-500/50 focus:outline-none focus-ring"
      />
    </div>
  );
}
