import { Box, Skeleton } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import type { GroupedInsights } from '../../api/types';
import { formatMoney } from '../../utils/format';

export function DepartmentChart({ data }: { data: GroupedInsights | undefined }) {
  if (!data) return <Skeleton variant="rounded" height={300} />;

  const money = (v: number | null) => formatMoney(v, data.currency);
  return (
    <Box role="img" aria-label={`Median salary by department in ${data.currency}`}>
      <BarChart
        height={320}
        layout="horizontal"
        dataset={data.groups.map((g) => ({
          department: g.name,
          median: g.median ?? 0,
          p25: g.p25 ?? 0,
          p75: g.p75 ?? 0,
        }))}
        yAxis={[{ scaleType: 'band', dataKey: 'department', width: 130 }]}
        xAxis={[
          { valueFormatter: (v: number) => formatMoney(v, data.currency, { compact: true }) },
        ]}
        series={[
          { dataKey: 'p25', label: '25th percentile', valueFormatter: money },
          { dataKey: 'median', label: 'Median', valueFormatter: money },
          { dataKey: 'p75', label: '75th percentile', valueFormatter: money },
        ]}
        grid={{ vertical: true }}
      />
    </Box>
  );
}
