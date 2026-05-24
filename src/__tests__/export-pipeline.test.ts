// ═══════════════════════════════════════════════════════════════════════
// EXPORT PIPELINE TESTS — Block renderers, quiz renderers, navigation
// renderers, utility functions, and renderer dispatch chain
// ═══════════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { renderContentBlock, renderGenericBlock } from '@/lib/export/block-renderers';
import { renderQuizBlock } from '@/lib/export/quiz-renderers';
import { renderNavigationBlock } from '@/lib/export/navigation-renderers';
import { renderGameBlock } from '@/lib/export/game-renderers';
import { escapeHtml, resolveColor } from '@/lib/export/utils';

// A no-op renderBlock callback for unit tests that don't exercise recursion
const noopRender = (() => '') as unknown as import('@/lib/export/utils').RenderBlockFn;

// ═══════════════════════════════════════════════════════════════════════
// 1. renderContentBlock() — Block renderer dispatch
// ═══════════════════════════════════════════════════════════════════════

describe('renderContentBlock() — Block renderer dispatch', () => {
  it('returns null for "kuis" (no longer handled here)', () => {
    const result = renderContentBlock('kuis', { title: 'Quiz' }, noopRender);
    expect(result).toBeNull();
  });

  it('returns null for "alur" (falls through to navigation)', () => {
    const result = renderContentBlock('alur', { title: 'Alur' }, noopRender);
    expect(result).toBeNull();
  });

  it('returns null for "skenario" (falls through to navigation)', () => {
    const result = renderContentBlock('skenario', { title: 'Skenario' }, noopRender);
    expect(result).toBeNull();
  });

  it('renders cover block with title', () => {
    const result = renderContentBlock('cover', { title: 'Test Cover' }, noopRender);
    expect(result).not.toBeNull();
    expect(result).toContain('Test Cover');
  });

  it('renders def-box block with content', () => {
    const result = renderContentBlock('def-box', { content: 'Hello World' }, noopRender);
    expect(result).not.toBeNull();
    expect(result).toContain('Hello World');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 2. renderQuizBlock() — Quiz renderer dispatch
// ═══════════════════════════════════════════════════════════════════════

describe('renderQuizBlock() — Quiz renderer dispatch', () => {
  it('renders kuis block with title', () => {
    const result = renderQuizBlock(
      'kuis',
      {
        title: 'Quiz 1',
        questions: [
          { q: 'What is 2+2?', opts: ['3', '4', '5'], ans: 1, ex: 'Basic math' },
        ],
      },
      noopRender,
    );
    expect(result).not.toBeNull();
    expect(result).toContain('Quiz 1');
  });

  it('renders true-false-game block (returns non-null)', () => {
    const result = renderQuizBlock(
      'true-false-game',
      {
        title: 'True or False',
        questions: [
          { text: 'The sky is blue', correct: true, explanation: 'Yes it is' },
        ],
      },
      noopRender,
    );
    expect(result).not.toBeNull();
  });

  it('renders fill-blank-game block (returns non-null)', () => {
    const result = renderQuizBlock(
      'fill-blank-game',
      {
        title: 'Fill the Blank',
        questions: [
          { text: 'The capital of France is ___', answer: 'Paris', hint: 'City of Light' },
        ],
      },
      noopRender,
    );
    expect(result).not.toBeNull();
  });

  it('returns null for unknown quiz type', () => {
    const result = renderQuizBlock('unknown-quiz', {}, noopRender);
    expect(result).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 3. renderNavigationBlock() — Navigation renderer dispatch
// ═══════════════════════════════════════════════════════════════════════

describe('renderNavigationBlock() — Navigation renderer dispatch', () => {
  it('renders alur block with title', () => {
    const result = renderNavigationBlock(
      'alur',
      {
        title: 'Alur Test',
        steps: [
          { dot: 'y', durasi: '5 min', judul: 'Step 1', deskripsi: 'First step' },
        ],
      },
      noopRender,
    );
    expect(result).not.toBeNull();
    expect(result).toContain('Alur Test');
  });

  it('renders skenario block with title', () => {
    const result = renderNavigationBlock(
      'skenario',
      {
        title: 'Skenario Test',
        chapters: [
          { title: 'Chapter 1', charEmoji: '🧑', setup: [], choices: [] },
        ],
      },
      noopRender,
    );
    expect(result).not.toBeNull();
    expect(result).toContain('Skenario Test');
  });

  it('returns null for unknown navigation type', () => {
    const result = renderNavigationBlock('unknown-nav', {}, noopRender);
    expect(result).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 4. escapeHtml() — XSS protection
// ═══════════════════════════════════════════════════════════════════════

describe('escapeHtml() — XSS protection', () => {
  it('strips script tags from output', () => {
    const result = escapeHtml('<script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('</script>');
  });

  it('escapes ampersands', () => {
    const result = escapeHtml('Hello & World');
    expect(result).toContain('&amp;');
    expect(result).not.toContain(' & ');
  });

  it('escapes double quotes', () => {
    const result = escapeHtml('"quoted"');
    expect(result).toContain('&quot;');
    expect(result).not.toContain('"quoted"');
  });

  it('escapes angle brackets', () => {
    const result = escapeHtml('<div>');
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });

  it('returns empty string for empty input', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('leaves safe content unchanged', () => {
    const safe = 'Hello World 123';
    expect(escapeHtml(safe)).toBe(safe);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 5. resolveColor() — Color resolution
// ═══════════════════════════════════════════════════════════════════════

describe('resolveColor() — Color resolution', () => {
  it('resolves "y" token to a valid color string', () => {
    const result = resolveColor('y', '#000');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    // Should NOT return the fallback
    expect(result).not.toBe('#000');
  });

  it('returns fallback when token is undefined', () => {
    const result = resolveColor(undefined, '#000');
    expect(result).toBe('#000');
  });

  it('returns hex color as-is when it starts with #', () => {
    const result = resolveColor('#ff5500', '#000');
    expect(result).toBe('#ff5500');
  });

  it('returns rgb color as-is when it starts with rgb', () => {
    const result = resolveColor('rgb(255, 0, 0)', '#000');
    expect(result).toBe('rgb(255, 0, 0)');
  });

  it('returns fallback for unknown token', () => {
    const result = resolveColor('nonexistent-token', '#fallback');
    expect(result).toBe('#fallback');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 6. Renderer dispatch chain (integration)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Recreate the dispatch chain from html-templates.ts renderBlockHtml.
 * Chains: content → navigation → quiz → game → generic fallback
 */
function renderBlockHtml(block: Record<string, unknown>): string {
  const type = block.type as string;
  const renderBlock = (b: import('@/core/schema/types').SchemaBlock) =>
    renderBlockHtml(b as unknown as Record<string, unknown>);

  return (
    renderContentBlock(type, block, renderBlock) ??
    renderNavigationBlock(type, block, renderBlock) ??
    renderQuizBlock(type, block, renderBlock) ??
    renderGameBlock(type, block, renderBlock) ??
    renderGenericBlock(block)
  );
}

describe('Renderer dispatch chain (integration)', () => {
  it('kuis block is rendered by quiz-renderers with quiz-specific CSS classes', () => {
    const html = renderBlockHtml({
      type: 'kuis',
      title: 'Integration Quiz',
      questions: [
        { q: 'What?', opts: ['A', 'B', 'C'], ans: 0, ex: 'Because' },
      ],
    });
    // Quiz-specific CSS classes from quiz-renderers
    expect(html).toContain('q-opt');
    expect(html).toContain('q-text');
    expect(html).toContain('Integration Quiz');
  });

  it('cover block is rendered by content renderers', () => {
    const html = renderBlockHtml({
      type: 'cover',
      title: 'My Cover',
    });
    expect(html).toContain('My Cover');
    expect(html).toContain('cover-block');
  });

  it('unknown block type falls through to generic fallback', () => {
    const html = renderBlockHtml({
      type: 'totally-unknown-block-type',
      title: 'Mystery Block',
      content: 'Some content',
    });
    expect(html).toContain('generic-block');
    expect(html).toContain('Mystery Block');
  });

  it('alur block is rendered by navigation renderers', () => {
    const html = renderBlockHtml({
      type: 'alur',
      title: 'My Alur',
      steps: [
        { dot: 'c', durasi: '10 min', judul: 'Step A', deskripsi: 'Desc A' },
      ],
    });
    expect(html).toContain('My Alur');
    expect(html).toContain('alur-block');
  });

  it('sortir-game block is rendered by game renderers', () => {
    const html = renderBlockHtml({
      type: 'sortir-game',
      title: 'Sort It',
      pool: [{ id: '1', text: 'Item 1', category: 'A' }],
      kolom: [{ id: 'A', label: 'Category A', color: 'y' }],
    });
    expect(html).toContain('Sort It');
    expect(html).toContain('sortir-block');
  });
});
