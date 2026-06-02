// ═══════════════════════════════════════════════════════════════
// PAGE RUNTIME CONTRACT — Per-page rules for the learning runtime
// ═══════════════════════════════════════════════════════════════
// Every page in the learning flow has a contract that defines:
//   - When it is considered "complete"
//   - Whether it produces a score
//   - Whether navigation is locked until completion
//   - What message to show when locked
//
// This is the SINGLE source of truth for navigation, progress, and
// completion decisions. BottomNav reads from it. SceneList reads
// from it. LearningMediaStore enforces it.
//
// Flow:
//   PageRuntimeContract
//   → LearningMediaStore.pageCompletionStatus
//   → BottomNav (canGoNext / lockReason)
//   → SceneList (✓ / ○ / 🔒 indicators)
//   → CompletionModal
// ═══════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────

/** How a page determines it's "complete" */
export type CompletionType =
  | 'view'       // Just visiting = complete (cover, petunjuk, tujuan, motivasi)
  | 'scroll'     // Viewing all content = complete (materi, rangkuman)
  | 'answer'     // Answering at least one question = complete (kuis)
  | 'game'       // Completing the game/activity = complete (game)
  | 'reflection' // Submitting a reflection answer = complete (refleksi, diskusi)
  | 'auto';      // Automatically complete when visited (penutup, custom)

export interface PageScoringConfig {
  /** Whether this page can produce a score */
  enabled: boolean;
  /** Maximum possible score for this page (0 = no max, dynamic) */
  maxPoints: number;
}

export interface NavigationLockConfig {
  /** Whether forward navigation is locked until completion */
  enabled: boolean;
  /** Message shown when user tries to navigate while locked */
  message: string;
}

export interface PageRuntimeContract {
  /** The template type this contract applies to */
  templateType: string;

  /** When this page is considered "complete" */
  completionType: CompletionType;

  /** Scoring configuration */
  scoring: PageScoringConfig;

  /** Navigation lock configuration */
  navigationLock: NavigationLockConfig;

  /** Whether this page requires explicit completion (vs auto on visit) */
  requireCompletion: boolean;
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT CONTRACTS — per templateType
// ═══════════════════════════════════════════════════════════════
// These define the default runtime behavior for each scene type.
// Teachers can override these per-page in the future, but for now
// these sensible defaults drive the entire learning flow.

export const DEFAULT_CONTRACTS: Record<string, PageRuntimeContract> = {
  cover: {
    templateType: 'cover',
    completionType: 'view',
    scoring: { enabled: false, maxPoints: 0 },
    navigationLock: { enabled: false, message: '' },
    requireCompletion: false, // Cover pages auto-complete on visit
  },
  petunjuk: {
    templateType: 'petunjuk',
    completionType: 'view',
    scoring: { enabled: false, maxPoints: 0 },
    navigationLock: { enabled: false, message: '' },
    requireCompletion: false,
  },
  tujuan: {
    templateType: 'tujuan',
    completionType: 'view',
    scoring: { enabled: false, maxPoints: 0 },
    navigationLock: { enabled: false, message: '' },
    requireCompletion: false,
  },
  motivasi: {
    templateType: 'motivasi',
    completionType: 'view',
    scoring: { enabled: false, maxPoints: 0 },
    navigationLock: { enabled: false, message: '' },
    requireCompletion: false,
  },
  skenario: {
    templateType: 'skenario',
    completionType: 'scroll',
    scoring: { enabled: false, maxPoints: 0 },
    navigationLock: { enabled: false, message: '' },
    requireCompletion: false,
  },
  materi: {
    templateType: 'materi',
    completionType: 'scroll',
    scoring: { enabled: false, maxPoints: 0 },
    navigationLock: { enabled: false, message: '' },
    requireCompletion: false,
  },
  diskusi: {
    templateType: 'diskusi',
    completionType: 'reflection',
    scoring: { enabled: false, maxPoints: 0 },
    navigationLock: {
      enabled: true,
      message: 'Jawab pertanyaan diskusi terlebih dahulu untuk lanjut.',
    },
    requireCompletion: true,
  },
  kuis: {
    templateType: 'kuis',
    completionType: 'answer',
    scoring: { enabled: true, maxPoints: 100 },
    navigationLock: {
      enabled: true,
      message: 'Jawab kuis terlebih dahulu untuk lanjut.',
    },
    requireCompletion: true,
  },
  game: {
    templateType: 'game',
    completionType: 'game',
    scoring: { enabled: true, maxPoints: 100 },
    navigationLock: {
      enabled: true,
      message: 'Selesaikan game terlebih dahulu untuk lanjut.',
    },
    requireCompletion: true,
  },
  refleksi: {
    templateType: 'refleksi',
    completionType: 'reflection',
    scoring: { enabled: false, maxPoints: 0 },
    navigationLock: {
      enabled: true,
      message: 'Tulis refleksimu terlebih dahulu untuk lanjut.',
    },
    requireCompletion: true,
  },
  dokumen: {
    templateType: 'dokumen',
    completionType: 'scroll',
    scoring: { enabled: false, maxPoints: 0 },
    navigationLock: { enabled: false, message: '' },
    requireCompletion: false,
  },
  hasil: {
    templateType: 'hasil',
    completionType: 'view',
    scoring: { enabled: false, maxPoints: 0 },
    navigationLock: { enabled: false, message: '' },
    requireCompletion: false,
  },
  rangkuman: {
    templateType: 'rangkuman',
    completionType: 'scroll',
    scoring: { enabled: false, maxPoints: 0 },
    navigationLock: { enabled: false, message: '' },
    requireCompletion: false,
  },
  penutup: {
    templateType: 'penutup',
    completionType: 'auto',
    scoring: { enabled: false, maxPoints: 0 },
    navigationLock: { enabled: false, message: '' },
    requireCompletion: false,
  },
  custom: {
    templateType: 'custom',
    completionType: 'auto',
    scoring: { enabled: false, maxPoints: 0 },
    navigationLock: { enabled: false, message: '' },
    requireCompletion: false,
  },
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get the runtime contract for a page by its templateType.
 * Falls back to 'custom' contract for unknown types.
 */
export function getPageContract(templateType: string): PageRuntimeContract {
  return DEFAULT_CONTRACTS[templateType] ?? DEFAULT_CONTRACTS.custom!;
}

/**
 * Check if a page with a given contract can be marked complete
 * just by being visited (view/auto completion types).
 */
export function isAutoComplete(contract: PageRuntimeContract): boolean {
  return contract.completionType === 'view' || contract.completionType === 'auto';
}

/**
 * Check if a page requires interactive completion
 * (answer, game, reflection).
 */
export function isInteractiveCompletion(contract: PageRuntimeContract): boolean {
  return contract.completionType === 'answer'
    || contract.completionType === 'game'
    || contract.completionType === 'reflection';
}

/**
 * Page completion status — used by navigation, indicators, and progress.
 */
export type PageCompletionStatus = 'locked' | 'incomplete' | 'completed';

/**
 * Determine the completion status of a page given its contract and
 * the current runtime state.
 *
 * @param contract - The page's runtime contract
 * @param hasBeenVisited - Whether the user has visited this page
 * @param hasScore - Whether the page has a recorded score (from kuis/game)
 * @param hasInteraction - Whether the user has interacted (reflection/answer submitted)
 */
export function getPageCompletionStatus(
  contract: PageRuntimeContract,
  hasBeenVisited: boolean,
  hasScore: boolean,
  hasInteraction: boolean,
): PageCompletionStatus {
  // If not visited yet, it's locked (if requireCompletion) or incomplete
  if (!hasBeenVisited) {
    return contract.requireCompletion ? 'locked' : 'incomplete';
  }

  // Auto-complete pages: visited = completed
  if (isAutoComplete(contract)) {
    return 'completed';
  }

  // Interactive pages: need score or interaction
  if (contract.completionType === 'answer' || contract.completionType === 'game') {
    return hasScore ? 'completed' : (contract.requireCompletion ? 'locked' : 'incomplete');
  }

  if (contract.completionType === 'reflection') {
    return hasInteraction ? 'completed' : (contract.requireCompletion ? 'locked' : 'incomplete');
  }

  // scroll completion: visited = completed (for now; future: track scroll depth)
  if (contract.completionType === 'scroll') {
    return 'completed';
  }

  return 'incomplete';
}

/**
 * Check whether the user can navigate forward from a given page,
 * based on its contract and completion status.
 */
export function canNavigateNext(
  contract: PageRuntimeContract,
  completionStatus: PageCompletionStatus,
): { allowed: boolean; reason: string } {
  if (!contract.navigationLock.enabled) {
    return { allowed: true, reason: '' };
  }

  if (completionStatus === 'completed') {
    return { allowed: true, reason: '' };
  }

  return {
    allowed: false,
    reason: contract.navigationLock.message || 'Selesaikan halaman ini terlebih dahulu.',
  };
}

/**
 * Get all contracts for a list of pages (by templateType).
 */
export function getPageContracts(templateTypes: string[]): PageRuntimeContract[] {
  return templateTypes.map(getPageContract);
}
