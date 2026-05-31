'use client';

// ═══════════════════════════════════════════════════════════════
// GUIDED FORM EDITOR — SILSE v4 Teacher-Friendly Form
// ═══════════════════════════════════════════════════════════════
// This is the PRIMARY editor for teacher mode.
// It uses GuidedEditorSchema (content-focused, teacher-friendly)
// instead of PropertySchema (developer-focused, layout/style).
//
// Data flow:
//   User edit → applyGuidedSchemaPatch() → schema (single write path)
//
// Sections map (from GuidedEditorSchema.sections):
//   - Each section = collapsible group with uppercase header
//   - Fields without a section = primary content (shown first)
//
// SILSE v4 spec:
//   - Input fields: rounded-xl border-silse-outline-variant bg-silse-surface-bright
//     focus:border-silse-secondary focus:ring-2 focus:ring-silse-secondary/20
//   - Labels: text-sm font-bold text-silse-on-surface-variant
//   - Section dividers: border-silse-outline-variant
// ═══════════════════════════════════════════════════════════════

import { useMemo, useCallback, useState } from 'react';
import type { GuidedEditorSchema, GuidedFieldDef, OverflowCheckResult } from '@/core/schema/guided-patch';
import type { SchemaBlock } from '@/core/schema/types';
import { applyGuidedSchemaPatch } from '@/core/schema/guided-patch';
import { useCanvaStore } from '@/store/canva-store';
import { PropertyGroup } from './PropertyGroup';
import { renderGuidedField } from './guided-field-renderer';
import { OverflowWarningBanner } from './OverflowWarningBanner';

interface GuidedFormEditorProps {
  /** The block being edited */
  block: SchemaBlock;
  /** Guided editor schema — defines fields and sections */
  guidedSchema: GuidedEditorSchema;
  /** Current page ID — needed for applyGuidedSchemaPatch */
  pageId: string;
  /** Block ID — needed for applyGuidedSchemaPatch */
  blockId: string;
}

export function GuidedFormEditor({ block, guidedSchema, pageId, blockId }: GuidedFormEditorProps) {
  const b = block as unknown as Record<string, unknown>;
  const teacherMode = useCanvaStore(s => s.teacherMode);

  // ── Overflow state ──
  const [overflowDetails, setOverflowDetails] = useState<OverflowCheckResult | null>(null);

  // Create the write handler that uses applyGuidedSchemaPatch
  const handleUpdate = useCallback((updates: Record<string, unknown>) => {
    const result = applyGuidedSchemaPatch({
      pageId,
      blockId,
      patch: updates,
      overflowPolicy: 'warn',
      source: 'guided-form',
    });

    if (!result.success) {
      console.warn(`[GuidedFormEditor] Patch failed: ${result.error}`);
    }

    if (result.overflowDetected && result.overflowDetails) {
      setOverflowDetails(result.overflowDetails);
    } else {
      setOverflowDetails(null);
    }
  }, [pageId, blockId]);

  // Group fields by section — same pattern as SchemaDrivenEditor
  const { sectionedFields, ungroupedFields } = useMemo(() => {
    const sectionMap = new Map<string, GuidedFieldDef[]>();
    const ungrouped: GuidedFieldDef[] = [];

    // Build a set of field keys that belong to a section
    const sectionedKeys = new Set<string>();
    if (guidedSchema.sections) {
      for (const section of guidedSchema.sections) {
        for (const key of section.fieldKeys) {
          sectionedKeys.add(key);
        }
      }
    }

    // Classify each field
    for (const field of guidedSchema.fields) {
      if (sectionedKeys.has(field.key)) {
        continue;
      }
      ungrouped.push(field);
    }

    // Build section groups
    if (guidedSchema.sections) {
      for (const section of guidedSchema.sections) {
        const fields: GuidedFieldDef[] = [];
        for (const key of section.fieldKeys) {
          const fieldDef = guidedSchema.fields.find(f => f.key === key);
          if (fieldDef) fields.push(fieldDef);
        }
        if (fields.length > 0) {
          sectionMap.set(section.key, fields);
        }
      }
    }

    return { sectionedFields: sectionMap, ungroupedFields: ungrouped };
  }, [guidedSchema]);

  // Section display order
  const sectionOrder = guidedSchema.sections?.map(s => s.key) ?? [];

  return (
    <div className="space-y-4 p-4 anim-enter-fade" role="region" aria-label={`Guided Editor: ${guidedSchema.displayName}`}>
      {/* ── Overflow warning banner ── */}
      {overflowDetails && overflowDetails.overflowDetected && (
        <OverflowWarningBanner
          details={overflowDetails}
          pageId={pageId}
          onDismiss={() => setOverflowDetails(null)}
        />
      )}

      {/* ── Block description (teacher mode) ── */}
      {teacherMode && guidedSchema.description && (
        <div className="px-3 py-2 rounded-xl bg-silse-primary-container/8 border border-silse-primary/10 text-xs text-silse-on-surface-variant leading-relaxed">
          <span className="material-symbols-outlined inline text-silse-primary mr-1" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1, 'wght' 400" }}>info</span>
          {guidedSchema.description}
        </div>
      )}

      {/* ── Ungrouped fields first (primary content) ── */}
      {ungroupedFields.length > 0 && (
        <div className="space-y-4">
          {ungroupedFields.map(field => renderGuidedField(field, b, handleUpdate))}
        </div>
      )}

      {/* ── Sectioned fields in collapsible groups ── */}
      {sectionOrder.map(sectionKey => {
        const fields = sectionedFields.get(sectionKey);
        if (!fields || fields.length === 0) return null;

        const sectionDef = guidedSchema.sections?.find(s => s.key === sectionKey);
        const sectionLabel = sectionDef?.label || sectionKey;

        return (
          <PropertyGroup key={sectionKey} label={sectionLabel} defaultCollapsed={false}>
            {fields.map(field => renderGuidedField(field, b, handleUpdate))}
          </PropertyGroup>
        );
      })}
    </div>
  );
}
