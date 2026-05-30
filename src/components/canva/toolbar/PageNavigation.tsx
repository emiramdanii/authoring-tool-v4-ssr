'use client';

import { useCanvaStore } from '@/store/canva-store';
import { Button } from '@/components/ui/button';
// All icons migrated to Material Symbols Outlined
// ═══════════════════════════════════════════════════════════════
// PAGE NAVIGATION — ◄ ► 1/5 with scene sub-counter
// ═══════════════════════════════════════════════════════════════

export function PageNavigation() {
  const currentPageIndex = useCanvaStore((s) => s.currentPageIndex);
  const pages = useCanvaStore((s) => s.pages);
  const goPage = useCanvaStore((s) => s.goPage);
  const sceneIndex = useCanvaStore((s) => s.sceneIndex);
  const sceneTotal = useCanvaStore((s) => s.sceneTotal);
  const teacherMode = useCanvaStore((s) => s.teacherMode);

  const showSceneNav = sceneTotal > 1;

  return (
    <div className="flex items-center gap-0.5">
      {/* Page prev */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => currentPageIndex > 0 && goPage(currentPageIndex - 1)}
        disabled={currentPageIndex <= 0}
        className="h-7 w-7 rounded-xl bg-silse-surface-container-lowest/80 hover:bg-silse-surface-container-lowest border border-silse-outline-variant/30 disabled:opacity-30"
        title="Halaman sebelumnya"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>chevron_left</span>
      </Button>

      {/* Page counter */}
      <span className="text-[10px] font-bold text-app-primary whitespace-nowrap">
        {currentPageIndex + 1}/{pages.length}
      </span>

      {/* Scene sub-counter (if multi-scene page) */}
      {showSceneNav && (
        <span className="text-[10px] text-app-success/70 font-medium ml-0.5">
          • {teacherMode ? 'Halaman' : 'Scene'} {sceneIndex + 1}/{sceneTotal}
        </span>
      )}

      {/* Page next */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => currentPageIndex < pages.length - 1 && goPage(currentPageIndex + 1)}
        disabled={currentPageIndex >= pages.length - 1}
        className="h-7 w-7 rounded-xl bg-silse-surface-container-lowest/80 hover:bg-silse-surface-container-lowest border border-silse-outline-variant/30 disabled:opacity-30"
        title="Halaman berikutnya"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>chevron_right</span>
      </Button>
    </div>
  );
}
