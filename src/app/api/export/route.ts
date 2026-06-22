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

// PATCH-2D: Dev-mode auto-build lock — prevents concurrent builds
let _devBuildLock = false;

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

/**
 * PATCH-2D: In development mode, auto-build the export template if it
 * doesn't exist. This fixes the regression from OPTIMIZE-LAST-01 where
 * `npm run dev` no longer runs `vite build` before starting Next.js.
 *
 * Constraints (per senior audit):
 *   - Dev only (NODE_ENV !== 'production')
 *   - Static command, no user input
 *   - Timeout 60s
 *   - Lock prevents double build
 *   - If build fails, return error clearly
 *
 * Production behavior is unchanged — prebuilt template is required.
 */
async function ensureDevTemplate(): Promise<{ ok: boolean; error?: string }> {
  if (process.env.NODE_ENV === 'production') {
    return { ok: false, error: 'Production mode requires prebuilt template. Run "npm run build" before "npm start".' };
  }

  // Check if template already exists
  if (getTemplateBuffer()) return { ok: true };

  // Lock — prevent concurrent builds
  if (_devBuildLock) {
    // Wait for existing build to finish (poll up to 60s)
    for (let i = 0; i < 120; i++) {
      await new Promise(r => setTimeout(r, 500));
      if (getTemplateBuffer()) return { ok: true };
      if (!_devBuildLock) break;
    }
    return { ok: false, error: 'Export template build timed out (another build in progress).' };
  }

  _devBuildLock = true;
  try {
    console.log('[Export API] Dev mode: auto-building export template...');
    const { execSync } = await import('child_process');
    execSync('npx vite build --config vite.export.config.ts', {
      cwd: process.cwd(),
      timeout: 60000,
      stdio: 'pipe',
    });
    // Reload template cache
    _templateCache = null;
    _templateMtime = 0;
    if (getTemplateBuffer()) {
      console.log('[Export API] Dev mode: export template built successfully.');
      return { ok: true };
    }
    return { ok: false, error: 'Export template build completed but file not found.' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Export template build failed: ${msg}` };
  } finally {
    _devBuildLock = false;
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
    let templateBuf = getTemplateBuffer();
    if (!templateBuf) {
      // PATCH-2D: In dev mode, auto-build the export template
      const devBuild = await ensureDevTemplate();
      if (!devBuild.ok) {
        return NextResponse.json(
          { error: devBuild.error || 'Export template not found.' },
          { status: 500 }
        );
      }
      templateBuf = getTemplateBuffer();
      if (!templateBuf) {
        return NextResponse.json(
          { error: 'Export template still not found after auto-build.' },
          { status: 500 }
        );
      }
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
