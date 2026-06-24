// ═══════════════════════════════════════════════════════════════════
// SPRINT 8.8B-Patch-3 — Hotspot Add Item Default + Strip posisi Tests
// ═══════════════════════════════════════════════════════════════════
// Verifies the fix for:
//   1. addNestedItem creates x=50, y=50 (NOT posisi='')
//   2. updateNestedItem('posisi', ...) strips stale posisi field
//   3. No posisi field survives any add or update operation
//
// Approach: simulate the InlineNestedArrayField's addNestedItem +
// updateNestedItem logic with the same fieldDefs as the hotspot-image
// guided editor, then verify the resulting items.
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from 'vitest';

vi.mock('@/store/authoring-store', () => ({
  useAuthoringStore: Object.assign(() => ({}), { getState: () => ({}), setState: () => {} }),
}));
vi.mock('@/store/dirty-store', () => ({
  useDirtyStore: Object.assign(() => ({}), { getState: () => ({}), setState: () => {} }),
}));
vi.mock('@/store/canva-store', () => ({
  useCanvaStore: Object.assign(() => ({}), { getState: () => ({ pages: [] }), setState: () => {} }),
}));

import { parseHotspotPosition } from '@/core/schema/hotspot-position';
import { getGuidedEditorSchema } from '@/core/schema/guided-patch';

// ─────────────────────────────────────────────────────────────────
// Simulate InlineNestedArrayField's addNestedItem + updateNestedItem
// with the same logic as field-registry.tsx (post Patch-3)
// ─────────────────────────────────────────────────────────────────

function simulateAddNestedItem(
  fieldDefs: Array<{ key: string; type: string; defaultValue?: unknown }>,
): Record<string, unknown> {
  const newItem: Record<string, unknown> = {};
  fieldDefs.forEach(f => {
    if (f.key === 'posisi') {
      newItem['x'] = 50;
      newItem['y'] = 50;
      return;
    }
    if (f.type === 'boolean') newItem[f.key] = false;
    else if (f.type === 'number') newItem[f.key] = f.defaultValue ?? 0;
    else newItem[f.key] = f.defaultValue ?? '';
  });
  return newItem;
}

function simulateUpdateNestedItem(
  items: Array<Record<string, unknown>>,
  idx: number,
  field: string,
  value: unknown,
): Array<Record<string, unknown>> {
  if (field === 'posisi') {
    const { x, y } = parseHotspotPosition(value);
    const newItems = [...items];
    const { posisi: _stripped, ...rest } = newItems[idx];
    newItems[idx] = { ...rest, x, y };
    return newItems;
  }
  const newItems = [...items];
  newItems[idx] = { ...newItems[idx], [field]: value };
  return newItems;
}

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('Sprint 8.8B-Patch-3 — Hotspot Add Item Default + Strip posisi', () => {

  // Get the actual fieldDefs from the guided editor
  const schema = getGuidedEditorSchema('hotspot-image');
  const hotspotsField = schema?.fields?.find(f => f.key === 'hotspots');
  const fieldDefs = hotspotsField?.fields ?? [];

  // ── 1. Add hotspot creates x=50, y=50 ───────────────────────

  it('addNestedItem creates item with x=50 and y=50 (NOT posisi)', () => {
    const newItem = simulateAddNestedItem(fieldDefs);
    expect(newItem).toHaveProperty('x', 50);
    expect(newItem).toHaveProperty('y', 50);
    expect(newItem).not.toHaveProperty('posisi');
  });

  it('addNestedItem creates item with all other fields initialized', () => {
    const newItem = simulateAddNestedItem(fieldDefs);
    expect(newItem).toHaveProperty('label');
    expect(newItem).toHaveProperty('title');
    expect(newItem).toHaveProperty('body');
    expect(newItem).toHaveProperty('icon');
    expect(newItem).toHaveProperty('color');
  });

  // ── 2. Update posisi strips stale posisi field ─────────────

  it('updateNestedItem("posisi", "15,15") produces x=15, y=15 and NO posisi field', () => {
    // Start with an item that has a stale posisi field (simulating pre-Patch-3 add)
    const items: Array<Record<string, unknown>> = [
      { label: '1', posisi: '', title: '', body: '', icon: '', color: '' },
    ];

    const updated = simulateUpdateNestedItem(items, 0, 'posisi', '15,15');

    expect(updated[0]).toHaveProperty('x', 15);
    expect(updated[0]).toHaveProperty('y', 15);
    expect(updated[0]).not.toHaveProperty('posisi');
  });

  it('updateNestedItem("posisi", "85,85") on item without posisi also works', () => {
    // Item created by Patch-3 addNestedItem (no posisi, has x/y)
    const items: Array<Record<string, unknown>> = [
      { label: '1', x: 50, y: 50, title: '', body: '', icon: '', color: '' },
    ];

    const updated = simulateUpdateNestedItem(items, 0, 'posisi', '85,85');

    expect(updated[0]).toHaveProperty('x', 85);
    expect(updated[0]).toHaveProperty('y', 85);
    expect(updated[0]).not.toHaveProperty('posisi');
  });

  // ── 3. No posisi field survives any operation ──────────────

  it('add then update posisi → no posisi field at any point', () => {
    // Step 1: add
    let items: Array<Record<string, unknown>> = [simulateAddNestedItem(fieldDefs)];
    expect(items[0]).not.toHaveProperty('posisi');
    expect(items[0]).toHaveProperty('x', 50);
    expect(items[0]).toHaveProperty('y', 50);

    // Step 2: update posisi to "15,15"
    items = simulateUpdateNestedItem(items, 0, 'posisi', '15,15');
    expect(items[0]).not.toHaveProperty('posisi');
    expect(items[0]).toHaveProperty('x', 15);
    expect(items[0]).toHaveProperty('y', 15);

    // Step 3: update label (non-posisi field)
    items = simulateUpdateNestedItem(items, 0, 'label', 'A');
    expect(items[0]).not.toHaveProperty('posisi');
    expect(items[0]).toHaveProperty('x', 15);
    expect(items[0]).toHaveProperty('y', 15);
    expect(items[0]).toHaveProperty('label', 'A');
  });

  it('legacy item with posisi + update posisi → posisi stripped, x/y set', () => {
    // Simulate a legacy item from pre-Patch-3 that has posisi but no x/y
    const items: Array<Record<string, unknown>> = [
      { label: '1', posisi: '50,50', title: 'Old', body: '', icon: '', color: '' },
    ];

    const updated = simulateUpdateNestedItem(items, 0, 'posisi', '85,15');

    expect(updated[0]).not.toHaveProperty('posisi');
    expect(updated[0]).toHaveProperty('x', 85);
    expect(updated[0]).toHaveProperty('y', 15);
    expect(updated[0]).toHaveProperty('label', '1');
    expect(updated[0]).toHaveProperty('title', 'Old');
  });

  // ── 4. Multiple hotspots — all get x/y, none get posisi ────

  it('add 3 hotspots → all have x=50, y=50, none have posisi', () => {
    const items: Array<Record<string, unknown>> = [];
    for (let i = 0; i < 3; i++) {
      items.push(simulateAddNestedItem(fieldDefs));
    }

    for (let i = 0; i < 3; i++) {
      expect(items[i]).toHaveProperty('x', 50);
      expect(items[i]).toHaveProperty('y', 50);
      expect(items[i]).not.toHaveProperty('posisi');
    }
  });

  it('add 3 hotspots, update each to different positions → all correct', () => {
    const positions = ['15,15', '50,50', '85,85'];
    let items: Array<Record<string, unknown>> = [];
    for (let i = 0; i < 3; i++) {
      items.push(simulateAddNestedItem(fieldDefs));
    }

    for (let i = 0; i < 3; i++) {
      items = simulateUpdateNestedItem(items, i, 'posisi', positions[i]);
    }

    expect(items[0]).toEqual(expect.objectContaining({ x: 15, y: 15 }));
    expect(items[1]).toEqual(expect.objectContaining({ x: 50, y: 50 }));
    expect(items[2]).toEqual(expect.objectContaining({ x: 85, y: 85 }));

    for (let i = 0; i < 3; i++) {
      expect(items[i]).not.toHaveProperty('posisi');
    }
  });
});
