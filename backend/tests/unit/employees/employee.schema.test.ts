import { describe, expect, it } from 'vitest';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
} from '../../../src/modules/employees/employee.schema';

const valid = {
  firstName: '  Priya ',
  lastName: 'Sharma',
  email: ' Priya.Sharma@ACME.example ',
  jobTitle: 'Software Engineer',
  department: 'Engineering',
  country: 'in',
  salary: 2_400_000,
  employmentType: 'FULL_TIME',
  hireDate: '2024-04-01',
};

const issuePaths = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  result.error?.issues.map((i) => i.path.join('.')) ?? [];

describe('createEmployeeSchema', () => {
  it('normalizes input', () => {
    const parsed = createEmployeeSchema.parse(valid);

    expect(parsed).toMatchObject({
      firstName: 'Priya',
      email: 'priya.sharma@acme.example',
      country: 'IN',
      hireDate: new Date('2024-04-01T00:00:00Z'),
    });
  });

  it('ignores client-supplied currency and employee code', () => {
    const parsed = createEmployeeSchema.parse({ ...valid, currency: 'EUR', employeeCode: 'X' });

    expect(parsed).not.toHaveProperty('currency');
    expect(parsed).not.toHaveProperty('employeeCode');
  });

  it.each([
    ['salary', { salary: 0 }],
    ['salary', { salary: 1000.5 }],
    ['salary', { salary: '100000' }],
    ['email', { email: 'not-an-email' }],
    ['country', { country: 'FR' }],
    ['employmentType', { employmentType: 'INTERN' }],
    ['hireDate', { hireDate: '01/04/2024' }],
    ['firstName', { firstName: '   ' }],
  ])('rejects invalid %s', (path, override) => {
    const result = createEmployeeSchema.safeParse({ ...valid, ...override });

    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain(path);
  });
});

describe('updateEmployeeSchema', () => {
  it('accepts a partial update', () => {
    expect(updateEmployeeSchema.parse({ salary: 2_500_000 })).toEqual({ salary: 2_500_000 });
  });

  it('rejects an empty update, even with only a reason', () => {
    expect(updateEmployeeSchema.safeParse({}).success).toBe(false);
    expect(updateEmployeeSchema.safeParse({ salaryChangeReason: 'x' }).success).toBe(false);
  });
});
