import { cleanParams, http } from './client';
import type {
  CountryInsight,
  DistributionInsight,
  GroupedInsights,
  InsightFilters,
  Meta,
  SummaryInsight,
} from './types';

export const insightsApi = {
  summary: async () => (await http.get<SummaryInsight>('/insights/summary')).data,

  byCountry: async () => (await http.get<CountryInsight[]>('/insights/by-country')).data,

  byJobTitle: async (filters: InsightFilters) =>
    (await http.get<GroupedInsights>('/insights/by-job-title', { params: cleanParams(filters) }))
      .data,

  byDepartment: async (filters: InsightFilters) =>
    (await http.get<GroupedInsights>('/insights/by-department', { params: cleanParams(filters) }))
      .data,

  distribution: async (filters: InsightFilters & { buckets?: number }) =>
    (
      await http.get<DistributionInsight>('/insights/distribution', {
        params: cleanParams(filters),
      })
    ).data,
};

export const metaApi = {
  get: async () => (await http.get<Meta>('/meta')).data,
};
