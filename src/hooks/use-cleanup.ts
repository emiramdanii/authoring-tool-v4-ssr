'use client';

import { useEffect, useRef } from 'react';
import { logger } from '@/core/utils/logger';

// ═══════════════════════════════════════════════════════════════
// USE CLEANUP — Hook for registering cleanup functions on unmount
// ═══════════════════════════════════════════════════════════════
// [G.4] Registers cleanup functions that run on unmount.
// Prevents memory leaks from subscriptions, timers, and event listeners.
//
// Usage:
//   const { register } = useCleanup();
//   const unsub = store.subscribe(...);
//   register(unsub);
//   register(() => clearInterval(timer));
// ═══════════════════════════════════════════════════════════════

export function useCleanup() {
  const cleanupFns = useRef<(() => void)[]>([]);

  const register = (fn: () => void) => {
    cleanupFns.current.push(fn);
  };

  useEffect(() => {
    return () => {
      cleanupFns.current.forEach(fn => {
        try { fn(); } catch (e) { logger.error('G.4', 'Cleanup error: ' + String(e)); }
      });
      cleanupFns.current = [];
    };
  }, []);

  return { register };
}
