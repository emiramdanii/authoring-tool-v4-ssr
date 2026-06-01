'use client';

// ═══════════════════════════════════════════════════════════════
// BLOCK PROPERTIES PANEL — SILSE v4 Content-Only Panel
// ═══════════════════════════════════════════════════════════════
// NOTE: This component renders CONTENT ONLY — no header/footer.
// RightPanel provides the header (Properties + close) and
// footer (Hapus Block button). BlockPropertiesPanel only
// provides the scrollable editor content between them.
//
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
import { useSelectedBlock } from './block-properties/use-selected-block';
import { GuidedFormEditor } from './block-properties/GuidedFormEditor';
import { SchemaDrivenEditor } from './block-properties/SchemaDrivenEditor';
import { CapabilityBadge } from './block-properties/CapabilityBadge';
import { BlockVariantSwitcher } from './block-properties/BlockVariantSwitcher';
import { teacherTerm } from '@/core/i18n/teacher-terminology';

export default function BlockPropertiesPanel() {
  const selectedBlockId = useCanvaStore(s => s.selectedBlockId);
  const selectedBlockType = useCanvaStore(s => s.selectedBlockType);
  const updateSchemaBlock = useCanvaStore(s => s.updateSchemaBlock);
  const editingBlockId = useCanvaStore(s => s.editingBlockId);
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

  // If this block type is not editable, show minimal info
  if (!capabilities.editable) {
    return (
      <div className="p-4 text-center">
        <div className="text-[12px] text-silse-on-surface-variant italic">Block ini tidak dapat diedit</div>
      </div>
    );
  }

  return (
    <div data-testid="block-properties-panel">
      {/* ═══ Block Type Badge ═══════════════════════════════════════ */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-silse-surface-container-low border border-silse-outline-variant/50">
        <span className="text-2xl">{guidedSchema?.icon || definition?.icon || '📦'}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-silse-on-surface truncate">
            {useGuidedForm
              ? (guidedSchema?.displayName || teacherTerm(definition?.name || selectedBlockType, teacherMode))
              : teacherTerm(definition?.name || selectedBlockType, teacherMode)
            }
          </div>
          <div className="text-[11px] text-silse-on-surface-variant">
            {teacherMode
              ? (guidedSchema?.description?.split('.')[0] || definition?.category || '')
              : `${definition?.category || 'unknown'} · ${selectedBlockType}`
            }
          </div>
        </div>
        {editingBlockId === selectedBlockId && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-silse-primary-container/15 text-silse-primary border border-silse-primary-container/30">
            EDITING
          </span>
        )}
      </div>

      {/* ═══ Block Variant Switcher ═══════════════════════════════ */}
      {block && <BlockVariantSwitcher block={block} />}

      {/* ═══ EDITOR ROUTING ═════════════════════════════════════════ */}
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
          onUpdate={(updates: Record<string, unknown>) => updateSchemaBlock(selectedBlockId, updates, { overflowPolicy: 'warn', source: 'user' })}
        />
      ) : null}

      {/* ═══ Advanced: Capabilities & Layout (collapsed, hidden in teacher mode) ═══ */}
      {!teacherMode && definition && (
        <>
          <details className="group mt-4">
            <summary className="flex items-center gap-1 text-[11px] font-bold text-silse-on-surface-variant uppercase tracking-widest cursor-pointer hover:text-silse-on-surface transition-colors list-none">
              <span className="transition-transform group-open:rotate-90">▶</span>
              {' '}Kemampuan Editor
            </summary>
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              <CapabilityBadge label="Dapat Diubah Ukuran" value={definition.capabilities.resizable} />
              <CapabilityBadge label="Dapat Dipindah" value={definition.capabilities.movable} />
              <CapabilityBadge label="Interaktif" value={definition.capabilities.interactive} />
              <CapabilityBadge label="Auto-gen" value={definition.capabilities.autoGeneratable} />
              <CapabilityBadge label="Komposit" value={definition.capabilities.composite} />
            </div>
          </details>

          <details className="group">
            <summary className="flex items-center gap-1 text-[11px] font-bold text-silse-on-surface-variant uppercase tracking-widest cursor-pointer hover:text-silse-on-surface transition-colors list-none">
              <span className="transition-transform group-open:rotate-90">▶</span>
              {' '}Layout
            </summary>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[12px] text-silse-on-surface-variant">Posisi</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                definition.defaultLayout.position === 'flow'
                  ? 'bg-silse-primary-container/15 text-silse-primary border border-silse-primary-container/30'
                  : 'bg-silse-tertiary-container/15 text-silse-tertiary border border-silse-tertiary-container/30'
              }`}>
                {definition.defaultLayout.position}
              </span>
            </div>
          </details>

          {/* Block ID — dev only */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-silse-surface-container-low border border-silse-outline-variant/30">
            <span className="text-[10px] text-silse-on-surface-variant font-bold w-8">ID</span>
            <span className="text-[10px] text-silse-on-surface-variant font-mono truncate flex-1">{selectedBlockId}</span>
          </div>
        </>
      )}
    </div>
  );
}
