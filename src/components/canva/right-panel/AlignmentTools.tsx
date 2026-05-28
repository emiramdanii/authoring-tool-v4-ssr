'use client';

import { useCanvaStore } from '@/store/canva-store';
import {
  AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  SpaceHorizontal, SpaceVertical,
} from './align-icons';
import { Button } from '@/components/ui/button';

/**
 * Alignment & Distribution tools — visible when 2+ elements/blocks are selected.
 * Self-contained: reads selectedElIds, selectedBlockIds, alignSelected, distributeSelected from the store.
 * Also supports schema block alignment for absolute-positioned blocks.
 */
export default function AlignmentTools() {
  const selectedElIds = useCanvaStore(s => s.selectedElIds);
  const selectedBlockIds = useCanvaStore(s => s.selectedBlockIds);
  const selectedBlockId = useCanvaStore(s => s.selectedBlockId);
  const alignSelected = useCanvaStore(s => s.alignSelected);
  const distributeSelected = useCanvaStore(s => s.distributeSelected);
  const alignSchemaBlocks = useCanvaStore(s => s.alignSchemaBlocks);
  const distributeSchemaBlocks = useCanvaStore(s => s.distributeSchemaBlocks);

  // Show when 2+ legacy elements OR 2+ schema blocks are selected
  const hasElements = selectedElIds.length >= 2;
  const hasBlocks = selectedBlockIds.length >= 2;
  if (!hasElements && !hasBlocks) return null;

  // Route to the appropriate handler based on what's selected
  const handleAlign = (direction: 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom') => {
    if (hasBlocks) {
      alignSchemaBlocks(direction);
    } else {
      alignSelected(direction);
    }
  };

  const handleDistribute = (axis: 'horizontal' | 'vertical') => {
    if (hasBlocks) {
      distributeSchemaBlocks(axis);
    } else {
      distributeSelected(axis);
    }
  };

  return (
    <div className="px-3 py-2 border-b border-silse-outline-variant">
      <div className="text-[9px] font-bold text-silse-on-surface-variant uppercase tracking-wider mb-1.5">Align & Distribusi</div>
      <div className="grid grid-cols-6 gap-1">
        <Button onClick={() => handleAlign('left')} variant="ghost" size="icon" className="focus-ring p-1 h-7 w-7" title="Align Left">
          <AlignStartHorizontal size={13} />
        </Button>
        <Button onClick={() => handleAlign('centerH')} variant="ghost" size="icon" className="focus-ring p-1 h-7 w-7" title="Align Center Horizontal">
          <AlignCenterHorizontal size={13} />
        </Button>
        <Button onClick={() => handleAlign('right')} variant="ghost" size="icon" className="focus-ring p-1 h-7 w-7" title="Align Right">
          <AlignEndHorizontal size={13} />
        </Button>
        <Button onClick={() => handleAlign('top')} variant="ghost" size="icon" className="focus-ring p-1 h-7 w-7" title="Align Top">
          <AlignStartVertical size={13} />
        </Button>
        <Button onClick={() => handleAlign('centerV')} variant="ghost" size="icon" className="focus-ring p-1 h-7 w-7" title="Align Center Vertical">
          <AlignCenterVertical size={13} />
        </Button>
        <Button onClick={() => handleAlign('bottom')} variant="ghost" size="icon" className="focus-ring p-1 h-7 w-7" title="Align Bottom">
          <AlignEndVertical size={13} />
        </Button>
      </div>
      {(hasElements && selectedElIds.length >= 3) || (hasBlocks && selectedBlockIds.length >= 3) ? (
        <div className="grid grid-cols-2 gap-1 mt-1">
          <Button onClick={() => handleDistribute('horizontal')} variant="ghost" className="focus-ring p-1 flex items-center gap-1 h-7" title="Distribute Horizontally">
            <SpaceHorizontal size={12} /> <span className="text-[8px]">H-Space</span>
          </Button>
          <Button onClick={() => handleDistribute('vertical')} variant="ghost" className="focus-ring p-1 flex items-center gap-1 h-7" title="Distribute Vertically">
            <SpaceVertical size={12} /> <span className="text-[8px]">V-Space</span>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
