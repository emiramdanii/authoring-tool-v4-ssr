// ═══════════════════════════════════════════════════════════════════════
// API VALIDATION — Zod schemas for all API route inputs
// ═══════════════════════════════════════════════════════════════════════
// Every API route must validate its input using these schemas.
// This prevents malformed data from reaching the database or LLM.
//
// Usage in route handlers:
//   import { aiRequestSchema } from '@/lib/api-validation';
//   const parsed = aiRequestSchema.safeParse(body);
//   if (!parsed.success) {
//     return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
//   }
//   const validated = parsed.data; // fully typed
// ═══════════════════════════════════════════════════════════════════════

import { z } from 'zod';

// ── Common schemas ──────────────────────────────────────────────────

/** Non-empty string with max length */
const nonEmptyStr = (maxLen: number, fieldName: string) =>
  z.string()
    .min(1, `${fieldName} wajib diisi`)
    .max(maxLen, `${fieldName} maksimal ${maxLen} karakter`);

/** Optional string with max length */
const optionalStr = (maxLen: number) =>
  z.string().max(maxLen).optional();

/** Safe integer within range */
const safeInt = (min: number, max: number) =>
  z.number().int().min(min).max(max);

// ── AI Routes ───────────────────────────────────────────────────────

const AI_ACTIONS = [
  'kuis', 'matching', 'fill-blank', 'word-search', 'crossword',
  'true-false', 'drag-drop', 'memory', 'roda', 'sortir',
  'diskusi', 'refleksi', 'materi-summary', 'tp', 'petunjuk', 'motivasi',
] as const;

export const aiRequestSchema = z.object({
  action: z.enum(AI_ACTIONS, { message: `Action tidak valid. Pilihan: ${AI_ACTIONS.join(', ')}` }),
  mapel: nonEmptyStr(100, 'Mata pelajaran'),
  kelas: nonEmptyStr(50, 'Kelas'),
  topik: nonEmptyStr(200, 'Topik'),
  konteks: z.string().max(5000).optional(),
  jumlah: safeInt(1, 50).optional(),
  instruksi: z.string().max(1000).optional(),
});

export type AIRequestInput = z.infer<typeof aiRequestSchema>;

// ── AI Lesson Route ─────────────────────────────────────────────────

const LESSON_PATTERNS = ['standar', 'interaktif', 'eksperimen', 'mini'] as const;

export const lessonRequestSchema = z.object({
  topik: nonEmptyStr(200, 'Topik'),
  mapel: nonEmptyStr(100, 'Mata pelajaran'),
  kelas: nonEmptyStr(50, 'Kelas'),
  semester: z.string().max(20).optional(),
  konteks: z.string().max(3000).optional(),
  pattern: z.enum(LESSON_PATTERNS).optional(),
});

export type LessonRequestInput = z.infer<typeof lessonRequestSchema>;

// ── AI Refine Route ─────────────────────────────────────────────────

const REFINE_MODES = ['menarik', 'detail', 'sederhana', 'contoh', 'bsnp', 'kuis-more', 'custom'] as const;

export const refineRequestSchema = z.object({
  blockType: nonEmptyStr(100, 'Block type'),
  blockContent: z.record(z.string(), z.unknown()),
  mode: z.enum(REFINE_MODES, { message: `Mode tidak valid. Pilihan: ${REFINE_MODES.join(', ')}` }),
  mapel: nonEmptyStr(100, 'Mata pelajaran'),
  kelas: nonEmptyStr(50, 'Kelas'),
  customInstruction: z.string().max(2000).optional(),
}).refine(
  (data) => data.mode !== 'custom' || (data.customInstruction && data.customInstruction.trim().length > 0),
  { message: 'Mode "custom" memerlukan customInstruction', path: ['customInstruction'] }
);

export type RefineRequestInput = z.infer<typeof refineRequestSchema>;

// ── Project Routes ──────────────────────────────────────────────────

export const createProjectSchema = z.object({
  title: nonEmptyStr(500, 'Title'),
  description: z.string().max(5000).optional(),
  subject: z.string().max(100).optional(),
  grade: z.string().max(50).optional(),
  semester: z.number().int().min(1).max(2).nullable().optional(),
  teacherName: z.string().max(200).optional(),
  schoolName: z.string().max(300).optional(),
  templateId: z.string().max(100).optional(),
  themeId: z.string().max(100).optional(),
  schemaPreset: z.string().max(100).optional(),
  ratioId: z.string().max(50).optional(),
  isPublished: z.boolean().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  title: z.string().max(500).optional(),
  description: z.string().max(5000).optional(),
  subject: z.string().max(100).optional(),
  grade: z.string().max(50).optional(),
  semester: z.union([z.number().int().min(1).max(2), z.string().max(20)]).optional().transform(v => {
    // Coerce string to int for Prisma compatibility (DB expects Int?)
    if (typeof v === 'string') {
      const parsed = parseInt(v, 10);
      return isNaN(parsed) ? undefined : parsed;
    }
    return v;
  }),
  teacherName: z.string().max(200).optional(),
  schoolName: z.string().max(300).optional(),
  templateId: z.string().max(100).optional(),
  themeId: z.string().max(100).optional(),
  schemaPreset: z.string().max(100).optional(),
  ratioId: z.string().max(50).optional(),
  isPublished: z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Minimal satu field harus diupdate' }
);

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// ── Project Save Route ──────────────────────────────────────────────

const saveBlockSchema: z.ZodType = z.lazy((): z.ZodType =>
  z.object({
    type: nonEmptyStr(100, 'Block type'),
    id: z.string().max(100).optional(),
    content: z.record(z.string(), z.unknown()).optional(),
    layout: z.record(z.string(), z.unknown()).optional(),
    variant: z.string().max(100).optional(),
    style: z.record(z.string(), z.string()).optional(),
    children: z.array(saveBlockSchema).optional(),
  })
);

export const savePageSchema = z.object({
  id: z.string().min(1),
  label: z.string().max(200).optional(),
  templateType: z.string().max(100).optional(),
  templateVariant: z.string().max(100).optional(),
  contractId: z.string().max(100).optional(),
  pageMode: z.string().max(50).optional(),
  bgColor: z.string().max(50).optional(),
  bgDataUrl: z.string().nullable().optional(),
  overlay: z.number().min(0).max(100).optional(),
  schema: z.record(z.string(), z.unknown()).nullable().optional(),
  navConfig: z.record(z.string(), z.unknown()).optional(),
  templateData: z.record(z.string(), z.unknown()).optional(),
  colorPalette: z.record(z.string(), z.unknown()).nullable().optional(),
  blocks: z.array(saveBlockSchema).optional(),
  // Legacy elements support — elements are preserved as blocks so
  // pages that still use element-mode don't lose their content on save.
  elements: z.array(z.object({
    type: z.string().max(100),
    id: z.string().max(100).optional(),
    content: z.record(z.string(), z.unknown()).optional(),
  })).optional(),
});

export const saveProjectSchema = z.object({
  pages: z.array(savePageSchema).min(1, 'Minimal 1 halaman diperlukan'),
  ratioId: z.string().max(50).optional(),
  meta: z.object({
    title: z.string().max(500).optional(),
    description: z.string().max(5000).optional(),
    subject: z.string().max(100).optional(),
    grade: z.string().max(50).optional(),
    semester: z.number().int().optional(),
    teacherName: z.string().max(200).optional(),
    schoolName: z.string().max(300).optional(),
    templateId: z.string().max(100).optional(),
    themeId: z.string().max(100).optional(),
    schemaPreset: z.string().max(100).optional(),
  }).optional(),
  authoringData: z.record(z.string(), z.unknown()).optional(),
});

export type SaveProjectInput = z.infer<typeof saveProjectSchema>;

// ── Export Routes ───────────────────────────────────────────────────

export const exportRequestSchema = z.object({
  pages: z.array(z.record(z.string(), z.unknown())).min(1, 'Minimal 1 halaman diperlukan'),
  ratioId: z.string().max(50).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
  allKuis: z.array(z.unknown()).optional(),
  allModules: z.array(z.unknown()).optional(),
  games: z.array(z.unknown()).optional(),
  cp: z.record(z.string(), z.unknown()).optional(),
  tp: z.array(z.unknown()).optional(),
  atp: z.record(z.string(), z.unknown()).optional(),
  alur: z.array(z.unknown()).optional(),
  materi: z.record(z.string(), z.unknown()).optional(),
  skenario: z.array(z.unknown()).optional(),
  petunjuk: z.record(z.string(), z.unknown()).optional(),
  diskusi: z.record(z.string(), z.unknown()).optional(),
  refleksi: z.record(z.string(), z.unknown()).optional(),
  penutup: z.record(z.string(), z.unknown()).optional(),
  suara: z.record(z.string(), z.unknown()).optional(),
});

export type ExportRequestInput = z.infer<typeof exportRequestSchema>;

// ── Template Routes ─────────────────────────────────────────────────

export const createTemplateSchema = z.object({
  name: nonEmptyStr(300, 'Name'),
  description: z.string().max(5000).optional(),
  subject: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  icon: z.string().max(50).optional(),
  schemaData: z.union([z.string().min(1), z.record(z.string(), z.unknown())]),
  downloads: z.number().int().min(0).optional(),
  rating: z.number().min(0).max(5).optional(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

// ── List query schemas ──────────────────────────────────────────────

export const listProjectsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  subject: z.string().max(100).optional(),
  grade: z.string().max(50).optional(),
  search: z.string().max(200).optional(),
});

export const listTemplatesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().max(100).optional(),
  subject: z.string().max(100).optional(),
  search: z.string().max(200).optional(),
});

// ── Helper: Format Zod errors for API response ──────────────────────

export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  return error.flatten().fieldErrors;
}

export function zodErrorResponse(error: z.ZodError): { error: string; details: Record<string, string[]> } {
  return {
    error: 'Input tidak valid',
    details: formatZodErrors(error),
  };
}
