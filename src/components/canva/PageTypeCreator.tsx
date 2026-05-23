'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Zap, ChevronDown, ChevronUp, X, Sparkles } from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { Button } from '@/components/ui/button';
import { ALL_PAGE_TYPES, PAGE_TYPE_CATEGORIES, type PageTypeDefinition, type PageTypeOption } from '@/store/page-types';
import { createFocusTrap } from '@/lib/a11y';

// ── Inline config panel for a selected page type ──────────────
function ConfigPanel({
  pageType,
  onGenerate,
  onCancel,
}: {
  pageType: PageTypeDefinition;
  onGenerate: (config: Record<string, number | string | boolean>) => void;
  onCancel: () => void;
}) {
  const [config, setConfig] = useState<Record<string, number | string | boolean>>(() => {
    const initial: Record<string, number | string | boolean> = {};
    pageType.options.forEach((opt) => {
      initial[opt.id] = opt.default;
    });
    return initial;
  });
  const [generating, setGenerating] = useState(false);

  const updateConfig = (id: string, value: number | string | boolean) => {
    setConfig((prev) => ({ ...prev, [id]: value }));
  };

  const handleGenerate = useCallback(() => {
    setGenerating(true);
    // Small delay for visual feedback
    setTimeout(() => {
      onGenerate(config);
      setGenerating(false);
    }, 200);
  }, [config, onGenerate]);

  return (
    <div
      className="mt-2 p-3 rounded-xl bg-app-elevated/60 border border-app-accent/20 space-y-3 animate-in slide-in-from-top-2 duration-200"
      role="dialog"
      aria-label={`Konfigurasi ${pageType.name}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">{pageType.icon}</span>
          <div>
            <div className="text-[11px] font-bold text-app-accent">{pageType.name}</div>
            <div className="text-[9px] text-app-secondary">{pageType.description}</div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="h-6 w-6 rounded-md text-app-muted hover:text-app-secondary"
          aria-label="Tutup konfigurasi"
        >
          <X size={12} />
        </Button>
      </div>

      {/* Options */}
      {pageType.options.length > 0 && (
        <div className="space-y-2.5">
          {pageType.options.map((opt) => (
            <OptionControl key={opt.id} opt={opt} value={config[opt.id]} onChange={(v) => updateConfig(opt.id, v)} />
          ))}
        </div>
      )}

      {/* Jumlah Pertemuan — shown when perPertemuan is enabled */}
      {config.perPertemuan && (
        <JumlahPertemuanControl config={config} updateConfig={updateConfig} />
      )}

      {/* Generate button */}
      <Button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full py-2.5 justify-center text-[11px] gap-2 bg-gradient-to-br from-app-accent to-app-accent/80 text-app-inverse shadow-sm hover:shadow-md hover:-translate-y-px disabled:opacity-50"
      >
        {generating ? (
          <>
            <Sparkles size={14} className="animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Zap size={14} />
            Generate {pageType.name}
          </>
        )}
      </Button>
    </div>
  );
}

// ── Jumlah Pertemuan control — shown when perPertemuan toggle is ON ──
function JumlahPertemuanControl({
  config,
  updateConfig,
}: {
  config: Record<string, number | string | boolean>;
  updateConfig: (id: string, v: number | string | boolean) => void;
}) {
  const atpPertemuan = useAuthoringStore((s) => s.atp.jumlahPertemuan);
  const [jumlah, setJumlah] = useState(atpPertemuan || 3);

  const handleChange = (val: number) => {
    setJumlah(val);
    updateConfig('jumlahPertemuan', val);
  };

  // Sync with ATP config when it changes
  useEffect(() => {
    if (atpPertemuan && atpPertemuan !== jumlah) {
      setJumlah(atpPertemuan);
    }
  }, [atpPertemuan]);

  return (
    <div
      className="p-2.5 rounded-lg bg-app-accent/8 border border-app-accent/15 space-y-2 animate-in slide-in-from-top-1 duration-200"
      role="group"
      aria-label="Pengaturan Pertemuan"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-app-accent">Jumlah Pertemuan</span>
        <span className="text-[12px] font-black text-app-accent">{jumlah}</span>
      </div>
      <input
        type="range"
        min={1}
        max={8}
        step={1}
        value={jumlah}
        onChange={(e) => handleChange(Number(e.target.value))}
        aria-label="Jumlah Pertemuan"
        className="w-full h-1.5 bg-app-elevated rounded-lg appearance-none cursor-pointer accent-app-accent"
      />
      <div className="flex justify-between text-[8px] text-app-muted">
        <span>1</span>
        <span>8</span>
      </div>
      {atpPertemuan > 0 && (
        <div className="text-[8px] text-app-muted italic">
          Dari ATP: {atpPertemuan} pertemuan
        </div>
      )}
    </div>
  );
}

// ── Single option control ─────────────────────────────────────
function OptionControl({
  opt,
  value,
  onChange,
}: {
  opt: PageTypeOption;
  value: number | string | boolean;
  onChange: (v: number | string | boolean) => void;
}) {
  if (opt.type === 'toggle') {
    return (
      <label className="flex items-center justify-between gap-3">
        <span className="text-[10px] text-app-secondary">{opt.label}</span>
        <button
          onClick={() => onChange(!value)}
          role="switch"
          aria-checked={Boolean(value)}
          aria-label={opt.label}
          className={`relative w-9 h-5 rounded-full transition-colors ${
            value ? 'bg-app-accent' : 'bg-app-elevated'
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white dark:bg-gray-900 shadow transition-transform ${
              value ? 'left-[18px]' : 'left-0.5'
            }`}
          />
        </button>
      </label>
    );
  }

  if (opt.type === 'number') {
    return (
      <div className="space-y-1">
        <label className="flex items-center justify-between">
          <span className="text-[10px] text-app-secondary">{opt.label}</span>
          <span className="text-[10px] font-bold text-app-accent">{value as number}</span>
        </label>
        <input
          type="range"
          min={opt.min ?? 0}
          max={opt.max ?? 100}
          step={opt.step ?? 1}
          value={value as number}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={opt.label}
          className="w-full h-1.5 bg-app-elevated rounded-lg appearance-none cursor-pointer accent-app-accent"
        />
      </div>
    );
  }

  if (opt.type === 'select' && opt.options) {
    return (
      <div className="space-y-1">
        <label className="text-[10px] text-app-secondary">{opt.label}</label>
        <select
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          aria-label={opt.label}
          className="w-full h-7 px-2 text-[10px] text-app-primary bg-app-elevated/80 border border-app-border/40 rounded-lg focus:border-app-accent/50 focus:outline-none"
        >
          {opt.options.map((o) => (
            <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
          ))}
        </select>
      </div>
    );
  }

  return null;
}

// ── Main PageTypeCreator Component ────────────────────────────
export default function PageTypeCreator() {
  const [expanded, setExpanded] = useState(false);
  const [selectedType, setSelectedType] = useState<PageTypeDefinition | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const generateFromPageType = useCanvaStore((s) => s.generateFromPageType);

  // Focus trap for the config panel dialog
  const panelRef = useRef<HTMLDivElement>(null);

  const handleGenerate = useCallback(
    (config: Record<string, number | string | boolean>) => {
      if (!selectedType) return;
      generateFromPageType(selectedType, config);
      // Collapse after generation
      setExpanded(false);
      setSelectedType(null);
      setActiveCategory(null);
    },
    [selectedType, generateFromPageType],
  );

  const handleToggle = () => {
    if (expanded && !selectedType) {
      setExpanded(false);
    } else if (!expanded) {
      setExpanded(true);
    }
  };

  const handleSelectType = (pt: PageTypeDefinition) => {
    if (selectedType?.id === pt.id) {
      // Deselect
      setSelectedType(null);
    } else {
      setSelectedType(pt);
    }
  };

  // ── Focus trap when config panel is open ────────────────────
  useEffect(() => {
    if (!selectedType || !panelRef.current) return;
    const trap = createFocusTrap(panelRef.current);
    trap.activate();
    return () => trap.deactivate();
  }, [selectedType]);

  // Filtered page types
  const filteredTypes = activeCategory
    ? ALL_PAGE_TYPES.filter((pt) => pt.category === activeCategory)
    : ALL_PAGE_TYPES;

  // Collapsed: just the button
  if (!expanded) {
    return (
      <Button
        onClick={handleToggle}
        aria-expanded="false"
        aria-label="Auto-Generate Halaman"
        className="w-full py-2.5 justify-center text-[11px] gap-2 bg-gradient-to-br from-app-accent to-app-accent/80 text-app-inverse shadow-sm hover:shadow-md hover:-translate-y-px"
      >
        <Zap size={14} />
        Auto-Generate Halaman
      </Button>
    );
  }

  // Expanded: full panel
  return (
    <div className="space-y-2" ref={panelRef}>
      {/* Header button — click to collapse */}
      <Button
        onClick={handleToggle}
        aria-expanded="true"
        aria-label="Tutup Auto-Generate Halaman"
        className="w-full py-2.5 justify-center text-[11px] gap-2 bg-gradient-to-br from-app-accent to-app-accent/80 text-app-inverse shadow-sm hover:shadow-md hover:-translate-y-px"
      >
        <Zap size={14} />
        Auto-Generate Halaman
        <ChevronUp size={12} className="ml-auto" />
      </Button>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-1" role="group" aria-label="Filter kategori halaman">
        <button
          onClick={() => setActiveCategory(null)}
          aria-pressed={!activeCategory}
          aria-label="Tampilkan semua kategori"
          className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-[background-color,border-color] ${
            !activeCategory
              ? 'bg-app-accent/15 border border-app-accent/30 text-app-accent'
              : 'bg-app-elevated/40 border border-app-border/20 text-app-secondary hover:border-app-border'
          }`}
        >
          Semua
        </button>
        {PAGE_TYPE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
            aria-pressed={activeCategory === cat.id}
            aria-label={`Filter kategori ${cat.label}`}
            className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-[background-color,border-color] ${
              activeCategory === cat.id
                ? 'bg-app-accent/15 border border-app-accent/30 text-app-accent'
                : 'bg-app-elevated/40 border border-app-border/20 text-app-secondary hover:border-app-border'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Page type cards */}
      <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar" role="listbox" aria-label="Daftar tipe halaman">
        {filteredTypes.map((pt) => {
          const isSelected = selectedType?.id === pt.id;
          return (
            <div key={pt.id}>
              <button
                onClick={() => handleSelectType(pt)}
                aria-expanded={isSelected}
                aria-label={`${pt.name} — ${pt.description}`}
                className={`card-hover w-full flex items-center gap-2 p-2 rounded-xl transition-[transform,box-shadow,background-color] active:scale-95 ${
                  isSelected
                    ? 'bg-app-accent/10 border border-app-accent/30 ring-1 ring-app-accent/20'
                    : 'bg-app-elevated/40 border border-app-border/20 hover:border-app-border'
                }`}
              >
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: `${pt.color}20` }}
                >
                  {pt.icon}
                </span>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-[11px] font-bold text-app-primary truncate">{pt.name}</div>
                  <div className="text-[9px] text-app-muted truncate">{pt.description}</div>
                </div>
                <ChevronDown
                  size={12}
                  className={`text-app-muted transition-transform flex-shrink-0 ${isSelected ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Inline config — expands below the selected card */}
              {isSelected && (
                <ConfigPanel
                  pageType={pt}
                  onGenerate={handleGenerate}
                  onCancel={() => setSelectedType(null)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
