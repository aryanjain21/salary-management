import { findCountry } from '../../domain/countries';
import { RATES_AS_OF, toUsd } from '../../domain/currency';
import { groupBy, histogram, summarize, type HistogramBucket } from '../../domain/stats';
import type { InsightFilters, InsightsRepository, PayStats, SalaryRow } from './insights.types';

const roundOrNull = (v: number | null) => (v === null ? null : Math.round(v));

export function payStats(values: readonly number[]): PayStats {
  const s = summarize(values);
  return {
    headcount: s.count,
    min: s.min,
    max: s.max,
    average: roundOrNull(s.mean),
    median: roundOrNull(s.median),
    p25: roundOrNull(s.p25),
    p75: roundOrNull(s.p75),
  };
}

const usdOf = (row: SalaryRow) => toUsd(row.salary, row.currency);

/**
 * Salaries can only be compared directly within one currency. When the
 * caller filters by country we report in that country's currency; otherwise
 * every salary is converted to USD at the reference rate first.
 */
function inReportingCurrency(rows: SalaryRow[], country?: string) {
  if (country) {
    return {
      currency: findCountry(country)?.currency ?? 'USD',
      valueOf: (row: SalaryRow) => row.salary,
    };
  }
  return { currency: 'USD', valueOf: usdOf };
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

export interface DistributionInsight {
  country: string | null;
  currency: string;
  ratesAsOf: string;
  stats: PayStats;
  buckets: HistogramBucket[];
}

export class InsightsService {
  constructor(private readonly repo: InsightsRepository) {}

  async summary(): Promise<SummaryInsight> {
    const rows = await this.repo.salaryRows({});
    const usd = rows.map(usdOf);
    const stats = payStats(usd);
    return {
      headcount: rows.length,
      countries: new Set(rows.map((r) => r.country)).size,
      departments: new Set(rows.map((r) => r.department)).size,
      jobTitles: new Set(rows.map((r) => r.jobTitle)).size,
      totalPayrollUsd: usd.reduce((sum, v) => sum + v, 0),
      averageSalaryUsd: stats.average,
      medianSalaryUsd: stats.median,
      ratesAsOf: RATES_AS_OF,
    };
  }

  /** Per-country statistics in local currency, plus USD equivalents for comparison. */
  async byCountry(): Promise<CountryInsight[]> {
    const rows = await this.repo.salaryRows({});
    return [...groupBy(rows, (r) => r.country)]
      .map(([country, group]) => {
        const currency = group[0]!.currency;
        const stats = payStats(group.map((r) => r.salary));
        return {
          country,
          countryName: findCountry(country)?.name ?? country,
          currency,
          ...stats,
          averageUsd: stats.average === null ? null : toUsd(stats.average, currency),
          medianUsd: stats.median === null ? null : toUsd(stats.median, currency),
          totalPayrollUsd: group.reduce((sum, r) => sum + usdOf(r), 0),
        };
      })
      .sort((a, b) => b.headcount - a.headcount || a.country.localeCompare(b.country));
  }

  byJobTitle(filters: InsightFilters): Promise<GroupedInsights> {
    return this.grouped(filters, (r) => r.jobTitle);
  }

  byDepartment(filters: InsightFilters): Promise<GroupedInsights> {
    return this.grouped(filters, (r) => r.department);
  }

  async distribution(filters: InsightFilters, buckets: number): Promise<DistributionInsight> {
    const rows = await this.repo.salaryRows(filters);
    const { currency, valueOf } = inReportingCurrency(rows, filters.country);
    const values = rows.map(valueOf);
    return {
      country: filters.country ?? null,
      currency,
      ratesAsOf: RATES_AS_OF,
      stats: payStats(values),
      buckets: histogram(values, buckets),
    };
  }

  /** Group salaries and rank groups by median pay (highest first). */
  private async grouped(
    filters: InsightFilters,
    keyOf: (row: SalaryRow) => string,
  ): Promise<GroupedInsights> {
    const rows = await this.repo.salaryRows(filters);
    const { currency, valueOf } = inReportingCurrency(rows, filters.country);
    const groups = [...groupBy(rows, keyOf)]
      .map(([name, group]) => ({ name, ...payStats(group.map(valueOf)) }))
      .sort((a, b) => (b.median ?? 0) - (a.median ?? 0) || a.name.localeCompare(b.name));
    return { country: filters.country ?? null, currency, ratesAsOf: RATES_AS_OF, groups };
  }
}
