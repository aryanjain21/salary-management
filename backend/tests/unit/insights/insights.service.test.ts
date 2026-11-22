import { describe, expect, it } from 'vitest';
import { InsightsService, payStats } from '../../../src/modules/insights/insights.service';
import type {
  InsightFilters,
  InsightsRepository,
  SalaryRow,
} from '../../../src/modules/insights/insights.types';

class FakeInsightsRepository implements InsightsRepository {
  constructor(private readonly rows: SalaryRow[]) {}

  async salaryRows(f: InsightFilters): Promise<SalaryRow[]> {
    return this.rows.filter(
      (r) =>
        (!f.country || r.country === f.country) &&
        (!f.department || r.department === f.department) &&
        (!f.jobTitle || r.jobTitle === f.jobTitle),
    );
  }
}

const row = (
  country: string,
  currency: string,
  jobTitle: string,
  salary: number,
  department = 'Engineering',
): SalaryRow => ({ country, currency, jobTitle, salary, department });

/**
 * Hand-checked fixture. USD equivalents at reference rates:
 *   IN: 2,000,000 → 23,952 · 3,000,000 → 35,928 · 1,000,000 → 11,976
 *   DE: 70,000 EUR → 76,087
 */
const ROWS: SalaryRow[] = [
  row('IN', 'INR', 'Software Engineer', 2_000_000),
  row('IN', 'INR', 'Software Engineer', 3_000_000),
  row('IN', 'INR', 'QA Engineer', 1_000_000),
  row('US', 'USD', 'Software Engineer', 100_000),
  row('US', 'USD', 'Software Engineer', 140_000),
  row('US', 'USD', 'Account Executive', 80_000, 'Sales'),
  row('DE', 'EUR', 'Software Engineer', 70_000),
];

const service = new InsightsService(new FakeInsightsRepository(ROWS));

describe('InsightsService', () => {
  it('summary reports org-wide totals in USD', async () => {
    expect(await service.summary()).toEqual({
      headcount: 7,
      countries: 3,
      departments: 2,
      jobTitles: 3,
      totalPayrollUsd: 467_943,
      averageSalaryUsd: 66_849,
      medianSalaryUsd: 76_087,
      ratesAsOf: '2026-01-01',
    });
  });

  it('byCountry reports local-currency stats with USD equivalents, largest first', async () => {
    const result = await service.byCountry();

    expect(result.map((c) => c.country)).toEqual(['IN', 'US', 'DE']);
    expect(result[0]).toMatchObject({
      countryName: 'India',
      currency: 'INR',
      headcount: 3,
      min: 1_000_000,
      max: 3_000_000,
      average: 2_000_000,
      median: 2_000_000,
      averageUsd: 23_952,
      totalPayrollUsd: 71_856,
    });
    expect(result[1]).toMatchObject({ currency: 'USD', average: 106_667, median: 100_000 });
  });

  it('byJobTitle within a country uses local currency', async () => {
    const result = await service.byJobTitle({ country: 'IN' });

    expect(result.currency).toBe('INR');
    expect(result.groups).toEqual([
      expect.objectContaining({ name: 'Software Engineer', headcount: 2, median: 2_500_000 }),
      expect.objectContaining({ name: 'QA Engineer', headcount: 1, median: 1_000_000 }),
    ]);
  });

  it('byJobTitle across countries converts to USD before comparing', async () => {
    const result = await service.byJobTitle({});

    expect(result.currency).toBe('USD');
    // Ranked by median: comparing raw INR would wrongly put Software Engineer first.
    expect(result.groups.map((g) => [g.name, g.median])).toEqual([
      ['Account Executive', 80_000],
      ['Software Engineer', 76_087],
      ['QA Engineer', 11_976],
    ]);
  });

  it('byDepartment groups and filters', async () => {
    const result = await service.byDepartment({ country: 'US' });

    expect(result.groups.map((g) => [g.name, g.headcount, g.median])).toEqual([
      ['Engineering', 2, 120_000],
      ['Sales', 1, 80_000],
    ]);
  });

  it('distribution buckets salaries for the selected population', async () => {
    const result = await service.distribution({ country: 'US' }, 4);

    expect(result.currency).toBe('USD');
    expect(result.stats.headcount).toBe(3);
    expect(result.buckets).toEqual([
      { min: 80_000, max: 100_000, count: 1 },
      { min: 100_000, max: 120_000, count: 1 },
      { min: 120_000, max: 140_000, count: 0 },
      { min: 140_000, max: 160_000, count: 1 },
    ]);
  });

  it('handles an empty population without errors', async () => {
    const result = await service.distribution({ country: 'SG' }, 10);

    expect(result.currency).toBe('SGD');
    expect(result.stats).toEqual(payStats([]));
    expect(result.buckets).toEqual([]);
  });
});

describe('payStats', () => {
  it('rounds averages and percentiles to whole currency units', () => {
    expect(payStats([1, 2, 2])).toEqual({
      headcount: 3,
      min: 1,
      max: 2,
      average: 2,
      median: 2,
      p25: 2,
      p75: 2,
    });
  });
});
