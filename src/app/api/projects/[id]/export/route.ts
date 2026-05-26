// ═══════════════════════════════════════════════════════════════════════
// PROJECT EXPORT API — Export project as standalone HTML
// ═══════════════════════════════════════════════════════════════════════
// GET /api/projects/[id]/export — Export project as standalone HTML
//
// Loads project from DB, reconstructs the Zustand-compatible state,
// and uses the existing Vite SSR export template to generate HTML.
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import fs from 'fs';
import path from 'path';

interface RouteParams {
  params: Promise<{ id: string }>;
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

// ── Reconstruct CanvaPage from DB data ───────────────────────────

interface ReconstructedPage {
  id: string;
  label: string;
  bgDataUrl: string | null;
  bgColor: string;
  overlay: number;
  elements: unknown[];
  templateType: string;
  colorPalette: Record<string, unknown> | null;
  navConfig: Record<string, unknown>;
  templateData: Record<string, unknown>;
  schema?: Record<string, unknown>;
}

function reconstructPages(
  dbPages: Array<{
    id: string;
    label: string | null;
    templateType: string | null;
    variant: string | null;
    bgColor: string | null;
    bgImage: string | null;
    bgOverlay: number | null;
    schemaData: string | null;
    navConfig: string | null;
    templateData: string | null;
    colorPalette: string | null;
    blocks: Array<{
      blockType: string;
      content: string;
    }>;
  }>
): ReconstructedPage[] {
  return dbPages.map((p) => {
    // Parse schema data — if available, blocks are derived from schema
    let schema: Record<string, unknown> | undefined;
    if (p.schemaData) {
      try {
        schema = JSON.parse(p.schemaData);
      } catch {
        // Ignore parse errors
      }
    }

    // Parse blocks into elements if no schema
    const elements: unknown[] = [];
    if (!schema && p.blocks.length > 0) {
      for (const block of p.blocks) {
        try {
          const blockContent = JSON.parse(block.content);
          elements.push({
            type: block.blockType,
            ...blockContent,
          });
        } catch {
          elements.push({ type: block.blockType });
        }
      }
    }

    return {
      id: p.id,
      label: p.label || '',
      bgDataUrl: p.bgImage || null,
      bgColor: p.bgColor || '#ffffff',
      overlay: p.bgOverlay !== null ? Math.round(p.bgOverlay * 100) : 20,
      elements,
      templateType: p.templateType || 'custom',
      colorPalette: p.colorPalette ? (() => { try { return JSON.parse(p.colorPalette); } catch { return null; } })() : null,
      navConfig: p.navConfig ? (() => { try { return JSON.parse(p.navConfig); } catch { return { showNavbar: true, showPrevNext: true, showScore: true, showProgress: true, navbarStyle: 'colorful' }; } })() : { showNavbar: true, showPrevNext: true, showScore: true, showProgress: true, navbarStyle: 'colorful' },
      templateData: p.templateData ? (() => { try { return JSON.parse(p.templateData); } catch { return {}; } })() : {},
      ...(schema ? { schema } : {}),
    };
  });
}

// ── GET: Export project ───────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Load project from DB
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        pages: {
          orderBy: { pageIndex: 'asc' },
          include: {
            blocks: {
              orderBy: { blockIndex: 'asc' },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get cached export template
    const templateBuf = getTemplateBuffer();
    if (!templateBuf) {
      return NextResponse.json(
        { success: false, error: 'Export template not found. Run "npm run export:build" first.' },
        { status: 500 }
      );
    }

    // Reconstruct pages for export
    const pages = reconstructPages(project.pages);

    // Parse authoringData from project — this contains kuis, modules, games, etc.
    let authoringData: Record<string, unknown> = {};
    if (project.authoringData) {
      try {
        authoringData = JSON.parse(project.authoringData);
      } catch {
        // Ignore parse errors
      }
    }

    // Build export data — compatible with the Vite SSR template
    // Hydrate from authoringData (saved by useAutoSave) with DB fallbacks
    const exportData = {
      pages,
      ratioId: project.ratioId || '16:9',
      meta: {
        judulPertemuan: project.title,
        mapel: project.subject || '',
        kelas: project.grade || '',
        guru: project.teacherName || '',
        sekolah: project.schoolName || '',
      },
      allKuis: (authoringData.allKuis as unknown[]) || [],
      allModules: (authoringData.allModules as unknown[]) || [],
      games: (authoringData.games as unknown[]) || [],
      cp: (authoringData.cp as Record<string, unknown>) || {},
      tp: (authoringData.tp as unknown[]) || [],
      atp: (authoringData.atp as Record<string, unknown>) || { namaBab: '', jumlahPertemuan: 0, pertemuan: [] },
      alur: (authoringData.alur as unknown[]) || [],
      materi: (authoringData.materi as Record<string, unknown>) || { blok: [] },
      skenario: (authoringData.skenario as unknown[]) || [],
      petunjuk: (authoringData.petunjuk as Record<string, unknown>) || { title: '', intro: '', langkah: [] },
      diskusi: (authoringData.diskusi as Record<string, unknown>) || { title: '', intro: '', pertanyaan: [] },
      refleksi: (authoringData.refleksi as Record<string, unknown>) || { title: '', intro: '', pertanyaan: [] },
      penutup: (authoringData.penutup as Record<string, unknown>) || { title: '', subjudul: '', preview: [] },
      suara: (authoringData.suara as Record<string, unknown>) || { navigasi: true, benar: true, salah: true, selesai: true, klik: true, skor: true },
    };

    const dataJson = JSON.stringify(exportData)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/\//g, '\\u002f');

    // Size guard
    if (dataJson.length > MAX_EXPORT_SIZE) {
      return NextResponse.json(
        { success: false, error: `Export data too large (${Math.round(dataJson.length / 1_000_000)} MB). Maximum is ${MAX_EXPORT_SIZE / 1_000_000} MB.` },
        { status: 413 }
      );
    }

    // Build the complete HTML
    const templateStr = templateBuf.toString('utf-8');
    const dataScript = `<script>window.__EXPORT_DATA__=${dataJson};</script>\n`;

    const title = `${project.title || 'Media Pembelajaran Interaktif'} | ${project.subject || ''} ${project.grade || ''}`;
    const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const bodyCloseIdx = templateStr.lastIndexOf('</body>');
    let result: string;
    if (bodyCloseIdx !== -1) {
      const before = templateStr.substring(0, bodyCloseIdx).replace(/<title>.*?<\/title>/, `<title>${safeTitle}</title>`);
      const after = templateStr.substring(bodyCloseIdx);
      result = before + dataScript + after;
    } else {
      result = templateStr.replace(/<title>.*?<\/title>/, `<title>${safeTitle}</title>`) + dataScript;
    }

    // Sanitize filename
    const rawName = (project.title || 'media-pembelajaran')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase()
      .replace(/^-|-$/g, '');
    const fileName = `${rawName || 'media-pembelajaran'}-export.html`;

    return new NextResponse(Buffer.from(result, 'utf-8'), {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Project Export API] GET error:', message);
    return NextResponse.json(
      { success: false, error: 'Failed to export project' },
      { status: 500 }
    );
  }
}
