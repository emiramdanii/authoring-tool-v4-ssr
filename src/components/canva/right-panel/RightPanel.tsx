'use client';

import { useState } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { TEMPLATE_BADGE_MAP } from '@/lib/canva-icon-maps';
import ElementProperties from './ElementProperties';
import BackgroundSection from './BackgroundSection';
import PaletteSection from './PaletteSection';
import NavigationSection from './NavigationSection';
import PageSettingsSection from './PageSettingsSection';

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
  } = useCanvaStore();

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
    <div className="w-60 min-w-[240px] flex flex-col glass-panel overflow-y-auto custom-scrollbar">

      {/* ═══ Section 1: Properti Elemen — ALWAYS VISIBLE (not collapsible) ═══ */}
      {selectedEl && (
        <ElementProperties
          selectedEl={selectedEl}
          updateElement={updateElement}
          deleteSelected={deleteSelected}
        />
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
