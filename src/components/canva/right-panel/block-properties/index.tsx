'use client';

// ═══════════════════════════════════════════════════════════════
// BLOCK PROPERTIES PANEL — Schema-driven dynamic property editor
// ═══════════════════════════════════════════════════════════════
// ARCHITECTURE (v2 — Schema-Driven Visual Editing Engine):
//
//   1. Block is selected → store.selectedBlockId/Type set
//   2. getBlockPropertySchema(blockType) → list of editable PropertyFields
//   3. Dynamic editor auto-generates form from PropertyField[]
//   4. Changes call updateSchemaBlock() → deep patch merge → rerender
//
// FASE 2: Single source of truth — property schema comes from
// SCENE_REGISTRY via getBlockPropertySchema(). No more dual source.
//
// Dot-notation support: Property schemas can use keys like 'cta.label'
// which read from block.cta.label and write via deep merge preserving
// sibling properties.
//
// Key principles:
//   - Schema is SINGLE SOURCE OF TRUTH (editor reads from schema store)
//   - Deep patch merge (not full block replace)
//   - Type-aware editing (each block shows only relevant fields)
//   - Capability-based (capabilities control what's editable)

import { useCanvaStore } from '@/store/canva-store';
import { getBlockDefinition, getBlockCapabilities, getBlockPropertySchema } from '@/core/registry/SceneRegistry';
import { Settings2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSelectedBlock } from './use-selected-block';
import { SchemaDrivenEditor } from './SchemaDrivenEditor';
import { CapabilityBadge } from './CapabilityBadge';

export default function BlockPropertiesPanel() {
  const selectedBlockId = useCanvaStore(s => s.selectedBlockId);
  const selectedBlockType = useCanvaStore(s => s.selectedBlockType);
  const selectBlock = useCanvaStore(s => s.selectBlock);
  const updateSchemaBlock = useCanvaStore(s => s.updateSchemaBlock);
  const editingBlockId = useCanvaStore(s => s.editingBlockId);
  const stopEditing = useCanvaStore(s => s.stopEditing);
  const { block } = useSelectedBlock();

  if (!selectedBlockId || !selectedBlockType) return null;

  const definition = getBlockDefinition(selectedBlockType);
  const capabilities = getBlockCapabilities(selectedBlockType);
  // FASE 2: Single source of truth — property schema comes from SCENE_REGISTRY.
  // Fallback to a minimal generic schema for unregistered block types.
  const propertySchema = getBlockPropertySchema(selectedBlockType) ?? {
    blockType: selectedBlockType,
    properties: [{ key: 'variant', type: 'variant' as const, label: 'Varian' }],
    redirectToAuthoring: true,
    redirectNote: `Block type "${selectedBlockType}" — editor belum tersedia`,
  };

  // If this block type is not editable, show minimal info
  if (!capabilities.editable) {
    return (
      <div className="border-b border-blue-500/10">
        <div className="px-3 py-2 flex items-center gap-1.5 bg-blue-500/5">
          <Settings2 size={12} className="text-blue-400" />
          <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Block</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => selectBlock(null)}
            className="ml-auto h-5 w-5 text-app-muted hover:text-app-secondary"
          >
            <X size={10} />
          </Button>
        </div>
        <div className="px-3 pb-3 pt-2">
          <div className="text-[9px] text-app-muted italic">Block ini tidak dapat diedit</div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-blue-500/10">
      {/* Header */}
      <div className="px-3 py-2 flex items-center gap-1.5 bg-blue-500/5">
        <Settings2 size={12} className="text-blue-400" />
        <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Block Properti</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { selectBlock(null); stopEditing(); }}
          className="ml-auto h-5 w-5 text-app-muted hover:text-app-secondary"
        >
          <X size={10} />
        </Button>
      </div>

      <div className="px-3 pb-3 pt-2 space-y-2">
        {/* Block type badge */}
        <div className="flex items-center gap-2">
          <span className="text-lg">{definition?.icon || '📦'}</span>
          <div>
            <div className="text-[11px] font-bold text-app-primary">{definition?.name || selectedBlockType}</div>
            <div className="text-[9px] text-app-muted">{definition?.category || 'unknown'} &middot; {selectedBlockType}</div>
          </div>
          {editingBlockId === selectedBlockId && (
            <span className="ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              EDITING
            </span>
          )}
        </div>

        {/* Block ID */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-app-muted w-14">ID</span>
          <span className="text-[10px] text-app-secondary font-mono truncate flex-1">{selectedBlockId}</span>
        </div>

        {/* ═══ SCHEMA-DRIVEN DYNAMIC EDITOR ═════════════════ */}
        {block && (
          <SchemaDrivenEditor
            block={block}
            schema={propertySchema}
            onUpdate={(updates) => updateSchemaBlock(selectedBlockId, updates)}
          />
        )}

        {/* Capabilities (collapsed) */}
        {definition && (
          <details className="mt-2">
            <summary className="text-[9px] font-bold text-app-muted uppercase tracking-wider cursor-pointer hover:text-app-secondary">
              Kemampuan
            </summary>
            <div className="grid grid-cols-2 gap-1 mt-1">
              <CapabilityBadge label="Editable" value={definition.capabilities.editable} />
              <CapabilityBadge label="Resizable" value={definition.capabilities.resizable} />
              <CapabilityBadge label="Movable" value={definition.capabilities.movable} />
              <CapabilityBadge label="Interaktif" value={definition.capabilities.interactive} />
              <CapabilityBadge label="Auto-gen" value={definition.capabilities.autoGeneratable} />
              <CapabilityBadge label="Komposit" value={definition.capabilities.composite} />
            </div>
          </details>
        )}

        {/* Layout info (collapsed) */}
        {definition && (
          <details className="mt-1">
            <summary className="text-[9px] font-bold text-app-muted uppercase tracking-wider cursor-pointer hover:text-app-secondary">
              Layout
            </summary>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-app-muted">Posisi</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                definition.defaultLayout.position === 'flow'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}>
                {definition.defaultLayout.position}
              </span>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
