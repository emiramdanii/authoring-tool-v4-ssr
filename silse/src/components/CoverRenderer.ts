import type { CoverBlock } from '../types/block';
import { getBlockIconSafe, formatIconHtml } from '../lib/block-utils';

export function renderCoverIcon(block: CoverBlock): string {
  const icon = getBlockIconSafe(block);
  return `<span class="cover-icon">${formatIconHtml(icon)}</span>`;
}

export function renderCoverTitle(block: CoverBlock): string {
  return `<h1 class="cover-title">${block.properties.title}</h1>`;
}

export function renderCoverSubtitle(block: CoverBlock): string {
  if (!block.properties.subtitle) return '';
  return `<h2 class="cover-subtitle">${block.properties.subtitle}</h2>`;
}

export function renderCoverBackground(block: CoverBlock): string {
  const bg = block.properties.backgroundImage;
  if (!bg) return '';
  return `<div class="cover-bg" style="background-image:url('${bg}')"></div>`;
}

export function renderCoverBlock(block: CoverBlock): string {
  const parts = [
    renderCoverBackground(block),
    renderCoverIcon(block),
    renderCoverTitle(block),
    renderCoverSubtitle(block),
  ];
  return `<section class="cover-block">${parts.join('\n')}</section>`;
}
