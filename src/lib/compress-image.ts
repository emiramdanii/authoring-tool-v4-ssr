// ═══════════════════════════════════════════════════════════════
// Shared Image Compression Utility
// ═══════════════════════════════════════════════════════════════
// Compresses data-URL images to prevent project bloat.
// Used by both legacy and schema background upload paths.
//
// Strategy:
//   - Non-data-URL (http/https) → pass-through (already remote)
//   - Width ≤ MAX_WIDTH          → pass-through (already small)
//   - Width > MAX_WIDTH          → resize + re-encode as JPEG 80%
//   - Error                      → fallback to original (no data loss)
// ═══════════════════════════════════════════════════════════════

/** Maximum width in pixels — images wider than this are downscaled */
const MAX_WIDTH = 1200;

/** JPEG quality for re-encoded output (0.0 – 1.0) */
const JPEG_QUALITY = 0.8;

/**
 * Compress a data-URL image by resizing to MAX_WIDTH and re-encoding as JPEG.
 *
 * - If the input is not a data-URL (e.g. https://…), returns it unchanged.
 * - If the image is already ≤ MAX_WIDTH wide, returns it unchanged.
 * - On any error (e.g. canvas unavailable), returns the original URL.
 *
 * @param url - The image URL (data-URL or remote URL)
 * @returns Promise resolving to the (possibly compressed) image URL
 */
export function compressImage(url: string): Promise<string> {
  return new Promise((resolve) => {
    // Non-data URLs (http, https, relative paths) are not compressed
    if (!url.startsWith('data:image/')) {
      resolve(url);
      return;
    }

    const img = new Image();
    img.onload = () => {
      // Already small enough — no compression needed
      if (img.width <= MAX_WIDTH) {
        resolve(url);
        return;
      }

      // Resize to MAX_WIDTH, preserving aspect ratio
      const scale = MAX_WIDTH / img.width;
      const canvas = document.createElement('canvas');
      canvas.width = MAX_WIDTH;
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Canvas unavailable — return original
        resolve(url);
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    };

    img.onerror = () => {
      // Failed to load — return original unchanged
      resolve(url);
    };

    img.src = url;
  });
}
