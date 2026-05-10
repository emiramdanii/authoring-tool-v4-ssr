'use client';

// ═══════════════════════════════════════════════════════════════
// BLOCK PROPERTIES PANEL — Edit schema block properties
// ═══════════════════════════════════════════════════════════════
// Shows when a schema block is selected in canvas mode.
// Reads block definition from SceneRegistry and displays
// editable properties based on block type.

import { useCanvaStore } from '@/store/canva-store';
import { getBlockDefinition } from '@/core/registry/SceneRegistry';
import { Settings2, X } from 'lucide-react';

export default function BlockPropertiesPanel() {
  const selectedBlockId = useCanvaStore(s => s.selectedBlockId);
  const selectedBlockType = useCanvaStore(s => s.selectedBlockType);
  const selectBlock = useCanvaStore(s => s.selectBlock);

  if (!selectedBlockId || !selectedBlockType) return null;

  const definition = getBlockDefinition(selectedBlockType);

  return (
    <div className="border-b border-blue-500/10">
      <div className="px-3 py-2 flex items-center gap-1.5 bg-blue-500/5">
        <Settings2 size={12} className="text-blue-400" />
        <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Block Properti</span>
        <button
          onClick={() => selectBlock(null)}
          className="ml-auto btn-ghost w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-300"
        >
          <X size={10} />
        </button>
      </div>
      <div className="px-3 pb-3 pt-2 space-y-2">
        {/* Block type badge */}
        <div className="flex items-center gap-2">
          <span className="text-lg">{definition?.icon || '📦'}</span>
          <div>
            <div className="text-[11px] font-bold text-slate-200">{definition?.name || selectedBlockType}</div>
            <div className="text-[9px] text-slate-500">{definition?.category || 'unknown'} • {selectedBlockType}</div>
          </div>
        </div>

        {/* Block ID */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 w-14">ID</span>
          <span className="text-[10px] text-slate-300 font-mono truncate flex-1">{selectedBlockId}</span>
        </div>

        {/* Capabilities */}
        {definition && (
          <div className="space-y-1 mt-2">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Kemampuan</div>
            <div className="grid grid-cols-2 gap-1">
              <CapabilityBadge label="Editable" value={definition.capabilities.editable} />
              <CapabilityBadge label="Resizable" value={definition.capabilities.resizable} />
              <CapabilityBadge label="Movable" value={definition.capabilities.movable} />
              <CapabilityBadge label="Interaktif" value={definition.capabilities.interactive} />
              <CapabilityBadge label="Auto-gen" value={definition.capabilities.autoGeneratable} />
              <CapabilityBadge label="Komposit" value={definition.capabilities.composite} />
            </div>
          </div>
        )}

        {/* Layout info */}
        {definition && (
          <div className="space-y-1 mt-2">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Layout</div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500">Posisi</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                definition.defaultLayout.position === 'flow'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}>
                {definition.defaultLayout.position}
              </span>
            </div>
          </div>
        )}

        {/* Used in templates */}
        {definition && definition.usedInTemplates.length > 0 && (
          <div className="space-y-1 mt-2">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Template</div>
            <div className="flex flex-wrap gap-1">
              {definition.usedInTemplates.map(t => (
                <span key={t} className="text-[8px] px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-400 border border-slate-700/20">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {definition?.description && (
          <div className="mt-2">
            <p className="text-[9px] text-slate-500 leading-relaxed">{definition.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CapabilityBadge({ label, value }: { label: string; value: boolean }) {
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
