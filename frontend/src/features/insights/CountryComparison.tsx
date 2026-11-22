import {
  Box,
  Grid,
  Link,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { Link as RouterLink } from 'react-router';
import type { CountryInsight } from '../../api/types';
import { formatMoney, formatNumber } from '../../utils/format';

interface CountryComparisonProps {
  countries: CountryInsight[] | undefined;
  onSelectCountry: (code: string) => void;
}

export function CountryComparison({ countries, onSelectCountry }: CountryComparisonProps) {
  if (!countries) return <Skeleton variant="rounded" height={320} />;

  const byMedianUsd = [...countries].sort((a, b) => (b.medianUsd ?? 0) - (a.medianUsd ?? 0));

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 7 }}>
        <TableContainer>
          <Table size="small" aria-label="Pay by country">
            <TableHead>
              <TableRow>
                <TableCell>Country</TableCell>
                <TableCell align="right">Employees</TableCell>
                <TableCell align="right">Median</TableCell>
                <TableCell align="right">Average</TableCell>
                <TableCell align="right">Range</TableCell>
                <TableCell align="right">Median (USD)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {countries.map((c) => (
                <TableRow key={c.country} hover>
                  <TableCell>
                    <Link
                      component="button"
                      type="button"
                      onClick={() => onSelectCountry(c.country)}
                      underline="hover"
                    >
                      {c.countryName}
                    </Link>
                  </TableCell>
                  <TableCell align="right">
                    <Link
                      component={RouterLink}
                      to={`/employees?country=${c.country}`}
                      underline="hover"
                      color="inherit"
                    >
                      {formatNumber(c.headcount)}
                    </Link>
                  </TableCell>
                  <TableCell align="right">{formatMoney(c.median, c.currency)}</TableCell>
                  <TableCell align="right">{formatMoney(c.average, c.currency)}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>
                    {formatMoney(c.min, c.currency, { compact: true })} –{' '}
                    {formatMoney(c.max, c.currency, { compact: true })}
                  </TableCell>
                  <TableCell align="right">{formatMoney(c.medianUsd, 'USD')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
      <Grid size={{ xs: 12, lg: 5 }}>
        <Box aria-label="Median salary by country in USD" role="img">
          <BarChart
            height={300}
            layout="horizontal"
            dataset={byMedianUsd.map((c) => ({
              country: c.countryName,
              medianUsd: c.medianUsd ?? 0,
            }))}
            yAxis={[{ scaleType: 'band', dataKey: 'country', width: 110 }]}
            xAxis={[{ valueFormatter: (v: number) => formatMoney(v, 'USD', { compact: true }) }]}
            series={[
              {
                dataKey: 'medianUsd',
                label: 'Median salary (USD)',
                valueFormatter: (v) => formatMoney(v, 'USD'),
              },
            ]}
            hideLegend
            grid={{ vertical: true }}
          />
        </Box>
      </Grid>
    </Grid>
  );
}
