// ═══════════════════════════════════════════════════════════════════
// SCENE NAVIGATOR — Navigation UI for multi-scene pages
// ═══════════════════════════════════════════════════════════════════
//
// When a page's content overflows and the SceneOverflowEngine
// splits it into multiple scenes, this navigator provides:
//   - Prev/Next buttons
//   - Scene indicator dots
//   - Current scene / total scenes label
//   - Keyboard navigation (arrow keys)
//
// This is the UI component that makes auto-split VISIBLE to the user.

'use client';

import React, { useCallback } from 'react';
import { ChevronLeft, ChevronRight, FilePlus, ShieldOff } from 'lucide-react';
import { isFeatureAllowed, type SafeModeFeature } from '@/core/recovery';

export interface SceneNavigatorProps {
  /** Current scene index (0-based) */
  currentScene: number;
  /** Total number of scenes */
  totalScenes: number;
  /** Callback to go to a specific scene */
  onSceneChange: (sceneIndex: number) => void;
  /** Whether navigator is in compact mode (canvas) */
  isCompact?: boolean;
  /** Position of the navigator */
  position?: 'bottom' | 'top';
  /** Callback to promote current scene to a new page (optional) */
  onPromoteScene?: () => void;
  /** Whether safe mode is active (disables promote scene button) */
  safeMode?: boolean;
}

export const SceneNavigator = React.memo(function SceneNavigator({
  currentScene,
  totalScenes,
  onSceneChange,
  isCompact = false,
  position = 'bottom',
  onPromoteScene,
  safeMode = false,
}: SceneNavigatorProps) {
  const handlePrev = useCallback(() => {
    if (currentScene > 0) onSceneChange(currentScene - 1);
  }, [currentScene, onSceneChange]);

  const handleNext = useCallback(() => {
    if (currentScene < totalScenes - 1) onSceneChange(currentScene + 1);
  }, [currentScene, totalScenes, onSceneChange]);

  // NOTE: Keyboard navigation for scenes is handled centrally by
  // CanvaBuilder's useKeyboardShortcuts registry (Ctrl+ArrowLeft/Right).
  // We do NOT add a local keydown listener here to avoid conflicts
  // with the Stage keyboard handler (bare arrows = nudge blocks).
  //
  // Scene navigation: Ctrl+ArrowLeft = prev scene, Ctrl+ArrowRight = next scene.
  // These are registered in CanvaBuilder.tsx alongside other canvas shortcuts.
  //
  // The SceneNavigator component itself is purely a UI component that
  // receives onSceneChange from SchemaRenderer. The keyboard shortcut
  // calls SchemaRenderer's scene change callback via the canva store.

  // Don't show navigator for single-scene pages
  if (totalScenes <= 1) return null;

  const posClass = position === 'top' ? 'top-2' : 'bottom-2';

  return (
    <div
      className={`absolute right-3 ${posClass} z-50 flex items-center gap-2`}
      style={{
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        borderRadius: '9999px',
        padding: isCompact ? '3px 8px' : '4px 12px',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {/* Prev button */}
      <button
        onClick={handlePrev}
        disabled={currentScene === 0}
        className="flex items-center justify-center rounded-full transition-colors disabled:opacity-30 hover:bg-white/10"
        style={{ width: isCompact ? 20 : 24, height: isCompact ? 20 : 24 }}
        aria-label="Scene sebelumnya"
      >
        <span className="material-symbols-outlined text-white/80" style={ { fontSize: '16px' } }>chevron_left</span>
      </button>

      {/* Scene dots */}
      <div className="flex items-center gap-1">
        {Array.from({ length: totalScenes }, (_, i) => (
          <button
            key={i}
            onClick={() => onSceneChange(i)}
            className="rounded-full transition-[width,background-color,opacity]"
            style={{
              width: i === currentScene ? (isCompact ? 14 : 18) : (isCompact ? 6 : 8),
              height: isCompact ? 6 : 8,
              background: i === currentScene
                ? 'rgba(52, 211, 153, 0.9)'
                : 'rgba(255, 255, 255, 0.3)',
              border: 'none',
              cursor: 'pointer',
            }}
            aria-label={`Scene ${i + 1}`}
          />
        ))}
      </div>

      {/* Next button */}
      <button
        onClick={handleNext}
        disabled={currentScene === totalScenes - 1}
        className="flex items-center justify-center rounded-full transition-colors disabled:opacity-30 hover:bg-white/10"
        style={{ width: isCompact ? 20 : 24, height: isCompact ? 20 : 24 }}
        aria-label="Scene berikutnya"
      >
        <span className="material-symbols-outlined text-white/80" style={ { fontSize: '16px' } }>chevron_right</span>
      </button>

      {/* Scene label */}
      <span
        className="text-white/60 font-medium tabular-nums"
        style={{ fontSize: isCompact ? 9 : 10 }}
      >
        {currentScene + 1}/{totalScenes}
      </span>

      {/* Promote to page button — only when multi-scene, callback provided, and allowed in safe mode */}
      {onPromoteScene && (
        <button
          onClick={() => {
            const allowed = isFeatureAllowed('scene-overflow-split' as SafeModeFeature, safeMode);
            if (allowed) onPromoteScene();
          }}
          className="flex items-center justify-center rounded-full transition-colors hover:bg-white/10 ml-1"
          style={{
            width: isCompact ? 20 : 24,
            height: isCompact ? 20 : 24,
            ...(safeMode ? { opacity: 0.3, cursor: 'not-allowed' } : {}),
          }}
          aria-label="Promosi scene ke halaman"
          title={safeMode ? 'Dinonaktifkan di Mode Aman' : 'Promosi Scene ke Halaman Baru'}
          disabled={safeMode}
        >
          {safeMode ? <ShieldOff size={isCompact ? 11 : 13} className="text-amber-400/80" /> : <FilePlus size={isCompact ? 11 : 13} className="text-emerald-400/80" />}
        </button>
      )}
    </div>
  );
});
