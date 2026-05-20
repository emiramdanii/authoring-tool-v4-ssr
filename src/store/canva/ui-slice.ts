// ═══════════════════════════════════════════════════════════════
// CANVA STORE — UI slice barrel (backward compatibility)
// ═══════════════════════════════════════════════════════════════
// This file has been decomposed into 4 focused slices:
//   - viewport-slice.ts   — Tool, zoom, grid, snap, layout, stage
//   - schema-crud-slice.ts — Block editing + CRUD
//   - schema-ops-slice.ts  — Clipboard, nudge, align, batch ops
//   - page-ops-slice.ts    — Cross-page, containers, scene txns
//
// This barrel re-exports the combined type and individual creators
// for backward compatibility.
// New code should import from the specific slice file directly.
// ═══════════════════════════════════════════════════════════════

export type { ViewportSlice } from './viewport-slice';
export type { SchemaCRDSlice } from './schema-crud-slice';
export type { SchemaOpsSlice } from './schema-ops-slice';
export type { PageOpsSlice } from './page-ops-slice';

export { createViewportSlice } from './viewport-slice';
export { createSchemaCRDSlice } from './schema-crud-slice';
export { createSchemaOpsSlice } from './schema-ops-slice';
export { createPageOpsSlice } from './page-ops-slice';

// Combined type alias for the full UI surface
import type { ViewportSlice } from './viewport-slice';
import type { SchemaCRDSlice } from './schema-crud-slice';
import type { SchemaOpsSlice } from './schema-ops-slice';
import type { PageOpsSlice } from './page-ops-slice';

export type UISlice = ViewportSlice & SchemaCRDSlice & SchemaOpsSlice & PageOpsSlice;
