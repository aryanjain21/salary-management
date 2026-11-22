import { Box, Skeleton, Typography } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import type { DistributionInsight } from '../../api/types';
import { formatMoney, formatNumber } from '../../utils/format';

export function DistributionChart({ data }: { data: DistributionInsight | undefined }) {
  if (!data) return <Skeleton variant="rounded" height={300} />;
  if (data.stats.headcount === 0) {
    return <Typography color="text.secondary">No employees match these filters.</Typography>;
  }

  const compact = (v: number | null) => formatMoney(v, data.currency, { compact: true });
  const buckets = data.buckets.map((b) => ({
    range: `${compact(b.min)}–${compact(b.max)}`,
    count: b.count,
  }));

  return (
    <>
      <Typography variant="body2" sx={{ mb: 1 }}>
        Median <strong>{formatMoney(data.stats.median, data.currency)}</strong> · middle 50% earn
        between <strong>{formatMoney(data.stats.p25, data.currency)}</strong> and{' '}
        <strong>{formatMoney(data.stats.p75, data.currency)}</strong> ·{' '}
        {formatNumber(data.stats.headcount)} employees
      </Typography>
      <Box role="img" aria-label={`Salary distribution in ${data.currency}`}>
        <BarChart
          height={280}
          dataset={buckets}
          xAxis={[{ scaleType: 'band', dataKey: 'range', tickLabelStyle: { fontSize: 11 } }]}
          yAxis={[{ label: 'Employees', width: 60 }]}
          series={[{ dataKey: 'count', label: 'Employees' }]}
          hideLegend
        />
      </Box>
    </>
  );
}
