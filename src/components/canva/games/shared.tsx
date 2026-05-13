'use client';

/* ═══════════════════════════════════════════════════════════════
   SHARED GAME COMPONENTS & TYPES
   ═══════════════════════════════════════════════════════════════ */

export interface GameComponentProps {
  data: Record<string, unknown>;
  compact: boolean;
  interactive?: boolean;
  onComplete?: (score: number, maxScore: number) => void;
}

/* ═══════════════════════════════════════════════════════════════
   EMPTY STATE helper
   ═══════════════════════════════════════════════════════════════ */
export function EmptyState({ icon, label, compact, interactive }: { icon: string; label: string; compact: boolean; interactive?: boolean }) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-cyan-500/10 p-3">
      <span className={compact ? 'text-xl' : 'text-2xl'}>{icon}</span>
      <span className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-cyan-300/70 mt-1`}>
        {label}
      </span>
      {!interactive && (
        <span className="text-[8px] text-cyan-400/50 mt-0.5">
          Tambahkan data di panel Konten
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GENERIC FALLBACK for other module types
   ═══════════════════════════════════════════════════════════════ */
export function GenericGameWidget({ data, compact }: { data: Record<string, unknown>; compact: boolean }) {
  const type = (data.type as string) || 'modul';
  const title = (data.title as string) || type;

  const typeLabels: Record<string, { icon: string; label: string }> = {
    'hero': { icon: '🖼️', label: 'Hero Banner' },
    'kutipan': { icon: '💬', label: 'Kutipan' },
    'langkah': { icon: '👣', label: 'Langkah' },
    'accordion': { icon: '🗂️', label: 'Accordion' },
    'statistik': { icon: '📊', label: 'Statistik' },
    'polling': { icon: '🗳️', label: 'Polling' },
    'embed': { icon: '🔗', label: 'Embed' },
    'tab-icons': { icon: '📑', label: 'Tab Interaktif' },
    'icon-explore': { icon: '🔍', label: 'Eksplorasi Ikon' },
    'comparison': { icon: '⚖️', label: 'Perbandingan' },
    'card-showcase': { icon: '🃏', label: 'Card Showcase' },
    'hotspot-image': { icon: '🗺️', label: 'Hotspot Image' },
    'infografis': { icon: '📊', label: 'Infografis' },
    'studi-kasus': { icon: '📰', label: 'Studi Kasus' },
    'debat': { icon: '🗣️', label: 'Debat' },
    'timeline': { icon: '📅', label: 'Timeline' },
    'video': { icon: '🎥', label: 'Video' },
    'skenario': { icon: '🎭', label: 'Skenario' },
    'materi': { icon: '📖', label: 'Materi Teks' },
  };

  const info = typeLabels[type] || { icon: '🧩', label: type };
  const displayTitle = title || info.label;

  return (
    <div className="h-full flex flex-col items-center justify-center bg-cyan-500/10 p-2 text-center">
      <span className={compact ? 'text-xl' : 'text-2xl'}>{info.icon}</span>
      <span className={`${compact ? 'text-[9px]' : 'text-[10px]'} font-bold text-cyan-300 mt-1`}>{displayTitle}</span>
      {!compact && (
        <span className="text-[8px] text-cyan-400/50 mt-0.5">
          Modul ini ditampilkan di Preview
        </span>
      )}
    </div>
  );
}
