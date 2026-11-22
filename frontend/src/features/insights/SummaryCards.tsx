import { Card, CardContent, Grid, Skeleton, Typography } from '@mui/material';
import type { SummaryInsight } from '../../api/types';
import { formatMoney, formatNumber } from '../../utils/format';

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4" component="p" sx={{ mt: 0.5 }}>
          {value}
        </Typography>
        {hint && (
          <Typography variant="caption" color="text.secondary">
            {hint}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export function SummaryCards({ summary }: { summary: SummaryInsight | undefined }) {
  if (!summary) {
    return (
      <Grid container spacing={2}>
        {[0, 1, 2, 3].map((i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Skeleton variant="rounded" height={110} />
          </Grid>
        ))}
      </Grid>
    );
  }

  const usdHint = 'USD at reference rates';
  return (
    <Grid container spacing={2} role="list" aria-label="Key figures">
      <Grid size={{ xs: 12, sm: 6, lg: 3 }} role="listitem">
        <StatCard
          label="Employees"
          value={formatNumber(summary.headcount)}
          hint={`${summary.departments} departments · ${summary.jobTitles} job titles`}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }} role="listitem">
        <StatCard label="Countries" value={formatNumber(summary.countries)} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }} role="listitem">
        <StatCard
          label="Annual payroll"
          value={formatMoney(summary.totalPayrollUsd, 'USD', { compact: true })}
          hint={usdHint}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }} role="listitem">
        <StatCard
          label="Median salary"
          value={formatMoney(summary.medianSalaryUsd, 'USD')}
          hint={usdHint}
        />
      </Grid>
    </Grid>
  );
}
