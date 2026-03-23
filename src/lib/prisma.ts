import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

// Automatically connects to Turso in prod, or falls back to local dev.db
const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:./dev.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const adapter = new PrismaLibSql(libsql);

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
console.log('--- PRISMA CLIENT INITIALIZED ---');
