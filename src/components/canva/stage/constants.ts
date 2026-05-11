import type { ResizeDir } from '../types';

// ── Module-level constants (avoid re-creation on every render) ──

export const RESIZE_HANDLES: { dir: ResizeDir; style: React.CSSProperties; cursor: string }[] = [
  { dir: 'tl', style: { top: -7, left: -7 }, cursor: 'nwse-resize' },
  { dir: 'tr', style: { top: -7, right: -7 }, cursor: 'nesw-resize' },
  { dir: 'bl', style: { bottom: -7, left: -7 }, cursor: 'nesw-resize' },
  { dir: 'br', style: { bottom: -7, right: -7 }, cursor: 'nwse-resize' },
  { dir: 'tm', style: { top: -7, left: '50%', transform: 'translateX(-50%)' }, cursor: 'ns-resize' },
  { dir: 'bm', style: { bottom: -7, left: '50%', transform: 'translateX(-50%)' }, cursor: 'ns-resize' },
  { dir: 'l', style: { top: '50%', left: -7, transform: 'translateY(-50%)' }, cursor: 'ew-resize' },
  { dir: 'r', style: { top: '50%', right: -7, transform: 'translateY(-50%)' }, cursor: 'ew-resize' },
];

export const ELEMENT_ICON_MAP: Record<string, string> = {
  kuis: '❓', game: '🎮', materi: '📝', modul: '🧩', image: '🖼️',
};

export const ELEMENT_COLOR_MAP: Record<string, string> = {
  kuis: 'rgba(245,200,66,.3)', game: 'rgba(56,217,217,.3)',
  materi: 'rgba(167,139,250,.3)', modul: 'rgba(52,211,153,.3)', image: 'rgba(249,115,22,.3)',
};

export const ELEMENT_TEXT_COLOR_MAP: Record<string, string> = {
  kuis: '#f5c842', game: '#3ecfcf', materi: '#a78bfa', modul: '#34d399', image: '#f97316',
};
