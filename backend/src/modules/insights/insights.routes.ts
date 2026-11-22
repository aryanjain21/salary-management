import { Router } from 'express';
import { parseInput } from '../../http/validation';
import { distributionQuerySchema, insightFiltersSchema } from './insights.schema';
import type { InsightsService } from './insights.service';

export function createInsightsRouter(service: InsightsService): Router {
  const router = Router();

  router.get('/summary', async (_req, res) => {
    res.json(await service.summary());
  });

  router.get('/by-country', async (_req, res) => {
    res.json(await service.byCountry());
  });

  router.get('/by-job-title', async (req, res) => {
    res.json(await service.byJobTitle(parseInput(insightFiltersSchema, req.query)));
  });

  router.get('/by-department', async (req, res) => {
    res.json(await service.byDepartment(parseInput(insightFiltersSchema, req.query)));
  });

  router.get('/distribution', async (req, res) => {
    const { buckets, ...filters } = parseInput(distributionQuerySchema, req.query);
    res.json(await service.distribution(filters, buckets));
  });

  return router;
}
