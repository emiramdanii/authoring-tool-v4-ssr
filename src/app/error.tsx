// ═══════════════════════════════════════════════════════════════════════
// ROUTE-LEVEL ERROR BOUNDARY — Next.js App Router
// ═══════════════════════════════════════════════════════════════════════
// Catches errors thrown in Server Components and Client Components
// within the route segment. Shows branded recovery UI instead of
// the default Next.js error page.
//
// IMPORTANT: This must be a Client Component ("use client") because
// Next.js error boundaries need access to reset() and error digest.
// ═══════════════════════════════════════════════════════════════════════

'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to error reporting service
    console.error('[Route Error Boundary]', error.digest, error.message);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] p-6">
      <div className="max-w-md w-full text-center">
        {/* iOS-inspired error illustration */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-500"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Terjadi Kesalahan
        </h2>

        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Maaf, halaman ini mengalami kesalahan. Data Anda tersimpan secara otomatis.
          Silakan coba lagi atau kembali ke halaman utama.
        </p>

        {error.digest && (
          <p className="text-xs text-slate-400 mb-4 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl
              hover:bg-slate-800 active:bg-slate-700
              transition-colors duration-200"
          >
            Coba Lagi
          </button>

          <a
            href="/"
            className="px-5 py-2.5 bg-white text-slate-700 text-sm font-medium rounded-xl
              border border-slate-200 hover:bg-slate-50 active:bg-slate-100
              transition-colors duration-200"
          >
            Ke Beranda
          </a>
        </div>
      </div>
    </div>
  );
}
