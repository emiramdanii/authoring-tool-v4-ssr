// ═══════════════════════════════════════════════════════════════════
// FASE 4: LEGACY ARCHIVAL — Template components moved to /src/legacy/
// ═══════════════════════════════════════════════════════════════════
// The switch-based PageTemplate component and all 12 sub-templates
// have been archived to /src/legacy/templates/.
//
// Schema-driven rendering now uses:
//   SchemaScreenRenderer → SCENE_REGISTRY → *Renderer.tsx (blocks/)
//
// This file preserves type exports for backward compatibility.
// ═══════════════════════════════════════════════════════════════════

export type { PageTemplateProps, SubTemplateProps } from './page-template/types';
