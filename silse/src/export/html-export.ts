import type { Block, PageBlock } from '../types/block';
import { getBlockDefinition } from '../blocks/registry';
import { renderCoverBlock } from '../components/CoverRenderer';
import { buildHtmlTemplate } from './html-template';

export interface ExportOptions {
  title: string;
  includeStyles: boolean;
  embedImages: boolean;
}

export function exportPageToHtml(page: PageBlock, options: ExportOptions): string {
  const bodyParts: string[] = [];

  for (const block of page.children ?? []) {
    bodyParts.push(renderBlock(block));
  }

  return buildHtmlTemplate(options.title, bodyParts.join('\n'));
}

function renderBlock(block: Block): string {
  // Special handling for cover blocks at the top level
  if (block.type === 'cover') {
    return renderCoverBlock(block as any);
  }

  const definition = getBlockDefinition(block.type);
  if (!definition) {
    return `<!-- unknown block type: ${block.type} -->`;
  }

  return definition.render(block);
}
