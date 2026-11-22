import type { Employee, EmployeeDetail, Meta, Paginated } from '../api/types';

let nextId = 1;

export function makeEmployee(overrides: Partial<Employee> = {}): Employee {
  const id = overrides.id ?? nextId++;
  const firstName = overrides.firstName ?? 'Priya';
  const lastName = overrides.lastName ?? 'Sharma';
  return {
    id,
    employeeCode: `EMP-${String(id).padStart(5, '0')}`,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    email: `${firstName}.${lastName}.${id}@acme.example`.toLowerCase(),
    jobTitle: 'Software Engineer',
    department: 'Engineering',
    country: 'IN',
    currency: 'INR',
    salary: 2_400_000,
    salaryUsd: 28_743,
    employmentType: 'FULL_TIME',
    hireDate: '2024-04-01',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function makeEmployeeDetail(overrides: Partial<EmployeeDetail> = {}): EmployeeDetail {
  return { ...makeEmployee(overrides), salaryHistory: [], ...overrides };
}

export function page<T>(data: T[], overrides: Partial<Paginated<T>['meta']> = {}): Paginated<T> {
  return {
    data,
    meta: { page: 1, pageSize: 25, total: data.length, totalPages: 1, ...overrides },
  };
}

export const META: Meta = {
  countries: [
    { code: 'US', name: 'United States', currency: 'USD' },
    { code: 'IN', name: 'India', currency: 'INR' },
    { code: 'DE', name: 'Germany', currency: 'EUR' },
  ],
  employmentTypes: ['FULL_TIME', 'PART_TIME', 'CONTRACT'],
  departments: ['Engineering', 'Sales'],
  jobTitles: ['Account Executive', 'Software Engineer'],
  currency: { ratesAsOf: '2026-01-01', usdRates: { USD: 1, INR: 83.5, EUR: 0.92 } },
};
