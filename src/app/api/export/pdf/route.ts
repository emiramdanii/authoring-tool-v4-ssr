// ═══════════════════════════════════════════════════════════════════════
// CANVA-LEVEL PDF EXPORT API — Generate PDF from client-side HTML
// ═══════════════════════════════════════════════════════════════════════
// POST /api/export/pdf — Generate PDF from HTML content sent by client
//
// Request body (JSON):
//   htmlContent      — Required. The full HTML string to render
//   title            — Document title for header/footer (default: "MPI Learning Media")
//   format           — "A4" | "Letter" (default: "A4")
//   landscape        — boolean (default: false)
//   includeAnswerKeys — boolean (default: true)
//
// This route mirrors the existing /api/export HTML route pattern but
// generates a native PDF instead of HTML. The client sends the same
// export data payload, and the server reconstructs the HTML using the
// Vite SSR template (if available), then generates a PDF via Puppeteer.
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { generatePdf } from '@/lib/pdf-export';
import fs from 'fs';
import path from 'path';

const TEMPLATE_PATH = path.resolve(process.cwd(), 'export-output', 'index.html');
const MAX_EXPORT_SIZE = 20_000_000;

// Cache template with mtime-based invalidation
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
    const {
      htmlContent,
      title,
      format,
      landscape,
      includeAnswerKeys,
      // Also accept the same export data payload as /api/export
      pages, ratioId, meta, allKuis, allModules, games,
      cp, tp, atp, alur, materi, skenario, petunjuk, diskusi, refleksi, penutup, suara,
    } = body;

    let finalHtml: string;
    let docTitle = title || 'Media Pembelajaran Interaktif';

    // Strategy 1: If htmlContent is provided directly, use it
    if (htmlContent) {
      finalHtml = htmlContent;
    }
    // Strategy 2: If export data payload is provided, build HTML from template
    else if (pages && Array.isArray(pages) && pages.length > 0) {
      const templateBuf = getTemplateBuffer();
      if (!templateBuf) {
        return NextResponse.json(
          { error: 'Export template not found and no htmlContent provided. Run "npm run export:build" first.' },
          { status: 500 }
        );
      }

      // Build export data JSON string (same logic as /api/export)
      const exportData = {
        pages, ratioId: ratioId || '16:9', meta: meta || {},
        allKuis: allKuis || [], allModules: allModules || [], games: games || [],
        cp: cp || {}, tp: tp || [], atp: atp || { namaBab: '', jumlahPertemuan: 0, pertemuan: [] },
        alur: alur || [], materi: materi || { blok: [] },
        skenario: skenario || [], petunjuk: petunjuk || { title: '', intro: '', langkah: [] },
        diskusi: diskusi || { title: '', intro: '', pertanyaan: [] },
        refleksi: refleksi || { title: '', intro: '', pertanyaan: [] },
        penutup: penutup || { title: '', subjudul: '', preview: [] },
        suara: suara || { navigasi: true, benar: true, salah: true, selesai: true, klik: true, skor: true },
      };

      const dataJson = JSON.stringify(exportData)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/\//g, '\\u002f');

      // Size guard
      if (dataJson.length > MAX_EXPORT_SIZE) {
        return NextResponse.json(
          { error: `Export data too large (${Math.round(dataJson.length / 1_000_000)} MB). Maximum is ${MAX_EXPORT_SIZE / 1_000_000} MB. Try reducing background image sizes.` },
          { status: 413 }
        );
      }

      // Build HTML from template
      const templateStr = templateBuf.toString('utf-8');
      const dataScript = `<script>window.__EXPORT_DATA__=${dataJson};</script>\n`;

      const titleStr = `${meta?.judulPertemuan || 'Media Pembelajaran Interaktif'} | ${meta?.mapel || ''} ${meta?.kelas || ''}`;
      const safeTitle = titleStr.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      docTitle = meta?.judulPertemuan || title || 'Media Pembelajaran Interaktif';

      const bodyCloseIdx = templateStr.lastIndexOf('</body>');
      if (bodyCloseIdx !== -1) {
        const before = templateStr.substring(0, bodyCloseIdx).replace(/<title>.*?<\/title>/, `<title>${safeTitle}</title>`);
        const after = templateStr.substring(bodyCloseIdx);
        finalHtml = before + dataScript + after;
      } else {
        finalHtml = templateStr.replace(/<title>.*?<\/title>/, `<title>${safeTitle}</title>`) + dataScript;
      }
    } else {
      return NextResponse.json(
        { error: 'Either htmlContent or pages array is required' },
        { status: 400 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generatePdf(finalHtml, {
      title: docTitle,
      format: format || 'A4',
      landscape: landscape || false,
      includeAnswerKeys: includeAnswerKeys !== false,
    });

    // Sanitize filename
    const rawName = (docTitle || 'mpi-export')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase()
      .replace(/^-|-$/g, '');
    const filename = `${rawName || 'mpi-export'}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[PDF Export API] Error:', message);
    return NextResponse.json(
      { error: 'Failed to generate PDF. Please try again.' },
      { status: 500 }
    );
  }
}
