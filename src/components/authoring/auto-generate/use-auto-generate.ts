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
  genMatchingSchema,
  genTrueFalseSchema,
  genFullLessonSchema,
} from '@/core/schema/generators';
import { applyBlocksToPages, applyBlockToPages } from '@/core/schema/schema-apply';
import { scanAllPagesOverflow } from '@/core/schema/guided-patch';
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
      // ═══ Phase 5: Schema-only apply ══════════════════════════════
      // Phase 5: Removed dual-write pattern. Now schema-first only.
      // The startProjectionSync() in init.ts auto-derives projection
      // from schema → authoring store. No need to manually push.
      //
      // Types WITH schema blocks (tp, alur, kuis, skenario, flashcard,
      // materi, diskusi, refleksi): only write schema, skip projection.
      //
      // Types WITHOUT schema blocks (cp, atp, matching, truefalse):
      // still write projection directly (no schema to derive from).
      const applySchemaOnly = (schemaWrite: () => void) => {
        // Push history BEFORE writing — 1 undo step per teacher apply action
        useCanvaStore.getState()._pushHistory();
        schemaWrite();
        // Projection sync handles the rest automatically via init.ts
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
          // Phase 5: Schema-only — projection sync derives from schema automatically
          applySchemaOnly(
            () => {
              if (parsed) {
                const tpBlock = genTpSchema(parsed, settings);
                applyBlockToPages('dokumen', [tpBlock], { skipHistory: true });
                applyBlockToPages('tujuan', [tpBlock], { skipHistory: true });
              }
            },
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
          // Phase 5: Schema-only — projection sync derives from schema automatically
          applySchemaOnly(
            () => {
              if (parsed) {
                const alurBlock = genAlurSchema(parsed, settings, meta);
                applyBlockToPages('dokumen', [alurBlock], { skipHistory: true });
              }
            },
          );
          toast.success(`🗺️ ${alurData.length} langkah alur diterapkan`);
          applySucceeded = true;
          break;
        }
        case 'kuis': {
          const kuisData = preview.data as KuisItem[];
          // Phase 5: Schema-only — projection sync derives from schema automatically
          applySchemaOnly(
            () => {
              if (parsed) {
                const kuisBlock = genKuisSchema(parsed, settings.jumlahKuis, settings.pertemuan);
                applyBlockToPages('kuis', kuisBlock, { skipHistory: true });
              }
            },
          );
          toast.success(`❓ ${kuisData.length} soal kuis diterapkan`);
          applySucceeded = true;
          break;
        }
        case 'skenario': {
          const skenarioData = preview.data as SkenarioChapter[];
          // Phase 5: Schema-only — projection sync derives from schema automatically
          applySchemaOnly(
            () => {
              if (parsed) {
                const skenarioBlock = genSkenarioSchema(parsed, meta);
                applyBlockToPages('skenario', [skenarioBlock], { skipHistory: true });
              }
            },
          );
          toast.success(`🎭 ${skenarioData.length} bab skenario diterapkan`);
          applySucceeded = true;
          break;
        }
        case 'flashcard': {
          const flashData = preview.data as FlashcardItem[];
          // Phase 5: Schema-only — projection sync derives from schema automatically
          applySchemaOnly(
            () => {
              if (parsed) {
                const flashcardBlock = genFlashcardSchema(parsed);
                applyBlockToPages('materi', [flashcardBlock], { skipHistory: true });
              }
            },
          );
          toast.success(`🃏 ${flashData.length} flashcard diterapkan`);
          applySucceeded = true;
          break;
        }
        case 'matching': {
          // Phase 5-C: Schema-only — write matching-game block to schema
          // Previously wrote to AuthoringStore.addModule('matching') — now deprecated.
          applySchemaOnly(
            () => {
              if (parsed) {
                const matchingBlock = genMatchingSchema(parsed);
                applyBlockToPages('game', [matchingBlock], { skipHistory: true });
              }
            },
          );
          toast.success(`🔀 ${(preview.data as MatchingPair[]).length} pasangan matching diterapkan`);
          applySucceeded = true;
          break;
        }
        case 'truefalse': {
          // Phase 5-C: Schema-only — write true-false-game block to schema
          // Previously wrote to AuthoringStore.addModule('truefalse') — now deprecated.
          applySchemaOnly(
            () => {
              if (parsed) {
                const tfBlock = genTrueFalseSchema(parsed);
                applyBlockToPages('game', [tfBlock], { skipHistory: true });
              }
            },
          );
          toast.success(`✅ ${(preview.data as TrueFalseItem[]).length} soal benar/salah diterapkan`);
          applySucceeded = true;
          break;
        }
        case 'materi': {
          const materiData = preview.data as MateriBlok[];
          // Phase 5: Schema-only — projection sync derives from schema automatically
          applySchemaOnly(
            () => {
              if (parsed) {
                const schemaBlocks = genMateriSchema(parsed, { judulPertemuan: meta.judulPertemuan, namaBab: meta.namaBab });
                applyBlocksToPages('materi', schemaBlocks, { skipHistory: true });
              }
            },
          );
          toast.success(`📖 ${materiData.length} blok materi diterapkan`);
          applySucceeded = true;
          break;
        }
        case 'diskusi': {
          const diskusiData = preview.data as DiskusiData;
          // Phase 5: Schema-only — projection sync derives from schema automatically
          applySchemaOnly(
            () => {
              if (parsed) {
                const diskusiBlock = genDiskusiSchema(parsed, store.getState().tp, { judulPertemuan: meta.judulPertemuan, namaBab: meta.namaBab });
                applyBlockToPages('diskusi', [diskusiBlock], { skipHistory: true });
              }
            },
          );
          toast.success(`💬 ${diskusiData.pertanyaan.length} pertanyaan diskusi diterapkan`);
          applySucceeded = true;
          break;
        }
        case 'refleksi': {
          const refleksiData = preview.data as RefleksiData;
          // Phase 5: Schema-only — projection sync derives from schema automatically
          applySchemaOnly(
            () => {
              if (parsed) {
                const refleksiBlock = genRefleksiSchema(parsed, { judulPertemuan: meta.judulPertemuan, namaBab: meta.namaBab });
                applyBlockToPages('refleksi', [refleksiBlock], { skipHistory: true });
              }
            },
          );
          toast.success(`🪞 ${refleksiData.pertanyaan.length} pertanyaan refleksi diterapkan`);
          applySucceeded = true;
          break;
        }
      }

      if (applySucceeded) {
        setAppliedCount((c) => c + 1);

        // ═══ Phase 4: Post-apply overflow scan ═══════════════════════
        // After writing content to schema, scan all pages for overflow.
        // This updates pageOverflowStatus so the SceneList shows red dots
        // on overflowing pages and the teacher gets a warning toast.
        const overflowScan = scanAllPagesOverflow({ autoSplit: true });
        if (overflowScan.overflowingPages > 0) {
          // Some pages still overflow even after auto-split — warn the teacher
          toast.warning(
            `${overflowScan.overflowingPages} halaman melebihi kapasitas. Klik halaman dengan ikon ⚠ untuk kompakkan atau split.`,
            { duration: 8000 },
          );
        }

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
        useCanvaStore.setState({ panelRequest: 'canva' });
        useCanvaStore.getState().goPage(targetIdx);

        toast.success('Materi berhasil di-generate! Lihat hasilnya di Canva.', {
          duration: 5000,
          action: {
            label: 'Lihat Hasil di Canva',
            onClick: () => {
              useCanvaStore.setState({ panelRequest: 'canva' });
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
          useCanvaStore.setState({ panelRequest: 'canva' });
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
        // Push history ONCE before all applies — 1 undo step per teacher action
        useCanvaStore.getState()._pushHistory();
        if (lessonSchema.cover) { applyBlockToPages('cover', [lessonSchema.cover], { skipHistory: true }); pageCount++; }
        if (lessonSchema.petunjuk) { applyBlockToPages('petunjuk', [lessonSchema.petunjuk], { skipHistory: true }); pageCount++; }
        if (lessonSchema.tp) { applyBlockToPages('tujuan', [lessonSchema.tp], { skipHistory: true }); applyBlockToPages('dokumen', [lessonSchema.tp], { skipHistory: true }); pageCount++; }
        if (lessonSchema.alur) { applyBlockToPages('dokumen', [lessonSchema.alur], { skipHistory: true }); pageCount++; }
        if (lessonSchema.motivasi) { applyBlockToPages('motivasi', [lessonSchema.motivasi], { skipHistory: true }); pageCount++; }
        if (lessonSchema.tujuan) { applyBlockToPages('dokumen', [lessonSchema.tujuan], { skipHistory: true }); pageCount++; }
        if (lessonSchema.materi.length) { applyBlocksToPages('materi', lessonSchema.materi, { skipHistory: true }); pageCount++; }
        if (lessonSchema.skenario) { applyBlockToPages('skenario', [lessonSchema.skenario], { skipHistory: true }); pageCount++; }
        if (lessonSchema.kuis) { applyBlockToPages('kuis', [lessonSchema.kuis], { skipHistory: true }); pageCount++; }
        if (lessonSchema.flashcard) { applyBlockToPages('materi', [lessonSchema.flashcard], { skipHistory: true }); pageCount++; }
        if (lessonSchema.diskusi) { applyBlockToPages('diskusi', [lessonSchema.diskusi], { skipHistory: true }); pageCount++; }
        if (lessonSchema.refleksi) { applyBlockToPages('refleksi', [lessonSchema.refleksi], { skipHistory: true }); pageCount++; }
        if (lessonSchema.rangkuman) { applyBlockToPages('rangkuman', [lessonSchema.rangkuman], { skipHistory: true }); pageCount++; }
        if (lessonSchema.hasil) { applyBlockToPages('hasil', [lessonSchema.hasil], { skipHistory: true }); pageCount++; }
        if (lessonSchema.penutup) { applyBlockToPages('penutup', [lessonSchema.penutup], { skipHistory: true }); pageCount++; }

        // 3. Write projections to authoring store
        // Phase 5: Content projections (tp, kuis, materi, diskusi, refleksi, alur)
        // are now auto-derived from schema by startProjectionSync() in init.ts.
        // Only write projection-only types (atp) that have no schema blocks.
        // TP, kuis, materi, diskusi, refleksi, alur projections will sync
        // automatically within 300ms via the projection subscription.

        // ATP — projection-only, no schema block type yet
        const tpData = genTP(parsed, settings);
        const atpData = genATP(tpData, meta, settings.pertemuan);
        store.setState({
          atp: {
            namaBab: atpData.namaBab,
            jumlahPertemuan: atpData.jumlahPertemuan,
            pertemuan: atpData.pertemuan as import('@/store/authoring-store').AtpPertemuan[],
          },
        });

        // 4. Navigate to canvas — first page with schema content
        const canvaPages = useCanvaStore.getState().pages;
        const targetIdx = canvaPages.findIndex(
          (p) => p.schema && p.schema.blocks.length > 0
        );
        useCanvaStore.setState({ panelRequest: 'canva' });
        useCanvaStore.getState().goPage(targetIdx >= 0 ? targetIdx : 0);

        // Phase 4: Post-generate overflow scan — detect and auto-split
        // overflowing pages so the teacher doesn't see clipped content.
        const overflowScan = scanAllPagesOverflow({ autoSplit: true });
        const overflowWarning = overflowScan.overflowingPages > 0
          ? ` ${overflowScan.overflowingPages} halaman perlu perhatian (melebihi kapasitas).`
          : '';

        setAppliedCount((c) => c + 1);
        toast.success(`✅ Full lesson berhasil! ${pageCount} halaman BSNP siap.${overflowWarning}`, {
          duration: 6000,
          action: {
            label: 'Lihat di Canva',
            onClick: () => {
              useCanvaStore.setState({ panelRequest: 'canva' });
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
          // Push history ONCE before all applies — 1 undo step per teacher action
          useCanvaStore.getState()._pushHistory();
          if (lessonSchema.materi.length) { applyBlocksToPages('materi', lessonSchema.materi, { skipHistory: true }); pageCount++; }
          if (lessonSchema.diskusi) { applyBlockToPages('diskusi', [lessonSchema.diskusi], { skipHistory: true }); pageCount++; }
          if (lessonSchema.kuis) { applyBlockToPages('kuis', [lessonSchema.kuis], { skipHistory: true }); pageCount++; }
          if (lessonSchema.refleksi) { applyBlockToPages('refleksi', [lessonSchema.refleksi], { skipHistory: true }); pageCount++; }

          // 3. Projections auto-derived from schema by startProjectionSync()
          // Phase 5: Removed manual projection writes — the init.ts subscription
          // automatically derives materi, diskusi, kuis, refleksi from schema
          // within 300ms. No need to manually push to authoring store.

          // 4. Navigate to canvas
          useCanvaStore.setState({ panelRequest: 'canva' });
          const canvaPages = useCanvaStore.getState().pages;
          const targetIdx = canvaPages.findIndex(p => p.label?.startsWith(`Pertemuan ${nomor}`));
          useCanvaStore.getState().goPage(targetIdx >= 0 ? targetIdx : 0);

          // Phase 4: Post-generate overflow scan
          const overflowScan = scanAllPagesOverflow({ autoSplit: true });
          const overflowNote = overflowScan.overflowingPages > 0
            ? ` ${overflowScan.overflowingPages} halaman melebihi kapasitas.`
            : '';

          setAppliedCount((c) => c + 1);
          toast.success(`✅ Pertemuan ${nomor} berhasil! ${pageCount} halaman dibuat.${overflowNote}`);
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
