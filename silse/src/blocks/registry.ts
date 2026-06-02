import type { Block, BlockIcon } from '../types/block';
import { getBlockIconSafe, formatIconHtml } from '../lib/block-utils';

export interface BlockDefinition {
  type: string;
  render: (block: Block) => string;
  getIcon?: (block: Block) => BlockIcon | null;
}

const blockDefinitions: Map<string, BlockDefinition> = new Map();

export function registerBlock(definition: BlockDefinition): void {
  blockDefinitions.set(definition.type, definition);
}

export function getBlockDefinition(type: string): BlockDefinition | undefined {
  return blockDefinitions.get(type);
}

export function resolveBlockIcon(block: Block): BlockIcon | null {
  const definition = getBlockDefinition(block.type);
  if (definition?.getIcon) {
    return definition.getIcon(block);
  }
  // Fall back to the block's own icon property
  return block.icon ?? null;
}

// --- Register built-in blocks ---

registerBlock({
  type: 'page',
  render(block) {
    const icon = getBlockIconSafe(block);
    return `<div class="page"><span class="icon">${formatIconHtml(icon)}</span><h1>${block.properties?.title ?? ''}</h1></div>`;
  },
  getIcon(block) {
    return (block.properties as any)?.icon ?? block.icon ?? null;
  },
});

registerBlock({
  type: 'cover',
  render(block) {
    const icon = getBlockIconSafe(block);
    return `<div class="cover"><span class="cover-icon">${formatIconHtml(icon)}</span></div>`;
  },
  getIcon(block) {
    return (block.properties as any)?.icon ?? block.icon ?? null;
  },
});

registerBlock({
  type: 'text',
  render(block) {
    return `<p>${block.properties?.content ?? ''}</p>`;
  },
});

registerBlock({
  type: 'heading',
  render(block) {
    const icon = getBlockIconSafe(block);
    return `<div class="heading"><span class="heading-icon">${formatIconHtml(icon)}</span><h2>${block.properties?.content ?? ''}</h2></div>`;
  },
  getIcon(block) {
    return block.icon ?? null;
  },
});

registerBlock({
  type: 'image',
  render(block) {
    return `<img src="${block.properties?.src ?? ''}" alt="${block.properties?.alt ?? ''}" />`;
  },
});
