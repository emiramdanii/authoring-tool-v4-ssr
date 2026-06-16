// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Page actions slice
// ═══════════════════════════════════════════════════════════════

import { toast } from 'sonner';
import type { StateCreator } from 'zustand';
import type { CanvaState } from './types';
import type { CanvaPage, CanvaElement, PageTemplateType } from '@/components/canva/types';
import type { SchemaBlock } from '@/core/schema/types';
import {
  populateTemplateElements,
} from '@/lib/canva-constants';
import { createPage, createElId } from './constants';
import { getTemplateLabel, getTemplateExtraProps } from './template-data';
import { generatePageId, generateBlockId, ensurePageSchema } from '@/core/schema/ensure-schema';
import { regenerateNestedIds } from '@/core/schema/immutable';
import { assertDocumentPurity } from '@/core/schema/session-state';
import { saveCrashCheckpoint } from '@/core/recovery';
import { patchHistory } from '@/core/editor/patch-history';
import { createPageFromPreset, getPreset } from '@/core/preset/PagePresetRegistry';
import { resolvePrimaryEditableTarget } from '@/core/schema/primary-edit-target';
import { notifyMutation } from '@/lib/save-utils';

export type PageSlice = Pick<
  CanvaState,
  | 'goPage' | 'addPage' | 'addTemplatePage' | 'duplicatePage'
  | 'deletePage' | 'setPageLabel' | 'setTemplateType' | 'setVariant' | 'reorderPage'
>;

export const createPageSlice: StateCreator<CanvaState, [], [], PageSlice> = (set, get) => ({
  goPage: (idx) => {
    const pages = get().pages;
    if (idx < 0 || idx >= pages.length) return;

    // ── Save pending inline edit before switching pages ──
    // When the user is inline-editing a text field and clicks another page,
    // editingBlockId is cleared below, which unmounts InlineTextEditor
    // WITHOUT firing onBlur — the edit is lost.
    // Fix: programmatically blur the active contentEditable element first,
    // which triggers the InlineTextEditor handleBlur → onSave flow.
    const activeEl = document.activeElement;
    if (activeEl && (activeEl as HTMLElement).isContentEditable) {
      (activeEl as HTMLElement).blur();
    }

    // Clear patch history when switching pages to prevent cross-page
    // patch application (patches from page N must not leak into page M)
    patchHistory.clear();
    set({
      currentPageIndex: idx,
      selectedElId: null, selectedElIds: [],
      selectedBlockId: null, selectedBlockType: null, editingBlockId: null, selectedBlockIds: [],
      // Reset ephemeral navigation state — prevents stale UI from previous page:
      // - activeTabId: tab bar was showing wrong active tab after page switch
      // - sceneIndex: multi-scene page left sceneIndex=2, new page with 1 scene showed blank
      // - hoveredBlockId: hover highlight from old page leaked into new page
      activeTabId: null,
      sceneIndex: 0,
      hoveredBlockId: null,
    });
  },

  addPage: () => {
    const pages = get().pages;
    const newPage = createPage('Halaman ' + (pages.length + 1), 'custom');
    get()._pushHistory();
    // Sprint X.1: clear stale block selection from previous page.
    // Without this, the right panel shows a guided editor for a block
    // that belongs to a different page.
    set({
      pages: [...pages, newPage],
      currentPageIndex: pages.length,
      selectedElId: null,
      activeTabId: null,
      selectedBlockId: null,
      selectedBlockType: null,
      editingBlockId: null,
      selectedBlockIds: [],
    });
    notifyMutation();
    toast.success('Halaman baru ditambahkan');
  },

  addTemplatePage: (templateType) => {
    const pages = get().pages;

    // ═══ FASE 2: Preset-first page creation ═══════════════════
    // Pages are schema-native from creation — page.schema is populated
    // directly by the PresetRegistry. No lazy migration needed.
    const newPage = createPageFromPreset(templateType, pages.length);

    // ═══ Sprint X.1: Primary Edit Target ═══════════════════════
    // After page creation, resolve which block is the primary editable
    // target. This ensures the right panel opens "Edit Materi" /
    // "Edit Kuis" / etc. immediately — not the generic "Edit Halaman".
    const primaryTarget = resolvePrimaryEditableTarget(newPage);

    get()._pushHistory();
    set({
      pages: [...pages, newPage],
      currentPageIndex: pages.length,
      selectedElId: null,
      activeTabId: null,
      // Auto-select primary block — the foundation of template-first UX
      selectedBlockId: primaryTarget.blockId,
      selectedBlockType: primaryTarget.blockType,
      editingBlockId: null,
      selectedBlockIds: primaryTarget.blockId ? [primaryTarget.blockId] : [],
    });
    notifyMutation();
    toast.success(`${newPage.label} ditambahkan`);
  },

  duplicatePage: () => {
    const { pages, currentPageIndex } = get();

    // ── FASE 6: Crash checkpoint before page duplication ──
    saveCrashCheckpoint(pages, get().ratioId, 'duplicate-page');

    const orig = pages[currentPageIndex];
    const clone = structuredClone(orig) as CanvaPage;
    clone.id = generatePageId();
    clone.label = orig.label + ' (Salinan)';
    clone.elements.forEach((el: CanvaElement) => {
      el.id = createElId();
    });

    // ═══ FASE 1: Re-assign schema block IDs on duplication ═══
    // Without this, the clone has identical block IDs as the original,
    // causing selection/editing conflicts (selecting a block in one page
    // would highlight the same-ID block in the other page).
    // Each block gets a fresh stable nanoid(10).
    if (clone.schema?.blocks) {
      // ═══ Deep ID regeneration for ALL blocks (including nested) ═══
      // Previously only top-level blocks got new IDs, causing selection
      // conflicts when editing duplicated pages with composite blocks
      // (ftab tabs, materi-section content, children).
      // Now we regenerate IDs for EVERY block in the tree.
      clone.schema = {
        ...clone.schema,
        id: clone.id, // Update schema ID to match new page ID
        blocks: clone.schema.blocks.map(block => {
          // Deep clone already done by structuredClone — just re-ID
          const reId = { ...block, id: generateBlockId() };
          regenerateNestedIds(reId as SchemaBlock); // Regenerate nested child IDs
          return reId;
        }),
      };
    }
    const newPages = [...pages];
    newPages.splice(currentPageIndex + 1, 0, clone);
    // Sprint X.1: Auto-select primary edit target on duplicated page
    const dupePrimaryTarget = resolvePrimaryEditableTarget(clone);

    get()._pushHistory();
    set({
      pages: newPages,
      currentPageIndex: currentPageIndex + 1,
      selectedElId: null,
      activeTabId: null,
      selectedBlockId: dupePrimaryTarget.blockId,
      selectedBlockType: dupePrimaryTarget.blockType,
      editingBlockId: null,
      selectedBlockIds: dupePrimaryTarget.blockId ? [dupePrimaryTarget.blockId] : [],
    });
    notifyMutation();
    toast.success('Halaman diduplikat');
  },

  deletePage: () => {
    const { pages, currentPageIndex } = get();
    if (pages.length <= 1) { toast.warning('Minimal 1 halaman'); return; }

    // ── FASE 6: Crash checkpoint before page deletion ──
    saveCrashCheckpoint(pages, get().ratioId, 'delete-page');

    get()._pushHistory();
    const newPages = pages.filter((_, i) => i !== currentPageIndex);
    set({
      pages: newPages,
      currentPageIndex: Math.max(0, currentPageIndex - 1),
      selectedElId: null,
      activeTabId: null,
    });
    notifyMutation();
    toast.success('Halaman dihapus');
  },

  setPageLabel: (label) => {
    const { pages, currentPageIndex } = get();
    const newPages = [...pages];
    newPages[currentPageIndex] = { ...newPages[currentPageIndex], label };
    set({ pages: newPages });
    notifyMutation();
  },

  setTemplateType: (templateType) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    get()._pushHistory();
    const newPages = [...pages];

    const isTemplate = templateType !== 'custom';
    // FASE 3: templateData is legacy — schema is derived directly
    const newPage = { ...page, templateType, templateVariant: 'A' as const, templateData: {} as Record<string, unknown> };
    Object.assign(newPage, getTemplateExtraProps(templateType));

    // ═══ Schema-first: regenerate schema for new template type ═══
    // CRITICAL: Must clear schema BEFORE calling ensurePageSchema,
    // otherwise Path 1 returns the OLD schema (from the previous type)
    // and the page shows wrong content (e.g., CoverBlock on a materi page).
    if (isTemplate) {
      // Ensure the page gets a FRESH schema for the new templateType
      // by explicitly clearing schema so ensurePageSchema goes through Path 3
      const schema = ensurePageSchema({ ...newPage, templateType, schema: undefined });
      if (schema) {
        newPage.schema = { ...schema, id: newPage.id };
        newPage.elements = [];
        newPage.pageMode = 'schema';
      } else {
        delete newPage.schema;
        newPage.elements = populateTemplateElements(newPage, createElId);
        newPage.pageMode = 'elements';
      }
    } else {
      // Custom pages also support schema (empty schema for block additions)
      newPage.schema = {
        id: newPage.id,
        version: 1,
        templateType: 'custom',
        blocks: [],
        background: { type: 'solid', color1: 'bg' },
      };
      newPage.elements = [];
      newPage.pageMode = 'schema';
    }

    newPages[currentPageIndex] = newPage;
    set({ pages: newPages, selectedElId: null });
    notifyMutation();
  },

  setVariant: (variant) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    get()._pushHistory();
    const newPages = [...pages];

    // ═══ Update page.templateVariant AND all schema blocks' variant ═══
    // The schema renderer reads block.variant, not page.templateVariant.
    // Without syncing both, the visual variant switcher appears broken.
    let updatedSchema = page.schema;
    if (updatedSchema?.blocks) {
      updatedSchema = {
        ...updatedSchema,
        blocks: updatedSchema.blocks.map(block => ({
          ...block,
          variant,
        })),
      };
      // Dev-mode purity guard: variant change must not introduce runtime state
      assertDocumentPurity(updatedSchema, 'setVariant');
    }

    newPages[currentPageIndex] = { ...page, templateVariant: variant, schema: updatedSchema };
    set({ pages: newPages });
    notifyMutation();
  },

  reorderPage: (fromIndex, toIndex) => {
    const { pages, currentPageIndex } = get();
    if (fromIndex === toIndex) return;
    get()._pushHistory();
    const newPages = [...pages];
    const [moved] = newPages.splice(fromIndex, 1);
    newPages.splice(toIndex, 0, moved);
    // Adjust currentPageIndex if needed
    let newCurrentIdx = currentPageIndex;
    if (currentPageIndex === fromIndex) newCurrentIdx = toIndex;
    else if (fromIndex < currentPageIndex && toIndex >= currentPageIndex) newCurrentIdx = currentPageIndex - 1;
    else if (fromIndex > currentPageIndex && toIndex <= currentPageIndex) newCurrentIdx = currentPageIndex + 1;
    set({ pages: newPages, currentPageIndex: newCurrentIdx, selectedElId: null, activeTabId: null });
    notifyMutation();
  },

});
