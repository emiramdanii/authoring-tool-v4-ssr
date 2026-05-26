'use client';

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE PREVIEW THUMBNAIL — Miniature visual preview for templates
// ═══════════════════════════════════════════════════════════════════
// Renders a compact wireframe-style thumbnail showing the structure
// of a template's scenes using colored rectangles and scene labels.
// Uses the template's subject color for visual identity.
//
// v2.1: Adapted to new CourseTemplate API (no previewBlocks/coverGradient).
//   - Uses template.scenes instead of template.previewBlocks
//   - Uses subject color from SUBJECTS instead of coverGradient

import React from 'react';
import type { CourseTemplate, SubjectConfig } from '@/core/template/CourseTemplateRegistry';
import { SUBJECTS } from '@/core/template/CourseTemplateRegistry';
import { resolveTokens } from '@/core/themes/tokens';

// ── Block type → visual category ───────────────────────────────
type BlockCategory = 'cover' | 'content' | 'game' | 'navigation' | 'reflection';

function categorizeScene(templateType: string): BlockCategory {
  if (templateType === 'cover' || templateType === 'penutup') return 'cover';
  if (templateType === 'kuis' || templateType === 'skenario' || templateType.endsWith('-game')) return 'game';
  if (templateType === 'refleksi' || templateType === 'diskusi') return 'reflection';
  if (templateType === 'petunjuk' || templateType === 'alur' || templateType === 'tp' || templateType === 'tujuan-display' || templateType === 'dokumen') return 'navigation';
  return 'content';
}

// ── Category → shape style ─────────────────────────────────────
const CATEGORY_STYLES: Record<BlockCategory, { height: string; opacity: number; radius: string }> = {
  cover: { height: '35%', opacity: 0.9, radius: '3px 3px 1px 1px' },
  content: { height: '16%', opacity: 0.5, radius: '2px' },
  game: { height: '20%', opacity: 0.65, radius: '2px' },
  navigation: { height: '10%', opacity: 0.35, radius: '2px' },
  reflection: { height: '14%', opacity: 0.45, radius: '1px 1px 3px 3px' },
};

// ── Resolve subject color to gradient CSS ──────────────────────
function getSubjectGradientCSS(subjectId: string): string {
  const subj = SUBJECTS.find((s: SubjectConfig) => s.id === subjectId);
  if (subj?.color) {
    return `linear-gradient(135deg, ${subj.color}, ${subj.color}cc)`;
  }
  return 'linear-gradient(135deg, #6366f1, #8b5cf6)';
}

// ── Resolve single subject color ───────────────────────────────
function getSubjectColor(subjectId: string): string {
  const subj = SUBJECTS.find((s: SubjectConfig) => s.id === subjectId);
  return subj?.color ?? '#6366f1';
}

// ── Helper: get subject label ──────────────────────────────────
function getSubjectLabel(subjectId: string): string {
  const subj = SUBJECTS.find((s: SubjectConfig) => s.id === subjectId);
  return subj?.label ?? subjectId;
}

// ── Scene wireframe block ──────────────────────────────────────
function SceneWireframe({
  scene,
  gradient,
  accentColor,
}: {
  scene: { templateType: string; label: string };
  gradient: string;
  accentColor: string;
}) {
  const category = categorizeScene(scene.templateType);
  const style = CATEGORY_STYLES[category];

  return (
    <div
      className="relative flex items-center gap-0.5 px-1 overflow-hidden"
      style={{
        height: style.height,
        opacity: style.opacity,
        borderRadius: style.radius,
        background: category === 'cover'
          ? gradient
          : category === 'game'
            ? `${accentColor}33`
            : 'rgba(255,255,255,0.12)',
      }}
    >
      {/* Text placeholder lines */}
      <div className="flex-1 flex flex-col gap-px py-0.5">
        <div
          className="h-px rounded-full"
          style={{
            width: `${50 + Math.random() * 30}%`,
            background: 'rgba(255,255,255,0.3)',
          }}
        />
        {category !== 'navigation' && (
          <div
            className="h-px rounded-full"
            style={{
              width: `${30 + Math.random() * 25}%`,
              background: 'rgba(255,255,255,0.15)',
            }}
          />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

interface TemplatePreviewThumbnailProps {
  template: CourseTemplate;
  /** Width in pixels (default: 200) */
  width?: number;
  /** Height in pixels (default: 112 — ~16:9) */
  height?: number;
  /** Show template name overlay (default: true) */
  showName?: boolean;
  /** Show screen dots (default: true) */
  showDots?: boolean;
  /** Currently active screen index (for preview modal) */
  activeScreen?: number;
}

export default function TemplatePreviewThumbnail({
  template,
  width = 200,
  height = 112,
  showName = true,
  showDots = true,
  activeScreen = 0,
}: TemplatePreviewThumbnailProps) {
  const gradient = getSubjectGradientCSS(template.subject);
  const accentColor = getSubjectColor(template.subject);
  const scenes = template.scenes ?? [];
  const currentScene = scenes[activeScreen] ?? scenes[0];

  if (!currentScene) return null;

  return (
    <div
      className="relative rounded-lg overflow-hidden border border-white/10"
      style={{
        width,
        height,
        aspectRatio: `${width}/${height}`,
        background: 'rgba(0,0,0,0.4)',
      }}
    >
      {/* Scene wireframe */}
      <div className="absolute inset-0 p-1.5 flex items-stretch">
        <SceneWireframe
          scene={currentScene}
          gradient={gradient}
          accentColor={accentColor}
        />
      </div>

      {/* Template name overlay */}
      {showName && (
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
          <div className="text-white text-[8px] font-bold truncate leading-tight">
            {template.name}
          </div>
        </div>
      )}

      {/* Screen dots */}
      {showDots && scenes.length > 1 && (
        <div className="absolute top-1.5 right-1.5 flex gap-0.5">
          {scenes.map((_: { templateType: string; label: string }, i: number) => (
            <div
              key={`dot-${i}`}
              className="rounded-full transition-all"
              style={{
                width: i === activeScreen ? 6 : 3,
                height: 3,
                background: i === activeScreen ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
              }}
            />
          ))}
        </div>
      )}

      {/* Subject badge */}
      <div
        className="absolute top-1.5 left-1.5 px-1 py-px rounded text-[6px] font-bold text-white/80"
        style={{ background: `${accentColor}55` }}
      >
        {getSubjectLabel(template.subject)}
      </div>
    </div>
  );
}
