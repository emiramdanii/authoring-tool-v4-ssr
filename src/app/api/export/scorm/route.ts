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
import { serializeForHtmlScript } from '@/lib/export/serialize-html-script';

// Check if archiver is available for ZIP creation
// eslint-disable-next-line @typescript-eslint/no-require-imports
let archiver: (typeof import('archiver')) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
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

    const dataJson = serializeForHtmlScript(exportData);

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

    // SCORM 1.2 API wrapper — bridges exported app scoring to LMS
    const scormWrapperScript = `<script>
// SCORM 1.2 API Wrapper for SILSE Export
(function(){
  var api = null;
  function findAPI(win){
    var tries = 0;
    while(win && !win.API && win.parent !== win && tries < 10){
      tries++; win = win.parent;
    }
    return win ? win.API : null;
  }
  function initAPI(){
    try { api = findAPI(window); } catch(e){}
    if(!api){
      try { api = findAPI(window.opener); } catch(e){}
    }
    if(api){
      try { api.LMSInitialize(""); } catch(e){}
    }
  }
  function setValue(key,val){
    if(api){ try{ api.LMSSetValue(key, String(val)); api.LMSCommit(""); }catch(e){} }
  }
  function getValue(key){
    if(api){ try{ return api.LMSGetValue(key); }catch(e){} }
    return "";
  }
  function finish(){
    if(api){ try{ api.LMSFinish(""); }catch(e){} }
  }
  initAPI();
  if(api){
    setValue("cmi.core.lesson_status","incomplete");
    setValue("cmi.core.score.min","0");
  }
  // Expose SCORM helpers globally for the export app
  window.__SCORM = {
    reportScore: function(score, maxScore){
      if(!api) return;
      var pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
      setValue("cmi.core.score.raw", score);
      setValue("cmi.core.score.max", maxScore);
      setValue("cmi.core.lesson_status", pct >= 70 ? "passed" : "failed");
    },
    reportComplete: function(){
      if(!api) return;
      var status = getValue("cmi.core.lesson_status");
      if(status !== "passed" && status !== "failed"){
        setValue("cmi.core.lesson_status","completed");
      }
    },
    finish: finish,
    hasAPI: !!api
  };
  // Auto-finish on page unload
  window.addEventListener("beforeunload", function(){ finish(); });
})();
</script>\n`;

    const bodyCloseIdx = templateStr.lastIndexOf('</body>');
    let htmlContent: string;
    if (bodyCloseIdx !== -1) {
      const before = templateStr.substring(0, bodyCloseIdx).replace(/<title>.*?<\/title>/, `<title>${safeTitle}</title>`);
      const after = templateStr.substring(bodyCloseIdx);
      htmlContent = before + scormWrapperScript + dataScript + after;
    } else {
      htmlContent = templateStr.replace(/<title>.*?<\/title>/, `<title>${safeTitle}</title>`) + scormWrapperScript + dataScript;
    }

    // Generate SCORM manifest
    const identifier = `MPI_${Date.now()}`;
    const manifest = generateManifest(title, identifier);

    // Create ZIP using archiver
    const archive = archiver!('zip', { zlib: { level: 6 } });

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
  } catch (error: unknown) {
    // Sprint 8.5B: log full error server-side, but return GENERIC message
    // to client to prevent stack trace / internal detail leak.
    const message = error instanceof Error ? error.message : 'Export gagal';
    console.error('[SCORM Export API] Error:', message, error);
    return NextResponse.json(
      { success: false, error: 'Export SCORM gagal. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
