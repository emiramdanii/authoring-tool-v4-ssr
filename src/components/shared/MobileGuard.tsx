'use client';

// ═══════════════════════════════════════════════════════════════
// MOBILE GUARD — Shows a friendly message on small screens
// ═══════════════════════════════════════════════════════════════
// The Canva editor requires a desktop-sized screen for the best
// experience. On mobile/tablet screens (<768px), this component
// shows a message directing users to use a computer instead.
// Mode mobile untuk siswa will be available in the future.

import { useState, useEffect } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { isEnabled } from '@/config/feature-flags';

export function MobileGuard({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Feature flag guard — after all hooks, before conditional returns
  // When disabled, bypass the guard entirely (pass through children)
  if (!isEnabled('mobileGuard')) return <>{children}</>;

  if (!isMobile) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-gradient-to-b from-sky-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-sky-100 dark:bg-sky-900/50 p-6">
            <span className="material-symbols-outlined h-12 w-12 text-sky-600 dark:text-sky-400" style={ { fontSize: '16px' } }>monitor</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Gunakan Komputer untuk Editor
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Editor MPI memerlukan layar yang lebih luas untuk pengalaman terbaik.
          Silakan buka aplikasi ini di komputer atau laptop Anda.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-500">
          <span className="material-symbols-outlined h-4 w-4" style={ { fontSize: '16px' } }>smartphone</span>
          <span>Mode mobile untuk siswa akan segera hadir</span>
        </div>
      </div>
    </div>
  );
}
