'use client';

import type { PageTemplateProps } from './types';
import { CoverTemplate } from './CoverTemplate';
import { DokumenTemplate } from './DokumenTemplate';
import { MateriTemplate } from './MateriTemplate';
import { KuisTemplate } from './KuisTemplate';
import { GameTemplate } from './GameTemplate';
import { HasilTemplate } from './HasilTemplate';
import { HeroTemplate } from './HeroTemplate';
import { SkenarioTemplate } from './SkenarioTemplate';
import { PetunjukTemplate } from './PetunjukTemplate';
import { DiskusiTemplate } from './DiskusiTemplate';
import { RefleksiTemplate } from './RefleksiTemplate';
import { PenutupTemplate } from './PenutupTemplate';

// ═══════════════════════════════════════════════════════════════
// PAGE TEMPLATE — Full-page template renderer with editable zones
// Each template type renders a complete page layout with
// content from the authoring store. Text zones are editable.
// ═══════════════════════════════════════════════════════════════

export function PageTemplate({ page, isSelected, onEditField, interactive }: PageTemplateProps) {
  const td = page.templateData;
  const palette = page.colorPalette;
  const variant = page.templateVariant || 'A'; // Phase 3: Default to variant A

  switch (page.templateType) {
    case 'cover':
      return <CoverTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} interactive={interactive} variant={variant} />;
    case 'dokumen':
      return <DokumenTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} interactive={interactive} variant={variant} />;
    case 'materi':
      return <MateriTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} interactive={interactive} variant={variant} />;
    case 'kuis':
      return <KuisTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} interactive={interactive} variant={variant} />;
    case 'game':
      return <GameTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} interactive={interactive} variant={variant} />;
    case 'hasil':
      return <HasilTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} interactive={interactive} variant={variant} />;
    case 'hero':
      return <HeroTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} interactive={interactive} variant={variant} />;
    case 'skenario':
      return <SkenarioTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} interactive={interactive} variant={variant} />;
    case 'petunjuk':
      return <PetunjukTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} interactive={interactive} variant={variant} />;
    case 'diskusi':
      return <DiskusiTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} interactive={interactive} variant={variant} />;
    case 'refleksi':
      return <RefleksiTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} interactive={interactive} variant={variant} />;
    case 'penutup':
      return <PenutupTemplate td={td} palette={palette} isSelected={isSelected} onEditField={onEditField} interactive={interactive} variant={variant} />;
    default:
      return null;
  }
}
