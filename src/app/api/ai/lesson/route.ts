// ═══════════════════════════════════════════════════════════════════════
// AI LESSON GENERATION API — Generate complete lesson structure from topic
// ═══════════════════════════════════════════════════════════════════════
// Takes a topic, mapel, and kelas, then uses LLM to generate:
//   - Complete lesson structure (page types + titles + content hints)
//   - Key concepts and definitions for the topic
//   - Pedagogically sound flow following Kurikulum Merdeka
//
// The generated structure can be fed to instantiateTemplateWithConfig()
// or used directly to create pages with AI-generated content.
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// ── Request Types ────────────────────────────────────────────────────

interface LessonRequest {
  topik: string;
  mapel: string;
  kelas: string;
  semester?: string;
  konteks?: string;
  pattern?: 'standar' | 'interaktif' | 'eksperimen' | 'mini';
}

// ── Prompt Builder ───────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `Kamu adalah asisten AI khusus untuk merancang struktur Media Pembelajaran Interaktif (MPI) untuk guru SMP di Indonesia.
Kamu mengikuti standar BSNP (Badan Standar Nasional Pendidikan) dan Kurikulum Merdeka.
Kamu SELALU merespons dalam Bahasa Indonesia yang baik dan benar.
Kamu SELALU menghasilkan output dalam format JSON yang valid, TANPA markdown code block, TANPA penjelasan tambahan.
Kamu merancang alur pembelajaran yang sesuai dengan tingkat kognitif siswa SMP (kelas 7-9).
Setiap halaman harus memiliki tujuan yang jelas dan terkait dengan tujuan pembelajaran.`;
}

function buildUserPrompt(req: LessonRequest): string {
  const base = `Mata Pelajaran: ${req.mapel}
Kelas: ${req.kelas}
Topik: ${req.topik}`;

  const semester = req.semester ? `\nSemester: ${req.semester}` : '';
  const konteks = req.konteks ? `\nKonteks tambahan:\n${req.konteks.substring(0, 1000)}` : '';

  // Determine page count based on pattern
  const patternGuidance = (() => {
    switch (req.pattern) {
      case 'mini':
        return 'Buat alur MINI (4-5 halaman): Cover → Materi Inti → Kuis Cepat → Penutup. Fokus pada esensi materi saja.';
      case 'interaktif':
        return 'Buat alur INTERAKTIF (7-9 halaman): Cover → Tujuan → Skenario Interaktif → Materi → Diskusi/Game → Kuis → Refleksi → Penutup. Sertakan halaman skenario untuk cerita interaktif.';
      case 'eksperimen':
        return 'Buat alur EKSPERIMEN (7-9 halaman): Cover → Tujuan → Skenario Ilmiah → Materi → Praktikum/Diskusi → Kuis → Rangkuman → Penutup. Sertakan halaman skenario ilmiah.';
      default:
        return 'Buat alur STANDAR (7-9 halaman): Cover → Tujuan → Motivasi → Materi → Diskusi → Kuis → Refleksi/Rangkuman → Penutup. Alur pembelajaran lengkap sesuai BSNP.';
    }
  })();

  return `${base}${semester}${konteks}

${patternGuidance}

Rancang struktur pembelajaran interaktif yang lengkap dan sesuai Kurikulum Merdeka.

Format JSON:
{
  "title": "Judul Materi",
  "subtitle": "Mapel Kelas X - Semester Y",
  "pages": [
    {
      "type": "cover|tujuan|motivasi|materi|skenario|diskusi|kuis|refleksi|rangkuman|penutup",
      "title": "Judul Halaman",
      "description": "Deskripsi singkat konten halaman ini",
      "contentHints": ["hint 1 untuk konten", "hint 2 untuk konten"]
    }
  ],
  "keyConcepts": ["konsep kunci 1", "konsep kunci 2", "konsep kunci 3"],
  "definitions": [
    { "term": "Istilah", "meaning": "Definisi lengkap istilah tersebut" }
  ]
}

PENTING:
- type hanya boleh salah satu dari: cover, tujuan, motivasi, materi, skenario, diskusi, kuis, refleksi, rangkuman, penutup
- Halaman pertama HARUS "cover", halaman terakhir HARUS "penutup"
- Setiap page harus memiliki contentHints yang membantu generator membuat konten yang relevan
- definitions harus berisi minimal 3 istilah kunci dengan definisi yang lengkap
- keyConcepts harus berisi 4-6 konsep utama materi`;
}

// ── API Handler ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as LessonRequest;

    // Validate request
    if (!body.topik || !body.mapel || !body.kelas) {
      return NextResponse.json(
        { success: false, error: 'Parameter wajib: topik, mapel, kelas' },
        { status: 400 },
      );
    }

    // Initialize ZAI SDK
    const zai = await ZAI.create();

    // Build prompts
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(body);

    // Call LLM
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'AI tidak menghasilkan respons' },
        { status: 500 },
      );
    }

    // Parse JSON from AI response
    let parsed: unknown;
    try {
      const cleaned = content
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'AI menghasilkan format yang tidak valid. Silakan coba lagi.',
        raw: content,
      }, { status: 422 });
    }

    // Basic validation of the generated structure
    const data = parsed as Record<string, unknown>;
    if (!Array.isArray(data.pages) || data.pages.length < 3) {
      return NextResponse.json({
        success: false,
        error: 'Struktur pembelajaran tidak valid. Silakan coba lagi.',
        raw: content,
      }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AI Lesson API] Error:', message);
    return NextResponse.json(
      { success: false, error: 'Gagal menghasilkan struktur pembelajaran. Silakan coba lagi.' },
      { status: 500 },
    );
  }
}
