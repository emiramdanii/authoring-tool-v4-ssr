'use client';

// ═══════════════════════════════════════════════════════════════════════
// BLOCK VARIANT SWITCHER — Stitch v4 style variant pills
// ═══════════════════════════════════════════════════════════════════════
// Stitch spec: Compact pill buttons with colored backgrounds,
// teacher-friendly labels (Standar/Ringkas/Lebar)

import { useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import type { SchemaBlock } from '@/core/schema/types';

const VARIANTS = ['A', 'B', 'C'] as const;

// Teacher-friendly variant labels — Indonesian, descriptive
const VARIANT_TEACHER_LABELS: Record<string, string> = {
  A: 'Standar',
  B: 'Ringkas',
  C: 'Lebar',
};

const VARIANT_ICONS: Record<string, string> = {
  A: '□',
  B: '▬',
  C: '▭',
};

const VARIANT_COLORS: Record<string, { active: string; inactive: string }> = {
  A: {
    active: 'bg-primary-container/30 text-on-primary-container border-primary/30',
    inactive: 'bg-surface-bright border-outline-variant text-on-surface-variant hover:bg-surface-container-high',
  },
  B: {
    active: 'bg-tertiary-fixed/30 text-on-tertiary-fixed-variant border-tertiary/30',
    inactive: 'bg-surface-bright border-outline-variant text-on-surface-variant hover:bg-surface-container-high',
  },
  C: {
    active: 'bg-secondary-container/30 text-on-secondary-fixed-variant border-secondary/30',
    inactive: 'bg-surface-bright border-outline-variant text-on-surface-variant hover:bg-surface-container-high',
  },
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

  const sectionLabel = teacherMode ? 'Gaya Tampilan' : 'Varian';

  return (
    <div className="space-y-2">
      <label className="text-[12px] font-bold text-on-surface-variant block">
        {sectionLabel}
      </label>
      <div className="flex gap-2">
        {VARIANTS.map((v) => {
          const isActive = currentVariant === v;
          const colors = VARIANT_COLORS[v];
          return (
            <button
              key={v}
              onClick={() => handleVariantChange(v)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold border transition-all duration-200 ${
                isActive ? colors.active : colors.inactive
              }`}
              title={VARIANT_TEACHER_LABELS[v]}
            >
              <span className="text-[14px]">{VARIANT_ICONS[v]}</span>
              <span>{teacherMode ? VARIANT_TEACHER_LABELS[v] : v}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
