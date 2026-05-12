'use client';

import { useCanvaStore } from '@/store/canva-store';
import {
  AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  SpaceHorizontal, SpaceVertical,
} from './align-icons';
import { Button } from '@/components/ui/button';

/**
 * Alignment & Distribution tools — visible when 2+ elements are selected.
 * Self-contained: reads selectedElIds, alignSelected, distributeSelected from the store.
 */
export default function AlignmentTools() {
  const selectedElIds = useCanvaStore(s => s.selectedElIds);
  const alignSelected = useCanvaStore(s => s.alignSelected);
  const distributeSelected = useCanvaStore(s => s.distributeSelected);

  if (selectedElIds.length < 2) return null;

  return (
    <div className="px-3 py-2 border-b border-app-border">
      <div className="text-[9px] font-bold text-app-muted uppercase tracking-wider mb-1.5">Align & Distribusi</div>
      <div className="grid grid-cols-6 gap-1">
        <Button onClick={() => alignSelected('left')} variant="ghost" size="icon" className="focus-ring p-1 h-7 w-7" title="Align Left">
          <AlignStartHorizontal size={13} />
        </Button>
        <Button onClick={() => alignSelected('centerH')} variant="ghost" size="icon" className="focus-ring p-1 h-7 w-7" title="Align Center Horizontal">
          <AlignCenterHorizontal size={13} />
        </Button>
        <Button onClick={() => alignSelected('right')} variant="ghost" size="icon" className="focus-ring p-1 h-7 w-7" title="Align Right">
          <AlignEndHorizontal size={13} />
        </Button>
        <Button onClick={() => alignSelected('top')} variant="ghost" size="icon" className="focus-ring p-1 h-7 w-7" title="Align Top">
          <AlignStartVertical size={13} />
        </Button>
        <Button onClick={() => alignSelected('centerV')} variant="ghost" size="icon" className="focus-ring p-1 h-7 w-7" title="Align Center Vertical">
          <AlignCenterVertical size={13} />
        </Button>
        <Button onClick={() => alignSelected('bottom')} variant="ghost" size="icon" className="focus-ring p-1 h-7 w-7" title="Align Bottom">
          <AlignEndVertical size={13} />
        </Button>
      </div>
      {selectedElIds.length >= 3 && (
        <div className="grid grid-cols-2 gap-1 mt-1">
          <Button onClick={() => distributeSelected('horizontal')} variant="ghost" className="focus-ring p-1 flex items-center gap-1 h-7" title="Distribute Horizontally">
            <SpaceHorizontal size={12} /> <span className="text-[8px]">H-Space</span>
          </Button>
          <Button onClick={() => distributeSelected('vertical')} variant="ghost" className="focus-ring p-1 flex items-center gap-1 h-7" title="Distribute Vertically">
            <SpaceVertical size={12} /> <span className="text-[8px]">V-Space</span>
          </Button>
        </div>
      )}
    </div>
  );
}
