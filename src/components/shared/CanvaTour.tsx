'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ChevronLeft, Sparkles, MousePointer, Layers, Play, Settings2, LifeBuoy } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// CanvaTour — Step-by-step guided tour overlay for the Canva editor
//
// Features:
//   - Spotlight effect: darken page except the highlighted element
//   - Tooltip bubble with title, description, step indicator, navigation
//   - Smooth transitions between steps (fade + slide)
//   - Auto-scroll to target element if off-screen
//   - Auto-position tooltip based on preferred position
//   - Close with Skip or X button
//   - Remember completion in localStorage (`canva_tour_done`)
//   - Auto-start on first visit (when localStorage key is null)
//   - Re-trigger from Help button or keyboard shortcut (?)
// ═══════════════════════════════════════════════════════════════

const STORAGE_KEY = 'canva_tour_done';

interface TourStep {
  targetSelector: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon?: React.ReactNode;
}

const TOUR_STEPS: TourStep[] = [
  {
    targetSelector: '[data-tour="toolbar"]',
    title: 'Toolbar Editor',
    description: 'Ini adalah toolbar utama. Di sini Anda bisa mempreview, undo/redo, mengatur zoom, dan mengexport hasil karya Anda.',
    position: 'bottom',
    icon: <Settings2 className="h-5 w-5" />,
  },
  {
    targetSelector: '[data-tour="play-button"]',
    title: 'Preview Media',
    description: 'Klik tombol hijau ini untuk melihat tampilan media pembelajaran Anda seperti yang akan dilihat siswa. Ini adalah tombol yang paling sering digunakan!',
    position: 'bottom',
    icon: <Play className="h-5 w-5" />,
  },
  {
    targetSelector: '[data-tour="left-panel"]',
    title: 'Panel Halaman & Block',
    description: 'Panel kiri menampilkan daftar halaman dan block. Gunakan tab "Tambah" untuk menambahkan konten baru seperti kuis, game, dan materi.',
    position: 'right',
    icon: <Layers className="h-5 w-5" />,
  },
  {
    targetSelector: '[data-tour="canvas-stage"]',
    title: 'Area Kerja (Canvas)',
    description: 'Ini adalah area utama untuk melihat dan mengedit konten. Klik pada block untuk memilihnya, double-klik untuk mengedit.',
    position: 'center',
    icon: <MousePointer className="h-5 w-5" />,
  },
  {
    targetSelector: '[data-tour="right-panel"]',
    title: 'Panel Properti',
    description: 'Panel kanan menampilkan properti block yang sedang dipilih. Di sini Anda bisa mengubah teks, warna, dan pengaturan lainnya. Ada juga AI Assistant untuk membantu membuat konten!',
    position: 'left',
    icon: <Sparkles className="h-5 w-5" />,
  },
];

interface TooltipPosition {
  top: number;
  left: number;
  adjustedPosition: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

function getTargetRect(selector: string): DOMRect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  return el.getBoundingClientRect();
}

function calculateTooltipPosition(
  targetRect: DOMRect,
  preferredPosition: TourStep['position'],
  tooltipWidth: number,
  tooltipHeight: number
): TooltipPosition {
  const padding = 16;
  const gap = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top = 0;
  let left = 0;
  let adjustedPosition = preferredPosition;

  if (preferredPosition === 'center') {
    top = Math.max(padding, Math.min(vh - tooltipHeight - padding, vh / 2 - tooltipHeight / 2));
    left = Math.max(padding, Math.min(vw - tooltipWidth - padding, vw / 2 - tooltipWidth / 2));
    return { top, left, adjustedPosition };
  }

  const positions: TourStep['position'][] = [preferredPosition];
  if (preferredPosition === 'bottom') positions.push('top', 'right', 'left');
  else if (preferredPosition === 'top') positions.push('bottom', 'right', 'left');
  else if (preferredPosition === 'left') positions.push('right', 'bottom', 'top');
  else if (preferredPosition === 'right') positions.push('left', 'bottom', 'top');

  for (const pos of positions) {
    adjustedPosition = pos;
    switch (pos) {
      case 'bottom':
        top = targetRect.bottom + gap;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'top':
        top = targetRect.top - tooltipHeight - gap;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - gap;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.right + gap;
        break;
    }

    const clampedLeft = Math.max(padding, Math.min(vw - tooltipWidth - padding, left));
    const clampedTop = Math.max(padding, Math.min(vh - tooltipHeight - padding, top));

    if (clampedTop >= padding && clampedTop + tooltipHeight <= vh - padding &&
        clampedLeft >= padding && clampedLeft + tooltipWidth <= vw - padding) {
      top = clampedTop;
      left = clampedLeft;
      return { top, left, adjustedPosition };
    }
  }

  top = Math.max(padding, vh / 2 - tooltipHeight / 2);
  left = Math.max(padding, vw / 2 - tooltipWidth / 2);
  return { top, left, adjustedPosition: 'center' };
}

// ── Spotlight Overlay SVG: creates a dark overlay with a cutout ──
function SpotlightOverlay({ rect }: { rect: DOMRect | null }) {
  if (!rect) {
    return <div className="absolute inset-0 bg-app-overlay" style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }} />;
  }

  const r = 8;
  const pad = 6;

  const x = rect.left - pad;
  const y = rect.top - pad;
  const w = rect.width + pad * 2;
  const h = rect.height + pad * 2;

  return (
    <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 9998 }}>
      <defs>
        <mask id="tour-spotlight-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <rect x={x} y={y} width={w} height={h} rx={r} ry={r} fill="black" />
        </mask>
      </defs>
      <rect
        x="0" y="0" width="100%" height="100%"
        fill="rgba(0,0,0,0.55)"
        mask="url(#tour-spotlight-mask)"
        style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}
      />
      {/* Glow border around spotlight */}
      <rect
        x={x} y={y} width={w} height={h} rx={r} ry={r}
        fill="none"
        stroke="rgba(251,191,36,0.5)"
        strokeWidth="2"
        style={{ filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.3))' }}
      />
    </svg>
  );
}

// ── Main CanvaTour Component ──────────────────────────────────
// Note: This component is rendered inside CanvaBuilder which is loaded
// with dynamic(() => import(...), { ssr: false }), so we're always
// client-side here. No need for a mounted state guard.
export default function CanvaTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition>({ top: 0, left: 0, adjustedPosition: 'center' });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(false);

  // ── Tour control callbacks (declared before effects that use them) ──
  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsOpen(true);
    isOpenRef.current = true;
  }, []);

  const closeTour = useCallback(() => {
    setIsOpen(false);
    isOpenRef.current = false;
    localStorage.setItem(STORAGE_KEY, '1');
  }, []);

  const skipTour = useCallback(() => {
    closeTour();
  }, [closeTour]);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev < TOUR_STEPS.length - 1) {
        return prev + 1;
      }
      closeTour();
      return prev;
    });
  }, [closeTour]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  // Auto-start on first visit — use a ref to guard against double-fire
  const hasAutoStarted = useRef(false);
  useEffect(() => {
    if (hasAutoStarted.current) return;
    hasAutoStarted.current = true;
    const timer = setTimeout(() => {
      if (localStorage.getItem(STORAGE_KEY) === null) {
        startTour();
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [startTour]);

  // Keyboard shortcut: ? to toggle tour
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.contentEditable === 'true' || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        if (isOpenRef.current) {
          closeTour();
        } else {
          startTour();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startTour, closeTour]);

  // Listen for custom event to start tour (from Help button)
  useEffect(() => {
    const handleStartTour = () => {
      startTour();
    };
    window.addEventListener('start-canva-tour', handleStartTour);
    return () => window.removeEventListener('start-canva-tour', handleStartTour);
  }, [startTour]);

  // Update target rect and tooltip position when step changes
  useEffect(() => {
    if (!isOpen) return;

    const step = TOUR_STEPS[currentStep];
    const rect = getTargetRect(step.targetSelector);

    // Auto-scroll to the element if off-screen
    if (rect) {
      const el = document.querySelector(step.targetSelector);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }

    // Calculate tooltip position after a frame to allow scroll
    const rafId = requestAnimationFrame(() => {
      const updatedRect = getTargetRect(step.targetSelector);
      setTargetRect(updatedRect);

      const tooltipW = 320;
      const tooltipH = 240;
      if (updatedRect) {
        const pos = calculateTooltipPosition(updatedRect, step.position, tooltipW, tooltipH);
        setTooltipPos(pos);
      } else {
        setTooltipPos({
          top: window.innerHeight / 2 - tooltipH / 2,
          left: window.innerWidth / 2 - tooltipW / 2,
          adjustedPosition: 'center',
        });
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [isOpen, currentStep]);

  // Update on resize
  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => {
      const step = TOUR_STEPS[currentStep];
      const rect = getTargetRect(step.targetSelector);
      setTargetRect(rect);
      const tooltipW = 320;
      const tooltipH = 240;
      if (rect) {
        const pos = calculateTooltipPosition(rect, step.position, tooltipW, tooltipH);
        setTooltipPos(pos);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const tourContent = (
    <div
      className="fixed inset-0"
      style={{ zIndex: 9997 }}
      role="dialog"
      aria-label="Tur Canva Editor"
      aria-modal="true"
    >
      {/* Spotlight overlay */}
      <SpotlightOverlay rect={targetRect} />

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className="fixed"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: 320,
          zIndex: 9999,
          animation: `tourSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
        }}
      >
        <div className="glass-panel-strong rounded-2xl shadow-2xl overflow-hidden border border-app-accent/20">
          {/* Header with icon + step counter */}
          <div className="bg-app-accent/10 px-5 pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-app-accent/20 flex items-center justify-center text-app-accent">
                {step.icon || <LifeBuoy className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium text-app-accent/70">
                  Langkah {currentStep + 1} dari {TOUR_STEPS.length}
                </div>
                <h3 className="text-sm font-bold text-app-primary truncate">
                  {step.title}
                </h3>
              </div>
              {/* Close button */}
              <button
                onClick={skipTour}
                className="p-1.5 rounded-lg hover:bg-app-elevated text-app-muted hover:text-app-primary transition-colors"
                aria-label="Tutup tur"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="px-5 py-4">
            <p className="text-[13px] text-app-secondary leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Step dots */}
          <div className="px-5 pb-2 flex justify-center gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <span
                key={i}
                className={`block h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? 'w-5 bg-app-accent'
                    : 'w-1.5 bg-app-elevated hover:bg-app-border-strong cursor-pointer'
                }`}
                onClick={() => setCurrentStep(i)}
                role="button"
                aria-label={`Pergi ke langkah ${i + 1}`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="px-5 pb-4 pt-2 flex items-center gap-3">
            {/* Skip */}
            <button
              onClick={skipTour}
              className="px-3 py-1.5 text-[11px] font-medium text-app-muted hover:text-app-primary transition-colors rounded-lg hover:bg-app-elevated"
            >
              Lewati
            </button>

            <div className="flex-1" />

            {/* Previous */}
            {!isFirst && (
              <button
                onClick={prevStep}
                className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium text-app-secondary hover:text-app-primary transition-colors rounded-lg hover:bg-app-elevated"
              >
                <ChevronLeft size={12} />
                Kembali
              </button>
            )}

            {/* Next / Finish */}
            <button
              onClick={nextStep}
              className="flex items-center gap-1 px-4 py-1.5 text-[11px] font-bold rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm hover:shadow-md hover:-translate-y-px transition-all"
            >
              {isLast ? (
                <>
                  Selesai
                  <Sparkles size={12} />
                </>
              ) : (
                <>
                  Lanjut
                  <ChevronRight size={12} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(tourContent, document.body);
}

// ── Exported helper: programmatic start ──────────────────────
// Other components (e.g., Help button) can trigger this via a custom event
export function triggerCanvaTour() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('start-canva-tour'));
}
