'use client';

import { LayoutTemplate, Zap, Lock, Unlock } from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
import { TEMPLATE_TYPES, LAYOUT_PRESETS } from '../types';
import type { PageTemplateType, CanvaPage } from '../types';
import { TEMPLATE_BADGE_MAP } from '@/lib/canva-icon-maps';
import { toast } from 'sonner';
import Section from './Section';

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
  unlockPage: () => void;
  relockPage: () => void;
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
  unlockPage,
  relockPage,
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
          onChange={(e) => setTemplateType(e.target.value as PageTemplateType)}
          className="w-full h-8 px-2 text-[11px] text-slate-200 bg-slate-800/60 border border-slate-700/30 rounded-lg focus:border-amber-500/50 focus:outline-none focus-ring"
        >
          {TEMPLATE_TYPES.map(t => (
            <option key={t.id} value={t.id}>{t.icon} {t.name} — {t.desc}</option>
          ))}
        </select>
      </div>

      {/* Phase 3: Template Layout Variant picker */}
      {isTemplateMode && (page?.templateType === 'cover' || page?.templateType === 'materi') && (
        <div className="mb-3">
          <label className="text-[10px] text-slate-500 block mb-1.5">Varian Tampilan</label>
          <div className="flex gap-1.5">
            {(page?.templateType === 'cover'
              ? [
                  { id: 'A', label: 'Centered', icon: '⬜' },
                  { id: 'B', label: 'Left Align', icon: '▐▌' },
                  { id: 'C', label: 'Split', icon: '◧◨' },
                ]
              : [
                  { id: 'A', label: 'Vertical', icon: '☰' },
                  { id: 'B', label: 'Grid 2-Col', icon: '▥' },
                ]
            ).map(v => (
              <button
                key={v.id}
                onClick={() => {
                  const store = useCanvaStore.getState();
                  const newPages = [...store.pages];
                  newPages[store.currentPageIndex] = {
                    ...newPages[store.currentPageIndex],
                    templateVariant: v.id as 'A' | 'B' | 'C',
                  };
                  store._pushHistory();
                  useCanvaStore.setState({ pages: newPages });
                }}
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

      {/* Lock/Unlock status + button (template pages only) */}
      {isTemplateMode && page && (
        <div className="mb-3">
          {page.locked !== false ? (
            // LOCKED — show unlock button
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 space-y-2">
              <div className="flex items-center gap-1.5">
                <Lock size={12} className="text-amber-400" />
                <span className="text-[10px] font-bold text-amber-300">Terkunci — Auto-sync aktif</span>
              </div>
              <div className="text-[8px] text-amber-400/60">
                Template otomatis mengikuti data authoring. Buka kunci untuk edit bebas.
              </div>
              <button
                onClick={() => {
                  if (confirm(
                    'Buka kunci halaman ini?\n\n' +
                    '⚠️ Konsekuensi:\n' +
                    '• Data template TIDAK lagi auto-update dari panel authoring\n' +
                    '• Template visual menjadi beku (background)\n' +
                    '• Semua elemen overlay bergabung dan bisa diedit bebas\n\n' +
                    'Tindakan ini bisa di-undo (Ctrl+Z).'
                  )) {
                    unlockPage();
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold transition-colors active:scale-95"
              >
                <Unlock size={11} />
                Buka Kunci Halaman
              </button>
            </div>
          ) : (
            // UNLOCKED — show status badge + re-lock button
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 space-y-2">
              <div className="flex items-center gap-1.5">
                <Unlock size={12} className="text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-300">Terbuka — Edit bebas</span>
              </div>
              <div className="text-[8px] text-emerald-400/60">
                Template beku sebagai background. Data TIDAK auto-update. Semua elemen bisa diedit.
              </div>
              <button
                onClick={() => {
                  if (confirm(
                    'Kunci kembali halaman ini?\n\n' +
                    '⚠️ Konsekuensi:\n' +
                    '• Data template akan diperbarui dari panel authoring\n' +
                    '• Semua perubahan manual pada elemen akan hilang\n' +
                    '• Auto-sync kembali aktif\n\n' +
                    'Tindakan ini bisa di-undo (Ctrl+Z).'
                  )) {
                    relockPage();
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold transition-colors active:scale-95"
              >
                <Lock size={11} />
                Kunci Kembali
              </button>
            </div>
          )}
        </div>
      )}

      {/* Layout Presets (custom mode + unlocked template) */}
      {(!isTemplateMode || page?.locked === false) && (
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

      {/* Grid & Snap (custom mode + unlocked template) */}
      {(!isTemplateMode || page?.locked === false) && (
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

      {/* Template Edit (LOCKED template mode only — unlocked pages don't need this) */}
      {isTemplateMode && page?.locked !== false && page && (
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
  );
}
