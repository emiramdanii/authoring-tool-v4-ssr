// ═══════════════════════════════════════════════════════════════════════
// PRISMA CLIENT — Singleton pattern for database access
// ═══════════════════════════════════════════════════════════════════════
// Prevents multiple PrismaClient instances in development (hot reload).
// Uses globalThis to persist the client across HMR cycles.
// ═══════════════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
