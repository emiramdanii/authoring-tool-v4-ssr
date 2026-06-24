# THEME-FALLBACK-MAP.md

## EDITOR-RESET-V2-PHASE-1 — Theme/Style Fallback Map

### Sumber Theme/Style

| Sumber theme | Lokasi file | Nilai default | Bisa menghasilkan dark/black? | Dipakai oleh Guru | Dipakai Advanced | Dipakai Preview | Dipakai Export | Status |
|---|---|---|---|---|---|---|---|---|
| schema.themeId | schema-factory.ts (PATCH-2D) | `'modern-interactive'` (light #F5F7FB) | TIDAK (light) | ✅ (PageRenderer reads this first) | ✅ | ✅ | ✅ (via ExportApp → PageRenderer mode=export) | OFFICIAL |
| templateData.schemaThemeId | apply-template-to-store.ts (PATCH-2E) | `= finalThemeId` (synced with schema.themeId) | TIDAK (synced) | ✅ (legacy bridge fallback) | ✅ | ✅ | ✅ | LEGACY (bridge, should match schema.themeId) |
| getTemplateThemeId() | CourseTemplateRegistry.ts | `'default'` (jika template tidak specify) | **YA** — 'default' maps ke dark navy | TIDAK langsung (apply-template-to-store override ke modern-interactive) | TIDAK langsung (same) | TIDAK langsung | TIDAK langsung | DANGEROUS (jika apply-template-to-store tidak override, 'default' = dark) |
| DEFAULT_PRESET_ID | style/defaults.ts | `'academic-clean'` (dark navy #0f172a) | **YA** — #0f172a adalah dark navy | TIDAK (hanya fallback jika themeId undefined) | TIDAK (same) | TIDAK (same) | TIDAK (same) | **DANGEROUS** — jika themeId hilang/undefined, fallback ke dark |
| TokenResolver(themeId) | SchemaRenderer.tsx / PageFrame.tsx | themeId dari `page.schema?.themeId \|\| page.templateData?.schemaThemeId \|\| undefined` | **YA** — jika undefined, TokenResolver pakai default preset = academic-clean (dark) | ✅ (PageFrame line 416) | ✅ (same) | ✅ (same) | ✅ (ExportApp uses PageRenderer) | DANGEROUS (undefined themeId → dark) |
| resolvePageStyleTokens() | style/consumer.ts → page-style-adapter.ts | Jika no themeId → `DEFAULT_PRESET_ID` = `'academic-clean'` (dark) | **YA** | ✅ (PageRenderer calls this) | ✅ | ✅ | ✅ (ExportApp → PageRenderer) | DANGEROUS (undefined themeId → dark) |
| LEGACY_THEME_TO_PRESET | style/preset-registry.ts | Maps legacy theme names → preset IDs | Tergantung mapping (beberapa ke dark presets) | Hanya jika project lama punya legacy themeId | Same | Same | Same | LEGACY |
| MpiStyleControl fallback | MpiStyleControl.tsx | `'modern-interactive'` (light) | TIDAK | ✅ (display only) | TIDAK | TIDAK | TIDAK | OFFICIAL (display, bukan data) |
| localStorage (project lama) | persistence-slice.ts loadFromStorage() | Apa pun yang tersimpan di project lama | **YA** — project lama bisa punya themeId='default' atau undefined | ✅ (jika guru load project lama) | ✅ | ✅ | ✅ | **DANGEROUS** (project lama bisa bawa dark theme) |
| ExportApp injected data | ExportApp.tsx → PageRenderer mode=export | themeId dari page.schema (same as editor) | Sama dengan editor | ✅ | ✅ | N/A | ✅ | OFFICIAL (same path as editor) |
| Export HTML (static) | renderPageHtml → renderBlockHtml | TIDAK pakai themeId — pakai hardcoded TOKEN_COLORS | **YA** — export HTML pakai dark theme default (TOKEN_COLORS.bg = canvasBg = dark) | N/A | N/A | N/A | ✅ (static HTML selalu dark) | **DANGEROUS** (export HTML selalu dark, terlepas dari themeId) |

### Jawaban Pertanyaan Kritis

**1. Dari mana cover hitam bisa muncul?**

Tiga jalur:
1. **Project lama dari localStorage**: Jika project lama tidak punya `schema.themeId` (dibuat sebelum PATCH-2D), TokenResolver fallback ke `DEFAULT_PRESET_ID` = `academic-clean` (dark navy #0f172a). Cover terlihat hitam.
2. **Template theme = 'default'**: `getTemplateThemeId()` returns `'default'` untuk semua template. Jika `apply-template-to-store` tidak override dengan `finalThemeId`, schema.themeId = 'default' → dark.
3. **Export HTML static**: `renderPageHtml()` TIDAK membaca themeId. Pakai `TOKEN_COLORS` hardcoded (bg = `PRIMITIVES.color.canvasBg` = dark). Export HTML selalu dark terlepas dari style yang dipilih.

**2. Apakah masih ada fallback dark default?**

**YA.** Dua fallback dark:
1. `DEFAULT_PRESET_ID = 'academic-clean'` di `style/defaults.ts` — dark navy #0f172a
2. `TOKEN_COLORS.bg` di `lib/export/utils.ts` — `PRIMITIVES.color.canvasBg` — dark

Keduanya adalah fallback yang AKTIF ketika themeId undefined atau ketika export HTML path dipakai.

**3. Apakah project lama bisa membawa theme gelap?**

**YA.** Project yang dibuat sebelum PATCH-2D tidak punya `schema.themeId`. Saat di-load:
- `page.schema.themeId` = undefined
- `page.templateData.schemaThemeId` = 'default' (dari template lama)
- TokenResolver reads: `undefined || 'default'` = 'default'
- `resolvePageStyleTokens` maps 'default' → `DEFAULT_PRESET_ID` = 'academic-clean' (dark)
- Cover terlihat gelap

**4. Apakah Advanced memakai resolver berbeda?**

**TIDAK.** Advanced editor (old 3-panel) dan MPI Studio keduanya memakai `PageRenderer` → `PageFrame` → `TokenResolver`. Same resolver, same themeId path. Tidak ada perbedaan.

**5. Apakah Export memakai style yang sama dengan Preview?**

**TIDAK.** Ini adalah **konflik terbesar**:
- **Preview**: `PreviewMode` → `PageRenderer` mode=preview → React component → TokenResolver → themeId dari page.schema → **light jika modern-interactive**
- **Export HTML (static)**: `renderPageHtml()` → `renderBlockHtml()` → `renderContentBlock()` → HTML string → `TOKEN_COLORS` hardcoded → **selalu dark** (canvasBg)
- **Export HTML (Vite SSR)**: `ExportApp` → `PageRenderer` mode=export → React component → TokenResolver → themeId dari page.schema → **light jika modern-interactive**

Ada DUA export path:
1. Vite SSR export (ExportApp → PageRenderer) — mengikuti themeId ✅
2. Static HTML export (renderPageHtml → renderBlockHtml) — hardcoded dark ❌

Export API route (`/api/export`) menggunakan Vite SSR path (template buffer). Tapi `renderPageHtml` digunakan untuk `data.pagesHtml` yang diinject ke template. Jadi export HTML yang guru lihat = Vite SSR (React) + static HTML (pagesHtml). **Risiko mismatch tinggi.**

### Risiko Theme

| # | Risiko | Severity | Sumber |
|---|---|---|---|
| 1 | Export HTML static pakai hardcoded dark, terlepas dari themeId | P1 | TOKEN_COLORS di export/utils.ts |
| 2 | Project lama tanpa schema.themeId → dark fallback | P1 | DEFAULT_PRESET_ID = academic-clean |
| 3 | getTemplateThemeId() returns 'default' (dark) | P2 | CourseTemplateRegistry.ts |
| 4 | LEGACY_THEME_TO_PRESET bisa map ke dark presets | P2 | preset-registry.ts |
| 5 | MpiStyleControl display ≠ actual page themeId (jika project lama) | P3 | MpiStyleControl fallback vs actual data |
