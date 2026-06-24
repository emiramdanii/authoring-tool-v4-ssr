# MODE LIFECYCLE CONTRACT

> Sprint 8.2S-1 — Design Doc + Smoke Test (IMPLEMENTASI: Sprint 8.2S-2)
>
> Status: DESIGN — smoke test akan diimplementasikan di 8.2S-2
>
> Tujuan: definisikan transisi yang sah antar mode, state yang
> dipertahankan, dan state yang di-reset. Cegah bug "selection bocor
> ke Preview", "score lama muncul", "editing state tertinggal".

## Mode Aplikasi

```text
edit      — Teacher editing canvas (full chrome, selection, drag, nudge)
preview   — Quick student view (no editing chrome, no overlays)
present   — Fullscreen playback (PlayOverlay, interactive widgets)
export    — Export pipeline (no UI chrome, HTML/PDF generation)
learn     — Student learning mode (screen-by-screen, progress, score)
```

Setter canonical: `useCanvaStore.setAppMode(mode)` di `src/store/canva/session-slice.ts`.

## Transisi yang Sah

| Dari    | Ke      | State yang DIPERTAHANKAN | State yang DI-RESET |
|---------|---------|--------------------------|---------------------|
| Edit    | Preview | page, style, document    | selection, editing  |
| Edit    | Present | page, style, document    | selection, editing, fullscreen state |
| Edit    | Learn   | page, style, document    | selection, editing  |
| Edit    | Export  | document                 | selection, editing  |
| Preview | Edit    | page index               | runtime score, navigation history |
| Preview | Present | document, page index     | fullscreen state    |
| Preview | Learn   | document                 | session progress, runtime score |
| Present | Edit    | authoring data           | fullscreen, runtime score, timer |
| Present | Preview | document                 | fullscreen, runtime score |
| Learn   | Edit    | authoring data           | session progress, runtime score, learnSubMode |
| Learn   | Preview | document                 | session progress, learnSubMode |
| Export  | Edit    | document                 | export temp state, file handles |

## Invariant per Mode

### Edit (`appMode: 'edit'`)
- `selectedBlockId`, `selectedBlockIds`, `hoveredBlockId`, `editingBlockId` boleh terisi
- `interactive-store.scores` HARUS kosong
- `learning-media-store.learnSubMode` HARUS `'play'` (default)
- Page index: any

### Preview (`appMode: 'preview'`)
- `selectedBlockId` HARUS null
- `selectedBlockIds` HARUS []
- `hoveredBlockId` HARUS null
- `editingBlockId` HARUS null
- `interactive-store.scores` boleh terisi (kuis dapat dimainkan di preview)
- Page index: any

### Present (`appMode: 'present'`)
- Semua invariant Preview berlaku
- `interactive-store.scores` HARUS kosong saat MASUK (reset); boleh terisi saat dimainkan
- Fullscreen API aktif
- Keyboard shortcuts khusus present aktif (arrow keys untuk navigasi)

### Learn (`appMode: 'learn'`)
- Semua invariant Preview berlaku
- `learning-media-store.learnSubMode` boleh `'play'` atau `'edit'`
- Saat MASUK Learn: `learnSubMode` reset ke `'play'` (kecuali user eksplisit set)
- `interactive-store.scores` boleh terisi (progress belajar siswa)

### Export (`appMode: 'export'`)
- Semua invariant Preview berlaku
- Tidak ada UI chrome
- Tidak ada keyboard listener dari mode lain
- File generation pipeline aktif

## Bug Diketahui (lihat `KNOWN_ISSUES.md`)

### M-001 — `setAppMode` tidak reset interactive store scores
- Saat switch dari Preview (dengan score) → Edit → Preview lagi, score lama mungkin masih terlihat sesaat.
- **Fix plan**: `setAppMode` harus panggil `useInteractiveStore.getState().resetAll()` saat switch ke mode non-preview/non-learn.
- **Atau**: hapus score saat MASUK mode edit/export, biarkan saat preview/present/learn.

### M-002 — `setAppMode` tidak reset `learnSubMode`
- Saat switch dari Learn (sub-mode 'edit') → Edit → Learn lagi, sub-mode mungkin masih 'edit'.
- **Fix plan**: `setAppMode('learn')` harus reset `learnSubMode` ke `'play'` (kecuali user eksplisit set).

### M-003 — Keyboard listener cleanup belum diaudit
- `PreviewMode`, `PresentMode`, `LearningMediaShell` register `window.addEventListener('keydown', ...)`.
- Bila cleanup (`removeEventListener`) tidak konsisten, listener bocor dapat menyebabkan double-trigger setelah mode switch cepat.
- **Fix plan**: audit semua `useEffect` yang register listener. Pastikan cleanup function benar.

## Test Plan (8.2S-2)

```ts
describe('Mode Lifecycle Smoke', () => {
  // Invariant per mode
  it('Edit → Preview: selection cleared', () => {})
  it('Edit → Present: selection + score cleared', () => {})
  it('Edit → Learn: selection cleared, learnSubMode reset to play', () => {})
  it('Edit → Export: selection cleared, no UI chrome', () => {})

  // Round-trip
  it('Edit → Preview → Edit: page index preserved, no selection leak', () => {})
  it('Edit → Learn → Edit: no score leak, no learnSubMode leak', () => {})
  it('Preview → Present → Preview: fullscreen cleaned up', () => {})

  // Edge cases
  it('Mode switch during save: save completes, mode switch deferred', () => {})
  it('Rapid mode switch (5x in 100ms): no race condition', () => {})
  it('Mode switch during inline edit: edit saved before switch', () => {})

  // Cleanup
  it('Keyboard listener removed on mode exit', () => {})
  it('Timer cleared on mode exit', () => {})
  it('Observer disconnected on mode exit', () => {})
})
```

## Aturan Implementasi

1. `setAppMode` adalah satu-satunya cara canonical untuk switch mode.
2. Semua mode-specific state disimpan di store yang sesuai (`useCanvaStore`, `useInteractiveStore`, `useLearningMediaStore`).
3. Jangan simpan mode-specific state di component local state (kecuali ephemeral UI like dropdown).
4. `useEffect` cleanup WAJIB untuk semua listener/observer/timer.
5. Mode switch tidak boleh memicu save loop — bila ada perubahan state karena mode switch, jangan set `dirty: true`.

## Status Implementasi

```text
Sprint 8.2S-1: DESIGN doc (ini) + bug identification
Sprint 8.2S-2: smoke test + fix M-001, M-002, M-003
Sprint 8.2B:   Present wiring ikut kontrak ini
Sprint 8.2C:   Export wiring ikut kontrak ini
```

## Referensi

- `KNOWN_ISSUES.md` M-001, M-002, M-003
- `src/store/canva/session-slice.ts` `setAppMode` (existing impl, perlu extend)
- `src/store/interactive-store.ts` `openPlay`/`closePlay`/`resetAll` (existing)
- `src/store/learning-media-store.ts` `learnSubMode` (existing)
- `src/components/canva/PreviewMode.tsx`
- `src/components/canva/PresentMode.tsx`
- `src/components/canva/PlayOverlay.tsx`
- `src/components/canva/LearningMediaShell.tsx`
