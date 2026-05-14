// ═══════════════════════════════════════════════════════════════════
// PATCH HISTORY TESTS — Immer-based undo/redo infrastructure
// ═══════════════════════════════════════════════════════════════════
// Tests the PatchHistory class:
//   - push() — add entries
//   - undo() — apply inverse patches
//   - redo() — re-apply forward patches
//   - canUndo/canRedo flags
//   - replaceEntry() — coalescing
//   - clear() — reset history
//   - undoState/redoState — apply patches to state
//   - jumpTo() — time travel
//   - Edge cases: empty history, undo when empty, redo when empty

import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { enablePatches } from 'immer';
import { PatchHistory } from '@/core/editor/patch-history';
import type { PatchHistoryEntry } from '@/core/editor/patch-history';
import type { Patch } from 'immer';

// Immer requires enablePatches() before using applyPatches
beforeAll(() => {
  enablePatches();
});

// ── Test Helpers ─────────────────────────────────────────────────

/** Create a simple forward patch that replaces a value at a path */
function makeForwardPatch(path: string[], value: unknown): Patch {
  return { op: 'replace', path, value };
}

/** Create a simple inverse patch that replaces a value back */
function makeInversePatch(path: string[], value: unknown): Patch {
  return { op: 'replace', path, value };
}

/** Create a simple history entry for testing */
function makeEntry(
  id: string,
  forwardValue?: string,
  inverseValue?: string,
): Omit<PatchHistoryEntry, 'timestamp'> & { timestamp?: number } {
  return {
    patches: [makeForwardPatch(['title'], forwardValue ?? `forward-${id}`)],
    inversePatches: [makeInversePatch(['title'], inverseValue ?? `inverse-${id}`)],
    description: `Edit ${id}`,
    source: 'user',
    pageIndex: 0,
    blockId: `block-${id}`,
  };
}

// ═══════════════════════════════════════════════════════════════════
// 1. PUSH — Add entries to history
// ═══════════════════════════════════════════════════════════════════

describe('PatchHistory — push()', () => {
  let history: PatchHistory;

  beforeEach(() => {
    history = new PatchHistory(100);
  });

  it('should add an entry and update currentIndex', () => {
    history.push(makeEntry('1'));
    const state = history.getState();
    expect(state.canUndo).toBe(true);
    expect(state.canRedo).toBe(false);
    expect(state.currentIndex).toBe(0);
    expect(state.totalEntries).toBe(1);
  });

  it('should add multiple entries in order', () => {
    history.push(makeEntry('1'));
    history.push(makeEntry('2'));
    history.push(makeEntry('3'));
    const state = history.getState();
    expect(state.totalEntries).toBe(3);
    expect(state.currentIndex).toBe(2);
  });

  it('should discard redo history when pushing after undo', () => {
    history.push(makeEntry('1'));
    history.push(makeEntry('2'));
    history.undo(); // Now at index 0
    // Pushing should discard entries after current index
    history.push(makeEntry('3'));
    const state = history.getState();
    expect(state.totalEntries).toBe(2); // Entry '2' was discarded
    expect(state.currentIndex).toBe(1);
    expect(state.canRedo).toBe(false);
  });

  it('should respect maxEntries limit', () => {
    const smallHistory = new PatchHistory(3);
    smallHistory.push(makeEntry('1'));
    smallHistory.push(makeEntry('2'));
    smallHistory.push(makeEntry('3'));
    smallHistory.push(makeEntry('4')); // Should evict entry 1
    const state = smallHistory.getState();
    expect(state.totalEntries).toBe(3);
    // After eviction, currentIndex adjusts
    expect(state.canUndo).toBe(true);
  });

  it('should add entry with custom timestamp', () => {
    const customTime = 1000000;
    history.push({ ...makeEntry('1'), timestamp: customTime });
    const entry = history.getEntry(0);
    expect(entry!.timestamp).toBe(customTime);
  });

  it('should auto-generate timestamp when not provided', () => {
    const before = Date.now();
    history.push(makeEntry('1'));
    const after = Date.now();
    const entry = history.getEntry(0);
    expect(entry!.timestamp).toBeGreaterThanOrEqual(before);
    expect(entry!.timestamp).toBeLessThanOrEqual(after);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. UNDO — Apply inverse patches
// ═══════════════════════════════════════════════════════════════════

describe('PatchHistory — undo()', () => {
  let history: PatchHistory;

  beforeEach(() => {
    history = new PatchHistory(100);
  });

  it('should return inverse patches for the current entry', () => {
    history.push(makeEntry('1', 'new-value', 'old-value'));
    const inversePatches = history.undo();
    expect(inversePatches).not.toBeNull();
    expect(inversePatches!.length).toBe(1);
    expect(inversePatches![0].value).toBe('old-value');
  });

  it('should decrement currentIndex', () => {
    history.push(makeEntry('1'));
    history.push(makeEntry('2'));
    expect(history.getState().currentIndex).toBe(1);
    history.undo();
    expect(history.getState().currentIndex).toBe(0);
  });

  it('should update canUndo/canRedo flags after undo', () => {
    history.push(makeEntry('1'));
    history.push(makeEntry('2'));
    history.undo();
    const state = history.getState();
    expect(state.canUndo).toBe(true); // Can still undo to before entry 1
    expect(state.canRedo).toBe(true); // Can redo entry 2
  });

  it('should return null when no undo is available', () => {
    const result = history.undo();
    expect(result).toBeNull();
  });

  it('should return null when at the beginning of history', () => {
    history.push(makeEntry('1'));
    history.undo(); // Now at -1
    const result = history.undo(); // No more to undo
    expect(result).toBeNull();
  });

  it('should allow multiple undos', () => {
    history.push(makeEntry('1'));
    history.push(makeEntry('2'));
    history.push(makeEntry('3'));

    const inv3 = history.undo();
    expect(inv3).not.toBeNull();
    expect(history.getState().currentIndex).toBe(1);

    const inv2 = history.undo();
    expect(inv2).not.toBeNull();
    expect(history.getState().currentIndex).toBe(0);

    const inv1 = history.undo();
    expect(inv1).not.toBeNull();
    expect(history.getState().currentIndex).toBe(-1);
    expect(history.getState().canUndo).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. REDO — Re-apply forward patches
// ═══════════════════════════════════════════════════════════════════

describe('PatchHistory — redo()', () => {
  let history: PatchHistory;

  beforeEach(() => {
    history = new PatchHistory(100);
  });

  it('should return forward patches for the next entry', () => {
    history.push(makeEntry('1', 'new-value', 'old-value'));
    history.undo(); // Now at -1
    const forwardPatches = history.redo();
    expect(forwardPatches).not.toBeNull();
    expect(forwardPatches!.length).toBe(1);
    expect(forwardPatches![0].value).toBe('new-value');
  });

  it('should increment currentIndex', () => {
    history.push(makeEntry('1'));
    history.push(makeEntry('2'));
    history.undo(); // Index: 0
    history.redo(); // Index: 1
    expect(history.getState().currentIndex).toBe(1);
  });

  it('should return null when no redo is available', () => {
    const result = history.redo();
    expect(result).toBeNull();
  });

  it('should return null when at the end of history', () => {
    history.push(makeEntry('1'));
    const result = history.redo();
    expect(result).toBeNull();
  });

  it('should allow multiple redos after multiple undos', () => {
    history.push(makeEntry('1'));
    history.push(makeEntry('2'));
    history.push(makeEntry('3'));

    history.undo(); // Index: 1
    history.undo(); // Index: 0
    history.undo(); // Index: -1

    const fwd1 = history.redo(); // Index: 0
    expect(fwd1).not.toBeNull();
    expect(history.getState().currentIndex).toBe(0);

    const fwd2 = history.redo(); // Index: 1
    expect(fwd2).not.toBeNull();
    expect(history.getState().currentIndex).toBe(1);

    const fwd3 = history.redo(); // Index: 2
    expect(fwd3).not.toBeNull();
    expect(history.getState().currentIndex).toBe(2);
    expect(history.getState().canRedo).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. CAN UNDO / CAN REDO — Flag updates
// ═══════════════════════════════════════════════════════════════════

describe('PatchHistory — canUndo/canRedo flags', () => {
  let history: PatchHistory;

  beforeEach(() => {
    history = new PatchHistory(100);
  });

  it('should have canUndo=false and canRedo=false when empty', () => {
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
  });

  it('should have canUndo=true and canRedo=false after push', () => {
    history.push(makeEntry('1'));
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);
  });

  it('should have canUndo=false and canRedo=true after full undo', () => {
    history.push(makeEntry('1'));
    history.undo();
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(true);
  });

  it('should have canUndo=true and canRedo=true in middle of history', () => {
    history.push(makeEntry('1'));
    history.push(makeEntry('2'));
    history.push(makeEntry('3'));
    history.undo(); // At index 1
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(true);
  });

  it('should update flags correctly through undo/redo cycle', () => {
    history.push(makeEntry('1'));
    // [1] index=0, canUndo=true, canRedo=false
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);

    history.undo();
    // [] index=-1, canUndo=false, canRedo=true
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(true);

    history.redo();
    // [1] index=0, canUndo=true, canRedo=false
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 5. REPLACE ENTRY — Coalescing support
// ═══════════════════════════════════════════════════════════════════

describe('PatchHistory — replaceEntry()', () => {
  let history: PatchHistory;

  beforeEach(() => {
    history = new PatchHistory(100);
  });

  it('should replace the current entry', () => {
    history.push(makeEntry('1', 'original', 'old'));
    const newEntry = makeEntry('1', 'coalesced', 'oldest');
    history.replaceEntry(0, newEntry);

    const entry = history.getEntry(0);
    expect(entry!.patches[0].value).toBe('coalesced');
    expect(entry!.inversePatches[0].value).toBe('oldest');
  });

  it('should NOT replace a non-current entry', () => {
    history.push(makeEntry('1', 'first', 'old1'));
    history.push(makeEntry('2', 'second', 'old2'));
    // Current index is 1, trying to replace index 0 should be no-op
    history.replaceEntry(0, makeEntry('1', 'hacked', 'hacked'));

    const entry = history.getEntry(0);
    expect(entry!.patches[0].value).toBe('first'); // Unchanged
  });

  it('should NOT replace an out-of-bounds index', () => {
    history.push(makeEntry('1'));
    history.replaceEntry(-1, makeEntry('1', 'bad', 'bad'));
    history.replaceEntry(99, makeEntry('1', 'bad', 'bad'));
    const entry = history.getEntry(0);
    expect(entry!.patches[0].value).toBe('forward-1'); // Unchanged
  });

  it('should notify listeners after replace', () => {
    let notifyCount = 0;
    history.subscribe(() => { notifyCount++; });
    history.push(makeEntry('1'));
    const beforeReplace = notifyCount;
    history.replaceEntry(0, makeEntry('1', 'new', 'old'));
    expect(notifyCount).toBeGreaterThan(beforeReplace);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 6. CLEAR — Reset history
// ═══════════════════════════════════════════════════════════════════

describe('PatchHistory — clear()', () => {
  it('should reset all history state', () => {
    const history = new PatchHistory(100);
    history.push(makeEntry('1'));
    history.push(makeEntry('2'));
    history.push(makeEntry('3'));

    history.clear();

    const state = history.getState();
    expect(state.canUndo).toBe(false);
    expect(state.canRedo).toBe(false);
    expect(state.currentIndex).toBe(-1);
    expect(state.totalEntries).toBe(0);
  });

  it('should make undo/redo return null after clear', () => {
    const history = new PatchHistory(100);
    history.push(makeEntry('1'));
    history.clear();
    expect(history.undo()).toBeNull();
    expect(history.redo()).toBeNull();
  });

  it('should allow new pushes after clear', () => {
    const history = new PatchHistory(100);
    history.push(makeEntry('1'));
    history.clear();
    history.push(makeEntry('2'));
    expect(history.getState().totalEntries).toBe(1);
    expect(history.canUndo()).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 7. UNDO STATE / REDO STATE — Apply patches to state objects
// ═══════════════════════════════════════════════════════════════════

describe('PatchHistory — undoState/redoState', () => {
  it('should apply inverse patches to state via undoState', () => {
    const history = new PatchHistory(100);
    history.push({
      patches: [{ op: 'replace' as const, path: ['title'], value: 'New Title' }],
      inversePatches: [{ op: 'replace' as const, path: ['title'], value: 'Old Title' }],
      description: 'Change title',
    });

    const state = { title: 'New Title', body: 'Hello' };
    const undone = history.undoState(state);
    expect(undone).not.toBeNull();
    expect(undone!.title).toBe('Old Title');
    expect(undone!.body).toBe('Hello'); // Unchanged
  });

  it('should apply forward patches to state via redoState', () => {
    const history = new PatchHistory(100);
    history.push({
      patches: [{ op: 'replace' as const, path: ['title'], value: 'New Title' }],
      inversePatches: [{ op: 'replace' as const, path: ['title'], value: 'Old Title' }],
      description: 'Change title',
    });
    history.undo();

    const state = { title: 'Old Title', body: 'Hello' };
    const redone = history.redoState(state);
    expect(redone).not.toBeNull();
    expect(redone!.title).toBe('New Title');
    expect(redone!.body).toBe('Hello');
  });

  it('should return null for undoState when no undo available', () => {
    const history = new PatchHistory(100);
    const state = { title: 'Hello' };
    expect(history.undoState(state)).toBeNull();
  });

  it('should return null for redoState when no redo available', () => {
    const history = new PatchHistory(100);
    history.push(makeEntry('1'));
    const state = { title: 'Hello' };
    expect(history.redoState(state)).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════
// 8. JUMP TO — Time travel
// ═══════════════════════════════════════════════════════════════════

describe('PatchHistory — jumpTo()', () => {
  let history: PatchHistory;

  beforeEach(() => {
    history = new PatchHistory(100);
    history.push(makeEntry('1', 'v1', 'v0'));
    history.push(makeEntry('2', 'v2', 'v1'));
    history.push(makeEntry('3', 'v3', 'v2'));
  });

  it('should jump backward and return collected inverse patches', () => {
    const result = history.jumpTo(0); // From index 2 to 0
    expect(result).not.toBeNull();
    expect(result!.patches.length).toBeGreaterThan(0); // Inverse patches
    expect(history.getState().currentIndex).toBe(0);
  });

  it('should jump forward and return collected forward patches', () => {
    history.undo(); // Index: 1
    history.undo(); // Index: 0
    const result = history.jumpTo(2); // From index 0 to 2
    expect(result).not.toBeNull();
    expect(result!.patches.length).toBeGreaterThan(0); // Forward patches
    expect(history.getState().currentIndex).toBe(2);
  });

  it('should return null for invalid target index', () => {
    expect(history.jumpTo(-2)).toBeNull();
    expect(history.jumpTo(100)).toBeNull();
  });

  it('should return null when target equals current index', () => {
    expect(history.jumpTo(2)).toBeNull(); // Already at index 2
  });

  it('should jump to -1 (beginning)', () => {
    const result = history.jumpTo(-1);
    expect(result).not.toBeNull();
    expect(history.getState().currentIndex).toBe(-1);
    expect(history.canUndo()).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 9. SUBSCRIBE — Listener notification
// ═══════════════════════════════════════════════════════════════════

describe('PatchHistory — subscribe()', () => {
  it('should notify listeners on push', () => {
    const history = new PatchHistory(100);
    let count = 0;
    history.subscribe(() => { count++; });
    history.push(makeEntry('1'));
    expect(count).toBe(1);
  });

  it('should notify listeners on undo', () => {
    const history = new PatchHistory(100);
    let count = 0;
    history.push(makeEntry('1'));
    history.subscribe(() => { count++; });
    history.undo();
    expect(count).toBe(1);
  });

  it('should notify listeners on redo', () => {
    const history = new PatchHistory(100);
    history.push(makeEntry('1'));
    history.undo();
    let count = 0;
    history.subscribe(() => { count++; });
    history.redo();
    expect(count).toBe(1);
  });

  it('should allow unsubscribing', () => {
    const history = new PatchHistory(100);
    let count = 0;
    const unsub = history.subscribe(() => { count++; });
    unsub();
    history.push(makeEntry('1'));
    expect(count).toBe(0);
  });

  it('should support multiple listeners', () => {
    const history = new PatchHistory(100);
    let count1 = 0, count2 = 0;
    history.subscribe(() => { count1++; });
    history.subscribe(() => { count2++; });
    history.push(makeEntry('1'));
    expect(count1).toBe(1);
    expect(count2).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 10. PEEK UNDO/REDO PAGE INDEX
// ═══════════════════════════════════════════════════════════════════

describe('PatchHistory — peekUndoPageIndex/peekRedoPageIndex', () => {
  it('should return pageIndex of next undo entry', () => {
    const history = new PatchHistory(100);
    history.push({ ...makeEntry('1'), pageIndex: 2 });
    expect(history.peekUndoPageIndex()).toBe(2);
  });

  it('should return undefined when no undo available', () => {
    const history = new PatchHistory(100);
    expect(history.peekUndoPageIndex()).toBeUndefined();
  });

  it('should return pageIndex of next redo entry', () => {
    const history = new PatchHistory(100);
    history.push({ ...makeEntry('1'), pageIndex: 3 });
    history.undo();
    expect(history.peekRedoPageIndex()).toBe(3);
  });

  it('should return undefined when no redo available', () => {
    const history = new PatchHistory(100);
    expect(history.peekRedoPageIndex()).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// 11. BATCH PUSH
// ═══════════════════════════════════════════════════════════════════

describe('PatchHistory — pushBatch()', () => {
  it('should combine multiple entries into a single history entry', () => {
    const history = new PatchHistory(100);
    history.pushBatch([
      {
        patches: [{ op: 'replace' as const, path: ['title'], value: 'A' }],
        inversePatches: [{ op: 'replace' as const, path: ['title'], value: 'old' }],
      },
      {
        patches: [{ op: 'replace' as const, path: ['body'], value: 'B' }],
        inversePatches: [{ op: 'replace' as const, path: ['body'], value: 'old-body' }],
      },
    ], 'Batch edit');

    const state = history.getState();
    expect(state.totalEntries).toBe(1);
    expect(state.canUndo).toBe(true);

    const entry = history.getEntry(0);
    expect(entry!.patches.length).toBe(2); // Combined
    expect(entry!.description).toBe('Batch edit');
  });
});
