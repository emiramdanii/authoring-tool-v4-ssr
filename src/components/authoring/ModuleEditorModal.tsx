'use client';

import PresetModuleCard, { type LayoutVariant, LAYOUT_VARIANTS } from '@/components/shared/preset-module-card';
import { FieldLabel, INPUT_CLS } from './module-editors/shared';
import type { Fn, FnAI, FnRI, FnUI } from './module-editors/shared';
import type { Module } from '@/store/authoring/types';
// All icons migrated to Material Symbols Outlined
import {
  VideoEditor,
  FlashcardEditor,
  InfografisEditor,
  StudiKasusEditor,
  DebatEditor,
  TimelineEditor,
  MatchingEditor,
  MateriModEditor,
  TrueFalseEditor,
  MemoryEditor,
  RodaEditor,
  HeroEditor,
  KutipanEditor,
  LangkahEditor,
  AccordionEditor,
  StatistikModEditor,
  PollingEditor,
  EmbedEditor,
  TabIconsEditor,
  IconExploreEditor,
  ComparisonEditor,
  CardShowcaseEditor,
  HotspotImageEditor,
  SortingEditor,
  SpinwheelEditor,
  TeambuzzerEditor,
  WordsearchEditor,
  PetunjukEditor,
  DiskusiEditor,
  ReviewEditor,
  RefleksiEditor,
} from './module-editors';

// ── Props ─────────────────────────────────────────────────────
interface Props {
  open: boolean;
  onClose: () => void;
  /** The module data (read from schema, passed by parent) */
  mod: Module | null;
  /** Update a top-level field on the module */
  updateField: (key: string, value: unknown) => void;
  /** Add an item to a nested array field */
  add: (arrayKey: string, item: Record<string, unknown>) => void;
  /** Remove an item from a nested array field */
  remove: (arrayKey: string, itemIndex: number) => void;
  /** Update a field on a nested array item */
  update: (arrayKey: string, itemIndex: number, key: string, value: unknown) => void;
}

export default function ModuleEditorModal({ open, onClose, mod, updateField, add, remove, update }: Props) {
  if (!open || !mod) return null;

  const t = mod.type; // Already typed as string

  const uf: Fn = (key, value) => updateField(key, value);
  const ai: FnAI = (arrayKey, item) => add(arrayKey, item);
  const ri: FnRI = (arrayKey, itemIndex) => remove(arrayKey, itemIndex);
  const ui: FnUI = (arrayKey, itemIndex, key, value) => update(arrayKey, itemIndex, key, value);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-app-overlay backdrop-blur-sm" />
      <div className="relative bg-app-surface border border-app-border rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-app-border flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-app-primary"><span className="material-symbols-outlined inline" style={ { fontSize: '16px' } }>edit</span> Edit Modul</h3>
            <p className="text-xs text-app-secondary mt-0.5 capitalize">{t} — {mod.title || '(tanpa judul)'}</p>
          </div>
          <button onClick={onClose} className="text-app-muted hover:text-app-primary transition-colors text-xl leading-none p-1">✕</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {/* Common title field */}
          <div>
            <FieldLabel>Judul Modul</FieldLabel>
            <input className={INPUT_CLS} placeholder="Judul modul…" value={mod.title || ''} onChange={(e) => uf('title', e.target.value)} />
          </div>

          {/* Type-specific editors */}
          {t === 'video' && <VideoEditor mod={mod} uf={uf} ai={ai} ri={ri} ui={ui} />}
          {t === 'flashcard' && <FlashcardEditor mod={mod} uf={uf} ai={ai} ri={ri} ui={ui} />}
          {t === 'infografis' && <InfografisEditor mod={mod} uf={uf} ai={ai} ri={ri} ui={ui} />}
          {t === 'studi-kasus' && <StudiKasusEditor mod={mod} uf={uf} ai={ai} ri={ri} ui={ui} />}
          {t === 'debat' && <DebatEditor mod={mod} uf={uf} />}
          {t === 'timeline' && <TimelineEditor mod={mod} uf={uf} ai={ai} ri={ri} ui={ui} />}
          {t === 'matching' && <MatchingEditor mod={mod} uf={uf} ai={ai} ri={ri} ui={ui} />}
          {t === 'materi' && <MateriModEditor mod={mod} uf={uf} ai={ai} ri={ri} ui={ui} />}
          {t === 'truefalse' && <TrueFalseEditor mod={mod} uf={uf} ai={ai} ri={ri} ui={ui} />}
          {t === 'memory' && <MemoryEditor mod={mod} uf={uf} ai={ai} ri={ri} ui={ui} />}
          {t === 'roda' && <RodaEditor mod={mod} uf={uf} ai={ai} ri={ri} ui={ui} />}
          {t === 'hero' && <HeroEditor mod={mod} uf={uf} />}
          {t === 'kutipan' && <KutipanEditor mod={mod} uf={uf} />}
          {t === 'langkah' && <LangkahEditor mod={mod} uf={uf} ai={ai} ri={ri} ui={ui} />}
          {t === 'accordion' && <AccordionEditor mod={mod} uf={uf} ai={ai} ri={ri} ui={ui} />}
          {t === 'statistik' && <StatistikModEditor mod={mod} uf={uf} ai={ai} ri={ri} ui={ui} />}
          {t === 'polling' && <PollingEditor mod={mod} uf={uf} ai={ai} ri={ri} ui={ui} />}
          {t === 'embed' && <EmbedEditor mod={mod} uf={uf} />}
          {t === 'tab-icons' && <TabIconsEditor mod={mod} uf={uf} ai={ai} ri={ri} ui={ui} />}
          {t === 'icon-explore' && <IconExploreEditor mod={mod} uf={uf} ai={ai} ri={ri} ui={ui} />}
          {t === 'comparison' && <ComparisonEditor mod={mod} uf={uf} ai={ai} ri={ri} ui={ui} />}
          {t === 'card-showcase' && <CardShowcaseEditor mod={mod} uf={uf} ai={ai} ri={ri} ui={ui} />}
          {t === 'hotspot-image' && <HotspotImageEditor mod={mod} uf={uf} ai={ai} ri={ri} ui={ui} />}
          {t === 'sorting' && <SortingEditor mod={mod} uf={uf} ai={ai} ri={ri} ui={ui} />}
          {t === 'spinwheel' && <SpinwheelEditor mod={mod} uf={uf} ai={ai} ri={ri} ui={ui} />}
          {t === 'teambuzzer' && <TeambuzzerEditor mod={mod} uf={uf} ai={ai} ri={ri} ui={ui} />}
          {t === 'wordsearch' && <WordsearchEditor mod={mod} uf={uf} />}
          {t === 'skenario' && (
            <div className="p-4 bg-app-elevated/50 border border-app-border/50 rounded-xl text-center">
              <p className="text-sm text-app-secondary">Skenario memiliki editor khusus di tab <strong className="text-app-accent">Skenario</strong>.</p>
            </div>
          )}
          {t === 'petunjuk' && <PetunjukEditor mod={mod} uf={uf} ai={ai} ri={ri} ui={ui} />}
          {t === 'diskusi' && <DiskusiEditor mod={mod} uf={uf} ai={ai} ri={ri} ui={ui} />}
          {t === 'review' && <ReviewEditor mod={mod} uf={uf} ai={ai} ri={ri} ui={ui} />}
          {t === 'refleksi' && <RefleksiEditor mod={mod} uf={uf} ai={ai} ri={ri} ui={ui} />}

          {/* ── Live Preview Panel ── */}
          <div className="border-t border-app-border pt-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-app-primary"><span className="material-symbols-outlined inline" style={ { fontSize: '16px' } }>visibility</span> Pratinjau Langsung</h4>
              {/* Layout Variant Picker */}
              <div className="flex gap-1">
                {LAYOUT_VARIANTS.map(v => {
                  const currentVariant = (mod.layoutVariant as LayoutVariant) || 'A';
                  return (
                    <button
                      key={v.id}
                      onClick={() => uf('layoutVariant', v.id)}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                        currentVariant === v.id ? 'bg-app-accent text-app-inverse' : 'bg-app-elevated text-app-secondary hover:bg-app-elevated'
                      }`}
                      title={v.desc}
                    >
                      {v.icon} {v.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="bg-app-surface rounded-xl p-4 border border-app-border overflow-auto max-h-80">
              <PresetModuleCard
                mode="edit"
                module={mod}
                layoutVariant={(mod.layoutVariant as LayoutVariant) || 'A'}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-app-border flex-shrink-0 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-app-accent hover:bg-app-accent/90 text-app-inverse rounded-lg font-bold text-sm transition-colors">
            Simpan & Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
