// ═══════════════════════════════════════════════════════════════════════
// AI REFINE API — Per-block content refinement using LLM
// ═══════════════════════════════════════════════════════════════════════
// Takes an existing SchemaBlock's content and a refinement mode,
// asks the AI to improve it while preserving the block's structure.
//
// Unlike /api/ai which generates NEW content from scratch,
// this endpoint takes EXISTING content and refines it.
//
// Refinement modes:
//   - 'menarik'   → Make more engaging/interesting
//   - 'detail'    → Add more detail/depth
//   - 'sederhana' → Simplify for easier understanding
//   - 'contoh'    → Add concrete examples
//   - 'bsnp'      → Improve BSNP compliance
//   - 'kuis-more' → Add more questions (for kuis/game blocks)
//   - 'custom'    → Free-form instruction
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// ── Request Types ────────────────────────────────────────────────────

export type RefineMode = 'menarik' | 'detail' | 'sederhana' | 'contoh' | 'bsnp' | 'kuis-more' | 'custom';

interface RefineRequest {
  /** The block type being refined */
  blockType: string;
  /** The current block content as JSON */
  blockContent: Record<string, unknown>;
  /** Refinement mode */
  mode: RefineMode;
  /** Subject/mata pelajaran */
  mapel: string;
  /** Class level */
  kelas: string;
  /** Custom instruction (only for mode='custom') */
  customInstruction?: string;
}

// ── Mode Descriptions ────────────────────────────────────────────────

const MODE_PROMPTS: Record<RefineMode, string> = {
  menarik: `Buat konten ini lebih menarik dan engaging untuk siswa SMP. 
Tambahkan bahasa yang lebih hidup, contoh relatable, dan hook yang menarik perhatian.
Pertahankan struktur data yang sama tetapi perbaiki isinya.`,

  detail: `Perkaya konten ini dengan detail yang lebih mendalam.
Tambahkan penjelasan tambahan, fakta menarik, dan informasi yang memperdalam pemahaman.
Pertahankan struktur data yang sama tetapi tambahkan kedalaman.`,

  sederhana: `Sederhanakan konten ini agar lebih mudah dipahami siswa SMP.
Gunakan bahasa yang lebih sederhana, kalimat lebih pendek, dan analogi yang familiar.
Pertahankan poin-poin penting tapi buat lebih accessible.`,

  contoh: `Tambahkan contoh konkret dan ilustrasi ke konten ini.
Sisipkan contoh dari kehidupan sehari-hari siswa SMP, studi kasus singkat, atau situasi nyata.
Pertahankan konten yang sudah ada dan tambahkan contoh baru.`,

  bsnp: `Tingkatkan kepatuhan konten ini terhadap standar BSNP (Badan Standar Nasional Pendidikan).
Pastikan ada: tujuan pembelajaran yang jelas, keterkaitan dengan Profil Pelajar Pancasila,
dan kesesuaian dengan Kurikulum Merdeka.
Pertahankan struktur data yang sama.`,

  'kuis-more': `Tambahkan lebih banyak soal/pertanyaan ke konten ini.
Pastikan soal baru bervariasi tingkat kesulitannya (C1-C6 Bloom).
Jaga kualitas dan relevansi soal dengan topik.
Pertahankan soal yang sudah ada dan tambahkan yang baru.`,

  custom: '', // Will be replaced by customInstruction
};

// ── Block-type-specific instructions ─────────────────────────────────

function getBlockTypeInstruction(blockType: string): string {
  const instructions: Record<string, string> = {
    'def-box': `Konten ini adalah kotak definisi (def-box). Field utama: "content" (string HTML).
Perbaiki konten di field "content" saja. Pertahankan tag HTML yang ada (<strong>, <em>, dll).`,

    'nc-grid': `Konten ini adalah kartu grid (nc-grid). Field utama: "cards" (array of {icon, title, body, color}).
Perbaiki isi setiap kartu. Bisa tambah kartu baru jika sesuai.`,

    'kuis': `Konten ini adalah kuis pilihan ganda. Field utama: "questions" (array of {q, opts, ans, ex}).
Perbaiki soal yang ada. Pastikan jawaban benar di index "ans" dan penjelasan di "ex".`,

    'diskusi': `Konten ini adalah pertanyaan diskusi. Field utama: "questions" (array of {label, icon, teks, petunjuk, color}).
Perbaiki pertanyaan agar lebih memicu pemikiran kritis dan kolaborasi.`,

    'refleksi': `Konten ini adalah pertanyaan refleksi. Field utama: "questions" (array of {teks, petunjuk, warna, icon}).
Perbaiki agar lebih mendorong siswa merefleksikan pembelajaran mereka secara mendalam.`,

    'skenario': `Konten ini adalah skenario interaktif. Field utama: "chapters" (array dengan setup, choices).
Perbaiki dialog dan pilihan agar lebih realistis dan mendidik.`,

    'tp': `Konten ini adalah Tujuan Pembelajaran. Field utama: "items" (array of {num, verb, desc, color}).
Perbaiki agar menggunakan KKO (Kata Kerja Operasional) tingkat tinggi (C4-C6).`,

    'motivasi': `Konten ini adalah motivasi/apersepsi. Field utama: "hookQuestion", "connections", "transition".
Perbaiki agar lebih menarik perhatian dan menghubungkan dengan pengetahuan sebelumnya.`,

    'rangkuman': `Konten ini adalah rangkuman. Field utama: "concepts" (array of {icon, title, body, color}).
Perbaiki agar konsep kunci lebih jelas dan mudah diingat.`,

    'flashcard-set': `Konten ini adalah flashcard. Field utama: "cards" (array of {q, a}).
Perbaiki pertanyaan dan jawaban agar lebih efektif untuk review.`,

    'materi-section': `Konten ini adalah section materi. Field utama: "content" (array SchemaBlock), "takeaways", "selfCheck".
Perbaiki konten di dalam "content" dan "takeaways".`,

    'petunjuk': `Konten ini adalah petunjuk penggunaan. Field utama: "items" (array of {icon, title, body}).
Perbaiki agar lebih jelas dan mudah diikuti siswa.`,

    'matching-game': `Konten ini adalah game mencocokkan. Field utama: "pairs" (array of {left, right}).
Perbaiki pasangan agar lebih relevan dan mendidik.`,

    'true-false-game': `Konten ini adalah game benar/salah. Field utama: "questions" (array of {text, correct, explanation}).
Perbaiki pernyataan dan penjelasan.`,

    'memory-game': `Konten ini adalah game memory. Field utama: "pairs" (array of {left, right}).
Perbaiki pasangan kartu.`,

    'fill-blank-game': `Konten ini adalah game isian. Field utama: "questions" (array of {text, answer, hint}).
Perbaiki soal isian.`,

    'sortir-game': `Konten ini adalah game sortir. Field utama: "pool", "kolom".
Perbaiki item dan kategori.`,

    'roda-game': `Konten ini adalah game roda putar. Field utama: "questions".
Perbaiki pertanyaan roda.`,

    'drag-drop-game': `Konten ini adalah game drag & drop. Field utama: "items", "targets".
Perbaiki item dan target.`,

    'word-search-game': `Konten ini adalah game cari kata. Field utama: "words".
Perbaiki kata-kata.`,

    'crossword-game': `Konten ini adalah game teka silang. Field utama: "words".
Perbaiki kata dan petunjuk.`,
  };

  return instructions[blockType] || `Konten ini bertipe "${blockType}". Pertahankan struktur data yang sama dan perbaiki isinya.`;
}

// ── System Prompt ────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `Kamu adalah asisten AI khusus untuk menyempurnakan konten Media Pembelajaran Interaktif (MPI) untuk guru SMP di Indonesia.
Kamu menerima konten yang SUDAH ADA dalam format JSON dan harus memperbaikinya.
Kamu SELALU merespons dalam Bahasa Indonesia yang baik dan benar.
Kamu SELALU menghasilkan output dalam format JSON yang VALID, TANPA markdown code block.
Kamu MEMPERTAHANKAN struktur data yang sama — hanya memperbaiki/memperkaya ISI, bukan mengubah STRUKTUR.
Kamu memastikan konten sesuai Kurikulum Merdeka dan standar BSNP.
JANGAN hapus field yang sudah ada. JANGAN ubah nama field. JANGAN tambah field baru yang tidak ada di input.`;
}

// ── User Prompt ──────────────────────────────────────────────────────

function buildUserPrompt(req: RefineRequest): string {
  const modeInstruction = req.mode === 'custom'
    ? req.customInstruction || 'Perbaiki konten ini'
    : MODE_PROMPTS[req.mode];

  const blockTypeInstruction = getBlockTypeInstruction(req.blockType);

  return `Mata Pelajaran: ${req.mapel}
Kelas: ${req.kelas}
Tipe Block: ${req.blockType}

INSTRUKSI KHUSUS TIPE BLOCK:
${blockTypeInstruction}

INSTRUKSI REFINEMENT:
${modeInstruction}

KONTEN SAAT INI (JSON):
${JSON.stringify(req.blockContent, null, 2)}

Silakan perbaiki konten di atas sesuai instruksi. Hasilkan JSON dengan STRUKTUR YANG SAMA tetapi ISI YANG LEBIH BAIK.`;
}

// ── API Handler ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RefineRequest;

    // Validate request
    if (!body.blockType || !body.blockContent || !body.mode) {
      return NextResponse.json(
        { success: false, error: 'Parameter wajib: blockType, blockContent, mode' },
        { status: 400 }
      );
    }

    const validModes: RefineMode[] = ['menarik', 'detail', 'sederhana', 'contoh', 'bsnp', 'kuis-more', 'custom'];
    if (!validModes.includes(body.mode)) {
      return NextResponse.json(
        { success: false, error: `Mode tidak valid. Pilihan: ${validModes.join(', ')}` },
        { status: 400 }
      );
    }

    if (body.mode === 'custom' && !body.customInstruction?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Mode "custom" memerlukan customInstruction' },
        { status: 400 }
      );
    }

    // Initialize ZAI SDK
    const zai = await ZAI.create();

    // Build prompts
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(body);

    // Call LLM — lower temperature for refinement (stay closer to original)
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 4000,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'AI tidak menghasilkan respons' },
        { status: 500 }
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

    // Merge: preserve the block's id, type, compression, semantic from original
    // Only replace the content fields that AI improved
    const original = body.blockContent;
    const refined = parsed as Record<string, unknown>;

    // Always preserve these meta fields from the original
    const preservedFields = ['id', 'type', 'compression', 'semantic', 'layout', 'variant', 'style', 'interactive', 'showIf'];
    for (const field of preservedFields) {
      if (field in original && !(field in refined)) {
        refined[field] = original[field];
      }
    }

    // Ensure type matches
    if (refined.type !== original.type) {
      refined.type = original.type;
    }

    return NextResponse.json({
      success: true,
      data: refined,
      mode: body.mode,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AI Refine API] Error:', message);
    return NextResponse.json(
      { success: false, error: 'Gagal menyempurnakan konten. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
