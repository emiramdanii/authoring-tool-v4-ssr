// ═══════════════════════════════════════════════════════════════════
// SHARED TEMPLATE APPLY FLOW — Single entry point for applying a
// CourseTemplate to the application stores.
// ═══════════════════════════════════════════════════════════════════
// D-P0D.1: Before this module, Dashboard, TemplateWizard, and
// TemplateMarketplace each had their own copy of the apply logic.
// This caused:
//   - Different store states depending on entry point
//   - Marketplace missing DB persistence
//   - Dashboard missing primary editable target selection
//   - Label/metadata drift between entry points
//
// Now all three call applyTemplateToStore() with the same core logic.
// Optional flags control DB persistence and post-apply navigation.
// ═══════════════════════════════════════════════════════════════════

import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { useDirtyStore } from '@/store/dirty-store';
import {
  createProjectFromTemplate,
  getTemplateThemeId,
  type ProjectMetadata,
} from '@/core/template/CourseTemplateRegistry';
import { resolvePrimaryEditableTarget } from '@/core/schema/primary-edit-target';
import { logger } from '@/core/utils/logger';

// ── Options ────────────────────────────────────────────────────────

export interface ApplyTemplateOptions {
  /** Metadata to inject into cover/penutup blocks and authoring store */
  metadata: ProjectMetadata;

  /**
   * DB persistence strategy.
   * - 'db'           → persist via createProject() (TemplateWizard path)
   * - 'localstorage' → persist to localStorage only (Dashboard/Marketplace path)
   * - 'none'         → skip persistence entirely (testing / special cases)
   * @default 'localstorage'
   */
  persist?: 'db' | 'localstorage' | 'none';

  /**
   * createProject() function from useProjectManager hook.
   * Required when persist='db'. Ignored otherwise.
   */
  createProjectFn?: (meta: {
    title?: string;
    description?: string;
    subject?: string;
    grade?: string;
  }) => Promise<{ id: string; title: string } | null>;

  /**
   * Whether to auto-select the primary editable target on page 0.
   * When true, the right panel opens "Edit Materi"/"Edit Kuis" immediately.
   * @default true
   */
  selectPrimaryTarget?: boolean;

  /**
   * Whether to navigate to the Canva workspace after applying.
   * @default true
   */
  navigateToWorkspace?: boolean;
}

export interface ApplyTemplateResult {
  success: boolean;
  /** Human-readable label for toast messages */
  templateName: string;
  /** Number of pages created */
  pageCount: number;
  /** Whether DB persistence succeeded (false if persist='localstorage' or 'none') */
  dbPersisted: boolean;
  /** Error message if success=false */
  error?: string;
}

// ── Main Function ──────────────────────────────────────────────────

/**
 * Apply a CourseTemplate to the application stores — the SINGLE official
 * way to create a project from a template.
 *
 * This function:
 * 1. Resolves the template from CourseTemplateRegistry
 * 2. Creates pages via createProjectFromTemplate()
 * 3. Applies the template's theme immutably to each page's schema
 * 4. Sets pages in canva store with undo history
 * 5. Auto-selects primary editable target (optional, default: true)
 * 6. Updates authoring store metadata (judulPertemuan, mapel, kelas)
 * 7. Marks project as dirty
 * 8. Persists to DB or localStorage (configurable)
 * 9. Navigates to workspace (configurable)
 *
 * @param templateId — ID from CourseTemplateRegistry (e.g. 'modul-ppkn-vii')
 * @param options — See ApplyTemplateOptions
 * @returns ApplyTemplateResult with success status and metadata
 */
export async function applyTemplateToStore(
  templateId: string,
  options: ApplyTemplateOptions,
): Promise<ApplyTemplateResult> {
  const {
    metadata,
    persist = 'localstorage',
    createProjectFn,
    selectPrimaryTarget = true,
    navigateToWorkspace = true,
  } = options;

  try {
    // ── Step 1: Create pages from template ───────────────────────
    const rawPages = await createProjectFromTemplate(templateId, metadata);
    if (!rawPages.length) {
      return {
        success: false,
        templateName: metadata.title || templateId,
        pageCount: 0,
        dbPersisted: false,
        error: 'Template menghasilkan 0 halaman',
      };
    }

    // ── Step 2: Apply theme IMMUTABLY ────────────────────────────
    // Schemas may be deepFrozen in dev mode, so we create new page
    // objects instead of mutating in place.
    //
    // PATCH-2E: Single source of truth for themeId.
    // Previously (PATCH-2D): schema.themeId = page.schema.themeId || themeId,
    // but templateData.schemaThemeId = themeId (raw). If schema already had
    // 'modern-interactive' but template theme was 'default', the two fields
    // would be different — a time bomb for save/load/export/legacy bridge.
    //
    // Now: compute ONE finalThemeId, write it to BOTH fields.
    // Priority: schema.themeId (already set by schema-factory) > template
    // theme > 'modern-interactive' (light default for teacher mode).
    const templateThemeId = getTemplateThemeId(templateId);

    const pages = rawPages.map(page => {
      if (!page.schema) return page;
      const finalThemeId = page.schema.themeId || templateThemeId || 'modern-interactive';
      const updatedSchema = {
        ...page.schema,
        themeId: finalThemeId,
        background: {
          ...(page.schema.background ?? {}),
          type: page.schema.background?.type ?? 'gradient',
        },
      };
      return {
        ...page,
        schema: updatedSchema,
        templateData: { ...page.templateData, schemaThemeId: finalThemeId },
      };
    });

    // ── Step 3: Resolve primary editable target (page 0) ─────────
    const primaryTarget = selectPrimaryTarget
      ? resolvePrimaryEditableTarget(pages[0]!)
      : null;

    // ── Step 4: Set pages in canva store ─────────────────────────
    const store = useCanvaStore.getState();
    store._pushHistory();
    useCanvaStore.setState({
      pages,
      currentPageIndex: 0,
      selectedElId: null,
      selectedElIds: [],
      selectedBlockId: primaryTarget?.blockId ?? null,
      selectedBlockType: primaryTarget?.blockType ?? null,
      editingBlockId: null,
      selectedBlockIds: primaryTarget?.blockId ? [primaryTarget.blockId] : [],
    });

    // ── Step 5: Update authoring store metadata ──────────────────
    const authoringStore = useAuthoringStore.getState();
    if (metadata.title) authoringStore.updateMeta('judulPertemuan', metadata.title);
    if (metadata.mapel) authoringStore.updateMeta('mapel', metadata.mapel);
    if (metadata.kelas) authoringStore.updateMeta('kelas', metadata.kelas);
    useDirtyStore.getState().markDirty();

    // ── Step 6: Persist ──────────────────────────────────────────
    let dbPersisted = false;

    if (persist === 'db' && createProjectFn) {
      try {
        await createProjectFn({
          title: metadata.title,
          subject: metadata.mapel,
          grade: metadata.kelas,
        });
        dbPersisted = true;
      } catch (dbErr) {
        // DB save failed — project is still in memory, fall back to localStorage
        logger.warn(
          'applyTemplateToStore',
          'DB persist failed, falling back to localStorage: ' + String(dbErr),
        );
        useCanvaStore.getState().saveToStorage();
        useAuthoringStore.getState().saveToStorage();
      }
    } else if (persist === 'localstorage') {
      useCanvaStore.getState().saveToStorage();
      useAuthoringStore.getState().saveToStorage();
    }
    // persist === 'none' → skip entirely

    // ── Step 7: Navigate to workspace ────────────────────────────
    if (navigateToWorkspace) {
      setTimeout(() => {
        useCanvaStore.setState({ panelRequest: 'canva' });
      }, 300);
    }

    return {
      success: true,
      templateName: metadata.title || templateId,
      pageCount: pages.length,
      dbPersisted,
    };
  } catch (err) {
    logger.error('applyTemplateToStore', String(err));
    return {
      success: false,
      templateName: metadata.title || templateId,
      pageCount: 0,
      dbPersisted: false,
      error: String(err),
    };
  }
}
