import type { Block, BlockIcon } from '../types/block';

/**
 * Safely get the icon from a block, returning a fallback if null.
 */
export function getBlockIconSafe(block: Block): BlockIcon {
  return block.icon ?? { type: 'emoji', value: '📄' };
}

/**
 * Format an icon for HTML output.
 */
export function formatIconHtml(icon: BlockIcon): string {
  switch (icon.type) {
    case 'emoji':
      return icon.value;
    case 'image':
      return `<img src="${icon.value}" class="icon-image" />`;
    case 'svg':
      return icon.value;
    default:
      return '';
  }
}
