'use client';

import { useAuthoringStore } from '@/store/authoring-store';
import { ChevronDown, Target, Calendar, ClipboardList, HelpCircle, Puzzle, Gamepad2, FileEdit, Zap } from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
import { COLORS } from '@/lib/color-palette';

// Schema-driven presets use this path for beautiful rendering
const SCHEMA_DRIVEN_PRESETS = new Set(['hakikat-norma', 'macam-norma']);

export default function Dashboard() {
  const meta = useAuthoringStore((s) => s.meta);
  const cp = useAuthoringStore((s) => s.cp);
  const tp = useAuthoringStore((s) => s.tp);
  const atp = useAuthoringStore((s) => s.atp);
  const alur = useAuthoringStore((s) => s.alur);
  const kuis = useAuthoringStore((s) => s.kuis);
  const modules = useAuthoringStore((s) => s.modules);
  const games = useAuthoringStore((s) => s.games);
  const materi = useAuthoringStore((s) => s.materi);
  const activePreset = useAuthoringStore((s) => s.activePreset);
  const calcCompleteness = useAuthoringStore((s) => s.calcCompleteness);
  const applyFullPreset = useAuthoringStore((s) => s.applyFullPreset);
  const setActivePanel = useAuthoringStore((s) => s.setActivePanel);
  const newProject = useAuthoringStore((s) => s.newProject);
  const saveToStorage = useAuthoringStore((s) => s.saveToStorage);

  const completeness = calcCompleteness();
  const isPresetMode = activePreset !== null;
  const hasData = meta.judulPertemuan || tp.length > 0 || kuis.length > 0;

  const presetLabels: Record<string, string> = {
    'hakikat-norma': 'Bab 3 P1: Hakikat Norma',
    'macam-norma': 'Bab 3 P2: Macam Norma',
  };

  // ── Export JSON ────────────────────────────────────────────────
  const exportJSON = () => {
    const s = useAuthoringStore.getState();
    const data = {
      meta: s.meta, cp: s.cp, tp: s.tp, atp: s.atp, alur: s.alur,
      skenario: s.skenario, kuis: s.kuis, modules: s.modules,
      games: s.games, materi: s.materi,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `media-pembelajaran-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Flow Steps ─────────────────────────────────────────────────
  const flowSteps = [
    { num: 1, label: 'Pilih Template', desc: 'Preset atau proyek kosong', icon: '1', active: true },
    { num: 2, label: 'Isi Dokumen', desc: 'CP, TP, ATP, Alur', icon: '2', active: completeness >= 10 },
    { num: 3, label: 'Tambah Konten', desc: 'Kuis, modul, materi', icon: '3', active: completeness >= 40 },
    { num: 4, label: 'Desain Canva', desc: 'Layout & visual slide', icon: '4', active: completeness >= 60 },
    { num: 5, label: 'Preview & Export', desc: 'Cek hasil lalu export', icon: '5', active: completeness >= 80 },
  ];

  const currentStep = flowSteps.findIndex((s) => !s.active);

  return (
    <div className="p-6 space-y-6 max-w-4xl page-transition">
      {/* ══ HEADER ════════════════════════════════════════════════ */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-app-primary tracking-tight">Dashboard</h1>
          <p className="text-sm text-app-secondary mt-1">Buat media pembelajaran interaktif dalam 5 langkah.</p>
        </div>
        {isPresetMode && (
          <button
            onClick={() => {
              saveToStorage();
              useAuthoringStore.setState({ activePreset: null });
            }}
            className="px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-lg hover:bg-emerald-600/30 transition-colors"
          >
            Simpan sebagai Proyek
          </button>
        )}
      </div>

      {/* ══ STATUS BAR ════════════════════════════════════════════ */}
      <div className="flex items-center gap-3">
        {/* Mode Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${
          isPresetMode
            ? 'bg-app-accent/10 border border-app-accent/25 text-app-accent'
            : hasData
              ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
              : 'bg-app-elevated/30 border border-app-border/30 text-app-muted'
        }`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {isPresetMode ? `Preset: ${presetLabels[activePreset || ''] || activePreset}` : hasData ? 'Proyek Aktif' : 'Belum Ada Data'}
        </div>

        {/* Completeness mini-bar */}
        {hasData && (
          <div className="flex items-center gap-2 flex-1">
            <div className="flex-1 h-1.5 bg-app-elevated rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${completeness}%`,
                  background: completeness === 100 ? COLORS.success : completeness >= 60 ? COLORS.warning : COLORS.error,
                }}
              />
            </div>
            <span className="text-[0.7rem] text-app-muted tabular-nums">{completeness}%</span>
          </div>
        )}
      </div>

      {/* ══ FLOW PROGRESS ════════════════════════════════════════ */}
      <div className="bg-app-surface/60 border border-app-border/60 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-app-secondary mb-4">Alur Kerja</h2>
        <div className="flex items-start gap-0">
          {flowSteps.map((step, i) => {
            const isActive = step.active;
            const isCurrent = i === Math.max(0, currentStep);
            return (
              <div key={step.num} className="flex-1 flex flex-col items-center relative">
                {/* Connector line */}
                {i > 0 && (
                  <div className={`absolute top-3.5 right-1/2 left-[-50%] h-[2px] ${
                    isActive ? 'bg-app-accent/40' : 'bg-app-elevated/50'
                  }`} />
                )}
                {/* Circle */}
                <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-app-accent/20 text-app-accent border border-app-accent/40'
                    : 'bg-app-elevated text-app-muted border border-app-border/50'
                } ${isCurrent ? 'ring-2 ring-app-accent/30' : ''}`}>
                  {isActive ? '✓' : step.num}
                </div>
                {/* Label */}
                <div className="mt-2 text-center">
                  <div className={`text-[0.7rem] font-semibold ${isActive ? 'text-app-primary' : 'text-app-muted'}`}>
                    {step.label}
                  </div>
                  <div className="text-[0.6rem] text-app-muted mt-0.5">{step.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ TEMPLATE SELECTION ════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-app-secondary mb-1">Mulai dengan Template</h2>
        <p className="text-xs text-app-muted mb-3">Pilih preset data PPKn atau mulai dari proyek kosong.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: 'hakikat-norma', icon: '🧑‍🤝‍🧑', label: 'Hakikat Norma', sub: 'PPKn VII · Bab 3 P1', color: 'amber' },
            { key: 'macam-norma', icon: '📜', label: 'Macam Norma', sub: 'PPKn VII · Bab 3 P2', color: 'cyan' },
            { key: 'perilaku-patuhan', icon: '⚖️', label: 'Perilaku Patuh', sub: 'PPKn VII · Bab 3 P3', color: 'emerald' },
            { key: 'blank', icon: '📋', label: 'Proyek Kosong', sub: 'Isi semua manual', color: 'slate' },
          ].map((p) => {
            const isCurrentPreset = isPresetMode && activePreset === p.key;
            const colorMap: Record<string, string> = {
              amber: 'hover:border-app-accent/40 hover:bg-app-accent/5',
              cyan: 'hover:border-cyan-500/40 hover:bg-cyan-500/5',
              emerald: 'hover:border-emerald-500/40 hover:bg-emerald-500/5',
              slate: 'hover:border-app-border/40 hover:bg-app-elevated/5',
            };
            const activeColorMap: Record<string, string> = {
              amber: 'border-app-accent/50 bg-app-accent/10 ring-1 ring-app-accent/20',
              cyan: 'border-cyan-500/50 bg-cyan-500/10 ring-1 ring-cyan-500/20',
              emerald: 'border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/20',
              slate: 'border-app-border/50 bg-app-elevated/10 ring-1 ring-app-border/20',
            };
            return (
              <button
                key={p.key}
                onClick={async () => {
                  if (hasData && !confirm('Template akan menimpa data saat ini. Lanjutkan?')) return;

                  // Schema-driven presets get beautiful token-based rendering
                  if (SCHEMA_DRIVEN_PRESETS.has(p.key)) {
                    // Load authoring data first (for meta, CP, TP, ATP, etc.)
                    applyFullPreset(p.key);
                    // Then load schema-driven canvas pages (replaces legacy templates)
                    setTimeout(async () => {
                      await useCanvaStore.getState().loadSchemaPreset(p.key);
                      useAuthoringStore.getState().setActivePanel('canva');
                    }, 100);
                  } else if (p.key === 'blank') {
                    useAuthoringStore.getState().newProject();
                    setTimeout(() => {
                      useCanvaStore.getState().resetCanvas();
                      useAuthoringStore.getState().setActivePanel('canva');
                    }, 100);
                  } else {
                    // Other presets use legacy template path
                    applyFullPreset(p.key);
                    setTimeout(() => {
                      useCanvaStore.getState().resetCanvas();
                      useAuthoringStore.getState().setActivePanel('canva');
                    }, 300);
                  }
                }}
                className={`rounded-xl p-4 text-center transition-all cursor-pointer border ${
                  isCurrentPreset
                    ? activeColorMap[p.color]
                    : `border-app-border/40 bg-app-elevated/30 ${colorMap[p.color]}`
                }`}
              >
                <div className="text-2xl mb-2">{p.icon}</div>
                <div className="text-xs font-semibold text-app-primary">{p.label}</div>
                <div className="text-[0.6rem] text-app-muted mt-0.5">{p.sub}</div>
                {SCHEMA_DRIVEN_PRESETS.has(p.key) && (
                  <div className="text-[0.55rem] text-app-accent/80 font-bold mt-1 flex items-center gap-0.5"><Zap size={10} className="inline" /> Schema-Driven</div>
                )}
                {isCurrentPreset && (
                  <div className="text-[0.6rem] text-app-accent font-bold mt-1.5">AKTIF</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══ QUICK ACTIONS ════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Dokumen — primary CTA */}
        <button
          onClick={() => setActivePanel('dokumen')}
          className="flex items-center gap-4 bg-app-elevated/40 border border-app-border/40 rounded-xl p-4 hover:border-app-accent/30 hover:bg-app-elevated/60 transition-all cursor-pointer text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-app-accent/10 flex items-center justify-center text-app-accent flex-shrink-0">
            <FileEdit size={18} />
          </div>
          <div>
            <div className="text-sm font-semibold text-app-primary">Isi Dokumen</div>
            <div className="text-xs text-app-muted">CP, TP, ATP, Alur Pembelajaran</div>
          </div>
        </button>

        {/* Konten — secondary CTA */}
        <button
          onClick={() => setActivePanel('konten')}
          className="flex items-center gap-4 bg-app-elevated/40 border border-app-border/40 rounded-xl p-4 hover:border-cyan-500/30 hover:bg-app-elevated/60 transition-all cursor-pointer text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <Puzzle size={18} />
          </div>
          <div>
            <div className="text-sm font-semibold text-app-primary">Tambah Konten</div>
            <div className="text-xs text-app-muted">Kuis, modul interaktif, materi</div>
          </div>
        </button>

        {/* Schema Preview — new schema-driven mode */}
        {isPresetMode && (
          <button
            onClick={() => setActivePanel('preview')}
            className="flex items-center gap-4 bg-gradient-to-br from-fuchsia-900/30 to-purple-900/20 border border-fuchsia-500/30 rounded-xl p-4 hover:border-fuchsia-400/50 hover:from-fuchsia-900/40 hover:to-purple-900/30 transition-all cursor-pointer text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-fuchsia-500/15 flex items-center justify-center text-fuchsia-400 flex-shrink-0">
              <Zap size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold text-fuchsia-200">Schema Preview</div>
              <div className="text-xs text-fuchsia-400/60">JSON-driven rendering + 7 tema</div>
            </div>
          </button>
        )}

        {/* Preview — tertiary CTA */}
        <button
          onClick={() => setActivePanel('preview')}
          className="flex items-center gap-4 bg-app-elevated/40 border border-app-border/40 rounded-xl p-4 hover:border-emerald-500/30 hover:bg-app-elevated/60 transition-all cursor-pointer text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-lg flex-shrink-0">
            📱
          </div>
          <div>
            <div className="text-sm font-semibold text-app-primary">Preview Siswa</div>
            <div className="text-xs text-app-muted">Lihat tampilan lengkap siswa</div>
          </div>
        </button>

        {/* Canva — design CTA */}
        <button
          onClick={() => {
            // If we have a schema-driven preset, just go to canva (no reset needed)
            const activePreset = useAuthoringStore.getState().activePreset;
            if (SCHEMA_DRIVEN_PRESETS.has(activePreset || '')) {
              setActivePanel('canva');
            } else {
              useCanvaStore.getState().resetCanvas();
              setActivePanel('canva');
            }
          }}
          className="flex items-center gap-4 bg-app-elevated/40 border border-app-border/40 rounded-xl p-4 hover:border-purple-500/30 hover:bg-app-elevated/60 transition-all cursor-pointer text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 text-lg flex-shrink-0">
            🎨
          </div>
          <div>
            <div className="text-sm font-semibold text-app-primary">Desain Canva</div>
            <div className="text-xs text-app-muted">Layout & visual slide</div>
          </div>
        </button>
      </div>

      {/* ══ Kelenkapan (collapsible) ═════════════════════════════ */}
      {hasData && (
        <details className="group bg-app-surface/40 border border-app-border/40 rounded-xl">
          <summary className="px-5 py-3 cursor-pointer flex items-center justify-between text-sm font-semibold text-app-secondary hover:text-app-primary transition-colors">
            <span>Kelengkapan Proyek</span>
            <span className="text-[0.7rem] text-app-muted group-open:rotate-180 transition-transform"><ChevronDown size={14} className="inline" /></span>
          </summary>
          <div className="px-5 pb-4 space-y-3">
            {/* Stats row */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {[
                { label: 'TP', val: tp.length, icon: <Target size={14} />, color: 'text-app-accent' },
                { label: 'ATP', val: atp.pertemuan.length, icon: <Calendar size={14} />, color: 'text-cyan-400' },
                { label: 'Alur', val: alur.length, icon: <ClipboardList size={14} />, color: 'text-purple-400' },
                { label: 'Kuis', val: kuis.length, icon: <HelpCircle size={14} />, color: 'text-emerald-400' },
                { label: 'Modul', val: modules.length, icon: <Puzzle size={14} />, color: 'text-purple-400' },
                { label: 'Game', val: games.length, icon: <Gamepad2 size={14} />, color: 'text-orange-400' },
                { label: 'Materi', val: materi.blok.length, icon: <FileEdit size={14} />, color: 'text-sky-400' },
              ].map((s) => (
                <div key={s.label} className="bg-app-elevated/30 rounded-lg p-2 text-center">
                  <div className="text-sm mb-0.5">{s.icon}</div>
                  <div className={`text-sm font-bold ${s.color}`}>{s.val}</div>
                  <div className="text-[0.6rem] text-app-muted">{s.label}</div>
                </div>
              ))}
            </div>
            {/* Checklist */}
            <div className="space-y-1">
              {[
                { label: 'Identitas media diisi', done: !!(meta.judulPertemuan && meta.kelas) },
                { label: 'Capaian Pembelajaran', done: !!cp.capaianFase },
                { label: 'Tujuan Pembelajaran (min 1)', done: tp.length > 0 },
                { label: 'ATP / Pertemuan (min 1)', done: atp.pertemuan.length > 0 },
                { label: 'Alur Pembelajaran (min 3)', done: alur.length >= 3 },
                { label: 'Kuis (min 5 soal)', done: kuis.length >= 5 },
                { label: 'Modul konten (min 1)', done: modules.length > 0 },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-xs py-1">
                  <span className={c.done ? 'text-emerald-400' : 'text-app-muted'}>{c.done ? '✓' : '○'}</span>
                  <span className={c.done ? 'text-app-secondary' : 'text-app-muted'}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </details>
      )}

      {/* ══ BOTTOM TOOLBAR ═══════════════════════════════════════ */}
      <div className="flex items-center gap-2 pt-2 border-t border-app-border/40">
        <button
          onClick={() => newProject()}
          className="px-3 py-1.5 text-xs text-app-secondary hover:text-app-primary bg-app-elevated/30 hover:bg-app-elevated/50 rounded-lg border border-app-border/30 transition-colors"
        >
          Proyek Baru
        </button>
        <button
          onClick={() => setActivePanel('projects')}
          className="px-3 py-1.5 text-xs text-app-secondary hover:text-app-primary bg-app-elevated/30 hover:bg-app-elevated/50 rounded-lg border border-app-border/30 transition-colors"
        >
          Buka Proyek
        </button>
        <button
          onClick={() => setActivePanel('import')}
          className="px-3 py-1.5 text-xs text-app-secondary hover:text-app-primary bg-app-elevated/30 hover:bg-app-elevated/50 rounded-lg border border-app-border/30 transition-colors"
        >
          Import
        </button>
        <button
          onClick={exportJSON}
          className="px-3 py-1.5 text-xs text-app-secondary hover:text-app-primary bg-app-elevated/30 hover:bg-app-elevated/50 rounded-lg border border-app-border/30 transition-colors"
        >
          Export JSON
        </button>
        <button
          onClick={() => setActivePanel('autogen')}
          className="px-3 py-1.5 text-xs text-app-accent hover:text-app-accent/80 bg-app-accent/5 hover:bg-app-accent/10 rounded-lg border border-app-accent/15 transition-colors"
        >
          Auto-Generate
        </button>
        <div className="flex-1" />
        <button
          onClick={saveToStorage}
          className="px-3 py-1.5 text-xs text-app-secondary hover:text-app-primary transition-colors"
        >
          Simpan
        </button>
      </div>
    </div>
  );
}
