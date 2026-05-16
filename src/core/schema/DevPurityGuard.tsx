/**
 * SILSE — Dev Purity Guard Component
 * React component that checks schema purity in development mode.
 * Wrap the app with this to get real-time purity violation alerts.
 *
 * Task #3: Runtime dev-mode guard for DocumentState purity.
 */

'use client';

import React, { useEffect, useState } from 'react';
import type { ScreenSchema } from './types';
import { isDocumentPure, type PurityViolation } from './session-state';

interface DevPurityGuardProps {
  schema: ScreenSchema | null;
  children: React.ReactNode;
}

/**
 * In development mode, monitors schema for purity violations
 * and displays a warning banner if any forbidden runtime fields are detected.
 * In production, this component is a no-op passthrough.
 */
export function DevPurityGuard({ schema, children }: DevPurityGuardProps) {
  const [violations, setViolations] = useState<PurityViolation[]>([]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    if (!schema) {
      setViolations([]);
      return;
    }

    const result = isDocumentPure(schema);
    setViolations(result.violations);

    if (result.violations.length > 0) {
      console.warn(
        `[DevPurityGuard] ${result.violations.length} purity violation(s) detected in schema "${schema.id}"`,
        result.violations
      );
    }
  }, [schema]);

  // In production, just pass through
  if (process.env.NODE_ENV !== 'development') {
    return <>{children}</>;
  }

  return (
    <>
      {violations.length > 0 && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[9999] bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg text-xs max-w-md">
          <div className="font-bold mb-1">
            🚫 {violations.length} Purity Violation(s)
          </div>
          <div className="space-y-0.5 max-h-24 overflow-y-auto">
            {violations.map((v, i) => (
              <div key={i} className="opacity-90">
                <span className="font-mono">{v.blockType}</span> ({v.blockId.slice(0, 6)}…)
                has <span className="font-mono font-bold">{v.fieldName}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setViolations([])}
            className="mt-1 text-[10px] underline opacity-70 hover:opacity-100 bg-transparent border-none cursor-pointer text-white"
          >
            Tutup
          </button>
        </div>
      )}
      {children}
    </>
  );
}
