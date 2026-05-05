// ═══════════════════════════════════════════════════════════════════
// TOKENS — Design tokens and static data maps
// ═══════════════════════════════════════════════════════════════════

// DESIGN TOKENS (same as PresetModuleCard)
export const T = {
  bg: '#0e1c2f',
  bg2: '#13243a',
  card: '#182d45',
  y: '#f9c12e',
  c: '#3ecfcf',
  r: '#ff6b6b',
  p: '#a78bfa',
  g: '#34d399',
  o: '#fb923c',
  text: '#e8f2ff',
  muted: '#6e90b5',
} as const;

// HERO GRADIENTS MAP
export const HERO_GRADIENTS: Record<string, string> = {
  sunset: 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)',
  ocean: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #a78bfa 100%)',
  forest: 'linear-gradient(135deg, #22c55e 0%, #14b8a6 50%, #0ea5e9 100%)',
  royal: 'linear-gradient(135deg, #7c3aed 0%, #c026d3 50%, #f43f5e 100%)',
  fire: 'linear-gradient(135deg, #ef4444 0%, #f97316 50%, #eab308 100%)',
  aurora: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)',
};
