'use client';

// ═══════════════════════════════════════════════════════════════
// BLOCK PROPERTIES PANEL — Stitch v4 Guided Form
// ═══════════════════════════════════════════════════════════════
// Routes between two editors based on block type:
//
//   1. GUIDED FORM (teacher-friendly) — when hasGuidedEditor(blockType)
//      - Uses GuidedEditorSchema (content-focused fields)
//      - Writes via applyGuidedSchemaPatch() (single write path)
//      - Shows: title, content, array items, color tokens
//      - Hides: layout, position, dev capabilities
//
//   2. SCHEMA-DRIVEN EDITOR (developer) — fallback
//      - Uses PropertySchema (all properties)
//      - Writes via updateSchemaBlock() (Zustand store)
//      - Shows: everything including layout, variant, dev info
//
// Teacher mode ALWAYS prefers GuidedForm when available.
// ═══════════════════════════════════════════════════════════════

import { useCanvaStore } from '@/store/canva-store';
import { getBlockDefinition, getBlockCapabilities, getBlockPropertySchema } from '@/core/registry/SceneRegistry';
import { hasGuidedEditor, getGuidedEditorSchema } from '@/core/schema/guided-patch';
import { SlidersHorizontal, X, Trash2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSelectedBlock } from './block-properties/use-selected-block';
import { GuidedFormEditor } from './block-properties/GuidedFormEditor';
import { SchemaDrivenEditor } from './block-properties/SchemaDrivenEditor';
import { CapabilityBadge } from './block-properties/CapabilityBadge';
import { BlockVariantSwitcher } from './block-properties/BlockVariantSwitcher';
import { teacherTerm } from '@/core/i18n/teacher-terminology';

export default function BlockPropertiesPanel() {
  const selectedBlockId = useCanvaStore(s => s.selectedBlockId);
  const selectedBlockType = useCanvaStore(s => s.selectedBlockType);
  const selectBlock = useCanvaStore(s => s.selectBlock);
  const updateSchemaBlock = useCanvaStore(s => s.updateSchemaBlock);
  const deleteBlock = useCanvaStore(s => s.deleteBlock);
  const editingBlockId = useCanvaStore(s => s.editingBlockId);
  const stopEditing = useCanvaStore(s => s.stopEditing);
  const teacherMode = useCanvaStore(s => s.teacherMode);
  const { block } = useSelectedBlock();

  // Need pageId for applyGuidedSchemaPatch
  const currentPageIndex = useCanvaStore(s => s.currentPageIndex);
  const pageId = useCanvaStore(s => s.pages[currentPageIndex]?.id);

  if (!selectedBlockId || !selectedBlockType) return null;

  const definition = getBlockDefinition(selectedBlockType);
  const capabilities = getBlockCapabilities(selectedBlockType);
  const propertySchema = getBlockPropertySchema(selectedBlockType) ?? {
    blockType: selectedBlockType,
    properties: [{ key: 'variant', type: 'variant' as const, label: 'Varian' }],
    redirectToAuthoring: true,
    redirectNote: `Block type "${selectedBlockType}" — editor belum tersedia`,
  };

  // ── Determine which editor to use ──
  const guidedSchema = getGuidedEditorSchema(selectedBlockType);
  const useGuidedForm = hasGuidedEditor(selectedBlockType) && guidedSchema !== null;

  const handleRemoveBlock = () => {
    if (!selectedBlockId) return;
    deleteBlock(selectedBlockId);
    selectBlock(null);
    stopEditing();
  };

  // If this block type is not editable, show minimal info
  if (!capabilities.editable) {
    return (
      <div className="flex flex-col h-full">
        {/* Header — stitch style */}
        <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-tertiary" />
            <h3 className="text-[14px] font-bold text-on-surface">Properties</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => selectBlock(null)}
            className="h-7 w-7 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg"
          >
            <X size={14} />
          </Button>
        </div>
        <div className="p-6 text-center">
          <div className="text-[12px] text-on-surface-variant italic">Block ini tidak dapat diedit</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" data-testid="block-properties-panel">
      {/* ═══ Header — Stitch spec ═══════════════════════════════ */}
      <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest shrink-0">
        <div className="flex items-center gap-2">
          {useGuidedForm ? (
            <BookOpen size={18} className="text-primary-container" />
          ) : (
            <SlidersHorizontal size={18} className="text-tertiary" />
          )}
          <h3 className="text-[14px] font-bold text-on-surface">
            {useGuidedForm ? 'Edit Konten' : 'Properties'}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { selectBlock(null); stopEditing(); }}
          className="h-7 w-7 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg"
        >
          <X size={14} />
        </Button>
      </div>

      {/* ═══ Scrollable Content ═══════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
        {/* Block Type Badge — Stitch style */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/50">
          <span className="text-2xl">{guidedSchema?.icon || definition?.icon || '📦'}</span>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-on-surface truncate">
              {useGuidedForm
                ? (guidedSchema?.displayName || teacherTerm(definition?.name || selectedBlockType, teacherMode))
                : teacherTerm(definition?.name || selectedBlockType, teacherMode)
              }
            </div>
            <div className="text-[11px] text-on-surface-variant">
              {teacherMode
                ? (guidedSchema?.description?.split('.')[0] || definition?.category || '')
                : `${definition?.category || 'unknown'} · ${selectedBlockType}`
              }
            </div>
          </div>
          {editingBlockId === selectedBlockId && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
              EDITING
            </span>
          )}
        </div>

        {/* Block Variant Switcher — shown for both modes */}
        {block && <BlockVariantSwitcher block={block} />}

        {/* ═══ EDITOR ROUTING ═════════════════════════════════════ */}
        {useGuidedForm && block && pageId ? (
          /* GUIDED FORM — teacher-friendly, content-focused
           * Writes via applyGuidedSchemaPatch() (single write path) */
          <GuidedFormEditor
            block={block}
            guidedSchema={guidedSchema}
            pageId={pageId}
            blockId={selectedBlockId}
          />
        ) : block ? (
          /* SCHEMA-DRIVEN EDITOR — developer mode fallback
           * Writes via updateSchemaBlock() (Zustand store) */
          <SchemaDrivenEditor
            block={block}
            schema={propertySchema}
            onUpdate={(updates: Record<string, unknown>) => updateSchemaBlock(selectedBlockId, updates)}
          />
        ) : null}

        {/* ═══ Advanced: Capabilities & Layout (collapsed, hidden in teacher mode) ═══ */}
        {!teacherMode && definition && (
          <>
            <details className="group">
              <summary className="flex items-center gap-1 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest cursor-pointer hover:text-on-surface transition-colors list-none">
                <span className="transition-transform group-open:rotate-90">▶</span>
                {' '}Kemampuan Editor
              </summary>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                <CapabilityBadge label="Dapat Diedit" value={definition.capabilities.editable} />
                <CapabilityBadge label="Dapat Diubah Ukuran" value={definition.capabilities.resizable} />
                <CapabilityBadge label="Dapat Dipindah" value={definition.capabilities.movable} />
                <CapabilityBadge label="Interaktif" value={definition.capabilities.interactive} />
                <CapabilityBadge label="Auto-gen" value={definition.capabilities.autoGeneratable} />
                <CapabilityBadge label="Komposit" value={definition.capabilities.composite} />
              </div>
            </details>

            <details className="group">
              <summary className="flex items-center gap-1 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest cursor-pointer hover:text-on-surface transition-colors list-none">
                <span className="transition-transform group-open:rotate-90">▶</span>
                {' '}Layout
              </summary>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[12px] text-on-surface-variant">Posisi</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                  definition.defaultLayout.position === 'flow'
                    ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/20'
                    : 'bg-amber-500/15 text-amber-600 border border-amber-500/20'
                }`}>
                  {definition.defaultLayout.position}
                </span>
              </div>
            </details>

            {/* Block ID — dev only */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30">
              <span className="text-[10px] text-on-surface-variant font-bold w-8">ID</span>
              <span className="text-[10px] text-on-surface-variant font-mono truncate flex-1">{selectedBlockId}</span>
            </div>
          </>
        )}
      </div>

      {/* ═══ Footer Action — Stitch spec ═══════════════════════════ */}
      <div className="p-4 bg-surface-container-low border-t border-outline-variant shrink-0">
        <button
          onClick={handleRemoveBlock}
          className="w-full py-3 bg-on-background/90 text-white rounded-full text-[13px] font-bold hover:bg-on-background active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Trash2 size={16} />
          Hapus {teacherMode ? 'Konten' : 'Block'}
        </button>
      </div>
    </div>
  );
}
