# STATUS.md — Sumber Kebenaran Proyek SILSE
> Terakhir diperbarui: 2026-05-29
> Prinsip: **Selesai satu, baru lanjut satu. Tidak numpuk.**

---

## Aturan Kerja

1. **Satu task aktif pada satu waktu** — tidak boleh ada 2 task `in_progress`
2. **Parking Lot** — masalah yang ditemukan accidental ditulis di sini, BUKAN dikerjakan
3. **Definition of Done** — task hanya bisa ditandai DONE jika:
   - Kode ditulis
   - Build pass (`npx next build` sukses)
   - Dicatat di worklog.md
4. **Tidak buat plan baru** sebelum task yang aktif selesai

---

## Status Aktif

| Task | Status | Fase |
|---|---|---|
| 0. Buat STATUS.md | ✅ DONE | Setup |
| 1. applyGuidedSchemaPatch() | ✅ DONE | Phase 1 |
| 2. getEditableSchemaBlocks() + getGuidedEditorSchema() | ✅ DONE | Phase 1 |
| 3. Deprecate old write paths | ✅ DONE | Phase 1 |
| 4. Guided form di Right Panel (UI redesign) | ✅ DONE | Phase 2 |
| 5. Guided form di Right Panel (functional) | ✅ DONE | Phase 2 |
| 6. Konten.tsx → Schema Navigator (DiskusiTab + RefleksiTab) | ✅ DONE | Phase 3 |
| 7. Konten.tsx → Schema Navigator (KuisTab, MotivasiTab, RangkumanTab) | ✅ DONE | Phase 3 |
| 8. Konten.tsx → Schema Navigator (MateriTab — most complex) | ✅ DONE | Phase 3 |
| 9. Safe Page Split / Overflow Policy | ✅ DONE | Phase 4 |
| 10. Cleanup dual source | 🔄 IN PROGRESS | Phase 5 |
| 11. P0: Delete dead code (sync-projection.ts + deprecated slices) | ✅ DONE | Phase 5 |
| 12. P0: Fix SchemaBlockTree typo (sateri → skenario) | ✅ DONE | Phase 5 |
| 13. P1: Schema migration CP/TP/ATP/Alur (hooks + Dokumen.tsx) | ✅ DONE | Phase 5 |
| 14. P2: Modules projection sync (SchemaProjection.modules) | ✅ DONE | Phase 5 |
| 15. Fix: Cover invisible bug (zIndex:0 → zIndex:1) | ✅ DONE | Bug Fix |
| 16. P3: Migrate matching+truefalse → schema game blocks | ✅ DONE | Phase 5 |
| 17. P4: Remove module-slice write actions (read-only projection) | ✅ DONE | Phase 5 |
| 18. P5: Fix double-write on load (system-slice vs persistence-slice) | ✅ DONE | Phase 5 |
| 19. P6: Create schema block types for presentation modules (tab-icons, accordion, timeline, infografis) | ✅ DONE | Phase 5 |

---

## Sudah Selesai (Build Pass)

| Komponen | File | Keterangan |
|---|---|---|
| Golden Template PPKn Norma | `src/presets/ppkn/norma-golden-schema.ts` | 17 halaman, STANDAR compliant |
| PageSplitCompiler | `src/core/template/compiler/PageSplitCompiler.ts` | Density check + split |
| LearningUnit + Density Rules | `src/core/template/compiler/LearningUnit.ts` | Tipe + PAGE_DENSITY_RULES |
| TemplateThemeContract | `src/core/template/contract/TemplateThemeContract.ts` | Contract system |
| GoldenPageRenderer | `src/core/renderer/GoldenPageRenderer.tsx` | Progress bar + phase badge |
| Schema Apply API | `src/core/schema/schema-apply.ts` | applyBlocksToPages, transactions, split/merge |
| applyGuidedSchemaPatch() | `src/core/schema/guided-patch.ts` | Single write path ke schema, 12 block type registry |
| getEditableSchemaBlocks() | `src/core/schema/guided-patch.ts` | List editable blocks dari schema |
| getGuidedEditorSchema() | `src/core/schema/guided-patch.ts` | Field definitions per block type |
| ~~sync-projection.ts~~ | `src/core/schema/sync-projection.ts` | DELETED — zero importers, all sync* functions dead code |
| BlockPropertiesPanel (stitch v4) | `src/components/canva/right-panel/BlockPropertiesPanel.tsx` | Guided form routing |
| GuidedFormEditor | `src/components/canva/right-panel/block-properties/GuidedFormEditor.tsx` | Teacher-friendly content editor |
| Guided Field Renderer | `src/components/canva/right-panel/block-properties/guided-field-renderer.tsx` | text/textarea/richtext/color/array/boolean/select/number/icon |
| SchemaDrivenEditor | `src/components/canva/right-panel/block-properties/SchemaDrivenEditor.tsx` | Developer fallback editor |
| CoverRenderer font fix | `src/core/renderer/blocks/CoverRenderer.tsx` | 12px→14px |
| Schema immutable ops | `src/core/schema/immutable/` | produce, patch, split, merge |
| Sync projection bridges | `src/core/schema/sync-projection.ts` | syncKuis/ToSchema (sementara, deprecated) |
| AuthoringStore deprecation notice | `src/store/authoring-store.ts` | Notice ada, belum migrasi |

---

## Masalah yang Belum Diperbaiki

### Dual Source of Truth (NEAR-RESOLVED)
- **Arah sekarang**: Konten Tab → Schema (TULIS via applyGuidedSchemaPatch) → startProjectionSync → AuthoringStore (auto-derived, READ-ONLY)
- **Sisa masalah**: Non-schema fields (cp, atp, petunjuk, penutup, suara) masih ditulis langsung ke AuthoringStore
- **Phase 5 target**: AuthoringStore jadi fully derived (read-only mirror of schema)

---

## Parking Lot (Jangan Dikerjakan Sampai Fase Saat Ini Selesai)

| ID | Masalah | Ditemukan Saat |
|---|---|---|
| P1 | ~~Cover invisible bug — zIndex:0 di SceneLayoutEngine~~ ✅ FIXED (Task 5) | Audit sebelumnya |
| P2 | Multiple visual systems fighting — Tailwind vs edu tokens vs schema colors | Diskusi STANDAR |
| P3 | Font size violations di block renderers lainnya | Audit sebelumnya |
| P4 | NcGridRenderer card body "Bagian dari materi" — placeholder text | Review norma-golden |
| P5 | syncMateriToSchema generate new IDs setiap sync — menyebabkan re-render | Analisis sync-projection |

---

## Catatan Per Fase

### Phase 1 — Schema Editing Foundation ✅ DONE
**Goal**: Schema jadi single write path untuk konten

1. `applyGuidedSchemaPatch({ pageId, blockId, patch, overflowPolicy })` — fungsi utama
2. `getEditableSchemaBlocks(page)` — list block yang bisa diedit
3. `getGuidedEditorSchema(blockType)` — definisi field per block type (12 block types)
4. Deprecate: syncKuisToSchema, syncMateriToSchema, dll → ganti dengan applyGuidedSchemaPatch

### Phase 2 — Right Panel Guided Form ✅ DONE
**Goal**: Setiap block type punya guided editor yang ramah guru

- UI redesign sesuai stitch v4 (spacious, MD3 tokens, large labels, rounded-xl)
- GuidedFormEditor — teacher-friendly content editor, writes via applyGuidedSchemaPatch()
- guided-field-renderer — 9 field types: text, textarea, richtext, color, icon, select, number, boolean, array
- BlockPropertiesPanel routing: GuidedForm (when hasGuidedEditor) vs SchemaDrivenEditor (fallback)
- Dead code cleaned up (old block-properties/index.tsx → .deprecated.tsx)

### Phase 3 — Konten → Schema Navigator
**Goal**: Konten panel baca dari schema, bukan authoring store

**Completed**:
- Task 6: DiskusiTab + RefleksiTab → useSchemaDiskusi/useSchemaRefleksi (done in earlier session)
- Task 7: MotivasiTab → useSchemaMotivasi, RangkumanTab → useSchemaRangkuman, KuisTab → useSchemaKuis
  - Removed syncKuisToSchema() forward sync from KuisTab (no longer needed)
  - Shape bridges: MotivasiBlock.hookQuestion↔intro/pertanyaanPemicu, connections[]↔koneksi, transition↔aktivitas
  - Shape bridges: RangkumanBlock.concepts[]↔poin[], closingStatement↔tips
  - KuisTab: All CRUD + drag-sort + presets go through schema hook, no authoring store content writes
  - Each tab shows empty state when no matching schema block exists
- Task 8: MateriTab → useSchemaMateri (materi-blok inside materi-section)
  - 13 block editor forms all write via useSchemaMateri().updateBlok()
  - syncMateriToSchema() removed — no longer needed
  - Nearly 1:1 mapping: MateriBlokBlock ↔ MateriBlok (style↔infoboxStyle)
  - Also added: useSchemaSkenario (chapter/choice/consequence CRUD), useSchemaModules (game blocks→Module[])

**Phase 3 COMPLETE** — All 8 Konten tabs now read from schema via useSchemaXxx hooks and write via applyGuidedSchemaPatch(). Zero useAuthoringStore content reads remain in konten/ directory.

### Phase 4 — Safe Page Split ✅ DONE
**Goal**: Auto-split konten panjang, overflow policy

**Completed**:
- `previewPatchOverflow()` — pre-flight overflow check tanpa write ke store
  - Clones schema, applies patch to clone, runs checkOverflowRich()
  - Returns OverflowCheckResult + previewSchema (read-only)
  - Used by Konten tabs to show "This edit would cause overflow" BEFORE applying
- Auto-split atomic fix — uses `promoteSceneSplitToPage()` directly instead of navigate+split
  - No longer fragile: single transaction instead of navigate-then-split
  - Uses `require('./schema-apply')` lazy import to avoid circular deps
- Per-page overflow status store — `useOverflowWarningStore.pageOverflowStatus`
  - Record<pageId, PageOverflowStatus> — tracks hasOverflow, details, lastChecked
  - Batch set: `batchSetPageOverflowStatus()` for post-generate scan
  - Auto-updated by `setWarning()` when overflow detected
- KontenOverflowBanner upgrade — direct action buttons
  - Kompakkan (Compress): rebalanceCurrentPage() if canCompress
  - Split Halaman: promoteSceneSplitToPage() if canSplit
  - Lihat: navigate to canvas for manual fix
  - Dismiss: hide banner
- `scanAllPagesOverflow()` — post-generate overflow scan
  - Scans all pages for overflow after auto-generate
  - Optional `autoSplit` parameter to auto-split overflowing pages
  - Writes results to pageOverflowStatus store
- SceneList overflow indicator — amber AlertTriangle icon on overflowing pages
  - Reads from pageOverflowStatus store

### Phase 5 — Cleanup Dual Source (IN PROGRESS)
**Goal**: Hapus old write paths, schema-only untuk save/export

**Completed**:
- 32 write actions in 5 Tier 1 authoring store slices marked @deprecated
  - kuis-slice: addKuis, deleteKuis, updateKuis, updateKuisOpt, reorderKuis
  - materi-slice: addMateriBlok, removeMateriBlok, updateMateriBlok, moveMateriBlok
  - skenario-slice: setSkenario + 12 chapter/choice/consequence actions
  - diskusi-refleksi-slice: updateDiskusi/Refleksi + 6 pertanyaan CRUD actions
  - motivasi-rangkuman-slice: updateMotivasi, updateRangkuman
- Each deprecated action has console.warn() pointing to schema-first alternative
- Konten tabs already bypass these deprecated actions (using useSchemaXxx hooks)
- **Phase 5-A: Extract dirty flag to standalone useDirtyStore**
  - `useDirtyStore` — standalone Zustand store at `src/store/dirty-store.ts`
  - Bridge: AuthoringStore.dirty changes auto-sync to useDirtyStore via subscription
  - Migrated READ consumers: StatusToast, StatusBar, LivePreview, AuthoringTool, RecoveryDialog, CanvaBuilder, use-auto-save, use-unsaved-guard
  - Migrated WRITE consumers: TemplateWizard, TemplateMarketplace, auto-generate.ts, applyGuidedSchemaPatch()
  - `isAnyDirty()` and `getCombinedSaveStatus()` in save-utils.ts now read from useDirtyStore
  - `saveAllToStorage()` now clears useDirtyStore after saving
- **Phase 5-B: activePanel partial migration**
  - Phase 3's panelRequest pattern works for cross-panel navigation
  - Direct reads/writes still in AuthoringStore (requires AuthoringTool.tsx refactor)

**This Session's Progress**:
- P0: Deleted `sync-projection.ts` (zero importers), removed deprecated slice actions from 5 authoring store slices (kuis, materi, skenario, diskusi-refleksi, motivasi-rangkuman), fixed SchemaBlockTree typo ('sateri' → 'skenario')
- P1: Created CpBlock + AtpBlock schema types, added to SchemaBlock union, added guided editor registry entries for cp/tp/alur/atp, created useSchemaCp/useSchemaTp/useSchemaAlur/useSchemaAtp hooks with dual-write pattern, migrated Dokumen.tsx sections from AuthoringStore to schema hooks
- P2: Added `modules` to SchemaProjection + deriveGameBlockToModules() — game blocks now auto-sync to AuthoringStore via startProjectionSync()
- Bug fix: Cover invisible bug (zIndex:0 → zIndex:1 in SceneLayoutEngine)
- P3: Migrated matching+truefalse in use-auto-generate.ts from AuthoringStore module-slice actions → schema game blocks via applyBlockToPages(). Added genMatchingSchema() and genTrueFalseSchema() to generators.ts. Migrated memory module in autoGenerateContent() from projection → memory-game schema block.
- P4: Removed all 7 write actions from module-slice.ts (addModule, removeModule, updateModuleField, moveModule, addModuleItem, removeModuleItem, updateModuleItem). Zero callers remain. modules field is now a read-only projection derived from schema via startProjectionSync().
- P5: Fixed double-write on load — system-slice.loadFromStorage() now only loads non-schema fields (cp, atp, petunjuk, penutup, suara, guruPw). Schema-backed fields are derived from schema via persistence-slice + startProjectionSync(). Added modules+games to projection patch. Removed duplicate CanvaStore.loadFromStorage() call from AuthoringTool.tsx. Fixed loadProject() to not overwrite schema-backed fields.

**Remaining (Future Work)**:
- ~~Create schema block types for presentation modules (tab-icons, accordion, timeline, infografis)~~ ✅ DONE (Phase 5-G)
- Create dedicated renderers for tab-icons, accordion, infografis (currently using temp renderers)
- Migrate preset-slice writes (applyFullPreset) to schema-first (requires preset format refactor)
- Convert import/restore bulk writes to schema-first
- Full activePanel extraction from AuthoringStore to dedicated navigation store
- Eliminate redundant `games` field (replace with computed getter)
- P2: Multiple visual systems fighting — Tailwind vs edu tokens vs schema colors
- P3: Font size violations in other block renderers
- P4: NcGridRenderer card body placeholder text
