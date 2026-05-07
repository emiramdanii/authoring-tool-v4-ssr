'use client';

import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useAuthoringStore } from '@/store/authoring-store';
import type { CpState, TpItem, AlurItem, KuisItem } from '@/store/authoring-store';
import type {
  ParseResult,
  GenSettings,
  GenType,
  PreviewData,
  FlashcardItem,
  MatchingPair,
  TrueFalseItem,
  SkenarioChapter,
} from './types';
import { parse } from './parser';
import {
  genCP,
  genTP,
  genATP,
  genAlur,
  genKuis,
  genFlashcard,
  genSkenario,
  genMatching,
  genTrueFalse,
} from './generators';

export function useAutoGenerate() {
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

  return {
    text,
    setText,
    parsed,
    setParsed,
    settings,
    setSettings,
    loading,
    previews,
    setPreviews,
    activePreview,
    setActivePreview,
    handleParse,
    handleGenerate,
    handleApply,
    handleGenerateAll,
    handleApplyAll,
    parsedStats,
  };
}
