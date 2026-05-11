'use client';

import { useAuthoringStore } from '@/store/authoring-store';
import PresetModuleCard, { type LayoutVariant, LAYOUT_VARIANTS } from '@/components/shared/PresetModuleCard';
import { FieldLabel, INPUT_CLS } from './module-editors/shared';
import type { EdProps } from './module-editors/shared';
import { Pencil, Eye } from 'lucide-react';
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
  moduleIndex: number;
}

export default function ModuleEditorModal({ open, onClose, moduleIndex }: Props) {
  const mod = useAuthoringStore((s) => s.modules[moduleIndex]);
  const updateField = useAuthoringStore((s) => s.updateModuleField);
  const add = useAuthoringStore((s) => s.addModuleItem);
  const remove = useAuthoringStore((s) => s.removeModuleItem);
  const update = useAuthoringStore((s) => s.updateModuleItem);

  if (!open || !mod) return null;

  const t = mod.type as string;

  const uf = (key: string, value: unknown) => updateField(moduleIndex, key, value);
  const ai = (arrayKey: string, item: Record<string, unknown>) => add(moduleIndex, arrayKey, item);
  const ri = (arrayKey: string, itemIndex: number) => remove(moduleIndex, arrayKey, itemIndex);
  const ui = (arrayKey: string, itemIndex: number, key: string, value: unknown) => update(moduleIndex, arrayKey, itemIndex, key, value);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-zinc-100"><Pencil size={16} className="inline" /> Edit Modul</h3>
            <p className="text-xs text-zinc-400 mt-0.5 capitalize">{t} — {(mod.title as string) || '(tanpa judul)'}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition-colors text-xl leading-none p-1">✕</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {/* Common title field */}
          <div>
            <FieldLabel>Judul Modul</FieldLabel>
            <input className={INPUT_CLS} placeholder="Judul modul…" value={(mod.title as string) || ''} onChange={(e) => uf('title', e.target.value)} />
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
            <div className="p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-center">
              <p className="text-sm text-zinc-400">Skenario memiliki editor khusus di tab <strong className="text-amber-400">Skenario</strong>.</p>
            </div>
          )}
          {t === 'petunjuk' && <PetunjukEditor mod={mod} uf={uf} ai={ai} ri={ri} ui={ui} />}
          {t === 'diskusi' && <DiskusiEditor mod={mod} uf={uf} ai={ai} ri={ri} ui={ui} />}
          {t === 'review' && <ReviewEditor mod={mod} uf={uf} ai={ai} ri={ri} ui={ui} />}
          {t === 'refleksi' && <RefleksiEditor mod={mod} uf={uf} ai={ai} ri={ri} ui={ui} />}

          {/* ── Live Preview Panel ── */}
          <div className="border-t border-zinc-800 pt-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-zinc-200"><Eye size={16} className="inline" /> Pratinjau Langsung</h4>
              {/* Layout Variant Picker */}
              <div className="flex gap-1">
                {LAYOUT_VARIANTS.map(v => {
                  const currentVariant = (mod.layoutVariant as LayoutVariant) || 'A';
                  return (
                    <button
                      key={v.id}
                      onClick={() => uf('layoutVariant', v.id)}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                        currentVariant === v.id ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                      title={v.desc}
                    >
                      {v.icon} {v.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 border border-zinc-800 overflow-auto max-h-80">
              <PresetModuleCard
                mode="edit"
                module={mod}
                layoutVariant={(mod.layoutVariant as LayoutVariant) || 'A'}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex-shrink-0 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-900 rounded-lg font-bold text-sm transition-colors">
            Simpan & Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
