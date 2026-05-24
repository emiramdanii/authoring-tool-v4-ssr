// ═══════════════════════════════════════════════════════════════════
// FEATURE FLAGS — Gradual feature activation system
// ═══════════════════════════════════════════════════════════════════
//
// Post-migration recovery strategy:
//   1. Enable ONLY core features first
//   2. Verify each core feature works end-to-end
//   3. Re-enable advanced features ONE BY ONE with testing
//   4. Remove flags once all features are stable
//
// Usage:
//   import { FEATURE_FLAGS, isEnabled } from '@/config/feature-flags';
//   if (isEnabled('aiGeneration')) { ... }
//
// OR in JSX:
//   {isEnabled('aiGeneration') && <AIGenerateButton />}
//
// ═══════════════════════════════════════════════════════════════════

export interface FeatureFlagConfig {
  /** Whether this feature is currently enabled */
  enabled: boolean;
  /** Human-readable label for UI toggles */
  label: string;
  /** Category for grouping */
  category: 'core' | 'ai' | 'export' | 'advanced' | 'dev';
  /** Description of what this feature does */
  description: string;
}

// ═══════════════════════════════════════════════════════════════════
// FEATURE FLAGS REGISTRY
// ═══════════════════════════════════════════════════════════════════

export const FEATURE_FLAGS: Record<string, FeatureFlagConfig> = {
  // ── CORE FEATURES (always enabled) ──────────────────────────
  canvasEditor: {
    enabled: true,
    label: 'Canvas Editor',
    category: 'core',
    description: 'Visual canvas editor with block manipulation, zoom, grid, snap',
  },
  schemaRenderer: {
    enabled: true,
    label: 'Schema Renderer',
    category: 'core',
    description: 'Schema-driven block rendering engine (40+ block types)',
  },
  blockCRUD: {
    enabled: true,
    label: 'Block CRUD',
    category: 'core',
    description: 'Add, delete, duplicate, reorder blocks on canvas',
  },
  pageManagement: {
    enabled: true,
    label: 'Page Management',
    category: 'core',
    description: 'Add, delete, duplicate, reorder pages',
  },
  undoRedo: {
    enabled: true,
    label: 'Undo/Redo',
    category: 'core',
    description: 'Immer patch-based undo/redo history',
  },
  autoSave: {
    enabled: true,
    label: 'Auto-Save',
    category: 'core',
    description: '2-second debounced auto-save to localStorage + DB',
  },
  fourModes: {
    enabled: true,
    label: '4 Mode Architecture',
    category: 'core',
    description: 'Edit, Preview, Present, Export modes',
  },
  authoringStore: {
    enabled: true,
    label: 'Authoring Store',
    category: 'core',
    description: 'Meta, CP, TP, ATP, Kuis, Materi data management',
  },
  themeSystem: {
    enabled: true,
    label: 'Theme System',
    category: 'core',
    description: 'Light/dark mode, semantic tokens, design system',
  },
  blockSelection: {
    enabled: true,
    label: 'Block Selection & Editing',
    category: 'core',
    description: 'Click to select, double-click to edit, inline text editing',
  },
  propertyPanel: {
    enabled: true,
    label: 'Property Panel',
    category: 'core',
    description: 'Right panel for editing block properties',
  },
  backgroundCustomization: {
    enabled: true,
    label: 'Background Customization',
    category: 'core',
    description: 'Solid, gradient, image backgrounds with color palette extraction',
  },

  // ── AI FEATURES (disabled during stabilization) ─────────────
  aiGeneration: {
    enabled: false,
    label: 'AI Lesson Generation',
    category: 'ai',
    description: 'Generate complete lessons using AI (z-ai-web-dev-sdk)',
  },
  aiRefinement: {
    enabled: false,
    label: 'AI Content Refinement',
    category: 'ai',
    description: 'AI-powered content refinement and suggestions',
  },
  aiAssistant: {
    enabled: false,
    label: 'AI Assistant Panel',
    category: 'ai',
    description: 'Chat-based AI assistant in the editor',
  },
  aiTemplateGenerator: {
    enabled: false,
    label: 'AI Template Generator',
    category: 'ai',
    description: 'Generate page templates from AI prompts',
  },

  // ── EXPORT FEATURES (disabled during stabilization) ─────────
  scormExport: {
    enabled: false,
    label: 'SCORM Export',
    category: 'export',
    description: 'SCORM 1.2 compliant export for LMS integration',
  },
  standaloneExport: {
    enabled: false,
    label: 'Standalone HTML Export',
    category: 'export',
    description: 'Vite-based standalone HTML file export',
  },
  excelImportExport: {
    enabled: false,
    label: 'Excel Import/Export',
    category: 'export',
    description: 'Import/export data from Excel spreadsheets',
  },

  // ── ADVANCED FEATURES (disabled during stabilization) ───────
  bsnpCompliance: {
    enabled: false,
    label: 'BSNP Compliance Checker',
    category: 'advanced',
    description: 'Kurikulum Merdeka compliance checking panel',
  },
  teacherMode: {
    enabled: false,
    label: 'Teacher Mode (Simple UI)',
    category: 'advanced',
    description: 'Simplified UI mode for non-technical teachers',
  },
  soundEffects: {
    enabled: false,
    label: 'Sound Effects',
    category: 'advanced',
    description: 'Audio feedback sounds for interactions',
  },
  commandPalette: {
    enabled: false,
    label: 'Command Palette',
    category: 'advanced',
    description: 'Ctrl+K command palette for power users',
  },
  mobileGuard: {
    enabled: true,
    label: 'Mobile Guard',
    category: 'advanced',
    description: 'Mobile viewport detection and guard — prevents unusable mobile experience',
  },
  pwa: {
    enabled: true,
    label: 'PWA (Progressive Web App)',
    category: 'advanced',
    description: 'Offline-first PWA with service worker',
  },

  // ── DEV-ONLY FEATURES (always disabled in production) ───────
  performanceMonitor: {
    enabled: false,
    label: 'Performance Monitor',
    category: 'dev',
    description: 'Real-time performance metrics overlay (dev only)',
  },
  memoryLeakDetector: {
    enabled: false,
    label: 'Memory Leak Detector',
    category: 'dev',
    description: 'Runtime memory leak detection (dev only)',
  },
  devPurityGuard: {
    enabled: false,
    label: 'Dev Purity Guard',
    category: 'dev',
    description: 'Strict state immutability checks (dev only)',
  },
};

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/** Check if a feature flag is enabled */
export function isEnabled(flagId: string): boolean {
  return FEATURE_FLAGS[flagId]?.enabled ?? false;
}

/** Get all flags in a category */
export function getFlagsByCategory(category: FeatureFlagConfig['category']): Record<string, FeatureFlagConfig> {
  const result: Record<string, FeatureFlagConfig> = {};
  for (const [key, config] of Object.entries(FEATURE_FLAGS)) {
    if (config.category === category) {
      result[key] = config;
    }
  }
  return result;
}

/** Get all enabled flags */
export function getEnabledFlags(): string[] {
  return Object.entries(FEATURE_FLAGS)
    .filter(([, config]) => config.enabled)
    .map(([key]) => key);
}

/** Get all disabled flags */
export function getDisabledFlags(): string[] {
  return Object.entries(FEATURE_FLAGS)
    .filter(([, config]) => !config.enabled)
    .map(([key]) => key);
}

/** Runtime enable/disable a flag (useful for dev/testing) */
export function setFlag(flagId: string, enabled: boolean): void {
  if (FEATURE_FLAGS[flagId]) {
    FEATURE_FLAGS[flagId].enabled = enabled;
  }
}
