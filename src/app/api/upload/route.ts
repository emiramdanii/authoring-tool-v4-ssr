// ═══════════════════════════════════════════════════════════════════════
// UPLOAD API — Image Upload & Media Library
// ═══════════════════════════════════════════════════════════════════════
// POST /api/upload  — Upload image file (multipart/form-data)
// GET  /api/upload  — List all uploaded images
// DELETE /api/upload — Delete an uploaded image by filename
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readdir, stat, unlink } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';

// ── Configuration ─────────────────────────────────────────────────
const UPLOAD_DIR = join(process.cwd(), 'public', 'upload', 'images');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

// ── Helper: Generate unique filename ──────────────────────────────
function generateFilename(originalName: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const suffix = randomBytes(3).toString('hex');
  const ext = getExtension(originalName);
  return `img-${timestamp}-${suffix}${ext}`;
}

function getExtension(filename: string): string {
  const lower = filename.toLowerCase();
  for (const ext of ALLOWED_EXTENSIONS) {
    if (lower.endsWith(ext)) return ext;
  }
  // Fallback: try to get last part after dot
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex > 0) return filename.substring(dotIndex).toLowerCase();
  return '.jpg';
}

function isValidExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

// ── POST: Upload image ────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'File tidak ditemukan. Pastikan mengirim file dengan key "file".' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `Ukuran file terlalu besar. Maksimum 5MB. File Anda: ${(file.size / 1024 / 1024).toFixed(1)}MB` },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `Tipe file tidak didukung. Hanya: JPG, PNG, GIF, WebP, SVG. File Anda: ${file.type || 'unknown'}` },
        { status: 400 }
      );
    }

    // Validate extension
    if (!isValidExtension(file.name)) {
      return NextResponse.json(
        { success: false, error: `Ekstensi file tidak didukung. Hanya: .jpg, .png, .gif, .webp, .svg` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const filename = generateFilename(file.name);
    const filepath = join(UPLOAD_DIR, filename);

    // Ensure upload directory exists
    const { mkdir } = await import('fs/promises');
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Save file (no resizing — keeping it simple without sharp dependency)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    const url = `/upload/images/${filename}`;

    return NextResponse.json({
      success: true,
      url,
      filename,
      size: file.size,
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Upload API] POST error:', message);
    return NextResponse.json(
      { success: false, error: 'Gagal mengunggah file. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}

// ── GET: List uploaded images ─────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Ensure directory exists
    const { mkdir } = await import('fs/promises');
    await mkdir(UPLOAD_DIR, { recursive: true });

    const files = await readdir(UPLOAD_DIR);
    const imageFiles = files.filter((f) => f !== '.gitkeep' && isValidExtension(f));

    // Filter by search term
    const filtered = search
      ? imageFiles.filter((f) => f.toLowerCase().includes(search.toLowerCase()))
      : imageFiles;

    // Get file metadata
    const images = await Promise.all(
      filtered.map(async (filename) => {
        try {
          const filepath = join(UPLOAD_DIR, filename);
          const fileStat = await stat(filepath);
          return {
            url: `/upload/images/${filename}`,
            filename,
            size: fileStat.size,
            lastModified: fileStat.mtime.toISOString(),
          };
        } catch {
          return null;
        }
      })
    );

    // Filter out nulls and sort by lastModified descending
    const validImages = images
      .filter((img): img is NonNullable<typeof img> => img !== null)
      .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

    return NextResponse.json({
      success: true,
      data: validImages,
      total: validImages.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Upload API] GET error:', message);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat daftar gambar.' },
      { status: 500 }
    );
  }
}

// ── DELETE: Remove uploaded image ─────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json(
        { success: false, error: 'Parameter filename diperlukan.' },
        { status: 400 }
      );
    }

    // Security: prevent path traversal
    if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      return NextResponse.json(
        { success: false, error: 'Nama file tidak valid.' },
        { status: 400 }
      );
    }

    // Validate extension
    if (!isValidExtension(filename)) {
      return NextResponse.json(
        { success: false, error: 'Tipe file tidak didukung.' },
        { status: 400 }
      );
    }

    const filepath = join(UPLOAD_DIR, filename);

    // Check if file exists
    try {
      await stat(filepath);
    } catch {
      return NextResponse.json(
        { success: false, error: 'File tidak ditemukan.' },
        { status: 404 }
      );
    }

    await unlink(filepath);

    return NextResponse.json({
      success: true,
      message: `File ${filename} berhasil dihapus.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Upload API] DELETE error:', message);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus file.' },
      { status: 500 }
    );
  }
}
