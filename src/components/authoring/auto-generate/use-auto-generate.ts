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
  genFullLessonSchema,
} from '@/core/schema/generators';
import { applyBlocksToPages, applyBlockToPages } from '@/core/schema/schema-apply';
import type { SchemaBlock } from '@/core/schema/types';
import { useCanvaStore } from '@/store/canva-store';

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
  const [appliedCount, setAppliedCount] = useState(0);
  const [fullLessonLoading, setFullLessonLoading] = useState(false);

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

  // ═══════════════════════════════════════════════════════════════════
  // APPLY TO STORE — Schema-First Pipeline
  // ═══════════════════════════════════════════════════════════════════
  // UNIDIRECTIONAL FLOW:
  //   1. Write SchemaBlock[] to canvas (PRIMARY — source of truth)
  //   2. Write projection to EditorProjectionStore (SECONDARY — compat)
  //
  // The schema write is the authority. The projection write exists ONLY
  // to keep the Konten editor panel working during migration. Once the
  // Konten panel reads directly from schema, the projection writes can
  // be removed entirely.
  //
  // RULE: Schema → Projection (OK), Projection → Schema (FORBIDDEN)
  // ═══════════════════════════════════════════════════════════════════

  const handleApply = useCallback(
    (preview: PreviewData) => {
      // ═══ Helper: Schema-first apply + projection compat ═══
      const applySchemaFirst = (
        schemaWrite: () => void,
        projectionWrite: () => void,
      ) => {
        // 1. Write to schema tree FIRST (authority)
        schemaWrite();
        // 2. Write to projection SECOND (compatibility for Konten panel)
        projectionWrite();
      };

      // Track successful apply for NextStepBanner
      let applySucceeded = false;

      switch (preview.type) {
        case 'cp': {
          // CP has no schema block type yet — projection-only
          const cpData = preview.data as CpState;
          store.getState().updateCp('elemen', cpData.elemen);
          store.getState().updateCp('subElemen', cpData.subElemen);
          store.getState().updateCp('capaianFase', cpData.capaianFase);
          store.getState().updateCp('fase', cpData.fase);
          store.getState().updateCp('kelas', cpData.kelas);
          const currentState = store.getState().cp;
          for (let i = currentState.profil.length - 1; i >= 0; i--) {
            store.getState().removeProfil(i);
          }
          for (const p of cpData.profil) {
            store.getState().addProfil(p);
          }
          toast.success('📋 CP diterapkan ke Dokumen');
          applySucceeded = true;
          break;
        }
        case 'tp': {
          const tpData = preview.data as TpItem[];
          applySchemaFirst(
            // PRIMARY: Write schema to canvas
            () => {
              if (parsed) {
                const tpBlock = genTpSchema(parsed, settings);
                applyBlockToPages('dokumen', [tpBlock]);
                applyBlockToPages('tujuan', [tpBlock]);
              }
            },
            // SECONDARY: Write projection for Konten panel compat
            () => store.setState({ tp: tpData, dirty: true }),
          );
          toast.success(`🎯 ${tpData.length} TP diterapkan`);
          applySucceeded = true;
          break;
        }
        case 'atp': {
          // ATP has no schema block type — projection-only
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
          applySucceeded = true;
          break;
        }
        case 'alur': {
          const alurData = preview.data as AlurItem[];
          applySchemaFirst(
            () => {
              if (parsed) {
                const alurBlock = genAlurSchema(parsed, settings, meta);
                applyBlockToPages('dokumen', [alurBlock]);
              }
            },
            () => store.setState({ alur: alurData, dirty: true }),
          );
          toast.success(`🗺️ ${alurData.length} langkah alur diterapkan`);
          applySucceeded = true;
          break;
        }
        case 'kuis': {
          const kuisData = preview.data as KuisItem[];
          applySchemaFirst(
            () => {
              if (parsed) {
                const kuisBlock = genKuisSchema(parsed, settings.jumlahKuis, settings.pertemuan);
                applyBlockToPages('kuis', kuisBlock);
              }
            },
            () => store.setState({ kuis: kuisData, dirty: true }),
          );
          toast.success(`❓ ${kuisData.length} soal kuis diterapkan`);
          applySucceeded = true;
          break;
        }
        case 'skenario': {
          const skenarioData = preview.data as SkenarioChapter[];
          applySchemaFirst(
            () => {
              if (parsed) {
                const skenarioBlock = genSkenarioSchema(parsed, meta);
                applyBlockToPages('skenario', [skenarioBlock]);
              }
            },
            () => store.getState().setSkenario(skenarioData as unknown as import('@/store/authoring/types').SkenarioChapter[]),
          );
          toast.success(`🎭 ${skenarioData.length} bab skenario diterapkan`);
          applySucceeded = true;
          break;
        }
        case 'flashcard': {
          const flashData = preview.data as FlashcardItem[];
          applySchemaFirst(
            () => {
              if (parsed) {
                const flashcardBlock = genFlashcardSchema(parsed);
                applyBlockToPages('materi', [flashcardBlock]);
              }
            },
            () => {
              const s = store.getState();
              const existingIdx = s.modules.findIndex((m) => m.type === 'flashcard');
              if (existingIdx >= 0) s.removeModule(existingIdx);
              s.addModule('flashcard');
              const newIdx = store.getState().modules.findIndex((m) => m.type === 'flashcard');
              if (newIdx >= 0) {
                store.getState().updateModuleField(newIdx, 'kartu', flashData);
                store.getState().updateModuleField(newIdx, 'title', 'Flashcard');
              }
            },
          );
          toast.success(`🃏 ${flashData.length} flashcard diterapkan`);
          applySucceeded = true;
          break;
        }
        case 'matching': {
          // Matching/TrueFalse: projection-only until schema game blocks are fully wired
          const matchData = preview.data as MatchingPair[];
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
          applySucceeded = true;
          break;
        }
        case 'truefalse': {
          const tfData = preview.data as TrueFalseItem[];
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
          applySucceeded = true;
          break;
        }
        case 'materi': {
          const materiData = preview.data as MateriBlok[];
          applySchemaFirst(
            () => {
              if (parsed) {
                const schemaBlocks = genMateriSchema(parsed, { judulPertemuan: meta.judulPertemuan, namaBab: meta.namaBab });
                applyBlocksToPages('materi', schemaBlocks);
              }
            },
            () => store.setState({ materi: { blok: materiData }, dirty: true }),
          );
          toast.success(`📖 ${materiData.length} blok materi diterapkan`);
          applySucceeded = true;
          break;
        }
        case 'diskusi': {
          const diskusiData = preview.data as DiskusiData;
          applySchemaFirst(
            () => {
              if (parsed) {
                const diskusiBlock = genDiskusiSchema(parsed, store.getState().tp, { judulPertemuan: meta.judulPertemuan, namaBab: meta.namaBab });
                applyBlockToPages('diskusi', [diskusiBlock]);
              }
            },
            () => store.setState({ diskusi: diskusiData, dirty: true }),
          );
          toast.success(`💬 ${diskusiData.pertanyaan.length} pertanyaan diskusi diterapkan`);
          applySucceeded = true;
          break;
        }
        case 'refleksi': {
          const refleksiData = preview.data as RefleksiData;
          applySchemaFirst(
            () => {
              if (parsed) {
                const refleksiBlock = genRefleksiSchema(parsed, { judulPertemuan: meta.judulPertemuan, namaBab: meta.namaBab });
                applyBlockToPages('refleksi', [refleksiBlock]);
              }
            },
            () => store.setState({ refleksi: refleksiData, dirty: true }),
          );
          toast.success(`🪞 ${refleksiData.pertanyaan.length} pertanyaan refleksi diterapkan`);
          applySucceeded = true;
          break;
        }
      }

      if (applySucceeded) {
        setAppliedCount((c) => c + 1);

        // ═══ Navigate to Canva after apply ═══════════════════════
        // Guide the teacher to see their generated content on the canvas.
        // Find the first page with schema content, or default to page 0.
        const canvaPages = useCanvaStore.getState().pages;
        let targetIdx = 0;
        const schemaPageIdx = canvaPages.findIndex(
          (p) => p.schema && p.schema.blocks.length > 0
        );
        if (schemaPageIdx >= 0) targetIdx = schemaPageIdx;

        // Navigate to canva and select the relevant page
        useAuthoringStore.getState().setActivePanel('canva');
        useCanvaStore.getState().goPage(targetIdx);

        toast.success('Materi berhasil di-generate! Lihat hasilnya di Canva.', {
          duration: 5000,
          action: {
            label: 'Lihat Hasil di Canva',
            onClick: () => {
              useAuthoringStore.getState().setActivePanel('canva');
              useCanvaStore.getState().goPage(targetIdx);
            },
          },
        });
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
            setActivePreview!(allPreviews[0]);
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
    // Navigation and toast are handled inside handleApply,
    // but we add an extra confirmation toast for the bulk action.
    toast.success('Semua konten berhasil diterapkan ke proyek!', {
      duration: 5000,
      action: {
        label: 'Lihat Hasil di Canva',
        onClick: () => {
          useAuthoringStore.getState().setActivePanel('canva');
          const canvaPages = useCanvaStore.getState().pages;
          const schemaPageIdx = canvaPages.findIndex(
            (p) => p.schema && p.schema.blocks.length > 0
          );
          useCanvaStore.getState().goPage(schemaPageIdx >= 0 ? schemaPageIdx : 0);
        },
      },
    });
  }, [previews, handleApply]);

  // ═══════════════════════════════════════════════════════════════════
  // ONE-CLICK FULL LESSON GENERATION
  // ═══════════════════════════════════════════════════════════════════
  // Pipeline: Paste → Parse → genFullLessonSchema() → ensureLessonPages()
  //   → Navigate to canvas
  //
  // This is the PRIMARY teacher flow — one click produces a complete
  // BSNP-ready lesson with all pages: Cover → Petunjuk → TP → Alur
  //   → Motivasi → Materi → Diskusi → Kuis → Refleksi → Rangkuman → Penutup
  //
  // Also writes projections to authoring store for Konten panel compat.
  // ═══════════════════════════════════════════════════════════════════

  const handleGenerateFullLesson = useCallback(() => {
    if (!parsed) {
      toast.error('Parse teks terlebih dahulu sebelum generate full lesson.');
      return;
    }

    setFullLessonLoading(true);
    toast.info('⚡ Generating full lesson BSNP...');

    // Simulate brief delay for UX feedback
    setTimeout(() => {
      try {
        const authState = store.getState();

        // 1. Generate the FULL lesson schema — all blocks at once
        const lessonSchema = genFullLessonSchema(
          parsed,
          meta,
          settings,
          // Default petunjuk langkah
          [
            { icon: '📖', judul: 'Baca Materi', isi: 'Pelajari materi yang disajikan di setiap halaman.' },
            { icon: '💬', judul: 'Diskusi Kelompok', isi: 'Diskusikan pertanyaan bersama teman sekelompok.' },
            { icon: '✍️', judul: 'Jawab Soal', isi: 'Kerjakan kuis untuk menguji pemahamanmu.' },
            { icon: '🪞', judul: 'Refleksi', isi: 'Renungkan apa yang sudah dipelajari.' },
          ],
          authState.tp,
        );

        // 2. Apply each section of the full lesson to canvas pages
        let pageCount = 0;
        if (lessonSchema.cover) { applyBlockToPages('cover', [lessonSchema.cover]); pageCount++; }
        if (lessonSchema.petunjuk) { applyBlockToPages('petunjuk', [lessonSchema.petunjuk]); pageCount++; }
        if (lessonSchema.tp) { applyBlockToPages('tujuan', [lessonSchema.tp]); applyBlockToPages('dokumen', [lessonSchema.tp]); pageCount++; }
        if (lessonSchema.alur) { applyBlockToPages('dokumen', [lessonSchema.alur]); pageCount++; }
        if (lessonSchema.motivasi) { applyBlockToPages('motivasi', [lessonSchema.motivasi]); pageCount++; }
        if (lessonSchema.tujuan) { applyBlockToPages('dokumen', [lessonSchema.tujuan]); pageCount++; }
        if (lessonSchema.materi.length) { applyBlocksToPages('materi', lessonSchema.materi); pageCount++; }
        if (lessonSchema.skenario) { applyBlockToPages('skenario', [lessonSchema.skenario]); pageCount++; }
        if (lessonSchema.kuis) { applyBlockToPages('kuis', [lessonSchema.kuis]); pageCount++; }
        if (lessonSchema.flashcard) { applyBlockToPages('materi', [lessonSchema.flashcard]); pageCount++; }
        if (lessonSchema.diskusi) { applyBlockToPages('diskusi', [lessonSchema.diskusi]); pageCount++; }
        if (lessonSchema.refleksi) { applyBlockToPages('refleksi', [lessonSchema.refleksi]); pageCount++; }
        if (lessonSchema.rangkuman) { applyBlockToPages('rangkuman', [lessonSchema.rangkuman]); pageCount++; }
        if (lessonSchema.hasil) { applyBlockToPages('hasil', [lessonSchema.hasil]); pageCount++; }
        if (lessonSchema.penutup) { applyBlockToPages('penutup', [lessonSchema.penutup]); pageCount++; }

        // 3. Write projections to authoring store for Konten panel compat
        // TP
        const tpData = genTP(parsed, settings);
        store.setState({ tp: tpData, dirty: true });

        // ATP
        const atpData = genATP(tpData, meta, settings.pertemuan);
        store.setState({
          atp: {
            namaBab: atpData.namaBab,
            jumlahPertemuan: atpData.jumlahPertemuan,
            pertemuan: atpData.pertemuan as import('@/store/authoring-store').AtpPertemuan[],
          },
        });

        // Kuis
        const kuisData = genKuis(parsed, settings.jumlahKuis, settings.pertemuan);
        store.setState({ kuis: kuisData });

        // Materi
        const materiData = genMateri(parsed, { judulPertemuan: meta.judulPertemuan, namaBab: meta.namaBab });
        store.setState({ materi: { blok: materiData } });

        // Diskusi
        const diskusiData = genDiskusi(parsed, authState.tp, { judulPertemuan: meta.judulPertemuan, namaBab: meta.namaBab });
        store.setState({ diskusi: diskusiData });

        // Refleksi
        const refleksiData = genRefleksi(parsed, { judulPertemuan: meta.judulPertemuan, namaBab: meta.namaBab });
        store.setState({ refleksi: refleksiData });

        // Alur
        const alurData = genAlur(tpData, meta);
        store.setState({ alur: alurData });

        // 4. Navigate to canvas — first page with schema content
        const canvaPages = useCanvaStore.getState().pages;
        const targetIdx = canvaPages.findIndex(
          (p) => p.schema && p.schema.blocks.length > 0
        );
        useAuthoringStore.getState().setActivePanel('canva');
        useCanvaStore.getState().goPage(targetIdx >= 0 ? targetIdx : 0);

        setAppliedCount((c) => c + 1);
        toast.success(`✅ Full lesson berhasil! ${pageCount} halaman BSNP siap.`, {
          duration: 6000,
          action: {
            label: 'Lihat di Canva',
            onClick: () => {
              useAuthoringStore.getState().setActivePanel('canva');
              useCanvaStore.getState().goPage(targetIdx >= 0 ? targetIdx : 0);
            },
          },
        });
      } catch (err) {
        logger.error('AutoGenerate:fullLesson', err);
        toast.error(`Gagal generate full lesson: ${(err as Error).message}`);
      } finally {
        setFullLessonLoading(false);
      }
    }, 500 + Math.random() * 300);
  }, [parsed, meta, settings]);

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

  // ── Per-Pertemuan Generation ──────────────────────────────────
  // NOTE: genPertemuanSchema was removed during rebase. This uses
  // genFullLessonSchema as a fallback (generates all pertemuan content).
  const handleGeneratePertemuan = useCallback(
    (nomor: number) => {
      if (!parsed) {
        toast.error('Parse teks terlebih dahulu sebelum generate pertemuan.');
        return;
      }

      toast.info(`⚡ Generating Pertemuan ${nomor}...`);

      setTimeout(() => {
        try {
          const authState = store.getState();

          // 1. Generate full lesson schema (no per-pertemuan generator available)
          const lessonSchema = genFullLessonSchema(
            parsed,
            meta,
            settings,
            [
              { icon: '📖', judul: 'Baca Materi', isi: 'Pelajari materi yang disajikan di setiap halaman.' },
              { icon: '💬', judul: 'Diskusi Kelompok', isi: 'Diskusikan pertanyaan bersama teman sekelompok.' },
              { icon: '✍️', judul: 'Jawab Soal', isi: 'Kerjakan kuis untuk menguji pemahamanmu.' },
              { icon: '🪞', judul: 'Refleksi', isi: 'Renungkan apa yang sudah dipelajari.' },
            ],
            authState.tp,
          );

          // 2. Apply each section to canvas pages
          let pageCount = 0;
          if (lessonSchema.materi.length) { applyBlocksToPages('materi', lessonSchema.materi); pageCount++; }
          if (lessonSchema.diskusi) { applyBlockToPages('diskusi', [lessonSchema.diskusi]); pageCount++; }
          if (lessonSchema.kuis) { applyBlockToPages('kuis', [lessonSchema.kuis]); pageCount++; }
          if (lessonSchema.refleksi) { applyBlockToPages('refleksi', [lessonSchema.refleksi]); pageCount++; }

          // 3. Write projections to authoring store for Konten panel
          // Materi
          const materiData = genMateri(parsed, { judulPertemuan: meta.judulPertemuan, namaBab: meta.namaBab });
          store.setState({ materi: { blok: materiData } });

          // Diskusi
          const diskusiData = genDiskusi(parsed, authState.tp, { judulPertemuan: meta.judulPertemuan, namaBab: meta.namaBab });
          store.setState({ diskusi: diskusiData });

          // Kuis (tagged for this pertemuan)
          const allKuis = genKuis(parsed, settings.jumlahKuis, settings.pertemuan);
          store.setState({ kuis: allKuis });

          // Refleksi
          const refleksiData = genRefleksi(parsed, { judulPertemuan: meta.judulPertemuan, namaBab: meta.namaBab });
          store.setState({ refleksi: refleksiData, dirty: true });

          // 4. Navigate to canvas
          useAuthoringStore.getState().setActivePanel('canva');
          const canvaPages = useCanvaStore.getState().pages;
          const targetIdx = canvaPages.findIndex(p => p.label?.startsWith(`Pertemuan ${nomor}`));
          useCanvaStore.getState().goPage(targetIdx >= 0 ? targetIdx : 0);

          setAppliedCount((c) => c + 1);
          toast.success(`✅ Pertemuan ${nomor} berhasil! ${pageCount} halaman dibuat.`);
        } catch (err) {
          logger.error('AutoGenerate:pertemuan', err);
          toast.error(`Gagal generate Pertemuan ${nomor}: ${(err as Error).message}`);
        }
      }, 400 + Math.random() * 200);
    },
    [parsed, meta, settings],
  );

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
    handleGenerateFullLesson,
    handleGeneratePertemuan,
    fullLessonLoading,
    parsedStats,
    appliedCount,
  };
}
