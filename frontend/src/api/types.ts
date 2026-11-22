/**
 * API contract types. These mirror the backend DTOs
 * (backend/src/modules/<module>/*.ts); see docs/03-decisions.md for why they
 * are duplicated instead of shared.
 */

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT';

export interface Employee {
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
  employmentType: EmploymentType;
  /** YYYY-MM-DD */
  hireDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryChange {
  id: number;
  oldSalary: number;
  oldCurrency: string;
  newSalary: number;
  newCurrency: string;
  reason: string | null;
  changedAt: string;
}

export interface EmployeeDetail extends Employee {
  salaryHistory: SalaryChange[];
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export type SortField =
  | 'employeeCode'
  | 'firstName'
  | 'lastName'
  | 'jobTitle'
  | 'department'
  | 'country'
  | 'salary'
  | 'hireDate';

export interface EmployeeListParams {
  page: number;
  pageSize: number;
  search?: string;
  country?: string;
  department?: string;
  jobTitle?: string;
  sortBy?: SortField;
  sortOrder?: 'asc' | 'desc';
}

export interface EmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  department: string;
  country: string;
  salary: number;
  employmentType: EmploymentType;
  hireDate: string;
}

export type EmployeeUpdate = Partial<EmployeeInput> & { salaryChangeReason?: string };

export interface Country {
  code: string;
  name: string;
  currency: string;
}

export interface Meta {
  countries: Country[];
  employmentTypes: EmploymentType[];
  departments: string[];
  jobTitles: string[];
  currency: { ratesAsOf: string; usdRates: Record<string, number> };
}

export interface PayStats {
  headcount: number;
  min: number | null;
  max: number | null;
  average: number | null;
  median: number | null;
  p25: number | null;
  p75: number | null;
}

export interface SummaryInsight {
  headcount: number;
  countries: number;
  departments: number;
  jobTitles: number;
  totalPayrollUsd: number;
  averageSalaryUsd: number | null;
  medianSalaryUsd: number | null;
  ratesAsOf: string;
}

export interface CountryInsight extends PayStats {
  country: string;
  countryName: string;
  currency: string;
  averageUsd: number | null;
  medianUsd: number | null;
  totalPayrollUsd: number;
}

export interface GroupInsight extends PayStats {
  name: string;
}

export interface GroupedInsights {
  country: string | null;
  currency: string;
  ratesAsOf: string;
  groups: GroupInsight[];
}

export interface HistogramBucket {
  min: number;
  max: number;
  count: number;
}

export interface DistributionInsight {
  country: string | null;
  currency: string;
  ratesAsOf: string;
  stats: PayStats;
  buckets: HistogramBucket[];
}

export interface InsightFilters {
  country?: string;
  department?: string;
  jobTitle?: string;
}
