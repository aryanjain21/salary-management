import { PageHeader } from '../../components/PageHeader';
import { ErrorState } from '../../components/ErrorState';
import { useEmployeeList } from '../../hooks/useEmployees';
import { useMeta } from '../../hooks/useInsights';
import { formatNumber } from '../../utils/format';
import { EmployeeFilters } from './EmployeeFilters';
import { EmployeeTable } from './EmployeeTable';
import { useEmployeeSearchParams } from './useEmployeeSearchParams';

export function EmployeesPage() {
  const { params, update, clearFilters, hasFilters, pageSizes } = useEmployeeSearchParams();
  const employees = useEmployeeList(params);
  const meta = useMeta();

  const total = employees.data?.meta.total;
  const subtitle =
    total === undefined
      ? 'Search and manage employee salary records'
      : `${formatNumber(total)} ${hasFilters ? 'matching ' : ''}employee${total === 1 ? '' : 's'}`;

  return (
    <>
      <PageHeader title="Employees" subtitle={subtitle} />
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
          onRowClick={() => undefined}
        />
      )}
    </>
  );
}
