import type { EmploymentType } from '../../domain/employment';

/** Employee as stored. Mirrors the Prisma model so repositories can return rows as-is. */
export interface EmployeeRecord {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  department: string;
  country: string;
  currency: string;
  salary: number;
  employmentType: string;
  hireDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalaryChangeRecord {
  id: number;
  employeeId: number;
  oldSalary: number;
  newSalary: number;
  currency: string;
  reason: string | null;
  changedAt: Date;
}

export interface EmployeeWithHistory extends EmployeeRecord {
  salaryChanges: SalaryChangeRecord[];
}

export const SORTABLE_FIELDS = [
  'employeeCode',
  'firstName',
  'lastName',
  'jobTitle',
  'department',
  'country',
  'salary',
  'hireDate',
] as const;

export type SortField = (typeof SORTABLE_FIELDS)[number];

export interface EmployeeFilters {
  search?: string;
  country?: string;
  department?: string;
  jobTitle?: string;
}

export interface ListEmployeesParams extends EmployeeFilters {
  page: number;
  pageSize: number;
  sortBy: SortField;
  sortOrder: 'asc' | 'desc';
}

export interface NewEmployee {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  department: string;
  country: string;
  currency: string;
  salary: number;
  employmentType: EmploymentType;
  hireDate: Date;
}

export type EmployeeChanges = Partial<Omit<NewEmployee, 'employeeCode'>>;

export interface NewSalaryChange {
  oldSalary: number;
  newSalary: number;
  currency: string;
  reason: string | null;
}

export interface EmployeeRepository {
  list(params: ListEmployeesParams): Promise<{ items: EmployeeRecord[]; total: number }>;
  findById(id: number): Promise<EmployeeWithHistory | null>;
  create(data: NewEmployee): Promise<EmployeeRecord>;
  /** Apply changes and, if given, append a salary change, atomically. */
  update(
    id: number,
    changes: EmployeeChanges,
    salaryChange?: NewSalaryChange,
  ): Promise<EmployeeRecord>;
  delete(id: number): Promise<void>;
  nextEmployeeCode(): Promise<string>;
}
