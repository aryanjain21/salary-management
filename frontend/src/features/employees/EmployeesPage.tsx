import AddIcon from '@mui/icons-material/Add';
import { Button } from '@mui/material';
import { useState } from 'react';
import type { EmployeeDetail } from '../../api/types';
import { ErrorState } from '../../components/ErrorState';
import { PageHeader } from '../../components/PageHeader';
import { useNotify } from '../../components/notifications';
import { useEmployeeList } from '../../hooks/useEmployees';
import { useMeta } from '../../hooks/useInsights';
import { formatNumber } from '../../utils/format';
import { DeleteEmployeeDialog } from './DeleteEmployeeDialog';
import { EmployeeDetailDrawer } from './EmployeeDetailDrawer';
import { EmployeeFilters } from './EmployeeFilters';
import { EmployeeFormDialog } from './EmployeeFormDialog';
import { EmployeeTable } from './EmployeeTable';
import { useEmployeeSearchParams } from './useEmployeeSearchParams';

type FormState = { mode: 'create' } | { mode: 'edit'; employee: EmployeeDetail } | null;

export function EmployeesPage() {
  const { params, update, clearFilters, hasFilters, pageSizes, selectedId, selectEmployee } =
    useEmployeeSearchParams();
  const employees = useEmployeeList(params);
  const meta = useMeta();
  const notify = useNotify();

  const [form, setForm] = useState<FormState>(null);
  const [toDelete, setToDelete] = useState<EmployeeDetail | null>(null);

  const total = employees.data?.meta.total;
  // While new filters load, the previous page stays visible (keepPreviousData);
  // don't present its total as the count for the new filters.
  const subtitle =
    total === undefined || employees.isPlaceholderData
      ? 'Loading employees…'
      : `${formatNumber(total)} ${hasFilters ? 'matching ' : ''}employee${total === 1 ? '' : 's'}`;

  return (
    <>
      <PageHeader
        title="Employees"
        subtitle={subtitle}
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setForm({ mode: 'create' })}
          >
            Add employee
          </Button>
        }
      />
      <EmployeeFilters
        params={params}
        meta={meta.data}
        onChange={update}
        onClear={clearFilters}
        hasFilters={hasFilters}
      />
      {employees.isError ? (
        <ErrorState
          title="Could not load employees"
          error={employees.error}
          onRetry={() => void employees.refetch()}
        />
      ) : (
        <EmployeeTable
          rows={employees.data?.data ?? []}
          total={total ?? 0}
          loading={employees.isFetching}
          params={params}
          pageSizes={pageSizes}
          meta={meta.data}
          onParamsChange={update}
          onRowClick={(employee) => selectEmployee(employee.id)}
        />
      )}

      <EmployeeDetailDrawer
        employeeId={selectedId}
        meta={meta.data}
        onClose={() => selectEmployee(null)}
        onEdit={(employee) => setForm({ mode: 'edit', employee })}
        onDelete={setToDelete}
      />

      {form && (
        <EmployeeFormDialog
          employee={form.mode === 'edit' ? form.employee : undefined}
          meta={meta.data}
          onClose={() => setForm(null)}
          onSaved={(saved, mode) => {
            setForm(null);
            selectEmployee(saved.id);
            notify(mode === 'create' ? `${saved.fullName} added` : 'Changes saved');
          }}
        />
      )}

      {toDelete && (
        <DeleteEmployeeDialog
          employee={toDelete}
          onClose={() => setToDelete(null)}
          onDeleted={(deleted) => {
            setToDelete(null);
            selectEmployee(null);
            notify(`${deleted.fullName} deleted`);
          }}
        />
      )}
    </>
  );
}
