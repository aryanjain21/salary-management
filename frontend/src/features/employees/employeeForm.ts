import { z } from 'zod';
import type { EmployeeDetail, EmployeeInput, EmployeeUpdate } from '../../api/types';

const required = (label: string) =>
  z.string().trim().min(1, `${label} is required`).max(100, `${label} is too long`);

/**
 * Client-side validation mirrors the API rules so most mistakes are caught
 * before a round trip; the API remains the source of truth.
 */
export const employeeFormSchema = z.object({
  firstName: required('First name'),
  lastName: required('Last name'),
  email: z.string().trim().min(1, 'Email is required').pipe(z.email('Enter a valid email address')),
  jobTitle: required('Job title'),
  department: required('Department'),
  country: z.string().min(1, 'Select a country'),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT']),
  salary: z
    .string()
    .trim()
    .min(1, 'Salary is required')
    .transform((value) => Number(value.replace(/[,\s]/g, '')))
    .pipe(
      z
        .number({ error: 'Enter a number' })
        .int('Use a whole amount, without decimals')
        .positive('Salary must be greater than zero'),
    ),
  hireDate: z.iso.date('Enter a valid date'),
  salaryChangeReason: z.string().trim().max(500, 'Keep the reason under 500 characters'),
});

/** Raw form state (all strings, as typed). */
export type EmployeeFormValues = z.input<typeof employeeFormSchema>;
/** Parsed, validated form output. */
export type EmployeeFormOutput = z.output<typeof employeeFormSchema>;

export function todayIsoDate(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function toFormValues(
  employee?: EmployeeDetail,
  today = todayIsoDate(),
): EmployeeFormValues {
  return {
    firstName: employee?.firstName ?? '',
    lastName: employee?.lastName ?? '',
    email: employee?.email ?? '',
    jobTitle: employee?.jobTitle ?? '',
    department: employee?.department ?? '',
    country: employee?.country ?? '',
    employmentType: employee?.employmentType ?? 'FULL_TIME',
    salary: employee ? String(employee.salary) : '',
    hireDate: employee?.hireDate ?? today,
    salaryChangeReason: '',
  };
}

export function toCreateInput({
  salaryChangeReason: _reason,
  ...values
}: EmployeeFormOutput): EmployeeInput {
  return values;
}

const EDITABLE_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'jobTitle',
  'department',
  'country',
  'employmentType',
  'salary',
  'hireDate',
] as const;

/**
 * Build a PATCH body with only the fields that actually changed, so the
 * audit trail and updatedAt only move when something really changed. The
 * reason is only sent alongside a salary change.
 */
export function toUpdateInput(
  original: EmployeeDetail,
  values: EmployeeFormOutput,
): EmployeeUpdate {
  const changes: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    const next = field === 'email' ? values.email.toLowerCase() : values[field];
    if (next !== original[field]) changes[field] = values[field];
  }
  if ('salary' in changes && values.salaryChangeReason) {
    changes.salaryChangeReason = values.salaryChangeReason;
  }
  return changes as EmployeeUpdate;
}
