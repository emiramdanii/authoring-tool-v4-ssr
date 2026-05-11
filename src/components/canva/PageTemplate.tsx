// ═══════════════════════════════════════════════════════════════════
// FASE 4: LEGACY ARCHIVAL — COMPLETE
// ═══════════════════════════════════════════════════════════════════
// The switch-based PageTemplate component and all 12 sub-templates
// have been DELETED from /src/legacy/templates/ (FASE 4 cleanup).
// They had zero runtime imports and were pure dead code (~3,918 lines).
//
// Schema-driven rendering now uses:
//   SchemaScreenRenderer → SCENE_REGISTRY → *Renderer.tsx (blocks/)
//
// This file preserves type exports for any external consumers.
// These types are also deprecated — use SchemaBlock types instead.
// ═══════════════════════════════════════════════════════════════════

/** @deprecated Use SchemaBlock-based rendering instead */
export type { PageTemplateProps, SubTemplateProps } from './page-template/types';
