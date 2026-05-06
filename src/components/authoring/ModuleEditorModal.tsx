'use client';

import { useAuthoringStore } from '@/store/authoring-store';
import PresetModuleCard, { type LayoutVariant, LAYOUT_VARIANTS } from '@/components/shared/PresetModuleCard';

// ── Shared constants ──────────────────────────────────────────
const INPUT_CLS =
  'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors';
const TEXTAREA_CLS = INPUT_CLS + ' resize-none';
const SELECT_CLS = INPUT_CLS;

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-zinc-400 mb-1.5">{children}</label>;
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" className="w-8 h-8 rounded cursor-pointer border border-zinc-700 bg-transparent" value={value || '#3ecfcf'} onChange={(e) => onChange(e.target.value)} />
      <span className="text-xs text-zinc-500 font-mono">{value}</span>
    </div>
  );
}

function AddRemoveRow({ onAdd, canRemove, onRemove, addLabel }: { onAdd: () => void; canRemove: boolean; onRemove: () => void; addLabel: string }) {
  return (
    <div className="flex items-center gap-3">
      <button onClick={onAdd} className="text-xs text-amber-500 hover:text-amber-400 transition-colors">＋ {addLabel}</button>
      {canRemove && (
        <button onClick={onRemove} className="text-xs text-zinc-500 hover:text-red-400 transition-colors">✕ Hapus</button>
      )}
    </div>
  );
}

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
            <h3 className="text-lg font-bold text-zinc-100">✏️ Edit Modul</h3>
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
              <h4 className="text-sm font-bold text-zinc-200">👁️ Pratinjau Langsung</h4>
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
            <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800 overflow-auto max-h-80">
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

// ── Helper types ──────────────────────────────────────────────
type Fn = (k: string, v: unknown) => void;
type FnAI = (ak: string, item: Record<string, unknown>) => void;
type FnRI = (ak: string, ii: number) => void;
type FnUI = (ak: string, ii: number, k: string, v: unknown) => void;

interface EdProps {
  mod: Record<string, unknown>;
  uf: Fn;
  ai?: FnAI;
  ri?: FnRI;
  ui?: FnUI;
}

// ── 1. Video Editor ──────────────────────────────────────────
function VideoEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const pertanyaan = (mod.pertanyaan as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Platform</FieldLabel>
          <select className={SELECT_CLS} value={(mod.platform as string) || 'youtube'} onChange={(e) => uf('platform', e.target.value)}>
            <option value="youtube">YouTube</option>
            <option value="drive">Google Drive</option>
            <option value="other">Lainnya</option>
          </select>
        </div>
        <div>
          <FieldLabel>Durasi</FieldLabel>
          <input className={INPUT_CLS} placeholder="5:30" value={(mod.durasi as string) || ''} onChange={(e) => uf('durasi', e.target.value)} />
        </div>
      </div>
      <div>
        <FieldLabel>URL Video</FieldLabel>
        <input className={INPUT_CLS} placeholder="https://youtube.com/watch?v=..." value={(mod.url as string) || ''} onChange={(e) => uf('url', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Instruksi untuk Siswa</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={3} placeholder="Tonton video ini dan perhatikan…" value={(mod.instruksi as string) || ''} onChange={(e) => uf('instruksi', e.target.value)} />
      </div>
      {/* Pertanyaan Refleksi */}
      <div>
        <FieldLabel>Pertanyaan Refleksi</FieldLabel>
        {pertanyaan.map((p, i) => (
          <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-2 space-y-2">
            <div className="flex items-center gap-2">
              <input className={INPUT_CLS} placeholder="Pertanyaan…" value={(p.teks as string) || ''} onChange={(e) => ui!('pertanyaan', i, 'teks', e.target.value)} />
              <button onClick={() => ri!('pertanyaan', i)} className="text-zinc-600 hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <input type="checkbox" checked={(p.wajib as boolean) || false} onChange={(e) => ui!('pertanyaan', i, 'wajib', e.target.checked)} className="rounded" />
              Wajib dijawab
            </label>
          </div>
        ))}
        <button onClick={() => ai!('pertanyaan', { teks: '', wajib: false })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Pertanyaan</button>
      </div>
    </div>
  );
}

// ── 2. Flashcard Editor ─────────────────────────────────────
function FlashcardEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const kartu = (mod.kartu as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Instruksi</FieldLabel>
        <input className={INPUT_CLS} placeholder="Klik kartu untuk membalik…" value={(mod.instruksi as string) || ''} onChange={(e) => uf('instruksi', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Kartu ({kartu.length})</FieldLabel>
        {kartu.map((k, i) => (
          <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-2 grid grid-cols-3 gap-2 items-start">
            <div>
              <span className="text-[10px] text-zinc-500 block mb-1">Depan</span>
              <input className={INPUT_CLS} value={(k.depan as string) || ''} onChange={(e) => ui!('kartu', i, 'depan', e.target.value)} placeholder="Pertanyaan" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block mb-1">Belakang</span>
              <input className={INPUT_CLS} value={(k.belakang as string) || ''} onChange={(e) => ui!('kartu', i, 'belakang', e.target.value)} placeholder="Jawaban" />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <span className="text-[10px] text-zinc-500 block mb-1">Hint</span>
                <input className={INPUT_CLS} value={(k.hint as string) || ''} onChange={(e) => ui!('kartu', i, 'hint', e.target.value)} placeholder="💡" />
              </div>
              <button onClick={() => ri!('kartu', i)} className="text-zinc-600 hover:text-red-400 text-sm p-1 h-[38px]">✕</button>
            </div>
          </div>
        ))}
        <button onClick={() => ai!('kartu', { depan: '', belakang: '', hint: '' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Kartu</button>
      </div>
    </div>
  );
}

// ── 3. Infografis Editor ────────────────────────────────────
function InfografisEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const kartu = (mod.kartu as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Layout</FieldLabel>
          <select className={SELECT_CLS} value={(mod.layout as string) || 'grid'} onChange={(e) => uf('layout', e.target.value)}>
            <option value="grid">Grid</option>
            <option value="list">List</option>
            <option value="timeline">Timeline</option>
          </select>
        </div>
      </div>
      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={2} placeholder="Pengantar…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Kartu ({kartu.length})</FieldLabel>
        {kartu.map((k, i) => (
          <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-2 space-y-2">
            <div className="flex items-center gap-2">
              <input className={`${INPUT_CLS} w-16`} placeholder="📊" value={(k.icon as string) || ''} onChange={(e) => ui!('kartu', i, 'icon', e.target.value)} />
              <input className={INPUT_CLS} placeholder="Judul kartu…" value={(k.judul as string) || ''} onChange={(e) => ui!('kartu', i, 'judul', e.target.value)} />
              <ColorPicker value={(k.color as string) || '#3ecfcf'} onChange={(v) => ui!('kartu', i, 'color', v)} />
              <button onClick={() => ri!('kartu', i)} className="text-zinc-600 hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
            <textarea className={TEXTAREA_CLS} rows={2} placeholder="Isi kartu…" value={(k.isi as string) || ''} onChange={(e) => ui!('kartu', i, 'isi', e.target.value)} />
          </div>
        ))}
        <button onClick={() => ai!('kartu', { icon: '📌', judul: '', isi: '', color: '#3ecfcf' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Kartu</button>
      </div>
    </div>
  );
}

// ── 4. Studi Kasus Editor ───────────────────────────────────
function StudiKasusEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const pertanyaan = (mod.pertanyaan as Array<Record<string, unknown>>) || [];
  const bloomLevels = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Narasi Kasus</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={5} placeholder="Jelaskan kasus di sini…" value={(mod.teks as string) || ''} onChange={(e) => uf('teks', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Sumber</FieldLabel>
        <input className={INPUT_CLS} placeholder="Sumber kasus…" value={(mod.sumber as string) || ''} onChange={(e) => uf('sumber', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Pertanyaan Analisis ({pertanyaan.length})</FieldLabel>
        {pertanyaan.map((p, i) => (
          <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-2 space-y-2">
            <div className="flex items-center gap-2">
              <select className={`${SELECT_CLS} w-20`} value={(p.level as string) || 'C1'} onChange={(e) => ui!('pertanyaan', i, 'level', e.target.value)}>
                {bloomLevels.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <input className={INPUT_CLS} placeholder="Label pertanyaan…" value={(p.label as string) || ''} onChange={(e) => ui!('pertanyaan', i, 'label', e.target.value)} />
              <button onClick={() => ri!('pertanyaan', i)} className="text-zinc-600 hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
            <textarea className={TEXTAREA_CLS} rows={2} placeholder="Teks pertanyaan…" value={(p.teks as string) || ''} onChange={(e) => ui!('pertanyaan', i, 'teks', e.target.value)} />
          </div>
        ))}
        <button onClick={() => ai!('pertanyaan', { level: 'C2', label: '', teks: '' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Pertanyaan</button>
      </div>
    </div>
  );
}

// ── 5. Debat Editor ────────────────────────────────────────
function DebatEditor({ mod, uf }: EdProps) {
  const pA = (mod.pihakA as Record<string, unknown>) || {};
  const pB = (mod.pihakB as Record<string, unknown>) || {};
  const upA = (k: string, v: unknown) => uf('pihakA', { ...pA, [k]: v });
  const upB = (k: string, v: unknown) => uf('pihakB', { ...pB, [k]: v });
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Mosi / Pertanyaan Debat</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={3} placeholder="Mosiperta debat…" value={(mod.pertanyaan as string) || ''} onChange={(e) => uf('pertanyaan', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Konteks / Latar Belakang</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={3} placeholder="Konteks debat…" value={(mod.konteks as string) || ''} onChange={(e) => uf('konteks', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-green-900/20 border border-green-700/30 rounded-lg space-y-2">
          <span className="text-xs font-bold text-green-400">✅ Pihak Pro</span>
          <input className={INPUT_CLS} value={(pA.label as string) || 'Pro / Setuju'} onChange={(e) => upA('label', e.target.value)} />
        </div>
        <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-lg space-y-2">
          <span className="text-xs font-bold text-red-400">❌ Pihak Kontra</span>
          <input className={INPUT_CLS} value={(pB.label as string) || 'Kontra / Tidak Setuju'} onChange={(e) => upB('label', e.target.value)} />
        </div>
      </div>
      <div>
        <FieldLabel>Prompt Kesimpulan</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={2} placeholder="Setelah debat, tulis kesimpulan…" value={(mod.kesimpulan_prompt as string) || ''} onChange={(e) => uf('kesimpulan_prompt', e.target.value)} />
      </div>
    </div>
  );
}

// ── 6. Timeline Editor ─────────────────────────────────────
function TimelineEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const events = (mod.events as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={2} placeholder="Pengantar timeline…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Peristiwa ({events.length})</FieldLabel>
        {events.map((ev, i) => (
          <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-2 space-y-2 relative pl-6 border-l-2 border-zinc-700 ml-2">
            <div className="absolute -left-[9px] top-3 w-4 h-4 rounded-full bg-zinc-700 border-2 border-zinc-600" />
            <div className="flex items-center gap-2">
              <input className={`${INPUT_CLS} w-16`} placeholder="📌" value={(ev.icon as string) || ''} onChange={(e) => ui!('events', i, 'icon', e.target.value)} />
              <input className={`${INPUT_CLS} w-32`} placeholder="Tahun" value={(ev.tahun as string) || ''} onChange={(e) => ui!('events', i, 'tahun', e.target.value)} />
              <input className={INPUT_CLS} placeholder="Judul peristiwa…" value={(ev.judul as string) || ''} onChange={(e) => ui!('events', i, 'judul', e.target.value)} />
              <button onClick={() => ri!('events', i)} className="text-zinc-600 hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
            <textarea className={TEXTAREA_CLS} rows={2} placeholder="Deskripsi peristiwa…" value={(ev.isi as string) || ''} onChange={(e) => ui!('events', i, 'isi', e.target.value)} />
          </div>
        ))}
        <button onClick={() => ai!('events', { icon: '📌', tahun: '', judul: '', isi: '' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Peristiwa</button>
      </div>
    </div>
  );
}

// ── 7. Matching Editor ─────────────────────────────────────
function MatchingEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const pasangan = (mod.pasangan as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Instruksi</FieldLabel>
        <input className={INPUT_CLS} placeholder="Cocokkan pasangan…" value={(mod.instruksi as string) || ''} onChange={(e) => uf('instruksi', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Pasangan ({pasangan.length})</FieldLabel>
        {pasangan.map((p, i) => (
          <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-2 flex items-center gap-2">
            <span className="text-xs text-zinc-500 flex-shrink-0">{i + 1}</span>
            <input className={INPUT_CLS} placeholder="Kiri…" value={(p.kiri as string) || ''} onChange={(e) => ui!('pasangan', i, 'kiri', e.target.value)} />
            <span className="text-zinc-500 flex-shrink-0">↔</span>
            <input className={INPUT_CLS} placeholder="Kanan…" value={(p.kanan as string) || ''} onChange={(e) => ui!('pasangan', i, 'kanan', e.target.value)} />
            <button onClick={() => ri!('pasangan', i)} className="text-zinc-600 hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
          </div>
        ))}
        <button onClick={() => ai!('pasangan', { kiri: '', kanan: '' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Pasangan</button>
      </div>
    </div>
  );
}

// ── 8. Materi Module Editor ────────────────────────────────
function MateriModEditor({ mod, uf }: EdProps) {
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={2} placeholder="Pengantar materi…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 text-center">
        <p className="text-sm text-zinc-400">Untuk mengedit blok materi, gunakan tab <strong className="text-amber-400">Materi</strong> di panel konten.</p>
      </div>
    </div>
  );
}

// ── 9. TrueFalse Editor ────────────────────────────────────
function TrueFalseEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const soal = (mod.soal as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Instruksi</FieldLabel>
        <input className={INPUT_CLS} placeholder="Tentukan apakah pernyataan berikut benar atau salah…" value={(mod.instruksi as string) || ''} onChange={(e) => uf('instruksi', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Pernyataan ({soal.length})</FieldLabel>
        {soal.map((s, i) => (
          <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-2 space-y-2">
            <textarea className={TEXTAREA_CLS} rows={2} placeholder="Pernyataan…" value={(s.teks as string) || ''} onChange={(e) => ui!('soal', i, 'teks', e.target.value)} />
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Jawaban:</span>
              <select className={`${SELECT_CLS} w-32`} value={(s.jawaban as boolean) ? 'true' : 'false'} onChange={(e) => ui!('soal', i, 'jawaban', e.target.value === 'true')}>
                <option value="true">✅ Benar</option>
                <option value="false">❌ Salah</option>
              </select>
              <input className={INPUT_CLS} placeholder="Penjelasan…" value={(s.penjelasan as string) || ''} onChange={(e) => ui!('soal', i, 'penjelasan', e.target.value)} />
              <button onClick={() => ri!('soal', i)} className="text-zinc-600 hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
          </div>
        ))}
        <button onClick={() => ai!('soal', { teks: '', jawaban: true, penjelasan: '' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Pernyataan</button>
      </div>
    </div>
  );
}

// ── 10. Memory Editor ──────────────────────────────────────
function MemoryEditor({ mod, ai, ri, ui }: EdProps) {
  const pasangan = (mod.pasangan as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Pasangan ({pasangan.length})</FieldLabel>
        {pasangan.map((p, i) => (
          <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-2 flex items-center gap-2">
            <span className="text-xs text-zinc-500 flex-shrink-0">{i + 1}</span>
            <input className={INPUT_CLS} placeholder="Kartu A…" value={(p.a as string) || ''} onChange={(e) => ui!('pasangan', i, 'a', e.target.value)} />
            <span className="text-zinc-500 flex-shrink-0">⇄</span>
            <input className={INPUT_CLS} placeholder="Kartu B…" value={(p.b as string) || ''} onChange={(e) => ui!('pasangan', i, 'b', e.target.value)} />
            <button onClick={() => ri!('pasangan', i)} className="text-zinc-600 hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
          </div>
        ))}
        <button onClick={() => ai!('pasangan', { a: '', b: '' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Pasangan</button>
      </div>
    </div>
  );
}

// ── 11. Roda Editor ───────────────────────────────────────
function RodaEditor({ mod, ai, ri, ui }: EdProps) {
  const opsi = (mod.opsi as string[]) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Opsi Roda ({opsi.length})</FieldLabel>
        {opsi.map((o, i) => (
          <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-2 flex items-center gap-2">
            <span className="text-xs text-zinc-500 flex-shrink-0">{i + 1}</span>
            <input className={INPUT_CLS} value={o} onChange={(e) => ui!('opsi', i, '', e.target.value)} placeholder="Opsi…" />
            <button onClick={() => ri!('opsi', i)} className="text-zinc-600 hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
          </div>
        ))}
        <button onClick={() => ai!('opsi', { '': '' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Opsi</button>
      </div>
    </div>
  );
}

// ── 12. Hero Editor ────────────────────────────────────────
function HeroEditor({ mod, uf }: EdProps) {
  const gradients = [
    { id: 'sunset', label: '🌅 Sunset' },
    { id: 'ocean', label: '🌊 Ocean' },
    { id: 'forest', label: '🌲 Forest' },
    { id: 'royal', label: '👑 Royal' },
    { id: 'fire', label: '🔥 Fire' },
    { id: 'aurora', label: '🌌 Aurora' },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <FieldLabel>Subjudul</FieldLabel>
          <input className={INPUT_CLS} placeholder="Subjudul banner…" value={(mod.subjudul as string) || ''} onChange={(e) => uf('subjudul', e.target.value)} />
        </div>
        <div className="w-20">
          <FieldLabel>Ikon</FieldLabel>
          <input className={INPUT_CLS} value={(mod.icon as string) || ''} onChange={(e) => uf('icon', e.target.value)} placeholder="🚀" />
        </div>
      </div>
      <div>
        <FieldLabel>Gradient Tema</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {gradients.map((g) => (
            <button key={g.id} onClick={() => uf('gradient', g.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${(mod.gradient as string) === g.id ? 'border-amber-500 bg-amber-500/20 text-amber-400' : 'border-zinc-700/50 text-zinc-400 hover:border-zinc-500'}`}>
              {g.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel>CTA Button</FieldLabel>
        <input className={INPUT_CLS} placeholder="Mulai Belajar" value={(mod.cta as string) || ''} onChange={(e) => uf('cta', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Chips (pisahkan koma)</FieldLabel>
        <input className={INPUT_CLS} placeholder="PPKn, Kelas VII, Kurikulum Merdeka" value={(mod.chips as string) || ''} onChange={(e) => uf('chips', e.target.value)} />
      </div>
    </div>
  );
}

// ── 13. Kutipan Editor ────────────────────────────────────
function KutipanEditor({ mod, uf }: EdProps) {
  const displays = [
    { id: 'card', label: '🃏 Card' },
    { id: 'big', label: '📝 Big' },
    { id: 'minimal', label: '✨ Minimal' },
  ];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Kutipan</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={3} placeholder="Tulis kutipan di sini…" value={(mod.quote as string) || ''} onChange={(e) => uf('quote', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Sumber / Tokoh</FieldLabel>
          <input className={INPUT_CLS} placeholder="Aristoteles" value={(mod.source as string) || ''} onChange={(e) => uf('source', e.target.value)} />
        </div>
        <div>
          <FieldLabel>Jabatan / Judul</FieldLabel>
          <input className={INPUT_CLS} placeholder="Filsuf Yunani" value={(mod.title as string) || ''} onChange={(e) => uf('title', e.target.value)} />
        </div>
      </div>
      <div className="flex items-end gap-4">
        <div>
          <FieldLabel>Gaya Tampilan</FieldLabel>
          <div className="flex gap-2">
            {displays.map((d) => (
              <button key={d.id} onClick={() => uf('display', d.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${(mod.display as string) === d.id ? 'border-amber-500 bg-amber-500/20 text-amber-400' : 'border-zinc-700/50 text-zinc-400'}`}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <FieldLabel>Warna Aksen</FieldLabel>
          <ColorPicker value={(mod.accent as string) || '#f9c82e'} onChange={(v) => uf('accent', v)} />
        </div>
      </div>
    </div>
  );
}

// ── 14. Langkah Editor ────────────────────────────────────
function LangkahEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const steps = (mod.steps as Array<Record<string, unknown>>) || [];
  const styles = ['numbered', 'bubble', 'arrow'];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={2} placeholder="Pengantar…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Gaya</FieldLabel>
        <div className="flex gap-2">
          {styles.map((s) => (
            <button key={s} onClick={() => uf('style', s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-colors ${(mod.style as string) === s ? 'border-amber-500 bg-amber-500/20 text-amber-400' : 'border-zinc-700/50 text-zinc-400'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel>Langkah ({steps.length})</FieldLabel>
        {steps.map((st, i) => (
          <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-2 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 flex-shrink-0">{i + 1}</span>
              <input className={`${INPUT_CLS} w-16`} value={(st.icon as string) || ''} onChange={(e) => ui!('steps', i, 'icon', e.target.value)} placeholder="📌" />
              <input className={INPUT_CLS} placeholder="Judul langkah…" value={(st.judul as string) || ''} onChange={(e) => ui!('steps', i, 'judul', e.target.value)} />
              <ColorPicker value={(st.color as string) || '#3ecfcf'} onChange={(v) => ui!('steps', i, 'color', v)} />
              <button onClick={() => ri!('steps', i)} className="text-zinc-600 hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
            <textarea className={TEXTAREA_CLS} rows={2} placeholder="Deskripsi langkah…" value={(st.isi as string) || ''} onChange={(e) => ui!('steps', i, 'isi', e.target.value)} />
          </div>
        ))}
        <button onClick={() => ai!('steps', { icon: '📌', judul: '', isi: '', color: '#3ecfcf' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Langkah</button>
      </div>
    </div>
  );
}

// ── 15. Accordion Editor ──────────────────────────────────
function AccordionEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const items = (mod.items as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={2} placeholder="Pengantar…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Item ({items.length})</FieldLabel>
        {items.map((item, i) => (
          <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-2 space-y-2">
            <div className="flex items-center gap-2">
              <input className={`${INPUT_CLS} w-16`} placeholder="📌" value={(item.icon as string) || ''} onChange={(e) => ui!('items', i, 'icon', e.target.value)} />
              <input className={INPUT_CLS} placeholder="Judul item…" value={(item.judul as string) || ''} onChange={(e) => ui!('items', i, 'judul', e.target.value)} />
              <button onClick={() => ri!('items', i)} className="text-zinc-600 hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
            <textarea className={TEXTAREA_CLS} rows={2} placeholder="Isi detail…" value={(item.isi as string) || ''} onChange={(e) => ui!('items', i, 'isi', e.target.value)} />
          </div>
        ))}
        <button onClick={() => ai!('items', { icon: '📌', judul: '', isi: '' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Item</button>
      </div>
    </div>
  );
}

// ── 16. Statistik Mod Editor ──────────────────────────────
function StatistikModEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const items = (mod.items as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={2} placeholder="Pengantar…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Layout</FieldLabel>
        <div className="flex gap-2">
          {['grid', 'row'].map((l) => (
            <button key={l} onClick={() => uf('layout', l)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-colors ${(mod.layout as string) === l ? 'border-amber-500 bg-amber-500/20 text-amber-400' : 'border-zinc-700/50 text-zinc-400'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel>Item Statistik ({items.length})</FieldLabel>
        {items.map((item, i) => (
          <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-2 space-y-2">
            <div className="flex items-center gap-2">
              <input className={`${INPUT_CLS} w-16`} placeholder="📊" value={(item.icon as string) || ''} onChange={(e) => ui!('items', i, 'icon', e.target.value)} />
              <input className={`${INPUT_CLS} w-28`} placeholder="Angka" value={(item.angka as string) || ''} onChange={(e) => ui!('items', i, 'angka', e.target.value)} />
              <input className={`${INPUT_CLS} w-20`} placeholder="Satuan" value={(item.satuan as string) || ''} onChange={(e) => ui!('items', i, 'satuan', e.target.value)} />
              <input className={INPUT_CLS} placeholder="Label…" value={(item.label as string) || ''} onChange={(e) => ui!('items', i, 'label', e.target.value)} />
              <ColorPicker value={(item.color as string) || '#3ecfcf'} onChange={(v) => ui!('items', i, 'color', v)} />
              <button onClick={() => ri!('items', i)} className="text-zinc-600 hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
          </div>
        ))}
        <button onClick={() => ai!('items', { icon: '📊', angka: '', satuan: '', label: '', color: '#3ecfcf' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Item</button>
      </div>
    </div>
  );
}

// ── 17. Polling Editor ────────────────────────────────────
function PollingEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const opsi = (mod.opsi as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Instruksi</FieldLabel>
        <input className={INPUT_CLS} placeholder="Pilih satu jawaban…" value={(mod.instruksi as string) || ''} onChange={(e) => uf('instruksi', e.target.value)} />
      </div>
      <div className="flex gap-3">
        <div>
          <FieldLabel>Tipe Voting</FieldLabel>
          <select className={SELECT_CLS} value={(mod.tipe as string) || 'single'} onChange={(e) => uf('tipe', e.target.value)}>
            <option value="single">Pilihan Tunggal</option>
            <option value="multiple">Pilihan Ganda</option>
          </select>
        </div>
        <div>
          <FieldLabel>Anonim</FieldLabel>
          <label className="flex items-center gap-2 mt-2">
            <input type="checkbox" checked={(mod.anonymous as boolean) || false} onChange={(e) => uf('anonymous', e.target.checked)} className="rounded" />
            <span className="text-sm text-zinc-300">Voting anonim</span>
          </label>
        </div>
      </div>
      <div>
        <FieldLabel>Opsi ({opsi.length})</FieldLabel>
        {opsi.map((o, i) => (
          <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-2 flex items-center gap-2">
            <input className={`${INPUT_CLS} w-12`} value={(o.icon as string) || ''} onChange={(e) => ui!('opsi', i, 'icon', e.target.value)} placeholder="📊" />
            <input className={INPUT_CLS} placeholder="Teks opsi…" value={(o.teks as string) || ''} onChange={(e) => ui!('opsi', i, 'teks', e.target.value)} />
            <ColorPicker value={(o.warna as string) || '#3ecfcf'} onChange={(v) => ui!('opsi', i, 'warna', v)} />
            <button onClick={() => ri!('opsi', i)} className="text-zinc-600 hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
          </div>
        ))}
        <button onClick={() => ai!('opsi', { icon: '', teks: '', warna: '#3ecfcf' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Opsi</button>
      </div>
    </div>
  );
}

// ── 18. Embed Editor ──────────────────────────────────────
function EmbedEditor({ mod, uf }: EdProps) {
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>URL Embed</FieldLabel>
        <input className={INPUT_CLS} placeholder="https://..." value={(mod.url as string) || ''} onChange={(e) => uf('url', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Tinggi (px)</FieldLabel>
          <input className={INPUT_CLS} type="number" value={(mod.height as number) || 400} onChange={(e) => uf('height', Number(e.target.value))} />
        </div>
        <div>
          <FieldLabel>Label Link</FieldLabel>
          <input className={INPUT_CLS} value={(mod.label as string) || ''} onChange={(e) => uf('label', e.target.value)} />
        </div>
      </div>
    </div>
  );
}

// ── 19. Tab Icons Editor ──────────────────────────────────
function TabIconsEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const tabs = (mod.tabs as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={2} placeholder="Pengantar…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div className="flex gap-3">
        <div>
          <FieldLabel>Layout</FieldLabel>
          <select className={SELECT_CLS} value={(mod.layout as string) || 'horizontal'} onChange={(e) => uf('layout', e.target.value)}>
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
            <option value="pills">Pills</option>
          </select>
        </div>
        <div>
          <FieldLabel>Animasi</FieldLabel>
          <select className={SELECT_CLS} value={(mod.animation as string) || 'fade'} onChange={(e) => uf('animation', e.target.value)}>
            <option value="fade">Fade In</option>
            <option value="slide-up">Slide Up</option>
            <option value="zoom">Zoom</option>
            <option value="bounce">Bounce</option>
          </select>
        </div>
      </div>
      <div>
        <FieldLabel>Tabs ({tabs.length})</FieldLabel>
        {tabs.map((tab, i) => (
          <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-2 space-y-2">
            <div className="flex items-center gap-2">
              <input className={`${INPUT_CLS} w-16`} value={(tab.icon as string) || ''} onChange={(e) => ui!('tabs', i, 'icon', e.target.value)} placeholder="📌" />
              <input className={INPUT_CLS} placeholder="Judul tab…" value={(tab.judul as string) || ''} onChange={(e) => ui!('tabs', i, 'judul', e.target.value)} />
              <ColorPicker value={(tab.warna as string) || '#3ecfcf'} onChange={(v) => ui!('tabs', i, 'warna', v)} />
              <button onClick={() => ri!('tabs', i)} className="text-zinc-600 hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
            <textarea className={TEXTAREA_CLS} rows={2} placeholder="Isi tab…" value={(tab.isi as string) || ''} onChange={(e) => ui!('tabs', i, 'isi', e.target.value)} />
            <div>
              <FieldLabel>Pertanyaan Refleksi</FieldLabel>
              <input className={INPUT_CLS} placeholder="Pertanyaan refleksi…" value={(tab.refleksi as string) || ''} onChange={(e) => ui!('tabs', i, 'refleksi', e.target.value)} />
            </div>
          </div>
        ))}
        <button onClick={() => ai!('tabs', { icon: '', judul: '', warna: '#3ecfcf', isi: '', poin: [], refleksi: '' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Tab</button>
      </div>
    </div>
  );
}

// ── 20. Icon Explore Editor ───────────────────────────────
function IconExploreEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const items = (mod.items as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={2} placeholder="Pengantar…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div className="flex gap-3">
        <div>
          <FieldLabel>Layout</FieldLabel>
          <select className={SELECT_CLS} value={(mod.layout as string) || 'grid'} onChange={(e) => uf('layout', e.target.value)}>
            <option value="grid">Grid</option>
            <option value="carousel">Carousel</option>
            <option value="wheel">Wheel</option>
          </select>
        </div>
        <div>
          <FieldLabel>Animasi</FieldLabel>
          <select className={SELECT_CLS} value={(mod.animation as string) || 'fade'} onChange={(e) => uf('animation', e.target.value)}>
            <option value="fade">Fade In</option>
            <option value="slide-up">Slide Up</option>
            <option value="zoom">Zoom</option>
            <option value="bounce">Bounce</option>
          </select>
        </div>
      </div>
      <div>
        <FieldLabel>Item ({items.length})</FieldLabel>
        {items.map((item, i) => (
          <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-2 space-y-2">
            <div className="flex items-center gap-2">
              <input className={`${INPUT_CLS} w-16`} value={(item.icon as string) || ''} onChange={(e) => ui!('items', i, 'icon', e.target.value)} placeholder="📌" />
              <input className={INPUT_CLS} placeholder="Judul…" value={(item.judul as string) || ''} onChange={(e) => ui!('items', i, 'judul', e.target.value)} />
              <ColorPicker value={(item.warna as string) || '#3ecfcf'} onChange={(v) => ui!('items', i, 'warna', v)} />
              <button onClick={() => ri!('items', i)} className="text-zinc-600 hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
            <textarea className={TEXTAREA_CLS} rows={2} placeholder="Ringkasan…" value={(item.ringkasan as string) || ''} onChange={(e) => ui!('items', i, 'ringkasan', e.target.value)} />
            <textarea className={TEXTAREA_CLS} rows={3} placeholder="Isi lengkap…" value={(item.isi as string) || ''} onChange={(e) => ui!('items', i, 'isi', e.target.value)} />
          </div>
        ))}
        <button onClick={() => ai!('items', { icon: '', judul: '', warna: '#3ecfcf', ringkasan: '', isi: '', contoh: [], sanksi: '' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Item</button>
      </div>
    </div>
  );
}

// ── 21. Comparison Editor ─────────────────────────────────
function ComparisonEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const kolom = (mod.kolom as Array<Record<string, unknown>>) || [];
  const baris = (mod.baris as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={2} placeholder="Pengantar…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Kolom</FieldLabel>
        <div className="flex gap-2">
          {kolom.map((k, i) => (
            <div key={i} className="flex-1 p-2 bg-zinc-800/50 rounded-lg border border-zinc-700/50 space-y-1">
              <div className="flex items-center gap-1">
                <input className={`${INPUT_CLS} w-12`} value={(k.icon as string) || ''} onChange={(e) => ui!('kolom', i, 'icon', e.target.value)} placeholder="📌" />
                <input className={INPUT_CLS} placeholder="Judul kolom…" value={(k.judul as string) || ''} onChange={(e) => ui!('kolom', i, 'judul', e.target.value)} />
                <ColorPicker value={(k.warna as string) || '#3ecfcf'} onChange={(v) => ui!('kolom', i, 'warna', v)} />
              </div>
            </div>
          ))}
          <button onClick={() => ai!('kolom', { icon: '', judul: '', warna: '#60a5fa' })} className="text-xs text-amber-500">＋ Kolom</button>
        </div>
      </div>
      <div>
        <FieldLabel>Baris Perbandingan ({baris.length})</FieldLabel>
        {baris.map((b, i) => {
          const nilai = (b.nilai as string[]) || [''];
          return (
            <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-2 space-y-2">
              <div className="flex items-center gap-2">
                <input className={`${INPUT_CLS} w-12`} value={(b.icon as string) || ''} onChange={(e) => ui!('baris', i, 'icon', e.target.value)} placeholder="📌" />
                <input className={INPUT_CLS} placeholder="Label baris…" value={(b.label as string) || ''} onChange={(e) => ui!('baris', i, 'label', e.target.value)} />
                <button onClick={() => ri!('baris', i)} className="text-zinc-600 hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
              </div>
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${kolom.length}, 1fr)` }}>
                {kolom.map((_, ci) => (
                  <input key={ci} className={INPUT_CLS} value={nilai[ci] || ''} onChange={(e) => {
                    const n = [...nilai];
                    n[ci] = e.target.value;
                    ui!('baris', i, 'nilai', n);
                  }} placeholder={`Kolom ${ci + 1}`} />
                ))}
              </div>
            </div>
          );
        })}
        <button onClick={() => ai!('baris', { label: '', icon: '', nilai: kolom.map(() => '') })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Baris</button>
      </div>
      <div>
        <FieldLabel>Pertanyaan Refleksi</FieldLabel>
        <input className={INPUT_CLS} placeholder="Apa pendapatmu?" value={(mod.tanya as string) || ''} onChange={(e) => uf('tanya', e.target.value)} />
      </div>
    </div>
  );
}

// ── 22. Card Showcase Editor ──────────────────────────────
function CardShowcaseEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const cards = (mod.cards as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={2} placeholder="Pengantar…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div className="flex gap-3">
        <div>
          <FieldLabel>Layout</FieldLabel>
          <select className={SELECT_CLS} value={(mod.layout as string) || 'grid'} onChange={(e) => uf('layout', e.target.value)}>
            <option value="grid">Grid</option>
            <option value="list">List</option>
            <option value="masonry">Masonry</option>
          </select>
        </div>
        <div>
          <FieldLabel>Animasi</FieldLabel>
          <select className={SELECT_CLS} value={(mod.animation as string) || 'fade'} onChange={(e) => uf('animation', e.target.value)}>
            <option value="fade">Fade</option>
            <option value="slide-up">Slide Up</option>
            <option value="zoom">Zoom</option>
            <option value="bounce">Bounce</option>
          </select>
        </div>
      </div>
      <div>
        <FieldLabel>Cards ({cards.length})</FieldLabel>
        {cards.map((c, i) => (
          <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-2 space-y-2">
            <div className="flex items-center gap-2">
              <input className={`${INPUT_CLS} w-16`} value={(c.icon as string) || ''} onChange={(e) => ui!('cards', i, 'icon', e.target.value)} placeholder="📌" />
              <input className={INPUT_CLS} placeholder="Judul…" value={(c.judul as string) || ''} onChange={(e) => ui!('cards', i, 'judul', e.target.value)} />
              <ColorPicker value={(c.warna as string) || '#3ecfcf'} onChange={(v) => ui!('cards', i, 'warna', v)} />
              <button onClick={() => ri!('cards', i)} className="text-zinc-600 hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
            <input className={INPUT_CLS} placeholder="Subtitle…" value={(c.subtitle as string) || ''} onChange={(e) => ui!('cards', i, 'subtitle', e.target.value)} />
            <textarea className={TEXTAREA_CLS} rows={2} placeholder="Isi kartu…" value={(c.isi as string) || ''} onChange={(e) => ui!('cards', i, 'isi', e.target.value)} />
          </div>
        ))}
        <button onClick={() => ai!('cards', { icon: '', judul: '', subtitle: '', isi: '', tag: [], warna: '#3ecfcf' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Card</button>
      </div>
    </div>
  );
}

// ── 23. Hotspot Image Editor ──────────────────────────────
function HotspotImageEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const hotspots = (mod.hotspots as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={2} placeholder="Pengantar…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Image URL</FieldLabel>
          <input className={INPUT_CLS} placeholder="https://..." value={(mod.imageUrl as string) || ''} onChange={(e) => uf('imageUrl', e.target.value)} />
        </div>
        <div>
          <FieldLabel>Tinggi (px)</FieldLabel>
          <input className={INPUT_CLS} type="number" value={(mod.height as number) || 300} onChange={(e) => uf('height', Number(e.target.value))} />
        </div>
      </div>
      <div>
        <FieldLabel>Mode</FieldLabel>
        <div className="flex gap-2">
          {['pin', 'tooltip', 'card'].map((m) => (
            <button key={m} onClick={() => uf('mode', m)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-colors ${(mod.mode as string) === m ? 'border-amber-500 bg-amber-500/20 text-amber-400' : 'border-zinc-700/50 text-zinc-400'}`}>
              {m}
            </button>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel>Hotspots ({hotspots.length})</FieldLabel>
        {hotspots.map((h, i) => (
          <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-2 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">X:</span>
              <input className={`${INPUT_CLS} w-16`} type="number" value={(h.x as number) || 50} onChange={(e) => ui!('hotspots', i, 'x', Number(e.target.value))} />
              <span className="text-xs text-zinc-500">Y:</span>
              <input className={`${INPUT_CLS} w-16`} type="number" value={(h.y as number) || 50} onChange={(e) => ui!('hotspots', i, 'y', Number(e.target.value))} />
              <input className={`${INPUT_CLS} w-16`} value={(h.icon as string) || ''} onChange={(e) => ui!('hotspots', i, 'icon', e.target.value)} placeholder="📌" />
              <input className={INPUT_CLS} placeholder="Judul…" value={(h.judul as string) || ''} onChange={(e) => ui!('hotspots', i, 'judul', e.target.value)} />
              <button onClick={() => ri!('hotspots', i)} className="text-zinc-600 hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
            <textarea className={TEXTAREA_CLS} rows={2} placeholder="Deskripsi hotspot…" value={(h.isi as string) || ''} onChange={(e) => ui!('hotspots', i, 'isi', e.target.value)} />
          </div>
        ))}
        <button onClick={() => ai!('hotspots', { x: 50, y: 50, icon: '📌', judul: '', warna: '#f9c82e', isi: '' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Hotspot</button>
      </div>
    </div>
  );
}

// ── 24. Sorting Editor ────────────────────────────────────
function SortingEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const kategori = (mod.kategori as Array<Record<string, unknown>>) || [];
  const items = (mod.items as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Instruksi</FieldLabel>
        <input className={INPUT_CLS} placeholder="Kelompokkan item ke kategori yang tepat…" value={(mod.instruksi as string) || ''} onChange={(e) => uf('instruksi', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Kategori ({kategori.length})</FieldLabel>
        {kategori.map((k, i) => (
          <div key={i} className="p-2 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-2 flex items-center gap-2">
            <input className={INPUT_CLS} placeholder="Nama kategori…" value={(k.label as string) || ''} onChange={(e) => ui!('kategori', i, 'label', e.target.value)} />
            <ColorPicker value={(k.color as string) || '#3ecfcf'} onChange={(v) => ui!('kategori', i, 'color', v)} />
            <button onClick={() => ri!('kategori', i)} className="text-zinc-600 hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
          </div>
        ))}
        <button onClick={() => ai!('kategori', { label: '', color: '#60a5fa', id: 'cat' + Date.now() })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Kategori</button>
      </div>
      <div>
        <FieldLabel>Item ({items.length})</FieldLabel>
        {items.map((item, i) => (
          <div key={i} className="p-2 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-2 flex items-center gap-2">
            <input className={INPUT_CLS} placeholder="Teks item…" value={(item.teks as string) || ''} onChange={(e) => ui!('items', i, 'teks', e.target.value)} />
            <select className={`${SELECT_CLS} w-36`} value={(item.kategori as string) || ''} onChange={(e) => ui!('items', i, 'kategori', e.target.value)}>
              <option value="">Pilih kategori</option>
              {kategori.map((k, ci) => <option key={ci} value={String(k.id)}>{String(k.label)}</option>)}
            </select>
            <button onClick={() => ri!('items', i)} className="text-zinc-600 hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
          </div>
        ))}
        <button onClick={() => ai!('items', { teks: '', kategori: (kategori[0]?.id as string) || '' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Item</button>
      </div>
    </div>
  );
}

// ── 25. Spinwheel Editor ──────────────────────────────────
function SpinwheelEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const soal = (mod.soal as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Instruksi</FieldLabel>
        <input className={INPUT_CLS} placeholder="Putar roda dan jawab pertanyaan…" value={(mod.instruksi as string) || ''} onChange={(e) => uf('instruksi', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Soal ({soal.length})</FieldLabel>
        {soal.map((s, i) => (
          <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-2 space-y-2">
            <textarea className={TEXTAREA_CLS} rows={2} placeholder="Pertanyaan…" value={(s.teks as string) || ''} onChange={(e) => ui!('soal', i, 'teks', e.target.value)} />
            <div className="flex items-center gap-2">
              <input className={INPUT_CLS} placeholder="Kategori…" value={(s.kategori as string) || ''} onChange={(e) => ui!('soal', i, 'kategori', e.target.value)} />
              <button onClick={() => ri!('soal', i)} className="text-zinc-600 hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
          </div>
        ))}
        <button onClick={() => ai!('soal', { teks: '', kategori: '' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Soal</button>
      </div>
    </div>
  );
}

// ── 26. Teambuzzer Editor ─────────────────────────────────
function TeambuzzerEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const soal = (mod.soal as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Instruksi</FieldLabel>
        <input className={INPUT_CLS} placeholder="Kuis antar tim…" value={(mod.instruksi as string) || ''} onChange={(e) => uf('instruksi', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Nama Tim A</FieldLabel>
          <input className={INPUT_CLS} value={(mod.timA as string) || ''} onChange={(e) => uf('timA', e.target.value)} />
        </div>
        <div>
          <FieldLabel>Nama Tim B</FieldLabel>
          <input className={INPUT_CLS} value={(mod.timB as string) || ''} onChange={(e) => uf('timB', e.target.value)} />
        </div>
      </div>
      <div>
        <FieldLabel>Soal ({soal.length})</FieldLabel>
        {soal.map((s, i) => (
          <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-2 space-y-2">
            <textarea className={TEXTAREA_CLS} rows={2} placeholder="Pertanyaan…" value={(s.teks as string) || ''} onChange={(e) => ui!('soal', i, 'teks', e.target.value)} />
            <div className="flex items-center gap-2">
              <input className={INPUT_CLS} placeholder="Jawaban…" value={(s.jawaban as string) || ''} onChange={(e) => ui!('soal', i, 'jawaban', e.target.value)} />
              <div className="w-20">
                <FieldLabel>Poin</FieldLabel>
                <input className={INPUT_CLS} type="number" value={(s.poin as number) || 10} onChange={(e) => ui!('soal', i, 'poin', Number(e.target.value))} />
              </div>
              <button onClick={() => ri!('soal', i)} className="text-zinc-600 hover:text-red-400 text-sm p-1 flex-shrink-0 mt-4">✕</button>
            </div>
          </div>
        ))}
        <button onClick={() => ai!('soal', { teks: '', jawaban: '', poin: 10 })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Soal</button>
      </div>
    </div>
  );
}

// ── 27. Wordsearch Editor ─────────────────────────────────
function WordsearchEditor({ mod, uf }: EdProps) {
  const kataList = ((mod.kata as string[]) || []).join('\n');
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Instruksi</FieldLabel>
        <input className={INPUT_CLS} placeholder="Cari kata tersembunyi…" value={(mod.instruksi as string) || ''} onChange={(e) => uf('instruksi', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Kata (satu per baris, maks 10)</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={5} placeholder="norma\nhukum\nagama" value={kataList} onChange={(e) => uf('kata', e.target.value.split('\n').filter(Boolean).slice(0, 10))} />
      </div>
      <div>
        <FieldLabel>Ukuran Grid</FieldLabel>
        <select className={SELECT_CLS} value={(mod.ukuran as number) || 10} onChange={(e) => uf('ukuran', Number(e.target.value))}>
          <option value={8}>8 x 8</option>
          <option value={10}>10 x 10</option>
          <option value={12}>12 x 12</option>
          <option value={15}>15 x 15</option>
        </select>
      </div>
    </div>
  );
}

// ── 30. Petunjuk Editor ──────────────────────────────────
function PetunjukEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const langkah = (mod.langkah as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={2} placeholder="Ikuti langkah-langkah berikut…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Langkah Petunjuk ({langkah.length})</FieldLabel>
        {langkah.map((l, i) => (
          <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-2 space-y-2">
            <div className="flex items-center gap-2">
              <input className={`${INPUT_CLS} w-16`} placeholder="📌" value={(l.icon as string) || ''} onChange={(e) => ui!('langkah', i, 'icon', e.target.value)} />
              <input className={INPUT_CLS} placeholder="Judul langkah…" value={(l.judul as string) || ''} onChange={(e) => ui!('langkah', i, 'judul', e.target.value)} />
              <button onClick={() => ri!('langkah', i)} className="text-zinc-600 hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
            <textarea className={TEXTAREA_CLS} rows={2} placeholder="Deskripsi langkah…" value={(l.isi as string) || ''} onChange={(e) => ui!('langkah', i, 'isi', e.target.value)} />
          </div>
        ))}
        <button onClick={() => ai!('langkah', { icon: '📌', judul: '', isi: '' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Langkah</button>
      </div>
    </div>
  );
}

// ── 31. Diskusi Editor ───────────────────────────────────
function DiskusiEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const pertanyaan = (mod.pertanyaan as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={2} placeholder="Jawab pertanyaan berikut…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Pertanyaan Diskusi ({pertanyaan.length})</FieldLabel>
        {pertanyaan.map((p, i) => (
          <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-2 space-y-2">
            <div className="flex items-center gap-2">
              <input className={`${INPUT_CLS} w-16`} placeholder="💬" value={(p.icon as string) || ''} onChange={(e) => ui!('pertanyaan', i, 'icon', e.target.value)} />
              <input className={`${INPUT_CLS} w-40`} placeholder="Label…" value={(p.label as string) || ''} onChange={(e) => ui!('pertanyaan', i, 'label', e.target.value)} />
              <button onClick={() => ri!('pertanyaan', i)} className="text-zinc-600 hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
            <textarea className={TEXTAREA_CLS} rows={2} placeholder="Pertanyaan…" value={(p.teks as string) || ''} onChange={(e) => ui!('pertanyaan', i, 'teks', e.target.value)} />
            <input className={INPUT_CLS} placeholder="Petunjuk jawaban…" value={(p.petunjuk as string) || ''} onChange={(e) => ui!('pertanyaan', i, 'petunjuk', e.target.value)} />
          </div>
        ))}
        <button onClick={() => ai!('pertanyaan', { icon: '💬', label: '', teks: '', petunjuk: '' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Pertanyaan</button>
      </div>
    </div>
  );
}

// ── 32. Review Editor ───────────────────────────────────
function ReviewEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const kartu = (mod.kartu as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={2} placeholder="Apa yang sudah dipelajari…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Kartu Review ({kartu.length})</FieldLabel>
        {kartu.map((k, i) => (
          <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-2 space-y-2">
            <div className="flex items-center gap-2">
              <input className={`${INPUT_CLS} w-16`} placeholder="✅" value={(k.icon as string) || ''} onChange={(e) => ui!('kartu', i, 'icon', e.target.value)} />
              <input className={INPUT_CLS} placeholder="Judul kartu…" value={(k.judul as string) || ''} onChange={(e) => ui!('kartu', i, 'judul', e.target.value)} />
              <ColorPicker value={(k.warna as string) || '#f9c82e'} onChange={(v) => ui!('kartu', i, 'warna', v)} />
              <button onClick={() => ri!('kartu', i)} className="text-zinc-600 hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
            <textarea className={TEXTAREA_CLS} rows={2} placeholder="Isi kartu…" value={(k.isi as string) || ''} onChange={(e) => ui!('kartu', i, 'isi', e.target.value)} />
          </div>
        ))}
        <button onClick={() => ai!('kartu', { icon: '✅', judul: '', isi: '', warna: '#f9c82e' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Kartu</button>
      </div>
    </div>
  );
}

// ── 33. Refleksi Editor ─────────────────────────────────
function RefleksiEditor({ mod, uf, ai, ri, ui }: EdProps) {
  const pertanyaan = (mod.pertanyaan as Array<Record<string, unknown>>) || [];
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Intro</FieldLabel>
        <textarea className={TEXTAREA_CLS} rows={2} placeholder="Tuliskan refleksimu…" value={(mod.intro as string) || ''} onChange={(e) => uf('intro', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Pertanyaan Refleksi ({pertanyaan.length})</FieldLabel>
        {pertanyaan.map((p, i) => (
          <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 mb-2 space-y-2">
            <div className="flex items-center gap-2">
              <input className={`${INPUT_CLS} w-16`} placeholder="💭" value={(p.icon as string) || ''} onChange={(e) => ui!('pertanyaan', i, 'icon', e.target.value)} />
              <input className={INPUT_CLS} placeholder="Pertanyaan refleksi…" value={(p.teks as string) || ''} onChange={(e) => ui!('pertanyaan', i, 'teks', e.target.value)} />
              <button onClick={() => ri!('pertanyaan', i)} className="text-zinc-600 hover:text-red-400 text-sm p-1 flex-shrink-0">✕</button>
            </div>
            <input className={INPUT_CLS} placeholder="Petunjuk jawaban…" value={(p.petunjuk as string) || ''} onChange={(e) => ui!('pertanyaan', i, 'petunjuk', e.target.value)} />
          </div>
        ))}
        <button onClick={() => ai!('pertanyaan', { icon: '💭', teks: '', petunjuk: '' })} className="text-xs text-amber-500 hover:text-amber-400">＋ Tambah Pertanyaan</button>
      </div>
    </div>
  );
}
