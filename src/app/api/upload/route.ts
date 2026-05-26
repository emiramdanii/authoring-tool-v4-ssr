// ═══════════════════════════════════════════════════════════════════════
// UPLOAD API — Image upload for authoring tool
// ═══════════════════════════════════════════════════════════════════════
// POST   /api/upload     — Upload an image file
// GET    /api/upload     — List uploaded images
// DELETE /api/upload     — Delete an uploaded image
//
// Uses local filesystem storage in /upload directory.
// For production, replace with cloud storage (S3, GCS, etc.)
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.resolve(process.cwd(), 'upload');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

// Ensure upload directory exists
function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

// ── POST: Upload file ──────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    ensureUploadDir();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File tidak ditemukan' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File terlalu besar (maksimal ${MAX_FILE_SIZE / 1024 / 1024}MB)` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Tipe file tidak didukung. Gunakan JPEG, PNG, GIF, WebP, atau SVG.' },
        { status: 400 }
      );
    }

    // Generate safe filename
    const ext = path.extname(file.name) || '.png';
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const filePath = path.join(UPLOAD_DIR, safeName);

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    // Return URL relative to the app root
    const url = `/upload/${safeName}`;

    return NextResponse.json({
      success: true,
      url,
      filename: safeName,
      size: file.size,
      type: file.type,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Upload API] POST error:', message);
    return NextResponse.json(
      { success: false, error: 'Gagal mengunggah file' },
      { status: 500 }
    );
  }
}

// ── GET: List uploaded files ────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    ensureUploadDir();

    const search = request.nextUrl.searchParams.get('search') || '';
    const files = fs.readdirSync(UPLOAD_DIR);

    const images = files
      .filter(f => {
        const ext = path.extname(f).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
      })
      .filter(f => !search || f.toLowerCase().includes(search.toLowerCase()))
      .map(f => {
        const stat = fs.statSync(path.join(UPLOAD_DIR, f));
        return {
          filename: f,
          url: `/upload/${f}`,
          size: stat.size,
          uploadedAt: stat.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    return NextResponse.json({
      success: true,
      data: images,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Upload API] GET error:', message);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat daftar gambar' },
      { status: 500 }
    );
  }
}

// ── DELETE: Remove uploaded file ────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const filename = request.nextUrl.searchParams.get('filename');

    if (!filename) {
      return NextResponse.json(
        { success: false, error: 'Parameter filename wajib diisi' },
        { status: 400 }
      );
    }

    // Prevent path traversal
    const safeName = path.basename(filename);
    const filePath = path.join(UPLOAD_DIR, safeName);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: 'File tidak ditemukan' },
        { status: 404 }
      );
    }

    fs.unlinkSync(filePath);

    return NextResponse.json({
      success: true,
      message: 'File berhasil dihapus',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Upload API] DELETE error:', message);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus file' },
      { status: 500 }
    );
  }
}
