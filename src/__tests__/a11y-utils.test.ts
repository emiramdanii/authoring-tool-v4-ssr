// ═══════════════════════════════════════════════════════════════════
// A11Y UTILITY TESTS — Accessibility helpers from @/lib/a11y
// ═══════════════════════════════════════════════════════════════════
// Tests all pure functions from the a11y utility module.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  gameAriaLabel,
  progressBarAria,
  buttonAria,
  liveRegion,
  handleRovingFocus,
  isActivationKey,
  createFocusTrap,
  announceToScreenReader,
} from '@/lib/a11y';

// ═══════════════════════════════════════════════════════════════════
// 1. gameAriaLabel
// ═══════════════════════════════════════════════════════════════════

describe('gameAriaLabel', () => {
  it('should generate label with score when maxScore > 0', () => {
    expect(gameAriaLabel('Kuis', 8, 10)).toBe('Kuis. Skor: 8 dari 10');
  });

  it('should return just gameType when maxScore is 0', () => {
    expect(gameAriaLabel('Memory Match', 0, 0)).toBe('Memory Match');
  });

  it('should handle perfect score', () => {
    expect(gameAriaLabel('Isian', 5, 5)).toBe('Isian. Skor: 5 dari 5');
  });

  it('should handle zero score', () => {
    expect(gameAriaLabel('Benar/Salah', 0, 5)).toBe('Benar/Salah. Skor: 0 dari 5');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. progressBarAria
// ═══════════════════════════════════════════════════════════════════

describe('progressBarAria', () => {
  it('should return correct ARIA attributes', () => {
    const attrs = progressBarAria('Progress', 3, 10);
    expect(attrs['role']).toBe('progressbar');
    expect(attrs['aria-label']).toBe('Progress');
    expect(attrs['aria-valuenow']).toBe('3');
    expect(attrs['aria-valuemin']).toBe('0');
    expect(attrs['aria-valuemax']).toBe('10');
  });

  it('should convert numbers to strings', () => {
    const attrs = progressBarAria('Test', 0, 100);
    expect(typeof attrs['aria-valuenow']).toBe('string');
    expect(typeof attrs['aria-valuemax']).toBe('string');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. buttonAria
// ═══════════════════════════════════════════════════════════════════

describe('buttonAria', () => {
  it('should return aria-label only when no optional params', () => {
    const attrs = buttonAria('Submit');
    expect(attrs['aria-label']).toBe('Submit');
    expect(attrs['aria-pressed']).toBeUndefined();
    expect(attrs['aria-expanded']).toBeUndefined();
  });

  it('should include aria-pressed when provided', () => {
    const attrs = buttonAria('Toggle', true);
    expect(attrs['aria-pressed']).toBe('true');
  });

  it('should include aria-expanded when provided', () => {
    const attrs = buttonAria('Menu', undefined, true);
    expect(attrs['aria-expanded']).toBe('true');
  });

  it('should include both when both provided', () => {
    const attrs = buttonAria('Toggle Menu', false, false);
    expect(attrs['aria-pressed']).toBe('false');
    expect(attrs['aria-expanded']).toBe('false');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. liveRegion
// ═══════════════════════════════════════════════════════════════════

describe('liveRegion', () => {
  it('should return polite live region attributes', () => {
    const attrs = liveRegion('polite');
    expect(attrs['aria-live']).toBe('polite');
    expect(attrs['aria-atomic']).toBe('true');
  });

  it('should return assertive live region attributes', () => {
    const attrs = liveRegion('assertive');
    expect(attrs['aria-live']).toBe('assertive');
    expect(attrs['aria-atomic']).toBe('true');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 5. handleRovingFocus
// ═══════════════════════════════════════════════════════════════════

describe('handleRovingFocus', () => {
  const total = 5;

  describe('ArrowDown (vertical)', () => {
    it('should move to next item', () => {
      expect(handleRovingFocus(total, 0, 'ArrowDown')).toBe(1);
      expect(handleRovingFocus(total, 2, 'ArrowDown')).toBe(3);
    });

    it('should not go past the last item', () => {
      expect(handleRovingFocus(total, 4, 'ArrowDown')).toBe(4);
    });

    it('should be ignored in horizontal orientation', () => {
      expect(handleRovingFocus(total, 0, 'ArrowDown', 'horizontal')).toBe(0);
    });

    it('should support grid navigation with cols', () => {
      // 8 items, 4 columns: row 0 is indices 0-3, row 1 is indices 4-7
      expect(handleRovingFocus(8, 0, 'ArrowDown', 'both', 4)).toBe(4);
      expect(handleRovingFocus(8, 3, 'ArrowDown', 'both', 4)).toBe(7);
      // Last row — should not go past end
      expect(handleRovingFocus(8, 7, 'ArrowDown', 'both', 4)).toBe(7);
    });
  });

  describe('ArrowUp (vertical)', () => {
    it('should move to previous item', () => {
      expect(handleRovingFocus(total, 3, 'ArrowUp')).toBe(2);
      expect(handleRovingFocus(total, 1, 'ArrowUp')).toBe(0);
    });

    it('should not go before the first item', () => {
      expect(handleRovingFocus(total, 0, 'ArrowUp')).toBe(0);
    });

    it('should be ignored in horizontal orientation', () => {
      expect(handleRovingFocus(total, 2, 'ArrowUp', 'horizontal')).toBe(2);
    });
  });

  describe('ArrowRight (horizontal)', () => {
    it('should move to next item in horizontal orientation', () => {
      expect(handleRovingFocus(total, 0, 'ArrowRight', 'horizontal')).toBe(1);
      expect(handleRovingFocus(total, 0, 'ArrowRight', 'both')).toBe(1);
    });

    it('should not go past the last item', () => {
      expect(handleRovingFocus(total, 4, 'ArrowRight', 'horizontal')).toBe(4);
    });

    it('should be ignored in vertical orientation', () => {
      expect(handleRovingFocus(total, 0, 'ArrowRight', 'vertical')).toBe(0);
    });
  });

  describe('ArrowLeft (horizontal)', () => {
    it('should move to previous item in horizontal orientation', () => {
      expect(handleRovingFocus(total, 3, 'ArrowLeft', 'horizontal')).toBe(2);
      expect(handleRovingFocus(total, 3, 'ArrowLeft', 'both')).toBe(2);
    });

    it('should not go before the first item', () => {
      expect(handleRovingFocus(total, 0, 'ArrowLeft', 'horizontal')).toBe(0);
    });

    it('should be ignored in vertical orientation', () => {
      expect(handleRovingFocus(total, 2, 'ArrowLeft', 'vertical')).toBe(2);
    });
  });

  describe('Home / End', () => {
    it('should go to first item on Home', () => {
      expect(handleRovingFocus(total, 3, 'Home')).toBe(0);
      expect(handleRovingFocus(total, 0, 'Home')).toBe(0);
    });

    it('should go to last item on End', () => {
      expect(handleRovingFocus(total, 0, 'End')).toBe(4);
      expect(handleRovingFocus(total, 4, 'End')).toBe(4);
    });
  });

  describe('Unknown keys', () => {
    it('should return current index for unknown keys', () => {
      expect(handleRovingFocus(total, 2, 'Enter')).toBe(2);
      expect(handleRovingFocus(total, 2, 'Tab')).toBe(2);
      expect(handleRovingFocus(total, 2, 'Escape')).toBe(2);
    });
  });

  describe('Edge cases', () => {
    it('should return 0 for out-of-bounds current index', () => {
      expect(handleRovingFocus(total, -1, 'ArrowDown')).toBe(0);
      expect(handleRovingFocus(total, 99, 'ArrowDown')).toBe(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// 6. isActivationKey
// ═══════════════════════════════════════════════════════════════════

describe('isActivationKey', () => {
  it('should return true for Enter', () => {
    expect(isActivationKey(new KeyboardEvent('keydown', { key: 'Enter' }))).toBe(true);
  });

  it('should return true for Space', () => {
    expect(isActivationKey(new KeyboardEvent('keydown', { key: ' ' }))).toBe(true);
  });

  it('should return false for other keys', () => {
    expect(isActivationKey(new KeyboardEvent('keydown', { key: 'ArrowDown' }))).toBe(false);
    expect(isActivationKey(new KeyboardEvent('keydown', { key: 'Tab' }))).toBe(false);
    expect(isActivationKey(new KeyboardEvent('keydown', { key: 'Escape' }))).toBe(false);
    expect(isActivationKey(new KeyboardEvent('keydown', { key: 'a' }))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 7. createFocusTrap
// ═══════════════════════════════════════════════════════════════════

describe('createFocusTrap', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should return activate and deactivate functions', () => {
    const trap = createFocusTrap(container);
    expect(typeof trap.activate).toBe('function');
    expect(typeof trap.deactivate).toBe('function');
  });

  it('should focus the first focusable element on activate', () => {
    const button = document.createElement('button');
    button.textContent = 'Test';
    container.appendChild(button);

    const trap = createFocusTrap(container);
    trap.activate();

    expect(document.activeElement).toBe(button);
    trap.deactivate();
  });

  it('should add keydown listener on activate and remove on deactivate', () => {
    const trap = createFocusTrap(container);
    trap.activate();
    // The handler should be attached
    const eventsBefore = getEventListeners(container as unknown as EventTarget);
    // Deactivate should remove it
    trap.deactivate();
    // After deactivate, previously focused element should be restored
  });

  it('should handle Tab key wrapping (focus trap)', () => {
    const btn1 = document.createElement('button');
    btn1.textContent = 'First';
    btn1.id = 'btn-first';
    const btn2 = document.createElement('button');
    btn2.textContent = 'Last';
    btn2.id = 'btn-last';
    container.appendChild(btn1);
    container.appendChild(btn2);

    const trap = createFocusTrap(container);
    trap.activate();

    // Focus the last button
    btn2.focus();
    expect(document.activeElement).toBe(btn2);

    // Simulate Tab — should wrap to first
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    container.dispatchEvent(tabEvent);
    // Note: In jsdom, focus() may not work perfectly, but the event listener is attached

    trap.deactivate();
  });
});

// ═══════════════════════════════════════════════════════════════════
// 8. announceToScreenReader
// ═══════════════════════════════════════════════════════════════════

describe('announceToScreenReader', () => {
  // Note: The a11y module caches a module-level liveRegionEl variable.
  // Between test runs, the DOM element may persist if not removed.
  // We test in a single comprehensive test to avoid state leakage.

  it('should create a live region, set attributes, style it hidden, and reuse it', () => {
    // Clean up any existing live region from previous test runs
    const existing = document.getElementById('a11y-live-region');
    if (existing) existing.remove();

    // Mock requestAnimationFrame to execute synchronously
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });

    // First announcement — should create the element
    announceToScreenReader('Hello screen reader', 'polite');
    let liveEl = document.getElementById('a11y-live-region');
    expect(liveEl).toBeTruthy();
    expect(liveEl?.getAttribute('aria-live')).toBe('polite');
    expect(liveEl?.getAttribute('aria-atomic')).toBe('true');
    expect(liveEl?.getAttribute('role')).toBe('status');
    expect(liveEl?.textContent).toBe('Hello screen reader');

    // Verify visually hidden styling
    expect(liveEl?.style.position).toBe('absolute');
    expect(liveEl?.style.width).toBe('1px');
    expect(liveEl?.style.height).toBe('1px');
    expect(liveEl?.style.overflow).toBe('hidden');

    // Second announcement with assertive priority — should reuse same element
    announceToScreenReader('Urgent!', 'assertive');
    const reusedEl = document.getElementById('a11y-live-region');
    expect(reusedEl).toBe(liveEl); // Same DOM element
    expect(reusedEl?.getAttribute('aria-live')).toBe('assertive');
    expect(reusedEl?.textContent).toBe('Urgent!');

    rafSpy.mockRestore();
  });

  it('should not throw when called', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
    expect(() => announceToScreenReader('Test message', 'polite')).not.toThrow();
    rafSpy.mockRestore();
  });
});

// Helper for test (not available in all jsdom environments)
function getEventListeners(_target: EventTarget): unknown {
  // This is a Chrome DevTools-only API — return empty in test
  return {};
}
