// ═══════════════════════════════════════════════════════════════════════
// EXPORT API ROUTE — Generates standalone HTML for exported media
// ═══════════════════════════════════════════════════════════════════════
// Strategy: Inject export data into pre-built Vite SSR template.
// The client-side entry-client.tsx reads window.__EXPORT_DATA__
// and pre-populates Zustand stores, then React renders the same
// template components used in preview mode.
//
// SECURITY: Rate limited (10 req/min via middleware), Zod-validated input
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exportRequestSchema, zodErrorResponse } from '@/lib/api-validation';
import { serializeForHtmlScript } from '@/lib/export/serialize-html-script';

const TEMPLATE_PATH = path.resolve(process.cwd(), 'export-output', 'index.html');

// Maximum export payload size (20 MB JSON)
const MAX_EXPORT_SIZE = 20_000_000;

// Cache template with mtime-based invalidation (no fs.watchFile leak)
let _templateCache: Buffer | null = null;
let _templateMtime: number = 0;

function getTemplateBuffer(): Buffer | null {
  try {
    const stat = fs.statSync(TEMPLATE_PATH);
    if (_templateCache && _templateMtime === stat.mtimeMs) {
      return _templateCache;
    }
    _templateCache = fs.readFileSync(TEMPLATE_PATH);
    _templateMtime = stat.mtimeMs;
    return _templateCache;
  } catch {
    _templateCache = null;
    _templateMtime = 0;
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

    // ── Zod validation ──
    const parsed = exportRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        zodErrorResponse(parsed.error),
        { status: 400 }
      );
    }

    const body = parsed.data;

    // Get cached template
    const templateBuf = getTemplateBuffer();
    if (!templateBuf) {
      return NextResponse.json(
        { error: 'Export template not found. Run "npm run export:build" first.' },
        { status: 500 }
      );
    }

    // Build export data JSON string
    const exportData = {
      pages: body.pages, ratioId: body.ratioId || '16:9', meta: body.meta || {},
      allKuis: body.allKuis || [], allModules: body.allModules || [], games: body.games || [],
      cp: body.cp || {}, tp: body.tp || [], atp: body.atp || { namaBab: '', jumlahPertemuan: 0, pertemuan: [] },
      alur: body.alur || [], materi: body.materi || { blok: [] },
      skenario: body.skenario || [], petunjuk: body.petunjuk || { title:'',intro:'',langkah:[] },
      diskusi: body.diskusi || { title:'',intro:'',pertanyaan:[] },
      refleksi: body.refleksi || { title:'',intro:'',pertanyaan:[] },
      penutup: body.penutup || { title:'',subjudul:'',preview:[] },
      suara: body.suara || { navigasi: true, benar: true, salah: true, selesai: true, klik: true, skor: true },
    };

    const dataJson = serializeForHtmlScript(exportData);

    // Size guard: reject excessively large payloads (likely uncompressed images)
    if (dataJson.length > MAX_EXPORT_SIZE) {
      return NextResponse.json(
        { error: `Export data too large (${Math.round(dataJson.length / 1_000_000)} MB). Maximum is ${MAX_EXPORT_SIZE / 1_000_000} MB. Try reducing background image sizes.` },
        { status: 413 }
      );
    }

    // Build the complete HTML using Buffer operations
    const templateStr = templateBuf.toString('utf-8');
    const dataScript = `<script>window.__EXPORT_DATA__=${dataJson};</script>\n`;
    
    // Title replacement with XSS-safe encoding
    const meta = body.meta as Record<string, string> | undefined;
    const title = `${meta?.judulPertemuan || 'Media Pembelajaran Interaktif'} | ${meta?.mapel || ''} ${meta?.kelas || ''}`;
    const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    
    // Inject: split at </body>, insert data script
    const bodyCloseIdx = templateStr.lastIndexOf('</body>');
    let result: string;
    if (bodyCloseIdx !== -1) {
      const before = templateStr.substring(0, bodyCloseIdx).replace(/<title>.*?<\/title>/, `<title>${safeTitle}</title>`);
      const after = templateStr.substring(bodyCloseIdx);
      result = before + dataScript + after;
    } else {
      result = templateStr.replace(/<title>.*?<\/title>/, `<title>${safeTitle}</title>`) + dataScript;
    }

    // Sanitize filename — ensure it's never empty
    const rawName = (meta?.judulPertemuan || 'media-pembelajaran')
      .replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-')
      .toLowerCase().replace(/^-|-$/g, '');
    const fileName = `${rawName || 'media-pembelajaran'}-export.html`;

    return new NextResponse(Buffer.from(result, 'utf-8'), {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: unknown) {
    // Sprint 8.5B: log full error server-side, but return GENERIC message
    // to client to prevent stack trace / internal detail leak.
    const message = error instanceof Error ? error.message : 'Export gagal';
    console.error('[Export API] Error:', message, error);
    return NextResponse.json(
      { success: false, error: 'Export gagal. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
