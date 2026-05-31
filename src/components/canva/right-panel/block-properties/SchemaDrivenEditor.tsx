'use client';

import { useMemo } from 'react';
import type { PropertySchema, PropertyField } from '@/core/editor/types';
import type { SchemaBlock } from '@/core/schema/types';
import { PropertyGroup } from './PropertyGroup';
import { renderField } from './field-registry';

/**
 * SchemaDrivenEditor — Stitch v4 Style
 *
 * Stitch layout:
 *   - Ungrouped fields first (content fields: title, body, etc.)
 *   - Divider + Grouped fields in collapsible sections
 *   - Each group has uppercase tracking-widest header
 *
 * Groups are organized by purpose:
 *   - "content" → Main content editing (title, text, items)
 *   - "appearance" → Colors, variants, style options
 *   - "behavior" → Interactive toggles, animations
 */
export function SchemaDrivenEditor({ block, schema, onUpdate }: {
  block: SchemaBlock;
  schema: PropertySchema;
  onUpdate: (updates: Record<string, unknown>) => void;
}) {
  const b = block as unknown as Record<string, unknown>;

  // Group fields by their group key — hooks must be called before any early returns
  const groupedFields = useMemo(() => {
    const groups: Map<string, PropertyField[]> = new Map();
    const ungrouped: PropertyField[] = [];

    for (const field of schema.properties) {
      if (field.group) {
        const existing = groups.get(field.group) || [];
        existing.push(field);
        groups.set(field.group, existing);
      } else {
        ungrouped.push(field);
      }
    }

    return { groups, ungrouped };
  }, [schema]);

  // If this block type should redirect to authoring panel, show note
  if (schema.redirectToAuthoring) {
    return (
      <div className="space-y-4 anim-enter-fade" role="region" aria-label={`Properti ${schema.blockType}`}>
        {schema.properties
          .filter(p => p.type === 'variant')
          .map(field => renderField(field, b, onUpdate))}
        <div className="px-4 py-3 rounded-xl bg-silse-surface-container-low border border-silse-outline-variant/50 text-[12px] text-silse-on-surface-variant italic text-center">
          {schema.redirectNote}
        </div>
      </div>
    );
  }

  // Determine group display order
  const groupOrder = schema.groups?.map(g => g.key) || Array.from(groupedFields.groups.keys());

  return (
    <div className="space-y-4 anim-enter-fade" role="region" aria-label={`Properti ${schema.blockType}`}>
      {/* Ungrouped fields first — these are the primary content fields */}
      {groupedFields.ungrouped.length > 0 && (
        <div className="space-y-4">
          {groupedFields.ungrouped.map(field => renderField(field, b, onUpdate))}
        </div>
      )}

      {/* Grouped fields in collapsible sections */}
      {groupOrder.map(groupKey => {
        const fields = groupedFields.groups.get(groupKey);
        if (!fields || fields.length === 0) return null;

        const groupDef = schema.groups?.find(g => g.key === groupKey);
        const isCollapsed = groupDef?.collapsed ?? false;
        const groupLabel = groupDef?.label || groupKey;

        return (
          <PropertyGroup key={groupKey} label={groupLabel} defaultCollapsed={isCollapsed}>
            {fields.map(field => renderField(field, b, onUpdate))}
          </PropertyGroup>
        );
      })}
    </div>
  );
}
