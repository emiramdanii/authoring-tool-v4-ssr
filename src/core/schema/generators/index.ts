// ═══════════════════════════════════════════════════════════════════
// SCHEMA-FIRST GENERATORS — Produce SchemaBlock[] directly from ParseResult
// ═══════════════════════════════════════════════════════════════════
// This is the CORRECT generation pipeline:
//   ParseResult → SchemaBlock[] → page.schema → Canvas Renderer
//
// Old pipeline (DEPRECATED):
//   ParseResult → MateriBlok[] → Authoring Store → TemplateAdapter → SchemaBlock[]
//
// The old generators in auto-generate/generators.ts still exist for
// backward compatibility with the Konten editor panel, but all NEW
// code should use these schema generators.
//
// DESIGN PRINCIPLES:
//   1. SchemaBlock is the PRIMARY output format
//   2. Authoring Store types are SECONDARY (mirrored for Konten editor compat)
//   3. No TemplateAdapter needed — schema is the source of truth
//   4. RegenerateButton updates page.schema directly
//
// MODULE STRUCTURE:
//   pendahuluan.ts  — Opening phase (cover, petunjuk, tp, alur, motivasi, tujuan-display)
//   inti.ts         — Core phase (materi, skenario, kuis, flashcard, diskusi)
//   penutup.ts      — Closing phase (refleksi, rangkuman, hasil, penutup)
//   full-lesson.ts  — Full lesson orchestration (FullLessonSchema + genFullLessonSchema)
// ═══════════════════════════════════════════════════════════════════

// ── Pendahuluan (Opening Phase) ──────────────────────────────────
export {
  genCoverSchema,
  genPetunjukSchema,
  genTpSchema,
  genAlurSchema,
  genMotivasiSchema,
  genTujuanDisplaySchema,
} from './pendahuluan';

// ── Inti (Core Phase) ────────────────────────────────────────────
export {
  genMateriSchema,
  genSkenarioSchema,
  genKuisSchema,
  genFlashcardSchema,
  genDiskusiSchema,
} from './inti';

// ── Penutup (Closing Phase) ──────────────────────────────────────
export {
  genRefleksiSchema,
  genRangkumanSchema,
  genHasilSchema,
  genPenutupSchema,
} from './penutup';

// ── Full Lesson Orchestration ────────────────────────────────────
export type { FullLessonSchema } from './full-lesson';
export { genFullLessonSchema } from './full-lesson';
