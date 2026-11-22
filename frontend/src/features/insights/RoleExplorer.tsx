import {
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { GroupedInsights } from '../../api/types';
import { formatMoney, formatNumber } from '../../utils/format';

/**
 * Answers "what do we pay a <job title> in <country>?". Within one country
 * figures are in local currency; across countries they are converted to USD.
 */
export function RoleExplorer({ data }: { data: GroupedInsights | undefined }) {
  if (!data) return <Skeleton variant="rounded" height={320} />;

  if (data.groups.length === 0) {
    return <Typography color="text.secondary">No employees match these filters.</Typography>;
  }

  const money = (v: number | null) => formatMoney(v, data.currency);

  return (
    <TableContainer sx={{ maxHeight: 440 }}>
      <Table size="small" stickyHeader aria-label="Pay by job title">
        <TableHead>
          <TableRow>
            <TableCell>Job title</TableCell>
            <TableCell align="right">Employees</TableCell>
            <TableCell align="right">Median</TableCell>
            <TableCell align="right">Average</TableCell>
            <TableCell align="right">Middle 50%</TableCell>
            <TableCell align="right">Min – Max</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.groups.map((g) => (
            <TableRow key={g.name} hover>
              <TableCell component="th" scope="row">
                {g.name}
              </TableCell>
              <TableCell align="right">{formatNumber(g.headcount)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                {money(g.median)}
              </TableCell>
              <TableCell align="right">{money(g.average)}</TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                {money(g.p25)} – {money(g.p75)}
              </TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>
                {money(g.min)} – {money(g.max)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
