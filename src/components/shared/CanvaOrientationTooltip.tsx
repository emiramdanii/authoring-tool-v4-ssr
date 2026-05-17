'use client';

import { useState, useEffect } from 'react';
import { useTeacherMode } from '@/hooks/use-teacher-mode';
import { X, ArrowLeft, ArrowRight, MousePointer2, Sparkles } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════
// CANVA ORIENTATION TOOLTIP — Shows once when teacher enters Canva
// ═══════════════════════════════════════════════════════════════════
// A lightweight onboarding tooltip that appears the first time a
// teacher enters Canva mode in sederhana mode. It explains:
//   1. Left panel = Halaman & Konten
//   2. Center = Area kerja
//   3. Right panel = Properti & AI
//
// Dismissed by clicking X or "Mengerti" button. Stores dismissal
// in localStorage so it only appears once per device.
// ═══════════════════════════════════════════════════════════════════

const CANVA_ORIENTATION_KEY = 'silse_canva_orientation_done';

export function CanvaOrientationTooltip() {
  const { isSederhana } = useTeacherMode();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isSederhana) return;
    // Only show in teacher mode
    let timer: ReturnType<typeof setTimeout> | null = null;
    try {
      const done = localStorage.getItem(CANVA_ORIENTATION_KEY);
      if (done !== '1') {
        // Small delay so the Canva layout has time to render
        timer = setTimeout(() => setVisible(true), 800);
      }
    } catch {
      // localStorage not available, skip
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isSederhana]);

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(CANVA_ORIENTATION_KEY, '1');
    } catch {
      // ignore
    }
  };

  if (!visible || !isSederhana) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] pointer-events-auto" onClick={handleDismiss} />

      {/* Tooltip Card */}
      <div className="relative z-10 w-full max-w-md mx-4 pointer-events-auto page-transition">
        <div className="bg-app-surface border border-app-border/50 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-app-accent/10 px-5 pt-5 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-app-accent/20 flex items-center justify-center">
                  <MousePointer2 size={20} className="text-app-accent" />
                </div>
                <div>
                  <div className="text-xs font-medium text-app-accent/70">
                    Mode Desain Visual
                  </div>
                  <h3 className="text-base font-bold text-app-primary">
                    Selamat Datang di Canva!
                  </h3>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 rounded-lg text-app-muted hover:text-app-primary hover:bg-app-elevated/50 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Content — 3-panel explanation */}
          <div className="px-5 py-4 space-y-3">
            <p className="text-sm text-app-secondary">
              Di sini Anda bisa mengatur tampilan visual media pembelajaran. Berikut 3 bagian utama:
            </p>

            <div className="space-y-2.5">
              {/* Left Panel */}
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/15">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ArrowLeft size={14} className="text-blue-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-blue-400">Panel Kiri</div>
                  <div className="text-[10px] text-app-secondary leading-relaxed">
                    Daftar halaman, tambah konten, dan pilih template
                  </div>
                </div>
              </div>

              {/* Center */}
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MousePointer2 size={14} className="text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-400">Area Kerja (Tengah)</div>
                  <div className="text-[10px] text-app-secondary leading-relaxed">
                    Klik konten untuk memilih, 2x klik untuk edit teks langsung
                  </div>
                </div>
              </div>

              {/* Right Panel */}
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-purple-500/5 border border-purple-500/15">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ArrowRight size={14} className="text-purple-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-purple-400">Panel Kanan</div>
                  <div className="text-[10px] text-app-secondary leading-relaxed">
                    Ubah properti konten (warna, teks, ukuran) dan minta AI bantu
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 pb-5 pt-2 flex items-center justify-between">
            <button
              onClick={handleDismiss}
              className="text-xs text-app-muted hover:text-app-secondary transition-colors"
            >
              Jangan tampilkan lagi
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 bg-gradient-to-br from-app-accent to-app-accent/80 text-app-inverse text-xs font-bold rounded-lg shadow-sm hover:shadow-md hover:-translate-y-px transition-all"
            >
              Mengerti, mulai desain!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
