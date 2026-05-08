'use client';

import React from 'react';
import type { LayoutVariant, M, PresetModuleCardProps } from './types';
import { T } from './tokens';
import { str } from './helpers';
import { LAYOUT_VARIANTS } from './layout-variants';
import { getModuleMeta } from './module-meta';
import { PreviewInfografis } from './PreviewInfografis';
import { PreviewStatistik } from './PreviewStatistik';
import { PreviewTimeline } from './PreviewTimeline';
import { PreviewHero } from './PreviewHero';
import { PreviewKutipan } from './PreviewKutipan';
import { PreviewLangkah } from './PreviewLangkah';
import { PreviewAccordion } from './PreviewAccordion';
import { PreviewVideo } from './PreviewVideo';
import { PreviewMateri } from './PreviewMateri';
import { PreviewPetunjuk } from './PreviewPetunjuk';
import { PreviewDiskusi } from './PreviewDiskusi';
import { PreviewReview } from './PreviewReview';
import { PreviewRefleksi } from './PreviewRefleksi';
import { PreviewSkenario } from './PreviewSkenario';
import { PreviewDebat } from './PreviewDebat';
import { PreviewStudiKasus } from './PreviewStudiKasus';
import {
  PreviewFlashcard,
  PreviewMatching,
  PreviewTrueFalse,
  PreviewMemory,
  PreviewRoda,
  PreviewSorting,
  PreviewSpinwheel,
  PreviewTeambuzzer,
  PreviewWordsearch,
  PreviewCrossword,
  PreviewFillblank,
  PreviewDragdrop,
} from './PreviewGames';
import {
  PreviewEmbed,
  PreviewPolling,
  PreviewComparison,
  PreviewCardShowcase,
  PreviewHotspotImage,
  PreviewTabIcons,
  PreviewIconExplore,
  PreviewFallback,
} from './PreviewOther';

// ═══════════════════════════════════════════════════════════════════
// PREVIEW ROUTER
// ═══════════════════════════════════════════════════════════════════
function ModulePreview({ mod, variant, compact }: { mod: M; variant: LayoutVariant; compact: boolean }) {
  const t = str(mod.type);
  const meta = getModuleMeta(t);

  switch (t) {
    case 'infografis':
      return <PreviewInfografis mod={mod} variant={variant} compact={compact} />;
    case 'statistik':
      return <PreviewStatistik mod={mod} variant={variant} compact={compact} />;
    case 'timeline':
      return <PreviewTimeline mod={mod} variant={variant} compact={compact} />;
    case 'hero':
      return <PreviewHero mod={mod} compact={compact} />;
    case 'kutipan':
      return <PreviewKutipan mod={mod} variant={variant} compact={compact} />;
    case 'langkah':
      return <PreviewLangkah mod={mod} variant={variant} compact={compact} />;
    case 'accordion':
      return <PreviewAccordion mod={mod} variant={variant} compact={compact} />;
    case 'video':
      return <PreviewVideo mod={mod} compact={compact} />;
    case 'petunjuk':
      return <PreviewPetunjuk mod={mod} variant={variant} compact={compact} />;
    case 'diskusi':
      return <PreviewDiskusi mod={mod} variant={variant} compact={compact} />;
    case 'review':
      return <PreviewReview mod={mod} variant={variant} compact={compact} />;
    case 'refleksi':
      return <PreviewRefleksi mod={mod} variant={variant} compact={compact} />;
    case 'skenario':
    case 'senario':
      return <PreviewSkenario mod={mod} variant={variant} compact={compact} />;
    case 'debat':
      return <PreviewDebat mod={mod} variant={variant} compact={compact} />;
    case 'flashcard':
      return <PreviewFlashcard mod={mod} variant={variant} compact={compact} />;
    case 'tab-icons':
      return <PreviewTabIcons mod={mod} variant={variant} compact={compact} />;
    case 'icon-explore':
      return <PreviewIconExplore mod={mod} variant={variant} compact={compact} />;
    case 'comparison':
      return <PreviewComparison mod={mod} variant={variant} compact={compact} />;
    case 'card-showcase':
      return <PreviewCardShowcase mod={mod} variant={variant} compact={compact} />;
    case 'hotspot-image':
      return <PreviewHotspotImage mod={mod} variant={variant} compact={compact} />;
    case 'polling':
      return <PreviewPolling mod={mod} variant={variant} compact={compact} />;
    case 'embed':
      return <PreviewEmbed mod={mod} compact={compact} />;
    case 'studi-kasus':
      return <PreviewStudiKasus mod={mod} variant={variant} compact={compact} />;
    case 'materi':
      return <PreviewMateri mod={mod} compact={compact} />;
    case 'matching':
      return <PreviewMatching mod={mod} variant={variant} compact={compact} />;
    case 'truefalse':
      return <PreviewTrueFalse mod={mod} variant={variant} compact={compact} />;
    case 'memory':
      return <PreviewMemory mod={mod} variant={variant} compact={compact} />;
    case 'roda':
      return <PreviewRoda mod={mod} compact={compact} />;
    case 'sorting':
      return <PreviewSorting mod={mod} variant={variant} compact={compact} />;
    case 'spinwheel':
      return <PreviewSpinwheel mod={mod} compact={compact} />;
    case 'teambuzzer':
      return <PreviewTeambuzzer mod={mod} compact={compact} />;
    case 'wordsearch':
      return <PreviewWordsearch mod={mod} compact={compact} />;
    case 'crossword':
      return <PreviewCrossword mod={mod} compact={compact} />;
    case 'fillblank':
      return <PreviewFillblank mod={mod} compact={compact} />;
    case 'dragdrop':
      return <PreviewDragdrop mod={mod} compact={compact} />;
    default:
      return <PreviewFallback mod={mod} meta={meta} compact={compact} />;
  }
}

// ═══════════════════════════════════════════════════════════════════
// CARD SHELL (shared across all modes)
// ═══════════════════════════════════════════════════════════════════
function CardShell({
  children,
  moduleColor,
  rounded,
  className = '',
  style,
}: {
  children: React.ReactNode;
  moduleColor: string;
  rounded: '2xl' | 'xl';
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      // Phase 9 fix: use explicit conditional instead of `rounded-${rounded}` interpolation
      // Tailwind v4 cannot detect dynamically interpolated class names in its content scan
      className={`relative overflow-hidden border border-white/[0.09] ${rounded === '2xl' ? 'rounded-2xl' : 'rounded-xl'} ${className}`}
      style={{ background: T.card, ...style }}
    >
      {/* Top accent bar */}
      <div
        className="h-[3px] w-full"
        style={{ background: `linear-gradient(90deg, ${moduleColor} 0%, transparent 100%)` }}
      />
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VARIANT BADGE
// ═══════════════════════════════════════════════════════════════════
function VariantBadge({ variant }: { variant: LayoutVariant }) {
  const v = LAYOUT_VARIANTS.find((lv) => lv.id === variant);
  if (!v) return null;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-md"
      style={{ background: T.y + '18', color: T.y, border: `1px solid ${T.y}30` }}
    >
      {v.icon} {v.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════
// GAME BADGE
// ═══════════════════════════════════════════════════════════════════
function GameBadge() {
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase"
      style={{ background: T.g + '18', color: T.g, border: `1px solid ${T.g}30` }}
    >
      🎮 Game
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EDIT / EXPORT MODE (full card)
// ═══════════════════════════════════════════════════════════════════
function FullCard({ mode, mod, variant, onEdit }: { mode: 'edit' | 'export'; mod: M; variant: LayoutVariant; onEdit?: () => void }) {
  const meta = getModuleMeta(str(mod.type));
  const title = str(mod.title) || meta.label;
  const isEdit = mode === 'edit';
  const [hovered, setHovered] = React.useState(false);

  return (
    <CardShell moduleColor={meta.color} rounded="2xl" className="group">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {/* Icon box */}
          <div
            className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg"
            style={{ background: meta.color + '20', border: `1px solid ${meta.color}30` }}
          >
            {meta.icon}
          </div>
          {/* Title & type */}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm truncate" style={{ color: T.text }}>{title}</div>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: meta.color + '15', color: meta.color }}>
                {meta.label}
              </span>
              <VariantBadge variant={variant} />
              {meta.isGame && <GameBadge />}
            </div>
          </div>
        </div>

        {/* Body: Preview content */}
        <div className="min-h-[60px]">
          <ModulePreview mod={mod} variant={variant} compact={false} />
        </div>
      </div>

      {/* Edit hover overlay */}
      {isEdit && onEdit && (
        <div
          className="absolute inset-0 flex items-center justify-center transition-opacity duration-200"
          style={{
            background: hovered ? 'rgba(14, 28, 47, 0.85)' : 'transparent',
            opacity: hovered ? 1 : 0,
            backdropFilter: hovered ? 'blur(4px)' : 'none',
            pointerEvents: hovered ? 'auto' : 'none',
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <button
            onClick={onEdit}
            className="px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-1.5 transition-transform duration-150"
            style={{
              background: T.y,
              color: '#1a1a2e',
              transform: hovered ? 'scale(1)' : 'scale(0.9)',
            }}
          >
            ✏️ Edit Modul
          </button>
        </div>
      )}
    </CardShell>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CANVAS MODE (compact)
// ═══════════════════════════════════════════════════════════════════
function CompactCard({ mod, variant }: { mod: M; variant: LayoutVariant }) {
  const meta = getModuleMeta(str(mod.type));
  const title = str(mod.title) || meta.label;

  return (
    <CardShell moduleColor={meta.color} rounded="xl" className="group">
      <div className="p-2">
        {/* Header: tiny icon + title + badges */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <div
            className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs"
            style={{ background: meta.color + '20', border: `1px solid ${meta.color}30` }}
          >
            {meta.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold truncate" style={{ color: T.text }}>{title}</div>
          </div>
          <VariantBadge variant={variant} />
          {meta.isGame && <GameBadge />}
        </div>

        {/* Mini preview */}
        <div className="min-h-[24px]">
          <ModulePreview mod={mod} variant={variant} compact={true} />
        </div>
      </div>
    </CardShell>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
function PresetModuleCard({ mode, module, onEdit, compact, layoutVariant }: PresetModuleCardProps) {
  const variant = layoutVariant || 'A';

  if (mode === 'canvas' || compact) {
    return <CompactCard mod={module} variant={variant} />;
  }

  return <FullCard mode={mode} mod={module} variant={variant} onEdit={onEdit} />;
}

export default PresetModuleCard;
