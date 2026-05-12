'use client';

import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuthoringStore } from '@/store/authoring-store';
import { Drama, Trash2, Pencil } from 'lucide-react';
import { COLORS } from '@/lib/color-palette';

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
  good: COLORS.choiceA,
  mid: COLORS.choiceB,
  bad: COLORS.choiceC,
};

const LEVEL_LABELS: Record<string, string> = {
  good: 'Baik',
  mid: 'Cukup',
  bad: 'Buruk',
};

const INPUT_CLS =
  'w-full bg-app-elevated border border-app-border rounded-lg px-3 py-2 text-sm text-app-primary placeholder:text-app-muted focus:outline-none focus:ring-2 focus:ring-app-accent/50 focus:border-app-accent/50 transition-colors';

const TEXTAREA_CLS = INPUT_CLS + ' resize-none';

// ── Helper: field label ─────────────────────────────────────────
function FieldLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={`block text-xs font-medium text-app-secondary mb-1.5 ${className || ''}`}>{children}</label>;
}

// ── Helper: bg theme info ───────────────────────────────────────
function bgThemeInfo(bgId: string) {
  return BG_THEMES.find((b) => b.id === bgId) || BG_THEMES[0];
}

// ── ChevronIcon ─────────────────────────────────────────────────
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-app-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
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
    charColor: (raw.charColor as string) || COLORS.choiceD,
    charPants: (raw.charPants as string) || COLORS.faseSosial,
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
    <div className="bg-app-surface border border-app-border rounded-xl p-4 hover:border-app-border transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-app-accent/15 text-app-accent flex items-center justify-center text-sm font-bold flex-shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-app-primary truncate">
            {chapter.title || 'Bab Tanpa Judul'}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className="inline-flex items-center gap-1 text-xs text-app-secondary bg-app-elevated px-2 py-0.5 rounded-md">
              {bgInfo.emoji} {bgInfo.label}
            </span>
            <span className="text-xs text-app-muted">
              💬 {setupCount} dialog
            </span>
            <span className="text-xs text-app-muted">
              🔀 {choiceCount} pilihan
            </span>
            <span className="text-lg leading-none ml-1">{chapter.charEmoji}</span>
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="px-2.5 py-1.5 text-xs text-app-secondary hover:text-app-accent hover:bg-app-accent/10 rounded-md transition-colors"
          >
            <Pencil size={12} className="inline" /> Edit
          </button>
          <button
            onClick={onRemove}
            className="px-2.5 py-1.5 text-xs text-app-secondary hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
          >
            <Trash2 size={14} />
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
        <button onClick={handleAdd} className="text-xs text-app-accent hover:text-app-accent/80 transition-colors">
          ＋ Tambah Dialog
        </button>
      </div>
      <div ref={listRef} className="space-y-2">
        {chapter.setup.map((s, i) => (
          <div key={i} className="p-3 bg-app-elevated/50 rounded-lg border border-app-border/50 space-y-2">
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
                  className="text-app-muted hover:text-red-400 transition-colors text-sm p-1 flex-shrink-0"
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
      className="bg-app-elevated/40 border rounded-xl p-4 space-y-4"
      style={{ borderColor: levelColor + '40' }}
    >
      {/* Choice header */}
      <div className="flex items-center gap-2">
        <span className="text-lg">{choice.icon || '🔍'}</span>
        <span className="text-xs font-medium text-app-secondary">
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
        <span className="text-xs text-app-muted ml-auto">{choice.pts || 0} poin</span>
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
          <label className="text-xs text-app-secondary">Benar?</label>
          <button
            onClick={() => updateChoice(chapterIndex, choiceIndex, 'good', !choice.good)}
            className={`relative w-10 h-5 rounded-full transition-colors ${choice.good ? 'bg-emerald-500' : 'bg-app-elevated'}`}
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
                  choice.level === lvl ? 'border-current' : 'border-app-border/50 opacity-50 hover:opacity-100'
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
            className="text-xs text-app-accent hover:text-app-accent/80 transition-colors"
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
                className="text-app-muted hover:text-red-400 transition-colors text-sm p-1 flex-shrink-0"
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
        className="flex items-center gap-1 text-sm text-app-secondary hover:text-app-primary transition-colors"
      >
        ← Kembali ke Daftar Bab
      </button>

      {/* Chapter header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-app-accent/15 text-app-accent flex items-center justify-center text-sm font-bold flex-shrink-0">
          {chapterIndex + 1}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-app-primary">
            Bab {chapterIndex + 1}: {chapter.title || 'Tanpa Judul'}
          </h3>
          <span className="text-xs text-app-muted">{bgInfo.emoji} {bgInfo.label}</span>
        </div>
      </div>

      {/* ── Basic Info ──────────────────────────────────────────── */}
      <div className="bg-app-surface border border-app-border rounded-xl p-5 space-y-4">
        <h4 className="text-sm font-semibold text-app-primary">📋 Informasi Dasar</h4>

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
                    ? 'border-app-accent/50 bg-app-accent/15 text-app-accent'
                    : 'border-app-border/50 bg-app-elevated/50 text-app-secondary hover:border-app-border hover:text-app-primary'
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
                className="w-8 h-8 rounded cursor-pointer border border-app-border bg-transparent"
                value={chapter.charColor || COLORS.choiceD}
                onChange={(e) => updateChapter(chapterIndex, 'charColor', e.target.value)}
              />
              <span className="text-xs text-app-muted font-mono">{chapter.charColor || COLORS.choiceD}</span>
            </div>
          </div>
          <div>
            <FieldLabel>Warna Celana</FieldLabel>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="w-8 h-8 rounded cursor-pointer border border-app-border bg-transparent"
                value={chapter.charPants || COLORS.faseSosial}
                onChange={(e) => updateChapter(chapterIndex, 'charPants', e.target.value)}
              />
              <span className="text-xs text-app-muted font-mono">{chapter.charPants || COLORS.faseSosial}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Dialog Setup ────────────────────────────────────────── */}
      <div className="bg-app-surface border border-app-border rounded-xl p-5 space-y-3">
        <h4 className="text-sm font-semibold text-app-primary">💬 Dialog & Narasi</h4>
        <SetupEditor chapterIndex={chapterIndex} />
      </div>

      {/* ── Choice Prompt ───────────────────────────────────────── */}
      <div className="bg-app-surface border border-app-border rounded-xl p-5 space-y-3">
        <h4 className="text-sm font-semibold text-app-primary">🔀 Pilihan Siswa</h4>
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
            className="px-4 py-2 bg-app-accent hover:bg-app-accent/90 text-app-inverse font-semibold text-sm rounded-lg transition-colors"
          >
            ＋ Tambah Pilihan
          </button>
          {chapter.choices.length > 1 && (
            <button
              onClick={() => {
                removeChoice(chapterIndex, chapter.choices.length - 1);
                toast.success('Pilihan terakhir dihapus');
              }}
              className="text-xs text-app-muted hover:text-red-400 transition-colors"
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
        <h2 className="text-xl font-bold text-app-primary flex items-center gap-2">
          <Drama size={16} className="inline" /> Skenario Interaktif
        </h2>
        <p className="text-sm text-app-secondary mt-1">
          Buat cerita bercabang untuk siswa belajar tentang norma dan nilai.
        </p>
      </div>

      {/* Chapter count */}
      <div className="text-xs text-app-muted">
        {skenario.length} bab skenario
      </div>

      {/* Empty state */}
      {skenario.length === 0 ? (
        <div className="text-center py-12 bg-app-surface border border-app-border rounded-xl">
          <div className="text-4xl mb-3"><Drama size={36} className="text-app-muted" /></div>
          <p className="text-sm text-app-secondary mb-1">Belum ada bab skenario.</p>
          <p className="text-xs text-app-muted mb-4">
            Tambahkan bab pertama untuk mulai membuat skenario interaktif.
          </p>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-app-accent hover:bg-app-accent/90 text-app-inverse font-semibold text-sm rounded-lg transition-colors"
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
            className="w-full px-4 py-3 bg-app-surface border border-dashed border-app-border rounded-xl text-sm text-app-secondary hover:text-app-accent hover:border-app-accent/50 transition-colors"
          >
            ＋ Tambah Bab Baru
          </button>
        </>
      )}

      {/* Tips */}
      {skenario.length > 0 && (
        <div className="bg-app-surface border border-app-border rounded-xl p-4">
          <h4 className="text-sm font-semibold text-app-primary mb-2">💡 Tips Membuat Skenario</h4>
          <ul className="text-xs text-app-secondary space-y-1.5">
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
