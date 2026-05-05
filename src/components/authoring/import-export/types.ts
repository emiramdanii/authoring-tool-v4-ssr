// ── Types for parsed Excel data ──────────────────────────────────

export interface SheetPreview {
  name: string;
  headers: string[];
  rows: string[][];
}
