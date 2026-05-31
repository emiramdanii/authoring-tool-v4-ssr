# Sprint 1 — UI Workspace + Teacher Flow: Laporan Audit Layout Overlap

**Tanggal:** 2026-05-31  
**Status:** **FAIL** — Canvas overlap panel kiri/kanan  
**Prioritas:** **P0** — Workspace tidak bisa dipakai guru  

---

## 1. Metodologi Audit

### Yang Dilakukan
1. ✅ Baca semua file terkait layout workspace
2. ✅ Analisis CSS globals.css untuk rule yang menyebabkan overlap
3. ✅ Analisis z-index, position, width, overflow di setiap komponen
4. ✅ Simulasi layout dengan Playwright (standalone HTML) — **TIDAK OVERLAP saat layout benar**
5. ⚠️ Screenshot app hidup — **GAGAL**: server crash sebelum React hydrate

### Batasan Audit
- **Server Next.js crash setelah 1-2 request** — React tidak sempat hydrate
- Playwright/agent-browser tidak bisa mendapat bounding box dari app yang berjalan
- Bukti overlap berasal dari: (a) laporan user, (b) analisis kode, (c) pola bug yang diketahui

---

## 2. Temuan Utama: Canvas Menutupi Panel

### Bukti dari Laporan User
> "canvas menutup panel kanan kiri"

### Bukti dari Analisis Kode

#### Masalah #1: Toolbar `fixed` + `w-full` (P1)
**File:** `src/components/canva/Toolbar.tsx` baris 176

```tsx
className="fixed top-0 left-0 w-full z-40 flex items-center justify-between ..."
style={{ height: '56px' }}
```

Toolbar menggunakan `position: fixed; left: 0; width: 100vw` yang menutupi **seluruh lebar viewport**, termasuk area di atas panel kiri dan kanan. Meskipun CanvaBuilder punya `pt-16` offset, toolbar tetap menutupi area atas panel.

**Dampak:** Panel kiri/kanan tidak bisa diklik di area 56px teratas.

#### Masalah #2: ResizablePanel defaultSize tidak menjamin layout awal (P0)
**File:** `src/components/canva/CanvaBuilder.tsx` baris 192-245

```tsx
<ResizablePanelGroup orientation="horizontal" className="flex-1 min-h-0">
  <ResizablePanel defaultSize={20} minSize={15} maxSize={30} data-testid="left-panel">
    <LeftPanel />
  </ResizablePanel>
  <ResizableHandle />
  <ResizablePanel defaultSize={55} minSize={30}>
    <div data-testid="canvas-stage" className="flex flex-col h-full relative overflow-hidden ...">
      <Stage />
    </div>
  </ResizablePanel>
  <ResizableHandle />
  <ResizablePanel 
    defaultSize={rightPanelOpen ? 25 : 0}
    minSize={rightPanelOpen ? 18 : 0}
    maxSize={rightPanelOpen ? 35 : 0}
    data-testid="right-panel"
  >
    {rightPanelOpen && <RightPanel />}
  </ResizablePanel>
</ResizablePanelGroup>
```

**Masalah:**
- `defaultSize` hanya dipakai saat **initial mount**. Jika store punya saved sizes, library mengabaikan `defaultSize`
- Jika `rightPanelOpen = false`, total defaultSize = 20 + 55 + 0 = 75 (bukan 100). Library mungkin tidak handle ini dengan benar
- Panel sizes disimpan di `canva-store` — jika data corrupt atau race condition, sizes bisa salah

#### Masalah #3: Stage `w-full` di dalam ResizablePanel (P0)
**File:** `src/components/canva/stage/index.tsx` baris 374-390

```tsx
<div
  ref={canvasAreaRef}
  id="cm-canvas-area"
  className="flex-1 w-full bg-silse-surface-dim canvas-bg overflow-hidden flex items-center justify-center ..."
>
  <div style={{
    transform: `translate(${panX}px, ${panY}px) scale(${effectiveZoom})`,
    transformOrigin: 'center center',
    ...
  }}>
    <div ref={stageWrapRef} id="cm-stage-wrap"
      className="relative overflow-hidden rounded-2xl shadow-2xl border ..."
      style={{ width: ratio!.w, height: ratio!.h }}  // 1280x720!
    >
```

**Masalah:**
- `cm-stage-wrap` punya `width: 1280px` (dari `ratio!.w`)
- Jika `effectiveZoom` > 1 (user zoom in), canvas melebihi container
- Jika `panX`/`panY` bukan 0, canvas bergeser keluar dari area tengah
- Meskipun parent punya `overflow-hidden`, **transform CSS bisa menyebabkan element "melar"** di luar bounding box saat di-inspect

#### Masalah #4: Tidak ada `data-testid` untuk workspace-root (P2)
**File:** `src/components/canva/CanvaBuilder.tsx`

Tidak ada `data-testid="workspace-root"` pada container utama, menyulitkan debugging dan testing.

#### Masalah #5: Server crash → React tidak hydrate → Layout rusak (P0)
**Bukti dari testing:**

```
agent-browser snapshot → "Memuat Media Pembelajaran Interaktif..."
```

App **stuck di loading screen** karena:
1. Server crash setelah 1-2 HTTP request
2. Chunk JavaScript gagal load (`ChunkLoadError`)
3. React tidak sempat render komponen workspace
4. Yang terlihat user: loading screen atau layout setengah-render

**Ini mungkin PENYEBAB UTAMA overlap yang user lihat:**
- Jika React hanya sebagian yang hydrate, ResizablePanelGroup mungkin tidak initialize
- Panel tidak punya width constraint → canvas mengisi seluruh layar
- Panel kiri/kanan tidak render atau render dengan width 0

---

## 3. Hasil Bounding Box Test (Simulasi Layout Benar)

Saya membuat HTML statis yang mensimulasikan layout 3-panel yang benar:

```
left-panel:   x=0,   y=56, width=288,  height=784
canvas-stage: x=288, y=56, width=792,  height=784
right-panel:  x=1080,y=56, width=360,  height=784
```

**Hasil: TIDAK OVERLAP** — saat layout CSS benar, panel tidak bertabrakan.

**Kesimpulan:** Masalah overlap bukan dari desain CSS, tapi dari **runtime failure** (server crash → React tidak render → ResizablePanel tidak initialize → layout hancur).

---

## 4. Checklist Sprint 1 (10 Poin)

| # | Checkpoint | Status | Keterangan |
|---|-----------|--------|------------|
| 1 | Saat app dibuka, guru tahu klik apa? | **PARTIAL** | Loading screen stuck, app tidak render |
| 2 | Ada tombol "Mulai dari Template"? | **PARTIAL** | Ada di CanvasEmptyState + Dashboard, tapi app tidak render |
| 3 | Ada akses "Coba Template" / "Template Testing"? | **FAIL** | Tidak ada alur khusus "Coba Template" |
| 4 | Ada template umum untuk testing flow? | **PARTIAL** | 5 template via CourseTemplateRegistry, tapi wizard 4-step terlalu kompleks |
| 5 | Setiap template punya tombol Preview? | **FAIL** | Template di wizard tidak punya tombol Preview |
| 6 | Setiap template punya tombol Gunakan Template? | **PARTIAL** | Wizard punya "Buat Project" tapi bukan "Gunakan Template" |
| 7 | Preview template tanpa membuat project? | **FAIL** | Harus buat project dulu, tidak bisa preview sebelum commit |
| 8 | Gunakan Template langsung masuk Canvas Workspace? | **PARTIAL** | Setelah buat, navigasi ke canva via `panelRequest` |
| 9 | Workspace jelas: kiri=daftar halaman, tengah=canvas, kanan=edit? | **FAIL** | Canvas menutupi panel kiri/kanan |
| 10 | Canvas tidak menutupi panel kiri dan kanan? | **FAIL** | P0 — canvas overlap panel |

---

## 5. Daftar Issue

### P0 — Blocking
1. **Server crash setelah 1-2 request** → React tidak hydrate → layout rusak
   - File: `src/lib/db.ts` (Prisma proxy), `src/middleware.ts` (SANDBOX_MODE)
   - Fix: Stabilkan server agar bisa handle minimal 10 request berturut-turut

2. **Canvas overlap panel kiri/kanan** → Guru tidak bisa klik panel
   - File: `src/components/canva/CanvaBuilder.tsx`
   - Root cause: Jika ResizablePanelGroup gagal initialize (karena server crash), panel tidak punya width
   - Fix: Tambahkan CSS fallback jika ResizablePanelGroup gagal, atau gunakan CSS Grid sebagai fallback

### P1 — Important
3. **Toolbar `fixed w-full` menutupi area atas panel**
   - File: `src/components/canva/Toolbar.tsx` baris 176
   - Fix: Toolbar harus tahu lebar workspace, bukan full viewport

4. **Template tidak bisa di-preview sebelum commit**
   - File: `src/components/canva/TemplateWizard.tsx`
   - Fix: Tambahkan tombol "Preview" di step 3 (Pilih Template)

5. **Tidak ada alur "Coba Template" yang jelas**
   - Dashboard punya banyak pilihan, tapi tidak ada "Coba Template" yang prominent
   - Fix: Tambahkan CTA "Mulai dari Template" di Dashboard

### P2 — Nice to have
6. **Tidak ada `data-testid` untuk workspace-root**
   - Fix: Tambahkan `data-testid="workspace-root"` di CanvaBuilder

7. **Default sizes 20+55+0=75 bukan 100** saat right panel closed
   - Fix: Sesuaikan defaultSize saat rightPanelOpen=false

---

## 6. Fix Minimal yang Disarankan

### Fix 1: CSS Grid Fallback untuk Workspace Layout (P0)

```tsx
// CanvaBuilder.tsx — Edit mode
<div 
  data-testid="workspace-root"
  className="flex-1 w-full min-w-0 flex flex-col overflow-hidden"
  style={{
    display: 'grid',
    gridTemplateColumns: rightPanelOpen 
      ? 'minmax(220px, 20%) minmax(0, 1fr) minmax(260px, 25%)'
      : 'minmax(220px, 20%) minmax(0, 1fr)',
    gridTemplateRows: '1fr',
  }}
>
  <div data-testid="left-panel" style={{ gridColumn: 1, position: 'relative', zIndex: 20 }}>
    <LeftPanel />
  </div>
  <div data-testid="canvas-stage" style={{ gridColumn: 2, position: 'relative', zIndex: 1, overflow: 'hidden' }}>
    <Stage />
  </div>
  {rightPanelOpen && (
    <div data-testid="right-panel" style={{ gridColumn: 3, position: 'relative', zIndex: 20 }}>
      <RightPanel />
    </div>
  )}
</div>
```

### Fix 2: Toolbar Constraint (P1)

Toolbar harus dibatasi ke area workspace, bukan full viewport:

```tsx
// Toolbar.tsx — ganti fixed dengan absolute di dalam workspace container
className="absolute top-0 left-0 right-0 z-40 ..."
// Atau simpan lebar workspace di store dan batasi width toolbar
```

### Fix 3: Tambahkan data-testid (P2)

```tsx
// CanvaBuilder.tsx
<div data-testid="workspace-root" ...>
```

---

## 7. Sprint 1 PASS Criteria Check

| Kriteria | Status |
|----------|--------|
| 1. App bisa dibuka tanpa crash | ❌ Server crash |
| 2. Guru bisa lihat Beranda/Dashboard | ⚠️ Loading screen stuck |
| 3. Ada tombol "Mulai dari Template" | ✅ Ada (tapi app tidak render) |
| 4. Template bisa dipilih | ✅ Ada 5 template |
| 5. Template bisa di-preview | ❌ Tidak ada Preview |
| 6. "Gunakan Template" masuk Canvas | ⚠️ Ada, tapi navigasi terlalu banyak step |
| 7. Panel kiri terlihat & bisa diklik | ❌ Canvas overlap |
| 8. Panel kanan terlihat & bisa diklik | ❌ Canvas overlap |

**Sprint 1 Status: FAIL**

---

## 8. Catatan Penting

1. **Server stability adalah blocker utama.** Tanpa server yang stabil, React tidak bisa hydrate, dan layout apapun tidak akan terlihat benar.
2. **Overlap kemungkinan besar disebabkan oleh React hydration failure**, bukan desain CSS. Layout yang disimulasikan dengan CSS yang benar TIDAK overlap.
3. **Fix harus dimulai dari server stability**, baru kemudian layout workspace.
4. **Bounding box test harus dilakukan manual** oleh user setelah server stabil, karena AI tidak bisa menjalankan browser yang terhubung ke server lokal di environment ini.
