// @ts-nocheck — BATCH-12: quarantined to src/legacy-disabled/, not type-checked
'use client';

import { useSchemaProjection } from '@/hooks/use-schema-projection';
import { GAME_TYPES } from '@/lib/canva-constants';
import { GAME_TYPE_ICON_MAP, MODULE_TYPE_ICON_MAP } from '@/lib/canva-icon-maps';

export default function DataIdxSelector({ elementType, currentIdx, onChange }: {
  elementType: string;
  currentIdx: number;
  onChange: (idx: number, stableId?: string) => void;
}) {
  const { modules, kuis } = useSchemaProjection();
  const kuisWithText = kuis.filter(k => k.q.trim());

  // Build options based on element type
  let options: { idx: number; label: string; icon: string; stableId?: string }[] = [];

  if (elementType === 'kuis') {
    options = [{ idx: -1, label: `Semua soal (${kuisWithText.length})`, icon: '?' }];
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
      <label className="text-[10px] text-silse-on-surface-variant block mb-1">Pilih Data</label>
      <select
        value={currentIdx}
        onChange={e => {
          const idx = parseInt(e.target.value);
          const opt = options.find(o => o.idx === idx);
          onChange(idx, opt?.stableId);
        }}
        className="w-full h-8 px-2 text-[11px] text-silse-on-surface bg-silse-surface-container-low/60 border border-silse-outline-variant/30 rounded-lg focus:border-silse-primary/50 focus:outline-none focus-ring"
      >
        {options.map(opt => (
          <option key={opt.idx} value={opt.idx}>
            {opt.icon} {opt.label}
          </option>
        ))}
      </select>
      {currentIdx === -1 && elementType !== 'kuis' && (
        <div className="text-[8px] text-silse-primary/60 mt-1">
          Pilih modul spesifik atau tambah data di panel Konten
        </div>
      )}
    </div>
  );
}
