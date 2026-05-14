# Deep Analysis Pipeline: Preset → Template → Canvas → Play → Export
## Authoring Tool v4 SSR — Senior Developer Report

> **Scope:** Analisis end-to-end seluruh pipeline data  
> **File diperiksa:** `derive-schema.ts`, `PagePresetRegistry.ts`, `ensure-schema.ts`, `PageRenderer.tsx`, `SchemaRenderer.tsx`, `PlayOverlay.tsx`, `interactive-store.ts`, `use-vite-export.ts`, `/api/export/route.ts`, `use-export-actions.ts`, `BlockDefinitionRegistry.ts`, `canva-constants.ts`  
> **Tanggal:** Mei 2026

---

## Ringkasan Eksekutif

Pipeline data secara keseluruhan sudah memiliki arah arsitektur yang benar — one-way data flow dari Authoring Store → `deriveSchema()` → `page.schema` → Renderer sudah didesain dengan baik. Namun ditemukan **12 gap kritis** yang menyebabkan output export bisa berbeda dari apa yang guru lihat di canvas, sistem variant tidak berfungsi, dan beberapa bug state di Play mode.

| Prioritas | Jumlah | Deskripsi |
|-----------|--------|-----------|
| P0 — Kritis | 3 | Data integrity, export correctness |
| P1 — Tinggi | 4 | Bug logic, ID collision, template salah |
| P2 — Sedang | 3 | State mutation, fallback bermasalah |
| P3 — Rendah | 2 | Code duplication, maintainability |

---

## Arsitektur Pipeline (Overview)

```
① AUTHORING STORE
   meta, cp, tp, materi, kuis, skenario, game,
   petunjuk, diskusi, refleksi, penutup
        │
        ▼
② deriveSchema(templateType, ctx)
   One-way bridge. 12 handler per templateType.
   ID-stable via buildIdMap() + getBlockId().
        │
        ▼
③ PagePresetRegistry → createPageFromPreset()
   13 preset. create() memanggil deriveSchema().
   Hasilkan CanvaPage dengan page.schema native.
        │
        ▼
④ CANVA STORE — pages: CanvaPage[]
   page.schema = source of truth.
   Legacy: ensurePageSchema() lazy-migrate.
        │
   ┌────┴─────┬──────────┐
   ▼          ▼          ▼
⑤a CANVAS   ⑤b PLAY   ⑤c EXPORT
   mode=      mode=      /api/export
   canvas     preview    window.__EXPORT_DATA__
```

---

## P0 — Kritis: Harus Diperbaiki Segera

### 1. Export ≠ Canvas — Output Siswa Bisa Berbeda dari yang Guru Lihat

**File:** `src/lib/use-vite-export.ts`

Ini adalah gap terbesar di seluruh pipeline. Payload yang dikirim ke `/api/export` berisi dua hal:

```typescript
// use-vite-export.ts — buildPayload()
return {
  pages,                    // CanvaPage[] — berisi page.schema jika ada
  ratioId,
  meta: authStore.meta,     // authoring data mentah
  allKuis: authStore.kuis,  // authoring data mentah
  materi: authStore.materi, // authoring data mentah
  skenario: authStore.skenario,
  // ... semua authoring store ikut
};
```

Di export runtime (HTML yang dibuka siswa), ada kemungkinan `generateClientExportHtml()` **me-derive ulang schema dari authoring data mentah**, bukan dari `page.schema` yang sudah dimodifikasi guru di canvas.

**Dampak:** Guru mengedit konten di canvas → klik Export → siswa melihat konten berbeda (versi authoring mentah, bukan hasil editan).

**Fix:**
```typescript
// Pastikan export runtime prioritaskan page.schema
// Di client-export.ts atau SchemaPlayer:
const schema = page.schema
  ?? deriveSchema(page.templateType, ctx, null);
// Jangan re-derive jika page.schema sudah ada
```

---

### 2. Schema Tidak Pernah Sync Otomatis ke Canvas

**File:** `src/core/schema/derive-schema.ts`, `src/store/canva/schema-preset-slice.ts`

`deriveSchema()` hanya dipanggil **sekali** saat halaman pertama kali dibuat via `createPageFromPreset()`. Setelah itu, jika guru mengubah konten di authoring panel (edit TP, ganti judul, tambah butir materi), `page.schema` di canvas **tidak pernah diperbarui**.

```typescript
// Tidak ada mekanisme ini:
authoringStore.subscribe((newState, prevState) => {
  if (newState.materi !== prevState.materi) {
    canvaStore.getState().syncSchema(); // TIDAK ADA
  }
});
```

Guru harus `resetCanvas()` untuk melihat perubahan — operasi destructive yang menghapus semua editan manual.

**Fix:** Tambah `syncSchema(pageId?)` action di canva-store:

```typescript
syncSchema: (pageId?: string) => {
  const ctx = createDeriveContext();
  set(state => ({
    pages: state.pages.map(page => {
      if (pageId && page.id !== pageId) return page;
      if (page.templateType === 'custom') return page;
      const newSchema = deriveSchemaForPage(page, ctx);
      return newSchema ? { ...page, schema: newSchema } : page;
    })
  }));
}
```

Subscribe ke authoring store dan panggil `syncSchema()` saat data berubah.

---

### 3. Sistem Variant A/B/C Tidak Berfungsi Sama Sekali

**File:** `src/core/renderer/SchemaRenderer.tsx` baris 251

`variant` tersimpan di `block.variant` dalam schema, tapi renderer mengabaikannya sepenuhnya:

```typescript
// SchemaRenderer.tsx baris 251 — BERMASALAH
const isCompact = mode === 'canvas';
// block.variant tidak dibaca di sini — hanya mode yang menentukan density
```

Akibatnya:
- Di mode `canvas`: semua block selalu compact, terlepas dari variant yang dipilih
- Di mode `preview/export`: semua block selalu full, terlepas dari variant
- Fitur variant ada di data tapi **zero effect** di tampilan

**Fix:** Ganti `isCompact` dengan `density`:

```typescript
// SchemaRenderer.tsx — seharusnya
const variant = block.variant ?? 'A';
const isCanvasMode = mode === 'canvas';

const density: 'normal' | 'compact' | 'minimal' =
  variant === 'C' ? 'minimal' :
  variant === 'B' ? 'compact' :
  isCanvasMode    ? 'compact' : 'normal';

// Pass density ke BlockComponent, bukan isCompact boolean
```

---

## P1 — Tinggi: Bug Logic dan Data

### 4. `hero` Template Hanya Alias ke `deriveCover()`

**File:** `src/core/schema/derive-schema.ts`

```typescript
case 'hero':
  blocks.push(deriveCover(ctx, idMap)); // Hero ≈ Cover layout ← SALAH
  break;
```

Masalah yang ditimbulkan:
1. Block type yang dihasilkan adalah `cover`, bukan `hero`
2. Renderer mungkin tidak punya style khusus untuk block type `hero`
3. `BlockDefinitionRegistry` mungkin tidak punya registrasi untuk `hero` → fallback ke unknown block
4. User memilih template "Hero (Banner dengan gradient)" tapi melihat tampilan Cover

**Fix:** Buat `deriveHero()` terpisah dengan block type dan layout berbeda.

---

### 5. ID Collision di `deriveMateri()` — blockIdx Tidak Konsisten

**File:** `src/core/schema/derive-schema.ts`

```typescript
function deriveMateri(ctx, idMap) {
  let blockIdx = 0;

  for (const blok of bloks) {
    const id = getBlockId(idMap, 'def-box', blockIdx); // ← dikalkulasi SEBELUM switch

    switch (blok.tipe) {
      case 'definisi':
        blocks.push({ type: 'def-box', id });
        blockIdx++; // ✓ increment
        break;

      case 'teks':
      case 'gambar':
      default:
        blocks.push({ type: 'def-box', id }); // ← id SAMA dengan iterasi sebelumnya
        blockIdx++;                             // ← increment tapi id sudah terlanjur salah
        break;
    }
  }
}
```

Jika ada blok `definisi` diikuti blok `teks`, keduanya menghasilkan `def-box` dengan ID yang sama karena `id` dikalkulasi sebelum `switch` menggunakan `blockIdx` lama.

**Fix:** Pindahkan kalkulasi `id` ke dalam setiap `case`:

```typescript
case 'definisi':
  const id = getBlockId(idMap, 'def-box', blockIdx++); // increment inline
  blocks.push({ type: 'def-box', id, ... });
  break;
```

---

### 6. `closePlay()` Tidak Reset `interactivePageIdx`

**File:** `src/store/interactive-store.ts`

```typescript
closePlay: () => set({ mode: 'design' }),
// ↑ interactivePageIdx TETAP pada nilai terakhir saat Play ditutup
```

Akibatnya: user menutup Play saat di halaman 7, buka Play lagi → mulai dari halaman 7, bukan halaman 1. `openPlay(0)` memang dipanggil dengan `startIdx = 0`, tapi `interactivePageIdx` yang stale bisa menyebabkan inconsistency sebelum `set()` baru diproses.

**Fix:**
```typescript
closePlay: () => set({ mode: 'design', interactivePageIdx: 0 }),
```

---

### 7. `goPage()` Dipanggil Ganda Saat Navigasi Play

**File:** `src/components/canva/PlayOverlay.tsx`

```typescript
// PlayCanvas — handleNext()
const handleNext = useCallback(() => {
  nextInteractivePage();  // ← sudah memanggil goPage() di dalam store
  const afterIdx = useInteractiveStore.getState().interactivePageIdx;
  goPage(afterIdx);       // ← GANDA — double state update
}, [...]);
```

Setiap navigasi di Play mode men-trigger dua state update ke `canvaStore.currentPageIndex`. Tidak crash, tapi menyebabkan animasi transisi halaman di-trigger dua kali dan potensi flicker.

**Fix:** Hapus pemanggilan `goPage()` dari `handleNext/handlePrev` di PlayCanvas — cukup panggil `nextInteractivePage()`.

---

## P2 — Sedang: State Mutation dan Fallback

### 8. `ensurePageSchema()` Mutasi Object In-Place — Zustand Tidak Deteksi

**File:** `src/core/schema/ensure-schema.ts`

```typescript
export function ensurePageSchema(page: CanvaPage): ScreenSchema | null {
  // ...
  page.schema = upgraded; // ← mutasi langsung — ANTI-PATTERN Zustand
  return upgraded;
}
```

Zustand menggunakan referential equality untuk mendeteksi perubahan. Karena `page` object yang sama di-mutasi (bukan di-replace), komponen yang subscribe ke `pages[i].schema` tidak akan re-render setelah lazy migration.

**Fix:** Kembalikan `ScreenSchema` saja, lakukan update immutable di store:

```typescript
// canva-store.ts
const migratedSchema = ensurePageSchema(page);
if (migratedSchema && !page.schema) {
  set(state => ({
    pages: state.pages.map(p =>
      p.id === page.id ? { ...p, schema: migratedSchema } : p
    )
  }));
}
```

---

### 9. `deriveGame()` Fallback ke Kuis Jika Tidak Ada Game Data

**File:** `src/core/schema/derive-schema.ts`

```typescript
function deriveGame(ctx, idMap) {
  const games = (ctx.modules || []).filter(m => GAME_TYPES.includes(m.type));

  if (games.length === 0) {
    return [deriveKuis(ctx, idMap)]; // ← fallback ke kuis — unexpected!
  }
  // ...
}
```

Jika guru membuat halaman "Game" tapi belum mengisi data game di authoring store, canvas menampilkan kuis. Guru tidak mendapat peringatan apapun tentang misconfiguration ini.

**Fix:** Ganti fallback dengan placeholder block:

```typescript
if (games.length === 0) {
  return [{
    type: 'def-box',
    id: getBlockId(idMap, 'def-box', 0),
    borderColor: 'y',
    content: '🎮 Game belum dikonfigurasi. Tambahkan game melalui panel authoring.',
  }];
}
```

---

### 10. SSR Export Template Opsional Tanpa Auto-Fallback

**File:** `src/app/api/export/route.ts`

```typescript
const TEMPLATE_PATH = path.resolve(process.cwd(), 'export-output', 'index.html');

// Jika file ini tidak ada → 500 error untuk semua guru:
// "Export template not found. Run npm run export:build first."
```

Deployment requirement yang tidak jelas dan silent. Developer harus ingat `npm run export:build` sebelum deploy. Client-side fallback sudah ada di `use-vite-export.ts` tapi tidak diaktifkan secara otomatis.

**Fix:**

```typescript
// use-vite-export.ts — exportWithFallback()
const exportWithFallback = async () => {
  try {
    await exportHTML(); // Coba SSR dulu
  } catch (err) {
    if (err.message.includes('template not found') || err.status === 500) {
      await exportClientSide(); // Auto-fallback tanpa user action
    } else {
      throw err;
    }
  }
};
```

---

## P3 — Rendah: Code Quality

### 11. `buildPayload()` Tidak Digunakan di `exportHTML()` dan `previewHTML()`

**File:** `src/lib/use-vite-export.ts`

```typescript
// buildPayload() sudah ada — tapi tidak dipakai:
const buildPayload = useCallback(() => { /* ... */ }, [pages, ratioId]);

// exportHTML() mem-build payload ulang secara manual:
const exportHTML = useCallback(async () => {
  const response = await fetch('/api/export', {
    body: JSON.stringify({
      pages,
      ratioId,
      meta: authStore.meta,      // ← copy-paste dari buildPayload
      allKuis: authStore.kuis,   // ← duplikat
      // ...
    })
  });
}, [pages, ratioId]);

// previewHTML() juga copy-paste payload yang sama — tiga tempat mendefinisikan
// payload identik. Jika ada field baru, harus update di 3 tempat.
```

**Fix:** Refactor semua fungsi export untuk menggunakan `buildPayload()`.

---

### 12. Preset Label Hardcoded di LeftPanel — Duplikat dengan Registry

**File:** `src/components/canva/left-panel/LeftPanel.tsx`

```typescript
// Hardcoded — tidak membaca dari PagePresetRegistry:
const presetInfo = {
  'hakikat-norma': { label: 'Hakikat Norma', desc: 'PPKn Kelas VII' },
  'macam-norma':   { label: 'Macam-Macam Norma', desc: 'PPKn Kelas VII' },
};

// Padahal PagePresetRegistry sudah punya metadata lengkap:
const preset = getPreset(presetId); // label, description, icon, color, tags
```

**Fix:** Hapus `presetInfo` object, baca langsung dari `getPreset(presetId)`.

---

## Analisis Per Komponen

### `deriveSchema.ts` — Penilaian: ⭐⭐⭐⚡ (3.5/5)

| Aspek | Status | Catatan |
|-------|--------|---------|
| Arsitektur one-way | ✅ Solid | Pure function, no side effects |
| ID stability | ✅ Solid | buildIdMap() + nanoid(10) |
| Cover handler | ✅ Benar | |
| Hero handler | ❌ Bug | Alias ke Cover, block type salah |
| Materi handler | ⚠️ Bug | ID collision, gambar fallback ke text |
| Game handler | ⚠️ Gap | Fallback ke kuis tanpa warning |
| Kuis handler | ✅ Benar | |
| Sync mechanism | ❌ Missing | Tidak ada re-derive saat authoring berubah |

### `PagePresetRegistry.ts` — Penilaian: ⭐⭐⭐⭐ (4/5)

| Aspek | Status | Catatan |
|-------|--------|---------|
| Metadata-driven | ✅ Solid | Semua preset dari PRESET_DEFINITIONS array |
| Factory create() | ✅ Clean | Langsung pakai deriveSchema() |
| Search API | ✅ Ada | searchPresets() dengan tag support |
| Hero preset | ⚠️ Gap | Icon/desc bagus, tapi create() salah (alias cover) |
| estimatedHeight | ❌ Missing | Belum ada field untuk kapasitas meter |
| Variant metadata | ❌ Missing | Variants masih string, belum objek deskriptif |

### `PageRenderer.tsx` — Penilaian: ⭐⭐⭐⭐ (4/5)

| Aspek | Status | Catatan |
|-------|--------|---------|
| Schema priority chain | ✅ Benar | page.schema → templateData → TemplateAdapter |
| Mode handling | ✅ Benar | canvas/preview/export jelas berbeda |
| Token resolver | ✅ Ada | Theme override untuk legacy pages |
| Variant passthrough | ❌ Missing | variant tidak di-pass ke SchemaRenderer |

### `SchemaRenderer.tsx` — Penilaian: ⭐⭐⭐ (3/5)

| Aspek | Status | Catatan |
|-------|--------|---------|
| Block rendering | ✅ Benar | BlockComponent per block type |
| Overflow container | ❌ Bug | Tidak ada overflow:hidden pada absolute wrapper |
| Variant reading | ❌ Bug | isCompact = mode === 'canvas', variant diabaikan |
| Absolute positioning | ⚠️ Gap | Koordinat tidak divalidasi sebelum render |

### `PlayOverlay.tsx` + `interactive-store.ts` — Penilaian: ⭐⭐⭐ (3/5)

| Aspek | Status | Catatan |
|-------|--------|---------|
| Animasi transisi | ✅ Solid | Framer Motion dengan direction awareness |
| Score tracking | ✅ Ada | addScore() dengan deduplication |
| Page overview | ✅ Ada | OverviewGrid dengan thumbnail |
| closePlay() reset | ❌ Bug | interactivePageIdx tidak di-reset |
| goPage() ganda | ❌ Bug | Double call per navigasi |
| isPageComplete() | ⚠️ Bug | Hanya cek ada score, bukan semua kuis selesai |
| Conditional nav | ❌ Missing | Tidak ada page locking atau min-score gate |
| Timer per halaman | ❌ Missing | Schema punya field timer tapi tidak diimplementasi |

### Export Pipeline — Penilaian: ⭐⭐⭐ (3/5)

| Aspek | Status | Catatan |
|-------|--------|---------|
| Template caching | ✅ Solid | mtime-based invalidation, no memory leak |
| XSS encoding | ✅ Ada | Escape < > / di JSON injection |
| Size guard | ✅ Ada | 20MB limit dengan error message jelas |
| Schema serialization | ❌ Kritis | Tidak dijamin page.schema masuk ke runtime |
| Auto-fallback | ❌ Missing | 500 jika template tidak ada |
| buildPayload() | ⚠️ Duplikat | Tidak digunakan di exportHTML/previewHTML |
| Pre-flight check | ❌ Missing | Tidak ada validasi sebelum export |

---

## Roadmap Perbaikan

### Fase 1 — 3 hari kerja (P0: Data Integrity)

1. Tambah `syncSchema(pageId?)` action di canva-store dengan Zustand subscribe ke authoring store
2. Pastikan export runtime menggunakan `page.schema` — bukan re-derive dari authoring data
3. Fix `ensurePageSchema()` menjadi immutable — update via store action, bukan mutasi in-place

### Fase 2 — 2 hari kerja (P1: Bug Logic)

1. Buat `deriveHero()` terpisah — jangan alias ke deriveCover()
2. Fix ID collision di `deriveMateri()` — kalkulasi `id` dalam setiap `case`
3. `deriveGame()` fallback ke placeholder, bukan kuis

### Fase 3 — 3 hari kerja (P0: Variant System)

1. Ubah `isCompact` → `density` di SchemaRenderer — baca `block.variant`
2. Update semua BlockComponent (MateriSection, Kuis, DefBox, dll.) untuk support 3 density
3. Tambah `estimatedHeight` per variant di BlockDefinitionRegistry
4. Tambah `PageCapacityMeter` di right panel berdasarkan estimasi tinggi

### Fase 4 — 2 hari kerja (P1-P2: Play + Export)

1. `closePlay()`: tambah `interactivePageIdx: 0`
2. Hapus `goPage()` ganda di PlayCanvas handleNext/Prev
3. Auto-fallback export: client-side otomatis jika SSR template tidak ada
4. Konsolidasi `buildPayload()` — digunakan di semua fungsi export
5. Tambah pre-flight check sebelum export dimulai

**Total estimasi: 10 hari kerja.**

---

## Apa yang Sudah Bagus

- **Arsitektur one-way data flow** sudah didesain dengan tepat dan konsisten
- **ID stability** via `buildIdMap()` + nanoid(10) — solid untuk undo/redo
- **Lazy migration** legacy pages via `ensurePageSchema()` — konsep benar, implementasi perlu diperbaiki
- **Template caching** di export API dengan mtime check — efisien dan bebas memory leak
- **Animasi Play mode** dengan Framer Motion + direction awareness — UX sangat baik
- **Fase komentari** di codebase (FASE 1 → FASE 4) menunjukkan planned migration path yang jelas
- **XSS encoding** di JSON injection export — security awareness yang baik
- **`createDeriveContext()`** sebagai snapshot authoring state — isolasi yang baik dari store coupling

---

*Review ini berdasarkan analisis static kode. Beberapa bug mungkin sudah di-handle di lapisan lain yang tidak termasuk dalam scope review ini.*
