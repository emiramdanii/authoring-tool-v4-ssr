'use client';

import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useAuthoringStore } from '@/store/authoring-store';
import type { CpState, TpItem, AlurItem, KuisItem } from '@/store/authoring-store';
import {
  parse,
  genCP,
  genTP,
  genATP,
  genAlur,
  genKuis,
  genFlashcard,
  genSkenario,
  genMatching,
  genTrueFalse,
  GEN_BUTTONS,
  type ParseResult,
  type GenSettings,
  type GenType,
  type PreviewData,
  type FlashcardItem,
  type MatchingPair,
  type TrueFalseItem,
  type SkenarioChapter,
} from '@/lib/autogen';
import { Spinner } from './Spinner';
import { renderPreviewContent } from './previews';

// ═══════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════

export default function AutoGenerate() {
  const store = useAuthoringStore;
  const meta = useAuthoringStore((s) => s.meta);

  // ── Local state ─────────────────────────────────────────────
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [settings, setSettings] = useState<GenSettings>({
    jumlahKuis: 10,
    pertemuan: 3,
    bloomMax: 6,
  });
  const [loading, setLoading] = useState<Set<GenType>>(new Set());
  const [previews, setPreviews] = useState<PreviewData[]>([]);
  const [activePreview, setActivePreview] = useState<PreviewData | null>(null);

  // ── Parse handler ───────────────────────────────────────────
  const handleParse = useCallback(() => {
    if (text.trim().length < 50) {
      toast.error('Teks terlalu pendek. Paste minimal 50 karakter materi.');
      return;
    }
    const result = parse(text);
    setParsed(result);
    setPreviews([]);
    setActivePreview(null);
    toast.success(`✅ Teks diparsing: ${result.wordCount} kata, ${result.definitions.length} definisi ditemukan`);
  }, [text]);

  // ── Generate single type ────────────────────────────────────
  const handleGenerate = useCallback(
    (type: GenType) => {
      if (!parsed) {
        toast.error('Parse teks terlebih dahulu sebelum generate.');
        return;
      }

      setLoading((prev) => new Set(prev).add(type));

      // Simulate async for UX
      setTimeout(() => {
        try {
          let data: unknown;
          let count = 0;
          let label = '';
          let icon = '';

          switch (type) {
            case 'cp': {
              data = genCP(parsed, meta);
              count = 1;
              label = 'Capaian Pembelajaran';
              icon = '📋';
              break;
            }
            case 'tp': {
              data = genTP(parsed, settings);
              count = (data as TpItem[]).length;
              label = 'Tujuan Pembelajaran';
              icon = '🎯';
              break;
            }
            case 'atp': {
              const tps = genTP(parsed, settings);
              data = genATP(tps, meta, settings.pertemuan);
              count = (data as { pertemuan: unknown[] }).pertemuan.length;
              label = 'Alur Tujuan Pembelajaran';
              icon = '📅';
              break;
            }
            case 'alur': {
              const tps = genTP(parsed, settings);
              data = genAlur(tps, meta);
              count = (data as AlurItem[]).length;
              label = 'Alur Kegiatan';
              icon = '🗺️';
              break;
            }
            case 'kuis': {
              data = genKuis(parsed, settings.jumlahKuis);
              count = (data as KuisItem[]).length;
              label = 'Kuis Pilihan Ganda';
              icon = '❓';
              break;
            }
            case 'flashcard': {
              data = genFlashcard(parsed);
              count = (data as FlashcardItem[]).length;
              label = 'Flashcard';
              icon = '🃏';
              break;
            }
            case 'skenario': {
              data = genSkenario(parsed, meta);
              count = (data as SkenarioChapter[]).length;
              label = 'Skenario';
              icon = '🎭';
              break;
            }
            case 'matching': {
              data = genMatching(parsed);
              count = (data as MatchingPair[]).length;
              label = 'Game Matching';
              icon = '🔀';
              break;
            }
            case 'truefalse': {
              data = genTrueFalse(parsed);
              count = (data as TrueFalseItem[]).length;
              label = 'Game Benar/Salah';
              icon = '✅';
              break;
            }
          }

          const preview: PreviewData = { type, label, icon, data, count };
          setPreviews((prev) => {
            const filtered = prev.filter((p) => p.type !== type);
            return [...filtered, preview];
          });
          setActivePreview(preview);
          toast.success(`${icon} ${label} berhasil digenerate (${count} item)`);
        } catch (err) {
          toast.error(`Gagal generate: ${(err as Error).message}`);
        } finally {
          setLoading((prev) => {
            const next = new Set(prev);
            next.delete(type);
            return next;
          });
        }
      }, 300 + Math.random() * 400);
    },
    [parsed, meta, settings],
  );

  // ── Apply to store ──────────────────────────────────────────
  const handleApply = useCallback(
    (preview: PreviewData) => {
      switch (preview.type) {
        case 'cp': {
          const cpData = preview.data as CpState;
          store.getState().updateCp('elemen', cpData.elemen);
          store.getState().updateCp('subElemen', cpData.subElemen);
          store.getState().updateCp('capaianFase', cpData.capaianFase);
          store.getState().updateCp('fase', cpData.fase);
          store.getState().updateCp('kelas', cpData.kelas);
          // Clear and set profil
          const currentState = store.getState().cp;
          for (let i = currentState.profil.length - 1; i >= 0; i--) {
            store.getState().removeProfil(i);
          }
          for (const p of cpData.profil) {
            store.getState().addProfil(p);
          }
          toast.success('📋 CP diterapkan ke Dokumen');
          break;
        }
        case 'tp': {
          const tpData = preview.data as TpItem[];
          // Replace all TPs via setState
          store.setState({ tp: tpData, dirty: true });
          toast.success(`🎯 ${tpData.length} TP diterapkan`);
          break;
        }
        case 'atp': {
          const atpData = preview.data as { namaBab: string; jumlahPertemuan: number; pertemuan: unknown[] };
          store.setState({
            atp: {
              namaBab: atpData.namaBab,
              jumlahPertemuan: atpData.jumlahPertemuan,
              pertemuan: atpData.pertemuan as import('@/store/authoring-store').AtpPertemuan[],
            },
            dirty: true,
          });
          toast.success(`📅 ATP ${atpData.jumlahPertemuan} pertemuan diterapkan`);
          break;
        }
        case 'alur': {
          const alurData = preview.data as AlurItem[];
          store.setState({ alur: alurData, dirty: true });
          toast.success(`🗺️ ${alurData.length} langkah alur diterapkan`);
          break;
        }
        case 'kuis': {
          const kuisData = preview.data as KuisItem[];
          store.setState({ kuis: kuisData, dirty: true });
          toast.success(`❓ ${kuisData.length} soal kuis diterapkan`);
          break;
        }
        case 'skenario': {
          const skenarioData = preview.data as SkenarioChapter[];
          store.getState().setSkenario(skenarioData as unknown as Array<Record<string, unknown>>);
          toast.success(`🎭 ${skenarioData.length} bab skenario diterapkan`);
          break;
        }
        case 'flashcard': {
          const flashData = preview.data as FlashcardItem[];
          const currentGames = store.getState().games;
          const updated = currentGames.filter((g) => (g as Record<string, unknown>).type !== 'flashcard');
          updated.push({ type: 'flashcard', data: flashData });
          store.setState({ games: updated, dirty: true });
          toast.success(`🃏 ${flashData.length} flashcard diterapkan`);
          break;
        }
        case 'matching': {
          const matchData = preview.data as MatchingPair[];
          const currentGames = store.getState().games;
          const updated = currentGames.filter((g) => (g as Record<string, unknown>).type !== 'matching');
          updated.push({ type: 'matching', data: matchData });
          store.setState({ games: updated, dirty: true });
          toast.success(`🔀 ${matchData.length} pasangan matching diterapkan`);
          break;
        }
        case 'truefalse': {
          const tfData = preview.data as TrueFalseItem[];
          const currentGames = store.getState().games;
          const updated = currentGames.filter((g) => (g as Record<string, unknown>).type !== 'truefalse');
          updated.push({ type: 'truefalse', data: tfData });
          store.setState({ games: updated, dirty: true });
          toast.success(`✅ ${tfData.length} soal benar/salah diterapkan`);
          break;
        }
      }
    },
    [],
  );

  // ── Generate all ────────────────────────────────────────────
  const handleGenerateAll = useCallback(async () => {
    if (!parsed) {
      toast.error('Parse teks terlebih dahulu sebelum generate.');
      return;
    }

    const types: GenType[] = ['cp', 'tp', 'atp', 'alur', 'kuis', 'flashcard', 'skenario', 'matching', 'truefalse'];
    setLoading(new Set(types));
    toast.info('⚡ Generating semua konten...');

    const allPreviews: PreviewData[] = [];
    let delay = 0;

    for (const type of types) {
      setTimeout(() => {
        try {
          let data: unknown;
          let count = 0;
          let label = '';
          let icon = '';

          switch (type) {
            case 'cp':
              data = genCP(parsed, meta); count = 1; label = 'Capaian Pembelajaran'; icon = '📋'; break;
            case 'tp':
              data = genTP(parsed, settings); count = (data as TpItem[]).length; label = 'Tujuan Pembelajaran'; icon = '🎯'; break;
            case 'atp': {
              const tps = genTP(parsed, settings);
              data = genATP(tps, meta, settings.pertemuan);
              count = (data as { pertemuan: unknown[] }).pertemuan.length;
              label = 'Alur Tujuan Pembelajaran'; icon = '📅'; break;
            }
            case 'alur': {
              const tps = genTP(parsed, settings);
              data = genAlur(tps, meta);
              count = (data as AlurItem[]).length;
              label = 'Alur Kegiatan'; icon = '🗺️'; break;
            }
            case 'kuis':
              data = genKuis(parsed, settings.jumlahKuis); count = (data as KuisItem[]).length; label = 'Kuis Pilihan Ganda'; icon = '❓'; break;
            case 'flashcard':
              data = genFlashcard(parsed); count = (data as FlashcardItem[]).length; label = 'Flashcard'; icon = '🃏'; break;
            case 'skenario':
              data = genSkenario(parsed, meta); count = (data as SkenarioChapter[]).length; label = 'Skenario'; icon = '🎭'; break;
            case 'matching':
              data = genMatching(parsed); count = (data as MatchingPair[]).length; label = 'Game Matching'; icon = '🔀'; break;
            case 'truefalse':
              data = genTrueFalse(parsed); count = (data as TrueFalseItem[]).length; label = 'Game Benar/Salah'; icon = '✅'; break;
          }

          allPreviews.push({ type, label, icon, data, count });

          if (allPreviews.length === types.length) {
            setPreviews(allPreviews);
            setActivePreview(allPreviews[0]);
            setLoading(new Set());
            toast.success(`⚡ Semua ${allPreviews.length} konten berhasil digenerate!`);
          }
        } catch (err) {
          console.error(`Error generating ${type}:`, err);
          if (allPreviews.length === types.length - 1) {
            setPreviews(allPreviews);
            setLoading(new Set());
          }
        }
      }, delay);
      delay += 200 + Math.random() * 200;
    }
  }, [parsed, meta, settings]);

  // ── Apply all ───────────────────────────────────────────────
  const handleApplyAll = useCallback(() => {
    if (previews.length === 0) {
      toast.error('Belum ada konten yang di-generate.');
      return;
    }
    for (const p of previews) {
      handleApply(p);
    }
    toast.success('⚡ Semua konten berhasil diterapkan ke proyek!');
  }, [previews, handleApply]);

  // ── Parsed stats ────────────────────────────────────────────
  const parsedStats = useMemo(() => {
    if (!parsed) return null;
    return [
      { label: 'Kata', value: parsed.wordCount, icon: '📝' },
      { label: 'Kalimat', value: parsed.sentences.length, icon: '📄' },
      { label: 'Definisi', value: parsed.definitions.length, icon: '📖' },
      { label: 'Enumerasi', value: parsed.enumerations.length, icon: '📋' },
      { label: 'Fungsi', value: parsed.functions.length, icon: '⚙️' },
      { label: 'Sebab-Akibat', value: parsed.causes.length, icon: '🔗' },
      { label: 'Kata Utama', value: parsed.topWords.length, icon: '🔑' },
    ];
  }, [parsed]);

  // ═══════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <span>⚡</span> Auto-Generate
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          Paste teks materi sekali → generate bertahap per section.
        </p>
      </div>

      {/* ── Step 1: Text Input ──────────────────────────────── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-bold">1</span>
            Paste Materi
          </h3>
          <span className="text-xs text-zinc-500">
            {text.length > 0 ? `${text.split(/\s+/).filter(Boolean).length} kata` : 'Belum ada teks'}
          </span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Paste teks materi PPKn di sini...\n\nContoh:\nNorma adalah aturan atau pedoman tingkah laku dalam kehidupan bermasyarakat. Norma berfungsi untuk menciptakan ketertiban dan ketenteraman dalam masyarakat. Norma terdiri dari empat jenis, yaitu norma agama, norma kesusilaan, norma kesopanan, dan norma hukum. Norma agama bersumber dari keyakinan tentang perintah dan larangan Tuhan. Norma hukum memiliki sanksi yang paling tegas karena diberlakukan oleh negara.`}
          rows={8}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 resize-y min-h-[160px]"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={handleParse}
            disabled={text.trim().length < 50}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-semibold text-sm rounded-lg transition-colors flex items-center gap-2"
          >
            🔍 Parse Teks
          </button>
          <button
            onClick={() => {
              setText('');
              setParsed(null);
              setPreviews([]);
              setActivePreview(null);
            }}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs rounded-lg transition-colors"
          >
            🗑️ Bersihkan
          </button>
          <div className="ml-auto flex items-center gap-2 text-xs text-zinc-500">
            {text.trim().length < 50 && text.length > 0 && (
              <span>Minimal 50 karakter (saat ini: {text.trim().length})</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Step 2: Settings ────────────────────────────────── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-bold">2</span>
          Pengaturan Generate
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Jumlah Kuis */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-medium">Jumlah Soal Kuis</label>
            <select
              value={settings.jumlahKuis}
              onChange={(e) => setSettings((s) => ({ ...s, jumlahKuis: parseInt(e.target.value) }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
            >
              {[5, 10, 15, 20, 25, 30].map((n) => (
                <option key={n} value={n}>{n} soal</option>
              ))}
            </select>
          </div>
          {/* Pertemuan */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-medium">Jumlah Pertemuan</label>
            <select
              value={settings.pertemuan}
              onChange={(e) => setSettings((s) => ({ ...s, pertemuan: parseInt(e.target.value) }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>{n} pertemuan</option>
              ))}
            </select>
          </div>
          {/* Bloom Level */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-medium">Level Bloom Maksimal</label>
            <select
              value={settings.bloomMax}
              onChange={(e) => setSettings((s) => ({ ...s, bloomMax: parseInt(e.target.value) }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
            >
              <option value={1}>C1 – Mengingat</option>
              <option value={2}>C2 – Memahami</option>
              <option value={3}>C3 – Menerapkan</option>
              <option value={4}>C4 – Menganalisis</option>
              <option value={5}>C5 – Mengevaluasi</option>
              <option value={6}>C6 – Menciptakan</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Parsed Stats ────────────────────────────────────── */}
      {parsedStats && parsed && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 text-xs flex items-center justify-center font-bold">✓</span>
            Hasil Parse
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {parsedStats.map((stat) => (
              <div
                key={stat.label}
                className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3 text-center"
              >
                <div className="text-lg mb-1">{stat.icon}</div>
                <div className="text-lg font-bold text-zinc-100">{stat.value}</div>
                <div className="text-[0.65rem] text-zinc-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
          {/* Top words */}
          {parsed.topWords.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 mb-2">Kata kunci terdeteksi:</p>
              <div className="flex flex-wrap gap-1.5">
                {parsed.topWords.slice(0, 15).map((w, i) => (
                  <span
                    key={w + i}
                    className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded-md text-xs text-zinc-300"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* Definitions preview */}
          {parsed.definitions.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 mb-2">Definisi terdeteksi:</p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {parsed.definitions.map((d, i) => (
                  <div key={i} className="text-xs text-zinc-300 bg-zinc-800/50 rounded-lg px-3 py-2">
                    <span className="font-semibold text-amber-400">{d.term}</span>
                    {' → '}
                    <span className="text-zinc-400">{d.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Generate Buttons ────────────────────────── */}
      {parsed && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-bold">3</span>
              Generate Konten
            </h3>
            <button
              onClick={handleGenerateAll}
              disabled={loading.size > 0}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-semibold text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              {loading.size > 0 ? <Spinner /> : '⚡'}
              {loading.size > 0 ? `Generating ${loading.size}...` : 'Generate Semua'}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {GEN_BUTTONS.map((btn) => {
              const isLoading = loading.has(btn.type);
              const preview = previews.find((p) => p.type === btn.type);
              const isActive = activePreview?.type === btn.type;

              return (
                <button
                  key={btn.type}
                  onClick={() => {
                    if (!preview) {
                      handleGenerate(btn.type);
                    } else {
                      setActivePreview(preview);
                    }
                  }}
                  disabled={isLoading}
                  className={`relative bg-zinc-800 border rounded-xl p-4 text-left transition-all hover:border-zinc-600 hover:bg-zinc-800/80 disabled:opacity-50 ${
                    isActive
                      ? 'border-amber-500/50 ring-1 ring-amber-500/30'
                      : 'border-zinc-700/50'
                  } ${preview ? 'ring-1 ring-green-500/20 border-green-500/30' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xl">{btn.icon}</span>
                    {preview && (
                      <span className="text-[0.6rem] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-semibold">
                        ✓ {preview.count}
                      </span>
                    )}
                    {isLoading && <Spinner />}
                  </div>
                  <p className="text-xs font-medium text-zinc-200 mt-2.5 leading-tight">
                    {btn.label}
                  </p>
                  {!preview && !isLoading && (
                    <p className="text-[0.6rem] text-zinc-500 mt-1">Klik untuk generate</p>
                  )}
                  {preview && !isLoading && (
                    <p className="text-[0.6rem] text-green-400 mt-1">Klik untuk lihat preview</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Preview Panel ───────────────────────────────────── */}
      {activePreview && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <span>{activePreview.icon}</span>
              Preview: {activePreview.label}
              <span className="text-xs text-zinc-500 font-normal">({activePreview.count} item)</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleApply(activePreview)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-lg transition-colors flex items-center gap-2"
              >
                ✅ Terapkan ke Proyek
              </button>
              {previews.length > 1 && (
                <button
                  onClick={handleApplyAll}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg transition-colors"
                >
                  ⚡ Terapkan Semua ({previews.length})
                </button>
              )}
            </div>
          </div>

          {/* Preview tabs */}
          {previews.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {previews.map((p) => (
                <button
                  key={p.type}
                  onClick={() => setActivePreview(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                    activePreview.type === p.type
                      ? 'bg-amber-500/15 text-amber-400 font-semibold'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Preview content */}
          <div className="max-h-[480px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {renderPreviewContent(activePreview)}
          </div>
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────── */}
      {!parsed && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center">
          <div className="text-5xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-zinc-200 mb-2">Paste materi untuk memulai</h3>
          <p className="text-sm text-zinc-400 max-w-lg mx-auto">
            Salin teks materi PPKn dari buku atau sumber lain, lalu paste di kolom di atas.
            Sistem akan otomatis mem-parsing dan meng-generate berbagai jenis konten pembelajaran.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded">📝 Paste</span>
            <span className="text-zinc-600">→</span>
            <span className="inline-flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded">🔍 Parse</span>
            <span className="text-zinc-600">→</span>
            <span className="inline-flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded">⚡ Generate</span>
            <span className="text-zinc-600">→</span>
            <span className="inline-flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded">✅ Terapkan</span>
          </div>
        </div>
      )}
    </div>
  );
}
