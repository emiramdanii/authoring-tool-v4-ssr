// ═══════════════════════════════════════════════════════════════
// VITEST SETUP — Stub require() for '@/...' aliases
// ═══════════════════════════════════════════════════════════════
// Problem:
//   vitest inherits Vite's `resolve.alias` config for ESM imports.
//   But production code uses CommonJS `require('@/some/path')` inside
//   `typeof window` guards (e.g. src/store/authoring/index.ts:57).
//   Node's native require() does NOT know about Vite aliases.
//
//   Even worse: when we patch Module._resolveFilename to point at the
//   absolute file path, Node tries to LOAD that file as CommonJS, but
//   the file uses ESM `import` statements that themselves reference
//   '@/' aliases — which Node's ESM resolver doesn't know about either.
//
// Fix:
//   Patch the global `require` function itself. For '@/...' requests,
//   return a stub object. The authoring store's bridge code only calls
//   a handful of methods (markDirty, markClean, saveSucceeded, etc.)
//   inside subscribe callbacks — we never trigger those callbacks
//   during the export render test, so the stubs can be no-ops.
//
//   This is a TEST-ONLY patch. Production code never hits this path
//   because in the browser bundle, `require` doesn't exist — only
//   the ESM `import` path is taken.
// ═══════════════════════════════════════════════════════════════

import Module from 'module';

const ModuleAny = Module as unknown as {
  _load: (request: string, parent: NodeJS.Module | null, isMain?: boolean) => unknown;
};

const origLoad = ModuleAny._load.bind(ModuleAny);

// Registry of stubs for '@/...' paths that production code requires
// via the CommonJS path. Each stub provides the minimal surface area
// needed by the calling code.
const aliasStubs: Record<string, unknown> = {
  '@/store/dirty-store': {
    useDirtyStore: Object.assign(
      () => ({ dirty: false }),
      {
        getState: () => ({
          dirty: false,
          editRevision: 0,
          lastSavedRevision: 0,
          savingRevision: null,
          markDirty: () => {},
          markClean: () => {},
          saveStarted: () => {},
          saveSucceeded: () => {},
          resetOnLoad: () => {},
          setCurrentProjectId: () => {},
        }),
        setState: () => {},
        subscribe: () => () => {},
      },
    ),
  },
  '@/lib/canva-constants': {
    GAME_TYPES: ['memory-game', 'matching-game', 'fill-blank-game', 'word-search-game',
      'true-false-game', 'drag-drop-game', 'crossword-game', 'team-buzzer-game',
      'sortir-game', 'roda-game'] as readonly string[],
  },
};

ModuleAny._load = function (
  request: string,
  parent: NodeJS.Module | null,
  isMain?: boolean,
): unknown {
  if (typeof request === 'string' && request in aliasStubs) {
    return aliasStubs[request];
  }
  return origLoad(request, parent, isMain);
};
