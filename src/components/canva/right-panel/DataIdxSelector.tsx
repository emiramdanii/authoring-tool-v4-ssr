'use client';

import { useAuthoringStore } from '@/store/authoring-store';
import { GAME_TYPES } from '@/lib/canva-constants';
import { GAME_TYPE_ICON_MAP, MODULE_TYPE_ICON_MAP } from '@/lib/canva-icon-maps';

export default function DataIdxSelector({ elementType, currentIdx, onChange }: {
  elementType: string;
  currentIdx: number;
  onChange: (idx: number, stableId?: string) => void;
}) {
  const modules = useAuthoringStore((s) => s.modules);
  const kuis = useAuthoringStore((s) => s.kuis.filter(k => k.q.trim()));

  // Build options based on element type
  let options: { idx: number; label: string; icon: string; stableId?: string }[] = [];

  if (elementType === 'kuis') {
    options = [{ idx: -1, label: `Semua soal (${kuis.length})`, icon: '?' }];
  } else if (elementType === 'game') {
    const gameModules = modules.filter(m => (GAME_TYPES as readonly string[]).includes(m.type as string));
    options = gameModules.map((m) => {
      const mIdx = modules.indexOf(m);
      return { idx: mIdx, label: String(m.title || m.type), icon: GAME_TYPE_ICON_MAP[m.type as string] || '🎮', stableId: (m._id as string) || undefined };
    });
    if (options.length === 0) {
      options = [{ idx: -1, label: 'Belum ada game', icon: '🎮' }];
    }
  } else {
    // modul / materi — show non-game modules
    const materiModules = modules.filter(m => !(GAME_TYPES as readonly string[]).includes(m.type as string));
    options = materiModules.map((m) => {
      const mIdx = modules.indexOf(m);
      return { idx: mIdx, label: String(m.title || m.type), icon: MODULE_TYPE_ICON_MAP[m.type as string] || '🧩', stableId: (m._id as string) || undefined };
    });
    if (options.length === 0) {
      options = [{ idx: -1, label: 'Belum ada modul', icon: '🧩' }];
    }
  }

  return (
    <div className="mb-2">
      <label className="text-[10px] text-app-muted block mb-1">Pilih Data</label>
      <select
        value={currentIdx}
        onChange={e => {
          const idx = parseInt(e.target.value);
          const opt = options.find(o => o.idx === idx);
          onChange(idx, opt?.stableId);
        }}
        className="w-full h-8 px-2 text-[11px] text-app-primary bg-app-elevated/60 border border-app-border/30 rounded-lg focus:border-amber-500/50 focus:outline-none focus-ring"
      >
        {options.map(opt => (
          <option key={opt.idx} value={opt.idx}>
            {opt.icon} {opt.label}
          </option>
        ))}
      </select>
      {currentIdx === -1 && elementType !== 'kuis' && (
        <div className="text-[8px] text-amber-400/60 mt-1">
          Pilih modul spesifik atau tambah data di panel Konten
        </div>
      )}
    </div>
  );
}
