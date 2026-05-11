'use client';

import { LayoutTemplate, Zap, Square } from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
import { LAYOUT_PRESETS } from '../types';
import type { PageTemplateType, CanvaPage } from '../types';
import { TEMPLATE_BADGE_MAP } from '@/lib/canva-icon-maps';
import { getAllPresets } from '@/core/preset/PagePresetRegistry';
import { toast } from 'sonner';
import Section from './Section';
import { Button } from '@/components/ui/button';

interface PageSettingsSectionProps {
  page: CanvaPage | undefined;
  currentPageIndex: number;
  isTemplateMode: boolean;
  setTemplateType: (type: PageTemplateType) => void;
  updateTemplateData: (key: string, value: unknown) => void;
  applyLayoutPreset: (id: string) => void;
  currentLayoutPreset: () => { id: string } | undefined;
  showGrid: boolean;
  gridSize: number;
  snapEnabled: boolean;
  toggleGrid: () => void;
  setGridSize: (size: number) => void;
  toggleSnap: () => void;
  setVariant: (variant: 'A' | 'B' | 'C') => void;
  collapsed: boolean;
  onToggle: () => void;
}

export default function PageSettingsSection({
  page,
  isTemplateMode,
  setTemplateType,
  updateTemplateData,
  applyLayoutPreset,
  currentLayoutPreset,
  showGrid,
  gridSize,
  snapEnabled,
  toggleGrid,
  setGridSize,
  toggleSnap,
  setVariant,
  collapsed,
  onToggle,
}: PageSettingsSectionProps) {
  return (
    <Section
      icon={<LayoutTemplate size={12} />}
      title="Pengaturan Halaman"
      collapsed={collapsed}
      onToggle={onToggle}
    >
      {/* Jenis Halaman */}
      <div className="mb-3">
        <label className="text-[10px] text-slate-500 block mb-1">Jenis Halaman</label>
        <select
          value={page?.templateType || 'custom'}
          onChange={(e) => {
            const newType = e.target.value as PageTemplateType;
            const hasElements = (page?.elements?.length || 0) > 0;
            if (hasElements) {
              const confirmed = confirm(
                'Mengubah jenis halaman akan menghapus semua elemen yang ada.\n\n' +
                '⚠️ Elemen yang sudah ditempatkan akan hilang.\n' +
                'Tindakan ini bisa di-undo (Ctrl+Z).\n\n' +
                'Lanjutkan?'
              );
              if (!confirmed) return;
            }
            setTemplateType(newType);
          }}
          className="w-full h-8 px-2 text-[11px] text-slate-200 bg-slate-800/60 border border-slate-700/30 rounded-lg focus:border-amber-500/50 focus:outline-none focus-ring"
        >
          {getAllPresets().map(p => (
            <option key={p.id} value={p.id}>{p.icon} {p.label} — {p.description}</option>
          ))}
        </select>
      </div>

      {/* Phase 3: Template Layout Variant picker — available for all template types */}
      {isTemplateMode && page && (
        <div className="mb-3">
          <label className="text-[10px] text-slate-500 block mb-1.5">Varian Tampilan</label>
          <div className="flex gap-1.5">
            {(page.templateType === 'cover'
              ? [
                  { id: 'A', label: 'Centered', icon: <Square size={12} /> },
                  { id: 'B', label: 'Left Align', icon: '▐▌' },
                  { id: 'C', label: 'Split', icon: '◧◨' },
                ]
              : page.templateType === 'materi'
                ? [
                    { id: 'A', label: 'Vertical', icon: '☰' },
                    { id: 'B', label: 'Grid 2-Kolom', icon: '▥' },
                  ]
              : page.templateType === 'kuis'
                ? [
                    { id: 'A', label: 'Widget', icon: <Square size={12} /> },
                    { id: 'B', label: 'Daftar Kartu', icon: '☵' },
                  ]
              : page.templateType === 'skenario'
                ? [
                    { id: 'A', label: 'Interaktif', icon: <Square size={12} /> },
                    { id: 'B', label: 'Timeline', icon: '┃' },
                  ]
              : page.templateType === 'dokumen'
                ? [
                    { id: 'A', label: 'Tab', icon: <Square size={12} /> },
                    { id: 'B', label: 'Side Nav', icon: '▐▌' },
                  ]
              : page.templateType === 'hasil'
                ? [
                    { id: 'A', label: 'Centered', icon: <Square size={12} /> },
                    { id: 'B', label: 'Dashboard', icon: '▥' },
                  ]
              : page.templateType === 'penutup'
                ? [
                    { id: 'A', label: 'Kartu', icon: <Square size={12} /> },
                    { id: 'B', label: 'Checklist', icon: '☑' },
                  ]
              : page.templateType === 'hero'
                ? [
                    { id: 'A', label: 'Centered', icon: <Square size={12} /> },
                    { id: 'B', label: 'Split', icon: '◧◨' },
                  ]
              : page.templateType === 'petunjuk'
                ? [
                    { id: 'A', label: 'Langkah', icon: <Square size={12} /> },
                    { id: 'B', label: 'Timeline', icon: '┃' },
                  ]
              : page.templateType === 'diskusi'
                ? [
                    { id: 'A', label: 'Satu-satu', icon: <Square size={12} /> },
                    { id: 'B', label: 'Semua', icon: '▥' },
                  ]
              : page.templateType === 'refleksi'
                ? [
                    { id: 'A', label: 'Satu-satu', icon: <Square size={12} /> },
                    { id: 'B', label: 'Jurnal', icon: '📓' },
                  ]
              : page.templateType === 'game'
                ? [
                    { id: 'A', label: 'Widget', icon: <Square size={12} /> },
                    { id: 'B', label: 'Galeri', icon: '▦' },
                  ]
                : [
                    { id: 'A', label: 'Default', icon: <Square size={12} /> },
                    { id: 'B', label: 'Alt Layout', icon: '▥' },
                  ]
            ).map(v => (
              <button
                key={v.id}
                onClick={() => setVariant(v.id as 'A' | 'B' | 'C')}
                className={`flex-1 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[9px] font-bold transition-colors ${
                  (page?.templateVariant || 'A') === v.id
                    ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                    : 'bg-slate-800/40 border border-slate-700/20 text-slate-400 hover:border-slate-600'
                }`}
              >
                <span className="text-sm">{v.icon}</span>
                <span>{v.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Layout Presets */}
      {(page?.elements && page.elements.length > 0) && (
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

      {/* Grid & Snap */}
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

      {/* Template Edit */}
      {isTemplateMode && page && (
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
          <Button
            variant="outline"
            onClick={() => {
              const store = useCanvaStore.getState();
              store.setTemplateType(page.templateType);
              toast.success('Data template diperbarui dari panel authoring');
            }}
            className="w-full justify-center py-2 mb-2 text-amber-400 border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/18 hover:border-amber-500/35"
          >
            <Zap size={12} />
            Refresh Data dari Authoring
          </Button>

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
  );
}
