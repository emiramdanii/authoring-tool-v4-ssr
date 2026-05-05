// ═══════════════════════════════════════════════════════════════
// COLOR PALETTE — Extract dominant colors from an image
// Ported from legacy canva.js k-means clustering algorithm
// ═══════════════════════════════════════════════════════════════

import type { ColorPalette } from '@/components/canva/types';

/**
 * Extract up to `maxColors` dominant colors from an image data URL
 * using k-means clustering on the pixel data.
 */
export async function extractColorPalette(
  dataUrl: string,
  maxColors = 8
): Promise<ColorPalette> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ colors: [], mapping: {} });
        return;
      }

      // Downscale for performance
      const maxDim = 120;
      const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels: number[][] = [];

      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        const a = imageData.data[i + 3];

        // Skip transparent, near-white, near-black pixels
        if (a < 128) continue;
        if (r > 240 && g > 240 && b > 240) continue;
        if (r < 15 && g < 15 && b < 15) continue;

        pixels.push([r, g, b]);
      }

      if (pixels.length === 0) {
        resolve({ colors: [], mapping: {} });
        return;
      }

      // K-means clustering
      const k = Math.min(maxColors, pixels.length);
      const centroids = kmeansInit(pixels, k);
      const result = kmeansIterate(pixels, centroids, 12);

      // Sort by saturation (vivid first)
      const sorted = result
        .map((c) => rgbToHex(c[0], c[1], c[2]))
        .sort((a, b) => getSaturation(b) - getSaturation(a));

      // Deduplicate similar colors (hex distance < 30)
      const unique: string[] = [];
      for (const color of sorted) {
        if (!unique.some((u) => hexDistance(u, color) < 30)) {
          unique.push(color);
        }
        if (unique.length >= maxColors) break;
      }

      // Auto-map to CSS variables
      const mapping = autoMapColors(unique);
      resolve({ colors: unique, mapping });
    };

    img.onerror = () => {
      resolve({ colors: [], mapping: {} });
    };

    img.src = dataUrl;
  });
}

/**
 * Auto-map extracted colors to CSS custom properties
 * based on saturation and lightness heuristics.
 */
function autoMapColors(colors: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  if (colors.length === 0) return mapping;

  // Most vivid → primary accent (--y)
  mapping['--y'] = colors[0] || '#f9c82e';

  // Second vivid → secondary accent (--c)
  mapping['--c'] = colors[1] || '#3ecfcf';

  // Third → green accent (--g)
  mapping['--g'] = colors[2] || '#34d399';

  // Fourth → red accent (--r)
  mapping['--r'] = colors[3] || '#f87171';

  // Darkest → background (--bg)
  const darkest = [...colors].sort((a, b) => getLightness(a) - getLightness(b))[0];
  mapping['--bg'] = darkest || '#1a1a2e';

  // Lightest → card (--card)
  const lightest = [...colors].sort((a, b) => getLightness(b) - getLightness(a))[0];
  mapping['--card'] = adjustLight(lightest, 0.15) || '#1e293b';

  return mapping;
}

// ── K-means helpers ───────────────────────────────────────────

function kmeansInit(pixels: number[][], k: number): number[][] {
  const centroids: number[][] = [];
  const step = Math.floor(pixels.length / k);
  for (let i = 0; i < k; i++) {
    centroids.push([...pixels[i * step]]);
  }
  return centroids;
}

function kmeansIterate(
  pixels: number[][],
  centroids: number[][],
  iterations: number
): number[][] {
  let current = centroids;

  for (let iter = 0; iter < iterations; iter++) {
    // Assign pixels to nearest centroid
    const clusters: number[][][] = current.map(() => []);

    for (const pixel of pixels) {
      let minDist = Infinity;
      let minIdx = 0;
      for (let c = 0; c < current.length; c++) {
        const d = colorDist(pixel, current[c]);
        if (d < minDist) {
          minDist = d;
          minIdx = c;
        }
      }
      clusters[minIdx].push(pixel);
    }

    // Recompute centroids
    current = clusters.map((cluster, i) => {
      if (cluster.length === 0) return current[i];
      const sum = cluster.reduce(
        (acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]],
        [0, 0, 0]
      );
      return [
        Math.round(sum[0] / cluster.length),
        Math.round(sum[1] / cluster.length),
        Math.round(sum[2] / cluster.length),
      ];
    });
  }

  return current;
}

function colorDist(a: number[], b: number[]): number {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
  );
}

// ── Color utility helpers ─────────────────────────────────────

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function getSaturation(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return 0;
  return (max - min) / max;
}

function getLightness(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (r + g + b) / 3;
}

function hexDistance(a: string, b: string): number {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return Math.sqrt((ar - br) ** 2 + (ag - bg) ** 2 + (ab - bb) ** 2);
}

function adjustLight(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex);
  const adjust = (v: number) =>
    Math.min(255, Math.max(0, Math.round(v + v * factor)));
  return rgbToHex(adjust(r), adjust(g), adjust(b));
}

/**
 * Generate CSS custom properties string from a ColorPalette
 */
export function paletteToCSS(palette: ColorPalette | null): string {
  if (!palette || !palette.mapping) return '';
  return Object.entries(palette.mapping)
    .map(([key, value]) => `${key}:${value}`)
    .join(';');
}

/**
 * Get a specific color from palette with fallback
 */
export function getPaletteColor(
  palette: ColorPalette | null,
  key: string,
  fallback: string
): string {
  return palette?.mapping?.[key] || fallback;
}
