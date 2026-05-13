// ── Simple SVG alignment icons ──────────────────────────────────
// These are lightweight alternatives to lucide-react icons that
// don't exist in the standard set.

export function AlignStartHorizontal({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="2" y1="2" x2="2" y2="14" />
      <rect x="5" y="3" width="9" height="4" rx="1" fill="currentColor" opacity="0.3" />
      <rect x="5" y="9" width="6" height="4" rx="1" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

export function AlignCenterHorizontal({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="8" y1="2" x2="8" y2="14" strokeDasharray="2 2" />
      <rect x="3" y="3" width="10" height="4" rx="1" fill="currentColor" opacity="0.3" />
      <rect x="4" y="9" width="8" height="4" rx="1" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

export function AlignEndHorizontal({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="14" y1="2" x2="14" y2="14" />
      <rect x="2" y="3" width="9" height="4" rx="1" fill="currentColor" opacity="0.3" />
      <rect x="5" y="9" width="6" height="4" rx="1" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

export function AlignStartVertical({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="2" y1="2" x2="14" y2="2" />
      <rect x="3" y="5" width="4" height="9" rx="1" fill="currentColor" opacity="0.3" />
      <rect x="9" y="5" width="4" height="6" rx="1" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

export function AlignCenterVertical({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="2" y1="8" x2="14" y2="8" strokeDasharray="2 2" />
      <rect x="3" y="3" width="4" height="10" rx="1" fill="currentColor" opacity="0.3" />
      <rect x="9" y="4" width="4" height="8" rx="1" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

export function AlignEndVertical({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="2" y1="14" x2="14" y2="14" />
      <rect x="3" y="2" width="4" height="9" rx="1" fill="currentColor" opacity="0.3" />
      <rect x="9" y="5" width="4" height="6" rx="1" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

export function SpaceHorizontal({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="1" y="4" width="4" height="8" rx="1" fill="currentColor" opacity="0.3" />
      <rect x="6" y="4" width="4" height="8" rx="1" fill="currentColor" opacity="0.3" />
      <rect x="11" y="4" width="4" height="8" rx="1" fill="currentColor" opacity="0.3" />
      <line x1="5.5" y1="8" x2="5.5" y2="8" stroke="currentColor" strokeWidth="2" />
      <line x1="10.5" y1="8" x2="10.5" y2="8" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function SpaceVertical({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="4" y="1" width="8" height="4" rx="1" fill="currentColor" opacity="0.3" />
      <rect x="4" y="6" width="8" height="4" rx="1" fill="currentColor" opacity="0.3" />
      <rect x="4" y="11" width="8" height="4" rx="1" fill="currentColor" opacity="0.3" />
      <line x1="8" y1="5.5" x2="8" y2="5.5" stroke="currentColor" strokeWidth="2" />
      <line x1="8" y1="10.5" x2="8" y2="10.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
