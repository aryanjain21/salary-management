import { Box, Chip, Typography } from '@mui/material';
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridSortModel,
} from '@mui/x-data-grid';
import { useMemo } from 'react';
import type { Employee, EmployeeListParams, Meta, SortField } from '../../api/types';
import { employmentTypeLabel, formatDate, formatMoney } from '../../utils/format';

interface EmployeeTableProps {
  rows: Employee[];
  total: number;
  loading: boolean;
  params: EmployeeListParams;
  pageSizes: number[];
  meta: Meta | undefined;
  onParamsChange: (changes: Partial<EmployeeListParams>) => void;
  onRowClick: (employee: Employee) => void;
}

/** Grid columns that sort by a different API field. */
const SORT_FIELD_FOR_COLUMN: Record<string, SortField> = { fullName: 'lastName' };
const COLUMN_FOR_SORT_FIELD: Partial<Record<SortField, string>> = { lastName: 'fullName' };

export function EmployeeTable({
  rows,
  total,
  loading,
  params,
  pageSizes,
  meta,
  onParamsChange,
  onRowClick,
}: EmployeeTableProps) {
  const countryNames = useMemo(
    () => new Map(meta?.countries.map((c) => [c.code, c.name]) ?? []),
    [meta],
  );

  // Salaries in different currencies can't be ranked against each other, so
  // salary sorting is only offered once the list is narrowed to one country.
  const canSortBySalary = Boolean(params.country);

  const columns = useMemo<GridColDef<Employee>[]>(
    () => [
      { field: 'employeeCode', headerName: 'Code', width: 110 },
      {
        field: 'fullName',
        headerName: 'Name',
        flex: 1.2,
        minWidth: 180,
        renderCell: ({ row }) => (
          <Box sx={{ lineHeight: 1.3, py: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {row.fullName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.email}
            </Typography>
          </Box>
        ),
      },
      { field: 'jobTitle', headerName: 'Job title', flex: 1, minWidth: 170 },
      { field: 'department', headerName: 'Department', flex: 0.8, minWidth: 140 },
      {
        field: 'country',
        headerName: 'Country',
        width: 150,
        valueFormatter: (value: string) => countryNames.get(value) ?? value,
      },
      {
        field: 'salary',
        headerName: 'Salary (local)',
        width: 165,
        align: 'right',
        headerAlign: 'right',
        sortable: canSortBySalary,
        description: canSortBySalary
          ? 'Annual base salary in local currency'
          : 'Filter by a country to sort by salary',
        renderCell: ({ row }) => formatMoney(row.salary, row.currency),
      },
      {
        field: 'salaryUsd',
        headerName: 'Salary (USD ref.)',
        width: 150,
        align: 'right',
        headerAlign: 'right',
        sortable: false,
        description: `Converted at reference rates as of ${meta?.currency.ratesAsOf ?? '—'}`,
        renderCell: ({ row }) => (
          <Typography variant="body2" color="text.secondary">
            {formatMoney(row.salaryUsd, 'USD')}
          </Typography>
        ),
      },
      {
        field: 'employmentType',
        headerName: 'Type',
        width: 110,
        sortable: false,
        renderCell: ({ row }) => (
          <Chip size="small" variant="outlined" label={employmentTypeLabel(row.employmentType)} />
        ),
      },
      {
        field: 'hireDate',
        headerName: 'Hired',
        width: 120,
        valueFormatter: (value: string) => formatDate(value),
      },
    ],
    [canSortBySalary, countryNames, meta],
  );

  // These must keep a stable identity between renders. DataGrid treats a new
  // sortModel reference as a sort change and jumps back to the first page,
  // which silently undid every "next page" click.
  const { sortBy, sortOrder, page, pageSize } = params;
  const sortModel = useMemo<GridSortModel>(
    () =>
      sortBy ? [{ field: COLUMN_FOR_SORT_FIELD[sortBy] ?? sortBy, sort: sortOrder ?? 'asc' }] : [],
    [sortBy, sortOrder],
  );
  const paginationModel = useMemo<GridPaginationModel>(
    () => ({ page: page - 1, pageSize }),
    [page, pageSize],
  );

  const handleSortModelChange = (model: GridSortModel) => {
    const item = model[0];
    onParamsChange(
      item?.sort
        ? {
            sortBy: SORT_FIELD_FOR_COLUMN[item.field] ?? (item.field as SortField),
            sortOrder: item.sort,
          }
        : { sortBy: undefined, sortOrder: undefined },
    );
  };

  const handlePaginationModelChange = (model: GridPaginationModel) => {
    if (model.pageSize !== params.pageSize) {
      onParamsChange({ pageSize: model.pageSize, page: 1 });
    } else {
      onParamsChange({ page: model.page + 1 });
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 300px)', minHeight: 480, bgcolor: 'background.paper' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        rowCount={total}
        loading={loading}
        paginationMode="server"
        sortingMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={handlePaginationModelChange}
        pageSizeOptions={pageSizes}
        sortModel={sortModel}
        onSortModelChange={handleSortModelChange}
        disableColumnFilter
        disableRowSelectionOnClick
        getRowHeight={() => 'auto'}
        onRowClick={({ row }) => onRowClick(row)}
        sx={{
          '& .MuiDataGrid-row': { cursor: 'pointer' },
          // Auto-height rows: keep single-line cells aligned with the two-line name cell.
          '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' },
        }}
        localeText={{ noRowsLabel: 'No employees match these filters' }}
      />
    </Box>
  );
}
