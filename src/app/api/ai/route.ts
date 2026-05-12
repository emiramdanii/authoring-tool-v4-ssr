// ═══════════════════════════════════════════════════════════════════════
// AI CONTENT ASSISTANT API — Generates educational content using LLM
// ═══════════════════════════════════════════════════════════════════════
// Uses z-ai-web-dev-sdk to generate:
//   - Quiz questions (pilihan ganda) from materi text
//   - Matching game pairs from vocabulary/concepts
//   - Fill-in-the-blank questions from materi
//   - Word search word lists from topics
//   - Crossword clues from concepts
//   - True/false statements from facts
//   - Drag & drop items from categories
//   - Materi summaries and descriptions
//   - Discussion questions
//   - Reflection prompts
//
// All content is contextualized for Indonesian SMP (junior high school)
// and follows BSNP guidelines for media pembelajaran interaktif.
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// ── Request Types ────────────────────────────────────────────────────

interface AIRequest {
  /** What type of content to generate */
  action: AIAction;
  /** The subject/mata pelajaran */
  mapel: string;
  /** The class level (e.g., 'Kelas VII') */
  kelas: string;
  /** The topic/chapter */
  topik: string;
  /** Existing content as context (materi text, etc.) */
  konteks?: string;
  /** How many items to generate (default: 5) */
  jumlah?: number;
  /** Additional instructions */
  instruksi?: string;
}

type AIAction =
  | 'kuis'
  | 'matching'
  | 'fill-blank'
  | 'word-search'
  | 'crossword'
  | 'true-false'
  | 'drag-drop'
  | 'memory'
  | 'roda'
  | 'sortir'
  | 'diskusi'
  | 'refleksi'
  | 'materi-summary'
  | 'tp'
  | 'petunjuk'
  | 'motivasi';

// ── Response Types ───────────────────────────────────────────────────

interface AIResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

// ── Prompt Templates ─────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `Kamu adalah asisten AI khusus untuk membuat konten Media Pembelajaran Interaktif (MPI) untuk guru SMP di Indonesia. 
Kamu mengikuti standar BSNP (Badan Standar Nasional Pendidikan) untuk media pembelajaran.
Kamu SELALU merespons dalam Bahasa Indonesia yang baik dan benar.
Kamu menghasilkan konten yang sesuai dengan Kurikulum Merdeka.
Kamu SELALU menghasilkan output dalam format JSON yang valid, TANPA markdown code block, TANPA penjelasan tambahan.
Kamu memastikan konten sesuai dengan tingkat kognitif siswa SMP (kelas 7-9).`;
}

function buildUserPrompt(req: AIRequest): string {
  const base = `Mata Pelajaran: ${req.mapel}
Kelas: ${req.kelas}
Topik: ${req.topik}`;

  const konteks = req.konteks ? `\nKonteks materi yang sudah ada:\n${req.konteks.substring(0, 2000)}` : '';
  const jumlah = req.jumlah || 5;
  const instruksi = req.instruksi ? `\nInstruksi tambahan: ${req.instruksi}` : '';

  switch (req.action) {
    case 'kuis':
      return `${base}${konteks}${instruksi}

Buat ${jumlah} soal pilihan ganda (kuis) untuk MPI.
Setiap soal harus memiliki 4 opsi jawaban dan 1 jawaban benar.

Format JSON:
{
  "title": "Kuis: [topik]",
  "questions": [
    {
      "q": "Pertanyaan...",
      "opts": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
      "ans": 0,
      "ex": "Penjelasan singkat mengapa jawaban ini benar"
    }
  ]
}`;

    case 'matching':
      return `${base}${konteks}${instruksi}

Buat ${jumlah} pasangan untuk game mencocokkan (matching game).
Pasangan harus berisi istilah/teks di kiri dan definisi/keterangan di kanan.

Format JSON:
{
  "title": "Cocokkan: [topik]",
  "pairs": [
    { "left": "Istilah", "right": "Definisi/keterangan" }
  ]
}`;

    case 'fill-blank':
      return `${base}${konteks}${instruksi}

Buat ${jumlah} soal isian singkat (fill-in-the-blank) untuk MPI.
Gunakan "___" untuk menandai bagian yang harus diisi.

Format JSON:
{
  "title": "Isian: [topik]",
  "questions": [
    {
      "text": "Kalimat dengan ___ yang harus diisi",
      "answer": "jawaban",
      "hint": "Petunjuk opsional"
    }
  ]
}`;

    case 'word-search':
      return `${base}${konteks}${instruksi}

Buat daftar ${jumlah} kata untuk game mencari kata (word search).
Kata-kata harus terkait topik dan berbahasa Indonesia.
Kata harus 3-10 huruf, huruf kapital, tanpa spasi.

Format JSON:
{
  "title": "Cari Kata: [topik]",
  "words": ["KATA1", "KATA2", ...]
}`;

    case 'crossword':
      return `${base}${konteks}${instruksi}

Buat ${jumlah} kata untuk teka silang (crossword) untuk MPI.
Setiap kata harus memiliki petunjuk/definisi.

Format JSON:
{
  "title": "Teka Silang: [topik]",
  "words": [
    { "teks": "KATA", "hint": "Petunjuk untuk kata ini", "arah": "across" }
  ]
}`;

    case 'true-false':
      return `${base}${konteks}${instruksi}

Buat ${jumlah} pernyataan benar/salah (true/false) untuk MPI.
Campur pernyataan benar dan salah secara merata.

Format JSON:
{
  "title": "Benar/Salah: [topik]",
  "questions": [
    {
      "text": "Pernyataan...",
      "correct": true,
      "explanation": "Penjelasan singkat"
    }
  ]
}`;

    case 'drag-drop':
      return `${base}${konteks}${instruksi}

Buat item untuk game drag & drop (kelompokkan item ke kategori yang benar).
Buat 2-4 kategori dan ${jumlah} item yang harus dikategorikan.

Format JSON:
{
  "title": "Kelompokkan: [topik]",
  "items": [
    { "text": "Item", "target": "kategori-id" }
  ],
  "targets": [
    { "id": "kategori-id", "label": "Nama Kategori", "color": "y" }
  ]
}`;

    case 'memory':
      return `${base}${konteks}${instruksi}

Buat ${jumlah} pasangan untuk game memory (kartu berpasangan).
Pasangan harus berisi istilah dan definisi/visual yang cocok.

Format JSON:
{
  "title": "Memory: [topik]",
  "pairs": [
    { "left": "Istilah/konsep", "right": "Definisi/visual" }
  ]
}`;

    case 'roda':
      return `${base}${konteks}${instruksi}

Buat ${jumlah} pertanyaan untuk game roda putar (spin wheel quiz).
Setiap pertanyaan memiliki 2-4 opsi jawaban.

Format JSON:
{
  "title": "Roda: [topik]",
  "questions": [
    {
      "q": "Pertanyaan...",
      "opts": [
        { "text": "Opsi", "correct": false },
        { "text": "Opsi benar", "correct": true }
      ],
      "feedbackCorrect": "Benar! ...",
      "feedbackWrong": "Kurang tepat. ..."
    }
  ]
}`;

    case 'sortir':
      return `${base}${konteks}${instruksi}

Buat item untuk game sortir (sortir item ke kolom yang benar).
Buat 2-3 kolom dan total ${jumlah} item.

Format JSON:
{
  "title": "Sortir: [topik]",
  "pool": [
    { "id": "item-1", "text": "Item", "category": "kolom-id" }
  ],
  "kolom": [
    { "id": "kolom-id", "label": "Nama Kolom", "color": "c" }
  ]
}`;

    case 'diskusi':
      return `${base}${konteks}${instruksi}

Buat ${jumlah} pertanyaan diskusi untuk MPI.
Pertanyaan harus mendorong pemikiran kritis dan kolaborasi.

Format JSON:
{
  "title": "Diskusi: [topik]",
  "intro": "Pengantar diskusi singkat",
  "questions": [
    {
      "label": "Pertanyaan 1",
      "icon": "💬",
      "teks": "Pertanyaan diskusi...",
      "petunjuk": "Petunjuk untuk siswa"
    }
  ]
}`;

    case 'refleksi':
      return `${base}${konteks}${instruksi}

Buat ${jumlah} pertanyaan refleksi untuk MPI.
Pertanyaan harus mendorong siswa merefleksikan pembelajaran mereka.

Format JSON:
{
  "title": "Refleksi: [topik]",
  "intro": "Pengantar refleksi",
  "questions": [
    {
      "teks": "Pertanyaan refleksi...",
      "petunjuk": "Petunjuk cara menjawab",
      "warna": "y",
      "icon": "🤔"
    }
  ]
}`;

    case 'materi-summary':
      return `${base}${konteks}${instruksi}

Buat rangkuman materi dalam bentuk konsep-konsep kunci.
Ringkas materi menjadi ${jumlah} konsep utama.

Format JSON:
{
  "title": "Rangkuman: [topik]",
  "concepts": [
    {
      "icon": "📚",
      "title": "Nama Konsep",
      "body": "Penjelasan singkat konsep...",
      "color": "y"
    }
  ],
  "closingStatement": "Pernyataan penutup..."
}`;

    case 'tp':
      return `${base}${konteks}${instruksi}

Buat ${jumlah} Tujuan Pembelajaran (TP) sesuai Kurikulum Merdeka.
Gunakan kata kerja operasional (KKO) tingkat tinggi (C4-C6).

Format JSON:
{
  "title": "Tujuan Pembelajaran",
  "items": [
    {
      "num": 1,
      "verb": "Menganalisis",
      "desc": "deskripsi tujuan pembelajaran...",
      "color": "y"
    }
  ]
}`;

    case 'petunjuk':
      return `${base}${konteks}${instruksi}

Buat petunjuk penggunaan MPI untuk siswa.
Sertakan cara navigasi dan tips penggunaan.

Format JSON:
{
  "title": "Petunjuk Penggunaan",
  "titleHighlight": "Cara Menggunakan",
  "items": [
    {
      "icon": "👆",
      "title": "Judul Langkah",
      "body": "Penjelasan cara..."
    }
  ],
  "tips": "Tips tambahan untuk siswa"
}`;

    case 'motivasi':
      return `${base}${konteks}${instruksi}

Buat hook motivasi/apersepsi untuk memulai pembelajaran.
Hubungkan dengan pengetahuan sebelumnya.

Format JSON:
{
  "title": "Apersepsi",
  "hookQuestion": "Pertanyaan pemantik yang menarik perhatian...",
  "visual": {
    "emoji": "🤔",
    "bgGradient": ["c", "p"]
  },
  "connections": [
    {
      "icon": "🔗",
      "label": "Pengetahuan Sebelumnya",
      "description": "Hubungan dengan materi lama...",
      "color": "c"
    }
  ],
  "transition": "Mari kita pelajari lebih lanjut..."
}`;

    default:
      return `${base}${konteks}${instruksi}

Buat konten pembelajaran interaktif yang sesuai.`;
  }
}

// ── API Handler ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AIRequest;

    // Validate request
    if (!body.action || !body.mapel || !body.kelas || !body.topik) {
      return NextResponse.json(
        { success: false, error: 'Parameter wajib: action, mapel, kelas, topik' },
        { status: 400 }
      );
    }

    const validActions: AIAction[] = [
      'kuis', 'matching', 'fill-blank', 'word-search', 'crossword',
      'true-false', 'drag-drop', 'memory', 'roda', 'sortir',
      'diskusi', 'refleksi', 'materi-summary', 'tp', 'petunjuk', 'motivasi'
    ];

    if (!validActions.includes(body.action)) {
      return NextResponse.json(
        { success: false, error: `Action tidak valid. Pilihan: ${validActions.join(', ')}` },
        { status: 400 }
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
        { status: 500 }
      );
    }

    // Parse JSON from AI response — handle potential markdown wrapping
    let parsed: unknown;
    try {
      // Strip markdown code blocks if present
      const cleaned = content
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Return raw content if JSON parsing fails — UI can handle it
      return NextResponse.json({
        success: false,
        error: 'AI menghasilkan format yang tidak valid. Silakan coba lagi.',
        raw: content,
      }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AI API] Error:', message);
    return NextResponse.json(
      { success: false, error: 'Gagal menghasilkan konten AI. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
