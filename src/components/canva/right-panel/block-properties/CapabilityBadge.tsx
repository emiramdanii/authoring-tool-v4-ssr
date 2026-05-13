/** Simple presentational badge for block capabilities */
export function CapabilityBadge({ label, value }: { label: string; value: boolean }) {
  return (
    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] ${
      value
        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
        : 'bg-app-elevated/40 text-app-muted border border-app-border/10'
    }`}>
      <span>{value ? '✓' : '✕'}</span>
      <span>{label}</span>
    </div>
  );
}
