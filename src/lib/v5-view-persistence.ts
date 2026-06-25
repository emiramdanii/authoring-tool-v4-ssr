// ═══════════════════════════════════════════════════════════════
// V5 View Persistence Helper
// ═══════════════════════════════════════════════════════════════
// BATCH-06B: Persist/restore last V5 view with safe fallback.
//
// Design constraints (senior audit):
//   - Restore only safe views: dashboard / template / editor / preview / export
//   - If view invalid → fallback to dashboard
//   - If view is editor/preview/export but pages empty → fallback to dashboard
//     (teacher just landed on app with no project loaded — shouldn't drop
//     them into an editor that has nothing to show)
//   - NEVER restore a legacy route (no reference to legacy editor names)
//   - Storage key: 'silse_v5_last_view'
//   - Storage is best-effort: if localStorage unavailable (private mode,
//     SSR), restore returns 'dashboard' (safe default)
//
// Why sessionStorage alternative was NOT chosen: teacher expects "refresh
// on editor keeps me in editor" — sessionStorage would survive refresh
// but not new tab, which is the correct mental model for "last view
// in this browser context". localStorage is also fine — it persists
// across sessions which is what teachers actually want.
// ═══════════════════════════════════════════════════════════════

import type { ProductView } from '@/components/product-v5/ProductShell';

const STORAGE_KEY = 'silse_v5_last_view';

/** All views that may be persisted/restored. Anything else is invalid. */
const SAFE_VIEWS: readonly ProductView[] = [
  'dashboard',
  'template',
  'editor',
  'preview',
  'export',
] as const;

/** Views that require a non-empty pages array to be valid. */
const VIEWS_REQUIRING_PAGES: readonly ProductView[] = [
  'editor',
  'preview',
  'export',
] as const;

function isProductView(value: unknown): value is ProductView {
  return typeof value === 'string' && (SAFE_VIEWS as readonly string[]).includes(value);
}

/**
 * Check if localStorage is available. Returns false in:
 *   - SSR (no window)
 *   - Private mode (throws on setItem)
 *   - Cookies disabled
 */
function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const testKey = '__silse_v5_view_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Persist the current view to localStorage. Best-effort: silently
 * ignores failures (private mode, quota exceeded, SSR).
 *
 * Only persists views in SAFE_VIEWS — never persists legacy/invalid
 * view names, so even if a future bug tries to persist 'lengkap' or
 * some legacy editor name, this function will refuse to write it.
 */
export function persistLastView(view: ProductView): void {
  if (!isProductView(view)) return;
  if (!isLocalStorageAvailable()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, view);
  } catch {
    // Silently ignore — view persistence is a UX nicety, not a contract.
  }
}

/**
 * Restore the last view from localStorage with safe fallback.
 *
 * Decision matrix:
 *   - localStorage unavailable → 'dashboard'
 *   - no stored value → 'dashboard'
 *   - stored value not a valid ProductView → 'dashboard' (+ clear bad value)
 *   - stored value is editor/preview/export but pagesCount === 0 → 'dashboard'
 *   - stored value is dashboard/template → return as-is (always safe)
 *
 * @param pagesCount current page count from canvaStore
 * @returns the view to restore to (always a valid ProductView)
 */
export function restoreLastView(pagesCount: number): ProductView {
  if (!isLocalStorageAvailable()) return 'dashboard';

  let stored: string | null;
  try {
    stored = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return 'dashboard';
  }

  if (stored === null) return 'dashboard';

  // Validate against safe view set — reject any unknown string
  if (!isProductView(stored)) {
    // Clear bad value so it doesn't keep failing every boot
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    return 'dashboard';
  }

  // Stored value is a valid ProductView. Now check pages requirement.
  const requiresPages = (VIEWS_REQUIRING_PAGES as readonly string[]).includes(stored);
  if (requiresPages && pagesCount === 0) {
    // Teacher had editor/preview/export open last, but now has no pages
    // (fresh boot, cleared localStorage, different browser). Don't drop
    // them into an editor with no content — fall back to dashboard.
    return 'dashboard';
  }

  return stored;
}

/**
 * Clear the stored last view. Used when teacher explicitly navigates
 * to dashboard (so a refresh there stays on dashboard, not bounces
 * back to last editor). Optional behavior — currently we DO persist
 * dashboard too, so this is mostly for tests.
 */
export function clearLastView(): void {
  if (!isLocalStorageAvailable()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ── Test-only helpers (exported for unit tests) ────────────────────

export const __TEST__ = {
  STORAGE_KEY,
  SAFE_VIEWS,
  VIEWS_REQUIRING_PAGES,
  isProductView,
  isLocalStorageAvailable,
};
