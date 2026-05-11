'use client';

import { useMemo } from 'react';
import type { PropertySchema, PropertyField } from '@/core/editor/types';
import type { SchemaBlock } from '@/core/schema/types';
import { PropertyGroup } from './PropertyGroup';
import { renderField } from './field-registry';

/**
 * Schema-driven dynamic editor.
 *
 * Replaces the giant switch statement in BlockTypeEditor.
 * Reads PropertySchema and auto-generates the appropriate form fields.
 * Adding a new block type = add its propertySchema. No code change here.
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
      <div className="mt-2 space-y-2">
        {schema.properties
          .filter(p => p.type === 'variant')
          .map(field => renderField(field, b, onUpdate))}
        <div className="text-[9px] text-slate-500 italic px-1">
          {schema.redirectNote}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      {/* Ungrouped fields first */}
      {groupedFields.ungrouped.map(field => renderField(field, b, onUpdate))}

      {/* Grouped fields in collapsible sections */}
      {Array.from(groupedFields.groups.entries()).map(([groupKey, fields]) => {
        const groupDef = schema.groups?.find(g => g.key === groupKey);
        const isCollapsed = groupDef?.collapsed ?? false;
        return (
          <PropertyGroup key={groupKey} label={groupDef?.label || groupKey} defaultCollapsed={isCollapsed}>
            {fields.map(field => renderField(field, b, onUpdate))}
          </PropertyGroup>
        );
      })}
    </div>
  );
}
