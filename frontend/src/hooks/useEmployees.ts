import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { employeesApi } from '../api/employees';
import { queryKeys } from '../api/queryKeys';
import type { EmployeeInput, EmployeeListParams, EmployeeUpdate } from '../api/types';

export function useEmployeeList(params: EmployeeListParams) {
  return useQuery({
    queryKey: queryKeys.employees.list(params),
    queryFn: () => employeesApi.list(params),
    // Keep showing the current page while the next one loads (no table flicker).
    placeholderData: keepPreviousData,
  });
}

export function useEmployee(id: number | null) {
  return useQuery({
    queryKey: queryKeys.employees.detail(id ?? 0),
    queryFn: () => employeesApi.get(id!),
    enabled: id !== null,
  });
}

/**
 * Any employee change can move pay statistics or add a new department or
 * title, so employee lists, insights and reference data are all refreshed.
 */
function useInvalidateAfterChange() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.insights.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.meta }),
    ]);
}

export function useCreateEmployee() {
  const invalidate = useInvalidateAfterChange();
  return useMutation({
    mutationFn: (input: EmployeeInput) => employeesApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateEmployee() {
  const invalidate = useInvalidateAfterChange();
  return useMutation({
    mutationFn: ({ id, changes }: { id: number; changes: EmployeeUpdate }) =>
      employeesApi.update(id, changes),
    onSuccess: invalidate,
  });
}

export function useDeleteEmployee() {
  const invalidate = useInvalidateAfterChange();
  return useMutation({
    mutationFn: (id: number) => employeesApi.remove(id),
    onSuccess: invalidate,
  });
}
