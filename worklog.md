# SILSE v2.1 — Worklog: Freeze Legacy & Golden Theme

**Tanggal**: 2026-03-04  
**Filosofi**: experience → template → system  
**Referensi**: `upload/mpi-ppkn-norma-final (2).html` (GOLD STANDARD)

---

## Ringkasan Perubahan

### STEP 1: Freeze Legacy Templates ✅

**File baru**: `src/core/template/legacy/course-templates-legacy.ts`
- 22 template dipindahkan dari `COURSE_TEMPLATES` ke `LEGACY_COURSE_TEMPLATES`
- Diekspor sebagai `LEGACY_COURSE_TEMPLATES` (tidak didaftarkan di pipeline aktif)
- Tersedia untuk referensi masa depan

**File diubah**: `src/core/template/CourseTemplateRegistry.ts`
- Import `LEGACY_COURSE_TEMPLATES` dengan komentar: `// LEGACY: Frozen — not registered in active pipeline. Available for future reference.`
- Hanya 3 template aktif tersisa:
  1. `modul-ppkn-vii` (presetId: `hakikat-norma`) — Alur Emas: Hakikat Norma
  2. `modul-ppkn-vii-macam-norma` (presetId: `macam-norma`) — Alur Emas: Macam-Macam Norma
  3. `template-kosong` — Fallback universal (theme diubah ke `golden-presentation`)
- Versi metadata diperbarui ke `2.1.0`

### STEP 2: Golden Theme Preset ✅

**File diubah**: `src/core/themes/tokens.ts`
- Preset baru `golden-presentation` ditambahkan ke `THEME_PRESETS`
- Visual DNA dari referensi HTML:
  - Background: `#0f172a` → `#1e293b` (dark navy gradient)
  - Card: `rgba(255,255,255,0.06)` dengan border `rgba(255,255,255,0.1)`
  - Aksen utama: `#fbbf24` (emas/kuning)
  - Aksen sekunder: `#2563eb` (biru)
  - Tipografi: Poppins 800 heading, Open Sans 400-600 body
  - Radius: 12px kartu, 20px badge/pill
  - Interaksi: hover translateY(-2px), active scale(0.96)
  - Norma-specific: nagama=emas, nkesusilaan=merah, nkesopanan=biru muda, nhukum=ungu
- `DEFAULT_THEME_ID` diubah dari `'ios-light'` ke `'golden-presentation'`

### STEP 3: Updated hakikat-norma & macam-norma Presets ✅

**File diubah**: `src/core/themes/tokens.ts`
- `hakikat-norma` sekarang mewarisi seluruh Visual DNA golden-presentation
  - Aksen utama tetap emas (#fbbf24)
  - Nama diubah: "⚖️ Hakikat Norma (Golden Accent)"
  - Full token set: colors, spacing, radius, shadow, typography, animation
  
- `macam-norma` sekarang mewarisi golden-presentation + warna norma spesifik
  - Nama diubah: "📜 Macam Norma (Cyan-Golden Accent)"
  - Warna norma: nagama=emas, nkesusilaan=merah, nkesopanan=biru muda, nhukum=ungu
  - Full token set: colors, spacing, radius, shadow, typography, animation

## TypeScript Compilation

- `npx tsc --noEmit` — **0 error** dari file yang diubah
- 192 error pre-existing di file lain (bukan terkait perubahan ini)

## File yang Tidak Dihapus

Semua file dipertahankan. Tidak ada file yang dihapus:
- `CourseTemplateRegistry.ts` — dimodifikasi (3 template aktif + import legacy)
- `tokens.ts` — dimodifikasi (golden-presentation + updated presets)
- `legacy/course-templates-legacy.ts` — file baru (22 template legacy)

## Impor yang Masih Berfungsi

`TemplateWizard.tsx` mengimpor dari `CourseTemplateRegistry.ts`:
- `SUBJECTS`, `GRADE_OPTIONS`, `SEMESTER_OPTIONS` — ✅ tidak berubah
- `getCourseTemplatesFiltered()` — ✅ masih berfungsi (hanya return 3 template aktif)
- `getTemplateFlowPreview()` — ✅ masih berfungsi
- `createProjectFromTemplate()` — ✅ masih berfungsi
- `getTemplateThemeId()` — ✅ masih berfungsi
- `CourseTemplate`, `ProjectMetadata` types — ✅ tidak berubah
---
Task ID: 1-3
Agent: Main Agent + full-stack-developer subagent
Task: Freeze legacy templates, define Visual DNA, create golden theme

Work Log:
- Read and analyzed reference HTML (mpi-ppkn-norma-final) — 1335 lines of polished interactive lesson
- Audited entire codebase: CourseTemplateRegistry.ts, preset files, theme tokens, store, renderer structure
- Discovered pipeline IS connected (Level 1 preset → schemaToCanvaPages works)
- Root problem identified: Visual DNA mismatch — renderer tokens don't match reference's dark, polished look
- Created legacy directory: /home/z/my-project/src/core/template/legacy/
- Moved 22 templates to legacy/course-templates-legacy.ts (frozen, not registered)
- Kept only 3 active templates: hakikat-norma, macam-norma, template-kosong
- Created golden-presentation theme preset matching reference's Visual DNA:
  - Dark navy bg (#0f172a → #1e293b)
  - Gold accent (#fbbf24) + Blue secondary (#2563eb)
  - Poppins 800 / Open Sans typography
  - Glassmorphic cards (rgba(255,255,255,0.06))
  - Proper spacing, radius, shadow, animation tokens
- Updated DEFAULT_THEME_ID from 'ios-light' to 'golden-presentation'
- Updated hakikat-norma and macam-norma presets to inherit golden Visual DNA
- TypeScript compilation: no NEW errors from our changes

Stage Summary:
- Legacy templates frozen (22 → legacy, 3 active)
- Golden theme preset created with reference's Visual DNA
- Default theme changed to golden-presentation
- Next: verify renderer output matches the visual quality of reference
