# SCENE-RENDER-MAP.md

## EDITOR-RESET-V2-PHASE-1 — Scene/Block Render Map

### Scene/Block → Factory → Renderer

| Scene/Block | Factory | Schema block type | Disimpan di field | Renderer React (Canvas/Preview) | Renderer Export (HTML) | Mode Guru path | Advanced path | Preview path | Export path | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| Cover | createDefaultSchemaForTemplateType('cover') → TEMPLATE_BLOCK_MAP | `cover` | page.schema.blocks[0].type | LAZY_RENDERER_MAP['cover'] → CoverRenderer → CoverScreen → SchemaScreenRenderer | renderContentBlock('cover') → renderCover() → static HTML | PageRenderer mode=canvas | PageRenderer mode=canvas (via Stage) | PageRenderer mode=preview | renderPageHtml → renderBlockHtml → renderCover | OFFICIAL (dua renderer berbeda: React vs static HTML) |
| Petunjuk | createDefaultSchemaForTemplateType('petunjuk') | `petunjuk` | page.schema.blocks[0].type | LAZY_RENDERER_MAP['petunjuk'] → PetunjukRenderer → PetunjukScreen | renderContentBlock('petunjuk') → renderPetunjuk() | same | same | same | same | OFFICIAL |
| Tujuan | createDefaultSchemaForTemplateType('tujuan') | `tujuan-display` | page.schema.blocks[0].type | LAZY_RENDERER_MAP['tujuan-display'] → TujuanDisplayRenderer → TujuanScreen | renderContentBlock('tujuan-display') → renderTujuanDisplay() | same | same | same | same | OFFICIAL |
| Motivasi | createDefaultSchemaForTemplateType('motivasi') | `motivasi` | page.schema.blocks[0].type | LAZY_RENDERER_MAP['motivasi'] → MotivasiRenderer → MotivasiScreen | renderContentBlock('motivasi') → renderMotivasi() | same | same | same | same | OFFICIAL |
| Materi | createDefaultSchemaForTemplateType('materi') | `materi-section` | page.schema.blocks[0].type | LAZY_RENDERER_MAP['materi-section'] → MateriSectionRenderer → MateriScreen | renderContentBlock('materi-section') → renderMateriSection() | same | same | same | same | OFFICIAL |
| Diskusi | createDefaultSchemaForTemplateType('diskusi') | `diskusi` | page.schema.blocks[0].type | LAZY_RENDERER_MAP['diskusi'] → DiskusiRenderer → DiskusiScreen | renderContentBlock('diskusi') → renderDiskusi() | same | same | same | same | OFFICIAL |
| Skenario | createDefaultSchemaForTemplateType('skenario') | `skenario` | page.schema.blocks[0].type | LAZY_RENDERER_MAP['skenario'] → SkenarioRenderer → SkenarioScreen | renderContentBlock('skenario') → renderSkenario() | same | same | same | same | OFFICIAL |
| Kuis | createDefaultSchemaForTemplateType('kuis') | `kuis` | page.schema.blocks[0].type | LAZY_RENDERER_MAP['kuis'] → KuisRenderer → QuizScreen | renderContentBlock('kuis') → renderQuizBlock() | same | same | same | same | OFFICIAL |
| Game | createDefaultSchemaForTemplateType('game') | `sortir-game` | page.schema.blocks[0].type | LAZY_RENDERER_MAP['sortir-game'] → SortirGameRenderer → GameScreen | renderContentBlock('sortir-game') → renderGameBlock() | same | same | same | same | OFFICIAL |
| Hasil | createDefaultSchemaForTemplateType('hasil') | `hasil` | page.schema.blocks[0].type | LAZY_RENDERER_MAP['hasil'] → HasilRenderer → HasilScreen | renderContentBlock('hasil') → renderHasil() | same | same | same | same | OFFICIAL |
| Refleksi | createDefaultSchemaForTemplateType('refleksi') | `refleksi` | page.schema.blocks[0].type | LAZY_RENDERER_MAP['refleksi'] → RefleksiRenderer → RefleksiScreen | renderContentBlock('refleksi') → renderRefleksi() | same | same | same | same | OFFICIAL |
| Rangkuman | createDefaultSchemaForTemplateType('rangkuman') | `rangkuman` | page.schema.blocks[0].type | LAZY_RENDERER_MAP['rangkuman'] → RangkumanRenderer → RangkumanScreen | renderContentBlock('rangkuman') → renderRangkuman() | same | same | same | same | OFFICIAL |
| Penutup | createDefaultSchemaForTemplateType('penutup') | `penutup` | page.schema.blocks[0].type | LAZY_RENDERER_MAP['penutup'] → PenutupRenderer → PenutupScreen | renderContentBlock('penutup') → renderPenutup() | same | same | same | same | OFFICIAL |

### DUA Renderer Path untuk Setiap Scene

Setiap scene punya **DUA renderer yang berbeda**:

1. **React path** (Canvas/Preview/Present): `PageRenderer` → `getScreenAdapter(templateType)` → `CoverScreen`/`MateriScreen`/dll → `SchemaScreenRenderer` → `LazyRenderer` → block renderer component (React component)

2. **Static HTML path** (Export): `renderPageHtml()` → `renderBlockHtml()` → `renderContentBlock()` → `renderCover()`/`renderMateriSection()`/dll → returns HTML string

**Risiko**: React path dan static HTML path adalah kode terpisah. Perubahan di satu path tidak otomatis sync dengan path lain. Visual mismatch antara editor/preview (React) dan exported HTML (static) adalah mungkin.

### Factory Tunggal

Semua scene dibuat oleh **satu factory**: `createDefaultSchemaForTemplateType()` di `schema-factory.ts`, yang menggunakan `TEMPLATE_BLOCK_MAP` untuk menentukan block type per templateType.

`createPageFromPreset()` di `PagePresetRegistry.ts` memanggil `createDefaultSchemaForTemplateType()` — tidak ada factory alternatif.

`createProjectFromTemplate()` di `CourseTemplateRegistry.ts` juga memanggil `createPageFromPreset()` — tidak ada factory alternatif.

**Tidak ada konflik factory.** Satu jalur creation, dua jalur rendering.

### Block Types Tidak Ada di TEMPLATE_BLOCK_MAP

Block types berikut ada di LAZY_RENDERER_MAP (React renderer) tapi TIDAK ada di TEMPLATE_BLOCK_MAP (factory tidak membuatnya sebagai default):

- `tp` (Tujuan Pembelajaran lama) — ada renderer, tapi factory membuat `tujuan-display` bukan `tp`
- `alur` — ada renderer, tidak ada templateType yang map ke `alur`
- `def-box` — ada renderer, fallback factory (TEMPLATE_BLOCK_MAP default = `['def-box']`)
- `nc-grid`, `nk-card`, `flashcard-set`, `ftab` — ada renderer, tidak dibuat oleh factory
- `tabel-accord`, `hero`, `materi-blok` — ada renderer, tidak dibuat oleh factory
- `roda-game`, `memory-game`, `matching-game`, `fill-blank-game`, `word-search-game`, `true-false-game`, `drag-drop-game`, `crossword-game`, `team-buzzer-game` — ada renderer, game types hanya `sortir-game` di factory
- `hotspot-image` — ada renderer, tidak dibuat oleh factory

**Risiko**: Block types ini bisa muncul dari import project lama atau addSchemaBlock manual. Renderer ada, tapi factory tidak membuatnya sebagai default page. Jika muncul di export, `renderContentBlock()` akan fallback ke generic block.
