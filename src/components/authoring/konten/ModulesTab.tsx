'use client';

import { useState, useRef, useCallback } from 'react';
import { useAuthoringStore } from '@/store/authoring-store';
import type { Module } from '@/store/authoring/types';
import { MODULE_TYPES, GAME_TYPES, ALL_MODULE_TYPES, moduleTypeInfo } from './shared';
import ModuleEditorModal from '../ModuleEditorModal';
import PresetModuleCard, { type LayoutVariant, LAYOUT_VARIANTS } from '@/components/shared/preset-module-card';
import { Pencil, Trash2, Puzzle, Zap } from 'lucide-react';

// ── Module Picker Modal ───────────────────────────────────────
function ModulePickerModal({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (typeId: string) => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-app-overlay backdrop-blur-sm" />
      <div
        className="relative bg-app-surface border border-app-border rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-app-border">
          <div>
            <h3 className="text-lg font-bold text-app-primary">Pilih Tipe Modul / Game</h3>
            <p className="text-xs text-app-secondary mt-0.5">Pilih modul pembelajaran atau game yang ingin ditambahkan</p>
          </div>
          <button onClick={onClose} className="text-app-muted hover:text-app-primary transition-colors text-xl leading-none p-1">✕</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Learning Modules */}
          <div>
            <h4 className="text-sm font-semibold text-app-secondary mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-app-accent" />
              Modul Pembelajaran
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {MODULE_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onPick(t.id)}
                  className="bg-app-elevated/60 border border-app-border/60 rounded-xl p-4 text-left hover:border-app-border hover:bg-app-elevated transition-all group cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{t.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-app-primary group-hover:text-app-primary">{t.label}</div>
                      <div className="text-xs text-app-muted mt-0.5 leading-relaxed">{t.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Games */}
          <div>
            <h4 className="text-sm font-semibold text-app-secondary mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Game Interaktif
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {GAME_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onPick(t.id)}
                  className="bg-app-elevated/60 border border-app-border/60 rounded-xl p-4 text-left hover:border-app-border hover:bg-app-elevated transition-all group cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{t.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-app-primary group-hover:text-app-primary">{t.label}</div>
                      <div className="text-xs text-app-muted mt-0.5 leading-relaxed">{t.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// ── Layout Variant Picker ─────────────────────────────────────
function LayoutVariantPicker({ value, onChange }: { value: LayoutVariant; onChange: (v: LayoutVariant) => void }) {
  return (
    <div className="flex gap-1">
      {LAYOUT_VARIANTS.map(v => (
        <button
          key={v.id}
          onClick={() => onChange(v.id as LayoutVariant)}
          className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
            value === v.id ? 'bg-app-accent text-app-inverse' : 'bg-app-elevated text-app-secondary hover:bg-app-elevated'
          }`}
          title={v.desc}
        >
          {v.icon} {v.label}
        </button>
      ))}
    </div>
  );
}

// ── Module List Card (using PresetModuleCard) ────────────────
function ModuleCard({
  mod,
  idx,
  total,
  onEdit,
  onMoveUp,
  onMoveDown,
  onRemove,
  onVariantChange,
}: {
  mod: Module;
  idx: number;
  total: number;
  onEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onVariantChange: (variant: LayoutVariant) => void;
}) {
  const variant = (mod.layoutVariant as LayoutVariant) || 'A';

  return (
    <div className="space-y-1.5">
      {/* Beautiful preset card */}
      <PresetModuleCard
        mode="edit"
        module={mod}
        layoutVariant={variant}
        onEdit={onEdit}
      />

      {/* Controls row: variant picker + action buttons */}
      <div className="flex items-center gap-2 px-1">
        <LayoutVariantPicker value={variant} onChange={onVariantChange} />
        <div className="flex-1" />
        <button
          onClick={onMoveUp}
          disabled={idx === 0}
          className="p-1 text-app-muted hover:text-app-primary disabled:opacity-30 disabled:cursor-not-allowed rounded-md hover:bg-app-elevated transition-colors text-xs"
          title="Pindah ke atas"
        >
          ↑
        </button>
        <button
          onClick={onMoveDown}
          disabled={idx === total - 1}
          className="p-1 text-app-muted hover:text-app-primary disabled:opacity-30 disabled:cursor-not-allowed rounded-md hover:bg-app-elevated transition-colors text-xs"
          title="Pindah ke bawah"
        >
          ↓
        </button>
        <button
          onClick={onEdit}
          className="p-1 text-app-muted hover:text-app-accent/80 rounded-md hover:bg-app-elevated transition-colors text-sm"
          title="Edit modul"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={onRemove}
          className="p-1 text-app-muted hover:text-red-400 rounded-md hover:bg-red-500/10 transition-colors text-sm"
          title="Hapus modul"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Modules Tab ────────────────────────────────────────────────
export function ModulesTab() {
  const modules = useAuthoringStore((s) => s.modules);
  const addModule = useAuthoringStore((s) => s.addModule);
  const removeModule = useAuthoringStore((s) => s.removeModule);
  const moveModule = useAuthoringStore((s) => s.moveModule);
  const updateModuleField = useAuthoringStore((s) => s.updateModuleField);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [editorIndex, setEditorIndex] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const handlePick = useCallback((typeId: string) => {
    addModule(typeId);
    setPickerOpen(false);
    setTimeout(() => {
      const el = listRef.current?.lastElementChild;
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  }, [addModule]);

  const handleRemove = useCallback((i: number) => {
    if (confirm(`Hapus modul "${modules[i].title || moduleTypeInfo(modules[i].type).label}"?`)) {
      removeModule(i);
      if (editorIndex === i) setEditorIndex(null);
    }
  }, [modules, removeModule, editorIndex]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-app-muted">{modules.length} modul & game</span>
        <button
          onClick={() => setPickerOpen(true)}
          className="px-4 py-2 bg-app-accent hover:bg-app-accent/90 text-app-inverse font-semibold text-sm rounded-lg transition-colors"
        >
          ＋ Tambah Modul / Game
        </button>
      </div>

      {/* Empty state */}
      {modules.length === 0 ? (
        <div className="text-center py-12 bg-app-surface border border-app-border rounded-xl">
          <Puzzle size={36} className="text-app-muted mb-3" />
          <p className="text-sm text-app-secondary font-medium">Belum ada modul atau game</p>
          <p className="text-xs text-app-muted mt-1">Klik tombol di atas untuk menambahkan modul pembelajaran atau game interaktif.</p>
        </div>
      ) : (
        /* Module list */
        <div ref={listRef} className="space-y-2">
          {modules.map((mod, i) => (
            <ModuleCard
              key={i}
              mod={mod}
              idx={i}
              total={modules.length}
              onEdit={() => setEditorIndex(i)}
              onMoveUp={() => moveModule(i, i - 1)}
              onMoveDown={() => moveModule(i, i + 1)}
              onRemove={() => handleRemove(i)}
              onVariantChange={(v) => updateModuleField(i, 'layoutVariant', v)}
            />
          ))}
        </div>
      )}

      {/* Quick Add Grid */}
      <div className="bg-app-surface border border-app-border rounded-xl p-4">
        <h4 className="text-sm font-semibold text-app-primary mb-3"><Zap size={16} className="inline" /> Tambah Cepat</h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {ALL_MODULE_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => handlePick(t.id)}
              className="bg-app-elevated/50 border border-app-border/50 rounded-lg p-2.5 text-center hover:border-app-border transition-colors cursor-pointer"
              title={`Tambah ${t.label}`}
            >
              <div className="text-lg mb-0.5">{t.icon}</div>
              <div className="text-[0.6rem] text-app-secondary leading-tight">{t.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Modals */}
      <ModulePickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={handlePick} />
      <ModuleEditorModal open={editorIndex !== null} moduleIndex={editorIndex ?? 0} onClose={() => setEditorIndex(null)} />
    </div>
  );
}
