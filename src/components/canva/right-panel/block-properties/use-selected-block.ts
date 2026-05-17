'use client';

import { useCanvaStore } from '@/store/canva-store';
import type { SchemaBlock, ScreenSchema } from '@/core/schema/types';
import { ensurePageSchema } from '@/core/schema/ensure-schema';
import { useMemo } from 'react';

/**
 * Find the selected block in the page's schema.
 *
 * PERF: Subscribes to only the current page (not the full pages[] array),
 * preventing cascade re-renders when other pages change.
 *
 * Works with both:
 *   - Schema preset pages (schemaScreen in templateData)
 *   - Legacy adapted pages (converted via TemplateAdapter on-the-fly)
 */
export function useSelectedBlock(): { block: SchemaBlock | null; schema: ScreenSchema | null } {
  const selectedBlockId = useCanvaStore(s => s.selectedBlockId);
  // PERF: Subscribe to only the current page, not the full pages[] array
  const currentPageIndex = useCanvaStore(s => s.currentPageIndex);
  const page = useCanvaStore(s => s.pages[currentPageIndex]);

  const schema = useMemo<ScreenSchema | null>(() => {
    if (!page || !selectedBlockId) return null;

    // SCHEMA-FIRST: Use ensurePageSchema() — lazily migrates legacy pages on first access.
    return ensurePageSchema(page);
  }, [page, selectedBlockId]);

  if (!selectedBlockId || !schema) return { block: null, schema: null };

  // Find block by ID
  const block = schema.blocks.find(b => b.id === selectedBlockId)
    ?? schema.blocks.find(b => (b.id || b.type) === selectedBlockId)
    ?? null;
  return { block, schema };
}
