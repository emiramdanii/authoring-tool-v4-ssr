'use client';

import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuthoringStore } from '@/store/authoring-store';

// ── Constants ────────────────────────────────────────────────────
const BG_THEMES = [
  { id: 'sbg-kampung', label: 'Kampung', emoji: '🏘️' },
  { id: 'sbg-kelas', label: 'Kelas', emoji: '🏫' },
  { id: 'sbg-pasar', label: 'Pasar', emoji: '🏪' },
  { id: 'sbg-jalan', label: 'Jalan', emoji: '🛣️' },
  { id: 'sbg-rumah', label: 'Rumah', emoji: '🏠' },
  { id: 'sbg-lapangan', label: 'Lapangan', emoji: '⚽' },
] as const;

const LEVEL_COLORS: Record<string, string> = {
  good: '#34d399',
  mid: '#f9c82e',
  bad: '#f87171',
};

const LEVEL_LABELS: Record<string, string> = {
  good: 'Baik',
  mid: 'Cukup',
  bad: 'Buruk',
};

const INPUT_CLS =
  'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors';

const TEXTAREA_CLS = INPUT_CLS + ' resize-none';

// ── Helper: field label ─────────────────────────────────────────
function FieldLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={`block text-xs font-medium text-zinc-400 mb-1.5 ${className || ''}`}>{children}</label>;
}

// ── Helper: bg theme info ───────────────────────────────────────
function bgThemeInfo(bgId: string) {
  return BG_THEMES.find((b) => b.id === bgId) || BG_THEMES[0];
}

// ── ChevronIcon ─────────────────────────────────────────────────
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ── Type helpers ────────────────────────────────────────────────
interface SetupItem {
  speaker: string;
  text: string;
}

interface ConsequenceItem {
  icon: string;
  text: string;
}

interface ChoiceItem {
  icon: string;
  label: string;
  detail: string;
  good: boolean;
  pts: number;
  level: string;
  norma: string;
  resultTitle: string;
  resultBody: string;
  consequences: ConsequenceItem[];
}

interface ChapterData {
  title: string;
  bg: string;
  charEmoji: string;
  charColor: string;
  charPants: string;
  choicePrompt: string;
  setup: SetupItem[];
  choices: ChoiceItem[];
}

function toChapter(raw: Record<string, unknown>): ChapterData {
  return {
    title: (raw.title as string) || '',
    bg: (raw.bg as string) || 'sbg-kampung',
    charEmoji: (raw.charEmoji as string) || '🧑',
    charColor: (raw.charColor as string) || '#3ecfcf',
    charPants: (raw.charPants as string) || '#2563eb',
    choicePrompt: (raw.choicePrompt as string) || '',
    setup: (Array.isArray(raw.setup) ? raw.setup : []) as SetupItem[],
    choices: (Array.isArray(raw.choices) ? raw.choices : []) as ChoiceItem[],
  };
}

// ── Chapter List Card ───────────────────────────────────────────
function ChapterCard({
  chapter,
  index,
  onEdit,
  onRemove,
}: {
  chapter: ChapterData;
  index: number;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const bgInfo = bgThemeInfo(chapter.bg);
  const setupCount = chapter.setup.length;
  const choiceCount = chapter.choices.length;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-zinc-200 truncate">
            {chapter.title || 'Bab Tanpa Judul'}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className="inline-flex items-center gap-1 text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md">
              {bgInfo.emoji} {bgInfo.label}
            </span>
            <span className="text-xs text-zinc-500">
              💬 {setupCount} dialog
            </span>
            <span className="text-xs text-zinc-500">
              🔀 {choiceCount} pilihan
            </span>
            <span className="text-lg leading-none ml-1">{chapter.charEmoji}</span>
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="px-2.5 py-1.5 text-xs text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-md transition-colors"
          >
            ✏️ Edit
          </button>
          <button
            onClick={onRemove}
            className="px-2.5 py-1.5 text-xs text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Setup Dialog Editor ─────────────────────────────────────────
function SetupEditor({ chapterIndex }: { chapterIndex: number }) {
  const chapter = useAuthoringStore((s) => toChapter(s.skenario[chapterIndex] || {}));
  const addSetup = useAuthoringStore((s) => s.addSkenarioSetup);
  const removeSetup = useAuthoringStore((s) => s.removeSkenarioSetup);
  const updateSetup = useAuthoringStore((s) => s.updateSkenarioSetup);
  const listRef = useRef<HTMLDivElement>(null);

  const handleAdd = useCallback(() => {
    addSetup(chapterIndex);
    setTimeout(() => {
      const el = listRef.current?.lastElementChild;
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, [chapterIndex, addSetup]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <FieldLabel>Dialog / Narasi ({chapter.setup.length})</FieldLabel>
        <button onClick={handleAdd} className="text-xs text-amber-500 hover:text-amber-400 transition-colors">
          ＋ Tambah Dialog
        </button>
      </div>
      <div ref={listRef} className="space-y-2">
        {chapter.setup.map((s, i) => (
          <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 space-y-2">
            <div className="flex items-center gap-2">
              <input
                className={`${INPUT_CLS} w-40`}
                placeholder="Pembicara (NARRATOR, TOKOH…)"
                value={s.speaker}
                onChange={(e) => updateSetup(chapterIndex, i, 'speaker', e.target.value)}
              />
              {chapter.setup.length > 1 && (
                <button
                  onClick={() => removeSetup(chapterIndex, i)}
                  className="text-zinc-600 hover:text-red-400 transition-colors text-sm p-1 flex-shrink-0"
                >
                  ✕
                </button>
              )}
            </div>
            <textarea
              className={TEXTAREA_CLS}
              rows={2}
              placeholder="Isi dialog / narasi…"
              value={s.text}
              onChange={(e) => updateSetup(chapterIndex, i, 'text', e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Choice Editor Card ──────────────────────────────────────────
function ChoiceEditor({
  chapterIndex,
  choiceIndex,
}: {
  chapterIndex: number;
  choiceIndex: number;
}) {
  const chapter = useAuthoringStore((s) => toChapter(s.skenario[chapterIndex] || {}));
  const choice = chapter.choices[choiceIndex] || {} as ChoiceItem;
  const updateChoice = useAuthoringStore((s) => s.updateSkenarioChoice);
  const addConsequence = useAuthoringStore((s) => s.addSkenarioConsequence);
  const removeConsequence = useAuthoringStore((s) => s.removeSkenarioConsequence);
  const updateConsequence = useAuthoringStore((s) => s.updateSkenarioConsequence);
  const consequences: ConsequenceItem[] = Array.isArray(choice.consequences) ? choice.consequences : [];

  const levelColor = LEVEL_COLORS[choice.level] || LEVEL_COLORS.mid;

  return (
    <div
      className="bg-zinc-800/40 border rounded-xl p-4 space-y-4"
      style={{ borderColor: levelColor + '40' }}
    >
      {/* Choice header */}
      <div className="flex items-center gap-2">
        <span className="text-lg">{choice.icon || '🔍'}</span>
        <span className="text-xs font-medium text-zinc-400">
          Pilihan {choiceIndex + 1}
        </span>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-md"
          style={{
            backgroundColor: levelColor + '20',
            color: levelColor,
          }}
        >
          {LEVEL_LABELS[choice.level] || choice.level}
        </span>
        {choice.good && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400">
            ✅ Benar
          </span>
        )}
        <span className="text-xs text-zinc-500 ml-auto">{choice.pts || 0} poin</span>
      </div>

      {/* Icon + Label + Detail */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <FieldLabel>Ikon (Emoji)</FieldLabel>
          <input
            className={INPUT_CLS}
            placeholder="🤝"
            value={choice.icon || ''}
            onChange={(e) => updateChoice(chapterIndex, choiceIndex, 'icon', e.target.value)}
          />
        </div>
        <div>
          <FieldLabel>Label Pilihan</FieldLabel>
          <input
            className={INPUT_CLS}
            placeholder="Label singkat…"
            value={choice.label || ''}
            onChange={(e) => updateChoice(chapterIndex, choiceIndex, 'label', e.target.value)}
          />
        </div>
        <div>
          <FieldLabel>Detail / Penjelasan</FieldLabel>
          <input
            className={INPUT_CLS}
            placeholder="Penjelasan singkat…"
            value={choice.detail || ''}
            onChange={(e) => updateChoice(chapterIndex, choiceIndex, 'detail', e.target.value)}
          />
        </div>
      </div>

      {/* Good toggle + Points + Level */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2 pb-2">
          <label className="text-xs text-zinc-400">Benar?</label>
          <button
            onClick={() => updateChoice(chapterIndex, choiceIndex, 'good', !choice.good)}
            className={`relative w-10 h-5 rounded-full transition-colors ${choice.good ? 'bg-emerald-500' : 'bg-zinc-700'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${choice.good ? 'translate-x-5' : ''}`}
            />
          </button>
        </div>
        <div className="w-24">
          <FieldLabel>Poin</FieldLabel>
          <input
            type="number"
            className={INPUT_CLS}
            placeholder="10"
            value={choice.pts ?? 0}
            onChange={(e) => updateChoice(chapterIndex, choiceIndex, 'pts', Number(e.target.value) || 0)}
          />
        </div>
        <div>
          <FieldLabel>Level</FieldLabel>
          <div className="flex gap-1">
            {(['good', 'mid', 'bad'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => updateChoice(chapterIndex, choiceIndex, 'level', lvl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  choice.level === lvl ? 'border-current' : 'border-zinc-700/50 opacity-50 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: LEVEL_COLORS[lvl] + (choice.level === lvl ? '25' : '10'),
                  color: LEVEL_COLORS[lvl],
                  borderColor: choice.level === lvl ? LEVEL_COLORS[lvl] + '60' : undefined,
                }}
              >
                {LEVEL_LABELS[lvl]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Norma */}
      <div>
        <FieldLabel>Teks Norma</FieldLabel>
        <input
          className={INPUT_CLS}
          placeholder="Norma yang terkait dengan pilihan ini…"
          value={choice.norma || ''}
          onChange={(e) => updateChoice(chapterIndex, choiceIndex, 'norma', e.target.value)}
        />
      </div>

      {/* Result */}
      <div className="space-y-2">
        <FieldLabel>Hasil (Result)</FieldLabel>
        <input
          className={INPUT_CLS}
          placeholder="Judul hasil…"
          value={choice.resultTitle || ''}
          onChange={(e) => updateChoice(chapterIndex, choiceIndex, 'resultTitle', e.target.value)}
        />
        <textarea
          className={TEXTAREA_CLS}
          rows={2}
          placeholder="Isi penjelasan hasil…"
          value={choice.resultBody || ''}
          onChange={(e) => updateChoice(chapterIndex, choiceIndex, 'resultBody', e.target.value)}
        />
      </div>

      {/* Consequences */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <FieldLabel className="mb-0">Konsekuensi ({consequences.length})</FieldLabel>
          <button
            onClick={() => addConsequence(chapterIndex, choiceIndex)}
            className="text-xs text-amber-500 hover:text-amber-400 transition-colors"
          >
            ＋ Tambah
          </button>
        </div>
        {consequences.map((c, ci) => (
          <div key={ci} className="flex items-center gap-2">
            <input
              className={`${INPUT_CLS} w-14`}
              placeholder="📌"
              value={c.icon || ''}
              onChange={(e) => updateConsequence(chapterIndex, choiceIndex, ci, 'icon', e.target.value)}
            />
            <input
              className={`${INPUT_CLS} flex-1`}
              placeholder="Konsekuensi…"
              value={c.text || ''}
              onChange={(e) => updateConsequence(chapterIndex, choiceIndex, ci, 'text', e.target.value)}
            />
            {consequences.length > 1 && (
              <button
                onClick={() => removeConsequence(chapterIndex, choiceIndex, ci)}
                className="text-zinc-600 hover:text-red-400 transition-colors text-sm p-1 flex-shrink-0"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Chapter Detail Editor ───────────────────────────────────────
function ChapterDetail({
  chapterIndex,
  onBack,
}: {
  chapterIndex: number;
  onBack: () => void;
}) {
  const chapter = useAuthoringStore((s) => toChapter(s.skenario[chapterIndex] || {}));
  const updateChapter = useAuthoringStore((s) => s.updateSkenarioChapter);
  const addChoice = useAuthoringStore((s) => s.addSkenarioChoice);
  const removeChoice = useAuthoringStore((s) => s.removeSkenarioChoice);
  const listRef = useRef<HTMLDivElement>(null);
  const bgInfo = bgThemeInfo(chapter.bg);

  const handleAddChoice = useCallback(() => {
    addChoice(chapterIndex);
    setTimeout(() => {
      const el = listRef.current?.lastElementChild;
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, [chapterIndex, addChoice]);

  return (
    <div className="space-y-5">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        ← Kembali ke Daftar Bab
      </button>

      {/* Chapter header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
          {chapterIndex + 1}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-zinc-100">
            Bab {chapterIndex + 1}: {chapter.title || 'Tanpa Judul'}
          </h3>
          <span className="text-xs text-zinc-500">{bgInfo.emoji} {bgInfo.label}</span>
        </div>
      </div>

      {/* ── Basic Info ──────────────────────────────────────────── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h4 className="text-sm font-semibold text-zinc-200">📋 Informasi Dasar</h4>

        {/* Title */}
        <div>
          <FieldLabel>Judul Bab</FieldLabel>
          <input
            className={INPUT_CLS}
            placeholder="Judul bab skenario…"
            value={chapter.title || ''}
            onChange={(e) => updateChapter(chapterIndex, 'title', e.target.value)}
          />
        </div>

        {/* Background theme selector */}
        <div>
          <FieldLabel>Latar Belakang</FieldLabel>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {BG_THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => updateChapter(chapterIndex, 'bg', theme.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors text-center ${
                  chapter.bg === theme.id
                    ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                    : 'border-zinc-700/50 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                }`}
              >
                <div className="text-lg mb-0.5">{theme.emoji}</div>
                <div className="text-[0.65rem]">{theme.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Character */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <FieldLabel>Karakter (Emoji)</FieldLabel>
            <input
              className={INPUT_CLS}
              placeholder="🧑"
              value={chapter.charEmoji || ''}
              onChange={(e) => updateChapter(chapterIndex, 'charEmoji', e.target.value)}
            />
          </div>
          <div>
            <FieldLabel>Warna Baju</FieldLabel>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="w-8 h-8 rounded cursor-pointer border border-zinc-700 bg-transparent"
                value={chapter.charColor || '#3ecfcf'}
                onChange={(e) => updateChapter(chapterIndex, 'charColor', e.target.value)}
              />
              <span className="text-xs text-zinc-500 font-mono">{chapter.charColor || '#3ecfcf'}</span>
            </div>
          </div>
          <div>
            <FieldLabel>Warna Celana</FieldLabel>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="w-8 h-8 rounded cursor-pointer border border-zinc-700 bg-transparent"
                value={chapter.charPants || '#2563eb'}
                onChange={(e) => updateChapter(chapterIndex, 'charPants', e.target.value)}
              />
              <span className="text-xs text-zinc-500 font-mono">{chapter.charPants || '#2563eb'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Dialog Setup ────────────────────────────────────────── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
        <h4 className="text-sm font-semibold text-zinc-200">💬 Dialog & Narasi</h4>
        <SetupEditor chapterIndex={chapterIndex} />
      </div>

      {/* ── Choice Prompt ───────────────────────────────────────── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
        <h4 className="text-sm font-semibold text-zinc-200">🔀 Pilihan Siswa</h4>
        <div>
          <FieldLabel>Pertanyaan Pilihan</FieldLabel>
          <input
            className={INPUT_CLS}
            placeholder="Apa yang akan kamu lakukan?"
            value={chapter.choicePrompt || ''}
            onChange={(e) => updateChapter(chapterIndex, 'choicePrompt', e.target.value)}
          />
        </div>

        {/* Choices list */}
        <div ref={listRef} className="space-y-4">
          {chapter.choices.map((_, ci) => (
            <ChoiceEditor key={ci} chapterIndex={chapterIndex} choiceIndex={ci} />
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleAddChoice}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-lg transition-colors"
          >
            ＋ Tambah Pilihan
          </button>
          {chapter.choices.length > 1 && (
            <button
              onClick={() => {
                removeChoice(chapterIndex, chapter.choices.length - 1);
                toast.success('Pilihan terakhir dihapus');
              }}
              className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
            >
              Hapus Pilihan Terakhir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Skenario Component ─────────────────────────────────────
export default function Skenario() {
  const skenario = useAuthoringStore((s) => s.skenario);
  const addSkenarioChapter = useAuthoringStore((s) => s.addSkenarioChapter);
  const removeSkenarioChapter = useAuthoringStore((s) => s.removeSkenarioChapter);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const handleAdd = useCallback(() => {
    addSkenarioChapter();
    setTimeout(() => {
      const el = listRef.current?.lastElementChild;
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    toast.success('✅ Bab baru ditambahkan');
  }, [addSkenarioChapter]);

  const handleRemove = useCallback(
    (index: number) => {
      removeSkenarioChapter(index);
      if (editingIndex === index) setEditingIndex(null);
      else if (editingIndex !== null && editingIndex > index) setEditingIndex(editingIndex - 1);
      toast.success('🗑️ Bab dihapus');
    },
    [removeSkenarioChapter, editingIndex],
  );

  // Editing mode
  if (editingIndex !== null && editingIndex < skenario.length) {
    return (
      <div className="p-6 space-y-4 max-w-5xl">
        <ChapterDetail
          chapterIndex={editingIndex}
          onBack={() => setEditingIndex(null)}
        />
      </div>
    );
  }

  // List mode
  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <span>🎭</span> Skenario Interaktif
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          Buat cerita bercabang untuk siswa belajar tentang norma dan nilai.
        </p>
      </div>

      {/* Chapter count */}
      <div className="text-xs text-zinc-500">
        {skenario.length} bab skenario
      </div>

      {/* Empty state */}
      {skenario.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="text-4xl mb-3">🎭</div>
          <p className="text-sm text-zinc-400 mb-1">Belum ada bab skenario.</p>
          <p className="text-xs text-zinc-500 mb-4">
            Tambahkan bab pertama untuk mulai membuat skenario interaktif.
          </p>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-lg transition-colors"
          >
            ＋ Tambah Bab Pertama
          </button>
        </div>
      ) : (
        <>
          {/* Chapter list */}
          <div ref={listRef} className="space-y-3">
            {skenario.map((raw, i) => (
              <ChapterCard
                key={i}
                chapter={toChapter(raw)}
                index={i}
                onEdit={() => setEditingIndex(i)}
                onRemove={() => handleRemove(i)}
              />
            ))}
          </div>

          {/* Add chapter button */}
          <button
            onClick={handleAdd}
            className="w-full px-4 py-3 bg-zinc-900 border border-dashed border-zinc-700 rounded-xl text-sm text-zinc-400 hover:text-amber-400 hover:border-amber-500/50 transition-colors"
          >
            ＋ Tambah Bab Baru
          </button>
        </>
      )}

      {/* Tips */}
      {skenario.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-zinc-200 mb-2">💡 Tips Membuat Skenario</h4>
          <ul className="text-xs text-zinc-400 space-y-1.5">
            <li>• Setiap bab merepresentasikan satu situasi konflik norma</li>
            <li>• Buat 2-4 pilihan per bab dengan tingkat kebaikan yang berbeda</li>
            <li>• Tambahkan norma terkait di setiap pilihan untuk memperkuat pembelajaran</li>
            <li>• Gunakan konsekuensi untuk menjelaskan dampak dari setiap pilihan</li>
            <li>• Variasikan latar belakang (kampung, sekolah, pasar, dll.) untuk konteks yang berbeda</li>
          </ul>
        </div>
      )}
    </div>
  );
}
