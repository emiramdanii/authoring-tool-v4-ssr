// ═══════════════════════════════════════════════════════════════════
// FASE 4: LEGACY ARCHIVAL — Page Template components have been moved
// ═══════════════════════════════════════════════════════════════════
// All switch-based template components (CoverTemplate, DokumenTemplate,
// etc.) have been archived to /src/legacy/templates/.
//
// The schema-driven rendering pipeline now uses:
//   SchemaScreenRenderer → SCENE_REGISTRY → *Renderer.tsx (blocks/)
//
// This file preserves the types for backward compatibility.
// Do NOT import legacy template components in new code.
// ═══════════════════════════════════════════════════════════════════

export type { PageTemplateProps, SubTemplateProps } from './types';
