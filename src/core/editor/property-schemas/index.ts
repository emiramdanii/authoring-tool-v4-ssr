// ═══════════════════════════════════════════════════════════════════
// PROPERTY SCHEMAS — Barrel export
// ═══════════════════════════════════════════════════════════════════
// Re-exports all property schemas from categorized sub-modules.
//
// This replaces the old monolithic property-schemas.ts file.
// Adding a new block type = add its propertySchema in the appropriate
// category file. No UI code change.
//
// ═══════════════════════════════════════════════════════════════════
// FASE 2: Single Source of Truth
// ═══════════════════════════════════════════════════════════════════
// Property schemas are DEFINED here but the SINGLE SOURCE OF TRUTH
// for looking them up is SCENE_REGISTRY in SceneRegistry.tsx.
//
// Each named schema (COVER_PROPERTY_SCHEMA, etc.) is imported by
// SceneRegistry and attached to its BlockDefinition.propertySchema.
//
// To look up a property schema, use:
//   getBlockPropertySchema(blockType) from '@/core/registry/SceneRegistry'
//
// The old PROPERTY_SCHEMAS record and getPropertySchema() function
// have been REMOVED to eliminate the dual-source drift risk.
// ═══════════════════════════════════════════════════════════════════

// Layout block schemas
export {
  COVER_PROPERTY_SCHEMA,
  HERO_PROPERTY_SCHEMA,
} from './layout';

// Content block schemas
export {
  PETUNJUK_PROPERTY_SCHEMA,
  TP_PROPERTY_SCHEMA,
  ALUR_PROPERTY_SCHEMA,
  DEFBOX_PROPERTY_SCHEMA,
  NCGRID_PROPERTY_SCHEMA,
  FTAB_PROPERTY_SCHEMA,
  NKCARD_PROPERTY_SCHEMA,
  MATERISECTION_PROPERTY_SCHEMA,
  TABELACCORD_PROPERTY_SCHEMA,
  GAMBAR_PROPERTY_SCHEMA,
  TIMELINE_PROPERTY_SCHEMA,
  COMPARE_PROPERTY_SCHEMA,
  TABEL_PROPERTY_SCHEMA,
  STATISTIK_PROPERTY_SCHEMA,
  STUDI_PROPERTY_SCHEMA,
  MATERIBLOK_PROPERTY_SCHEMA,
} from './content';

// Interactive block schemas
export {
  SKENARIO_PROPERTY_SCHEMA,
  FLASHCARD_PROPERTY_SCHEMA,
  DISKUSI_PROPERTY_SCHEMA,
  KUIS_PROPERTY_SCHEMA,
  SORTIRGAME_PROPERTY_SCHEMA,
  RODAGAME_PROPERTY_SCHEMA,
  REVEAL_PROPERTY_SCHEMA,
  CHECKLIST_PROPERTY_SCHEMA,
} from './interactive';

// BSNP pedagogical schemas
export {
  TUJUANDISPLAY_PROPERTY_SCHEMA,
  MOTIVASI_PROPERTY_SCHEMA,
  RANGKUMAN_PROPERTY_SCHEMA,
  REFLEKSI_PROPERTY_SCHEMA,
  PENUTUP_PROPERTY_SCHEMA,
  HASIL_PROPERTY_SCHEMA,
} from './bsnp';

// Game block schemas
export {
  MEMORYGAME_PROPERTY_SCHEMA,
  MATCHINGGAME_PROPERTY_SCHEMA,
  FILLBLANKGAME_PROPERTY_SCHEMA,
  WORDSEARCHGAME_PROPERTY_SCHEMA,
  TRUEFALSEGAME_PROPERTY_SCHEMA,
  DRAGDROPGAME_PROPERTY_SCHEMA,
  CROSSWORDGAME_PROPERTY_SCHEMA,
  TEAMBUZZERGAME_PROPERTY_SCHEMA,
} from './games';
