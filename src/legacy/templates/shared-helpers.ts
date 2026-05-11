import { useAuthoringStore } from '@/store/authoring-store';
import { getModuleIcon as _getModuleIcon, getGameIcon as _getGameIcon } from '@/lib/canva-icon-maps';

// ── Utility helpers ───────────────────────────────────────────

// Phase 1: Use shared icon maps from canva-icon-maps.ts
// (removed local duplicates of getModuleIcon / getGameIcon)
// Import is at the top of this file

// Keep local aliases for backward compat within this file
// (some local template icons differ slightly from the shared map)
export function getModuleIcon(type: string): string {
  // Local overrides for template-specific display
  const localOverrides: Record<string, string> = {
    video: '🎬', flashcard: '🃏', langkah: '📌', accordion: '📂',
    embed: '🌐', 'hotspot-image': '📍', truefalse: '✅❌',
    skenario: '🎭',
  };
  return localOverrides[type] || _getModuleIcon(type);
}

export function getGameIcon(type: string): string {
  return _getGameIcon(type);
}

export function getGameModuleIndex(game: Record<string, unknown>): number {
  const modules = useAuthoringStore.getState().modules;
  // Prefer _id lookup first (stable, unique)
  if (game._id) {
    const idx = modules.findIndex(m => m._id === game._id);
    if (idx >= 0) return idx;
  }
  // Fallback: property-based comparison (type + title)
  const idx = modules.findIndex(m =>
    m.type === game.type &&
    m.title === game.title
  );
  return idx >= 0 ? idx : -1;
}
