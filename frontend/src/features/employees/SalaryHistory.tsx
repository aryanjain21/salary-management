import { Box, Chip, List, ListItem, ListItemText, Typography } from '@mui/material';
import type { SalaryChange } from '../../api/types';
import { formatDate, formatMoney } from '../../utils/format';
import { salaryChangePercent } from './salaryChange';

export function SalaryHistory({ changes }: { changes: SalaryChange[] }) {
  if (changes.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No salary changes recorded yet.
      </Typography>
    );
  }

  return (
    <List dense disablePadding aria-label="Salary history">
      {changes.map((change) => {
        const percent = salaryChangePercent(change);
        return (
          <ListItem key={change.id} disableGutters divider>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <span>
                    {formatMoney(change.oldSalary, change.oldCurrency)} →{' '}
                    {formatMoney(change.newSalary, change.newCurrency)}
                  </span>
                  {percent !== null ? (
                    <Chip
                      size="small"
                      color={percent >= 0 ? 'success' : 'warning'}
                      label={`${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`}
                    />
                  ) : (
                    <Chip size="small" label="Currency change" />
                  )}
                </Box>
              }
              secondary={`${formatDate(change.changedAt)}${change.reason ? ` · ${change.reason}` : ''}`}
            />
          </ListItem>
        );
      })}
    </List>
  );
}
