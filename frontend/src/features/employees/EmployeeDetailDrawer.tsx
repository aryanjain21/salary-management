import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/EditOutlined';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import type { EmployeeDetail, Meta } from '../../api/types';
import { ErrorState } from '../../components/ErrorState';
import { useEmployee } from '../../hooks/useEmployees';
import { employmentTypeLabel, formatDate, formatMoney } from '../../utils/format';
import { SalaryHistory } from './SalaryHistory';

interface EmployeeDetailDrawerProps {
  employeeId: number | null;
  meta: Meta | undefined;
  onClose: () => void;
  onEdit: (employee: EmployeeDetail) => void;
  onDelete: (employee: EmployeeDetail) => void;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  );
}

export function EmployeeDetailDrawer({
  employeeId,
  meta,
  onClose,
  onEdit,
  onDelete,
}: EmployeeDetailDrawerProps) {
  const query = useEmployee(employeeId);
  const employee = query.data;
  const countryName = meta?.countries.find((c) => c.code === employee?.country)?.name;

  return (
    <Drawer anchor="right" open={employeeId !== null} onClose={onClose}>
      <Box
        sx={{ width: { xs: '100vw', sm: 440 }, p: 3 }}
        role="region"
        aria-label="Employee details"
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton aria-label="Close details" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {query.isPending && employeeId !== null && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress aria-label="Loading employee" />
          </Box>
        )}
        {query.isError && (
          <ErrorState
            title="Could not load employee"
            error={query.error}
            onRetry={() => void query.refetch()}
          />
        )}

        {employee && (
          <Stack spacing={3}>
            <Box>
              <Typography variant="h5" component="h2">
                {employee.fullName}
              </Typography>
              <Typography color="text.secondary">
                {employee.jobTitle} · {employee.department}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Annual base salary
              </Typography>
              <Typography variant="h4" component="p">
                {formatMoney(employee.salary, employee.currency)}
              </Typography>
              {employee.currency !== 'USD' && (
                <Typography variant="body2" color="text.secondary">
                  ≈ {formatMoney(employee.salaryUsd, 'USD')} at reference rates
                  {meta ? ` (as of ${formatDate(meta.currency.ratesAsOf)})` : ''}
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Field label="Employee code" value={employee.employeeCode} />
              <Field label="Country" value={countryName ?? employee.country} />
              <Field label="Employment type" value={employmentTypeLabel(employee.employmentType)} />
              <Field label="Hire date" value={formatDate(employee.hireDate)} />
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Field label="Email" value={employee.email} />
              </Box>
            </Box>

            <Stack direction="row" spacing={1}>
              <Button variant="contained" startIcon={<EditIcon />} onClick={() => onEdit(employee)}>
                Edit
              </Button>
              <Button color="error" startIcon={<DeleteIcon />} onClick={() => onDelete(employee)}>
                Delete
              </Button>
            </Stack>

            <Divider />

            <Box>
              <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
                Salary history
              </Typography>
              <SalaryHistory changes={employee.salaryHistory} />
            </Box>
          </Stack>
        )}
      </Box>
    </Drawer>
  );
}
