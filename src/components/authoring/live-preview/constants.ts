// ═══════════════════════════════════════════════════════════════
// CONSTANTS for Live Preview
// ═══════════════════════════════════════════════════════════════

import { Monitor, Tablet, Smartphone } from 'lucide-react';
import type { DeviceMode, LayoutTheme, PreviewMode } from './types';

export const DEVICE_MODES: { id: DeviceMode; label: string; icon: typeof Smartphone; width: number }[] = [
  { id: 'mobile', label: 'Mobile', icon: Smartphone, width: 390 },
  { id: 'tablet', label: 'Tablet', icon: Tablet, width: 768 },
  { id: 'desktop', label: 'Desktop', icon: Monitor, width: 0 },
];

export const LAYOUT_THEMES: { id: LayoutTheme; icon: string; label: string }[] = [
  { id: 'colorful', icon: '🌈', label: 'Colorful' },
  { id: 'neon', icon: '💜', label: 'Neon' },
  { id: 'glass', icon: '🪟', label: 'Glass' },
  { id: 'default', icon: '🌙', label: 'Default' },
  { id: 'minimal', icon: '⬜', label: 'Minimal' },
];

export const SCREEN_OPTIONS = [
  { id: 's-cover', label: '🎬 Cover' },
  { id: 's-cp', label: '📋 CP / TP / ATP' },
  { id: 's-modules', label: '📦 Modul' },
  { id: 's-sk', label: '🎭 Skenario' },
  { id: 's-materi', label: '📖 Materi & Fungsi' },
  { id: 's-kuis', label: '❓ Kuis' },
  { id: 's-hasil', label: '📊 Hasil' },
];

// ── Mode metadata — full set (8.4: simplified selector uses subset) ──
// Primary modes: unified (Preview), schema (Dengan Skema)
// Advanced modes: canvas, template, legacy (hidden behind Advanced submenu)
export const MODE_META: Record<PreviewMode, { label: string; simplifiedLabel: string; color: string; icon: string }> = {
  unified:  { label: 'Unified',  simplifiedLabel: 'Preview',        color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', icon: '🚀' },
  schema:   { label: 'Schema',   simplifiedLabel: 'Dengan Skema',   color: 'text-fuchsia-400 bg-fuchsia-500/15 border-fuchsia-500/30', icon: '⚡' },
  canvas:   { label: 'Canvas',   simplifiedLabel: 'Canvas',         color: 'text-app-accent bg-app-accent/15 border-app-accent/30', icon: '🎨' },
  template: { label: 'Template', simplifiedLabel: 'Template',       color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30', icon: '🧩' },
  legacy:   { label: 'Legacy',   simplifiedLabel: 'Legacy',         color: 'text-purple-400 bg-purple-500/15 border-purple-500/30', icon: '📝' },
};

// ═══════════════════════════════════════════════════════════════
// SIMPLE HASH for data change detection
// ═══════════════════════════════════════════════════════════════

export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString(36);
}
