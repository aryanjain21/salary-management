import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import type { InsightFilters } from '../../api/types';

/** Dashboard filters live in the URL so an analysis can be shared as a link. */
export function useInsightFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<InsightFilters>(
    () => ({
      country: searchParams.get('country') ?? undefined,
      department: searchParams.get('department') ?? undefined,
    }),
    [searchParams],
  );

  const setFilters = useCallback(
    (changes: InsightFilters) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(changes)) {
            if (value) next.set(key, value);
            else next.delete(key);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return { filters, setFilters };
}
