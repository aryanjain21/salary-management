import { z } from 'zod';
import { isSupportedCountry } from '../../domain/countries';
import { SORTABLE_FIELDS } from './employee.types';

const optionalText = z
  .string()
  .trim()
  .max(100)
  .optional()
  .transform((v) => (v === '' ? undefined : v));

const countryCode = z
  .string()
  .trim()
  .toUpperCase()
  .refine(isSupportedCountry, { message: 'Unsupported country' });

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listEmployeesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: optionalText,
  country: countryCode.optional(),
  department: optionalText,
  jobTitle: optionalText,
  sortBy: z.enum(SORTABLE_FIELDS).default('lastName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type ListEmployeesQuery = z.output<typeof listEmployeesQuerySchema>;
