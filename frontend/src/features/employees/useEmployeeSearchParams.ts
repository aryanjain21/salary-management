import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import type { EmployeeListParams, SortField } from '../../api/types';

const SORT_FIELDS: SortField[] = [
  'employeeCode',
  'firstName',
  'lastName',
  'jobTitle',
  'department',
  'country',
  'salary',
  'hireDate',
];
const PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;

function positiveInt(value: string | null, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

/**
 * Directory state lives in the URL, so a filtered view can be bookmarked,
 * shared with a colleague, and survives a page refresh.
 */
export function useEmployeeSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo<EmployeeListParams>(() => {
    const pageSize = positiveInt(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE);
    const sortBy = searchParams.get('sortBy') as SortField | null;
    const sortOrder = searchParams.get('sortOrder');
    return {
      page: positiveInt(searchParams.get('page'), 1),
      pageSize: PAGE_SIZES.includes(pageSize) ? pageSize : DEFAULT_PAGE_SIZE,
      search: searchParams.get('search') ?? undefined,
      country: searchParams.get('country') ?? undefined,
      department: searchParams.get('department') ?? undefined,
      jobTitle: searchParams.get('jobTitle') ?? undefined,
      sortBy: sortBy && SORT_FIELDS.includes(sortBy) ? sortBy : 'lastName',
      sortOrder: sortOrder === 'desc' ? 'desc' : 'asc',
    };
  }, [searchParams]);

  /** Merge changes into the URL. Any change other than paging resets to page 1. */
  const update = useCallback(
    (changes: Partial<EmployeeListParams>) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(changes)) {
            if (value === undefined || value === null || value === '') next.delete(key);
            else next.set(key, String(value));
          }
          if (!('page' in changes)) next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => {
    update({ search: undefined, country: undefined, department: undefined, jobTitle: undefined });
  }, [update]);

  const hasFilters = Boolean(
    params.search || params.country || params.department || params.jobTitle,
  );

  /** The employee open in the detail drawer (?employee=42), kept separate from list params. */
  const selectedId = positiveInt(searchParams.get('employee'), 0) || null;

  const selectEmployee = useCallback(
    (id: number | null) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        if (id === null) next.delete('employee');
        else next.set('employee', String(id));
        return next;
      });
    },
    [setSearchParams],
  );

  return {
    params,
    update,
    clearFilters,
    hasFilters,
    pageSizes: PAGE_SIZES,
    selectedId,
    selectEmployee,
  };
}
