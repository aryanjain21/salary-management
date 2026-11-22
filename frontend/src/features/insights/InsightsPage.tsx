import { Autocomplete, Grid, MenuItem, Stack, TextField } from '@mui/material';
import { ErrorState } from '../../components/ErrorState';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import {
  useCountryInsights,
  useDepartmentInsights,
  useDistributionInsight,
  useJobTitleInsights,
  useMeta,
  useSummaryInsight,
} from '../../hooks/useInsights';
import { formatDate } from '../../utils/format';
import { CountryComparison } from './CountryComparison';
import { DepartmentChart } from './DepartmentChart';
import { DistributionChart } from './DistributionChart';
import { RoleExplorer } from './RoleExplorer';
import { SummaryCards } from './SummaryCards';
import { useInsightFilters } from './useInsightFilters';

export function InsightsPage() {
  const { filters, setFilters } = useInsightFilters();
  const meta = useMeta();
  const summary = useSummaryInsight();
  const countries = useCountryInsights();
  const jobTitles = useJobTitleInsights(filters);
  const departments = useDepartmentInsights({ country: filters.country });
  const distribution = useDistributionInsight(filters);

  const country = meta.data?.countries.find((c) => c.code === filters.country);
  const currencyNote = country
    ? `Figures in ${country.currency} (local currency for ${country.name})`
    : `All countries, converted to USD at reference rates${
        meta.data ? ` as of ${formatDate(meta.data.currency.ratesAsOf)}` : ''
      }`;

  const firstError = [summary, countries, jobTitles, departments, distribution].find(
    (q) => q.isError,
  );

  return (
    <>
      <PageHeader
        title="Pay insights"
        subtitle="How ACME pays people across countries, roles and departments"
      />

      {firstError && (
        <ErrorState
          title="Could not load insights"
          error={firstError.error}
          onRetry={() => void firstError.refetch()}
        />
      )}

      <Stack spacing={3}>
        <SummaryCards summary={summary.data} />

        <SectionCard
          title="Pay by country"
          subtitle="Local currency per country, with a USD median for comparison. Select a country to explore it below."
        >
          <CountryComparison
            countries={countries.data}
            onSelectCountry={(code) => setFilters({ country: code })}
          />
        </SectionCard>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            select
            label="Country"
            size="small"
            value={filters.country ?? ''}
            onChange={(e) => setFilters({ country: e.target.value || undefined })}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">All countries (USD)</MenuItem>
            {meta.data?.countries.map((c) => (
              <MenuItem key={c.code} value={c.code}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
          <Autocomplete
            options={meta.data?.departments ?? []}
            value={filters.department ?? null}
            onChange={(_e, value) => setFilters({ department: value ?? undefined })}
            renderInput={(props) => (
              <TextField {...props} label="Department" size="small" placeholder="All departments" />
            )}
            sx={{ minWidth: 240 }}
          />
        </Stack>

        <SectionCard title="Pay by job title" subtitle={currencyNote}>
          <RoleExplorer data={jobTitles.data} />
        </SectionCard>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <SectionCard title="Salary distribution" subtitle={currencyNote}>
              <DistributionChart data={distribution.data} />
            </SectionCard>
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <SectionCard title="Pay by department" subtitle={currencyNote}>
              <DepartmentChart data={departments.data} />
            </SectionCard>
          </Grid>
        </Grid>
      </Stack>
    </>
  );
}
