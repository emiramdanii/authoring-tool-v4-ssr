// ═══════════════════════════════════════════════════════════════════════
// PROJECT PDF EXPORT API — Generate native PDF from a saved project
// ═══════════════════════════════════════════════════════════════════════
// GET /api/projects/[id]/pdf — Generate and download a PDF file
//
// Query params:
//   ?format=A4|Letter   — Paper format (default: A4)
//   ?landscape=true     — Landscape orientation (default: false)
//   ?answers=true       — Include answer keys (default: true)
//
// Loads project from Prisma DB, reconstructs HTML from the export
// template (same pipeline as the HTML export), then uses Puppeteer
// to render the HTML to a PDF with proper Indonesian formatting.
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generatePdf } from '@/lib/pdf-export';
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

// ── Reconstruct CanvaPage from DB data (same as export route) ────────

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
    let schema: Record<string, unknown> | undefined;
    if (p.schemaData) {
      try {
        schema = JSON.parse(p.schemaData);
      } catch {
        // Ignore parse errors
      }
    }

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
      bgColor: p.bgColor || '#0f172a',
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

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    const format = searchParams.get('format') === 'Letter' ? 'Letter' : 'A4';
    const landscape = searchParams.get('landscape') === 'true';
    const includeAnswerKeys = searchParams.get('answers') !== 'false';

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

    // Reconstruct pages for export
    const pages = reconstructPages(project.pages as any);

    // Build export data — compatible with the Vite SSR template
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
      allKuis: [],
      allModules: [],
      games: [],
      cp: {},
      tp: [],
      atp: { namaBab: '', jumlahPertemuan: 0, pertemuan: [] },
      alur: [],
      materi: { blok: [] },
      skenario: [],
      petunjuk: { title: '', intro: '', langkah: [] },
      diskusi: { title: '', intro: '', pertanyaan: [] },
      refleksi: { title: '', intro: '', pertanyaan: [] },
      penutup: { title: '', subjudul: '', preview: [] },
      suara: { navigasi: true, benar: true, salah: true, selesai: true, klik: true, skor: true },
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

    // Build HTML content from template
    let htmlContent: string;
    const templateBuf = getTemplateBuffer();

    if (templateBuf) {
      // Use the Vite SSR export template (same as HTML export)
      const templateStr = templateBuf.toString('utf-8');
      const dataScript = `<script>window.__EXPORT_DATA__=${dataJson};</script>\n`;

      const titleStr = `${project.title || 'Media Pembelajaran Interaktif'} | ${project.subject || ''} ${project.grade || ''}`;
      const safeTitle = titleStr.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

      const bodyCloseIdx = templateStr.lastIndexOf('</body>');
      if (bodyCloseIdx !== -1) {
        const before = templateStr.substring(0, bodyCloseIdx).replace(/<title>.*?<\/title>/, `<title>${safeTitle}</title>`);
        const after = templateStr.substring(bodyCloseIdx);
        htmlContent = before + dataScript + after;
      } else {
        htmlContent = templateStr.replace(/<title>.*?<\/title>/, `<title>${safeTitle}</title>`) + dataScript;
      }
    } else {
      // Fallback: generate simple HTML when no template is available
      htmlContent = generateFallbackHtml(exportData);
    }

    // Generate PDF via Puppeteer
    const pdfBuffer = await generatePdf(htmlContent, {
      title: project.title || 'Media Pembelajaran Interaktif',
      format,
      landscape,
      includeAnswerKeys,
    });

    // Sanitize filename
    const filename = `${(project.title || 'media-pembelajaran')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase()
      .replace(/^-|-$/g, '') || 'media-pembelajaran'}.pdf`;

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
    console.error('[Project PDF Export API] GET error:', message);
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

// ── Fallback HTML generator ────────────────────────────────────────
// Used when the Vite SSR export template is not available.

function generateFallbackHtml(state: {
  pages: ReconstructedPage[];
  meta: Record<string, string>;
}): string {
  const meta = state.meta || {};
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${(meta.judulPertemuan || 'Media Pembelajaran Interaktif').replace(/</g, '&lt;')}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Noto Sans', 'Segoe UI', sans-serif; color: #1f2937; background: #fff; }
    .page { page-break-after: always; padding: 30px; min-height: 90vh; }
    .page:last-child { page-break-after: auto; }
    .block { margin: 20px 0; padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px; }
    .block-title { font-weight: 700; font-size: 1.2em; margin-bottom: 12px; color: #1e40af; }
    .game-block { background: #f0f9ff; border-color: #93c5fd; }
    .cover { text-align: center; padding: 60px 30px; background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; border-radius: 16px; }
    .cover h1 { font-size: 2em; margin-bottom: 16px; }
    .cover p { font-size: 1.1em; opacity: 0.9; }
    .quiz-question { margin: 12px 0; padding: 12px; background: #fefce8; border-radius: 8px; }
    .quiz-option { padding: 8px 12px; margin: 4px 0; border-radius: 6px; }
    .quiz-correct { background: #dcfce7; font-weight: 600; }
    .print-answers .answer-key { display: block !important; }
    .answer-key { display: none; background: #f0fdf4; border: 2px solid #86efac; padding: 12px; margin-top: 8px; border-radius: 8px; font-weight: 600; }
    .meta-info { text-align: center; margin-bottom: 24px; padding: 12px; background: #f8fafc; border-radius: 8px; }
    .meta-info p { font-size: 0.9em; color: #64748b; }
  </style>
</head>
<body>
  ${state.pages.map((page) => `
    <div class="page" ${page.bgColor ? `style="background-color:${page.bgColor}"` : ''}>
      ${page.label ? `<h2>${page.label.replace(/</g, '&lt;')}</h2>` : ''}
      ${page.elements.map((el: any) => renderBlockToHtml(el)).join('')}
    </div>
  `).join('')}
</body>
</html>`;
}

function renderBlockToHtml(block: Record<string, unknown>): string {
  const type = block.type as string;
  const b = block as Record<string, any>;

  if (type === 'cover') {
    return `<div class="block cover">
      <h1>${(b.title || 'Media Pembelajaran Interaktif').replace(/</g, '&lt;')}</h1>
      <p>${(b.subtitle || '').replace(/</g, '&lt;')}</p>
      ${b.badges ? (b.badges as any[]).map((bd: any) => `<p>${bd.text || ''}</p>`).join('') : ''}
    </div>`;
  }

  if (['kuis', 'sortir-game', 'roda-game', 'memory-game', 'matching-game', 'fill-blank-game',
       'word-search-game', 'true-false-game', 'drag-drop-game', 'crossword-game', 'team-buzzer-game'].includes(type)) {
    return `<div class="block game-block">
      <div class="block-title">${(b.title || type).replace(/</g, '&lt;')}</div>
      <div class="answer-key">Kunci Jawaban: ${(b.answerKey || b.correctAnswer || 'Lihat jawaban di bawah').replace(/</g, '&lt;')}</div>
    </div>`;
  }

  return `<div class="block">
    <div class="block-title">${(b.title || type).replace(/</g, '&lt;')}</div>
    <div>${(b.body || b.text || b.description || b.content || '').replace(/</g, '&lt;')}</div>
  </div>`;
}
