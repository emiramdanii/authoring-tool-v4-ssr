// ═══════════════════════════════════════════════════════════════════════
// EXPORT API ROUTE — Lightweight export for containerized environments
// Strategy: Generate export HTML entirely client-side using the pre-built
// Vite template. The API just returns the template; client injects data.
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const TEMPLATE_PATH = path.resolve(process.cwd(), 'export-output', 'index.html');

// Cache template at module level (read once, reuse)
let _templateCache: Buffer | null = null;

function getTemplateBuffer(): Buffer | null {
  if (_templateCache) return _templateCache;
  try {
    _templateCache = fs.readFileSync(TEMPLATE_PATH);
    return _templateCache;
  } catch {
    return null;
  }
}

// Watch for template rebuilds
try {
  fs.watchFile(TEMPLATE_PATH, { interval: 10000 }, () => {
    _templateCache = null; // Invalidate cache
  });
} catch {}

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
      skenario: skenario || [], petunjuk: petunjuk || { title:'',intro:'',langkah:[], tips:'' },
      diskusi: diskusi || { title:'',intro:'',pertanyaan:[] },
      refleksi: refleksi || { title:'',intro:'',pertanyaan:[] },
      penutup: penutup || { title:'',subjudul:'',preview:[] },
      suara: suara || { navigasi: true, benar: true, salah: true, selesai: true, klik: true, skor: true },
    };

    const dataJson = JSON.stringify(exportData)
      .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/\//g, '\\u002f');

    // Build the complete HTML using Buffer operations (zero-copy where possible)
    const templateStr = templateBuf.toString('utf-8');
    const dataScript = `<script>window.__EXPORT_DATA__=${dataJson};</script>\n`;
    
    // Title replacement
    const title = `${meta?.judulPertemuan || 'Media Pembelajaran Interaktif'} | ${meta?.mapel || ''} ${meta?.kelas || ''}`;
    const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
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

    // Convert to buffer for response
    const resultBuf = Buffer.from(result, 'utf-8');
    
    // Clear result string from memory
    // (not strictly necessary in JS, but helps signal GC)

    const fileName = `${(meta?.judulPertemuan || 'media-pembelajaran')
      .replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-')
      .toLowerCase().replace(/^-|-$/g, '')}-export.html`;

    return new NextResponse(resultBuf, {
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
