'use client';

import { useState } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { TEMPLATE_BADGE_MAP } from '@/lib/canva-icon-maps';
import ElementProperties from './ElementProperties';
import BackgroundSection from './BackgroundSection';
import PaletteSection from './PaletteSection';
import NavigationSection from './NavigationSection';
import PageSettingsSection from './PageSettingsSection';
import {
  AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  SpaceHorizontal, SpaceVertical,
} from './align-icons';

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
    unlockPage,
    relockPage,
    setVariant,
  } = useCanvaStore();

  const selectedElIds = useCanvaStore((s) => s.selectedElIds);
  const alignSelected = useCanvaStore((s) => s.alignSelected);
  const distributeSelected = useCanvaStore((s) => s.distributeSelected);

  const page = pages[currentPageIndex];
  // Also search overlayElements for the selected element
  const selectedEl = page?.elements.find(e => e.id === selectedElId)
    || page?.overlayElements?.find(e => e.id === selectedElId);
  const isTemplateMode = page?.templateType && page.templateType !== 'custom';

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
    <div className="w-full flex flex-col glass-panel overflow-y-auto custom-scrollbar">

      {/* ═══ Section 1: Properti Elemen — ALWAYS VISIBLE (not collapsible) ═══ */}
      {selectedEl && (
        <ElementProperties
          selectedEl={selectedEl}
          updateElement={updateElement}
          deleteSelected={deleteSelected}
        />
      )}

      {/* ═══ Section 1b: Alignment Tools (multi-select) ═══ */}
      {selectedElIds.length >= 2 && (
        <div className="px-3 py-2 border-b border-slate-800/40">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Align & Distribusi</div>
          <div className="grid grid-cols-6 gap-1">
            <button onClick={() => alignSelected('left')} className="btn-ghost focus-ring p-1" title="Align Left">
              <AlignStartHorizontal size={13} />
            </button>
            <button onClick={() => alignSelected('centerH')} className="btn-ghost focus-ring p-1" title="Align Center Horizontal">
              <AlignCenterHorizontal size={13} />
            </button>
            <button onClick={() => alignSelected('right')} className="btn-ghost focus-ring p-1" title="Align Right">
              <AlignEndHorizontal size={13} />
            </button>
            <button onClick={() => alignSelected('top')} className="btn-ghost focus-ring p-1" title="Align Top">
              <AlignStartVertical size={13} />
            </button>
            <button onClick={() => alignSelected('centerV')} className="btn-ghost focus-ring p-1" title="Align Center Vertical">
              <AlignCenterVertical size={13} />
            </button>
            <button onClick={() => alignSelected('bottom')} className="btn-ghost focus-ring p-1" title="Align Bottom">
              <AlignEndVertical size={13} />
            </button>
          </div>
          {selectedElIds.length >= 3 && (
            <div className="grid grid-cols-2 gap-1 mt-1">
              <button onClick={() => distributeSelected('horizontal')} className="btn-ghost focus-ring p-1 flex items-center gap-1" title="Distribute Horizontally">
                <SpaceHorizontal size={12} /> <span className="text-[8px]">H-Space</span>
              </button>
              <button onClick={() => distributeSelected('vertical')} className="btn-ghost focus-ring p-1 flex items-center gap-1" title="Distribute Vertically">
                <SpaceVertical size={12} /> <span className="text-[8px]">V-Space</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══ Section 2: Background + Gradient (merged) ═══ */}
      <BackgroundSection
        page={page}
        setBgColor={setBgColor}
        setBgImage={setBgImage}
        setOverlay={setOverlay}
        collapsed={collapsed.bg}
        onToggle={() => toggleCollapse('bg')}
      />

      {/* ═══ Section 3: Color Palette ═══ */}
      {page?.colorPalette && page.colorPalette.colors.length > 0 && (
        <PaletteSection
          colorPalette={page.colorPalette}
          collapsed={collapsed.palette}
          onToggle={() => toggleCollapse('palette')}
        />
      )}

      {/* ═══ Section 4: Navigation Config ═══ */}
      <NavigationSection
        navConfig={page?.navConfig}
        updateNavConfig={updateNavConfig}
        collapsed={collapsed.nav}
        onToggle={() => toggleCollapse('nav')}
      />

      {/* ═══ Section 5: Pengaturan Halaman (merged: Tipe + Layout + Grid + Template Edit) ═══ */}
      <PageSettingsSection
        page={page}
        currentPageIndex={currentPageIndex}
        isTemplateMode={!!isTemplateMode}
        setTemplateType={setTemplateType}
        updateTemplateData={updateTemplateData}
        applyLayoutPreset={applyLayoutPreset}
        currentLayoutPreset={currentLayoutPreset}
        showGrid={showGrid}
        gridSize={gridSize}
        snapEnabled={snapEnabled}
        toggleGrid={toggleGrid}
        setGridSize={setGridSize}
        toggleSnap={toggleSnap}
        unlockPage={unlockPage}
        relockPage={relockPage}
        setVariant={setVariant}
        collapsed={collapsed.settings}
        onToggle={() => toggleCollapse('settings')}
      />

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
