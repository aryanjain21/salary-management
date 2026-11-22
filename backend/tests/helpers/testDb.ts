import { randomUUID } from 'node:crypto';
import { readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { PrismaClient } from '@prisma/client';
import { createPrismaClient } from '../../src/db/prisma';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../prisma/migrations');

function migrationStatements(): string[] {
  return readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .flatMap((dir) =>
      readFileSync(path.join(MIGRATIONS_DIR, dir, 'migration.sql'), 'utf8').split(';'),
    )
    .map((sql) => sql.trim())
    .filter(Boolean);
}

export interface TestDatabase {
  prisma: PrismaClient;
  /** Remove all rows; call in beforeEach for isolation between tests. */
  reset(): Promise<void>;
  destroy(): Promise<void>;
}

/**
 * Create an isolated SQLite database file with the real migrations applied.
 * Each test file gets its own database, so files can run in parallel.
 */
export async function createTestDatabase(): Promise<TestDatabase> {
  const file = path.join(tmpdir(), `acme-salary-test-${randomUUID()}.db`);
  const prisma = createPrismaClient(`file:${file}`);

  for (const statement of migrationStatements()) {
    await prisma.$executeRawUnsafe(statement);
  }

  return {
    prisma,
    async reset() {
      await prisma.salaryChange.deleteMany();
      await prisma.employee.deleteMany();
    },
    async destroy() {
      await prisma.$disconnect();
      rmSync(file, { force: true });
      rmSync(`${file}-journal`, { force: true });
    },
  };
}
