// ═══════════════════════════════════════════════════════════════════════
// PROJECT API — Get, Update, Delete
// ═══════════════════════════════════════════════════════════════════════
// GET    /api/projects/[id]   — Get project with pages and blocks
// PUT    /api/projects/[id]   — Update project metadata
// DELETE /api/projects/[id]   — Delete project and all related data
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ── GET: Get project with full data ──────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

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

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Project API] GET error:', message);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// ── PUT: Update project metadata ─────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check project exists
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Build update data — only update provided fields
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'title', 'description', 'subject', 'grade', 'semester',
      'teacherName', 'schoolName', 'templateId', 'themeId',
      'schemaPreset', 'ratioId', 'isPublished',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Handle publishedAt when isPublished changes
    if (body.isPublished === true && !existing.isPublished) {
      updateData.publishedAt = new Date();
    } else if (body.isPublished === false) {
      updateData.publishedAt = null;
    }

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Project API] PUT error:', message);
    return NextResponse.json(
      { success: false, error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// ── DELETE: Delete project ───────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Check project exists
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Delete project — cascading deletes will remove pages and blocks
    await prisma.project.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Project API] DELETE error:', message);
    return NextResponse.json(
      { success: false, error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
