'use client';

import { useAuthoringStore } from '@/store/authoring-store';
import { useCanvaStore } from '@/store/canva-store';

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

  const stats = [
    { label: 'TP', val: tp.length, icon: '🎯', color: 'text-amber-400' },
    { label: 'ATP Pertemuan', val: atp.pertemuan.length, icon: '📅', color: 'text-cyan-400' },
    { label: 'Alur Langkah', val: alur.length, icon: '📋', color: 'text-purple-400' },
    { label: 'Soal Kuis', val: kuis.length, icon: '❓', color: 'text-emerald-400' },
    { label: 'Modul', val: modules.length, icon: '🧩', color: 'text-purple-400' },
    { label: 'Game', val: games.length, icon: '🎮', color: 'text-orange-400' },
    { label: 'Materi Blok', val: materi.blok.length, icon: '📝', color: 'text-sky-400' },
  ];

  const checks = [
    { label: 'Identitas media diisi', done: !!(meta.judulPertemuan && meta.kelas) },
    { label: 'Capaian Pembelajaran', done: !!cp.capaianFase },
    { label: 'Tujuan Pembelajaran (min 1)', done: tp.length > 0 },
    { label: 'ATP / Pertemuan (min 1)', done: atp.pertemuan.length > 0 },
    { label: 'Alur Pembelajaran (min 3)', done: alur.length >= 3 },
    { label: 'Kuis (min 5 soal)', done: kuis.length >= 5 },
    { label: 'Modul konten (min 1)', done: modules.length > 0 },
  ];

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
    a.download = `authoring-tool-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const presetLabels: Record<string, string> = {
    'hakikat-norma': 'Bab 3 P1: Hakikat Norma',
    'macam-norma': 'Bab 3 P2: Macam Norma',
  };

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      {/* ── MODE INDICATOR ──────────────────────────────────────── */}
      <div className={`rounded-xl p-4 flex items-center gap-3 border ${
        isPresetMode
          ? 'bg-amber-500/10 border-amber-500/30'
          : 'bg-emerald-500/10 border-emerald-500/30'
      }`}>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
          isPresetMode ? 'bg-amber-500/20' : 'bg-emerald-500/20'
        }`}>
          {isPresetMode ? '⚡' : '📁'}
        </div>
        <div className="flex-1">
          <div className={`text-sm font-bold ${isPresetMode ? 'text-amber-400' : 'text-emerald-400'}`}>
            {isPresetMode ? `Mode Preset: ${presetLabels[activePreset || ''] || activePreset}` : 'Mode Proyek'}
          </div>
          <div className="text-xs text-zinc-400 mt-0.5">
            {isPresetMode
              ? 'Anda sedang mengedit berdasarkan template preset. Simpan sebagai proyek untuk memisahkan dari preset.'
              : 'Anda sedang mengerjakan proyek mandiri. Semua perubahan tersimpan otomatis.'
            }
          </div>
        </div>
        {isPresetMode && (
          <button
            onClick={() => {
              saveToStorage();
              useAuthoringStore.setState({ activePreset: null });
            }}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Simpan sebagai Proyek
          </button>
        )}
      </div>

      {/* Panel Header */}
      <div>
        <h2 className="text-xl font-bold text-zinc-100">Dashboard</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Kelola proyek, pantau kelengkapan, dan export media pembelajaran interaktif.
        </p>
      </div>

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-900/80 border border-zinc-800 rounded-xl p-5 relative">
        <button
          onClick={(e) => { const el = e.currentTarget.closest('.relative'); if (el) (el as HTMLElement).style.display = 'none'; }}
          className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-300 text-sm w-6 h-6 flex items-center justify-center rounded"
        >
          ✕
        </button>
        <div className="flex items-start gap-4">
          <div className="text-3xl">👋</div>
          <div className="flex-1">
            <h3 className="font-bold text-zinc-100 text-base">Selamat Datang di Authoring Tool v4!</h3>
            <p className="text-xs text-zinc-400 mt-1">Buat media pembelajaran interaktif dengan mudah. Ikuti alur kerja berikut:</p>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 mt-3">
              {[
                { num: '1', text: 'Pilih Preset', icon: '⚡', color: 'amber' },
                { num: '2', text: 'Isi Data (CP/TP/Kuis)', icon: '📝', color: 'cyan' },
                { num: '3', text: 'Desain di Canva', icon: '🎨', color: 'purple' },
                { num: '4', text: 'Preview Siswa', icon: '📱', color: 'emerald' },
                { num: '5', text: 'Export HTML', icon: '📤', color: 'teal' },
              ].map((step, i) => (
                <div key={step.num} className="flex items-center gap-2 bg-zinc-800/50 rounded-lg px-3 py-2">
                  <div className={`w-6 h-6 rounded-full bg-${step.color}-500/20 text-${step.color}-400 flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                    {step.num}
                  </div>
                  <div>
                    <span className="text-[9px]">{step.icon}</span>
                    <span className="text-xs text-zinc-300 ml-1">{step.text}</span>
                  </div>
                  {i < 4 && <span className="text-zinc-600 text-[10px] ml-auto hidden sm:block">→</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tips Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-zinc-200 mb-3">💡 Tips Penting</h3>
        <div className="space-y-2">
          {[
            { icon: '📱', label: 'Preview Aplikasi', desc: 'Menampilkan tampilan siswa secara lengkap (cover, materi, kuis, skor). Navigasi bebas tanpa reset.' },
            { icon: '🎨', label: 'Preview Desain Canva', desc: 'Menampilkan desain slide visual saja. Berbeda dari Preview Aplikasi.' },
            { icon: '⚡', label: 'Preset vs Proyek', desc: 'Preset adalah template data contoh. Setelah mengedit, simpan sebagai proyek agar data terpisah.' },
            { icon: '🔄', label: 'Auto-Save', desc: 'Data otomatis tersimpan ke browser setiap 8 detik saat ada perubahan.' },
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
              <span className="flex-shrink-0">{tip.icon}</span>
              <span><strong>{tip.label}</strong> — {tip.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions — Proyek */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-zinc-200 mb-1">📁 Aksi Proyek</h3>
        <p className="text-xs text-zinc-500 mb-3">Buat proyek baru atau kelola proyek yang sudah ada.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => newProject()}
            className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 text-center hover:border-emerald-500/30 transition-colors cursor-pointer group"
          >
            <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">✨</div>
            <div className="text-sm font-semibold text-zinc-200">Proyek Baru</div>
            <div className="text-xs text-zinc-500">Mulai dari nol</div>
          </button>
          <button
            onClick={() => setActivePanel('projects')}
            className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 text-center hover:border-emerald-500/30 transition-colors cursor-pointer group"
          >
            <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">📂</div>
            <div className="text-sm font-semibold text-zinc-200">Buka Proyek</div>
            <div className="text-xs text-zinc-500">Load dari penyimpanan</div>
          </button>
          <button
            onClick={() => setActivePanel('import')}
            className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 text-center hover:border-emerald-500/30 transition-colors cursor-pointer group"
          >
            <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">📥</div>
            <div className="text-sm font-semibold text-zinc-200">Import JSON</div>
            <div className="text-xs text-zinc-500">Upload data proyek</div>
          </button>
        </div>
      </div>

      {/* Presets — CLEARLY SEPARATED */}
      <div className="bg-zinc-900 border border-amber-500/20 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-bold text-amber-400">⚡ Preset Template</h3>
          <span className="text-[0.6rem] bg-amber-500/15 text-amber-500 px-1.5 py-0.5 rounded font-bold">TEMPLATE DATA CONTOH</span>
        </div>
        <p className="text-xs text-zinc-400 mb-3">
          Preset mengisi <strong>semua tab</strong> dengan data contoh PPKn Kelas VII. 
          Setelah menggunakan preset, Anda bisa mengedit isinya dan menyimpan sebagai proyek mandiri.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { key: 'hakikat-norma', icon: '🧑\u200D🤝\u200D🧑', label: 'Bab 3 – P1: Hakikat Norma', sub: 'PPKn Kelas VII' },
            { key: 'macam-norma', icon: '📜', label: 'Bab 3 – P2: Macam Norma', sub: 'PPKn Kelas VII' },
            { key: 'perilaku-patuhan', icon: '⚖️', label: 'Bab 3 – P3: Perilaku Patuh', sub: 'PPKn Kelas VII' },
            { key: 'blank', icon: '📋', label: 'Proyek Kosong', sub: 'Isi semua manual' },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => {
                if (isPresetMode && !confirm('Preset akan menimpa data saat ini. Lanjutkan?')) return;
                if (!isPresetMode && (meta.judulPertemuan || tp.length > 0 || kuis.length > 0) && !confirm('Preset akan menimpa data proyek saat ini. Lanjutkan?')) return;
                applyFullPreset(p.key);
                // Auto-reset canvas after preset then navigate to canva
                // Use longer delay to ensure authoring store data is committed
                // before resetCanvas reads it via useAuthoringStore.getState()
                setTimeout(() => {
                  useCanvaStore.getState().resetCanvas();
                  useAuthoringStore.getState().setActivePanel('canva');
                }, 300);
              }}
              className={`rounded-lg p-3 text-center transition-colors cursor-pointer ${
                isPresetMode && activePreset === p.key
                  ? 'bg-amber-500/15 border-2 border-amber-500/50 ring-1 ring-amber-500/30'
                  : 'bg-zinc-800/50 border border-zinc-700/50 hover:border-amber-500/30'
              }`}
            >
              <div className="text-xl mb-1">{p.icon}</div>
              <div className="text-xs font-semibold text-zinc-200">{p.label}</div>
              <div className="text-[0.65rem] text-zinc-500">{p.sub}</div>
              {isPresetMode && activePreset === p.key && (
                <div className="text-[0.6rem] text-amber-400 font-bold mt-1">● AKTIF</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-zinc-200 mb-3">📊 Kelengkapan Proyek</h3>
        <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${completeness}%`,
              background: completeness === 100 ? '#34d399' : completeness >= 60 ? '#f9c82e' : '#ff6b6b',
            }}
          />
        </div>
        <div className="text-right text-xs text-zinc-500 mt-1.5">{completeness}% lengkap</div>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mt-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3 text-center">
              <div className="text-xl mb-0.5">{s.icon}</div>
              <div className={`text-lg font-bold ${s.color}`}>{s.val}</div>
              <div className="text-[0.65rem] text-zinc-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-zinc-200 mb-3">✅ Checklist Kelengkapan</h3>
        <div className="space-y-0">
          {checks.map((c, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 py-2 border-b border-zinc-800/60 last:border-b-0 text-xs"
            >
              <span className={c.done ? 'text-emerald-400' : 'text-zinc-600'}>{c.done ? '✅' : '○'}</span>
              <span className={c.done ? 'text-zinc-200' : 'text-zinc-500'}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Next Step Action — smart guidance based on current state */}
      <div className="bg-gradient-to-r from-emerald-900/40 to-cyan-900/40 border border-emerald-500/30 rounded-xl p-5">
        <h3 className="text-sm font-bold text-emerald-300 mb-2">🚀 Langkah Selanjutnya</h3>
        {completeness < 30 ? (
          <div>
            <p className="text-xs text-zinc-300 mb-3">
              Data proyek masih kurang. Mulai dengan memilih preset atau isi data dokumen (CP/TP/ATP) terlebih dahulu.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActivePanel('dokumen')}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm rounded-lg transition-colors"
              >
                📝 Isi Dokumen
              </button>
            </div>
          </div>
        ) : completeness < 80 ? (
          <div>
            <p className="text-xs text-zinc-300 mb-3">
              Data sudah cukup! Lengkapi kuis dan materi di panel Konten, lalu desain tampilan di Canva.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActivePanel('konten')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg transition-colors"
              >
                🧩 Tambah Konten
              </button>
              <button
                onClick={() => {
                  useCanvaStore.getState().resetCanvas();
                  setActivePanel('canva');
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-lg transition-colors"
              >
                🎨 Buka Canva
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs text-zinc-300 mb-3">
              Proyek sudah lengkap! Preview tampilan siswa, lalu export sebagai HTML interaktif.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  useCanvaStore.getState().resetCanvas();
                  setActivePanel('canva');
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-lg transition-colors"
              >
                🎨 Buka Canva
              </button>
              <button
                onClick={() => setActivePanel('preview')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg transition-colors"
              >
                📱 Preview Siswa
              </button>
              <button
                onClick={() => setActivePanel('import')}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm rounded-lg transition-colors"
              >
                📤 Export HTML
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Export — clearly separated */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-zinc-200 mb-3">📤 Export & Preview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Preview section — clearly labeled */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
            <div className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
              <span>📱</span> PREVIEW APLIKASI SISWA
            </div>
            <p className="text-[0.65rem] text-zinc-400 mb-3">
              Tampilkan tampilan lengkap siswa: cover, materi, skenario, kuis interaktif, dan skor.
            </p>
            <button
              onClick={() => setActivePanel('preview')}
              className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg transition-colors"
            >
              Buka Preview Aplikasi
            </button>
          </div>

          {/* Canva section — clearly labeled */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
            <div className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
              <span>🎨</span> CANVA DESIGN EDITOR
            </div>
            <p className="text-[0.65rem] text-zinc-400 mb-3">
              Desain slide visual dengan drag & drop. Hasilnya terpisah dari preview aplikasi siswa.
            </p>
            <button
              onClick={() => setActivePanel('canva')}
              className="w-full px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-lg transition-colors"
            >
              Buka Canva Editor
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <button
            onClick={exportJSON}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm rounded-lg transition-colors"
          >
            📋 Export JSON
          </button>
          <button
            onClick={saveToStorage}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm rounded-lg transition-colors"
          >
            💾 Simpan ke Browser
          </button>
          <button
            onClick={() => setActivePanel('autogen')}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm rounded-lg transition-colors"
          >
            ⚡ Auto-Generate
          </button>
        </div>
      </div>
    </div>
  );
}
