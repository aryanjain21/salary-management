import { z } from 'zod';
import { EMPLOYMENT_TYPES } from '../../domain/employment';
import { countryCode, optionalText } from '../../http/schemas';
import { SORTABLE_FIELDS } from './employee.types';

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

const requiredText = z.string().trim().min(1, 'Required').max(100);

/** Calendar date "YYYY-MM-DD", stored as UTC midnight. */
const calendarDate = z.iso
  .date()
  .transform((value) => new Date(`${value}T00:00:00Z`))
  .refine((date) => date.getUTCFullYear() >= 1950, { message: 'Date must be after 1950' });

/**
 * Currency and employee code are intentionally not accepted from clients:
 * currency is derived from country and the code is assigned by the server.
 */
export const createEmployeeSchema = z.object({
  firstName: requiredText,
  lastName: requiredText,
  email: z.string().trim().toLowerCase().pipe(z.email('Invalid email address')),
  jobTitle: requiredText,
  department: requiredText,
  country: countryCode,
  salary: z
    .number()
    .int('Salary must be a whole number')
    .positive('Salary must be greater than zero')
    .max(1_000_000_000),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  hireDate: calendarDate,
});

export type CreateEmployeeInput = z.output<typeof createEmployeeSchema>;

export const updateEmployeeSchema = createEmployeeSchema
  .partial()
  .extend({ salaryChangeReason: z.string().trim().max(500).optional() })
  .refine(
    ({ salaryChangeReason: _reason, ...fields }) =>
      Object.values(fields).some((v) => v !== undefined),
    { message: 'Provide at least one field to update' },
  );

export type UpdateEmployeeInput = z.output<typeof updateEmployeeSchema>;
