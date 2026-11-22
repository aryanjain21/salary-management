import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { insightsApi, metaApi } from '../api/insights';
import { queryKeys } from '../api/queryKeys';
import type { InsightFilters } from '../api/types';

export function useMeta() {
  return useQuery({ queryKey: queryKeys.meta, queryFn: metaApi.get, staleTime: 5 * 60_000 });
}

export function useSummaryInsight() {
  return useQuery({ queryKey: queryKeys.insights.summary(), queryFn: insightsApi.summary });
}

export function useCountryInsights() {
  return useQuery({ queryKey: queryKeys.insights.byCountry(), queryFn: insightsApi.byCountry });
}

export function useJobTitleInsights(filters: InsightFilters) {
  return useQuery({
    queryKey: queryKeys.insights.byJobTitle(filters),
    queryFn: () => insightsApi.byJobTitle(filters),
    placeholderData: keepPreviousData,
  });
}

export function useDepartmentInsights(filters: InsightFilters) {
  return useQuery({
    queryKey: queryKeys.insights.byDepartment(filters),
    queryFn: () => insightsApi.byDepartment(filters),
    placeholderData: keepPreviousData,
  });
}

export function useDistributionInsight(filters: InsightFilters) {
  return useQuery({
    queryKey: queryKeys.insights.distribution(filters),
    queryFn: () => insightsApi.distribution(filters),
    placeholderData: keepPreviousData,
  });
}
