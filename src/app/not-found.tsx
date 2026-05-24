// ═══════════════════════════════════════════════════════════════════════
// CUSTOM 404 PAGE — Branded not-found experience
// ═══════════════════════════════════════════════════════════════════════
// Shown when no route matches the requested URL.
// Uses the iOS visual contract with full dark mode support.
// ═══════════════════════════════════════════════════════════════════════

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 — Halaman Tidak Ditemukan',
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center">
        {/* 404 illustration */}
        <div className="mb-8">
          <div className="text-8xl font-bold text-muted-foreground/20 select-none">
            404
          </div>
          <div className="mt-2 w-16 h-1 mx-auto rounded-full bg-muted-foreground/30" />
        </div>

        <h1 className="text-xl font-semibold text-foreground mb-2">
          Halaman Tidak Ditemukan
        </h1>

        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          Maaf, halaman yang Anda cari tidak tersedia. Mungkin halaman telah
          dipindahkan atau URL yang Anda masukkan salah.
        </p>

        <div className="flex gap-3 justify-center">
          <a
            href="/"
            className="px-6 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-xl
              hover:bg-primary/90 active:bg-primary/80
              transition-colors duration-200
              shadow-[0_1px_3px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)]"
          >
            Ke Beranda
          </a>

          <button
            onClick={() => window.history.back()}
            className="px-6 py-2.5 bg-card text-card-foreground text-sm font-medium rounded-xl
              border border-border hover:bg-accent active:bg-accent/80
              transition-colors duration-200"
          >
            Kembali
          </button>
        </div>
      </div>
    </div>
  );
}
