# Sprint 3A — Hotspot Image Contract (Pre-Implementation)

**Tanggal:** 2026-06-20
**Status:** FROZEN — kontrak ini harus dipatuhi saat Sprint 3B implementasi
**Sprint:** 8.8A / Sprint 3A — Pre-Hotspot Contract + Roadmap Sync

---

## 1. Tujuan

Membekukan kontrak minimal untuk block `hotspot-image` **sebelum** implementasi
vertical slice (Sprint 3B). Kontrak ini mencegah scope creep, schema drift,
export parity gap, dan security hole saat coding dimulai.

---

## 2. Data Schema

```ts
interface HotspotImageBlock extends BaseBlock {
  type: 'hotspot-image';
  title?: string;
  image: {
    url: string;       // URL gambar — bisa data URL, /uploads/ URL, atau external URL
    alt?: string;      // Alt text untuk a11y — fallback ke title jika kosong
  };
  hotspots: Array<{
    id: string;        // Stable ID (nanoid) untuk keyboard nav + state tracking
    x: number;         // Posisi horizontal dalam percent (0–100)
    y: number;         // Posisi vertikal dalam percent (0–100)
    label: string;     // Label singkat untuk tombol hotspot (e.g. "1", "A", "🔊")
    title?: string;    // Judul kartu penjelasan saat hotspot diklik
    body?: string;     // Body text kartu penjelasan (plain text, NOT HTML)
    icon?: string;     // Emoji icon untuk tombol hotspot
    color?: 'y' | 'c' | 'g' | 'p' | 'o' | 'r';  // Token key untuk warna tombol
  }>;
  accentColor?: string;  // Token key untuk wrapper/bingkai
}
```

### Constraints

- `hotspots` minimal 1, maksimal 8 (STANDAR: maksimal 8 hotspot per gambar)
- `x` dan `y` di-clamp ke 0–100 saat disimpan
- `body` adalah **plain text** — tidak ada HTML, tidak ada `dangerouslySetInnerHTML`
- `image.url` divalidasi: tidak boleh `javascript:` URL
- `image.alt` fallback ke `title` jika kosong (a11y)

---

## 3. UX Guru — Input Posisi Hotspot

### V1: Preset Posisi 3×3 Grid (BUKAN raw X/Y)

Guru memilih dari 9 posisi preset:

```
┌─────────┬─────────┬─────────┐
│ Kiri Atas│ Tengah  │ Kanan   │
│         │  Atas   │  Atas   │
├─────────┼─────────┼─────────┤
│ Kiri    │ Tengah  │ Kanan   │
│ Tengah  │         │  Tengah │
├─────────┼─────────┼─────────┤
│ Kiri    │ Tengah  │ Kanan   │
│ Bawah   │  Bawah  │  Bawah  │
└─────────┴─────────┴─────────┘
```

Setiap posisi memetakan ke `(x, y)` percent:
- Kiri Atas: `(15, 15)`
- Tengah Atas: `(50, 15)`
- Kanan Atas: `(85, 15)`
- Kiri Tengah: `(15, 50)`
- Tengah: `(50, 50)`
- Kanan Tengah: `(85, 50)`
- Kiri Bawah: `(15, 85)`
- Tengah Bawah: `(50, 85)`
- Kanan Bawah: `(85, 85)`

### Rationale

- Raw X/Y numeric input membingungkan guru non-teknis
- 3×3 grid cukup granular untuk kebanyakan gambar pendidikan
- Visual picker (click-on-image) bisa ditambahkan di Sprint 4 kalau perlu
- Preset posisi = tidak butuh new field type di guided editor engine

### Guided Editor Config

```ts
{
  key: 'posisi',
  label: 'Posisi Hotspot',
  type: 'select',
  options: [
    { label: 'Kiri Atas', value: '15,15' },
    { label: 'Tengah Atas', value: '50,15' },
    { label: 'Kanan Atas', value: '85,15' },
    { label: 'Kiri Tengah', value: '15,50' },
    { label: 'Tengah', value: '50,50' },
    { label: 'Kanan Tengah', value: '85,50' },
    { label: 'Kiri Bawah', value: '15,85' },
    { label: 'Tengah Bawah', value: '50,85' },
    { label: 'Kanan Bawah', value: '85,85' },
  ],
}
```

Saat disimpan, value di-parse ke `x` dan `y` number.

---

## 4. Renderer Behavior

- Tampilkan gambar responsif (object-fit: contain)
- Hotspot = tombol kecil bernomor/icon, diposisikan absolute di atas gambar
- Klik hotspot → buka kartu penjelasan (modal/popover)
- Keyboard accessible: Tab untuk navigasi hotspot, Enter/Space untuk buka
- Esc untuk tutup kartu
- Jangan bergantung internet: jika image adalah data URL atau `/uploads/` URL, offline OK
- Jika image URL external gagal load → tampilkan placeholder + alt text

---

## 5. Export Parity

### Keputusan: Export HTML pakai renderer React yang sama (ExportApp → PageRenderer)

- HotspotImageRenderer dirender via PageRenderer mode="export"
- Tidak perlu custom export HTML renderer — parity otomatis via Style Contract
- Gambar diekspor sebagai URL apa adanya:
  - Jika `data:image/...` → embedded di HTML (offline OK)
  - Jika `/uploads/...` → relative URL (butuh folder uploads di deploy)
  - Jika `https://...` → external URL (butuh internet)
- Hotspot interaktif (klik → kartu) tetap jalan di export HTML via vanilla JS

### Export HTML Test

- Export HTML harus menampilkan gambar + hotspot + kartu penjelasan
- Klik hotspot harus membuka kartu
- Esc harus menutup kartu
- Tidak ada crash jika image URL gagal load

---

## 6. Security Locks

| Vector | Mitigation |
|--------|------------|
| `javascript:` URL di image.url | Validasi: reject `javascript:` prefix saat save |
| SVG upload | Sudah diblok di `/api/upload` (Sprint 8.5C-Patch-1) |
| `body` sebagai HTML | `body` adalah plain text — dirender via React text content, BUKAN `dangerouslySetInnerHTML` |
| `alt` text kosong | Fallback ke `title` atau `"Gambar hotspot"` |
| `image.url` external | Tidak ada SSRF risk (URL dirender di client-side `<img>`) |

### Sanitizer Audit (Sprint 8.8A)

Existing `sanitizeHtml()` di `src/core/renderer/blocks/RichText.tsx` sudah:
- Strip `<script>`, `<iframe>`, `<style>`
- Strip `on*` event handlers
- Strip `javascript:` URLs
- Whitelist tag: strong, em, b, i, u, br, span, sub, sup, mark, small

**Hotspot body TIDAK menggunakan sanitizeHtml** — body adalah plain text,
dirender via `{block.body}` (React auto-escapes). Tidak ada `dangerouslySetInnerHTML`
di HotspotImageRenderer.

---

## 7. Registry + AddBlockPanel

### Block Definition Registry

```ts
{
  type: 'hotspot-image',
  displayName: 'Gambar Interaktif',
  personality: 'interactive',
  icon: '📍',
  canAddToPage: (page) => page.templateType !== 'cover',
  createDefault: () => ({
    type: 'hotspot-image',
    title: 'Gambar Interaktif',
    image: { url: '', alt: '' },
    hotspots: [
      { id: nanoid(), x: 50, y: 50, label: '1', title: 'Titik 1', body: '', icon: '📍', color: 'y' },
    ],
    accentColor: 'y',
  }),
}
```

### TEACHER_ADDABLE_BLOCKS

`hotspot-image` ditambahkan ke `TEACHER_ADDABLE_BLOCKS` **hanya setelah**:
1. Guided editor lengkap (posisi preset + label + title + body + icon + color)
2. Renderer berfungsi (gambar + hotspot + kartu)
3. Export parity teruji
4. Security audit lulus

**Sprint 3A: hotspot-image TIDAK ada di TEACHER_ADDABLE_BLOCKS.**
Sprint 3B akan menambahkannya setelah implementasi selesai.

---

## 8. Acceptance Criteria Sprint 3B

Sprint 3B (implementasi) baru boleh dimulai setelah kontrak ini FROZEN.
3B boleh ditutup hanya jika:

1. `HotspotImageBlock` type ada di `src/core/schema/types/blocks.ts`
2. Block definition ada di registry (`SceneRegistry.tsx` atau `BlockDefinitionRegistry`)
3. `createDefault()` menghasilkan block valid dengan 1 hotspot
4. Guided editor ada di `GUIDED_EDITOR_REGISTRY` dengan preset posisi 3×3
5. `HotspotImageRenderer.tsx` berfungsi: gambar + hotspot + kartu + keyboard nav
6. Export parity: ExportApp → PageRenderer mode="export" → HotspotImageRenderer
7. `hotspot-image` ditambahkan ke `TEACHER_ADDABLE_BLOCKS`
8. Security: tidak ada `dangerouslySetInnerHTML` di renderer, body = plain text
9. Security: `javascript:` URL rejected saat save
10. Test: renderer smoke + export parity + guided editor + security
11. tsc 0 errors, normalize 0 sigs, build OK, CI 3/3

---

## 9. Files yang Akan Disentuh di Sprint 3B

```
src/core/schema/types/blocks.ts            — HotspotImageBlock type
src/core/registry/SceneRegistry.tsx         — block definition + personality
src/core/registry/BlockDefinitionRegistry/  — createDefault + metadata
src/core/schema/guided-patch.ts             — GUIDED_EDITOR_REGISTRY entry
src/core/renderer/blocks/HotspotImageRenderer.tsx  — new renderer
src/core/renderer/blocks/index.ts           — export new renderer
src/components/canva/left-panel/AddBlockPanel.tsx  — TEACHER_ADDABLE_BLOCKS
src/__tests__/hotspot-image-*.test.ts       — new tests
```

Estimasi: ~8-10 file (lebih kecil dari estimasi awal 13 file karena
renderer parity otomatis via Style Contract + PageRenderer).

---

## 10. Out of Scope untuk 3A dan 3B

- Visual picker (click-on-image untuk posisi) → Sprint 4
- Drag-and-drop hotspot position → Sprint 4
- Multiple images per block → Sprint 5+
- Audio/video hotspot → Sprint 5+
- Hotspot clustering/auto-layout → Sprint 5+
