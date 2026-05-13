'use client';

import { useCanvaStore } from '@/store/canva-store';
import ElementProperties from './ElementProperties';
import BackgroundSection from './BackgroundSection';
import PaletteSection from './PaletteSection';
import NavigationSection from './NavigationSection';
import PageSettingsSection from './PageSettingsSection';
import BlockPropertiesPanel from './BlockPropertiesPanel';
import AIAssistantSection from './AIAssistantSection';
import AlignmentTools from './AlignmentTools';
import PageInfo from './PageInfo';

// ═══════════════════════════════════════════════════════════════
// Phase 2: RightPanel redesign — 5 sections instead of 9
// Structure:
//   1. 📋 Properti Elemen — ALWAYS visible when element selected (not collapsible)
//   2. 🖼️ Background — BG + Gradient merged from LeftPanel
//   3. 🎨 Palet Warna — only if palette exists
//   4. 🧭 Navigasi — navbar config
//   5. ⚙️ Pengaturan Halaman — Tipe Halaman + Layout + Grid/Snap + Template Edit
// Removed: Layer mini (already in LeftPanel Layer tab)
//
// ARCH-4: Each section is now self-contained — reads its own data
// from the store via targeted selectors. No more prop drilling.
// ═══════════════════════════════════════════════════════════════

export default function RightPanel() {
  const rightPanelOpen = useCanvaStore(s => s.rightPanelOpen);

  if (!rightPanelOpen) return null;

  return (
    <div className="w-full flex flex-col glass-panel overflow-y-auto custom-scrollbar">

      {/* ═══ Section 0: Schema Block Properties (when block selected) ═══ */}
      <BlockPropertiesPanel />

      {/* ═══ Section 0b: AI Content Assistant ═══ */}
      <AIAssistantSection />

      {/* ═══ Section 1: Properti Elemen — ALWAYS VISIBLE (not collapsible) ═══ */}
      <ElementProperties />

      {/* ═══ Section 1b: Alignment Tools (multi-select) ═══ */}
      <AlignmentTools />

      {/* ═══ Section 2: Background + Gradient (merged) ═══ */}
      <BackgroundSection />

      {/* ═══ Section 3: Color Palette ═══ */}
      <PaletteSection />

      {/* ═══ Section 4: Navigation Config ═══ */}
      <NavigationSection />

      {/* ═══ Section 5: Pengaturan Halaman (merged: Tipe + Layout + Grid + Template Edit) ═══ */}
      <PageSettingsSection />

      {/* ── Page Info (always visible at bottom) ───────────────── */}
      <PageInfo />
    </div>
  );
}
