'use client';

import { useRef, useState } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import type { NavConfig, PageTemplateType } from './types';
import { getPaletteColor } from '@/lib/color-palette';
import { TEMPLATE_TYPES } from './types';
import { LAYOUT_VARIANTS, type LayoutVariant } from '@/components/shared/PresetModuleCard';

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
  } = useCanvaStore();

  const page = pages[currentPageIndex];
  const selectedEl = page?.elements.find(e => e.id === selectedElId);
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
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggleCollapse = (key: string) => setCollapsed(p => ({ ...p, [key]: !p[key] }));

  if (!rightPanelOpen) return null;

  return (
    <div className="w-56 min-w-[224px] flex flex-col bg-zinc-900/60 border-l border-zinc-700/50 overflow-y-auto custom-scrollbar">

      {/* ── Page Template Type ──────────────────────────────────── */}
      <Section title="🧩 Tipe Halaman" collapsed={collapsed.template} onToggle={() => toggleCollapse('template')}>
        <select
          value={page?.templateType || 'custom'}
          onChange={(e) => setTemplateType(e.target.value as PageTemplateType)}
          className="w-full h-7 px-1.5 text-[10px] text-zinc-200 bg-zinc-800 border border-zinc-700/50 rounded focus:border-amber-500/50 focus:outline-none"
        >
          {TEMPLATE_TYPES.map(t => (
            <option key={t.id} value={t.id}>{t.icon} {t.name} — {t.desc}</option>
          ))}
        </select>
      </Section>

      {/* ── Background ──────────────────────────────────────────── */}
      <Section title="🖼️ Background" collapsed={collapsed.bg} onToggle={() => toggleCollapse('bg')}>
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
          className="w-full py-2.5 rounded-lg border border-dashed border-zinc-700 hover:border-amber-500/30 bg-zinc-800/40 hover:bg-zinc-800/60 transition-colors flex flex-col items-center gap-0.5"
        >
          <span className="text-base">📤</span>
          <span className="text-[9px] font-bold text-zinc-400">Upload PNG Canva</span>
          <span className="text-[7px] text-zinc-500">Warna otomatis dari gambar</span>
        </button>

        {/* Preview thumbnail */}
        {page?.bgDataUrl && (
          <div className="mt-2 rounded-lg overflow-hidden border border-zinc-700/30">
            <img src={page.bgDataUrl} alt="BG Preview" className="w-full h-14 object-cover" />
          </div>
        )}

        {/* Overlay slider */}
        <div className="mt-2">
          <label className="text-[10px] text-zinc-500 block mb-1">Overlay gelap: {page?.overlay || 20}%</label>
          <input
            type="range"
            min={0}
            max={60}
            value={page?.overlay || 20}
            onChange={e => setOverlay(parseInt(e.target.value))}
            className="w-full h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* BG Color */}
        <div className="mt-2">
          <label className="text-[10px] text-zinc-500 block mb-1">Warna BG</label>
          <input
            type="color"
            value={page?.bgColor?.startsWith('#') ? page.bgColor : '#1a1a2e'}
            onChange={e => setBgColor(e.target.value)}
            className="w-full h-7 rounded-md border border-zinc-700 cursor-pointer bg-zinc-800"
          />
        </div>
      </Section>

      {/* ── Color Palette ───────────────────────────────────────── */}
      {page?.colorPalette && page.colorPalette.colors.length > 0 && (
        <Section title="🎨 Palet Warna" collapsed={collapsed.palette} onToggle={() => toggleCollapse('palette')}>
          {/* Color swatches */}
          <div className="flex gap-1 mb-2">
            {page.colorPalette.colors.map((color, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-md border border-white/20 cursor-pointer hover:scale-110 transition-transform"
                style={{ background: color }}
                title={color}
              />
            ))}
          </div>

          {/* CSS variable mapping */}
          <div className="space-y-1">
            {Object.entries(page.colorPalette.mapping).map(([key, value]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded border border-white/20 flex-shrink-0" style={{ background: value }} />
                <span className="text-[8px] text-zinc-500 flex-1">{key}</span>
                <span className="text-[7px] text-zinc-600">{value}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Navigation Config ───────────────────────────────────── */}
      <Section title="🧭 Navigasi" collapsed={collapsed.nav} onToggle={() => toggleCollapse('nav')}>
        <label className="flex items-center gap-1.5 mb-1 cursor-pointer">
          <input
            type="checkbox"
            checked={page?.navConfig?.showNavbar ?? true}
            onChange={e => updateNavConfig({ showNavbar: e.target.checked })}
            className="accent-amber-500 w-3 h-3"
          />
          <span className="text-[9px] text-zinc-400">Navbar</span>
        </label>

        <label className="flex items-center gap-1.5 mb-1 cursor-pointer">
          <input
            type="checkbox"
            checked={page?.navConfig?.showPrevNext ?? true}
            onChange={e => updateNavConfig({ showPrevNext: e.target.checked })}
            className="accent-amber-500 w-3 h-3"
          />
          <span className="text-[9px] text-zinc-400">Tombol Prev/Next</span>
        </label>

        <label className="flex items-center gap-1.5 mb-1 cursor-pointer">
          <input
            type="checkbox"
            checked={page?.navConfig?.showScore ?? true}
            onChange={e => updateNavConfig({ showScore: e.target.checked })}
            className="accent-amber-500 w-3 h-3"
          />
          <span className="text-[9px] text-zinc-400">Tampilkan Skor</span>
        </label>

        <label className="flex items-center gap-1.5 mb-1 cursor-pointer">
          <input
            type="checkbox"
            checked={page?.navConfig?.showProgress ?? true}
            onChange={e => updateNavConfig({ showProgress: e.target.checked })}
            className="accent-amber-500 w-3 h-3"
          />
          <span className="text-[9px] text-zinc-400">Progress Bar</span>
        </label>

        {/* Navbar style */}
        <div className="mt-1.5">
          <label className="text-[9px] text-zinc-500 block mb-1">Style Navbar</label>
          <select
            value={page?.navConfig?.navbarStyle || 'colorful'}
            onChange={e => updateNavConfig({ navbarStyle: e.target.value as NavConfig['navbarStyle'] })}
            className="w-full h-6 px-1 text-[9px] text-zinc-200 bg-zinc-800 border border-zinc-700/50 rounded focus:border-amber-500/50 focus:outline-none"
          >
            <option value="colorful">🌈 Colorful</option>
            <option value="minimal">☐ Minimal</option>
            <option value="glass">🔮 Glass</option>
          </select>
        </div>
      </Section>

      {/* ── Element Properties (custom mode) ────────────────────── */}
      {!isTemplateMode && selectedEl && (
        <Section title="⚙️ Properti Elemen" collapsed={collapsed.props} onToggle={() => toggleCollapse('props')}>
          <PropInput label="X" value={Math.round(selectedEl.x)} onChange={v => updateElement(selectedEl.id, { x: v })} />
          <PropInput label="Y" value={Math.round(selectedEl.y)} onChange={v => updateElement(selectedEl.id, { y: v })} />
          <PropInput label="Lebar" value={Math.round(selectedEl.w)} onChange={v => updateElement(selectedEl.id, { w: v })} />
          <PropInput label="Tinggi" value={Math.round(selectedEl.h)} onChange={v => updateElement(selectedEl.id, { h: v })} />
          <PropInput label="Opacity" value={selectedEl.opacity || 100} min={0} max={100} onChange={v => updateElement(selectedEl.id, { opacity: v })} />

          {/* Teks-specific props */}
          {selectedEl.type === 'teks' && (
            <>
              <PropInput label="Font" value={selectedEl.fontSize || 20} min={8} max={72} onChange={v => updateElement(selectedEl.id, { fontSize: v })} />
              <div className="flex items-center gap-1.5 mb-1.5 mt-1">
                <span className="text-[10px] text-zinc-500 w-10">Warna</span>
                <input
                  type="color"
                  value={selectedEl.textColor?.startsWith('#') ? selectedEl.textColor : '#ffffff'}
                  onChange={e => updateElement(selectedEl.id, { textColor: e.target.value })}
                  className="flex-1 h-6 rounded border border-zinc-700 cursor-pointer bg-zinc-800"
                />
              </div>
            </>
          )}

          {/* Shape-specific props */}
          {selectedEl.type === 'shape' && (
            <>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] text-zinc-500 w-10">Warna</span>
                <input
                  type="color"
                  value={selectedEl.color?.startsWith('#') ? selectedEl.color : '#ffffff'}
                  onChange={e => updateElement(selectedEl.id, { color: e.target.value })}
                  className="flex-1 h-6 rounded border border-zinc-700 cursor-pointer bg-zinc-800"
                />
              </div>
              <PropInput label="Radius" value={selectedEl.radius || 8} min={0} max={50} onChange={v => updateElement(selectedEl.id, { radius: v })} />
            </>
          )}

          {/* Data reference */}
          {(selectedEl.type === 'kuis' || selectedEl.type === 'game' || selectedEl.type === 'modul') && (
            <PropInput
              label="Data"
              value={selectedEl.dataIdx ?? -1}
              min={-1}
              onChange={v => updateElement(selectedEl.id, { dataIdx: v })}
            />
          )}

          {/* Layout Variant Picker for modul/materi elements */}
          {(selectedEl.type === 'modul' || selectedEl.type === 'materi') && (
            <div className="mt-2 mb-1">
              <label className="text-[10px] text-zinc-500 block mb-1">Layout Variant</label>
              <div className="flex gap-1">
                {LAYOUT_VARIANTS.map(v => {
                  const current = (selectedEl.layoutVariant as LayoutVariant) || 'A';
                  return (
                    <button
                      key={v.id}
                      onClick={() => updateElement(selectedEl.id, { layoutVariant: v.id })}
                      className={`px-2 py-1 rounded text-[9px] font-bold transition-colors ${
                        current === v.id ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
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
            className="w-full mt-2 py-1.5 rounded-md text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            Hapus Elemen
          </button>
        </Section>
      )}

      {/* ── Template Edit Info (template mode) ──────────────────── */}
      {isTemplateMode && (
        <Section title="📝 Edit Template" collapsed={collapsed.templateEdit} onToggle={() => toggleCollapse('templateEdit')}>
          <div className="text-[8px] text-zinc-500 p-2 rounded-lg bg-zinc-800/40">
            Klik langsung teks di canvas untuk mengedit. Data otomatis diambil dari panel authoring.
          </div>

          {/* Quick edit for common template fields */}
          {page.templateData && (
            <div className="mt-2 space-y-1">
              {Object.entries(page.templateData)
                .filter(([_, v]) => typeof v === 'string' && v.length < 100)
                .slice(0, 5)
                .map(([key, value]) => (
                  <div key={key}>
                    <label className="text-[8px] text-zinc-500 block mb-0.5">{key}</label>
                    <input
                      type="text"
                      value={String(value)}
                      onChange={e => updateTemplateData(key, e.target.value)}
                      className="w-full h-6 px-1.5 text-[9px] text-zinc-200 bg-zinc-800 border border-zinc-700/50 rounded focus:border-amber-500/50 focus:outline-none"
                    />
                  </div>
                ))}
            </div>
          )}
        </Section>
      )}

      {/* ── Layers Mini ─────────────────────────────────────────── */}
      {!isTemplateMode && (
        <Section title="🔲 Layer" collapsed={collapsed.layers} onToggle={() => toggleCollapse('layers')}>
          <LayerMiniList />
        </Section>
      )}

      {/* ── Page Info (always visible at bottom) ────────────────── */}
      {page && (
        <div className="mt-auto p-2 border-t border-zinc-700/30">
          <div className="text-[8px] text-zinc-600">
            Halaman {currentPageIndex + 1}/{pages.length} • {page.templateType || 'custom'}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Collapsible Section ──────────────────────────────────────── */

function Section({
  title,
  collapsed: isCollapsed,
  onToggle,
  children,
}: {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-zinc-700/30">
      <button
        onClick={onToggle}
        className="w-full p-2 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
      >
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{title}</span>
        <span className="text-[8px] text-zinc-600">{isCollapsed ? '▸' : '▾'}</span>
      </button>
      {!isCollapsed && (
        <div className="px-2 pb-2">
          {children}
        </div>
      )}
    </div>
  );
}

/* ── PropInput ────────────────────────────────────────────────── */

function PropInput({ label, value, min, max, onChange }: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <span className="text-[10px] text-zinc-500 w-10">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="flex-1 h-6 px-1.5 text-[10px] text-zinc-200 bg-zinc-800 border border-zinc-700/50 rounded focus:border-amber-500/50 focus:outline-none"
      />
    </div>
  );
}

/* ── LayerMiniList ────────────────────────────────────────────── */

function LayerMiniList() {
  const { pages, currentPageIndex, selectedElId, selectElement, toggleElementVisibility } = useCanvaStore();
  const page = pages[currentPageIndex];
  if (!page) return null;

  const elements = [...page.elements].reverse();

  return (
    <div className="space-y-0.5">
      {elements.length === 0 && (
        <div className="text-[9px] text-zinc-600 text-center py-2">Kosong</div>
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
            className={`flex items-center gap-1.5 px-1.5 py-1 rounded cursor-pointer transition-colors ${
              isActive ? 'bg-amber-500/15 text-amber-300' : 'text-zinc-500 hover:bg-zinc-800/40'
            }`}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colors[el.type] || '#888' }} />
            <span className="text-[9px] flex-1 truncate">{el.icon} {el.label || el.type}</span>
            <button
              onClick={e => { e.stopPropagation(); toggleElementVisibility(el.id); }}
              className="text-[9px] opacity-60 hover:opacity-100"
            >
              👁
            </button>
          </div>
        );
      })}
    </div>
  );
}
