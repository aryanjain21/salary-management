/**
 * Seed the database with deterministic employees.
 *
 *   npm run db:seed                 # refuses to run if data already exists
 *   npm run db:seed -- --reset      # wipe and re-seed
 *   npm run db:seed -- --count=500  # custom size (default 10,000)
 */
import { createPrismaClient } from '../src/db/prisma';
import { generateEmployees } from '../src/seed/generateEmployees';

const BATCH_SIZE = 1_000;

function parseArgs(argv: string[]) {
  const countArg = argv.find((a) => a.startsWith('--count='));
  const count = countArg ? Number(countArg.split('=')[1]) : 10_000;
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error(`--count must be a positive integer, got "${countArg}"`);
  }
  return { count, reset: argv.includes('--reset') };
}

async function main() {
  const { count, reset } = parseArgs(process.argv.slice(2));
  const prisma = createPrismaClient();
  const started = performance.now();

  try {
    const existing = await prisma.employee.count();
    if (existing > 0 && !reset) {
      console.warn(
        `Database already has ${existing} employees. Re-run with --reset to replace them.`,
      );
      return;
    }

    const employees = generateEmployees({ count });

    await prisma.$transaction(async (tx) => {
      await tx.salaryChange.deleteMany();
      await tx.employee.deleteMany();
      for (let i = 0; i < employees.length; i += BATCH_SIZE) {
        await tx.employee.createMany({ data: employees.slice(i, i + BATCH_SIZE) });
      }
    });

    const seconds = ((performance.now() - started) / 1000).toFixed(2);
    console.warn(`Seeded ${employees.length} employees in ${seconds}s`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
