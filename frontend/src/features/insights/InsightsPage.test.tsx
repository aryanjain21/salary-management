import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type {
  CountryInsight,
  DistributionInsight,
  GroupedInsights,
  SummaryInsight,
} from '../../api/types';
import { META } from '../../test/fixtures';
import { renderApp } from '../../test/render';
import { server } from '../../test/server';

const SUMMARY: SummaryInsight = {
  headcount: 10_000,
  countries: 8,
  departments: 10,
  jobTitles: 25,
  totalPayrollUsd: 1_050_000_000,
  averageSalaryUsd: 105_000,
  medianSalaryUsd: 98_500,
  ratesAsOf: '2026-01-01',
};

const stats = { min: 1, max: 2, average: 1, median: 1, p25: 1, p75: 2 };

const COUNTRIES: CountryInsight[] = [
  {
    country: 'US',
    countryName: 'United States',
    currency: 'USD',
    headcount: 2_963,
    ...stats,
    median: 118_000,
    average: 119_255,
    averageUsd: 119_255,
    medianUsd: 118_000,
    totalPayrollUsd: 353_000_000,
  },
  {
    country: 'IN',
    countryName: 'India',
    currency: 'INR',
    headcount: 2_539,
    ...stats,
    median: 2_750_000,
    average: 2_791_385,
    averageUsd: 33_430,
    medianUsd: 32_934,
    totalPayrollUsd: 84_900_000,
  },
];

function grouped(country: string | null, currency: string, names: string[]): GroupedInsights {
  return {
    country,
    currency,
    ratesAsOf: '2026-01-01',
    groups: names.map((name, i) => ({
      name,
      headcount: 10 + i,
      min: 1_000,
      max: 9_000,
      average: 5_000,
      median: currency === 'INR' ? 4_860_700 : 150_000,
      p25: 4_000,
      p75: 6_000,
    })),
  };
}

const DISTRIBUTION: DistributionInsight = {
  country: null,
  currency: 'USD',
  ratesAsOf: '2026-01-01',
  stats: { headcount: 3, ...stats, median: 100_000, p25: 90_000, p75: 120_000 },
  buckets: [{ min: 80_000, max: 100_000, count: 3 }],
};

/** Mock every insights endpoint; record the query of filterable ones. */
function mockInsights() {
  const jobTitleRequests: URLSearchParams[] = [];
  server.use(
    http.get('/api/v1/meta', () => HttpResponse.json(META)),
    http.get('/api/v1/insights/summary', () => HttpResponse.json(SUMMARY)),
    http.get('/api/v1/insights/by-country', () => HttpResponse.json(COUNTRIES)),
    http.get('/api/v1/insights/by-job-title', ({ request }) => {
      const params = new URL(request.url).searchParams;
      jobTitleRequests.push(params);
      return HttpResponse.json(
        params.get('country') === 'IN'
          ? grouped('IN', 'INR', ['Staff Engineer'])
          : grouped(null, 'USD', ['Staff Engineer', 'Engineering Manager']),
      );
    }),
    http.get('/api/v1/insights/by-department', () =>
      HttpResponse.json(grouped(null, 'USD', ['Engineering'])),
    ),
    http.get('/api/v1/insights/distribution', () => HttpResponse.json(DISTRIBUTION)),
  );
  return { jobTitleRequests };
}

describe('InsightsPage', () => {
  it('shows key figures and pay by country', async () => {
    mockInsights();

    renderApp({ route: '/insights' });

    const figures = await screen.findByRole('list', { name: 'Key figures' });
    expect(within(figures).getByText('10,000')).toBeInTheDocument();
    expect(within(figures).getByText('$1.1B')).toBeInTheDocument();
    expect(within(figures).getByText('$98,500')).toBeInTheDocument();

    const table = await screen.findByRole('table', { name: 'Pay by country' });
    const india = within(table).getByRole('row', { name: /India/ });
    expect(within(india).getByText('₹2,750,000')).toBeInTheDocument();
    expect(within(india).getByText('$32,934')).toBeInTheDocument();
    expect(within(india).getByRole('link', { name: '2,539' })).toHaveAttribute(
      'href',
      '/employees?country=IN',
    );
  });

  it('defaults to a USD comparison across all countries', async () => {
    mockInsights();

    renderApp({ route: '/insights' });

    const roles = await screen.findByRole('table', { name: 'Pay by job title' });
    expect(within(roles).getAllByText('$150,000')).toHaveLength(2);
    expect(
      screen.getAllByText(/converted to USD at reference rates as of Jan 1, 2026/),
    ).not.toHaveLength(0);
  });

  it('answers "what do we pay this role in India?" in local currency', async () => {
    const { jobTitleRequests } = mockInsights();
    const { user, router } = renderApp({ route: '/insights' });
    const table = await screen.findByRole('table', { name: 'Pay by country' });

    await user.click(within(table).getByRole('button', { name: 'India' }));

    await waitFor(() => expect(jobTitleRequests.at(-1)?.get('country')).toBe('IN'));
    const roles = await screen.findByRole('table', { name: 'Pay by job title' });
    expect(await within(roles).findByText('₹4,860,700')).toBeInTheDocument();
    expect(screen.getAllByText('Figures in INR (local currency for India)')).not.toHaveLength(0);
    expect(router.state.location.search).toBe('?country=IN');
  });

  it('restores filters from a shared link', async () => {
    const { jobTitleRequests } = mockInsights();

    renderApp({ route: '/insights?country=IN&department=Engineering' });

    await waitFor(() => expect(jobTitleRequests.length).toBeGreaterThan(0));
    expect(jobTitleRequests[0]?.get('country')).toBe('IN');
    expect(jobTitleRequests[0]?.get('department')).toBe('Engineering');
  });

  it('shows an error when insights cannot be loaded', async () => {
    mockInsights();
    server.use(
      http.get('/api/v1/insights/summary', () =>
        HttpResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Boom' } }, { status: 500 }),
      ),
    );

    renderApp({ route: '/insights' });

    expect(await screen.findByText(/could not load insights/i)).toBeInTheDocument();
  });
});
