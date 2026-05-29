'use client';

// All icons migrated to Material Symbols Outlined
import { useCanvaStore } from '@/store/canva-store';

// ═══════════════════════════════════════════════════════════════
// MOBILE VIEWPORT TOGGLE — Switch between Desktop & Mobile preview
// ═══════════════════════════════════════════════════════════════
// Small toggle button group shown in the Preview mode toolbar.
// Stores viewport preference in the canva session slice.
// ═══════════════════════════════════════════════════════════════

export function MobileViewportToggle() {
  const previewViewport = useCanvaStore((s) => s.previewViewport);
  const setPreviewViewport = useCanvaStore((s) => s.setPreviewViewport);

  return (
    <div className="flex items-center rounded-lg border border-app-border/50 bg-app-elevated/50 p-0.5">
      <button
        onClick={() => setPreviewViewport('desktop')}
        className={`flex items-center justify-center rounded-md p-1 transition-[background-color,border-color,color] duration-150 ${
          previewViewport === 'desktop'
            ? 'bg-app-surface text-app-primary shadow-sm'
            : 'text-app-muted hover:text-app-secondary'
        }`}
        title="Tampilan Desktop"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>monitor</span>
      </button>
      <button
        onClick={() => setPreviewViewport('mobile')}
        className={`flex items-center justify-center rounded-md p-1 transition-[background-color,border-color,color] duration-150 ${
          previewViewport === 'mobile'
            ? 'bg-app-surface text-app-primary shadow-sm'
            : 'text-app-muted hover:text-app-secondary'
        }`}
        title="Tampilan Mobile"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>smartphone</span>
      </button>
    </div>
  );
}
