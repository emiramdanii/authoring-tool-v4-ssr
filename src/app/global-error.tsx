// ═══════════════════════════════════════════════════════════════════════
// GLOBAL ERROR BOUNDARY — Catches root-level errors
// ═══════════════════════════════════════════════════════════════════════
// This is the outermost error boundary. It catches errors that
// the route-level error.tsx cannot catch, including errors in
// the root layout itself.
//
// IMPORTANT: This component replaces the ENTIRE root layout,
// so it must include its own <html> and <body> tags.
// It does NOT inherit layout.tsx styles or providers.
//
// Dark mode: Uses inline media query for @media (prefers-color-scheme: dark)
// since we can't rely on CSS variables without the theme provider.
// ═══════════════════════════════════════════════════════════════════════

'use client';

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Attempt emergency save of localStorage data
    try {
      const canvaState = localStorage.getItem('canva-storage');
      const authoringState = localStorage.getItem('authoring-storage');
      if (canvaState || authoringState) {
        sessionStorage.setItem('__emergency_backup', JSON.stringify({
          canva: canvaState,
          authoring: authoringState,
          timestamp: Date.now(),
        }));
      }
    } catch {
      // Cannot access storage — nothing to save
    }

    console.error('[Global Error Boundary]', error.digest, error.message);
  }, [error]);

  return (
    <html lang="id">
      <head>
        <style>{`
          :root {
            --ge-bg: #F5F7FB;
            --ge-surface: #FFFFFF;
            --ge-text: #0F172A;
            --ge-muted: #64748B;
            --ge-faint: #94A3B8;
            --ge-icon-bg: #FEF2F2;
            --ge-icon-stroke: #EF4444;
            --ge-btn-bg: #0F172A;
            --ge-btn-text: #FFFFFF;
            --ge-border: #E2E8F0;
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --ge-bg: #0F172A;
              --ge-surface: #1E293B;
              --ge-text: #F1F5F9;
              --ge-muted: #94A3B8;
              --ge-faint: #64748B;
              --ge-icon-bg: rgba(127,29,29,0.3);
              --ge-icon-stroke: #F87171;
              --ge-btn-bg: #3B82F6;
              --ge-btn-text: #FFFFFF;
              --ge-border: #334155;
            }
          }
        `}</style>
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--ge-bg)',
            padding: '24px',
          }}
        >
          <div style={{ maxWidth: '420px', textAlign: 'center' }}>
            {/* Error icon */}
            <div
              style={{
                width: '72px',
                height: '72px',
                margin: '0 auto 24px',
                borderRadius: '50%',
                backgroundColor: 'var(--ge-icon-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--ge-icon-stroke)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            <h2
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--ge-text)',
                marginBottom: '8px',
              }}
            >
              Aplikasi Mengalami Kesalahan
            </h2>

            <p
              style={{
                fontSize: '14px',
                color: 'var(--ge-muted)',
                lineHeight: '1.6',
                marginBottom: '24px',
              }}
            >
              Maaf, terjadi kesalahan yang tidak terduga. Data Anda telah kami
              simpan secara darurat. Silakan muat ulang halaman.
            </p>

            {error.digest && (
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--ge-faint)',
                  marginBottom: '16px',
                  fontFamily: 'monospace',
                }}
              >
                Error ID: {error.digest}
              </p>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={reset}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'var(--ge-btn-bg)',
                  color: 'var(--ge-btn-text)',
                  fontSize: '14px',
                  fontWeight: 500,
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                }}
              >
                Muat Ulang
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
