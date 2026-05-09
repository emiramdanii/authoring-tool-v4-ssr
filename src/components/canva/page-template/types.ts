import type { CanvaPage, ColorPalette } from '../types';

// ═══════════════════════════════════════════════════════════════
// TYPES — Page Template system
// ═══════════════════════════════════════════════════════════════

export interface PageTemplateProps {
  page: CanvaPage;
  isSelected: boolean;
  onEditField?: (key: string, value: string) => void; // undefined = frozen/non-interactive
  interactive?: boolean; // When true, widgets are playable with score tracking
}

export interface SubTemplateProps {
  td: Record<string, unknown>;
  palette: ColorPalette | null;
  isSelected: boolean;
  onEditField?: (key: string, value: string) => void; // undefined = frozen/non-interactive
  interactive?: boolean;
  variant?: 'A' | 'B' | 'C'; // Phase 3: Template layout variant
}
