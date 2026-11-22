import type { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { COUNTRIES } from '../../domain/countries';
import { RATES_AS_OF, USD_RATES } from '../../domain/currency';
import { EMPLOYMENT_TYPES } from '../../domain/employment';

/**
 * Reference data for filter dropdowns and forms. Countries and employment
 * types are fixed; departments and job titles come from current data so new
 * values HR adds show up automatically.
 */
export function createMetaRouter(prisma: PrismaClient): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    const [departments, jobTitles] = await Promise.all([
      prisma.employee.findMany({
        distinct: ['department'],
        select: { department: true },
        orderBy: { department: 'asc' },
      }),
      prisma.employee.findMany({
        distinct: ['jobTitle'],
        select: { jobTitle: true },
        orderBy: { jobTitle: 'asc' },
      }),
    ]);

    res.json({
      countries: COUNTRIES,
      employmentTypes: EMPLOYMENT_TYPES,
      departments: departments.map((d) => d.department),
      jobTitles: jobTitles.map((j) => j.jobTitle),
      currency: { ratesAsOf: RATES_AS_OF, usdRates: USD_RATES },
    });
  });

  return router;
}
