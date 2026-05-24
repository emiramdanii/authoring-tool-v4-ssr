// ═══════════════════════════════════════════════════════════════════════
// TEMPLATES API — List & Create
// ═══════════════════════════════════════════════════════════════════════
// GET  /api/templates       — List templates with filtering
// POST /api/templates       — Create a new template
//
// SECURITY: Rate limited (120 req/min via middleware), Zod-validated input
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createTemplateSchema, listTemplatesQuerySchema, zodErrorResponse } from '@/lib/api-validation';

// ── GET: List templates ───────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // ── Zod validation for query params ──
    const parsed = listTemplatesQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parsed.success) {
      return NextResponse.json(
        zodErrorResponse(parsed.error),
        { status: 400 }
      );
    }

    const { page, limit, category, subject, search } = parsed.data;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (subject) where.subject = subject;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        skip,
        take: limit,
        orderBy: { downloads: 'desc' },
      }),
      prisma.template.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: templates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Templates API] GET error:', message);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// ── POST: Create template ─────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

    // ── Zod validation ──
    const parsed = createTemplateSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        zodErrorResponse(parsed.error),
        { status: 400 }
      );
    }

    const body = parsed.data;

    // Serialize schemaData to JSON string if it's an object
    const schemaDataStr = typeof body.schemaData === 'string'
      ? body.schemaData
      : JSON.stringify(body.schemaData);

    const template = await prisma.template.create({
      data: {
        name: body.name,
        description: body.description || null,
        subject: body.subject || null,
        category: body.category || 'community',
        icon: body.icon || null,
        schemaData: schemaDataStr,
        downloads: body.downloads || 0,
        rating: body.rating || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: template,
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Templates API] POST error:', message);
    return NextResponse.json(
      { success: false, error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
