'use client';

// ═══════════════════════════════════════════════════════════════════════
// BLOCK VARIANT SWITCHER — Quick A/B/C variant switching for blocks
// ═══════════════════════════════════════════════════════════════════════
// Shows variant pills (A, B, C) for the selected block.
// Allows quick switching between visual variants without navigating
// to the Page Settings section.
// ═══════════════════════════════════════════════════════════════════════

import { useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import type { SchemaBlock } from '@/core/schema/types';
import { teacherTerm } from '@/core/i18n/teacher-terminology';

const VARIANTS = ['A', 'B', 'C'] as const;

const VARIANT_LABELS: Record<string, string> = {
  A: 'Default',
  B: 'Compact',
  C: 'Expanded',
};

// Teacher-friendly variant labels — Indonesian, descriptive
const VARIANT_TEACHER_LABELS: Record<string, string> = {
  A: 'Standar',
  B: 'Ringkas',
  C: 'Lebar',
};

const VARIANT_COLORS: Record<string, string> = {
  A: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  B: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  C: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
};

interface BlockVariantSwitcherProps {
  block: SchemaBlock;
}

export function BlockVariantSwitcher({ block }: BlockVariantSwitcherProps) {
  const updateSchemaBlock = useCanvaStore((s) => s.updateSchemaBlock);
  const selectedBlockId = useCanvaStore((s) => s.selectedBlockId);
  const teacherMode = useCanvaStore((s) => s.teacherMode);

  const currentVariant = (block as unknown as Record<string, unknown>).variant as string || 'A';

  const handleVariantChange = useCallback((variant: string) => {
    if (!selectedBlockId) return;
    if (variant === currentVariant) return;
    updateSchemaBlock(selectedBlockId, { variant });
  }, [selectedBlockId, currentVariant, updateSchemaBlock]);

  // In teacher mode, show descriptive Indonesian labels instead of A/B/C
  const displayLabels = teacherMode ? VARIANT_TEACHER_LABELS : VARIANT_LABELS;
  const sectionLabel = teacherMode ? 'Gaya' : 'Varian';

  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-app-muted font-bold uppercase tracking-wider w-12">
        {sectionLabel}
      </span>
      <div className="flex items-center gap-1">
        {VARIANTS.map((v) => {
          const isActive = currentVariant === v;
          return (
            <button
              key={v}
              onClick={() => handleVariantChange(v)}
              className={`px-2 py-0.5 rounded-md text-[9px] font-bold border transition-all ${
                isActive
                  ? VARIANT_COLORS[v]
                  : 'bg-app-elevated/40 text-app-muted border-app-border/20 hover:bg-app-elevated/60 hover:text-app-secondary'
              }`}
              title={displayLabels[v]}
            >
              {teacherMode ? displayLabels[v] : v}
            </button>
          );
        })}
      </div>
      {!teacherMode && (
        <span className="text-[8px] text-app-muted ml-1">
          {VARIANT_LABELS[currentVariant] || 'Custom'}
        </span>
      )}
    </div>
  );
}
