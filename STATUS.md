# STATUS.md — Sumber Kebenaran Proyek SILSE
> Terakhir diperbarui: 2026-05-27
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
| 8. Konten.tsx → Schema Navigator (MateriTab — most complex) | ⬜ PENDING | Phase 3 |
| 9. Safe Page Split / Overflow Policy | ⬜ PENDING | Phase 4 |
| 10. Cleanup dual source | ⬜ PENDING | Phase 5 |

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
| Deprecated sync-projection.ts | `src/core/schema/sync-projection.ts` | @deprecated + console.warn |
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

### Dual Source of Truth (AKAR MASALAH)
- **Arah sekarang**: Konten Tab → AuthoringStore (TULIS) → sync → Schema (BACA)
- **Arah yang benar**: Konten Tab → Schema (TULIS) → deriveProjection → AuthoringStore (BACA saja)
- **Impact**: Edit di Konten tab kadang tidak muncul di canvas karena sync gagal

### Konten.tsx Masih Authoring-First
- `useAuthoringStore` sebagai sumber utama (line 13, 49-52)
- Setiap tab (MateriTab, KuisTab, dll) baca/tulis ke authoring store
- sync-projection.ts adalah bridge tapi arahnya terbalik

---

## Parking Lot (Jangan Dikerjakan Sampai Fase Saat Ini Selesai)

| ID | Masalah | Ditemukan Saat |
|---|---|---|
| P1 | Cover invisible bug — zIndex:0 di SceneLayoutEngine | Audit sebelumnya |
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
- Task 8: MateriTab → deferred (most complex: 13+ block type conversions, needs dedicated session)

### Phase 4 — Safe Page Split
**Goal**: Auto-split konten panjang, overflow policy

### Phase 5 — Cleanup
**Goal**: Hapus old write paths, schema-only untuk save/export
