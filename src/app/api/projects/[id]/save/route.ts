// ═══════════════════════════════════════════════════════════════════════
// PROJECT SAVE API — Save full project state
// ═══════════════════════════════════════════════════════════════════════
// PUT /api/projects/[id]/save — Save complete project state
//
// This is the main save endpoint. It receives the Zustand canva store
// state (pages, blocks, backgrounds) and persists it to the database.
// The strategy is: delete all existing pages/blocks for the project,
// then re-create them from the provided data. This is simpler and
// more reliable than incremental updates for a full-state save.
//
// SECURITY: Rate limited (60 req/min via middleware), Zod-validated input
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { saveProjectSchema, zodErrorResponse } from '@/lib/api-validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ── Flatten nested blocks (children) for DB storage ───────────────

interface FlatBlock {
  blockType: string;
  blockIndex: number;
  content: string;
  layout: string | null;
}

interface NestedBlock {
  type: string;
  id?: string;
  content?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  variant?: string;
  style?: Record<string, string>;
  children?: NestedBlock[];
}

function flattenBlocks(blocks: NestedBlock[], startIndex: number = 0): FlatBlock[] {
  const result: FlatBlock[] = [];
  let currentIndex = startIndex;

  for (const block of blocks) {
    const { type, content, layout, children, ...rest } = block;

    const contentData: Record<string, unknown> = { ...rest, ...(content || {}) };
    delete contentData.children;

    result.push({
      blockType: type,
      blockIndex: currentIndex,
      content: JSON.stringify(contentData),
      layout: layout ? JSON.stringify(layout) : null,
    });

    currentIndex++;

    if (children && children.length > 0) {
      const childResults = flattenBlocks(children, currentIndex);
      result.push(...childResults);
      currentIndex += childResults.length;
    }
  }

  return result;
}

// ── PUT: Save full project state ──────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const rawBody = await request.json();

    // ── Zod validation ──
    const parsed = saveProjectSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        zodErrorResponse(parsed.error),
        { status: 400 }
      );
    }

    const body = parsed.data;

    // Validate project exists
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Use transaction for atomic save
    await prisma.$transaction(async (tx) => {
      // 1. Delete all existing pages (cascades to blocks)
      await tx.page.deleteMany({ where: { projectId: id } });

      // 2. Update project metadata
      const projectUpdateData: Record<string, unknown> = {};
      if (body.ratioId !== undefined) projectUpdateData.ratioId = body.ratioId;
      if (body.meta?.title !== undefined) projectUpdateData.title = body.meta.title;
      if (body.meta?.description !== undefined) projectUpdateData.description = body.meta.description;
      if (body.meta?.subject !== undefined) projectUpdateData.subject = body.meta.subject;
      if (body.meta?.grade !== undefined) projectUpdateData.grade = body.meta.grade;
      if (body.meta?.semester !== undefined) projectUpdateData.semester = body.meta.semester;
      if (body.meta?.teacherName !== undefined) projectUpdateData.teacherName = body.meta.teacherName;
      if (body.meta?.schoolName !== undefined) projectUpdateData.schoolName = body.meta.schoolName;
      if (body.meta?.templateId !== undefined) projectUpdateData.templateId = body.meta.templateId;
      if (body.meta?.themeId !== undefined) projectUpdateData.themeId = body.meta.themeId;
      if (body.meta?.schemaPreset !== undefined) projectUpdateData.schemaPreset = body.meta.schemaPreset;

      if (body.authoringData) {
        projectUpdateData.authoringData = JSON.stringify(body.authoringData);
      }

      await tx.project.update({
        where: { id },
        data: projectUpdateData,
      });

      // 3. Create pages and blocks
      for (let pageIndex = 0; pageIndex < body.pages.length; pageIndex++) {
        const page = body.pages[pageIndex];

        const createdPage = await tx.page.create({
          data: {
            projectId: id,
            pageIndex,
            label: page.label || null,
            templateType: page.templateType || null,
            variant: page.templateVariant || null,
            bgColor: page.bgColor || null,
            bgImage: page.bgDataUrl || null,
            bgOverlay: page.overlay !== undefined ? page.overlay / 100 : null,
            schemaData: page.schema ? JSON.stringify(page.schema) : null,
            navConfig: page.navConfig ? JSON.stringify(page.navConfig) : null,
            templateData: page.templateData ? JSON.stringify(page.templateData) : null,
            colorPalette: page.colorPalette ? JSON.stringify(page.colorPalette) : null,
          },
        });

        if (page.blocks && page.blocks.length > 0) {
          const flatBlocks = flattenBlocks(page.blocks as NestedBlock[]);

          for (const block of flatBlocks) {
            await tx.block.create({
              data: {
                pageId: createdPage.id,
                blockType: block.blockType,
                blockIndex: block.blockIndex,
                content: block.content,
                layout: block.layout,
              },
            });
          }
        } else if (page.elements && page.elements.length > 0) {
          // Legacy elements: save as blocks so element-mode pages don't lose content
          for (let ei = 0; ei < page.elements.length; ei++) {
            const el = page.elements[ei]!;
            await tx.block.create({
              data: {
                pageId: createdPage.id,
                blockType: el.type,
                blockIndex: ei,
                content: JSON.stringify(el.content || {}),
                layout: null,
              },
            });
          }
        }
      }
    });

    // Fetch the saved project to return
    const savedProject = await prisma.project.findUnique({
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

    return NextResponse.json({
      success: true,
      data: savedProject,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Project Save API] PUT error:', message);
    return NextResponse.json(
      { success: false, error: 'Failed to save project' },
      { status: 500 }
    );
  }
}
