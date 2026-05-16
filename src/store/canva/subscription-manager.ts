// ═══════════════════════════════════════════════════════════════
// SUBSCRIPTION MANAGER — Centralized Zustand subscription tracking
// ═══════════════════════════════════════════════════════════════
// Singleton that tracks all active Zustand store subscriptions.
// Ensures that `subscribe()` return values (unsubscribe functions)
// are always properly called on cleanup / page navigation.
//
// Without this, subscriptions created in init.ts or store wiring
// are never cleaned up, causing memory leaks on long sessions.
//
// Usage:
//   const unsub = store.subscribe(selector, callback);
//   subscriptionManager.registerSubscription('auto-save', unsub);
//
//   // Later (on unmount / navigation):
//   subscriptionManager.cleanupAll();
// ═══════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────

interface SubscriptionEntry {
  key: string;
  unsub: () => void;
  registeredAt: number;
}

// ── Singleton ──────────────────────────────────────────────────

class SubscriptionManager {
  private subscriptions: Map<string, SubscriptionEntry> = new Map();

  /**
   * Register a subscription with a unique key.
   * If a subscription with the same key already exists, the old one
   * is unsubscribed first (prevents duplicate subscriptions).
   */
  registerSubscription(key: string, unsub: () => void): void {
    // If already registered with this key, unsubscribe the old one first
    if (this.subscriptions.has(key)) {
      const existing = this.subscriptions.get(key)!;
      try {
        existing.unsub();
      } catch (e) {
        console.warn(`[G.4] Error unsubscribing "${key}":`, e);
      }
    }

    this.subscriptions.set(key, {
      key,
      unsub,
      registeredAt: Date.now(),
    });
  }

  /**
   * Unsubscribe and remove a specific subscription by key.
   */
  unregisterSubscription(key: string): void {
    const entry = this.subscriptions.get(key);
    if (!entry) return;

    try {
      entry.unsub();
    } catch (e) {
      console.warn(`[G.4] Error unsubscribing "${key}":`, e);
    }

    this.subscriptions.delete(key);
  }

  /**
   * Unsubscribe ALL registered subscriptions.
   * Call this on component unmount or page navigation.
   */
  cleanupAll(): void {
    const count = this.subscriptions.size;
    for (const [key, entry] of this.subscriptions) {
      try {
        entry.unsub();
      } catch (e) {
        console.warn(`[G.4] Error unsubscribing "${key}" during cleanupAll:`, e);
      }
    }
    this.subscriptions.clear();

    if (count > 0 && typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log(`[G.4] Cleaned up ${count} subscriptions`);
    }
  }

  /**
   * Get list of active subscription keys (for debugging).
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Get the count of active subscriptions.
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Check if a subscription with the given key exists.
   */
  has(key: string): boolean {
    return this.subscriptions.has(key);
  }
}

// Export singleton instance
export const subscriptionManager = new SubscriptionManager();
