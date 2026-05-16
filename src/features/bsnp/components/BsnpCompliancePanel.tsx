/**
 * SILSE — BSNP Compliance Panel
 * Shows compliance status for Indonesian education standards.
 * Refactored in Task #1 — uses BlockCapabilityRegistry.
 */

'use client';

import React, { useMemo } from 'react';
import type { ScreenSchema, SchemaBlock } from '../../../core/schema/types';
import { BlockCapabilityRegistry } from '../../../core/schema/capability-registry';
import { estimateBlockHeight, SCENE_MAX_HEIGHT } from '../../../core/schema/transaction';

// ─── BSNP Criteria ─────────────────────────────────────────────────────
interface BSNPCriterion {
  id: string;
  label: string;
  description: string;
  check: (schema: ScreenSchema) => { met: boolean; detail: string };
}

const BSNP_CRITERIA: BSNPCriterion[] = [
  {
    id: 'has-cover',
    label: 'Halaman Sampul',
    description: 'Setiap materi harus memiliki halaman sampul',
    check: (schema) => {
      const hasCover = schema.blocks.some(b => b.type === 'cover');
      return { met: hasCover, detail: hasCover ? 'Sampul ditemukan' : 'Tidak ada halaman sampul' };
    },
  },
  {
    id: 'has-kompetensi',
    label: 'Kompetensi Dasar',
    description: 'Materi harus menyertakan kompetensi dasar',
    check: (schema) => {
      const hasMateri = schema.blocks.some(b => b.type === 'materi-section');
      return { met: hasMateri, detail: hasMateri ? 'Kompetensi tercantum' : 'Belum ada kompetensi dasar' };
    },
  },
  {
    id: 'has-assessment',
    label: 'Penilaian',
    description: 'Materi harus menyertakan komponen penilaian',
    check: (schema) => {
      const hasKuis = schema.blocks.some(b => b.type === 'kuis' || b.type === 'game');
      return { met: hasKuis, detail: hasKuis ? 'Penilaian tersedia' : 'Belum ada komponen penilaian' };
    },
  },
  {
    id: 'has-interaction',
    label: 'Interaktivitas',
    description: 'Materi interaktif harus memiliki elemen interaktif',
    check: (schema) => {
      const hasInteractive = schema.blocks.some(b => {
        const caps = BlockCapabilityRegistry.get(b.type);
        return caps.derived.interactive;
      });
      return { met: hasInteractive, detail: hasInteractive ? 'Elemen interaktif ada' : 'Belum ada elemen interaktif' };
    },
  },
  {
    id: 'no-overflow',
    label: 'Kapasitas Halaman',
    description: 'Konten harus muat dalam satu scene (1280×720)',
    check: (schema) => {
      let total = 0;
      for (const block of schema.blocks) {
        total += estimateBlockHeight(block);
      }
      const ok = total <= SCENE_MAX_HEIGHT;
      return { met: ok, detail: ok ? `Total ${total}px (muat)` : `Total ${total}px melebihi ${SCENE_MAX_HEIGHT}px` };
    },
  },
  {
    id: 'has-instructions',
    label: 'Petunjuk Penggunaan',
    description: 'Materi interaktif harus menyertakan petunjuk',
    check: (schema) => {
      const hasPetunjuk = schema.blocks.some(b => b.type === 'petunjuk');
      const hasInteractive = schema.blocks.some(b => {
        const caps = BlockCapabilityRegistry.get(b.type);
        return caps.derived.interactive;
      });
      if (!hasInteractive) return { met: true, detail: 'Tidak ada elemen interaktif (tidak perlu petunjuk)' };
      return { met: hasPetunjuk, detail: hasPetunjuk ? 'Petunjuk tersedia' : 'Tambahkan petunjuk untuk elemen interaktif' };
    },
  },
];

// ─── Props ─────────────────────────────────────────────────────────────
interface BsnpCompliancePanelProps {
  schema: ScreenSchema | null;
  className?: string;
}

// ─── Component ─────────────────────────────────────────────────────────
export function BsnpCompliancePanel({ schema, className }: BsnpCompliancePanelProps) {
  const results = useMemo(() => {
    if (!schema) return [];
    return BSNP_CRITERIA.map(criterion => ({
      ...criterion,
      ...criterion.check(schema),
    }));
  }, [schema]);

  const metCount = results.filter(r => r.met).length;
  const totalCount = results.length;
  const compliancePercent = totalCount > 0 ? Math.round((metCount / totalCount) * 100) : 0;

  if (!schema) {
    return (
      <div className={`p-4 text-sm text-muted-foreground ${className ?? ''}`}>
        Pilih halaman untuk melihat status kepatuhan BSNP
      </div>
    );
  }

  return (
    <div className={`p-4 space-y-3 ${className ?? ''}`}>
      {/* Summary */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Kepatuhan BSNP</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          compliancePercent >= 80 ? 'bg-emerald-100 text-emerald-700' :
          compliancePercent >= 50 ? 'bg-amber-100 text-amber-700' :
          'bg-red-100 text-red-700'
        }`}>
          {compliancePercent}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full ${
            compliancePercent >= 80 ? 'bg-emerald-500' :
            compliancePercent >= 50 ? 'bg-amber-500' :
            'bg-red-500'
          }`}
          style={{ width: `${compliancePercent}%` }}
        />
      </div>

      {/* Criteria list */}
      <div className="space-y-2">
        {results.map(result => (
          <div key={result.id} className="flex items-start gap-2 text-xs">
            <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
              result.met
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {result.met ? '✓' : '!'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{result.label}</div>
              <div className="text-muted-foreground">{result.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
