'use client';

// ═══════════════════════════════════════════════════════════════
// GUIDED FORM EDITOR — Stitch v4 Teacher-Friendly Form
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
// Stitch spec:
//   - Large labels (Label-LG), 12px bold
//   - px-4 py-3 rounded-xl inputs
//   - 2px Royal Blue focus border + glow
//   - Sections: divider + uppercase tracking-widest header
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
  // Tracks whether the last edit caused overflow, so we can
  // show the OverflowWarningBanner with action buttons.
  const [overflowDetails, setOverflowDetails] = useState<OverflowCheckResult | null>(null);

  // Create the write handler that uses applyGuidedSchemaPatch
  // This is the SINGLE WRITE PATH — no updateSchemaBlock() here
  // Phase 4: Now passes overflowPolicy: 'warn' to detect overflow
  const handleUpdate = useCallback((updates: Record<string, unknown>) => {
    const result = applyGuidedSchemaPatch({
      pageId,
      blockId,
      patch: updates,
      overflowPolicy: 'warn',  // Phase 4: detect overflow, warn + show UI
      source: 'guided-form',
    });

    if (!result.success) {
      console.warn(`[GuidedFormEditor] Patch failed: ${result.error}`);
    }

    if (result.overflowDetected && result.overflowDetails) {
      setOverflowDetails(result.overflowDetails);
    } else {
      // Clear overflow state if edit no longer overflows
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
        // Will be grouped into a section later
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
    <div className="space-y-4" role="region" aria-label={`Guided Editor: ${guidedSchema.displayName}`}>
      {/* ── Overflow warning banner (Phase 4) ── */}
      {overflowDetails && overflowDetails.overflowDetected && (
        <OverflowWarningBanner
          details={overflowDetails}
          pageId={pageId}
          onDismiss={() => setOverflowDetails(null)}
        />
      )}

      {/* ── Block description (teacher mode) ── */}
      {teacherMode && guidedSchema.description && (
        <div className="px-4 py-2.5 rounded-xl bg-silse-primary-container/10 border border-silse-primary/15 text-[12px] text-silse-on-surface-variant leading-relaxed">
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
