// ═══════════════════════════════════════════════════════════════════════
// PRISMA CLIENT — Singleton pattern for database access
// ═══════════════════════════════════════════════════════════════════════
// Prevents multiple PrismaClient instances in development (hot reload).
// Uses globalThis to persist the client across HMR cycles.
//
// SANDBOX MODE: When SANDBOX_MODE=1, Prisma Client is NOT loaded to prevent
// OOM in constrained environments (~132MB engine). API routes that use prisma
// will get null → try/catch returns 500 → client-side fallback kicks in.
// Remove SANDBOX_MODE=1 from .env to re-enable full DB functionality.
// ═══════════════════════════════════════════════════════════════════════

import type { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// ── Sandbox guard: skip PrismaClient instantiation to avoid OOM ──
// Uses `import type` (zero-cost) + lazy require only when NOT in sandbox
// Sprint 8.6B: use `undefined` (not `null`) so the type matches
// `globalForPrisma.prisma: PrismaClient | undefined` and avoids
// PrismaClient | null not assignable errors.
let _prisma: PrismaClient | undefined = undefined;

function getPrisma(): PrismaClient {
  if (_prisma) return _prisma;
  if (process.env.SANDBOX_MODE === '1') {
    throw new Error('Database tidak tersedia dalam mode sandbox');
  }
  // Lazy-load PrismaClient only when actually needed
  const { PrismaClient: PC } = require('@prisma/client');
  const client = globalForPrisma.prisma ?? new PC();
  _prisma = client;
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }
  return client;
}

// Export a Proxy so `prisma.project.findMany()` triggers lazy load + throws in sandbox
// Sprint 8.6B: cast through `unknown` to bypass the PrismaClient index-signature
// mismatch (PrismaClient's type doesn't expose a string index signature, but the
// Proxy needs to forward arbitrary property access).
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    return (client as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export default prisma;
