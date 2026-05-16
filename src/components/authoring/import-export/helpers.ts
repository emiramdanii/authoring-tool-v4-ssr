import type { WorkSheet } from 'xlsx';
import { SHEET_NAMES } from './constants';

// ── Helper: convert sheet to array of arrays ────────────────────
// NOTE: XLSX is loaded dynamically via getXLSX() in the caller.
// We accept the already-loaded module to avoid re-importing.
export function sheetToAoa(XLSX: typeof import('xlsx'), sheet: WorkSheet): string[][] {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const rows: string[][] = [];
  for (let r = range.s.r; r <= range.e.r; r++) {
    const row: string[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[addr];
      row.push(cell?.v != null ? String(cell.v) : '');
    }
    rows.push(row);
  }
  return rows;
}

// ── Helper: normalize sheet name (case-insensitive, trim) ──────
export function normalizeSheetName(name: string): string {
  const upper = name.toUpperCase().trim();
  for (const sn of SHEET_NAMES) {
    if (upper === sn || upper === sn.replace(/\s/g, '')) return sn;
  }
  return name;
}

// ── Count rows for badge ──────────────────────────────────────
export function getRowCount(
  previewSheets: { name: string; rows: string[][] }[],
  sheetName: string,
): number {
  const sheet = previewSheets.find((s) => s.name === sheetName);
  if (!sheet) return 0;
  return sheet.rows.filter((r) => r.some((c) => c.trim() !== '')).length;
}
