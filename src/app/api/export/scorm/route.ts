// ═══════════════════════════════════════════════════════════════════════
// SCORM 1.2 EXPORT API ROUTE — Generates SCORM ZIP for Moodle LMS
// ═══════════════════════════════════════════════════════════════════════
// Creates a SCORM 1.2 compatible ZIP package containing:
//   - imsmanifest.xml (SCORM manifest)
//   - index.html (the exported HTML content)
//   - ADLCP root files
// Uses the same Vite SSR template as the regular HTML export.

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

// Check if archiver is available for ZIP creation
let archiver: any = null;
try {
  archiver = require('archiver');
} catch {
  // archiver not installed — SCORM export will return an error
}

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

function generateManifest(title: string, identifier: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${identifier}" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                       http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="${identifier}-ORG">
    <organization identifier="${identifier}-ORG">
      <title>${title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</title>
      <item identifier="${identifier}-ITEM" identifierref="${identifier}-RES">
        <title>${title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="${identifier}-RES" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
    </resource>
  </resources>
</manifest>`;
}

export async function POST(request: NextRequest) {
  // Check if archiver is available
  if (!archiver) {
    return NextResponse.json(
      { error: 'SCORM export tidak tersedia. Package archiver belum diinstall.' },
      { status: 501 }
    );
  }

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

    // Build export data (same as regular export)
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
      .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/\//g, '\\u002f');

    if (dataJson.length > MAX_EXPORT_SIZE) {
      return NextResponse.json(
        { error: `Export data too large (${Math.round(dataJson.length / 1_000_000)} MB).` },
        { status: 413 }
      );
    }

    // Build HTML content
    const templateStr = templateBuf.toString('utf-8');
    const dataScript = `<script>window.__EXPORT_DATA__=${dataJson};</script>\n`;
    const title = `${meta?.judulPertemuan || 'Media Pembelajaran Interaktif'}`;
    const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const bodyCloseIdx = templateStr.lastIndexOf('</body>');
    let htmlContent: string;
    if (bodyCloseIdx !== -1) {
      const before = templateStr.substring(0, bodyCloseIdx).replace(/<title>.*?<\/title>/, `<title>${safeTitle}</title>`);
      const after = templateStr.substring(bodyCloseIdx);
      htmlContent = before + dataScript + after;
    } else {
      htmlContent = templateStr.replace(/<title>.*?<\/title>/, `<title>${safeTitle}</title>`) + dataScript;
    }

    // Generate SCORM manifest
    const identifier = `MPI_${Date.now()}`;
    const manifest = generateManifest(title, identifier);

    // Create ZIP using archiver
    const archive = archiver('zip', { zlib: { level: 6 } });

    // Add files to archive
    archive.append(manifest, { name: 'imsmanifest.xml' });
    archive.append(htmlContent, { name: 'index.html' });

    // Finalize archive
    archive.finalize();

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of archive) {
      chunks.push(Buffer.from(chunk));
    }
    const zipBuffer = Buffer.concat(chunks);

    // Filename
    const rawName = (meta?.judulPertemuan || 'media-pembelajaran')
      .replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-')
      .toLowerCase().replace(/^-|-$/g, '');
    const fileName = `${rawName || 'media-pembelajaran'}-scorm.zip`;

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error('[SCORM Export API] Error:', error);
    return NextResponse.json(
      { error: 'SCORM export gagal. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
