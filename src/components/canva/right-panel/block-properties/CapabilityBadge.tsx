/** Simple presentational badge for block capabilities — SILSE v4 style */
export function CapabilityBadge({ label, value }: { label: string; value: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium ${
      value
        ? 'bg-silse-primary-container/10 text-silse-primary border border-silse-primary-container/20'
        : 'bg-silse-surface-container-low text-silse-on-surface-variant border border-silse-outline-variant/30'
    }`}>
      <span className="text-[10px]">{value ? '✓' : '✕'}</span>
      <span>{label}</span>
    </div>
  );
}
