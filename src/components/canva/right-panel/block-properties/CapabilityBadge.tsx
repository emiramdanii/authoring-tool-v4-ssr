/** Simple presentational badge for block capabilities */
export function CapabilityBadge({ label, value }: { label: string; value: boolean }) {
  return (
    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] ${
      value
        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
        : 'bg-slate-800/40 text-slate-600 border border-slate-700/10'
    }`}>
      <span>{value ? '✓' : '✕'}</span>
      <span>{label}</span>
    </div>
  );
}
