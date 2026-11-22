import { describe, expect, it } from 'vitest';
import { makeEmployeeDetail } from '../../test/fixtures';
import {
  employeeFormSchema,
  toCreateInput,
  toFormValues,
  toUpdateInput,
  todayIsoDate,
  type EmployeeFormValues,
} from './employeeForm';

const filled: EmployeeFormValues = {
  firstName: ' Priya ',
  lastName: 'Sharma',
  email: 'priya.sharma@acme.example',
  jobTitle: 'Software Engineer',
  department: 'Engineering',
  country: 'IN',
  employmentType: 'FULL_TIME',
  salary: '2,400,000',
  hireDate: '2024-04-01',
  salaryChangeReason: '',
};

const errorsFor = (values: EmployeeFormValues) => {
  const result = employeeFormSchema.safeParse(values);
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message]));
};

describe('employeeFormSchema', () => {
  it('trims text and parses salaries typed with separators', () => {
    const parsed = employeeFormSchema.parse(filled);

    expect(parsed.firstName).toBe('Priya');
    expect(parsed.salary).toBe(2_400_000);
  });

  it.each([
    ['', 'Salary is required'],
    ['abc', 'Enter a number'],
    ['1000.50', 'Use a whole amount, without decimals'],
    ['-5', 'Salary must be greater than zero'],
  ])('rejects salary %j with "%s"', (salary, message) => {
    expect(errorsFor({ ...filled, salary }).salary).toBe(message);
  });

  it('reports every missing required field', () => {
    const errors = errorsFor(toFormValues(undefined, '2026-01-01'));

    expect(Object.keys(errors).sort()).toEqual([
      'country',
      'department',
      'email',
      'firstName',
      'jobTitle',
      'lastName',
      'salary',
    ]);
  });
});

describe('form mapping', () => {
  it('prefills from an existing employee', () => {
    const employee = makeEmployeeDetail({ salary: 2_400_000, hireDate: '2020-02-02' });

    expect(toFormValues(employee)).toMatchObject({ salary: '2400000', hireDate: '2020-02-02' });
  });

  it('defaults a new hire date to today', () => {
    expect(toFormValues(undefined, '2026-03-04').hireDate).toBe('2026-03-04');
    expect(todayIsoDate(new Date('2026-03-04T23:00:00Z'))).toBe('2026-03-04');
  });

  it('builds a create payload without the change reason', () => {
    const input = toCreateInput(employeeFormSchema.parse(filled));

    expect(input).not.toHaveProperty('salaryChangeReason');
    expect(input.salary).toBe(2_400_000);
  });

  describe('toUpdateInput', () => {
    const original = makeEmployeeDetail({
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'priya.sharma@acme.example',
      salary: 2_400_000,
      hireDate: '2024-04-01',
    });
    const parse = (overrides: Partial<EmployeeFormValues>) =>
      employeeFormSchema.parse({ ...toFormValues(original), ...overrides });

    it('sends nothing when nothing changed', () => {
      expect(toUpdateInput(original, parse({}))).toEqual({});
    });

    it('sends only changed fields', () => {
      expect(toUpdateInput(original, parse({ jobTitle: 'Staff Engineer' }))).toEqual({
        jobTitle: 'Staff Engineer',
      });
    });

    it('includes the reason only with a salary change', () => {
      expect(
        toUpdateInput(original, parse({ salary: '2700000', salaryChangeReason: 'Promotion' })),
      ).toEqual({ salary: 2_700_000, salaryChangeReason: 'Promotion' });

      expect(
        toUpdateInput(original, parse({ jobTitle: 'Lead', salaryChangeReason: 'Promotion' })),
      ).toEqual({ jobTitle: 'Lead' });
    });

    it('treats an email that differs only by case as unchanged', () => {
      expect(toUpdateInput(original, parse({ email: 'Priya.Sharma@ACME.example' }))).toEqual({});
    });
  });
});
