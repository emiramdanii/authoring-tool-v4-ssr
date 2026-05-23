// ═══════════════════════════════════════════════════════════════════════
// EXPORT API ROUTE — Generates standalone HTML for exported media
// Strategy: Inject export data into pre-built Vite SSR template.
// The client-side entry-client.tsx reads window.__EXPORT_DATA__
// and pre-populates Zustand stores, then React renders the same
// template components used in preview mode.
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const TEMPLATE_PATH = path.resolve(process.cwd(), 'export-output', 'index.html');

// Maximum export payload size (20 MB JSON ≈ ~30 MB HTML after injection)
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
    const body = await request.json();
    const { pages, ratioId, meta, allKuis, allModules, games,
            cp, tp, atp, alur, materi, skenario, petunjuk, diskusi, refleksi, penutup, suara } = body;

    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json({ error: 'No pages provided' }, { status: 400 });
    }

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
      pages, ratioId: ratioId || '16:9', meta: meta || {},
      allKuis: allKuis || [], allModules: allModules || [], games: games || [],
      cp: cp || {}, tp: tp || [], atp: atp || { namaBab: '', jumlahPertemuan: 0, pertemuan: [] },
      alur: alur || [], materi: materi || { blok: [] },
      skenario: skenario || [], petunjuk: petunjuk || { title:'',intro:'',langkah:[] },
      diskusi: diskusi || { title:'',intro:'',pertanyaan:[] },
      refleksi: refleksi || { title:'',intro:'',pertanyaan:[] },
      penutup: penutup || { title:'',subjudul:'',preview:[] },
      suara: suara || { navigasi: true, benar: true, salah: true, selesai: true, klik: true, skor: true },
    };

    const dataJson = JSON.stringify(exportData)
      .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/\//g, '\\u002f');

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
    // Log full error server-side, return generic message to client
    const message = error instanceof Error ? error.message : 'Export gagal';
    console.error('[Export API] Error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
