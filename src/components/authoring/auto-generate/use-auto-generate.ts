'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuthoringStore } from '@/store/authoring-store';
import type { CpState, TpItem, AlurItem, KuisItem, MateriBlok, DiskusiData, RefleksiData } from '@/store/authoring-store';
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
import { logger } from '@/core/utils/logger';
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
  genMateri,
  genDiskusi,
  genRefleksi,
} from './generators';
// Schema-first generators — write SchemaBlock[] directly to canvas pages
import {
  genMateriSchema,
  genKuisSchema,
  genDiskusiSchema,
  genRefleksiSchema,
  genSkenarioSchema,
  genFlashcardSchema,
  genTpSchema,
  genAlurSchema,
  genMotivasiSchema,
  genRangkumanSchema,
  genTujuanDisplaySchema,
  genHasilSchema,
  genPenutupSchema,
  genCoverSchema,
} from '@/core/schema/generators';
import { applyBlocksToPages, applyBlockToPages } from '@/core/schema/schema-apply';
import type { SchemaBlock } from '@/core/schema/types';

export function useAutoGenerate() {
  const store = useAuthoringStore;
  const meta = useAuthoringStore((s) => s.meta);

  // ── Local state ─────────────────────────────────────────────
  const [text, setText] = useState(() => {
    if (typeof window !== 'undefined') {
      try { return localStorage.getItem('silse-autogen-text') || ''; } catch { return ''; }
    }
    return '';
  });
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [settings, setSettings] = useState<GenSettings>({
    jumlahKuis: 10,
    pertemuan: 3,
    bloomMax: 6,
  });
  const [loading, setLoading] = useState<Set<GenType>>(new Set());
  const [previews, setPreviews] = useState<PreviewData[]>([]);
  const [activePreview, setActivePreview] = useState<PreviewData | null>(null);

  // ── Persist text to localStorage ────────────────────────────
  useEffect(() => {
    try { localStorage.setItem('silse-autogen-text', text); } catch { /* ignore */ }
  }, [text]);

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
              data = genKuis(parsed, settings.jumlahKuis, settings.pertemuan);
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
            case 'materi': {
              data = genMateri(parsed, { judulPertemuan: meta.judulPertemuan, namaBab: meta.namaBab });
              count = (data as MateriBlok[]).length;
              label = 'Materi';
              icon = '📖';
              break;
            }
            case 'diskusi': {
              const authStore = store.getState();
              data = genDiskusi(parsed, authStore.tp, { judulPertemuan: meta.judulPertemuan, namaBab: meta.namaBab });
              count = (data as DiskusiData).pertanyaan.length;
              label = 'Diskusi';
              icon = '💬';
              break;
            }
            case 'refleksi': {
              data = genRefleksi(parsed, { judulPertemuan: meta.judulPertemuan, namaBab: meta.namaBab });
              count = (data as RefleksiData).pertanyaan.length;
              label = 'Refleksi';
              icon = '🪞';
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
          // Schema-first: apply to canvas directly
          if (parsed) {
            const tpBlock = genTpSchema(parsed, settings);
            applyBlockToPages('dokumen', [tpBlock]);
            applyBlockToPages('tujuan', [tpBlock]);
          }
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
          // Schema-first: apply to canvas directly
          if (parsed) {
            const alurBlock = genAlurSchema(parsed, settings, meta);
            applyBlockToPages('dokumen', [alurBlock]);
          }
          toast.success(`🗺️ ${alurData.length} langkah alur diterapkan`);
          break;
        }
        case 'kuis': {
          const kuisData = preview.data as KuisItem[];
          store.setState({ kuis: kuisData, dirty: true });
          // Schema-first: apply to canvas directly
          if (parsed) {
            const kuisBlock = genKuisSchema(parsed, settings.jumlahKuis, settings.pertemuan);
            applyBlockToPages('kuis', kuisBlock);
          }
          toast.success(`❓ ${kuisData.length} soal kuis diterapkan`);
          break;
        }
        case 'skenario': {
          const skenarioData = preview.data as SkenarioChapter[];
          store.getState().setSkenario(skenarioData as unknown as import('@/store/authoring/types').SkenarioChapter[]);
          // Schema-first: apply to canvas directly
          if (parsed) {
            const skenarioBlock = genSkenarioSchema(parsed, meta);
            applyBlockToPages('skenario', [skenarioBlock]);
          }
          toast.success(`🎭 ${skenarioData.length} bab skenario diterapkan`);
          break;
        }
        case 'flashcard': {
          const flashData = preview.data as FlashcardItem[];
          // Use addModule() which triggers deriveGames() properly
          // First remove any existing flashcard module, then add the new one
          const s = store.getState();
          const existingIdx = s.modules.findIndex((m) => m.type === 'flashcard');
          if (existingIdx >= 0) s.removeModule(existingIdx);
          s.addModule('flashcard');
          // Now update the newly added module with generated data
          const newIdx = store.getState().modules.findIndex((m) => m.type === 'flashcard');
          if (newIdx >= 0) {
            store.getState().updateModuleField(newIdx, 'kartu', flashData);
            store.getState().updateModuleField(newIdx, 'title', 'Flashcard');
          }
          // Schema-first: apply to canvas directly
          if (parsed) {
            const flashcardBlock = genFlashcardSchema(parsed);
            applyBlockToPages('materi', [flashcardBlock]); // flashcard goes into materi pages
          }
          toast.success(`🃏 ${flashData.length} flashcard diterapkan`);
          break;
        }
        case 'matching': {
          const matchData = preview.data as MatchingPair[];
          // Use addModule() which triggers deriveGames() properly
          const s = store.getState();
          const existingIdx = s.modules.findIndex((m) => m.type === 'matching');
          if (existingIdx >= 0) s.removeModule(existingIdx);
          s.addModule('matching');
          const newIdx = store.getState().modules.findIndex((m) => m.type === 'matching');
          if (newIdx >= 0) {
            store.getState().updateModuleField(newIdx, 'pasangan', matchData);
            store.getState().updateModuleField(newIdx, 'title', 'Matching Game');
          }
          toast.success(`🔀 ${matchData.length} pasangan matching diterapkan`);
          break;
        }
        case 'truefalse': {
          const tfData = preview.data as TrueFalseItem[];
          // Use addModule() which triggers deriveGames() properly
          const s = store.getState();
          const existingIdx = s.modules.findIndex((m) => m.type === 'truefalse');
          if (existingIdx >= 0) s.removeModule(existingIdx);
          s.addModule('truefalse');
          const newIdx = store.getState().modules.findIndex((m) => m.type === 'truefalse');
          if (newIdx >= 0) {
            store.getState().updateModuleField(newIdx, 'soal', tfData);
            store.getState().updateModuleField(newIdx, 'title', 'Benar/Salah');
          }
          toast.success(`✅ ${tfData.length} soal benar/salah diterapkan`);
          break;
        }
        case 'materi': {
          const materiData = preview.data as MateriBlok[];
          store.setState({ materi: { blok: materiData }, dirty: true });
          // Schema-first: apply to canvas directly
          if (parsed) {
            const schemaBlocks = genMateriSchema(parsed, { judulPertemuan: meta.judulPertemuan, namaBab: meta.namaBab });
            applyBlocksToPages('materi', schemaBlocks);
          }
          toast.success(`📖 ${materiData.length} blok materi diterapkan`);
          break;
        }
        case 'diskusi': {
          const diskusiData = preview.data as DiskusiData;
          store.setState({ diskusi: diskusiData, dirty: true });
          // Schema-first: apply to canvas directly
          if (parsed) {
            const diskusiBlock = genDiskusiSchema(parsed, store.getState().tp, { judulPertemuan: meta.judulPertemuan, namaBab: meta.namaBab });
            applyBlockToPages('diskusi', [diskusiBlock]);
          }
          toast.success(`💬 ${diskusiData.pertanyaan.length} pertanyaan diskusi diterapkan`);
          break;
        }
        case 'refleksi': {
          const refleksiData = preview.data as RefleksiData;
          store.setState({ refleksi: refleksiData, dirty: true });
          // Schema-first: apply to canvas directly
          if (parsed) {
            const refleksiBlock = genRefleksiSchema(parsed, { judulPertemuan: meta.judulPertemuan, namaBab: meta.namaBab });
            applyBlockToPages('refleksi', [refleksiBlock]);
          }
          toast.success(`🪞 ${refleksiData.pertanyaan.length} pertanyaan refleksi diterapkan`);
          break;
        }
      }
    },
    [parsed, settings, meta],
  );

  // ── Generate all ────────────────────────────────────────────
  const handleGenerateAll = useCallback(async () => {
    if (!parsed) {
      toast.error('Parse teks terlebih dahulu sebelum generate.');
      return;
    }

    const types: GenType[] = ['cp', 'tp', 'atp', 'alur', 'kuis', 'flashcard', 'skenario', 'matching', 'truefalse', 'materi', 'diskusi', 'refleksi'];
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
              data = genKuis(parsed, settings.jumlahKuis, settings.pertemuan); count = (data as KuisItem[]).length; label = 'Kuis Pilihan Ganda'; icon = '❓'; break;
            case 'flashcard':
              data = genFlashcard(parsed); count = (data as FlashcardItem[]).length; label = 'Flashcard'; icon = '🃏'; break;
            case 'skenario':
              data = genSkenario(parsed, meta); count = (data as SkenarioChapter[]).length; label = 'Skenario'; icon = '🎭'; break;
            case 'matching':
              data = genMatching(parsed); count = (data as MatchingPair[]).length; label = 'Game Matching'; icon = '🔀'; break;
            case 'truefalse':
              data = genTrueFalse(parsed); count = (data as TrueFalseItem[]).length; label = 'Game Benar/Salah'; icon = '✅'; break;
            case 'materi': {
              data = genMateri(parsed, { judulPertemuan: meta.judulPertemuan, namaBab: meta.namaBab });
              count = (data as MateriBlok[]).length; label = 'Materi'; icon = '📖'; break;
            }
            case 'diskusi': {
              const authStore = store.getState();
              data = genDiskusi(parsed, authStore.tp, { judulPertemuan: meta.judulPertemuan, namaBab: meta.namaBab });
              count = (data as DiskusiData).pertanyaan.length; label = 'Diskusi'; icon = '💬'; break;
            }
            case 'refleksi': {
              data = genRefleksi(parsed, { judulPertemuan: meta.judulPertemuan, namaBab: meta.namaBab });
              count = (data as RefleksiData).pertanyaan.length; label = 'Refleksi'; icon = '🪞'; break;
            }
          }

          allPreviews.push({ type, label, icon, data, count });

          if (allPreviews.length === types.length) {
            setPreviews(allPreviews);
            setActivePreview(allPreviews[0]);
            setLoading(new Set());
            toast.success(`⚡ Semua ${allPreviews.length} konten berhasil digenerate!`);
          }
        } catch (err) {
          logger.error(`AutoGenerate:${type}`, err);
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
