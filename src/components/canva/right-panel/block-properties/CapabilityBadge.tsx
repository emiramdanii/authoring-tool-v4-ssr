/** Simple presentational badge for block capabilities — stitch v4 style */
export function CapabilityBadge({ label, value }: { label: string; value: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium ${
      value
        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
        : 'bg-surface-container-low text-on-surface-variant border border-outline-variant/30'
    }`}>
      <span className="text-[10px]">{value ? '✓' : '✕'}</span>
      <span>{label}</span>
    </div>
  );
}
