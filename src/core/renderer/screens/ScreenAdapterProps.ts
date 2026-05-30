// ═══════════════════════════════════════════════════════════════════
// SHARED SCREEN ADAPTER PROPS — Common props for all screen adapters
// ═══════════════════════════════════════════════════════════════════
// All screen adapters share the same base props. This type reduces
// duplication and ensures consistent prop signatures across adapters.
// ═══════════════════════════════════════════════════════════════════

import type { CanvaPage } from '@/components/canva/types';
import type { ScreenSchema } from '@/core/schema/types';
import type { TokenResolver } from '../types';
import type { SchemaRenderMode } from '../SchemaRenderer';
import type { SceneResolution, SafeArea } from '@/core/scene/SceneLayoutEngine';
import type { ScreenConfig } from './ScreenTypeRegistry';
import type { SceneType } from '@/core/edu/education-scene-types';

export interface ScreenAdapterProps {
  /** The page data */
  page: CanvaPage;
  /** The resolved schema for this page */
  schema: ScreenSchema;
  /** Token resolver for styling */
  tokens: TokenResolver;
  /** Rendering mode (canvas/preview/export) */
  mode: SchemaRenderMode;
  /** Screen config from registry */
  config: ScreenConfig;
  /** Whether the page is in interactive mode */
  interactive: boolean;
  /** Scene resolution for deterministic layout */
  sceneResolution?: SceneResolution;
  /** Safe area for deterministic layout */
  safeArea?: SafeArea;
  /** Ratio ID for scene resolution lookup */
  ratioId?: string;
  /** Whether top navbar is shown */
  showTopNav?: boolean;
  /** Whether bottom navbar is shown */
  showBottomNav?: boolean;
  /** Page index (0-based) */
  pageIndex?: number;
  /** Scene type for edu token system */
  sceneType?: SceneType;
  /** Total pages in the learning module */
  totalPages?: number;
}
