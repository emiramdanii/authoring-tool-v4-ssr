'use client';

import { useCanvaStore } from '@/store/canva-store';
// All icons migrated to Material Symbols Outlined
import dynamic from 'next/dynamic';

const TemplateGalleryPanel = dynamic(() => import('./TemplateGalleryPanel'), {
  ssr: false,
  loading: () => <div className="h-32 animate-pulse bg-app-elevated/20 rounded-lg" />,
});

// ═══════════════════════════════════════════════════════════════
// TEMPLATE SECTION — Collapsible template browser
// ═══════════════════════════════════════════════════════════════

interface TemplateSectionProps {
  galleryOpen: boolean;
  onToggle: () => void;
}

export function TemplateSection({ galleryOpen, onToggle }: TemplateSectionProps) {
  const teacherMode = useCanvaStore(s => s.teacherMode);
  const sectionLabel = teacherMode ? 'Pilih Template' : 'Template Gallery';

  return (
    <div className="border border-app-border/30 rounded-xl overflow-hidden" data-testid="template-gallery">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold text-app-accent uppercase tracking-wider bg-app-accent/5 hover:bg-app-accent/10 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>auto_awesome</span>
          {sectionLabel}
        </span>
        {galleryOpen ? <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>expand_more</span> : <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>chevron_right</span>}
      </button>
      {galleryOpen && (
        <div className="p-2 border-t border-app-border/20">
          <TemplateGalleryPanel />
        </div>
      )}
    </div>
  );
}
