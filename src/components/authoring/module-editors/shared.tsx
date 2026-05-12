'use client';

// ── Shared constants ──────────────────────────────────────────
export const INPUT_CLS =
  'w-full bg-app-elevated border border-app-border rounded-lg px-3 py-2 text-sm text-app-primary placeholder:text-app-muted focus:outline-none focus:ring-2 focus:ring-app-accent/50 focus:border-app-accent/50 transition-colors';
export const TEXTAREA_CLS = INPUT_CLS + ' resize-none';
export const SELECT_CLS = INPUT_CLS;

// ── Shared UI components ──────────────────────────────────────
export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-app-secondary mb-1.5">{children}</label>;
}

export function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" className="w-8 h-8 rounded cursor-pointer border border-app-border bg-transparent" value={value || '#3ecfcf'} onChange={(e) => onChange(e.target.value)} />
      <span className="text-xs text-app-muted font-mono">{value}</span>
    </div>
  );
}

export function AddRemoveRow({ onAdd, canRemove, onRemove, addLabel }: { onAdd: () => void; canRemove: boolean; onRemove: () => void; addLabel: string }) {
  return (
    <div className="flex items-center gap-3">
      <button onClick={onAdd} className="text-xs text-app-accent hover:text-app-accent/80 transition-colors">＋ {addLabel}</button>
      {canRemove && (
        <button onClick={onRemove} className="text-xs text-app-muted hover:text-red-400 transition-colors">✕ Hapus</button>
      )}
    </div>
  );
}

// ── Helper types ──────────────────────────────────────────────
export type Fn = (k: string, v: unknown) => void;
export type FnAI = (ak: string, item: Record<string, unknown>) => void;
export type FnRI = (ak: string, ii: number) => void;
export type FnUI = (ak: string, ii: number, k: string, v: unknown) => void;

export interface EdProps {
  mod: Record<string, unknown>;
  uf: Fn;
  ai?: FnAI;
  ri?: FnRI;
  ui?: FnUI;
}
