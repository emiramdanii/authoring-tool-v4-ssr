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
      <span className="text-[10px] text-app-muted w-14">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="flex-1 h-7 px-2 text-[10px] text-app-primary bg-app-elevated border border-app-border rounded-lg focus:border-amber-500/50 focus:outline-none focus-ring"
      />
    </div>
  );
}
