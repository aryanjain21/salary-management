import type { EmployeeListParams, InsightFilters } from './types';

/** Centralized query keys so invalidation after mutations stays consistent. */
export const queryKeys = {
  employees: {
    all: ['employees'] as const,
    list: (params: EmployeeListParams) => ['employees', 'list', params] as const,
    detail: (id: number) => ['employees', 'detail', id] as const,
  },
  insights: {
    all: ['insights'] as const,
    summary: () => ['insights', 'summary'] as const,
    byCountry: () => ['insights', 'by-country'] as const,
    byJobTitle: (filters: InsightFilters) => ['insights', 'by-job-title', filters] as const,
    byDepartment: (filters: InsightFilters) => ['insights', 'by-department', filters] as const,
    distribution: (filters: InsightFilters) => ['insights', 'distribution', filters] as const,
  },
  meta: ['meta'] as const,
};
