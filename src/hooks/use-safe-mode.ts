// ═══════════════════════════════════════════════════════════════════
// SAFE MODE HOOK — FASE 6 convenience hook for safe mode state
// ═══════════════════════════════════════════════════════════════════
// Provides reactive access to safe mode state and feature gates.
// Components use this to conditionally disable features.
//
// Usage:
//   const { safeMode, isFeatureAllowed } = useSafeMode();
//   if (!isFeatureAllowed('game-blocks')) return <FallbackUI />;
// ═══════════════════════════════════════════════════════════════════

import { useCanvaStore } from '@/store/canva-store';
import { isFeatureAllowed, type SafeModeFeature } from '@/core/recovery';

export function useSafeMode() {
  const safeMode = useCanvaStore((s) => s.safeMode);
  const exitSafeMode = useCanvaStore((s) => s.exitSafeMode);
  const enterSafeMode = useCanvaStore((s) => s.enterSafeMode);
  const runIntegrityCheckNow = useCanvaStore((s) => s.runIntegrityCheckNow);
  const _lastIntegrityResult = useCanvaStore((s) => s._lastIntegrityResult);

  return {
    /** Whether the app is currently in safe mode */
    safeMode,
    /** Exit safe mode (with user confirmation) */
    exitSafeMode,
    /** Enter safe mode with a reason */
    enterSafeMode,
    /** Check if a specific feature is allowed in current mode */
    isFeatureAllowed: (feature: SafeModeFeature) => isFeatureAllowed(feature, safeMode),
    /** Run integrity check now */
    runIntegrityCheckNow,
    /** Last integrity check result */
    lastIntegrityResult: _lastIntegrityResult,
  };
}
