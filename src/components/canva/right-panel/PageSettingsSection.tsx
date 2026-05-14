'use client';

import { useState } from 'react';
import { LayoutTemplate, Zap, Square } from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
import { LAYOUT_PRESETS } from '../types';
import type { PageTemplateType } from '../types';
import { TEMPLATE_BADGE_MAP } from '@/lib/canva-icon-maps';
import { getAllPresets } from '@/core/preset/PagePresetRegistry';
import { toast } from 'sonner';
import Section from './Section';
import { Button } from '@/components/ui/button';

export default function PageSettingsSection() {
  // ── Store selectors ──────────────────────────────────────────
  const setTemplateType = useCanvaStore(s => s.setTemplateType);
  const applyLayoutPreset = useCanvaStore(s => s.applyLayoutPreset);
  const currentLayoutPreset = useCanvaStore(s => s.currentLayoutPreset);
  const toggleGrid = useCanvaStore(s => s.toggleGrid);
  const setGridSize = useCanvaStore(s => s.setGridSize);
  const toggleSnap = useCanvaStore(s => s.toggleSnap);
  const setVariant = useCanvaStore(s => s.setVariant);

  // ── Derived page data ────────────────────────────────────────
  const page = useCanvaStore(s => s.pages[s.currentPageIndex]);
  const showGrid = useCanvaStore(s => s.showGrid);
  const gridSize = useCanvaStore(s => s.gridSize);
  const snapEnabled = useCanvaStore(s => s.snapEnabled);
  const isTemplateMode = !!(page?.templateType && page.templateType !== 'custom');

  // ── Local UI state ───────────────────────────────────────────
  const [collapsed, setCollapsed] = useState(true);

  return (
    <Section
      icon={<LayoutTemplate size={12} />}
      title="Pengaturan Halaman"
      collapsed={collapsed}
      onToggle={() => setCollapsed(c => !c)}
    >
      {/* Jenis Halaman */}
      <div className="mb-3">
        <label className="text-[10px] text-app-muted block mb-1">Jenis Halaman</label>
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
          className="w-full h-8 px-2 text-[11px] text-app-primary bg-app-elevated/60 border border-app-border/30 rounded-lg focus:border-app-accent/50 focus:outline-none focus-ring"
        >
          {getAllPresets().map(p => (
            <option key={p.id} value={p.id}>{p.icon} {p.label} — {p.description}</option>
          ))}
        </select>
      </div>

      {/* Phase 3: Template Layout Variant picker — available for all template types */}
      {isTemplateMode && page && (
        <div className="mb-3">
          <label className="text-[10px] text-app-muted block mb-1.5">Varian Tampilan</label>
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
                    ? 'bg-app-accent/15 border border-app-accent/30 text-app-accent'
                    : 'bg-app-elevated/40 border border-app-border/20 text-app-secondary hover:border-app-border'
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
          <label className="text-[10px] text-app-muted block mb-1">Layout Preset</label>
          <div className="grid grid-cols-3 gap-1.5">
            {LAYOUT_PRESETS.map(p => {
              const isActive = currentLayoutPreset()?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => applyLayoutPreset(p.id)}
                  className={`card-hover flex flex-col items-center gap-0.5 rounded-xl p-2 border text-center transition-all ${
                    isActive
                      ? 'bg-app-accent/15 border-app-accent/30 text-app-accent'
                      : 'border-app-border/20 text-app-secondary'
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
          <label className="text-[10px] text-app-muted block mb-1.5">Grid & Snap</label>
          <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={toggleGrid}
              className="accent-app-accent w-3 h-3"
            />
            <span className="text-[9px] text-app-secondary">Tampilkan Grid</span>
          </label>
          <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={snapEnabled}
              onChange={toggleSnap}
              className="accent-app-accent w-3 h-3"
            />
            <span className="text-[9px] text-app-secondary">Snap ke Grid</span>
          </label>
          <div className="mt-1">
            <label className="text-[9px] text-app-muted block mb-1">Ukuran Grid: {gridSize}%</label>
            <input
              type="range"
              min={2}
              max={20}
              step={1}
              value={gridSize}
              onChange={e => setGridSize(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[7px] text-app-muted mt-0.5">
              <span>Halus (2%)</span>
              <span>Kasar (20%)</span>
            </div>
          </div>
      </div>

      {/* Template Edit */}
      {isTemplateMode && page && (
        <div className="mb-2">
          <div className="text-[10px] font-bold text-app-accent mb-1.5">
            {TEMPLATE_BADGE_MAP[page.templateType]?.icon || ''} {TEMPLATE_BADGE_MAP[page.templateType]?.name || page.templateType} Template
          </div>

          {/* Refresh Data button */}
          <Button
            variant="outline"
            onClick={() => {
              const store = useCanvaStore.getState();
              store.setTemplateType(page.templateType);
              toast.success('Data template diperbarui dari panel authoring');
            }}
            className="w-full justify-center py-2 mb-2 text-app-accent border-app-accent/20 bg-app-accent/10 hover:bg-app-accent/18 hover:border-app-accent/35"
          >
            <Zap size={12} />
            Refresh Data dari Authoring
          </Button>

          {/* Schema-driven editing guide — replaces legacy templateData quick edit.
              Schema pages should be edited by clicking blocks directly on canvas.
              The old templateData quick-edit inputs were misleading because
              templateData is no longer the source of truth for schema pages. */}
          {page.schema ? (
            <div className="rounded-xl bg-app-elevated/40 border border-app-border/20 p-2">
              <span className="text-[8px] text-app-muted">
                Klik langsung teks atau block di canvas untuk mengedit. Data otomatis disimpan ke schema.
              </span>
            </div>
          ) : page.templateData && Object.keys(page.templateData).length > 0 ? (
            /* Fallback for legacy non-schema pages with templateData.
              These are rare — only custom pages that somehow have templateData. */
            <div className="rounded-xl bg-app-elevated/40 border border-app-border/20 p-2">
              <span className="text-[8px] text-app-muted">
                Halaman legacy — gunakan canvas untuk mengedit.
              </span>
            </div>
          ) : null}
        </div>
      )}
    </Section>
  );
}
