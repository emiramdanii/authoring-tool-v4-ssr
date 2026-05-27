'use client';

// ═══════════════════════════════════════════════════════════════
// DISKUSI TAB — Schema-First (Phase 3)
// ═══════════════════════════════════════════════════════════════
// MIGRATION STATUS:
//   READ:  useSchemaDiskusi() ← CanvaStore.pages[].schema.blocks
//   WRITE: applyGuidedSchemaPatch() ← single write path to schema
//   SYNC:  REMOVED syncDiskusiToSchema() — no longer needed
//          (startProjectionSync auto-derives authoring store from schema)
//
// FALLBACK: If no diskusi schema blocks exist, shows empty state.
// ═══════════════════════════════════════════════════════════════

import { useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useSchemaDiskusi, useSchemaContext } from '@/hooks/use-schema-navigator';
import { RegenerateButton } from './RegenerateButton';
import { ItemRegenerateButton } from './ItemRegenerateButton';
import { regenerateDiskusi, regenerateSingleDiskusiQuestion } from '../auto-generate/regenerate';
import { Zap, MessageSquare, Trash2, Plus } from 'lucide-react';
import { INPUT_CLS, TEXTAREA_CLS, FieldLabel, MAX_TITLE, MAX_BODY, MAX_SHORT_TEXT } from './shared';

// ── Diskusi Tab — Schema-first edit with RegenerateButton ──
export function DiskusiTab() {
  const {
    data: diskusi,
    locations,
    updateTitle,
    updateIntro,
    updateQuestion,
    addQuestion,
    removeQuestion,
  } = useSchemaDiskusi();

  const { meta, tp, goToAutoGen } = useSchemaContext();
  const listRef = useRef<HTMLDivElement>(null);

  const handleRegenerateDiskusi = async () => {
    const newDiskusi = regenerateDiskusi(tp, {
      judulPertemuan: meta.judulPertemuan,
      namaBab: meta.namaBab,
    });
    if (newDiskusi && locations.length > 0) {
      // Write the regenerated data to schema via applyGuidedSchemaPatch
      const loc = locations[0]!;
      const { applyGuidedSchemaPatch } = await import('@/core/schema/guided-patch');
      applyGuidedSchemaPatch({
        pageId: loc.pageId,
        blockId: loc.blockId,
        patch: {
          title: newDiskusi.title,
          intro: newDiskusi.intro,
          questions: newDiskusi.pertanyaan.map(q => ({
            label: q.label,
            icon: q.icon,
            teks: q.teks,
            petunjuk: q.petunjuk,
          })),
        },
        source: 'konten-tab',
      });
      toast.success(`🗣️ Diskusi berhasil digenerate ulang (${newDiskusi.pertanyaan.length} pertanyaan)`);
    } else {
      toast.error('Gagal regenerate — tidak ada teks sumber atau tidak ada diskusi block di schema.');
      goToAutoGen();
    }
  };

  const handleAdd = useCallback(() => {
    // Add to the first diskusi block (or show empty state if no blocks)
    if (locations.length === 0) return;
    addQuestion(0);
    setTimeout(() => {
      const el = listRef.current?.lastElementChild;
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, [locations, addQuestion]);

  const ICON_OPTIONS = ['💭', '🤔', '🗣️', '👥', '✋', '💡', '🎯', '📝'];

  // Map flat question list to block indices for editing
  // Currently all questions are merged into one list; find which block each belongs to
  const getBlockIndexForQuestion = (questionIdx: number): number => {
    // For now, all questions go to block 0 (single diskusi block model)
    return 0;
  };

  return (
    <div className="space-y-4">
      {/* Header with Regenerate button */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-app-muted">{diskusi.pertanyaan.length} pertanyaan diskusi</span>
        <RegenerateButton
          label="Diskusi"
          onRegenerate={handleRegenerateDiskusi}
          hasExistingData={diskusi.pertanyaan.length > 0}
        />
      </div>

      {/* Title & Intro */}
      <div className="space-y-3 bg-app-surface border border-app-border rounded-xl p-4">
        <div>
          <FieldLabel>Judul Diskusi</FieldLabel>
          <input
            className={INPUT_CLS}
            maxLength={MAX_TITLE}
            placeholder="Diskusi tentang..."
            value={diskusi.title}
            onChange={(e) => updateTitle(e.target.value)}
          />
        </div>
        <div>
          <FieldLabel>Pengantar</FieldLabel>
          <textarea
            className={TEXTAREA_CLS}
            rows={2}
            maxLength={MAX_BODY}
            placeholder="Instruksi untuk siswa..."
            value={diskusi.intro}
            onChange={(e) => updateIntro(e.target.value)}
          />
        </div>
      </div>

      {/* Empty state */}
      {diskusi.pertanyaan.length === 0 ? (
        <div className="text-center py-10 bg-app-surface border border-dashed border-app-border/40 rounded-xl">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
            <MessageSquare size={24} className="text-purple-400" />
          </div>
          <p className="text-sm font-medium text-app-primary mb-1">Belum ada pertanyaan diskusi</p>
          <p className="text-xs text-app-muted mb-4">Generate otomatis dari materi atau buat manual.</p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleRegenerateDiskusi}
              className="px-3 py-1.5 bg-app-accent hover:bg-app-accent/90 text-app-inverse text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Zap size={12} /> Auto-Generate
            </button>
            {locations.length > 0 && (
              <button
                onClick={handleAdd}
                className="px-3 py-1.5 bg-app-elevated hover:bg-app-elevated/80 border border-app-border text-app-secondary text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
              >
                ＋ Manual
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Question list */
        <div ref={listRef} className="space-y-3">
          {diskusi.pertanyaan.map((q, i) => {
            const blockIdx = getBlockIndexForQuestion(i);
            return (
              <div key={i} className="bg-app-surface border border-app-border rounded-xl p-4 space-y-3">
                {/* Question header */}
                <div className="flex items-center gap-2">
                  <span className="text-lg">{q.icon || '💭'}</span>
                  <span className="text-sm font-medium text-app-primary">Pertanyaan {i + 1}</span>
                  <div className="ml-auto flex items-center gap-1">
                    <ItemRegenerateButton
                      title="Regenerate pertanyaan ini"
                      onRegenerate={async () => {
                        const newQ = regenerateSingleDiskusiQuestion(i, tp, {
                          judulPertemuan: meta.judulPertemuan,
                          namaBab: meta.namaBab,
                        });
                        if (newQ) {
                          updateQuestion(blockIdx, i, {
                            label: newQ.label,
                            icon: newQ.icon,
                            teks: newQ.teks,
                            petunjuk: newQ.petunjuk,
                          });
                          toast.success(`🔄 Pertanyaan diskusi ${i + 1} berhasil digenerate ulang`);
                        } else {
                          toast.error('Gagal regenerate — tidak ada teks sumber.');
                        }
                      }}
                    />
                    <button
                      onClick={() => removeQuestion(blockIdx, i)}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-md text-app-muted hover:text-red-400 hover:bg-red-500/10 transition-all text-sm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Icon selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-app-muted">Ikon:</span>
                  {ICON_OPTIONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => updateQuestion(blockIdx, i, { icon })}
                      className={`w-7 h-7 rounded-md text-sm flex items-center justify-center transition-colors ${
                        q.icon === icon ? 'bg-app-accent/15 border border-app-accent/40' : 'bg-app-elevated/50 border border-app-border/50 hover:border-app-border'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>

                {/* Label */}
                <div>
                  <FieldLabel>Label</FieldLabel>
                  <input
                    className={INPUT_CLS}
                    maxLength={MAX_SHORT_TEXT}
                    placeholder={`Pertanyaan ${i + 1}`}
                    value={q.label}
                    onChange={(e) => updateQuestion(blockIdx, i, { label: e.target.value })}
                  />
                </div>

                {/* Question text */}
                <div>
                  <FieldLabel>Teks Pertanyaan</FieldLabel>
                  <textarea
                    className={TEXTAREA_CLS}
                    rows={3}
                    maxLength={MAX_BODY}
                    placeholder="Tulis pertanyaan diskusi..."
                    value={q.teks}
                    onChange={(e) => updateQuestion(blockIdx, i, { teks: e.target.value })}
                  />
                </div>

                {/* Hint/petunjuk */}
                <div>
                  <FieldLabel>Petunjuk Jawaban</FieldLabel>
                  <input
                    className={INPUT_CLS}
                    maxLength={MAX_BODY}
                    placeholder="Petunjuk untuk membantu siswa..."
                    value={q.petunjuk}
                    onChange={(e) => updateQuestion(blockIdx, i, { petunjuk: e.target.value })}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add question button */}
      {diskusi.pertanyaan.length > 0 && locations.length > 0 && (
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-app-accent hover:bg-app-accent/90 text-app-inverse font-semibold text-sm rounded-lg transition-colors inline-flex items-center gap-1.5"
        >
          <Plus size={14} /> Tambah Pertanyaan
        </button>
      )}
    </div>
  );
}
