---
Task ID: 7.1
Agent: Super Z (main)
Task: Sprint 7.1 — Durable Save State Machine

Work Log:
- Audited all persistence/save call sites: markClean, markDirty, saveProject, autosave, save status indicator
- Identified 3 critical P0 bugs: markClean before save completes, no revision tracking, no single-flight guard
- Enhanced dirty-store.ts with revision-based state machine (SaveStatus: idle/dirty/saving/saved/error)
- Implemented editRevision/lastSavedRevision/savingRevision tracking
- Fixed use-auto-save.ts: removed markClean before DB save, added single-flight guard, stale completion rejection
- Fixed save-utils.ts: saveAllToStorage() no longer calls markClean()
- Fixed system-slice.ts: saveToStorage() no longer sets dirty:false
- Fixed authoring/index.ts: Bridge only syncs dirty→true (no markClean propagation)
- Fixed persistence-slice.ts: saveToStorage() no longer sets _saveStatus='saved', load paths call resetOnLoad()
- Fixed preset-slice.ts: applyPreset/newProject now mark dirty (not clean)
- Fixed Riwayat.tsx: History restore uses resetOnLoad()
- Fixed use-project-manager.tsx: Reset dirty on load, don't touch dirty on error
- Updated StatusBar.tsx + StatusToast.tsx: Read from saveStatus state machine
- beforeunload unchanged (already only warns, no forced DB save)
- Wrote 24 tests covering all 8 mandatory test cases
- Build passes, all new tests pass, no regressions in existing tests

Stage Summary:
- 12 files changed, 810 insertions, 143 deletions
- Commit: b86105b
- All 8 PASS criteria met:
  1. No markClean before save success ✅
  2. Save failure preserves dirty state ✅
  3. Edit during save not lost ✅
  4. Stale save completion ignored ✅
  5. Only latest revision can become "saved" ✅
  6. Guru sees honest save status ✅
  7. Recovery snapshot preserved on failure ✅
  8. Build and tests pass ✅
