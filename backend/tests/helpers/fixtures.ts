import type { PrismaClient } from '@prisma/client';
import { currencyForCountry } from '../../src/domain/countries';
import type { EmployeeRecord, NewEmployee } from '../../src/modules/employees/employee.types';

let sequence = 0;

/** Build a valid employee; override only what the test cares about. */
export function buildEmployee(overrides: Partial<NewEmployee> = {}): NewEmployee {
  sequence += 1;
  const country = overrides.country ?? 'US';
  return {
    employeeCode: `EMP-${String(sequence).padStart(5, '0')}`,
    firstName: 'Test',
    lastName: `Person${sequence}`,
    email: `test.person${sequence}@acme.example`,
    jobTitle: 'Software Engineer',
    department: 'Engineering',
    country,
    currency: currencyForCountry(country),
    salary: 100_000,
    employmentType: 'FULL_TIME',
    hireDate: new Date('2020-01-15T00:00:00Z'),
    ...overrides,
  };
}

export async function insertEmployees(
  prisma: PrismaClient,
  employees: NewEmployee[],
): Promise<EmployeeRecord[]> {
  const created: EmployeeRecord[] = [];
  for (const data of employees) {
    created.push(await prisma.employee.create({ data }));
  }
  return created;
}
