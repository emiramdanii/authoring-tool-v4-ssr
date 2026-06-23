// ═══════════════════════════════════════════════════════════════════════
// EXPORT API ROUTE — Generates standalone HTML for exported media
// ═══════════════════════════════════════════════════════════════════════
// Strategy: Inject export data into pre-built Vite SSR template.
// The client-side entry-client.tsx reads window.__EXPORT_DATA__
// and pre-populates Zustand stores, then React renders the same
// template components used in preview mode.
//
// SECURITY: Rate limited (10 req/min via middleware), Zod-validated input
//
// V5-BLOCKER-FIX-01B: Added freshness gate. In dev mode, the API now
// detects stale export bundle (source files newer than template) and
// rebuilds before serving. This prevents the V5-003 regression where
// `npm run dev` served a stale bundle after source changes.
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

// V5-BLOCKER-FIX-01B: Source files whose mtime determines export bundle
// freshness. If ANY of these is newer than export-output/index.html,
// the bundle is stale and must be rebuilt in dev mode.
//
// This list is intentionally focused on files that directly affect the
// export bundle's runtime behavior. Adding every source file would
// cause excessive rebuilds; we only include files that, when changed,
// could break the export render.
const EXPORT_SOURCE_PATHS = [
  'src/export/entry-client.tsx',
  'src/export/ExportApp.tsx',
  'src/export/export.css',
  'vite.export.config.ts',
  'src/components/canva/page-renderer/PageRenderer.tsx',
  'src/components/canva/page-renderer/PageFrame.tsx',
  'src/components/canva/page-renderer/BlockRenderer.tsx',
  'src/core/renderer/SchemaRenderer.tsx',
  'src/core/scene/SceneLayoutEngine.ts',
  'src/store/canva-store.ts',
  'src/store/learning-media-store.ts',
  'src/store/interactive-store.ts',
];

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
 * V5-BLOCKER-FIX-01B: Check if the export bundle is stale.
 *
 * Returns the latest source mtime among EXPORT_SOURCE_PATHS, or 0 if
 * no source files are found. The caller compares this against the
 * template's mtime to decide whether a rebuild is needed.
 *
 * Stale condition: any source file's mtime > template's mtime.
 *
 * In production this function is NOT called (ensureDevTemplate is
 * dev-only). Production requires a prebuilt template via `npm run build`.
 */
function getLatestSourceMtime(): number {
  let latest = 0;
  for (const rel of EXPORT_SOURCE_PATHS) {
    try {
      const full = path.resolve(process.cwd(), rel);
      const stat = fs.statSync(full);
      if (stat.mtimeMs > latest) latest = stat.mtimeMs;
    } catch {
      // Source file missing — skip (can't be newer than template)
    }
  }
  return latest;
}

/**
 * V5-BLOCKER-FIX-01B: Check if export template is stale.
 *
 * Stale = any source file's mtime > template's mtime.
 * Fresh = template exists and no source is newer than template.
 */
function isTemplateStale(): boolean {
  try {
    const templateStat = fs.statSync(TEMPLATE_PATH);
    const templateMtime = templateStat.mtimeMs;
    const sourceMtime = getLatestSourceMtime();
    return sourceMtime > templateMtime;
  } catch {
    // Template missing — not "stale" per se, but missing (handled elsewhere)
    return false;
  }
}

/**
 * PATCH-2D + V5-BLOCKER-FIX-01B: In development mode, auto-build the
 * export template if it doesn't exist OR if it's stale (source files
 * are newer than the bundle).
 *
 * This fixes the V5-003 regression where `npm run dev` served a stale
 * bundle after source changes, causing exported HTML to render blank.
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
async function ensureDevTemplate(): Promise<{ ok: boolean; error?: string; rebuilt?: boolean }> {
  if (process.env.NODE_ENV === 'production') {
    return { ok: false, error: 'Production mode requires prebuilt template. Run "npm run build" before "npm start".' };
  }

  // V5-BLOCKER-FIX-01B: Check freshness — rebuild if stale
  const templateExists = !!getTemplateBuffer();
  const stale = isTemplateStale();

  if (templateExists && !stale) {
    // Fresh — use cache
    return { ok: true, rebuilt: false };
  }

  if (stale) {
    console.log('[Export API] Dev mode: export template is STALE (source files newer than bundle). Rebuilding...');
  } else if (!templateExists) {
    console.log('[Export API] Dev mode: export template MISSING. Building...');
  }

  // Lock — prevent concurrent builds
  if (_devBuildLock) {
    // Wait for existing build to finish (poll up to 60s)
    for (let i = 0; i < 120; i++) {
      await new Promise(r => setTimeout(r, 500));
      // After another build finishes, recheck freshness — it might
      // still be stale if source changed again during build
      if (getTemplateBuffer() && !isTemplateStale()) return { ok: true, rebuilt: false };
      if (!_devBuildLock) break;
    }
    return { ok: false, error: 'Export template build timed out (another build in progress).' };
  }

  _devBuildLock = true;
  try {
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
      // Verify freshness after rebuild (source shouldn't be newer now)
      const stillStale = isTemplateStale();
      if (stillStale) {
        console.warn('[Export API] Dev mode: template rebuilt but still stale — source mtime may be in future.');
      } else {
        console.log('[Export API] Dev mode: export template rebuilt successfully (fresh).');
      }
      return { ok: true, rebuilt: true };
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
    // V5-BLOCKER-FIX-01B: Check freshness even when template exists.
    // Previously, ensureDevTemplate was only called when template was
    // missing — stale bundles were served without rebuild.
    if (!templateBuf || (process.env.NODE_ENV !== 'production' && isTemplateStale())) {
      // PATCH-2D + V5-BLOCKER-FIX-01B: In dev mode, auto-build the export
      // template if missing OR stale (source files newer than bundle).
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
