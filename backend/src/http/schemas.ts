import { z } from 'zod';
import { isSupportedCountry } from '../domain/countries';

/** Optional free-text query value; empty strings are treated as absent. */
export const optionalText = z
  .string()
  .trim()
  .max(100)
  .optional()
  .transform((v) => (v === '' ? undefined : v));

/** ISO-2 country code we operate in, normalized to upper case. */
export const countryCode = z
  .string()
  .trim()
  .toUpperCase()
  .refine(isSupportedCountry, { message: 'Unsupported country' });
