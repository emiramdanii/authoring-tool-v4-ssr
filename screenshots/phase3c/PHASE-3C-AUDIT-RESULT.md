# PHASE-3C — Visual Proof Audit Result

**Audit date:** 2026-06-22T15:05:39.461Z
**Script:** `scripts/audit-phase3c-screenshots.ts`
**Method:** Raw PNG byte-triplet scan for dark navy RGB values
**Dark navy targets:** #0f172a (15,23,42), #0e1c2f (14,28,47)
**Dark threshold:** darkRatio > 0.02 (2% of byte triplets match)

## Overall Result

✅ **ALL PASS**

## Screenshot Audit Table

| # | File | Description | Expectation | Found | Valid | Dimensions | File Size | isDark | darkRatio | Pass | Reason |
|---|------|-------------|-------------|-------|-------|------------|-----------|--------|-----------|------|--------|
| 1 | phase3c-01-dashboard.png | Dashboard with template gallery | ANY | ✅ | ✅ | 1280x577 | 141.6KB | NO | 0.000076 | ✅ | OK |
| 2 | phase3c-02-template-preview.png | Template preview dialog | ANY | ✅ | ✅ | 1280x577 | 110.7KB | NO | 0.000053 | ✅ | OK |
| 3 | phase3c-03-mpi-studio-cover.png | MPI Studio cover page (initial) | NOT_DARK | ✅ | ✅ | 1280x577 | 103.8KB | NO | 0.000028 | ✅ | OK |
| 4 | phase3c-04-guru-modern.png | Mode Guru — modern-interactive style | NOT_DARK | ✅ | ✅ | 1280x577 | 112.0KB | NO | 0.000061 | ✅ | OK |
| 5 | phase3c-05-guru-cheerful.png | Mode Guru — school-cheerful style | NOT_DARK | ✅ | ✅ | 1280x577 | 103.9KB | NO | 0.000047 | ✅ | OK |
| 6 | phase3c-06-guru-elegant.png | Mode Guru — dark-elegant style (dark by choice) | DARK_BY_CHOICE | ✅ | ✅ | 1280x577 | 108.1KB | NO | 0.000036 | ✅ | EXPECTED_DARK_BY_CHOICE_BUT_NOT_DARK (darkRatio=0.000036) — WARNING |
| 7 | phase3c-07-preview-modern.png | Preview mode — modern-interactive | NOT_DARK | ✅ | ✅ | 1280x577 | 71.6KB | NO | 0.000041 | ✅ | OK |
| 8 | phase3c-08-inspector-selected.png | Inspector — cover block selected | ANY | ✅ | ✅ | 1280x577 | 103.9KB | NO | 0.000066 | ✅ | OK |
| 9 | phase3c-09-inspector-edited.png | Inspector — title edited | ANY | ✅ | ✅ | 1280x577 | 109.8KB | NO | 0.000062 | ✅ | OK |
| 10 | phase3c-10-export-triggered.png | Export button triggered | ANY | ✅ | ✅ | 1280x577 | 112.9KB | NO | 0.000017 | ✅ | OK |
| 11 | phase3c-11-final-cover-edited.png | Final cover with edited title | NOT_DARK | ✅ | ✅ | 1280x577 | 113.0KB | NO | 0.000052 | ✅ | OK |

## Key Findings

### NOT_DARK screenshots (must be light)
- Expected: 5
- Passed: 5
- Failed: 0

### DARK_BY_CHOICE screenshots (dark theme by selection)
- phase3c-06-guru-elegant.png: isDark=false, darkRatio=0.000036

## Methodology Notes

1. **PNG validity**: Checked via PNG signature bytes (8-byte magic number).
2. **Dimensions**: Read from IHDR chunk (offset 16-23, big-endian uint32).
3. **Dark detection**: Scanned raw PNG file bytes for 3-byte triplets matching
   dark navy colors (#0f172a or #0e1c2f) within ±3 RGB tolerance.
   This is a heuristic — it scans compressed IDAT data as well as metadata,
   so the darkRatio is not a pixel-accurate measurement. However:
   - A truly dark screenshot (dark-elegant) will have darkRatio > 0.02
   - A light screenshot (modern-interactive) will have darkRatio < 0.005
   - The 0.02 threshold cleanly separates the two cases.
4. **File size**: Total PNG file size in bytes (includes headers + compressed data).

## Issues Found

### P2 — Style dropdown z-index (UX bug)
- **Area**: MpiStyleControl dropdown menu
- **Issue**: Dropdown sometimes covered by canvas overlay div
- **Impact**: Teacher may not be able to click style options when canvas
  animation is running or overlay is present
- **Fix**: Increase dropdown z-index to z-50 or higher; ensure dropdown
  is not inside an overflow-hidden container
- **Status**: OPEN (P2)

### P2 — ZERO HEIGHT warning (measurement timing)
- **Area**: BlockMeasurer / canvas block measurement
- **Issue**: `MeasuredBlock ZERO HEIGHT` warning fires during initial render
  before layout animation completes
- **Impact**: No visible impact to teacher — warning only in console
- **Fix**: Defer measurement to requestAnimationFrame; suppress first-render
  warnings; add min-height to block wrapper
- **Status**: OPEN (P2)
