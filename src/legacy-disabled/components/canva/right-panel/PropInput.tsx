// @ts-nocheck — BATCH-12: quarantined to src/legacy-disabled/, not type-checked
'use client';

export default function PropInput({ label, value, min, max, onChange }: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[10px] text-silse-on-surface-variant w-14">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="flex-1 h-7 px-2 text-[10px] text-silse-on-surface bg-silse-surface-container-low border border-silse-outline-variant rounded-lg focus:border-silse-primary/50 focus:outline-none focus-ring"
      />
    </div>
  );
}
