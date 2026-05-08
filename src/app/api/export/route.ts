// ═══════════════════════════════════════════════════════════════════════
// EXPORT API ROUTE — Generates standalone HTML from pre-built Vite template
// Reads the pre-built template HTML (from vite build), injects the
// export data as window.__EXPORT_DATA__, and returns the complete file.
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Path to the pre-built Vite export template
const TEMPLATE_PATH = path.resolve(process.cwd(), 'export-output', 'index.html');

export async function POST(request: NextRequest) {
  try {
    // 1. Read the request body (export data from frontend)
    const body = await request.json();

    const {
      pages,
      ratioId,
      meta,
      allKuis,
      allModules,
      cp,
      tp,
      materi,
      skenario,
      petunjuk,
      diskusi,
      refleksi,
      penutup,
    } = body;

    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json(
        { error: 'No pages provided for export' },
        { status: 400 }
      );
    }

    // 2. Read the pre-built template HTML
    if (!fs.existsSync(TEMPLATE_PATH)) {
      return NextResponse.json(
        { error: 'Export template not found. Run "npm run export:build" first.' },
        { status: 500 }
      );
    }

    let templateHtml = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

    // 3. Prepare the export data object (will be window.__EXPORT_DATA__)
    const exportData = {
      pages,
      ratioId: ratioId || '16:9',
      meta: meta || {},
      allKuis: allKuis || [],
      allModules: allModules || [],
      cp: cp || {},
      tp: tp || [],
      materi: materi || { blok: [] },
      skenario: skenario || [],
      petunjuk: petunjuk || { title: '', intro: '', langkah: [] },
      diskusi: diskusi || { title: '', intro: '', pertanyaan: [] },
      refleksi: refleksi || { title: '', intro: '', pertanyaan: [] },
      penutup: penutup || { title: '', subjudul: '', preview: [] },
    };

    // 4. Inject export data as a script tag before </body>
    //    Using JSON with XSS-safe escaping
    const dataJson = JSON.stringify(exportData)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/\//g, '\\u002f');

    const dataScript = `<script>window.__EXPORT_DATA__=${dataJson};</script>`;
    templateHtml = templateHtml.replace('</body>', `${dataScript}\n</body>`);

    // 5. Update title with project metadata
    const title = `${meta?.judulPertemuan || 'Media Pembelajaran Interaktif'} | ${meta?.mapel || ''} ${meta?.kelas || ''}`;
    templateHtml = templateHtml.replace(
      /<title>.*?<\/title>/,
      `<title>${title.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</title>`
    );

    // 6. Return the complete HTML file
    const fileName = `${(meta?.judulPertemuan || 'media-pembelajaran')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase()
      .replace(/^-|-$/g, '')}-export.html`;

    return new NextResponse(templateHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error('[Export API] Error:', error);
    return NextResponse.json(
      { error: `Export failed: ${error.message}` },
      { status: 500 }
    );
  }
}
