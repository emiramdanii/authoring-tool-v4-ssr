// ═══════════════════════════════════════════════════════════════════════
// /api/upload ROUTE — Image upload for ImageUploader component
// ═══════════════════════════════════════════════════════════════════════
// Sprint 8.5C — implements the /api/upload endpoint that ImageUploader
// has been calling since Sprint 5. Previously returned 404, which broke
// the image upload flow end-to-end.
//
// Contract (must match ImageUploader.tsx):
//   Request:  POST multipart/form-data with field "file"
//   Success:  200 { success: true, url: string, filename: string }
//   Error:    400/413/500 { success: false, error: string (generic) }
//
// Validation:
//   - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp, image/svg+xml
//   - Max size: 5 MB (matches ImageUploader's MAX_SIZE_MB)
//   - Reject empty files
//   - Reject path traversal in filename (filename is content-derived, not user-supplied)
//   - Magic-byte verification for non-SVG images (defense in depth —
//     a malicious client could send image/jpeg MIME with non-image payload)
//
// Storage:
//   - Files saved to public/uploads/<sha256-hash>.<ext>
//   - Filename = SHA-256 of file contents (content-addressed → dedupe)
//   - URL returned: /uploads/<sha256-hash>.<ext>
//   - Directory created on first request (mkdirSync recursive)
//
// Security (Sprint 8.5B pattern):
//   - Generic error messages to client (no stack / internal path leak)
//   - Server-side console.error with full error
//   - Security headers applied by middleware (X-Content-Type-Options: nosniff
//     prevents MIME sniffing on uploaded files)
//   - SVG uploads stored as .svg; served with nosniff from middleware
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// ── Constants ────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);

// MIME → extension map (canonical extensions for storage)
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB (matches ImageUploader)

// Magic bytes for non-SVG images — defense in depth against MIME spoofing.
// SVG is XML text, so we skip magic-byte check for it (rely on MIME + size).
const MAGIC_BYTES: Record<string, number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  'image/gif': [0x47, 0x49, 0x46, 0x38], // "GIF8"
  'image/webp': [0x52, 0x49, 0x46, 0x46], // "RIFF" (WebP container)
};

const UPLOAD_DIR = path.resolve(process.cwd(), 'public', 'uploads');
const UPLOAD_URL_PREFIX = '/uploads';

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Verify magic bytes match the expected signature for the given MIME type.
 * Returns true for SVG (text-based, no magic bytes to check).
 */
function verifyMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const expected = MAGIC_BYTES[mimeType];
  if (!expected) return true; // SVG or unknown — skip check
  if (buffer.length < expected.length) return false;
  for (let i = 0; i < expected.length; i++) {
    if (buffer[i] !== expected[i]) return false;
  }
  return true;
}

/**
 * Compute SHA-256 hash of file contents (hex string).
 * Used for content-addressed filename → automatic dedupe.
 */
function sha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

// ── POST handler ─────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // ── Parse multipart form ─────────────────────────────────────
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Format permintaan tidak valid.' },
        { status: 400 }
      );
    }

    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'File tidak ditemukan dalam permintaan.' },
        { status: 400 }
      );
    }

    // ── Validate file is not empty ───────────────────────────────
    if (file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'File kosong.' },
        { status: 400 }
      );
    }

    // ── Validate size ────────────────────────────────────────────
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `Ukuran file melebihi batas maksimum (${MAX_SIZE_BYTES / 1024 / 1024}MB).`,
        },
        { status: 413 }
      );
    }

    // ── Validate MIME type ───────────────────────────────────────
    const mimeType = file.type;
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tipe file tidak didukung. Hanya JPG, PNG, GIF, WebP, dan SVG yang diperbolehkan.',
        },
        { status: 400 }
      );
    }

    // ── Read file contents into buffer ──────────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ── Verify magic bytes (defense in depth against MIME spoofing) ──
    if (!verifyMagicBytes(buffer, mimeType)) {
      return NextResponse.json(
        { success: false, error: 'Konten file tidak sesuai dengan tipe yang dideklarasikan.' },
        { status: 400 }
      );
    }

    // ── Compute content-addressed filename ──────────────────────
    // SHA-256 hash → automatic dedupe + prevents filename collisions
    // and path traversal attacks (filename is fully derived from content).
    const hash = sha256(buffer);
    const ext = MIME_TO_EXT[mimeType] || 'bin';
    const safeFilename = `${hash}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, safeFilename);
    const publicUrl = `${UPLOAD_URL_PREFIX}/${safeFilename}`;

    // ── Ensure upload directory exists ──────────────────────────
    try {
      await mkdir(UPLOAD_DIR, { recursive: true });
    } catch (mkdirErr) {
      // Directory might already exist — that's fine. Any other error → 500.
      const code = (mkdirErr as NodeJS.ErrnoException).code;
      if (code !== 'EEXIST') {
        throw mkdirErr;
      }
    }

    // ── Write file to disk ──────────────────────────────────────
    try {
      await writeFile(filePath, buffer, { mode: 0o644 });
    } catch (writeErr) {
      const code = (writeErr as NodeJS.ErrnoException).code;
      if (code === 'EEXIST') {
        // File already exists — content-addressed dedupe. This is fine,
        // we just return the existing URL.
      } else {
        throw writeErr;
      }
    }

    // ── Return success response ─────────────────────────────────
    return NextResponse.json(
      {
        success: true,
        url: publicUrl,
        filename: safeFilename,
        size: buffer.length,
        mimeType,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    // Sprint 8.5B pattern: log full error server-side, return generic
    // message to client to prevent stack trace / internal path leak.
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Upload API] Error:', message, error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengunggah file. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}

// ── GET handler — discovery endpoint ─────────────────────────────────

export async function GET() {
  return NextResponse.json({
    success: true,
    endpoint: '/api/upload',
    methods: ['POST'],
    maxFileSize: `${MAX_SIZE_BYTES / 1024 / 1024}MB`,
    allowedTypes: Array.from(ALLOWED_MIME_TYPES),
  });
}
