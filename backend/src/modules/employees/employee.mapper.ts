import { toUsd } from '../../domain/currency';
import type { EmployeeRecord, EmployeeWithHistory, SalaryChangeRecord } from './employee.types';

export interface EmployeeDto {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  jobTitle: string;
  department: string;
  country: string;
  currency: string;
  salary: number;
  salaryUsd: number;
  employmentType: string;
  /** Calendar date, YYYY-MM-DD */
  hireDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryChangeDto {
  id: number;
  oldSalary: number;
  newSalary: number;
  currency: string;
  reason: string | null;
  changedAt: string;
}

export interface EmployeeDetailDto extends EmployeeDto {
  salaryHistory: SalaryChangeDto[];
}

export function toEmployeeDto(e: EmployeeRecord): EmployeeDto {
  return {
    id: e.id,
    employeeCode: e.employeeCode,
    firstName: e.firstName,
    lastName: e.lastName,
    fullName: `${e.firstName} ${e.lastName}`,
    email: e.email,
    jobTitle: e.jobTitle,
    department: e.department,
    country: e.country,
    currency: e.currency,
    salary: e.salary,
    salaryUsd: toUsd(e.salary, e.currency),
    employmentType: e.employmentType,
    hireDate: e.hireDate.toISOString().slice(0, 10),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

function toSalaryChangeDto(c: SalaryChangeRecord): SalaryChangeDto {
  return {
    id: c.id,
    oldSalary: c.oldSalary,
    newSalary: c.newSalary,
    currency: c.currency,
    reason: c.reason,
    changedAt: c.changedAt.toISOString(),
  };
}

export function toEmployeeDetailDto(e: EmployeeWithHistory): EmployeeDetailDto {
  return { ...toEmployeeDto(e), salaryHistory: e.salaryChanges.map(toSalaryChangeDto) };
}
