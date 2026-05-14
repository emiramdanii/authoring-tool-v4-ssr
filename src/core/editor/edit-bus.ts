// ═══════════════════════════════════════════════════════════════════
// EDIT EVENT BUS — Central pipeline for edit events
// ═══════════════════════════════════════════════════════════════════
// All edit operations emit events through this bus.
// Enables: debugging, logging, collaboration sync, AI awareness,
// undo/redo at patch level, auto-save triggers.
//
// Architecture:
//   Store action → emit(event) → subscribers → [debug, log, sync, AI]
//
// Usage:
//   import { editBus } from '@/core/editor/edit-bus';
//   editBus.emit({ type: 'patch', patch: { blockId, blockType, pageIndex, patch, timestamp } });
//   editBus.subscribe((event) => console.log('[EditBus]', event));

import type { EditEvent } from './types';
import { logger } from '@/core/utils/logger';

type EditEventHandler = (event: EditEvent) => void;

class EditEventBus {
  private handlers: Set<EditEventHandler> = new Set();
  private enabled: boolean = true;
  private history: EditEvent[] = [];
  private maxHistory: number = 100;

  /** Subscribe to edit events */
  subscribe(handler: EditEventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /** Emit an edit event to all subscribers */
  emit(event: EditEvent): void {
    if (!this.enabled) return;

    // Store in history buffer
    this.history.push(event);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }

    // Notify all subscribers
    for (const handler of this.handlers) {
      try {
        handler(event);
      } catch (err) {
        logger.error('EditBus', err);
      }
    }
  }

  /** Get recent edit history */
  getHistory(limit?: number): EditEvent[] {
    return limit ? this.history.slice(-limit) : [...this.history];
  }

  /** Clear history buffer */
  clearHistory(): void {
    this.history = [];
  }

  /** Enable/disable event bus (useful for batch operations) */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /** Check if bus is enabled */
  isEnabled(): boolean {
    return this.enabled;
  }
}

/** Global singleton edit event bus */
export const editBus = new EditEventBus();
