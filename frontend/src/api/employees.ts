import { cleanParams, http } from './client';
import type {
  Employee,
  EmployeeDetail,
  EmployeeInput,
  EmployeeListParams,
  EmployeeUpdate,
  Paginated,
} from './types';

export const employeesApi = {
  list: async (params: EmployeeListParams) =>
    (await http.get<Paginated<Employee>>('/employees', { params: cleanParams(params) })).data,

  get: async (id: number) => (await http.get<EmployeeDetail>(`/employees/${id}`)).data,

  create: async (input: EmployeeInput) =>
    (await http.post<EmployeeDetail>('/employees', input)).data,

  update: async (id: number, changes: EmployeeUpdate) =>
    (await http.patch<EmployeeDetail>(`/employees/${id}`, changes)).data,

  remove: async (id: number) => {
    await http.delete(`/employees/${id}`);
  },
};
