import { z } from 'zod';
import { countryCode, optionalText } from '../../http/schemas';

export const insightFiltersSchema = z.object({
  country: countryCode.optional(),
  department: optionalText,
  jobTitle: optionalText,
});

export const distributionQuerySchema = insightFiltersSchema.extend({
  buckets: z.coerce.number().int().min(3).max(30).default(12),
});
