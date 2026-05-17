'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuthoringStore, VERB_OPTIONS, COLOR_OPTIONS } from '@/store/authoring-store';
import type { PanelId } from '@/store/authoring-store';
import { useDragSort } from '@/hooks/use-drag-sort';
import { useTeacherMode } from '@/hooks/use-teacher-mode';
import { Target, ClipboardList, Trash2, Tag, Map, Ruler, Calendar, GripVertical, ChevronDown } from 'lucide-react';
import { Collapse } from '@/lib/transition';
import { COLORS } from '@/lib/color-palette';

// ── Accordion Item ───────────────────────────────────────────────
function AccordionSection({
  icon,
  title,
  defaultOpen,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <div className="border border-app-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-app-surface hover:bg-app-elevated/80 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-app-secondary">{icon}</span>
          <span className="text-sm font-semibold text-app-primary">{title}</span>
        </div>
        <ChevronDown
          size={16}
          className={`text-app-muted transition-transform duration-300 ease-in-out ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <Collapse open={open} className="border-t border-app-border" duration={0.25}>
        <div className="p-4 bg-app-surface/80 space-y-4">
          {children}
        </div>
      </Collapse>
    </div>
  );
}

// ── Shared field styles ──────────────────────────────────────────
const fieldLabel = 'block text-xs font-medium text-app-secondary mb-1.5';
const fieldInput = 'w-full bg-app-elevated border border-app-border rounded-lg px-3 py-2 text-sm text-app-primary placeholder:text-app-muted focus:outline-none focus:ring-2 focus:ring-app-accent/40 focus:border-app-accent/60 focus:shadow-[0_0_0_3px_rgba(var(--accent-rgb,59,130,246),0.08)] transition-all duration-200';
const fieldTextarea = 'w-full bg-app-elevated border border-app-border rounded-lg px-3 py-2 text-sm text-app-primary placeholder:text-app-muted focus:outline-none focus:ring-2 focus:ring-app-accent/40 focus:border-app-accent/60 focus:shadow-[0_0_0_3px_rgba(var(--accent-rgb,59,130,246),0.08)] transition-all duration-200 resize-none';

// ── Identitas Media ─────────────────────────────────────────────
function MetaSection() {
  const meta = useAuthoringStore((s) => s.meta);
  const updateMeta = useAuthoringStore((s) => s.updateMeta);
  const { isSederhana } = useTeacherMode();

  // In sederhana mode, show only essential fields (no ikon, kurikulum, namaBab)
  const allFields: { key: keyof typeof meta; label: string; placeholder: string; type?: string; maxLength?: number; sederhanaOnly?: boolean; lengkapOnly?: boolean }[] = [
    { key: 'judulPertemuan', label: 'Judul Pertemuan', placeholder: 'Pertemuan 1 – Hakikat Norma' },
    { key: 'subjudul', label: 'Subjudul / Pertanyaan Pemantik', placeholder: 'Mengapa manusia membutuhkan norma?' },
    { key: 'ikon', label: 'Ikon Cover (emoji)', placeholder: '🧑‍🤝‍🧑', maxLength: 8, lengkapOnly: true },
    { key: 'durasi', label: 'Durasi', placeholder: '2 × 40 menit' },
    { key: 'mapel', label: 'Mata Pelajaran', placeholder: 'PPKn' },
    { key: 'kelas', label: 'Kelas', placeholder: 'VII' },
    { key: 'kurikulum', label: 'Kurikulum', placeholder: 'Kurikulum Merdeka', lengkapOnly: true },
    { key: 'namaBab', label: 'Nama Bab (navbar)', placeholder: 'Hakikat Norma', lengkapOnly: true },
  ];

  const fields = allFields.filter(f => {
    if (isSederhana && f.lengkapOnly) return false;
    if (!isSederhana && f.sederhanaOnly) return false;
    return true;
  });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {fields.map((f) => (
          <div key={f.key}>
            <label className={fieldLabel}>{f.label}</label>
            <input
              type={f.type || 'text'}
              className={fieldInput}
              placeholder={f.placeholder}
              maxLength={f.maxLength}
              value={meta[f.key]}
              onChange={(e) => updateMeta(f.key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Capaian Pembelajaran ─────────────────────────────────────────
function CpSection() {
  const cp = useAuthoringStore((s) => s.cp);
  const updateCp = useAuthoringStore((s) => s.updateCp);
  const addProfil = useAuthoringStore((s) => s.addProfil);
  const removeProfil = useAuthoringStore((s) => s.removeProfil);
  const [profilInput, setProfilInput] = useState('');

  const handleProfilKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = profilInput.trim();
      if (!val) return;
      addProfil(val);
      setProfilInput('');
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={fieldLabel}>Elemen</label>
          <input
            className={fieldInput}
            placeholder="Pancasila"
            value={cp.elemen}
            onChange={(e) => updateCp('elemen', e.target.value)}
          />
        </div>
        <div>
          <label className={fieldLabel}>Sub-Elemen</label>
          <input
            className={fieldInput}
            placeholder="Pemahaman norma dan nilai"
            value={cp.subElemen}
            onChange={(e) => updateCp('subElemen', e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className={fieldLabel}>Capaian Fase (narasi lengkap)</label>
        <textarea
          className={fieldTextarea}
          rows={4}
          placeholder="Peserta didik mampu…"
          value={cp.capaianFase}
          onChange={(e) => updateCp('capaianFase', e.target.value)}
        />
      </div>
      <div>
        <label className={fieldLabel}>
          Profil Pelajar Pancasila{' '}
          <span className="text-app-muted font-normal">(ketik + Enter)</span>
        </label>
        <div className="flex flex-wrap gap-2 p-2 bg-app-elevated border border-app-border rounded-lg min-h-[42px]">
          {cp.profil.map((p, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 bg-app-elevated text-app-primary text-xs px-2.5 py-1 rounded-md"
            >
              {p}
              <button
                onClick={() => removeProfil(i)}
                className="text-app-secondary hover:text-red-400 ml-0.5"
              >
                ×
              </button>
            </span>
          ))}
          <input
            className="bg-transparent text-sm text-app-primary placeholder:text-app-muted outline-none flex-1 min-w-[120px]"
            placeholder="Tambah profil…"
            value={profilInput}
            onChange={(e) => setProfilInput(e.target.value)}
            onKeyDown={handleProfilKeyDown}
            list="cp-profil-suggest"
          />
          <datalist id="cp-profil-suggest">
            <option value="Beriman, Bertakwa kepada Tuhan YME" />
            <option value="Berkebinekaan Global" />
            <option value="Bergotong Royong" />
            <option value="Bernalar Kritis" />
            <option value="Mandiri" />
            <option value="Kreatif" />
          </datalist>
        </div>
      </div>
    </div>
  );
}

// ── Drag Handle ──────────────────────────────────────────────
function DragHandle({ onPointerDown, index }: { onPointerDown: (e: React.PointerEvent, index: number) => void; index: number }) {
  return (
    <span
      onPointerDown={(e) => onPointerDown(e, index)}
      className="text-app-muted hover:text-app-secondary cursor-grab active:cursor-grabbing select-none text-lg leading-none px-1"
      aria-label="Drag to reorder"
    >
      <GripVertical size={16} />
    </span>
  );
}

// ── Tujuan Pembelajaran ─────────────────────────────────────────
function TpSection() {
  const tp = useAuthoringStore((s) => s.tp);
  const addTp = useAuthoringStore((s) => s.addTp);
  const deleteTp = useAuthoringStore((s) => s.deleteTp);
  const updateTp = useAuthoringStore((s) => s.updateTp);
  const reorderTp = useAuthoringStore((s) => s.reorderTp);

  const handleReorder = useCallback((newItems: typeof tp) => {
    const fromIndex = tp.findIndex((item, i) => newItems[i] !== item);
    const toIndex = newItems.findIndex((item, i) => tp[i] !== item);
    if (fromIndex >= 0 && toIndex >= 0) reorderTp(fromIndex, toIndex);
  }, [tp, reorderTp]);

  const { dragHandlers } = useDragSort(tp, handleReorder);

  if (!tp.length) {
    return (
      <div className="text-center py-8 px-4 bg-app-elevated/20 border border-dashed border-app-border/50 rounded-xl">
        <div className="w-12 h-12 rounded-xl bg-app-accent/10 flex items-center justify-center mx-auto mb-3">
          <Target size={24} className="text-app-accent/70" />
        </div>
        <p className="text-sm font-medium text-app-primary mb-1">Belum ada Tujuan Pembelajaran</p>
        <p className="text-xs text-app-muted mb-4">Tambahkan TP untuk mendefinisikan tujuan setiap pertemuan.</p>
        <button
          onClick={addTp}
          className="px-4 py-2 bg-app-accent hover:bg-app-accent/90 text-app-inverse font-semibold text-sm rounded-lg transition-colors"
        >
          ＋ Tambah TP
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tp.map((item, i) => (
        <div
          key={i}
          className={`bg-app-elevated/50 border border-app-border/50 rounded-lg p-4 space-y-3 transition-all duration-200 ${
            dragHandlers.getIsDragged(i) ? 'opacity-50 scale-[0.98]' : ''
          } ${dragHandlers.getIsOver(i) ? 'border-t-2 border-t-app-accent' : ''}`}
        >
          {/* Header */}
          <div className="flex items-center gap-2">
            <DragHandle onPointerDown={dragHandlers.onPointerDown} index={i} />
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: `${item.color}22`, color: item.color }}
            >
              {i + 1}
            </div>
            <span className="text-sm font-medium text-app-primary">Tujuan Pembelajaran {i + 1}</span>
            <button
              onClick={() => deleteTp(i)}
              className="ml-auto text-app-muted hover:text-red-400 transition-colors text-sm"
            >
              <Trash2 size={14} className="inline" />
            </button>
          </div>

          {/* Verb & Pertemuan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={fieldLabel}>Kata Kerja Operasional</label>
              <select
                className={fieldInput}
                value={item.verb}
                onChange={(e) => updateTp(i, 'verb', e.target.value)}
              >
                {VERB_OPTIONS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={fieldLabel}>Pertemuan ke-</label>
              <input
                type="number"
                min={1}
                max={10}
                className={fieldInput}
                value={item.pertemuan}
                onChange={(e) => updateTp(i, 'pertemuan', parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label className={fieldLabel}>Deskripsi</label>
            <textarea
              className={fieldTextarea}
              rows={2}
              placeholder="jelaskan tujuan pembelajaran…"
              value={item.desc}
              onChange={(e) => updateTp(i, 'desc', e.target.value)}
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className={fieldLabel}>Warna Aksen</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => updateTp(i, 'color', c)}
                  className="w-6 h-6 rounded-full transition-all hover:scale-110"
                  style={{
                    background: c,
                    border: item.color === c ? '2px solid #fff' : '2px solid transparent',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={addTp}
        className="px-4 py-2 bg-app-accent hover:bg-app-accent/90 text-app-inverse font-semibold text-sm rounded-lg transition-colors"
      >
        ＋ Tambah TP
      </button>
    </div>
  );
}

// ── Alur Tujuan Pembelajaran ────────────────────────────────────
function AtpSection() {
  const atp = useAuthoringStore((s) => s.atp);
  const updateAtpNamaBab = useAuthoringStore((s) => s.updateAtpNamaBab);
  const addAtpPertemuan = useAuthoringStore((s) => s.addAtpPertemuan);
  const deleteAtpPertemuan = useAuthoringStore((s) => s.deleteAtpPertemuan);
  const updateAtpPertemuan = useAuthoringStore((s) => s.updateAtpPertemuan);

  return (
    <div className="space-y-3">
      <div>
        <label className={fieldLabel}>Nama Bab / Unit</label>
        <input
          className={fieldInput}
          placeholder="Bab 3 — Patuh terhadap Norma"
          value={atp.namaBab}
          onChange={(e) => updateAtpNamaBab(e.target.value)}
        />
      </div>

      {!atp.pertemuan.length ? (
        <div className="text-center py-8 px-4 bg-app-elevated/20 border border-dashed border-app-border/50 rounded-xl">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
            <Calendar size={24} className="text-amber-400/70" />
          </div>
          <p className="text-sm font-medium text-app-primary mb-1">Belum ada pertemuan</p>
          <p className="text-xs text-app-muted mb-4">Tambahkan pertemuan untuk menyusun Alur Tujuan Pembelajaran.</p>
          <button
            onClick={addAtpPertemuan}
            className="px-4 py-2 bg-app-accent hover:bg-app-accent/90 text-app-inverse font-semibold text-sm rounded-lg transition-colors"
          >
            ＋ Tambah Pertemuan
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {atp.pertemuan.map((p, i) => (
            <div key={i} className="bg-app-elevated/50 border border-app-border/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-app-accent/15 text-app-accent flex items-center justify-center text-xs font-bold flex-shrink-0">
                  P{i + 1}
                </div>
                <span className="text-sm font-medium text-app-primary">Pertemuan {i + 1}</span>
                <button
                  onClick={() => deleteAtpPertemuan(i)}
                  className="ml-auto text-app-muted hover:text-red-400 transition-colors text-sm"
                >
                  <Trash2 size={14} className="inline" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={fieldLabel}>Judul Pertemuan</label>
                  <input
                    className={fieldInput}
                    placeholder="Hakikat Norma"
                    value={p.judul}
                    onChange={(e) => updateAtpPertemuan(i, 'judul', e.target.value)}
                  />
                </div>
                <div>
                  <label className={fieldLabel}>Durasi</label>
                  <input
                    className={fieldInput}
                    placeholder="2×40 menit"
                    value={p.durasi}
                    onChange={(e) => updateAtpPertemuan(i, 'durasi', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className={fieldLabel}>TP yang Dicapai</label>
                <input
                  className={fieldInput}
                  placeholder="TP 1 — Menjelaskan pengertian norma"
                  value={p.tp}
                  onChange={(e) => updateAtpPertemuan(i, 'tp', e.target.value)}
                />
              </div>
              <div>
                <label className={fieldLabel}>Kegiatan Pembelajaran</label>
                <textarea
                  className={fieldTextarea}
                  rows={2}
                  placeholder="Apersepsi → Materi → Diskusi…"
                  value={p.kegiatan}
                  onChange={(e) => updateAtpPertemuan(i, 'kegiatan', e.target.value)}
                />
              </div>
              <div>
                <label className={fieldLabel}>Penilaian</label>
                <input
                  className={fieldInput}
                  placeholder="Observasi + Pemantik"
                  value={p.penilaian}
                  onChange={(e) => updateAtpPertemuan(i, 'penilaian', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={addAtpPertemuan}
        className="px-4 py-2 bg-app-accent hover:bg-app-accent/90 text-app-inverse font-semibold text-sm rounded-lg transition-colors"
      >
        ＋ Tambah Pertemuan
      </button>
    </div>
  );
}

// ── Alur Kegiatan ───────────────────────────────────────────────
function AlurSection() {
  const alur = useAuthoringStore((s) => s.alur);
  const addAlur = useAuthoringStore((s) => s.addAlur);
  const deleteAlur = useAuthoringStore((s) => s.deleteAlur);
  const updateAlur = useAuthoringStore((s) => s.updateAlur);
  const reorderAlur = useAuthoringStore((s) => s.reorderAlur);

  const handleReorder = useCallback((newItems: typeof alur) => {
    const fromIndex = alur.findIndex((item, i) => newItems[i] !== item);
    const toIndex = newItems.findIndex((item, i) => alur[i] !== item);
    if (fromIndex >= 0 && toIndex >= 0) reorderAlur(fromIndex, toIndex);
  }, [alur, reorderAlur]);

  const { dragHandlers } = useDragSort(alur, handleReorder);

  const faseColors: Record<string, string> = {
    Pendahuluan: COLORS.faseKuis,
    Inti: COLORS.faseGame,
    Penutup: COLORS.faseMateri,
  };

  return (
    <div className="space-y-4">
      {!alur.length ? (
        <div className="text-center py-8 px-4 bg-app-elevated/20 border border-dashed border-app-border/50 rounded-xl">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
            <Map size={24} className="text-emerald-400/70" />
          </div>
          <p className="text-sm font-medium text-app-primary mb-1">Belum ada langkah kegiatan</p>
          <p className="text-xs text-app-muted mb-4">Tambahkan langkah Pendahuluan, Inti, dan Penutup untuk menyusun alur pembelajaran.</p>
          <button
            onClick={addAlur}
            className="px-4 py-2 bg-app-accent hover:bg-app-accent/90 text-app-inverse font-semibold text-sm rounded-lg transition-colors"
          >
            ＋ Tambah Langkah
          </button>
        </div>
      ) : (
        alur.map((step, i) => {
          const col = faseColors[step.fase] || COLORS.materi;
          return (
            <div
              key={i}
              className={`bg-app-elevated/50 border border-app-border/50 rounded-lg p-4 space-y-3 transition-all duration-200 ${
                dragHandlers.getIsDragged(i) ? 'opacity-50 scale-[0.98]' : ''
              } ${dragHandlers.getIsOver(i) ? 'border-t-2 border-t-app-accent' : ''}`}
            >
              <div className="flex items-center gap-2">
                <DragHandle onPointerDown={dragHandlers.onPointerDown} index={i} />
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: `${col}22`, color: col }}
                >
                  {i + 1}
                </div>
                <span className="text-sm font-medium text-app-primary">{step.judul || `Langkah ${i + 1}`}</span>
                <button
                  onClick={() => deleteAlur(i)}
                  className="ml-auto text-app-muted hover:text-red-400 transition-colors text-sm"
                >
                  <Trash2 size={14} className="inline" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={fieldLabel}>Fase</label>
                  <select
                    className={fieldInput}
                    value={step.fase}
                    onChange={(e) => updateAlur(i, 'fase', e.target.value)}
                  >
                    {['Pendahuluan', 'Inti', 'Penutup'].map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={fieldLabel}>Durasi</label>
                  <input
                    className={fieldInput}
                    placeholder="10 menit"
                    value={step.durasi}
                    onChange={(e) => updateAlur(i, 'durasi', e.target.value)}
                  />
                </div>
                <div>
                  <label className={fieldLabel}>Nama Kegiatan</label>
                  <input
                    className={fieldInput}
                    placeholder="Apersepsi"
                    value={step.judul}
                    onChange={(e) => updateAlur(i, 'judul', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className={fieldLabel}>Deskripsi Kegiatan</label>
                <textarea
                  className={fieldTextarea}
                  rows={2}
                  placeholder="Detail kegiatan…"
                  value={step.deskripsi}
                  onChange={(e) => updateAlur(i, 'deskripsi', e.target.value)}
                />
              </div>
            </div>
          );
        })
      )}

      <button
        onClick={addAlur}
        className="px-4 py-2 bg-app-accent hover:bg-app-accent/90 text-app-inverse font-semibold text-sm rounded-lg transition-colors"
      >
        ＋ Tambah Langkah
      </button>
    </div>
  );
}

// ── Main Dokumen Panel ──────────────────────────────────────────
export default function Dokumen() {
  const { isSederhana } = useTeacherMode();

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-app-primary flex items-center gap-2">
          <Ruler size={18} /> {isSederhana ? 'RPP & Dokumen' : 'Dokumen Pembelajaran'}
        </h2>
        <p className="text-sm text-app-secondary mt-1">
          {isSederhana
            ? 'Isi informasi dasar dan tujuan pembelajaran.'
            : 'Lengkapi semua dokumen perencanaan pembelajaran dalam satu halaman.'
          }
        </p>
      </div>

      <div className="space-y-3">
        <AccordionSection icon={<Tag size={16} className="inline" />} title={isSederhana ? 'Identitas' : 'Identitas Media'} defaultOpen>
          <MetaSection />
        </AccordionSection>

        <AccordionSection icon={<ClipboardList size={16} className="inline" />} title="Capaian Pembelajaran">
          <CpSection />
        </AccordionSection>

        <AccordionSection icon={<Target size={16} className="inline" />} title="Tujuan Pembelajaran">
          <TpSection />
        </AccordionSection>

        {/* ATP & Alur — only shown in lengkap (advanced) mode */}
        {!isSederhana && (
          <AccordionSection icon={<Calendar size={16} className="inline" />} title="Alur Tujuan Pembelajaran">
            <AtpSection />
          </AccordionSection>
        )}

        {!isSederhana && (
          <AccordionSection icon={<Map size={16} className="inline" />} title="Alur Kegiatan">
            <AlurSection />
          </AccordionSection>
        )}
      </div>

      {/* Helpful hint in sederhana mode */}
      {isSederhana && (
        <div className="bg-app-info/5 border border-app-info/15 rounded-xl p-3.5 flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-app-info/10 flex items-center justify-center text-app-info text-sm">
            💡
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-app-secondary leading-relaxed">
              Bagian Alur Tujuan Pembelajaran & Alur Kegiatan tersedia di <strong>Mode Lanjutan</strong>. Sebagian besar guru SMP cukup mengisi Identitas, Capaian, dan Tujuan Pembelajaran.
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-app-border flex justify-end">
        <button
          onClick={() => useAuthoringStore.getState().setActivePanel('konten')}
          className="px-4 py-2 bg-app-accent hover:bg-app-accent/90 text-app-inverse font-semibold text-sm rounded-lg transition-colors flex items-center gap-2"
        >
          {isSederhana ? 'Selanjutnya: Tambah Materi →' : 'Selanjutnya: Tambah Konten →'}
        </button>
      </div>
    </div>
  );
}
