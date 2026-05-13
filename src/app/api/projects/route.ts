// ═══════════════════════════════════════════════════════════════════════
// PROJECTS API — List & Create
// ═══════════════════════════════════════════════════════════════════════
// GET  /api/projects          — List all projects with pagination
// POST /api/projects          — Create a new project
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// ── GET: List projects ────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const subject = searchParams.get('subject') || undefined;
    const grade = searchParams.get('grade') || undefined;
    const search = searchParams.get('search') || undefined;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};
    if (subject) where.subject = subject;
    if (grade) where.grade = grade;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { teacherName: { contains: search } },
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: { select: { pages: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Projects API] GET error:', message);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// ── POST: Create project ──────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title || typeof body.title !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        title: body.title,
        description: body.description || null,
        subject: body.subject || null,
        grade: body.grade || null,
        semester: body.semester || null,
        teacherName: body.teacherName || null,
        schoolName: body.schoolName || null,
        templateId: body.templateId || null,
        themeId: body.themeId || null,
        schemaPreset: body.schemaPreset || null,
        ratioId: body.ratioId || null,
        isPublished: body.isPublished || false,
      },
    });

    return NextResponse.json({
      success: true,
      data: project,
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Projects API] POST error:', message);
    return NextResponse.json(
      { success: false, error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
