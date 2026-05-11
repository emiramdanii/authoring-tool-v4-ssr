'use client';

import { useState, useCallback } from 'react';
import { Zap, ChevronDown, ChevronUp, X, Sparkles } from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
import { Button } from '@/components/ui/button';
import { ALL_PAGE_TYPES, PAGE_TYPE_CATEGORIES, type PageTypeDefinition, type PageTypeOption } from '@/store/page-types';

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
    <div className="mt-2 p-3 rounded-xl bg-slate-800/60 border border-amber-500/20 space-y-3 animate-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{pageType.icon}</span>
          <div>
            <div className="text-[11px] font-bold text-amber-300">{pageType.name}</div>
            <div className="text-[9px] text-slate-400">{pageType.description}</div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="h-6 w-6 rounded-md text-slate-500 hover:text-slate-300"
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

      {/* Generate button */}
      <Button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full py-2.5 justify-center text-[11px] gap-2 bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm hover:shadow-md hover:-translate-y-px disabled:opacity-50"
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
        <span className="text-[10px] text-slate-300">{opt.label}</span>
        <button
          onClick={() => onChange(!value)}
          className={`relative w-9 h-5 rounded-full transition-colors ${
            value ? 'bg-amber-500' : 'bg-slate-600'
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
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
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-300">{opt.label}</span>
          <span className="text-[10px] font-bold text-amber-400">{value as number}</span>
        </div>
        <input
          type="range"
          min={opt.min ?? 0}
          max={opt.max ?? 100}
          step={opt.step ?? 1}
          value={value as number}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
      </div>
    );
  }

  if (opt.type === 'select' && opt.options) {
    return (
      <div className="space-y-1">
        <span className="text-[10px] text-slate-300">{opt.label}</span>
        <select
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-7 px-2 text-[10px] text-slate-200 bg-slate-700/80 border border-slate-600/40 rounded-lg focus:border-amber-500/50 focus:outline-none"
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

  // Filtered page types
  const filteredTypes = activeCategory
    ? ALL_PAGE_TYPES.filter((pt) => pt.category === activeCategory)
    : ALL_PAGE_TYPES;

  // Collapsed: just the button
  if (!expanded) {
    return (
      <Button
        onClick={handleToggle}
        className="w-full py-2.5 justify-center text-[11px] gap-2 bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm hover:shadow-md hover:-translate-y-px"
      >
        <Zap size={14} />
        Auto-Generate Halaman
      </Button>
    );
  }

  // Expanded: full panel
  return (
    <div className="space-y-2">
      {/* Header button — click to collapse */}
      <Button
        onClick={handleToggle}
        className="w-full py-2.5 justify-center text-[11px] gap-2 bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm hover:shadow-md hover:-translate-y-px"
      >
        <Zap size={14} />
        Auto-Generate Halaman
        <ChevronUp size={12} className="ml-auto" />
      </Button>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-all ${
            !activeCategory
              ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
              : 'bg-slate-800/40 border border-slate-700/20 text-slate-400 hover:border-slate-600'
          }`}
        >
          Semua
        </button>
        {PAGE_TYPE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
            className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-all ${
              activeCategory === cat.id
                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                : 'bg-slate-800/40 border border-slate-700/20 text-slate-400 hover:border-slate-600'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Page type cards */}
      <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar">
        {filteredTypes.map((pt) => {
          const isSelected = selectedType?.id === pt.id;
          return (
            <div key={pt.id}>
              <button
                onClick={() => handleSelectType(pt)}
                className={`card-hover w-full flex items-center gap-2 p-2 rounded-xl transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-amber-500/10 border border-amber-500/30 ring-1 ring-amber-500/20'
                    : 'bg-slate-800/40 border border-slate-700/20 hover:border-slate-600'
                }`}
              >
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: `${pt.color}20` }}
                >
                  {pt.icon}
                </span>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-[11px] font-bold text-slate-200 truncate">{pt.name}</div>
                  <div className="text-[9px] text-slate-500 truncate">{pt.description}</div>
                </div>
                <ChevronDown
                  size={12}
                  className={`text-slate-500 transition-transform flex-shrink-0 ${isSelected ? 'rotate-180' : ''}`}
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
