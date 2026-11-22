import { createApp } from '../../src/app';
import { silentLogger } from './logger';
import { createTestDatabase, type TestDatabase } from './testDb';

export async function createTestApp(): Promise<{
  app: ReturnType<typeof createApp>;
  db: TestDatabase;
}> {
  const db = await createTestDatabase();
  const app = createApp({
    corsOrigin: 'http://localhost:5173',
    logger: silentLogger,
    prisma: db.prisma,
  });
  return { app, db };
}
