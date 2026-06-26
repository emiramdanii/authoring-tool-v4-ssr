// @ts-nocheck — BATCH-12: quarantined to src/legacy-disabled/, not type-checked
'use client';

import { useState } from 'react';
// All icons migrated to Material Symbols Outlined
import { useCanvaStore } from '@/store/canva-store';
import { LAYOUT_PRESETS } from '../types';
import { getVariantsForPageType, type PageVariant } from '@/core/template/health-check/page-variant-registry';
import type { PageTemplateType } from '../types';
import { TEMPLATE_BADGE_MAP } from '@/lib/canva-icon-maps';
import { getAllPresets } from '@/core/preset/PagePresetRegistry';
import { SCENE_TYPES, type SceneType } from '@/core/edu/education-scene-types';
import { toast } from 'sonner';
import Section from './Section';
import { Button } from '@/components/ui/button';
import { useTeacherMode } from '@/hooks/use-teacher-mode';

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

  // ── Teacher mode ─────────────────────────────────────────────
  const { isSederhana } = useTeacherMode();

  // ── Local UI state ───────────────────────────────────────────
  const [collapsed, setCollapsed] = useState(true);

  return (
    <Section
      icon={<span className="material-symbols-outlined" style={{ fontSize: '12px' }}>dashboard_customize</span>}
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

      {/* Phase 3: Template Layout Variant picker — driven by PageVariantRegistry */}
      {isTemplateMode && page && (() => {
        const registryVariants = getVariantsForPageType(page.templateType);
        // Map registry variants to A/B/C slots
        const variantSlots = registryVariants.length > 0
          ? registryVariants.map((v, i) => ({
              id: String.fromCharCode(65 + i) as 'A' | 'B' | 'C',
              label: v.label,
              icon: v.icon,
              description: v.description,
              isDefault: v.isDefault,
            }))
          : [
              { id: 'A' as const, label: 'Default', icon: '⬜', description: '', isDefault: true },
              { id: 'B' as const, label: 'Alt Layout', icon: '▥', description: '', isDefault: false },
            ];

        return (
          <div className="mb-3">
            <label className="text-[10px] text-app-muted block mb-1.5">Varian Tampilan</label>
            <div className="flex gap-1.5">
              {variantSlots.map(v => (
                <button
                  key={v.id}
                  onClick={() => setVariant(v.id)}
                  className={`flex-1 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[9px] font-bold transition-colors ${
                    (page?.templateVariant || 'A') === v.id
                      ? 'bg-app-accent/15 border border-app-accent/30 text-app-accent'
                      : 'bg-app-elevated/40 border border-app-border/20 text-app-secondary hover:border-app-border'
                  }`}
                  title={v.description}
                >
                  <span className="text-sm">{v.icon}</span>
                  <span>{v.label}</span>
                  {v.isDefault && (page?.templateVariant || 'A') !== v.id && (
                    <span className="text-[6px] text-app-muted">(default)</span>
                  )}
                </button>
              ))}
            </div>
            {/* Show variant description for active variant */}
            {(() => {
              const activeVariant = registryVariants.find((_, i) => String.fromCharCode(65 + i) === (page.templateVariant || 'A'));
              if (activeVariant?.description) {
                return (
                  <p className="text-[8px] text-app-muted mt-1 leading-tight">
                    {activeVariant.description}
                  </p>
                );
              }
              return null;
            })()}
          </div>
        );
      })()}

      {/* Phase 7: Scene Type Override — hidden in teacher mode (Sprint 1C.2).
          This is a developer/advanced setting for scene-aware rendering.
          Teachers don't need to configure scene types manually. */}
      {isTemplateMode && page?.schema && !isSederhana && (
        <div className="mb-3">
          <label className="text-[10px] text-app-muted block mb-1">Scene Type</label>
          <select
            value={page.schema.sceneType || ''}
            onChange={(e) => {
              const store = useCanvaStore.getState();
              const { currentPageIndex, pages } = store;
              const currentPage = pages[currentPageIndex];
              if (!currentPage?.schema) return;
              const newSceneType = (e.target.value || undefined) as SceneType | undefined;
              // Update schema with new sceneType — zustand immutable update pattern
              const newPages = [...pages];
              newPages[currentPageIndex] = {
                ...currentPage,
                schema: { ...currentPage.schema, sceneType: newSceneType },
              };
              useCanvaStore.setState({ pages: newPages });
              const labelId = newSceneType ? SCENE_TYPES[newSceneType].labelId : 'Otomatis';
              toast.success(`Scene type: ${labelId}`);
            }}
            className="w-full h-7 px-2 text-[10px] text-app-primary bg-app-elevated/60 border border-app-border/30 rounded-lg focus:border-app-accent/50 focus:outline-none focus-ring"
          >
            <option value="">Otomatis (dari jenis halaman)</option>
            {Object.entries(SCENE_TYPES).map(([key, def]) => (
              <option key={key} value={key}>{def.labelId} — {def.description}</option>
            ))}
          </select>
          <p className="text-[8px] text-app-muted mt-1 leading-tight">
            Mengubah scene type mempengaruhi ukuran font, ketebalan aksen, jarak, dan animasi.
          </p>
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
                  className={`card-hover flex flex-col items-center gap-0.5 rounded-xl p-2 border text-center transition-[transform,background-color,border-color] ${
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

      {/* Grid & Snap — hidden in teacher mode (Sprint 1C.2).
          Grid alignment is a developer tool; teachers don't need it. */}
      {!isSederhana && <div className="mb-3">
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
      </div>}

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
            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>bolt</span>
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
