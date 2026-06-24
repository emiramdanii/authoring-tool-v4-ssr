// ═══════════════════════════════════════════════════════════════════
// HOTSPOT POSITION HELPER — Sprint 8.8B-Patch-2
// ═══════════════════════════════════════════════════════════════════
// Pure function that parses a "x,y" preset string (from the 3×3 grid
// select in the guided editor) into { x, y } numbers clamped to 0–100.
//
// This is the adapter between the guided editor's `posisi` field
// (which stores "15,15" etc.) and the HotspotImageBlock's `x`/`y`
// fields (which store numbers 0–100).
//
// The `posisi` field is NEVER stored on the block — it's a UI-only
// abstraction. The guided editor calls parseHotspotPosition() and
// writes x + y to the block instead.
// ═══════════════════════════════════════════════════════════════════

/**
 * Parse a "x,y" string into { x, y } with clamping.
 *
 * @param value - The preset position string (e.g. "15,15", "85,50")
 * @returns { x: number, y: number } clamped to 0–100
 *
 * @example
 * parseHotspotPosition("15,15")  → { x: 15, y: 15 }
 * parseHotspotPosition("85,85")  → { x: 85, y: 85 }
 * parseHotspotPosition("50,50")  → { x: 50, y: 50 }
 * parseHotspotPosition("abc")    → { x: 50, y: 50 }  (fallback to center)
 * parseHotspotPosition("")       → { x: 50, y: 50 }  (fallback to center)
 */
export function parseHotspotPosition(value: unknown): { x: number; y: number } {
  const str = String(value ?? '');
  const parts = str.split(',');
  if (parts.length !== 2) return { x: 50, y: 50 };

  const rawX = Number(parts[0]);
  const rawY = Number(parts[1]);

  if (Number.isNaN(rawX) || Number.isNaN(rawY)) return { x: 50, y: 50 };

  return {
    x: Math.max(0, Math.min(100, rawX)),
    y: Math.max(0, Math.min(100, rawY)),
  };
}

/**
 * Format x,y numbers back into a "x,y" string for the select's value.
 *
 * @param x - The hotspot's x position (0–100)
 * @param y - The hotspot's y position (0–100)
 * @returns "x,y" string (e.g. "15,15")
 *
 * @example
 * formatHotspotPosition(15, 15)  → "15,15"
 * formatHotspotPosition(85, 85)  → "85,85"
 * formatHotspotPosition(50, 50)  → "50,50"
 */
export function formatHotspotPosition(x: unknown, y: unknown): string {
  const nx = typeof x === 'number' && !Number.isNaN(x) ? x : 50;
  const ny = typeof y === 'number' && !Number.isNaN(y) ? y : 50;
  return `${nx},${ny}`;
}
